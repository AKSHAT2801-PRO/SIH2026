import sys
sys.path.insert(0, '.')

import pandas as pd
from backend.database.session import bulk_load, get_engine, create_all
from sqlalchemy import text

# Create tables
create_all()

# Load the works parquet
works = pd.read_parquet('data/analytical/works.parquet')
print(f"Works shape: {works.shape}")
print(f"Work stages: {works['work_stage'].value_counts().to_dict()}")
print(f"Work_uid unique: {works['work_uid'].nunique()}")
print(f"Work_uid duplicates: {works['work_uid'].duplicated().sum()}")

# Filter recommended
rec_works = works[works['work_stage'] == 'RECOMMENDED'].copy()
print(f"\nRecommended works: {len(rec_works)}")
print(f"Work_uid unique: {rec_works['work_uid'].nunique()}")
print(f"Work_uid duplicates: {rec_works['work_uid'].duplicated().sum()}")
print(f"Work_uid nulls: {rec_works['work_uid'].isna().sum()}")

# Add run_id
run_id = "test_run_123"
rec_works['run_id'] = run_id

# Check columns needed for fact_recommended_work
from backend.database.models import FactRecommendedWork
from sqlalchemy import inspect
inspector = inspect(get_engine())
cols = inspector.get_columns('fact_recommended_work')
col_names = [c['name'] for c in cols]
print(f"\nTable columns: {col_names}")

# Check which columns are in the dataframe
missing = [c for c in col_names if c not in rec_works.columns]
extra = [c for c in rec_works.columns if c not in col_names]
print(f"Missing columns: {missing}")
print(f"Extra columns: {extra[:20]}")

# Try bulk_load
print("\nAttempting bulk_load...")
try:
    result = bulk_load(rec_works, "fact_recommended_work")
    print(f"Bulk load result: {result} rows")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()