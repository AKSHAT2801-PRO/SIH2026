import React, { useEffect, useMemo, useState } from "react";
import {
  ShieldAlert,
  Users,
  ClipboardList,
  MessageSquare,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import indiaMap from "@svg-maps/india";
import Navbar from "../components/Navbar";
import ProjectDrawer from "../components/ProjectDrawer";
import { RiskBadge, StatusPill, InspectionPill, formatINR } from "../components/ui";
import {
  fetchDashboardStats,
  fetchAllWorks,
  fetchStateSummaries,
  fetchAllMPs,
  fetchMPPerformance,
  fetchReviews,
  markForInspection,
} from "../dataService";

const CHART_COLORS = { completed: "#4A7C59", inProgress: "#1C2B4A", flagged: "#B3453B" };

function getInitials(name) {
  if (!name) return "—";
  // Strip parenthetical term info like "(2020-26)" and honorifics before taking initials
  const cleaned = name
    .replace(/\(.*?\)/g, "")
    .replace(/^(Shri|Shrimati|Dr\.?|Smt\.?)\s+/i, "")
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="border border-[#D8D3C7] bg-white p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] text-[#8993A8]">{label}</span>
        {Icon && <Icon size={15} className="text-[#B8863F]" />}
      </div>
      <div
        className="text-[#1C2B4A] text-[1.6rem]"
        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
      >
        {value}
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
      <div>
        <span className="text-[#B8863F] text-[11.5px] mb-1.5 block">{eyebrow}</span>
        <h2
          className="text-[#1C2B4A] text-[1.4rem] leading-tight"
          style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
        >
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function IndiaWorksMap({ summaries }) {
  const [hoveredState, setHoveredState] = useState(null);
  const summaryByState = useMemo(
    () => new Map(summaries.map((summary) => [summary.state.toLowerCase(), summary])),
    [summaries]
  );
  const maxWorks = Math.max(...summaries.map((summary) => Number(summary.works) || 0), 1);
  const hoveredSummary = hoveredState
    ? summaryByState.get(hoveredState.name.toLowerCase())
    : null;

  return (
    <div className="grid md:grid-cols-[1fr_210px] items-center gap-4">
      <svg
        viewBox={indiaMap.viewBox}
        role="img"
        aria-label="India works by state map"
        className="w-full h-[340px]"
      >
        {indiaMap.locations.map((location) => {
          const summary = summaryByState.get(location.name.toLowerCase());
          const intensity = summary ? 0.18 + (Number(summary.works) / maxWorks) * 0.72 : 0.08;
          return (
            <path
              key={location.id}
              d={location.path}
              aria-label={location.name}
              fill={`rgba(28, 43, 74, ${intensity})`}
              stroke="#FAF9F6"
              strokeWidth="1.2"
              className="cursor-pointer transition-all hover:brightness-125"
              onMouseEnter={() => setHoveredState(location)}
              onMouseLeave={() => setHoveredState(null)}
            />
          );
        })}
      </svg>
      <div className="min-h-[150px] border-l border-[#EFECE3] pl-4">
        <div className="text-[11px] uppercase tracking-wide text-[#B8863F] mb-2">
          Hover a state
        </div>
        {hoveredState ? (
          <>
            <h3 className="text-[#1C2B4A] text-[17px] mb-3">{hoveredState.name}</h3>
            <div className="space-y-2 text-[12px] text-[#5A6478]">
              <div className="flex justify-between gap-4"><span>Total works</span><strong>{hoveredSummary?.works ?? 0}</strong></div>
              <div className="flex justify-between gap-4"><span>High risk</span><strong>{hoveredSummary?.high_risk ?? 0}</strong></div>
              <div className="flex justify-between gap-4"><span>Mean risk</span><strong>{hoveredSummary?.mean_risk ?? "—"}</strong></div>
              <div className="flex justify-between gap-4"><span>Work value</span><strong>{formatINR(hoveredSummary?.work_value ?? 0)}</strong></div>
            </div>
          </>
        ) : (
          <p className="text-[12px] leading-relaxed text-[#8993A8]">Move over a state to inspect its work and risk results.</p>
        )}
      </div>
    </div>
  );
}

export default function GovernmentDashboard({ onNavigateToProject, onLogout }) {
  const [stats, setStats] = useState(null);
  const [works, setWorks] = useState([]);
  const [workPage, setWorkPage] = useState(1);
  const [workQuery, setWorkQuery] = useState("");
  const [workSearch, setWorkSearch] = useState("");
  const [worksLoading, setWorksLoading] = useState(true);
  const workLimit = 30;
  const [stateSummaries, setStateSummaries] = useState([]);
  const [mps, setMPs] = useState([]);
  const [mpPage, setMPPage] = useState(1);
  const [mpLimit,setMpLimit] = useState(30);
  const [mpsLoading, setMPsLoading] = useState(true);
  const [mpsError, setMPsError] = useState("");
  const [mpPerformance, setMPPerformance] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [drawerWork, setDrawerWork] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [markingId, setMarkingId] = useState(null);
  const [reviewFilter, setReviewFilter] = useState("all"); // all | negative | positive
  const [mpSortOrder, setMpSortOrder] = useState("desc");
  const [mpPerformancePage, setMpPerformancePage] = useState(1);
  const mpPerformanceLimit = 30;

  useEffect(() => {
    let cancelled = false;
    setWorksLoading(true);
    setError("");
    Promise.allSettled([
      fetchDashboardStats(),
      fetchAllWorks({
        sortByRisk: true,
        page: workPage,
        limit: workLimit,
        mpName: workSearch,
      }),
    ])
      .then(([statsResult, worksResult]) => {
        if (cancelled) return;
        if (statsResult.status === "fulfilled") setStats(statsResult.value);
        if (worksResult.status === "fulfilled") {
          setWorks(worksResult.value);
        } else {
          throw worksResult.reason;
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load dashboard data.");
      })
      .finally(() => {
        if (!cancelled) {
          setWorksLoading(false);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [workPage, workLimit, workSearch]);

  useEffect(() => {
    fetchStateSummaries()
      .then(setStateSummaries)
      .catch((err) => setError(err.message || "Failed to load state map."));
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchMPPerformance()
      .then((items) => {
        if (!cancelled) setMPPerformance(items);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load MP performance.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // All MPs table — paginated separately from the block above, since
  // fetchAllMPs is the one thing currently uncommented/live.
  useEffect(() => {
    let cancelled = false;
    setMPsLoading(true);
    setMPsError("");

    fetchAllMPs({ page: mpPage, limit: mpLimit })
      .then((items) => {
        if (cancelled) return;
        console.log(items);
        
        setMPs(items);
      })
      .catch((err) => {
        if (!cancelled) setMPsError(err.message || "Failed to load MPs.");
      })
      .finally(() => {
        if (!cancelled) setMPsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mpPage, mpLimit]);

  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Completed", value: stats.completed, color: CHART_COLORS.completed },
      { name: "In Progress", value: stats.inProgress, color: CHART_COLORS.inProgress },
    ];
  }, [stats]);

  const filteredReviews = useMemo(() => {
    if (reviewFilter === "all") return reviews;
    return reviews.filter((r) => r.sentiment === reviewFilter);
  }, [reviews, reviewFilter]);

  const sortedMPPerformance = useMemo(() => {
    return [...mpPerformance].sort((a, b) =>
      mpSortOrder === "desc"
        ? b.suspicionScore - a.suspicionScore
        : a.suspicionScore - b.suspicionScore
    );
  }, [mpPerformance, mpSortOrder]);

  const visibleMPPerformance = sortedMPPerformance.slice(
    (mpPerformancePage - 1) * mpPerformanceLimit,
    mpPerformancePage * mpPerformanceLimit
  );

  const mpPerformancePageCount = Math.max(
    1,
    Math.ceil(sortedMPPerformance.length / mpPerformanceLimit)
  );

  const openDrawer = (work) => {
    setDrawerWork(work);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const handleMarkForInspection = async (workId) => {
    setMarkingId(workId);
    try {
      await markForInspection(workId);
      setWorks((prev) =>
        prev.map((w) => (w.id === workId ? { ...w, inspectionStatus: "flagged" } : w))
      );
      setDrawerWork((prev) =>
        prev && prev.id === workId ? { ...prev, inspectionStatus: "flagged" } : prev
      );
    } catch (err) {
      setError(err.message || "Failed to flag project for inspection.");
    } finally {
      setMarkingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#5A6478] text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Navbar isAuthenticated userLabel="Government" onLogout={onLogout} />

      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="mb-8">
          <span className="text-[#B8863F] text-[12px] mb-1.5 block">Government dashboard</span>
          <h1
            className="text-[#1C2B4A] text-[2rem] leading-tight"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            Oversight across all MPLAD works
          </h1>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 border border-[#B3453B]/30 bg-[#B3453B]/5 px-4 py-3 text-[#B3453B] text-[13px] flex items-center gap-2"
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          <StatCard label="Total works" value={stats?.totalWorks ?? "—"} icon={ClipboardList} />
          <StatCard label="Completed" value={stats?.completed ?? "—"} icon={ClipboardList} />
          <StatCard label="In progress" value={stats?.inProgress ?? "—"} icon={ClipboardList} />
          <StatCard label="Flagged for inspection" value={stats?.flaggedForInspection ?? "—"} icon={ShieldAlert} />
          <StatCard label="Total MPs" value={stats?.totalMPs ?? "—"} icon={Users} />
        </div>

        {/* GRAPHS */}
        <section className="mb-14">
          <SectionHeader eyebrow="Overview" title="Completed vs In Progress works" />
          <div className="grid lg:grid-cols-[0.9fr_1.4fr] gap-4">
            <div className="border border-[#D8D3C7] bg-white p-6">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: "12px", border: "1px solid #D8D3C7", borderRadius: 0 }} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "12px", color: "#5A6478" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="border border-[#D8D3C7] bg-white p-6">
              <div className="text-[12px] text-[#8993A8] mb-2">Works by state</div>
              <IndiaWorksMap summaries={stateSummaries} />
            </div>
          </div>
        </section>

        {/* RISK-SORTED PROJECT LIST */}
        <section className="mb-14">
          <SectionHeader
            eyebrow="Needs attention"
            title="Projects by risk score"
            action={
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setWorkPage(1);
                  setWorkSearch(workQuery);
                }}
                className="flex gap-2"
              >
                <input
                  value={workQuery}
                  onChange={(event) => {
                    const value = event.target.value;
                    setWorkQuery(value);
                    setWorkPage(1);
                    setWorkSearch(value);
                  }}
                  placeholder="Search by MP name"
                  className="w-48 border border-[#D8D3C7] bg-white px-3 py-1.5 text-[12px] text-[#1C2B4A] outline-none focus:border-[#1C2B4A]"
                />
                <button
                  type="submit"
                  className="border border-[#1C2B4A] px-3 py-1.5 text-[12px] text-[#1C2B4A] hover:bg-[#1C2B4A] hover:text-white transition-colors"
                >
                  Search
                </button>
              </form>
            }
          />
          <div className="border border-[#D8D3C7] bg-white relative">
            {worksLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                <Loader2 size={18} className="animate-spin text-[#5A6478]" />
              </div>
            )}
            {works.length === 0 && !worksLoading ? (
              <div className="px-5 py-8 text-center text-[#8993A8] text-[13px]">
                No works match this MP name.
              </div>
            ) : works.map((w, i) => (
              <button
                key={w.id}
                onClick={() => openDrawer(w)}
                className={`w-full text-left flex items-center gap-4 px-5 py-4 hover:bg-[#F3F1EB] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1C2B4A] ${
                  i !== 0 ? "border-t border-[#EFECE3]" : ""
                }`}
              >
                <span className="w-6 text-[12px] text-[#8993A8] shrink-0">
                  {(workPage - 1) * workLimit + i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[#1C2B4A] text-[13.5px] truncate">{w.title}</div>
                  <div className="flex items-center gap-1.5 text-[#8993A8] text-[11.5px] mt-0.5">
                    <MapPin size={11} />
                    {w.location} · {w.mp}
                  </div>
                </div>
                <RiskBadge score={w.riskScore} band={w.riskBand} />
                <InspectionPill status={w.inspectionStatus} />
                <ChevronRight size={15} className="text-[#8993A8] shrink-0" />
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setWorkPage((page) => Math.max(1, page - 1))}
              disabled={workPage === 1 || worksLoading}
              className="inline-flex items-center gap-1.5 border border-[#D8D3C7] px-4 py-2 text-[13px] text-[#1C2B4A] hover:border-[#1C2B4A] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <span className="text-[12.5px] text-[#8993A8]">
              Page {workPage}
              {workSearch && ` · ${workSearch}`}
            </span>
            <button
              onClick={() => setWorkPage((page) => page + 1)}
              disabled={worksLoading || works.length < workLimit}
              className="inline-flex items-center gap-1.5 border border-[#D8D3C7] px-4 py-2 text-[13px] text-[#1C2B4A] hover:border-[#1C2B4A] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* MP PERFORMANCE LIST */}
        <section className="mb-14">
          <SectionHeader
            eyebrow="Accountability"
            title="MP performance"
            action={
              <div className="flex border border-[#D8D3C7]">
                {[
                  { value: "desc", label: "Most suspicious" },
                  { value: "asc", label: "Least suspicious" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setMpSortOrder(option.value);
                      setMpPerformancePage(1);
                    }}
                    className={`px-3 py-1.5 text-[12px] transition-colors ${
                      mpSortOrder === option.value
                        ? "bg-[#1C2B4A] text-[#FAF9F6]"
                        : "text-[#5A6478] hover:bg-[#F3F1EB]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            }
          />
          <div className="border border-[#D8D3C7] bg-white">
            {visibleMPPerformance.map((mp, i) => (
              <div
                key={mp._id}
                className={`flex items-center gap-4 px-5 py-4 ${i !== 0 ? "border-t border-[#EFECE3]" : ""}`}
              >
                <span className="w-6 text-[12px] text-[#8993A8] shrink-0">{i + 1}</span>
                <div className="w-9 h-9 rounded-full bg-[#1C2B4A] text-[#FAF9F6] text-[12px] flex items-center justify-center shrink-0">
                  {getInitials(mp.mpName)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[#1C2B4A] text-[13.5px] truncate">{mp.mpName}</div>
                  <div className="text-[#8993A8] text-[11.5px] mt-0.5">
                    {mp.constituency}, {mp.state} · {mp.house}
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-5 text-[11.5px] text-[#5A6478] shrink-0">
                  <div className="text-center">
                    <div className="text-[#1C2B4A] text-[13px]">
                      {mp.utilizationPercentage != null ? `${mp.utilizationPercentage.toFixed(1)}%` : "—"}
                    </div>
                    <div className="text-[10px] text-[#8993A8]">utilised</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#1C2B4A] text-[13px]">
                      {mp.completionRatePercentage != null ? `${mp.completionRatePercentage.toFixed(1)}%` : "—"}
                    </div>
                    <div className="text-[10px] text-[#8993A8]">completion</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[#1C2B4A] text-[13px]">{mp.pendingPaymentsCount ?? mp.pendingPayments ?? 0}</div>
                    <div className="text-[10px] text-[#8993A8]">pending pay.</div>
                  </div>
                </div>
                <div
                  className={`text-[13px] px-2.5 py-1 shrink-0 ${
                    mp.suspicionScore >= 60
                      ? "bg-[#B3453B]/10 text-[#B3453B]"
                      : mp.suspicionScore >= 35
                      ? "bg-[#C48A3F]/10 text-[#C48A3F]"
                      : "bg-[#4A7C59]/10 text-[#4A7C59]"
                  }`}
                >
                  {mp.suspicionScore}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setMpPerformancePage((page) => Math.max(1, page - 1))}
              disabled={mpPerformancePage <= 1}
              className="inline-flex items-center gap-1.5 border border-[#D8D3C7] px-4 py-2 text-[13px] text-[#1C2B4A] hover:border-[#1C2B4A] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={14} />
              Previous
            </button>
            <span className="text-[12.5px] text-[#8993A8]">
              Page {mpPerformancePage} of {mpPerformancePageCount}
            </span>
            <button
              onClick={() => setMpPerformancePage((page) => Math.min(mpPerformancePageCount, page + 1))}
              disabled={mpPerformancePage >= mpPerformancePageCount}
              className="inline-flex items-center gap-1.5 border border-[#D8D3C7] px-4 py-2 text-[13px] text-[#1C2B4A] hover:border-[#1C2B4A] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* ALL MPS TABLE */}
        <section className="mb-14">
          <SectionHeader
            eyebrow="Directory"
            title="All MPs"
            action={<span className="text-[12px] text-[#8993A8]">Page {mpPage}</span>}
          />

          {mpsError && (
            <div
              role="alert"
              className="mb-4 border border-[#B3453B]/30 bg-[#B3453B]/5 px-4 py-3 text-[#B3453B] text-[13px] flex items-center gap-2"
            >
              <AlertTriangle size={14} />
              {mpsError}
            </div>
          )}

          <div className="border border-[#D8D3C7] bg-white overflow-x-auto relative">
            {mpsLoading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                <Loader2 size={18} className="animate-spin text-[#5A6478]" />
              </div>
            )}
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead>
                <tr className="border-b border-[#D8D3C7] bg-[#F3F1EB]">
                  <th className="px-5 py-3 text-[11px] text-[#8993A8] font-normal">Name</th>
                  <th className="px-5 py-3 text-[11px] text-[#8993A8] font-normal">Constituency</th>
                  <th className="px-5 py-3 text-[11px] text-[#8993A8] font-normal">House</th>
                  <th className="px-5 py-3 text-[11px] text-[#8993A8] font-normal">Allocated</th>
                  <th className="px-5 py-3 text-[11px] text-[#8993A8] font-normal">Spent</th>
                  <th className="px-5 py-3 text-[11px] text-[#8993A8] font-normal">Completed works</th>
                  <th className="px-5 py-3 text-[11px] text-[#8993A8] font-normal">Rating</th>
                </tr>
              </thead>
              <tbody>
                {mps.length === 0 && !mpsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[#8993A8] text-[13px]">
                      No MPs found.
                    </td>
                  </tr>
                ) : (
                  mps.map((mp, i) => (
                    <tr key={mp._id} className={i !== 0 ? "border-t border-[#EFECE3]" : ""}>
                      <td className="px-5 py-3.5 text-[13px] text-[#1C2B4A]">{mp.mpName}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#5A6478]">
                        {mp.constituency}, {mp.state}
                      </td>
                      <td className="px-5 py-3.5 text-[13px] text-[#5A6478]">{mp.house}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#5A6478]">{formatINR(mp.allocatedAmount)}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#5A6478]">{formatINR(mp.totalExpenditure)}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#5A6478]">{mp.completedWorks}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[#5A6478]">
                        {mp.averageRating != null ? mp.averageRating.toFixed(1) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setMPPage((p) => Math.max(1, p - 1))}
              disabled={mpPage <= 1 || mpsLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] text-[#1C2B4A] border border-[#D8D3C7] hover:border-[#1C2B4A] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#D8D3C7] transition-colors"
            >
              <ChevronLeft size={14} />
              Previous
            </button>

            <span className="text-[12.5px] text-[#8993A8]">Page {mpPage}</span>

            <button
              onClick={() => setMPPage((p) => p + 1)}
              disabled={mpsLoading || mps.length < mpLimit}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] text-[#1C2B4A] border border-[#D8D3C7] hover:border-[#1C2B4A] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#D8D3C7] transition-colors"
            >
              Next
              <ChevronRight size={14} />
            </button>
          </div>
        </section>

        {/* CITIZEN REVIEWS */}
        <section className="mb-8">
          <SectionHeader
            eyebrow="Public feedback"
            title="Citizen reviews"
            action={
              <div className="flex border border-[#D8D3C7]">
                {[
                  { key: "all", label: "All" },
                  { key: "negative", label: "Concerns" },
                  { key: "positive", label: "Positive" },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setReviewFilter(f.key)}
                    className={`px-3 py-1.5 text-[12px] transition-colors ${
                      reviewFilter === f.key
                        ? "bg-[#1C2B4A] text-[#FAF9F6]"
                        : "text-[#5A6478] hover:bg-[#F3F1EB]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            }
          />
          <div className="border border-[#D8D3C7] bg-white">
            {filteredReviews.length === 0 ? (
              <div className="px-5 py-8 text-center text-[#8993A8] text-[13px]">
                No reviews match this filter.
              </div>
            ) : (
              filteredReviews.map((r, i) => {
                const work = works.find((w) => w.id === r.workId);
                return (
                  <div
                    key={r.id}
                    className={`px-5 py-4 flex gap-3 ${i !== 0 ? "border-t border-[#EFECE3]" : ""}`}
                  >
                    <MessageSquare
                      size={15}
                      className={
                        r.sentiment === "negative"
                          ? "text-[#B3453B] mt-0.5 shrink-0"
                          : "text-[#4A7C59] mt-0.5 shrink-0"
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[#1C2B4A] text-[12.5px]">{r.author}</span>
                        {work && (
                          <button
                            onClick={() => openDrawer(work)}
                            className="text-[11px] text-[#8993A8] hover:text-[#1C2B4A] underline underline-offset-2 truncate"
                          >
                            {work.title}
                          </button>
                        )}
                        <span className="text-[10.5px] text-[#B0AA9C]">{r.date}</span>
                      </div>
                      <p className="text-[#5A6478] text-[13px] leading-relaxed">{r.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <ProjectDrawer
        work={drawerWork}
        open={drawerOpen}
        onClose={closeDrawer}
        onMarkForInspection={handleMarkForInspection}
        markingInspection={markingId === drawerWork?.id}
        onViewFullPage={() => {
          closeDrawer();
          onNavigateToProject && onNavigateToProject(drawerWork.id);
        }}
      />
    </div>
  );
}
