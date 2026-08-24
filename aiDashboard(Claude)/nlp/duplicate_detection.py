"""NLP duplicate / near-duplicate work detection (§17).

Method
------
Work descriptions on the portal are short, abbreviation-heavy, inconsistently
capitalised and frequently transliterated ("MS Pole with LED semi High Mast
Light"). Character n-gram TF-IDF is the right representation for that: it is
robust to spelling drift and word order, needs no pretrained model, and is
fully reproducible on a government machine with no model downloads.

Blocking
--------
Comparing 126,000 descriptions pairwise is 8 billion comparisons. Candidate
pairs are therefore only generated *within a block* (state by default, split by
implementing district when a state block is too large), which is also the
comparison an official actually cares about: the same work described twice in
the same place.

Every reported pair carries a similarity score and a plain-language explanation.
A near-duplicate is a *signal*, not a finding: legitimate repeated works exist
(street lighting in twenty wards is twenty genuine works).
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.neighbors import NearestNeighbors

from common.config import get_config
from common.logging_utils import get_logger

log = get_logger("nlp.duplicates")


def _blocks(df: pd.DataFrame, block_cols: list[str], max_size: int) -> list[pd.DataFrame]:
    out: list[pd.DataFrame] = []
    for _, block in df.groupby(block_cols, dropna=False):
        if len(block) <= max_size:
            out.append(block)
            continue
        for _, sub in block.groupby("ida_district", dropna=False):
            if len(sub) <= max_size:
                out.append(sub)
            else:                                    # last resort: chunk it
                for start in range(0, len(sub), max_size):
                    out.append(sub.iloc[start:start + max_size])
    return out


def find_duplicate_works(works: pd.DataFrame) -> pd.DataFrame:
    cfg = get_config()
    min_len = cfg["cleaning.min_description_length"]
    df = works[works["description_norm"].astype("string").str.len() >= min_len].copy()
    log.info("Near-duplicate search over %d works with usable descriptions", len(df))

    vec_cfg = cfg["nlp.tfidf"]
    threshold = cfg["nlp.similarity_threshold"]
    exact = cfg["nlp.exact_duplicate_threshold"]
    top_k = cfg["nlp.top_k"]

    pairs: list[dict] = []
    for block in _blocks(df, cfg["nlp.block_by"], cfg["nlp.max_block_size"]):
        if len(block) < 2:
            continue
        vectoriser = TfidfVectorizer(
            analyzer=vec_cfg["analyzer"],
            ngram_range=tuple(vec_cfg["ngram_range"]),
            min_df=vec_cfg["min_df"],
            max_features=vec_cfg["max_features"],
            dtype=np.float32,
        )
        try:
            X = vectoriser.fit_transform(block["description_norm"].astype(str))
        except ValueError:
            continue
        k = int(min(top_k + 1, len(block)))
        nn = NearestNeighbors(n_neighbors=k, metric="cosine", algorithm="brute", n_jobs=-1).fit(X)
        distances, indices = nn.kneighbors(X)
        uids = block["work_uid"].to_numpy()
        amounts = pd.to_numeric(block["amount"], errors="coerce").to_numpy()
        descs = block["work_description"].to_numpy()
        mps = block["mp_key"].to_numpy()
        mp_names = block["mp_name"].to_numpy()
        districts = block["ida_district"].to_numpy()
        states = block["state"].to_numpy()
        stages = block["work_stage"].to_numpy()

        for i in range(len(block)):
            for dist, j in zip(distances[i], indices[i]):
                if j <= i:                            # each unordered pair once
                    continue
                similarity = float(1.0 - dist)
                if similarity < threshold:
                    continue
                a_amt, b_amt = float(amounts[i]), float(amounts[j])
                gap = abs(a_amt - b_amt) / max(a_amt, b_amt, 1.0)
                match_type = ("EXACT_TEXT" if similarity >= exact else "NEAR_DUPLICATE")
                same_mp = bool(mps[i] == mps[j])
                same_district = bool(districts[i] == districts[j])
                pairs.append({
                    "left_uid": uids[i], "right_uid": uids[j],
                    "similarity": round(similarity, 4),
                    "match_type": match_type,
                    "same_mp": same_mp,
                    "same_district": same_district,
                    "state": states[i],
                    "left_description": descs[i], "right_description": descs[j],
                    "left_amount": a_amt, "right_amount": b_amt,
                    "amount_gap_pct": round(100 * gap, 2),
                    "left_stage": stages[i], "right_stage": stages[j],
                    "left_mp": mp_names[i], "right_mp": mp_names[j],
                    "explanation": _explain(similarity, match_type, same_mp, same_district, gap,
                                            stages[i], stages[j]),
                })

    result = pd.DataFrame(pairs)
    if result.empty:
        log.warning("No near-duplicate pairs above the configured threshold")
        return result
    result = result.sort_values("similarity", ascending=False).reset_index(drop=True)
    log.info("Near-duplicate pairs found: %d (%d exact text matches)",
             len(result), int((result["match_type"] == "EXACT_TEXT").sum()))
    return result


def _explain(similarity: float, match_type: str, same_mp: bool, same_district: bool,
             gap: float, left_stage: str, right_stage: str) -> str:
    parts = []
    if match_type == "EXACT_TEXT":
        parts.append("The two work descriptions are textually identical after normalisation.")
    else:
        parts.append(f"The two work descriptions are {similarity:.0%} similar after normalisation.")
    parts.append("Both works belong to the same MP." if same_mp else "The works belong to different MPs.")
    if same_district:
        parts.append("Both are handled by the same implementing district.")
    if gap < 0.02:
        parts.append("The amounts are effectively the same.")
    elif gap > 0.5:
        parts.append(f"The amounts differ by {gap:.0%}, which is unusual for identical descriptions.")
    if left_stage != right_stage:
        parts.append("One record is an open recommendation and the other is reported complete.")
    parts.append("Repeated descriptions are common for genuinely repeated works "
                 "(street lights in different wards) and are a signal for review, not a finding.")
    return " ".join(parts)


def duplicate_work_scores(pairs: pd.DataFrame, works: pd.DataFrame) -> pd.DataFrame:
    """Aggregate pairwise similarity into a per-work duplicate signal."""
    if pairs.empty:
        return pd.DataFrame({
            "work_uid": works["work_uid"], "duplicate_partner_count": 0,
            "top_duplicate_similarity": 0.0, "top_duplicate_uid": None,
            "duplicate_same_mp": False,
        }).set_index("work_uid")

    long = pd.concat([
        pairs.rename(columns={"left_uid": "work_uid", "right_uid": "partner_uid"})[
            ["work_uid", "partner_uid", "similarity", "same_mp", "amount_gap_pct"]],
        pairs.rename(columns={"right_uid": "work_uid", "left_uid": "partner_uid"})[
            ["work_uid", "partner_uid", "similarity", "same_mp", "amount_gap_pct"]],
    ], ignore_index=True)

    agg = long.groupby("work_uid").agg(
        duplicate_partner_count=("partner_uid", "nunique"),
        top_duplicate_similarity=("similarity", "max"),
        duplicate_same_mp=("same_mp", "any"),
        max_amount_gap_pct=("amount_gap_pct", "max"),
    )
    top = long.sort_values("similarity", ascending=False).groupby("work_uid")["partner_uid"].first()
    agg["top_duplicate_uid"] = top
    return agg
