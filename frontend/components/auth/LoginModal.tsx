"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Eye, EyeOff, Lock, Mail, User, Shield, Check } from "lucide-react";

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("District Auditor");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = mode === "signup" ? name || "Citizen User" : email.split("@")[0] || "Oripio Studio";
    login(displayName, email || "user@empoweredindian.in", role);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={closeLoginModal}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="p-8 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-500 text-slate-950 font-black text-2xl rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 mx-auto">
              EI
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-3">
              {mode === "login" ? "Sign in to Empowered Indian" : "Create Citizen Account"}
            </h2>
            <p className="text-xs text-slate-500">
              Access government data dashboards, MP spending profiles, and field audit portals.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg transition-all text-center ${
                mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 rounded-lg transition-all text-center ${
                mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Username or Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com or username"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Account Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="District Auditor">District Auditor / Field Official</option>
                <option value="Citizen Observer">Citizen Observer / Journalist</option>
                <option value="MP Office Staff">MP Office Representative</option>
                <option value="Ministry Nodal Authority">Ministry Nodal Authority (MOSPI)</option>
              </select>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <span>Remember Me</span>
              </label>
              <a href="#forgot" className="text-amber-600 font-bold hover:underline">
                Lost password?
              </a>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 mt-2"
            >
              {mode === "login" ? "Sign In to MPLADS Dashboard" : "Complete Registration"}
            </button>
          </form>

          {/* Social Sign-In Divider */}
          <div className="relative border-t border-slate-200 pt-4 text-center">
            <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase relative -top-7">
              Or continue with
            </span>
            <div className="grid grid-cols-2 gap-3 mt-[-10px]">
              <button
                type="button"
                onClick={() => login("Google User", "google.user@gmail.com", "Citizen Observer")}
                className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
              >
                <span>Google Account</span>
              </button>
              <button
                type="button"
                onClick={() => login("MeriPehchaan User", "govt.auditor@gov.in", "District Auditor")}
                className="py-2.5 px-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <span>MeriPehchaan ID</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
