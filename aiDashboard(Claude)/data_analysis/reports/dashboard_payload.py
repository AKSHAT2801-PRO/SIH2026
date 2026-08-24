"""Build the dashboard payload from computed pipeline outputs only.

Nothing in this file is a constant taken from the source website: every figure
is read out of the analytical frames produced by the pipeline in this run, and
each carries the run id that produced it (critical rules 17, 37, 40).
"""
from __future__ import annotations

import json

import numpy as np
import pandas as pd

from common.config import ROOT, get_config
from common.logging_utils import get_logger, utcnow
from data_analysis.statistics.descriptive import timeseries
from data_engineering.ingestion.datasets import UNAVAILABLE_FIELDS
from ml.feature_engineering.features import FEATURE_DOCS

log = get_logger("reports.payload")


def _records(df: pd.DataFrame, cols: list[str], n: int | None = None,
             sort: str | None = None, ascending: bool = False) -> list[dict]:
    frame = df.copy()
    if sort and sort in frame.columns:
        frame = frame.sort_values(sort, ascending=ascending)
    if n:
        frame = frame.head(n)
    keep = [c for c in cols if c in frame.columns]
    out = frame[keep].replace({np.nan: None, pd.NaT: None})
    for c in keep:
        if pd.api.types.is_datetime64_any_dtype(out[c]):
            out[c] = out[c].dt.strftime("%Y-%m-%d")
    return json.loads(out.to_json(orient="records"))


def build_payload(run_id: str, stage1: dict, stage2: dict) -> dict:
    cfg = get_config()
    works, exp, mp_dim = stage1["works"], stage1["expenditures"], stage1["mp_dim"]
    work_risk, mp_risk, vendor_risk = stage2["work_risk"], stage2["mp_risk"], stage2["vendor_risk"]
    alerts, pairs, geo = stage2["alerts"], stage2["pairs"], stage2["geo"]
    quality, control, linkage = stage1["quality"], stage1["control"], stage1["linkage"]

    rec = works[works["work_stage"] == "RECOMMENDED"]
    com = works[works["work_stage"] == "COMPLETED"]
    allocated = float(pd.to_numeric(mp_dim["allocated_amount"], errors="coerce").sum())
    expenditure = float(pd.to_numeric(mp_dim["total_expenditure"], errors="coerce").sum())

    band_counts = lambda df: {b: int((df["risk_band"] == b).sum())  # noqa: E731
                              for b in ("LOW", "MODERATE", "HIGH", "CRITICAL")}

    ts_rec = timeseries(rec, "event_date", "amount")
    ts_com = timeseries(com, "event_date", "amount")
    ts_exp = timeseries(exp, "event_date", "amount")

    def ts_rows(ts: pd.DataFrame) -> list[dict]:
        out = ts.copy()
        out["month"] = out["event_date"].dt.strftime("%Y-%m")
        out["count"] = pd.to_numeric(out["count"], errors="coerce").fillna(0).astype(int)
        out["sum"] = pd.to_numeric(out["sum"], errors="coerce").fillna(0.0)
        out["is_sudden_change"] = out["is_sudden_change"].fillna(False).astype(bool)
        return out[["month", "count", "sum", "is_sudden_change"]].to_dict("records")

    state_rows = (work_risk.groupby("state").agg(
        works=("work_uid", "count"),
        mean_risk=("composite_risk", "mean"),
        high_risk=("risk_band", lambda s: int(s.isin(["HIGH", "CRITICAL"]).sum())),
        critical_risk=("risk_band", lambda s: int((s == "CRITICAL").sum())),
        work_value=("amount", "sum"),
    ).reset_index())
    state_extra = pd.DataFrame({
        "expenditure": exp.groupby("state")["amount"].sum(),
        "vendors": exp.groupby("state")["vendor_norm"].nunique(),
        "allocated": mp_dim.groupby("state")["allocated_amount"].sum(),
        "mps": mp_dim.groupby("state")["mp_key"].nunique(),
        "completed": com.groupby("state").size(),
        "open": rec.groupby("state").size(),
    })
    state_rows = state_rows.merge(state_extra, left_on="state", right_index=True, how="left").fillna(0)
    state_rows["utilisation_pct"] = (100 * state_rows["expenditure"]
                                     / state_rows["allocated"].replace(0, np.nan)).round(2)
    state_rows["completion_rate_pct"] = (100 * state_rows["completed"]
                                         / (state_rows["completed"] + state_rows["open"]).replace(0, np.nan)).round(2)
    state_rows["mean_risk"] = state_rows["mean_risk"].round(2)

    category_rows = (work_risk.groupby("category").agg(
        works=("work_uid", "count"), value=("amount", "sum"),
        median_amount=("amount", "median"), mean_risk=("composite_risk", "mean"),
        high_risk=("risk_band", lambda s: int(s.isin(["HIGH", "CRITICAL"]).sum())),
    ).round(2).reset_index())

    model = stage2["prediction"]
    payload = {
        "meta": {
            "run_id": run_id,
            "generated_at": utcnow(),
            "official_source": cfg["source.official_portal"],
            "portal_reachable": bool((stage1["cycle"].get("portal_discovery") or {}).get("reachable")),
            "portal_blocker": (stage1["cycle"].get("portal_discovery") or {}).get("blocker"),
            "snapshot_version": stage1["cycle"].get("snapshot_used"),
            "snapshot_date": str(stage1["snapshot_ts"].date()),
            "risk_engine_version": cfg["project.risk_engine_version"],
            "feature_version": cfg["project.feature_version"],
            "model_version": cfg["project.model_version"],
            "platform_name": cfg["project.name"],
            "datasets": [{k: d[k] for k in ("dataset", "record_count", "field_count", "source_mode",
                                            "content_sha256", "retrieved_at", "dataset_version")}
                         for d in stage1["cycle"]["datasets"]],
        },
        "kpis": {
            "allocated": allocated,
            "expenditure": expenditure,
            "utilisation_pct": round(100 * expenditure / allocated, 2),
            "unspent": allocated - expenditure,
            "mps": int(mp_dim["mp_key"].nunique()),
            "states": int(works["state"].nunique()),
            "districts": int(works["ida_district"].nunique()),
            "vendors": int(exp["vendor_norm"].nunique()),
            "works_recommended": int(len(rec)),
            "works_completed": int(len(com)),
            "works_open": int(len(rec)),
            "completion_rate_pct": round(100 * len(com) / max(len(rec), 1), 2),
            "recommended_value": float(rec["amount"].sum()),
            "completed_value": float(com["amount"].sum()),
            "payment_lines": int(len(exp)),
            "payment_pending_lines": int(exp["payment_pending"].sum()),
            "payment_pending_value": float(exp.loc[exp["payment_pending"], "amount"].sum()),
            "duplicate_payment_lines": int((exp["payment_line_repeat_count"] > 1).sum()),
            "data_quality_pct": quality["scores"]["overall_data_quality_pct"],
            "works_high_or_critical": int(work_risk["risk_band"].isin(["HIGH", "CRITICAL"]).sum()),
            "works_critical": int((work_risk["risk_band"] == "CRITICAL").sum()),
            "mps_high_or_critical": int(mp_risk["risk_band"].isin(["HIGH", "CRITICAL"]).sum()),
            "vendors_high_or_critical": int(vendor_risk["risk_band"].isin(["HIGH", "CRITICAL"]).sum()),
            "alerts_open": int(len(alerts)),
            "duplicate_pairs": int(len(pairs)),
            "exact_duplicate_pairs": int((pairs["match_type"] == "EXACT_TEXT").sum()) if len(pairs) else 0,
        },
        "risk_distribution": {
            "works": band_counts(work_risk),
            "mps": band_counts(mp_risk),
            "vendors": band_counts(vendor_risk[vendor_risk["is_scored_for_concentration"]]),
        },
        "risk_components_mean": {
            c: round(float(work_risk[c].mean()), 2) for c in
            ["cost_risk", "duplicate_risk", "delay_risk", "vendor_risk",
             "utilisation_risk", "data_quality_risk"]
        },
        "risk_histogram": _histogram(work_risk["composite_risk"]),
        "states": _records(state_rows, [
            "state", "works", "open", "completed", "mean_risk", "high_risk", "critical_risk",
            "work_value", "expenditure", "allocated", "utilisation_pct", "completion_rate_pct",
            "vendors", "mps"], sort="high_risk"),
        "districts": _records(geo, [
            "state", "ida_district", "works_recommended", "works_completed", "expenditure",
            "vendors", "payment_lines", "completion_rate_pct", "risk_score", "high_risk_works",
            "payments_per_vendor"], n=120, sort="risk_score"),
        "categories": _records(category_rows, list(category_rows.columns), sort="works"),
        "top_works": _records(work_risk, [
            "work_uid", "work_stage", "work_description", "category", "mp_name", "constituency",
            "state", "ida_district", "amount", "event_date", "age_days", "composite_risk", "risk_band",
            "cost_risk", "duplicate_risk", "delay_risk", "vendor_risk", "utilisation_risk",
            "data_quality_risk", "state_category_peer_median", "state_category_ratio_to_peer",
            "state_category_robust_z", "top_duplicate_similarity", "duplicate_partner_count",
            "detector_agreement", "iforest_score", "lof_score", "completion_propensity",
            "explanation", "contributions"], n=300, sort="composite_risk"),
        "mps": _records(mp_risk, [
            "mp_key", "mp_name", "constituency", "state", "house", "allocated_amount",
            "total_expenditure", "utilization_pct", "completion_rate_pct", "unspent_amount",
            "works_scored", "high_risk_works", "critical_risk_works", "duplicate_works",
            "mp_top_vendor_share", "mp_vendor_hhi", "mp_repeat_payment_share",
            "mp_published_vs_derived_gap_pct", "composite_risk", "risk_band",
            "cost_risk", "duplicate_risk", "delay_risk", "vendor_risk", "utilisation_risk",
            "data_quality_risk", "explanation"], sort="composite_risk"),
        "vendors": _records(vendor_risk[vendor_risk["is_scored_for_concentration"]], [
            "vendor_uid", "vendor", "state", "ida_district", "vendor_payment_lines",
            "vendor_total_amount", "vendor_median_amount", "vendor_mps_served",
            "vendor_agencies_served", "vendor_district_share", "vendor_repeat_line_share",
            "vendor_round_amount_share", "vendor_amount_concentration",
            "vendor_lines_per_active_day", "composite_risk", "risk_band", "explanation"],
            n=200, sort="composite_risk"),
        "duplicate_pairs": _records(pairs, [
            "left_uid", "right_uid", "similarity", "match_type", "same_mp", "same_district",
            "state", "left_description", "right_description", "left_amount", "right_amount",
            "amount_gap_pct", "left_mp", "right_mp", "explanation"], n=200, sort="similarity"),
        "alerts": _records(alerts, [
            "alert_id", "entity_type", "entity_id", "entity_label", "state", "district",
            "risk_score", "risk_band", "title", "detected", "recommended_action", "status",
            "created_at"], n=400, sort="risk_score") if len(alerts) else [],
        "time_series": {
            "recommendations": ts_rows(ts_rec),
            "completions": ts_rows(ts_com),
            "expenditure": ts_rows(ts_exp),
        },
        "data_quality": {
            "scores": quality["scores"],
            "totals": quality["totals"],
            "datasets": [{k: d[k] for k in ("dataset", "records_received", "records_valid",
                                            "records_quarantined", "validity_rate_pct",
                                            "full_duplicate_rows", "missing_cell_pct")}
                         for d in quality["datasets"]],
            "top_issues": [{"dataset": d["dataset"], **i}
                           for d in quality["datasets"] for i in d["top_issues"][:6]],
            "duplicate_log": [row for d in quality["datasets"] for row in d["duplicate_log"]],
            "missing_columns": [{"dataset": d["dataset"], **c}
                                for d in quality["datasets"] for c in d["columns_with_missing"]],
        },
        "reconciliation": control,
        "linkage": linkage,
        "model_evaluation": {k: v for k, v in model.items() if k not in ("_scores",)},
        "feature_documentation": FEATURE_DOCS,
        "unavailable_fields": UNAVAILABLE_FIELDS,
        "config": {
            "risk_weights": cfg["risk_engine.weights"],
            "risk_bands": cfg["risk_engine.bands"],
            "alert_threshold": cfg["alerts.min_risk_score"],
            "iforest_contamination": cfg["anomaly_detection.isolation_forest.contamination"],
            "similarity_threshold": cfg["nlp.similarity_threshold"],
            "robust_z_threshold": cfg["analysis.robust_z_threshold"],
        },
        "lineage": [
            {"stage": "1 Discovery", "detail": "Official portal probed; endpoints and blockers recorded."},
            {"stage": "2 Ingestion", "detail": "Immutable raw partition per run with SHA-256 per dataset."},
            {"stage": "3 Validation", "detail": "13 rule families; invalid records quarantined, never deleted."},
            {"stage": "4 Cleaning", "detail": "Standardisation, missing-value classification, duplicate log, outlier flags."},
            {"stage": "5 Transformation", "detail": "Peer statistics, time and amount features — all reproducible."},
            {"stage": "6 Integration", "detail": "Conformed MP key across all four exports; unsupported joins declared."},
            {"stage": "7 Warehouse", "detail": "Typed schema with keys and indexes; every row stamped with run id."},
            {"stage": "8 EDA", "detail": "Distributions measured before any threshold was chosen."},
            {"stage": "9 Features", "detail": f"{len(FEATURE_DOCS)} documented, leakage-checked features."},
            {"stage": "10 Anomaly", "detail": "Isolation Forest + LOF + DBSCAN + robust statistics + rules."},
            {"stage": "11 NLP", "detail": "Char n-gram TF-IDF cosine near-duplicate search inside blocks."},
            {"stage": "12 Prediction", "detail": "Completion propensity only; unsupported models declared."},
            {"stage": "13 Risk", "detail": "Six explainable components, configurable weights, 0-100 score."},
            {"stage": "14 Alerts", "detail": "Threshold-based alerts with a full lifecycle and history."},
            {"stage": "15 Dashboard", "detail": "Rendered from this payload only — no hard-coded statistics."},
        ],
        "limitations": _limitations(linkage, quality),
    }

    out_dir = ROOT / "outputs" / "artifacts"
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / "dashboard_payload.json"
    # NaN / Infinity are valid Python floats but invalid JSON — a single one would
    # break JSON.parse in the browser and blank the whole dashboard.
    path.write_text(json.dumps(_json_safe(payload), separators=(",", ":"),
                               default=str, allow_nan=False))
    log.info("Dashboard payload written: %s (%.1f MB)", path, path.stat().st_size / 1e6)
    return payload


def _json_safe(obj):
    """Recursively replace NaN / Infinity with None so the payload is valid JSON."""
    if isinstance(obj, dict):
        return {k: _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_safe(v) for v in obj]
    if isinstance(obj, (float, np.floating)):
        f = float(obj)
        if np.isnan(f) or np.isinf(f):
            return None
        # Six decimals is far below the precision of any published rupee figure and
        # keeps the payload (and therefore the dashboard) small.
        return round(f, 6)
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if obj is pd.NaT or obj is pd.NA:
        return None
    return obj


def _histogram(series: pd.Series, bins: int = 20) -> dict:
    v = pd.to_numeric(series, errors="coerce").dropna()
    counts, edges = np.histogram(v, bins=bins, range=(0, 100))
    return {"edges": [round(float(e), 1) for e in edges], "counts": [int(c) for c in counts]}


def _limitations(linkage: dict, quality: dict) -> list[str]:
    items = [
        "The official portal publishes no GPS coordinates, so all geography is administrative "
        "(state / constituency / implementing district parsed from the agency label). No coordinates "
        "are invented and no point map is drawn.",
        "No confirmed fraud labels exist in any MPLADS dataset. Every score on this platform is an "
        "anomaly / risk indicator, never a fraud determination, and false positives are expected.",
        "Payment lines carry no payment identifier, so byte-identical lines cannot be distinguished "
        "from genuinely repeated payments. They are preserved, counted and flagged rather than deleted.",
        "Work-level physical progress, sanction dates and revised cost estimates are not published, so "
        "no progress-based or cost-overrun analytics are offered.",
        "Vendor names are free text with no registration identifier, so vendor consolidation relies on "
        "name normalisation and may merge or split genuinely distinct suppliers.",
        f"Data quality for this cycle is {quality['scores']['overall_data_quality_pct']}% — the risk "
        "scores inherit that uncertainty, which is why data quality is a scored risk component.",
    ]
    items += linkage.get("unsupported_joins", [])
    return items
