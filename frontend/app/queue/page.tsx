"use client";

import { useState, useMemo } from "react";
import { works } from "@/data/works";
import { getRiskBand } from "@/lib/riskUtils";
import QueueFilters, { Filters } from "@/components/queue/QueueFilters";
import QueueTable from "@/components/queue/QueueTable";

export default function QueuePage() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    riskBand: "all",
    state: "All States",
    category: "all",
    status: "all",
  });

  const filtered = useMemo(() => {
    return works.filter((w) => {
      if (
        filters.search &&
        !w.id.toLowerCase().includes(filters.search.toLowerCase()) &&
        !w.agencyName.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      if (filters.riskBand !== "all" && getRiskBand(w.riskScore) !== filters.riskBand)
        return false;
      if (filters.state !== "All States" && w.state !== filters.state) return false;
      if (filters.category !== "all" && w.category !== filters.category) return false;
      if (filters.status !== "all" && w.status !== filters.status) return false;
      return true;
    });
  }, [filters]);

  const clearFilters = () =>
    setFilters({ search: "", riskBand: "all", state: "All States", category: "all", status: "all" });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Investigation Queue</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          All flagged works · sorted by risk score by default
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <QueueFilters filters={filters} onChange={setFilters} />
      </div>

      <QueueTable works={filtered} onClearFilters={clearFilters} />
    </div>
  );
}
