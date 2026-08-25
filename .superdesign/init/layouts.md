# Shared Layout Components

## Root Layout
- **File**: `frontend/app/layout.tsx`
- **Description**: Main app wrapper with Sidebar and TopBar.

```tsx
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export const metadata = {
  title: "MPLADS Risk Analytics",
  description: "AI-powered anomaly detection for government infrastructure works",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 font-sans text-slate-800 antialiased min-h-screen">
        <Sidebar />
        <TopBar />
        <main className="ml-64 pt-14 p-8 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
```

## Sidebar
- **File**: `frontend/components/layout/Sidebar.tsx`
- **Description**: Fixed left navigation panel with logo, role selector, links, and footer.

```tsx
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
} from "lucide-react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/queue", label: "Investigation Queue", icon: ClipboardList },
  { href: "/map", label: "Map View", icon: Map },
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
```

## TopBar
- **File**: `frontend/components/layout/TopBar.tsx`
- **Description**: Top header with global search input and Generate Report action.

```tsx
"use client";

import { Search, FileText } from "lucide-react";

export default function TopBar() {
  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-white border-b border-slate-200 z-10 flex items-center px-6 gap-4 shadow-sm">
      <div className="relative flex-1 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search works, agencies…"
          className="w-full pl-8 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 focus:bg-white transition-colors"
        />
      </div>

      <div className="flex-1" />

      <div className="relative group">
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-400 text-sm font-medium rounded-lg border border-slate-200 cursor-not-allowed"
          aria-label="Generate Report — coming soon"
        >
          <FileText size={14} />
          Generate Report
        </button>
        <div className="absolute right-0 top-full mt-2 bg-slate-800 text-white text-xs rounded-md px-3 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Coming soon
        </div>
      </div>
    </header>
  );
}
```
