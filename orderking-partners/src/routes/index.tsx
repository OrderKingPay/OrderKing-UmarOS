import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { OrderKingMark } from "@/components/mark";
import { platformConfig } from "@/lib/platform-config";
import {
  ArrowRight,
  CheckCircle2,
  UtensilsCrossed,
  Bot,
  Volume2,
  ShieldCheck,
  Clock,
  Sparkles,
  FileText,
  Check,
  Store,
  TrendingUp,
  Building2,
  BadgeCheck,
  Lock,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user } = useCurrentUserState();

  if (user) return <Navigate to="/dashboard" />;

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
            <a href="#why-partner" className="hover:text-emerald-400 transition-colors">
              Why Partner
            </a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
              How It Works
            </a>
            <a href="#trust" className="hover:text-emerald-400 transition-colors">
              Trust &amp; Standards
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
      <section id="why-partner" className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        {/* Ambient Glow Effects */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute top-40 right-10 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm shadow-inner">
            <Sparkles className="size-3.5 text-emerald-400 animate-pulse" />
            <span>Trusted by restaurants across India</span>
          </div>

          {/* Quiet, Dignified National Leader Headline */}
          <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Partner with Order King. <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
              Grow your restaurant business with India&apos;s premier food delivery network
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Connect with hungry customers across your city, manage live kitchen orders with ease, and receive seamless automated daily settlements.
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
            Zero setup fee to get started • 100% paperless digital onboarding • Go live in 24 hours
          </p>

          {/* Quick Metrics & Scale Bar */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 backdrop-blur-sm text-center">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-white">100+</div>
              <div className="mt-1 text-xs text-slate-400 font-medium">Cities Served</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 backdrop-blur-sm text-center">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-400">24h</div>
              <div className="mt-1 text-xs text-slate-400 font-medium">Express Go-Live</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 backdrop-blur-sm text-center">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-white">T+1</div>
              <div className="mt-1 text-xs text-slate-400 font-medium">Direct Bank Payouts</div>
            </div>
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 sm:p-4 backdrop-blur-sm text-center">
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-400">24/7</div>
              <div className="mt-1 text-xs text-slate-400 font-medium">Partner Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars / Highlights Section */}
      <section id="features" className="py-16 border-t border-slate-800/80 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
              <TrendingUp className="size-3.5" />
              PARTNER CAPABILITIES
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-white">
              Everything You Need to Run &amp; Scale Your Food Business
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              Built with restaurant operators in mind — from busy cloud kitchens to heritage dining establishments.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar 1: Live Kitchen Command & KDS */}
            <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-7 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <UtensilsCrossed className="size-6" />
                </div>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
                  OPERATIONS
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Live Kitchen Command &amp; KDS
              </h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Real-time order acceptance, rush-hour preparation throttling, and instant thermal KOT generation. Keep kitchen staff organized and food flowing without delays.
              </p>
              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Real-time audio alerts and live order management screen</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Rush-hour prep time pacing to prevent kitchen bottlenecks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Direct ESC/POS thermal printer support for instant kitchen tickets</span>
                </li>
              </ul>
            </div>

            {/* Pillar 2: Digital Menu & AI Photo Studio */}
            <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-7 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Bot className="size-6" />
                </div>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
                  MENU INTELLIGENCE
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Digital Menu &amp; AI Photo Studio
              </h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Manage dishes, categories, and inventory effortlessly. Toggle out-of-stock items with one tap and utilize AI-assisted dish presentation tools to keep your digital storefront attractive.
              </p>
              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Instant item stockout toggle with automated morning resets</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Smart dietary tagging for Vegetarian, Non-Veg, and allergen indicators</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Flexible portion variants, add-on combos, and custom dish notes</span>
                </li>
              </ul>
            </div>

            {/* Pillar 3: Direct Automated Settlements */}
            <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-7 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Building2 className="size-6" />
                </div>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
                  TRANSPARENT PAYOUTS
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Direct Automated Settlements
              </h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Daily automated bank payouts delivered with complete financial clarity. Detailed order-level reconciliation and CA-ready tax statements give you absolute control of your cashflow.
              </p>
              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Reliable T+1 daily direct bank payouts via NEFT / IMPS</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Transparent, itemized ledger entries for every single order</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Exportable monthly GST statements and CA-ready accounting summaries</span>
                </li>
              </ul>
            </div>

            {/* Pillar 4: Dedicated Partner Support & POS Sync */}
            <div className="group relative rounded-2xl border border-slate-800/80 bg-slate-900/60 p-7 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex size-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                  <Volume2 className="size-6" />
                </div>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-400">
                  HARDWARE &amp; INTEGRATIONS
                </span>
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Dedicated Partner Support &amp; POS Sync
              </h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Direct two-way synchronization with leading POS systems like Petpooja and UrbanPiper, paired with KingPay Soundbox audio confirmation in 23 Indian languages.
              </p>
              <ul className="mt-5 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>Two-way Petpooja &amp; UrbanPiper menu and order synchronization</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>KingPay Soundbox audio announcements across 23 Indian languages</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-3.5 text-emerald-400 shrink-0" />
                  <span>24/7 dedicated partner assistance whenever your kitchen needs help</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Clear Onboarding Journey */}
      <section id="how-it-works" className="py-20 border-t border-slate-800/80 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
              <Clock className="size-3.5" />
              SIMPLE ONBOARDING
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-white">
              Start Receiving Orders in 3 Simple Steps
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              A completely digital, paperless process designed to have your restaurant online in under 24 hours.
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
              <h3 className="mt-5 font-display text-lg font-bold text-white">Register Outlet &amp; Phone</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Sign up with your mobile number or business email. Enter your restaurant name, primary contact, and location details.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> Instant mobile OTP verification
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
              <h3 className="mt-5 font-display text-lg font-bold text-white">Add Menu &amp; FSSAI</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Provide your 14-digit FSSAI food safety certificate, menu card or photos, and bank account details. GSTIN is optional for businesses with turnover under ₹20 Lakhs.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> Fast digital verification &amp; menu digitization
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
              <h3 className="mt-5 font-display text-lg font-bold text-white">Start Receiving Orders</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Our team validates your profile with an instant ₹1 penny-drop bank check, connects your soundbox or POS, and turns on live orders in your delivery zone.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-800/80 text-[11px] text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> Go live with automated daily bank settlements
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
              RESTAURANT PARTNER TRUST
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-white">
              Built with Integrity, Security &amp; Reliability
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              We hold ourselves to the highest standards of food safety, financial transparency, and partner privacy.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Badge 1: FSSAI Food Safety */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <ShieldCheck className="size-5" />
                  </div>
                  <span className="text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                    FOOD SAFETY
                  </span>
                </div>
                <h4 className="font-display text-lg font-bold text-white">FSSAI Food Safety Verification</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Smooth digital validation of your 14-digit FSSAI license. Proactive renewal reminders sent well in advance so your operations remain uninterrupted.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 font-medium">
                ✓ Verified 14-digit food safety standard
              </div>
            </div>

            {/* Badge 2: Transparent Tax & GST Statements */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    <FileText className="size-5" />
                  </div>
                  <span className="text-[10px] font-mono border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded">
                    TAX ACCOUNTING
                  </span>
                </div>
                <h4 className="font-display text-lg font-bold text-white">Clean CA-Ready Statements</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automated GST handling with structured reports for your Chartered Accountant. Every order is clearly accounted for with itemized tax records.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 font-medium">
                ✓ Exportable monthly &amp; quarterly accounting statements
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
                    SECURE PAYOUTS
                  </span>
                </div>
                <h4 className="font-display text-lg font-bold text-white">Penny-Drop Bank Verification</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Instant ₹1 penny-drop verification ensures bank account active status and exact beneficiary name matching before your first order, ensuring zero payout rejections.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 font-medium">
                ✓ Direct T+1 daily bank deposits
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
                <Store className="size-3.5 text-emerald-400" /> Zero Competing Private-Label Brands
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
            Ready to Grow Your Restaurant with Order King?
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-slate-300">
            Join thousands of restaurants across India expanding their reach and serving happy customers every day.
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
          <p className="mt-3 text-xs text-slate-400">
            No setup fee • Paperless onboarding • Live in 24 hours
          </p>
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
            <a href="#why-partner" className="hover:text-slate-200 transition">
              Why Partner
            </a>
            <a href="#features" className="hover:text-slate-200 transition">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-slate-200 transition">
              How It Works
            </a>
            <a href="#trust" className="hover:text-slate-200 transition">
              Trust &amp; Standards
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
