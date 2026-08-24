"""Alert & early-warning system (§24).

An alert is raised when an explained risk score crosses the configured
threshold. Alerts carry a lifecycle (OPEN → UNDER_REVIEW → VERIFIED /
FALSE_POSITIVE → RESOLVED) and every transition is written to an immutable
history table so the review trail survives re-runs.
"""
from __future__ import annotations

import hashlib

import pandas as pd

from common.config import get_config
from common.logging_utils import get_logger, utcnow

log = get_logger("alerts.engine")


def _alert_id(entity_type: str, entity_id: str) -> str:
    return f"ALRT-{entity_type[:3].upper()}-{hashlib.sha1(f'{entity_type}:{entity_id}'.encode()).hexdigest()[:12]}"


def generate_alerts(work_risk: pd.DataFrame, mp_risk: pd.DataFrame,
                    vendor_risk: pd.DataFrame, run_id: str) -> pd.DataFrame:
    cfg = get_config()
    min_score = cfg["alerts.min_risk_score"]
    cap = cfg["alerts.max_alerts_per_cycle"]
    rows: list[dict] = []

    def detected_lines(r: pd.Series, mapping: dict[str, str]) -> str:
        bullets = [text for col, text in mapping.items() if float(r.get(col) or 0) >= 50]
        return "\n".join(f"• {b}" for b in bullets) or "• Composite risk above the alert threshold"

    w = work_risk[work_risk["composite_risk"] >= min_score].nlargest(cap, "composite_risk")
    for _, r in w.iterrows():
        rows.append({
            "alert_id": _alert_id("work", r["work_uid"]),
            "run_id": run_id, "created_at": utcnow(),
            "entity_type": "work", "entity_id": r["work_uid"],
            "entity_label": (str(r.get("work_description") or "")[:180] or r["work_uid"]),
            "state": r.get("state"), "district": r.get("ida_district"),
            "risk_score": float(r["composite_risk"]), "risk_band": r["risk_band"],
            "title": f"{r['risk_band'].title()} risk work in {r.get('ida_district') or r.get('state')}",
            "detected": detected_lines(r, {
                "cost_risk": "Significant cost deviation from comparable works",
                "duplicate_risk": "Work description closely repeats other recorded works",
                "delay_risk": "Work has stayed open far longer than comparable works",
                "vendor_risk": "Payments in this district are concentrated on few vendors",
                "utilisation_risk": "Responsible MP shows unusual fund-utilisation behaviour",
                "data_quality_risk": "Source record is incomplete or internally inconsistent",
            }),
            "recommended_action": ("Review the sanction file, the measurement book and the payment "
                                   "vouchers for this work with the implementing district authority."),
            "status": "OPEN", "status_updated_at": utcnow(), "status_note": None,
            "risk_engine_version": r.get("risk_engine_version"),
        })

    m = mp_risk[mp_risk["composite_risk"] >= min_score].nlargest(cap, "composite_risk")
    for _, r in m.iterrows():
        rows.append({
            "alert_id": _alert_id("mp", r["mp_key"]),
            "run_id": run_id, "created_at": utcnow(),
            "entity_type": "mp", "entity_id": r["mp_key"],
            "entity_label": f"{r['mp_name']} ({r.get('constituency')}, {r.get('state')})",
            "state": r.get("state"), "district": None,
            "risk_score": float(r["composite_risk"]), "risk_band": r["risk_band"],
            "title": f"{r['risk_band'].title()} aggregate risk for MP constituency portfolio",
            "detected": detected_lines(r, {
                "vendor_risk": "Payments concentrated on a single vendor",
                "utilisation_risk": "Large unspent balance or stalled payments",
                "delay_risk": "Low completion rate across recommended works",
                "duplicate_risk": "Repeated work descriptions across the portfolio",
                "cost_risk": "Multiple works costed above comparable works",
                "data_quality_risk": "Published totals disagree with the underlying payment lines",
            }),
            "recommended_action": ("Request a constituency-level utilisation and vendor-selection review "
                                   "from the State Nodal Agency."),
            "status": "OPEN", "status_updated_at": utcnow(), "status_note": None,
            "risk_engine_version": r.get("risk_engine_version"),
        })

    v = vendor_risk[vendor_risk["composite_risk"] >= min_score].nlargest(cap, "composite_risk")
    for _, r in v.iterrows():
        rows.append({
            "alert_id": _alert_id("vendor", r["vendor_uid"]),
            "run_id": run_id, "created_at": utcnow(),
            "entity_type": "vendor", "entity_id": r["vendor_uid"],
            "entity_label": str(r.get("vendor"))[:180],
            "state": r.get("state"), "district": r.get("ida_district"),
            "risk_score": float(r["composite_risk"]), "risk_band": r["risk_band"],
            "title": f"{r['risk_band'].title()} vendor concentration in {r.get('ida_district')}",
            "detected": "• " + "\n• ".join(str(r["explanation"]).split(". ")[:3]),
            "recommended_action": ("Check tender and quotation records for this vendor with the "
                                   "implementing district authority."),
            "status": "OPEN", "status_updated_at": utcnow(), "status_note": None,
            "risk_engine_version": "1.0.0",
        })

    alerts = pd.DataFrame(rows)
    if not alerts.empty:
        alerts = alerts.drop_duplicates(subset=["alert_id"]).sort_values("risk_score", ascending=False)
    log.info("Alerts generated: %d (threshold %d)", len(alerts), min_score)
    return alerts


def transition(session, alert_id: str, to_status: str, actor: str, note: str | None = None) -> dict:
    """Move an alert through its lifecycle, appending to the immutable history."""
    from backend.database.models import Alert, AlertHistory
    cfg = get_config()
    if to_status not in cfg["alerts.states"]:
        raise ValueError(f"unknown alert state '{to_status}'")
    alert = session.get(Alert, alert_id)
    if alert is None:
        raise KeyError(alert_id)
    history = AlertHistory(alert_id=alert_id, changed_at=utcnow(), from_status=alert.status,
                           to_status=to_status, actor=actor, note=note)
    alert.status = to_status
    alert.status_updated_at = utcnow()
    alert.status_note = note
    session.add(history)
    session.commit()
    return {"alert_id": alert_id, "status": to_status, "changed_at": history.changed_at}
