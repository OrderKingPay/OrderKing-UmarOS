import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wallet, ArrowRight, Plane, GraduationCap, Briefcase,
  Activity, ReceiptText, Ticket, Landmark, ChevronRight, History
} from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { AppErrorComponent } from "@/lib/error-component";
import { RemittanceDesk } from "@/components/kingpay/remittance-desk";

/** The center tab is intentionally branded KingPay, not Services. */
export const Route = createFileRoute("/kingpay/")({
  component: KingPayHub,
  errorComponent: AppErrorComponent,
});

const services = [
  { name: "Travel", detail: "Explore tickets and trips", to: "/travel", icon: Plane },
  { name: "AI Tutor", detail: "Learning and practice", to: "/tutor", icon: GraduationCap },
  { name: "Jobs", detail: "Explore opportunities", to: "/tutor-jobs", icon: Briefcase },
  { name: "Govt Schemes", detail: "Find official programmes", to: "/news", icon: Landmark },
] as const;

function KingPayHub() {
  return (
    <CustomerShell>
      <div className="min-h-[calc(100dvh-120px)] bg-[#FCFAF7] px-4 pb-28 pt-4 text-stone-900 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <header className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-800">OrderKing</p>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">KingPay</h1>
            <p className="mt-1 text-sm text-stone-600">Payments, remittance, and everyday essentials in one place.</p>
          </header>

          <section
            aria-label="KingPay payment tools"
            className="rounded-3xl border border-amber-400/50 bg-stone-950 p-4 text-white shadow-xl sm:p-5"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-stone-950">
                <Wallet className="size-6" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-amber-200">Your KingPay</h2>
                <p className="text-xs leading-relaxed text-stone-300">Available payment options and real transaction records.</p>
              </div>
            </div>
            <Link
              to="/king-pay"
              className="mt-4 flex min-h-12 items-center justify-between rounded-xl bg-amber-400 px-4 text-sm font-extrabold text-stone-950 no-underline transition-colors hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              Open payment tools <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <div className="mt-2 flex items-center justify-between">
              <Link
                to="/kingpay/passbook"
                className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-amber-100 no-underline hover:underline"
              >
                <ReceiptText className="size-4" aria-hidden="true" /> Passbook and receipts
              </Link>
              <Link
                to="/kingpay/remittance"
                className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-emerald-400 no-underline hover:underline"
              >
                Global Remittance Desk →
              </Link>
            </div>
          </section>

          {/* Cross-Border Global Remittance Desk */}
          <div className="mt-5">
            <RemittanceDesk />
          </div>

          <section aria-labelledby="more-services" className="mt-5">
            <h2 id="more-services" className="mb-3 text-base font-extrabold">Explore more</h2>
            <nav aria-label="Other OrderKing services" className="grid grid-cols-2 gap-3">
              {services.map(({ name, detail, to, icon: Icon }) => (
                <Link
                  key={name}
                  to={to as any}
                  className="flex min-h-32 flex-col justify-between rounded-2xl border border-stone-200 bg-white p-3.5 text-stone-900 no-underline shadow-sm transition-colors hover:border-amber-400 hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
                >
                  <Icon className="size-6 text-amber-700" aria-hidden="true" />
                  <div>
                    <span className="flex items-center justify-between gap-1 text-sm font-extrabold">
                      {name}
                      <ChevronRight className="size-4 text-amber-700" aria-hidden="true" />
                    </span>
                    <span className="mt-1 block text-[11px] leading-snug text-stone-500">{detail}</span>
                  </div>
                </Link>
              ))}
              <div
                aria-label="Signals feature not launched"
                className="flex min-h-32 flex-col justify-between rounded-2xl border border-dashed border-stone-300 bg-stone-100 p-3.5 text-stone-500"
              >
                <Activity className="size-6" aria-hidden="true" />
                <div>
                  <span className="block text-sm font-extrabold">Signals</span>
                  <span className="block text-[11px]">Not launched</span>
                </div>
              </div>
              <Link
                to="/travel/trips"
                className="flex min-h-32 flex-col justify-between rounded-2xl border border-stone-200 bg-white p-3.5 text-stone-900 no-underline shadow-sm hover:border-amber-400 hover:bg-amber-50"
              >
                <Ticket className="size-6 text-amber-700" aria-hidden="true" />
                <div>
                  <span className="flex items-center justify-between text-sm font-extrabold">
                    My Tickets
                    <ChevronRight className="size-4 text-amber-700" aria-hidden="true" />
                  </span>
                  <span className="mt-1 block text-[11px] text-stone-500">View your trips</span>
                </div>
              </Link>
            </nav>
          </section>

          <p className="mt-5 text-xs leading-relaxed text-stone-500">
            Payment, remittance, travel and job availability depend on verified providers, your location and eligibility.
            Transparent platform fees apply per transaction.
          </p>
        </div>
      </div>
    </CustomerShell>
  );
}
