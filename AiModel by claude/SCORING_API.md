# Scoring a new record

The batch pipeline scores what the portal has already published. This endpoint
answers the other question: **an implementing agency proposes a work — does it
look unusual against comparable official records?**

```
POST /api/score            score one record
POST /api/score/batch      score up to 200 records
GET  /api/score/schema     what a scoreable record looks like, and against which run
```

---

## 1. How a single record can be scored at all

A risk score is meaningless in isolation; it is a statement *relative to
comparable published records*. So every pipeline run freezes the reference
material the batch scorer used into a versioned **scoring pack**
(`outputs/models/scoring_pack.joblib`):

| Frozen in the pack | Used for |
|---|---|
| median / MAD / p90 per (state × category), per district, per category, and nationally | the cost component and the peer evidence |
| district vendor concentration (HHI) and work counts | the vendor component |
| per-MP context (utilisation, unspent, pending share, top-vendor share, published-vs-derived gap) | the utilisation component and the MP half of the vendor component |
| median age of completed works | the delay component |
| the fitted Isolation Forest (imputer + scaler + model + score bounds) | unsupervised corroboration on the same scale as the register |
| the completion-propensity model | the optional propensity signal |
| the run id, snapshot date and every version string | provenance on every response |

Duplicate detection runs live against the warehouse: the submitted description
is compared with every published work in that state using the same character
n-gram TF-IDF cosine method as the batch run.

If no pipeline run exists, scoring returns **503** and says so. It never invents
a baseline.

## 2. Equivalence with the register

The service does not re-implement the risk maths. It assembles a one-row frame
using the batch pipeline's own column names and calls the same two functions the
pipeline calls:

```python
scored = finalise_work_scores(compute_work_components(df, cfg), cfg)
```

`tests/test_live_scoring.py::test_live_score_matches_the_batch_register`
re-scores published works through the live path and asserts each component is
within 5 points and the composite within 3 points of the register. Measured
deltas on the current run are **0.00–0.40 points**.

Two honest differences, both reported in the response under `corroboration`:

* **LOF and DBSCAN do not run.** They are transductive — they describe a
  population, not a point. The ensemble formula already falls back from LOF to
  the Isolation Forest score for batch rows outside the LOF sample, and a live
  record is treated exactly like such a row.
* **The record is not in its own peer group.** Peer medians come from the frozen
  population; for one record among hundreds the effect is negligible, and
  re-scoring an existing record excludes it from its own duplicate search.

## 3. Request

Only `state` and `amount` are required. Everything else is optional — anything
missing raises the data-quality component and is listed back in the response
instead of being guessed.

```bash
curl -s -X POST http://localhost:8000/api/score \
  -H 'content-type: application/json' \
  -H 'x-api-key: dev-analyst-key' \
  -d '{
    "state": "Uttar Pradesh",
    "amount": 4939000,
    "work_description": "Construction of CC road from village school to main road",
    "category": "Normal/Others",
    "mp_name": "Shri Brij Lal",
    "house": "Rajya Sabha",
    "ida": "SIDDHARTHNAGAR(DISTRICT MAGISTRATE SIDDHARTHNAGAR_IDA)",
    "event_date": "2026-08-01",
    "work_stage": "RECOMMENDED"
  }'
```

| Field | Notes |
|---|---|
| `state` **(required)** | aliases are normalised (`ORISSA` → `Odisha`) |
| `amount` **(required)** | rupees; negative is rejected, implausibly large is scored and flagged |
| `work_description` | drives duplicate detection; omitting it disables that component |
| `category` | one of the published categories; an unknown one falls back to the state distribution |
| `mp_name` / `mp_key` / `house` / `constituency` | honorifics and term years are stripped before matching; an unmatched MP leaves the MP-dependent components unassessed |
| `ida` / `ida_district` | the district is parsed from the agency label when only `ida` is given |
| `event_date`, `as_of` | ISO-8601; `as_of` defaults to now and drives the age calculation |
| `work_stage` | `RECOMMENDED` (default) or `COMPLETED` — the delay component applies only to open works |
| `work_id`, `has_images` | optional, carried through |

`POST /api/score?persist=true` (analyst role or above) also writes the scored
record into `analytics_work_risk` and raises an alert if it crosses the
threshold. Without it, scoring is read-only.

## 4. Response

```jsonc
{
  "work_uid": "LIVE-3f2a9c81d044",
  "composite_risk": 77.36,
  "risk_band": "CRITICAL",
  "components": {
    "cost_risk": 100.0, "duplicate_risk": 100.0, "delay_risk": 58.78,
    "vendor_risk": 13.39, "utilisation_risk": 3.78, "data_quality_risk": 14.81
  },
  "contributions": { "cost_risk": 24.0, "duplicate_risk": 22.0, "...": "...",
                     "ensemble_corroboration": 8.4 },
  "explanation": "Cost is 206.4× the median of comparable works in Uttar Pradesh in the same category (₹239,236), which is 200.5 robust standard deviations away from that peer group. The work description is 100% similar to 19 other recorded work(s), including at least one recommended by the same MP. …",
  "evidence": {
    "peer_group": "Uttar Pradesh · Normal/Others",
    "peer_median_amount": 239236.34,
    "peer_group_size": 23409,
    "peer_group_thin": false,
    "ratio_to_peer_median": 206.4,
    "robust_z_vs_peers": 200.5,
    "age_days": 677,
    "typical_completed_age_days": 243.0,
    "similar_published_works": [{ "work_uid": "REC-285043-1", "similarity": 1.0, "...": "..." }],
    "comparable_works": [{ "work_uid": "REC-…", "amount": 4900000, "...": "..." }],
    "mp_context_matched_by": "name+state+house",
    "completion_propensity": 0.031
  },
  "corroboration": {
    "isolation_forest_score": 61.2,
    "isolation_forest_flag": true,
    "top_contributing_measures": "state_category_ratio_to_peer, district_robust_z, …",
    "detectors_available": "Isolation Forest + rule flags",
    "detectors_unavailable": "Local Outlier Factor and DBSCAN describe a population, not a single record…"
  },
  "alert": { "would_raise_alert": true, "threshold": 60,
             "recommended_action": "Review the sanction file, the measurement book and the payment vouchers…" },
  "data_quality": { "fields_supplied": ["state","amount","…"], "fields_missing": ["constituency"],
                    "missing_data_ratio": 0.111, "warnings": ["…"] },
  "reference": { "run_id": "run_…", "snapshot_date": "2026-08-21",
                 "risk_engine_version": "1.0.0", "population_compared_against": 23409 },
  "disclaimer": "This is a statistical risk indicator computed against comparable published records. It is not evidence of fraud or wrongdoing, and legitimate works can score highly."
}
```

Status codes: `200` scored · `422` the record cannot be scored (reason in
`detail`) · `403` `persist=true` without the analyst role · `503` no completed
pipeline run to score against.

## 5. Batch

```bash
curl -s -X POST http://localhost:8000/api/score/batch \
  -H 'content-type: application/json' -H 'x-api-key: dev-analyst-key' \
  -d '{"records":[{"state":"Bihar","amount":250000},{"state":"Kerala","amount":900000}]}'
```

Returns `scored`, `rejected` (with the index and reason for each bad record) and
a `summary` counting how many would raise alerts. One bad record never fails the
call.

## 6. Refreshing the reference

The pack is rebuilt automatically by `scripts/run_pipeline.py`. To rebuild it
alone — for example after changing a threshold in `config/config.yaml`:

```bash
python scripts/build_scoring_pack.py
```

A running API caches the pack in memory; restart it, or call
`backend.services.scoring.reload_pack()`, to pick up a new one.
