"""Stage 2 — features → anomaly ensemble → NLP duplicates → risk → prediction → alerts.

Everything written here carries ``run_id``, ``feature_version``, ``model_version``
and ``risk_engine_version`` so any dashboard figure can be traced to the exact
code and data that produced it (§25).
"""
from __future__ import annotations

import json

import numpy as np
import pandas as pd

from alerts.alert_engine import generate_alerts
from anomaly_detection.detectors import (
    PAYMENT_MODEL_FEATURES, WORK_MODEL_FEATURES, district_concentration,
    ensemble, vendor_concentration_flags,
)
from backend.database.session import bulk_load
from common.config import ROOT
from common.logging_utils import RunContext, get_logger
from ml.feature_engineering.features import (
    build_mp_features, build_vendor_features, build_work_features,
)
from nlp.duplicate_detection import duplicate_work_scores, find_duplicate_works
from prediction.models import train_completion_propensity
from risk_engine.engine import score_mps, score_vendors, score_works

log = get_logger("pipeline.stage2")


def run(ctx: RunContext, works: pd.DataFrame, expenditures: pd.DataFrame,
        mp_dim: pd.DataFrame, geo: pd.DataFrame) -> dict:
    analytical = ROOT / "data" / "analytical"

    # ---------------------------------------------------------- 1. features
    work_features = build_work_features(works, expenditures, mp_dim, geo)
    vendor_features = build_vendor_features(expenditures)
    ctx.event("features", "built", works=len(work_features), vendors=len(vendor_features))

    # -------------------------------------------------- 2. NLP duplicates
    pairs = find_duplicate_works(works)
    dup_scores = duplicate_work_scores(pairs, works)
    ctx.event("nlp", "duplicate_pairs", pairs=len(pairs))

    mp_features = build_mp_features(
        mp_dim, works, expenditures,
        duplicate_work_uids=set(dup_scores[dup_scores["top_duplicate_similarity"] >= 0.95].index)
        if not dup_scores.empty else None,
    )

    # ------------------------------------------- 3. anomaly ensembles
    work_anom = ensemble(work_features, WORK_MODEL_FEATURES, "works")

    payment_features = expenditures.copy()
    payment_features["log_amount"] = np.log1p(pd.to_numeric(payment_features["amount"], errors="coerce"))
    v_join = vendor_features.set_index("vendor_norm")[[
        "vendor_payment_lines", "vendor_district_share", "vendor_amount_concentration",
        "vendor_lines_per_active_day"]]
    payment_features = payment_features.join(v_join, on="vendor_norm")
    payment_anom = ensemble(payment_features, PAYMENT_MODEL_FEATURES, "payments")
    payment_scored = pd.concat([payment_features, payment_anom], axis=1)

    vendor_features = vendor_concentration_flags(vendor_features)
    vendor_payment_risk = (payment_scored.groupby("vendor_norm")["ensemble_score"].mean()
                           .rename("vendor_payment_anomaly_score"))
    vendor_features = vendor_features.set_index("vendor_norm").join(vendor_payment_risk).reset_index()
    districts = district_concentration(expenditures)
    ctx.event("anomaly", "ensembles_complete",
              works_flagged=int((work_anom["detector_agreement"] >= 2).sum()),
              payments_flagged=int((payment_anom["detector_agreement"] >= 2).sum()))

    # ------------------------------------------------------- 4. prediction
    prediction = train_completion_propensity(work_features)
    if prediction.get("trained"):
        scores = prediction.pop("_scores")
        work_features = work_features.merge(scores, on="work_uid", how="left")
    ctx.event("prediction", "trained", **{k: v for k, v in prediction.get("metrics", {}).items()})

    # ------------------------------------------------------ 5. risk engine
    work_risk = score_works(work_features, work_anom, dup_scores, mp_features)
    mp_risk = score_mps(mp_features, work_risk)
    vendor_risk = score_vendors(vendor_features)
    ctx.event("risk", "scored", works=len(work_risk), mps=len(mp_risk), vendors=len(vendor_risk))

    # ----------------------------------------------------------- 6. alerts
    alerts = generate_alerts(work_risk, mp_risk, vendor_risk, ctx.run_id)
    ctx.event("alerts", "generated", count=len(alerts))

    # ------------------------------------------------- 7. persist + load
    for frame in (work_risk, mp_risk, vendor_risk):
        frame["run_id"] = ctx.run_id
    if not pairs.empty:
        pairs["run_id"] = ctx.run_id

    work_risk.to_parquet(analytical / "work_risk.parquet", index=False)
    mp_risk.to_parquet(analytical / "mp_risk.parquet", index=False)
    vendor_risk.to_parquet(analytical / "vendor_risk.parquet", index=False)
    payment_scored.to_parquet(analytical / "payment_scored.parquet", index=False)
    if not pairs.empty:
        pairs.to_parquet(analytical / "duplicate_pairs.parquet", index=False)

    bulk_load(work_risk, "analytics_work_risk")
    bulk_load(mp_risk, "analytics_mp_risk")
    bulk_load(vendor_risk, "analytics_vendor_risk")
    if not pairs.empty:
        bulk_load(pairs.head(50000), "duplicate_pair")
    if not alerts.empty:
        bulk_load(alerts, "alerts")

    # district risk roll-up onto the geography table
    dist_risk = (work_risk.groupby(["state", "ida_district"])
                 .agg(risk_score=("composite_risk", "mean"),
                      high_risk_works=("risk_band", lambda s: int(s.isin(["HIGH", "CRITICAL"]).sum())))
                 .reset_index())
    geo2 = geo.merge(dist_risk, on=["state", "ida_district"], how="left")
    geo2["run_id"] = ctx.run_id
    geo2.to_parquet(analytical / "geo_district.parquet", index=False)
    bulk_load(geo2, "geo_district")

    lineage = pd.DataFrame(ctx.events)
    if not lineage.empty:
        lineage_rows = pd.DataFrame({
            "run_id": lineage["run_id"], "stage": lineage["stage"], "action": lineage["action"],
            "ts": lineage["ts"],
            "detail": lineage.drop(columns=["run_id", "stage", "action", "ts"])
                              .apply(lambda r: json.dumps(r.dropna().to_dict(), default=str), axis=1),
        })
        bulk_load(lineage_rows, "lineage")

    summary = {
        "duplicate_pairs": int(len(pairs)),
        "exact_text_duplicate_pairs": int((pairs["match_type"] == "EXACT_TEXT").sum()) if not pairs.empty else 0,
        "works_scored": int(len(work_risk)),
        "works_high_or_critical": int(work_risk["risk_band"].isin(["HIGH", "CRITICAL"]).sum()),
        "works_critical": int((work_risk["risk_band"] == "CRITICAL").sum()),
        "mps_high_or_critical": int(mp_risk["risk_band"].isin(["HIGH", "CRITICAL"]).sum()),
        "vendors_scored": int(vendor_features["is_scored_for_concentration"].sum()),
        "vendors_high_or_critical": int(vendor_risk["risk_band"].isin(["HIGH", "CRITICAL"]).sum()),
        "alerts": int(len(alerts)),
        "concentrated_districts": int(districts["flag_concentrated"].sum()),
        "prediction": {k: v for k, v in prediction.items() if k != "permutation_importance"},
    }
    (ROOT / "outputs" / "reports" / "analytics_summary.json").write_text(
        json.dumps(summary, indent=2, default=str))
    log.info("Stage 2 complete: %s", {k: v for k, v in summary.items() if k != "prediction"})

    return {"work_risk": work_risk, "mp_risk": mp_risk, "vendor_risk": vendor_risk,
            "pairs": pairs, "alerts": alerts, "districts": districts,
            "payment_scored": payment_scored, "prediction": prediction,
            "work_features": work_features, "vendor_features": vendor_features,
            "geo": geo2, "summary": summary}
