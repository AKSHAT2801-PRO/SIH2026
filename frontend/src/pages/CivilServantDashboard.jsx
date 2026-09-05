import React, { useState } from "react";
import {
  MapPin,
  Clock,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Timer,
  Search,
  Calendar,
  FileText,
  User,
  Filter,
  PlusCircle,
  Flag,
  ChevronRight,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import {
  WORKS,
  DAILY_REPORTS,
  INSPECTIONS,
  GOV_STATS,
  STATES,
  WORK_CATEGORIES,
} from "../assets/dashboardData";

/* ——— Helpers ——— */
const RISK_STYLES = {
  low: { label: "Low", text: "text-[#4A7C59]", bg: "bg-[#4A7C59]/10", bar: "bg-[#4A7C59]" },
  medium: { label: "Medium", text: "text-[#C48A3F]", bg: "bg-[#C48A3F]/10", bar: "bg-[#C48A3F]" },
  high: { label: "High", text: "text-[#B3453B]", bg: "bg-[#B3453B]/10", bar: "bg-[#B3453B]" },
};

const STATUS_STYLES = {
  "In Progress": { icon: Timer, text: "text-[#B8863F]", bg: "bg-[#B8863F]/10" },
  Completed: { icon: CheckCircle2, text: "text-[#4A7C59]", bg: "bg-[#4A7C59]/10" },
  Delayed: { icon: AlertCircle, text: "text-[#B3453B]", bg: "bg-[#B3453B]/10" },
};

const PRIORITY_STYLES = {
  High: "text-[#B3453B] bg-[#B3453B]/10",
  Medium: "text-[#B8863F] bg-[#B8863F]/10",
  Low: "text-[#4A7C59] bg-[#4A7C59]/10",
};

export default function CivilServantDashboard({ onLogout }) {
  const [section, setSection] = useState("overview");
  const [stateFilter, setStateFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reportForm, setReportForm] = useState({
    date: new Date().toISOString().split("T")[0],
    workId: "",
    type: "Site Visit",
    summary: "",
  });
  const [inspectionForm, setInspectionForm] = useState({
    workId: "",
    inspector: "",
    date: "",
    priority: "Medium",
  });
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [inspectionSubmitted, setInspectionSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const flaggedReports = DAILY_REPORTS.filter(r => r.flagged).length;

  /* ——— Overview ——— */
  const renderOverview = () => (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Works nationwide", value: GOV_STATS.totalWorksNationwide.toLocaleString() },
          { label: "Total funds tracked", value: GOV_STATS.totalFundsTracked },
          { label: "High-risk works", value: GOV_STATS.highRiskWorks, accent: true },
          { label: "Pending inspections", value: GOV_STATS.pendingInspections, accent: true },
          { label: "Reports this week", value: GOV_STATS.reportsThisWeek },
          { label: "Flagged works", value: GOV_STATS.flaggedWorks, accent: true },
          { label: "Completed works", value: GOV_STATS.completedWorks },
          { label: "Active constituencies", value: GOV_STATS.activeConstituencies },
        ].map((s) => (
          <div key={s.label} className={`border bg-white p-5 ${s.accent ? "border-[#B3453B]/30" : "border-[#D8D3C7]"}`}>
            <div
              className={`text-[1.4rem] ${s.accent ? "text-[#B3453B]" : "text-[#1C2B4A]"}`}
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              {s.value}
            </div>
            <div className="text-[#8993A8] text-[12px] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Add daily report", icon: FileText, target: "daily-report" },
          { label: "Schedule inspection", icon: Calendar, target: "inspections" },
          { label: "Risk dashboard", icon: AlertTriangle, target: "risk" },
        ].map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.label}
              onClick={() => setSection(a.target)}
              className="border border-[#D8D3C7] bg-white p-5 flex items-center gap-3 hover:border-[#1C2B4A]/30 transition-colors text-left group"
            >
              <Icon size={18} className="text-[#B8863F] shrink-0" />
              <span className="text-[#1C2B4A] text-[13px] group-hover:text-[#B8863F] transition-colors">
                {a.label}
              </span>
              <ChevronRight size={14} className="text-[#8993A8] ml-auto" />
            </button>
          );
        })}
      </div>

      {/* Risk distribution */}
      <div className="border border-[#D8D3C7] bg-white p-6 mb-6">
        <h3 className="text-[#1C2B4A] text-[15px] mb-4" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
          Risk distribution
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { band: "low", count: WORKS.filter(w => w.riskBand === "low").length },
            { band: "medium", count: WORKS.filter(w => w.riskBand === "medium").length },
            { band: "high", count: WORKS.filter(w => w.riskBand === "high").length },
          ].map(({ band, count }) => {
            const style = RISK_STYLES[band];
            return (
              <div key={band} className={`p-4 border ${style.bg} border-[#D8D3C7]`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${style.bar}`} />
                  <span className={`text-[13px] ${style.text} capitalize`}>{band} risk</span>
                </div>
                <div
                  className={`text-[1.5rem] ${style.text}`}
                  style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
                >
                  {count}
                </div>
                <div className="text-[11px] text-[#8993A8] mt-1">works</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent flagged reports */}
      <h3 className="text-[#1C2B4A] text-[15px] mb-3" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
        Recently flagged reports
      </h3>
      <div className="space-y-3">
        {DAILY_REPORTS.filter(r => r.flagged).slice(0, 3).map((rpt) => (
          <div key={rpt.id} className="border border-[#B3453B]/30 border-l-2 border-l-[#B3453B] bg-white p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 className="text-[#1C2B4A] text-[14px] mb-1">{rpt.workTitle}</h4>
                <span className="text-[12px] text-[#8993A8]">{rpt.inspector} · {rpt.date}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 text-[11px] bg-[#B3453B]/10 text-[#B3453B]">
                <Flag size={11} /> Flagged
              </div>
            </div>
            <p className="text-[#5A6478] text-[13px] leading-relaxed">{rpt.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );

  /* ——— All Works (Cross-MP) ——— */
  const renderWorks = () => {
    let filtered = [...WORKS];
    if (stateFilter) filtered = filtered.filter(w => w.state === stateFilter);
    if (riskFilter) filtered = filtered.filter(w => w.riskBand === riskFilter);
    if (statusFilter) filtered = filtered.filter(w => w.status === statusFilter);

    return (
      <div>
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1 text-[12px] text-[#8993A8]">
            <Filter size={13} /> Filters:
          </div>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-1.5 text-[12px] border border-[#D8D3C7] bg-white text-[#1C2B4A] focus:outline-none focus:ring-1 focus:ring-[#1C2B4A]/20"
          >
            <option value="">All states</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 text-[12px] border border-[#D8D3C7] bg-white text-[#1C2B4A] focus:outline-none focus:ring-1 focus:ring-[#1C2B4A]/20"
          >
            <option value="">All risk levels</option>
            <option value="low">Low risk</option>
            <option value="medium">Medium risk</option>
            <option value="high">High risk</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-[12px] border border-[#D8D3C7] bg-white text-[#1C2B4A] focus:outline-none focus:ring-1 focus:ring-[#1C2B4A]/20"
          >
            <option value="">All statuses</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Delayed">Delayed</option>
          </select>
          {(stateFilter || riskFilter || statusFilter) && (
            <button
              onClick={() => { setStateFilter(""); setRiskFilter(""); setStatusFilter(""); }}
              className="px-3 py-1.5 text-[12px] text-[#B3453B] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="space-y-3">
          {filtered.map((work) => {
            const statusStyle = STATUS_STYLES[work.status] || STATUS_STYLES["In Progress"];
            const riskStyle = RISK_STYLES[work.riskBand] || RISK_STYLES.medium;
            const StatusIcon = statusStyle.icon;
            return (
              <div key={work.id} className="border border-[#D8D3C7] bg-white p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h4 className="text-[#1C2B4A] text-[14px] mb-1">{work.title}</h4>
                    <div className="flex items-center gap-3 text-[12px] text-[#5A6478]">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {work.location}</span>
                      <span>MP: {work.mp}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] ${riskStyle.bg} ${riskStyle.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${riskStyle.bar}`} />
                      Risk: {work.riskScore}
                    </div>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] ${statusStyle.bg} ${statusStyle.text}`}>
                      <StatusIcon size={11} /> {work.status}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#EFECE3]">
                  <div className="flex items-center gap-4 text-[12px]">
                    <span className="text-[#8993A8]">
                      <IndianRupee size={10} className="inline" /> {work.fundsAllocated}
                    </span>
                    <span className="text-[#8993A8]">
                      Utilisation: {work.fundUtilisation}%
                    </span>
                    <span className={`${work.timelineSlippage !== "On time" ? "text-[#B3453B]" : "text-[#4A7C59]"}`}>
                      {work.timelineSlippage}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[11px] text-[#8993A8]">
                    <Clock size={11} /> {work.lastUpdated}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-[#8993A8] text-[13px] text-center py-8">No works match these filters.</p>
        )}
      </div>
    );
  };

  /* ——— Daily Reports ——— */
  const renderDailyReport = () => (
    <div>
      {/* Add new report form */}
      <div className="border border-[#D8D3C7] bg-white p-6 mb-8">
        <h3 className="text-[#1C2B4A] text-[15px] mb-4" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
          Submit a new daily report
        </h3>

        <div className="grid sm:grid-cols-3 gap-5 mb-5">
          <div>
            <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Date</label>
            <input
              type="date"
              value={reportForm.date}
              onChange={(e) => setReportForm(f => ({ ...f, date: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Work / Inspection</label>
            <select
              value={reportForm.workId}
              onChange={(e) => setReportForm(f => ({ ...f, workId: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
            >
              <option value="">Select work…</option>
              {WORKS.map((w) => (
                <option key={w.id} value={w.id}>{w.title} — {w.location}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Report type</label>
            <select
              value={reportForm.type}
              onChange={(e) => setReportForm(f => ({ ...f, type: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
            >
              <option value="Site Visit">Site Visit</option>
              <option value="Progress Update">Progress Update</option>
              <option value="Issue Report">Issue Report</option>
              <option value="Fund Verification">Fund Verification</option>
            </select>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Report summary</label>
          <textarea
            value={reportForm.summary}
            onChange={(e) => setReportForm(f => ({ ...f, summary: e.target.value }))}
            placeholder="Detailed notes from your site visit, progress observations, or issue description…"
            rows={5}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A] resize-none"
          />
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-[#EFECE3]">
          <button
            onClick={() => {
              setReportSubmitted(true);
              setReportForm({ date: new Date().toISOString().split("T")[0], workId: "", type: "Site Visit", summary: "" });
              setTimeout(() => setReportSubmitted(false), 3000);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C2B4A] text-[#FAF9F6] text-[13px] hover:bg-[#233658] transition-colors"
          >
            <FileText size={14} /> Submit report
          </button>
          {reportSubmitted && (
            <span className="text-[#4A7C59] text-[12px] flex items-center gap-1">
              <CheckCircle2 size={13} /> Report submitted
            </span>
          )}
        </div>
      </div>

      {/* Past reports log */}
      <h3 className="text-[#1C2B4A] text-[15px] mb-4" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
        Recent reports
      </h3>
      <div className="space-y-3">
        {DAILY_REPORTS.map((rpt) => (
          <div
            key={rpt.id}
            className={`border bg-white p-5 ${rpt.flagged ? "border-[#B3453B]/30 border-l-2 border-l-[#B3453B]" : "border-[#D8D3C7]"}`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 className="text-[#1C2B4A] text-[14px] mb-1">{rpt.workTitle}</h4>
                <div className="flex items-center gap-3 text-[12px] text-[#8993A8]">
                  <span className="flex items-center gap-1"><Calendar size={11} /> {rpt.date}</span>
                  <span className="flex items-center gap-1"><User size={11} /> {rpt.inspector}</span>
                  <span className="px-2 py-0.5 bg-[#F3F1EB] text-[#5A6478] text-[10px]">{rpt.type}</span>
                </div>
              </div>
              {rpt.flagged && (
                <div className="flex items-center gap-1 px-2 py-1 text-[11px] bg-[#B3453B]/10 text-[#B3453B] shrink-0">
                  <Flag size={11} /> Flagged
                </div>
              )}
            </div>
            <p className="text-[#5A6478] text-[13px] leading-relaxed mt-2">{rpt.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );

  /* ——— Inspections ——— */
  const renderInspections = () => (
    <div>
      {/* Schedule new inspection */}
      <div className="border border-[#D8D3C7] bg-white p-6 mb-8">
        <h3 className="text-[#1C2B4A] text-[15px] mb-4" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
          Schedule a new inspection
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
          <div>
            <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Select work</label>
            <select
              value={inspectionForm.workId}
              onChange={(e) => setInspectionForm(f => ({ ...f, workId: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
            >
              <option value="">Choose work…</option>
              {WORKS.map((w) => (
                <option key={w.id} value={w.id}>{w.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Assign inspector</label>
            <input
              value={inspectionForm.inspector}
              onChange={(e) => setInspectionForm(f => ({ ...f, inspector: e.target.value }))}
              placeholder="Name, designation"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Date</label>
            <input
              type="date"
              value={inspectionForm.date}
              onChange={(e) => setInspectionForm(f => ({ ...f, date: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Priority</label>
            <select
              value={inspectionForm.priority}
              onChange={(e) => setInspectionForm(f => ({ ...f, priority: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-[#EFECE3]">
          <button
            onClick={() => {
              setInspectionSubmitted(true);
              setInspectionForm({ workId: "", inspector: "", date: "", priority: "Medium" });
              setTimeout(() => setInspectionSubmitted(false), 3000);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C2B4A] text-[#FAF9F6] text-[13px] hover:bg-[#233658] transition-colors"
          >
            <Calendar size={14} /> Schedule inspection
          </button>
          {inspectionSubmitted && (
            <span className="text-[#4A7C59] text-[12px] flex items-center gap-1">
              <CheckCircle2 size={13} /> Inspection scheduled
            </span>
          )}
        </div>
      </div>

      {/* Inspection calendar / list */}
      <h3 className="text-[#1C2B4A] text-[15px] mb-4" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
        Upcoming & past inspections
      </h3>
      <div className="space-y-3">
        {INSPECTIONS.map((insp) => (
          <div key={insp.id} className="border border-[#D8D3C7] bg-white p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <h4 className="text-[#1C2B4A] text-[14px] mb-1">{insp.workTitle}</h4>
                <div className="flex items-center gap-1.5 text-[#5A6478] text-[12px]">
                  <MapPin size={12} /> {insp.location}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-[11px] ${PRIORITY_STYLES[insp.priority]}`}>
                  {insp.priority}
                </span>
                <span className={`px-2 py-1 text-[11px] ${
                  insp.status === "Completed" ? "bg-[#4A7C59]/10 text-[#4A7C59]" : "bg-[#B8863F]/10 text-[#B8863F]"
                }`}>
                  {insp.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#EFECE3] text-[12px] text-[#8993A8]">
              <span className="flex items-center gap-1"><Calendar size={12} /> {insp.date}</span>
              <span className="flex items-center gap-1"><User size={12} /> {insp.inspector}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ——— Risk Dashboard ——— */
  const renderRisk = () => {
    const sortedByRisk = [...WORKS].sort((a, b) => b.riskScore - a.riskScore);

    return (
      <div>
        <p className="text-[#5A6478] text-[13px] mb-6">
          Works sorted by risk score — highest risk first. Flag works that need urgent review.
        </p>

        {/* Risk distribution summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { band: "high", count: WORKS.filter(w => w.riskBand === "high").length },
            { band: "medium", count: WORKS.filter(w => w.riskBand === "medium").length },
            { band: "low", count: WORKS.filter(w => w.riskBand === "low").length },
          ].map(({ band, count }) => {
            const style = RISK_STYLES[band];
            return (
              <div key={band} className={`p-4 border ${style.bg} border-[#D8D3C7] text-center`}>
                <div className={`text-[1.5rem] ${style.text}`} style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  {count}
                </div>
                <div className={`text-[12px] ${style.text} capitalize`}>{band} risk</div>
              </div>
            );
          })}
        </div>

        {/* Works by risk */}
        <div className="space-y-3">
          {sortedByRisk.map((work) => {
            const riskStyle = RISK_STYLES[work.riskBand] || RISK_STYLES.medium;
            return (
              <div key={work.id} className={`border bg-white p-5 ${
                work.riskBand === "high" ? "border-[#B3453B]/30" : "border-[#D8D3C7]"
              }`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <h4 className="text-[#1C2B4A] text-[14px] mb-1">{work.title}</h4>
                    <div className="flex items-center gap-3 text-[12px] text-[#5A6478]">
                      <span className="flex items-center gap-1"><MapPin size={12} /> {work.location}</span>
                      <span>MP: {work.mp}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] ${riskStyle.bg} ${riskStyle.text}`}>
                      <AlertTriangle size={12} />
                      Score: {work.riskScore}
                    </div>
                    <button className="px-3 py-1.5 text-[11px] border border-[#D8D3C7] text-[#B3453B] hover:bg-[#B3453B]/5 transition-colors">
                      <Flag size={11} className="inline mr-1" /> Flag
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#EFECE3] text-[12px] text-[#8993A8]">
                  <span>Status: {work.status}</span>
                  <span>Slippage: {work.timelineSlippage}</span>
                  <span>Fund util: {work.fundUtilisation}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ——— Fund Audit ——— */
  const renderFundAudit = () => {
    const mpGroups = {};
    WORKS.forEach((w) => {
      if (!mpGroups[w.mp]) mpGroups[w.mp] = { allocated: 0, spent: 0, works: 0 };
      mpGroups[w.mp].allocated += w.fundsAllocatedNum;
      mpGroups[w.mp].spent += w.fundsSpentNum;
      mpGroups[w.mp].works += 1;
    });

    return (
      <div>
        <p className="text-[#5A6478] text-[13px] mb-6">
          Cross-MP fund utilisation comparison. Identify discrepancies and under-utilised allocations.
        </p>

        {/* MP-wise comparison */}
        <div className="border border-[#D8D3C7] bg-white p-6 mb-6">
          <h3 className="text-[#1C2B4A] text-[15px] mb-4" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
            Fund utilisation by MP
          </h3>
          <div className="space-y-5">
            {Object.entries(mpGroups).map(([mp, data]) => {
              const pct = Math.round((data.spent / data.allocated) * 100);
              return (
                <div key={mp}>
                  <div className="flex items-center justify-between text-[13px] mb-1.5">
                    <span className="text-[#1C2B4A]">{mp} ({data.works} works)</span>
                    <span className="text-[#5A6478]">
                      ₹{(data.spent / 100000).toFixed(1)}L / ₹{(data.allocated / 100000).toFixed(1)}L
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#EFECE3]">
                    <div
                      className={`h-full ${pct > 80 ? "bg-[#4A7C59]" : pct > 50 ? "bg-[#B8863F]" : "bg-[#B3453B]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-[#8993A8] mt-1">{pct}% utilised</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Individual works */}
        <h3 className="text-[#1C2B4A] text-[15px] mb-4" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
          Work-wise fund breakdown
        </h3>
        <div className="border border-[#D8D3C7] bg-white overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-[#F3F1EB] text-[11px] text-[#8993A8] border-b border-[#D8D3C7]">
            <span>Work</span>
            <span>Allocated</span>
            <span>Spent</span>
            <span>Utilisation</span>
          </div>
          {WORKS.map((w, i) => (
            <div
              key={w.id}
              className={`grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 items-center ${
                i !== WORKS.length - 1 ? "border-b border-[#EFECE3]" : ""
              }`}
            >
              <div>
                <div className="text-[#1C2B4A] text-[13px]">{w.title}</div>
                <div className="text-[11px] text-[#8993A8]">{w.mp} · {w.location}</div>
              </div>
              <div className="text-[13px] text-[#5A6478]">{w.fundsAllocated}</div>
              <div className="text-[13px] text-[#5A6478]">{w.fundsSpent}</div>
              <div className={`text-[13px] font-medium ${
                w.fundUtilisation > 80 ? "text-[#4A7C59]" : w.fundUtilisation > 50 ? "text-[#B8863F]" : "text-[#B3453B]"
              }`}>
                {w.fundUtilisation}%
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ——— Reports Archive ——— */
  const renderArchive = () => {
    const filtered = searchQuery
      ? DAILY_REPORTS.filter(r =>
          r.workTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.inspector.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.summary.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : DAILY_REPORTS;

    return (
      <div>
        {/* Search */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 border border-[#D8D3C7] bg-white">
            <Search size={14} className="text-[#8993A8]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reports by work, inspector, or content…"
              className="flex-1 text-sm text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((rpt) => (
            <div
              key={rpt.id}
              className={`border bg-white p-5 ${rpt.flagged ? "border-[#B3453B]/30 border-l-2 border-l-[#B3453B]" : "border-[#D8D3C7]"}`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 className="text-[#1C2B4A] text-[14px] mb-1">{rpt.workTitle}</h4>
                  <div className="flex items-center gap-3 text-[12px] text-[#8993A8]">
                    <span className="flex items-center gap-1"><Calendar size={11} /> {rpt.date}</span>
                    <span className="flex items-center gap-1"><User size={11} /> {rpt.inspector}</span>
                    <span className="px-2 py-0.5 bg-[#F3F1EB] text-[#5A6478] text-[10px]">{rpt.type}</span>
                  </div>
                </div>
                {rpt.flagged && (
                  <div className="flex items-center gap-1 px-2 py-1 text-[11px] bg-[#B3453B]/10 text-[#B3453B] shrink-0">
                    <Flag size={11} /> Flagged
                  </div>
                )}
              </div>
              <p className="text-[#5A6478] text-[13px] leading-relaxed mt-2">{rpt.summary}</p>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-[#8993A8] text-[13px] text-center py-8">No reports match your search.</p>
        )}
      </div>
    );
  };

  /* ——— Section Router ——— */
  const renderContent = () => {
    switch (section) {
      case "overview": return renderOverview();
      case "works": return renderWorks();
      case "daily-report": return renderDailyReport();
      case "inspections": return renderInspections();
      case "risk": return renderRisk();
      case "fund-audit": return renderFundAudit();
      case "archive": return renderArchive();
      default: return renderOverview();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">
      <DashboardSidebar
        role="civil-servant"
        activeSection={section}
        onSectionChange={(key) => setSection(key)}
        onLogout={onLogout}
        userName="S. Mishra, SDM"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader section={section} role="civil-servant" unreadCount={flaggedReports} />
        <main className="flex-1 p-6 max-w-[1040px]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
