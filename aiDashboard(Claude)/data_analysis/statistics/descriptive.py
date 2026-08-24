"""Descriptive and statistical analysis primitives (§12).

These run *before* any anomaly threshold is chosen, so that thresholds are
derived from the observed distribution rather than assumed (critical rule 31).
"""
from __future__ import annotations

import numpy as np
import pandas as pd
from scipy import stats as sps


def describe_numeric(series: pd.Series, name: str) -> dict:
    v = pd.to_numeric(series, errors="coerce").dropna()
    if v.empty:
        return {"variable": name, "count": 0}
    q1, q3 = v.quantile(0.25), v.quantile(0.75)
    med = v.median()
    mad = float((v - med).abs().median())
    mode = v.mode()
    return {
        "variable": name,
        "count": int(v.size),
        "mean": float(v.mean()),
        "median": float(med),
        "mode": float(mode.iloc[0]) if not mode.empty else None,
        "min": float(v.min()),
        "max": float(v.max()),
        "std": float(v.std(ddof=1)),
        "variance": float(v.var(ddof=1)),
        "mad": mad,
        "p01": float(v.quantile(0.01)), "p05": float(v.quantile(0.05)),
        "p25": float(q1), "p50": float(med), "p75": float(q3),
        "p90": float(v.quantile(0.90)), "p95": float(v.quantile(0.95)),
        "p99": float(v.quantile(0.99)), "p999": float(v.quantile(0.999)),
        "iqr": float(q3 - q1),
        "skewness": float(sps.skew(v)),
        "kurtosis": float(sps.kurtosis(v)),
        "cv": float(v.std(ddof=1) / v.mean()) if v.mean() else None,
        "zero_count": int((v == 0).sum()),
        "iqr_outliers": int(((v < q1 - 1.5 * (q3 - q1)) | (v > q3 + 1.5 * (q3 - q1))).sum()),
        "extreme_iqr_outliers": int((v > q3 + 3.0 * (q3 - q1)).sum()),
        "robust_z_gt_3_5": int((0.6745 * (v - med) / mad).abs().gt(3.5).sum()) if mad > 0 else 0,
        "gini": gini(v),
    }


def gini(values: pd.Series) -> float:
    """Concentration of a positive quantity (0 = perfectly even, 1 = all in one hand)."""
    v = np.sort(pd.to_numeric(values, errors="coerce").dropna().to_numpy())
    v = v[v >= 0]
    if v.size == 0 or v.sum() == 0:
        return 0.0
    n = v.size
    idx = np.arange(1, n + 1)
    return float((2 * (idx * v).sum()) / (n * v.sum()) - (n + 1) / n)


def hhi(shares: pd.Series) -> float:
    """Herfindahl-Hirschman index over a series of amounts (returns 0..1)."""
    v = pd.to_numeric(shares, errors="coerce").dropna()
    total = v.sum()
    if total <= 0:
        return 0.0
    return float(((v / total) ** 2).sum())


def frequency_table(series: pd.Series, top: int = 20) -> list[dict]:
    counts = series.astype("string").fillna("(missing)").value_counts()
    total = counts.sum()
    return [{"value": str(k), "count": int(v), "share_pct": round(100 * v / total, 3)}
            for k, v in counts.head(top).items()]


def grouped_stats(df: pd.DataFrame, by: str, value: str, top: int = 40) -> list[dict]:
    g = df.groupby(by)[value]
    out = pd.DataFrame({
        "count": g.count(), "sum": g.sum(), "mean": g.mean(),
        "median": g.median(), "p90": g.quantile(0.90), "max": g.max(),
    }).sort_values("sum", ascending=False).head(top).reset_index()
    return out.round(3).to_dict("records")


def correlation_matrix(df: pd.DataFrame, cols: list[str], method: str = "spearman") -> dict:
    sub = df[[c for c in cols if c in df.columns]].apply(pd.to_numeric, errors="coerce")
    corr = sub.corr(method=method)
    return {"method": method, "columns": list(corr.columns),
            "matrix": corr.round(4).fillna(0).values.tolist()}


def compare_groups(df: pd.DataFrame, group_col: str, value_col: str,
                   group_a: str, group_b: str) -> dict:
    a = pd.to_numeric(df.loc[df[group_col] == group_a, value_col], errors="coerce").dropna()
    b = pd.to_numeric(df.loc[df[group_col] == group_b, value_col], errors="coerce").dropna()
    if len(a) < 10 or len(b) < 10:
        return {"comparison": f"{group_a} vs {group_b}", "sufficient_data": False}
    u, p = sps.mannwhitneyu(a, b, alternative="two-sided")
    return {
        "comparison": f"{group_a} vs {group_b}", "sufficient_data": True,
        "n_a": int(a.size), "n_b": int(b.size),
        "median_a": float(a.median()), "median_b": float(b.median()),
        "mann_whitney_u": float(u), "p_value": float(p),
        "significant_at_1pct": bool(p < 0.01),
        "interpretation": ("distributions differ significantly" if p < 0.01
                           else "no significant difference detected"),
    }


def timeseries(df: pd.DataFrame, date_col: str, value_col: str, freq: str = "ME") -> pd.DataFrame:
    ts = df.dropna(subset=[date_col]).set_index(date_col)
    out = ts[value_col].resample(freq).agg(["count", "sum", "median"]).reset_index()
    out["mom_change_pct"] = out["sum"].pct_change().mul(100).round(2)
    # Robust change detection: modified z-score on the month-over-month deltas.
    delta = out["sum"].diff()
    med = delta.median()
    mad = (delta - med).abs().median()
    out["change_robust_z"] = (0.6745 * (delta - med) / mad).round(3) if mad and mad > 0 else 0.0
    out["is_sudden_change"] = out["change_robust_z"].abs() > 3.5
    return out
