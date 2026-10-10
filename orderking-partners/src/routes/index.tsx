import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { OrderKingMark } from "@/components/mark";
import { platformConfig } from "@/lib/platform-config";
import { ShieldCheck, Zap, Banknote, ArrowRight, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user } = useCurrentUserState();
  if (user) return <Navigate to="/dashboard" />;

  return (
    <main className="min-h-dvh bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 py-8">
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <OrderKingMark className="size-9 text-chili" />
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold tracking-tight text-white">{platformConfig.brand.appName}</span>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400">
                MERCHANT ACQUISITION
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex min-h-10 items-center rounded-lg border border-slate-800 bg-slate-900/60 px-4 text-xs font-semibold text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              Partner Sign In
            </Link>
            <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-950">
              <a href="/login?mode=up">
                Start Free Onboarding
              </a>
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center py-12 md:py-16">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            DIRECT MERCHANT PROTOCOL — ZERO UPFRONT CHARGES
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white md:text-6xl">
            Zero Setup Fees. Zero Hidden Charges. Live in 60 Seconds.
          </h1>

          <p className="mt-5 max-w-2xl text-base text-slate-300 md:text-lg font-normal leading-relaxed">
            Eliminate aggregator friction. Deploy your restaurant with zero onboarding costs, zero payment gateway lock-in, and 100% transparent integer-paise direct settlements.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base px-6 h-12 shadow-xl shadow-emerald-950">
              <a href="/login?mode=up">
                Launch Your Restaurant in 60s <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
            <Link
              to="/login"
              className="inline-flex h-12 items-center rounded-xl border border-slate-800 bg-slate-900/80 px-5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              Sign In Existing Kitchen
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono uppercase tracking-wider">Setup & Listing Fee</span>
                <ShieldCheck className="size-4 text-emerald-400" />
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-emerald-400">₹0.00 Waived</div>
              <p className="mt-1 text-xs text-slate-400">Zero registration charges, zero mandatory ad kits, zero tablet rental deposits.</p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono uppercase tracking-wider">Gateway Requirement</span>
                <Banknote className="size-4 text-emerald-400" />
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-slate-100">None / Stripped</div>
              <p className="mt-1 text-xs text-slate-400">No payment gateway merchant KYC blockers. Direct automated bank settlement.</p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono uppercase tracking-wider">Deployment Velocity</span>
                <Clock className="size-4 text-amber-400" />
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-amber-400">&lt; 60 Seconds</div>
              <p className="mt-1 text-xs text-slate-400">From initial signup to active order ingestion in less than one minute.</p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono uppercase tracking-wider">Hidden Deductions</span>
                <Zap className="size-4 text-emerald-400" />
              </div>
              <div className="mt-2 font-display text-2xl font-bold text-emerald-400">Strictly Zero</div>
              <p className="mt-1 text-xs text-slate-400">Integer-paise settlement ledger. Pure statutory deductions only (GST §9(5), TDS 194-O).</p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-slate-800/80 bg-slate-900/30 p-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">COMMERCIAL TERMS RECONCILIATION</div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-3">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" /> OrderKing Enterprise Protocol
                </div>
                <ul className="space-y-1 text-slate-300">
                  <li>• ₹0 Upfront Onboarding or Device Fees</li>
                  <li>• Direct bank account & UPI payouts (no gateway merchant setup)</li>
                  <li>• 100% itemized integer-paise financial payout records</li>
                  <li>• Instant activation in 60 seconds</li>
                </ul>
              </div>
              <div className="space-y-2 rounded-lg border border-rose-500/20 bg-rose-950/10 p-3">
                <div className="font-semibold text-rose-400">
                  Legacy Food Delivery Aggregators
                </div>
                <ul className="space-y-1 text-slate-400">
                  <li>• ₹5,000 – ₹15,000 upfront listing & onboarding levies</li>
                  <li>• Mandatory payment gateway KYC and weeks of administrative delay</li>
                  <li>• Hidden marketing cuts, penalty fees, and non-transparent deductions</li>
                  <li>• Delayed multi-tier settlement cycles</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
