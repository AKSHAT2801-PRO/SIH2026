"use client";

import { useEffect, useState } from "react";
import { works } from "@/data/works";
import { getRiskBandCounts, getRiskBand } from "@/lib/riskUtils";
import StatCard from "@/components/overview/StatCard";
import SkeletonCard from "@/components/shared/SkeletonCard";
import RiskDistributionChart from "@/components/overview/RiskDistributionChart";
import StateDrillTable from "@/components/overview/StateDrillTable";
import RecentFlagsPanel from "@/components/overview/RecentFlagsPanel";
import { BarChart2, AlertTriangle, IndianRupee, ClipboardCheck } from "lucide-react";

const bandColors: Record<string, string> = {
  Low: "#16a34a",
  Medium: "#d97706",
  High: "#dc2626",
  Critical: "#991b1b",
};

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const counts = getRiskBandCounts(works);
  const totalWorks = works.length;
  const highRiskWorks = works.filter((w) => getRiskBand(w.riskScore) === "high" || getRiskBand(w.riskScore) === "critical").length;
  const totalExposure = works
    .filter((w) => getRiskBand(w.riskScore) === "high" || getRiskBand(w.riskScore) === "critical")
    .reduce((sum, w) => sum + w.sanctionedAmount, 0);
  const underReview = works.filter(
    (w) => w.status === "under_review" || w.status === "escalated"
  ).length;

  const chartData = [
    { band: "Low (0–30)", count: counts.low, color: bandColors.Low },
    { band: "Medium (31–60)", count: counts.medium, color: bandColors.Medium },
    { band: "High (61–80)", count: counts.high, color: bandColors.High },
    { band: "Critical (81–100)", count: counts.critical, color: bandColors.Critical },
  ];

  const recentHighRisk = works
    .filter((w) => w.riskScore > 60)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Overview Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          AI-flagged risk indicators — human review required before action
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              label="Total Works"
              value={totalWorks}
              sub="All states combined"
              icon={BarChart2}
              accent="default"
            />
            <StatCard
              label="High-Risk Works"
              value={highRiskWorks}
              sub="Score > 60 — flagged for review"
              icon={AlertTriangle}
              accent="red"
            />
            <StatCard
              label="Financial Exposure"
              value={`₹${totalExposure.toFixed(1)}L`}
              sub="Sanctioned in high-risk works"
              icon={IndianRupee}
              accent="amber"
            />
            <StatCard
              label="Works Under Review"
              value={underReview}
              sub="Active review or escalated"
              icon={ClipboardCheck}
              accent="default"
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RiskDistributionChart data={chartData} />

        {/* Summary note card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-center">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">System Note</h2>
          <div className="space-y-3 text-sm text-slate-600">
            <p className="flex gap-2">
              <span className="text-amber-500 font-bold shrink-0">⚠</span>
              This dashboard surfaces <strong>risk indicators</strong> only. It does not make determinations of fraud or misconduct.
            </p>
            <p className="flex gap-2">
              <span className="text-sky-500 font-bold shrink-0">ℹ</span>
              All flagged works require <strong>authorized human review</strong> before any administrative action is taken.
            </p>
            <p className="flex gap-2">
              <span className="text-green-600 font-bold shrink-0">✓</span>
              {totalWorks - highRiskWorks} works are below risk threshold — routine monitoring applies.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-400 italic">
              Last data refresh: 24 Aug 2026 · Next scheduled: 25 Aug 2026
            </p>
          </div>
        </div>
      </div>

      {/* Bottom row: table + flags */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <StateDrillTable works={works} />
        </div>
        <div className="lg:col-span-2">
          <RecentFlagsPanel works={recentHighRisk} />
        </div>
      </div>
    </div>
  );
}
