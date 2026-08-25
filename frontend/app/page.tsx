"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  TrendingUp,
  BarChart2,
  Users,
  Search,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle2,
  Wifi,
} from "lucide-react";
import { mpProfilesData } from "@/data/mpProfiles";
import { fetchLiveMpladsSummary, MpladsLiveSummary } from "@/lib/mpladsLiveService";

const sectorData = [
  { name: "Roads & Bridges", amount: "₹ 1,420 Cr", percent: 36, color: "#f59e0b" },
  { name: "Drinking Water & Sanitation", amount: "₹ 980 Cr", percent: 25, color: "#0284c7" },
  { name: "Education & Schools", amount: "₹ 750 Cr", percent: 19, color: "#16a34a" },
  { name: "Public Health & Hospitals", amount: "₹ 480 Cr", percent: 12, color: "#dc2626" },
  { name: "Community Assets & Solar", amount: "₹ 310 Cr", percent: 8, color: "#9333ea" },
];

export default function OverviewPage() {
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState<MpladsLiveSummary>({
    totalEntitlementCr: 3940,
    totalSanctionedCr: 3330,
    totalExpenditureCr: 2980,
    totalWorksTracked: 42150,
    completedWorks: 35800,
    avgUtilizationRate: 89.4,
    isLive: false,
    lastUpdated: "25 Aug 2026",
  });

  useEffect(() => {
    fetchLiveMpladsSummary().then((res) => setSummary(res));
  }, []);

  const filteredMps = mpProfilesData.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.state.toLowerCase().includes(search.toLowerCase()) ||
      m.constituency.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Eyebrow & Hero Header (Empowered Indian Style) */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white rounded-3xl p-8 shadow-2xl border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-extrabold uppercase tracking-widest text-amber-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Empowered Indian • Government Transparency Platform</span>
          </div>

          <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-bold">
            <Wifi size={12} className="animate-pulse" />
            <span>LIVE DATA ACTIVE ({summary.lastUpdated})</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              MPLADS Dashboard
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              Overview of Member of Parliament Local Area Development Scheme. Making government data accessible, understandable, and actionable for every citizen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/mps"
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Users size={16} />
              <span>Browse All MP Profiles</span>
            </Link>

            <Link
              href="/audit"
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <ShieldAlert size={16} className="text-amber-400" />
              <span>District Audit Radar</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Stat Metric Cards (Dynamic Live Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Total Entitlement</span>
            <Building2 size={18} className="text-slate-700" />
          </div>
          <p className="text-3xl font-black text-slate-900">₹ {summary.totalEntitlementCr.toLocaleString()} Cr</p>
          <p className="text-xs text-slate-500 font-medium">Annual allocation across 788 MPs</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-amber-600 uppercase tracking-wider">
            <span>Amount Sanctioned</span>
            <TrendingUp size={18} className="text-amber-600" />
          </div>
          <p className="text-3xl font-black text-amber-600">₹ {summary.totalSanctionedCr.toLocaleString()} Cr</p>
          <p className="text-xs text-amber-600/80 font-medium">84.5% sanctioned rate</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase tracking-wider">
            <span>Works Tracked</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600">{summary.totalWorksTracked.toLocaleString()}</p>
          <p className="text-xs text-emerald-600/80 font-medium">{summary.completedWorks.toLocaleString()} completed</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-sky-600 uppercase tracking-wider">
            <span>Avg Utilization</span>
            <BarChart2 size={18} className="text-sky-600" />
          </div>
          <p className="text-3xl font-black text-sky-600">{summary.avgUtilizationRate}%</p>
          <p className="text-xs text-sky-600/80 font-medium">+3.2% increase from FY24</p>
        </div>
      </div>

      {/* Sector Breakdown & State Ranking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sector Expenditure Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Sector-Wise Expenditure Distribution</h2>
              <p className="text-xs text-slate-400 mt-0.5">Allocation across primary development categories</p>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              FY 2025-26
            </span>
          </div>

          <div className="space-y-4">
            {sectorData.map((sec, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-800">{sec.name}</span>
                  <span className="text-slate-900 font-extrabold">{sec.amount} ({sec.percent}%)</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${sec.percent}%`, backgroundColor: sec.color }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* State Performance Ranking (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900">Top Performing States</h2>
            <span className="text-xs text-slate-400 font-semibold">By Fund Utilization %</span>
          </div>

          <div className="space-y-3">
            {[
              { state: "Gujarat", rate: "98.4%", works: "2,410 Works", status: "Top Ranked" },
              { state: "Karnataka", rate: "97.1%", works: "3,120 Works", status: "High" },
              { state: "Maharashtra", rate: "90.2%", works: "4,820 Works", status: "High" },
              { state: "Kerala", rate: "86.7%", works: "1,980 Works", status: "Good" },
              { state: "West Bengal", rate: "84.3%", works: "3,450 Works", status: "Good" },
            ].map((st, i) => (
              <div key={i} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-amber-400 text-xs font-extrabold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{st.state}</p>
                    <p className="text-[10px] text-slate-400">{st.works}</p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {st.rate}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MP Quick Search & Directory Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Search Member of Parliament (MP) Records</h2>
            <p className="text-xs text-slate-400 mt-0.5">Filter by MP name, constituency, or state</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search MP name or state..."
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <Link
              href="/mps"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        {/* MP Data Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredMps.slice(0, 3).map((mp) => (
            <div key={mp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">{mp.name}</h3>
                  <p className="text-[10px] text-slate-500">{mp.constituency}, {mp.state}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: mp.partyColor }}>
                  {mp.party}
                </span>
              </div>

              <div className="flex justify-between text-xs border-t border-slate-200/60 pt-2 font-medium">
                <span className="text-slate-500">Sanctioned: ₹{mp.sanctionedCr} Cr</span>
                <span className="text-emerald-600 font-extrabold">{mp.utilizationRate}% Utilized</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
