"use client";

import { useState } from "react";
import { mpProfilesData, MPProfile } from "@/data/mpProfiles";
import { Search, Filter, User, MapPin, CheckCircle, AlertTriangle, ArrowUpRight, X, Building2 } from "lucide-react";

export default function MpDirectoryPage() {
  const [search, setSearch] = useState("");
  const [selectedHouse, setSelectedHouse] = useState<string>("All");
  const [selectedState, setSelectedState] = useState<string>("All");
  const [selectedMp, setSelectedMp] = useState<MPProfile | null>(null);

  const states = ["All", ...Array.from(new Set(mpProfilesData.map((m) => m.state)))];

  const filteredMps = mpProfilesData.filter((mp) => {
    const matchesSearch =
      mp.name.toLowerCase().includes(search.toLowerCase()) ||
      mp.constituency.toLowerCase().includes(search.toLowerCase()) ||
      mp.state.toLowerCase().includes(search.toLowerCase()) ||
      mp.party.toLowerCase().includes(search.toLowerCase());

    const matchesHouse = selectedHouse === "All" || mp.house === selectedHouse;
    const matchesState = selectedState === "All" || mp.state === selectedState;

    return matchesSearch && matchesHouse && matchesState;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white rounded-3xl p-8 shadow-xl border border-slate-800">
        <span className="text-xs font-extrabold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
          Member of Parliament (MP) Spending Directory
        </span>
        <h1 className="text-3xl font-extrabold mt-3 tracking-tight">MPLADS Fund Utilization & Work Profiles</h1>
        <p className="text-sm text-slate-300 mt-1 max-w-2xl">
          Search and track all 788 Members of Parliament across Lok Sabha & Rajya Sabha. View recommended works, sanctioned allocations, and physical completion rates.
        </p>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by MP name, constituency, state, or party..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* House Select */}
          <select
            value={selectedHouse}
            onChange={(e) => setSelectedHouse(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-semibold focus:outline-none"
          >
            <option value="All">All Houses (Lok Sabha & Rajya Sabha)</option>
            <option value="Lok Sabha">Lok Sabha</option>
            <option value="Rajya Sabha">Rajya Sabha</option>
          </select>

          {/* State Select */}
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-semibold focus:outline-none"
          >
            {states.map((st) => (
              <option key={st} value={st}>
                {st === "All" ? "All States & UTs" : st}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MP Directory Cards / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMps.map((mp) => (
          <div
            key={mp.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center text-base font-extrabold shadow-sm border-2 border-amber-500/30">
                    {mp.name.replace("Shri ", "").replace("Smt. ", "").substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">{mp.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {mp.constituency}, {mp.state}
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: mp.partyColor }}>
                  {mp.party}
                </span>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mt-4">
                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                  {mp.house}
                </span>
                <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                  {mp.worksCount.recommended} Works Recommended
                </span>
              </div>

              {/* Financial Progress Bar */}
              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-500">Utilization Rate</span>
                  <span className="text-slate-900 font-extrabold">{mp.utilizationRate}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: `${mp.utilizationRate}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-medium pt-1">
                  <span>Sanctioned: ₹{mp.sanctionedCr} Cr</span>
                  <span>Spent: ₹{mp.expenditureCr} Cr</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={() => setSelectedMp(mp)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span>View Full MP Dossier</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* MP Detail Modal Popup */}
      {selectedMp && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl space-y-6 p-8 relative">
            <button
              onClick={() => setSelectedMp(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-900 text-amber-400 font-extrabold text-xl flex items-center justify-center border-2 border-amber-500">
                {selectedMp.name.replace("Shri ", "").replace("Smt. ", "").substring(0, 2)}
              </div>
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">{selectedMp.house} • {selectedMp.party}</span>
                <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">{selectedMp.name}</h2>
                <p className="text-xs text-slate-500 font-semibold">{selectedMp.constituency} Constituency, {selectedMp.state}</p>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Entitlement</span>
                <p className="text-lg font-extrabold text-slate-900">₹{selectedMp.entitlementCr} Cr</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sanctioned</span>
                <p className="text-lg font-extrabold text-slate-900">₹{selectedMp.sanctionedCr} Cr</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Utilization</span>
                <p className="text-lg font-extrabold text-emerald-600">{selectedMp.utilizationRate}%</p>
              </div>
            </div>

            {/* Sector Breakdown */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Sector-Wise Expenditure Breakdown</h3>
              <div className="space-y-2">
                {selectedMp.sectorBreakdown.map((sec, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{sec.sector}</span>
                      <span className="text-slate-900 font-extrabold">₹{sec.amountCr} Cr ({sec.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${sec.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Works */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Recommended & Sanctioned Works</h3>
              <div className="space-y-2">
                {selectedMp.recentWorks.map((work, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{work.title}</p>
                      <p className="text-[10px] text-slate-500">{work.sector} • {work.district}</p>
                    </div>
                    <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      ₹{work.sanctionedLakhs} Lakhs
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
