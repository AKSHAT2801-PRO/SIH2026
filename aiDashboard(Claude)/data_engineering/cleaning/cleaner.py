"""Cleaning layer — standardisation, missing-value classification, duplicate
resolution and outlier *flagging* (never outlier removal).

Guarantees
----------
* No government value is fabricated. Imputation is not used anywhere; missing
  values are classified and carried forward as missing (§7.1, rules 3/4).
* Duplicates are never silently dropped: every duplicate decision is written to
  a duplicate log with the original record, the reason and the action (§7.2).
* Extreme values are preserved and flagged with three separate, independent
  flags so a genuine large project is not confused with a data-entry error
  (§7.5, rules 24/30).
"""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from common.config import get_config
from common.logging_utils import get_logger
from common.normalize import (
    ida_district,
    normalize_description,
    normalize_org,
    normalize_person,
    normalize_state,
    squash,
    surrogate_key,
    title_case,
)
from data_engineering.ingestion.datasets import DatasetSpec
from data_engineering.validation.validators import to_datetime, to_number

log = get_logger("cleaning.cleaner")

# Reasons a cell can be empty. Nothing is imputed; the reason is stored instead.
MISSING_CLASSES = {
    "NOT_APPLICABLE": "The field does not apply to this record type.",
    "SOURCE_UNAVAILABLE": "The official portal does not publish this value for this record.",
    "GENUINELY_MISSING": "The field applies but was left blank at source.",
    "INVALID_VALUE": "A value was present but failed validation and was blanked for analysis.",
}


@dataclass
class CleaningReport:
    dataset: str
    rows_in: int
    rows_out: int
    duplicate_log: pd.DataFrame
    missing_profile: pd.DataFrame
    standardisation_counts: dict[str, int] = field(default_factory=dict)
    outlier_counts: dict[str, int] = field(default_factory=dict)
    notes: list[str] = field(default_factory=list)


def _robust_flags(values: pd.Series, cfg) -> pd.DataFrame:
    """Three independent flags over a numeric column.

    * ``is_statistical_outlier`` — outside the IQR fence (a legitimate large
      project can land here; that is expected and is NOT by itself suspicious).
    * ``is_data_quality_issue``  — physically implausible (<=0, absurd ceiling).
    * ``is_potential_anomaly``   — far beyond the extreme fence AND beyond the
      robust (MAD-based) z threshold, i.e. worth a human look.
    """
    v = pd.to_numeric(values, errors="coerce")
    q1, q3 = v.quantile(0.25), v.quantile(0.75)
    iqr = q3 - q1
    k = cfg["analysis.iqr_multiplier"]
    ke = cfg["analysis.extreme_iqr_multiplier"]
    med = v.median()
    mad = (v - med).abs().median()
    robust_z = 0.6745 * (v - med) / mad if mad and mad > 0 else pd.Series(0.0, index=v.index)

    stat_out = (v < q1 - k * iqr) | (v > q3 + k * iqr)
    dq_issue = (v <= 0) | (v > cfg["validation.amount_max"])
    potential = ((v > q3 + ke * iqr) & (robust_z.abs() > cfg["analysis.robust_z_threshold"]))
    return pd.DataFrame({
        "is_statistical_outlier": stat_out.fillna(False),
        "is_data_quality_issue": dq_issue.fillna(False),
        "is_potential_anomaly": potential.fillna(False),
        "robust_z": robust_z.fillna(0.0),
    }, index=v.index)


def clean_dataset(df: pd.DataFrame, spec: DatasetSpec) -> tuple[pd.DataFrame, CleaningReport]:
    cfg = get_config()
    out = df.copy()
    rows_in = len(out)
    std_counts: dict[str, int] = {}
    notes: list[str] = []

    # ------------------------------------------------------------ 7.3 standardise
    if "state" in out.columns:
        before = out["state"].nunique()
        out["state"] = out["state"].map(normalize_state)
        std_counts["state_values_merged"] = int(before - out["state"].nunique())
    if "constituency" in out.columns:
        out["constituency"] = out["constituency"].map(lambda x: title_case(squash(x)))
    if "house" in out.columns:
        out["house"] = out["house"].map(lambda x: title_case(squash(x)))
    if "mp_name" in out.columns:
        before = out["mp_name"].nunique()
        out["mp_name_raw"] = out["mp_name"]
        out["mp_name"] = out["mp_name"].map(lambda x: squash(x))
        out["mp_name_norm"] = out["mp_name"].map(normalize_person)
        std_counts["mp_name_variants_collapsed"] = int(before - out["mp_name_norm"].nunique())
    if "vendor" in out.columns:
        before = out["vendor"].nunique()
        out["vendor_raw"] = out["vendor"]
        out["vendor_norm"] = out["vendor"].map(normalize_org)
        std_counts["vendor_variants_collapsed"] = int(before - out["vendor_norm"].nunique())
    if "ida" in out.columns:
        out["ida"] = out["ida"].map(squash)
        out["ida_district"] = out["ida"].map(ida_district)
    if "category" in out.columns:
        out["category"] = out["category"].map(lambda x: squash(x) or "Unspecified")
    if "payment_status" in out.columns:
        out["payment_status"] = out["payment_status"].map(squash)
    if "work_description" in out.columns:
        out["work_description"] = out["work_description"].map(squash)
        out["description_norm"] = out["work_description"].map(normalize_description)
    for boolean in ("has_images",):
        if boolean in out.columns:
            out[boolean] = out[boolean].astype("string").str.lower().isin(["true", "1", "yes"])

    # ------------------------------------------------------- 7.4 numeric cleaning
    for col in spec.amount_columns:
        if col in out.columns:
            out[col] = to_number(out[col])
    for col in ("utilization_pct", "completion_rate_pct", "average_rating"):
        if col in out.columns:
            out[col] = to_number(out[col])
    for col in ("completed_works", "recommended_works", "transaction_count",
                "successful_payments", "pending_payments"):
        if col in out.columns:
            out[col] = to_number(out[col]).astype("Float64")
    for col in spec.date_columns:
        if col in out.columns:
            out[col] = to_datetime(out[col])

    # Conformed MP key: the only identifier that reliably joins all four datasets.
    if {"mp_name_norm", "state", "house"}.issubset(out.columns):
        out["mp_key"] = [
            surrogate_key(a, b, c) for a, b, c in zip(out["mp_name_norm"], out["state"], out["house"])
        ]

    # --------------------------------------------------------- 7.1 missing values
    missing_rows = []
    for col in [c for c in spec.columns.values() if c in out.columns]:
        n_missing = int(out[col].isna().sum())
        if col == "average_rating":
            klass = "SOURCE_UNAVAILABLE"
        elif col in ("work_description", "category"):
            klass = "GENUINELY_MISSING"
        else:
            klass = "GENUINELY_MISSING" if n_missing else "NOT_APPLICABLE"
        missing_rows.append({
            "dataset": spec.name,
            "column": col,
            "missing_count": n_missing,
            "missing_pct": round(100 * n_missing / max(rows_in, 1), 4),
            "classification": klass,
            "action": "left missing (no imputation)",
        })
    missing_profile = pd.DataFrame(missing_rows)
    # The ratio measures how incomplete a *record* is, so columns the portal never
    # populates for this dataset (classified SOURCE_UNAVAILABLE) are excluded.
    # Without this, 'average_rating' — empty on 99.99% of completed works and absent
    # from the recommended export — would make the two datasets trivially separable
    # and would leak the work stage into every downstream model.
    unavailable = set(missing_profile.loc[
        missing_profile["classification"] == "SOURCE_UNAVAILABLE", "column"])
    ratio_cols = [c for c in spec.columns.values() if c in out.columns and c not in unavailable]
    out["missing_data_ratio"] = out[ratio_cols].isna().mean(axis=1)
    out["structurally_unavailable_fields"] = ", ".join(sorted(unavailable)) or None

    # ------------------------------------------------------- 7.2 duplicate handling
    dup_records: list[dict] = []

    # (a) exact full-row duplicates
    dup_mask = out.duplicated(keep="first")
    out["is_exact_duplicate_row"] = dup_mask
    if dup_mask.any():
        dup_records.append({
            "dataset": spec.name,
            "duplicate_type": "exact_row",
            "records": int(dup_mask.sum()),
            "reason": "byte-identical record in the official export",
            "action": ("retained in the warehouse; collapsed for financial aggregation"
                       if cfg["cleaning.collapse_duplicate_payments"] else "retained"),
        })

    # (b) repeated natural key
    for key in spec.natural_key:
        if key in out.columns:
            k_dup = out.duplicated(subset=[key], keep="first")
            out[f"is_duplicate_{key}"] = k_dup
            if k_dup.any():
                dup_records.append({
                    "dataset": spec.name,
                    "duplicate_type": f"repeated_{key}",
                    "records": int(k_dup.sum()),
                    "reason": f"the same {key} appears more than once in the source export",
                    "action": "first occurrence marked canonical; the rest retained and flagged",
                })

    # (c) repetition multiplicity for payment lines (no payment id exists)
    if spec.name == "expenditures":
        group_cols = ["mp_key", "vendor_norm", "ida", "expenditure_amount",
                      "expenditure_date", "description_norm"]
        group_cols = [c for c in group_cols if c in out.columns]
        counts = out.groupby(group_cols, dropna=False)[group_cols[0]].transform("size")
        out["payment_line_repeat_count"] = counts.astype(int)
        rep = int((counts > 1).sum())
        if rep:
            dup_records.append({
                "dataset": spec.name,
                "duplicate_type": "identical_payment_line",
                "records": rep,
                "reason": ("identical (MP, vendor, agency, amount, date, description) payment lines; "
                           "the portal publishes no payment identifier so a repeated export row and a "
                           "genuinely repeated payment are indistinguishable"),
                "action": "all lines retained; repetition count carried forward as a risk signal",
            })
            notes.append(
                f"{rep:,} expenditure lines are exact repeats of another line. Because no payment id "
                "is published, they are preserved and surfaced as a risk signal rather than deleted."
            )

    duplicate_log = pd.DataFrame(dup_records)

    # -------------------------------------------------------- 7.5 outlier flagging
    outlier_counts: dict[str, int] = {}
    for col in spec.amount_columns:
        if col in out.columns and out[col].notna().sum() > 10:
            flags = _robust_flags(out[col], cfg)
            for flag in ("is_statistical_outlier", "is_data_quality_issue", "is_potential_anomaly"):
                out[f"{col}__{flag}"] = flags[flag]
                outlier_counts[f"{col}__{flag}"] = int(flags[flag].sum())
            out[f"{col}__robust_z"] = flags["robust_z"]

    report = CleaningReport(
        dataset=spec.name,
        rows_in=rows_in,
        rows_out=len(out),
        duplicate_log=duplicate_log,
        missing_profile=missing_profile,
        standardisation_counts=std_counts,
        outlier_counts=outlier_counts,
        notes=notes,
    )
    log.info("Cleaned %-20s rows=%6d  std=%s  outlier_flags=%d",
             spec.name, len(out), std_counts, sum(outlier_counts.values()))
    return out, report
