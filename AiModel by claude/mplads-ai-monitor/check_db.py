import sqlite3
conn = sqlite3.connect('data/processed/mplads.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
for t in tables:
    print(t[0])
    cursor.execute(f'SELECT COUNT(*) FROM {t[0]}')
    count = cursor.fetchone()[0]
    print(f'  Rows: {count}')