import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { OrderKingMark } from "@/components/mark";
import { platformConfig } from "@/lib/platform-config";
import {
  ArrowRight,
  CheckCircle2,
  UtensilsCrossed,
  Percent,
  Bot,
  Volume2,
  ShieldCheck,
  Calculator,
  Clock,
  Sparkles,
  FileText,
  Check,
  Store,
  TrendingUp,
  Wallet,
  Building2,
  BadgeCheck,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function formatRupeesFromPaise(amountPaise: number): string {
  return "₹" + Math.round(amountPaise / 100).toLocaleString("en-IN");
}

function Home() {
  const { user } = useCurrentUserState();

  // Interactive Profit & Margin Calculator State (rupees per order & order count)
  const [aov, setAov] = useState(450);
  const [monthlyOrders, setMonthlyOrders] = useState(1200);

  if (user) return <Navigate to="/dashboard" />;

  // Financial Calculations strictly in integer paise (zero floating-point drift)
  const grossMonthlySalesPaise = aov * 100 * monthlyOrders;

  // Traditional aggregators: ~4200 bps (42.00% effective deductions: base 28% + 3% payment gateway + 6% forced ads + 5% delivery & adjustment levies)
  const legacyDeductionBps = 4200;
  const legacyDeductionsPaise = Math.round((grossMonthlySalesPaise * legacyDeductionBps) / 10000);
  const legacyNetPayoutPaise = grossMonthlySalesPaise - legacyDeductionsPaise;

  // Order King: Standard 2800 bps (28.00% flat delivery take-rate, 0% dine-in fees, zero compulsory ad tax)
  const orderKingTakeRateBps = 2800;
  const orderKingDeductionsPaise = Math.round((grossMonthlySalesPaise * orderKingTakeRateBps) / 10000);
  const orderKingNetPayoutPaise = grossMonthlySalesPaise - orderKingDeductionsPaise;

  const monthlySavingsPaise = orderKingNetPayoutPaise - legacyNetPayoutPaise;
  const annualSavingsPaise = monthlySavingsPaise * 12;

  return (
    <div className="min-h-dvh bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Sticky / Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 group">
            <OrderKingMark className="size-9 text-chili transition-transform duration-200 group-hover:scale-105" />
            <div className="flex items-center gap-2">
              <span className="font-display text-xl font-bold tracking-tight text-white">
                {platformConfig.brand.appName}
              </span>
              <span className="hidden sm:inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-400">
                Partner Portal
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#pillars" className="hover:text-emerald-400 transition-colors">
              Core Advantages
            </a>
            <a href="#calculator" className="hover:text-emerald-400 transition-colors">
              Profit Calculator
            </a>
            <a href="#onboarding" className="hover:text-emerald-400 transition-colors">
              How to Join
            </a>
            <a href="#trust" className="hover:text-emerald-400 transition-colors">
              Partner Trust
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex h-9 items-center rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 text-xs font-semibold text-slate-200 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              Partner Sign In
            </Link>
            <Button
              asChild
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950"
            >
              <a href="/login?mode=up">Register Restaurant</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute top-40 right-10 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm shadow-inner">
            <Sparkles className="size-3.5 text-emerald-400 animate-pulse" />
            <span>Direct Table QR • Fair 28% Delivery Take-Rate • King AI Intelligence</span>
          </div>

          {/* High-Converting Main Headline */}
          <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Partner with Order King. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              Reclaim Your Kitchen Margins &amp; Growth
            </span>
          </h1>

          {/* Crisp Subhead */}
          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Stop losing 40%–50% of your food earnings to legacy aggregator deductions. Order King invites visionary
            restaurateurs to thrive with 0% dine-in commission, an honest 28% delivery take-rate, automated King AI kitchen
            operations, and seamless POS integration.
          </p>

          {/* Prominent Dual CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-13 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base rounded-xl shadow-xl shadow-emerald-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <a href="/login?mode=up" className="flex items-center justify-center gap-2">
                Register Your Restaurant <ArrowRight className="size-4" />
              </a>
            </Button>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex h-13 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 px-7 text-sm font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
            >
              Partner Sign In
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Zero upfront fees • Paperless 2-minute registration • Express 24h go-live
          </p>

          {/* Quick Metrics Bar */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 backdrop-blur-sm text-center">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-400">0%</div>
              <div className="mt-1 text-xs text-slate-400 font-medium">Dine-In Commission</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 backdrop-blur-sm text-center">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-400">28%</div>
              <div className="mt-1 text-xs text-slate-400 font-medium">Flat Delivery Take-Rate</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 backdrop-blur-sm text-center">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-white">24h</div>
              <div className="mt-1 text-xs text-slate-400 font-medium">Express Go-Live</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 backdrop-blur-sm text-center">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-white">T+1</div>
              <div className="mt-1 text-xs text-slate-400 font-medium">Direct Bank Payouts</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars Section */}
      <section id="pillars" className="py-16 border-t border-slate-800/80 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
              <TrendingUp className="size-3.5" />
              THE ORDER KING ADVANTAGE
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-white">
              Built Specifically for Kitchen Profitability
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              Four fundamental pillars engineered to put culinary power, guest loyalty, and unit economics back into the
              hands of restaurant operators.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar 1: 0% Dine-In Commission */}
            <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-7 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <UtensilsCrossed className="size-6" />
                </div>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
                  0% COMMISSION
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                0% Dine-In Commission
              </h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Direct Table QR ordering with zero commission. Diners scan your branded table QR code, browse rich visual
                menus with allergen filters, and pay instantly via UPI. Turn tables 35% faster and keep 100% of your
                in-store food bill.
              </p>
              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Instant Table QR code generation with custom branding</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Zero platform deduction on all dine-in food &amp; beverage bills</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Direct UPI, credit card, and split-bill payment settlement</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: Standard 28% Delivery Take-Rate */}
            <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-7 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Percent className="size-6" />
                </div>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
                  TRANSPARENT TARIFF
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Standard 28% Delivery Take-Rate
              </h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Transparent, fair, and negotiable per outlet. Unlike legacy delivery giants charging 40%–50% total
                effective deductions via hidden ad taxes and mandatory discounts, our 28% take-rate covers logistics,
                gateway, and support with zero hidden traps.
              </p>
              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>No predatory advertising levies or forced discount subsidies</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Negotiable volume tiers for multi-outlet kitchen chains</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Audited daily bank settlements in exact integer paise — zero revenue leakage</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3: Automated King AI Kitchen Assistant */}
            <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-7 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Bot className="size-6" />
                </div>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
                  24/7 KITCHEN COPILOT
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Automated King AI Kitchen Assistant
              </h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                24/7 autonomous shift intelligence &amp; stock recovery. Smart 86-item auto stockout toggling with
                automatic 06:00 AM next-day reset, proactive rush-hour prep SLA throttling, margin-optimizing menu
                engineering, and automated customer dispute defense.
              </p>
              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Automated 06:00 AM stock reset so you never miss breakfast orders</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Rush-hour prep time throttling to prevent kitchen bottlenecks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Instant dispute protection shielding your payouts from false refund claims</span>
                </li>
              </ul>
            </div>

            {/* Pillar 4: Universal POS & Soundbox Bridge */}
            <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-7 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Volume2 className="size-6" />
                </div>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
                  HARDWARE INTEGRATED
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Universal POS &amp; Soundbox Bridge
              </h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Native Petpooja/UrbanPiper bridge &amp; KingPay Soundbox audio alerts. Direct synchronization with your
                existing billing software and live multi-lingual audio verification across 23 Indian languages. Automatic
                thermal KOT printing ensures zero missed kitchen tickets.
              </p>
              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Two-way Petpooja &amp; UrbanPiper menu and order synchronization</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>KingPay Soundbox audio alerts in English, Hindi, and 21 regional languages</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Direct ESC/POS thermal printer support for automated KOT generation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Restaurant Profit & Margin Calculator Section */}
      <section id="calculator" className="py-20 border-t border-slate-800/80 bg-slate-950 relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-mono font-medium text-emerald-400">
              <Calculator className="size-3.5" />
              INTERACTIVE PROFIT CALCULATOR
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-white">
              See How Much You Save on Order King
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              Calculate your retained food revenue comparing Order King&apos;s transparent 28% delivery take-rate against
              traditional 40%–50% aggregator deductions.
            </p>
          </div>

          <div className="mt-12 max-w-5xl mx-auto rounded-3xl border border-slate-800 bg-slate-900/60 p-6 sm:p-10 backdrop-blur-md shadow-2xl">
            {/* Sliders Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8 border-b border-slate-800">
              {/* Slider 1: Average Order Value */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="aov-slider" className="text-sm font-semibold text-slate-200">
                    Average Order Value (AOV)
                  </label>
                  <span className="font-mono text-xl font-bold text-emerald-400">₹{aov}</span>
                </div>
                <input
                  id="aov-slider"
                  type="range"
                  min={150}
                  max={1500}
                  step={25}
                  value={aov}
                  onChange={(e) => setAov(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                />
                <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                  <span>₹150</span>
                  <span>₹800</span>
                  <span>₹1,500</span>
                </div>
                <div className="flex gap-2 pt-1">
                  {[250, 450, 850].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAov(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                        aov === preset
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                          : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      ₹{preset} {preset === 250 ? "(Café & Quick Bites)" : preset === 450 ? "(Casual Dining & Cloud)" : "(Multi-Cuisine Fine Dine)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider 2: Monthly Orders */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="orders-slider" className="text-sm font-semibold text-slate-200">
                    Monthly Delivery Orders
                  </label>
                  <span className="font-mono text-xl font-bold text-emerald-400">
                    {monthlyOrders.toLocaleString("en-IN")} orders
                  </span>
                </div>
                <input
                  id="orders-slider"
                  type="range"
                  min={100}
                  max={5000}
                  step={50}
                  value={monthlyOrders}
                  onChange={(e) => setMonthlyOrders(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                />
                <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                  <span>100</span>
                  <span>2,500</span>
                  <span>5,000</span>
                </div>
                <div className="flex gap-2 pt-1">
                  {[500, 1200, 3000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMonthlyOrders(preset)}
                      className={`text-[11px] px-2.5 py-1 rounded-md border transition-all ${
                        monthlyOrders === preset
                          ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                          : "border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      {preset.toLocaleString()} {preset === 500 ? "(Boutique Kitchen)" : preset === 1200 ? "(Thriving Bistro)" : "(High-Volume Flagship)"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Comparison Cards Grid */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Legacy Aggregators Card */}
              <div className="rounded-2xl border border-rose-950/50 bg-rose-950/10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-rose-400">Typical Aggregators</span>
                    <h4 className="font-display text-lg font-bold text-white">42% Total Deductions</h4>
                  </div>
                  <span className="rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 text-xs font-mono">
                    High Cut
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Base commission (28%) + Payment Gateway (3%) + Forced Ad Bidding (6%) + Delivery Adjustments &amp; Levies (5%).
                </p>
                <div className="space-y-2 pt-2 border-t border-rose-900/30 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Monthly Gross Sales:</span>
                    <span className="font-mono text-slate-200">{formatRupeesFromPaise(grossMonthlySalesPaise)}</span>
                  </div>
                  <div className="flex justify-between text-rose-400">
                    <span>Platform Deductions (42%):</span>
                    <span className="font-mono font-medium">-{formatRupeesFromPaise(legacyDeductionsPaise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-200 font-semibold pt-1 border-t border-rose-900/30 text-sm">
                    <span>Net Kitchen Payout:</span>
                    <span className="font-mono text-slate-100">{formatRupeesFromPaise(legacyNetPayoutPaise)}</span>
                  </div>
                </div>
              </div>

              {/* Order King Card */}
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-6 space-y-4 shadow-xl shadow-emerald-950/30">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">Order King Partner</span>
                    <h4 className="font-display text-lg font-bold text-white">28% Flat Take-Rate</h4>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-mono">
                    Fair &amp; Transparent
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Flat 28% delivery take-rate, 0% dine-in commission, zero compulsory ad tax, and no hidden penalties.
                </p>
                <div className="space-y-2 pt-2 border-t border-emerald-900/30 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Monthly Gross Sales:</span>
                    <span className="font-mono text-slate-200">{formatRupeesFromPaise(grossMonthlySalesPaise)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Platform Take-Rate (28%):</span>
                    <span className="font-mono font-medium">-{formatRupeesFromPaise(orderKingDeductionsPaise)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-300 font-semibold pt-1 border-t border-emerald-900/30 text-sm">
                    <span>Net Kitchen Payout:</span>
                    <span className="font-mono text-emerald-400">{formatRupeesFromPaise(orderKingNetPayoutPaise)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings Callout Banner */}
            <div className="mt-8 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-emerald-900/40 to-slate-900 border border-emerald-500/50 p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-400 font-semibold text-sm">
                  <Wallet className="size-4" />
                  <span>Your Additional Estimated Profit with Order King</span>
                </div>
                <div className="font-display text-3xl sm:text-4xl font-black text-white">
                  +{formatRupeesFromPaise(monthlySavingsPaise)} <span className="text-base font-normal text-slate-300">/ month</span>
                </div>
                <p className="text-xs text-emerald-300/90 font-medium">
                  That&apos;s an extra <strong className="text-white">+{formatRupeesFromPaise(annualSavingsPaise)}</strong> retained in your bank
                  account annually.
                </p>
              </div>

              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-7 h-12 shadow-lg shadow-emerald-950 shrink-0"
              >
                <a href="/login?mode=up">
                  Claim Your Margins Now <ArrowRight className="size-4 ml-1.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Clear Onboarding Journey */}
      <section id="onboarding" className="py-20 border-t border-slate-800/80 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
              <Clock className="size-3.5" />
              FRICTIONLESS ONBOARDING
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-white">
              Go Live in 3 Simple Steps
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              Get onboarded and start receiving live customer orders in under 24 hours with our streamlined digital
              pipeline.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-7 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-base">
                  01
                </span>
                <span className="text-[11px] font-mono text-slate-300 border border-slate-800 rounded px-2 py-0.5">
                  ~2 MINS
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-white">Register Outlet &amp; Quick KYC</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Sign up with your 10-digit mobile number or business email. Share your restaurant location and authorized
                signatory details for instant, paperless partner onboarding.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> Instant OTP &amp; digital partner onboarding
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-7 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-base">
                  02
                </span>
                <span className="text-[11px] font-mono text-slate-300 border border-slate-800 rounded px-2 py-0.5">
                  ~5 MINS
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-white">Share Menu &amp; FSSAI Details</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Provide your 14-digit FSSAI food safety certificate, GSTIN (100% optional if annual turnover is under ₹20 Lakhs),
                and menu copy. King AI instantly digitizes your dishes, prices, and dietary tags.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> Instant AI menu digitization &amp; tag extraction
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-7 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-base">
                  03
                </span>
                <span className="text-[11px] font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 rounded px-2 py-0.5">
                  UNDER 24H
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-white">Go Live in 24 Hours</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                We perform an instant penny-drop bank verification, dispatch your KingPay Soundbox, sync your Petpooja /
                UrbanPiper POS, and activate live orders across your delivery catchment.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> Live orders &amp; reliable T+1 daily bank payouts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Hospitality Standards Badges Section */}
      <section id="trust" className="py-16 border-t border-slate-800/80 bg-slate-950 scroll-mt-12">
        <div id="compliance" className="scroll-mt-20" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
              <ShieldCheck className="size-3.5" />
              RESTAURATEUR TRUST &amp; TRANSPARENCY
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-white">
              Built with Absolute Care for Your Kitchen &amp; Cashflow
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              Rigorous security standards, transparent settlements, and automated tax handling designed to protect your hard-earned restaurant revenue.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Badge 1: FSSAI FoSCoS */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <ShieldCheck className="size-5" />
                  </div>
                  <span className="text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                    FOOD SAFETY STANDARDS
                  </span>
                </div>
                <h4 className="font-display text-lg font-bold text-white">FSSAI 14-Digit Verification</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Smooth, verified onboarding with your 14-digit FSSAI food safety license. Automated reminders 30 days before expiration ensure your kitchen stays continuously active and diners remain confident.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 font-medium">
                ✓ Verified 14-digit food safety certification
              </div>
            </div>

            {/* Badge 2: Automated 5% GST Protection */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <FileText className="size-5" />
                  </div>
                  <span className="text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                    TAX CLEARANCE
                  </span>
                </div>
                <h4 className="font-display text-lg font-bold text-white">Automated 5% GST Protection</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Order King directly remits the 5% restaurant GST to the government under CGST rules — never debited from your earnings. You receive clear, CA-friendly ledgers with every daily payout.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 font-medium">
                ✓ CA-ready ledger &amp; one-click GST reports
              </div>
            </div>

            {/* Badge 3: Instant Penny-Drop Bank Verification */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <Building2 className="size-5" />
                  </div>
                  <span className="text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                    BANKING INTEGRATION
                  </span>
                </div>
                <h4 className="font-display text-lg font-bold text-white">Penny-Drop Bank Verification</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time ₹1 penny-drop validation confirms active account status and exact beneficiary name matching before go-live, ensuring seamless daily T+1 automated payouts directly to your bank account.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 font-medium">
                ✓ Direct IMPS/NEFT daily bank transfer
              </div>
            </div>
          </div>

          {/* Secondary Trust Strip */}
          <div className="mt-8 rounded-xl border border-slate-800/80 bg-slate-900/30 p-4 text-center">
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <Lock className="size-3.5 text-emerald-400" /> 100% Restaurant Data Isolation &amp; Privacy
              </span>
              <span className="flex items-center gap-1.5">
                <Store className="size-3.5 text-emerald-400" /> Zero Competing Private-Label Brands (We Never Compete With You)
              </span>
              <span className="flex items-center gap-1.5">
                <BadgeCheck className="size-3.5 text-emerald-400" /> 23 Indian Languages Supported on Soundbox &amp; Portal
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* High-Converting Final CTA Section */}
      <section className="py-20 border-t border-slate-800/80 bg-gradient-to-b from-slate-900/50 to-slate-950">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to Take Back Your Kitchen Margins?
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-slate-300">
            Join thousands of smart restaurant owners across India who are growing their revenue with 0% dine-in
            commission and transparent 28% delivery take-rates.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-13 px-9 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base rounded-xl shadow-xl shadow-emerald-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <a href="/login?mode=up" className="flex items-center justify-center gap-2">
                Register Your Restaurant Now <ArrowRight className="size-4" />
              </a>
            </Button>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex h-13 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 px-7 text-sm font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
            >
              Partner Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Modern Partner Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10 text-slate-400 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <OrderKingMark className="size-7 text-chili" />
            <span className="font-display text-base font-bold text-white">{platformConfig.brand.appName}</span>
            <span className="text-slate-500">|</span>
            <span className="text-[11px] text-slate-400">
              © {new Date().getFullYear()} Order King Foods Private Limited. All rights reserved.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] text-slate-400">
            <a href="#pillars" className="hover:text-slate-200 transition">
              Advantages
            </a>
            <a href="#calculator" className="hover:text-slate-200 transition">
              Profit Calculator
            </a>
            <a href="#onboarding" className="hover:text-slate-200 transition">
              Onboarding Journey
            </a>
            <a href="#trust" className="hover:text-slate-200 transition">
              Trust &amp; Security
            </a>
            <Link to="/login" className="hover:text-slate-200 transition">
              Partner Sign In
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
