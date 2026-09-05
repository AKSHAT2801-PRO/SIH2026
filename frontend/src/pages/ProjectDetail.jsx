import React, { useEffect, useState, useRef } from "react";
import {
  MapPin,
  User,
  Phone,
  Calendar,
  ShieldAlert,
  MessageSquare,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Flag,
  Upload,
  ArrowLeft,
  Briefcase,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { RiskBadge, StatusPill, InspectionPill, formatINR } from "../components/ui";
import {
  fetchWorkById,
  fetchReviews,
  markForInspection,
  submitInspectionResult,
} from "../dataService";

function InfoCard({ label, value, sub }) {
  return (
    <div className="border border-[#D8D3C7] bg-white p-5">
      <div className="text-[11.5px] text-[#8993A8] mb-1.5">{label}</div>
      <div
        className="text-[#1C2B4A] text-[1.35rem]"
        style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
      >
        {value}
      </div>
      {sub && <div className="text-[11.5px] text-[#8993A8] mt-1">{sub}</div>}
    </div>
  );
}

function InspectionForm({ workId, onSubmitted }) {
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const OUTCOMES = [
    { key: "Pass", label: "Pass", icon: CheckCircle2, color: "text-[#4A7C59] border-[#4A7C59]" },
    { key: "Flagged", label: "Flagged", icon: Flag, color: "text-[#C48A3F] border-[#C48A3F]" },
    { key: "Fail", label: "Fail", icon: XCircle, color: "text-[#B3453B] border-[#B3453B]" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!outcome) {
      setError("Select an inspection outcome.");
      return;
    }
    if (!notes.trim()) {
      setError("Add a short note describing what was found.");
      return;
    }
    setSubmitting(true);
    try {
      await submitInspectionResult(workId, { outcome, notes, photoFile });
      onSubmitted({ outcome, notes, date: new Date().toISOString().slice(0, 10) });
      setOutcome("");
      setNotes("");
      setPhotoFile(null);
    } catch (err) {
      setError(err.message || "Failed to submit inspection result.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-[#D8D3C7] bg-white p-6">
      <div className="mb-5">
        <div className="text-[12.5px] text-[#1C2B4A] mb-2.5">Outcome</div>
        <div className="grid grid-cols-3 gap-2">
          {OUTCOMES.map((o) => {
            const Icon = o.icon;
            const isActive = outcome === o.key;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => setOutcome(o.key)}
                className={`flex flex-col items-center gap-1.5 py-3 border text-[12.5px] transition-colors ${
                  isActive ? `${o.color} bg-current/5` : "border-[#D8D3C7] text-[#5A6478] hover:border-[#1C2B4A]/30"
                }`}
              >
                <Icon size={17} strokeWidth={1.75} />
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-5">
        <label htmlFor="inspection-notes" className="block text-[12.5px] text-[#1C2B4A] mb-2">
          Notes
        </label>
        <textarea
          id="inspection-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Describe what was observed on site..."
          className="w-full px-3.5 py-2.5 text-[13.5px] bg-white border border-[#D8D3C7] text-[#1C2B4A] placeholder:text-[#AEB8CC] focus:outline-none focus:ring-2 focus:ring-[#1C2B4A]/20 focus:border-[#1C2B4A] resize-none"
        />
      </div>

      <div className="mb-5">
        <div className="block text-[12.5px] text-[#1C2B4A] mb-2">Photo evidence (optional)</div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
          className="hidden"
          id="inspection-photo"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-[#D8D3C7] text-[#5A6478] text-[13px] hover:border-[#1C2B4A]/40 transition-colors"
        >
          <Upload size={15} />
          {photoFile ? photoFile.name : "Upload a photo from the site"}
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 border border-[#B3453B]/30 bg-[#B3453B]/5 px-3.5 py-2.5 text-[#B3453B] text-[12.5px]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#1C2B4A] text-[#FAF9F6] text-[13.5px] hover:bg-[#233658] disabled:opacity-60 transition-colors"
      >
        {submitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit inspection result"
        )}
      </button>
    </form>
  );
}

export default function ProjectDetail({ workId, onBack, onLogout }) {
  const [work, setWork] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);

  const loadData = () => {
    setLoading(true);
    setError("");
    Promise.all([fetchWorkById(workId), fetchReviews({ workId })])
      .then(([workData, reviewsData]) => {
        setWork(workData);
        setReviews(reviewsData);
      })
      .catch((err) => setError(err.message || "Failed to load project."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId]);

  const handleMarkForInspection = async () => {
    setMarking(true);
    try {
      await markForInspection(workId);
      setWork((prev) => ({ ...prev, inspectionStatus: "flagged" }));
    } catch (err) {
      setError(err.message || "Failed to flag project for inspection.");
    } finally {
      setMarking(false);
    }
  };

  const handleInspectionSubmitted = (result) => {
    setWork((prev) => ({ ...prev, inspectionStatus: "completed", lastInspection: result }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="flex items-center gap-2 text-[#5A6478] text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading project...
        </div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#B3453B] text-sm mb-4">{error || "Project not found."}</p>
          <button onClick={onBack} className="text-[#1C2B4A] underline underline-offset-2 text-sm">
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <Navbar isAuthenticated userLabel="Government" onLogout={onLogout} />

      <div className="max-w-[1100px] mx-auto px-6 py-10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#5A6478] hover:text-[#1C2B4A] mb-6 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to dashboard
        </button>

        {error && (
          <div role="alert" className="mb-6 border border-[#B3453B]/30 bg-[#B3453B]/5 px-4 py-3 text-[#B3453B] text-[13px] flex items-center gap-2">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            <RiskBadge score={work.riskScore} band={work.riskBand} />
            <StatusPill status={work.status} />
            <InspectionPill status={work.inspectionStatus} />
          </div>
          <h1
            className="text-[#1C2B4A] text-[2rem] leading-tight mb-3"
            style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
          >
            {work.title}
          </h1>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-[#5A6478]">
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="text-[#8993A8]" />
              {work.location}
            </span>
            <span className="flex items-center gap-1.5">
              <User size={13} className="text-[#8993A8]" />
              {work.mp}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={13} className="text-[#8993A8]" />
              {work.startDate} → {work.dueDate}
            </span>
          </div>
        </div>

        {/* KEY METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <InfoCard label="Progress" value={`${work.progressPct}%`} />
          <InfoCard label="Budget allocated" value={formatINR(work.budgetAllocated)} />
          <InfoCard
            label="Expenditure"
            value={formatINR(work.expenditure)}
            sub={`${Math.round((work.expenditure / work.budgetAllocated) * 100)}% of budget used`}
          />
          <InfoCard label="Time allotted" value={`${work.timeAllottedMonths} months`} />
        </div>

        {/* PROGRESS BAR */}
        <div className="border border-[#D8D3C7] bg-white p-6 mb-10">
          <div className="flex items-center justify-between text-[13px] mb-2">
            <span className="text-[#5A6478]">Overall progress</span>
            <span className="text-[#1C2B4A]">{work.progressPct}%</span>
          </div>
          <div className="h-2 bg-[#EFECE3]">
            <div className="h-full bg-[#B8863F]" style={{ width: `${work.progressPct}%` }} />
          </div>
          <div className="flex items-center justify-between text-[12px] text-[#8993A8] mt-3">
            <span>Started {work.startDate}</span>
            <span>Due {work.dueDate}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mb-10">
          {/* CONTRACTOR */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={16} className="text-[#B8863F]" />
              <h2 className="text-[#1C2B4A] text-[15px]">Contractor details</h2>
            </div>
            <div className="border border-[#D8D3C7] bg-white p-5 space-y-3">
              <div>
                <div className="text-[11px] text-[#8993A8] mb-1">Name</div>
                <div className="text-[13.5px] text-[#1C2B4A]">{work.contractor.name}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone size={12} className="text-[#8993A8]" />
                <span className="text-[13px] text-[#5A6478]">{work.contractor.contact}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#EFECE3]">
                <div>
                  <div className="text-[11px] text-[#8993A8] mb-1">Past projects</div>
                  <div className="text-[13.5px] text-[#1C2B4A]">{work.contractor.pastProjects}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#8993A8] mb-1">Avg. risk score</div>
                  <div className="text-[13.5px] text-[#1C2B4A]">{work.contractor.avgRiskScore}</div>
                </div>
              </div>
            </div>
          </div>

          {/* RISK BREAKDOWN */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert size={16} className="text-[#B8863F]" />
              <h2 className="text-[#1C2B4A] text-[15px]">Risk score breakdown</h2>
              <span className="text-[11px] text-[#8993A8]">(via ML model)</span>
            </div>
            <div className="border border-[#D8D3C7] bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] text-[#5A6478]">Overall score</span>
                <RiskBadge score={work.riskScore} band={work.riskBand} />
              </div>
              <div className="space-y-3">
                {work.riskFactors.map((f, i) => (
                  <div key={i} className="border-l-2 border-[#D8D3C7] pl-3 py-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] text-[#1C2B4A]">{f.label}</span>
                      <span className="text-[10.5px] text-[#8993A8]">{f.weight}</span>
                    </div>
                    <p className="text-[11.5px] text-[#8993A8] mt-0.5">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* INSPECTION */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flag size={16} className="text-[#B8863F]" />
              <h2 className="text-[#1C2B4A] text-[15px]">Inspection</h2>
            </div>

            {work.inspectionStatus === "none" && (
              <div className="border border-[#D8D3C7] bg-white p-6">
                <p className="text-[13px] text-[#5A6478] mb-4">
                  This project has not been flagged for inspection.
                </p>
                <button
                  onClick={handleMarkForInspection}
                  disabled={marking}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#B3453B] text-[#FAF9F6] text-[13.5px] hover:bg-[#9c3b32] disabled:opacity-60 transition-colors"
                >
                  {marking ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Marking...
                    </>
                  ) : (
                    "Mark for inspection"
                  )}
                </button>
              </div>
            )}

            {(work.inspectionStatus === "flagged" || work.inspectionStatus === "scheduled") && (
              <InspectionForm workId={work.id} onSubmitted={handleInspectionSubmitted} />
            )}

            {work.inspectionStatus === "completed" && work.lastInspection && (
              <div className="border border-[#D8D3C7] bg-white p-6">
                <div className="flex items-center gap-2 mb-3">
                  {work.lastInspection.outcome === "Pass" ? (
                    <CheckCircle2 size={16} className="text-[#4A7C59]" />
                  ) : work.lastInspection.outcome === "Fail" ? (
                    <XCircle size={16} className="text-[#B3453B]" />
                  ) : (
                    <Flag size={16} className="text-[#C48A3F]" />
                  )}
                  <span className="text-[13.5px] text-[#1C2B4A]">
                    {work.lastInspection.outcome}
                  </span>
                  <span className="text-[11.5px] text-[#8993A8]">{work.lastInspection.date}</span>
                </div>
                <p className="text-[13px] text-[#5A6478] leading-relaxed">
                  {work.lastInspection.notes}
                </p>
              </div>
            )}
          </div>

          {/* REVIEWS */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-[#B8863F]" />
              <h2 className="text-[#1C2B4A] text-[15px]">Citizen reviews</h2>
            </div>
            <div className="border border-[#D8D3C7] bg-white">
              {reviews.length === 0 ? (
                <div className="px-5 py-8 text-center text-[#8993A8] text-[13px]">
                  No reviews for this project yet.
                </div>
              ) : (
                reviews.map((r, i) => (
                  <div key={r.id} className={`px-5 py-4 flex gap-3 ${i !== 0 ? "border-t border-[#EFECE3]" : ""}`}>
                    <MessageSquare
                      size={14}
                      className={
                        r.sentiment === "negative"
                          ? "text-[#B3453B] mt-0.5 shrink-0"
                          : "text-[#4A7C59] mt-0.5 shrink-0"
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[#1C2B4A] text-[12.5px]">{r.author}</span>
                        <span className="text-[10.5px] text-[#B0AA9C]">{r.date}</span>
                      </div>
                      <p className="text-[#5A6478] text-[13px] leading-relaxed">{r.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
