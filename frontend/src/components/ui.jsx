import React from "react";

export const RISK_STYLES = {
  low: { label: "Low risk", text: "text-[#4A7C59]", bg: "bg-[#4A7C59]/10", bar: "bg-[#4A7C59]" },
  medium: { label: "Medium risk", text: "text-[#C48A3F]", bg: "bg-[#C48A3F]/10", bar: "bg-[#C48A3F]" },
  high: { label: "High risk", text: "text-[#B3453B]", bg: "bg-[#B3453B]/10", bar: "bg-[#B3453B]" },
};

export function RiskBadge({ score, band, size = "md" }) {
  const style = RISK_STYLES[band] || RISK_STYLES.medium;
  const sizing = size === "sm" ? "text-[10.5px] px-1.5 py-0.5" : "text-[11px] px-2 py-1";
  return (
    <div className={`inline-flex items-center gap-1.5 ${sizing} ${style.bg} ${style.text} shrink-0`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.bar}`} />
      {style.label} · {score}
    </div>
  );
}

const STATUS_STYLES = {
  "Completed": "text-[#4A7C59] bg-[#4A7C59]/10",
  "In Progress": "text-[#1C2B4A] bg-[#1C2B4A]/8",
  "Delayed": "text-[#B3453B] bg-[#B3453B]/10",
};

export function StatusPill({ status }) {
  const style = STATUS_STYLES[status] || "text-[#5A6478] bg-[#5A6478]/10";
  return (
    <span className={`inline-flex text-[11px] px-2 py-1 ${style} shrink-0`}>
      {status}
    </span>
  );
}

const INSPECTION_STYLES = {
  none: { label: "Not flagged", text: "text-[#8993A8]", bg: "bg-[#8993A8]/10" },
  flagged: { label: "Flagged", text: "text-[#B3453B]", bg: "bg-[#B3453B]/10" },
  scheduled: { label: "Scheduled", text: "text-[#C48A3F]", bg: "bg-[#C48A3F]/10" },
  completed: { label: "Inspected", text: "text-[#4A7C59]", bg: "bg-[#4A7C59]/10" },
};

export function InspectionPill({ status }) {
  const style = INSPECTION_STYLES[status] || INSPECTION_STYLES.none;
  return (
    <span className={`inline-flex text-[11px] px-2 py-1 ${style.bg} ${style.text} shrink-0`}>
      {style.label}
    </span>
  );
}

export function formatINR(amount) {
  if (amount == null) return "—";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}
