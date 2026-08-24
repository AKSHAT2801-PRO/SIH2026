#!/usr/bin/env python3
"""Render the government dashboard from the pipeline's computed payload.

Two files are produced from one template:

* ``outputs/artifacts/dashboard_artifact.html`` — body-only, for publishing as a
  hosted artifact (the host supplies the document skeleton).
* ``outputs/artifacts/mplads_dashboard.html``  — a complete standalone document
  that opens offline in any browser.

No statistic is written here: everything is read from ``dashboard_payload.json``,
which the pipeline computed (critical rules 17, 37).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

TEMPLATE = ROOT / "frontend" / "dashboard_template.html"
PAYLOAD = ROOT / "outputs" / "artifacts" / "dashboard_payload.json"
ARTIFACT = ROOT / "outputs" / "artifacts" / "dashboard_artifact.html"
STANDALONE = ROOT / "outputs" / "artifacts" / "mplads_dashboard.html"


def _round(obj, dp: int = 4):
    """Round every float in the tree — six extra decimals of a rupee figure cost
    bytes on every row and change nothing an official reads."""
    if isinstance(obj, dict):
        return {k: _round(v, dp) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_round(v, dp) for v in obj]
    if isinstance(obj, float):
        return round(obj, dp)
    return obj


def compact(payload: dict) -> dict:
    """Trim the embedded extract for the hosted artifact.

    The standalone file keeps the full extract; the hosted page carries a smaller
    one so it loads quickly. Only the number of listed records changes — every
    figure, score and explanation that remains is byte-identical to the payload
    the pipeline computed.
    """
    out = _round(dict(payload))
    out["top_works"] = _round(payload["top_works"][:180])
    out["alerts"] = _round(payload["alerts"][:180])
    out["vendors"] = _round(payload["vendors"][:140])
    out["duplicate_pairs"] = _round(payload["duplicate_pairs"][:140])
    # Every MP is kept, so the utilisation-vs-completion scatter stays complete.
    # Only the written assessment is trimmed to the 200 highest-scoring MPs; the
    # dashboard renders a standard line when one is absent.
    ranked = sorted(payload["mps"], key=lambda m: -(m.get("composite_risk") or 0))
    keep = {m.get("mp_key") for m in ranked[:200]}
    out["mps"] = _round([m if m.get("mp_key") in keep else {**m, "explanation": ""}
                         for m in payload["mps"]])
    return out


def main() -> int:
    if not PAYLOAD.exists():
        print(f"payload not found: {PAYLOAD}\nRun scripts/run_pipeline.py first.", file=sys.stderr)
        return 1
    payload_text = PAYLOAD.read_text()
    full = json.loads(payload_text)               # fail loudly on a malformed payload
    compact_text = json.dumps(compact(full), separators=(",", ":"))
    # </script> inside JSON string data would close the tag early.
    payload_text = payload_text.replace("</", "<\\/")
    compact_text = compact_text.replace("</", "<\\/")

    template = TEMPLATE.read_text()
    ARTIFACT.write_text(template.replace("__PAYLOAD__", compact_text))

    body = template.replace("__PAYLOAD__", payload_text)
    STANDALONE.write_text(
        '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        + body.split("\n<style>")[0] +
        "\n<style>" + body.split("\n<style>", 1)[1].split("\n</style>", 1)[0] + "\n</style>\n</head>\n<body>\n"
        + "\n</style>".join(body.split("\n</style>")[1:]).lstrip()
        + "\n</body>\n</html>\n"
    )
    for path in (ARTIFACT, STANDALONE):
        print(f"{path.relative_to(ROOT)}  {path.stat().st_size/1e6:.2f} MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
