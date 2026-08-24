"""Transformation layer — reproducible derivations only.

Every derived column here is a deterministic function of cleaned source columns.
Nothing in this module reads model output, so it can never leak a target into a
feature (critical rule 33).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from common.config import get_config
from common.logging_utils import get_logger

log = get_logger("transformation.transform")

# Documented, reproducible derivations. Key = output column, value = description.
DERIVATIONS: dict[str, str] = {
    "amount_lakh": "Amount restated in lakh (÷100,000) for government reporting units.",
    "fy": "Indian financial year of the record date (April–March), e.g. 2025-26.",
    "quarter": "Calendar quarter of the record date.",
    "month": "Month start of the record date.",
    "days_since": "Days between the record date and the snapshot date.",
    "is_round_amount": "True when the amount is an exact multiple of a configured round modulus.",
    "amount_last_digits_zero": "Count of trailing zeros in the integer amount.",
}


def indian_fy(ts: pd.Series) -> pd.Series:
    year = ts.dt.year
    fy_start = np.where(ts.dt.month >= 4, year, year - 1)
    return pd.Series([f"{y}-{str((y + 1) % 100).zfill(2)}" if pd.notna(y) else None for y in fy_start],
                     index=ts.index, dtype="object")


def add_time_features(df: pd.DataFrame, date_col: str, snapshot_ts: pd.Timestamp) -> pd.DataFrame:
    out = df.copy()
    ts = out[date_col]
    out["fy"] = indian_fy(ts)
    out["quarter"] = ts.dt.to_period("Q").astype("string")
    out["month"] = ts.dt.to_period("M").dt.to_timestamp()
    out["days_since"] = (snapshot_ts - ts).dt.days
    return out


def add_amount_features(df: pd.DataFrame, amount_col: str) -> pd.DataFrame:
    cfg = get_config()
    out = df.copy()
    amt = pd.to_numeric(out[amount_col], errors="coerce")
    out["amount_lakh"] = (amt / 100_000).round(4)
    moduli = cfg["anomaly_detection.round_number.moduli"]
    round_flags = [amt.mod(m).eq(0) & amt.gt(0) for m in moduli]
    out["is_round_amount"] = np.logical_or.reduce([f.fillna(False).to_numpy() for f in round_flags])

    def trailing_zeros(x: float) -> int:
        if pd.isna(x) or x <= 0:
            return 0
        i = int(round(x))
        if i == 0:
            return 0
        z = 0
        while i % 10 == 0:
            z += 1
            i //= 10
        return z

    out["amount_last_digits_zero"] = amt.map(trailing_zeros)
    return out


def peer_statistics(df: pd.DataFrame, amount_col: str, by: list[str], prefix: str) -> pd.DataFrame:
    """Robust peer-group statistics, with a fallback for thin groups.

    Groups smaller than ``analysis.min_group_size`` are statistically unreliable,
    so their comparison baseline falls back to the national distribution and the
    record is marked ``{prefix}_group_thin`` — the risk engine down-weights it.
    """
    cfg = get_config()
    min_n = cfg["analysis.min_group_size"]
    out = df.copy()
    amt = pd.to_numeric(out[amount_col], errors="coerce")

    grp = amt.groupby([out[c] for c in by])
    med = grp.transform("median")
    cnt = grp.transform("count")
    mad = grp.transform(lambda s: (s - s.median()).abs().median())
    p90 = grp.transform(lambda s: s.quantile(0.90))

    nat_med = amt.median()
    nat_mad = (amt - nat_med).abs().median()
    nat_p90 = amt.quantile(0.90)

    thin = cnt < min_n
    med_eff = med.where(~thin, nat_med)
    mad_eff = mad.where(~thin, nat_mad).replace(0, np.nan).fillna(nat_mad if nat_mad else 1.0)
    p90_eff = p90.where(~thin, nat_p90)

    out[f"{prefix}_peer_median"] = med_eff
    out[f"{prefix}_peer_count"] = cnt
    out[f"{prefix}_group_thin"] = thin
    out[f"{prefix}_ratio_to_peer"] = amt / med_eff.replace(0, np.nan)
    out[f"{prefix}_robust_z"] = 0.6745 * (amt - med_eff) / mad_eff
    out[f"{prefix}_above_p90"] = amt > p90_eff
    return out


def build_work_level(recommended: pd.DataFrame, completed: pd.DataFrame,
                     snapshot_ts: pd.Timestamp) -> pd.DataFrame:
    """One row per work, from both work datasets, with lifecycle status.

    The two official exports share only a handful of work ids, so a work is
    either 'recommended (open)' or 'completed'; a genuine recommended→completed
    lifecycle join is *not* supported by the source and is not simulated.
    """
    rec = recommended.copy()
    rec["work_stage"] = "RECOMMENDED"
    rec = rec.rename(columns={"recommended_amount": "amount", "recommendation_date": "event_date"})
    com = completed.copy()
    com["work_stage"] = "COMPLETED"
    com = com.rename(columns={"final_amount": "amount", "completed_date": "event_date"})

    shared = ["work_id", "work_description", "description_norm", "category", "mp_name", "mp_name_norm",
              "mp_key", "constituency", "state", "house", "amount", "event_date", "has_images",
              "ida", "ida_district", "work_stage", "missing_data_ratio"]
    for frame in (rec, com):
        for col in shared:
            if col not in frame.columns:
                frame[col] = pd.NA

    works = pd.concat([rec[shared], com[shared]], ignore_index=True)
    works["event_date"] = pd.to_datetime(works["event_date"], utc=True, errors="coerce")
    works = add_time_features(works, "event_date", snapshot_ts)
    works = add_amount_features(works, "amount")
    works = peer_statistics(works, "amount", ["state", "category"], "state_category")
    works = peer_statistics(works, "amount", ["ida_district"], "district")
    works = peer_statistics(works, "amount", ["category"], "category")

    # Works recommended long ago that have never been reported complete.
    works["age_days"] = works["days_since"]
    works["is_open_beyond_median_cycle"] = False
    completed_cycle = works.loc[works["work_stage"] == "COMPLETED", "age_days"]
    if completed_cycle.notna().any():
        median_cycle = float(completed_cycle.median())
        works.loc[works["work_stage"] == "RECOMMENDED", "is_open_beyond_median_cycle"] = (
            works.loc[works["work_stage"] == "RECOMMENDED", "age_days"] > median_cycle
        )
    # The source repeats a small number of work ids. They are kept (never
    # deleted) and made addressable with an occurrence suffix, so the repetition
    # itself stays visible instead of being silently collapsed.
    occurrence = works.groupby(["work_stage", "work_id"]).cumcount()
    works["work_id_occurrence"] = occurrence + 1
    works["is_repeated_work_id"] = works.groupby(["work_stage", "work_id"])["work_id"].transform("size") > 1
    works["work_uid"] = (works["work_stage"].str[:3] + "-" + works["work_id"].astype("string")
                         + "-" + (occurrence + 1).astype("string"))
    log.info("Work-level table built: %d rows (%d recommended, %d completed)",
             len(works), (works["work_stage"] == "RECOMMENDED").sum(),
             (works["work_stage"] == "COMPLETED").sum())
    return works


def build_expenditure_level(expenditures: pd.DataFrame, snapshot_ts: pd.Timestamp) -> pd.DataFrame:
    exp = expenditures.copy()
    exp = exp.rename(columns={"expenditure_amount": "amount", "expenditure_date": "event_date"})
    exp["event_date"] = pd.to_datetime(exp["event_date"], utc=True, errors="coerce")
    exp = add_time_features(exp, "event_date", snapshot_ts)
    exp = add_amount_features(exp, "amount")
    exp = peer_statistics(exp, "amount", ["state", "ida_district"], "district")
    exp = peer_statistics(exp, "amount", ["vendor_norm"], "vendor")
    exp["payment_success"] = exp["payment_status"].eq("Payment Success")
    exp["payment_pending"] = exp["payment_status"].eq("Payment In-Progress")
    exp["expenditure_uid"] = [f"EXP-{i:08d}" for i in range(len(exp))]
    log.info("Expenditure-level table built: %d rows", len(exp))
    return exp
