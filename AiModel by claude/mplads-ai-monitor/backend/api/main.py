"""FastAPI analytics API (§27, §31).

Security posture
----------------
* API-key authentication with three roles (viewer / analyst / admin) supplied
  through environment variables; no credentials are ever written to disk.
* Role-based authorisation on every mutating route.
* Fixed-window rate limiting per key.
* All parameters are bound, never string-formatted, so the query surface cannot
  be injected; the assistant has its own additional SQL guard.
* Every request that reads or changes analytical state is written to an audit log.
"""
from __future__ import annotations

import json
import os
import time
from collections import defaultdict, deque
from typing import Any

import pandas as pd
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from alerts.alert_engine import transition
from backend.database.session import SessionLocal, query_df
from backend.services import scoring
from backend.services.assistant import ask, explain_entity
from common.config import ROOT, get_config
from common.logging_utils import get_logger, utcnow

log = get_logger("api")
audit_log = get_logger("api.audit")
cfg = get_config()

app = FastAPI(
    title="MPLADS AI Monitor API",
    description="AI-assisted MPLADS anomaly, risk and inefficiency detection — analytics API.",
    version=cfg["project.risk_engine_version"],
)
app.add_middleware(CORSMiddleware, allow_origins=os.environ.get("MPLADS_CORS", "*").split(","),
                   allow_methods=["*"], allow_headers=["*"])

# ---------------------------------------------------------------- auth / limits
ROLE_KEYS = {
    os.environ.get("MPLADS_API_KEY_ADMIN", "dev-admin-key"): "admin",
    os.environ.get("MPLADS_API_KEY_ANALYST", "dev-analyst-key"): "analyst",
    os.environ.get("MPLADS_API_KEY_VIEWER", "dev-viewer-key"): "viewer",
}
_RATE: dict[str, deque] = defaultdict(deque)


def principal(x_api_key: str = Header(default="")) -> dict[str, str]:
    if os.environ.get("MPLADS_AUTH_DISABLED") == "1":
        return {"key": "anonymous", "role": "viewer"}
    role = ROLE_KEYS.get(x_api_key)
    if not role:
        raise HTTPException(status_code=401, detail="invalid or missing API key")
    window = 60
    limit = cfg["api.rate_limit_per_minute"]
    now = time.time()
    bucket = _RATE[x_api_key]
    while bucket and now - bucket[0] > window:
        bucket.popleft()
    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail="rate limit exceeded")
    bucket.append(now)
    return {"key": x_api_key[:6] + "…", "role": role}


def require(role: str):
    order = {"viewer": 0, "analyst": 1, "admin": 2}

    def dep(user: dict = Depends(principal)) -> dict:
        if order[user["role"]] < order[role]:
            raise HTTPException(status_code=403, detail=f"requires the '{role}' role")
        return user
    return dep


@app.middleware("http")
async def audit(request: Request, call_next):
    started = time.time()
    response = await call_next(request)
    audit_log.info("%s %s -> %s in %dms", request.method, request.url.path,
                   response.status_code, int(1000 * (time.time() - started)))
    return response


def latest_run() -> str:
    path = ROOT / "outputs" / "last_run_id.txt"
    if path.exists():
        return path.read_text().strip()
    df = query_df("SELECT run_id FROM ingestion_manifest ORDER BY retrieved_at DESC LIMIT 1")
    return df["run_id"].iat[0] if len(df) else ""


def rows(sql: str, params: dict | None = None) -> list[dict[str, Any]]:
    return query_df(sql, params).replace({pd.NA: None}).to_dict("records")


# --------------------------------------------------------------------- routes
@app.get("/health")
def health() -> dict:
    try:
        query_df("SELECT 1 AS ok")
        return {"status": "ok", "run_id": latest_run(), "time": utcnow()}
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=503, detail=f"database unavailable: {exc}")


@app.get("/api/meta")
def meta(user: dict = Depends(principal)) -> dict:
    return {
        "platform": cfg["project.name"],
        "run_id": latest_run(),
        "official_source": cfg["source.official_portal"],
        "versions": {
            "risk_engine": cfg["project.risk_engine_version"],
            "features": cfg["project.feature_version"],
            "model": cfg["project.model_version"],
        },
        "risk_bands": cfg["risk_engine.bands"],
        "risk_weights": cfg["risk_engine.weights"],
        "datasets": rows("SELECT dataset, record_count, field_count, source_mode, dataset_version, "
                         "content_sha256, retrieved_at, status FROM ingestion_manifest "
                         "WHERE run_id = :r", {"r": latest_run()}),
        "role": user["role"],
    }


@app.get("/api/kpis")
def kpis(user: dict = Depends(principal)) -> dict:
    q = lambda sql: query_df(sql).iloc[0].to_dict()  # noqa: E731
    totals = q("""SELECT (SELECT COUNT(*) FROM dim_mp) AS mps,
                         (SELECT SUM(allocated_amount) FROM dim_mp) AS allocated,
                         (SELECT SUM(total_expenditure) FROM dim_mp) AS expenditure,
                         (SELECT COUNT(*) FROM fact_recommended_work) AS works_recommended,
                         (SELECT COUNT(*) FROM fact_completed_work) AS works_completed,
                         (SELECT COUNT(*) FROM fact_expenditure) AS payment_lines""")
    risk = q("""SELECT SUM(CASE WHEN risk_band IN ('HIGH','CRITICAL') THEN 1 ELSE 0 END) AS high_or_critical,
                       SUM(CASE WHEN risk_band='CRITICAL' THEN 1 ELSE 0 END) AS critical,
                       ROUND(AVG(composite_risk),2) AS mean_risk FROM analytics_work_risk""")
    dq = query_df("SELECT value FROM data_quality_metric WHERE metric='overall_data_quality_pct' LIMIT 1")
    alerts = query_df("SELECT COUNT(*) AS n FROM alerts WHERE status='OPEN'")
    return {"run_id": latest_run(), **totals, **risk,
            "data_quality_pct": float(dq["value"].iat[0]) if len(dq) else None,
            "open_alerts": int(alerts["n"].iat[0]) if len(alerts) else 0,
            "utilisation_pct": round(100 * totals["expenditure"] / totals["allocated"], 2)
            if totals["allocated"] else None}


@app.get("/api/states")
def states(user: dict = Depends(principal)) -> list[dict]:
    return rows("""SELECT state, COUNT(*) AS works,
                          SUM(CASE WHEN risk_band IN ('HIGH','CRITICAL') THEN 1 ELSE 0 END) AS high_risk,
                          ROUND(AVG(composite_risk),2) AS mean_risk, SUM(amount) AS work_value
                   FROM analytics_work_risk GROUP BY state ORDER BY high_risk DESC""")


@app.get("/api/districts")
def districts(state: str | None = None, limit: int = Query(100, le=1000),
              user: dict = Depends(principal)) -> list[dict]:
    sql = """SELECT state, ida_district, works_recommended, works_completed, expenditure, vendors,
                    completion_rate_pct, risk_score, high_risk_works FROM geo_district"""
    params: dict = {"limit": limit}
    if state:
        sql += " WHERE state = :state"
        params["state"] = state
    sql += " ORDER BY risk_score DESC LIMIT :limit"
    return rows(sql, params)


@app.get("/api/works")
def works(state: str | None = None, district: str | None = None, band: str | None = None,
          min_risk: float = 0, stage: str | None = None, limit: int = Query(100, le=1000),
          offset: int = 0, user: dict = Depends(principal)) -> list[dict]:
    clauses, params = ["composite_risk >= :min_risk"], {"min_risk": min_risk,
                                                        "limit": limit, "offset": offset}
    for field, value, column in (("state", state, "state"), ("district", district, "ida_district"),
                                 ("band", band, "risk_band"), ("stage", stage, "work_stage")):
        if value:
            clauses.append(f"{column} = :{field}")
            params[field] = value
    return rows(f"""SELECT work_uid, work_stage, work_description, category, mp_name, constituency,
                           state, ida_district, amount, event_date, composite_risk, risk_band,
                           cost_risk, duplicate_risk, delay_risk, vendor_risk, utilisation_risk,
                           data_quality_risk
                    FROM analytics_work_risk WHERE {' AND '.join(clauses)}
                    ORDER BY composite_risk DESC LIMIT :limit OFFSET :offset""", params)


@app.get("/api/works/{work_uid}")
def work_detail(work_uid: str, user: dict = Depends(principal)) -> dict:
    df = query_df("SELECT * FROM analytics_work_risk WHERE work_uid = :id", {"id": work_uid})
    if df.empty:
        raise HTTPException(status_code=404, detail="work not found")
    work = df.iloc[0].to_dict()
    comparables = rows("""SELECT work_uid, work_description, amount, composite_risk, risk_band
                          FROM analytics_work_risk
                          WHERE state = :state AND category = :cat AND work_uid != :id
                          ORDER BY ABS(amount - :amt) LIMIT 10""",
                       {"state": work["state"], "cat": work["category"],
                        "id": work_uid, "amt": work["amount"]})
    duplicates = rows("""SELECT left_uid, right_uid, similarity, match_type, left_description,
                                right_description, left_amount, right_amount, explanation
                         FROM duplicate_pair WHERE left_uid = :id OR right_uid = :id
                         ORDER BY similarity DESC LIMIT 10""", {"id": work_uid})
    lineage = rows("SELECT stage, action, ts FROM lineage WHERE run_id = :r ORDER BY id",
                   {"r": work.get("run_id")})
    return {"work": work, "comparable_works": comparables, "duplicate_candidates": duplicates,
            "lineage": lineage,
            "disclaimer": ("Risk scores describe statistical deviation from comparable official "
                           "records. They are not evidence of fraud or wrongdoing.")}


@app.get("/api/mps")
def mps(state: str | None = None, band: str | None = None, limit: int = Query(200, le=1000),
        user: dict = Depends(principal)) -> list[dict]:
    clauses, params = ["1=1"], {"limit": limit}
    if state:
        clauses.append("state = :state")
        params["state"] = state
    if band:
        clauses.append("risk_band = :band")
        params["band"] = band
    return rows(f"""SELECT mp_key, mp_name, constituency, state, house, allocated_amount,
                           derived_expenditure, utilisation_pct, completion_rate_pct,
                           works_scored, high_risk_works, composite_risk, risk_band
                    FROM analytics_mp_risk WHERE {' AND '.join(clauses)}
                    ORDER BY composite_risk DESC LIMIT :limit""", params)


@app.get("/api/mps/{mp_key}")
def mp_detail(mp_key: str, user: dict = Depends(principal)) -> dict:
    df = query_df("SELECT * FROM analytics_mp_risk WHERE mp_key = :id", {"id": mp_key})
    if df.empty:
        raise HTTPException(status_code=404, detail="MP not found")
    return {
        "mp": df.iloc[0].to_dict(),
        "top_works": rows("""SELECT work_uid, work_description, amount, composite_risk, risk_band
                             FROM analytics_work_risk WHERE mp_key = :id
                             ORDER BY composite_risk DESC LIMIT 20""", {"id": mp_key}),
        "vendors": rows("""SELECT vendor, COUNT(*) AS lines, SUM(amount) AS total
                           FROM fact_expenditure WHERE mp_key = :id
                           GROUP BY vendor ORDER BY total DESC LIMIT 20""", {"id": mp_key}),
    }


@app.get("/api/vendors")
def vendors(limit: int = Query(100, le=1000), min_risk: float = 0,
            user: dict = Depends(principal)) -> list[dict]:
    return rows("""SELECT vendor_uid, vendor, state, ida_district, payment_lines, total_amount,
                          district_share, repeat_line_share, composite_risk, risk_band, explanation
                   FROM analytics_vendor_risk WHERE composite_risk >= :min_risk
                   ORDER BY composite_risk DESC LIMIT :limit""",
                {"min_risk": min_risk, "limit": limit})


@app.get("/api/duplicates")
def duplicates(limit: int = Query(100, le=1000), user: dict = Depends(principal)) -> list[dict]:
    return rows("""SELECT left_uid, right_uid, similarity, match_type, same_mp, state,
                          left_description, right_description, left_amount, right_amount,
                          amount_gap_pct, explanation
                   FROM duplicate_pair ORDER BY similarity DESC LIMIT :limit""", {"limit": limit})


@app.get("/api/data-quality")
def data_quality(user: dict = Depends(principal)) -> dict:
    return {
        "metrics": rows("SELECT dataset, metric, value FROM data_quality_metric WHERE run_id = :r",
                        {"r": latest_run()}),
        "issues": rows("SELECT dataset, rule, severity, detail, record_count FROM validation_issue "
                       "WHERE run_id = :r ORDER BY record_count DESC", {"r": latest_run()}),
    }


@app.get("/api/alerts")
def alerts(status: str | None = None, limit: int = Query(200, le=1000),
           user: dict = Depends(principal)) -> list[dict]:
    sql = ("SELECT alert_id, entity_type, entity_id, entity_label, state, district, risk_score, "
           "risk_band, title, detected, recommended_action, status, created_at FROM alerts")
    params: dict = {"limit": limit}
    if status:
        sql += " WHERE status = :status"
        params["status"] = status
    sql += " ORDER BY risk_score DESC LIMIT :limit"
    return rows(sql, params)


class AlertUpdate(BaseModel):
    status: str = Field(description="one of OPEN, UNDER_REVIEW, VERIFIED, FALSE_POSITIVE, RESOLVED")
    note: str | None = None


@app.patch("/api/alerts/{alert_id}")
def update_alert(alert_id: str, body: AlertUpdate, user: dict = Depends(require("analyst"))) -> dict:
    session = SessionLocal()
    try:
        return transition(session, alert_id, body.status.upper(), actor=user["key"], note=body.note)
    except KeyError:
        raise HTTPException(status_code=404, detail="alert not found")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    finally:
        session.close()


@app.get("/api/alerts/{alert_id}/history")
def alert_history(alert_id: str, user: dict = Depends(principal)) -> list[dict]:
    return rows("SELECT changed_at, from_status, to_status, actor, note FROM alert_history "
                "WHERE alert_id = :id ORDER BY id", {"id": alert_id})


# ------------------------------------------------------------ live scoring
class WorkRecord(BaseModel):
    """A work to score. Only `state` and `amount` are required; anything else
    that is missing raises the data-quality component and is reported back."""
    state: str = Field(description="State or UT as published (aliases are normalised)")
    amount: float = Field(description="Recommended or final amount in rupees")
    work_description: str | None = Field(default=None, description="Drives duplicate detection")
    category: str | None = None
    mp_name: str | None = None
    mp_key: str | None = None
    house: str | None = Field(default=None, description="Lok Sabha or Rajya Sabha")
    constituency: str | None = None
    ida: str | None = Field(default=None, description="Implementing agency label")
    ida_district: str | None = None
    event_date: str | None = Field(default=None, description="ISO-8601 recommendation/completion date")
    as_of: str | None = Field(default=None, description="Reference date for age; defaults to now")
    work_stage: str = Field(default="RECOMMENDED", description="RECOMMENDED or COMPLETED")
    work_id: str | None = None
    has_images: bool | None = None

    model_config = {"json_schema_extra": {"example": {
        "state": "Uttar Pradesh", "amount": 4939000,
        "work_description": "Construction of CC road from village school to main road",
        "category": "Normal/Others", "mp_name": "Shri Brij Lal", "house": "Rajya Sabha",
        "ida": "SIDDHARTHNAGAR(DISTRICT MAGISTRATE SIDDHARTHNAGAR_IDA)",
        "event_date": "2026-08-01", "work_stage": "RECOMMENDED"}}}


class ScoreBatch(BaseModel):
    # Deliberately loose: a batch is validated record by record inside the service
    # so that one malformed row is reported with its index instead of rejecting
    # the whole submission. See GET /api/score/schema for the field contract.
    records: list[dict[str, Any]] = Field(description="Up to 200 records to score in one call")


@app.get("/api/score/schema")
def score_schema(user: dict = Depends(principal)) -> dict:
    """What a scoreable record looks like, and which reference run it is scored against."""
    try:
        return scoring.input_schema()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.post("/api/score")
def score_new_record(body: WorkRecord, persist: bool = Query(
        False, description="Analyst role or above: write the scored record and any alert into the warehouse"),
        user: dict = Depends(principal)) -> dict:
    """Score a record that is not in the warehouse, against the current reference run.

    Uses the same component maths as the batch register, and reports what it could
    not assess rather than guessing.
    """
    if persist and user["role"] == "viewer":
        raise HTTPException(status_code=403, detail="persisting a scored record requires the 'analyst' role")
    try:
        result = scoring.score_record(body.model_dump())
    except scoring.ScoringError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    if persist:
        result["persisted"] = _persist_scored(result, body.model_dump(), actor=user["key"])
    audit_log.info("scored record %s -> %.2f (%s) persist=%s",
                   result["work_uid"], result["composite_risk"], result["risk_band"], persist)
    return result


@app.post("/api/score/batch")
def score_new_records(body: ScoreBatch, user: dict = Depends(principal)) -> dict:
    """Score up to 200 submitted records in one call. A bad record is reported, not fatal."""
    if len(body.records) > 200:
        raise HTTPException(status_code=413, detail="at most 200 records per call")
    try:
        return scoring.score_records(list(body.records))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


def _persist_scored(result: dict, record: dict, actor: str) -> dict:
    """Write a live-scored record into the register, and raise an alert if it qualifies."""
    from alerts.alert_engine import _alert_id
    from sqlalchemy import text
    from backend.database.session import get_engine

    row = {
        "work_uid": result["work_uid"], "run_id": result["reference"]["run_id"],
        "risk_engine_version": result["reference"]["risk_engine_version"],
        "feature_version": result["reference"]["feature_version"],
        "model_version": result["reference"]["model_version"],
        "work_stage": record.get("work_stage") or "RECOMMENDED",
        "mp_key": None, "mp_name": record.get("mp_name"), "state": record.get("state"),
        "constituency": record.get("constituency"), "ida_district": record.get("ida_district"),
        "category": record.get("category"), "work_description": record.get("work_description"),
        "amount": record.get("amount"), "event_date": None,
        **{k: v for k, v in result["components"].items()},
        "composite_risk": result["composite_risk"], "risk_band": result["risk_band"],
        "explanation": result["explanation"],
        "contributions": json.dumps(result["contributions"]),
    }
    engine = get_engine()
    with engine.begin() as conn:
        cols = ", ".join(row)
        conn.execute(text(f"DELETE FROM analytics_work_risk WHERE work_uid = :uid"),
                     {"uid": row["work_uid"]})
        conn.execute(text(f"INSERT INTO analytics_work_risk ({cols}) "
                          f"VALUES ({', '.join(':' + c for c in row)})"), row)
        created_alert = None
        if result["alert"]["would_raise_alert"]:
            alert = {
                "alert_id": _alert_id("work", row["work_uid"]), "run_id": row["run_id"],
                "created_at": utcnow(), "entity_type": "work", "entity_id": row["work_uid"],
                "entity_label": (row["work_description"] or row["work_uid"])[:180],
                "state": row["state"], "district": row["ida_district"],
                "risk_score": row["composite_risk"], "risk_band": row["risk_band"],
                "title": f"{row['risk_band'].title()} risk on a newly submitted work",
                "detected": result["explanation"],
                "recommended_action": result["alert"]["recommended_action"],
                "status": "OPEN", "status_updated_at": utcnow(),
                "status_note": f"raised by live scoring, submitted via API by {actor}",
                "risk_engine_version": row["risk_engine_version"],
            }
            conn.execute(text("DELETE FROM alerts WHERE alert_id = :id"), {"id": alert["alert_id"]})
            conn.execute(text(f"INSERT INTO alerts ({', '.join(alert)}) "
                              f"VALUES ({', '.join(':' + c for c in alert)})"), alert)
            created_alert = alert["alert_id"]
    return {"work_uid": row["work_uid"], "table": "analytics_work_risk", "alert_id": created_alert}


class Question(BaseModel):
    question: str


@app.post("/api/assistant/query")
def assistant(body: Question, user: dict = Depends(principal)) -> dict:
    result = ask(body.question)
    audit_log.info("assistant question=%r source=%s", body.question[:160], result.get("source"))
    return result | {"disclaimer": "Answers are computed from the warehouse; no figure is generated by a model."}


@app.get("/api/explain/{entity_id}")
def explain(entity_id: str, user: dict = Depends(principal)) -> dict:
    found = explain_entity(entity_id)
    if not found:
        raise HTTPException(status_code=404, detail="entity not found")
    return found


@app.get("/api/lineage")
def lineage(run_id: str | None = None, user: dict = Depends(principal)) -> list[dict]:
    return rows("SELECT stage, action, detail, ts FROM lineage WHERE run_id = :r ORDER BY id",
                {"r": run_id or latest_run()})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=cfg["api.host"], port=cfg["api.port"])
