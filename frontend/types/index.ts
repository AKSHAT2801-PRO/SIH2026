export type WorkCategory =
  | "financial"
  | "timeline"
  | "duplicate"
  | "geographic"
  | "multi-factor";

export type WorkStatus =
  | "pending_review"
  | "under_review"
  | "cleared"
  | "escalated";

export type RiskBand = "low" | "medium" | "high" | "critical";

export interface RiskReason {
  code: string;
  label: string;
  weight: number;
  explanation: string;
}

export interface ActionItem {
  id: string;
  text: string;
}

export interface Work {
  id: string;
  agencyName: string;
  state: string;
  district: string;
  category: WorkCategory;
  status: WorkStatus;
  riskScore: number;
  flaggedOn: string; // ISO date string
  sanctionedAmount: number; // ₹ in lakhs
  reportedExpenditure: number; // ₹ in lakhs
  expectedDuration: number; // days
  actualDuration: number; // days
  latitude: number;
  longitude: number;
  reasons: RiskReason[];
  recommendedActions: ActionItem[];
  description: string;
}
