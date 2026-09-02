// -----------------------------------------------------------------------
// Data source for landing page work listings & stats.
//
// HOW TO CONNECT YOUR BACKEND:
// 1. Set DEMO_MODE to false below.
// 2. Implement the fetch call inside fetchWorks() and fetchStats() —
//    both already return the exact shape the landing page expects,
//    so no other file needs to change.
// -----------------------------------------------------------------------

export const DEMO_MODE = true;

const DEMO_STATS = {
  totalWorks: 1284,
  totalFundsTracked: "₹412 Cr",
  activeInspections: 37,
  citizenReports: 962,
};

const DEMO_WORKS = [
  {
    id: "w-1042",
    title: "Community Health Sub-Centre Upgrade",
    location: "Sitapur, Uttar Pradesh",
    mp: "R. Chaturvedi",
    status: "In Progress",
    riskScore: 78,
    riskBand: "high",
    fundsAllocated: "₹42.5 L",
    lastUpdated: "3 days ago",
  },
  {
    id: "w-1039",
    title: "Rural Link Road — Phase II",
    location: "Warangal, Telangana",
    mp: "K. Reddy",
    status: "In Progress",
    riskScore: 34,
    riskBand: "medium",
    fundsAllocated: "₹1.1 Cr",
    lastUpdated: "1 day ago",
  },
  {
    id: "w-1031",
    title: "Government School Sanitation Block",
    location: "Kollam, Kerala",
    mp: "S. Pillai",
    status: "Completed",
    riskScore: 12,
    riskBand: "low",
    fundsAllocated: "₹18.2 L",
    lastUpdated: "6 days ago",
  },
  {
    id: "w-1027",
    title: "Solar Street Lighting — Ward 14",
    location: "Nagpur, Maharashtra",
    mp: "A. Deshmukh",
    status: "In Progress",
    riskScore: 61,
    riskBand: "medium",
    fundsAllocated: "₹27.8 L",
    lastUpdated: "Today",
  },
  {
    id: "w-1019",
    title: "Drinking Water Pipeline Extension",
    location: "Bikaner, Rajasthan",
    mp: "V. Singh",
    status: "Delayed",
    riskScore: 85,
    riskBand: "high",
    fundsAllocated: "₹63.4 L",
    lastUpdated: "2 days ago",
  },
  {
    id: "w-1004",
    title: "Public Library Renovation",
    location: "Guwahati, Assam",
    mp: "P. Bora",
    status: "Completed",
    riskScore: 8,
    riskBand: "low",
    fundsAllocated: "₹9.6 L",
    lastUpdated: "2 weeks ago",
  },
];

/**
 * Returns summary stats shown on the landing page hero/strip.
 * Swap the DEMO branch for a real fetch, e.g.:
 *   const res = await fetch(`${API_BASE_URL}/public/stats`);
 *   return res.json();
 */
export async function fetchStats() {
  if (DEMO_MODE) {
    return Promise.resolve(DEMO_STATS);
  }
  throw new Error("fetchStats: connect this to your backend endpoint.");
}

/**
 * Returns a list of public works for the "Public Works" preview section.
 * Swap the DEMO branch for a real fetch, e.g.:
 *   const res = await fetch(`${API_BASE_URL}/public/works?limit=${limit}`);
 *   return res.json();
 */
export async function fetchWorks(limit = 6) {
  if (DEMO_MODE) {
    return Promise.resolve(DEMO_WORKS.slice(0, limit));
  }
  throw new Error("fetchWorks: connect this to your backend endpoint.");
}
