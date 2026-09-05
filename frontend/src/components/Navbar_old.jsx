import React, { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { key: "home", label: "Home" },
  { key: "how-it-works", label: "How it Works" },
  { key: "public-works", label: "Public Works" },
  { key: "feedback-board", label: "Feedback Board" },
  { key: "about", label: "About" },
];

export default function Navbar({
  activeTab = "home",
  onNavigate,
  onLogin,
  onRegister,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (key) => {
    setMobileOpen(false);
    if (onNavigate) onNavigate(key);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 backdrop-blur border-b border-[#D8D3C7]">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => handleNav("home")}
          className="flex items-center gap-2.5 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C2B4A]"
        >
          <div className="w-8 h-8 border border-[#B8863F] flex items-center justify-center">
            <span
              className="text-[#B8863F] text-sm"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              M
            </span>
          </div>
          <span className="text-[#1C2B4A] text-[15px] tracking-wide hidden sm:inline">
            MPLAD Works Tracker
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = activeTab === link.key;
            return (
              <button
                key={link.key}
                onClick={() => handleNav(link.key)}
                aria-current={isActive ? "page" : undefined}
                className={`px-3.5 py-2 text-[13.5px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1C2B4A] ${
                  isActive
                    ? "text-[#1C2B4A] border-b-2 border-[#B8863F]"
                    : "text-[#5A6478] hover:text-[#1C2B4A] border-b-2 border-transparent"
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Desktop auth buttons */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          <button
            onClick={onLogin}
            className="px-4 py-2 text-[13.5px] text-[#1C2B4A] hover:text-[#B8863F] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C2B4A]"
          >
            Sign in
          </button>
          <button
            onClick={onRegister}
            className="px-4 py-2 text-[13.5px] bg-[#1C2B4A] text-[#FAF9F6] hover:bg-[#233658] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C2B4A]"
          >
            Register
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 text-[#1C2B4A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C2B4A]"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#D8D3C7] bg-[#FAF9F6] px-6 py-4">
          <nav className="flex flex-col gap-1 mb-4">
            {NAV_LINKS.map((link) => {
              const isActive = activeTab === link.key;
              return (
                <button
                  key={link.key}
                  onClick={() => handleNav(link.key)}
                  className={`text-left px-2 py-2.5 text-[14px] border-l-2 transition-colors ${
                    isActive
                      ? "text-[#1C2B4A] border-[#B8863F] bg-[#F3F1EB]"
                      : "text-[#5A6478] border-transparent"
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
          <div className="flex flex-col gap-2 pt-3 border-t border-[#D8D3C7]">
            <button
              onClick={() => {
                setMobileOpen(false);
                onLogin && onLogin();
              }}
              className="w-full px-4 py-2.5 text-[13.5px] text-[#1C2B4A] border border-[#D8D3C7]"
            >
              Sign in
            </button>
            <button
              onClick={() => {
                setMobileOpen(false);
                onRegister && onRegister();
              }}
              className="w-full px-4 py-2.5 text-[13.5px] bg-[#1C2B4A] text-[#FAF9F6]"
            >
              Register
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
