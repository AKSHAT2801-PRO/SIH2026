"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Info, ChevronDown, Shield, LogOut, UserCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/", label: "Overview" },
  { href: "/audit", label: "District Audit" },
  { href: "/queue", label: "Queue" },
  { href: "/map", label: "GIS Radar" },
  { href: "/report", label: "Reports" },
];

export default function TopBar() {
  const pathname = usePathname();
  const { user, isLoggedIn, openLoginModal, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="fixed top-6 left-28 right-8 h-14 z-30 flex items-center justify-between pointer-events-auto">
      {/* Top Left Brand Logo Container */}
      <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200/80 shadow-sm">
        <div className="w-7 h-7 bg-[#15803d] rounded-lg flex items-center justify-center text-[#a3e635] font-black text-xs shadow-sm">
          <Shield size={14} />
        </div>
        <span className="text-sm font-extrabold text-slate-900 tracking-tight">MPLADS Risk</span>
      </div>

      {/* Center Floating Navigation Pill Container */}
      <nav className="bg-white rounded-full p-1.5 border border-slate-200/80 shadow-sm flex items-center gap-1">
        {navLinks.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                active
                  ? "bg-[#0f172a] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Top Right Action Buttons & Profile Avatar */}
      <div className="flex items-center gap-2 relative">
        <button
          aria-label="Search"
          className="w-9 h-9 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 flex items-center justify-center shadow-sm transition-colors"
        >
          <Search size={15} />
        </button>

        <button
          aria-label="Notifications"
          className="w-9 h-9 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 flex items-center justify-center shadow-sm transition-colors relative"
        >
          <Bell size={15} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500"></span>
        </button>

        <button
          aria-label="Info"
          className="w-9 h-9 rounded-full bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50 flex items-center justify-center shadow-sm transition-colors"
        >
          <Info size={15} />
        </button>

        {/* User Profile Pill or Sign Up / Sign In Button */}
        {isLoggedIn && user ? (
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="bg-white border border-slate-200/80 rounded-full pl-1.5 pr-3 py-1 flex items-center gap-2.5 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#15803d] text-white flex items-center justify-center text-xs font-bold">
                {user.avatarInitials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                <p className="text-[10px] text-slate-400 leading-tight">{user.email}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-40 space-y-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-extrabold text-slate-900">{user.name}</p>
                  <p className="text-[10px] text-slate-500">{user.role}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={openLoginModal}
            className="bg-[#a3e635] hover:bg-[#84cc16] text-slate-950 font-black text-xs px-5 py-2 rounded-full shadow-md transition-all flex items-center gap-1.5"
          >
            <UserCheck size={14} />
            <span>Sign In / Sign Up</span>
          </button>
        )}
      </div>
    </header>
  );
}
