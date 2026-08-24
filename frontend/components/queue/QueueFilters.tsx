"use client";

import { WorkCategory, WorkStatus } from "@/types";
import { Search, X } from "lucide-react";
import { formatCategory } from "@/lib/riskUtils";

const STATES = [
  "All States",
  "Rajasthan",
  "Uttar Pradesh",
  "Maharashtra",
  "Bihar",
  "Madhya Pradesh",
  "Gujarat",
  "Odisha",
  "West Bengal",
  "Karnataka",
  "Tamil Nadu",
];

const CATEGORIES: { value: WorkCategory | "all"; label: string }[] = [
  { value: "all", label: "All Categories" },
  { value: "financial", label: "Financial" },
  { value: "timeline", label: "Timeline" },
  { value: "duplicate", label: "Duplicate" },
  { value: "geographic", label: "Geographic" },
  { value: "multi-factor", label: "Multi-Factor" },
];

const RISK_BANDS = [
  { value: "all", label: "All Risk Bands" },
  { value: "critical", label: "Critical (81–100)" },
  { value: "high", label: "High (61–80)" },
  { value: "medium", label: "Medium (31–60)" },
  { value: "low", label: "Low (0–30)" },
];

const STATUSES: { value: WorkStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending_review", label: "Pending Review" },
  { value: "under_review", label: "Under Review" },
  { value: "escalated", label: "Escalated" },
  { value: "cleared", label: "Cleared" },
];

export interface Filters {
  search: string;
  riskBand: string;
  state: string;
  category: string;
  status: string;
}

interface QueueFiltersProps {
  filters: Filters;
  onChange: (f: Filters) => void;
}

export default function QueueFilters({ filters, onChange }: QueueFiltersProps) {
  const set = (key: keyof Filters, val: string) =>
    onChange({ ...filters, [key]: val });

  const hasActive =
    filters.search !== "" ||
    filters.riskBand !== "all" ||
    filters.state !== "All States" ||
    filters.category !== "all" ||
    filters.status !== "all";

  const clear = () =>
    onChange({ search: "", riskBand: "all", state: "All States", category: "all", status: "all" });

  const selectClass =
    "text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:border-sky-400 transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search Work ID or agency…"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          className="pl-8 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 transition-colors w-56"
          aria-label="Search by Work ID or agency name"
        />
      </div>

      <select
        value={filters.riskBand}
        onChange={(e) => set("riskBand", e.target.value)}
        className={selectClass}
        aria-label="Filter by risk band"
      >
        {RISK_BANDS.map((b) => (
          <option key={b.value} value={b.value}>{b.label}</option>
        ))}
      </select>

      <select
        value={filters.state}
        onChange={(e) => set("state", e.target.value)}
        className={selectClass}
        aria-label="Filter by state"
      >
        {STATES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <select
        value={filters.category}
        onChange={(e) => set("category", e.target.value)}
        className={selectClass}
        aria-label="Filter by category"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => set("status", e.target.value)}
        className={selectClass}
        aria-label="Filter by status"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {hasActive && (
        <button
          onClick={clear}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          aria-label="Clear all filters"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  );
}
