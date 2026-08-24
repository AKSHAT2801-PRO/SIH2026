"""Predictive analytics — only where the official data actually supports it (§18).

What CAN be modelled from the published data
--------------------------------------------
``completion_propensity``: given the attributes of a work (amount, category,
state, implementing district activity, description quality, MP context), how
closely does it resemble works that have been reported complete rather than
works still sitting open? Trained on 126k works with a grouped split by MP so
the model cannot memorise individual constituencies.

What CANNOT be modelled, and is therefore NOT built
---------------------------------------------------
* Expected completion *time* — recommended and completed exports share almost no
  work ids, so no work has both a start and an end date. A duration model would
  be fabricated.
* Cost overrun — no revised or sanctioned cost is published, only one amount per
  record. There is nothing to overrun.
* Payment failure — the portal publishes only "Success" and "In-Progress";
  no failed payments exist in the data.
* Fraud probability — there are no confirmed fraud labels anywhere in the source.

Each refusal is returned in the model report rather than silently skipped
(critical rules 15, 16).
"""
from __future__ import annotations

import json

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.inspection import permutation_importance
from sklearn.metrics import (
    average_precision_score, brier_score_loss, classification_report,
    confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OrdinalEncoder

from common.config import ROOT, get_config
from common.logging_utils import get_logger, utcnow

log = get_logger("prediction.models")

MODEL_VERSION = "1.0.0"

NUMERIC = ["log_amount", "state_category_robust_z", "district_robust_z", "category_robust_z",
           "amount_last_digits_zero", "description_length", "description_token_count",
           "description_repeat_count", "district_work_count", "district_vendor_hhi",
           "mp_utilisation_pct"]
CATEGORICAL = ["state", "category", "house"]

UNSUPPORTED_MODELS = {
    "expected_completion_time": "The two work exports share almost no work ids, so no work has both a "
                                "recommendation date and a completion date. Not modelled.",
    "cost_overrun_probability": "Only one amount per work is published; no sanctioned-vs-revised cost "
                                "pair exists. Not modelled.",
    "payment_failure_probability": "The portal publishes only 'Payment Success' and 'Payment In-Progress'; "
                                   "there are no failure events to learn from. Not modelled.",
    "fraud_probability": "No confirmed fraud labels exist in any official MPLADS dataset. A supervised "
                         "fraud model is impossible and would be misleading. Not modelled.",
}


def to_float_matrix(a):
    """Cast the encoded design matrix to float64.

    Without this the ColumnTransformer hands the estimator an *object* array
    (encoded categories concatenated with passthrough numerics). The estimator
    then stores its internal category values as objects, and after a joblib
    round-trip predicting a single row raises
    "ufunc 'isnan' not supported for the input types" — i.e. the batch model
    works but the live API cannot use it. Module level, so the pipeline pickles.
    """
    return np.asarray(a, dtype=np.float64)


def train_completion_propensity(work_features: pd.DataFrame) -> dict:
    cfg = get_config()
    df = work_features.dropna(subset=["work_stage"]).copy()
    if len(df) < cfg["prediction.min_training_rows"]:
        return {"trained": False,
                "reason": f"only {len(df)} rows available, below the configured minimum "
                          f"{cfg['prediction.min_training_rows']}"}

    y = (df["work_stage"] == "COMPLETED").astype(int).to_numpy()
    X = df[NUMERIC + CATEGORICAL].copy()
    for c in CATEGORICAL:
        X[c] = X[c].astype("string").fillna("(missing)")
    groups = df["mp_key"].astype(str).to_numpy()

    splitter = GroupShuffleSplit(n_splits=1, test_size=cfg["prediction.test_size"],
                                 random_state=cfg["prediction.random_state"])
    train_idx, test_idx = next(splitter.split(X, y, groups))

    pre = ColumnTransformer([
        ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), CATEGORICAL),
        ("num", "passthrough", NUMERIC),
    ])
    model = Pipeline([
        ("pre", pre),
        ("cast", FunctionTransformer(to_float_matrix, accept_sparse=False)),
        ("clf", HistGradientBoostingClassifier(
            max_iter=cfg["prediction.n_estimators"],
            learning_rate=0.08,
            categorical_features=[0, 1, 2],
            random_state=cfg["prediction.random_state"],
        )),
    ])
    model.fit(X.iloc[train_idx], y[train_idx])
    proba = model.predict_proba(X.iloc[test_idx])[:, 1]
    pred = (proba >= 0.5).astype(int)
    y_test = y[test_idx]

    # Model-agnostic global explanation (permutation importance on the test split).
    perm = permutation_importance(model, X.iloc[test_idx].iloc[:8000], y_test[:8000],
                                  n_repeats=5, random_state=42, scoring="roc_auc", n_jobs=-1)
    # permutation_importance runs on the DataFrame X, whose column order is NUMERIC + CATEGORICAL.
    importances = sorted(
        [{"feature": f, "importance": round(float(m), 5), "std": round(float(s), 5)}
         for f, m, s in zip(list(X.columns), perm.importances_mean, perm.importances_std)],
        key=lambda d: -d["importance"])

    report = {
        "trained": True,
        "model": "HistGradientBoostingClassifier",
        "model_version": MODEL_VERSION,
        "target": "work has been reported complete (1) vs still open (0)",
        "trained_at": utcnow(),
        "rows_train": int(len(train_idx)), "rows_test": int(len(test_idx)),
        "split": "GroupShuffleSplit by MP — no MP appears in both train and test",
        "class_balance_train": float(y[train_idx].mean()),
        "metrics": {
            "roc_auc": round(float(roc_auc_score(y_test, proba)), 4),
            "average_precision": round(float(average_precision_score(y_test, proba)), 4),
            "precision": round(float(precision_score(y_test, pred, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, pred, zero_division=0)), 4),
            "f1": round(float(f1_score(y_test, pred, zero_division=0)), 4),
            "brier_score": round(float(brier_score_loss(y_test, proba)), 4),
            "false_positive_rate": round(float(
                confusion_matrix(y_test, pred)[0, 1] / max(confusion_matrix(y_test, pred)[0].sum(), 1)), 4),
        },
        "confusion_matrix": confusion_matrix(y_test, pred).tolist(),
        "classification_report": classification_report(y_test, pred, output_dict=True, zero_division=0),
        "permutation_importance": importances,
        "excluded_features_and_why": {
            "missing_data_ratio": "Excluded. The completed and recommended exports have different "
                                  "column sets, so any completeness metric partly encodes which export "
                                  "a record came from — i.e. the label.",
            "age_days / event_date / fy": "Excluded deliberately. A completed work's date is its completion "
                                          "date while an open work's date is its recommendation date, so any "
                                          "time feature would leak the label rather than predict it.",
            "risk scores": "Never used as inputs — they are downstream of this model.",
        },
        "interpretation": ("This is a *propensity* model, not a forecast. It answers 'does this open work "
                           "look like the works that get completed?' It cannot say when a work will finish, "
                           "because the source publishes no work-level duration."),
        "caveats": ["Selection effect: the completed export is a different snapshot slice from the "
                    "recommended export, so the negative class contains works that may simply not have "
                    "been re-published yet.",
                    "The score must not be used to rank MPs; it is a work-level signal only."],
        "unsupported_models": UNSUPPORTED_MODELS,
    }
    log.info("Completion-propensity model: ROC-AUC=%.4f  AP=%.4f  F1=%.4f",
             report["metrics"]["roc_auc"], report["metrics"]["average_precision"],
             report["metrics"]["f1"])

    out_dir = ROOT / "outputs" / "reports"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "model_evaluation.json").write_text(json.dumps(report, indent=2, default=str))

    # The fitted estimator and its column contract are handed back so the pipeline
    # can freeze them into the scoring pack for the live API.
    report["_model"] = model
    report["_columns"] = {"numeric": list(NUMERIC), "categorical": list(CATEGORICAL)}

    # Score every open work so the dashboard can show stall likelihood.
    open_mask = df["work_stage"] == "RECOMMENDED"
    scores = pd.Series(np.nan, index=df.index)
    if open_mask.any():
        scores.loc[open_mask] = model.predict_proba(X.loc[open_mask])[:, 1]
    report["_scores"] = pd.DataFrame({"work_uid": df["work_uid"], "completion_propensity": scores})
    return report
