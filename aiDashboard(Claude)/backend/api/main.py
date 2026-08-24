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
