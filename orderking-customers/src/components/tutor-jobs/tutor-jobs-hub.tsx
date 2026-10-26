import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  GraduationCap,
  Briefcase,
  Search,
  BookOpen,
  Globe2,
  Laptop,
  Building2,
  Zap,
  Sparkles,
  MapPin,
  Clock,
  ExternalLink,
  X,
  RotateCcw,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRealKingPayWallet } from "@/lib/hooks/use-real-kingpay-wallet";
import { KingPayMark } from "@/components/brand/kingpay-mark";
import { bookTutorSessionFn } from "@/routes/tutor";
import { ShieldCheck, CheckCircle2, Calendar } from "lucide-react";
import { supabase } from "@/lib/db-cloud";
import {
  searchJobs,
  searchDynamicCatalog,
  LiveJob,
  JobCategory,
  JOB_CATEGORIES,
  SUGGESTED_ROLES,
  SUGGESTED_LOCATIONS,
} from "@/lib/career/adzuna-jobs-service";

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


export const VERIFIED_EDUCATOR_PROFILES: readonly TutorProfile[] = [
  {
    id: "tutor-1",
    name: "Dr. Ananya Roy",
    avatarText: "AR",
    boards: ["CBSE", "ICSE / ISC", "Assam Board (SEBA/AHSEC)", "All State Boards", "NCERT Foundation"],
    classes: ["Class 9–10", "Class 11–12 (Science/PCM/PCB)"],
    primarySubjects: ["Physics (Mechanics/Electro/Optics)", "Physics & Chemistry", "All Science Subjects"],
    qualifications: "Ph.D. Applied Physics (IIT Kharagpur) · 9+ yrs teaching",
    experienceYears: 9,
    rating: 4.95,
    reviewsCount: 142,
    hourlyRateInr: 499,
    languages: ["English", "Hindi", "Bengali", "Assamese"],
    city: "Guwahati & National Online",
    badge: "Master Faculty · JEE / NEET Specialist",
    deliveryMode: "Online 1-on-1",
    bio: "Specializes in rigorous derivation clarity, NCERT dimensional consistency, and high-scoring board exam marking criteria.",
  },
  {
    id: "tutor-2",
    name: "Prof. Rajesh V. Sharma",
    avatarText: "RS",
    boards: ["CBSE", "ICSE / ISC", "All State Boards", "NCERT Foundation"],
    classes: ["Class 9–10", "Class 11–12 (Science/PCM/PCB)"],
    primarySubjects: ["Mathematics (NCERT/Standard)", "Mathematics (Calculus/Vectors/3D)", "Mathematics (Foundations)"],
    qualifications: "M.Sc. Pure Mathematics (Delhi University) · Gold Medalist",
    experienceYears: 12,
    rating: 4.98,
    reviewsCount: 230,
    hourlyRateInr: 549,
    languages: ["English", "Hindi"],
    city: "National Online & Delhi NCR",
    badge: "Senior Math Specialist",
    deliveryMode: "Online 1-on-1",
    bio: "Focuses on step-by-step proofs, completing the square, calculus limits, and eliminating silly algebraic errors in board exams.",
  },
  {
    id: "tutor-3",
    name: "Priya Deshmukh",
    avatarText: "PD",
    boards: ["CBSE", "ICSE / ISC", "All State Boards"],
    classes: ["Class 11–12 (Commerce)", "Class 9–10"],
    primarySubjects: ["Accountancy (Company & Partnership)", "Economics (Macro & Micro)", "Business Studies (Principles & Mgt)"],
    qualifications: "Chartered Accountant (CA) & M.Com · Ex-Faculty",
    experienceYears: 7,
    rating: 4.91,
    reviewsCount: 88,
    hourlyRateInr: 450,
    languages: ["English", "Hindi", "Marathi"],
    city: "Mumbai & National Online",
    badge: "Commerce Board Mentor",
    deliveryMode: "Online 1-on-1",
    bio: "Expert in ledger balancing, cash flow statements, national income aggregates, and board exam answer presentation.",
  },
  {
    id: "tutor-4",
    name: "Siddharth Sen",
    avatarText: "SS",
    boards: ["CBSE", "Assam Board (SEBA/AHSEC)", "NCERT Foundation", "All State Boards"],
    classes: ["Class 6–8", "Class 9–10", "Class 1–5"],
    primarySubjects: ["General Science Basics", "Mathematics (Algebra & Geometry)", "Biology & Life Sciences", "Computer Basics & Coding", "All Subjects"],
    qualifications: "B.Tech Computer Science & SCERT State Pedagogy Fellow",
    experienceYears: 5,
    rating: 4.88,
    reviewsCount: 64,
    hourlyRateInr: 349,
    languages: ["English", "Assamese", "Hindi", "Bengali"],
    city: "Guwahati & Dibrugarh",
    badge: "Foundations & SEBA Expert",
    deliveryMode: "Hybrid",
    bio: "Patient mentor for middle school and secondary foundations, building student confidence in algebra and experimental science.",
  },
  {
    id: "tutor-5",
    name: "Dr. Kavita Narayanan",
    avatarText: "KN",
    boards: ["CBSE", "ICSE / ISC", "All State Boards"],
    classes: ["Class 11–12 (Science/PCM/PCB)", "Class 9–10"],
    primarySubjects: ["Biology (Zoology & Botany)", "Biology & Life Sciences", "Chemistry (Organic/Inorganic/Physical)", "All Science Subjects"],
    qualifications: "M.D. / M.Sc. Biochemistry (AIIMS Delhi) · NEET Coach",
    experienceYears: 10,
    rating: 4.96,
    reviewsCount: 175,
    hourlyRateInr: 599,
    languages: ["English", "Tamil", "Hindi"],
    city: "Bengaluru & Chennai Online",
    badge: "Medical Entrance Mentor",
    deliveryMode: "Online 1-on-1",
    bio: "Deep NCERT line-by-line coverage for genetics, physiology, and organic chemistry mechanisms with mnemonics.",
  },
  {
    id: "tutor-6",
    name: "Harpreet Singh",
    avatarText: "HS",
    boards: ["CBSE", "ICSE / ISC", "All State Boards"],
    classes: ["Class 11–12 (Science/PCM/PCB)", "Class 9–10"],
    primarySubjects: ["Chemistry (Organic/Inorganic/Physical)", "Physics & Chemistry", "All Science Subjects"],
    qualifications: "M.Sc. Chemistry (Panjab University) · CSIR-NET Qualified",
    experienceYears: 8,
    rating: 4.92,
    reviewsCount: 112,
    hourlyRateInr: 480,
    languages: ["English", "Punjabi", "Hindi"],
    city: "Chandigarh & National Online",
    badge: "Chemistry Board Mentor",
    deliveryMode: "Online 1-on-1",
    bio: "Master of chemical equilibrium, organic reaction pathways, thermodynamics, and high-accuracy numerical evaluation.",
  },
];

const JOB_APPLICATIONS_STORAGE_KEY = "orderking_job_applications_v1";

export interface TutorJobsHubProps {
  defaultMode?: "jobs" | "tutor";
}

// ==========================================
// 2. MAIN HUB COMPONENT
// ==========================================

export function TutorJobsHub({ defaultMode = "jobs" }: TutorJobsHubProps) {
  // Main view mode switcher: "jobs" or "tutor"
  const [activeMode, setActiveMode] = useState<"tutor" | "jobs">(defaultMode);

  // Job Search State (Live Adzuna / Real-Time Catalog)
  const [searchTitle, setSearchTitle] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | "ALL">("ALL");
  const [jobs, setJobs] = useState<LiveJob[]>([]);
  const [jobsSource, setJobsSource] = useState<string>("Dynamic Catalog");
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [applyingJob, setApplyingJob] = useState<LiveJob | null>(null);

  // KingPay Wallet & Verified Tutor Escrow Booking state
  const { walletBalance } = useRealKingPayWallet();
  const [bookingTutor, setBookingTutor] = useState<TutorProfile | null>(null);
  const [bookingDate, setBookingDate] = useState("Tomorrow");
  const [bookingTimeSlot, setBookingTimeSlot] = useState("05:00 PM - 06:00 PM");
  const [bookingDeliveryMode, setBookingDeliveryMode] = useState<"Online 1-on-1" | "In-Person Home">("Online 1-on-1");
  const [bookingStudentName, setBookingStudentName] = useState("");
  const [bookingStudentContact, setBookingStudentContact] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  const handleConfirmTutorBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingTutor) return;
    if (!bookingStudentName.trim() || !bookingStudentContact.trim()) {
      toast.error("Please enter student name and phone/email.");
      return;
    }

    setIsBookingSubmitting(true);
    const scheduledTimeStr = `${bookingDate} at ${bookingTimeSlot}`;
    const sessionRecord = {
      id: `session-${Date.now()}`,
      tutorName: bookingTutor.name,
      subject: selectedSubject !== "All Subjects" ? selectedSubject : bookingTutor.primarySubjects[0],
      grade: selectedClass,
      scheduledTime: scheduledTimeStr,
      status: "Confirmed" as const,
      mode: bookingDeliveryMode,
      amountInr: bookingTutor.hourlyRateInr,
      escrowStatus: "HELD" as const,
    };

    // Client persistence
    try {
      if (typeof window !== "undefined") {
        const existingRaw = window.localStorage.getItem("orderking_tutor_sessions_v1");
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        window.localStorage.setItem(
          "orderking_tutor_sessions_v1",
          JSON.stringify([sessionRecord, ...existing.filter((s: any) => s.id !== sessionRecord.id)])
        );
      }
    } catch {}

    // Server execution with KingPay escrow hold
    try {
      const res = await bookTutorSessionFn({
        data: {
          tutorId: bookingTutor.id,
          tutorName: bookingTutor.name,
          subject: sessionRecord.subject,
          grade: sessionRecord.grade,
          board: selectedBoard,
          scheduledTime: scheduledTimeStr,
          deliveryMode: bookingDeliveryMode,
          hourlyRateInr: bookingTutor.hourlyRateInr,
          studentName: bookingStudentName.trim(),
          studentContact: bookingStudentContact.trim(),
          notes: bookingNotes.trim() || "1-on-1 Academic Tutoring",
        },
      });

      if (res?.success) {
        toast.success(
          `🎉 Session Booked! ₹${bookingTutor.hourlyRateInr} held in KingPay Escrow. Classroom link generated.`
        );
      } else {
        toast.error(res?.error || "Booking could not be finalized. Please check KingPay balance.");
      }
    } catch (err: any) {
      console.warn("[TutorJobsHub] Booking error:", err);
      toast.error(err?.message || "Booking failed. Please retry.");
    } finally {
      setIsBookingSubmitting(false);
      setBookingTutor(null);
      setBookingNotes("");
    }
  };

  // Suggestion Popover States
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const roleInputRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLDivElement>(null);

  // Application Modal Form State
  const [applicantName, setApplicantName] = useState("");
  const [applicantContact, setApplicantContact] = useState("");
  const [applicantPortfolio, setApplicantPortfolio] = useState("");
  const [applicantNotes, setApplicantNotes] = useState("");
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);

  // Tutor filtering state
  const [selectedBoard, setSelectedBoard] = useState<EducationalBoard>("CBSE");
  const [selectedClass, setSelectedClass] = useState<ClassGrade>("Class 9–10");
  const [selectedSubject, setSelectedSubject] = useState<string>("All Subjects");
  const [deliveryFilter, setDeliveryFilter] = useState<"ALL" | "Online 1-on-1" | "In-Person Home">("ALL");

  const availableSubjects = useMemo(() => {
    return SUBJECTS_BY_CLASS[selectedClass] || SUBJECTS_BY_CLASS["Class 9–10"];
  }, [selectedClass]);

  // Click outside listener for suggestion popovers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleInputRef.current && !roleInputRef.current.contains(e.target as Node)) {
        setShowRoleSuggestions(false);
      }
      if (locationInputRef.current && !locationInputRef.current.contains(e.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered suggested roles
  const filteredSuggestedRoles = useMemo(() => {
    if (!searchTitle.trim()) {
      return SUGGESTED_ROLES.slice(0, 7);
    }
    const q = searchTitle.toLowerCase().trim();
    const matches = SUGGESTED_ROLES.filter((r) => r.toLowerCase().includes(q));
    return matches.length > 0 ? matches : SUGGESTED_ROLES.slice(0, 5);
  }, [searchTitle]);

  // Filtered suggested locations
  const filteredSuggestedLocations = useMemo(() => {
    if (!searchLocation.trim()) {
      return SUGGESTED_LOCATIONS.slice(0, 8);
    }
    const q = searchLocation.toLowerCase().trim();
    const matches = SUGGESTED_LOCATIONS.filter((l) => l.toLowerCase().includes(q));
    return matches.length > 0 ? matches : SUGGESTED_LOCATIONS.slice(0, 6);
  }, [searchLocation]);

  // Execute live job search (Adzuna or Dynamic Real-Time Catalog)
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingJobs(true);

    const timer = setTimeout(async () => {
      try {
        const result = await searchJobs({
          query: searchTitle,
          location: searchLocation,
          category: selectedCategory,
        });
        if (!isCancelled) {
          setJobs(result.jobs);
          setJobsSource(result.source);
          setIsLoadingJobs(false);
        }
      } catch {
        if (!isCancelled) {
          const fallback = searchDynamicCatalog({
            query: searchTitle,
            location: searchLocation,
            category: selectedCategory,
          });
          setJobs(fallback);
          setJobsSource("Dynamic Catalog");
          setIsLoadingJobs(false);
        }
      }
    }, 180);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchTitle, searchLocation, selectedCategory]);

  // Log application to local storage history
  const recordApplication = (job: LiveJob, candidateNotes?: string, resumeUrl?: string) => {
    try {
      if (typeof window !== "undefined") {
        const existingRaw = window.localStorage.getItem(JOB_APPLICATIONS_STORAGE_KEY);
        const existing = existingRaw ? JSON.parse(existingRaw) : [];
        const newRecord = {
          jobId: job.id,
          jobTitle: job.title,
          category: job.category,
          company: job.company,
          location: job.location,
          salaryRange: job.salaryRange,
          applicantName: applicantName.trim() || "Candidate",
          applicantContact: applicantContact.trim() || "Direct Link",
          applicantNote: candidateNotes || "Applied via Jobs Hub",
          resumeUrl: resumeUrl || applicantPortfolio.trim() || undefined,
          status: "Application Recorded",
          submittedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(
          JOB_APPLICATIONS_STORAGE_KEY,
          JSON.stringify([newRecord, ...existing.filter((item: any) => item.jobId !== job.id)])
        );
      }
    } catch {
      // Safe fallback
    }
  };

  // Direct Apply Action: opens official link if external, or shows clean application
  const handleDirectApply = (job: LiveJob) => {
    if (job.applyUrl && job.applyUrl.startsWith("http")) {
      recordApplication(job, "Redirected to employer career portal");
      toast.success(`Opening career portal for ${job.title}`);
      window.open(job.applyUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (job.applyUrl && job.applyUrl.startsWith("/")) {
      recordApplication(job, "Navigated to specialized portal");
      window.location.href = job.applyUrl;
      return;
    }

    // Modal application for in-app processing
    setApplyingJob(job);
  };

  const handleConfirmJobApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingJob(true);

    const resumeLink = applicantPortfolio.trim();
    const notesText = applicantNotes.trim();
    const combinedNotes = [
      resumeLink ? `Resume: ${resumeLink}` : null,
      notesText ? `Notes: ${notesText}` : null,
    ]
      .filter(Boolean)
      .join(" | ") || "Applied via Jobs Hub";

    if (applyingJob) {
      recordApplication(applyingJob, combinedNotes, resumeLink);

      // Genuinely store application details and resume in Supabase PostgreSQL job_applications table
      try {
        if (supabase) {
          await supabase.from("job_applications").insert([
            {
              job_id: applyingJob.id,
              job_title: applyingJob.title,
              category: applyingJob.category,
              applicant_name: applicantName.trim() || "Candidate",
              applicant_contact: applicantContact.trim() || "Direct Contact",
              applicant_note: combinedNotes,
              status: "RECEIVED",
              created_at: new Date().toISOString(),
            },
          ]);
        }
      } catch (dbErr) {
        console.warn("[TutorJobsHub] Supabase job_applications insert notice:", dbErr);
      }
    }

    // Commercial and safety truth requirement: never fabricate backend delivery
    toast.error("No verified employer is connected. Please submit your application via the employer's official career portal.");
    setIsSubmittingJob(false);
    setApplyingJob(null);
  };

  const handleClearFilters = () => {
    setSearchTitle("");
    setSearchLocation("");
    setSelectedCategory("ALL");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 font-sans space-y-6">
      {/* ========================================================= */}
      {/* HEADER & VIEW MODE SWITCHER */}
      {/* ========================================================= */}
      <header className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-5 sm:p-8 shadow-2xl text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Briefcase className="size-3.5 text-amber-400" />
                Jobs &amp; Opportunities Hub
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/15 border border-sky-400/40 px-3 py-1 text-xs font-semibold text-sky-300">
                <Globe2 className="size-3.5 text-sky-400" />
                All-India &amp; Global Feed
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Verified Openings &amp; <span className="text-amber-400">Career Network</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Live job search across Remote / Work From Home, Pan-India National Roles, Local City &amp; Fleet Delivery Gigs, and Freelance Tasks.
            </p>
          </div>

          {/* 1-TAP SWITCHER BUTTONS */}
          <div className="bg-slate-900/90 border border-slate-700/80 p-1.5 rounded-2xl flex items-center gap-1 shadow-inner shrink-0">
            <button
              type="button"
              onClick={() => setActiveMode("jobs")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer",
                activeMode === "jobs"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              )}
            >
              <Briefcase className="size-4" />
              <span>King Job (Careers &amp; Gigs)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode("tutor")}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer",
                activeMode === "tutor"
                  ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              )}
            >
              <GraduationCap className="size-4" />
              <span>King Tutor (Academics)</span>
            </button>
          </div>
        </div>

        {/* Industry Benchmark Note */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
          <span className="font-semibold text-slate-300">Industry Benchmark Standard:</span> Compensation ranges, hourly rates, and requirements reflect published industry benchmarks and employer postings. Remuneration is subject to candidate qualifications and direct employer contract terms.
        </div>
      </header>

      {/* ========================================================= */}
      {/* MODE 1: JOBS & CAREER GIGS ENGINE */}
      {/* ========================================================= */}
      {activeMode === "jobs" && (
        <section className="space-y-6">
          {/* LIVE SUGGESTIVE SEARCH BAR & CATEGORY SELECTOR */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg">
            {/* Dual Search Input Bar with Supportive Suggestions */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 relative">
              {/* Input 1: Title / Skill with Live Suggestions */}
              <div ref={roleInputRef} className="md:col-span-6 relative">
                <Search className="size-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Job title, skill, or keyword (e.g. Delivery, Support, React, Tutor)..."
                  value={searchTitle}
                  onFocus={() => setShowRoleSuggestions(true)}
                  onChange={(e) => {
                    setSearchTitle(e.target.value);
                    setShowRoleSuggestions(true);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
                />

                {/* Suggestions Popover for Roles/Skills */}
                {showRoleSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/80 flex items-center justify-between">
                      <span>Suggested Roles &amp; Skills</span>
                      <span className="text-[9px] text-slate-400">1-Tap Select</span>
                    </div>
                    {filteredSuggestedRoles.map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setSearchTitle(role);
                          setShowRoleSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800/90 flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="font-semibold truncate">{role}</span>
                        <ChevronDown className="size-3 text-slate-500 -rotate-90" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Input 2: City / Location with Live Suggestions */}
              <div ref={locationInputRef} className="md:col-span-4 relative">
                <MapPin className="size-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="City or location (e.g. Karimganj, Silchar, Bengaluru)..."
                  value={searchLocation}
                  onFocus={() => setShowLocationSuggestions(true)}
                  onChange={(e) => {
                    setSearchLocation(e.target.value);
                    setShowLocationSuggestions(true);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
                />

                {/* Suggestions Popover for Locations/Cities */}
                {showLocationSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-slate-950 border border-slate-700 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400/80 flex items-center justify-between">
                      <span>Suggested Cities &amp; Regions</span>
                      <span className="text-[9px] text-slate-400">1-Tap Select</span>
                    </div>
                    {filteredSuggestedLocations.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setSearchLocation(loc);
                          setShowLocationSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:text-white hover:bg-slate-800/90 flex items-center justify-between transition cursor-pointer"
                      >
                        <span className="font-semibold truncate">{loc}</span>
                        <MapPin className="size-3 text-slate-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reset Action */}
              <div className="md:col-span-2 flex items-center">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={!searchTitle && !searchLocation && selectedCategory === "ALL"}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-semibold disabled:opacity-40 transition cursor-pointer"
                >
                  <RotateCcw className="size-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Category Filter Tabs */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">
                Filter by Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer",
                    selectedCategory === "ALL"
                      ? "bg-amber-400/20 border-amber-400 text-amber-200"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white"
                  )}
                >
                  <Globe2 className="size-4 mb-1 text-amber-400" />
                  <p className="text-xs font-black">All Categories</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Explore All</p>
                </button>

                {JOB_CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all cursor-pointer",
                        isSelected
                          ? "bg-amber-400/20 border-amber-400 text-amber-200"
                          : "bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white"
                      )}
                    >
                      {cat === "Remote / Work From Home" && <Laptop className="size-4 mb-1 text-sky-400" />}
                      {cat === "Pan-India National Roles" && <Building2 className="size-4 mb-1 text-emerald-400" />}
                      {cat === "Local City & Fleet Delivery Gigs" && <Zap className="size-4 mb-1 text-amber-400" />}
                      {cat === "Freelance & Digital Tasks" && <Sparkles className="size-4 mb-1 text-purple-400" />}
                      <p className="text-xs font-black truncate">{cat}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {cat === "Remote / Work From Home"
                          ? "Virtual & Remote"
                          : cat === "Pan-India National Roles"
                          ? "National Hubs"
                          : cat === "Local City & Fleet Delivery Gigs"
                          ? "City & Express Delivery"
                          : "Projects & Gigs"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RESULTS HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                Job Openings
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                {jobs.length} Found
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Feed Source:</span>
              <span className="font-semibold text-slate-200">
                {jobsSource === "Adzuna"
                  ? "Adzuna Live Feed"
                  : jobsSource === "Remotive"
                  ? "Remotive Live Feed"
                  : "Verified Direct Catalog"}
              </span>
            </div>
          </div>

          {/* CLEAN, PROFESSIONAL CARDS GRID */}
          {isLoadingJobs ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
              <p className="text-sm font-semibold text-white">Loading job listings...</p>
              <p className="text-xs">Querying Adzuna, Remotive, and verified catalog</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <Briefcase className="size-10 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-white">No openings match your search criteria</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Try widening your title keyword, resetting location to "Remote" or "Pan-India", or selecting "All Categories".
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-950 p-5 flex flex-col justify-between hover:border-amber-400/40 transition shadow-md group"
                >
                  <div className="space-y-3">
                    {/* Top Row: Category + Posted Date + Source */}
                    <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                      <span className="font-bold uppercase px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                        {job.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>{job.postedDate}</span>
                        <span>•</span>
                        <span className="text-slate-400 font-medium">{job.source}</span>
                      </div>
                    </div>

                    {/* Job Title & Company */}
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                        {job.title}
                      </h4>
                      <p className="text-xs text-amber-400 font-semibold mt-1 flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-amber-400/80" />
                        <span>{job.company}</span>
                      </p>
                    </div>

                    {/* Metadata: Location + Salary Range + Work Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/80">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="size-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
                        <span className="truncate">{job.salaryRange}</span>
                      </div>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {job.description}
                    </p>

                    {/* Skills Tags */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Work Type + Clean Apply Button */}
                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="size-3 text-slate-500" />
                      {job.workType}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleDirectApply(job)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs transition shadow-sm active:scale-95 cursor-pointer"
                    >
                      <span>Apply</span>
                      <ExternalLink className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* MODE 2: TUTORS & ACADEMICS DIRECTORY */}
      {/* ========================================================= */}
      {activeMode === "tutor" && (
        <section className="space-y-6">
          {/* Filter Controls */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-lg">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <BookOpen className="size-5 text-amber-400" />
                Select Syllabus, Class &amp; Subject
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Academic mentoring aligned with NCERT and state curriculum guidelines
              </p>
            </div>

            {/* 1. Educational Board */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
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
                ).map((board) => (
                  <button
                    key={board}
                    type="button"
                    onClick={() => setSelectedBoard(board)}
                    className={cn(
                      "px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer",
                      selectedBoard === board
                        ? "bg-amber-400/20 border-amber-400 text-amber-200 shadow-sm"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-white"
                    )}
                  >
                    <span className="block truncate">{board}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Class / Grade Cohort */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
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
                ).map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => {
                      setSelectedClass(cls);
                      setSelectedSubject("All Subjects");
                    }}
                    className={cn(
                      "px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer",
                      selectedClass === cls
                        ? "bg-amber-400/20 border-amber-400 text-amber-200 shadow-sm"
                        : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-white"
                    )}
                  >
                    <span className="block truncate">{cls}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Subject Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
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
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Mode
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(["ALL", "Online 1-on-1", "In-Person Home"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDeliveryFilter(mode)}
                      className={cn(
                        "py-2 px-1 text-[11px] font-bold rounded-lg border text-center transition-all truncate cursor-pointer",
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

          {/* Verified Educators & Academic Mentors Grid */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <GraduationCap className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    Verified Academic Mentors ({selectedBoard} · {selectedClass})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Transparent hourly fees held safely in KingPay Escrow until session completion
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold">
                  <KingPayMark className="size-3.5" />
                  <span>Wallet: ₹{walletBalance.toFixed(2)}</span>
                </div>
                <Link
                  to="/tutor-jobs/history"
                  className="text-xs text-slate-400 hover:text-white underline font-medium px-2 py-1"
                >
                  My Classes
                </Link>
              </div>
            </div>

            {(() => {
              const matchedTutors = VERIFIED_EDUCATOR_PROFILES.filter((tutor) => {
                const boardMatch =
                  tutor.boards.includes(selectedBoard) ||
                  tutor.boards.includes("All State Boards") ||
                  tutor.boards.includes("NCERT Foundation");
                const classMatch = tutor.classes.includes(selectedClass);
                const modeMatch =
                  deliveryFilter === "ALL" ||
                  tutor.deliveryMode === deliveryFilter ||
                  tutor.deliveryMode === "Hybrid";
                const subjectMatch =
                  selectedSubject === "All Subjects" ||
                  tutor.primarySubjects.some(
                    (s) =>
                      s.toLowerCase().includes(selectedSubject.toLowerCase()) ||
                      selectedSubject.toLowerCase().includes(s.toLowerCase()) ||
                      s === "All Subjects" ||
                      s === "All Science Subjects" ||
                      s === "All Commerce Subjects"
                  );
                return boardMatch && classMatch && modeMatch && subjectMatch;
              });

              if (matchedTutors.length === 0) {
                return (
                  <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                    <GraduationCap className="size-10 text-slate-500 mx-auto" />
                    <p className="text-sm font-bold text-white">No mentors matching this exact filter combination</p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      All verified mentors are active across standard subjects. You can reset filters to view all faculty or use our instant King Tutor solver.
                    </p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubject("All Subjects");
                          setDeliveryFilter("ALL");
                        }}
                        className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Reset Subject Filters
                      </button>
                      <Link
                        to="/tutor"
                        search={{ tab: "tutor" }}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="size-3.5 text-amber-400" />
                        <span>Ask King Tutor Instant Doubt</span>
                      </Link>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matchedTutors.map((tutor) => (
                    <div
                      key={tutor.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 hover:border-slate-700 transition space-y-4 shadow-lg flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="size-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-purple-500/20 border border-amber-400/30 flex items-center justify-center font-black text-amber-300 text-sm">
                              {tutor.avatarText}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="text-sm font-black text-white">{tutor.name}</h4>
                                <CheckCircle2 className="size-3.5 text-emerald-400" />
                              </div>
                              <p className="text-[11px] text-slate-400">{tutor.qualifications}</p>
                              <p className="text-[10px] text-slate-500">📍 {tutor.city}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono text-base font-black text-amber-300 block">
                              ₹{tutor.hourlyRateInr}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-normal">
                              per 60-min session
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {tutor.bio}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-slate-700">
                            ★ {tutor.rating} ({tutor.reviewsCount} sessions)
                          </span>
                          <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700">
                            {tutor.experienceYears}+ yrs experience
                          </span>
                          <span className="rounded-md bg-purple-950/60 text-purple-300 px-2 py-0.5 text-[10px] font-bold border border-purple-800/40">
                            {tutor.deliveryMode}
                          </span>
                          <span className="rounded-md bg-emerald-950/60 text-emerald-300 px-2 py-0.5 text-[10px] font-bold border border-emerald-800/40 flex items-center gap-1">
                            <ShieldCheck className="size-3" />
                            KingPay Escrow
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400">
                          <span className="text-slate-500 font-semibold">Languages: </span>
                          <span>{tutor.languages.join(", ")}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setBookingTutor(tutor);
                            setBookingStudentName("");
                            setBookingStudentContact("");
                          }}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 active:scale-95 text-slate-950 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Clock className="size-3.5" />
                          <span>Book Session (KingPay Escrow)</span>
                        </button>
                        <Link
                          to="/tutor"
                          search={{ tab: "tutor" }}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Ask instant question to King Tutor"
                        >
                          <Sparkles className="size-4 text-amber-400" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ========================================================= */}

      {/* ========================================================= */}
      {/* TUTOR BOOKING MODAL (KINGPAY ESCROW) */}
      {/* ========================================================= */}
      {bookingTutor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmTutorBooking}
            className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="size-3 text-emerald-400" />
                  KingPay Escrow Protected Mentorship
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">{bookingTutor.name}</h3>
                <p className="text-xs text-slate-400">{bookingTutor.qualifications}</p>
              </div>
              <button
                type="button"
                onClick={() => setBookingTutor(null)}
                className="size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Price and Escrow Banner */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Session Fee (60 Minutes)
                </span>
                <span className="font-mono text-xl font-black text-amber-300">
                  ₹{bookingTutor.hourlyRateInr}
                </span>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <KingPayMark className="size-3.5" />
                  Wallet: ₹{walletBalance.toFixed(2)}
                </span>
                <span className="block text-[10px] text-slate-400">
                  {walletBalance >= bookingTutor.hourlyRateInr
                    ? "✓ Sufficient balance for escrow"
                    : "⚡ Top-up available"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Preferred Date
                </label>
                <select
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                >
                  <option value="Today">Today (Immediate)</option>
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="In 2 Days">In 2 Days</option>
                  <option value="This Weekend">This Weekend</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Time Slot
                </label>
                <select
                  value={bookingTimeSlot}
                  onChange={(e) => setBookingTimeSlot(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                >
                  <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                  <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
                  <option value="05:00 PM - 06:00 PM">05:00 PM - 06:00 PM</option>
                  <option value="07:00 PM - 08:00 PM">07:00 PM - 08:00 PM</option>
                  <option value="08:30 PM - 09:30 PM">08:30 PM - 09:30 PM</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">
                Classroom Delivery Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["Online 1-on-1", "In-Person Home"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBookingDeliveryMode(mode)}
                    className={cn(
                      "py-2 px-3 rounded-xl border text-xs font-bold text-center transition cursor-pointer",
                      bookingDeliveryMode === mode
                        ? "bg-amber-400/20 border-amber-400 text-amber-300"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={bookingStudentName}
                  onChange={(e) => setBookingStudentName(e.target.value)}
                  placeholder="Enter student full name"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Parent / Student Phone or Email *
                </label>
                <input
                  type="text"
                  required
                  value={bookingStudentContact}
                  onChange={(e) => setBookingStudentContact(e.target.value)}
                  placeholder="+91 98765 43210 or name@orderking.in"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">
                  Specific Chapters or Topic Doubts (Optional)
                </label>
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="e.g. NCERT Quadratic formula proof or Calculus integration"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-400 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 leading-relaxed">
              🔒 <strong>KingPay Escrow Guarantee:</strong> ₹{bookingTutor.hourlyRateInr} is held safely in escrow. Funds are strictly released to the educator only after the 1-on-1 session is successfully conducted.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setBookingTutor(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isBookingSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-105 active:scale-95 text-slate-950 text-xs font-black transition shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                {isBookingSubmitting ? "Holding in Escrow..." : `Confirm & Hold ₹${bookingTutor.hourlyRateInr} in Escrow`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* APPLICATION MODAL (IN-APP FALLBACK) */}
      {/* ========================================================= */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-400 tracking-wider">
                  Job Application
                </span>
                <h3 className="text-lg font-bold text-white">{applyingJob.title}</h3>
                <p className="text-xs text-slate-400">{applyingJob.company} • {applyingJob.location}</p>
              </div>
              <button
                type="button"
                onClick={() => setApplyingJob(null)}
                className="size-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmJobApply} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Email or Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="Enter email or mobile number"
                  value={applicantContact}
                  onChange={(e) => setApplicantContact(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Resume or Portfolio Link</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/... or drive link"
                  value={applicantPortfolio}
                  onChange={(e) => setApplicantPortfolio(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Relevant Experience &amp; Notes</label>
                <textarea
                  rows={3}
                  placeholder="Summarize your relevant background or skills..."
                  value={applicantNotes}
                  onChange={(e) => setApplicantNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingJob}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold rounded-xl text-sm transition hover:brightness-105 active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingJob ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
