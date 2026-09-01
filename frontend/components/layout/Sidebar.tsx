"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Map,
  ChevronDown,
  Shield,
  Contact,
} from "lucide-react";
import { icon } from "leaflet";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/queue", label: "Investigation Queue", icon: ClipboardList },
  { href: "/map", label: "Map View", icon: Map },
  {href: "/mps",label: "MPs",icon: Contact }
];

const roles = [
  "Central Authority",
  "State Authority",
  "District Authority",
  "Auditor",
  "Viewer",
];

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState("Central Authority");

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-800 text-white flex flex-col z-20 shadow-lg">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center shrink-0">
            <Shield size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-sky-400 uppercase tracking-widest leading-tight">MPLADS</p>
            <p className="text-[11px] text-slate-400 leading-tight">Risk Analytics</p>
          </div>
        </div>
      </div>

      {/* Role selector */}
      <div className="px-4 py-3 border-b border-slate-700">
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold block mb-1">
          Viewing as
        </label>
        <div className="relative">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-slate-700 text-slate-200 text-xs rounded-md px-3 py-2 pr-8 appearance-none border border-slate-600 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            {roles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-2.5 top-2.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-2 mb-2">
          Navigation
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-sky-600 text-white"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          MPLADS Intelligence System v1.0
          <br />
          <span className="text-slate-600">For authorized review only</span>
        </p>
      </div>
    </aside>
  );
}
