import React, { useEffect, useState } from "react";
import { Landmark, Users, Eye, ChevronRight, Loader2 } from "lucide-react";
import { fetchModelMPs } from "../dataService";
import AppLogo from "../components/AppLogo";

const ROLES = [
  {
    key: "government",
    label: "Government",
    icon: Landmark,
    description: "Oversight & inspection access",
  },
  {
    key: "mp",
    label: "MP",
    icon: Users,
    description: "Manage approved works",
  },
  {
    key: "citizen",
    label: "Citizen",
    icon: Eye,
    description: "Track local development",
  },
];

function mpEmail(mpName) {
  const slug = mpName
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `${slug}@mplad.ac.in`;
}

export default function Login({ onSubmit, onNavigateRegister }) {
  const [role, setRole] = useState("government");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [mpOptions, setMpOptions] = useState([]);
  const [mpSearch, setMpSearch] = useState("");
  const [selectedMP, setSelectedMP] = useState("");

  useEffect(() => {
    if (role !== "mp") return;
    fetchModelMPs(mpSearch)
      .then(setMpOptions)
      .catch((error) => setFormError(error.message));
  }, [role, mpSearch]);

  const activeRole = ROLES.find((r) => r.key === role);

  const validate = () => {
    const next = {};
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address.";
    else if (role === "mp" && !/^[^\s@]+@(?:[^\s@.]+\.)?mplad\.ac\.in$/i.test(email))
      next.email = "MP email must use the mplad.ac.in domain.";
    if (role === "mp" && !selectedMP) next.mpName = "Select your official MP name.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit({ role, email, password, mpName: selectedMP, name: selectedMP });
      }
    } catch (err) {
      console.log("HANDLE SUBMIT CATCH:", err);
      setFormError(
        err?.message || "Could not sign in. Check your details and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF9F6] flex">
      {/* Left context panel */}
      <div className="hidden lg:flex lg:w-[42%] bg-[#1C2B4A] relative flex-col justify-between p-12 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #FAF9F6 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <AppLogo size="lg" dark />
            <span className="text-[#DCE1EC] text-sm tracking-wide">
              MPLAD Works Tracker
            </span>
          </div>
        </div>

        <div className="relative">
          <h1
            className="text-[#FAF9F6] text-[2.6rem] leading-[1.15] mb-6"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            Every rupee spent
            <br />
            should be easy to trace.
          </h1>
          <p className="text-[#AEB8CC] text-[15px] leading-relaxed max-w-sm">
            A shared record of works funded under the MPLAD scheme —
            risk-scored, inspected, and open to the people they're built for.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6 max-w-sm border-t border-[#31456B] pt-6">
            <div>
              <div
                className="text-[#B8863F] text-xl"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
              >
                3
              </div>
              <div className="text-[#8993A8] text-xs mt-1 leading-snug">
                access roles
              </div>
            </div>
            <div>
              <div
                className="text-[#B8863F] text-xl"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
              >
                1
              </div>
              <div className="text-[#8993A8] text-xs mt-1 leading-snug">
                risk score per work
              </div>
            </div>
            <div>
              <div
                className="text-[#B8863F] text-xl"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
              >
                24/7
              </div>
              <div className="text-[#8993A8] text-xs mt-1 leading-snug">
                public feedback board
              </div>
            </div>
          </div>
        </div>

        <div className="relative text-[#66708A] text-xs">
          Ministry-aligned reporting · Read-only public views
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <AppLogo dark />
            <span className="text-[#1C2B4A] text-sm tracking-wide">
              MPLAD Works Tracker
            </span>
          </div>

          <h2
            className="text-[#1C2B4A] text-[1.75rem] mb-1"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            Sign in
          </h2>
          <p className="text-[#5A6478] text-sm mb-8">
            Access your dashboard for tracking MPLAD works.
          </p>

          {/* Role tabs */}
          <div className="mb-8">
            <div className="text-[11px] text-[#5A6478] mb-2.5">
              Signing in as
            </div>
            <div className="grid grid-cols-3 border border-[#D8D3C7]">
              {ROLES.map((r, i) => {
                const Icon = r.icon;
                const isActive = role === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setRole(r.key)}
                    aria-pressed={isActive}
                    className={`relative flex flex-col items-center gap-1.5 py-3 px-2 text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#1C2B4A] ${
                      i !== 0 ? "border-l border-[#D8D3C7]" : ""
                    } ${
                      isActive
                        ? "bg-[#1C2B4A] text-[#FAF9F6]"
                        : "bg-white text-[#5A6478] hover:bg-[#F3F1EB]"
                    }`}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.75}
                      className={isActive ? "text-[#B8863F]" : "text-[#8993A8]"}
                    />
                    {r.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[#8993A8] text-xs mt-2">
              {activeRole.description}
            </p>
          </div>

          {role === "mp" && (
            <div className="mb-6 border border-[#D8D3C7] bg-white p-4">
              <label htmlFor="login-mp-search" className="block text-[13px] text-[#1C2B4A] mb-1.5">
                Search official MP name
              </label>
              <input
                id="login-mp-search"
                list="login-mp-options"
                value={mpSearch}
                onChange={(event) => {
                  const value = event.target.value;
                  setMpSearch(value);
                  const match = mpOptions.find((mp) => mp.mp_name === value);
                  if (match) {
                    setSelectedMP(match.mp_name);
                    setEmail(mpEmail(match.mp_name));
                  }
                }}
                placeholder="Type an MP name"
                className="w-full px-3.5 py-2.5 text-sm border border-[#D8D3C7] text-[#1C2B4A] focus:outline-none focus:border-[#1C2B4A]"
              />
              <datalist id="login-mp-options">
                {mpOptions.map((mp) => <option key={mp.mp_key} value={mp.mp_name} />)}
              </datalist>
              <select
                value={selectedMP}
                onChange={(event) => setSelectedMP(event.target.value)}
                className="w-full mt-2 px-3.5 py-2.5 text-sm border border-[#D8D3C7] text-[#1C2B4A] focus:outline-none focus:border-[#1C2B4A]"
                aria-invalid={!!errors.mpName}
              >
                <option value="">Select your official MP name</option>
                {mpOptions.map((mp) => (
                  <option key={mp.mp_key} value={mp.mp_name}>{mp.mp_name} · {mp.state}</option>
                ))}
              </select>
              {errors.mpName && <p className="text-[#B3453B] text-xs mt-1.5">{errors.mpName}</p>}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5">
              <label
                htmlFor="email"
                className="block text-[13px] text-[#1C2B4A] mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={role === "mp"}
                placeholder={role === "mp" ? "Select an MP name first" : "you@example.gov.in"}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                  errors.email
                    ? "border-[#B3453B] focus:ring-[#B3453B]/30"
                    : "border-[#D8D3C7] focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
                }`}
              />
              {errors.email && (
                <p id="email-error" className="text-[#B3453B] text-xs mt-1.5">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-[13px] text-[#1C2B4A]">
                  Password
                </label>
                <button
                  type="button"
                  className="text-[12px] text-[#5A6478] hover:text-[#1C2B4A] underline underline-offset-2"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                  errors.password
                    ? "border-[#B3453B] focus:ring-[#B3453B]/30"
                    : "border-[#D8D3C7] focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
                }`}
              />
              {errors.password && (
                <p id="password-error" className="text-[#B3453B] text-xs mt-1.5">
                  {errors.password}
                </p>
              )}
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-4 border border-[#B3453B]/30 bg-[#B3453B]/5 px-3.5 py-2.5 text-[#B3453B] text-xs"
              >
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-[#1C2B4A] text-[#FAF9F6] text-sm py-3 flex items-center justify-center gap-2 hover:bg-[#233658] disabled:opacity-70 disabled:cursor-not-allowed transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C2B4A]"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in
                </>
              ) : (
                <>
                  Sign in as {activeRole.label}
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[#5A6478] text-sm mt-8">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onNavigateRegister}
              className="text-[#1C2B4A] hover:text-[#B8863F] underline underline-offset-2"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
