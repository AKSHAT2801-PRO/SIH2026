"""Ingestion layer: official portal first, official snapshot as the fallback.

Raw data is written to an immutable, run-scoped partition under ``data/raw`` and
is never modified afterwards (critical rules 7, 25). Every partition carries a
manifest recording the source, the retrieval time, the row and field counts, the
date range, the geographic coverage, the schema and a SHA-256 content hash so
that a later result can always be traced back to the exact bytes it came from.
"""
from __future__ import annotations

import json
import shutil
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import pandas as pd

from common.config import ROOT, get_config
from common.logging_utils import RunContext, get_logger, utcnow
from common.normalize import file_hash
from data_engineering.ingestion.datasets import (
    NATIONAL_SUMMARY,
    TABULAR_DATASETS,
    DatasetSpec,
)
from data_engineering.ingestion.mospi_client import MoSPIClient

log = get_logger("ingestion.ingest")

SNAPSHOT_ROOT = ROOT / "data" / "source_snapshots"


@dataclass
class DatasetManifest:
    dataset: str
    source_mode: str            # "live_api" | "official_snapshot"
    source_url: str
    retrieved_at: str
    file: str
    content_sha256: str
    record_count: int
    field_count: int
    fields: list[str]
    dtypes: dict[str, str]
    date_range: dict[str, str | None]
    geographic_coverage: dict[str, Any]
    dataset_version: str
    schema_changed_from_previous: bool
    status: str
    errors: list[str]


def _latest_snapshot_dir() -> Path | None:
    if not SNAPSHOT_ROOT.exists():
        return None
    dirs = sorted([p for p in SNAPSHOT_ROOT.iterdir() if p.is_dir()])
    return dirs[-1] if dirs else None


def _find_snapshot_file(snapshot_dir: Path, spec: DatasetSpec) -> Path | None:
    for p in sorted(snapshot_dir.iterdir()):
        if spec.file_match in p.name:
            return p
    return None


def _previous_schema(dataset: str) -> list[str] | None:
    raw_root = ROOT / "data" / "raw"
    if not raw_root.exists():
        return None
    for part in sorted([p for p in raw_root.iterdir() if p.is_dir()], reverse=True):
        manifest = part / "manifest.json"
        if manifest.exists():
            data = json.loads(manifest.read_text())
            for ds in data.get("datasets", []):
                if ds["dataset"] == dataset:
                    return ds["fields"]
    return None


def _profile(df: pd.DataFrame, spec: DatasetSpec) -> tuple[dict[str, str | None], dict[str, Any]]:
    date_range: dict[str, str | None] = {}
    for col in spec.date_columns:
        header = next((h for h, c in spec.columns.items() if c == col), None)
        if header and header in df.columns:
            parsed = pd.to_datetime(df[header], errors="coerce", utc=True, format="mixed")
            date_range[col] = None if parsed.isna().all() else f"{parsed.min().date()} .. {parsed.max().date()}"
    coverage: dict[str, Any] = {}
    for header, label in (("State", "states"), ("Constituency", "constituencies"), ("IDA", "implementing_agencies")):
        if header in df.columns:
            coverage[label] = int(df[header].nunique())
    return date_range, coverage


def run_ingestion(ctx: RunContext, prefer_live: bool = True) -> dict[str, Any]:
    """Execute one ingestion cycle and return the cycle manifest."""
    cfg = get_config()
    raw_dir = ROOT / "data" / "raw" / ctx.run_id
    raw_dir.mkdir(parents=True, exist_ok=True)

    discovery = None
    if prefer_live:
        log.info("Probing the official MoSPI MPLADS portal for live service endpoints ...")
        discovery = MoSPIClient(cfg).discover()
        log.info("Portal reachable=%s blocker=%s", discovery.reachable, discovery.blocker)
        ctx.event("ingestion", "portal_discovery", **discovery.to_dict())

    snapshot_dir = _latest_snapshot_dir()
    manifests: list[DatasetManifest] = []

    for spec in TABULAR_DATASETS:
        errors: list[str] = []
        source_mode = "official_snapshot"
        source_url = cfg["source.official_portal"]
        frame: pd.DataFrame | None = None

        if discovery is not None and discovery.reachable and spec.live_resource in discovery.working_endpoints:
            rows = MoSPIClient(cfg).fetch_records(spec.live_resource)
            if rows:
                frame = pd.DataFrame(rows)
                source_mode = "live_api"
                source_url = cfg["source.api.base_url"] + spec.live_resource
            else:
                errors.append("live endpoint advertised but returned no rows; used official snapshot")

        if frame is None:
            if snapshot_dir is None:
                raise FileNotFoundError(
                    "The official portal is unreachable and no official snapshot is present in "
                    "data/source_snapshots. The pipeline stops here rather than fabricating data."
                )
            src = _find_snapshot_file(snapshot_dir, spec)
            if src is None:
                errors.append(f"dataset '{spec.name}' missing from snapshot {snapshot_dir.name}")
                log.error(errors[-1])
                continue
            frame = pd.read_csv(src, dtype=str, keep_default_na=False, na_values=[""])
            source_url = (
                f"{cfg['source.official_portal']} (official export captured {snapshot_dir.name}, "
                f"file {src.name})"
            )

        target = raw_dir / f"{spec.name}.csv"
        frame.to_csv(target, index=False)

        date_range, coverage = _profile(frame, spec)
        previous = _previous_schema(spec.name)
        fields = list(frame.columns)
        schema_changed = previous is not None and previous != fields
        if schema_changed:
            errors.append(f"schema change detected vs previous cycle: {set(previous) ^ set(fields)}")

        manifest = DatasetManifest(
            dataset=spec.name,
            source_mode=source_mode,
            source_url=source_url,
            retrieved_at=utcnow(),
            file=str(target.relative_to(ROOT)),
            content_sha256=file_hash(target),
            record_count=int(len(frame)),
            field_count=len(fields),
            fields=fields,
            dtypes={c: str(frame[c].dtype) for c in fields},
            date_range=date_range,
            geographic_coverage=coverage,
            dataset_version=(snapshot_dir.name if source_mode == "official_snapshot" else utcnow()[:10]),
            schema_changed_from_previous=bool(schema_changed),
            status="SUCCESS" if not errors else "SUCCESS_WITH_WARNINGS",
            errors=errors,
        )
        manifests.append(manifest)
        ctx.event("ingestion", "dataset_ingested", **asdict(manifest))
        log.info("Ingested %-20s %7d records, %2d fields  [%s]",
                 spec.name, manifest.record_count, manifest.field_count, manifest.source_mode)

    # National control totals published by the portal, kept for reconciliation.
    control: dict[str, Any] | None = None
    if discovery is not None and discovery.reachable:
        control = MoSPIClient(cfg).fetch_summary()
    if control is None and snapshot_dir is not None:
        ctrl_file = _find_snapshot_file(snapshot_dir, NATIONAL_SUMMARY)
        if ctrl_file is not None:
            payload = json.loads(ctrl_file.read_text())
            control = payload.get("data", payload)
            shutil.copy(ctrl_file, raw_dir / "national_summary.json")

    cycle = {
        "run_id": ctx.run_id,
        "started_at": ctx.started_at,
        "completed_at": utcnow(),
        "official_portal": cfg["source.official_portal"],
        "portal_discovery": discovery.to_dict() if discovery else None,
        "snapshot_used": snapshot_dir.name if snapshot_dir else None,
        "datasets": [asdict(m) for m in manifests],
        "national_control_totals": control,
    }
    (raw_dir / "manifest.json").write_text(json.dumps(cycle, indent=2, default=str))
    log.info("Raw partition written to %s", raw_dir)
    return cycle


def load_raw(run_id: str, dataset: str) -> pd.DataFrame:
    path = ROOT / "data" / "raw" / run_id / f"{dataset}.csv"
    return pd.read_csv(path, dtype=str, keep_default_na=False, na_values=[""])
