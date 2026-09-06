import sys
sys.path.insert(0, '.')

import pandas as pd
from data_engineering.ingestion.datasets import TABULAR_DATASETS
from data_engineering.ingestion.ingest import load_raw
from data_engineering.validation.validators import canonicalise, validate_dataset
from data_engineering.cleaning.cleaner import clean_dataset
from data_engineering.transformation.transform import build_work_level

run_id = "run_20260905T155453Z_df8eee"

frames = {}
for spec in TABULAR_DATASETS:
    if spec.name not in ["recommended_works", "completed_works"]:
        continue
    path = f"data/raw/{run_id}/{spec.name}.csv"
    raw = pd.read_csv(path, dtype=str, keep_default_na=False, na_values=[""])
    canonical = canonicalise(raw, spec)
    validated, vres = validate_dataset(canonical, spec)
    cleanable = validated[~validated["is_quarantined"]].copy()
    cleaned, cres = clean_dataset(cleanable, spec)
    frames[spec.name] = cleaned

# Use timezone-aware timestamp like the pipeline does
snapshot_ts = pd.Timestamp.max
# Get max date from the data
max_dates = []
for spec_name in ["expenditures", "recommended_works", "completed_works"]:
    if spec_name in frames:
        date_col = {"expenditures": "expenditure_date", 
                    "recommended_works": "recommendation_date",
                    "completed_works": "completed_date"}[spec_name]
        if date_col in frames[spec_name].columns:
            max_dates.append(frames[spec_name][date_col].max())

if max_dates:
    snapshot_ts = max(max_dates)
    if snapshot_ts.tz is None:
        snapshot_ts = snapshot_ts.tz_localize('UTC')
else:
    snapshot_ts = pd.Timestamp("2026-08-22", tz='UTC')

print(f"Snapshot ts: {snapshot_ts}")

works = build_work_level(frames["recommended_works"], frames["completed_works"], snapshot_ts)

with open('debug_transform_output2.txt', 'w', encoding='utf-8') as f:
    f.write(f"Total works: {len(works)}\n")
    f.write(f"Recommended: {(works['work_stage'] == 'RECOMMENDED').sum()}\n")
    f.write(f"Completed: {(works['work_stage'] == 'COMPLETED').sum()}\n")
    f.write(f"Unique work_uids: {works['work_uid'].nunique()}\n")
    f.write(f"Duplicate work_uids: {works['work_uid'].duplicated().sum()}\n")
    f.write(f"Work columns: {list(works.columns)}\n")
    
    if works['work_uid'].duplicated().any():
        dupes = works[works['work_uid'].duplicated(keep=False)].sort_values('work_uid')
        f.write(f"Duplicates:\n{dupes[['work_uid', 'work_stage', 'work_id', 'work_id_occurrence', 'is_repeated_work_id']].head(20).to_string()}\n")
    else:
        f.write("No duplicates in work_uid!\n")
    
    # Check the recommended subset
    rec_works = works[works['work_stage'] == 'RECOMMENDED']
    f.write(f"\nRecommended works subset:\n")
    f.write(f"  Rows: {len(rec_works)}\n")
    f.write(f"  Unique work_uids: {rec_works['work_uid'].nunique()}\n")
    f.write(f"  Duplicate work_uids: {rec_works['work_uid'].duplicated().sum()}\n")
    f.write(f"  work_uid nulls: {rec_works['work_uid'].isna().sum()}\n")
    
    # Check the completed subset
    com_works = works[works['work_stage'] == 'COMPLETED']
    f.write(f"\nCompleted works subset:\n")
    f.write(f"  Rows: {len(com_works)}\n")
    f.write(f"  Unique work_uids: {com_works['work_uid'].nunique()}\n")
    f.write(f"  Duplicate work_uids: {com_works['work_uid'].duplicated().sum()}\n")
    f.write(f"  work_uid nulls: {com_works['work_uid'].isna().sum()}\n")