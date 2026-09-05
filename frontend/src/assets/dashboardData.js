// -----------------------------------------------------------------------
// Demo data for all three role-based dashboards.
// Follows the same DEMO_MODE pattern as worksData.js —
// swap the DEMO branch in each function for real API calls.
// -----------------------------------------------------------------------

export const DEMO_MODE = true;

// ——— Shared Works Data ———

export const WORKS = [
  {
    id: "w-1042",
    title: "Community Health Sub-Centre Upgrade",
    description: "Construction of a new sub-centre building with OPD, pharmacy, and staff quarters to serve 12 villages in Sitapur block.",
    location: "Sitapur, Uttar Pradesh",
    constituency: "Sitapur",
    state: "Uttar Pradesh",
    category: "Health",
    mp: "R. Chaturvedi",
    mpId: "mp-101",
    status: "In Progress",
    riskScore: 78,
    riskBand: "high",
    fundsAllocated: "₹42.5 L",
    fundsAllocatedNum: 4250000,
    fundsSpent: "₹26.35 L",
    fundsSpentNum: 2635000,
    fundUtilisation: 62,
    contractor: "M/s Bharat Constructions",
    contractorContact: "+91 98765 43210",
    startDate: "2026-01-15",
    expectedCompletion: "2026-09-30",
    lastUpdated: "3 days ago",
    timelineSlippage: "+46 days",
    siteVisits: { completed: 2, total: 5 },
    milestones: [
      { label: "Foundation laid", date: "2026-02-10", done: true },
      { label: "Wall construction", date: "2026-04-20", done: true },
      { label: "Roofing", date: "2026-06-15", done: false },
      { label: "Interior & electrical", date: "2026-08-01", done: false },
      { label: "Handover", date: "2026-09-30", done: false },
    ],
  },
  {
    id: "w-1039",
    title: "Rural Link Road — Phase II",
    description: "12 km bituminous road connecting Devgaon to NH-163 via Warangal rural block. Phase I completed in 2025.",
    location: "Warangal, Telangana",
    constituency: "Warangal",
    state: "Telangana",
    category: "Infrastructure",
    mp: "K. Reddy",
    mpId: "mp-102",
    status: "In Progress",
    riskScore: 34,
    riskBand: "medium",
    fundsAllocated: "₹1.1 Cr",
    fundsAllocatedNum: 11000000,
    fundsSpent: "₹72 L",
    fundsSpentNum: 7200000,
    fundUtilisation: 65,
    contractor: "M/s SR Infra Pvt Ltd",
    contractorContact: "+91 87654 32109",
    startDate: "2025-11-01",
    expectedCompletion: "2026-08-15",
    lastUpdated: "1 day ago",
    timelineSlippage: "+12 days",
    siteVisits: { completed: 4, total: 6 },
    milestones: [
      { label: "Survey & land clearance", date: "2025-11-30", done: true },
      { label: "Base layer (0-6 km)", date: "2026-02-15", done: true },
      { label: "Base layer (6-12 km)", date: "2026-04-30", done: true },
      { label: "Bitumen top layer", date: "2026-06-30", done: false },
      { label: "Drainage & markings", date: "2026-08-15", done: false },
    ],
  },
  {
    id: "w-1031",
    title: "Government School Sanitation Block",
    description: "New sanitation block with 8 units (4 boys, 4 girls) and handwash stations at Govt Higher Secondary School, Kollam.",
    location: "Kollam, Kerala",
    constituency: "Kollam",
    state: "Kerala",
    category: "Sanitation",
    mp: "S. Pillai",
    mpId: "mp-103",
    status: "Completed",
    riskScore: 12,
    riskBand: "low",
    fundsAllocated: "₹18.2 L",
    fundsAllocatedNum: 1820000,
    fundsSpent: "₹17.8 L",
    fundsSpentNum: 1780000,
    fundUtilisation: 98,
    contractor: "M/s Kerala BuildTech",
    contractorContact: "+91 76543 21098",
    startDate: "2025-08-01",
    expectedCompletion: "2026-03-01",
    lastUpdated: "6 days ago",
    timelineSlippage: "On time",
    siteVisits: { completed: 5, total: 5 },
    milestones: [
      { label: "Site preparation", date: "2025-08-20", done: true },
      { label: "Plumbing", date: "2025-10-15", done: true },
      { label: "Construction", date: "2025-12-30", done: true },
      { label: "Tiling & fixtures", date: "2026-02-01", done: true },
      { label: "Handover", date: "2026-03-01", done: true },
    ],
  },
  {
    id: "w-1027",
    title: "Solar Street Lighting — Ward 14",
    description: "Installation of 120 solar-powered LED street lights across Ward 14 residential areas and market lanes.",
    location: "Nagpur, Maharashtra",
    constituency: "Nagpur",
    state: "Maharashtra",
    category: "Infrastructure",
    mp: "A. Deshmukh",
    mpId: "mp-104",
    status: "In Progress",
    riskScore: 61,
    riskBand: "medium",
    fundsAllocated: "₹27.8 L",
    fundsAllocatedNum: 2780000,
    fundsSpent: "₹14.5 L",
    fundsSpentNum: 1450000,
    fundUtilisation: 52,
    contractor: "M/s SunPower India",
    contractorContact: "+91 65432 10987",
    startDate: "2026-03-01",
    expectedCompletion: "2026-10-15",
    lastUpdated: "Today",
    timelineSlippage: "+8 days",
    siteVisits: { completed: 1, total: 4 },
    milestones: [
      { label: "Pole installation (60/120)", date: "2026-05-15", done: true },
      { label: "Panel mounting (60/120)", date: "2026-07-01", done: false },
      { label: "Wiring & battery setup", date: "2026-08-15", done: false },
      { label: "Testing & commissioning", date: "2026-10-15", done: false },
    ],
  },
  {
    id: "w-1019",
    title: "Drinking Water Pipeline Extension",
    description: "4.5 km pipeline extension from Lunkaransar reservoir to 3 underserved hamlets in Bikaner district.",
    location: "Bikaner, Rajasthan",
    constituency: "Bikaner",
    state: "Rajasthan",
    category: "Water",
    mp: "V. Singh",
    mpId: "mp-105",
    status: "Delayed",
    riskScore: 85,
    riskBand: "high",
    fundsAllocated: "₹63.4 L",
    fundsAllocatedNum: 6340000,
    fundsSpent: "₹28.2 L",
    fundsSpentNum: 2820000,
    fundUtilisation: 44,
    contractor: "M/s Rajasthan Pipelines",
    contractorContact: "+91 54321 09876",
    startDate: "2025-10-15",
    expectedCompletion: "2026-06-30",
    lastUpdated: "2 days ago",
    timelineSlippage: "+67 days",
    siteVisits: { completed: 2, total: 5 },
    milestones: [
      { label: "Trenching (0-2 km)", date: "2025-12-15", done: true },
      { label: "Trenching (2-4.5 km)", date: "2026-02-28", done: true },
      { label: "Pipe laying", date: "2026-04-30", done: false },
      { label: "Pump station", date: "2026-05-31", done: false },
      { label: "Testing & handover", date: "2026-06-30", done: false },
    ],
  },
  {
    id: "w-1004",
    title: "Public Library Renovation",
    description: "Complete renovation of the district public library including new furniture, AC, digital section with 20 computers.",
    location: "Guwahati, Assam",
    constituency: "Guwahati",
    state: "Assam",
    category: "Education",
    mp: "P. Bora",
    mpId: "mp-106",
    status: "Completed",
    riskScore: 8,
    riskBand: "low",
    fundsAllocated: "₹9.6 L",
    fundsAllocatedNum: 960000,
    fundsSpent: "₹9.2 L",
    fundsSpentNum: 920000,
    fundUtilisation: 96,
    contractor: "M/s NE Interiors",
    contractorContact: "+91 43210 98765",
    startDate: "2025-06-01",
    expectedCompletion: "2025-12-31",
    lastUpdated: "2 weeks ago",
    timelineSlippage: "On time",
    siteVisits: { completed: 4, total: 4 },
    milestones: [
      { label: "Demolition & clearing", date: "2025-06-20", done: true },
      { label: "Civil works", date: "2025-08-30", done: true },
      { label: "Electrical & networking", date: "2025-10-15", done: true },
      { label: "Furniture & IT setup", date: "2025-12-15", done: true },
      { label: "Inauguration", date: "2025-12-31", done: true },
    ],
  },
];

// ——— Citizen Feedback / Messages ———

export const CITIZEN_MESSAGES = [
  {
    id: "msg-1",
    workId: "w-1042",
    workTitle: "Community Health Sub-Centre Upgrade",
    author: "Ramesh Kumar",
    ward: "Ward 7, Sitapur",
    date: "2026-09-02",
    text: "Construction has stalled for two weeks. No workers at site. Please look into it.",
    tag: "Delay reported",
    status: "unread",
  },
  {
    id: "msg-2",
    workId: "w-1027",
    workTitle: "Solar Street Lighting — Ward 14",
    author: "Priya Deshmukh",
    ward: "Ward 14, Nagpur",
    date: "2026-09-01",
    text: "The poles installed so far look good quality. Eagerly waiting for the lights to be functional.",
    tag: "Positive",
    status: "read",
  },
  {
    id: "msg-3",
    workId: "w-1019",
    workTitle: "Drinking Water Pipeline Extension",
    author: "Fatima Begum",
    ward: "Lunkaransar, Bikaner",
    date: "2026-08-28",
    text: "Pipeline work has been delayed for months. Our village still walks 3 km for clean water. Urgent action needed.",
    tag: "Concern",
    status: "unread",
  },
  {
    id: "msg-4",
    workId: "w-1031",
    workTitle: "Government School Sanitation Block",
    author: "Anitha Nair",
    ward: "Kollam Municipal",
    date: "2026-08-20",
    text: "Sanitation block is now in use. Very clean and well-built. Thank you to the MP and construction team.",
    tag: "Positive",
    status: "read",
  },
  {
    id: "msg-5",
    workId: "w-1039",
    workTitle: "Rural Link Road — Phase II",
    author: "Suresh Reddy",
    ward: "Devgaon, Warangal",
    date: "2026-08-25",
    text: "Road base is done but drainage is missing. In monsoon, water floods the new road surface.",
    tag: "Concern",
    status: "unread",
  },
];

// ——— Announcements ———

export const ANNOUNCEMENTS = [
  {
    id: "ann-1",
    date: "2026-09-03",
    author: "MP R. Chaturvedi",
    title: "Health Sub-Centre work to resume next week",
    text: "I have spoken with the contractor. Work on the Sitapur Health Sub-Centre will resume from 8 Sep. Apologies for the delay.",
  },
  {
    id: "ann-2",
    date: "2026-09-01",
    author: "District Collector, Nagpur",
    title: "Solar street light testing in Ward 14",
    text: "The first batch of 30 solar street lights will be tested on 5 Sep. Residents are requested to report any issues to the ward office.",
  },
  {
    id: "ann-3",
    date: "2026-08-28",
    author: "MP V. Singh",
    title: "Bikaner pipeline project status update",
    text: "Pipe laying contractor has been changed due to poor performance. New contractor starts 1 Sep. Expected completion revised to Nov 2026.",
  },
];

// ——— Daily Reports (Civil Servant) ———

export const DAILY_REPORTS = [
  {
    id: "rpt-1",
    date: "2026-09-04",
    workId: "w-1042",
    workTitle: "Community Health Sub-Centre Upgrade",
    inspector: "S. Mishra, SDM",
    type: "Site Visit",
    summary: "Site visited at 10:30 AM. No workers present. Materials (cement bags, iron rods) stacked but exposed to weather. Contractor not reachable on phone. Escalated to District Collector.",
    flagged: true,
  },
  {
    id: "rpt-2",
    date: "2026-09-03",
    workId: "w-1039",
    workTitle: "Rural Link Road — Phase II",
    inspector: "K. Naidu, BDO",
    type: "Progress Update",
    summary: "Bitumen top layer work started on km 0-3 stretch. Quality of mix looks acceptable. Drainage channels yet to begin — contractor says equipment arriving next week.",
    flagged: false,
  },
  {
    id: "rpt-3",
    date: "2026-09-02",
    workId: "w-1019",
    workTitle: "Drinking Water Pipeline Extension",
    inspector: "R. Meena, SDM",
    type: "Issue Report",
    summary: "Pipeline trenching between km 2.5-3.0 has been abandoned. Trench partially refilled by local sand movement. New contractor yet to mobilise. Community frustration high.",
    flagged: true,
  },
  {
    id: "rpt-4",
    date: "2026-09-01",
    workId: "w-1027",
    workTitle: "Solar Street Lighting — Ward 14",
    inspector: "P. Jadhav, Tehsildar",
    type: "Site Visit",
    summary: "60 poles installed, panels mounted on 45. Battery boxes installed on 30. Work progressing but behind schedule by ~8 days. Contractor team of 6 present on site.",
    flagged: false,
  },
  {
    id: "rpt-5",
    date: "2026-08-30",
    workId: "w-1042",
    workTitle: "Community Health Sub-Centre Upgrade",
    inspector: "S. Mishra, SDM",
    type: "Progress Update",
    summary: "Wall construction complete. Roofing materials not yet procured. Contractor claims supply chain delay for steel trusses. Asked for procurement receipts — not provided.",
    flagged: true,
  },
];

// ——— Inspections ———

export const INSPECTIONS = [
  {
    id: "insp-1",
    workId: "w-1042",
    workTitle: "Community Health Sub-Centre Upgrade",
    location: "Sitapur, UP",
    inspector: "S. Mishra, SDM",
    date: "2026-09-10",
    priority: "High",
    status: "Scheduled",
  },
  {
    id: "insp-2",
    workId: "w-1019",
    workTitle: "Drinking Water Pipeline Extension",
    location: "Bikaner, Rajasthan",
    inspector: "R. Meena, SDM",
    date: "2026-09-12",
    priority: "High",
    status: "Scheduled",
  },
  {
    id: "insp-3",
    workId: "w-1039",
    workTitle: "Rural Link Road — Phase II",
    location: "Warangal, Telangana",
    inspector: "K. Naidu, BDO",
    date: "2026-09-08",
    priority: "Medium",
    status: "Scheduled",
  },
  {
    id: "insp-4",
    workId: "w-1027",
    workTitle: "Solar Street Lighting — Ward 14",
    location: "Nagpur, Maharashtra",
    inspector: "P. Jadhav, Tehsildar",
    date: "2026-09-15",
    priority: "Low",
    status: "Scheduled",
  },
  {
    id: "insp-5",
    workId: "w-1031",
    workTitle: "Government School Sanitation Block",
    location: "Kollam, Kerala",
    inspector: "A. Thomas, BDO",
    date: "2026-08-15",
    priority: "Low",
    status: "Completed",
  },
];

// ——— MP KPI Stats ———

export const MP_STATS = {
  totalWorks: 14,
  fundsAllocated: "₹3.8 Cr",
  worksInProgress: 6,
  worksDelayed: 2,
  worksCompleted: 6,
  completionRate: "43%",
  pendingInspections: 3,
  citizenMessages: 12,
};

// ——— Civil Servant / Government KPI Stats ———

export const GOV_STATS = {
  totalWorksNationwide: 1284,
  highRiskWorks: 89,
  pendingInspections: 37,
  totalFundsTracked: "₹412 Cr",
  reportsThisWeek: 24,
  flaggedWorks: 15,
  completedWorks: 412,
  activeConstituencies: 186,
};

// ——— Categories for new work form ———

export const WORK_CATEGORIES = [
  "Health",
  "Education",
  "Infrastructure",
  "Water",
  "Sanitation",
  "Agriculture",
  "Sports",
  "Community Hall",
  "Other",
];

// ——— States list ———

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

// ——— Fetch Helpers (swap DEMO branch for real API) ———

export async function fetchDashboardWorks(role, filters = {}) {
  if (DEMO_MODE) {
    let data = [...WORKS];
    if (filters.mpId) data = data.filter(w => w.mpId === filters.mpId);
    if (filters.state) data = data.filter(w => w.state === filters.state);
    if (filters.status) data = data.filter(w => w.status === filters.status);
    if (filters.riskBand) data = data.filter(w => w.riskBand === filters.riskBand);
    return Promise.resolve(data);
  }
  throw new Error("fetchDashboardWorks: connect to backend.");
}

export async function fetchMessages(workId) {
  if (DEMO_MODE) {
    let data = [...CITIZEN_MESSAGES];
    if (workId) data = data.filter(m => m.workId === workId);
    return Promise.resolve(data);
  }
  throw new Error("fetchMessages: connect to backend.");
}

export async function fetchReports() {
  if (DEMO_MODE) {
    return Promise.resolve([...DAILY_REPORTS]);
  }
  throw new Error("fetchReports: connect to backend.");
}

export async function fetchInspections() {
  if (DEMO_MODE) {
    return Promise.resolve([...INSPECTIONS]);
  }
  throw new Error("fetchInspections: connect to backend.");
}
