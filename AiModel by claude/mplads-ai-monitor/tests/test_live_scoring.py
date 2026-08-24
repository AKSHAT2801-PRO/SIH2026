"""Tests for live scoring of records that are not in the warehouse.

The important guarantee is *equivalence*: a record scored through the API must
get the same components as the batch register, because both call the same
functions. These tests assert that on real scored records.
"""
from __future__ import annotations

import os

import pandas as pd
import pytest

os.environ.setdefault("MPLADS_AUTH_DISABLED", "1")

from common.config import ROOT, get_config  # noqa: E402
from risk_engine.engine import WORK_COMPONENTS, band_of  # noqa: E402

PACK = ROOT / "outputs" / "models" / "scoring_pack.joblib"
WORK_RISK = ROOT / "data" / "analytical" / "work_risk.parquet"

needs_pack = pytest.mark.skipif(
    not (PACK.exists() and WORK_RISK.exists()),
    reason="run scripts/run_pipeline.py (or scripts/build_scoring_pack.py) first")


@pytest.fixture(scope="module")
def scoring():
    from backend.services import scoring as module
    return module


@pytest.fixture(scope="module")
def register() -> pd.DataFrame:
    return pd.read_parquet(WORK_RISK)


# ------------------------------------------------------------------ banding
@pytest.mark.parametrize("score,band", [
    (0, "LOW"), (24.9, "LOW"), (25, "MODERATE"), (49.6, "MODERATE"),
    (50, "HIGH"), (74.6, "HIGH"), (75, "CRITICAL"), (100, "CRITICAL"),
])
def test_no_score_falls_between_two_bands(score, band):
    """Regression: integer band edges must not leave 49.6 or 74.6 unbanded."""
    assert band_of(score, get_config()) == band


# ------------------------------------------------------------------ contract
@needs_pack
def test_a_record_missing_everything_optional_still_scores(scoring):
    result = scoring.score_record({"state": "Bihar", "amount": 250_000})
    assert 0 <= result["composite_risk"] <= 100
    assert result["risk_band"] in {"LOW", "MODERATE", "HIGH", "CRITICAL"}
    # It must say what it could not assess rather than quietly guessing.
    assert result["data_quality"]["fields_missing"]
    assert any("duplicate detection" in w for w in result["data_quality"]["warnings"])


@needs_pack
def test_required_fields_are_enforced(scoring):
    with pytest.raises(scoring.ScoringError):
        scoring.score_record({"amount": 100000})
    with pytest.raises(scoring.ScoringError):
        scoring.score_record({"state": "Bihar", "amount": -5})
    with pytest.raises(scoring.ScoringError):
        scoring.score_record({"state": "Bihar", "amount": 1000, "event_date": "2099-01-01"})


@needs_pack
def test_scoring_is_deterministic(scoring):
    record = {"state": "Kerala", "amount": 900_000, "category": "Normal/Others",
              "work_description": "Construction of community hall in ward 3",
              "event_date": "2025-06-01"}
    a = scoring.score_record(record)
    b = scoring.score_record(record)
    assert a["composite_risk"] == b["composite_risk"]
    assert a["components"] == b["components"]


@needs_pack
def test_response_never_asserts_fraud(scoring):
    result = scoring.score_record({
        "state": "Uttar Pradesh", "amount": 90_000_000,
        "work_description": "letter as per attached.", "category": "Normal/Others",
        "event_date": "2024-01-01"})
    text = result["explanation"] + result["disclaimer"]
    assert "not evidence of fraud" in text
    assert not any(word in text.lower() for word in ("is fraud", "fraudulent", "guilty"))


@needs_pack
def test_reference_run_is_reported(scoring):
    result = scoring.score_record({"state": "Bihar", "amount": 250_000})
    ref = result["reference"]
    assert ref["run_id"] and ref["snapshot_date"] and ref["risk_engine_version"]


# -------------------------------------------------------------- equivalence
@needs_pack
def test_live_score_matches_the_batch_register(scoring, register):
    """Re-scoring published works through the live path reproduces the register.

    Small deltas are expected and legitimate: the live path excludes the record
    itself from the duplicate corpus and cannot run LOF/DBSCAN on one point.
    """
    sample = register[register["work_stage"] == "RECOMMENDED"].nlargest(5, "composite_risk")
    deltas = []
    for _, w in sample.iterrows():
        live = scoring.score_record({
            "state": w["state"], "amount": float(w["amount"]),
            "work_description": w["work_description"], "category": w["category"],
            "mp_key": w["mp_key"], "mp_name": w["mp_name"], "constituency": w["constituency"],
            "ida_district": w["ida_district"], "ida": "reference",
            "event_date": str(pd.Timestamp(w["event_date"]).date()),
            "as_of": "2026-08-21", "work_stage": w["work_stage"],
            # Every published field is supplied, so the data-quality component
            # measures the same thing on both paths.
            "house": w.get("house") or "Lok Sabha",
        }, exclude_uid=w["work_uid"])
        for component in WORK_COMPONENTS:
            assert abs(live["components"][component] - float(w[component])) <= 5.0, component
        deltas.append(abs(live["composite_risk"] - float(w["composite_risk"])))
    assert max(deltas) <= 3.0, f"live scores drifted from the register: {deltas}"


@needs_pack
def test_a_grossly_overpriced_duplicate_outranks_an_ordinary_work(scoring):
    ordinary = scoring.score_record({
        "state": "Uttar Pradesh", "amount": 400_000, "category": "Normal/Others",
        "work_description": "Construction of CC road from primary school to main road",
        "event_date": "2026-08-01"})
    extreme = scoring.score_record({
        "state": "Uttar Pradesh", "amount": 60_000_000, "category": "Normal/Others",
        "work_description": "letter as per attached.", "event_date": "2024-01-01"})
    assert extreme["composite_risk"] > ordinary["composite_risk"] + 20
    assert extreme["components"]["cost_risk"] > ordinary["components"]["cost_risk"]
    assert extreme["alert"]["would_raise_alert"] is True


@needs_pack
def test_batch_endpoint_reports_bad_records_without_failing(scoring):
    out = scoring.score_records([
        {"state": "Bihar", "amount": 250_000},
        {"amount": 100},                                   # missing state
        {"state": "Kerala", "amount": "not a number"},      # unparseable
    ])
    assert out["summary"]["scored"] == 1
    assert out["summary"]["rejected"] == 2
    assert all("error" in r for r in out["rejected"])


# --------------------------------------------------------------------- API
@needs_pack
def test_api_scores_and_documents_itself():
    from fastapi.testclient import TestClient
    from backend.api.main import app
    client = TestClient(app)

    schema = client.get("/api/score/schema")
    assert schema.status_code == 200
    assert "state" in schema.json()["required"]

    resp = client.post("/api/score", json={
        "state": "Uttar Pradesh", "amount": 4_939_000,
        "work_description": "Construction of CC road from village school to main road",
        "category": "Normal/Others", "event_date": "2026-08-01"})
    assert resp.status_code == 200
    body = resp.json()
    assert set(body["components"]) == set(WORK_COMPONENTS)
    assert body["explanation"] and body["reference"]["run_id"]

    bad = client.post("/api/score", json={"state": "Bihar", "amount": -1})
    assert bad.status_code == 422

    # A viewer may score, but may not write the result into the register.
    assert client.post("/api/score?persist=true", json={
        "state": "Bihar", "amount": 250_000}).status_code == 403
