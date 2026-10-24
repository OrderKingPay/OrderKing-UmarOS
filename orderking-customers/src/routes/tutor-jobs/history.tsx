import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Briefcase,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Building2,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { AppErrorComponent } from "@/lib/error-component";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/db-cloud";
import { toast } from "sonner";
import { getMyTutorBookingsFn, releaseTutorEscrowFn } from "@/routes/tutor";
import { KingPayMark } from "@/components/brand/kingpay-mark";

const JOB_APPLICATIONS_STORAGE_KEY = "orderking_job_applications_v1";

interface SubmittedJobApplication {
  jobId: string;
  jobTitle: string;
  category?: string;
  subCategory?: string;
  applicantName?: string;
  applicantContact?: string;
  applicantNote?: string;
  resumeUrl?: string;
  status: string;
  submittedAt: string;
}

interface BookedClassSession {
  id: string;
  tutorName: string;
  subject: string;
  grade: string;
  scheduledTime: string;
  status: "Confirmed" | "Completed" | "In Session";
  mode: string;
  amountInr?: number;
  escrowStatus?: "HELD" | "RELEASED" | "REFUNDED";
  meetingLink?: string;
}

const TUTOR_SESSIONS_STORAGE_KEY = "orderking_tutor_sessions_v1";

export const Route = (createFileRoute as any)("/tutor-jobs/history")({
  component: TutorJobsHistoryPage,
  errorComponent: AppErrorComponent,
});

function TutorJobsHistoryPage() {
  const [activeTab, setActiveTab] = useState<"classes" | "jobs">("classes");
  const [applications, setApplications] = useState<SubmittedJobApplication[]>([]);
  const [classes, setClasses] = useState<BookedClassSession[]>([]);
  const [releasingEscrowId, setReleasingEscrowId] = useState<string | null>(null);

  const handleReleaseEscrow = async (bookingId: string, tutorName: string) => {
    setReleasingEscrowId(bookingId);
    try {
      const res = await releaseTutorEscrowFn({ data: { bookingId } });
      if (res?.success) {
        toast.success(`🎉 Session verified complete! KingPay escrow released to ${tutorName}.`);
        setClasses((prev) =>
          prev.map((c) =>
            c.id === bookingId
              ? { ...c, status: "Completed", escrowStatus: "RELEASED" }
              : c
          )
        );

        // Update local storage
        if (typeof window !== "undefined") {
          const raw = window.localStorage.getItem(TUTOR_SESSIONS_STORAGE_KEY);
          if (raw) {
            const list = JSON.parse(raw);
            const updated = list.map((item: any) =>
              item.id === bookingId
                ? { ...item, status: "Completed", escrowStatus: "RELEASED" }
                : item
            );
            window.localStorage.setItem(TUTOR_SESSIONS_STORAGE_KEY, JSON.stringify(updated));
          }
        }
      } else {
        toast.error(res?.error || "Could not release escrow.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to release escrow.");
    } finally {
      setReleasingEscrowId(null);
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const rawApps = window.localStorage.getItem(JOB_APPLICATIONS_STORAGE_KEY);
        if (rawApps) {
          const parsed = JSON.parse(rawApps);
          if (Array.isArray(parsed)) {
            setApplications(parsed);
          }
        }
        const rawSessions = window.localStorage.getItem(TUTOR_SESSIONS_STORAGE_KEY);
        if (rawSessions) {
          const parsedSessions = JSON.parse(rawSessions);
          if (Array.isArray(parsedSessions)) {
            setClasses(parsedSessions);
          }
        }
      }
    } catch {
      // Safe fallback
    }

    // Connect authentic live application records from Supabase PostgreSQL job_applications table
    async function syncFromSupabase() {
      try {
        if (!supabase) return;
        const { data, error } = await supabase
          .from("job_applications")
          .select("id, job_id, job_title, category, applicant_name, applicant_contact, applicant_note, status, created_at")
          .order("created_at", { ascending: false })
          .limit(50);

        if (!error && data && Array.isArray(data) && data.length > 0) {
          const supabaseApps: SubmittedJobApplication[] = data.map((r: any) => {
            const noteStr = r.applicant_note || "";
            const resumeMatch = noteStr.match(/Resume:\s*(https?:\/\/[^\s|]+)/i);
            return {
              jobId: r.job_id || r.id,
              jobTitle: r.job_title,
              category: r.category,
              applicantName: r.applicant_name,
              applicantContact: r.applicant_contact,
              applicantNote: r.applicant_note,
              resumeUrl: resumeMatch ? resumeMatch[1] : undefined,
              status: r.status || "RECEIVED",
              submittedAt: r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recent",
            };
          });

          setApplications((prev) => {
            const existingIds = new Set(prev.map((a) => a.jobId));
            const fresh = supabaseApps.filter((a) => !existingIds.has(a.jobId));
            return [...prev, ...fresh];
          });
        }
      } catch {
        // Safe fallback
      }
    }
    void syncFromSupabase();

    // Proactively fetch genuine tutor bookings from PostgreSQL via server function
    getMyTutorBookingsFn()
      .then((res: any) => {
        if (res?.success && Array.isArray(res.bookings) && res.bookings.length > 0) {
          setClasses((prev) => {
            const existingIds = new Set(prev.map((c) => c.id));
            const fresh = res.bookings.filter((b: any) => !existingIds.has(b.id));
            return [...prev, ...fresh];
          });
        }
      })
      .catch((e: any) => {
        console.warn("[TutorJobsHistoryPage] Booking fetch notice:", e);
      });

  }, []);

  return (
    <CustomerShell>
      <div className="min-h-dvh bg-[#FCFAF7] px-4 py-6 pb-32 text-stone-900">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-amber-900/10 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-100 border border-purple-300 px-3 py-0.5 text-xs font-bold text-purple-900 mb-2">
                <Sparkles className="size-3 text-purple-600" />
                <span>Applied &amp; Booked History</span>
              </div>
              <h1 className="text-2xl font-black text-stone-950 tracking-tight sm:text-3xl">
                My Classes &amp; Jobs
              </h1>
              <p className="text-xs text-stone-600 mt-1 font-medium">
                Track your active tutoring sessions, scheduled classes, and employer job applications.
              </p>
            </div>

            <Link
              to="/tutor"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white px-4 py-2 text-xs font-bold transition no-underline shadow-xs shrink-0"
            >
              <BookOpen className="size-3.5" />
              <span>Explore Tutors &amp; Jobs</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Tab Selector */}
          <div className="flex rounded-2xl bg-stone-200/60 p-1 border border-stone-300/60">
            <button
              type="button"
              onClick={() => setActiveTab("classes")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "classes"
                  ? "bg-white text-purple-950 shadow-xs border border-purple-200"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              <GraduationCap className="size-4" />
              <span>Booked Classes ({classes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("jobs")}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "jobs"
                  ? "bg-white text-purple-950 shadow-xs border border-purple-200"
                  : "text-stone-600 hover:text-stone-950"
              }`}
            >
              <Briefcase className="size-4" />
              <span>Job Applications ({applications.length})</span>
            </button>
          </div>

          {/* Classes View */}
          {activeTab === "classes" && (
            <div className="space-y-4">
              {classes.length === 0 ? (
                <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center space-y-3">
                  <div className="size-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mx-auto">
                    <GraduationCap className="size-6" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">No Booked Mentorship Sessions Yet</h3>
                  <p className="text-xs text-stone-600 max-w-md mx-auto">
                    Request a verified 1-on-1 session with an academic mentor or practice with our interactive AI Tutor.
                  </p>
                  <Link
                    to="/tutor"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 text-white text-xs font-bold px-4 py-2 mt-2 no-underline hover:bg-purple-800 transition"
                  >
                    <span>Explore Mentors &amp; AI Tutor</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              ) : (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="rounded-2xl border border-purple-200/90 bg-white p-5 shadow-xs transition-all hover:border-purple-400"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-900 border border-purple-200">
                            {cls.grade}
                          </span>
                          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            {cls.status}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-stone-900 pt-1">
                          {cls.subject}
                        </h3>
                        <p className="text-xs text-stone-600 font-medium">
                          Instructor: <strong className="text-stone-900">{cls.tutorName}</strong> · {cls.mode}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl shrink-0">
                        <Clock className="size-3.5 text-purple-700" />
                        <span>{cls.scheduledTime}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] text-stone-600 flex items-center gap-1">
                          <ShieldCheck className="size-3.5 text-emerald-600" />
                          Verified Educator
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300/60 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                          <KingPayMark className="size-3" />
                          <span>
                            {cls.escrowStatus === "RELEASED"
                              ? "Escrow Settled & Released"
                              : `Escrow Held: ₹${cls.amountInr || 499}`}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {cls.escrowStatus !== "RELEASED" && (
                          <button
                            type="button"
                            disabled={releasingEscrowId === cls.id}
                            onClick={() => handleReleaseEscrow(cls.id, cls.tutorName)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {releasingEscrowId === cls.id ? "Releasing..." : "Complete & Release Escrow"}
                          </button>
                        )}
                        <a
                          href={cls.meetingLink || `https://meet.orderking.in/tutor-${cls.id.slice(0, 8)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-purple-300 text-purple-900 hover:bg-purple-50 text-xs font-bold transition no-underline"
                        >
                          <span>Classroom Link</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Jobs View */}
          {activeTab === "jobs" && (
            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center space-y-3">
                  <div className="size-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mx-auto">
                    <Briefcase className="size-6" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">No Job Applications Yet</h3>
                  <p className="text-xs text-stone-600 max-w-md mx-auto">
                    Explore verified local job openings with direct employer applications.
                  </p>
                  <Link
                    to="/tutor"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-700 text-white text-xs font-bold px-4 py-2 mt-2 no-underline"
                  >
                    <span>Browse Open Positions</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              ) : (
                applications.map((app, idx) => (
                  <div
                    key={app.jobId || idx}
                    className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs hover:border-purple-300 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-700">
                            {app.category || "Verified Opening"}
                          </span>
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200 flex items-center gap-1">
                            <Clock className="size-3 text-amber-700" />
                            {app.status || "Under Review"}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-stone-900">
                          {app.jobTitle}
                        </h3>
                        {app.applicantName && (
                          <p className="text-xs text-stone-500 font-medium">
                            Applicant: {app.applicantName} {app.applicantContact ? `(${app.applicantContact})` : ""}
                          </p>
                        )}
                      </div>

                      <div className="text-[11px] text-stone-500 font-mono">
                        Applied: {app.submittedAt}
                      </div>
                    </div>

                    {app.applicantNote && (
                      <p className="text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200/70 italic">
                        &ldquo;{app.applicantNote}&rdquo;
                      </p>
                    )}

                    {app.resumeUrl && (
                      <div className="pt-1">
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs font-bold hover:bg-purple-100 transition"
                        >
                          <FileText className="size-3 text-purple-600" />
                          <span>View Attached Resume</span>
                        </a>
                      </div>
                    )}

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="size-3.5 text-emerald-600" />
                        Verified ATS Submission
                      </span>
                      <span className="font-semibold text-purple-900">
                        Direct Employer Review
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </CustomerShell>
  );
}
