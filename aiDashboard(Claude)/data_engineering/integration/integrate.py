"""Integration layer — conform the four official exports around real keys only.

What the source actually supports
---------------------------------
* ``mp_key`` (normalised MP name + state + house) joins **all four** datasets.
* ``work_id`` joins the two work exports — but the overlap is tiny, so the
  recommended→completed lifecycle is *not* a supported join (measured, reported).
* Expenditure lines carry **no** work id, only a free-text description, so the
  payment→work link is reported as a coverage ratio, never forced (§9).
"""
from __future__ import annotations

import numpy as np
import pandas as pd

from common.logging_utils import get_logger

log = get_logger("integration.integrate")


def linkage_report(recommended: pd.DataFrame, completed: pd.DataFrame,
                   expenditures: pd.DataFrame, mp_summary: pd.DataFrame) -> dict:
    rec_ids = set(recommended["work_id"].dropna())
    com_ids = set(completed["work_id"].dropna())
    exp_key = expenditures["mp_key"].astype("string") + "||" + expenditures["description_norm"].astype("string")
    rec_key = set(recommended["mp_key"].astype("string") + "||" + recommended["description_norm"].astype("string"))
    com_key = set(completed["mp_key"].astype("string") + "||" + completed["description_norm"].astype("string"))

    mp_keys = set(mp_summary["mp_key"].dropna())
    report = {
        "work_id_overlap_recommended_completed": len(rec_ids & com_ids),
        "work_id_overlap_pct_of_completed": round(100 * len(rec_ids & com_ids) / max(len(com_ids), 1), 3),
        "expenditure_to_work_description_match_pct": round(
            100 * float(exp_key.isin(rec_key | com_key).mean()), 3),
        "mp_key_coverage_recommended_pct": round(
            100 * float(recommended["mp_key"].isin(mp_keys).mean()), 2),
        "mp_key_coverage_completed_pct": round(
            100 * float(completed["mp_key"].isin(mp_keys).mean()), 2),
        "mp_key_coverage_expenditures_pct": round(
            100 * float(expenditures["mp_key"].isin(mp_keys).mean()), 2),
        "mp_dimension_rows": len(mp_summary),
    }
    report["supported_joins"] = ["mp_key (all datasets)", "state / constituency / ida_district (all datasets)"]
    report["unsupported_joins"] = []
    if report["work_id_overlap_pct_of_completed"] < 5:
        report["unsupported_joins"].append(
            "recommended_work -> completed_work by work_id: only "
            f"{report['work_id_overlap_recommended_completed']} ids are shared "
            f"({report['work_id_overlap_pct_of_completed']}% of completed works). "
            "Per-work approval-to-completion duration is therefore NOT computable and is not estimated."
        )
    if report["expenditure_to_work_description_match_pct"] < 20:
        report["unsupported_joins"].append(
            "expenditure -> work: the portal publishes no work id on payment lines and only "
            f"{report['expenditure_to_work_description_match_pct']}% of payment descriptions match a work "
            "description exactly. Payments are therefore analysed at MP / vendor / district level."
        )
    log.info("Linkage report: %s", {k: v for k, v in report.items() if k != "unsupported_joins"})
    return report


def build_mp_dimension(mp_summary: pd.DataFrame, works: pd.DataFrame,
                       expenditures: pd.DataFrame) -> pd.DataFrame:
    """Conformed MP dimension: portal-published figures + independently recomputed ones.

    Both are kept. Where the portal's published total and the sum of the detail
    rows disagree, the gap is itself a data-quality signal, so it is measured
    rather than reconciled away.
    """
    dim = mp_summary.copy()

    rec = works[works["work_stage"] == "RECOMMENDED"]
    com = works[works["work_stage"] == "COMPLETED"]

    agg_rec = rec.groupby("mp_key").agg(
        derived_recommended_works=("work_uid", "count"),
        derived_recommended_amount=("amount", "sum"),
        derived_first_recommendation=("event_date", "min"),
        derived_last_recommendation=("event_date", "max"),
    )
    agg_com = com.groupby("mp_key").agg(
        derived_completed_works=("work_uid", "count"),
        derived_completed_amount=("amount", "sum"),
        derived_last_completion=("event_date", "max"),
    )
    agg_exp = expenditures.groupby("mp_key").agg(
        derived_payment_lines=("expenditure_uid", "count"),
        derived_expenditure=("amount", "sum"),
        derived_vendors=("vendor_norm", "nunique"),
        derived_agencies=("ida", "nunique"),
        derived_pending_lines=("payment_pending", "sum"),
        derived_last_payment=("event_date", "max"),
    )
    exp_success = (expenditures[expenditures["payment_success"]]
                   .groupby("mp_key")["amount"].sum().rename("derived_expenditure_success"))

    dim = (dim.set_index("mp_key")
              .join([agg_rec, agg_com, agg_exp, exp_success], how="left")
              .reset_index())

    for col in ("derived_recommended_works", "derived_completed_works", "derived_payment_lines",
                "derived_recommended_amount", "derived_completed_amount", "derived_expenditure",
                "derived_expenditure_success", "derived_vendors", "derived_agencies",
                "derived_pending_lines"):
        if col in dim.columns:
            dim[col] = pd.to_numeric(dim[col], errors="coerce").fillna(0)

    alloc = pd.to_numeric(dim["allocated_amount"], errors="coerce")
    published_exp = pd.to_numeric(dim["total_expenditure"], errors="coerce")

    dim["derived_utilisation_pct"] = (100 * dim["derived_expenditure"] / alloc.replace(0, np.nan)).round(3)
    dim["published_vs_derived_expenditure_gap"] = (published_exp - dim["derived_expenditure"]).round(2)
    dim["published_vs_derived_expenditure_gap_pct"] = (
        100 * dim["published_vs_derived_expenditure_gap"] / published_exp.replace(0, np.nan)
    ).round(3)
    dim["derived_completion_rate_pct"] = (
        100 * dim["derived_completed_works"] /
        (dim["derived_completed_works"] + dim["derived_recommended_works"]).replace(0, np.nan)
    ).round(3)
    dim["unspent_pct"] = (100 * pd.to_numeric(dim["unspent_amount"], errors="coerce")
                          / alloc.replace(0, np.nan)).round(3)
    dim["pending_payment_share"] = (
        pd.to_numeric(dim["pending_payments"], errors="coerce")
        / pd.to_numeric(dim["transaction_count"], errors="coerce").replace(0, np.nan)
    ).round(4)
    log.info("MP dimension built: %d MPs", len(dim))
    return dim


def build_geography(works: pd.DataFrame, expenditures: pd.DataFrame) -> pd.DataFrame:
    """State + district aggregates (the only geography the source publishes)."""
    w = works.groupby(["state", "ida_district"], dropna=False).agg(
        works_recommended=("work_stage", lambda s: int((s == "RECOMMENDED").sum())),
        works_completed=("work_stage", lambda s: int((s == "COMPLETED").sum())),
        work_amount=("amount", "sum"),
        mps=("mp_key", "nunique"),
    )
    e = expenditures.groupby(["state", "ida_district"], dropna=False).agg(
        payment_lines=("expenditure_uid", "count"),
        expenditure=("amount", "sum"),
        vendors=("vendor_norm", "nunique"),
        pending_lines=("payment_pending", "sum"),
    )
    geo = w.join(e, how="outer").reset_index().fillna(0)
    geo["completion_rate_pct"] = (
        100 * geo["works_completed"] / (geo["works_completed"] + geo["works_recommended"]).replace(0, np.nan)
    ).round(2)
    geo["payments_per_vendor"] = (geo["payment_lines"] / geo["vendors"].replace(0, np.nan)).round(2)
    return geo
