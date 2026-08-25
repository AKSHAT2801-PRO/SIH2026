"use client";

import { useState } from "react";
import {
  FolderSearch,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  MapPinOff,
  Camera,
  FileText,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export default function DistrictAuditPortalPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [notes, setNotes] = useState("");

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            District Field Inspection & Audit Portal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review AI-flagged MPLADS works, conduct physical verification audits, and submit geotagged evidence.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Last Sync: Today, 12:45 PM
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Flagged Works</span>
            <span className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <FolderSearch size={18} />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">142</p>
          <span className="text-xs text-slate-400 font-medium">In Pune District</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending Inspections</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock size={18} />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-amber-600">38</p>
          <span className="text-xs text-amber-600/80 font-medium">Requires Site Visit</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Verification Rate</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle size={18} />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">73.2%</p>
          <span className="text-xs text-emerald-600/80 font-medium">+5.4% this month</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">High-Risk Allocation</span>
            <span className="p-2 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle size={18} />
            </span>
          </div>
          <p className="text-2xl font-extrabold text-red-600">₹ 18.4 Cr</p>
          <span className="text-xs text-red-600/80 font-medium">14 Critical Projects</span>
        </div>
      </div>

      {/* Filter Tabs & Main Work Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === "all" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Works (142)
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === "pending" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Pending Visit (38)
            </button>
            <button
              onClick={() => setActiveTab("inspection")}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === "inspection" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Under Inspection (24)
            </button>
            <button
              onClick={() => setActiveTab("escalated")}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === "escalated" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Escalated (14)
            </button>
            <button
              onClick={() => setActiveTab("resolved")}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
                activeTab === "resolved" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Resolved (66)
            </button>
          </div>
        </div>

        {/* Active Work Detail Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold rounded-full">
                  RISK SCORE: 88/100 (CRITICAL)
                </span>
                <span className="text-xs text-slate-400 font-mono">WORK-ID: MPLADS-MH-PN-2025-089</span>
              </div>
              <h2 className="text-xl font-bold mt-2 text-white">Construction of Community Multi-Purpose Hall</h2>
              <p className="text-xs text-slate-400 mt-1">
                Location: Haveli Taluka, Baramati Constituency | Sanctioned: ₹ 45,00,000 | Implementing Agency: PWD Rural Pune
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 size={16} />
                <span>Approve & Verify</span>
              </button>
              <button className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-500 transition-colors flex items-center gap-1.5 shadow-sm">
                <ShieldAlert size={16} />
                <span>Escalate to Central Ministry</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left Column: AI Anomaly Findings */}
            <div className="p-6 space-y-6 lg:col-span-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">AI Flagged Anomalies & Evidence</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 flex items-start gap-3">
                    <AlertOctagon size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-red-900">Fund Disbursement Velocity Anomaly</h4>
                      <p className="text-xs text-red-700 mt-1">
                        92% of total sanctioned funds (₹ 41.4 Lakhs) were disbursed in 48 hours, despite only 15% reported physical progress on site.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                    <MapPinOff size={20} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">Geospatial Duplicate Work Collision</h4>
                      <p className="text-xs text-amber-700 mt-1">
                        GPS coordinates match an existing Zilla Parishad community center project funded under Gram Vikas Nidhi in 2023.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evidence Upload & Field Inspection Panel */}
              <div className="border-t border-slate-200 pt-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Field Inspection Evidence & Upload</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                    <Camera size={24} className="text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700">Upload Geotagged Site Photos</p>
                    <p className="text-[10px] text-slate-400">EXIF metadata (lat/long/timestamp) auto-verified</p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 transition-colors">
                    <FileText size={24} className="text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700">Attach Official Verification Certificate</p>
                    <p className="text-[10px] text-slate-400">PDF, max 10MB (Signed by District Collector)</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">District Officer Inspector Notes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter findings from physical site verification inspection..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Audit Timeline & Metadata */}
            <div className="p-6 bg-slate-50/50 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Audit Action History</h3>
                <div className="space-y-4 relative pl-4 border-l-2 border-slate-200">
                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-white"></div>
                    <p className="text-xs font-bold text-slate-900">AI Risk Model Flagged Anomaly</p>
                    <p className="text-[11px] text-slate-500">Aug 24, 2026 • 09:30 AM</p>
                    <p className="text-xs text-slate-600 mt-1">Severity rating assigned: Critical (88/100)</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-white"></div>
                    <p className="text-xs font-bold text-slate-900">Assigned to District Officer</p>
                    <p className="text-[11px] text-slate-500">Aug 24, 2026 • 11:15 AM</p>
                    <p className="text-xs text-slate-600 mt-1">Assigned to Shri R. K. Sharma (Collectorate Pune)</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-white"></div>
                    <p className="text-xs font-bold text-slate-900">Field Site Visit Scheduled</p>
                    <p className="text-[11px] text-slate-500">Aug 25, 2026 • 10:00 AM</p>
                    <p className="text-xs text-slate-600 mt-1">Junior Engineer team deployed for site inspection</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Implementing Contractor</span>
                <p className="text-xs font-bold text-slate-900">Apex Infrastructure Services Ltd.</p>
                <p className="text-[11px] text-slate-500">
                  Vendor Risk Score: <span className="font-bold text-amber-600">64/100 (Medium)</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
