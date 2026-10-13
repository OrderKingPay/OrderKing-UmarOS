import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { OrderKingMark } from "@/components/mark";
import { platformConfig } from "@/lib/platform-config";
import { ShieldCheck, ChefHat, Banknote, ArrowRight, CheckCircle2, UtensilsCrossed } from "lucide-react";

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
              <span className="font-display text-xl font-bold tracking-tight text-white">
                {platformConfig.brand.appName}
              </span>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400">
                RESTAURANT PARTNER PORTAL
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
              <a href="/login?mode=up">Register Restaurant</a>
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center py-12 md:py-16">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            INSTITUTIONAL MERCHANT OPERATIONS &amp; STATUTORY COMPLIANCE
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white md:text-6xl">
            Manage Your Kitchen, Digital Menu &amp; Statutory Settlements in One Place.
          </h1>

          <p className="mt-5 max-w-2xl text-base text-slate-300 md:text-lg font-normal leading-relaxed">
            Built for Indian restaurant partners with real-time kitchen display workflows, 1-tap menu stock controls, 14-digit FSSAI compliance tracking, and itemized integer-paise financial settlements.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base px-6 h-12 shadow-xl shadow-emerald-950">
              <a href="/login?mode=up">
                Register Your Restaurant <ArrowRight className="ml-2 size-4" />
              </a>
            </Button>
            <Link
              to="/login"
              className="inline-flex h-12 items-center rounded-xl border border-slate-800 bg-slate-900/80 px-5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              Sign In to Partner Console
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono uppercase tracking-wider">Kitchen Operations</span>
                <ChefHat className="size-4 text-emerald-400" />
              </div>
              <div className="mt-2 font-display text-xl font-bold text-slate-100">Live KDS &amp; Prep SLA</div>
              <p className="mt-1 text-xs text-slate-400">
                Real-time order acceptance, rush-hour prep throttling, and thermal KOT printing support.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono uppercase tracking-wider">Catalogue Control</span>
                <UtensilsCrossed className="size-4 text-emerald-400" />
              </div>
              <div className="mt-2 font-display text-xl font-bold text-slate-100">1-Tap Stock Toggle</div>
              <p className="mt-1 text-xs text-slate-400">
                Manage item pricing, GST slabs, packaging charges, variants, and daily stock availability.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono uppercase tracking-wider">Financial Ledger</span>
                <Banknote className="size-4 text-emerald-400" />
              </div>
              <div className="mt-2 font-display text-xl font-bold text-emerald-400">Integer-Paise Accounting</div>
              <p className="mt-1 text-xs text-slate-400">
                Order-level reconciliation of food value, discounts, commission, and net restaurant payable.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-mono uppercase tracking-wider">Statutory Governance</span>
                <ShieldCheck className="size-4 text-emerald-400" />
              </div>
              <div className="mt-2 font-display text-xl font-bold text-slate-100">FSSAI &amp; Tax Ready</div>
              <p className="mt-1 text-xs text-slate-400">
                Compliant with FSSAI licensing, CGST Section 9(5), TCS Section 52, and Income Tax Section 194-O.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-xl border border-slate-800/80 bg-slate-900/30 p-5">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              RESTAURANT PARTNER STANDARDS &amp; STATUTORY TRANSPARENCY
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2 rounded-lg border border-emerald-500/20 bg-emerald-950/10 p-3.5">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" /> Transparent Commercial &amp; Tax Ledger
                </div>
                <ul className="space-y-1.5 text-slate-300">
                  <li>• Exact integer-paise calculation for every order and batch settlement</li>
                  <li>• Statutory tax compliance under CGST Act §9(5), TCS §52, and TDS §194-O</li>
                  <li>• Exportable CSV and JSON settlement statements for your Chartered Accountant</li>
                  <li>• Role-based staff access controls for Owners, Managers, Accountants, and Kitchen Staff</li>
                </ul>
              </div>
              <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3.5">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-emerald-400" /> Mandatory Onboarding Verification
                </div>
                <ul className="space-y-1.5 text-slate-400">
                  <li>• Valid 14-digit FSSAI Food Safety License verification (FoSCoS standard)</li>
                  <li>• Business PAN and optional 15-character GSTIN registration</li>
                  <li>• Verified settlement bank account &amp; 11-character IFSC code for NEFT/IMPS payouts</li>
                  <li>• Digital execution of Restaurant Partner Agreement &amp; Food Safety Undertaking</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
