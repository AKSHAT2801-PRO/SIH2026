"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Work, RiskBand } from "@/types";
import { getRiskBadgeHex, getRiskLabel } from "@/lib/riskUtils";
import Link from "next/link";

// Fix icon for SSR-less import
function SetView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface MapViewProps {
  works: Work[];
  activeBand: RiskBand | "all";
}

export default function MapView({ works, activeBand }: MapViewProps) {
  const filtered =
    activeBand === "all"
      ? works
      : works.filter((w) => {
          const score = w.riskScore;
          if (activeBand === "critical") return score > 80;
          if (activeBand === "high") return score > 60 && score <= 80;
          if (activeBand === "medium") return score > 30 && score <= 60;
          return score <= 30;
        });

  return (
    <MapContainer
      center={[22.5, 82.0]}
      zoom={5}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {filtered.map((work) => {
        const hex = getRiskBadgeHex(work.riskScore);
        const label = getRiskLabel(work.riskScore);
        return (
          <CircleMarker
            key={work.id}
            center={[work.latitude, work.longitude]}
            radius={work.riskScore > 80 ? 12 : work.riskScore > 60 ? 10 : work.riskScore > 30 ? 8 : 6}
            pathOptions={{
              color: hex,
              fillColor: hex,
              fillOpacity: 0.75,
              weight: 2,
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="font-bold text-slate-800 text-sm mb-1">{work.id}</div>
                <div className="text-xs text-slate-600 mb-1 leading-snug">{work.description}</div>
                <div className="text-xs text-slate-500 mb-2">
                  {work.district}, {work.state}
                </div>
                <div
                  className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full mb-3"
                  style={{ color: hex, backgroundColor: `${hex}20` }}
                >
                  Risk: {work.riskScore}/100 — {label}
                </div>
                <br />
                <a
                  href={`/work/${work.id}`}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline"
                >
                  View Investigation Detail →
                </a>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
