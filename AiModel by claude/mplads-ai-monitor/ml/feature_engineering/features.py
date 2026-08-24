"""Feature engineering (§14).

Rules honoured here
-------------------
* Every feature is computed from fields the official source actually publishes.
* No feature is derived from a model output or a risk score, so the anomaly
  models cannot leak their own target back into their inputs (rule 33).
* ``FEATURE_DOCS`` documents each feature; the API and the dashboard read the
  documentation from this single source (rule: document every feature).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from common.config import get_config
from common.logging_utils import get_logger
from data_analysis.statistics.descriptive import hhi

log = get_logger("ml.features")

FEATURE_VERSION = "1.0.0"

FEATURE_DOCS: dict[str, str] = {
    # ---- work level
    "log_amount": "log1p of the work amount; amounts are log-normal-like and heavy tailed.",
    "state_category_robust_z": "Modified z-score (median/MAD) of the amount within its (state, category) peer group.",
    "district_robust_z": "Modified z-score of the amount within the implementing district.",
    "category_robust_z": "Modified z-score of the amount within the work category nationally.",
    "state_category_ratio_to_peer": "Amount ÷ peer-group median amount.",
    "peer_group_thin": "1 when the peer group had fewer members than the configured minimum, so the comparison is weak.",
    "amount_last_digits_zero": "Trailing zeros in the amount — round-number bias indicator.",
    "is_round_amount": "1 when the amount is an exact multiple of ₹1 lakh / ₹5 lakh / ₹10 lakh.",
    "age_days": "Days between the work event date and the snapshot date.",
    "open_age_ratio": "For open works: age ÷ median completed-work age; >1 means older than a typical closed work.",
    "description_length": "Characters in the work description.",
    "description_token_count": "Whitespace tokens in the work description.",
    "description_repeat_count": "How many works in the same state carry a byte-identical normalised description.",
    "description_repeat_same_mp": "How many works of the same MP carry a byte-identical normalised description.",
    "has_images": "1 when the portal holds photographic evidence for the work.",
    "missing_data_ratio": "Share of source fields that were empty for this record.",
    "mp_utilisation_pct": "MP's published fund utilisation, joined as context.",
    "mp_completion_rate_pct": "MP's published completion rate, joined as context.",
    "district_vendor_hhi": "Herfindahl concentration of vendor payments in the work's district.",
    "district_work_count": "Number of works recorded in the district (activity normaliser).",
    # ---- vendor level
    "vendor_payment_lines": "Payment lines released to the vendor.",
    "vendor_total_amount": "Total value released to the vendor.",
    "vendor_mps_served": "Distinct MPs whose funds paid this vendor.",
    "vendor_agencies_served": "Distinct implementing agencies that paid this vendor.",
    "vendor_district_share": "Vendor's share of all payment value in its main district.",
    "vendor_repeat_line_share": "Share of the vendor's lines that are exact repeats of another line.",
    "vendor_round_amount_share": "Share of the vendor's payments that are round numbers.",
    "vendor_amount_concentration": "HHI of the vendor's receipts across MPs (1 = funded by a single MP).",
    "vendor_median_amount": "Median payment size to the vendor.",
    "vendor_active_days": "Days between the vendor's first and last payment.",
    "vendor_lines_per_active_day": "Payment lines ÷ active days — burst-payment indicator.",
    # ---- MP level
    "mp_unspent_pct": "Share of the MP's allocation still unspent.",
    "mp_pending_payment_share": "Share of the MP's payment lines still in progress.",
    "mp_published_vs_derived_gap_pct": "Gap between the portal's published expenditure for the MP and the sum of its own payment lines.",
    "mp_top_vendor_share": "Share of the MP's payment value going to its single largest vendor.",
    "mp_vendor_hhi": "HHI of the MP's payment value across vendors.",
    "mp_repeat_payment_share": "Share of the MP's payment lines that are exact repeats.",
    "mp_duplicate_work_share": "Share of the MP's works that are near-duplicates of another work.",
    "mp_round_amount_share": "Share of the MP's payments that are round numbers.",
    "mp_works_per_vendor": "Payment lines ÷ distinct vendors for the MP.",
}


def build_work_features(works: pd.DataFrame, expenditures: pd.DataFrame,
                        mp_dim: pd.DataFrame, geo: pd.DataFrame) -> pd.DataFrame:
    cfg = get_config()
    f = works.copy()
    f["log_amount"] = np.log1p(pd.to_numeric(f["amount"], errors="coerce"))
    f["peer_group_thin"] = f["state_category_group_thin"].astype(int)
    f["description_length"] = f["work_description"].astype("string").str.len().fillna(0)
    f["description_token_count"] = f["work_description"].astype("string").str.split().str.len().fillna(0)

    f["description_repeat_count"] = f.groupby(["state", "description_norm"])["work_uid"].transform("size")
    f["description_repeat_same_mp"] = f.groupby(["mp_key", "description_norm"])["work_uid"].transform("size")
    # An empty description must not count as a duplicate of every other empty one.
    empty = f["description_norm"].fillna("").str.len() < cfg["cleaning.min_description_length"]
    f.loc[empty, ["description_repeat_count", "description_repeat_same_mp"]] = 1

    completed_age = f.loc[f["work_stage"] == "COMPLETED", "age_days"].median()
    f["open_age_ratio"] = np.where(
        f["work_stage"] == "RECOMMENDED",
        f["age_days"] / (completed_age if completed_age else np.nan),
        0.0,
    )
    f["has_images"] = f["has_images"].fillna(False).astype(int)

    mp_ctx = mp_dim.set_index("mp_key")[["utilization_pct", "completion_rate_pct"]]
    f = f.join(mp_ctx.rename(columns={"utilization_pct": "mp_utilisation_pct",
                                      "completion_rate_pct": "mp_completion_rate_pct"}),
               on="mp_key")

    district_hhi = (expenditures.groupby("ida_district")
                    .apply(lambda g: hhi(g.groupby("vendor_norm")["amount"].sum()), include_groups=False)
                    .rename("district_vendor_hhi"))
    f = f.join(district_hhi, on="ida_district")
    f["district_work_count"] = f.groupby("ida_district")["work_uid"].transform("size")

    numeric = [c for c in FEATURE_DOCS if c in f.columns]
    f[numeric] = f[numeric].apply(pd.to_numeric, errors="coerce")
    f["feature_version"] = FEATURE_VERSION
    log.info("Work features built: %d rows x %d documented features", len(f), len(numeric))
    return f


def build_vendor_features(expenditures: pd.DataFrame) -> pd.DataFrame:
    exp = expenditures.copy()
    district_total = exp.groupby("ida_district")["amount"].sum().rename("district_total")

    grp = exp.groupby("vendor_norm")
    v = pd.DataFrame({
        "vendor": grp["vendor"].first(),
        "state": grp["state"].agg(lambda s: s.mode().iat[0] if not s.mode().empty else None),
        "ida_district": grp["ida_district"].agg(lambda s: s.mode().iat[0] if not s.mode().empty else None),
        "vendor_payment_lines": grp.size(),
        "vendor_total_amount": grp["amount"].sum(),
        "vendor_median_amount": grp["amount"].median(),
        "vendor_mps_served": grp["mp_key"].nunique(),
        "vendor_agencies_served": grp["ida"].nunique(),
        "vendor_repeat_line_share": grp["payment_line_repeat_count"].apply(lambda s: float((s > 1).mean())),
        "vendor_round_amount_share": grp["is_round_amount"].mean(),
        "vendor_first_payment": grp["event_date"].min(),
        "vendor_last_payment": grp["event_date"].max(),
    })
    v["vendor_amount_concentration"] = (
        exp.groupby("vendor_norm").apply(lambda g: hhi(g.groupby("mp_key")["amount"].sum()),
                                         include_groups=False))
    v = v.join(district_total, on="ida_district")
    v["vendor_district_share"] = (v["vendor_total_amount"] / v["district_total"].replace(0, np.nan)).round(5)
    v["vendor_active_days"] = (v["vendor_last_payment"] - v["vendor_first_payment"]).dt.days.clip(lower=1)
    v["vendor_lines_per_active_day"] = (v["vendor_payment_lines"] / v["vendor_active_days"]).round(4)
    v = v.reset_index()
    v["vendor_uid"] = ["VEN-" + str(i).zfill(7) for i in range(len(v))]
    log.info("Vendor features built: %d vendors", len(v))
    return v


def build_mp_features(mp_dim: pd.DataFrame, works: pd.DataFrame, expenditures: pd.DataFrame,
                      duplicate_work_uids: set[str] | None = None) -> pd.DataFrame:
    m = mp_dim.copy()
    exp = expenditures

    vendor_amounts = exp.groupby(["mp_key", "vendor_norm"])["amount"].sum()
    top_share = (vendor_amounts.groupby("mp_key").max()
                 / vendor_amounts.groupby("mp_key").sum().replace(0, np.nan)).rename("mp_top_vendor_share")
    mp_hhi = (vendor_amounts.groupby("mp_key")
              .apply(lambda s: float(((s / s.sum()) ** 2).sum()) if s.sum() else 0.0)
              .rename("mp_vendor_hhi"))
    repeat_share = (exp.groupby("mp_key")["payment_line_repeat_count"]
                    .apply(lambda s: float((s > 1).mean())).rename("mp_repeat_payment_share"))
    round_share = exp.groupby("mp_key")["is_round_amount"].mean().rename("mp_round_amount_share")
    lines = exp.groupby("mp_key").size().rename("mp_payment_lines")
    vendors = exp.groupby("mp_key")["vendor_norm"].nunique().rename("mp_vendor_count")

    m = (m.set_index("mp_key")
           .join([top_share, mp_hhi, repeat_share, round_share, lines, vendors])
           .reset_index())
    m["mp_works_per_vendor"] = (m["mp_payment_lines"] / m["mp_vendor_count"].replace(0, np.nan)).round(3)
    m["mp_unspent_pct"] = pd.to_numeric(m["unspent_pct"], errors="coerce")
    m["mp_pending_payment_share"] = pd.to_numeric(m["pending_payment_share"], errors="coerce")
    m["mp_published_vs_derived_gap_pct"] = pd.to_numeric(
        m["published_vs_derived_expenditure_gap_pct"], errors="coerce")

    if duplicate_work_uids:
        dup = works.assign(is_dup=works["work_uid"].isin(duplicate_work_uids))
        share = dup.groupby("mp_key")["is_dup"].mean().rename("mp_duplicate_work_share")
        m = m.set_index("mp_key").join(share).reset_index()
    else:
        m["mp_duplicate_work_share"] = 0.0

    m["works_total"] = m["derived_recommended_works"].fillna(0) + m["derived_completed_works"].fillna(0)
    m["feature_version"] = FEATURE_VERSION
    log.info("MP features built: %d MPs", len(m))
    return m
