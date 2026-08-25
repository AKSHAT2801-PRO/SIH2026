"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, LayoutDashboard, MapPin, User, BarChart, LogOut, ChevronDown, UserCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const publicNavItems = [
  { href: "/", label: "MPLADS Overview", icon: LayoutDashboard },
  { href: "/mps", label: "MP Directory", icon: User },
  { href: "/audit", label: "Audit Portal", icon: ShieldCheck },
  { href: "/map", label: "GIS Radar Map", icon: MapPin },
  { href: "/report", label: "Executive Report", icon: BarChart },
];

export default function EmpoweredHeader() {
  const pathname = usePathname();
  const { user, isLoggedIn, openLoginModal, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top Thin Eyebrow Bar */}
      <div className="bg-[#b45309] text-amber-100 px-6 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span>EMPOWERED INDIAN • CITIZEN TRANSPARENCY & GOVERNMENT DATA PLATFORM</span>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          <span>MOSPI Data Sync: FY 2025-26</span>
          <a href="https://empoweredindian.in" target="_blank" rel="noreferrer" className="underline hover:text-white">
            empoweredindian.in ↗
          </a>
        </div>
      </div>

      {/* Main Brand & Nav Row */}
      <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 text-slate-950 font-black text-xl rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
            EI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">Empowered Indian</span>
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                MPLADS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Making Indian Government Data Accessible & Actionable</p>
          </div>
        </div>

        {/* Public Navigation Links & Profile Auth Button */}
        <div className="flex items-center gap-3 overflow-x-auto">
          <nav className="flex items-center gap-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
            {publicNavItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    active
                      ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                      : "text-slate-300 hover:text-white hover:bg-slate-700/60"
                  }`}
                >
                  <Icon size={14} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Auth Profile Button */}
          {isLoggedIn && user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">
                  {user.avatarInitials}
                </div>
                <span className="hidden sm:inline">{user.name}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 text-slate-200">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-extrabold text-white">{user.name}</p>
                    <p className="text-[10px] text-slate-400">{user.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
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
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 whitespace-nowrap"
            >
              <UserCheck size={14} />
              <span>Sign In / Sign Up</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
