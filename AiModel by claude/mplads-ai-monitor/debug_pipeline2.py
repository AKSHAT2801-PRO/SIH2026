import sys
sys.path.insert(0, '.')

import pandas as pd
from data_engineering.ingestion.datasets import TABULAR_DATASETS
from data_engineering.ingestion.ingest import load_raw
from data_engineering.validation.validators import canonicalise, validate_dataset
from data_engineering.cleaning.cleaner import clean_dataset

run_id = "run_20260905T155453Z_df8eee"

with open('debug_pipeline_output.txt', 'w', encoding='utf-8') as f:
    for spec in TABULAR_DATASETS:
        if spec.name not in ["recommended_works", "completed_works"]:
            continue
        path = f"data/raw/{run_id}/{spec.name}.csv"
        raw = pd.read_csv(path, dtype=str, keep_default_na=False, na_values=[""])
        f.write(f"\n=== {spec.name} ===\n")
        f.write(f"Raw shape: {raw.shape}\n")
        cols = [c.encode('ascii', 'replace').decode('ascii') for c in raw.columns]
        f.write(f"Raw columns: {cols}\n")
        
        canonical = canonicalise(raw, spec)
        f.write(f"Canonical shape: {canonical.shape}\n")
        f.write(f"Canonical columns: {list(canonical.columns)}\n")
        f.write(f"work_id in canonical: {'work_id' in canonical.columns}\n")
        
        validated, vres = validate_dataset(canonical, spec)
        cleanable = validated[~validated["is_quarantined"]].copy()
        cleaned, cres = clean_dataset(cleanable, spec)
        f.write(f"Cleaned shape: {cleaned.shape}\n")
        f.write(f"Cleaned columns: {list(cleaned.columns)}\n")
        f.write(f"work_id in cleaned: {'work_id' in cleaned.columns}\n")
        if 'work_id' in cleaned.columns:
            f.write(f"work_id sample: {cleaned['work_id'].head(10).tolist()}\n")
            f.write(f"work_id nunique: {cleaned['work_id'].nunique()}\n")
            f.write(f"work_id duplicates: {cleaned['work_id'].duplicated().sum()}\n")