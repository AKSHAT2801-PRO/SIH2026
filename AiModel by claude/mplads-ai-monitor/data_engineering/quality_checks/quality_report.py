"""Automated data-quality report, produced after every ingestion cycle (§10)."""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from common.config import ROOT
from common.logging_utils import get_logger, utcnow

log = get_logger("quality.report")


def build_quality_report(run_id: str, cycle_manifest: dict, validations: dict,
                         cleanings: dict, linkage: dict, control_check: dict) -> dict:
    datasets = []
    for name, v in validations.items():
        c = cleanings[name]
        issue_counts = (v.issues.groupby(["rule", "severity"]).size()
                        .reset_index(name="count").sort_values("count", ascending=False))
        missing = c.missing_profile
        datasets.append({
            "dataset": name,
            "records_received": v.records_in,
            "records_valid": v.records_valid,
            "records_quarantined": v.records_quarantined,
            "validity_rate_pct": v.validity_rate,
            "warned_records": int(v.metrics.get("warn_records", 0)),
            "full_duplicate_rows": int(v.metrics.get("full_duplicate_rows", 0)),
            "missing_cell_pct": v.metrics.get("missing_cell_pct", 0.0),
            "columns_with_missing": missing[missing["missing_count"] > 0]
                .sort_values("missing_count", ascending=False).to_dict("records"),
            "top_issues": issue_counts.head(15).to_dict("records"),
            "duplicate_log": c.duplicate_log.to_dict("records"),
            "standardisation": c.standardisation_counts,
            "outlier_flags": c.outlier_counts,
            "notes": c.notes,
        })

    total_in = sum(d["records_received"] for d in datasets)
    total_valid = sum(d["records_valid"] for d in datasets)
    total_dup = sum(d["full_duplicate_rows"] for d in datasets)
    total_missing_critical = sum(
        sum(col["missing_count"] for col in d["columns_with_missing"]) for d in datasets
    )

    # Composite score: validity, completeness, uniqueness and reconciliation,
    # each expressed as a percentage and averaged with equal weight.
    validity = 100 * total_valid / max(total_in, 1)
    completeness = 100 - (sum(d["missing_cell_pct"] for d in datasets) / max(len(datasets), 1))
    uniqueness = 100 * (1 - total_dup / max(total_in, 1))
    reconciliation = control_check.get("reconciliation_score_pct", 100.0)
    overall = round((validity + completeness + uniqueness + reconciliation) / 4, 2)

    report = {
        "run_id": run_id,
        "generated_at": utcnow(),
        "source": cycle_manifest.get("official_portal"),
        "portal_reachable": bool((cycle_manifest.get("portal_discovery") or {}).get("reachable")),
        "snapshot_used": cycle_manifest.get("snapshot_used"),
        "totals": {
            "records_received": total_in,
            "records_valid": total_valid,
            "records_quarantined": total_in - total_valid,
            "duplicate_records": total_dup,
            "missing_critical_field_cells": total_missing_critical,
        },
        "scores": {
            "validity_pct": round(validity, 2),
            "completeness_pct": round(completeness, 2),
            "uniqueness_pct": round(uniqueness, 2),
            "reconciliation_pct": round(reconciliation, 2),
            "overall_data_quality_pct": overall,
        },
        "datasets": datasets,
        "linkage": linkage,
        "control_totals_check": control_check,
    }

    out_dir = ROOT / "outputs" / "reports"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "data_quality_report.json").write_text(json.dumps(report, indent=2, default=str))
    _write_text_report(report, out_dir / "data_quality_report.txt")
    log.info("Data quality: %.2f%% overall (validity %.2f, completeness %.2f, uniqueness %.2f, reconciliation %.2f)",
             overall, validity, completeness, uniqueness, reconciliation)
    return report


def _write_text_report(report: dict, path: Path) -> None:
    lines = [
        "=" * 78,
        "MPLADS DATA QUALITY REPORT",
        "=" * 78,
        f"Run id            : {report['run_id']}",
        f"Generated         : {report['generated_at']}",
        f"Official source   : {report['source']}",
        f"Portal reachable  : {report['portal_reachable']}",
        f"Snapshot used     : {report['snapshot_used']}",
        "",
        f"Records received        : {report['totals']['records_received']:>10,}",
        f"Valid records           : {report['totals']['records_valid']:>10,}",
        f"Quarantined records     : {report['totals']['records_quarantined']:>10,}",
        f"Duplicate records       : {report['totals']['duplicate_records']:>10,}",
        f"Missing critical cells  : {report['totals']['missing_critical_field_cells']:>10,}",
        "",
        f"Overall data quality    : {report['scores']['overall_data_quality_pct']:.2f}%",
        f"  validity              : {report['scores']['validity_pct']:.2f}%",
        f"  completeness          : {report['scores']['completeness_pct']:.2f}%",
        f"  uniqueness            : {report['scores']['uniqueness_pct']:.2f}%",
        f"  reconciliation        : {report['scores']['reconciliation_pct']:.2f}%",
        "",
        "-" * 78,
        "PER DATASET",
        "-" * 78,
    ]
    for d in report["datasets"]:
        lines += [
            f"\n{d['dataset']}",
            f"  received {d['records_received']:,} | valid {d['records_valid']:,} "
            f"| quarantined {d['records_quarantined']:,} | validity {d['validity_rate_pct']}%",
            f"  duplicate rows {d['full_duplicate_rows']:,} | mean missing cells {d['missing_cell_pct']}%",
        ]
        for issue in d["top_issues"][:6]:
            lines.append(f"    - [{issue['severity']}] {issue['rule']}: {issue['count']:,}")
        for note in d["notes"]:
            lines.append(f"    ! {note}")
    lines += ["", "-" * 78, "CROSS-DATASET LINKAGE", "-" * 78]
    for k, v in report["linkage"].items():
        if k != "unsupported_joins":
            lines.append(f"  {k}: {v}")
    for item in report["linkage"].get("unsupported_joins", []):
        lines.append(f"  ! UNSUPPORTED: {item}")
    lines += ["", "-" * 78, "RECONCILIATION AGAINST PORTAL CONTROL TOTALS", "-" * 78]
    for row in report["control_totals_check"].get("checks", []):
        lines.append(f"  {row['metric']:<28} portal={row['portal']:>18,.2f}  computed={row['computed']:>18,.2f}"
                     f"  diff={row['diff_pct']:>8.4f}%")
    path.write_text("\n".join(lines))
