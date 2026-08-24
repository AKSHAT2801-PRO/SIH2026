"use client";

import { useState } from "react";
import { RiskReason } from "@/types";
import { ChevronDown, ChevronUp } from "lucide-react";

interface WhyFlaggedSectionProps {
  reasons: RiskReason[];
}

const weightColor = (w: number) => {
  if (w >= 25) return "bg-red-100 text-red-700 border-red-200";
  if (w >= 15) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

export default function WhyFlaggedSection({ reasons }: WhyFlaggedSectionProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (reasons.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-2">Why Flagged?</h2>
        <p className="text-sm text-slate-500 italic">No specific risk reasons recorded for this work.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-700">Why Flagged?</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Weighted risk factors contributing to the overall score — click to expand
        </p>
      </div>

      <div className="space-y-2">
        {reasons
          .sort((a, b) => b.weight - a.weight)
          .map((r) => {
            const isOpen = expanded === r.code;
            const chipClass = weightColor(r.weight);
            return (
              <div
                key={r.code}
                className="border border-slate-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : r.code)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
                  aria-expanded={isOpen}
                >
                  {/* Weight chip */}
                  <span
                    className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${chipClass}`}
                    aria-label={`Contributes ${r.weight} points`}
                  >
                    +{r.weight}
                  </span>

                  {/* Label */}
                  <span className="flex-1 text-sm font-medium text-slate-700">{r.label}</span>

                  {/* Expand icon */}
                  {isOpen ? (
                    <ChevronUp size={14} className="text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown size={14} className="text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-3 pt-0">
                    <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                      <p className="text-sm text-slate-600 leading-relaxed">{r.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      <p className="mt-4 text-xs text-slate-400 italic">
        Individual reason weights are additive but may be capped at 100 for the total risk score.
      </p>
    </div>
  );
}
