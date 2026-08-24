"""SQL guard for the analytics assistant (§26, §31).

Any statement the assistant wants to run must survive every check here:
  * exactly one statement, no semicolon chaining
  * SELECT (or WITH ... SELECT) only — no DDL, DML, PRAGMA or ATTACH
  * only whitelisted tables from config
  * no comment markers, no sub-select into forbidden tables
  * a LIMIT is injected if absent

The guard is deliberately a whitelist: unknown syntax is rejected, not repaired.
"""
from __future__ import annotations

import re

from common.config import get_config

FORBIDDEN = re.compile(
    r"\b(insert|update|delete|drop|alter|create|replace|truncate|grant|revoke|attach|detach|"
    r"pragma|vacuum|reindex|copy|into\s+outfile|load_extension)\b", re.IGNORECASE)
COMMENTS = re.compile(r"(--|/\*|\*/|#)")
TABLE_REF = re.compile(r"\b(?:from|join)\s+([A-Za-z_][A-Za-z0-9_]*)", re.IGNORECASE)


class SQLRejected(ValueError):
    """Raised when a statement fails validation. The message is shown to the user."""


def validate_sql(sql: str) -> str:
    cfg = get_config()
    allowed = set(cfg["api.assistant_allowed_tables"])
    max_rows = cfg["api.assistant_max_rows"]

    text = sql.strip().rstrip(";").strip()
    if not text:
        raise SQLRejected("empty statement")
    if ";" in text:
        raise SQLRejected("multiple statements are not allowed")
    if COMMENTS.search(text):
        raise SQLRejected("SQL comments are not allowed")
    if not re.match(r"^(select|with)\b", text, re.IGNORECASE):
        raise SQLRejected("only SELECT queries are allowed")
    if FORBIDDEN.search(text):
        raise SQLRejected("the statement contains a forbidden keyword")

    referenced = {t.lower() for t in TABLE_REF.findall(text)}
    cte_names = {m.lower() for m in re.findall(r"\b([A-Za-z_][A-Za-z0-9_]*)\s+as\s*\(", text, re.IGNORECASE)}
    illegal = referenced - allowed - cte_names
    if illegal:
        raise SQLRejected(f"these tables are not accessible to the assistant: {sorted(illegal)}")
    if not (referenced & allowed):
        raise SQLRejected("the statement does not read any allowed analytics table")

    if not re.search(r"\blimit\s+\d+", text, re.IGNORECASE):
        text = f"{text} LIMIT {max_rows}"
    return text
