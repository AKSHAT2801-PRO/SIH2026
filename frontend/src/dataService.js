// -----------------------------------------------------------------------
// Data service for Government Dashboard + Project Detail pages.
//
// HOW TO CONNECT YOUR BACKEND:
// Set DEMO_MODE to false and implement each function's fetch call.
// Every function already returns the exact shape the UI expects, so
// no component needs to change when you swap this over.
// -----------------------------------------------------------------------

export const DEMO_MODE = false;
const API_BASE_URL = "http://localhost:6005"; // <- change to your backend

// ---------------------------------------------------------------------
// DEMO DATA
// ---------------------------------------------------------------------

const DEMO_MPS = [
  { id: "mp-01", name: "R. Chaturvedi", constituency: "Sitapur", state: "Uttar Pradesh", party: "Independent", worksCount: 14, totalFunds: "₹6.2 Cr", photoInitials: "RC" },
  { id: "mp-02", name: "K. Reddy", constituency: "Warangal", state: "Telangana", party: "Party A", worksCount: 9, totalFunds: "₹4.8 Cr", photoInitials: "KR" },
  { id: "mp-03", name: "S. Pillai", constituency: "Kollam", state: "Kerala", party: "Party B", worksCount: 11, totalFunds: "₹5.1 Cr", photoInitials: "SP" },
  { id: "mp-04", name: "A. Deshmukh", constituency: "Nagpur", state: "Maharashtra", party: "Party A", worksCount: 17, totalFunds: "₹7.9 Cr", photoInitials: "AD" },
  { id: "mp-05", name: "V. Singh", constituency: "Bikaner", state: "Rajasthan", party: "Party C", worksCount: 8, totalFunds: "₹3.6 Cr", photoInitials: "VS" },
  { id: "mp-06", name: "P. Bora", constituency: "Guwahati", state: "Assam", party: "Party B", worksCount: 12, totalFunds: "₹5.5 Cr", photoInitials: "PB" },
];

const DEMO_WORKS = [
  {
    id: "w-1042",
    title: "Community Health Sub-Centre Upgrade",
    location: "Sitapur, Uttar Pradesh",
    mpId: "mp-01",
    mp: "R. Chaturvedi",
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
    mpId: "mp-02",
    mp: "K. Reddy",
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
    mpId: "mp-03",
    mp: "S. Pillai",
    status: "Completed",
    progressPct: 100,
    riskScore: 12,
    riskBand: "low",
    riskFactors: [
      { label: "Timeline slippage", weight: "None", detail: "Completed on schedule" },
    ],
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
    id: "w-1027",
    title: "Solar Street Lighting — Ward 14",
    location: "Nagpur, Maharashtra",
    mpId: "mp-04",
    mp: "A. Deshmukh",
    status: "In Progress",
    progressPct: 55,
    riskScore: 61,
    riskBand: "medium",
    riskFactors: [
      { label: "Fund utilisation mismatch", weight: "High", detail: "70% funds used, 55% work completed" },
      { label: "Citizen complaints", weight: "Medium", detail: "4 delay reports filed this month" },
    ],
    budgetAllocated: 2780000,
    expenditure: 1946000,
    timeAllottedMonths: 6,
    startDate: "2026-02-01",
    dueDate: "2026-08-01",
    contractor: { name: "Vidarbha Solar Systems", contact: "+91 90909 12345", pastProjects: 4, avgRiskScore: 47 },
    inspectionStatus: "scheduled",
    lastInspection: null,
  },
  {
    id: "w-1019",
    title: "Drinking Water Pipeline Extension",
    location: "Bikaner, Rajasthan",
    mpId: "mp-05",
    mp: "V. Singh",
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
  {
    id: "w-1004",
    title: "Public Library Renovation",
    location: "Guwahati, Assam",
    mpId: "mp-06",
    mp: "P. Bora",
    status: "Completed",
    progressPct: 100,
    riskScore: 8,
    riskBand: "low",
    riskFactors: [
      { label: "Timeline slippage", weight: "None", detail: "Completed 5 days early" },
    ],
    budgetAllocated: 960000,
    expenditure: 941000,
    timeAllottedMonths: 3,
    startDate: "2025-09-01",
    dueDate: "2025-12-01",
    contractor: { name: "Brahmaputra Builders", contact: "+91 98123 45670", pastProjects: 15, avgRiskScore: 11 },
    inspectionStatus: "completed",
    lastInspection: { outcome: "Pass", date: "2025-11-28", notes: "Renovation matches approved plan." },
  },
  {
    id: "w-1051",
    title: "Anganwadi Centre Construction",
    location: "Sitapur, Uttar Pradesh",
    mpId: "mp-01",
    mp: "R. Chaturvedi",
    status: "In Progress",
    progressPct: 33,
    riskScore: 66,
    riskBand: "medium",
    riskFactors: [
      { label: "Fund utilisation mismatch", weight: "Medium", detail: "48% funds used, 33% work completed" },
      { label: "Site visit gap", weight: "Low", detail: "1 of 4 scheduled visits logged" },
    ],
    budgetAllocated: 1540000,
    expenditure: 739000,
    timeAllottedMonths: 5,
    startDate: "2026-03-01",
    dueDate: "2026-08-01",
    contractor: { name: "Shivam Infra Builders", contact: "+91 98765 43210", pastProjects: 6, avgRiskScore: 54 },
    inspectionStatus: "none",
    lastInspection: null,
  },
];

const DEMO_REVIEWS = [
  { id: "r-1", workId: "w-1042", author: "Resident, Sitapur", text: "Construction has been paused for over two weeks with no update from the contractor.", sentiment: "negative", date: "2026-08-28" },
  { id: "r-2", workId: "w-1019", author: "Resident, Bikaner", text: "Pipeline work near our street hasn't progressed in a month. Workers rarely show up.", sentiment: "negative", date: "2026-08-30" },
  { id: "r-3", workId: "w-1027", author: "Resident, Nagpur", text: "Half the streetlights installed are already flickering. Quality seems questionable.", sentiment: "negative", date: "2026-08-25" },
  { id: "r-4", workId: "w-1031", author: "Resident, Kollam", text: "Sanitation block looks solid and well finished. Good work overall.", sentiment: "positive", date: "2026-08-15" },
  { id: "r-5", workId: "w-1042", author: "Resident, Sitapur", text: "No visible activity at the site this week either.", sentiment: "negative", date: "2026-09-01" },
  { id: "r-6", workId: "w-1004", author: "Resident, Guwahati", text: "Library renovation turned out great, finished ahead of time.", sentiment: "positive", date: "2026-08-10" },
];

// ---------------------------------------------------------------------
// COMPOSITE MP PERFORMANCE SCORE
// Higher score = more suspicious. Combines: avg risk score, fund
// utilisation mismatch, delay frequency, and citizen complaint volume.
// This logic is a placeholder — replace with your backend's computed
// score once available (see fetchMPPerformance below).
// ---------------------------------------------------------------------
function computeMPPerformance(mp, works, reviews) {
  const mpWorks = works.filter((w) => w.mpId === mp.id);
  if (mpWorks.length === 0) {
    return { ...mp, suspicionScore: 0, avgRiskScore: 0, delayedWorks: 0, complaintCount: 0 };
  }

  const avgRiskScore = Math.round(
    mpWorks.reduce((sum, w) => sum + w.riskScore, 0) / mpWorks.length
  );

  const delayedWorks = mpWorks.filter((w) =>
    w.riskFactors.some((f) => f.label === "Timeline slippage" && f.weight !== "None" && f.weight !== "Low")
  ).length;

  const complaintCount = reviews.filter(
    (r) => mpWorks.some((w) => w.id === r.workId) && r.sentiment === "negative"
  ).length;

  const utilisationMismatchCount = mpWorks.filter((w) =>
    w.riskFactors.some((f) => f.label === "Fund utilisation mismatch")
  ).length;

  // Weighted composite, 0-100 scale
  const suspicionScore = Math.min(
    100,
    Math.round(
      avgRiskScore * 0.45 +
      delayedWorks * 8 +
      complaintCount * 5 +
      utilisationMismatchCount * 6
    )
  );

  return { ...mp, suspicionScore, avgRiskScore, delayedWorks, complaintCount };
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

/** All MPs with basic info. */
export async function fetchAllMPs() {
  if (DEMO_MODE) {
    return Promise.resolve(DEMO_MPS);
  }
  const res = await fetch(`${API_BASE_URL}/mps?page=1&limit=30`);
  if (!res.ok) throw new Error("Failed to load MPs.");
  return res.json();
}

/** MPs with composite performance/suspicion score, sorted worst-first. */
export async function fetchMPPerformance() {
  if (DEMO_MODE) {
    const scored = DEMO_MPS.map((mp) => computeMPPerformance(mp, DEMO_WORKS, DEMO_REVIEWS));
    scored.sort((a, b) => b.suspicionScore - a.suspicionScore);
    return Promise.resolve(scored);
  }
  // Expect backend to return pre-computed scores in the same shape.
  const res = await fetch(`${API_BASE_URL}/government/mp-performance`);
  if (!res.ok) throw new Error("Failed to load MP performance.");
  return res.json();
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
