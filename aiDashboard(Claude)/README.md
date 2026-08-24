# AI-Assisted MPLADS Anomaly, Risk & Inefficiency Detection System

A working, end-to-end data engineering, analytics and machine-learning platform over the
**official MoSPI MPLADS (eSAKSHI) data** — from ingestion and validation through EDA,
feature engineering, anomaly detection, NLP duplicate detection and explainable risk
scoring, to a government analytics dashboard, an analytics API and an assistant that
answers only from the warehouse.

> **This platform never declares a project fraudulent.** It produces explainable
> 0–100 *risk indicators* that help authorised officials decide which records deserve a
> closer look. False positives are expected and legitimate works can score highly.

---

## Table of contents

1. [Problem statement & objectives](#1-problem-statement--objectives)
2. [Official data source & discovery methodology](#2-official-data-source--discovery-methodology)
3. [Architecture](#3-architecture)
4. [Data engineering](#4-data-engineering)
5. [Data cleaning & data-quality methodology](#5-data-cleaning--data-quality-methodology)
6. [Database schema](#6-database-schema)
7. [Data analysis & EDA results](#7-data-analysis--eda-results)
8. [Feature engineering](#8-feature-engineering)
9. [Anomaly detection](#9-anomaly-detection)
10. [NLP duplicate detection](#10-nlp-duplicate-detection)
11. [Predictive analytics & model evaluation](#11-predictive-analytics--model-evaluation)
12. [Risk scoring & explainable AI](#12-risk-scoring--explainable-ai)
13. [Alerts & early warning](#13-alerts--early-warning)
14. [Dashboard](#14-dashboard)
15. [API documentation](#15-api-documentation)
16. [AI analytics assistant](#16-ai-analytics-assistant)
17. [Security & governance](#17-security--governance)
18. [Data lineage & auditability](#18-data-lineage--auditability)
19. [Installation & usage](#19-installation--usage)
20. [Environment variables](#20-environment-variables)
21. [Docker deployment](#21-docker-deployment)
22. [Testing](#22-testing)
23. [Limitations](#23-limitations)
24. [Future improvements](#24-future-improvements)

---

## 1. Problem statement & objectives

Each Member of Parliament may recommend local development works worth ₹5 crore a year
under MPLADS. The programme publishes recommendations, completions and vendor payments on
the eSAKSHI portal, but the published view is a set of totals: there is no systematic way
to ask *which* works are costed far above comparable works, which descriptions repeat,
where payments concentrate on a single supplier, or which money is sitting unspent.

Objectives:

* Ingest the official data automatically, with provenance and versioning.
* Validate and clean it without ever fabricating or silently deleting government records.
* Understand it statistically **before** choosing any anomaly threshold.
* Detect anomalies with an ensemble, not a single algorithm.
* Convert anomalies into an **explainable** 0–100 risk score, in language an official can act on.
* Raise alerts with a review lifecycle, and make every number traceable to its source bytes.

## 2. Official data source & discovery methodology

**Source:** <https://mplads.mospi.gov.in/digigov/dashboard.html>

Full discovery write-up: [`docs/DATA_DISCOVERY.md`](docs/DATA_DISCOVERY.md).

The portal is a JavaScript SPA whose figures arrive from JSON services in the envelope
`{"success": true, "data": {…}}`. `data_engineering/ingestion/mospi_client.py` is a real
client that probes candidate service paths, verifies the envelope, pages through record
endpoints with retries and backoff, and returns a discovery result naming every endpoint
probed and any blocker.

**In the environment where this platform was built the portal was unreachable**
(`ProxyError: Tunnel connection failed: 403 Forbidden` — the sandbox has no egress to
`mplads.mospi.gov.in`). Per the project's critical rule 38, that blocker is recorded in
the ingestion manifest and shown on the dashboard header, and the pipeline fell back to
the **official MoSPI export captured 2026-08-22**. No data was invented. On a host with
egress the same command ingests live and stamps `source_mode = live_api` instead.

### What the source actually contains

| Dataset | Records | Fields | Grain |
|---|---:|---:|---|
| `recommended_works` | 83,621 | 11 | one recommended work |
| `completed_works` | 43,173 | 12 | one completed work |
| `expenditures` | 106,263 | 10 | one vendor payment line |
| `mp_summary` | 764 | 15 | one MP |
| `national_summary` | 1 object | 13 | national control totals |

Coverage: 2023-06-14 → 2026-08-21, 36 states/UTs, 772 implementing districts,
26,491 distinct vendors.

### Relationships — measured, never assumed

| Candidate join | Measured | Verdict |
|---|---|---|
| MP name + state + house → all four datasets | 100.0% | **supported** — this is the conformed key |
| `recommended.Work ID` → `completed.Work ID` | 0.30% | **not supported** — per-work duration is not computable, so it is not estimated |
| payment → work (by description) | 1.26% | **not supported** — payments analysed at MP / vendor / district level |

Two undocumented portal definitions were recovered by reconciliation and now verify to the
paisa: `inProgressPayments = totalExpenditure − completedWorksValue` and
`paymentGap% = 100 × (1 − completedWorksValue ÷ totalExpenditure)`.

## 3. Architecture

```
        Official MoSPI MPLADS portal (JSON services)
                        │  live client, with official snapshot fallback
                        ▼
   Ingestion ─► Raw partition (immutable, SHA-256, manifest per dataset)
                        ▼
   Validation (quarantine, never delete) ─► Cleaning (standardise, classify, flag)
                        ▼
   Transformation (peer statistics, time & amount features)
                        ▼
   Integration (conformed MP key; unsupported joins declared)
                        ▼
   Warehouse  (SQLAlchemy; SQLite by default, PostgreSQL in production)
                        │
        ┌───────────────┼────────────────┬────────────────┐
        ▼               ▼                ▼                ▼
   EDA + statistics  Features      Anomaly ensemble    NLP duplicates
        └───────────────┴────────┬───────┴────────────────┘
                                 ▼
                    Prediction (only where supported)
                                 ▼
                       Risk engine (explainable, 0–100)
                                 ▼
              ┌──────────────────┴───────────────────┐
              ▼                                      ▼
        Alert engine                          Analytics API (FastAPI)
              └──────────────────┬───────────────────┘
                                 ▼
                    Government dashboard  ─►  AI analytics assistant
```

Repository layout follows the same separation: `data_engineering/`, `data_analysis/`,
`ml/`, `anomaly_detection/`, `nlp/`, `prediction/`, `risk_engine/`, `alerts/`, `backend/`,
`frontend/`, `scripts/`, `tests/`, `docs/`, `docker/`.

## 4. Data engineering

**Ingestion** (`data_engineering/ingestion/`) is registry-driven: `datasets.py` describes
every official export (headers → canonical columns, natural key, date/amount/text columns,
live resource path). Adding a new MPLADS dataset means adding one entry.

**Raw storage** — each run writes an immutable partition `data/raw/<run_id>/` containing
the untouched CSVs plus `manifest.json` with, per dataset: source mode, source URL,
retrieval timestamp, SHA-256 content hash, record count, field count, full schema, dtypes,
date range, geographic coverage, dataset version, schema-change detection and status.
Raw data is never rewritten (rules 7, 25).

**Validation** (`validation/validators.py`) runs on raw data, before cleaning: required
fields, types, numeric ranges (negative / zero / implausible ceiling), date parsing and
range, duplicate natural keys, full-row duplicates, categorical domains and text quality —
13 rule families. Failures are logged with a human-readable reason; fatal failures are
quarantined to `data/quarantine/<run_id>/`. **Nothing is deleted.**

**Automated refresh** — `docker-compose.yml` includes a scheduler service that re-runs the
whole pipeline nightly.

## 5. Data cleaning & data-quality methodology

* **Missing values are classified, never imputed** — `NOT_APPLICABLE`, `SOURCE_UNAVAILABLE`,
  `GENUINELY_MISSING`, `INVALID_VALUE`, each with a recorded action of
  *"left missing (no imputation)"*.
* **Standardisation** — state aliases, MP names (honorifics and term years stripped),
  vendor names (legal suffixes stripped), districts parsed from the implementing-agency
  label, categories, statuses, dates and currency.
* **Duplicates are logged, not dropped** — exact rows, repeated work ids, and identical
  payment lines. 38,598 payment lines (36.3%) are exact repeats of another line for the
  same MP, vendor, agency, date and amount; because the portal publishes **no payment
  identifier**, a repeated export row cannot be distinguished from a genuinely repeated
  payment, so both are preserved and the repetition itself becomes a risk feature.
* **Outliers are flagged, not removed** — three independent flags separate concepts that
  are often conflated: `is_statistical_outlier` (outside the IQR fence — a genuinely large
  project lands here), `is_data_quality_issue` (physically implausible), and
  `is_potential_anomaly` (beyond the extreme fence *and* the robust-z threshold).

**Data-quality report** (`outputs/reports/data_quality_report.{json,txt}`) is regenerated
every cycle. Latest run:

| Measure | Value |
|---|---|
| Validity | 100.00% |
| Completeness | 97.92% |
| Uniqueness | 86.34% (38,598 repeated payment lines) |
| Reconciliation vs the portal's own 13 published totals | 100.00% |
| **Overall data quality** | **96.06%** |

Reconciliation is what makes the platform auditable: all 13 national control totals
published by the portal are recomputed from the ingested detail and matched — proof that
nothing was lost or invented between the source and the dashboard.

## 6. Database schema

SQLAlchemy models in `backend/database/models.py`; SQLite by default (zero
infrastructure), PostgreSQL via `MPLADS_DB_URL`.

| Table | Purpose |
|---|---|
| `dim_mp` | conformed MP dimension: published + independently derived figures |
| `fact_recommended_work`, `fact_completed_work` | the two work facts (kept separate — the source does not support a lifecycle join) |
| `fact_expenditure` | vendor payment lines with repetition counts and peer deviations |
| `geo_district` | state/district roll-up with risk |
| `analytics_work_risk`, `analytics_mp_risk`, `analytics_vendor_risk` | scored entities with components, explanation and contributions |
| `duplicate_pair` | near-duplicate work pairs with similarity and explanation |
| `alerts`, `alert_history` | alerts and their immutable transition history |
| `data_quality_metric`, `validation_issue` | per-run quality metrics and findings |
| `ingestion_manifest`, `lineage` | provenance and stage-by-stage audit trail |

Every analytical row carries `run_id`, and risk rows also carry
`risk_engine_version`, `feature_version` and `model_version` (enforced by a test).

## 7. Data analysis & EDA results

`outputs/reports/eda_report.{json,txt}` — descriptive statistics, univariate, bivariate,
multivariate, time-series, geographic and comparative analysis, produced **before** any
threshold was chosen (rule 31). Selected findings from the latest run:

* Fund utilisation is extremely dispersed: median **29.9%**, p10 1.5%, p90 62.1%.
  **325 of 764 MPs** have used under a quarter of their allocation.
* Work amounts are heavy-tailed and right-skewed (median ₹4.0 lakh, p99 ₹45 lakh,
  max ₹10.0 crore, skew 23.3) — hence log transforms and median/MAD statistics everywhere.
* **52.9%** of recommended amounts are exact multiples of ₹1 lakh or more, against 10.2%
  of actual payment lines.
* Vendor payment value is highly unequal (Gini 0.77) yet not nationally captured — the ten
  largest vendors hold only 4.4% of value. Concentration is a **district-level**
  phenomenon: 246 districts exceed the configured HHI threshold.
* Rajya Sabha works are larger than Lok Sabha works (median ₹5.0 lakh vs ₹3.4 lakh,
  Mann-Whitney p < 0.001).
* Candidate anomaly population: 9,154 works beyond the robust-z threshold within their
  peer group, 13,281 payment lines beyond it within their district, 25,479 payment lines
  repeated more than five times, 109 MPs with no completed work at all.

## 8. Feature engineering

`ml/feature_engineering/features.py` — **40 documented features** across three grains
(work, vendor, MP), each with a one-line definition surfaced in the API and the dashboard's
feature dictionary. Examples: `state_category_robust_z`, `state_category_ratio_to_peer`,
`peer_group_thin`, `amount_last_digits_zero`, `description_repeat_same_mp`,
`open_age_ratio`, `district_vendor_hhi`, `vendor_district_share`,
`vendor_repeat_line_share`, `vendor_lines_per_active_day`, `mp_top_vendor_share`,
`mp_published_vs_derived_gap_pct`.

**Leakage control.** Peer statistics fall back to the national distribution when a peer
group is thin, and the record is marked so the risk engine can discount it. One real
leak was found and fixed during development: `missing_data_ratio` counted
`average_rating`, a column that exists only in the completed-works export and is empty on
99.99% of its rows — which made the two work populations trivially separable and pushed a
propensity model to a fake ROC-AUC of 1.000. The ratio now excludes structurally
unavailable columns, and time features are excluded from the model entirely because a
completed work's date is its completion date while an open work's date is its
recommendation date.

## 9. Anomaly detection

Four independent families vote (`anomaly_detection/detectors.py`); no single algorithm
decides anything:

| Method | Why it is here |
|---|---|
| Robust statistics (modified z on median/MAD, IQR fences) inside (state, category) and district peer groups | transparent, explainable, no training |
| **Isolation Forest** | unlabelled multivariate rarity across amount, peer deviation, repetition and timing; no distance metric needed on mixed scales; contamination **0.03**, set to the extreme-value rate that EDA measured, not guessed |
| **Local Outlier Factor** | density deviation — records that are normal nationally but odd for their neighbourhood |
| **DBSCAN** | records that belong to no dense cluster at all |
| Explicit rules | repeated payment lines, round-number bias, single-vendor district capture, long-open works |

The ensemble score is a weighted combination (IF 0.35, LOF 0.25, cluster noise 0.10,
statistical rules 0.30) plus a `detector_agreement` count. Isolation Forest output is
never treated as proof of anything — in the risk engine it can only *corroborate* an
already-explained score.

## 10. NLP duplicate detection

`nlp/duplicate_detection.py`. Work descriptions are short, abbreviation-heavy and
inconsistently transliterated, so **character n-gram TF-IDF (3–5, `char_wb`) with cosine
similarity** is used rather than word embeddings: robust to spelling drift, fully
reproducible, and no model download on a government machine. Candidate pairs are generated
only inside blocks (state, sub-blocked by district when a state block is too large), which
is also the comparison officials care about.

Latest run: **62,723 pairs at or above 85% similarity, of which 50,839 are textually
identical** after normalisation. Every pair carries a written explanation, and the
explanation says plainly that repeated descriptions are normal for genuinely repeated works
— twenty street-light installations in twenty wards are twenty real works. What raises risk
is repetition *combined with* a matching amount, the same MP and the same agency.

## 11. Predictive analytics & model evaluation

**Built:** `completion_propensity` — does an open work resemble works that have been
reported complete? `HistGradientBoostingClassifier`, grouped train/test split by MP so no
constituency appears on both sides.

| Metric | Value |
|---|---|
| ROC-AUC | 0.8703 |
| Average precision | 0.8243 |
| Precision / Recall / F1 | 0.783 / 0.656 / 0.714 |
| False-positive rate | 0.101 |
| Brier score | 0.134 |

Global explanation by permutation importance (top: `log_amount`,
`state_category_robust_z`, `district_robust_z`, `category_robust_z`,
`amount_last_digits_zero`). Full report: `outputs/reports/model_evaluation.json`.

**Deliberately not built**, because the source cannot support them (rule 15):

* *expected completion time* — no work has both a start and an end date;
* *cost-overrun probability* — only one amount per work is published;
* *payment-failure probability* — no failure events exist in the data;
* *fraud probability* — **no confirmed fraud labels exist anywhere in MPLADS data.**

Because of the last point the platform is careful to distinguish
**fraud detection ≠ fraud-risk detection ≠ anomaly detection ≠ data-quality detection**,
and presents itself only as the second, third and fourth.

## 12. Risk scoring & explainable AI

Six components, each 0–100 and independently explainable, combined with configurable
weights (`config/config.yaml`):

| Component | Weight | Reads |
|---|---:|---|
| `cost_risk` | 0.24 | deviation from comparable works in the same state and category |
| `duplicate_risk` | 0.22 | textual repetition against peers |
| `vendor_risk` | 0.20 | payment concentration in the district and around the MP |
| `delay_risk` | 0.14 | age relative to works that have completed |
| `utilisation_risk` | 0.12 | the responsible MP's fund behaviour |
| `data_quality_risk` | 0.08 | incompleteness and internal inconsistency of the record |

The composite blends the weighted average (0.60) with the **strongest single component**
(0.40), so one severe, well-evidenced deviation is not averaged away by five quiet
dimensions; the unsupervised ensemble then contributes at most 15% as corroboration and can
never create a high-risk record on its own. Bands: 0–24 low, 25–49 moderate, 50–74 high,
75–100 critical — all configurable.

**Every score carries its own explanation**, generated from the same numbers that produced
it. A real example from the current run:

> **REC-147610-1 — 76.0/100 (Critical)**
> Cost is 20.6× the median of comparable works in Uttar Pradesh in the same category
> (₹239,236), which is 19.2 robust standard deviations away from that peer group. The work
> description is 100% similar to 10 other recorded work(s), including at least one
> recommended by the same MP. The work has been open for 674 days — 2.8× the typical age of
> works that have been completed. 2 of 4 independent statistical detectors also mark this
> record unusual (top contributing measures: state_category_ratio_to_peer,
> description_repeat_count, description_repeat_same_mp). *This is a statistical risk
> indicator for review only. It is not evidence of fraud, and legitimate works can score
> highly.*

Latest run: 7,978 works high or critical (6.3% of 126,794), 110 MPs, 83 vendors. A test
asserts that no explanation anywhere in the warehouse contains an accusatory phrase.

## 13. Alerts & early warning

Alerts are raised at or above a configurable composite score (60/100 by default) for works,
MP portfolios and vendors — 534 in the current run. Each carries what was detected, a
recommended action written for the reviewing officer, and a lifecycle
`OPEN → UNDER_REVIEW → VERIFIED / FALSE_POSITIVE → RESOLVED`. Every transition is appended
to `alert_history` with actor, timestamp and note; alert ids are deterministic, so the same
entity keeps its alert identity across runs.

## 14. Dashboard

`frontend/dashboard_template.html` + `scripts/build_dashboard.py` render a self-contained
government dashboard from `outputs/artifacts/dashboard_payload.json` — the payload the
pipeline computes. **No statistic in the dashboard is hard-coded** (rules 17, 37): change
the data, re-run, and every figure moves.

Views: Ministry overview (KPIs, monthly programme flow, risk histogram, component drivers,
state ranking) · Risk register (filterable, sortable, with a detail drawer showing peer
comparison, component bars, weighted contributions, similar works and the written
explanation) · Alerts (triage with lifecycle) · States & districts · MPs (utilisation vs
completion scatter, portfolio drawer) · Vendors · Duplicate works · Data quality
(including the reconciliation table) · Method & lineage (provenance, SHA-256 per dataset,
measured linkage, detection stack, model evaluation, limitations, feature dictionary) ·
Analytics assistant.

## 15. API documentation

FastAPI app: `backend/api/main.py` (interactive docs at `/docs`).

| Method | Route | Purpose |
|---|---|---|
| GET | `/health` | liveness + current run id |
| GET | `/api/meta` | versions, risk bands and weights, dataset manifest |
| GET | `/api/kpis` | national KPIs computed from the warehouse |
| GET | `/api/states`, `/api/districts` | geographic roll-ups |
| GET | `/api/works` | filter by state, district, band, stage, minimum risk |
| GET | `/api/works/{work_uid}` | full project view: record, components, comparable works, duplicates, lineage, disclaimer |
| GET | `/api/mps`, `/api/mps/{mp_key}` | MP portfolios with top works and vendors |
| GET | `/api/vendors`, `/api/duplicates` | vendor risk, near-duplicate pairs |
| GET | `/api/data-quality` | per-run metrics and validation findings |
| GET | `/api/alerts`, `/api/alerts/{id}/history` | alert queue and audit history |
| PATCH | `/api/alerts/{id}` | move an alert (analyst role or above) |
| POST | `/api/assistant/query` | natural-language question answered from the warehouse |
| GET | `/api/explain/{entity_id}` | the stored explanation for any scored entity |
| GET | `/api/lineage` | stage-by-stage audit trail for a run |

## 16. AI analytics assistant

Two execution paths (`backend/services/assistant.py`):

1. **Tool path — always available, no LLM required.** Questions are matched to registered
   analytics tools, each backed by a reviewed, parameterised SQL statement. Deterministic;
   it cannot hallucinate a number.
2. **Guarded NL→SQL — only when an LLM is configured.** The model may emit a single SELECT,
   which must pass `backend/services/sql_guard.py` (one statement, SELECT/WITH only, no
   comments, whitelisted tables only, forbidden-keyword scan, automatic LIMIT) before it
   reaches the database. The answer is rendered from the returned rows, never from the
   model's recollection.

Prompt-injection markers are rejected before either path runs. If neither path can answer,
the assistant says so and lists the tools it does have. The dashboard ships an offline
mirror of the same tool set over the embedded payload.

## 17. Security & governance

* API-key authentication with three roles (viewer / analyst / admin); mutating routes
  require analyst or above.
* Fixed-window rate limiting per key (configurable).
* All SQL parameters are bound, never string-formatted; the assistant has the additional
  SQL guard above.
* Prompt-injection filtering on assistant input.
* Request audit log for every call, plus a per-run JSONL audit trail of pipeline events.
* Secrets only through environment variables (`.env.example` documents every one); the
  Docker image runs as a non-root user.

## 18. Data lineage & auditability

```
source bytes (SHA-256) → ingestion manifest → validation issues → cleaning report
   → transformation → warehouse row (run_id) → features (feature_version)
   → detectors (model_version) → risk score (risk_engine_version) → alert → dashboard
```

`RunContext` stamps a run id on every partition, table and report, and writes
`outputs/logs/<run_id>_audit.jsonl`. `/api/lineage` and the dashboard's Method view expose
the same trail, and `/api/works/{id}` returns the lineage for the record on screen.

## 19. Installation & usage

```bash
git clone <this repo> && cd mplads-ai-monitor
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Full pipeline: portal discovery → ingest → validate → clean → transform → integrate
# → warehouse → EDA → features → anomalies → NLP → prediction → risk → alerts → payload
python scripts/run_pipeline.py            # add --offline to skip the portal probe

python scripts/build_dashboard.py         # renders the dashboard from the computed payload
uvicorn backend.api.main:app --reload     # API + interactive docs at /docs
```

Outputs land in `outputs/reports/` (data-quality, EDA, model evaluation, analytics summary)
and `outputs/artifacts/` (dashboard payload and HTML).

If the official portal is unreachable, place the official export in
`data/source_snapshots/<YYYYMMDD>/` — the ingestion layer picks up the latest folder and
records that it used a snapshot.

## 20. Environment variables

See [`.env.example`](.env.example): `MPLADS_DB_URL`, `MPLADS_CONFIG`, `MPLADS_LOG_LEVEL`,
`MPLADS_API_KEY_{ADMIN,ANALYST,VIEWER}`, `MPLADS_AUTH_DISABLED`, `MPLADS_CORS`, and the
optional `MPLADS_LLM_PROVIDER` / `MPLADS_LLM_API_KEY` / `MPLADS_LLM_MODEL`.

## 21. Docker deployment

```bash
cp .env.example .env    # set real keys and a real database password
docker compose up --build
```

Services: `postgres` (warehouse), `pipeline` (one full run, then exits), `api`
(port 8000), `scheduler` (nightly re-run for automated refresh).

## 22. Testing

```bash
MPLADS_AUTH_DISABLED=1 pytest tests -q      # 39 tests
```

* **Data tests** — dataset specs, canonicalisation, validation quarantines without
  deleting, duplicate-key flagging, state/name standardisation, no-imputation guarantee,
  and that a large-but-plausible project is flagged as an outlier and *not* as a data-quality
  issue.
* **ML tests** — Isolation Forest reproducibility across runs, detection of a planted
  extreme, detectors tolerating missing columns.
* **Risk tests** — ramp bounded and monotone, bands match configuration, weights sum to 1.
* **Security tests** — eight destructive/unauthorised SQL statements rejected by the guard,
  prompt injection rejected, viewer cannot move an alert, unknown API key rejected.
* **End-to-end tests** — API KPIs match warehouse counts, every high-risk record has a
  substantive explanation, **no explanation anywhere claims fraud**, scores are bounded and
  banded, the alert lifecycle writes history, the assistant returns the rows it answered
  from, and every analytical row carries its run id.

## 23. Limitations

* **No GPS coordinates** are published, so geography is administrative only
  (state / constituency / implementing district parsed from the agency label). No point map
  is drawn and no coordinates are invented.
* **No confirmed fraud labels exist**, so supervised fraud detection is impossible. Every
  score is an anomaly/risk indicator; false positives are expected.
* **Payment lines carry no identifier**, so 38,598 identical lines cannot be resolved with
  certainty; they are preserved and flagged.
* **Work-level lifecycle is not joinable** (0.30% work-id overlap), so approval-to-completion
  duration and cost-overrun analytics are absent rather than estimated.
* **Vendor identity relies on name normalisation** — no registration number, PAN or GSTIN is
  published, so near-identical names may merge distinct firms or split one.
* `Average Rating` is published but populated on 4 of 43,173 completed works — unusable.
* The current run reconciles at 100% against the portal's own totals, but data quality is
  96.06%, and the risk scores inherit that uncertainty — which is exactly why data quality is
  itself a scored risk component.

## 24. Future improvements

* Ingest directly from the live portal on a host with egress, and diff successive snapshots
  to build a true change history per work.
* Add sentence-transformer embeddings with pgvector/FAISS as a second duplicate signal
  alongside character TF-IDF, and evaluate agreement between the two.
* Join district names to LGD codes to enable proper choropleth mapping.
* Analyst feedback loop: use VERIFIED / FALSE_POSITIVE alert outcomes as weak labels to
  calibrate component weights — the only honest route to supervised learning here.
* Per-state threshold profiles, and drift monitoring on features and score distributions
  between runs.

---

**Licence / use.** Built on publicly published MoSPI MPLADS data for oversight and research.
Outputs are decision-support indicators for authorised review, not determinations of
wrongdoing.
