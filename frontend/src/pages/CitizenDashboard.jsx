import React, { useState, useEffect } from "react";
import {
  MapPin,
  Clock,
  MessageSquare,
  Send,
  Bell,
  CheckCircle2,
  AlertCircle,
  Timer,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import { fetchCitizenWorks, fetchCurrentUser } from "../dataService";
import {
  ANNOUNCEMENTS,
} from "../assets/dashboardData";

/* ——— Status styling helper ——— */
const STATUS_STYLES = {
  "In Progress": { icon: Timer, text: "text-[#B8863F]", bg: "bg-[#B8863F]/10" },
  Completed: { icon: CheckCircle2, text: "text-[#4A7C59]", bg: "bg-[#4A7C59]/10" },
  Delayed: { icon: AlertCircle, text: "text-[#B3453B]", bg: "bg-[#B3453B]/10" },
};

/* ——— Tag styling ——— */
const TAG_STYLES = {
  "Delay reported": "border-[#B3453B]/30 text-[#B3453B] bg-[#B3453B]/5",
  Concern: "border-[#B8863F]/30 text-[#B8863F] bg-[#B8863F]/5",
  Positive: "border-[#4A7C59]/30 text-[#4A7C59] bg-[#4A7C59]/5",
};

const CHART_COLORS = ["#4A7C59", "#B8863F", "#B3453B", "#1C2B4A", "#6D809F", "#8C6B4F"];

/* ===================================================================
   CITIZEN DASHBOARD
   — view-only works list + messaging + announcements
   =================================================================== */
export default function CitizenDashboard({ onLogout }) {
  const citizenName = localStorage.getItem("name") || "Citizen";
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const region = profile?.place?.region || "";
  const district = profile?.place?.district || "";
  const hasPlace = Boolean(region && district);
  const [works, setWorks] = useState([]);
  const [worksLoading, setWorksLoading] = useState(false);
  const [worksError, setWorksError] = useState("");
  const [section, setSection] = useState("overview");
  const [selectedWork, setSelectedWork] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [messageTag, setMessageTag] = useState("Concern");
  const [myMessages] = useState([]);
  const [sentConfirm, setSentConfirm] = useState(false);

  useEffect(() => {
    fetchCurrentUser()
      .then(setProfile)
      .catch((error) => setProfileError(error.message))
      .finally(() => setProfileLoading(false));
  }, []);

  useEffect(() => {
    if (profileLoading || !hasPlace) return;
    setWorksLoading(true);
    fetchCitizenWorks({ region, district })
      .then(setWorks)
      .catch((error) => setWorksError(error.message))
      .finally(() => setWorksLoading(false));
  }, [profileLoading, hasPlace, region, district]);

  const locationError = profileError || (profileLoading ? "Loading your account details..." : hasPlace ? worksError : "Your registration location is missing. Please contact support.");

  const unread = ANNOUNCEMENTS.length;
  const statusData = ["In Progress", "Completed", "Delayed"].map((status) => ({
    name: status,
    value: works.filter((work) => work.status === status).length,
  })).filter((item) => item.value > 0);
  const mpData = Object.entries(works.reduce((groups, work) => {
    const mp = work.mp || "Not available";
    groups[mp] = (groups[mp] || 0) + 1;
    return groups;
  }, {})).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total).slice(0, 8);
  const progressData = works.slice(0, 8).map((work) => ({
    name: work.title.length > 26 ? `${work.title.slice(0, 26)}...` : work.title,
    progress: Number(work.progressPct || 0),
  }));

  /* ——— Section Renderers ——— */

  const renderOverview = () => (
    <div>
      {/* Area summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: "Active works in your area", value: works.filter(w => w.status !== "Completed").length },
          { label: "Completed works", value: works.filter(w => w.status === "Completed").length },
          { label: "Your feedback sent", value: myMessages.length },
        ].map((s) => (
          <div key={s.label} className="border border-[#D8D3C7] bg-white p-5">
            <div
              className="text-[#1C2B4A] text-[1.5rem]"
              style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
            >
              {s.value}
            </div>
            <div className="text-[#8993A8] text-[12px] mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {!worksLoading && !locationError && works.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
          <div className="border border-[#D8D3C7] bg-white p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-[#1C2B4A] text-[15px]" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                  Work status
                </h2>
                <p className="text-[#8993A8] text-[11px] mt-1">Live works in {district}</p>
              </div>
              <span className="text-[#5A6478] text-[12px]">{works.length} total</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3}>
                  {statusData.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index]} />)}
                </Pie>
                <Tooltip formatter={(value) => [`${value} works`, "Count"]} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="border border-[#D8D3C7] bg-white p-5">
            <div className="mb-3">
              <h2 className="text-[#1C2B4A] text-[15px]" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                Works by local MP
              </h2>
              <p className="text-[#8993A8] text-[11px] mt-1">MPs responsible for works near you</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mpData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="#EFECE3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#8993A8" }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: "#5A6478" }} tickFormatter={(value) => value.length > 16 ? `${value.slice(0, 16)}...` : value} />
                <Tooltip formatter={(value) => [`${value} works`, "Works"]} />
                <Bar dataKey="total" fill="#B8863F" barSize={14} radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border border-[#D8D3C7] bg-white p-5 xl:col-span-2">
            <div className="mb-3">
              <h2 className="text-[#1C2B4A] text-[15px]" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
                Progress across nearby works
              </h2>
              <p className="text-[#8993A8] text-[11px] mt-1">Top works returned for your district</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={progressData} margin={{ top: 4, right: 12, left: 0, bottom: 48 }}>
                <CartesianGrid stroke="#EFECE3" vertical={false} />
                <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={64} tick={{ fontSize: 10, fill: "#5A6478" }} />
                <YAxis domain={[0, 100]} unit="%" tick={{ fontSize: 10, fill: "#8993A8" }} />
                <Tooltip formatter={(value) => [`${value}%`, "Progress"]} />
                <Bar dataKey="progress" fill="#4A7C59" barSize={28} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Works list */}
      <div className="mb-4 flex items-center justify-between">
        <h2
          className="text-[#1C2B4A] text-[17px]"
          style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
        >
          Works in your area
        </h2>
        <span className="text-[12px] text-[#8993A8]">{works.length} works</span>
      </div>

      {worksLoading && <p className="text-[#8993A8] text-[13px]">Loading nearby works...</p>}
      {locationError && <p className="text-[#B3453B] text-[13px]">{locationError}</p>}
      {!worksLoading && !locationError && works.length === 0 && <p className="text-[#8993A8] text-[13px]">No works found in your district.</p>}
      <div className="space-y-3">
        {works.map((work) => {
          const statusStyle = STATUS_STYLES[work.status] || STATUS_STYLES["In Progress"];
          const StatusIcon = statusStyle.icon;
          return (
            <button
              key={work.id}
              onClick={() => setSelectedWork(work)}
              className="w-full text-left border border-[#D8D3C7] bg-white p-5 hover:border-[#1C2B4A]/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-[#1C2B4A] text-[14px] group-hover:text-[#B8863F] transition-colors">
                  {work.title}
                </h3>
                <div className={`inline-flex items-center gap-1.5 px-2 py-1 text-[11px] ${statusStyle.bg} ${statusStyle.text} shrink-0`}>
                  <StatusIcon size={12} />
                  {work.status}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[#5A6478] text-[12px] mb-2">
                <MapPin size={12} />
                {work.location}
              </div>
              <div className="text-[#5A6478] text-[12px] mb-3">
                Local MP: <span className="text-[#1C2B4A]">{work.mp || "Not available"}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[11px] text-[#8993A8]">Progress</span>
                    <div className="w-24 h-1.5 bg-[#EFECE3] mt-1">
                      <div
                        className="h-full bg-[#B8863F]"
                        style={{ width: `${work.progressPct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[12px] text-[#5A6478]">{work.progressPct}%</span>
                </div>
                <span className="flex items-center gap-1 text-[11px] text-[#8993A8]">
                  <Clock size={11} />
                  {work.lastUpdated}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Note about risk scores */}
      <p className="text-[11px] text-[#8993A8] mt-6 border-l-2 border-[#D8D3C7] pl-3">
        Risk scores are visible to Government and MP roles only. You see work status and progress.
      </p>
    </div>
  );

  const renderWorkDetail = () => {
    if (!selectedWork) return renderOverview();
    const work = selectedWork;
    const statusStyle = STATUS_STYLES[work.status] || STATUS_STYLES["In Progress"];
    const StatusIcon = statusStyle.icon;

    return (
      <div>
        <button
          onClick={() => setSelectedWork(null)}
          className="flex items-center gap-1 text-[13px] text-[#5A6478] hover:text-[#1C2B4A] mb-6"
        >
          ← Back to works
        </button>

        <div className="border border-[#D8D3C7] bg-white p-6 mb-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h2
                className="text-[#1C2B4A] text-[20px] mb-1"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
              >
                {work.title}
              </h2>
              <div className="flex items-center gap-1.5 text-[#5A6478] text-[13px]">
                <MapPin size={13} />
                {work.location}
              </div>
              <div className="text-[#5A6478] text-[13px] mt-1">
                Local MP: <span className="text-[#1C2B4A]">{work.mp || "Not available"}</span>
              </div>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] ${statusStyle.bg} ${statusStyle.text}`}>
              <StatusIcon size={13} />
              {work.status}
            </div>
          </div>

          <p className="text-[#5A6478] text-[14px] leading-relaxed mb-6">
            {work.description}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#EFECE3]">
            <div>
              <div className="text-[11px] text-[#8993A8] mb-1">Funds allocated</div>
              <div className="text-[#1C2B4A] text-[14px]">{work.fundsAllocated}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#8993A8] mb-1">Fund utilisation</div>
              <div className="text-[#1C2B4A] text-[14px]">{work.fundUtilisation}%</div>
            </div>
            <div>
              <div className="text-[11px] text-[#8993A8] mb-1">Expected completion</div>
              <div className="text-[#1C2B4A] text-[14px]">{work.expectedCompletion}</div>
            </div>
            <div>
              <div className="text-[11px] text-[#8993A8] mb-1">Site visits</div>
              <div className="text-[#1C2B4A] text-[14px]">
                {work.siteVisits.completed} of {work.siteVisits.total}
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="border border-[#D8D3C7] bg-white p-6 mb-6">
          <h3 className="text-[#1C2B4A] text-[15px] mb-4" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
            Milestones
          </h3>
          <div className="space-y-3">
            {work.milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-5 h-5 flex items-center justify-center border ${
                  m.done ? "border-[#4A7C59] bg-[#4A7C59]" : "border-[#D8D3C7]"
                }`}>
                  {m.done && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <div className="flex-1">
                  <span className={`text-[13px] ${m.done ? "text-[#4A7C59]" : "text-[#5A6478]"}`}>
                    {m.label}
                  </span>
                </div>
                <span className="text-[11px] text-[#8993A8]">{m.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fund breakdown bar */}
        <div className="border border-[#D8D3C7] bg-white p-6">
          <h3 className="text-[#1C2B4A] text-[15px] mb-4" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
            Fund utilisation
          </h3>
          <div className="flex items-center justify-between text-[13px] mb-2">
            <span className="text-[#5A6478]">Spent: {work.fundsSpent}</span>
            <span className="text-[#1C2B4A]">Allocated: {work.fundsAllocated}</span>
          </div>
          <div className="h-3 bg-[#EFECE3]">
            <div
              className="h-full bg-[#B8863F] transition-all"
              style={{ width: `${work.fundUtilisation}%` }}
            />
          </div>
          <div className="text-[12px] text-[#8993A8] mt-2">{work.fundUtilisation}% utilised</div>
        </div>
      </div>
    );
  };

  const renderMessages = () => (
    <div>
      {/* Compose feedback */}
      <div className="border border-[#D8D3C7] bg-white p-6 mb-6">
        <h3
          className="text-[#1C2B4A] text-[15px] mb-4"
          style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
        >
          Send feedback on a work
        </h3>

        <div className="mb-4">
          <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Select work</label>
          <select className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A]">
            <option value="">Choose a work…</option>
            {works.map((w) => (
              <option key={w.id} value={w.id}>{w.title} — {w.location}</option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Tag</label>
          <div className="flex gap-2">
            {["Positive", "Concern", "Delay reported"].map((tag) => (
              <button
                key={tag}
                onClick={() => setMessageTag(tag)}
                className={`px-3 py-1.5 text-[12px] border transition-colors ${
                  messageTag === tag
                    ? "bg-[#1C2B4A] text-[#FAF9F6] border-[#1C2B4A]"
                    : "bg-white text-[#5A6478] border-[#D8D3C7] hover:border-[#1C2B4A]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[13px] text-[#1C2B4A] mb-1.5">Your message</label>
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Describe your feedback, concern, or observation…"
            rows={4}
            className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#D8D3C7] text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A] resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (messageText.trim()) {
                setSentConfirm(true);
                setMessageText("");
                setTimeout(() => setSentConfirm(false), 3000);
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1C2B4A] text-[#FAF9F6] text-[13px] hover:bg-[#233658] transition-colors"
          >
            <Send size={13} />
            Send feedback
          </button>
          {sentConfirm && (
            <span className="text-[#4A7C59] text-[12px] flex items-center gap-1">
              <CheckCircle2 size={13} /> Sent successfully
            </span>
          )}
        </div>
      </div>

      {/* Past messages */}
      <h3
        className="text-[#1C2B4A] text-[15px] mb-4"
        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
      >
        Your past feedback
      </h3>

      {myMessages.length === 0 ? (
        <p className="text-[#8993A8] text-[13px]">No feedback submitted yet.</p>
      ) : (
        <div className="space-y-3">
          {myMessages.map((msg) => (
            <div key={msg.id} className="border border-[#D8D3C7] bg-white p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-[#B8863F]" />
                  <span className="text-[#1C2B4A] text-[13px]">{msg.workTitle}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 border ${TAG_STYLES[msg.tag] || "border-[#D8D3C7] text-[#5A6478]"}`}>
                  {msg.tag}
                </span>
              </div>
              <p className="text-[#5A6478] text-[13px] leading-relaxed mb-2">{msg.text}</p>
              <div className="flex items-center gap-3 text-[11px] text-[#8993A8]">
                <span>{msg.author} · {msg.ward}</span>
                <span>{msg.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnnouncements = () => (
    <div>
      <div className="mb-6">
        <p className="text-[#5A6478] text-[13px]">
          Public announcements from MPs and government officials about works in your area.
        </p>
      </div>

      <div className="space-y-3">
        {ANNOUNCEMENTS.map((ann) => (
          <div key={ann.id} className="border border-[#D8D3C7] bg-white p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-[#B8863F]" />
                <span className="text-[#1C2B4A] text-[14px]">{ann.title}</span>
              </div>
              <span className="text-[11px] text-[#8993A8]">{ann.date}</span>
            </div>
            <p className="text-[#5A6478] text-[13px] leading-relaxed mb-2">{ann.text}</p>
            <span className="text-[12px] text-[#8993A8]">— {ann.author}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (selectedWork && section === "overview") return renderWorkDetail();
    switch (section) {
      case "overview": return renderOverview();
      case "messages": return renderMessages();
      case "announcements": return renderAnnouncements();
      default: return renderOverview();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAF9F6]">
      <DashboardSidebar
        role="citizen"
        activeSection={section}
        onSectionChange={(key) => {
          setSection(key);
          setSelectedWork(null);
        }}
        onLogout={onLogout}
        userName={citizenName}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader section={section} role="citizen" unreadCount={unread} userName={citizenName} />
        <main className="flex-1 p-6 max-w-[960px]">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
