"use client";

import { Search, FileText } from "lucide-react";

export default function TopBar() {
  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-white border-b border-slate-200 z-10 flex items-center px-6 gap-4 shadow-sm">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search works, agencies…"
          className="w-full pl-8 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white transition-colors"
        />
      </div>

      <div className="flex-1" />

      {/* Generate Report — disabled with tooltip */}
      <div className="relative group">
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 text-sm font-medium rounded-lg border border-slate-200 cursor-not-allowed"
          aria-label="Generate Report — coming soon"
        >
          <FileText size={14} />
          Generate Report
        </button>
        <div className="absolute right-0 top-full mt-2 bg-slate-800 text-white text-xs rounded-md px-3 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Coming soon
        </div>
      </div>
    </header>
  );
}
