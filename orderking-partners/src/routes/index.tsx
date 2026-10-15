import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { OrderKingMark } from "@/components/mark";
import { platformConfig } from "@/lib/platform-config";
import {
  ArrowRight,
  CheckCircle2,
  Users,
  Bike,
  BarChart3,
  TrendingUp,
  FileText,
  Clock,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Check,
  Building2,
  Receipt,
  ShieldCheck,
  Store,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: Home });

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "How long does it take for my restaurant to go live?",
    answer:
      "Usually within 24 hours once your menu and required documents are submitted. Our partner onboarding team verifies your details and turns on live ordering for your catchment area.",
  },
  {
    question: "What device do I need to manage orders?",
    answer:
      "You can use any smartphone, tablet, laptop, or desktop computer. You can also connect to your existing POS setup (including Petpooja and UrbanPiper) and standard thermal receipt printers.",
  },
  {
    question: "How and when do I receive payouts?",
    answer:
      "Payouts are deposited directly into your verified bank account on a regular daily T+1 schedule with complete order itemization and transparent transaction ledgers.",
  },
  {
    question: "How can I update my menu and prices?",
    answer:
      "You can add dishes, modify prices, update photos, or toggle item availability in seconds anytime directly from your Order King Partner dashboard.",
  },
  {
    question: "Is a GSTIN mandatory to register?",
    answer:
      "No, a GSTIN is not mandatory if your restaurant's annual turnover is under ₹20 Lakhs or if you are exempt under applicable rules. Only a valid FSSAI license and bank details are required to get started.",
  },
];

function Home() {
  const { user } = useCurrentUserState();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  if (user) return <Navigate to="/dashboard" />;

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-dvh bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navigation Bar */}
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
            <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">
              How It Works
            </a>
            <a href="#requirements" className="hover:text-emerald-400 transition-colors">
              Requirements
            </a>
            <a href="#faqs" className="hover:text-emerald-400 transition-colors">
              FAQs
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-200 hover:border-slate-700 hover:bg-slate-800 hover:text-white"
            >
              <Link to="/login">Partner Login</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950"
            >
              <Link to="/onboarding">Register Restaurant</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute top-40 right-10 -z-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm shadow-inner">
            <Sparkles className="size-3.5 text-emerald-400" />
            <span>Grow your food business with Order King</span>
          </div>

          {/* Calm, Prestigious Benchmark Headline */}
          <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
            Partner with Order King
          </h1>

          {/* Subtitle */}
          <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Grow your restaurant business with India&apos;s trusted food ordering network.
          </p>

          {/* Registration & Login Action Card */}
          <div className="mt-10 max-w-xl mx-auto rounded-2xl border border-slate-800/90 bg-slate-900/70 p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Button
                asChild
                size="lg"
                className="w-full sm:w-auto h-12 px-7 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-950 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Link to="/onboarding" className="flex items-center justify-center gap-2">
                  Register your restaurant <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-6 rounded-xl border border-slate-700 bg-slate-800/80 text-sm font-semibold text-slate-200 hover:border-slate-600 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
              >
                <Link to="/login">Login to view existing restaurant</Link>
              </Button>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Simple digital setup • Go live in 24 hours • Need help? Contact partner support
            </p>
          </div>
        </div>
      </section>

      {/* Section 1: Why should you partner with Order King? */}
      <section id="why-partner" className="py-20 border-t border-slate-800/80 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
              <TrendingUp className="size-3.5" />
              PARTNER ADVANTAGE
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-white">
              Why should you partner with Order King?
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              Everything you need to expand your kitchen operations and connect with more diners every day.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Reach More Customers */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80 shadow-md">
              <div className="flex size-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Users className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-white">
                Reach More Customers
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Expand your reach to thousands of hungry food lovers across your neighborhood and city looking for great food.
              </p>
            </div>

            {/* Card 2: Dependable Delivery */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80 shadow-md">
              <div className="flex size-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Bike className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-white">
                Dependable Delivery
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Reliable delivery fleet network ensuring orders are picked up on time and delivered hot and fresh to customers.
              </p>
            </div>

            {/* Card 3: Real-Time Insights */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80 shadow-md">
              <div className="flex size-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <BarChart3 className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-white">
                Real-Time Insights
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Dedicated merchant console to track live orders, customer reviews, preparation pacing, and daily revenue reports.
              </p>
            </div>

            {/* Card 4: Sustained Growth */}
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/40 hover:bg-slate-900/80 shadow-md">
              <div className="flex size-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <Store className="size-6" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-white">
                Sustained Growth
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Expand your food business across online delivery and table dining with transparent, predictable daily operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: How it works */}
      <section id="how-it-works" className="py-20 border-t border-slate-800/80 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
              <Clock className="size-3.5" />
              SIMPLE PROCESS
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-white">
              How it works
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              Start receiving online food orders in 3 straightforward steps.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-7 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-base">
                  01
                </span>
                <span className="text-[11px] font-mono text-slate-400 border border-slate-800 rounded px-2 py-0.5">
                  STEP 1
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-white">
                Create your page
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Register outlet details, address, and primary contact information for your restaurant.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-800/80 text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> Instant mobile OTP verification
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-7 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-base">
                  02
                </span>
                <span className="text-[11px] font-mono text-slate-400 border border-slate-800 rounded px-2 py-0.5">
                  STEP 2
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-white">
                Set up your menu
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Add your signature dishes, prices, operating timings, and upload your FSSAI license copy.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-800/80 text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> Fast menu digitization &amp; dish photos
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-7 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-base">
                  03
                </span>
                <span className="text-[11px] font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 rounded px-2 py-0.5">
                  GO LIVE
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-white">
                Start receiving orders
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                Manage incoming orders seamlessly with our merchant app or web dashboard and start delivering.
              </p>
              <div className="mt-5 pt-4 border-t border-slate-800/80 text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5" /> Automated T+1 bank settlements
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: What you need to get started */}
      <section id="requirements" className="py-20 border-t border-slate-800/80 bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
              <ShieldCheck className="size-3.5" />
              ONBOARDING REQUIREMENTS
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-white">
              What you need to get started
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              Keep these simple details ready to complete your digital partner registration quickly.
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 sm:p-10 backdrop-blur-md shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Requirement 1 */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-800/70 bg-slate-950/40">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Check className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm sm:text-base">
                    FSSAI registration or license certificate
                  </h4>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    A valid 14-digit FSSAI food safety registration or license number for your restaurant outlet.
                  </p>
                </div>
              </div>

              {/* Requirement 2 */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-800/70 bg-slate-950/40">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm sm:text-base">
                    PAN card &amp; business bank account details
                  </h4>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Authorized signatory PAN and active bank account details (account number &amp; IFSC) for regular payouts.
                  </p>
                </div>
              </div>

              {/* Requirement 3 */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-800/70 bg-slate-950/40">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm sm:text-base">
                    Restaurant menu card and dish pricing
                  </h4>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    A physical or digital copy of your menu with dishes, portion sizes, prices, and dietary indicators.
                  </p>
                </div>
              </div>

              {/* Requirement 4 */}
              <div className="flex items-start gap-4 p-4 rounded-xl border border-slate-800/70 bg-slate-950/40">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Receipt className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm sm:text-base">
                    GSTIN certificate (Optional)
                  </h4>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    Optional if your restaurant&apos;s annual turnover is under ₹20 Lakhs or if exempt under government regulations.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <Button
                asChild
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm px-8 rounded-xl shadow-md shadow-emerald-950"
              >
                <Link to="/onboarding" className="inline-flex items-center gap-2">
                  Ready to apply? Start registration <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Frequently Asked Questions */}
      <section id="faqs" className="py-20 border-t border-slate-800/80 bg-slate-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono font-medium text-emerald-400">
              <HelpCircle className="size-3.5" />
              QUESTIONS &amp; ANSWERS
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base">
              Everything you need to know about partnering and managing your restaurant with Order King.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={faq.question}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-semibold text-white hover:text-emerald-300 transition-colors gap-4"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-emerald-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ready to Grow Call-to-Action */}
      <section className="py-20 border-t border-slate-800/80 bg-gradient-to-b from-slate-900/50 to-slate-950">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Ready to grow your restaurant?
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-slate-300">
            Join restaurants across India expanding their reach with Order King.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-13 px-8 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-base rounded-xl shadow-xl shadow-emerald-950 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Link to="/onboarding" className="flex items-center justify-center gap-2">
                Register your restaurant <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-13 px-8 rounded-xl border border-slate-700 bg-slate-900/80 text-sm font-semibold text-slate-200 hover:border-slate-600 hover:bg-slate-800 hover:text-white transition-all shadow-sm"
            >
              <Link to="/login">Partner Login</Link>
            </Button>
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
            <a href="#why-partner" className="hover:text-slate-200 transition">
              Why Partner
            </a>
            <a href="#how-it-works" className="hover:text-slate-200 transition">
              How It Works
            </a>
            <a href="#requirements" className="hover:text-slate-200 transition">
              Requirements
            </a>
            <a href="#faqs" className="hover:text-slate-200 transition">
              FAQs
            </a>
            <Link to="/login" className="hover:text-slate-200 transition">
              Partner Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
