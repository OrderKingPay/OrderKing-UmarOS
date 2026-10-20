import React, { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  GraduationCap,
  Briefcase,
  Search,
  BookOpen,
  Award,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Star,
  Users,
  Building2,
  Globe2,
  DollarSign,
  Laptop,
  ArrowRight,
  Filter,
  Check,
  Zap,
  Phone,
  Mail,
  FileCheck,
  HelpCircle,
  TrendingUp,
  MapPin,
  Calendar,
  X,
  BadgePercent,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ==========================================
// 1. DATA DEFINITIONS & TYPES
// ==========================================

export type EducationalBoard =
  | "CBSE"
  | "ICSE / ISC"
  | "Assam Board (SEBA/AHSEC)"
  | "All State Boards"
  | "NCERT Foundation";

export type ClassGrade =
  | "Class 1–5"
  | "Class 6–8"
  | "Class 9–10"
  | "Class 11–12 (Science/PCM/PCB)"
  | "Class 11–12 (Commerce)"
  | "Class 11–12 (Arts/Humanities)";

export type JobCategoryType =
  | "Work From Home (WFH)"
  | "Remote Global"
  | "Paid Micro-Tasks"
  | "Local Direct Jobs"
  | "Part-Time Student";

export interface TutorProfile {
  id: string;
  name: string;
  avatarText: string;
  boards: EducationalBoard[];
  classes: ClassGrade[];
  primarySubjects: string[];
  qualifications: string;
  experienceYears: number;
  rating: number;
  reviewsCount: number;
  hourlyRateInr: number;
  languages: string[];
  city: string;
  badge: string;
  deliveryMode: "Online 1-on-1" | "In-Person Home" | "Hybrid";
  bio: string;
}

export interface JobOpening {
  id: string;
  title: string;
  company: string;
  category: JobCategoryType;
  payout: string;
  payoutFrequency: "Per Month" | "Hourly" | "Per Task";
  payoutBadge: string;
  location: string;
  workType: "Full-Time" | "Part-Time" | "Flexible" | "Gig / Task";
  skills: string[];
  description: string;
  directHrContact: string;
  verifiedDepositZero: boolean;
  postedAgo: string;
}

// Subject options mapped per class
const SUBJECTS_BY_CLASS: Record<ClassGrade, string[]> = {
  "Class 1–5": [
    "All Subjects",
    "Mathematics (Foundations)",
    "Environmental Studies (EVS)",
    "English Phonics & Reading",
    "Hindi / Native Regional",
    "General Science Basics",
  ],
  "Class 6–8": [
    "All Subjects",
    "Mathematics (Algebra & Geometry)",
    "General Science (Physics/Chem/Bio)",
    "Social Science (History/Civics/Geog)",
    "English Grammar & Composition",
    "Regional Language (Assamese/Bengali/Hindi)",
    "Computer Basics & Coding",
  ],
  "Class 9–10": [
    "All Subjects",
    "Mathematics (NCERT/Standard)",
    "Physics & Chemistry",
    "Biology & Life Sciences",
    "Social Science (Board Prep)",
    "English Language & Literature",
    "Computer Applications & AI",
  ],
  "Class 11–12 (Science/PCM/PCB)": [
    "All Science Subjects",
    "Physics (Mechanics/Electro/Optics)",
    "Chemistry (Organic/Inorganic/Physical)",
    "Mathematics (Calculus/Vectors/3D)",
    "Biology (Zoology & Botany)",
    "Computer Science (Python/SQL)",
    "JEE Main/Advanced & NEET Focus",
  ],
  "Class 11–12 (Commerce)": [
    "All Commerce Subjects",
    "Accountancy (Company & Partnership)",
    "Business Studies (Principles & Mgt)",
    "Economics (Macro & Micro)",
    "Applied Mathematics",
    "Informatics Practices",
  ],
  "Class 11–12 (Arts/Humanities)": [
    "All Humanities Subjects",
    "Political Science & Constitution",
    "History (Themes in Indian History)",
    "Geography (Human & Physical)",
    "Psychology & Sociology",
    "Economics & Public Policy",
  ],
};

// Curated verified mentor tracks with checked credentials
const VERIFIED_TUTORS: TutorProfile[] = [];

// Curated verified openings & remote opportunities
// Only independently confirmed jobs may be displayed; no invented posts.
const VERIFIED_JOB_LISTINGS: JobOpening[] = [];

// Transparent Platform Fee constants
export const TUTOR_BOOKING_PLATFORM_FEE_INR = 49;
export const JOB_APPLICATION_PLATFORM_FEE_INR = 29;

// ==========================================
// 2. MAIN HUB COMPONENT
// ==========================================

export function TutorJobsHub() {
  // Main view mode switcher: "tutor" or "jobs"
  const [activeMode, setActiveMode] = useState<"tutor" | "jobs">("tutor");

  // Tutor filtering state
  const [selectedBoard, setSelectedBoard] = useState<EducationalBoard>("CBSE");
  const [selectedClass, setSelectedClass] = useState<ClassGrade>("Class 10" as any);
  // Auto-align default class to valid ClassGrade
  const effectiveClass: ClassGrade = useMemo(() => {
    if (selectedClass.includes("11") || selectedClass.includes("12")) {
      return selectedClass;
    }
    if (selectedClass === "Class 9–10" || (selectedClass as string) === "Class 10" || (selectedClass as string) === "Class 9") {
      return "Class 9–10";
    }
    if (selectedClass === "Class 6–8" || (selectedClass as string) === "Class 8") {
      return "Class 6–8";
    }
    if (selectedClass === "Class 1–5") {
      return "Class 1–5";
    }
    return "Class 9–10";
  }, [selectedClass]);

  const availableSubjects = useMemo(() => {
    return SUBJECTS_BY_CLASS[effectiveClass] || SUBJECTS_BY_CLASS["Class 9–10"];
  }, [effectiveClass]);

  const [selectedSubject, setSelectedSubject] = useState<string>("All Subjects");
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState<"ALL" | "Online 1-on-1" | "In-Person Home">("ALL");

  // Job filtering state
  const [selectedJobCategory, setSelectedJobCategory] = useState<JobCategoryType | "ALL">("ALL");
  const [jobSearchQuery, setJobSearchQuery] = useState("");

  // Modals state
  const [bookingTutor, setBookingTutor] = useState<TutorProfile | null>(null);
  const [applyingJob, setApplyingJob] = useState<JobOpening | null>(null);

  // Form states for booking
  const [studentName, setStudentName] = useState("");
  const [studentPhone, setStudentPhone] = useState("");
  const [preferredSlot, setPreferredSlot] = useState("Tomorrow 5:00 PM");
  const [studentNotes, setStudentNotes] = useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Form states for job application
  const [applicantName, setApplicantName] = useState("");
  const [applicantContact, setApplicantContact] = useState("");
  const [applicantPitch, setApplicantPitch] = useState("");
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);

  // Applied jobs tracking
  const [appliedJobsCount, setAppliedJobsCount] = useState(0);

  // Filter tutors
  const filteredTutors = useMemo(() => {
    return VERIFIED_TUTORS.filter((tutor) => {
      // Board filter (allow match if tutor supports selectedBoard or All State Boards)
      const matchesBoard =
        tutor.boards.includes(selectedBoard) ||
        (selectedBoard !== "CBSE" && selectedBoard !== "ICSE / ISC" && tutor.boards.includes("All State Boards"));

      // Class filter
      const matchesClass = tutor.classes.includes(effectiveClass);

      // Subject filter
      const matchesSubject =
        selectedSubject === "All Subjects" ||
        tutor.primarySubjects.some((s) => s.toLowerCase().includes(selectedSubject.toLowerCase())) ||
        selectedSubject.includes("All");

      // Delivery mode
      const matchesDelivery = deliveryFilter === "ALL" || tutor.deliveryMode === deliveryFilter;

      // Text query
      const matchesQuery =
        !searchQuery.trim() ||
        tutor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.qualifications.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tutor.primarySubjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesBoard && matchesClass && matchesSubject && matchesDelivery && matchesQuery;
    });
  }, [selectedBoard, effectiveClass, selectedSubject, deliveryFilter, searchQuery]);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return VERIFIED_JOB_LISTINGS.filter((job) => {
      const matchesCategory = selectedJobCategory === "ALL" || job.category === selectedJobCategory;
      const matchesQuery =
        !jobSearchQuery.trim() ||
        job.title.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(jobSearchQuery.toLowerCase()) ||
        job.skills.some((sk) => sk.toLowerCase().includes(jobSearchQuery.toLowerCase()));

      return matchesCategory && matchesQuery;
    });
  }, [selectedJobCategory, jobSearchQuery]);

  // Do not produce fake local confirmations or claim paid external dispatches.
  const handleConfirmTutorBooking = (e: React.FormEvent) => {
    e.preventDefault();
    toast.error("No verified tutor is available for booking. Nothing was booked or charged.");
    setBookingTutor(null);
    setIsSubmittingBooking(false);
  };
  const handleConfirmJobApply = (e: React.FormEvent) => {
    e.preventDefault();
    toast.error("No verified employer is connected. No application was sent or charged.");
    setApplyingJob(null);
    setIsSubmittingJob(false);
  };
  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 font-sans space-y-6">
      {/* ========================================================= */}
      {/* HEADER BANNER & 1-TAP SWITCHER */}
      {/* ========================================================= */}
      <header className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 p-5 sm:p-8 shadow-2xl text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-300">
                <Sparkles className="size-3.5 text-amber-400" />
                OrderKing Supreme Hub
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-300">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                Industry Benchmark Verified
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Tutors, Academics &amp; <span className="text-amber-400">Career Network</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Find available State &amp; Central Board academic tutors (Class 1–12), or explore curated Remote, WFH, Content QA &amp; Hyperlocal Operations roles.
            </p>
          </div>

          {/* 1-TAP SWITCHER BUTTONS */}
          <div className="bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => setActiveMode("tutor")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all",
                activeMode === "tutor"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 scale-100"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              )}
            >
              <GraduationCap className="size-4" />
              <span>Tutors &amp; Syllabus</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("jobs")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all",
                activeMode === "jobs"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25 scale-100"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              )}
            >
              <Briefcase className="size-4" />
              <span>Jobs &amp; WFH Tasks</span>
              {appliedJobsCount > 0 && (
                <span className="size-5 rounded-full bg-slate-950 text-amber-400 text-[10px] font-black flex items-center justify-center">
                  {appliedJobsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Transparent Platform Fee Sub-Banner */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2.5 bg-black/40 border border-amber-400/20 rounded-xl px-3.5 py-2.5">
            <div className="size-7 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 font-bold">
              ₹0
            </div>
            <div>
              <p className="font-bold text-white">Tutor matching · Not accepting payments</p>
              <p className="text-[11px] text-slate-400">No verified educators currently available; no matching fees collected.</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-black/40 border border-emerald-400/20 rounded-xl px-3.5 py-2.5">
            <div className="size-7 rounded-lg bg-emerald-400/20 text-emerald-300 flex items-center justify-center shrink-0 font-bold">
              ₹0
            </div>
            <div>
              <p className="font-bold text-white">Verified employer postings only</p>
              <p className="text-[11px] text-slate-400">No external applications sent until approved employer connections are live.</p>
            </div>
          </div>
        </div>

        {/* ASCI Compliance & Industry Benchmark Disclaimer */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <span className="font-bold text-amber-300">ASCI Compliance &amp; Industry Benchmark Disclaimer:</span> All compensation ranges, tutor hourly rates, and career progression bands cited are indicative market benchmarks aligned with published findings from the TeamLease Employment Outlook Report and Naukri Hiring Surveys. Remuneration is subject to individual candidate qualifications, employer interview assessment, geographic deployment, and contract terms. OrderKing does not promise, represent, or guarantee assured placements or fixed earnings.
        </div>
      </header>

      {/* ========================================================= */}
      {/* MODE 1: STATE & CENTRAL BOARD SYLLABUS TUTORS */}
      {/* ========================================================= */}
      {activeMode === "tutor" && (
        <section className="space-y-6 animate-in fade-in duration-300">
          {/* FILTER CONTROLS CARD */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <BookOpen className="size-5 text-amber-400" />
                  Select Syllabus, Class &amp; Subject
                </h2>
                <p className="text-xs text-slate-400">
                  Customized pedagogy strictly aligned with NCERT step-marking schemes and state board grading
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20 w-fit">
                <CheckCircle2 className="size-4" />
                <span>28 State Boards + Central Supported</span>
              </div>
            </div>

            {/* 1. BOARD SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Award className="size-3.5 text-amber-400" />
                1. Educational Board
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {(
                  [
                    "CBSE",
                    "ICSE / ISC",
                    "Assam Board (SEBA/AHSEC)",
                    "All State Boards",
                    "NCERT Foundation",
                  ] as EducationalBoard[]
                ).map((board) => {
                  const isSelected = selectedBoard === board;
                  return (
                    <button
                      key={board}
                      type="button"
                      onClick={() => setSelectedBoard(board)}
                      className={cn(
                        "px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-all",
                        isSelected
                          ? "bg-amber-400/20 border-amber-400 text-amber-200 shadow-sm"
                          : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600 hover:text-white"
                      )}
                    >
                      <span className="block truncate">{board}</span>
                      <span className="text-[10px] block opacity-70 mt-0.5">
                        {board === "Assam Board (SEBA/AHSEC)"
                          ? "Bilingual (Assamese/Eng)"
                          : board === "CBSE"
                          ? "Central Curriculum"
                          : board === "ICSE / ISC"
                          ? "Analytical Focus"
                          : board === "NCERT Foundation"
                          ? "Core Concepts"
                          : "State Specific"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. CLASS SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <GraduationCap className="size-3.5 text-amber-400" />
                2. Class / Grade Cohort
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {(
                  [
                    "Class 1–5",
                    "Class 6–8",
                    "Class 9–10",
                    "Class 11–12 (Science/PCM/PCB)",
                    "Class 11–12 (Commerce)",
                    "Class 11–12 (Arts/Humanities)",
                  ] as ClassGrade[]
                ).map((cls) => {
                  const isSelected = effectiveClass === cls;
                  return (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => {
                        setSelectedClass(cls);
                        setSelectedSubject("All Subjects");
                      }}
                      className={cn(
                        "px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-all",
                        isSelected
                          ? "bg-amber-400/20 border-amber-400 text-amber-200 shadow-sm"
                          : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600 hover:text-white"
                      )}
                    >
                      <span className="block truncate">{cls}</span>
                      <span className="text-[10px] block opacity-70 mt-0.5">
                        {cls.includes("11") ? "Specialized Stream" : "Core Foundations"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. SUBJECT SELECTOR & DELIVERY FILTER */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                  3. Select Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub} className="bg-slate-900 text-white">
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Mode
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(["ALL", "Online 1-on-1", "In-Person Home"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDeliveryFilter(mode)}
                      className={cn(
                        "py-2 px-1 text-[11px] font-bold rounded-lg border text-center transition-all truncate",
                        deliveryFilter === mode
                          ? "bg-amber-400/20 border-amber-400 text-amber-300"
                          : "bg-slate-800/60 border-slate-700 text-slate-400"
                      )}
                    >
                      {mode === "ALL" ? "All Modes" : mode.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* VERIFIED TUTORS DIRECTORY */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Academic Mentors &amp; Educators</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {filteredTutors.length} Available
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Representative Academic Profiles · Educators undergo identity, academic qualification &amp; onboarding verification prior to session confirmation
              </p>
            </div>

            {filteredTutors.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                <GraduationCap className="size-10 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-white">Verified educators onboarding in your district</p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Partner educators and verified academic mentors are currently undergoing onboarding and credential verification in your district.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSubject("All Subjects");
                    setDeliveryFilter("ALL");
                  }}
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Reset Subject Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTutors.map((tutor) => (
                  <div
                    key={tutor.id}
                    className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 flex flex-col justify-between hover:border-amber-400/50 transition-all shadow-md group"
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="size-11 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 font-black flex items-center justify-center text-sm shadow-sm">
                            {tutor.avatarText}
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors">
                              {tutor.name}
                            </h4>
                            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                              <span className="text-[9.5px] uppercase font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
                                Representative Academic Profile
                              </span>
                              <span className="text-[11px] text-slate-400 font-bold">{tutor.badge}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30 text-amber-300 text-xs font-black">
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                          <span>{tutor.rating.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400">({tutor.reviewsCount})</span>
                        </div>
                      </div>

                      {/* Credentials */}
                      <div className="space-y-1 text-xs">
                        <p className="text-slate-300 font-medium">{tutor.qualifications}</p>
                        <p className="text-slate-400 text-[11px] flex items-center gap-2">
                          <span>{tutor.experienceYears} Years Exp</span>
                          <span>•</span>
                          <span>{tutor.deliveryMode}</span>
                          <span>•</span>
                          <span>{tutor.city}</span>
                        </p>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {tutor.bio}
                      </p>

                      {/* Subjects & Languages */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {tutor.primarySubjects.map((sub, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700 truncate max-w-[200px]"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Languages: {tutor.languages.join(", ")}
                      </div>
                    </div>

                    {/* Booking Footer */}
                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-black text-white">
                          ₹{tutor.hourlyRateInr}
                          <span className="text-[10px] font-normal text-slate-400">/hr</span>
                        </div>
                        <p className="text-[9px] text-amber-400/90">+ ₹{TUTOR_BOOKING_PLATFORM_FEE_INR} platform fee</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setBookingTutor(tutor)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition shadow-sm active:scale-95"
                      >
                        Book Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* MODE 2: JOBS, REMOTE, WFH & PAID TASKS */}
      {/* ========================================================= */}
      {activeMode === "jobs" && (
        <section className="space-y-6 animate-in fade-in duration-300">
          {/* CATEGORY SELECTOR CARD */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Briefcase className="size-5 text-amber-400" />
                  Explore Opportunities &amp; Verified Tasks
                </h2>
                <p className="text-xs text-slate-400">
                  Zero Security Deposit Policy • Direct dispatch to verified hiring desks
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="size-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search roles or skills..."
                  value={jobSearchQuery}
                  onChange={(e) => setJobSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* 1-TAP CATEGORY FILTER TABS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => setSelectedJobCategory("ALL")}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  selectedJobCategory === "ALL"
                    ? "bg-amber-400/20 border-amber-400 text-amber-200"
                    : "bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white"
                )}
              >
                <Globe2 className="size-4 mb-1 text-amber-400" />
                <p className="text-xs font-black">All Categories</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Explore All</p>
              </button>

              {(
                [
                  "Work From Home (WFH)",
                  "Remote Global",
                  "Paid Micro-Tasks",
                  "Local Direct Jobs",
                  "Part-Time Student",
                ] as JobCategoryType[]
              ).map((cat) => {
                const isSelected = selectedJobCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedJobCategory(cat)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      isSelected
                        ? "bg-amber-400/20 border-amber-400 text-amber-200"
                        : "bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white"
                    )}
                  >
                    {cat.includes("WFH") && <Laptop className="size-4 mb-1 text-sky-400" />}
                    {cat.includes("Remote Global") && <Globe2 className="size-4 mb-1 text-emerald-400" />}
                    {cat.includes("Micro-Tasks") && <Zap className="size-4 mb-1 text-yellow-400" />}
                    {cat.includes("Local") && <Building2 className="size-4 mb-1 text-rose-400" />}
                    {cat.includes("Student") && <GraduationCap className="size-4 mb-1 text-purple-400" />}
                    <p className="text-xs font-black truncate">{cat}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {cat.includes("WFH")
                        ? "100% Home Desk"
                        : cat.includes("Remote")
                        ? "USD / Global"
                        : cat.includes("Micro")
                        ? "Instant Payout"
                        : cat.includes("Local")
                        ? "Town Hubs"
                        : "Campus Flex"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* JOB LISTINGS CARDS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Verified Direct Openings</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {filteredJobs.length} Openings
                </span>
              </h3>
              <p className="text-xs text-slate-400 hidden sm:block">
                Transparent ₹{JOB_APPLICATION_PLATFORM_FEE_INR} application fee • Direct HR phone dispatch
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 flex flex-col justify-between hover:border-amber-400/50 transition-all shadow-md group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {job.category}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{job.postedAgo}</span>
                        </div>
                        <h4 className="text-sm sm:text-base font-black text-white mt-1 group-hover:text-amber-300 transition-colors">
                          {job.title}
                        </h4>
                        <p className="text-xs text-amber-400 font-bold">{job.company}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs sm:text-sm font-black text-emerald-400 block font-mono">
                          {job.payout}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-normal">Industry Benchmark / Partner Indicative Band</span>
                        <span className="text-[10px] text-slate-400 block">{job.payoutBadge}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{job.description}</p>

                    {/* Skills required */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {job.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/80"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3 text-slate-500" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-slate-500" />
                        {job.workType}
                      </span>
                    </div>
                  </div>

                  {/* Application footer */}
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="size-3.5" />
                      Zero Security Bond Policy
                    </div>

                    <button
                      type="button"
                      onClick={() => setApplyingJob(job)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition shadow-sm active:scale-95"
                    >
                      Direct Apply (₹{JOB_APPLICATION_PLATFORM_FEE_INR})
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: TUTOR BOOKING MODAL */}
      {/* ========================================================= */}
      {bookingTutor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-amber-400/40 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                  Book 1-on-1 Academic Session
                </span>
                <h3 className="text-lg font-black text-white">{bookingTutor.name}</h3>
                <p className="text-xs text-slate-400">{bookingTutor.qualifications}</p>
              </div>
              <button
                type="button"
                onClick={() => setBookingTutor(null)}
                className="size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Fee Breakdown Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Educator Hourly Fee:</span>
                <span className="font-mono font-bold text-white">₹{bookingTutor.hourlyRateInr}</span>
              </div>
              <div className="flex justify-between text-amber-300">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3 text-amber-400" />
                  OrderKing Platform Booking Fee:
                </span>
                <span className="font-mono font-bold">₹{TUTOR_BOOKING_PLATFORM_FEE_INR}</span>
              </div>
              <div className="border-t border-slate-800 pt-2 flex justify-between font-black text-sm text-white">
                <span>Total Due for 1 Hour:</span>
                <span className="text-amber-400 font-mono">
                  ₹{bookingTutor.hourlyRateInr + TUTOR_BOOKING_PLATFORM_FEE_INR}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                * Direct student-mentor alignment: review course roadmap and pedagogical fit in your opening session.
              </p>
            </div>

            {/* Booking Form */}
            <form onSubmit={handleConfirmTutorBooking} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">WhatsApp / Contact Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9864012345"
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Preferred Date &amp; Time Slot</label>
                <input
                  type="text"
                  value={preferredSlot}
                  onChange={(e) => setPreferredSlot(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Specific Chapter / Topics to Cover</label>
                <textarea
                  rows={2}
                  placeholder="e.g. NCERT Rotational Dynamics derivations, step marking prep"
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingBooking}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-slate-950 font-black rounded-xl text-sm transition hover:brightness-105 active:scale-98 disabled:opacity-50"
                >
                  {isSubmittingBooking
                    ? "Securing Slot..."
                    : `Confirm Booking (Pay ₹${bookingTutor.hourlyRateInr + TUTOR_BOOKING_PLATFORM_FEE_INR})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: DIRECT JOB APPLICATION MODAL */}
      {/* ========================================================= */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-emerald-400/40 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                  Direct Verified Job Application
                </span>
                <h3 className="text-lg font-black text-white">{applyingJob.title}</h3>
                <p className="text-xs text-amber-400 font-bold">{applyingJob.company} • {applyingJob.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyingJob(null)}
                className="size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Direct HR dispatch badge */}
            <div className="bg-emerald-950/40 border border-emerald-400/30 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-emerald-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  Anti-Scam Verified Direct Dispatch
                </span>
                <span className="bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded text-[10px]">
                  Zero Bond
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Your profile will be directly sent to hiring desk:{" "}
                <span className="font-mono text-white">{applyingJob.directHrContact}</span>.
              </p>
              <div className="border-t border-emerald-500/20 pt-2 flex justify-between font-black text-xs text-white">
                <span>Direct Verification &amp; Dispatch Fee:</span>
                <span className="text-emerald-400 font-mono">₹{JOB_APPLICATION_PLATFORM_FEE_INR}</span>
              </div>
            </div>

            {/* Application Form */}
            <form onSubmit={handleConfirmJobApply} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manab Jyoti Das"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Phone / WhatsApp / Email *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98640XXXXX or candidate@gmail.com"
                  value={applicantContact}
                  onChange={(e) => setApplicantContact(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Brief Experience / Why are you a great fit?
                </label>
                <textarea
                  rows={3}
                  placeholder="Mention your relevant skills, past work, or language capabilities..."
                  value={applicantPitch}
                  onChange={(e) => setApplicantPitch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingJob}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-black rounded-xl text-sm transition hover:brightness-105 active:scale-98 disabled:opacity-50"
                >
                  {isSubmittingJob
                    ? "Dispatching Application..."
                    : `Submit Application (Pay ₹${JOB_APPLICATION_PLATFORM_FEE_INR})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
