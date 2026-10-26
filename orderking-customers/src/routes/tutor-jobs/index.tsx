import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { TutorJobsHub } from "@/components/tutor-jobs/tutor-jobs-hub";
import { AppErrorComponent } from "@/lib/error-component";
import { History, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/tutor-jobs/")({
  component: TutorJobsIndexPage,
  errorComponent: AppErrorComponent,
});

function TutorJobsIndexPage() {
  return (
    <CustomerShell dark maxWidth="max-w-7xl">
      <div className="min-h-screen bg-slate-950 text-white pb-28 pt-2">
        {/* Quick Nav Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-2 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-amber-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-amber-400 font-bold">King Job · Verified Careers Hub</span>
          </div>

          <Link
            to="/tutor-jobs/history"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/40 text-slate-300 hover:text-amber-300 font-bold text-xs transition"
          >
            <History className="size-3.5" />
            <span>My Applications</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Master Component */}
        <TutorJobsHub defaultMode="jobs" />
      </div>
    </CustomerShell>
  );
}

export default TutorJobsIndexPage;
