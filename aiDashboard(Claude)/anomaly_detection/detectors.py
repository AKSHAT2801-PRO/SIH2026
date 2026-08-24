"""Ensemble anomaly detection (§15–16).

No single algorithm decides anything. Four independent families vote:

  1. Robust statistics  — modified z-score (median/MAD) and IQR fences inside
     peer groups. Transparent, explainable, no training.
  2. Isolation Forest   — multivariate numerical isolation, contamination set
     from the observed extreme-value rate measured during EDA.
  3. Local Outlier Factor — density deviation, catches records that are normal
     globally but unusual for their local neighbourhood.
  4. DBSCAN             — records that fall in no dense cluster at all.

Plus explicit, auditable *rules* for the patterns that officials actually
recognise: repeated identical payment lines, round-number bias, single-vendor
capture of a district or an MP's funds, and long-open works.

None of these outputs is evidence of fraud. They produce candidate signals that
the risk engine converts into an explained score.
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.cluster import DBSCAN
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.neighbors import LocalOutlierFactor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import RobustScaler

from common.config import get_config
from common.logging_utils import get_logger
from data_analysis.statistics.descriptive import hhi

log = get_logger("anomaly.detectors")

MODEL_VERSION = "1.0.0"

WORK_MODEL_FEATURES = [
    "log_amount", "state_category_robust_z", "district_robust_z", "category_robust_z",
    "state_category_ratio_to_peer", "amount_last_digits_zero", "age_days",
    "description_length", "description_repeat_count", "description_repeat_same_mp",
    "missing_data_ratio", "district_vendor_hhi",
]

PAYMENT_MODEL_FEATURES = [
    "log_amount", "district_robust_z", "vendor_robust_z", "amount_last_digits_zero",
    "payment_line_repeat_count", "vendor_payment_lines", "vendor_district_share",
    "vendor_amount_concentration", "vendor_lines_per_active_day",
]


def _matrix(df: pd.DataFrame, features: list[str]) -> tuple[np.ndarray, list[str]]:
    cols = [c for c in features if c in df.columns]
    X = df[cols].apply(pd.to_numeric, errors="coerce").replace([np.inf, -np.inf], np.nan)
    imputer = SimpleImputer(strategy="median")
    scaler = RobustScaler()
    return scaler.fit_transform(imputer.fit_transform(X)).astype(np.float32), cols


def isolation_forest_scores(df: pd.DataFrame, features: list[str]) -> pd.DataFrame:
    """Isolation Forest.

    Why: the target is *unlabelled* multivariate rarity across amount, peer
    deviation, repetition and timing. Isolation Forest isolates rare points in
    few random splits, needs no distance metric on mixed scales, and handles
    100k+ rows in seconds. Contamination is not guessed: it is set in config to
    the extreme-value rate that EDA measured in this very dataset.

    The returned ``iforest_score`` is normalised to 0..100 where 100 is the most
    isolated record. It is NOT a probability of fraud.
    """
    cfg = get_config()
    X, cols = _matrix(df, features)
    model = IsolationForest(
        n_estimators=cfg["anomaly_detection.isolation_forest.n_estimators"],
        contamination=cfg["anomaly_detection.isolation_forest.contamination"],
        max_samples=cfg["anomaly_detection.isolation_forest.max_samples"],
        random_state=cfg["anomaly_detection.isolation_forest.random_state"],
        n_jobs=-1,
    )
    model.fit(X)
    raw = -model.score_samples(X)                      # higher = more anomalous
    lo, hi = np.percentile(raw, 1), np.percentile(raw, 99.9)
    score = np.clip(100 * (raw - lo) / max(hi - lo, 1e-9), 0, 100)
    out = pd.DataFrame({
        "iforest_raw": raw,
        "iforest_score": score,
        "iforest_flag": model.predict(X) == -1,
    }, index=df.index)
    # Per-record feature attribution: which standardised inputs are most extreme.
    contrib = pd.DataFrame(np.abs(X), columns=cols, index=df.index)
    out["iforest_top_features"] = contrib.apply(
        lambda r: ", ".join(r.nlargest(3).index), axis=1)
    log.info("Isolation Forest: %d/%d flagged (contamination=%.3f, features=%d)",
             int(out["iforest_flag"].sum()), len(df),
             cfg["anomaly_detection.isolation_forest.contamination"], len(cols))
    return out


def lof_scores(df: pd.DataFrame, features: list[str], sample_cap: int = 60000) -> pd.DataFrame:
    """Local Outlier Factor — density-based, complements the global view of IF."""
    cfg = get_config()
    X, _ = _matrix(df, features)
    idx = df.index
    if len(df) > sample_cap:                            # LOF is O(n²) in the worst case
        rng = np.random.default_rng(42)
        take = rng.choice(len(df), sample_cap, replace=False)
        X, idx = X[take], df.index[take]
    model = LocalOutlierFactor(
        n_neighbors=cfg["anomaly_detection.lof.n_neighbors"],
        contamination=cfg["anomaly_detection.lof.contamination"],
        n_jobs=-1,
    )
    flag = model.fit_predict(X) == -1
    raw = -model.negative_outlier_factor_
    lo, hi = np.percentile(raw, 1), np.percentile(raw, 99.9)
    score = np.clip(100 * (raw - lo) / max(hi - lo, 1e-9), 0, 100)
    out = pd.DataFrame({"lof_score": score, "lof_flag": flag}, index=idx)
    out = out.reindex(df.index)
    log.info("LOF: %d flagged on %d scored rows", int(out["lof_flag"].fillna(False).sum()), len(idx))
    return out


def dbscan_clusters(df: pd.DataFrame, features: list[str], sample_cap: int = 60000) -> pd.Series:
    """DBSCAN: label -1 marks records that belong to no dense cluster."""
    cfg = get_config()
    X, _ = _matrix(df, features)
    idx = df.index
    if len(df) > sample_cap:
        rng = np.random.default_rng(42)
        take = rng.choice(len(df), sample_cap, replace=False)
        X, idx = X[take], df.index[take]
    labels = DBSCAN(eps=cfg["anomaly_detection.dbscan.eps"],
                    min_samples=cfg["anomaly_detection.dbscan.min_samples"],
                    n_jobs=-1).fit_predict(X)
    s = pd.Series(labels, index=idx, name="cluster_label").reindex(df.index)
    log.info("DBSCAN: %d clusters, %d noise points", len(set(labels)) - (1 if -1 in labels else 0),
             int((s == -1).sum()))
    return s


def statistical_flags(df: pd.DataFrame) -> pd.DataFrame:
    """Transparent, rule-based statistical flags with human-readable reasons."""
    cfg = get_config()
    z = cfg["analysis.robust_z_threshold"]
    out = pd.DataFrame(index=df.index)

    def num(col: str) -> pd.Series:
        if col not in df.columns:
            return pd.Series(np.nan, index=df.index)
        return pd.to_numeric(df[col], errors="coerce")

    def flag(col: str) -> pd.Series:
        if col not in df.columns:
            return pd.Series(False, index=df.index)
        return df[col].fillna(False).astype(bool)

    out["flag_cost_vs_peers"] = num("state_category_robust_z").abs() > z
    out["flag_cost_vs_district"] = num("district_robust_z").abs() > z
    out["flag_above_peer_p90"] = flag("state_category_above_p90")
    out["flag_round_amount"] = flag("is_round_amount")
    if "description_repeat_count" in df:
        out["flag_repeated_description"] = df["description_repeat_count"] > 1
        out["flag_repeated_description_same_mp"] = df["description_repeat_same_mp"] > 1
    if "open_age_ratio" in df:
        out["flag_long_open"] = df["open_age_ratio"] > 2.0
    if "payment_line_repeat_count" in df:
        out["flag_repeated_payment_line"] = (
            df["payment_line_repeat_count"] > cfg["anomaly_detection.duplicate_payments.repeat_count_high"])
    if "missing_data_ratio" in df:
        out["flag_incomplete_record"] = df["missing_data_ratio"] > 0.1
    return out.fillna(False)


def vendor_concentration_flags(vendor_features: pd.DataFrame) -> pd.DataFrame:
    """Rule-based vendor / implementing-agency concentration signals."""
    cfg = get_config()
    v = vendor_features.copy()
    min_lines = cfg["anomaly_detection.vendor_concentration.min_payments"]
    share_high = cfg["anomaly_detection.vendor_concentration.single_vendor_share_high"]
    scored = v["vendor_payment_lines"] >= min_lines

    v["flag_district_capture"] = scored & (v["vendor_district_share"] > share_high)
    v["flag_single_mp_dependency"] = scored & (v["vendor_amount_concentration"] > 0.9)
    v["flag_repeat_lines"] = scored & (v["vendor_repeat_line_share"] > 0.5)
    v["flag_round_amounts"] = scored & (
        v["vendor_round_amount_share"] > cfg["anomaly_detection.round_number.min_share_for_flag"])
    v["flag_payment_burst"] = scored & (v["vendor_lines_per_active_day"] > 5)
    v["flag_many_agencies"] = scored & (v["vendor_agencies_served"] > 10)
    v["vendor_flag_count"] = v[[c for c in v.columns if c.startswith("flag_")]].sum(axis=1)
    v["is_scored_for_concentration"] = scored
    log.info("Vendor rules: %d/%d vendors scored, %d with at least one flag",
             int(scored.sum()), len(v), int((v["vendor_flag_count"] > 0).sum()))
    return v


def district_concentration(expenditures: pd.DataFrame) -> pd.DataFrame:
    """District-level vendor concentration (HHI) and payment-repetition profile."""
    cfg = get_config()
    g = expenditures.groupby(["state", "ida_district"])
    out = pd.DataFrame({
        "payment_lines": g.size(),
        "expenditure": g["amount"].sum(),
        "vendors": g["vendor_norm"].nunique(),
        "repeat_line_share": g["payment_line_repeat_count"].apply(lambda s: float((s > 1).mean())),
        "round_share": g["is_round_amount"].mean(),
    })
    out["vendor_hhi"] = g.apply(lambda x: hhi(x.groupby("vendor_norm")["amount"].sum()), include_groups=False)
    out["top_vendor_share"] = g.apply(
        lambda x: float(x.groupby("vendor_norm")["amount"].sum().max() / max(x["amount"].sum(), 1e-9)),
        include_groups=False)
    out["flag_concentrated"] = out["vendor_hhi"] > cfg["anomaly_detection.vendor_concentration.hhi_high"]
    return out.reset_index()


def ensemble(df: pd.DataFrame, features: list[str], label: str) -> pd.DataFrame:
    """Run every detector and combine them into one 0-100 ensemble score."""
    log.info("Running the anomaly ensemble on %s (%d rows)", label, len(df))
    iso = isolation_forest_scores(df, features)
    lof = lof_scores(df, features)
    clusters = dbscan_clusters(df, features)
    stats = statistical_flags(df)

    out = pd.concat([iso, lof, clusters, stats], axis=1)
    flag_cols = [c for c in stats.columns]
    out["statistical_flag_count"] = stats[flag_cols].sum(axis=1)
    out["statistical_score"] = np.clip(100 * out["statistical_flag_count"] / max(len(flag_cols), 1) * 2, 0, 100)
    out["cluster_noise"] = (out["cluster_label"] == -1).fillna(False)

    # Equal-weight ensemble of three independent unsupervised views + the rules.
    out["ensemble_score"] = (
        0.35 * out["iforest_score"].fillna(0)
        + 0.25 * out["lof_score"].fillna(out["iforest_score"].fillna(0))
        + 0.10 * (out["cluster_noise"].astype(float) * 100)
        + 0.30 * out["statistical_score"]
    ).clip(0, 100).round(3)
    out["model_version"] = MODEL_VERSION
    out["detector_agreement"] = (
        out["iforest_flag"].fillna(False).astype(int)
        + out["lof_flag"].fillna(False).astype(int)
        + out["cluster_noise"].astype(int)
        + (out["statistical_flag_count"] > 0).astype(int)
    )
    log.info("%s ensemble: mean=%.2f p95=%.2f max=%.2f | %d rows flagged by >=2 detectors",
             label, out["ensemble_score"].mean(), out["ensemble_score"].quantile(0.95),
             out["ensemble_score"].max(), int((out["detector_agreement"] >= 2).sum()))
    return out
