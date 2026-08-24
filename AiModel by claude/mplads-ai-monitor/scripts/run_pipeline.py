#!/usr/bin/env python3
"""End-to-end MPLADS pipeline.

    python scripts/run_pipeline.py                 # full run, tries the live portal first
    python scripts/run_pipeline.py --offline       # skip the portal probe, use the official snapshot
    python scripts/run_pipeline.py --skip-eda      # data engineering + analytics only

Stages: discovery → ingestion → raw storage → validation → cleaning →
transformation → integration → warehouse → EDA → features → anomaly detection →
NLP duplicates → prediction → risk → alerts → dashboard payload.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from common.config import ROOT  # noqa: E402
from common.logging_utils import RunContext, get_logger  # noqa: E402
from data_analysis.eda.eda_report import run_eda  # noqa: E402
from data_engineering.pipelines import stage_analytics, stage_data_engineering  # noqa: E402

log = get_logger("pipeline.main")


def main() -> int:
    ap = argparse.ArgumentParser(description="Run the MPLADS AI monitoring pipeline")
    ap.add_argument("--offline", action="store_true",
                    help="do not probe the official portal; use the latest official snapshot")
    ap.add_argument("--skip-eda", action="store_true", help="skip the EDA report")
    ap.add_argument("--skip-dashboard", action="store_true", help="skip building the dashboard payload")
    args = ap.parse_args()

    ctx = RunContext()
    log.info("=" * 70)
    log.info("MPLADS AI monitor — run %s", ctx.run_id)
    log.info("=" * 70)

    stage1 = stage_data_engineering.run(ctx, prefer_live=not args.offline)

    if not args.skip_eda:
        run_eda(stage1["works"], stage1["expenditures"], stage1["mp_dim"],
                stage1["geo"], stage1["quality"], ctx.run_id)

    stage2 = stage_analytics.run(ctx, stage1["works"], stage1["expenditures"],
                                 stage1["mp_dim"], stage1["geo"])

    if not args.skip_dashboard:
        from data_analysis.reports.dashboard_payload import build_payload
        build_payload(ctx.run_id, stage1, stage2)

    audit = ctx.write_audit()
    (ROOT / "outputs" / "last_run_id.txt").write_text(ctx.run_id)

    log.info("=" * 70)
    log.info("Run %s complete. Audit trail: %s", ctx.run_id, audit)
    log.info("Data quality: %.2f%% | works high/critical: %d | alerts: %d",
             stage1["quality"]["scores"]["overall_data_quality_pct"],
             stage2["summary"]["works_high_or_critical"], stage2["summary"]["alerts"])
    log.info("=" * 70)
    print(json.dumps({"run_id": ctx.run_id,
                      "data_quality": stage1["quality"]["scores"],
                      "analytics": {k: v for k, v in stage2["summary"].items() if k != "prediction"}},
                     indent=2, default=str))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
