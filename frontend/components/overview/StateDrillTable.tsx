"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import { Work } from "@/types";
import { getRiskColors } from "@/lib/riskUtils";

interface StateData {
  state: string;
  total: number;
  highRisk: number;
  districts: { district: string; total: number; highRisk: number }[];
}

function buildStateData(works: Work[]): StateData[] {
  const map = new Map<string, Map<string, Work[]>>();
  for (const w of works) {
    if (!map.has(w.state)) map.set(w.state, new Map());
    const distMap = map.get(w.state)!;
    if (!distMap.has(w.district)) distMap.set(w.district, []);
    distMap.get(w.district)!.push(w);
  }

  return Array.from(map.entries())
    .map(([state, distMap]) => {
      const districts = Array.from(distMap.entries()).map(([district, ws]) => ({
        district,
        total: ws.length,
        highRisk: ws.filter((w) => w.riskScore > 60).length,
      }));
      const stateWorks = works.filter((w) => w.state === state);
      return {
        state,
        total: stateWorks.length,
        highRisk: stateWorks.filter((w) => w.riskScore > 60).length,
        districts,
      };
    })
    .sort((a, b) => b.highRisk - a.highRisk);
}

interface StateDrillTableProps {
  works: Work[];
}

export default function StateDrillTable({ works }: StateDrillTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const stateData = buildStateData(works);

  const toggle = (state: string) =>
    setExpanded((prev) => (prev === state ? null : state));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700">State / District Breakdown</h2>
        <p className="text-xs text-slate-500 mt-0.5">Click a state row to expand districts</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="bg-slate-50 text-xs uppercase tracking-widest text-slate-500 border-b border-slate-100">
              <th className="text-left px-5 py-3 font-semibold">State / District</th>
              <th className="text-right px-5 py-3 font-semibold">Total Works</th>
              <th className="text-right px-5 py-3 font-semibold">High-Risk</th>
            </tr>
          </thead>
          <tbody>
            {stateData.map(({ state, total, highRisk, districts }) => (
              <>
                <tr
                  key={state}
                  onClick={() => toggle(state)}
                  onKeyDown={(e) => e.key === "Enter" && toggle(state)}
                  tabIndex={0}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-500"
                  aria-expanded={expanded === state}
                  role="row"
                >
                  <td className="px-5 py-3 font-medium text-slate-800 flex items-center gap-2">
                    {expanded === state ? (
                      <ChevronDown size={14} className="text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="text-slate-400 shrink-0" />
                    )}
                    {state}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-600 tabular-nums">{total}</td>
                  <td className="px-5 py-3 text-right tabular-nums">
                    {highRisk > 0 ? (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                        {highRisk}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
                {expanded === state &&
                  districts.map((d) => {
                    const { bg, text } = getRiskColors(d.highRisk > 0 ? 70 : 10);
                    return (
                      <tr
                        key={d.district}
                        className="bg-slate-50/60 border-b border-slate-100"
                        role="row"
                      >
                        <td className="px-5 py-2.5 pl-12 text-slate-600 text-sm">
                          {d.district}
                        </td>
                        <td className="px-5 py-2.5 text-right text-slate-500 text-sm tabular-nums">
                          {d.total}
                        </td>
                        <td className="px-5 py-2.5 text-right text-sm tabular-nums">
                          {d.highRisk > 0 ? (
                            <span
                              className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-semibold border ${bg} ${text}`}
                            >
                              {d.highRisk}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
