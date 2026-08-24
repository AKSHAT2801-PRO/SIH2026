"""Central configuration loader.

Every threshold used anywhere in the platform is resolved through this module so
that analytical behaviour can be changed without touching code (critical rule 10).
"""
from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = Path(os.environ.get("MPLADS_CONFIG", ROOT / "config" / "config.yaml"))


class Config:
    """Dict-backed config with dotted access and environment overrides."""

    def __init__(self, data: dict[str, Any]):
        self._data = data

    def get(self, dotted: str, default: Any = None) -> Any:
        node: Any = self._data
        for part in dotted.split("."):
            if not isinstance(node, dict) or part not in node:
                return default
            node = node[part]
        return node

    def __getitem__(self, dotted: str) -> Any:
        value = self.get(dotted, KeyError)
        if value is KeyError:
            raise KeyError(dotted)
        return value

    @property
    def raw(self) -> dict[str, Any]:
        return self._data

    def path(self, key: str) -> Path:
        """Resolve a configured directory to an absolute path, creating it."""
        p = ROOT / self[f"paths.{key}"]
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def db_url(self) -> str:
        env = os.environ.get("MPLADS_DB_URL")
        if env:
            return env
        url = self["database.url"]
        if url.startswith("sqlite:///") and not url.startswith("sqlite:////"):
            rel = url.replace("sqlite:///", "")
            abs_path = ROOT / rel
            abs_path.parent.mkdir(parents=True, exist_ok=True)
            return f"sqlite:///{abs_path}"
        return url


@lru_cache(maxsize=1)
def get_config() -> Config:
    with open(CONFIG_PATH, "r", encoding="utf-8") as fh:
        return Config(yaml.safe_load(fh))
