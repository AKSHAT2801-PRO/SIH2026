import React, { useState } from "react";
import { Landmark, Users, Eye, ChevronRight, Loader2, Check } from "lucide-react";

const ROLES = [
  {
    key: "government",
    label: "Government",
    icon: Landmark,
    description: "View risk scores across all MPs and schedule inspections.",
  },
  {
    key: "mp",
    label: "MP",
    icon: Users,
    description: "Track works you've approved, their risk scores, and contractors.",
  },
  {
    key: "citizen",
    label: "Citizen",
    icon: Eye,
    description: "Follow local works and leave feedback for your MP.",
  },
];

const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { key: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { key: "number", label: "One number", test: (v) => /\d/.test(v) },
];

export default function Register({ onSubmit, onNavigateLogin }) {
  const [role, setRole] = useState("citizen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const activeRole = ROLES.find((r) => r.key === role);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Enter your full name.";
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      next.email = "Enter a valid email address.";
    if (!password) next.password = "Create a password.";
    else if (!PASSWORD_RULES.every((r) => r.test(password)))
      next.password = "Password doesn't meet the requirements below.";
    if (confirmPassword !== password)
      next.confirmPassword = "Passwords don't match.";
    if (!agreed) next.agreed = "You must accept the terms to continue.";
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
        await onSubmit({ role, name, email, password });
      }
    } catch (err) {
      setFormError(
        err?.message || "Could not create your account. Please try again."
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
            <div className="w-9 h-9 border border-[#B8863F] flex items-center justify-center shrink-0">
              <span
                className="text-[#B8863F] text-sm"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
              >
                M
              </span>
            </div>
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
            One account.
            <br />
            One view suited to your role.
          </h1>
          <p className="text-[#AEB8CC] text-[15px] leading-relaxed max-w-sm mb-8">
            What you can see and do depends on your role — chosen when you
            register and verified before your account is activated.
          </p>

          <div className="space-y-4 max-w-sm">
            {ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.key} className="flex gap-3 border-t border-[#31456B] pt-4">
                  <Icon size={16} strokeWidth={1.75} className="text-[#B8863F] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[#DCE1EC] text-[13px] mb-0.5">{r.label}</div>
                    <div className="text-[#8993A8] text-xs leading-relaxed">
                      {r.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative text-[#66708A] text-xs">
          Ministry-aligned reporting · Read-only public views
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-8 h-8 border border-[#B8863F] flex items-center justify-center shrink-0">
              <span
                className="text-[#B8863F] text-sm"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
              >
                M
              </span>
            </div>
            <span className="text-[#1C2B4A] text-sm tracking-wide">
              MPLAD Works Tracker
            </span>
          </div>

          <h2
            className="text-[#1C2B4A] text-[1.75rem] mb-1"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            Create an account
          </h2>
          <p className="text-[#5A6478] text-sm mb-8">
            Choose the role that matches how you'll use the platform.
          </p>

          {/* Role tabs */}
          <div className="mb-7">
            <div className="text-[11px] text-[#5A6478] mb-2.5">
              I am registering as
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
            {(role === "government" || role === "mp") && (
              <p className="text-[#B8863F] text-xs mt-1.5 border-l-2 border-[#B8863F]/40 pl-2">
                This role requires verification. You'll get access once your
                credentials are confirmed by an administrator.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5">
              <label htmlFor="name" className="block text-[13px] text-[#1C2B4A] mb-1.5">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="As per official ID"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                  errors.name
                    ? "border-[#B3453B] focus:ring-[#B3453B]/30"
                    : "border-[#D8D3C7] focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
                }`}
              />
              {errors.name && (
                <p id="name-error" className="text-[#B3453B] text-xs mt-1.5">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="mb-5">
              <label htmlFor="reg-email" className="block text-[13px] text-[#1C2B4A] mb-1.5">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.gov.in"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "reg-email-error" : undefined}
                className={`w-full px-3.5 py-2.5 text-sm bg-white border text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                  errors.email
                    ? "border-[#B3453B] focus:ring-[#B3453B]/30"
                    : "border-[#D8D3C7] focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
                }`}
              />
              {errors.email && (
                <p id="reg-email-error" className="text-[#B3453B] text-xs mt-1.5">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="mb-2">
              <label htmlFor="reg-password" className="block text-[13px] text-[#1C2B4A] mb-1.5">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                aria-invalid={!!errors.password}
                aria-describedby="password-rules"
                className={`w-full px-3.5 py-2.5 text-sm bg-white border text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                  errors.password
                    ? "border-[#B3453B] focus:ring-[#B3453B]/30"
                    : "border-[#D8D3C7] focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
                }`}
              />
              <div id="password-rules" className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <span
                      key={rule.key}
                      className={`flex items-center gap-1 text-[11px] ${
                        passed ? "text-[#4A7C59]" : "text-[#8993A8]"
                      }`}
                    >
                      <span
                        className={`w-3 h-3 flex items-center justify-center border ${
                          passed
                            ? "border-[#4A7C59] bg-[#4A7C59]"
                            : "border-[#C7CCD9]"
                        }`}
                      >
                        {passed && <Check size={9} strokeWidth={3} className="text-white" />}
                      </span>
                      {rule.label}
                    </span>
                  );
                })}
              </div>
              {errors.password && (
                <p className="text-[#B3453B] text-xs mt-2">{errors.password}</p>
              )}
            </div>

            <div className="mb-2 mt-5">
              <label htmlFor="confirm-password" className="block text-[13px] text-[#1C2B4A] mb-1.5">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? "confirm-password-error" : undefined
                }
                className={`w-full px-3.5 py-2.5 text-sm bg-white border text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                  errors.confirmPassword
                    ? "border-[#B3453B] focus:ring-[#B3453B]/30"
                    : "border-[#D8D3C7] focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]"
                }`}
              />
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="text-[#B3453B] text-xs mt-1.5">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <label className="flex items-start gap-2.5 mt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#1C2B4A] shrink-0"
              />
              <span className="text-[13px] text-[#5A6478] leading-relaxed">
                I agree to the terms of use and confirm the details above are
                accurate.
              </span>
            </label>
            {errors.agreed && (
              <p className="text-[#B3453B] text-xs mt-1.5">{errors.agreed}</p>
            )}

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
                  Creating account
                </>
              ) : (
                <>
                  Create {activeRole.label} account
                  <ChevronRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[#5A6478] text-sm mt-8">
            Already have an account?{" "}
            <button
              type="button"
              onClick={onNavigateLogin}
              className="text-[#1C2B4A] hover:text-[#B8863F] underline underline-offset-2"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
