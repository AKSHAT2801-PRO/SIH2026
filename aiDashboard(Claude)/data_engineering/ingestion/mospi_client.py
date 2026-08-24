"""Live client for the official MoSPI MPLADS (eSAKSHI) portal.

Design note
-----------
The portal at https://mplads.mospi.gov.in/digigov/dashboard.html is a
JavaScript single-page application: the landing document contains only the
shell, and the figures are populated from JSON service calls made by the
browser. This client therefore

  1. probes the configured candidate service paths,
  2. verifies that a response is really the MPLADS payload
     (``{"success": true, "data": {...}}``),
  3. pages through record endpoints, and
  4. returns a structured *DiscoveryResult* describing exactly what it found.

If the portal cannot be reached (network egress blocked, portal down, service
paths changed) the client reports the blocker. It never returns invented rows —
the caller then falls back to the most recent official snapshot on disk and the
fallback is written into the ingestion manifest (critical rule 38).
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any

import requests

from common.config import get_config
from common.logging_utils import get_logger, utcnow

log = get_logger("ingestion.mospi_client")


@dataclass
class DiscoveryResult:
    reachable: bool
    checked_at: str
    endpoints_probed: list[str] = field(default_factory=list)
    working_endpoints: dict[str, dict[str, Any]] = field(default_factory=dict)
    blocker: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "reachable": self.reachable,
            "checked_at": self.checked_at,
            "endpoints_probed": self.endpoints_probed,
            "working_endpoints": self.working_endpoints,
            "blocker": self.blocker,
        }


class MoSPIClient:
    def __init__(self, cfg=None):
        self.cfg = cfg or get_config()
        self.base = self.cfg["source.api.base_url"].rstrip("/")
        self.timeout = self.cfg["source.api.timeout_seconds"]
        self.max_retries = self.cfg["source.api.max_retries"]
        self.backoff = self.cfg["source.api.backoff_seconds"]
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": self.cfg["source.api.user_agent"],
            "Accept": "application/json, text/plain, */*",
        })

    # ---------------------------------------------------------------- requests
    def _get(self, path: str, params: dict | None = None) -> requests.Response | None:
        url = path if path.startswith("http") else f"{self.base}{path}"
        last_error: Exception | None = None
        for attempt in range(1, self.max_retries + 1):
            try:
                resp = self.session.get(url, params=params, timeout=self.timeout)
                if resp.status_code >= 500:
                    raise requests.HTTPError(f"HTTP {resp.status_code}")
                return resp
            except Exception as exc:  # noqa: BLE001 - retried and logged
                last_error = exc
                log.warning("GET %s failed (attempt %d/%d): %s", url, attempt, self.max_retries, exc)
                time.sleep(self.backoff * attempt)
        log.error("GET %s permanently failed: %s", url, last_error)
        return None

    @staticmethod
    def _is_mplads_payload(payload: Any) -> bool:
        return isinstance(payload, dict) and "data" in payload and payload.get("success") is not False

    # --------------------------------------------------------------- discovery
    def discover(self) -> DiscoveryResult:
        """Probe the portal and report which service endpoints actually answer."""
        result = DiscoveryResult(reachable=False, checked_at=utcnow())
        candidates = list(self.cfg["source.api.candidate_endpoints"])
        from data_engineering.ingestion.datasets import TABULAR_DATASETS
        candidates += [d.live_resource for d in TABULAR_DATASETS if d.live_resource]

        for path in candidates:
            result.endpoints_probed.append(path)
            resp = self._get(path)
            if resp is None:
                result.blocker = result.blocker or "network unreachable from this host"
                continue
            if resp.status_code != 200:
                continue
            try:
                payload = resp.json()
            except ValueError:
                continue
            if self._is_mplads_payload(payload):
                data = payload["data"]
                result.reachable = True
                result.working_endpoints[path] = {
                    "status": resp.status_code,
                    "keys": sorted(data)[:40] if isinstance(data, dict) else "list",
                    "record_count": len(data) if isinstance(data, list) else None,
                }
        if not result.reachable and not result.blocker:
            result.blocker = "no candidate endpoint returned an MPLADS JSON payload"
        return result

    # ----------------------------------------------------------------- fetches
    def fetch_summary(self) -> dict[str, Any] | None:
        for path in self.cfg["source.api.candidate_endpoints"]:
            resp = self._get(path)
            if resp is not None and resp.status_code == 200:
                try:
                    payload = resp.json()
                except ValueError:
                    continue
                if self._is_mplads_payload(payload):
                    return payload["data"]
        return None

    def fetch_records(self, resource: str, max_pages: int = 10_000) -> list[dict[str, Any]] | None:
        """Page through a record endpoint. Returns None when the portal is unreachable."""
        size = self.cfg["source.api.page_size"]
        rows: list[dict[str, Any]] = []
        for page in range(max_pages):
            resp = self._get(resource, params={"page": page, "size": size, "limit": size,
                                               "offset": page * size})
            if resp is None:
                return None if page == 0 else rows
            if resp.status_code != 200:
                return None if page == 0 else rows
            try:
                payload = resp.json()
            except ValueError:
                return None if page == 0 else rows
            data = payload.get("data") if isinstance(payload, dict) else payload
            chunk = data if isinstance(data, list) else (data or {}).get("records", [])
            if not chunk:
                break
            rows.extend(chunk)
            if len(chunk) < size:
                break
        return rows
