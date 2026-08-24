#!/usr/bin/env python3
"""Score one or more proposed works from the command line.

    python scripts/score_record.py record.json          # a single record, or a JSON array
    echo '{"state":"Bihar","amount":250000}' | python scripts/score_record.py -
    python scripts/score_record.py record.json --json   # full response instead of the summary

Uses the same service the API uses, so the score matches what /api/score returns.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from backend.services import scoring  # noqa: E402


def render(result: dict) -> str:
    lines = [
        "=" * 78,
        f"{result['risk_band']}  —  composite risk {result['composite_risk']}/100",
        "=" * 78,
        "",
        "Components",
    ]
    for name, value in result["components"].items():
        bar = "█" * int(round(value / 5))
        lines.append(f"  {name.replace('_', ' '):<22} {value:6.2f}  {bar}")
    lines += ["", "Why", "  " + result["explanation"].replace(". ", ".\n  "), ""]

    ev = result["evidence"]
    lines += [
        "Evidence",
        f"  peer group            {ev['peer_group']} ({ev['peer_group_size']:,} works"
        f"{', thin group' if ev['peer_group_thin'] else ''})",
        f"  peer median amount    ₹{ev['peer_median_amount']:,.0f}",
        f"  ratio to peer median  {ev['ratio_to_peer_median']}×"
        if ev.get("ratio_to_peer_median") is not None else "  ratio to peer median  n/a",
        f"  robust z vs peers     {ev['robust_z_vs_peers']}",
        f"  age                   {ev['age_days']} days (typical completed work: "
        f"{ev['typical_completed_age_days']})" if ev.get("age_days") is not None else
        "  age                   not supplied",
    ]
    if ev["similar_published_works"]:
        lines.append("  similar published works")
        for m in ev["similar_published_works"][:3]:
            lines.append(f"      {m['similarity']:.0%}  {m['work_uid']}  ₹{m['amount']:,.0f}  "
                         f"{str(m['work_description'])[:60]}")
    if result["data_quality"]["fields_missing"]:
        lines += ["", "Not assessed",
                  "  missing fields: " + ", ".join(result["data_quality"]["fields_missing"])]
        for warning in result["data_quality"]["warnings"]:
            lines.append(f"  • {warning}")
    alert = result["alert"]
    lines += ["", f"Alert: {'YES' if alert['would_raise_alert'] else 'no'} "
                  f"(threshold {alert['threshold']}/100)",
              f"  {alert['recommended_action']}", "",
              f"Scored against run {result['reference']['run_id']} "
              f"(data to {result['reference']['snapshot_date']}, "
              f"{result['reference']['population_compared_against']:,} works in this state)",
              "", result["disclaimer"], ""]
    return "\n".join(lines)


def main() -> int:
    ap = argparse.ArgumentParser(description="Score a proposed MPLADS work")
    ap.add_argument("path", help="JSON file with one record or an array of records ('-' for stdin)")
    ap.add_argument("--json", action="store_true", help="print the full JSON response")
    args = ap.parse_args()

    raw = sys.stdin.read() if args.path == "-" else Path(args.path).read_text()
    payload = json.loads(raw)
    records = payload if isinstance(payload, list) else [payload]

    try:
        out = scoring.score_records(records)
    except FileNotFoundError as exc:
        print(exc, file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(out, indent=2, default=str))
        return 0 if not out["rejected"] else 1

    for result in out["scored"]:
        print(render(result))
    for bad in out["rejected"]:
        print(f"record {bad['index']} could not be scored: {bad['error']}", file=sys.stderr)
    if len(records) > 1:
        s = out["summary"]
        print(f"{s['scored']} scored, {s['rejected']} rejected, "
              f"{s['high_or_critical']} high or critical, {s['would_raise_alerts']} would alert")
    return 0 if not out["rejected"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
