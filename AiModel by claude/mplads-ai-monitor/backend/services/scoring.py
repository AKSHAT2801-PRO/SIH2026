"""Live risk scoring for a record that is not (yet) in the warehouse.

Why this module exists
----------------------
The batch pipeline scores the published population. Officials also need the
answer *before* a work is published: an implementing agency proposes a work, and
the question is whether it looks unusual against comparable official records.

Equivalence with the batch register
-----------------------------------
This service does not re-implement the risk maths. It builds a one-row frame
with the same column names the batch pipeline produces and calls exactly the
same functions — ``compute_work_components`` then ``finalise_work_scores`` — so a
live score and a register score cannot drift apart.

Two detectors genuinely cannot run on a single point: Local Outlier Factor and
DBSCAN are transductive, they describe a population rather than a record. The
ensemble formula already falls back from LOF to the Isolation Forest score for
any row outside the LOF sample, so a live record is treated exactly like such a
row. The response says so explicitly in ``corroboration``.

Nothing here invents a baseline: if no completed pipeline run exists, scoring
fails loudly rather than scoring against nothing.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer

from anomaly_detection.detectors import (
    WORK_MODEL_FEATURES, add_statistical_score, apply_isolation_forest,
    combine_detectors, statistical_flags,
)
from backend.database.session import query_df
from common.config import get_config
from common.logging_utils import get_logger, utcnow
from common.normalize import (
    ida_district, normalize_description, normalize_state, squash, title_case,
)
from risk_engine.engine import (
    WORK_COMPONENTS, compute_work_components, finalise_work_scores,
)
from risk_engine.scoring_pack import ScoringPack, load_scoring_pack

log = get_logger("services.scoring")

# Fields the official exports publish for a work. Completeness of the submitted
# record is measured against this list — the same idea as the cleaning layer's
# missing_data_ratio, so the data-quality component means the same thing here.
EXPECTED_FIELDS = ["work_description", "category", "mp_name", "constituency", "state",
                   "house", "amount", "event_date", "ida"]

REQUIRED_FIELDS = ["state", "amount"]


class ScoringError(ValueError):
    """Raised when a submitted record cannot be scored at all."""


@lru_cache(maxsize=1)
def _pack() -> ScoringPack:
    return load_scoring_pack()


def reload_pack() -> ScoringPack:
    """Drop cached reference state (call after a new pipeline run)."""
    _pack.cache_clear()
    _corpus.cache_clear()
    _vectoriser.cache_clear()
    return _pack()


# ------------------------------------------------------------------ corpus
@lru_cache(maxsize=8)
def _corpus(run_id: str, state: str) -> pd.DataFrame:
    """Published works in one state — the block a new record is compared against."""
    sql = """
        SELECT work_uid, work_description, description_norm, amount, mp_key, mp_name,
               ida_district, category, 'RECOMMENDED' AS work_stage
          FROM fact_recommended_work WHERE state = :state
        UNION ALL
        SELECT work_uid, work_description, description_norm, amount, mp_key, mp_name,
               ida_district, category, 'COMPLETED' AS work_stage
          FROM fact_completed_work WHERE state = :state
    """
    df = query_df(sql, {"state": state})
    df["description_norm"] = df["description_norm"].fillna("")
    return df


@lru_cache(maxsize=8)
def _vectoriser(run_id: str, state: str):
    """Character n-gram TF-IDF fitted on one state's descriptions (cached per state)."""
    cfg = get_config()["nlp.tfidf"]
    corpus = _corpus(run_id, state)
    texts = corpus["description_norm"].tolist()
    if not any(texts):
        return None, None
    vec = TfidfVectorizer(analyzer=cfg["analyzer"], ngram_range=tuple(cfg["ngram_range"]),
                          min_df=cfg["min_df"], max_features=cfg["max_features"],
                          dtype=np.float32)
    matrix = vec.fit_transform(texts)
    return vec, matrix


def _find_duplicates(pack: ScoringPack, state: str, description_norm: str,
                     mp_key: str | None, exclude_uid: str | None) -> dict:
    """Nearest published works by description similarity, inside the state block."""
    cfg = get_config()
    threshold = cfg["nlp.similarity_threshold"]
    empty = {"top_similarity": 0.0, "partner_count": 0, "same_mp": False, "matches": [],
             "corpus_size": 0}
    if len(description_norm) < cfg["cleaning.min_description_length"]:
        return empty | {"note": "description too short to compare"}

    corpus = _corpus(pack.run_id, state)
    if corpus.empty:
        return empty | {"note": f"no published works in {state} to compare against"}
    vec, matrix = _vectoriser(pack.run_id, state)
    if vec is None:
        return empty | {"note": "no comparable descriptions in this state"}

    sims = (matrix @ vec.transform([description_norm]).T).toarray().ravel()
    if exclude_uid is not None:
        sims[corpus["work_uid"].to_numpy() == exclude_uid] = 0.0

    order = np.argsort(-sims)[:cfg["nlp.top_k"]]
    matches = []
    for i in order:
        if sims[i] < threshold:
            break
        row = corpus.iloc[int(i)]
        amount_a, amount_b = float(row["amount"] or 0), 0.0
        matches.append({
            "work_uid": row["work_uid"],
            "similarity": round(float(sims[i]), 4),
            "match_type": "EXACT_TEXT" if sims[i] >= cfg["nlp.exact_duplicate_threshold"] else "NEAR_DUPLICATE",
            "work_description": row["work_description"],
            "amount": amount_a,
            "mp_name": row["mp_name"],
            "ida_district": row["ida_district"],
            "same_mp": bool(mp_key and row["mp_key"] == mp_key),
        })
    return {
        "top_similarity": round(float(sims.max()), 4) if len(sims) else 0.0,
        "partner_count": int((sims >= threshold).sum()),
        "same_mp": any(m["same_mp"] for m in matches),
        "matches": matches,
        "corpus_size": int(len(corpus)),
    }


def _comparable_works(state: str, category: str, amount: float, limit: int = 5) -> list[dict]:
    """Published works of the same kind and closest amount — the peer evidence."""
    sql = """
        SELECT work_uid, work_description, amount, ida_district, mp_name
          FROM (
            SELECT work_uid, work_description, amount, ida_district, mp_name, state, category
              FROM fact_recommended_work
            UNION ALL
            SELECT work_uid, work_description, amount, ida_district, mp_name, state, category
              FROM fact_completed_work)
         WHERE state = :state AND category = :category
         ORDER BY ABS(amount - :amount) LIMIT :limit
    """
    try:
        return query_df(sql, {"state": state, "category": category,
                              "amount": amount, "limit": limit}).to_dict("records")
    except Exception as exc:  # noqa: BLE001 — evidence is optional, the score is not
        log.warning("comparable-work lookup failed: %s", exc)
        return []


# ------------------------------------------------------------------ scoring
def _trailing_zeros(x: float) -> int:
    if not x or x <= 0:
        return 0
    i = int(round(x))
    z = 0
    while i and i % 10 == 0:
        z += 1
        i //= 10
    return z


def _validate(record: dict) -> tuple[dict, list[str], list[str]]:
    """Canonicalise a submitted record; return (clean, errors, warnings)."""
    cfg = get_config()
    errors, warnings = [], []
    clean: dict[str, Any] = {}

    for field in REQUIRED_FIELDS:
        if record.get(field) in (None, ""):
            errors.append(f"'{field}' is required")

    clean["state"] = normalize_state(record.get("state"))
    if clean["state"] and clean["state"] not in _pack().known_states:
        warnings.append(f"'{clean['state']}' does not appear in the reference run; "
                        "peer comparison falls back to the national distribution")

    amount = pd.to_numeric(pd.Series([record.get("amount")]), errors="coerce").iat[0]
    if pd.isna(amount):
        if record.get("amount") not in (None, ""):
            errors.append("'amount' is not numeric")
    else:
        amount = float(amount)
        if amount < cfg["validation.amount_min"]:
            errors.append("'amount' is negative")
        elif amount == 0:
            warnings.append("'amount' is exactly zero")
        elif amount > cfg["validation.amount_max"]:
            warnings.append(f"'amount' exceeds the configured plausibility ceiling "
                            f"(₹{cfg['validation.amount_max']:,.0f}) — scored, not rejected")
    clean["amount"] = None if pd.isna(amount) else float(amount)

    stage = squash(record.get("work_stage") or "RECOMMENDED").upper()
    if stage not in {"RECOMMENDED", "COMPLETED"}:
        errors.append("'work_stage' must be RECOMMENDED or COMPLETED")
    clean["work_stage"] = stage

    clean["work_description"] = squash(record.get("work_description"))
    clean["description_norm"] = normalize_description(clean["work_description"])
    if len(clean["description_norm"]) < cfg["cleaning.min_description_length"]:
        warnings.append("the work description is missing or too short to compare against "
                        "published works, so duplicate detection could not run")

    clean["category"] = squash(record.get("category")) or "Unspecified"
    if clean["category"] not in _pack().known_categories:
        warnings.append(f"category '{clean['category']}' is not one the portal publishes; "
                        "peer comparison uses the state distribution instead")

    clean["mp_name"] = squash(record.get("mp_name"))
    clean["mp_key"] = squash(record.get("mp_key")) or None
    clean["house"] = title_case(squash(record.get("house")))
    clean["constituency"] = title_case(squash(record.get("constituency")))
    clean["ida"] = squash(record.get("ida"))
    clean["ida_district"] = title_case(squash(record.get("ida_district"))) or ida_district(clean["ida"])
    clean["work_id"] = squash(record.get("work_id")) or None

    event = pd.to_datetime(record.get("event_date"), errors="coerce", utc=True)
    as_of = pd.to_datetime(record.get("as_of"), errors="coerce", utc=True)
    if record.get("event_date") and pd.isna(event):
        errors.append("'event_date' is not a valid date")
    clean["event_date"] = None if pd.isna(event) else event
    clean["as_of"] = pd.Timestamp(datetime.now(timezone.utc)) if pd.isna(as_of) else as_of

    if clean["event_date"] is not None and clean["event_date"] > clean["as_of"]:
        errors.append("'event_date' is in the future")
    if clean["event_date"] is None:
        warnings.append("no event date was supplied, so the delay component could not be assessed")

    return clean, errors, warnings


def score_record(record: dict, exclude_uid: str | None = None) -> dict:
    """Score one record against the reference population. Never raises on a
    partially complete record — it scores what it can and says what it could not."""
    cfg = get_config()
    pack = _pack()
    clean, errors, warnings = _validate(record)
    if errors:
        raise ScoringError("; ".join(errors))

    state, category, amount = clean["state"], clean["category"], clean["amount"]

    # ---- peer comparison ---------------------------------------------------
    sc = pack.peer("state_category", f"{state}||{category}")
    dist = pack.peer("district", clean["ida_district"]) if clean["ida_district"] else pack.peer("district", "")
    cat = pack.peer("category", category)

    def robust_z(stat) -> float:
        return float(0.6745 * (amount - stat.median) / (stat.mad or 1.0))

    # ---- MP context --------------------------------------------------------
    mp_key, mp_ctx, how = pack.resolve_mp(clean["mp_key"], clean["mp_name"], state, clean["house"])
    if mp_ctx is None:
        warnings.append(f"the MP could not be matched to the reference run ({how}), so the "
                        "fund-utilisation component and the MP half of the vendor component "
                        "were left unassessed rather than guessed")

    # ---- duplicates --------------------------------------------------------
    dup = _find_duplicates(pack, state, clean["description_norm"], mp_key, exclude_uid)
    if dup.get("note"):
        warnings.append(dup["note"])

    same_mp_repeats = 1
    if mp_key and clean["description_norm"]:
        corpus = _corpus(pack.run_id, state)
        same_mp_repeats = 1 + int(((corpus["mp_key"] == mp_key) &
                                   (corpus["description_norm"] == clean["description_norm"])).sum())

    # ---- age ---------------------------------------------------------------
    age_days = np.nan
    if clean["event_date"] is not None:
        age_days = float((clean["as_of"] - clean["event_date"]).days)
    open_age_ratio = (age_days / pack.completed_median_age_days
                      if clean["work_stage"] == "RECOMMENDED" and not np.isnan(age_days) else 0.0)

    # ---- completeness ------------------------------------------------------
    supplied = [f for f in EXPECTED_FIELDS if clean.get(f) not in (None, "", [])]
    missing_fields = [f for f in EXPECTED_FIELDS if f not in supplied]
    missing_ratio = len(missing_fields) / len(EXPECTED_FIELDS)

    # ---- one-row frame, identical column names to the batch pipeline -------
    row = {
        "work_uid": exclude_uid or "LIVE-" + hashlib.sha1(
            json.dumps({k: str(v) for k, v in clean.items()}, sort_keys=True).encode()).hexdigest()[:12],
        "work_stage": clean["work_stage"],
        "work_description": clean["work_description"],
        "description_norm": clean["description_norm"],
        "category": category,
        "state": state,
        "constituency": clean["constituency"],
        "ida": clean["ida"],
        "ida_district": clean["ida_district"],
        "mp_key": mp_key,
        "mp_name": clean["mp_name"] or (mp_ctx or {}).get("mp_name"),
        "amount": amount,
        "log_amount": float(np.log1p(amount or 0)),
        "amount_last_digits_zero": _trailing_zeros(amount or 0),
        "is_round_amount": bool(amount and any(
            amount % m == 0 for m in cfg["anomaly_detection.round_number.moduli"])),
        "event_date": clean["event_date"],
        "age_days": age_days,
        "open_age_ratio": open_age_ratio,
        "state_category_peer_median": sc.median,
        "state_category_peer_count": sc.count,
        "state_category_ratio_to_peer": (amount / sc.median) if sc.median else np.nan,
        "state_category_robust_z": robust_z(sc),
        "state_category_above_p90": bool(amount and amount > sc.p90),
        "peer_group_thin": bool(sc.thin),
        "district_robust_z": robust_z(dist),
        "category_robust_z": robust_z(cat),
        "district_vendor_hhi": pack.district_vendor_hhi.get(clean["ida_district"], np.nan),
        "district_work_count": pack.district_work_count.get(clean["ida_district"], np.nan),
        "description_length": len(clean["work_description"]),
        "description_token_count": len(clean["work_description"].split()),
        "description_repeat_count": dup["partner_count"] + 1,
        "description_repeat_same_mp": same_mp_repeats,
        "top_duplicate_similarity": dup["top_similarity"],
        "duplicate_partner_count": dup["partner_count"],
        "duplicate_same_mp": dup["same_mp"],
        "missing_data_ratio": missing_ratio,
        "is_repeated_work_id": False,
        "has_images": bool(record.get("has_images")),
        "mp_utilisation_pct": (mp_ctx or {}).get("utilization_pct", np.nan),
        "mp_top_vendor_share": (mp_ctx or {}).get("mp_top_vendor_share", np.nan),
        "mp_vendor_hhi": (mp_ctx or {}).get("mp_vendor_hhi", np.nan),
        "mp_repeat_payment_share": (mp_ctx or {}).get("mp_repeat_payment_share", np.nan),
        "mp_unspent_pct": (mp_ctx or {}).get("mp_unspent_pct", np.nan),
        "mp_pending_payment_share": (mp_ctx or {}).get("mp_pending_payment_share", np.nan),
        "mp_published_vs_derived_gap_pct": (mp_ctx or {}).get("mp_published_vs_derived_gap_pct", np.nan),
    }
    df = pd.DataFrame([row])

    # ---- unsupervised corroboration ---------------------------------------
    stats = statistical_flags(df)
    df = add_statistical_score(pd.concat([df, stats], axis=1), stats)
    iforest_score = np.nan
    iforest_top = None
    iforest_flag = False
    if pack.isolation_forest:
        iso = apply_isolation_forest(pack.isolation_forest, df)
        iforest_score = float(iso["iforest_score"].iat[0])
        iforest_top = iso["iforest_top_features"].iat[0]
        iforest_flag = bool(iso["iforest_flag"].iat[0])
        df["iforest_score"] = iforest_score
        df["iforest_top_features"] = iforest_top
    else:
        warnings.append("the reference run carries no fitted Isolation Forest, so the score "
                        "rests on the explainable components alone")
        df["iforest_score"] = 0.0

    df["ensemble_score"] = combine_detectors(
        df["iforest_score"], None, pd.Series([False]), df["statistical_score"]).clip(0, 100)
    df["detector_agreement"] = int(iforest_flag) + int(df["statistical_flag_count"].iat[0] > 0)

    # ---- the same maths the register uses ---------------------------------
    scored = finalise_work_scores(compute_work_components(df, cfg), cfg)
    result = scored.iloc[0]

    # ---- completion propensity (only where the model supports it) ---------
    propensity = None
    if (pack.propensity_model is not None and clean["work_stage"] == "RECOMMENDED"
            and pack.propensity_columns):
        try:
            numeric = pack.propensity_columns["numeric"]
            categorical = pack.propensity_columns["categorical"]
            X = df.reindex(columns=numeric + categorical).copy()
            # The estimator needs real floats and real strings; a one-row frame
            # built from a JSON payload can carry None in either kind of column.
            X[numeric] = X[numeric].apply(pd.to_numeric, errors="coerce").astype("float64")
            for c in categorical:
                X[c] = X[c].astype("string").fillna("(missing)")
            propensity = round(float(pack.propensity_model.predict_proba(X)[:, 1][0]), 4)
        except Exception as exc:  # noqa: BLE001 — an optional signal must not fail the score
            log.warning("propensity scoring skipped: %s", exc)

    triggers_alert = float(result["composite_risk"]) >= cfg["alerts.min_risk_score"]
    return {
        "work_uid": row["work_uid"],
        "scored_at": utcnow(),
        "composite_risk": round(float(result["composite_risk"]), 2),
        "risk_band": result["risk_band"],
        "components": {c: round(float(result[c]), 2) for c in WORK_COMPONENTS},
        "contributions": json.loads(result["contributions"]),
        "explanation": result["explanation"],
        "evidence": {
            "peer_group": f"{state} · {category}",
            "peer_median_amount": round(sc.median, 2),
            "peer_group_size": sc.count,
            "peer_group_thin": bool(sc.thin),
            "ratio_to_peer_median": (round(float(row["state_category_ratio_to_peer"]), 3)
                                     if row["state_category_ratio_to_peer"] == row["state_category_ratio_to_peer"] else None),
            "robust_z_vs_peers": round(float(row["state_category_robust_z"]), 3),
            "district_vendor_hhi": (None if pd.isna(row["district_vendor_hhi"])
                                    else round(float(row["district_vendor_hhi"]), 4)),
            "age_days": None if np.isnan(age_days) else int(age_days),
            "typical_completed_age_days": round(pack.completed_median_age_days, 1),
            "similar_published_works": dup["matches"],
            "comparable_works": _comparable_works(state, category, amount or 0),
            "mp_context_matched_by": how,
            "completion_propensity": propensity,
        },
        "corroboration": {
            "isolation_forest_score": None if np.isnan(iforest_score) else round(iforest_score, 2),
            "isolation_forest_flag": iforest_flag,
            "top_contributing_measures": iforest_top,
            "rule_flags_triggered": int(df["statistical_flag_count"].iat[0]),
            "detectors_available": "Isolation Forest + rule flags",
            "detectors_unavailable": ("Local Outlier Factor and DBSCAN describe a population, not a "
                                      "single record, so they run in the batch pipeline only; their "
                                      "weight falls back to the Isolation Forest score, exactly as it "
                                      "does for batch rows outside the LOF sample"),
        },
        "alert": {
            "would_raise_alert": triggers_alert,
            "threshold": cfg["alerts.min_risk_score"],
            "recommended_action": ("Review the sanction file, the measurement book and the payment "
                                   "vouchers for this work with the implementing district authority."
                                   if triggers_alert else
                                   "No alert. The record is within the normal range for comparable works."),
        },
        "data_quality": {
            "fields_supplied": supplied,
            "fields_missing": missing_fields,
            "missing_data_ratio": round(missing_ratio, 4),
            "warnings": warnings,
        },
        "reference": {
            "run_id": pack.run_id,
            "snapshot_date": pack.snapshot_date,
            "risk_engine_version": pack.risk_engine_version,
            "feature_version": pack.feature_version,
            "model_version": pack.model_version,
            "pack_built_at": pack.built_at,
            "population_compared_against": dup.get("corpus_size", 0),
        },
        "disclaimer": ("This is a statistical risk indicator computed against comparable published "
                       "records. It is not evidence of fraud or wrongdoing, and legitimate works can "
                       "score highly."),
    }


def score_records(records: list[dict]) -> dict:
    """Score a batch of submitted records; per-record failures are reported, not fatal."""
    scored, failed = [], []
    for i, record in enumerate(records):
        try:
            scored.append(score_record(record))
        except ScoringError as exc:
            failed.append({"index": i, "error": str(exc)})
    return {
        "scored": scored,
        "rejected": failed,
        "summary": {
            "submitted": len(records),
            "scored": len(scored),
            "rejected": len(failed),
            "high_or_critical": sum(1 for s in scored if s["risk_band"] in ("HIGH", "CRITICAL")),
            "would_raise_alerts": sum(1 for s in scored if s["alert"]["would_raise_alert"]),
        },
    }


def input_schema() -> dict:
    """Self-documenting schema for the endpoint, generated from the code above."""
    pack = _pack()
    return {
        "required": REQUIRED_FIELDS,
        "fields": {
            "state": "State or UT exactly as the portal publishes it (aliases are normalised).",
            "amount": "Recommended or final amount in rupees.",
            "work_description": "Free text. Drives duplicate detection; omitting it disables that component.",
            "category": f"One of the published categories, e.g. {pack.known_categories[:4]}.",
            "mp_name": "MP name; honorifics and term years are stripped before matching.",
            "mp_key": "Conformed MP key, if already known — takes precedence over the name.",
            "house": "Lok Sabha or Rajya Sabha; improves MP matching.",
            "constituency": "Constituency label.",
            "ida": "Implementing agency label; the district is parsed from it.",
            "ida_district": "District, if already separated from the agency label.",
            "event_date": "Recommendation date (open works) or completion date. ISO-8601.",
            "as_of": "Optional reference date for the age calculation. Defaults to now.",
            "work_stage": "RECOMMENDED (default) or COMPLETED.",
            "work_id": "Optional source id, carried through to the response.",
            "has_images": "Whether photographic evidence exists.",
        },
        "reference_run": {"run_id": pack.run_id, "snapshot_date": pack.snapshot_date,
                          "states_known": len(pack.known_states),
                          "categories_known": pack.known_categories},
        "notes": [
            "Any field may be omitted; missing fields raise the data-quality component and are "
            "listed back in the response rather than guessed.",
            "Scores are risk indicators for review, never fraud determinations.",
        ],
    }
