export interface MPProfile {
  id: string;
  name: string;
  photoUrl?: string;
  party: string;
  partyColor: string;
  house: "Lok Sabha" | "Rajya Sabha";
  state: string;
  constituency: string;
  entitlementCr: number;
  recommendedCr: number;
  sanctionedCr: number;
  releasedCr: number;
  expenditureCr: number;
  utilizationRate: number;
  worksCount: {
    recommended: number;
    sanctioned: number;
    completed: number;
    inProgress: number;
    flagged: number;
  };
  sectorBreakdown: {
    sector: string;
    amountCr: number;
    percentage: number;
  }[];
  recentWorks: {
    title: string;
    sanctionedLakhs: number;
    sector: string;
    status: string;
    district: string;
  }[];
}

export const mpProfilesData: MPProfile[] = [
  {
    id: "mp-001",
    name: "Shri Supriya Sule",
    party: "NCP",
    partyColor: "#0284c7",
    house: "Lok Sabha",
    state: "Maharashtra",
    constituency: "Baramati",
    entitlementCr: 25.0,
    recommendedCr: 24.8,
    sanctionedCr: 23.5,
    releasedCr: 22.0,
    expenditureCr: 21.2,
    utilizationRate: 90.2,
    worksCount: {
      recommended: 142,
      sanctioned: 130,
      completed: 104,
      inProgress: 24,
      flagged: 2,
    },
    sectorBreakdown: [
      { sector: "Drinking Water & Sanitation", amountCr: 8.4, percentage: 39.6 },
      { sector: "Roads & Bridges", amountCr: 6.2, percentage: 29.2 },
      { sector: "Education & Schools", amountCr: 4.1, percentage: 19.3 },
      { sector: "Health & Medical", amountCr: 2.5, percentage: 11.9 },
    ],
    recentWorks: [
      {
        title: "Construction of Community Hall & Skill Center, Haveli",
        sanctionedLakhs: 45.0,
        sector: "Community Infrastructure",
        status: "In Progress",
        district: "Pune",
      },
      {
        title: "Solar Water Pumping Station, Daund Panchayat",
        sanctionedLakhs: 18.5,
        sector: "Drinking Water",
        status: "Completed",
        district: "Pune",
      },
      {
        title: "Asphalt Road Widening, Indapur Stretch",
        sanctionedLakhs: 32.0,
        sector: "Roads & Bridges",
        status: "Completed",
        district: "Pune",
      },
    ],
  },
  {
    id: "mp-002",
    name: "Shri Nitin Gadkari",
    party: "BJP",
    partyColor: "#f97316",
    house: "Lok Sabha",
    state: "Maharashtra",
    constituency: "Nagpur",
    entitlementCr: 25.0,
    recommendedCr: 25.0,
    sanctionedCr: 24.9,
    releasedCr: 24.5,
    expenditureCr: 24.1,
    utilizationRate: 98.4,
    worksCount: {
      recommended: 188,
      sanctioned: 185,
      completed: 172,
      inProgress: 13,
      flagged: 0,
    },
    sectorBreakdown: [
      { sector: "Roads & Urban Transport", amountCr: 12.5, percentage: 51.8 },
      { sector: "Public Health Infrastructure", amountCr: 6.0, percentage: 24.9 },
      { sector: "Community Welfare", amountCr: 5.6, percentage: 23.3 },
    ],
    recentWorks: [
      {
        title: "Nagpur Ring Road Bus Shelter Installation",
        sanctionedLakhs: 28.0,
        sector: "Roads & Urban Transport",
        status: "Completed",
        district: "Nagpur",
      },
      {
        title: "Primary Health Center Oxygen Generator Plant",
        sanctionedLakhs: 40.0,
        sector: "Public Health",
        status: "Completed",
        district: "Nagpur",
      },
    ],
  },
  {
    id: "mp-003",
    name: "Shri Rahul Gandhi",
    party: "INC",
    partyColor: "#16a34a",
    house: "Lok Sabha",
    state: "Kerala",
    constituency: "Wayanad",
    entitlementCr: 25.0,
    recommendedCr: 23.2,
    sanctionedCr: 21.8,
    releasedCr: 20.0,
    expenditureCr: 18.9,
    utilizationRate: 86.7,
    worksCount: {
      recommended: 115,
      sanctioned: 102,
      completed: 82,
      inProgress: 20,
      flagged: 1,
    },
    sectorBreakdown: [
      { sector: "Tribal Education & Hostels", amountCr: 9.2, percentage: 48.7 },
      { sector: "Rural Drinking Water", amountCr: 5.8, percentage: 30.7 },
      { sector: "Disaster Resilient Shelters", amountCr: 3.9, percentage: 20.6 },
    ],
    recentWorks: [
      {
        title: "Tribal School Smart Classroom Upgrade, Kalpetta",
        sanctionedLakhs: 22.0,
        sector: "Education",
        status: "Completed",
        district: "Wayanad",
      },
      {
        title: "Flood Warning Telemetry & Emergency Relief Depot",
        sanctionedLakhs: 35.0,
        sector: "Disaster Preparedness",
        status: "In Progress",
        district: "Wayanad",
      },
    ],
  },
  {
    id: "mp-004",
    name: "Smt. Nirmala Sitharaman",
    party: "BJP",
    partyColor: "#f97316",
    house: "Rajya Sabha",
    state: "Karnataka",
    constituency: "State Representative",
    entitlementCr: 25.0,
    recommendedCr: 24.9,
    sanctionedCr: 24.5,
    releasedCr: 23.8,
    expenditureCr: 23.1,
    utilizationRate: 97.1,
    worksCount: {
      recommended: 164,
      sanctioned: 158,
      completed: 146,
      inProgress: 12,
      flagged: 0,
    },
    sectorBreakdown: [
      { sector: "Digital Education & STEM Labs", amountCr: 10.5, percentage: 45.5 },
      { sector: "Women Entrepreneurship Hubs", amountCr: 7.2, percentage: 31.2 },
      { sector: "Water Conservation Reservoirs", amountCr: 5.4, percentage: 23.3 },
    ],
    recentWorks: [
      {
        title: "Atal Innovation Robotics Lab in Govt PU College",
        sanctionedLakhs: 30.0,
        sector: "Education",
        status: "Completed",
        district: "Bengaluru Urban",
      },
    ],
  },
  {
    id: "mp-005",
    name: "Shri Derek O'Brien",
    party: "AITC",
    partyColor: "#0d9488",
    house: "Rajya Sabha",
    state: "West Bengal",
    constituency: "State Representative",
    entitlementCr: 25.0,
    recommendedCr: 22.1,
    sanctionedCr: 20.4,
    releasedCr: 19.5,
    expenditureCr: 17.8,
    utilizationRate: 87.3,
    worksCount: {
      recommended: 98,
      sanctioned: 89,
      completed: 71,
      inProgress: 18,
      flagged: 1,
    },
    sectorBreakdown: [
      { sector: "Fisheries & Coastal Infrastructure", amountCr: 8.1, percentage: 45.5 },
      { sector: "Urban Library & Reading Rooms", amountCr: 5.5, percentage: 30.9 },
      { sector: "Health Clinics", amountCr: 4.2, percentage: 23.6 },
    ],
    recentWorks: [
      {
        title: "Namkhana Jetty Cold Storage Unit",
        sanctionedLakhs: 18.0,
        sector: "Fisheries",
        status: "In Progress",
        district: "South 24 Parganas",
      },
    ],
  },
];
