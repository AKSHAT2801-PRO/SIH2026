"""Scoring pack — the reference state a single new record needs to be scored.

A risk score is only meaningful *relative to comparable official records*. To
score one incoming work the platform therefore needs the same reference material
the batch run used: peer medians and MADs, district concentration, MP context,
the typical age of completed works, and the fitted Isolation Forest.

The pipeline freezes all of that into one versioned artifact at the end of every
run, so the live API scores against exactly the population that produced the
current register — and says which run that was.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from common.config import ROOT, get_config
from common.logging_utils import get_logger, utcnow
from common.normalize import normalize_person, normalize_state, surrogate_key

log = get_logger("risk.scoring_pack")

PACK_VERSION = "1.0.0"
PACK_PATH = ROOT / "outputs" / "models" / "scoring_pack.joblib"

MP_CONTEXT_FIELDS = [
    "mp_name", "constituency", "state", "house", "allocated_amount", "utilization_pct",
    "completion_rate_pct", "mp_top_vendor_share", "mp_vendor_hhi", "mp_repeat_payment_share",
    "mp_unspent_pct", "mp_pending_payment_share", "mp_published_vs_derived_gap_pct",
]


@dataclass
class PeerStat:
    median: float
    mad: float
    p90: float
    count: int
    thin: bool


@dataclass
class ScoringPack:
    run_id: str
    built_at: str
    pack_version: str
    risk_engine_version: str
    feature_version: str
    model_version: str
    snapshot_date: str
    state_category: dict[str, PeerStat]
    district: dict[str, PeerStat]
    category: dict[str, PeerStat]
    national: PeerStat
    district_vendor_hhi: dict[str, float]
    district_work_count: dict[str, float]
    mp_context: dict[str, dict[str, Any]]
    mp_name_index: dict[str, list[str]]
    completed_median_age_days: float
    known_categories: list[str]
    known_states: list[str]
    isolation_forest: dict | None = None
    propensity_model: Any = None
    propensity_columns: dict[str, list[str]] = field(default_factory=dict)

    # ---------------------------------------------------------------- lookups
    def peer(self, table: str, key: str) -> PeerStat:
        """Peer statistics for a key, falling back to the national distribution."""
        stats = getattr(self, table)
        found = stats.get(key)
        if found is None:
            return PeerStat(self.national.median, self.national.mad, self.national.p90,
                            0, True)
        return found

    def resolve_mp(self, mp_key: str | None, mp_name: str | None, state: str | None,
                   house: str | None) -> tuple[str | None, dict | None, str]:
        """Resolve an MP to the conformed key. Returns (key, context, how)."""
        if mp_key and mp_key in self.mp_context:
            return mp_key, self.mp_context[mp_key], "mp_key"
        if mp_name and state and house:
            candidate = surrogate_key(normalize_person(mp_name), normalize_state(state), house)
            if candidate in self.mp_context:
                return candidate, self.mp_context[candidate], "name+state+house"
        if mp_name:
            matches = self.mp_name_index.get(normalize_person(mp_name), [])
            if state:
                wanted = normalize_state(state)
                narrowed = [k for k in matches if self.mp_context[k].get("state") == wanted]
                matches = narrowed or matches
            if len(matches) == 1:
                return matches[0], self.mp_context[matches[0]], "name match"
            if len(matches) > 1:
                return None, None, f"ambiguous: {len(matches)} MPs share this name"
        return None, None, "not found in the reference run"


def _peer_stats(values: pd.Series, groups: pd.Series | None, min_n: int,
                national: PeerStat) -> dict[str, PeerStat]:
    """Median / MAD / p90 per group, with the batch pipeline's thin-group rule."""
    out: dict[str, PeerStat] = {}
    if groups is None:
        return out
    frame = pd.DataFrame({"v": pd.to_numeric(values, errors="coerce"), "g": groups}).dropna()
    for key, sub in frame.groupby("g"):
        v = sub["v"]
        med = float(v.median())
        mad = float((v - med).abs().median())
        thin = len(v) < min_n
        out[str(key)] = PeerStat(
            median=national.median if thin else med,
            mad=(national.mad if thin else (mad if mad > 0 else national.mad)) or 1.0,
            p90=float(national.p90 if thin else v.quantile(0.90)),
            count=int(len(v)),
            thin=bool(thin),
        )
    return out


def build_scoring_pack(run_id: str, works: pd.DataFrame, expenditures: pd.DataFrame,
                       mp_features: pd.DataFrame, snapshot_ts: pd.Timestamp,
                       iforest_artifact: dict | None = None,
                       propensity_model: Any = None,
                       propensity_columns: dict[str, list[str]] | None = None) -> ScoringPack:
    cfg = get_config()
    min_n = cfg["analysis.min_group_size"]
    amounts = pd.to_numeric(works["amount"], errors="coerce")
    med = float(amounts.median())
    mad = float((amounts - med).abs().median()) or 1.0
    national = PeerStat(med, mad, float(amounts.quantile(0.90)), int(amounts.notna().sum()), False)

    state_category = _peer_stats(
        amounts, works["state"].astype(str) + "||" + works["category"].astype(str), min_n, national)
    district = _peer_stats(amounts, works["ida_district"].astype(str), min_n, national)
    category = _peer_stats(amounts, works["category"].astype(str), min_n, national)

    from data_analysis.statistics.descriptive import hhi
    district_hhi = (expenditures.groupby("ida_district")
                    .apply(lambda g: hhi(g.groupby("vendor_norm")["amount"].sum()),
                           include_groups=False)
                    .to_dict())
    district_counts = works.groupby("ida_district")["work_uid"].size().astype(float).to_dict()

    ctx = mp_features.set_index("mp_key")
    mp_context: dict[str, dict[str, Any]] = {}
    for key, row in ctx.iterrows():
        record = {f: (None if pd.isna(row.get(f)) else row.get(f)) for f in MP_CONTEXT_FIELDS if f in ctx.columns}
        record["state"] = normalize_state(record.get("state"))
        mp_context[str(key)] = record

    name_index: dict[str, list[str]] = {}
    for key, record in mp_context.items():
        name_index.setdefault(normalize_person(record.get("mp_name")), []).append(key)

    completed_age = works.loc[works["work_stage"] == "COMPLETED", "age_days"]
    pack = ScoringPack(
        run_id=run_id,
        built_at=utcnow(),
        pack_version=PACK_VERSION,
        risk_engine_version=cfg["project.risk_engine_version"],
        feature_version=cfg["project.feature_version"],
        model_version=cfg["project.model_version"],
        snapshot_date=str(pd.Timestamp(snapshot_ts).date()),
        state_category=state_category,
        district=district,
        category=category,
        national=national,
        district_vendor_hhi={str(k): float(v) for k, v in district_hhi.items()},
        district_work_count={str(k): float(v) for k, v in district_counts.items()},
        mp_context=mp_context,
        mp_name_index=name_index,
        completed_median_age_days=float(completed_age.median()) if completed_age.notna().any() else 365.0,
        known_categories=sorted({str(c) for c in works["category"].dropna().unique()}),
        known_states=sorted({str(s) for s in works["state"].dropna().unique()}),
        isolation_forest=iforest_artifact,
        propensity_model=propensity_model,
        propensity_columns=propensity_columns or {},
    )
    save_scoring_pack(pack)
    log.info("Scoring pack built: %d peer cells, %d districts, %d MPs (run %s)",
             len(state_category), len(district_hhi), len(mp_context), run_id)
    return pack


def save_scoring_pack(pack: ScoringPack, path: Path | None = None) -> Path:
    target = path or PACK_PATH
    target.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(pack, target, compress=3)
    return target


def load_scoring_pack(path: Path | None = None) -> ScoringPack:
    target = path or PACK_PATH
    if not target.exists():
        raise FileNotFoundError(
            f"No scoring pack at {target}. Run scripts/run_pipeline.py first — live scoring "
            "compares a record against the population from a completed run, and refuses to "
            "invent a baseline.")
    return joblib.load(target)
