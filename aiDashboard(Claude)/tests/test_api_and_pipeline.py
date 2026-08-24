"""API and end-to-end warehouse tests.

These run against the warehouse produced by ``scripts/run_pipeline.py``. When no
warehouse is present (fresh checkout, CI without data) they skip rather than fail.
"""
from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("MPLADS_AUTH_DISABLED", "1")

from backend.api.main import app  # noqa: E402
from backend.database.session import query_df  # noqa: E402

client = TestClient(app)


def _warehouse_ready() -> bool:
    try:
        return len(query_df("SELECT 1 FROM analytics_work_risk LIMIT 1")) > 0
    except Exception:  # noqa: BLE001
        return False


needs_data = pytest.mark.skipif(not _warehouse_ready(),
                                reason="run scripts/run_pipeline.py first")


def test_health():
    assert client.get("/health").status_code in (200, 503)


@needs_data
def test_kpis_are_consistent_with_the_warehouse():
    body = client.get("/api/kpis").json()
    counted = query_df("SELECT COUNT(*) AS n FROM fact_recommended_work")["n"].iat[0]
    assert body["works_recommended"] == int(counted)
    assert 0 <= body["utilisation_pct"] <= 100


@needs_data
def test_work_detail_returns_explanation_and_comparables():
    work_uid = query_df("SELECT work_uid FROM analytics_work_risk ORDER BY composite_risk DESC "
                        "LIMIT 1")["work_uid"].iat[0]
    body = client.get(f"/api/works/{work_uid}").json()
    assert body["work"]["explanation"]
    assert "not evidence of fraud" in body["disclaimer"]
    assert isinstance(body["comparable_works"], list)


@needs_data
def test_every_high_risk_record_has_an_explanation():
    df = query_df("SELECT explanation FROM analytics_work_risk WHERE risk_band IN ('HIGH','CRITICAL')")
    assert len(df) > 0
    assert df["explanation"].notna().all()
    assert (df["explanation"].str.len() > 40).all()


@needs_data
def test_no_record_is_ever_labelled_fraudulent():
    for table, column in (("analytics_work_risk", "explanation"),
                          ("analytics_mp_risk", "explanation"),
                          ("analytics_vendor_risk", "explanation"),
                          ("alerts", "detected")):
        df = query_df(f"SELECT {column} AS text FROM {table}")
        offending = df[df["text"].astype(str).str.contains(
            r"is fraud|are fraud|fraudulent|guilty|criminal", case=False, regex=True)]
        assert offending.empty, f"{table} contains an accusatory statement"


@needs_data
def test_risk_scores_are_bounded_and_banded():
    df = query_df("SELECT composite_risk, risk_band FROM analytics_work_risk")
    assert df["composite_risk"].between(0, 100).all()
    assert set(df["risk_band"]) <= {"LOW", "MODERATE", "HIGH", "CRITICAL"}


@needs_data
def test_changing_an_alert_requires_more_than_viewer_rights():
    alert_id = query_df("SELECT alert_id FROM alerts LIMIT 1")["alert_id"].iat[0]
    resp = client.patch(f"/api/alerts/{alert_id}", json={"status": "UNDER_REVIEW"})
    assert resp.status_code == 403, "an anonymous viewer must not be able to move an alert"


@needs_data
def test_alert_lifecycle_is_auditable(monkeypatch):
    monkeypatch.setenv("MPLADS_AUTH_DISABLED", "0")
    headers = {"x-api-key": "dev-analyst-key"}
    alert_id = query_df("SELECT alert_id FROM alerts LIMIT 1")["alert_id"].iat[0]
    resp = client.patch(f"/api/alerts/{alert_id}", json={"status": "UNDER_REVIEW", "note": "test"},
                        headers=headers)
    assert resp.status_code == 200
    history = client.get(f"/api/alerts/{alert_id}/history", headers=headers).json()
    assert history and history[-1]["to_status"] == "UNDER_REVIEW"
    assert client.patch(f"/api/alerts/{alert_id}", json={"status": "NOT_A_STATE"},
                        headers=headers).status_code == 400
    client.patch(f"/api/alerts/{alert_id}", json={"status": "OPEN", "note": "revert"}, headers=headers)


@needs_data
def test_api_rejects_an_unknown_key(monkeypatch):
    monkeypatch.setenv("MPLADS_AUTH_DISABLED", "0")
    assert client.get("/api/kpis", headers={"x-api-key": "nope"}).status_code == 401


@needs_data
def test_assistant_answers_from_the_database_only():
    body = client.post("/api/assistant/query",
                       json={"question": "Which districts have the highest number of high-risk projects?"}).json()
    assert body["source"].startswith("tool:")
    assert body["rows"], "the assistant must return the rows it answered from"


@needs_data
def test_every_analytical_row_carries_its_run_id():
    for table in ("analytics_work_risk", "analytics_mp_risk", "analytics_vendor_risk", "dim_mp"):
        missing = query_df(f"SELECT COUNT(*) AS n FROM {table} WHERE run_id IS NULL")["n"].iat[0]
        assert int(missing) == 0, f"{table} has rows without lineage"
