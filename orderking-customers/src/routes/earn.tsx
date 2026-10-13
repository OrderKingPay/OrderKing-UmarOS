import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, BriefcaseBusiness, Crown, Gift, LockKeyhole, MapPin, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { useLocationStore } from "@/lib/stores/location";
import { TASK_DEFINITIONS } from "@/lib/earn/micro-tasks";

export const Route = createFileRoute("/earn")({ component: CrownOpportunitiesPage });

function CrownOpportunitiesPage() {
  const location = useLocationStore((s) => s.location);
  const city = location.cityName || "your city";
  return (
    <CustomerShell>
      <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-white to-emerald-50/30 px-4 py-6 pb-32 text-slate-900">
        <div className="mx-auto max-w-5xl space-y-7">
          <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-6 text-white shadow-xl sm:p-9">
            <div className="absolute -right-20 -top-20 size-56 rounded-full bg-amber-400/10 blur-3xl" aria-hidden="true" />
            <div className="relative">
              <div className="flex items-center gap-2 text-amber-300">
                <Crown className="size-6" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">OrderKing Crown</span>
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Rewards without confusion</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200">
                Crown Promotional Credits are eligible-order discounts, not cash or UPI withdrawals.
                An entitlement is available only when funded and confirmed through a verified settled
                merchant transaction. This promotional program is not active yet.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-200">
                  <LockKeyhole className="mr-1 inline size-3.5" /> Credits not yet activated
                </span>
                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold text-emerald-200">
                  <ShieldCheck className="mr-1 inline size-3.5" /> No instant cash-out promises
                </span>
              </div>
            </div>
          </header>

          <section className="grid gap-3 sm:grid-cols-2" aria-label="How Crown Credits work">
            <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                <Wallet className="size-5" /> Cashback and paid balances
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Real balances require provider and ledger reconciliation. No cash balance is inferred
                from page visits, referrals, survey answers or local browser activity.
              </p>
              <p className="mt-3 font-semibold text-emerald-700">No verified payout available here</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
                <Gift className="size-5" /> Crown Promotional Credits
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                An eligible reward is capped by verified settled commission after taxes,
                transaction fees, refunds, service costs and a founder reserve.
                Redemption is restricted to a qualifying food order.
              </p>
              <p className="mt-3 font-semibold text-amber-700">No transferable or withdrawable value</p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="community-program-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <BadgeCheck className="size-5" aria-hidden="true" />
                  <p className="text-xs font-semibold uppercase tracking-wider">Community program</p>
                </div>
                <h2 id="community-program-heading" className="mt-2 text-xl font-bold">Ways to contribute</h2>
                <p className="mt-1 text-sm text-slate-500">Illustrative opportunities only; none accepts paid claims today.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                Not accepting applications
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Object.values(TASK_DEFINITIONS).map((task) => (
                <article key={task.type} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <h3 className="font-semibold text-slate-900">{task.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{task.description}</p>
                  <p className="mt-3 text-xs font-medium text-amber-800">Coming later · No credit or cash offered</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="explore-heading">
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="size-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">Explore options in {city}</span>
            </div>
            <h2 id="explore-heading" className="mt-2 text-xl font-bold">Use services available to you</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link to="/" className="group flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900 no-underline hover:border-emerald-400">
                Explore food <ArrowRight className="size-4 group-hover:translate-x-0.5" />
              </Link>
              <Link to="/travel" className="group flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900 no-underline hover:border-amber-400">
                Explore travel <ArrowRight className="size-4 group-hover:translate-x-0.5" />
              </Link>
              <Link to="/tutor" className="group flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-900 no-underline hover:border-blue-400">
                Study and careers <BriefcaseBusiness className="size-4" />
              </Link>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-amber-500" />
              Live tasks, partner-funded offers and referral awards will appear only after the supporting
              provider integrations and settlements have been verified.
            </p>
          </section>
        </div>
      </div>
    </CustomerShell>
  );
}
