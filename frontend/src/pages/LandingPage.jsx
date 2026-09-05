import React, { useEffect, useState } from "react";
import {
  Landmark,
  Users,
  Eye,
  ArrowRight,
  ShieldCheck,
  ClipboardList,
  MessageSquare,
  MapPin,
  IndianRupee,
  Clock,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { fetchStats, fetchWorks, DEMO_MODE } from "../assets/worksData";

const RISK_STYLES = {
  low: { label: "Low risk", text: "text-[#4A7C59]", bg: "bg-[#4A7C59]/10", bar: "bg-[#4A7C59]" },
  medium: { label: "Medium risk", text: "text-[#C48A3F]", bg: "bg-[#C48A3F]/10", bar: "bg-[#C48A3F]" },
  high: { label: "High risk", text: "text-[#B3453B]", bg: "bg-[#B3453B]/10", bar: "bg-[#B3453B]" },
};

const ROLE_COLUMNS = [
  {
    key: "government",
    icon: Landmark,
    label: "Government",
    description:
      "View the risk score of any work under any MP and schedule inspections where scores demand attention.",
    points: [
      "Risk scores across every constituency",
      "Inspection scheduling & status tracking",
      "Cross-MP oversight dashboard",
    ],
  },
  {
    key: "mp",
    icon: Users,
    label: "MP",
    description:
      "Track the works you've approved or funded, their risk scores, and the contractors delivering them.",
    points: [
      "Works you've approved or invested in",
      "Risk score visibility for your works",
      "Contractor & service provider details",
    ],
  },
  {
    key: "citizen",
    icon: Eye,
    label: "Citizen",
    description:
      "Follow the works happening in your area and speak up on the public feedback board.",
    points: [
      "Live status of local MPLAD works",
      "Post comments & feedback for your MP",
      "No risk score visibility — status only",
    ],
  },
];

function RiskBadge({ score, band }) {
  const style = RISK_STYLES[band] || RISK_STYLES.medium;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 text-[11px] ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.bar}`} />
      {style.label} · {score}
    </div>
  );
}

function WorkCard({ work }) {
  return (
    <div className="border border-[#D8D3C7] bg-white p-5 hover:border-[#1C2B4A]/30 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-[#1C2B4A] text-[15px] leading-snug">{work.title}</h3>
        <RiskBadge score={work.riskScore} band={work.riskBand} />
      </div>
      <div className="flex items-center gap-1.5 text-[#5A6478] text-[12.5px] mb-1">
        <MapPin size={12} />
        {work.location}
      </div>
      <div className="flex items-center gap-1.5 text-[#5A6478] text-[12.5px] mb-1">
        <IndianRupee size={12} />
        {work.fundsAllocated} allocated
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#EFECE3]">
        <span className="text-[12px] text-[#8993A8]">{work.mp} · {work.status}</span>
        <span className="flex items-center gap-1 text-[11px] text-[#8993A8]">
          <Clock size={11} />
          {work.lastUpdated}
        </span>
      </div>
    </div>
  );
}

export default function LandingPage({ onLogin, onRegister, onNavigate, onOpenPortal }) {
  const [stats, setStats] = useState(null);
  const [works, setWorks] = useState([]);
  const [loadingWorks, setLoadingWorks] = useState(true);

  useEffect(() => {
    fetchStats().then(setStats).catch(() => setStats(null));
    fetchWorks(6)
      .then(setWorks)
      .catch(() => setWorks([]))
      .finally(() => setLoadingWorks(false));
  }, []);

  const handlePortalClick = (roleKey) => {
    if (onOpenPortal) {
      onOpenPortal(roleKey);
    } else if (onNavigate) {
      onNavigate(roleKey);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Navbar activeTab="home" onNavigate={onNavigate} onLogin={onLogin} onRegister={onRegister} />

      {/* HERO */}
      <section className="max-w-[1200px] mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[12px] text-[#5A6478] border border-[#D8D3C7] px-2.5 py-1 mb-6">
            <ShieldCheck size={13} className="text-[#B8863F]" />
            MPLAD scheme oversight
          </div>
          <h1
            className="text-[#1C2B4A] text-[2.75rem] sm:text-[3.25rem] leading-[1.1] mb-6"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            Every work funded, scored, and open to scrutiny.
          </h1>
          <p className="text-[#5A6478] text-[16px] leading-relaxed max-w-[46ch] mb-8">
            We give every work under the MPLAD scheme a risk score, track its
            progress, and surface signs of fraud early — so government, MPs
            and citizens can each see what they need to.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onRegister}
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#1C2B4A] text-[#FAF9F6] text-[14px] hover:bg-[#233658] transition-colors"
            >
              Get started
              <ArrowRight size={15} />
            </button>
            <button
              onClick={() => onNavigate && onNavigate("how-it-works")}
              className="inline-flex items-center gap-2 px-5 py-3 border border-[#D8D3C7] text-[#1C2B4A] text-[14px] hover:border-[#1C2B4A] transition-colors"
            >
              See how it works
            </button>
          </div>

          {/* Direct Portal Quick Access */}
          <div className="pt-6 mt-8 border-t border-[#D8D3C7]">
            <div className="text-[11.5px] uppercase tracking-wider text-[#8993A8] font-medium mb-3">
              Direct Portal Access (Click to open)
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handlePortalClick("citizen")}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#D8D3C7] text-[#1C2B4A] text-[13px] hover:border-[#4A7C59] hover:text-[#4A7C59] transition-colors shadow-sm"
              >
                <Eye size={14} className="text-[#4A7C59]" />
                Citizen Portal
                <ArrowRight size={12} />
              </button>
              <button
                onClick={() => handlePortalClick("mp")}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#D8D3C7] text-[#1C2B4A] text-[13px] hover:border-[#B8863F] hover:text-[#B8863F] transition-colors shadow-sm"
              >
                <Users size={14} className="text-[#B8863F]" />
                MP / MLA Portal
                <ArrowRight size={12} />
              </button>
              <button
                onClick={() => handlePortalClick("civil-servant")}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-[#D8D3C7] text-[#1C2B4A] text-[13px] hover:border-[#1C2B4A] hover:bg-[#1C2B4A] hover:text-white transition-colors shadow-sm"
              >
                <Landmark size={14} className="text-[#1C2B4A]" />
                Civil Servant Oversight
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Hero risk-score visual */}
        <div className="border border-[#D8D3C7] bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <span className="text-[12px] text-[#8993A8]">Sample work</span>
            <RiskBadge score={78} band="high" />
          </div>
          <h3
            className="text-[#1C2B4A] text-[19px] mb-1"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            Community Health Sub-Centre Upgrade
          </h3>
          <p className="text-[#5A6478] text-[13px] mb-5">Sitapur, Uttar Pradesh</p>

          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[#5A6478]">Fund utilisation</span>
              <span className="text-[#1C2B4A]">62%</span>
            </div>
            <div className="h-1.5 bg-[#EFECE3]">
              <div className="h-full bg-[#B8863F] w-[62%]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#EFECE3]">
            <div>
              <div className="text-[11px] text-[#8993A8] mb-1">Timeline slippage</div>
              <div className="text-[#B3453B] text-[14px]">+46 days</div>
            </div>
            <div>
              <div className="text-[11px] text-[#8993A8] mb-1">Site visits logged</div>
              <div className="text-[#1C2B4A] text-[14px]">2 of 5</div>
            </div>
          </div>

          {!DEMO_MODE && (
            <p className="text-[11px] text-[#8993A8] mt-4">Live from backend</p>
          )}
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="border-y border-[#D8D3C7] bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: "Works tracked", value: stats?.totalWorks?.toLocaleString?.() ?? stats?.totalWorks ?? "—" },
            { label: "Funds tracked", value: stats?.totalFundsTracked ?? "—" },
            { label: "Active inspections", value: stats?.activeInspections ?? "—" },
            { label: "Citizen reports filed", value: stats?.citizenReports ?? "—" },
          ].map((s) => (
            <div key={s.label}>
              <div
                className="text-[#1C2B4A] text-[1.6rem]"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
              >
                {s.value}
              </div>
              <div className="text-[#8993A8] text-[12.5px] mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="max-w-[1200px] mx-auto px-6 py-20">
        <div className="max-w-[56ch] mb-12">
          <span className="text-[#B8863F] text-[12px] mb-2 block">How it works</span>
          <h2
            className="text-[#1C2B4A] text-[2rem] leading-tight"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            One platform, three views of the same work.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 border border-[#D8D3C7]">
          {ROLE_COLUMNS.map((role, i) => {
            const Icon = role.icon;
            return (
              <div
                key={role.key}
                className={`p-7 ${i !== 0 ? "border-t md:border-t-0 md:border-l border-[#D8D3C7]" : ""}`}
              >
                <Icon size={20} strokeWidth={1.75} className="text-[#B8863F] mb-4" />
                <h3 className="text-[#1C2B4A] text-[16px] mb-2">{role.label}</h3>
                <p className="text-[#5A6478] text-[13.5px] leading-relaxed mb-5">
                  {role.description}
                </p>
                <ul className="space-y-2">
                  {role.points.map((point) => (
                    <li key={point} className="text-[12.5px] text-[#5A6478] flex gap-2">
                      <span className="text-[#B8863F] mt-0.5">·</span>
                      {point}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handlePortalClick(role.key === "government" ? "civil-servant" : role.key)}
                  className="mt-6 w-full inline-flex items-center justify-between px-3.5 py-2.5 text-[13px] border border-[#D8D3C7] text-[#1C2B4A] bg-[#FAF9F6] hover:bg-[#1C2B4A] hover:text-white transition-colors"
                >
                  <span>Open {role.label} Portal</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* PUBLIC WORKS PREVIEW */}
      <section id="public-works" className="bg-white border-y border-[#D8D3C7]">
        <div className="max-w-[1200px] mx-auto px-6 py-20">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <span className="text-[#B8863F] text-[12px] mb-2 block">Public works</span>
              <h2
                className="text-[#1C2B4A] text-[2rem] leading-tight"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
              >
                What's happening near you.
              </h2>
            </div>
            <button
              onClick={() => onNavigate && onNavigate("public-works")}
              className="inline-flex items-center gap-1.5 text-[13.5px] text-[#1C2B4A] hover:text-[#B8863F] transition-colors"
            >
              View all works
              <ArrowRight size={14} />
            </button>
          </div>

          {loadingWorks ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-[#D8D3C7] h-40 animate-pulse bg-[#F3F1EB]" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {works.map((w) => (
                <WorkCard key={w.id} work={w} />
              ))}
            </div>
          )}

          <p className="text-[12px] text-[#8993A8] mt-6">
            Citizens see work status and location. Risk scores shown here are
            visible to Government and MP roles only.
          </p>
        </div>
      </section>

      {/* FEEDBACK BOARD TEASER */}
      <section id="feedback-board" className="max-w-[1200px] mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-[#B8863F] text-[12px] mb-2 block">Feedback board</span>
          <h2
            className="text-[#1C2B4A] text-[2rem] leading-tight mb-5"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            Say something. Your MP will see it.
          </h2>
          <p className="text-[#5A6478] text-[15px] leading-relaxed max-w-[48ch] mb-6">
            Every work has a comment thread where citizens in that area can
            flag delays, praise good work, or raise concerns — visible
            directly to the MP responsible.
          </p>
          <button
            onClick={onRegister}
            className="inline-flex items-center gap-2 px-5 py-3 border border-[#1C2B4A] text-[#1C2B4A] text-[14px] hover:bg-[#1C2B4A] hover:text-[#FAF9F6] transition-colors"
          >
            Join the conversation
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="border border-[#D8D3C7] bg-white p-6 space-y-4">
          {[
            {
              name: "Resident, Ward 14",
              text: "Streetlight work near the market has been paused for two weeks with no update.",
              tag: "Delay reported",
            },
            {
              name: "Resident, Sitapur",
              text: "Health centre construction looks solid so far — good to see regular site activity.",
              tag: "Positive",
            },
          ].map((c, i) => (
            <div key={i} className="flex gap-3 pb-4 border-b border-[#EFECE3] last:border-0 last:pb-0">
              <MessageSquare size={16} className="text-[#B8863F] mt-1 shrink-0" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#1C2B4A] text-[12.5px]">{c.name}</span>
                  <span className="text-[10.5px] text-[#8993A8] border border-[#D8D3C7] px-1.5 py-0.5">
                    {c.tag}
                  </span>
                </div>
                <p className="text-[#5A6478] text-[13px] leading-relaxed">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="bg-[#1C2B4A]">
        <div className="max-w-[1200px] mx-auto px-6 py-20 grid lg:grid-cols-[1fr_1fr] gap-12">
          <div>
            <span className="text-[#B8863F] text-[12px] mb-2 block">About</span>
            <h2
              className="text-[#FAF9F6] text-[2rem] leading-tight mb-5"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              Built to make public spending legible.
            </h2>
            <p className="text-[#AEB8CC] text-[14.5px] leading-relaxed max-w-[50ch]">
              The MPLAD scheme funds thousands of local development works
              every year. This platform brings risk scoring, inspection
              tracking, and citizen feedback into one shared record — so
              oversight isn't left to paperwork alone.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="border-t border-[#31456B] pt-4">
              <ClipboardList size={16} className="text-[#B8863F] mb-2" />
              <div className="text-[#DCE1EC] text-[13px] mb-1">Progress tracking</div>
              <div className="text-[#8993A8] text-[12px] leading-relaxed">
                Status and timelines for every funded work.
              </div>
            </div>
            <div className="border-t border-[#31456B] pt-4">
              <ShieldCheck size={16} className="text-[#B8863F] mb-2" />
              <div className="text-[#DCE1EC] text-[13px] mb-1">Risk scoring</div>
              <div className="text-[#8993A8] text-[12px] leading-relaxed">
                Signals that flag works needing inspection.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#D8D3C7]">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-[#8993A8] text-[12.5px]">
            MPLAD Works Tracker · Built for public accountability
          </span>
          <div className="flex gap-5 text-[12.5px] text-[#5A6478]">
            <button onClick={() => onNavigate && onNavigate("about")} className="hover:text-[#1C2B4A]">
              About
            </button>
            <button className="hover:text-[#1C2B4A]">Privacy</button>
            <button className="hover:text-[#1C2B4A]">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
