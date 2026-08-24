"""Data-layer tests: schema, types, validation, cleaning, duplicates (§32)."""
from __future__ import annotations

import pandas as pd
import pytest

from data_engineering.cleaning.cleaner import clean_dataset
from data_engineering.ingestion.datasets import REGISTRY, TABULAR_DATASETS
from data_engineering.validation.validators import canonicalise, validate_dataset


@pytest.fixture
def raw_recommended() -> pd.DataFrame:
    return pd.DataFrame({
        "Work ID": ["1", "2", "3", "3", "5"],
        "Work Description": ["Street lights ward 4", "Street lights ward 4", "", "Road repair", "Road repair"],
        "Category": ["Normal/Others"] * 5,
        "MP Name": ["Shri A. B. Sharma (2019-24)", "A B SHARMA", "Dr. C. Rao", "C RAO", "C RAO"],
        "Constituency": ["X", "X", "Y", "Y", "Y"],
        "State": ["MAHARASHTRA", "Maharashtra ", "Odisha", "orissa", "Odisha"],
        "House": ["Lok Sabha"] * 5,
        "Recommended Amount (₹)": ["100000", "-5000", "250000", "abc", "250000"],
        "Recommendation Date": ["2024-05-01T00:00:00.000Z", "2024-05-02T00:00:00.000Z",
                                "2035-01-01T00:00:00.000Z", "2024-06-01T00:00:00.000Z",
                                "2024-06-01T00:00:00.000Z"],
        "Has Images": ["false"] * 5,
        "IDA": ["PUNE(DISTRICT MAGISTRATE PUNE_IDA)"] * 5,
    })


def test_every_dataset_spec_declares_its_key_fields():
    for spec in TABULAR_DATASETS:
        assert spec.columns, f"{spec.name} has no column map"
        assert spec.file_match
        for col in spec.date_columns + spec.amount_columns:
            assert col in spec.columns.values(), f"{spec.name}: {col} is not a canonical column"


def test_canonicalise_renames_official_headers(raw_recommended):
    out = canonicalise(raw_recommended, REGISTRY["recommended_works"])
    assert "recommended_amount" in out.columns
    assert "Recommended Amount (₹)" not in out.columns


def test_validation_quarantines_but_never_deletes(raw_recommended):
    spec = REGISTRY["recommended_works"]
    validated, result = validate_dataset(canonicalise(raw_recommended, spec), spec)
    assert len(validated) == len(raw_recommended), "validation must not drop rows"
    assert result.records_quarantined >= 3          # negative amount, bad number, future date
    rules = set(result.issues["rule"])
    assert "range_negative:recommended_amount" in rules
    assert "type:recommended_amount" in rules
    assert "date_future:recommendation_date" in rules


def test_validation_flags_duplicate_keys_without_dropping(raw_recommended):
    spec = REGISTRY["recommended_works"]
    validated, result = validate_dataset(canonicalise(raw_recommended, spec), spec)
    assert "duplicate_key:work_id" in set(result.issues["rule"])
    assert len(validated) == 5


def test_cleaning_standardises_states_and_names(raw_recommended):
    spec = REGISTRY["recommended_works"]
    validated, _ = validate_dataset(canonicalise(raw_recommended, spec), spec)
    kept = validated[~validated["is_quarantined"]]
    cleaned, report = clean_dataset(kept, spec)
    assert set(cleaned["state"]) <= {"Maharashtra", "Odisha"}
    assert cleaned.loc[cleaned["mp_name"].str.contains("Sharma"), "mp_name_norm"].iat[0] == "a b sharma"
    assert "ida_district" in cleaned.columns and cleaned["ida_district"].iat[0] == "Pune"
    assert not report.missing_profile.empty


def test_cleaning_never_imputes_missing_values(raw_recommended):
    spec = REGISTRY["recommended_works"]
    validated, _ = validate_dataset(canonicalise(raw_recommended, spec), spec)
    kept = validated[~validated["is_quarantined"]]
    cleaned, report = clean_dataset(kept, spec)
    assert all(r["action"] == "left missing (no imputation)"
               for r in report.missing_profile.to_dict("records"))


def test_outlier_flags_are_separate_concepts():
    spec = REGISTRY["recommended_works"]
    df = pd.DataFrame({
        "Work ID": [str(i) for i in range(60)],
        "Work Description": ["work"] * 60,
        "Category": ["Normal/Others"] * 60,
        "MP Name": ["A B"] * 60, "Constituency": ["X"] * 60, "State": ["Bihar"] * 60,
        "House": ["Lok Sabha"] * 60,
        "Recommended Amount (₹)": [str(100000 + i * 100) for i in range(59)] + ["90000000"],
        "Recommendation Date": ["2024-05-01T00:00:00.000Z"] * 60,
        "Has Images": ["false"] * 60,
        "IDA": ["PATNA(DM PATNA_IDA)"] * 60,
    })
    validated, _ = validate_dataset(canonicalise(df, spec), spec)
    cleaned, _ = clean_dataset(validated[~validated["is_quarantined"]], spec)
    assert cleaned["recommended_amount__is_statistical_outlier"].sum() >= 1
    # A large but plausible project is an outlier, not a data-quality issue.
    assert cleaned["recommended_amount__is_data_quality_issue"].sum() == 0
    assert len(cleaned) == 60
