#!/usr/bin/env python3
"""Rebuild the live-scoring reference pack from the artifacts of the last run.

``scripts/run_pipeline.py`` builds this automatically. Run this script on its own
when you have a completed run on disk and only want to refresh the pack — for
example after changing a threshold in config/config.yaml.

The pack is what makes a *new* record scoreable: peer statistics, district
concentration, MP context, the typical age of completed works, and the fitted
Isolation Forest, frozen together and stamped with the run they came from.
"""
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from anomaly_detection.detectors import WORK_MODEL_FEATURES, fit_isolation_forest  # noqa: E402
from common.logging_utils import get_logger  # noqa: E402
from prediction.models import train_completion_propensity  # noqa: E402
from risk_engine.scoring_pack import PACK_PATH, build_scoring_pack  # noqa: E402

log = get_logger("scripts.build_scoring_pack")
ANALYTICAL = ROOT / "data" / "analytical"


def main() -> int:
    required = ["works.parquet", "expenditures.parquet", "work_risk.parquet", "mp_risk.parquet"]
    missing = [f for f in required if not (ANALYTICAL / f).exists()]
    if missing:
        print(f"missing pipeline artifacts: {missing}\nRun scripts/run_pipeline.py first.",
              file=sys.stderr)
        return 1

    run_id = (ROOT / "outputs" / "last_run_id.txt").read_text().strip()
    works = pd.read_parquet(ANALYTICAL / "works.parquet")
    expenditures = pd.read_parquet(ANALYTICAL / "expenditures.parquet")
    # work_risk carries the engineered features alongside the scores, and mp_risk
    # carries the MP features — so the pack is built from the same numbers the
    # register was scored with, without recomputing the feature layer.
    work_features = pd.read_parquet(ANALYTICAL / "work_risk.parquet")
    mp_features = pd.read_parquet(ANALYTICAL / "mp_risk.parquet")

    log.info("Refitting the Isolation Forest on the scored population (%d works)", len(work_features))
    iforest = fit_isolation_forest(work_features, WORK_MODEL_FEATURES)

    propensity = train_completion_propensity(work_features)
    model = propensity.pop("_model", None) if propensity.get("trained") else None
    columns = propensity.pop("_columns", None) if propensity.get("trained") else None

    pack = build_scoring_pack(
        run_id=run_id, works=works, expenditures=expenditures, mp_features=mp_features,
        snapshot_ts=works["event_date"].max(),
        iforest_artifact=iforest, propensity_model=model, propensity_columns=columns,
    )
    print(f"scoring pack written: {PACK_PATH}  ({PACK_PATH.stat().st_size/1e6:.2f} MB)")
    print(f"  reference run  : {pack.run_id} (data to {pack.snapshot_date})")
    print(f"  peer cells     : {len(pack.state_category)} state×category, "
          f"{len(pack.district)} districts, {len(pack.category)} categories")
    print(f"  MP context     : {len(pack.mp_context)} MPs")
    print(f"  detectors      : isolation forest={'yes' if pack.isolation_forest else 'no'}, "
          f"propensity model={'yes' if pack.propensity_model is not None else 'no'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
