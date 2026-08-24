import Link from "next/link";
import { Work } from "@/types";
import { getRiskColors, getRiskLabel, formatCurrency } from "@/lib/riskUtils";
import { ArrowRight, MapPin } from "lucide-react";

interface RecentFlagsPanelProps {
  works: Work[];
}

export default function RecentFlagsPanel({ works }: RecentFlagsPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-700">Recent High-Risk Flags</h2>
          <p className="text-xs text-slate-500 mt-0.5">Flagged for review — pending action</p>
        </div>
        <Link
          href="/queue"
          className="text-xs font-medium text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {works.map((w) => {
          const { bg, text, border, dot } = getRiskColors(w.riskScore);
          const label = getRiskLabel(w.riskScore);
          return (
            <Link
              key={w.id}
              href={`/work/${w.id}`}
              className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-colors group focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
            >
              {/* Risk dot */}
              <div className="mt-1 shrink-0">
                <div className={`w-2.5 h-2.5 rounded-full ${dot}`} aria-hidden />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-slate-800">{w.id}</span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${bg} ${text} ${border}`}
                    aria-label={`Risk: ${label}`}
                  >
                    {label}
                  </span>
                </div>
                <p className="text-xs text-slate-600 truncate">{w.agencyName}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={10} className="text-slate-400 shrink-0" />
                  <span className="text-xs text-slate-400 truncate">
                    {w.district}, {w.state}
                  </span>
                </div>
              </div>

              {/* Score + amount */}
              <div className="shrink-0 text-right">
                <p className={`text-lg font-bold tabular-nums ${text}`}>{w.riskScore}</p>
                <p className="text-[11px] text-slate-500">{formatCurrency(w.sanctionedAmount)}</p>
              </div>

              <ArrowRight
                size={14}
                className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 mt-1"
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
