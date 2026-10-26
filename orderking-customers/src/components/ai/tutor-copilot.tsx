import { useState } from "react";
import {
  GraduationCap,
  Code2,
  Briefcase,
  Send,
  Loader2,
  CheckCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Building2,
  DollarSign,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

export interface TutorCopilotProps {
  onAskQuestion?: (query: string, category: string) => void;
  className?: string;
  defaultCategory?: "school" | "skills" | "jobs";
}

export interface VerifiedJob {
  id: string;
  title: string;
  category: "Fleet" | "Kitchen" | "Hub Operations";
  payoutBand: string;
  payoutSchedule: string;
  location: string;
  openings: number;
  requirements: string[];
  description: string;
}

export const VERIFIED_PRACTICAL_JOBS: readonly VerifiedJob[] = [
  {
    id: "job-del-partner",
    title: "Delivery Partner (2-Wheeler / EV)",
    category: "Fleet",
    payoutBand: "₹18,000 – ₹28,000 / month",
    payoutSchedule: "Weekly direct bank transfer",
    location: "Metro & Tier-1 Hubs · Flexible shifts",
    openings: 120,
    requirements: [
      "Valid Driving Licence & RC (for 2-wheelers) or Aadhaar ID (for EV/Cycle)",
      "Android or iOS smartphone with active GPS",
      "Active bank account or UPI ID for weekly settlement",
    ],
    description:
      "Hyperlocal delivery partner for food and grocery orders. Guaranteed weekly payouts based on completed trips, distance slabs, and peak-hour incentives.",
  },
  {
    id: "job-kitchen-commis",
    title: "Cloud Kitchen Commis Chef",
    category: "Kitchen",
    payoutBand: "₹20,000 – ₹30,000 / month",
    payoutSchedule: "Weekly direct bank transfer",
    location: "Partner Cloud Kitchens · City Centers",
    openings: 45,
    requirements: [
      "Prior commercial kitchen or restaurant station experience",
      "FSSAI food hygiene and sanitation protocol awareness",
      "Discipline in standard portioning and ticket staging",
    ],
    description:
      "Prepare ingredients, manage station mise-en-place, and assist senior chefs with line cooking and tamper-evident packaging under FSSAI standards.",
  },
  {
    id: "job-hub-ops",
    title: "Hub Operations & Sorting Associate",
    category: "Hub Operations",
    payoutBand: "₹18,000 – ₹24,000 / month",
    payoutSchedule: "Weekly direct bank transfer",
    location: "Regional Dispatch Hubs · Rotational 8h shifts",
    openings: 60,
    requirements: [
      "10th / 12th pass with basic smartphone scanner proficiency",
      "Accuracy in barcode inventory scanning and batch reconciliation",
      "Ability to handle ambient and cold-chain crate staging",
    ],
    description:
      "Manage inward merchant crate staging, SKU barcode scanning, batch sorting, and swift handoff to delivery partners at dispatch centers.",
  },
  {
    id: "job-dispatch-lead",
    title: "Kitchen Dispatch & Packaging Lead",
    category: "Kitchen",
    payoutBand: "₹22,000 – ₹30,000 / month",
    payoutSchedule: "Weekly direct bank transfer",
    location: "Partner Restaurant Hubs · High Volume",
    openings: 30,
    requirements: [
      "FoSTaC hygiene certification or hospitality background",
      "Quality check of tamper-evident container seals and hot/cold separation",
      "Maintain dispatch logbooks and timer targets",
    ],
    description:
      "Inspect packaged orders before courier handover, ensure tamper-evident food seals are intact, and maintain kitchen dispatch hygiene checklists.",
  },
];

export function TutorCopilot({
  onAskQuestion,
  className = "",
  defaultCategory = "school",
}: TutorCopilotProps) {
  const [activeTab, setActiveTab] = useState<"school" | "skills" | "jobs">(defaultCategory);
  const [queryInput, setQueryInput] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("CBSE");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [selectedSkill, setSelectedSkill] = useState("TypeScript");

  // Job application modal state
  const [selectedJob, setSelectedJob] = useState<VerifiedJob | null>(null);
  const [applicantName, setApplicantName] = useState("");
  const [applicantContact, setApplicantContact] = useState("");
  const [applicantCity, setApplicantCity] = useState("");
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>(() => {
    try {
      const stored = window.localStorage.getItem("orderking_applied_job_ids");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleAsk = (text?: string) => {
    const q = (text ?? queryInput).trim();
    if (!q) return;
    if (onAskQuestion) {
      onAskQuestion(q, activeTab === "school" ? `${selectedBoard} - ${selectedSubject}` : selectedSkill);
    } else {
      toast.info(`Query submitted for ${activeTab === "school" ? selectedSubject : selectedSkill}: "${q}"`);
    }
    setQueryInput("");
  };

  const handleApplyJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    if (!applicantName.trim() || !applicantContact.trim()) {
      toast.error("Please enter your name and contact phone or email.");
      return;
    }
    const updated = [...appliedJobIds, selectedJob.id];
    setAppliedJobIds(updated);
    try {
      window.localStorage.setItem("orderking_applied_job_ids", JSON.stringify(updated));
    } catch {
      // ignore storage error
    }
    toast.success(`Application submitted for ${selectedJob.title}! Hiring partner will reach out within 48 hours.`);
    setSelectedJob(null);
    setApplicantName("");
    setApplicantContact("");
    setApplicantCity("");
  };

  return (
    <div className={`rounded-3xl border border-zinc-800 bg-zinc-950 text-white overflow-hidden shadow-2xl ${className}`}>
      {/* Category Navigation Tabs */}
      <div className="grid grid-cols-3 border-b border-zinc-800 bg-zinc-900/50 p-1.5 gap-1.5">
        <button
          type="button"
          onClick={() => setActiveTab("school")}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "school"
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          }`}
        >
          <GraduationCap className="size-4 shrink-0" />
          <span className="truncate">1. School &amp; Board Exams</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("skills")}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "skills"
              ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          }`}
        >
          <Code2 className="size-4 shrink-0" />
          <span className="truncate">2. Skill Courses</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("jobs")}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "jobs"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30"
              : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
          }`}
        >
          <Briefcase className="size-4 shrink-0" />
          <span className="truncate">3. Verified Jobs</span>
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* =========================================================================
            CATEGORY 1: SCHOOL & BOARD EXAMS (CBSE, ICSE, State Boards Doubt Solver)
           ========================================================================= */}
        {activeTab === "school" && (
          <div className="space-y-5">
            <div className="border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
                <GraduationCap className="size-4" /> Category 1: School &amp; Board Exams
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Mathematics &amp; Science Doubt Solver
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Clear, step-by-step NCERT textbook explanations, standard formula derivations, and Indian board exam step-marking tips.
              </p>
            </div>

            {/* Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                  Target Board
                </label>
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
                >
                  <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                  <option value="ICSE">ICSE &amp; ISC (Council for CISCE)</option>
                  <option value="Maharashtra State Board">Maharashtra State Board</option>
                  <option value="UP State Board">UP State Board</option>
                  <option value="Bihar State Board">Bihar State Board</option>
                  <option value="West Bengal Board">West Bengal Board</option>
                  <option value="Tamil Nadu State Board">Tamil Nadu State Board</option>
                  <option value="Karnataka State Board">Karnataka State Board</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1.5 uppercase tracking-wider">
                  Subject Area
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-purple-400"
                >
                  <option value="Mathematics — Calculus">Mathematics: Differential &amp; Integral Calculus</option>
                  <option value="Mathematics — Algebra">Mathematics: Quadratic Equations &amp; Matrices</option>
                  <option value="Mathematics — Coordinate Geometry">Mathematics: Straight Lines &amp; Conic Sections</option>
                  <option value="Physics — Mechanics & Optics">Physics: Mechanics, Current Electricity &amp; Optics</option>
                  <option value="Chemistry — Organic & Inorganic">Chemistry: Chemical Bonding &amp; Organic Mechanisms</option>
                  <option value="Biology — Genetics & Life Sciences">Biology: Genetics &amp; Cell Biology</option>
                </select>
              </div>
            </div>

            {/* Quick Prompt Starters */}
            <div>
              <span className="text-[11px] font-bold text-zinc-400 block mb-2 uppercase tracking-wider">
                Common Exam Doubts (Click to load):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Explain Rolle's Theorem and Lagrange's MVT with step-by-step NCERT marking steps.",
                  "How to solve current electricity Kirchhoff's loop rule numericals accurately?",
                  "Show step-by-step derivation for integration by parts with standard examples.",
                  "Explain balancing redox reactions in acidic medium using the ion-electron method.",
                ].map((doubt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQueryInput(doubt);
                      handleAsk(doubt);
                    }}
                    className="p-3 text-left rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-purple-950/30 hover:border-purple-500/40 text-xs text-zinc-300 transition flex items-center justify-between gap-2"
                  >
                    <span className="line-clamp-2">{doubt}</span>
                    <ArrowRight className="size-3.5 text-zinc-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Doubt Input Box */}
            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-bold text-zinc-300 block uppercase tracking-wider">
                Type Your Specific Doubt
              </label>
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 focus-within:border-purple-400 transition shadow-inner">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAsk();
                    }
                  }}
                  placeholder={`Ask a question in ${selectedSubject}... (e.g., 'Derivative of sin(x^2)')`}
                  className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAsk()}
                  disabled={!queryInput.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Send className="size-3.5" /> Solve
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            CATEGORY 2: SKILL COURSES (TypeScript, Python, Spoken English)
           ========================================================================= */}
        {activeTab === "skills" && (
          <div className="space-y-5">
            <div className="border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Code2 className="size-4" /> Category 2: Practical Skill Courses
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                TypeScript, Python &amp; Spoken English
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Zero fluff. Production code syntax, full-stack design patterns, and professional workplace communication.
              </p>
            </div>

            {/* Skill Selector Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { id: "TypeScript", label: "Full-Stack TypeScript", badge: "Web & React" },
                { id: "Python", label: "Python Programming", badge: "Data & APIs" },
                { id: "Spoken English", label: "Spoken English", badge: "Workplace & Interviews" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSkill(s.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition border flex items-center gap-2 ${
                    selectedSkill === s.id
                      ? "bg-amber-500 text-black border-amber-400 font-black shadow-md shadow-amber-500/20"
                      : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <span>{s.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${selectedSkill === s.id ? "bg-black/20 text-black" : "bg-zinc-800 text-zinc-400"}`}>
                    {s.badge}
                  </span>
                </button>
              ))}
            </div>

            {/* Curriculum breakdown based on selected skill */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                {selectedSkill} Core Practical Modules:
              </h3>

              {selectedSkill === "TypeScript" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block">1. Strict Generics &amp; Types</span>
                    <p className="text-zinc-400 text-[11px]">Type narrowing, mapped types, keyof, conditional types.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block">2. React + TypeScript</span>
                    <p className="text-zinc-400 text-[11px]">Typed props, hooks, context patterns, event handling.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block">3. Safe Integer Paise Math</span>
                    <p className="text-zinc-400 text-[11px]">Financial precision, cents/paise arithmetic, zero floats.</p>
                  </div>
                </div>
              )}

              {selectedSkill === "Python" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block">1. Idiomatic Python 3</span>
                    <p className="text-zinc-400 text-[11px]">Comprehensions, generators, context managers, decorators.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block">2. Backend APIs</span>
                    <p className="text-zinc-400 text-[11px]">FastAPI routing, Pydantic schemas, database queries.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block">3. Data &amp; Automation</span>
                    <p className="text-zinc-400 text-[11px]">Pandas, CSV parsing, HTTP requests, scheduled scripts.</p>
                  </div>
                </div>
              )}

              {selectedSkill === "Spoken English" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block">1. Interview Confidence</span>
                    <p className="text-zinc-400 text-[11px]">STAR method for behavioural questions, self-introduction.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block">2. Business Communication</span>
                    <p className="text-zinc-400 text-[11px]">Concise email drafting, client updates, Slack etiquette.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block">3. Fluency &amp; Grammar</span>
                    <p className="text-zinc-400 text-[11px]">Correcting tense switches, prepositions, and active voice.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Practice Query */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-zinc-300 block uppercase tracking-wider">
                Ask a {selectedSkill} question
              </label>
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 focus-within:border-amber-400 transition shadow-inner">
                <input
                  type="text"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAsk();
                    }
                  }}
                  placeholder={`e.g., 'How do I use Pick and Omit in TypeScript?' or 'STAR answer for conflict'`}
                  className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAsk()}
                  disabled={!queryInput.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-black transition flex items-center gap-1.5"
                >
                  <Send className="size-3.5" /> Ask Copilot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            CATEGORY 3: VERIFIED FLEET & KITCHEN JOBS (₹18,000 – ₹30,000/mo, Weekly Payouts)
           ========================================================================= */}
        {activeTab === "jobs" && (
          <div className="space-y-5">
            <div className="border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <Briefcase className="size-4" /> Category 3: Verified Fleet &amp; Kitchen Jobs
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                Real Roles · ₹18,000 – ₹30,000/mo · Weekly Payouts
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Guaranteed genuine payouts settled weekly to your bank or UPI. Fast 1-tap application with direct employer verification.
              </p>
            </div>

            {/* Jobs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {VERIFIED_PRACTICAL_JOBS.map((job) => {
                const isApplied = appliedJobIds.includes(job.id);
                return (
                  <div
                    key={job.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-emerald-500/40 transition flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                          {job.category}
                        </span>
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <Calendar className="size-3 text-emerald-400" /> Weekly Payouts
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-white mt-2">{job.title}</h3>
                      <p className="text-xs font-mono font-bold text-emerald-300 mt-0.5">
                        {job.payoutBand}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">{job.location}</p>
                      <p className="text-xs text-zinc-300 mt-2 line-clamp-2">{job.description}</p>
                    </div>

                    <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-zinc-400">
                        {job.openings} active openings
                      </span>

                      {isApplied ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-xl border border-amber-400/30">
                          <Clock className="size-3" /> Application Under Review
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedJob(job)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition active:scale-95 shadow-md shadow-emerald-500/20"
                        >
                          1-Tap Apply ➔
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 1-Tap Job Application Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleApplyJob}
            className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 text-white space-y-4 shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  {selectedJob.category} · Verified Role
                </span>
                <h3 className="text-base font-black text-white mt-0.5">{selectedJob.title}</h3>
                <p className="text-xs font-mono font-bold text-emerald-300 mt-0.5">
                  {selectedJob.payoutBand} · {selectedJob.payoutSchedule}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-zinc-300">
              <p className="font-semibold text-white">Prerequisites:</p>
              <ul className="list-disc pl-5 space-y-1">
                {selectedJob.requirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                  Full Name as per ID *
                </label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                  Phone Number (for SMS &amp; WhatsApp Onboarding) *
                </label>
                <input
                  type="tel"
                  required
                  value={applicantContact}
                  onChange={(e) => setApplicantContact(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-300 block mb-1">
                  Current City / Preferred Hub Area
                </label>
                <input
                  type="text"
                  value={applicantCity}
                  onChange={(e) => setApplicantCity(e.target.value)}
                  placeholder="e.g. Bangalore South, Delhi NCR, Mumbai Central"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 bg-zinc-900/80 border border-zinc-800 rounded-xl p-2.5">
              Weekly settlements are processed via verified bank transfer or UPI after completion of shifts and trip validation.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition shadow-md shadow-emerald-500/20"
              >
                Submit Application ➔
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
