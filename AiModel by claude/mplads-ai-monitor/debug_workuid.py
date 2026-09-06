import sys
sys.path.insert(0, '.')

import pandas as pd
from data_engineering.validation.validators import canonicalise, validate_dataset
from data_engineering.cleaning.cleaner import clean_dataset
from data_engineering.transformation.transform import build_work_level
from data_engineering.ingestion.datasets import TABULAR_DATASETS

# Use the latest run directory
run_id = "run_20260905T155453Z_df8eee"

frames = {}
for spec in TABULAR_DATASETS:
    path = f"data/raw/{run_id}/{spec.name}.csv"
    raw = pd.read_csv(path, dtype=str, keep_default_na=False, na_values=[""])
    canonical = canonicalise(raw, spec)
    validated, vres = validate_dataset(canonical, spec)
    cleanable = validated[~validated["is_quarantined"]].copy()
    cleaned, cres = clean_dataset(cleanable, spec)
    frames[spec.name] = cleaned
    print(f"{spec.name}: {len(cleaned)} rows")

# Use a fixed snapshot timestamp
snapshot_ts = pd.Timestamp("2026-08-22")
works = build_work_level(frames["recommended_works"], frames["completed_works"], snapshot_ts)
print(f"Total works: {len(works)}")
print(f"Recommended: {(works['work_stage'] == 'RECOMMENDED').sum()}")
print(f"Completed: {(works['work_stage'] == 'COMPLETED').sum()}")
print(f"Unique work_uids: {works['work_uid'].nunique()}")
print(f"Duplicate work_uids: {works['work_uid'].duplicated().sum()}")

if works['work_uid'].duplicated().any():
    dupes = works[works['work_uid'].duplicated(keep=False)].sort_values('work_uid')
    print(dupes[['work_uid', 'work_stage', 'work_id', 'work_id_occurrence', 'is_repeated_work_id']].head(20))