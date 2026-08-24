"use client";

import { RiskBand } from "@/types";

interface RiskBandToggleProps {
  active: RiskBand | "all";
  onChange: (band: RiskBand | "all") => void;
}

const bands: { value: RiskBand | "all"; label: string; count?: number }[] = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const activeColors: Record<RiskBand | "all", string> = {
  all: "bg-slate-700 text-white border-slate-700",
  critical: "bg-red-700 text-white border-red-700",
  high: "bg-red-500 text-white border-red-500",
  medium: "bg-amber-500 text-white border-amber-500",
  low: "bg-green-600 text-white border-green-600",
};

const inactiveColors: Record<RiskBand | "all", string> = {
  all: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
  critical: "bg-white text-red-700 border-red-200 hover:bg-red-50",
  high: "bg-white text-red-600 border-red-200 hover:bg-red-50",
  medium: "bg-white text-amber-700 border-amber-200 hover:bg-amber-50",
  low: "bg-white text-green-700 border-green-200 hover:bg-green-50",
};

export default function RiskBandToggle({ active, onChange }: RiskBandToggleProps) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label="Filter map by risk band">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest mr-1">
        Show:
      </span>
      {bands.map((b) => {
        const isActive = active === b.value;
        return (
          <button
            key={b.value}
            onClick={() => onChange(b.value)}
            aria-pressed={isActive}
            aria-label={`${isActive ? "Currently showing" : "Show"} ${b.label} risk works`}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500 ${
              isActive ? activeColors[b.value] : inactiveColors[b.value]
            }`}
          >
            {b.label}
          </button>
        );
      })}
    </div>
  );
}
