"""Exploratory Data Analysis (§13).

Produces a machine-readable EDA report plus a readable text report, following
the prescribed order: overview → data quality → descriptive → univariate →
bivariate → multivariate → time-series → geographic → patterns → potential
anomalies → ML recommendations.

The EDA output feeds the *threshold recommendations* consumed by the anomaly
detectors, so thresholds are learned from the observed data (rule 31).
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

from common.config import ROOT, get_config
from common.logging_utils import get_logger, utcnow
from data_analysis.statistics.descriptive import (
    compare_groups, correlation_matrix, describe_numeric, frequency_table,
    gini, grouped_stats, hhi, timeseries,
)

log = get_logger("eda.report")


def run_eda(works: pd.DataFrame, expenditures: pd.DataFrame, mp_dim: pd.DataFrame,
            geo: pd.DataFrame, quality: dict, run_id: str) -> dict:
    cfg = get_config()
    rec = works[works["work_stage"] == "RECOMMENDED"]
    com = works[works["work_stage"] == "COMPLETED"]

    report: dict = {"run_id": run_id, "generated_at": utcnow()}

    # ------------------------------------------------------------- 1. overview
    report["overview"] = {
        "works_recommended": int(len(rec)),
        "works_completed": int(len(com)),
        "expenditure_lines": int(len(expenditures)),
        "mps": int(mp_dim["mp_key"].nunique()),
        "states": int(works["state"].nunique()),
        "districts": int(works["ida_district"].nunique()),
        "constituencies": int(works["constituency"].nunique()),
        "implementing_agencies": int(expenditures["ida"].nunique()),
        "vendors": int(expenditures["vendor_norm"].nunique()),
        "categories": int(works["category"].nunique()),
        "recommended_value": float(rec["amount"].sum()),
        "completed_value": float(com["amount"].sum()),
        "expenditure_value": float(expenditures["amount"].sum()),
        "allocated_value": float(pd.to_numeric(mp_dim["allocated_amount"], errors="coerce").sum()),
        "utilisation_pct": float(
            100 * pd.to_numeric(mp_dim["total_expenditure"], errors="coerce").sum()
            / pd.to_numeric(mp_dim["allocated_amount"], errors="coerce").sum()),
        "date_range": {
            "recommendations": [str(rec["event_date"].min().date()), str(rec["event_date"].max().date())],
            "completions": [str(com["event_date"].min().date()), str(com["event_date"].max().date())],
            "payments": [str(expenditures["event_date"].min().date()),
                         str(expenditures["event_date"].max().date())],
        },
    }

    # --------------------------------------------------------- 2. data quality
    report["data_quality"] = quality["scores"] | {
        "records_quarantined": quality["totals"]["records_quarantined"],
        "duplicate_records": quality["totals"]["duplicate_records"],
    }

    # ------------------------------------------------- 3. descriptive statistics
    report["descriptive"] = {
        "recommended_amount": describe_numeric(rec["amount"], "recommended_amount"),
        "completed_amount": describe_numeric(com["amount"], "completed_amount"),
        "expenditure_amount": describe_numeric(expenditures["amount"], "expenditure_amount"),
        "mp_allocated": describe_numeric(mp_dim["allocated_amount"], "mp_allocated"),
        "mp_utilisation_pct": describe_numeric(mp_dim["utilization_pct"], "mp_utilisation_pct"),
        "mp_completion_rate_pct": describe_numeric(mp_dim["completion_rate_pct"], "mp_completion_rate_pct"),
        "work_age_days": describe_numeric(rec["age_days"], "open_work_age_days"),
    }

    # ------------------------------------------------------- 4. univariate
    report["univariate"] = {
        "category_recommended": frequency_table(rec["category"]),
        "category_completed": frequency_table(com["category"]),
        "house": frequency_table(works["house"]),
        "payment_status": frequency_table(expenditures["payment_status"]),
        "state_work_counts": frequency_table(works["state"], top=40),
        "amount_histogram_recommended": _histogram(rec["amount"]),
        "amount_histogram_expenditure": _histogram(expenditures["amount"]),
        "rare_categories": [c for c in report_rare(works["category"])],
        "round_amount_share_recommended": float(rec["is_round_amount"].mean()),
        "round_amount_share_expenditure": float(expenditures["is_round_amount"].mean()),
    }

    # -------------------------------------------------------- 5. bivariate
    mp_num = mp_dim.copy()
    for c in ("allocated_amount", "total_expenditure", "utilization_pct", "completion_rate_pct",
              "derived_expenditure", "derived_recommended_works", "derived_completed_works",
              "derived_vendors", "pending_payment_share", "unspent_pct"):
        mp_num[c] = pd.to_numeric(mp_num[c], errors="coerce")

    report["bivariate"] = {
        "mp_correlations": correlation_matrix(mp_num, [
            "allocated_amount", "derived_expenditure", "utilization_pct", "completion_rate_pct",
            "derived_recommended_works", "derived_completed_works", "derived_vendors",
            "pending_payment_share", "unspent_pct"]),
        "work_correlations": correlation_matrix(works, [
            "amount", "age_days", "state_category_robust_z", "district_robust_z",
            "amount_last_digits_zero", "missing_data_ratio"]),
        "amount_by_category": grouped_stats(works, "category", "amount"),
        "amount_by_state": grouped_stats(works, "state", "amount"),
        "lok_vs_rajya_amount": compare_groups(works, "house", "amount", "Lok Sabha", "Rajya Sabha"),
        "lok_vs_rajya_utilisation": compare_groups(mp_num, "house", "utilization_pct",
                                                   "Lok Sabha", "Rajya Sabha"),
        "completed_vs_recommended_amount": compare_groups(works, "work_stage", "amount",
                                                          "COMPLETED", "RECOMMENDED"),
    }

    # ------------------------------------------------------ 6. multivariate
    piv = (works.groupby(["state", "category"])["amount"]
           .agg(["count", "median", "sum"]).reset_index())
    piv = piv[piv["count"] >= cfg["analysis.min_group_size"]]
    national_median = float(works["amount"].median())
    piv["median_ratio_to_national"] = (piv["median"] / national_median).round(3)
    report["multivariate"] = {
        "state_category_cells": int(len(piv)),
        "national_median_amount": national_median,
        "highest_median_cells": piv.sort_values("median", ascending=False).head(15).round(2).to_dict("records"),
        "district_duration_completion": _district_multivariate(works, expenditures),
        "vendor_district_concentration": _vendor_concentration_overview(expenditures),
    }

    # ------------------------------------------------------- 7. time series
    ts_rec = timeseries(rec, "event_date", "amount")
    ts_com = timeseries(com, "event_date", "amount")
    ts_exp = timeseries(expenditures, "event_date", "amount")
    report["time_series"] = {
        "recommendations_monthly": _ts_records(ts_rec),
        "completions_monthly": _ts_records(ts_com),
        "expenditure_monthly": _ts_records(ts_exp),
        "sudden_change_months": {
            "recommendations": _sudden(ts_rec),
            "completions": _sudden(ts_com),
            "expenditure": _sudden(ts_exp),
        },
        "fy_totals": {
            "recommended": rec.groupby("fy")["amount"].sum().round(2).to_dict(),
            "completed": com.groupby("fy")["amount"].sum().round(2).to_dict(),
            "expenditure": expenditures.groupby("fy")["amount"].sum().round(2).to_dict(),
        },
    }

    # ------------------------------------------------------- 8. geographic
    geo_sorted = geo.sort_values("expenditure", ascending=False)
    report["geographic"] = {
        "state_summary": _state_summary(works, expenditures, mp_dim),
        "top_districts_by_expenditure": geo_sorted.head(25).round(2).to_dict("records"),
        "districts_with_lowest_completion": (
            geo[geo["works_recommended"] >= 50].sort_values("completion_rate_pct")
            .head(20).round(2).to_dict("records")),
        "expenditure_gini_across_states": gini(
            expenditures.groupby("state")["amount"].sum()),
        "note": ("The official source publishes no GPS coordinates. Geography is analysed at "
                 "state / constituency / implementing-district level only; no coordinates are invented."),
    }

    # --------------------------------------------------- 9. important patterns
    report["patterns"] = _patterns(rec, com, expenditures, mp_dim)

    # ------------------------------------------- 10. potential anomaly signals
    report["potential_anomalies"] = _potential_anomalies(works, expenditures, mp_dim, cfg)

    # ------------------------------- 11. thresholds & ML recommendations
    report["threshold_recommendations"] = _threshold_recommendations(works, expenditures, cfg)
    report["ml_recommendations"] = _ml_recommendations(report)

    out_dir = ROOT / "outputs" / "reports"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "eda_report.json").write_text(json.dumps(report, indent=2, default=str))
    _write_text(report, out_dir / "eda_report.txt")
    log.info("EDA complete: %d recommended, %d completed, %d payment lines",
             len(rec), len(com), len(expenditures))
    return report


# --------------------------------------------------------------------- helpers
def _histogram(series: pd.Series, bins: int = 24) -> dict:
    v = pd.to_numeric(series, errors="coerce").dropna()
    v = v[v > 0]
    if v.empty:
        return {}
    logv = np.log10(v)
    counts, edges = np.histogram(logv, bins=bins)
    return {"scale": "log10", "bin_edges_log10": [round(float(e), 3) for e in edges],
            "bin_edges_rupees": [round(float(10 ** e), 2) for e in edges],
            "counts": [int(c) for c in counts]}


def report_rare(series: pd.Series, threshold_pct: float = 1.0) -> list[str]:
    counts = series.value_counts(normalize=True) * 100
    return [str(k) for k, v in counts.items() if v < threshold_pct]


def _ts_records(ts: pd.DataFrame) -> list[dict]:
    out = ts.copy()
    out["event_date"] = out["event_date"].dt.strftime("%Y-%m")
    return out.round(3).to_dict("records")


def _sudden(ts: pd.DataFrame) -> list[dict]:
    sub = ts[ts["is_sudden_change"] == True]  # noqa: E712
    sub = sub.copy()
    sub["event_date"] = sub["event_date"].dt.strftime("%Y-%m")
    return sub[["event_date", "sum", "mom_change_pct", "change_robust_z"]].round(2).to_dict("records")


def _district_multivariate(works: pd.DataFrame, expenditures: pd.DataFrame) -> list[dict]:
    rec = works[works["work_stage"] == "RECOMMENDED"]
    com = works[works["work_stage"] == "COMPLETED"]
    d = pd.DataFrame({
        "open_works": rec.groupby("ida_district").size(),
        "open_median_age_days": rec.groupby("ida_district")["age_days"].median(),
        "completed_works": com.groupby("ida_district").size(),
        "expenditure": expenditures.groupby("ida_district")["amount"].sum(),
        "vendors": expenditures.groupby("ida_district")["vendor_norm"].nunique(),
    }).fillna(0)
    d = d[d["open_works"] >= 30]
    d["completion_ratio"] = (d["completed_works"] / (d["completed_works"] + d["open_works"])).round(3)
    return (d.sort_values(["completion_ratio", "open_median_age_days"], ascending=[True, False])
            .head(20).round(2).reset_index().to_dict("records"))


def _vendor_concentration_overview(expenditures: pd.DataFrame) -> dict:
    by_vendor = expenditures.groupby("vendor_norm")["amount"].agg(["count", "sum"])
    district_hhi = (expenditures.groupby("ida_district")
                    .apply(lambda g: hhi(g.groupby("vendor_norm")["amount"].sum()), include_groups=False)
                    .rename("hhi"))
    return {
        "vendors": int(len(by_vendor)),
        "top10_vendor_share_pct": round(
            100 * by_vendor["sum"].nlargest(10).sum() / by_vendor["sum"].sum(), 3),
        "vendor_amount_gini": gini(by_vendor["sum"]),
        "districts_scored": int(district_hhi.notna().sum()),
        "median_district_hhi": round(float(district_hhi.median()), 4),
        "districts_hhi_above_0_3": int((district_hhi > 0.3).sum()),
        "most_concentrated_districts": district_hhi.sort_values(ascending=False).head(15).round(4).to_dict(),
    }


def _state_summary(works: pd.DataFrame, expenditures: pd.DataFrame, mp_dim: pd.DataFrame) -> list[dict]:
    rec = works[works["work_stage"] == "RECOMMENDED"]
    com = works[works["work_stage"] == "COMPLETED"]
    df = pd.DataFrame({
        "recommended_works": rec.groupby("state").size(),
        "completed_works": com.groupby("state").size(),
        "recommended_value": rec.groupby("state")["amount"].sum(),
        "completed_value": com.groupby("state")["amount"].sum(),
        "expenditure": expenditures.groupby("state")["amount"].sum(),
        "vendors": expenditures.groupby("state")["vendor_norm"].nunique(),
        "mps": mp_dim.groupby("state")["mp_key"].nunique(),
        "allocated": mp_dim.groupby("state")["allocated_amount"].sum(),
    }).fillna(0)
    df["utilisation_pct"] = (100 * df["expenditure"] / df["allocated"].replace(0, np.nan)).round(2)
    df["completion_rate_pct"] = (
        100 * df["completed_works"] / (df["completed_works"] + df["recommended_works"]).replace(0, np.nan)
    ).round(2)
    return df.sort_values("expenditure", ascending=False).round(2).reset_index().to_dict("records")


def _patterns(rec: pd.DataFrame, com: pd.DataFrame, exp: pd.DataFrame, mp_dim: pd.DataFrame) -> list[str]:
    out = []
    alloc = pd.to_numeric(mp_dim["allocated_amount"], errors="coerce")
    util = pd.to_numeric(mp_dim["utilization_pct"], errors="coerce")
    out.append(f"MP fund utilisation is highly dispersed: median {util.median():.1f}%, "
               f"p10 {util.quantile(0.1):.1f}%, p90 {util.quantile(0.9):.1f}%.")
    out.append(f"{int((util < 25).sum())} MPs have utilised under 25% of their allocation, while "
               f"{int((util > 95).sum())} are above 95%.")
    out.append(f"Recommended work amounts are strongly right-skewed (median ₹{rec['amount'].median():,.0f}, "
               f"p99 ₹{rec['amount'].quantile(0.99):,.0f}, max ₹{rec['amount'].max():,.0f}).")
    out.append(f"{100*rec['is_round_amount'].mean():.1f}% of recommended amounts are exact multiples of "
               f"₹1 lakh or more, versus {100*exp['is_round_amount'].mean():.1f}% of payment lines.")
    dup_lines = int((exp["payment_line_repeat_count"] > 1).sum())
    out.append(f"{dup_lines:,} payment lines ({100*dup_lines/len(exp):.1f}%) are exact repeats of another "
               "line on the same day for the same vendor, agency and amount.")
    top_vendor_share = exp.groupby("vendor_norm")["amount"].sum().nlargest(10).sum() / exp["amount"].sum()
    out.append(f"The 10 largest vendors account for {100*top_vendor_share:.1f}% of all payment value across "
               f"{exp['vendor_norm'].nunique():,} vendors.")
    out.append(f"Completed works are smaller than open recommendations (median ₹{com['amount'].median():,.0f} "
               f"vs ₹{rec['amount'].median():,.0f}).")
    return out


def _potential_anomalies(works: pd.DataFrame, exp: pd.DataFrame, mp_dim: pd.DataFrame, cfg) -> dict:
    z = cfg["analysis.robust_z_threshold"]
    return {
        "works_robust_z_above_threshold": int(works["state_category_robust_z"].abs().gt(z).sum()),
        "works_above_district_p90": int(works["district_above_p90"].sum()),
        "payment_lines_robust_z_above_threshold": int(exp["district_robust_z"].abs().gt(z).sum()),
        "repeated_payment_lines": int((exp["payment_line_repeat_count"] > 1).sum()),
        "repeated_payment_lines_above_5": int(
            (exp["payment_line_repeat_count"] > cfg["anomaly_detection.duplicate_payments.repeat_count_high"]).sum()),
        "mps_with_zero_completion": int((pd.to_numeric(mp_dim["completed_works"], errors="coerce") == 0).sum()),
        "mps_utilisation_over_100": int((pd.to_numeric(mp_dim["utilization_pct"], errors="coerce") > 100).sum()),
        "mps_published_vs_derived_gap_over_10pct": int(
            pd.to_numeric(mp_dim["published_vs_derived_expenditure_gap_pct"], errors="coerce").abs().gt(10).sum()),
        "note": ("These are statistical signals only. None of them is evidence of fraud; they define the "
                 "candidate population that the anomaly and risk layers score and explain."),
    }


def _threshold_recommendations(works: pd.DataFrame, exp: pd.DataFrame, cfg) -> dict:
    """Data-derived thresholds handed to the anomaly layer."""
    work_extreme_rate = float(
        (works["amount"] > works["amount"].quantile(0.75)
         + 3 * (works["amount"].quantile(0.75) - works["amount"].quantile(0.25))).mean())
    exp_extreme_rate = float(
        (exp["amount"] > exp["amount"].quantile(0.75)
         + 3 * (exp["amount"].quantile(0.75) - exp["amount"].quantile(0.25))).mean())
    return {
        "observed_extreme_rate_works": round(work_extreme_rate, 4),
        "observed_extreme_rate_payments": round(exp_extreme_rate, 4),
        "configured_iforest_contamination": cfg["anomaly_detection.isolation_forest.contamination"],
        "recommendation": (
            "Isolation Forest contamination is configured at "
            f"{cfg['anomaly_detection.isolation_forest.contamination']}, which is deliberately close to the "
            f"observed extreme-value rate ({work_extreme_rate:.2%} of works, {exp_extreme_rate:.2%} of payment "
            "lines) so the unsupervised detector does not manufacture more anomalies than the distribution "
            "actually contains. Amount distributions are log-normal-like and heavy tailed, so all "
            "amount features are log-transformed and compared within (state, category) peer groups "
            "rather than nationally."),
    }


def _ml_recommendations(report: dict) -> list[str]:
    return [
        "Amounts are heavy-tailed and right-skewed → use log1p transforms and robust (median/MAD) "
        "statistics rather than mean/std for every amount feature.",
        "No confirmed fraud labels exist in the official data → supervised fraud classification is "
        "impossible. Use unsupervised anomaly detection (Isolation Forest, LOF, DBSCAN) plus explicit "
        "rules, and present the output as risk, never as fraud.",
        "Peer comparison must be done inside (state, category) and district groups; national comparison "
        "would flag whole states rather than individual works.",
        "Work descriptions are short, repetitive and noisy → character n-gram TF-IDF with cosine "
        "similarity inside state blocks is more robust here than word-level embeddings.",
        "Recommended and completed works share almost no work ids → do not attempt supervised "
        "completion-time regression at work level; model completion propensity at MP/district level instead.",
        "Payment lines repeat exactly and carry no payment id → repetition count is a feature, and any "
        "financial aggregate must state whether duplicates were collapsed.",
    ]


def _write_text(report: dict, path: Path) -> None:
    o = report["overview"]
    lines = [
        "=" * 78, "MPLADS EXPLORATORY DATA ANALYSIS REPORT", "=" * 78,
        f"Run id     : {report['run_id']}",
        f"Generated  : {report['generated_at']}",
        "",
        "1. DATASET OVERVIEW", "-" * 78,
        f"  Recommended works : {o['works_recommended']:>10,}   value ₹{o['recommended_value']/1e7:,.2f} cr",
        f"  Completed works   : {o['works_completed']:>10,}   value ₹{o['completed_value']/1e7:,.2f} cr",
        f"  Payment lines     : {o['expenditure_lines']:>10,}   value ₹{o['expenditure_value']/1e7:,.2f} cr",
        f"  MPs / states      : {o['mps']:>10,} / {o['states']}",
        f"  Districts/vendors : {o['districts']:>10,} / {o['vendors']:,}",
        f"  Allocated         : ₹{o['allocated_value']/1e7:,.2f} cr   utilisation {o['utilisation_pct']:.2f}%",
        f"  Coverage          : recommendations {o['date_range']['recommendations']}, "
        f"payments {o['date_range']['payments']}",
        "",
        "2. DATA QUALITY", "-" * 78,
    ]
    for k, v in report["data_quality"].items():
        lines.append(f"  {k:<32} {v}")
    lines += ["", "3. DESCRIPTIVE STATISTICS", "-" * 78,
              f"  {'variable':<26}{'count':>9}{'median':>16}{'p90':>16}{'max':>18}{'skew':>9}"]
    for name, d in report["descriptive"].items():
        if d.get("count"):
            lines.append(f"  {name:<26}{d['count']:>9,}{d['median']:>16,.2f}{d['p90']:>16,.2f}"
                         f"{d['max']:>18,.2f}{d['skewness']:>9.2f}")
    lines += ["", "4. UNIVARIATE HIGHLIGHTS", "-" * 78]
    for row in report["univariate"]["category_recommended"][:6]:
        lines.append(f"  category {row['value']:<28} {row['count']:>8,} ({row['share_pct']}%)")
    lines += ["", "5. BIVARIATE / GROUP COMPARISONS", "-" * 78]
    for key in ("lok_vs_rajya_amount", "lok_vs_rajya_utilisation", "completed_vs_recommended_amount"):
        c = report["bivariate"][key]
        if c.get("sufficient_data"):
            lines.append(f"  {c['comparison']:<34} median {c['median_a']:,.0f} vs {c['median_b']:,.0f} "
                         f"| p={c['p_value']:.3g} | {c['interpretation']}")
    lines += ["", "6. MULTIVARIATE", "-" * 78,
              f"  (state, category) cells with >= min group size : {report['multivariate']['state_category_cells']}",
              f"  vendor amount Gini                             : "
              f"{report['multivariate']['vendor_district_concentration']['vendor_amount_gini']:.4f}",
              f"  districts with vendor HHI > 0.30               : "
              f"{report['multivariate']['vendor_district_concentration']['districts_hhi_above_0_3']}",
              "", "7. TIME SERIES", "-" * 78]
    for name, rows in report["time_series"]["sudden_change_months"].items():
        lines.append(f"  sudden monthly changes in {name}: {len(rows)}")
        for r in rows[:4]:
            lines.append(f"      {r['event_date']}  ₹{r['sum']:,.0f}  mom {r['mom_change_pct']}%  z={r['change_robust_z']}")
    lines += ["", "8. GEOGRAPHIC", "-" * 78,
              f"  expenditure Gini across states: {report['geographic']['expenditure_gini_across_states']:.4f}",
              f"  {report['geographic']['note']}", "",
              "9. IMPORTANT PATTERNS", "-" * 78]
    lines += [f"  • {p}" for p in report["patterns"]]
    lines += ["", "10. POTENTIAL ANOMALY SIGNALS (candidates, not findings)", "-" * 78]
    for k, v in report["potential_anomalies"].items():
        if k != "note":
            lines.append(f"  {k:<48} {v:,}")
    lines += [f"  NOTE: {report['potential_anomalies']['note']}", "",
              "11. ML RECOMMENDATIONS", "-" * 78]
    lines += [f"  • {r}" for r in report["ml_recommendations"]]
    lines += ["", "12. THRESHOLD DERIVATION", "-" * 78,
              f"  {report['threshold_recommendations']['recommendation']}"]
    path.write_text("\n".join(lines))
