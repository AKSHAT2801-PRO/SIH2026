import pandas as pd
import numpy as np

# Check recommended
df_rec = pd.read_csv('data/raw/run_20260905T155453Z_df8eee/recommended_works.csv', dtype=str, keep_default_na=False, na_values=[''])
df_rec['work_id'] = df_rec['Work ID']
df_rec['work_stage'] = 'RECOMMENDED'

# Check completed
df_com = pd.read_csv('data/raw/run_20260905T155453Z_df8eee/completed_works.csv', dtype=str, keep_default_na=False, na_values=[''])
df_com['work_id'] = df_com['Work ID']
df_com['work_stage'] = 'COMPLETED'

# Combine
df = pd.concat([df_rec, df_com], ignore_index=True)
print(f'Total rows: {len(df)}')

occurrence = df.groupby(['work_stage', 'work_id']).cumcount()
df['work_uid'] = (df['work_stage'].str[:3] + '-' + df['work_id'].astype('string') + '-' + (occurrence + 1).astype('string'))

with open('debug_output2.txt', 'w') as f:
    f.write(f'Unique work_uids: {df["work_uid"].nunique()}\n')
    f.write(f'Duplicate work_uids: {df["work_uid"].duplicated().sum()}\n')
    f.write(f'Sample work_uids: {df["work_uid"].head(20).tolist()}\n')
    if df['work_uid'].duplicated().any():
        dupes = df[df['work_uid'].duplicated(keep=False)].sort_values('work_uid')
        f.write(f'Duplicates:\n{dupes[["work_uid", "work_stage", "work_id"]].head(20).to_string()}\n')
    else:
        f.write('No duplicates!\n')
    
    # Check for work_ids that appear in both stages
    rec_ids = set(df_rec['work_id'])
    com_ids = set(df_com['work_id'])
    common = rec_ids & com_ids
    f.write(f'\nWork IDs in both stages: {len(common)}\n')
    if common:
        f.write(f'Common IDs: {sorted(list(common))[:20]}\n')