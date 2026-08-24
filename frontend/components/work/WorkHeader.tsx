import Link from "next/link";
import { Work } from "@/types";
import { getRiskLabel, getRiskColors, getRiskBadgeHex, formatStatus } from "@/lib/riskUtils";
import { ArrowLeft, MapPin, Building2, Calendar } from "lucide-react";

interface WorkHeaderProps {
  work: Work;
}

export default function WorkHeader({ work }: WorkHeaderProps) {
  const label = getRiskLabel(work.riskScore);
  const { text } = getRiskColors(work.riskScore);
  const hex = getRiskBadgeHex(work.riskScore);
  const statusColors: Record<Work["status"], string> = {
    pending_review: "bg-amber-50 text-amber-700 border-amber-200",
    under_review: "bg-sky-50 text-sky-700 border-sky-200",
    cleared: "bg-green-50 text-green-700 border-green-200",
    escalated: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {/* Back nav */}
      <Link
        href="/queue"
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-5 w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 rounded"
      >
        <ArrowLeft size={14} />
        Back to Investigation Queue
      </Link>

      <div className="flex flex-col lg:flex-row lg:items-start gap-5">
        {/* Left: metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-base font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
              {work.id}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded border ${statusColors[work.status]}`}
            >
              {formatStatus(work.status)}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 leading-snug mb-3">
            {work.description}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-1.5">
              <Building2 size={14} className="text-slate-400 shrink-0" />
              <span>{work.agencyName}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-slate-400 shrink-0" />
              <span>{work.district}, {work.state}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <span>
                Flagged{" "}
                {new Date(work.flaggedOn).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Large risk badge */}
        <div className="flex flex-col items-center shrink-0">
          <div
            className="w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 shadow-md"
            style={{ borderColor: hex, backgroundColor: `${hex}12` }}
            aria-label={`Risk score: ${work.riskScore} out of 100 — ${label}`}
          >
            <span
              className="text-3xl font-extrabold tabular-nums leading-none"
              style={{ color: hex }}
            >
              {work.riskScore}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 mt-0.5">/100</span>
          </div>
          <div
            className="mt-2 px-3 py-0.5 rounded-full text-xs font-bold tracking-wider"
            style={{ color: hex, backgroundColor: `${hex}18` }}
          >
            {label} RISK
          </div>
        </div>
      </div>
    </div>
  );
}
