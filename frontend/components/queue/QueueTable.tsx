"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Work } from "@/types";
import { formatCategory, formatStatus } from "@/lib/riskUtils";
import RiskChip from "./RiskChip";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";

type SortKey = "riskScore" | "flaggedOn" | "sanctionedAmount";
type SortDir = "asc" | "desc";

interface QueueTableProps {
  works: Work[];
  onClearFilters: () => void;
}

const statusStyles: Record<Work["status"], string> = {
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  under_review: "bg-sky-50 text-sky-700 border-sky-200",
  cleared: "bg-green-50 text-green-700 border-green-200",
  escalated: "bg-red-50 text-red-700 border-red-200",
};

export default function QueueTable({ works, onClearFilters }: QueueTableProps) {
  const router = useRouter();
  const [sk, setSk] = useState<SortKey>("riskScore");
  const [sd, setSd] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sk === key) {
      setSd((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSk(key);
      setSd("desc");
    }
  };

  const sorted = [...works].sort((a, b) => {
    const aVal = a[sk];
    const bVal = b[sk];
    const dir = sd === "asc" ? 1 : -1;
    if (typeof aVal === "number" && typeof bVal === "number") return (aVal - bVal) * dir;
    return String(aVal).localeCompare(String(bVal)) * dir;
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sk !== col) return <ArrowUpDown size={12} className="text-slate-400" />;
    return sd === "asc" ? (
      <ArrowUp size={12} className="text-sky-500" />
    ) : (
      <ArrowDown size={12} className="text-sky-500" />
    );
  };

  const thClass =
    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500 whitespace-nowrap select-none";

  if (works.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200">
        <EmptyState
          title="No works match your filters"
          message="Adjust your risk band, state, or category filters to see results."
          onClear={onClearFilters}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className={thClass}>Work ID</th>
              <th className={thClass}>Agency</th>
              <th className={thClass}>State / District</th>
              <th className={thClass}>
                <button
                  onClick={() => toggleSort("riskScore")}
                  className="flex items-center gap-1 hover:text-slate-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 rounded"
                >
                  Risk Score <SortIcon col="riskScore" />
                </button>
              </th>
              <th className={thClass}>Category</th>
              <th className={thClass}>Status</th>
              <th className={thClass}>
                <button
                  onClick={() => toggleSort("flaggedOn")}
                  className="flex items-center gap-1 hover:text-slate-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 rounded"
                >
                  Flagged On <SortIcon col="flaggedOn" />
                </button>
              </th>
              <th className={thClass}>
                <button
                  onClick={() => toggleSort("sanctionedAmount")}
                  className="flex items-center gap-1 hover:text-slate-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 rounded"
                >
                  Sanctioned <SortIcon col="sanctionedAmount" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((w) => (
              <tr
                key={w.id}
                onClick={() => router.push(`/work/${w.id}`)}
                onKeyDown={(e) => e.key === "Enter" && router.push(`/work/${w.id}`)}
                tabIndex={0}
                role="row"
                className="table-row-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 focus-visible:outline-offset-0 cursor-pointer transition-colors"
                aria-label={`Work ${w.id} — ${w.agencyName}, risk score ${w.riskScore}`}
              >
                <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                  {w.id}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800 text-xs leading-tight max-w-[180px] truncate">
                    {w.agencyName}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                  {w.district}, {w.state}
                </td>
                <td className="px-4 py-3">
                  <RiskChip score={w.riskScore} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-600 capitalize">
                  {formatCategory(w.category)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${statusStyles[w.status]}`}
                  >
                    {formatStatus(w.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 tabular-nums">
                  {new Date(w.flaggedOn).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-xs text-slate-700 tabular-nums font-medium">
                  ₹{w.sanctionedAmount.toFixed(1)}L
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-500">
        Showing {sorted.length} work{sorted.length !== 1 ? "s" : ""} — click a row to open investigation detail
      </div>
    </div>
  );
}
