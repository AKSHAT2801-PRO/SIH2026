import pandas as pd
import numpy as np

df = pd.read_csv('data/raw/run_20260905T155453Z_df8eee/recommended_works.csv', dtype=str, keep_default_na=False, na_values=[''])
df['work_id'] = df['Work ID']
df['work_stage'] = 'RECOMMENDED'

occurrence = df.groupby(['work_stage', 'work_id']).cumcount()
df['work_uid'] = (df['work_stage'].str[:3] + '-' + df['work_id'].astype('string') + '-' + (occurrence + 1).astype('string'))

with open('debug_output.txt', 'w') as f:
    f.write(f'Unique work_uids: {df["work_uid"].nunique()}\n')
    f.write(f'Duplicate work_uids: {df["work_uid"].duplicated().sum()}\n')
    f.write(f'Sample work_uids: {df["work_uid"].head(20).tolist()}\n')
    if df['work_uid'].duplicated().any():
        dupes = df[df['work_uid'].duplicated(keep=False)].sort_values('work_uid')
        f.write(f'Duplicates:\n{dupes[["work_uid", "work_stage", "work_id"]].head(20).to_string()}\n')