"""Stage 1 — ingestion → validation → cleaning → transformation → integration →
warehouse load → data-quality report.

The stage returns the in-memory analytical frames so later stages (EDA, feature
engineering, anomaly detection, risk) can run in the same process, and writes
them to ``data/cleaned`` and ``data/analytical`` so they can also be re-used
independently. Raw data is never modified.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

from backend.database.session import bulk_load, create_all
from common.config import ROOT, get_config
from common.logging_utils import RunContext, get_logger
from data_engineering.cleaning.cleaner import clean_dataset
from data_engineering.ingestion.datasets import TABULAR_DATASETS, REGISTRY
from data_engineering.ingestion.ingest import load_raw, run_ingestion
from data_engineering.integration.integrate import build_geography, build_mp_dimension, linkage_report
from data_engineering.quality_checks.quality_report import build_quality_report
from data_engineering.transformation.transform import build_expenditure_level, build_work_level
from data_engineering.validation.validators import canonicalise, validate_dataset

log = get_logger("pipeline.stage1")


def _control_totals_check(cycle: dict, works: pd.DataFrame, expenditures: pd.DataFrame,
                          mp_dim: pd.DataFrame) -> dict:
    """Reconcile our computed totals against the portal's own published totals.

    This is the platform's independent proof that the pipeline did not lose or
    invent records between the official source and the dashboard.
    """
    portal = cycle.get("national_control_totals") or {}
    if not portal:
        return {"available": False, "reconciliation_score_pct": 100.0, "checks": []}

    allocated = float(pd.to_numeric(mp_dim["allocated_amount"], errors="coerce").sum())
    published_exp = float(pd.to_numeric(mp_dim["total_expenditure"], errors="coerce").sum())
    n_rec = float((works["work_stage"] == "RECOMMENDED").sum())
    n_com = float((works["work_stage"] == "COMPLETED").sum())
    completed_value = float(works.loc[works["work_stage"] == "COMPLETED", "amount"].sum())

    # Reverse-engineered portal definitions, verified to the paisa against the
    # portal's own published summary (see docs/DATA_DISCOVERY.md):
    #   inProgressPayments = totalExpenditure - completedWorksValue
    #   paymentGap (%)     = 100 * (1 - completedWorksValue / totalExpenditure)
    computed = {
        "totalMPs": float(mp_dim["mp_key"].nunique()),
        "totalWorksRecommended": n_rec,
        "totalWorksCompleted": n_com,
        "pendingWorks": n_rec - n_com,
        "totalTransactions": float(len(expenditures)),
        "totalAllocated": allocated,
        "totalExpenditure": published_exp,
        "completedWorksValue": completed_value,
        "inProgressPayments": published_exp - completed_value,
        "utilizationPercentage": 100 * published_exp / allocated if allocated else 0.0,
        "completionRate": 100 * n_com / n_rec if n_rec else 0.0,
        "avgAllocation": allocated / max(mp_dim["mp_key"].nunique(), 1),
        "paymentGap": 100 * (1 - completed_value / published_exp) if published_exp else 0.0,
    }
    checks = []
    for metric, value in computed.items():
        if metric not in portal:
            continue
        p = float(portal[metric])
        diff_pct = 0.0 if p == 0 else 100 * (value - p) / p
        checks.append({"metric": metric, "portal": p, "computed": value,
                       "diff_pct": round(diff_pct, 6),
                       "match": bool(abs(diff_pct) < 0.5)})
    score = 100.0 * sum(c["match"] for c in checks) / max(len(checks), 1)
    return {"available": True, "reconciliation_score_pct": round(score, 2), "checks": checks,
            "portal_totals": portal}


def run(ctx: RunContext, prefer_live: bool = True) -> dict:
    cfg = get_config()
    cleaned_dir = ROOT / "data" / "cleaned"
    analytical_dir = ROOT / "data" / "analytical"
    cleaned_dir.mkdir(parents=True, exist_ok=True)
    analytical_dir.mkdir(parents=True, exist_ok=True)

    # ---------------------------------------------------------------- ingest
    cycle = run_ingestion(ctx, prefer_live=prefer_live)

    validations, cleanings, frames = {}, {}, {}
    all_issues = []

    for spec in TABULAR_DATASETS:
        raw = load_raw(ctx.run_id, spec.name)
        canonical = canonicalise(raw, spec)
        validated, vres = validate_dataset(canonical, spec)
        ctx.event("validation", "dataset_validated", dataset=spec.name,
                  records_in=vres.records_in, valid=vres.records_valid,
                  quarantined=vres.records_quarantined)

        # Quarantine is preserved on disk, never dropped from the record.
        quarantine = validated[validated["is_quarantined"]]
        if len(quarantine):
            qdir = ROOT / "data" / "quarantine" / ctx.run_id
            qdir.mkdir(parents=True, exist_ok=True)
            quarantine.to_csv(qdir / f"{spec.name}_quarantined.csv", index=False)

        cleanable = validated[~validated["is_quarantined"]].copy()
        cleaned, cres = clean_dataset(cleanable, spec)
        ctx.event("cleaning", "dataset_cleaned", dataset=spec.name, rows=len(cleaned),
                  standardisation=cres.standardisation_counts)

        cleaned.to_parquet(cleaned_dir / f"{spec.name}.parquet", index=False)
        validations[spec.name] = vres
        cleanings[spec.name] = cres
        frames[spec.name] = cleaned
        if len(vres.issues):
            all_issues.append(vres.issues)

    # ------------------------------------------------------------- transform
    snapshot_ts = pd.Timestamp(max(
        frames["expenditures"]["expenditure_date"].max(),
        frames["recommended_works"]["recommendation_date"].max(),
        frames["completed_works"]["completed_date"].max(),
    ))
    log.info("Snapshot reference date: %s", snapshot_ts.date())

    works = build_work_level(frames["recommended_works"], frames["completed_works"], snapshot_ts)
    expenditures = build_expenditure_level(frames["expenditures"], snapshot_ts)
    ctx.event("transformation", "analytical_frames_built",
              works=len(works), expenditures=len(expenditures))

    # ------------------------------------------------------------- integrate
    linkage = linkage_report(frames["recommended_works"], frames["completed_works"],
                             frames["expenditures"], frames["mp_summary"])
    mp_dim = build_mp_dimension(frames["mp_summary"], works, expenditures)
    geo = build_geography(works, expenditures)
    ctx.event("integration", "entities_conformed", mps=len(mp_dim), districts=len(geo), **{
        k: v for k, v in linkage.items() if isinstance(v, (int, float))})

    control = _control_totals_check(cycle, works, expenditures, mp_dim)

    works.to_parquet(analytical_dir / "works.parquet", index=False)
    expenditures.to_parquet(analytical_dir / "expenditures.parquet", index=False)
    mp_dim.to_parquet(analytical_dir / "mp_dimension.parquet", index=False)
    geo.to_parquet(analytical_dir / "geo_district.parquet", index=False)

    # ------------------------------------------------------------- warehouse
    create_all()
    for col in ("run_id",):
        for frame in (works, expenditures, mp_dim, geo):
            frame[col] = ctx.run_id

    bulk_load(mp_dim, "dim_mp")
    bulk_load(works[works["work_stage"] == "RECOMMENDED"], "fact_recommended_work")
    bulk_load(works[works["work_stage"] == "COMPLETED"], "fact_completed_work")
    bulk_load(expenditures, "fact_expenditure")
    bulk_load(geo, "geo_district")

    manifest_rows = pd.DataFrame([{
        "run_id": ctx.run_id, "dataset": d["dataset"], "source_mode": d["source_mode"],
        "source_url": d["source_url"], "retrieved_at": d["retrieved_at"],
        "content_sha256": d["content_sha256"], "record_count": d["record_count"],
        "field_count": d["field_count"], "dataset_version": d["dataset_version"],
        "schema_changed": d["schema_changed_from_previous"], "status": d["status"],
        "errors": json.dumps(d["errors"]),
    } for d in cycle["datasets"]])
    bulk_load(manifest_rows, "ingestion_manifest")

    if all_issues:
        issues = pd.concat(all_issues, ignore_index=True)
        summary = (issues.groupby(["dataset", "rule", "severity", "detail"]).size()
                   .reset_index(name="record_count"))
        summary["run_id"] = ctx.run_id
        bulk_load(summary, "validation_issue")

    # -------------------------------------------------------- quality report
    quality = build_quality_report(ctx.run_id, cycle, validations, cleanings, linkage, control)
    dq_rows = []
    for d in quality["datasets"]:
        for metric in ("records_received", "records_valid", "records_quarantined",
                       "validity_rate_pct", "full_duplicate_rows", "missing_cell_pct"):
            dq_rows.append({"run_id": ctx.run_id, "dataset": d["dataset"],
                            "metric": metric, "value": float(d[metric]), "detail": None})
    for metric, value in quality["scores"].items():
        dq_rows.append({"run_id": ctx.run_id, "dataset": "ALL", "metric": metric,
                        "value": float(value), "detail": None})
    bulk_load(pd.DataFrame(dq_rows), "data_quality_metric")

    return {
        "cycle": cycle,
        "frames": frames,
        "works": works,
        "expenditures": expenditures,
        "mp_dim": mp_dim,
        "geo": geo,
        "linkage": linkage,
        "control": control,
        "quality": quality,
        "snapshot_ts": snapshot_ts,
    }
