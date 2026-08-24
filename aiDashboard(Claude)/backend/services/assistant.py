"""AI analytics assistant (§26).

Contract
--------
The assistant answers **only** from the warehouse. It has two execution paths:

1. *Tool path* (always available, no LLM required): the question is matched to a
   registered analytics tool with a parameterised, reviewed SQL statement. This
   is deterministic and cannot hallucinate a number.

2. *Guarded NL→SQL path* (used when an LLM is configured through
   ``MPLADS_LLM_PROVIDER`` / ``MPLADS_LLM_API_KEY``): the model may only emit a
   SELECT, which is then validated by ``sql_guard`` before it ever reaches the
   database, and the answer is rendered from the returned rows — never from the
   model's own recollection.

If neither path can answer, the assistant says so. It never invents a statistic.
"""
from __future__ import annotations

import os
import re
from dataclasses import dataclass
from typing import Callable

import pandas as pd

from backend.database.session import query_df
from backend.services.sql_guard import SQLRejected, validate_sql
from common.logging_utils import get_logger

log = get_logger("assistant")

INJECTION_MARKERS = re.compile(
    r"(ignore (all |the )?previous|disregard .* instructions|system prompt|you are now|"
    r"drop table|delete from|update .* set|reveal .* prompt)", re.IGNORECASE)


@dataclass
class Tool:
    name: str
    description: str
    patterns: list[str]
    sql: str
    answer: Callable[[pd.DataFrame], str]


def _fmt_money(x: float) -> str:
    return f"₹{x/1e7:,.2f} crore" if abs(x) >= 1e7 else f"₹{x:,.0f}"


TOOLS: list[Tool] = [
    Tool(
        name="high_risk_districts",
        description="Districts with the most high-risk works",
        patterns=[r"district.*(high[- ]?risk|risk)", r"(high[- ]?risk).*district"],
        sql="""SELECT state, ida_district AS district, COUNT(*) AS works,
                      SUM(CASE WHEN risk_band IN ('HIGH','CRITICAL') THEN 1 ELSE 0 END) AS high_risk_works,
                      ROUND(AVG(composite_risk),2) AS mean_risk
               FROM analytics_work_risk GROUP BY state, ida_district
               HAVING works >= 20 ORDER BY high_risk_works DESC, mean_risk DESC LIMIT 15""",
        answer=lambda df: "Districts with the most high or critical risk works:\n" + "\n".join(
            f"  {i+1}. {r.district} ({r.state}) — {int(r.high_risk_works)} of {int(r.works)} works, "
            f"mean risk {r.mean_risk}" for i, r in enumerate(df.itertuples())),
    ),
    Tool(
        name="cost_anomalies",
        description="Works whose cost deviates most from comparable works",
        patterns=[r"cost anomal", r"unusually high cost", r"high(est)? cost", r"cost deviation"],
        sql="""SELECT work_uid, mp_name, state, ida_district AS district, category, amount,
                      ROUND(cost_risk,1) AS cost_risk, ROUND(composite_risk,1) AS risk, risk_band
               FROM analytics_work_risk WHERE cost_risk >= 50
               ORDER BY cost_risk DESC, amount DESC LIMIT 15""",
        answer=lambda df: "Works with the largest cost deviation from comparable official records:\n" + "\n".join(
            f"  {i+1}. {r.work_uid} — {_fmt_money(r.amount)} in {r.district}, {r.state} "
            f"(cost risk {r.cost_risk}/100, overall {r.risk}/100 {r.risk_band})"
            for i, r in enumerate(df.itertuples())),
    ),
    Tool(
        name="state_anomaly_rates",
        description="States ranked by share of high-risk works",
        patterns=[r"state.*(anomaly|risk) rate", r"which states.*(highest|most).*(risk|anomal)"],
        sql="""SELECT state, COUNT(*) AS works,
                      SUM(CASE WHEN risk_band IN ('HIGH','CRITICAL') THEN 1 ELSE 0 END) AS high_risk,
                      ROUND(100.0*SUM(CASE WHEN risk_band IN ('HIGH','CRITICAL') THEN 1 ELSE 0 END)/COUNT(*),2) AS pct
               FROM analytics_work_risk GROUP BY state HAVING works >= 100 ORDER BY pct DESC LIMIT 15""",
        answer=lambda df: "States by share of works in the high or critical risk bands:\n" + "\n".join(
            f"  {i+1}. {r.state} — {r.pct}% ({int(r.high_risk)} of {int(r.works)} works)"
            for i, r in enumerate(df.itertuples())),
    ),
    Tool(
        name="delayed_works",
        description="Works open longest without a completion record",
        patterns=[r"delay", r"stalled", r"long.?(open|pending)", r"pending works"],
        sql="""SELECT work_uid, mp_name, state, ida_district AS district, amount, age_days,
                      ROUND(delay_risk,1) AS delay_risk, ROUND(composite_risk,1) AS risk
               FROM analytics_work_risk WHERE work_stage='RECOMMENDED'
               ORDER BY age_days DESC LIMIT 15""",
        answer=lambda df: "Longest-open recommended works with no completion record:\n" + "\n".join(
            f"  {i+1}. {r.work_uid} — open {int(r.age_days)} days, {_fmt_money(r.amount)}, "
            f"{r.district}, {r.state} (delay risk {r.delay_risk}/100)" for i, r in enumerate(df.itertuples())),
    ),
    Tool(
        name="vendor_concentration",
        description="Vendors capturing the largest share of a district's payments",
        patterns=[r"vendor", r"contractor", r"supplier"],
        sql="""SELECT vendor, state, ida_district AS district, vendor_payment_lines AS lines,
                      total_amount, ROUND(district_share,3) AS district_share,
                      ROUND(composite_risk,1) AS risk, risk_band
               FROM analytics_vendor_risk WHERE composite_risk > 0
               ORDER BY composite_risk DESC LIMIT 15""",
        answer=lambda df: "Vendors with the strongest concentration signals:\n" + "\n".join(
            f"  {i+1}. {r.vendor} — {100*r.district_share:.0f}% of payments in {r.district}, "
            f"{int(r.lines)} lines, {_fmt_money(r.total_amount)} (risk {r.risk}/100 {r.risk_band})"
            for i, r in enumerate(df.itertuples())),
    ),
    Tool(
        name="duplicate_works",
        description="Near-duplicate work descriptions",
        patterns=[r"duplicate", r"similar (project|work)", r"repeated (work|description)"],
        sql="""SELECT left_uid, right_uid, ROUND(similarity,3) AS similarity, match_type, state,
                      left_description, left_amount, right_amount, amount_gap_pct
               FROM duplicate_pair ORDER BY similarity DESC, amount_gap_pct DESC LIMIT 15""",
        answer=lambda df: "Closest near-duplicate work pairs:\n" + "\n".join(
            f"  {i+1}. {r.left_uid} ↔ {r.right_uid} — {100*r.similarity:.1f}% similar ({r.match_type}), "
            f"{_fmt_money(r.left_amount)} vs {_fmt_money(r.right_amount)} in {r.state}"
            for i, r in enumerate(df.itertuples())),
    ),
    Tool(
        name="mp_utilisation",
        description="MPs with the largest unspent balances",
        patterns=[r"utilis|utiliz", r"unspent", r"fund.*(use|spend|utilis)"],
        sql="""SELECT mp_name, constituency, state, allocated_amount, derived_expenditure,
                      ROUND(utilisation_pct,2) AS utilisation_pct, ROUND(composite_risk,1) AS risk
               FROM analytics_mp_risk WHERE allocated_amount > 0
               ORDER BY utilisation_pct ASC LIMIT 15""",
        answer=lambda df: "MPs with the lowest published fund utilisation:\n" + "\n".join(
            f"  {i+1}. {r.mp_name} ({r.constituency}, {r.state}) — {r.utilisation_pct}% of "
            f"{_fmt_money(r.allocated_amount)} utilised (risk {r.risk}/100)"
            for i, r in enumerate(df.itertuples())),
    ),
    Tool(
        name="data_quality",
        description="Data quality problems in the current cycle",
        patterns=[r"data.?quality", r"missing (data|field)", r"quality (problem|issue)"],
        sql="""SELECT dataset, metric, value FROM data_quality_metric
               WHERE metric IN ('validity_rate_pct','missing_cell_pct','full_duplicate_rows',
                                'records_quarantined','overall_data_quality_pct')
               ORDER BY dataset, metric LIMIT 60""",
        answer=lambda df: "Data-quality metrics for the latest ingestion cycle:\n" + "\n".join(
            f"  {r.dataset:<20} {r.metric:<28} {r.value:,.2f}" for r in df.itertuples()),
    ),
    Tool(
        name="open_alerts",
        description="Open alerts by risk",
        patterns=[r"alert", r"warning", r"needs review", r"requires review"],
        sql="""SELECT alert_id, entity_type, entity_label, state, district,
                      ROUND(risk_score,1) AS risk_score, risk_band, status
               FROM alerts WHERE status='OPEN' ORDER BY risk_score DESC LIMIT 15""",
        answer=lambda df: "Highest-scoring open alerts:\n" + "\n".join(
            f"  {i+1}. [{r.risk_band}] {r.entity_type}: {r.entity_label} — {r.risk_score}/100 "
            f"({r.district or r.state})" for i, r in enumerate(df.itertuples())),
    ),
]


def explain_entity(entity_id: str) -> dict | None:
    """'Why was this flagged?' — returns the stored explanation, never a new one."""
    for table, key, label in (("analytics_work_risk", "work_uid", "work"),
                              ("analytics_mp_risk", "mp_key", "mp"),
                              ("analytics_vendor_risk", "vendor_uid", "vendor")):
        df = query_df(f"SELECT * FROM {table} WHERE {key} = :id LIMIT 1", {"id": entity_id})
        if len(df):
            row = df.iloc[0]
            return {"entity_type": label, "entity_id": entity_id,
                    "composite_risk": float(row["composite_risk"]), "risk_band": row["risk_band"],
                    "explanation": row["explanation"],
                    "components": {c: float(row[c]) for c in
                                   ["cost_risk", "duplicate_risk", "delay_risk", "vendor_risk",
                                    "utilisation_risk", "data_quality_risk"] if c in df.columns}}
    return None


def ask(question: str, allow_llm_sql: bool = True) -> dict:
    """Answer a question from the warehouse."""
    q = (question or "").strip()
    if not q:
        return {"answer": "Please ask a question.", "source": "none", "rows": []}
    if INJECTION_MARKERS.search(q):
        log.warning("Prompt-injection markers rejected: %r", q[:120])
        return {"answer": ("That request looks like an attempt to change how this assistant behaves, "
                           "so it was not executed. Ask a question about the MPLADS data instead."),
                "source": "rejected", "rows": []}

    # 1. explicit entity explanation
    m = re.search(r"\b((?:REC|COM)-\d+-\d+|VEN-\d{7}|[0-9a-f]{16})\b", q)
    if m and re.search(r"why|explain|flag", q, re.IGNORECASE):
        found = explain_entity(m.group(1))
        if found:
            return {"answer": f"{found['entity_type'].title()} {found['entity_id']} scores "
                              f"{found['composite_risk']}/100 ({found['risk_band']}).\n\n"
                              f"{found['explanation']}",
                    "source": "risk_engine", "entity": found, "rows": []}

    # 2. registered analytics tools
    for tool in TOOLS:
        if any(re.search(p, q, re.IGNORECASE) for p in tool.patterns):
            df = query_df(tool.sql)
            if df.empty:
                return {"answer": f"No rows matched for '{tool.name}' in the current data.",
                        "source": f"tool:{tool.name}", "sql": tool.sql, "rows": []}
            return {"answer": tool.answer(df), "source": f"tool:{tool.name}",
                    "sql": tool.sql, "rows": df.head(50).to_dict("records")}

    # 3. guarded NL->SQL, only if an LLM is configured
    if allow_llm_sql and os.environ.get("MPLADS_LLM_API_KEY"):
        try:
            sql = _llm_to_sql(q)
            safe = validate_sql(sql)
            df = query_df(safe)
            return {"answer": _render_rows(df), "source": "llm_sql", "sql": safe,
                    "rows": df.head(50).to_dict("records")}
        except SQLRejected as exc:
            return {"answer": f"The generated query was rejected by the SQL guard: {exc}",
                    "source": "rejected", "rows": []}
        except Exception as exc:  # noqa: BLE001
            log.error("assistant LLM path failed: %s", exc)

    return {"answer": ("I can only answer from the MPLADS warehouse and I could not map that question to "
                       "an available analytics tool. Try asking about districts, cost anomalies, delayed "
                       "works, vendors, duplicates, fund utilisation, data quality or open alerts."),
            "source": "no_match", "rows": [],
            "available_tools": [{"name": t.name, "description": t.description} for t in TOOLS]}


SCHEMA_PROMPT = """You translate a question about Indian MPLADS data into ONE SQLite SELECT statement.
Allowed tables and key columns:
  analytics_work_risk(work_uid, work_stage, mp_name, state, constituency, ida_district, category,
                      work_description, amount, event_date, age_days, composite_risk, risk_band,
                      cost_risk, duplicate_risk, delay_risk, vendor_risk, utilisation_risk, data_quality_risk)
  analytics_mp_risk(mp_key, mp_name, state, constituency, house, allocated_amount, derived_expenditure,
                    utilisation_pct, completion_rate_pct, composite_risk, risk_band)
  analytics_vendor_risk(vendor_uid, vendor, state, ida_district, payment_lines, total_amount,
                        district_share, composite_risk, risk_band)
  fact_expenditure(mp_name, state, vendor, ida_district, amount, event_date, payment_status)
  fact_recommended_work / fact_completed_work(work_uid, mp_name, state, category, amount, event_date)
  alerts(alert_id, entity_type, entity_label, risk_score, risk_band, status)
  data_quality_metric(dataset, metric, value)
Rules: SELECT only. No semicolons. No comments. Always add LIMIT. Return only the SQL."""


def _llm_to_sql(question: str) -> str:
    """Optional LLM call. Kept tiny and provider-agnostic; disabled without a key."""
    provider = os.environ.get("MPLADS_LLM_PROVIDER", "anthropic").lower()
    key = os.environ["MPLADS_LLM_API_KEY"]
    import json
    import urllib.request

    if provider == "anthropic":
        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages",
            data=json.dumps({
                "model": os.environ.get("MPLADS_LLM_MODEL", "claude-sonnet-4-5"),
                "max_tokens": 500,
                "system": SCHEMA_PROMPT,
                "messages": [{"role": "user", "content": question}],
            }).encode(),
            headers={"content-type": "application/json", "x-api-key": key,
                     "anthropic-version": "2023-06-01"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.loads(resp.read())
        text = "".join(part.get("text", "") for part in payload.get("content", []))
    else:
        req = urllib.request.Request(
            os.environ.get("MPLADS_LLM_URL", "https://api.openai.com/v1/chat/completions"),
            data=json.dumps({
                "model": os.environ.get("MPLADS_LLM_MODEL", "gpt-4o-mini"),
                "messages": [{"role": "system", "content": SCHEMA_PROMPT},
                             {"role": "user", "content": question}],
                "max_tokens": 500,
            }).encode(),
            headers={"content-type": "application/json", "authorization": f"Bearer {key}"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.loads(resp.read())
        text = payload["choices"][0]["message"]["content"]

    return re.sub(r"^```(?:sql)?|```$", "", text.strip(), flags=re.MULTILINE).strip()


def _render_rows(df: pd.DataFrame) -> str:
    if df.empty:
        return "The query returned no rows."
    return f"{len(df)} row(s) returned:\n" + df.head(20).to_string(index=False)
