"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { works } from "@/data/works";
import { getRiskBand, getRiskBandCounts } from "@/lib/riskUtils";
import { RiskBand } from "@/types";
import RiskBandToggle from "@/components/map/RiskBandToggle";

// Dynamic import to skip SSR (Leaflet requires `window`)
const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full bg-slate-100 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading map…</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  const [activeBand, setActiveBand] = useState<RiskBand | "all">("all");

  const counts = getRiskBandCounts(works);
  const visibleCount = useMemo(() => {
    if (activeBand === "all") return works.length;
    return works.filter((w) => getRiskBand(w.riskScore) === activeBand).length;
  }, [activeBand]);

  return (
    <div className="space-y-4 h-full">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Map View</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Geographic distribution of flagged works — click a pin for details
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center justify-between gap-3">
        <RiskBandToggle active={activeBand} onChange={setActiveBand} />
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-700">{visibleCount}</strong> of {works.length} works
          </span>
          <span>·</span>
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-red-800 mr-1" aria-hidden />Critical: {counts.critical}
          </span>
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" aria-hidden />High: {counts.high}
          </span>
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" aria-hidden />Medium: {counts.medium}
          </span>
          <span>
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" aria-hidden />Low: {counts.low}
          </span>
        </div>
      </div>

      {/* Map container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 280px)", minHeight: "500px" }}>
        <MapView works={works} activeBand={activeBand} />
      </div>

      <p className="text-xs text-slate-400 italic text-center">
        Map data © OpenStreetMap contributors · Pin size scales with risk score
      </p>
    </div>
  );
}
