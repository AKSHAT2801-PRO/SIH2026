"use client";

import { Building2, Printer, Download, Check } from "lucide-react";

export default function ExecutiveReportPage() {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Printable PDF Style Document Container */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden print:shadow-none print:border-none">
        {/* Top Official Header */}
        <div className="p-8 border-b-2 border-slate-900 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md">
              <Building2 size={28} />
            </div>
            <div>
              <span className="text-xs font-extrabold tracking-widest text-sky-400 uppercase">
                MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION
              </span>
              <h1 className="text-2xl font-extrabold text-white tracking-tight mt-0.5">
                MPLADS Risk Intelligence Audit Brief
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                National Infrastructure Anomaly Assessment Report • FY 2025-26
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-lg hover:bg-sky-500 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Printer size={16} />
              <span>Export Official PDF</span>
            </button>
          </div>
        </div>

        {/* Report Metadata Strip */}
        <div className="px-8 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-600 font-medium">
          <div>
            <span>Report Ref:</span> <span className="font-bold text-slate-900 font-mono">MOSPI/MPLADS/2026/Q2-088</span>
          </div>
          <div>
            <span>Generated:</span> <span className="font-bold text-slate-900">25 August 2026, 12:45 PM IST</span>
          </div>
          <div>
            <span>Classification:</span>{" "}
            <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              CONFIDENTIAL / FOR OFFICIAL USE
            </span>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Executive Summary Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Executive Overview & Key Metrics</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Total Sanctioned Fund</span>
                <p className="text-xl font-extrabold text-slate-900">₹ 4,820 Cr</p>
                <span className="text-[10px] text-slate-400">Across 28 States & UTs</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-red-600 uppercase">Anomaly Exposure</span>
                <p className="text-xl font-extrabold text-red-600">₹ 142.5 Cr</p>
                <span className="text-[10px] text-red-500 font-medium">2.9% of Total Allocation</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-amber-600 uppercase">High Risk Works</span>
                <p className="text-xl font-extrabold text-amber-600">218 Works</p>
                <span className="text-[10px] text-amber-600 font-medium">Risk Score &gt; 70</span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold text-emerald-600 uppercase">Inspection Clearance</span>
                <p className="text-xl font-extrabold text-emerald-600">81.4%</p>
                <span className="text-[10px] text-emerald-600 font-medium">1,420 Verified</span>
              </div>
            </div>
          </div>

          {/* Regional Risk Breakdown Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">State-Wise Anomaly Distribution Table</h2>
              <span className="text-xs text-slate-500">Sorted by Anomaly Exposure Amount</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">State / Region</th>
                    <th className="py-3 px-4 text-center">Total Works</th>
                    <th className="py-3 px-4 text-center">Flagged Anomalies</th>
                    <th className="py-3 px-4 text-right">Flagged Exposure (₹ Cr)</th>
                    <th className="py-3 px-4 text-center">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">Maharashtra</td>
                    <td className="py-3 px-4 text-center font-medium">412</td>
                    <td className="py-3 px-4 text-center font-bold text-red-600">38</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">₹ 28.4 Cr</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 bg-red-100 text-red-700 font-bold rounded-full border border-red-300">HIGH</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">Uttar Pradesh</td>
                    <td className="py-3 px-4 text-center font-medium">580</td>
                    <td className="py-3 px-4 text-center font-bold text-red-600">46</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">₹ 34.2 Cr</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 bg-red-100 text-red-700 font-bold rounded-full border border-red-300">HIGH</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">Bihar</td>
                    <td className="py-3 px-4 text-center font-medium">320</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600">24</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">₹ 18.6 Cr</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 font-bold rounded-full border border-amber-300">MEDIUM</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">Tamil Nadu</td>
                    <td className="py-3 px-4 text-center font-medium">290</td>
                    <td className="py-3 px-4 text-center font-bold text-amber-600">14</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">₹ 9.2 Cr</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 font-bold rounded-full border border-amber-300">MEDIUM</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">Karnataka</td>
                    <td className="py-3 px-4 text-center font-medium">245</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-600">8</td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900">₹ 4.8 Cr</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded-full border border-emerald-300">LOW</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Priority Directives & Sign-off Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recommended Administrative Actions</h3>
              <ul className="space-y-2 text-xs text-slate-700 list-disc pl-4">
                <li>Freeze fund disbursements for 14 Critical Anomaly works in Pune & Lucknow districts.</li>
                <li>Order mandatory physical inspection audit within 15 days by State Vigilance Team.</li>
                <li>Issue blacklisting notice to contractors involved in vendor collusion cluster DIN #0849281.</li>
              </ul>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Ministry Approval & Sign-Off</h3>
                <p className="text-xs text-slate-500 mt-1">Reviewed by Central Nodal Authority for Infrastructure Monitoring.</p>
              </div>
              <div className="pt-4 border-t border-slate-300 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Dr. A. K. Varma, IAS</p>
                  <p className="text-[10px] text-slate-500">Joint Secretary, MOSPI</p>
                </div>
                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold flex items-center gap-1">
                  <Check size={12} />
                  <span>AUDIT VERIFIED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
