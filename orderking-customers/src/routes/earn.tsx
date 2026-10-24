import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Crown,
  Gift,
  MapPin,
  ShieldCheck,
  Sparkles,
  Wallet,
  Users,
  Receipt,
  CreditCard,
  UtensilsCrossed,
} from "lucide-react";
import { CustomerShell } from "@/components/market/shell";
import { useLocationStore } from "@/lib/stores/location";
import { EarnPageSkeleton } from "@/components/skeletons/route-skeletons";
import { AppErrorComponent } from "@/lib/error-component";
import { BillSplitterCalculator } from "@/components/fintech/bill-splitter-calculator";
import { OrderKingPassbookReceipts } from "@/components/fintech/orderking-passbook-receipts";
import { FoodUpiCheckoutCard } from "@/components/fintech/food-upi-checkout-card";

export const Route = createFileRoute("/earn")({
  component: CrownOpportunitiesPage,
  pendingComponent: EarnPageSkeleton,
  errorComponent: AppErrorComponent,
});

type FeatureTab = "splitter" | "passbook" | "razorpay";

function CrownOpportunitiesPage() {
  const location = useLocationStore((s) => s.location);
  const city = location?.cityName || "your city";
  const [activeTab, setActiveTab] = useState<FeatureTab>("splitter");

  return (
    <CustomerShell>
      <div className="min-h-screen bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] px-4 py-6 pb-32 text-stone-900">
        <div className="mx-auto max-w-5xl space-y-7">
          {/* Royal Hero Header */}
          <header className="relative overflow-hidden rounded-3xl border-2 border-amber-400/60 bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 p-6 text-white shadow-2xl sm:p-9">
            <div
              className="pointer-events-none absolute -right-20 -top-20 size-60 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <div className="flex items-center gap-2.5 text-amber-300">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-stone-950 shadow-md shadow-amber-400/30">
                  <Crown className="size-5" aria-hidden="true" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.25em] text-amber-300">
                  OrderKing Crown Privilege
                </span>
              </div>
              <h1 className="mt-3.5 text-3xl font-black tracking-tight sm:text-4xl">
                Rewards without confusion
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-300 font-medium">
                Crown Promotional Credits are eligible-order discounts, not cash or UPI withdrawals.
                Discounts apply directly at checkout through verified merchant concessions.
                Zero synthetic points, unbacked bullion claims, or simulated balances.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <span className="inline-flex items-center rounded-full border border-amber-400/80 bg-gradient-to-r from-amber-500/20 via-yellow-400/30 to-amber-500/20 px-3.5 py-1.5 text-xs font-black text-amber-200 shadow-sm">
                  <Sparkles className="mr-1.5 inline size-3.5 text-amber-300" /> Transparent Order Discounts · Active
                </span>
              </div>
            </div>
          </header>

          {/* Compliance & How Crown Credits Work Grid */}
          <section className="grid gap-4 sm:grid-cols-2" aria-label="How Crown Credits work">
            <div className="rounded-3xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xs">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-emerald-950">Cashback and paid balances</h2>
                  <p className="text-[11px] font-bold text-stone-400">Strict NPCI &amp; RBI compliance</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-stone-600">
                Real balances require provider and ledger reconciliation. No cash balance is inferred
                from page visits, referrals, survey answers or local browser activity.
              </p>
              <div className="mt-4 pt-3 border-t border-amber-900/5">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                  ✓ Ledger verified operations
                </span>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white shadow-xs">
                  <Gift className="size-5" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-amber-950">Crown Promotional Credits</h2>
                  <p className="text-[11px] font-bold text-stone-400">Culinary privilege discounts</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-stone-600">
                An eligible reward is capped by verified settled commission after taxes,
                transaction fees, refunds, service costs and merchant allowances.
                Redemption is applied directly to qualifying food checkout.
              </p>
              <div className="mt-4 pt-3 border-t border-amber-900/5">
                <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                  👑 Applied at food checkout
                </span>
              </div>
            </div>
          </section>

          {/* Working, Clean FinTech Features Section (Replaced Non-Functional Placeholders) */}
          <section className="space-y-4" aria-labelledby="live-features-heading">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-sm p-4 rounded-3xl border border-amber-900/10 shadow-xs">
              <div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <BadgeCheck className="size-5" aria-hidden="true" />
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-800">
                    Live Consumer Protection Suite
                  </p>
                </div>
                <h2 id="live-features-heading" className="mt-1 text-xl font-black text-stone-900">
                  Active Financial Utilities
                </h2>
                <p className="text-xs text-stone-500">
                  Zero placeholder blockers. Fully operational tools with 0% gateway markup.
                </p>
              </div>

              {/* Navigation Pills */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab("splitter")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === "splitter"
                      ? "bg-amber-400 text-stone-950 shadow-xs font-black"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Users className="size-3.5" />
                  <span>Bill Splitter</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("passbook")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === "passbook"
                      ? "bg-amber-400 text-stone-950 shadow-xs font-black"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <Receipt className="size-3.5" />
                  <span>Passbook &amp; Receipts</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("razorpay")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    activeTab === "razorpay"
                      ? "bg-amber-400 text-stone-950 shadow-xs font-black"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  <CreditCard className="size-3.5" />
                  <span>Razorpay UPI</span>
                </button>
              </div>
            </div>

            {/* Render Selected Working Feature */}
            <div className="transition-all duration-200">
              {activeTab === "splitter" && <BillSplitterCalculator theme="light" />}
              {activeTab === "passbook" && <OrderKingPassbookReceipts theme="light" />}
              {activeTab === "razorpay" && <FoodUpiCheckoutCard theme="light" />}
            </div>
          </section>

          {/* Explore local food & services */}
          <section
            className="rounded-3xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:p-8"
            aria-labelledby="explore-heading"
          >
            <div className="flex items-center gap-2 text-stone-700">
              <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-400 text-white text-xs shadow-xs">
                <MapPin className="size-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wide text-amber-900">
                Explore services in {city}
              </span>
            </div>
            <h2 id="explore-heading" className="mt-2 text-xl font-black text-stone-900">
              Order food with verified discounts
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Link
                to="/"
                className="group flex items-center justify-between rounded-2xl border border-emerald-300/80 bg-gradient-to-r from-emerald-50/80 to-emerald-50/30 p-4 text-sm font-black text-emerald-950 no-underline shadow-2xs hover:border-emerald-500 transition-all"
              >
                <span>Explore food menus</span>
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/travel"
                className="group flex items-center justify-between rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50/80 to-amber-50/30 p-4 text-sm font-black text-amber-950 no-underline shadow-2xs hover:border-amber-500 transition-all"
              >
                <span>Explore travel</span>
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/tutor"
                className="group flex items-center justify-between rounded-2xl border border-sky-300/80 bg-gradient-to-r from-sky-50/80 to-sky-50/30 p-4 text-sm font-black text-sky-950 no-underline shadow-2xs hover:border-sky-500 transition-all"
              >
                <span>Study &amp; careers</span>
                <BriefcaseBusiness className="size-4 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs text-stone-500">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              All transactions are settled via authorized payment aggregators in strict accordance with Reserve Bank of
              India directions and Consumer Protection (E-Commerce) Rules 2020.
            </p>
          </section>
        </div>
      </div>
    </CustomerShell>
  );
}
