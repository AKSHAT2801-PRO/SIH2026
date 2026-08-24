"""Structured logging + a run-scoped audit trail used for data lineage."""
from __future__ import annotations

import json
import logging
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from common.config import ROOT

_LOG_DIR = ROOT / "outputs" / "logs"
_LOG_DIR.mkdir(parents=True, exist_ok=True)


def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    logger.setLevel(os.environ.get("MPLADS_LOG_LEVEL", "INFO"))
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)-7s | %(name)-34s | %(message)s"))
    logger.addHandler(handler)
    file_handler = logging.FileHandler(_LOG_DIR / "pipeline.log")
    file_handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s"))
    logger.addHandler(file_handler)
    return logger


class RunContext:
    """Identifies one end-to-end pipeline execution.

    The run id is stamped onto every raw partition, every cleaned artefact,
    every analytical table and every risk score so that any number on the
    dashboard can be traced back to the exact source extraction (rule 40).
    """

    def __init__(self, run_id: str | None = None):
        self.run_id = run_id or f"run_{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}_{uuid.uuid4().hex[:6]}"
        self.started_at = utcnow()
        self.events: list[dict[str, Any]] = []

    def event(self, stage: str, action: str, **details: Any) -> None:
        record = {"ts": utcnow(), "run_id": self.run_id, "stage": stage, "action": action, **details}
        self.events.append(record)

    def write_audit(self, path: Path | None = None) -> Path:
        target = path or (_LOG_DIR / f"{self.run_id}_audit.jsonl")
        with open(target, "w", encoding="utf-8") as fh:
            for record in self.events:
                fh.write(json.dumps(record, default=str) + "\n")
        return target
