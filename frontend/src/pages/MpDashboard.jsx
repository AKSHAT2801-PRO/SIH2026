import React, { useState } from "react";
import {
  MapPin,
  Clock,
  IndianRupee,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Timer,
  Search,
  ChevronRight,
  PlusCircle,
  ArrowUpDown,
  Phone,
  User,
  Calendar,
  FileText,
  Eye,
  Filter,
} from "lucide-react";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import {
  WORKS,
  CITIZEN_MESSAGES,
  INSPECTIONS,
  MP_STATS,
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

const TAG_STYLES = {
  "Delay reported": "border-[#B3453B]/30 text-[#B3453B] bg-[#B3453B]/5",
  Concern: "border-[#B8863F]/30 text-[#B8863F] bg-[#B8863F]/5",
  Positive: "border-[#4A7C59]/30 text-[#4A7C59] bg-[#4A7C59]/5",
};

const PRIORITY_STYLES = {
  High: "text-[#B3453B] bg-[#B3453B]/10",
  Medium: "text-[#B8863F] bg-[#B8863F]/10",
  Low: "text-[#4A7C59] bg-[#4A7C59]/10",
};


export default function MpDashboard({ onLogout }) {
  const [section, setSection] = useState("overview");
  const [selectedWork, setSelectedWork] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [workForm, setWorkForm] = useState({
    title: "", description: "", location: "", category: "",
    estimatedCost: "", expectedTimeline: "",
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const unread = CITIZEN_MESSAGES.filter(m => m.status === "unread").length;

  /* ——— Overview ——— */
  const renderOverview = () => (
    <div>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total works", value: MP_STATS.totalWorks, accent: false },
          { label: "Funds allocated", value: MP_STATS.fundsAllocated, accent: false },
          { label: "In progress", value: MP_STATS.worksInProgress, accent: false },
          { label: "Delayed", value: MP_STATS.worksDelayed, accent: true },
          { label: "Completed", value: MP_STATS.worksCompleted, accent: false },
          { label: "Completion rate", value: MP_STATS.completionRate, accent: false },
          { label: "Pending inspections", value: MP_STATS.pendingInspections, accent: true },
          { label: "Citizen messages", value: MP_STATS.citizenMessages, accent: false },
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
          { label: "Recommend new work", icon: PlusCircle, target: "new-work" },
          { label: "View citizen feedback", icon: MessageSquare, target: "feedback" },
          { label: "Check inspections", icon: Calendar, target: "inspections" },
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

      {/* Recent works preview */}
      <h3 className="text-[#1C2B4A] text-[15px] mb-3" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
        Recent works
      </h3>
      <div className="space-y-3">
        {WORKS.slice(0, 3).map((w) => renderWorkRow(w))}
      </div>
      <button
        onClick={() => setSection("works")}
        className="mt-4 inline-flex items-center gap-1 text-[13px] text-[#1C2B4A] hover:text-[#B8863F] transition-colors"
      >
        View all works <ChevronRight size={14} />
      </button>
    </div>
  );

  /* ——— Work row component ——— */
  const renderWorkRow = (work) => {
    const statusStyle = STATUS_STYLES[work.status] || STATUS_STYLES["In Progress"];
    const riskStyle = RISK_STYLES[work.riskBand] || RISK_STYLES.medium;
    const StatusIcon = statusStyle.icon;
    return (
      <div
        key={work.id}
        className="border border-[#D8D3C7] bg-white p-5 hover:border-[#1C2B4A]/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            <h4 className="text-[#1C2B4A] text-[14px] mb-1">{work.title}</h4>
            <div className="flex items-center gap-1.5 text-[#5A6478] text-[12px]">
              <MapPin size={12} />
              {work.location}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] ${riskStyle.bg} ${riskStyle.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${riskStyle.bar}`} />
              Risk: {work.riskScore}
            </div>
            <div className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] ${statusStyle.bg} ${statusStyle.text}`}>
              <StatusIcon size={11} />
              {work.status}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#EFECE3]">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[11px] text-[#8993A8]">Fund utilisation</span>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-20 h-1.5 bg-[#EFECE3]">
                  <div className="h-full bg-[#B8863F]" style={{ width: `${work.fundUtilisation}%` }} />
                </div>
                <span className="text-[11px] text-[#5A6478]">{work.fundUtilisation}%</span>
              </div>
            </div>
            <div className="text-[11px] text-[#8993A8]">
              <IndianRupee size={10} className="inline" /> {work.fundsAllocated}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSection("works"); setSelectedWork(work); }}
              className="px-3 py-1.5 text-[11px] border border-[#D8D3C7] text-[#1C2B4A] hover:bg-[#F3F1EB] transition-colors"
            >
              View details
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ——— My Works (full list) ——— */
  const renderWorks = () => {
    if (selectedWork) return renderWorkDetail();

    const filteredWorks = statusFilter === "All"
      ? WORKS
      : WORKS.filter(w => w.status === statusFilter);

    return (
      <div>
        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1 text-[12px] text-[#8993A8]">
            <Filter size={13} /> Filter:
          </div>
          {["All", "In Progress", "Completed", "Delayed"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 text-[12px] border transition-colors ${
                statusFilter === f
                  ? "bg-[#1C2B4A] text-[#FAF9F6] border-[#1C2B4A]"
                  : "bg-white text-[#5A6478] border-[#D8D3C7] hover:border-[#1C2B4A]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredWorks.map((w) => renderWorkRow(w))}
        </div>

        {filteredWorks.length === 0 && (
          <p className="text-[#8993A8] text-[13px] text-center py-8">No works match this filter.</p>
        )}
      </div>
    );
  };

  /* ——— Work Detail (MP view with risk scores) ——— */
  const renderWorkDetail = () => {
    const work = selectedWork;
    if (!work) return renderWorks();
    const statusStyle = STATUS_STYLES[work.status] || STATUS_STYLES["In Progress"];
    const riskStyle = RISK_STYLES[work.riskBand] || RISK_STYLES.medium;
    const StatusIcon = statusStyle.icon;

    return (
      <div>
        <button
          onClick={() => setSelectedWork(null)}
          className="flex items-center gap-1 text-[13px] text-[#5A6478] hover:text-[#1C2B4A] mb-6"
        >
          ← Back to works
        </button>

        <div className="border border-[#D8D3C7] bg-white p-6 mb-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-[#1C2B4A] text-[20px] mb-1" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                {work.title}
              </h2>
              <div className="flex items-center gap-1.5 text-[#5A6478] text-[13px]">
                <MapPin size={13} /> {work.location}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] ${riskStyle.bg} ${riskStyle.text}`}>
                <span className={`w-2 h-2 rounded-full ${riskStyle.bar}`} />
                Risk: {work.riskScore}
              </div>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] ${statusStyle.bg} ${statusStyle.text}`}>
                <StatusIcon size={13} /> {work.status}
              </div>
            </div>
          </div>

          <p className="text-[#5A6478] text-[14px] leading-relaxed mb-6">{work.description}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#EFECE3]">
            {[
              { label: "Funds allocated", value: work.fundsAllocated },
              { label: "Funds spent", value: work.fundsSpent },
              { label: "Timeline slippage", value: work.timelineSlippage, danger: work.timelineSlippage !== "On time" },
              { label: "Site visits", value: `${work.siteVisits.completed} / ${work.siteVisits.total}` },
              { label: "Start date", value: work.startDate },
              { label: "Expected completion", value: work.expectedCompletion },
              { label: "Contractor", value: work.contractor },
              { label: "Category", value: work.category },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-[11px] text-[#8993A8] mb-1">{item.label}</div>
                <div className={`text-[14px] ${item.danger ? "text-[#B3453B]" : "text-[#1C2B4A]"}`}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones */}
        <div className="border border-[#D8D3C7] bg-white p-6 mb-6">
          <h3 className="text-[#1C2B4A] text-[15px] mb-4" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
            Milestones
          </h3>
          <div className="space-y-3">
            {work.milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 flex items-center justify-center border ${
                  m.done ? "border-[#4A7C59] bg-[#4A7C59]" : "border-[#D8D3C7]"
                }`}>
                  {m.done && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <span className={`flex-1 text-[13px] ${m.done ? "text-[#4A7C59]" : "text-[#5A6478]"}`}>
                  {m.label}
                </span>
                <span className="text-[11px] text-[#8993A8]">{m.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fund bar */}
        <div className="border border-[#D8D3C7] bg-white p-6">
          <h3 className="text-[#1C2B4A] text-[15px] mb-4" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
            Fund utilisation
          </h3>
          <div className="flex items-center justify-between text-[13px] mb-2">
            <span className="text-[#5A6478]">Spent: {work.fundsSpent}</span>
            <span className="text-[#1C2B4A]">Allocated: {work.fundsAllocated}</span>
          </div>
          <div className="h-3 bg-[#EFECE3]">
            <div className="h-full bg-[#B8863F]" style={{ width: `${work.fundUtilisation}%` }} />
          </div>
          <div className="text-[12px] text-[#8993A8] mt-2">{work.fundUtilisation}% utilised</div>
        </div>
      </div>
    );
  };

  /* ——— Recommend New Work ——— */
  const renderNewWork = () => (
    <div>
      <p className="text-[#5A6478] text-[13px] mb-6">
        Propose a new work under the MPLAD scheme. Your recommendation will be reviewed by the district administration.
      </p>

      <div className="border border-[#D8D3C7] bg-white p-6">
        <div className="grid sm:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Work title</label>
            <input
              value={workForm.title}
              onChange={(e) => setWorkForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Community Health Centre"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Category</label>
            <select
              value={workForm.category}
              onChange={(e) => setWorkForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
            >
              <option value="">Select category</option>
              {WORK_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Description</label>
          <textarea
            value={workForm.description}
            onChange={(e) => setWorkForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Detailed description of the proposed work, beneficiaries, and justification…"
            rows={4}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A] resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-5 mb-5">
          <div>
            <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Location</label>
            <input
              value={workForm.location}
              onChange={(e) => setWorkForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Ward / Village, District"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Estimated cost</label>
            <input
              value={workForm.estimatedCost}
              onChange={(e) => setWorkForm(f => ({ ...f, estimatedCost: e.target.value }))}
              placeholder="e.g. ₹25 L"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Expected timeline</label>
            <input
              value={workForm.expectedTimeline}
              onChange={(e) => setWorkForm(f => ({ ...f, expectedTimeline: e.target.value }))}
              placeholder="e.g. 6 months"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-[#EFECE3]">
          <button
            onClick={() => {
              setFormSubmitted(true);
              setWorkForm({ title: "", description: "", location: "", category: "", estimatedCost: "", expectedTimeline: "" });
              setTimeout(() => setFormSubmitted(false), 3000);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C2B4A] text-[#FAF9F6] text-[13px] hover:bg-[#233658] transition-colors"
          >
            <PlusCircle size={14} /> Submit recommendation
          </button>
          {formSubmitted && (
            <span className="text-[#4A7C59] text-[12px] flex items-center gap-1">
              <CheckCircle2 size={13} /> Recommendation submitted
            </span>
          )}
        </div>
      </div>
    </div>
  );

  /* ——— Fund Utilisation ——— */
  const renderFunds = () => (
    <div>
      <div className="border border-[#D8D3C7] bg-white p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#1C2B4A] text-[15px]" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
            Fund allocation summary
          </h3>
          <span className="text-[12px] text-[#8993A8]">Total: {MP_STATS.fundsAllocated}</span>
        </div>

        <div className="space-y-4">
          {WORKS.map((w) => (
            <div key={w.id}>
              <div className="flex items-center justify-between text-[13px] mb-1.5">
                <span className="text-[#1C2B4A] truncate max-w-[60%]">{w.title}</span>
                <span className="text-[#5A6478]">{w.fundsSpent} / {w.fundsAllocated}</span>
              </div>
              <div className="h-2 bg-[#EFECE3]">
                <div
                  className={`h-full ${w.fundUtilisation > 80 ? "bg-[#4A7C59]" : w.fundUtilisation > 50 ? "bg-[#B8863F]" : "bg-[#B3453B]"}`}
                  style={{ width: `${w.fundUtilisation}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#8993A8] mt-1">
                <span>{w.status}</span>
                <span>{w.fundUtilisation}% utilised</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ——— Citizen Feedback Inbox ——— */
  const renderFeedback = () => (
    <div>
      <p className="text-[#5A6478] text-[13px] mb-6">
        Messages from citizens about your constituency works. Mark them as noted or take action.
      </p>

      <div className="space-y-3">
        {CITIZEN_MESSAGES.map((msg) => (
          <div key={msg.id} className={`border bg-white p-5 ${msg.status === "unread" ? "border-[#B8863F]/40 border-l-2 border-l-[#B8863F]" : "border-[#D8D3C7]"}`}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-[#B8863F]" />
                <span className="text-[#1C2B4A] text-[13px]">{msg.workTitle}</span>
                {msg.status === "unread" && (
                  <span className="w-2 h-2 rounded-full bg-[#B8863F]" />
                )}
              </div>
              <span className={`text-[10px] px-2 py-0.5 border ${TAG_STYLES[msg.tag] || "border-[#D8D3C7] text-[#5A6478]"}`}>
                {msg.tag}
              </span>
            </div>
            <p className="text-[#5A6478] text-[13px] leading-relaxed mb-3">{msg.text}</p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#8993A8]">
                {msg.author} · {msg.ward} · {msg.date}
              </span>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-[11px] border border-[#D8D3C7] text-[#5A6478] hover:bg-[#F3F1EB] transition-colors">
                  Mark noted
                </button>
                <button className="px-3 py-1 text-[11px] bg-[#1C2B4A] text-[#FAF9F6] hover:bg-[#233658] transition-colors">
                  Action taken
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ——— Inspections ——— */
  const renderInspections = () => (
    <div>
      <p className="text-[#5A6478] text-[13px] mb-6">
        Inspections scheduled by government officials for your constituency works.
      </p>

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

  /* ——— Contractors ——— */
  const renderContractors = () => {
    const contractors = WORKS.map((w) => ({
      name: w.contractor,
      contact: w.contractorContact,
      work: w.title,
      location: w.location,
      status: w.status,
    }));

    return (
      <div>
        <p className="text-[#5A6478] text-[13px] mb-6">
          Contractors and service providers assigned to your constituency works.
        </p>

        <div className="border border-[#D8D3C7] bg-white overflow-hidden">
          <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3 bg-[#F3F1EB] text-[11px] text-[#8993A8] border-b border-[#D8D3C7]">
            <span>Contractor</span>
            <span>Work</span>
            <span>Contact</span>
            <span>Status</span>
          </div>
          {contractors.map((c, i) => {
            const statusStyle = STATUS_STYLES[c.status] || STATUS_STYLES["In Progress"];
            return (
              <div
                key={i}
                className={`grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3.5 items-center ${
                  i !== contractors.length - 1 ? "border-b border-[#EFECE3]" : ""
                }`}
              >
                <div>
                  <div className="text-[#1C2B4A] text-[13px]">{c.name}</div>
                  <div className="text-[11px] text-[#8993A8]">{c.location}</div>
                </div>
                <div className="text-[#5A6478] text-[13px] truncate">{c.work}</div>
                <div className="flex items-center gap-1 text-[12px] text-[#5A6478]">
                  <Phone size={11} /> {c.contact}
                </div>
                <div className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] ${statusStyle.bg} ${statusStyle.text}`}>
                  {c.status}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ——— Section Router ——— */
  const renderContent = () => {
    switch (section) {
      case "overview": return renderOverview();
      case "works": return renderWorks();
      case "new-work": return renderNewWork();
      case "funds": return renderFunds();
      case "feedback": return renderFeedback();
      case "inspections": return renderInspections();
      case "contractors": return renderContractors();
      default: return renderOverview();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">
      <DashboardSidebar
        role="mp"
        activeSection={section}
        onSectionChange={(key) => {
          setSection(key);
          setSelectedWork(null);
        }}
        onLogout={onLogout}
        userName="R. Chaturvedi, MP"
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader section={section} role="mp" unreadCount={unread} />
        <main className="flex-1 p-6 max-w-[1040px]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
