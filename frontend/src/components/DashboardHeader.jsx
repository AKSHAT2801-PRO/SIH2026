import React from "react";
import { Bell, Search, Home, ArrowLeftRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SECTION_TITLES = {
  overview: "Overview",
  works: "Works",
  "new-work": "Recommend New Work",
  funds: "Fund Utilisation",
  feedback: "Citizen Feedback",
  inspections: "Inspections",
  contractors: "Contractors",
  messages: "My Feedback",
  announcements: "Announcements",
  "daily-report": "Daily Reports",
  risk: "Risk Dashboard",
  "fund-audit": "Fund Audit",
  archive: "Reports Archive",
};

export default function DashboardHeader({
  section = "overview",
  role = "citizen",
  unreadCount = 0,
  userName = "",
}) {
  const navigate = useNavigate();
  const title = SECTION_TITLES[section] || "Dashboard";

  const roleLabels = {
    citizen: "Citizen Dashboard",
    mp: "MP / MLA Dashboard",
    government: "Government Dashboard",
  };
  const avatarName = userName || (role === "citizen" ? "Citizen" : role === "mp" ? "MP" : "Government");
  const avatarInitials = avatarName
    .replace(/\([^)]*\)/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const avatarHue = [...avatarName].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const avatarImage = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="hsl(${avatarHue} 28% 28%)"/><circle cx="48" cy="34" r="17" fill="hsl(${avatarHue} 42% 72%)"/><path d="M18 88c3-21 15-31 30-31s27 10 30 31" fill="hsl(${avatarHue} 42% 72%)"/><text x="48" y="91" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="white">${avatarInitials}</text></svg>`
  )}`;

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur border-b border-[#D8D3C7]">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-[12px] text-[#5A6478] hover:text-[#1C2B4A] transition-colors border-r border-[#D8D3C7] pr-3"
            title="Return to Landing Page"
          >
            <Home size={14} />
            <span className="hidden sm:inline">Home</span>
          </button>
          <div>
            <h1
              className="text-[#1C2B4A] text-[17px] leading-tight"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              {title}
            </h1>
            <p className="text-[11px] text-[#8993A8] -mt-0.5">
              {roleLabels[role] || "Dashboard"}
            </p>
          </div>
        </div>

        {/* Portal Quick Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-[#EFECE3] p-1 text-[11.5px] border border-[#D8D3C7]">
          <span className="px-2 text-[#8993A8] flex items-center gap-1">
            <ArrowLeftRight size={11} /> Switch:
          </span>
          <button
            onClick={() => navigate("/citizen")}
            className={`px-2.5 py-1 transition-colors ${
              role === "citizen"
                ? "bg-white text-[#1C2B4A] font-medium shadow-xs"
                : "text-[#5A6478] hover:text-[#1C2B4A]"
            }`}
          >
            Citizen
          </button>
          <button
            onClick={() => navigate("/mp")}
            className={`px-2.5 py-1 transition-colors ${
              role === "mp"
                ? "bg-white text-[#1C2B4A] font-medium shadow-xs"
                : "text-[#5A6478] hover:text-[#1C2B4A]"
            }`}
          >
            MP / MLA
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className={`px-2.5 py-1 transition-colors ${
              role === "government"
                ? "bg-white text-[#1C2B4A] font-medium shadow-xs"
                : "text-[#5A6478] hover:text-[#1C2B4A]"
            }`}
          >
            Government
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 border border-[#D8D3C7] bg-white text-[#8993A8] text-[12px]">
            <Search size={13} />
            <span>Search works…</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-[#5A6478] hover:text-[#1C2B4A] transition-colors">
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center bg-[#B3453B] text-white text-[9px] rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <img
            src={avatarImage}
            alt={`${avatarName} profile avatar`}
            title={avatarName}
            className="w-8 h-8 object-cover shrink-0 border border-[#D8D3C7]"
          />
        </div>
      </div>
    </header>
  );
}
