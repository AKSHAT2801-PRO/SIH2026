"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Calendar,
  Mail,
  FileText,
  Users,
  Layers,
  Settings,
  Sun,
  Moon,
  HelpCircle,
  LogOut,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/audit", label: "District Audit", icon: Calendar },
  { href: "/queue", label: "Investigation Queue", icon: FileText },
  { href: "/map", label: "GIS Radar", icon: Layers },
  { href: "/report", label: "Reports", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-6 top-6 bottom-6 w-16 flex flex-col justify-between z-30 pointer-events-auto">
      {/* Top Theme Switcher Dock */}
      <div className="bg-white rounded-full p-1.5 border border-slate-200/80 shadow-sm flex flex-col items-center gap-1">
        <button
          aria-label="Light mode"
          className="w-9 h-9 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center transition-colors"
        >
          <Sun size={16} />
        </button>
        <button
          aria-label="Dark mode"
          className="w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
        >
          <Moon size={16} />
        </button>
      </div>

      {/* Main Vertical Floating Icon Nav Dock */}
      <div className="bg-white rounded-full py-4 px-2 border border-slate-200/80 shadow-sm flex flex-col items-center gap-3">
        {/* Brand Icon */}
        <div className="w-10 h-10 bg-[#0f172a] rounded-full flex items-center justify-center text-[#a3e635] shadow-sm mb-1">
          <Shield size={18} />
        </div>

        <nav className="flex flex-col items-center gap-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  active
                    ? "bg-[#0f172a] text-[#a3e635] shadow-md"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <Icon size={18} />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Help & Logout Dock */}
      <div className="bg-white rounded-full p-1.5 border border-slate-200/80 shadow-sm flex flex-col items-center gap-1">
        <button
          title="Help & Support"
          className="w-9 h-9 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
        >
          <HelpCircle size={16} />
        </button>
        <button
          title="Logout"
          className="w-9 h-9 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
