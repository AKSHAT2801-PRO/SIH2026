import { RiskBand, Work } from "@/types";

export function getRiskBand(score: number): RiskBand {
  if (score <= 30) return "low";
  if (score <= 60) return "medium";
  if (score <= 80) return "high";
  return "critical";
}

export function getRiskLabel(score: number): string {
  const band = getRiskBand(score);
  return { low: "LOW", medium: "MEDIUM", high: "HIGH", critical: "CRITICAL" }[band];
}

export function getRiskColors(score: number): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  const band = getRiskBand(score);
  const map = {
    low: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
      dot: "bg-green-500",
    },
    medium: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
    },
    high: {
      bg: "bg-red-50",
      text: "text-red-600",
      border: "border-red-200",
      dot: "bg-red-500",
    },
    critical: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-300",
      dot: "bg-red-700",
    },
  };
  return map[band];
}

export function getRiskBadgeHex(score: number): string {
  const band = getRiskBand(score);
  return { low: "#16a34a", medium: "#d97706", high: "#dc2626", critical: "#991b1b" }[band];
}

export function formatCurrency(lakhs: number): string {
  return `₹${lakhs.toFixed(1)}L`;
}

export function formatStatus(status: Work["status"]): string {
  return {
    pending_review: "Pending Review",
    under_review: "Under Review",
    cleared: "Cleared",
    escalated: "Escalated",
  }[status];
}

export function formatCategory(cat: Work["category"]): string {
  return {
    financial: "Financial",
    timeline: "Timeline",
    duplicate: "Duplicate",
    geographic: "Geographic",
    "multi-factor": "Multi-Factor",
  }[cat];
}

export function getRiskBandCounts(works: Work[]) {
  return {
    low: works.filter((w) => getRiskBand(w.riskScore) === "low").length,
    medium: works.filter((w) => getRiskBand(w.riskScore) === "medium").length,
    high: works.filter((w) => getRiskBand(w.riskScore) === "high").length,
    critical: works.filter((w) => getRiskBand(w.riskScore) === "critical").length,
  };
}
