// -----------------------------------------------------------------------
// Data service for Government Dashboard + Project Detail pages.
//
// HOW TO CONNECT YOUR BACKEND:
// Set DEMO_MODE to false and implement each function's fetch call.
// Every function already returns the exact shape the UI expects, so
// no component needs to change when you swap this over.
//
// MP DATA SHAPE (matches your backend's /mps response):
//   _id, mpName, constituency, state, house,
//   allocatedAmount, totalExpenditure, utilizationPercentage,
//   completedWorks, recommendedWorks, completionRatePercentage,
//   unspentAmount, transactionCount, successfulPayments,
//   pendingPayments, averageRating, createdAt, updatedAt
// -----------------------------------------------------------------------

export const DEMO_MODE = false;
const API_BASE_URL = "http://localhost:6005"; // <- change to your backend

// ---------------------------------------------------------------------
// DEMO DATA
// ---------------------------------------------------------------------

const DEMO_MPS = [
  {
    _id: "6a92a8580323b3ef3ff3bbc6",
    mpName: "Shri B.L. Verma (2020-26)",
    constituency: "Sitting Rajya Sabha",
    state: "Uttar Pradesh",
    house: "Rajya Sabha",
    allocatedAmount: 196063957.11,
    totalExpenditure: 168937264.09,
    utilizationPercentage: 86.16,
    completedWorks: 349,
    recommendedWorks: 65,
    completionRatePercentage: 84.3,
    unspentAmount: 27126693.02,
    transactionCount: 804,
    successfulPayments: 803,
    pendingPayments: 1,
    averageRating: null,
  },
  {
    _id: "6a92a8580323b3ef3ff3bbc7",
    mpName: "Shrimati K. Reddy (2019-24)",
    constituency: "Warangal",
    state: "Telangana",
    house: "Lok Sabha",
    allocatedAmount: 175000000,
    totalExpenditure: 92000000,
    utilizationPercentage: 52.57,
    completedWorks: 140,
    recommendedWorks: 210,
    completionRatePercentage: 66.7,
    unspentAmount: 83000000,
    transactionCount: 410,
    successfulPayments: 395,
    pendingPayments: 15,
    averageRating: 3.4,
  },
  {
    _id: "6a92a8580323b3ef3ff3bbc8",
    mpName: "Shri S. Pillai (2019-24)",
    constituency: "Kollam",
    state: "Kerala",
    house: "Lok Sabha",
    allocatedAmount: 155000000,
    totalExpenditure: 148000000,
    utilizationPercentage: 95.48,
    completedWorks: 310,
    recommendedWorks: 330,
    completionRatePercentage: 93.9,
    unspentAmount: 7000000,
    transactionCount: 720,
    successfulPayments: 718,
    pendingPayments: 2,
    averageRating: 4.5,
  },
];

const DEMO_WORKS = [
  {
    id: "w-1042",
    title: "Community Health Sub-Centre Upgrade",
    location: "Sitapur, Uttar Pradesh",
    mpId: "6a92a8580323b3ef3ff3bbc6",
    mp: "Shri B.L. Verma (2020-26)",
    status: "In Progress",
    progressPct: 62,
    riskScore: 78,
    riskBand: "high",
    riskFactors: [
      { label: "Timeline slippage", weight: "High", detail: "46 days behind schedule" },
      { label: "Fund utilisation mismatch", weight: "Medium", detail: "62% funds used, 38% work completed" },
      { label: "Site visit gap", weight: "Medium", detail: "Only 2 of 5 scheduled visits logged" },
    ],
    budgetAllocated: 4250000,
    expenditure: 2635000,
    timeAllottedMonths: 8,
    startDate: "2026-01-12",
    dueDate: "2026-09-12",
    contractor: { name: "Shivam Infra Builders", contact: "+91 98765 43210", pastProjects: 6, avgRiskScore: 54 },
    inspectionStatus: "flagged", // none | flagged | scheduled | completed
    lastInspection: null,
  },
  {
    id: "w-1039",
    title: "Rural Link Road — Phase II",
    location: "Warangal, Telangana",
    mpId: "6a92a8580323b3ef3ff3bbc7",
    mp: "Shrimati K. Reddy (2019-24)",
    status: "In Progress",
    progressPct: 41,
    riskScore: 34,
    riskBand: "medium",
    riskFactors: [
      { label: "Timeline slippage", weight: "Low", detail: "6 days behind schedule" },
      { label: "Contractor history", weight: "Medium", detail: "1 prior flagged project" },
    ],
    budgetAllocated: 11000000,
    expenditure: 4200000,
    timeAllottedMonths: 12,
    startDate: "2025-11-01",
    dueDate: "2026-11-01",
    contractor: { name: "Deccan Roadways Pvt Ltd", contact: "+91 91234 56780", pastProjects: 11, avgRiskScore: 38 },
    inspectionStatus: "none",
    lastInspection: null,
  },
  {
    id: "w-1031",
    title: "Government School Sanitation Block",
    location: "Kollam, Kerala",
    mpId: "6a92a8580323b3ef3ff3bbc8",
    mp: "Shri S. Pillai (2019-24)",
    status: "Completed",
    progressPct: 100,
    riskScore: 12,
    riskBand: "low",
    riskFactors: [{ label: "Timeline slippage", weight: "None", detail: "Completed on schedule" }],
    budgetAllocated: 1820000,
    expenditure: 1795000,
    timeAllottedMonths: 4,
    startDate: "2025-08-01",
    dueDate: "2025-12-01",
    contractor: { name: "Coastal Builders Co-op", contact: "+91 97654 32109", pastProjects: 22, avgRiskScore: 15 },
    inspectionStatus: "completed",
    lastInspection: { outcome: "Pass", date: "2025-11-20", notes: "Work matches spec, no discrepancies found." },
  },
  {
    id: "w-1019",
    title: "Drinking Water Pipeline Extension",
    location: "Bikaner, Rajasthan",
    mpId: "6a92a8580323b3ef3ff3bbc6",
    mp: "Shri B.L. Verma (2020-26)",
    status: "In Progress",
    progressPct: 28,
    riskScore: 85,
    riskBand: "high",
    riskFactors: [
      { label: "Timeline slippage", weight: "High", detail: "60 days behind schedule" },
      { label: "Contractor history", weight: "High", detail: "2 prior flagged projects, 1 blacklist warning" },
      { label: "Citizen complaints", weight: "High", detail: "9 reports citing incomplete/absent work" },
    ],
    budgetAllocated: 6340000,
    expenditure: 3820000,
    timeAllottedMonths: 10,
    startDate: "2025-10-01",
    dueDate: "2026-08-01",
    contractor: { name: "Thar Infra Solutions", contact: "+91 99887 66554", pastProjects: 9, avgRiskScore: 71 },
    inspectionStatus: "flagged",
    lastInspection: null,
  },
];

const DEMO_REVIEWS = [
  { id: "r-1", workId: "w-1042", author: "Resident, Sitapur", text: "Construction has been paused for over two weeks with no update from the contractor.", sentiment: "negative", date: "2026-08-28" },
  { id: "r-2", workId: "w-1019", author: "Resident, Bikaner", text: "Pipeline work near our street hasn't progressed in a month. Workers rarely show up.", sentiment: "negative", date: "2026-08-30" },
  { id: "r-3", workId: "w-1031", author: "Resident, Kollam", text: "Sanitation block looks solid and well finished. Good work overall.", sentiment: "positive", date: "2026-08-15" },
];

// ---------------------------------------------------------------------
// COMPOSITE MP PERFORMANCE / SUSPICION SCORE
//
// Higher score = more suspicious. Built entirely from real MP fields
// now (no more reliance on demo "works" join):
//   - low utilization vs allocation (money sitting unspent)
//   - low completion rate vs recommended works
//   - pending/failed payment ratio (financial irregularity signal)
//   - low citizen rating
//
// This is a placeholder formula — replace with your backend's computed
// score once available (see fetchMPPerformance below).
// ---------------------------------------------------------------------
function computeMPPerformance(mp) {
  const utilization = mp.utilizationPercentage ?? 0;
  const completionRate = mp.completionRatePercentage ?? 0;
  const pendingRatio =
    mp.transactionCount > 0 ? (mp.pendingPayments / mp.transactionCount) * 100 : 0;
  const rating = mp.averageRating ?? 3; // treat missing rating as neutral, not a red flag

  // Each sub-score: 0 (good) to 100 (bad)
  const utilizationRisk = Math.max(0, 100 - utilization);
  const completionRisk = Math.max(0, 100 - completionRate);
  const paymentRisk = Math.min(100, pendingRatio * 10);
  const ratingRisk = Math.max(0, (5 - rating) * 20);

  const suspicionScore = Math.min(
    100,
    Math.round(
      utilizationRisk * 0.35 +
      completionRisk * 0.35 +
      paymentRisk * 0.2 +
      ratingRisk * 0.1
    )
  );

  return {
    ...mp,
    suspicionScore,
    utilizationRisk: Math.round(utilizationRisk),
    completionRisk: Math.round(completionRisk),
    pendingPaymentsCount: mp.pendingPayments,
  };
}

// ---------------------------------------------------------------------
// PUBLIC API — call these from components
// ---------------------------------------------------------------------

/** Summary stats for the dashboard header strip. */
export async function fetchDashboardStats() {
  if (DEMO_MODE) {
    const completed = DEMO_WORKS.filter((w) => w.status === "Completed").length;
    const inProgress = DEMO_WORKS.filter((w) => w.status === "In Progress").length;
    const flagged = DEMO_WORKS.filter((w) => w.inspectionStatus === "flagged").length;
    return Promise.resolve({
      totalWorks: DEMO_WORKS.length,
      completed,
      inProgress,
      flaggedForInspection: flagged,
      totalMPs: DEMO_MPS.length,
    });
  }
  const res = await fetch(`${API_BASE_URL}/government/stats`);
  if (!res.ok) throw new Error("Failed to load dashboard stats.");
  return res.json();
}

/** All works, optionally sorted by risk score descending. */
export async function fetchAllWorks({ sortByRisk = true } = {}) {
  if (DEMO_MODE) {
    const data = [...DEMO_WORKS];
    if (sortByRisk) data.sort((a, b) => b.riskScore - a.riskScore);
    return Promise.resolve(data);
  }
  const res = await fetch(`${API_BASE_URL}/government/works?sortByRisk=${sortByRisk}`);
  if (!res.ok) throw new Error("Failed to load works.");
  return res.json();
}

/** Single work by id — used by Project Detail page. */
export async function fetchWorkById(workId) {
  if (DEMO_MODE) {
    const work = DEMO_WORKS.find((w) => w.id === workId);
    if (!work) throw new Error("Project not found.");
    return Promise.resolve(work);
  }
  const res = await fetch(`${API_BASE_URL}/works/${workId}`);
  if (!res.ok) throw new Error("Failed to load project.");
  return res.json();
}

/**
 * All MPs, in the real backend schema (mpName, constituency, state,
 * house, allocatedAmount, totalExpenditure, etc.)
 */
export async function fetchAllMPs() {
  if (DEMO_MODE) {
    return Promise.resolve(DEMO_MPS);
  }
  const res = await fetch(`${API_BASE_URL}/mps?page=1&limit=30`);
  if (!res.ok) throw new Error("Failed to load MPs.");
  const data = await res.json();
  console.log(data)
  return data;
}

/**
 * MPs with composite performance/suspicion score, sorted worst-first.
 * Computed client-side from real MP fields via computeMPPerformance()
 * until your backend returns a pre-computed score.
 */
export async function fetchMPPerformance() {
  if (DEMO_MODE) {
    const scored = DEMO_MPS.map((mp) => computeMPPerformance(mp));
    scored.sort((a, b) => b.suspicionScore - a.suspicionScore);
    return Promise.resolve(scored);
  }
  // If/when your backend computes this itself, swap to a direct fetch:
  //   const res = await fetch(`${API_BASE_URL}/government/mp-performance`);
  //   return res.json();
  const mps = await fetchAllMPs();
  const list = Array.isArray(mps) ? mps : mps.data || [];
  const scored = list.map((mp) => computeMPPerformance(mp));
  scored.sort((a, b) => b.suspicionScore - a.suspicionScore);
  return scored;
}

/** Citizen reviews, optionally filtered to one work. */
export async function fetchReviews({ workId } = {}) {
  if (DEMO_MODE) {
    const data = workId ? DEMO_REVIEWS.filter((r) => r.workId === workId) : DEMO_REVIEWS;
    return Promise.resolve(data);
  }
  const url = workId
    ? `${API_BASE_URL}/reviews?workId=${workId}`
    : `${API_BASE_URL}/reviews`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load reviews.");
  return res.json();
}

/** Flag a work for inspection (one-click). */
export async function markForInspection(workId) {
  if (DEMO_MODE) {
    const work = DEMO_WORKS.find((w) => w.id === workId);
    if (work) work.inspectionStatus = "flagged";
    return Promise.resolve({ success: true });
  }
  const res = await fetch(`${API_BASE_URL}/works/${workId}/flag-inspection`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to flag project for inspection.");
  return res.json();
}

/** Submit an inspection result. photoFile is optional (File object). */
export async function submitInspectionResult(workId, { outcome, notes, photoFile }) {
  if (DEMO_MODE) {
    const work = DEMO_WORKS.find((w) => w.id === workId);
    if (work) {
      work.inspectionStatus = "completed";
      work.lastInspection = { outcome, notes, date: new Date().toISOString().slice(0, 10) };
    }
    return Promise.resolve({ success: true });
  }
  const formData = new FormData();
  formData.append("outcome", outcome);
  formData.append("notes", notes);
  if (photoFile) formData.append("photo", photoFile);

  const res = await fetch(`${API_BASE_URL}/works/${workId}/inspection-result`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to submit inspection result.");
  return res.json();
}