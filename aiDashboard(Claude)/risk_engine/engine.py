"""Explainable fraud-RISK engine (§19–20).

Language discipline
-------------------
This module never asserts fraud. It produces a 0–100 *risk* score meaning
"how strongly does this record deviate from comparable official records, and how
much does the underlying data support that comparison". Every score carries the
sentences that produced it, written for a non-technical official.

Structure
---------
Six components, each 0–100 and each independently explainable:

    cost_risk          how far the amount sits from comparable official records
    duplicate_risk     textual repetition of the work against its peers
    delay_risk         how long the work has stayed open relative to closed works
    vendor_risk        concentration of payments around one vendor / agency
    utilisation_risk   fund-utilisation behaviour of the responsible MP
    data_quality_risk  how incomplete or internally inconsistent the record is

The composite is a configurable weighted sum. Weights, band cut-offs and the
explanation threshold all live in config/config.yaml (rule 10).
"""
from __future__ import annotations

import json

import numpy as np
import pandas as pd

from common.config import get_config
from common.logging_utils import get_logger

log = get_logger("risk.engine")

RISK_ENGINE_VERSION = "1.0.0"


def _f(value, default: float = 0.0) -> float:
    """Safe float: pandas NA / None / '' all collapse to the default."""
    try:
        if value is None or value is pd.NA or (isinstance(value, float) and np.isnan(value)):
            return default
        out = float(value)
        return default if np.isnan(out) else out
    except (TypeError, ValueError):
        return default


def ramp(values, lo: float, hi: float) -> pd.Series:
    """Piecewise-linear 0..100 ramp — the only shape used, so scores stay readable."""
    v = pd.to_numeric(pd.Series(values), errors="coerce")
    return (100 * ((v - lo) / (hi - lo))).clip(0, 100).fillna(0)


def band_of(score: float, cfg) -> str:
    bands = cfg["risk_engine.bands"]
    for name in ("critical", "high", "moderate", "low"):
        lo, hi = bands[name]
        if lo <= score <= hi:
            return name.upper()
    return "LOW"


def combine(df: pd.DataFrame, components: list[str], weights: dict, cfg) -> pd.Series:
    """Blend the six explained components into one 0-100 composite.

    Two failure modes are avoided deliberately:

    * A *pure weighted average* hides a record that deviates severely on one
      well-evidenced dimension, because the other five stay quiet. So the
      strongest single component is blended in at its configured share.
    * A *pure maximum* would let one noisy component dominate everything, so it
      never stands alone either.

    The unsupervised ensemble then acts only as a corroborator: it can lift a
    score when several independent detectors agree, but it can never create a
    high-risk record on its own, because it is not explainable line by line.
    """
    blend = cfg["risk_engine.severity_blend"]
    weighted = sum(df[c] * weights[c] for c in components)
    strongest = df[components].max(axis=1)
    explained = blend["weighted_average"] * weighted + blend["strongest_component"] * strongest

    share = cfg["risk_engine.ensemble_corroboration"]
    ensemble = pd.to_numeric(df["ensemble_score"], errors="coerce").fillna(0) \
        if "ensemble_score" in df.columns else pd.Series(0.0, index=df.index)
    return ((1 - share) * explained + share * ensemble).clip(0, 100).round(2)


def _bands(scores: pd.Series, cfg) -> pd.Series:
    bands = cfg["risk_engine.bands"]
    out = pd.Series("LOW", index=scores.index)
    for name in ("moderate", "high", "critical"):
        lo, hi = bands[name]
        out[(scores >= lo) & (scores <= hi)] = name.upper()
    return out


# --------------------------------------------------------------------- works
def score_works(features: pd.DataFrame, anomalies: pd.DataFrame,
                duplicates: pd.DataFrame, mp_features: pd.DataFrame) -> pd.DataFrame:
    cfg = get_config()
    w = cfg["risk_engine.weights"]
    df = features.copy()
    df = df.join(anomalies, rsuffix="_anom")
    dup = duplicates.reindex(df["work_uid"]).reset_index(drop=True)
    dup.index = df.index
    df = pd.concat([df, dup], axis=1)

    mp_ctx = mp_features.set_index("mp_key")[[
        "mp_top_vendor_share", "mp_vendor_hhi", "mp_repeat_payment_share",
        "mp_unspent_pct", "mp_pending_payment_share", "mp_published_vs_derived_gap_pct",
    ]]
    df = df.join(mp_ctx, on="mp_key", rsuffix="_mp")

    thin = df["peer_group_thin"].fillna(0).astype(bool)

    # ---- cost -------------------------------------------------------------
    z = pd.to_numeric(df["state_category_robust_z"], errors="coerce").abs()
    ratio = pd.to_numeric(df["state_category_ratio_to_peer"], errors="coerce")
    cost = (0.55 * ramp(z, cfg["analysis.robust_z_threshold"], 12)
            + 0.30 * ramp(ratio, 2, 12)
            + 0.15 * ramp(pd.to_numeric(df["district_robust_z"], errors="coerce").abs(),
                          cfg["analysis.robust_z_threshold"], 12))
    cost = cost * np.where(thin, 0.6, 1.0)             # weak peer group ⇒ weaker claim
    df["cost_risk"] = cost.round(2)

    # ---- duplicate ---------------------------------------------------------
    sim = pd.to_numeric(df.get("top_duplicate_similarity"), errors="coerce").fillna(0)
    partners = pd.to_numeric(df.get("duplicate_partner_count"), errors="coerce").fillna(0)
    same_mp = df.get("duplicate_same_mp", pd.Series(False, index=df.index)).fillna(False).astype(bool)
    repeat_desc = pd.to_numeric(df["description_repeat_same_mp"], errors="coerce").fillna(1)
    dup_score = (0.55 * ramp(sim, cfg["nlp.similarity_threshold"], 1.0)
                 + 0.25 * ramp(partners, 1, 8)
                 + 0.20 * ramp(repeat_desc, 2, 10))
    dup_score = dup_score * np.where(same_mp, 1.0, 0.75)   # same MP repeating itself weighs more
    df["duplicate_risk"] = dup_score.round(2)

    # ---- delay -------------------------------------------------------------
    open_ratio = pd.to_numeric(df["open_age_ratio"], errors="coerce").fillna(0)
    df["delay_risk"] = np.where(
        df["work_stage"] == "RECOMMENDED", ramp(open_ratio, 1.0, 4.0), 0.0).round(2)

    # ---- vendor context ----------------------------------------------------
    df["vendor_risk"] = (
        0.5 * ramp(df["district_vendor_hhi"], cfg["anomaly_detection.vendor_concentration.hhi_high"], 0.9)
        + 0.3 * ramp(df["mp_top_vendor_share"],
                     cfg["anomaly_detection.vendor_concentration.single_vendor_share_high"], 1.0)
        + 0.2 * ramp(df["mp_repeat_payment_share"], 0.2, 0.9)
    ).round(2)

    # ---- utilisation -------------------------------------------------------
    df["utilisation_risk"] = (
        0.5 * ramp(df["mp_unspent_pct"], 50, 95)
        + 0.3 * ramp(df["mp_pending_payment_share"], 0.05, 0.5)
        + 0.2 * ramp(pd.to_numeric(df["mp_published_vs_derived_gap_pct"], errors="coerce").abs(), 5, 50)
    ).round(2)

    # ---- data quality ------------------------------------------------------
    no_desc = df["description_length"].fillna(0) < cfg["cleaning.min_description_length"]
    df["data_quality_risk"] = (
        0.4 * ramp(df["missing_data_ratio"], 0.0, 0.3)
        + 0.3 * no_desc.astype(float) * 100
        + 0.3 * ramp(df.get("is_repeated_work_id", pd.Series(False, index=df.index)).astype(float), 0, 1)
    ).round(2)

    components = ["cost_risk", "duplicate_risk", "delay_risk", "vendor_risk",
                  "utilisation_risk", "data_quality_risk"]
    df["composite_risk"] = combine(df, components, w, cfg)
    df["risk_band"] = _bands(df["composite_risk"], cfg)
    df["risk_engine_version"] = RISK_ENGINE_VERSION

    # to_dict("records") is ~30x faster than iterrows() at this row count.
    records = df.to_dict("records")
    df["contributions"] = [
        json.dumps({c: round(float(r[c]) * w[c], 2) for c in components} |
                   {"ensemble_corroboration": round(_f(r.get("ensemble_score"))
                                                    * cfg["risk_engine.ensemble_corroboration"], 2)})
        for r in records
    ]
    df["explanation"] = [_explain_work(pd.Series(r), cfg) for r in records]

    log.info("Work risk scored: %d records | critical=%d high=%d moderate=%d low=%d",
             len(df), *(int((df["risk_band"] == b).sum()) for b in ("CRITICAL", "HIGH", "MODERATE", "LOW")))
    return df


def _explain_work(r: pd.Series, cfg) -> str:
    """Plain-language explanation. Every sentence quotes the number behind it."""
    min_c = cfg["risk_engine.explanation_min_component"]
    lines: list[str] = []

    if r["cost_risk"] >= min_c:
        z = _f(r.get("state_category_robust_z"))
        ratio = _f(r.get("state_category_ratio_to_peer"))
        peer = _f(r.get("state_category_peer_median"))
        lines.append(
            f"Cost is {ratio:.1f}× the median of comparable works in {r['state']} in the same category "
            f"(₹{peer:,.0f}), which is {abs(z):.1f} robust standard deviations away from that peer group.")
        if r.get("peer_group_thin"):
            lines.append("The peer group is small, so this cost comparison is weaker than usual and the "
                         "score has been reduced accordingly.")
    if r["duplicate_risk"] >= min_c:
        sim = _f(r.get("top_duplicate_similarity"))
        partners = int(_f(r.get("duplicate_partner_count")))
        who = "the same MP" if r.get("duplicate_same_mp") else "another MP"
        lines.append(
            f"The work description is {sim:.0%} similar to {partners} other recorded work(s), "
            f"including at least one recommended by {who}.")
    if r["delay_risk"] >= min_c:
        lines.append(
            f"The work has been open for {int(_f(r.get('age_days')))} days — "
            f"{_f(r.get('open_age_ratio')):.1f}× the typical age of works that have been completed.")
    if r["vendor_risk"] >= min_c:
        clause = (f"Payments in {r.get('ida_district') or 'this district'} are concentrated "
                  f"(vendor concentration index {_f(r.get('district_vendor_hhi')):.2f}).")
        top_share = _f(r.get("mp_top_vendor_share"))
        if top_share > 0:
            clause += (f" The responsible MP's largest single vendor receives "
                       f"{100*top_share:.0f}% of that MP's payment value.")
        lines.append(clause)
    if r["utilisation_risk"] >= min_c:
        lines.append(
            f"The responsible MP has {_f(r.get('mp_unspent_pct')):.0f}% of the allocation unspent and "
            f"{100*_f(r.get('mp_pending_payment_share')):.0f}% of payment lines still in progress.")
    if r["data_quality_risk"] >= min_c:
        lines.append(
            f"The source record is incomplete ({100*_f(r.get('missing_data_ratio')):.0f}% of published "
            "fields empty), so parts of this assessment rest on missing information.")

    agreement = int(_f(r.get("detector_agreement")))
    if agreement >= 2:
        lines.append(f"{agreement} of 4 independent statistical detectors also mark this record unusual "
                     f"(top contributing measures: {r.get('iforest_top_features', 'n/a')}).")
    if not lines:
        lines.append("No component crossed its reporting threshold; this record looks ordinary "
                     "compared with similar official records.")
    lines.append("This is a statistical risk indicator for review only. It is not evidence of fraud, "
                 "and legitimate works can score highly.")
    return " ".join(lines)


# ----------------------------------------------------------------------- MPs
def score_mps(mp_features: pd.DataFrame, work_risk: pd.DataFrame) -> pd.DataFrame:
    cfg = get_config()
    w = cfg["risk_engine.weights"]
    m = mp_features.copy()

    agg = work_risk.groupby("mp_key").agg(
        works_scored=("work_uid", "count"),
        mean_work_risk=("composite_risk", "mean"),
        p90_work_risk=("composite_risk", lambda s: float(s.quantile(0.9))),
        high_risk_works=("risk_band", lambda s: int(((s == "HIGH") | (s == "CRITICAL")).sum())),
        critical_risk_works=("risk_band", lambda s: int((s == "CRITICAL").sum())),
        duplicate_works=("duplicate_risk", lambda s: int((s >= 50).sum())),
        cost_flagged_works=("cost_risk", lambda s: int((s >= 50).sum())),
    )
    m = m.set_index("mp_key").join(agg).reset_index()
    m["high_risk_work_share"] = (m["high_risk_works"] / m["works_scored"].replace(0, np.nan)).fillna(0)

    m["cost_risk"] = ramp(m["cost_flagged_works"] / m["works_scored"].replace(0, np.nan), 0.02, 0.30).round(2)
    m["duplicate_risk"] = ramp(m["duplicate_works"] / m["works_scored"].replace(0, np.nan), 0.02, 0.35).round(2)
    m["delay_risk"] = ramp(100 - pd.to_numeric(m["completion_rate_pct"], errors="coerce"), 50, 100).round(2)
    m["vendor_risk"] = (
        0.45 * ramp(m["mp_top_vendor_share"],
                    cfg["anomaly_detection.vendor_concentration.single_vendor_share_high"], 1.0)
        + 0.35 * ramp(m["mp_vendor_hhi"], cfg["anomaly_detection.vendor_concentration.hhi_high"], 0.9)
        + 0.20 * ramp(m["mp_repeat_payment_share"], 0.2, 0.9)
    ).round(2)
    m["utilisation_risk"] = (
        0.6 * ramp(m["mp_unspent_pct"], 50, 95)
        + 0.4 * ramp(m["mp_pending_payment_share"], 0.05, 0.5)
    ).round(2)
    m["data_quality_risk"] = ramp(
        pd.to_numeric(m["mp_published_vs_derived_gap_pct"], errors="coerce").abs(), 2, 40).round(2)

    components = ["cost_risk", "duplicate_risk", "delay_risk", "vendor_risk",
                  "utilisation_risk", "data_quality_risk"]
    m["composite_risk"] = combine(m, components, w, cfg)
    m["risk_band"] = _bands(m["composite_risk"], cfg)
    m["risk_engine_version"] = RISK_ENGINE_VERSION
    m["explanation"] = [_explain_mp(r, cfg) for _, r in m.iterrows()]
    log.info("MP risk scored: %d MPs | critical=%d high=%d",
             len(m), int((m["risk_band"] == "CRITICAL").sum()), int((m["risk_band"] == "HIGH").sum()))
    return m


def _explain_mp(r: pd.Series, cfg) -> str:
    min_c = cfg["risk_engine.explanation_min_component"]
    lines = []
    if r["vendor_risk"] >= min_c:
        lines.append(
            f"{100*_f(r.get('mp_top_vendor_share')):.0f}% of this MP's payment value goes to a single "
            f"vendor across {int(_f(r.get('mp_vendor_count')))} vendors used "
            f"(concentration index {_f(r.get('mp_vendor_hhi')):.2f}).")
    if r["utilisation_risk"] >= min_c:
        lines.append(
            f"{_f(r.get('mp_unspent_pct')):.0f}% of the ₹{_f(r.get('allocated_amount'))/1e7:.2f} crore "
            f"allocation is unspent and {100*_f(r.get('mp_pending_payment_share')):.0f}% of payment lines "
            "are still in progress.")
    if r["delay_risk"] >= min_c:
        lines.append(
            f"Only {_f(r.get('completion_rate_pct')):.0f}% of recommended works have been reported "
            "complete, against a national median of about 24%.")
    if r["duplicate_risk"] >= min_c:
        lines.append(f"{int(_f(r.get('duplicate_works')))} of this MP's works carry descriptions that closely "
                     "repeat other recorded works.")
    if r["cost_risk"] >= min_c:
        lines.append(f"{int(_f(r.get('cost_flagged_works')))} works are costed well above comparable works "
                     "in the same state and category.")
    if r["data_quality_risk"] >= min_c:
        lines.append(
            f"The portal's published expenditure for this MP differs from the sum of its own payment lines by "
            f"{_f(r.get('mp_published_vs_derived_gap_pct')):.1f}%, which is a data-consistency issue "
            "rather than a project problem.")
    if not lines:
        lines.append("No component crossed its reporting threshold for this MP.")
    lines.append("Risk indicators describe published data patterns only and are not evidence of wrongdoing.")
    return " ".join(lines)


# -------------------------------------------------------------------- vendors
def score_vendors(vendor_features: pd.DataFrame) -> pd.DataFrame:
    cfg = get_config()
    v = vendor_features.copy()
    scored = v["is_scored_for_concentration"]

    v["composite_risk"] = (
        0.30 * ramp(v["vendor_district_share"],
                    cfg["anomaly_detection.vendor_concentration.single_vendor_share_high"], 1.0)
        + 0.25 * ramp(v["vendor_repeat_line_share"], 0.2, 0.9)
        + 0.15 * ramp(v["vendor_amount_concentration"], 0.5, 1.0)
        + 0.15 * ramp(v["vendor_round_amount_share"],
                      cfg["anomaly_detection.round_number.min_share_for_flag"], 1.0)
        + 0.15 * ramp(v["vendor_lines_per_active_day"], 2, 20)
    ).where(scored, 0).clip(0, 100).round(2)
    v["risk_band"] = _bands(v["composite_risk"], cfg)
    v["explanation"] = [_explain_vendor(r, cfg) for _, r in v.iterrows()]
    log.info("Vendor risk scored: %d vendors (%d scored, %d high or critical)",
             len(v), int(scored.sum()), int(v["risk_band"].isin(["HIGH", "CRITICAL"]).sum()))
    return v


def _explain_vendor(r: pd.Series, cfg) -> str:
    if not r.get("is_scored_for_concentration"):
        return (f"This vendor has only {int(_f(r.get('vendor_payment_lines')))} payment line(s) — below the "
                "minimum needed for a reliable concentration assessment, so it is not scored.")
    lines = []
    if _f(r.get("vendor_district_share")) > cfg["anomaly_detection.vendor_concentration.single_vendor_share_high"]:
        lines.append(f"This vendor receives {100*float(r['vendor_district_share']):.0f}% of all MPLADS payment "
                     f"value in {r.get('ida_district')}.")
    if _f(r.get("vendor_repeat_line_share")) > 0.5:
        lines.append(f"{100*float(r['vendor_repeat_line_share']):.0f}% of its payment lines are exact repeats of "
                     "another line with the same date and amount.")
    if _f(r.get("vendor_amount_concentration")) > 0.9:
        lines.append("Almost all of its receipts come from a single MP's allocation.")
    if _f(r.get("vendor_round_amount_share")) > cfg["anomaly_detection.round_number.min_share_for_flag"]:
        lines.append(f"{100*float(r['vendor_round_amount_share']):.0f}% of its payments are exact round numbers.")
    if _f(r.get("vendor_lines_per_active_day")) > 5:
        lines.append(f"It averages {float(r['vendor_lines_per_active_day']):.1f} payment lines per active day.")
    if not lines:
        lines.append("Payment pattern is within normal range for a vendor of this size.")
    lines.append("Concentration can be entirely legitimate — a district may genuinely have one qualified "
                 "supplier. This is a prompt to check procurement records, not an accusation.")
    return " ".join(lines)
