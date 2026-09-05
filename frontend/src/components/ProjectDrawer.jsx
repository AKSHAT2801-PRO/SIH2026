import React from "react";
import { X, MapPin, User, ExternalLink, ShieldAlert, Loader2 } from "lucide-react";
import { RiskBadge, StatusPill, InspectionPill, formatINR } from "./ui";

export default function ProjectDrawer({
  work,
  open,
  onClose,
  onMarkForInspection,
  onViewFullPage,
  markingInspection,
}) {
  if (!open || !work) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-[#1C2B4A]/30 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* panel */}
      <div className="relative w-full max-w-[440px] h-full bg-[#FAF9F6] shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-[#FAF9F6] border-b border-[#D8D3C7] px-6 py-4 flex items-center justify-between z-10">
          <span className="text-[12px] text-[#8993A8]">Project quick view</span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-[#5A6478] hover:text-[#1C2B4A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1C2B4A]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2
              className="text-[#1C2B4A] text-[20px] leading-snug"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              {work.title}
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            <RiskBadge score={work.riskScore} band={work.riskBand} />
            <StatusPill status={work.status} />
            <InspectionPill status={work.inspectionStatus} />
          </div>

          <div className="space-y-2 mb-6 text-[13.5px] text-[#5A6478]">
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-[#8993A8]" />
              {work.location}
            </div>
            <div className="flex items-center gap-2">
              <User size={14} className="text-[#8993A8]" />
              {work.mp}
            </div>
          </div>

          {/* progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-[13px] mb-1.5">
              <span className="text-[#5A6478]">Progress</span>
              <span className="text-[#1C2B4A]">{work.progressPct}%</span>
            </div>
            <div className="h-1.5 bg-[#EFECE3]">
              <div className="h-full bg-[#B8863F]" style={{ width: `${work.progressPct}%` }} />
            </div>
          </div>

          {/* budget */}
          <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-[#EFECE3]">
            <div>
              <div className="text-[11px] text-[#8993A8] mb-1">Allocated</div>
              <div className="text-[#1C2B4A] text-[14.5px]">{formatINR(work.budgetAllocated)}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#8993A8] mb-1">Spent</div>
              <div className="text-[#1C2B4A] text-[14.5px]">{formatINR(work.expenditure)}</div>
            </div>
          </div>

          {/* risk factors */}
          {work.riskFactors?.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-1.5 text-[12.5px] text-[#1C2B4A] mb-3">
                <ShieldAlert size={14} className="text-[#B8863F]" />
                Risk factors
              </div>
              <div className="space-y-2">
                {work.riskFactors.map((f, i) => (
                  <div key={i} className="border-l-2 border-[#D8D3C7] pl-3 py-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] text-[#1C2B4A]">{f.label}</span>
                      <span className="text-[10.5px] text-[#8993A8]">{f.weight}</span>
                    </div>
                    <p className="text-[11.5px] text-[#8993A8] mt-0.5">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* actions */}
          <div className="flex flex-col gap-2.5 mt-8">
            <button
              onClick={onViewFullPage}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[#1C2B4A] text-[#1C2B4A] text-[13.5px] hover:bg-[#1C2B4A] hover:text-[#FAF9F6] transition-colors"
            >
              View full project page
              <ExternalLink size={14} />
            </button>
            <button
              onClick={() => onMarkForInspection(work.id)}
              disabled={work.inspectionStatus !== "none" || markingInspection}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#B3453B] text-[#FAF9F6] text-[13.5px] hover:bg-[#9c3b32] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {markingInspection ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Marking...
                </>
              ) : work.inspectionStatus === "none" ? (
                "Mark for inspection"
              ) : (
                "Already flagged"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
