import sys
sys.path.insert(0, '.')

import pandas as pd
from backend.database.session import get_engine, create_all
from sqlalchemy import text

# Create tables
create_all()

# Load the works parquet
works = pd.read_parquet('data/analytical/works.parquet')
rec_works = works[works['work_stage'] == 'RECOMMENDED'].copy()
run_id = "test_run_123"
rec_works['run_id'] = run_id

# Get table columns
from backend.database.models import FactRecommendedWork
from sqlalchemy import inspect
inspector = inspect(get_engine())
cols = inspector.get_columns('fact_recommended_work')
col_names = [c['name'] for c in cols]

# Prepare frame
engine = get_engine()
frame = rec_works.copy()
for col in col_names:
    if col not in frame.columns:
        frame[col] = None
frame = frame[col_names]

print(f"Frame shape: {frame.shape}")
print(f"Frame columns: {list(frame.columns)}")

# Try without method="multi"
print("\nAttempting to_sql without method=multi...")
try:
    # First delete
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM fact_recommended_work"))
    print("DELETE done")
    
    # Then insert
    frame.to_sql("fact_recommended_work", engine, if_exists="append", index=False, chunksize=5000)
    print("INSERT done without method=multi")
    
    # Verify
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) FROM fact_recommended_work"))
        count = result.scalar()
        print(f"Rows in table: {count}")
        
        result = conn.execute(text("SELECT work_uid FROM fact_recommended_work LIMIT 5"))
        uids = [row[0] for row in result]
        print(f"Sample work_uids: {uids}")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()