import sys
sys.path.insert(0, '.')

import pandas as pd
from data_engineering.ingestion.datasets import TABULAR_DATASETS
from data_engineering.ingestion.ingest import load_raw
from data_engineering.validation.validators import canonicalise, validate_dataset
from data_engineering.cleaning.cleaner import clean_dataset

run_id = "run_20260905T155453Z_df8eee"

for spec in TABULAR_DATASETS:
    if spec.name not in ["recommended_works", "completed_works"]:
        continue
    path = f"data/raw/{run_id}/{spec.name}.csv"
    raw = pd.read_csv(path, dtype=str, keep_default_na=False, na_values=[""])
    print(f"\n=== {spec.name} ===")
    print(f"Raw shape: {raw.shape}")
    print(f"Raw columns: {list(raw.columns)}")
    
    canonical = canonicalise(raw, spec)
    print(f"Canonical shape: {canonical.shape}")
    print(f"Canonical columns: {list(canonical.columns)}")
    print(f"work_id in canonical: {'work_id' in canonical.columns}")
    
    validated, vres = validate_dataset(canonical, spec)
    cleanable = validated[~validated["is_quarantined"]].copy()
    cleaned, cres = clean_dataset(cleanable, spec)
    print(f"Cleaned shape: {cleaned.shape}")
    print(f"Cleaned columns: {list(cleaned.columns)}")
    print(f"work_id in cleaned: {'work_id' in cleaned.columns}")
    if 'work_id' in cleaned.columns:
        print(f"work_id sample: {cleaned['work_id'].head(10).tolist()}")
        print(f"work_id nunique: {cleaned['work_id'].nunique()}")
        print(f"work_id duplicates: {cleaned['work_id'].duplicated().sum()}")