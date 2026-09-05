import React, { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  Bell,
  FileText,
  Search,
  Calendar,
  AlertTriangle,
  IndianRupee,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  PlusCircle,
  Eye,
  Landmark,
  Briefcase,
} from "lucide-react";

const ROLE_CONFIG = {
  citizen: {
    label: "Citizen",
    icon: Eye,
    color: "text-[#4A7C59]",
    bg: "bg-[#4A7C59]/10",
    sections: [
      { key: "overview", label: "My Area Works", icon: LayoutDashboard },
      { key: "messages", label: "My Feedback", icon: MessageSquare },
      { key: "announcements", label: "Announcements", icon: Bell },
    ],
  },
  mp: {
    label: "MP / MLA",
    icon: Users,
    color: "text-[#B8863F]",
    bg: "bg-[#B8863F]/10",
    sections: [
      { key: "overview", label: "Overview", icon: LayoutDashboard },
      { key: "works", label: "My Works", icon: ClipboardList },
      { key: "new-work", label: "Recommend Work", icon: PlusCircle },
      { key: "funds", label: "Fund Utilisation", icon: IndianRupee },
      { key: "feedback", label: "Citizen Feedback", icon: MessageSquare },
      { key: "inspections", label: "Inspections", icon: Search },
      { key: "contractors", label: "Contractors", icon: Briefcase },
    ],
  },
};

export default function DashboardSidebar({
  role = "citizen",
  activeSection = "overview",
  onSectionChange,
  onLogout,
  userName = "User",
}) {
  const [collapsed, setCollapsed] = useState(false);
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.citizen;
  const RoleIcon = config.icon;

  return (
    <aside
      className={`h-screen sticky top-0 bg-[#1C2B4A] text-[#DCE1EC] flex flex-col transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[250px]"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-[#31456B] shrink-0">
        <div className="w-8 h-8 border border-[#B8863F] flex items-center justify-center shrink-0">
          <span
            className="text-[#B8863F] text-sm"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            M
          </span>
        </div>
        {!collapsed && (
          <span className="text-[14px] tracking-wide text-[#DCE1EC] whitespace-nowrap">
            MPLAD Tracker
          </span>
        )}
      </div>

      {/* Role badge */}
      <div className={`px-4 py-3 border-b border-[#31456B] ${collapsed ? "text-center" : ""}`}>
        {collapsed ? (
          <RoleIcon size={16} className="text-[#B8863F] mx-auto" />
        ) : (
          <div className="flex items-center gap-2">
            <RoleIcon size={14} className="text-[#B8863F] shrink-0" />
            <div>
              <div className="text-[12px] text-[#8993A8]">{config.label}</div>
              <div className="text-[13px] text-[#DCE1EC] truncate">{userName}</div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {config.sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.key;
          return (
            <button
              key={section.key}
              onClick={() => onSectionChange && onSectionChange(section.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-colors ${
                collapsed ? "justify-center" : ""
              } ${
                isActive
                  ? "bg-[#B8863F]/15 text-[#FAF9F6] border-l-2 border-[#B8863F]"
                  : "text-[#8993A8] hover:text-[#DCE1EC] hover:bg-[#233658] border-l-2 border-transparent"
              }`}
              title={collapsed ? section.label : ""}
            >
              <Icon size={16} strokeWidth={1.75} className="shrink-0" />
              {!collapsed && <span>{section.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="border-t border-[#31456B] shrink-0">
        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 text-[12px] text-[#8993A8] hover:text-[#FAF9F6] hover:bg-[#233658] transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
          title="Sign out"
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-[12px] text-[#66708A] hover:text-[#DCE1EC] transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
