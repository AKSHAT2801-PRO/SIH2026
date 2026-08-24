"""Dataset registry — the single place that describes what MPLADS data exists.

Adding a new official MPLADS dataset means adding one entry here; the whole
ingestion / validation / cleaning chain is driven off this registry (the
ingestion architecture requirement in section 4.1 of the specification).

The column maps below were derived from the *actual* headers of the official
MoSPI eSAKSHI exports — see docs/DATA_DISCOVERY.md. No field is invented.
"""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class DatasetSpec:
    name: str
    description: str
    # Filename fragment used to locate the dataset in a snapshot directory.
    file_match: str
    # Official export header -> canonical snake_case column.
    columns: dict[str, str]
    # Canonical natural key. Empty tuple = the dataset has no stable record id.
    natural_key: tuple[str, ...] = ()
    date_columns: tuple[str, ...] = ()
    amount_columns: tuple[str, ...] = ()
    text_columns: tuple[str, ...] = ()
    # Live-portal resource path, used by the API client when reachable.
    live_resource: str | None = None
    notes: str = ""


RECOMMENDED_WORKS = DatasetSpec(
    name="recommended_works",
    description="Works recommended by MPs under MPLADS and forwarded to the district authority.",
    file_match="recommended_works",
    columns={
        "Work ID": "work_id",
        "Work Description": "work_description",
        "Category": "category",
        "MP Name": "mp_name",
        "Constituency": "constituency",
        "State": "state",
        "House": "house",
        "Recommended Amount (₹)": "recommended_amount",
        "Recommendation Date": "recommendation_date",
        "Has Images": "has_images",
        "IDA": "ida",
    },
    natural_key=("work_id",),
    date_columns=("recommendation_date",),
    amount_columns=("recommended_amount",),
    text_columns=("work_description",),
    live_resource="/digigov/api/works/recommended",
)

COMPLETED_WORKS = DatasetSpec(
    name="completed_works",
    description="Works reported complete, with the final amount booked against them.",
    file_match="completed_works",
    columns={
        "Work ID": "work_id",
        "Work Description": "work_description",
        "Category": "category",
        "MP Name": "mp_name",
        "Constituency": "constituency",
        "State": "state",
        "House": "house",
        "Final Amount (₹)": "final_amount",
        "Completed Date": "completed_date",
        "Has Images": "has_images",
        "Average Rating": "average_rating",
        "IDA": "ida",
    },
    natural_key=("work_id",),
    date_columns=("completed_date",),
    amount_columns=("final_amount",),
    text_columns=("work_description",),
    live_resource="/digigov/api/works/completed",
)

EXPENDITURES = DatasetSpec(
    name="expenditures",
    description="Payment lines released to vendors by implementing district authorities.",
    file_match="expenditures",
    columns={
        "MP Name": "mp_name",
        "Constituency": "constituency",
        "State": "state",
        "House": "house",
        "Work Description": "work_description",
        "Vendor": "vendor",
        "IDA": "ida",
        "Expenditure Amount (₹)": "expenditure_amount",
        "Expenditure Date": "expenditure_date",
        "Payment Status": "payment_status",
    },
    natural_key=(),  # the portal exposes no payment identifier — documented limitation
    date_columns=("expenditure_date",),
    amount_columns=("expenditure_amount",),
    text_columns=("work_description", "vendor"),
    live_resource="/digigov/api/expenditure",
    notes="No payment id is published, so exact-duplicate lines cannot be distinguished "
          "from genuinely repeated identical payments. Both are preserved and flagged.",
)

MP_SUMMARY = DatasetSpec(
    name="mp_summary",
    description="Per-MP allocation, expenditure and utilisation as published by the portal.",
    file_match="mp_summary",
    columns={
        "MP Name": "mp_name",
        "Constituency": "constituency",
        "State": "state",
        "House": "house",
        "Allocated Amount (₹)": "allocated_amount",
        "Total Expenditure (₹)": "total_expenditure",
        "Utilization %": "utilization_pct",
        "Completed Works": "completed_works",
        "Recommended Works": "recommended_works",
        "Completion Rate %": "completion_rate_pct",
        "Unspent Amount (₹)": "unspent_amount",
        "Transaction Count": "transaction_count",
        "Successful Payments": "successful_payments",
        "Pending Payments": "pending_payments",
        "Average Rating": "average_rating",
    },
    natural_key=("mp_key",),
    amount_columns=("allocated_amount", "total_expenditure", "unspent_amount"),
    live_resource="/digigov/api/mp/summary",
)

NATIONAL_SUMMARY = DatasetSpec(
    name="national_summary",
    description="Portal-published national totals, used as an independent reconciliation control.",
    file_match="json_",
    columns={},
    live_resource="/digigov/api/dashboard/summary",
)

REGISTRY: dict[str, DatasetSpec] = {
    d.name: d
    for d in (RECOMMENDED_WORKS, COMPLETED_WORKS, EXPENDITURES, MP_SUMMARY, NATIONAL_SUMMARY)
}

TABULAR_DATASETS: list[DatasetSpec] = [RECOMMENDED_WORKS, COMPLETED_WORKS, EXPENDITURES, MP_SUMMARY]

# Fields the specification asks about that the official source does NOT publish.
# They are recorded here so the platform can state its limitations explicitly
# instead of inventing values (critical rules 3, 4, 16).
UNAVAILABLE_FIELDS: dict[str, str] = {
    "gps_coordinates": "Not published. Geography is available only as state / constituency / IDA district.",
    "district_code": "No LGD/census district code is published; district is parsed from the IDA label.",
    "sanction_date": "Not published. Only recommendation, completion and payment dates exist.",
    "sanctioned_amount": "Not published separately from the recommended amount.",
    "physical_progress_pct": "Not published for in-progress works.",
    "payment_id": "Payment lines carry no identifier, so payments cannot be de-duplicated with certainty.",
    "work_id_on_expenditure": "Expenditure lines are not keyed to a work id — only a free-text description.",
    "implementing_agency_registration": "Vendor names are free text with no registration number or PAN/GSTIN.",
    "confirmed_fraud_labels": "No ground-truth fraud labels exist, so supervised fraud detection is impossible.",
    "revised_cost_estimates": "Cost revisions are not published as a history.",
}
