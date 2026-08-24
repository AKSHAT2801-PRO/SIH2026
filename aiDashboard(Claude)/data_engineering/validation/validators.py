"""Validation layer — runs on RAW data, before any cleaning.

Rules
-----
* Invalid records are logged, flagged and quarantined; they are never deleted
  (specification §6, critical rule 23).
* Validation is declarative: each check returns a boolean mask plus a reason,
  so the resulting issue log can be shown to an official verbatim.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Callable

import numpy as np
import pandas as pd

from common.config import get_config
from common.logging_utils import get_logger
from data_engineering.ingestion.datasets import DatasetSpec

log = get_logger("validation.validators")


@dataclass
class ValidationResult:
    dataset: str
    records_in: int
    records_valid: int
    records_quarantined: int
    issues: pd.DataFrame                  # one row per (record, failed rule)
    metrics: dict[str, float] = field(default_factory=dict)

    @property
    def validity_rate(self) -> float:
        return 0.0 if not self.records_in else round(100 * self.records_valid / self.records_in, 3)


def canonicalise(df: pd.DataFrame, spec: DatasetSpec) -> pd.DataFrame:
    """Rename official export headers to canonical snake_case columns."""
    missing_headers = [h for h in spec.columns if h not in df.columns]
    if missing_headers:
        log.warning("%s: expected headers absent from source: %s", spec.name, missing_headers)
    out = df.rename(columns={h: c for h, c in spec.columns.items() if h in df.columns}).copy()
    keep = [c for c in spec.columns.values() if c in out.columns]
    return out[keep]


def to_number(series: pd.Series) -> pd.Series:
    cleaned = (
        series.astype("string")
        .str.replace(",", "", regex=False)
        .str.replace("₹", "", regex=False)
        .str.replace("Rs.", "", regex=False)
        .str.strip()
    )
    return pd.to_numeric(cleaned, errors="coerce")


def to_datetime(series: pd.Series) -> pd.Series:
    return pd.to_datetime(series, errors="coerce", utc=True, format="mixed")


def validate_dataset(df: pd.DataFrame, spec: DatasetSpec) -> tuple[pd.DataFrame, ValidationResult]:
    """Validate a canonicalised raw frame.

    Returns the frame with per-record validation flags attached, plus a result
    object holding the issue log and the quality metrics.
    """
    cfg = get_config()
    work = df.copy()
    n = len(work)
    issues: list[pd.DataFrame] = []

    def record_issue(mask: pd.Series, rule: str, severity: str, detail: str) -> None:
        idx = work.index[mask.fillna(False)]
        if len(idx) == 0:
            return
        issues.append(pd.DataFrame({
            "row_index": idx,
            "dataset": spec.name,
            "rule": rule,
            "severity": severity,
            "detail": detail,
        }))

    fatal = pd.Series(False, index=work.index)   # -> quarantine
    warn = pd.Series(False, index=work.index)    # -> flagged, kept

    # ---- 1. required fields ------------------------------------------------
    required = cfg.get(f"validation.required_fields.{spec.name}", [])
    for col in required:
        if col not in work.columns:
            if col == "mp_key":
                continue
            log.error("%s: required column '%s' is absent", spec.name, col)
            continue
        missing = work[col].isna() | (work[col].astype("string").str.strip() == "")
        record_issue(missing, f"required_field:{col}", "FATAL", f"'{col}' is empty")
        fatal |= missing

    # ---- 2. data types + numeric ranges ------------------------------------
    for col in spec.amount_columns:
        if col not in work.columns:
            continue
        numeric = to_number(work[col])
        unparseable = numeric.isna() & work[col].notna()
        record_issue(unparseable, f"type:{col}", "FATAL", f"'{col}' is not numeric")
        fatal |= unparseable

        negative = numeric < cfg["validation.amount_min"]
        record_issue(negative, f"range_negative:{col}", "FATAL", f"'{col}' is negative")
        fatal |= negative

        zero = numeric == 0
        record_issue(zero, f"range_zero:{col}", "WARN", f"'{col}' is exactly zero")
        warn |= zero

        too_big = numeric > cfg["validation.amount_max"]
        record_issue(too_big, f"range_max:{col}", "WARN",
                     f"'{col}' exceeds the configured plausibility ceiling "
                     f"(₹{cfg['validation.amount_max']:,.0f}) — kept for review, not deleted")
        warn |= too_big
        work[f"{col}__num"] = numeric

    # ---- 3. dates ----------------------------------------------------------
    min_date = pd.Timestamp(cfg["validation.min_valid_date"], tz="UTC")
    max_date = pd.Timestamp(datetime.now(timezone.utc) + timedelta(days=cfg["validation.max_future_days"]))
    for col in spec.date_columns:
        if col not in work.columns:
            continue
        parsed = to_datetime(work[col])
        unparseable = parsed.isna() & work[col].notna()
        record_issue(unparseable, f"date_format:{col}", "FATAL", f"'{col}' is not a valid date")
        fatal |= unparseable

        too_early = parsed < min_date
        record_issue(too_early, f"date_before_portal:{col}", "WARN",
                     f"'{col}' precedes the eSAKSHI portal go-live ({min_date.date()})")
        warn |= too_early

        future = parsed > max_date
        record_issue(future, f"date_future:{col}", "FATAL", f"'{col}' is in the future")
        fatal |= future
        work[f"{col}__ts"] = parsed

    # ---- 4. duplicate identifiers -----------------------------------------
    for key in spec.natural_key:
        if key in work.columns:
            dup = work.duplicated(subset=[key], keep="first")
            record_issue(dup, f"duplicate_key:{key}", "WARN",
                         f"repeated '{key}' — kept and logged, resolved in the cleaning layer")
            warn |= dup

    # ---- 5. full-row duplicates -------------------------------------------
    full_dup = work.duplicated(keep="first")
    record_issue(full_dup, "duplicate_row", "WARN",
                 "byte-identical record; retained, collapsed only for financial aggregation")
    warn |= full_dup

    # ---- 6. categorical sanity --------------------------------------------
    if "house" in work.columns:
        bad_house = ~work["house"].isin(["Lok Sabha", "Rajya Sabha"]) & work["house"].notna()
        record_issue(bad_house, "categorical:house", "WARN", "unexpected value for 'house'")
        warn |= bad_house

    if "payment_status" in work.columns:
        known = {"Payment Success", "Payment In-Progress", "Payment Failed"}
        bad_status = ~work["payment_status"].isin(known) & work["payment_status"].notna()
        record_issue(bad_status, "categorical:payment_status", "WARN", "unexpected payment status")
        warn |= bad_status

    # ---- 7. text quality ---------------------------------------------------
    min_len = cfg["cleaning.min_description_length"]
    if "work_description" in work.columns:
        desc = work["work_description"].astype("string").str.strip()
        short = desc.notna() & (desc.str.len() < min_len)
        record_issue(short, "text_too_short:work_description", "WARN",
                     f"description shorter than {min_len} characters")
        warn |= short

    work["validation_fatal"] = fatal
    work["validation_warn"] = warn
    work["is_quarantined"] = fatal

    issue_log = (pd.concat(issues, ignore_index=True) if issues
                 else pd.DataFrame(columns=["row_index", "dataset", "rule", "severity", "detail"]))

    result = ValidationResult(
        dataset=spec.name,
        records_in=n,
        records_valid=int((~fatal).sum()),
        records_quarantined=int(fatal.sum()),
        issues=issue_log,
        metrics={
            "warn_records": float(warn.sum()),
            "full_duplicate_rows": float(full_dup.sum()),
            "missing_cell_pct": float(
                round(100 * work[[c for c in spec.columns.values() if c in work.columns]].isna().mean().mean(), 4)
            ),
        },
    )
    log.info("Validated %-20s in=%6d valid=%6d quarantined=%4d validity=%.2f%%",
             spec.name, result.records_in, result.records_valid, result.records_quarantined,
             result.validity_rate)
    return work, result
