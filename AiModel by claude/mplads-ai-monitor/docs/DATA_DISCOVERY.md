# Phase 1 — Official Data Discovery

**Official source:** <https://mplads.mospi.gov.in/digigov/dashboard.html>
(MPLADS–eSAKSHI portal, Ministry of Statistics and Programme Implementation)

This document records what the discovery step actually found, including what it
could **not** reach. Nothing here is assumed.

---

## 1. How the portal exposes its data

The dashboard URL returns a JavaScript single-page application shell. The visible
figures are not in the HTML: they are fetched by the browser from JSON services
after load, in the envelope

```json
{ "success": true, "data": { ... }, "cached": true, "cache_timestamp": "…" }
```

The platform therefore prefers **structured JSON ingestion over HTML scraping**,
exactly as the specification requires. `data_engineering/ingestion/mospi_client.py`
is a working client that

1. probes the configured candidate service paths,
2. accepts a response only if it carries the MPLADS envelope above,
3. pages through record endpoints, retries with backoff, and
4. returns a `DiscoveryResult` naming every endpoint probed and any blocker.

### Result of the probe in this environment

| Item | Outcome |
|---|---|
| Portal reachable from the build host | **No** |
| Failure mode | `ProxyError: Tunnel connection failed: 403 Forbidden` on every candidate path — the sandbox that built this platform has no egress to `mplads.mospi.gov.in` |
| Recorded in | `data/raw/<run_id>/manifest.json → portal_discovery`, and on every dashboard header |
| Action taken | Fall back to the **official MoSPI export captured on 2026-08-22**, recorded as `source_mode = official_snapshot` with a SHA-256 per file |

Per critical rule 38 the blocker is reported rather than papered over, and **no
data was fabricated**. On a host with egress the same command
(`python scripts/run_pipeline.py`) will ingest live and stamp
`source_mode = live_api` instead — no code change is needed.

---

## 2. Datasets actually available

Four tabular exports plus one national summary object. Row counts are from the
ingested snapshot (2026-08-22).

| Dataset | Records | Fields | Grain |
|---|---:|---:|---|
| `recommended_works` | 83,621 | 11 | one recommended work |
| `completed_works` | 43,173 | 12 | one completed work |
| `expenditures` | 106,263 | 10 | one payment line to a vendor |
| `mp_summary` | 764 | 15 | one MP |
| `national_summary` (JSON) | 1 object | 13 | national control totals |

### Fields

**recommended_works** — Work ID, Work Description, Category, MP Name,
Constituency, State, House, Recommended Amount (₹), Recommendation Date,
Has Images, IDA

**completed_works** — Work ID, Work Description, Category, MP Name,
Constituency, State, House, Final Amount (₹), Completed Date, Has Images,
Average Rating, IDA

**expenditures** — MP Name, Constituency, State, House, Work Description,
Vendor, IDA, Expenditure Amount (₹), Expenditure Date, Payment Status

**mp_summary** — MP Name, Constituency, State, House, Allocated Amount (₹),
Total Expenditure (₹), Utilization %, Completed Works, Recommended Works,
Completion Rate %, Unspent Amount (₹), Transaction Count, Successful Payments,
Pending Payments, Average Rating

### Coverage

* **Temporal:** recommendations 2023-06-14 → 2026-08-21; completions
  2023-08-02 → 2026-08-21; payments 2023-07-27 → 2026-08-21. The portal went
  live on 2023-04-01, so this is effectively full portal history.
* **Geographic:** 36 states and union territories, 537 constituency labels
  (Rajya Sabha members appear as "Sitting Rajya Sabha" / "Nominated Rajya
  Sabha"), 772 implementing districts parsed from the IDA label, 761 distinct
  implementing agencies.
* **Update frequency:** the portal refreshes as stakeholders submit; the summary
  object carries its own `cache_timestamp`. A nightly pipeline run is configured.

---

## 3. Relationships between datasets — measured, not assumed

| Candidate join | Measured coverage | Verdict |
|---|---|---|
| MP name + state + house → all four datasets | **100.0%** of work and payment rows resolve to an MP in `mp_summary` | **Supported.** This is the conformed key (`mp_key`). |
| `recommended_works.Work ID` → `completed_works.Work ID` | 128 shared ids = **0.30%** of completed works | **Not supported.** Per-work approval-to-completion duration cannot be computed and is not estimated. |
| `expenditures` → work (by MP + description text) | **1.26%** exact match | **Not supported.** Payments are analysed at MP / vendor / district level. |
| State, constituency, IDA district | present on every dataset | **Supported.** |

These measurements are recomputed on every run by
`data_engineering/integration/integrate.py::linkage_report` and shown on the
dashboard's Data Quality view.

---

## 4. Field classification

* **Unique identifiers:** `Work ID` (works only, with 15 repeated ids in the
  recommended export), `mp_key` (derived). Payment lines have **no identifier**.
* **Dates:** Recommendation Date, Completed Date, Expenditure Date (all ISO-8601
  UTC midnight).
* **Categorical:** Category (4 values + blanks), House, Payment Status
  (Success / In-Progress), State, Constituency, IDA, Vendor.
* **Numerical:** Recommended Amount, Final Amount, Expenditure Amount, Allocated
  Amount, Total Expenditure, Utilization %, Completion Rate %, Unspent Amount,
  transaction counts.
* **Text for NLP:** Work Description (77,213 distinct strings across 83,621
  recommendations — heavy repetition, which is why near-duplicate detection is
  worthwhile).
* **ML-suitable:** amount fields, category, state, district, description
  statistics, vendor concentration measures, age in days, payment repetition.

---

## 5. Fields the specification asks for that the source does NOT publish

None of these are invented; each one disables the analytics that would depend on it.

| Missing field | Consequence |
|---|---|
| GPS coordinates | Administrative maps only; no point map, no spatial clustering. |
| LGD / census district code | District is parsed from the IDA label text. |
| Sanction date, sanctioned amount | No approval-to-sanction timeline; no sanction-vs-cost variance. |
| Physical progress % | No progress-based stall detection; open-age is used instead. |
| Payment identifier | Repeated identical payment lines cannot be de-duplicated with certainty. |
| Work id on payment lines | Payment↔work attribution is not possible. |
| Vendor registration / PAN / GSTIN | Vendor identity relies on name normalisation. |
| Revised cost estimates | No cost-overrun model. |
| Confirmed fraud labels | No supervised fraud model, ever. Risk only. |
| Average Rating (published but empty) | Present on 4 of 43,173 completed works — unusable. |

---

## 6. Portal metric definitions recovered during discovery

The national summary object publishes 13 totals. Reconciling our computed values
against them revealed two definitions that are not documented on the portal:

```
inProgressPayments = totalExpenditure − completedWorksValue
paymentGap (%)     = 100 × (1 − completedWorksValue ÷ totalExpenditure)
```

Both now reconcile to the paisa. `pendingWorks` is
`totalWorksRecommended − totalWorksCompleted`, and `completionRate` is
`100 × totalWorksCompleted ÷ totalWorksRecommended`. All 13 control totals are
re-verified on every run; the reconciliation score is a component of the
platform's data-quality score.

Note that the portal's `inProgressPayments` (₹1,554.7 crore) is **not** the sum
of payment lines whose status is "Payment In-Progress" (₹106.8 crore). The
platform reports both, and labels which is which.
