"""Warehouse schema — built strictly from fields the official source publishes.

Design
------
* ``dim_mp`` is the conformed dimension (the only key that joins every export).
* The two work exports stay as separate facts because the source does not
  support a lifecycle join between them (see integration.linkage_report).
* Analytics tables (risk, anomalies, alerts, duplicate pairs) are versioned and
  carry the ``run_id`` so every dashboard number is traceable to its extraction.
"""
from __future__ import annotations

from sqlalchemy import (
    Boolean, Column, Date, DateTime, Float, ForeignKey, Index, Integer, MetaData,
    String, Text, UniqueConstraint,
)
from sqlalchemy.orm import declarative_base

metadata = MetaData()
Base = declarative_base(metadata=metadata)


class IngestionManifest(Base):
    __tablename__ = "ingestion_manifest"
    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(64), index=True, nullable=False)
    dataset = Column(String(64), nullable=False)
    source_mode = Column(String(32), nullable=False)
    source_url = Column(Text, nullable=False)
    retrieved_at = Column(String(40), nullable=False)
    content_sha256 = Column(String(64), nullable=False)
    record_count = Column(Integer, nullable=False)
    field_count = Column(Integer, nullable=False)
    dataset_version = Column(String(64))
    schema_changed = Column(Boolean, default=False)
    status = Column(String(32))
    errors = Column(Text)
    __table_args__ = (UniqueConstraint("run_id", "dataset", name="uq_manifest_run_dataset"),)


class DimMP(Base):
    __tablename__ = "dim_mp"
    mp_key = Column(String(32), primary_key=True)
    run_id = Column(String(64), index=True)
    mp_name = Column(String(255), nullable=False)
    mp_name_norm = Column(String(255), index=True)
    constituency = Column(String(160), index=True)
    state = Column(String(120), index=True)
    house = Column(String(40), index=True)
    allocated_amount = Column(Float)
    total_expenditure = Column(Float)
    utilization_pct = Column(Float)
    unspent_amount = Column(Float)
    unspent_pct = Column(Float)
    completed_works = Column(Float)
    recommended_works = Column(Float)
    completion_rate_pct = Column(Float)
    transaction_count = Column(Float)
    successful_payments = Column(Float)
    pending_payments = Column(Float)
    pending_payment_share = Column(Float)
    derived_recommended_works = Column(Float)
    derived_completed_works = Column(Float)
    derived_recommended_amount = Column(Float)
    derived_completed_amount = Column(Float)
    derived_payment_lines = Column(Float)
    derived_expenditure = Column(Float)
    derived_expenditure_success = Column(Float)
    derived_vendors = Column(Float)
    derived_agencies = Column(Float)
    derived_pending_lines = Column(Float)
    derived_utilisation_pct = Column(Float)
    derived_completion_rate_pct = Column(Float)
    published_vs_derived_expenditure_gap = Column(Float)
    published_vs_derived_expenditure_gap_pct = Column(Float)


class FactRecommendedWork(Base):
    __tablename__ = "fact_recommended_work"
    work_uid = Column(String(40), primary_key=True)
    run_id = Column(String(64), index=True)
    work_id = Column(String(40), index=True)
    mp_key = Column(String(32), ForeignKey("dim_mp.mp_key"), index=True)
    mp_name = Column(String(255))
    constituency = Column(String(160), index=True)
    state = Column(String(120), index=True)
    house = Column(String(40))
    ida = Column(String(255))
    ida_district = Column(String(160), index=True)
    category = Column(String(120), index=True)
    work_description = Column(Text)
    description_norm = Column(Text)
    amount = Column(Float, index=True)
    amount_lakh = Column(Float)
    event_date = Column(DateTime)
    fy = Column(String(12), index=True)
    quarter = Column(String(12))
    age_days = Column(Float)
    has_images = Column(Boolean)
    is_round_amount = Column(Boolean)
    state_category_robust_z = Column(Float)
    state_category_ratio_to_peer = Column(Float)
    district_robust_z = Column(Float)
    category_robust_z = Column(Float)
    is_open_beyond_median_cycle = Column(Boolean)
    missing_data_ratio = Column(Float)
    __table_args__ = (Index("ix_rec_state_cat", "state", "category"),)


class FactCompletedWork(Base):
    __tablename__ = "fact_completed_work"
    work_uid = Column(String(40), primary_key=True)
    run_id = Column(String(64), index=True)
    work_id = Column(String(40), index=True)
    mp_key = Column(String(32), ForeignKey("dim_mp.mp_key"), index=True)
    mp_name = Column(String(255))
    constituency = Column(String(160), index=True)
    state = Column(String(120), index=True)
    house = Column(String(40))
    ida = Column(String(255))
    ida_district = Column(String(160), index=True)
    category = Column(String(120), index=True)
    work_description = Column(Text)
    description_norm = Column(Text)
    amount = Column(Float, index=True)
    amount_lakh = Column(Float)
    event_date = Column(DateTime)
    fy = Column(String(12), index=True)
    quarter = Column(String(12))
    age_days = Column(Float)
    has_images = Column(Boolean)
    is_round_amount = Column(Boolean)
    state_category_robust_z = Column(Float)
    state_category_ratio_to_peer = Column(Float)
    district_robust_z = Column(Float)
    category_robust_z = Column(Float)
    missing_data_ratio = Column(Float)
    __table_args__ = (Index("ix_com_state_cat", "state", "category"),)


class FactExpenditure(Base):
    __tablename__ = "fact_expenditure"
    expenditure_uid = Column(String(40), primary_key=True)
    run_id = Column(String(64), index=True)
    mp_key = Column(String(32), ForeignKey("dim_mp.mp_key"), index=True)
    mp_name = Column(String(255))
    constituency = Column(String(160), index=True)
    state = Column(String(120), index=True)
    house = Column(String(40))
    vendor = Column(String(255), index=True)
    vendor_norm = Column(String(255), index=True)
    ida = Column(String(255), index=True)
    ida_district = Column(String(160), index=True)
    work_description = Column(Text)
    description_norm = Column(Text)
    amount = Column(Float, index=True)
    amount_lakh = Column(Float)
    event_date = Column(DateTime)
    fy = Column(String(12), index=True)
    quarter = Column(String(12))
    payment_status = Column(String(40), index=True)
    payment_success = Column(Boolean)
    payment_pending = Column(Boolean)
    is_round_amount = Column(Boolean)
    amount_last_digits_zero = Column(Integer)
    payment_line_repeat_count = Column(Integer, index=True)
    is_exact_duplicate_row = Column(Boolean, index=True)
    district_robust_z = Column(Float)
    vendor_robust_z = Column(Float)
    __table_args__ = (Index("ix_exp_vendor_district", "vendor_norm", "ida_district"),)


class GeoDistrict(Base):
    __tablename__ = "geo_district"
    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(64), index=True)
    state = Column(String(120), index=True)
    ida_district = Column(String(160), index=True)
    works_recommended = Column(Float)
    works_completed = Column(Float)
    work_amount = Column(Float)
    mps = Column(Float)
    payment_lines = Column(Float)
    expenditure = Column(Float)
    vendors = Column(Float)
    pending_lines = Column(Float)
    completion_rate_pct = Column(Float)
    payments_per_vendor = Column(Float)
    risk_score = Column(Float)
    high_risk_works = Column(Float)


class AnalyticsWorkRisk(Base):
    __tablename__ = "analytics_work_risk"
    work_uid = Column(String(40), primary_key=True)
    run_id = Column(String(64), index=True)
    risk_engine_version = Column(String(20))
    feature_version = Column(String(20))
    model_version = Column(String(20))
    work_stage = Column(String(20), index=True)
    mp_key = Column(String(32), index=True)
    mp_name = Column(String(255))
    state = Column(String(120), index=True)
    constituency = Column(String(160))
    ida_district = Column(String(160), index=True)
    category = Column(String(120), index=True)
    work_description = Column(Text)
    amount = Column(Float)
    event_date = Column(DateTime)
    cost_risk = Column(Float)
    duplicate_risk = Column(Float)
    delay_risk = Column(Float)
    vendor_risk = Column(Float)
    utilisation_risk = Column(Float)
    data_quality_risk = Column(Float)
    composite_risk = Column(Float, index=True)
    risk_band = Column(String(20), index=True)
    iforest_score = Column(Float)
    lof_score = Column(Float)
    cluster_label = Column(Integer)
    top_duplicate_uid = Column(String(40))
    top_duplicate_similarity = Column(Float)
    explanation = Column(Text)
    contributions = Column(Text)


class AnalyticsMPRisk(Base):
    __tablename__ = "analytics_mp_risk"
    mp_key = Column(String(32), primary_key=True)
    run_id = Column(String(64), index=True)
    risk_engine_version = Column(String(20))
    mp_name = Column(String(255))
    state = Column(String(120), index=True)
    constituency = Column(String(160))
    house = Column(String(40))
    allocated_amount = Column(Float)
    derived_expenditure = Column(Float)
    utilisation_pct = Column(Float)
    completion_rate_pct = Column(Float)
    works_total = Column(Float)
    high_risk_works = Column(Float)
    critical_risk_works = Column(Float)
    duplicate_works = Column(Float)
    top_vendor_share = Column(Float)
    vendor_hhi = Column(Float)
    repeat_payment_lines = Column(Float)
    cost_risk = Column(Float)
    duplicate_risk = Column(Float)
    delay_risk = Column(Float)
    vendor_risk = Column(Float)
    utilisation_risk = Column(Float)
    data_quality_risk = Column(Float)
    composite_risk = Column(Float, index=True)
    risk_band = Column(String(20), index=True)
    explanation = Column(Text)


class AnalyticsVendorRisk(Base):
    __tablename__ = "analytics_vendor_risk"
    vendor_uid = Column(String(40), primary_key=True)
    run_id = Column(String(64), index=True)
    vendor = Column(String(255), index=True)
    vendor_norm = Column(String(255), index=True)
    state = Column(String(120), index=True)
    ida_district = Column(String(160), index=True)
    payment_lines = Column(Float)
    total_amount = Column(Float)
    mps_served = Column(Float)
    agencies_served = Column(Float)
    district_share = Column(Float)
    repeat_line_share = Column(Float)
    round_amount_share = Column(Float)
    median_amount = Column(Float)
    amount_concentration = Column(Float)
    composite_risk = Column(Float, index=True)
    risk_band = Column(String(20), index=True)
    explanation = Column(Text)


class DuplicatePair(Base):
    __tablename__ = "duplicate_pair"
    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(64), index=True)
    left_uid = Column(String(40), index=True)
    right_uid = Column(String(40), index=True)
    similarity = Column(Float, index=True)
    match_type = Column(String(32))
    same_mp = Column(Boolean)
    same_district = Column(Boolean)
    state = Column(String(120), index=True)
    left_description = Column(Text)
    right_description = Column(Text)
    left_amount = Column(Float)
    right_amount = Column(Float)
    amount_gap_pct = Column(Float)
    explanation = Column(Text)


class Alert(Base):
    __tablename__ = "alerts"
    alert_id = Column(String(48), primary_key=True)
    run_id = Column(String(64), index=True)
    created_at = Column(String(40))
    entity_type = Column(String(24), index=True)     # work | mp | vendor | district
    entity_id = Column(String(64), index=True)
    entity_label = Column(String(255))
    state = Column(String(120), index=True)
    district = Column(String(160))
    risk_score = Column(Float, index=True)
    risk_band = Column(String(20), index=True)
    title = Column(String(255))
    detected = Column(Text)
    recommended_action = Column(Text)
    status = Column(String(24), index=True, default="OPEN")
    status_updated_at = Column(String(40))
    status_note = Column(Text)
    risk_engine_version = Column(String(20))


class AlertHistory(Base):
    __tablename__ = "alert_history"
    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_id = Column(String(48), ForeignKey("alerts.alert_id"), index=True)
    changed_at = Column(String(40))
    from_status = Column(String(24))
    to_status = Column(String(24))
    actor = Column(String(80))
    note = Column(Text)


class DataQualityMetric(Base):
    __tablename__ = "data_quality_metric"
    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(64), index=True)
    dataset = Column(String(64), index=True)
    metric = Column(String(80))
    value = Column(Float)
    detail = Column(Text)


class ValidationIssue(Base):
    __tablename__ = "validation_issue"
    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(64), index=True)
    dataset = Column(String(64), index=True)
    rule = Column(String(80), index=True)
    severity = Column(String(16))
    detail = Column(Text)
    record_count = Column(Integer)


class Lineage(Base):
    __tablename__ = "lineage"
    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(64), index=True)
    stage = Column(String(48), index=True)
    action = Column(String(80))
    detail = Column(Text)
    ts = Column(String(40))
