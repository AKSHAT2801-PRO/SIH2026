import requests
import json

url = 'http://localhost:8000/api/score'
headers = {'X-API-Key': 'dev-analyst-key', 'Content-Type': 'application/json'}
data = {
    "state": "Uttar Pradesh",
    "amount": 4939000,
    "work_description": "Construction of CC road from village school to main road",
    "category": "Normal/Others",
    "mp_name": "Shri Brij Lal",
    "house": "Rajya Sabha",
    "ida": "SIDDHARTHNAGAR(DISTRICT MAGISTRATE SIDDHARTHNAGAR_IDA)",
    "event_date": "2026-08-01",
    "work_stage": "RECOMMENDED"
}

response = requests.post(url, headers=headers, json=data)
print('Status:', response.status_code)
try:
    print('Response:', json.dumps(response.json(), indent=2))
except:
    print('Raw response:', response.text)