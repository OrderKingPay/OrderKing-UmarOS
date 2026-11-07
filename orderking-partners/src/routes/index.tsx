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
import { SelfServeLandingModule } from "@/components/onboarding/self-serve-landing-module";

export const Route = createFileRoute("/")({ component: Home });

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "What are the documents needed to register my restaurant on OrderKing?",
    answer:
      "To register your restaurant, you need: 1) A valid 14-digit FSSAI license or registration certificate, 2) PAN card of the proprietor or business entity, 3) Bank account details (account number and IFSC) for daily payouts, and 4) Your restaurant menu card with prices. If your annual turnover is under ₹20 Lakhs, GSTIN is not required.",
  },
  {
    question: "How long does it take for my restaurant to go live?",
    answer:
      "Usually within 24 hours once your menu and required documents are submitted. Our partner onboarding team verifies your details and turns on live ordering for your catchment area.",
  },
  {
    question: "What device do I need to manage orders?",
    answer:
      "You can use any smartphone, tablet, laptop, or desktop computer. You can also connect to your existing POS setup and standard 58mm/80mm thermal receipt printers.",
  },
  {
    question: "How and when do I receive payouts?",
    answer:
      "Payouts are deposited directly into your verified bank account on a regular daily T+1 schedule with complete order itemization and transparent transaction ledgers.",
  },
  {
    question: "How can I update my menu and prices?",
    answer:
      "You can add dishes, modify prices, update photos, or toggle item availability with 1-tap anytime directly from your OrderKing Partner dashboard.",
  },
];

function Home() {
  const { user } = useCurrentUserState();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [heroPhone, setHeroPhone] = useState("");

  if (user) return <Navigate to="/dashboard" />;

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const handleHeroQuickStart = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = heroPhone.replace(/\D/g, "").slice(-10);
    if (clean.length === 10) {
      window.location.assign(`/login?mode=up&phone=${clean}`);
    } else {
      const el = document.getElementById("onboarding-form");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-dvh bg-[#F8F9FA] text-gray-900 font-sans selection:bg-red-500/20 selection:text-red-900">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 group">
            <OrderKingMark className="size-9 text-[#E23744] transition-transform duration-200 group-hover:scale-105" />
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl font-black tracking-tight text-gray-900">
                {platformConfig.brand.appName}
              </span>
              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#E23744]">
                Partner
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#why-partner" className="hover:text-[#E23744] transition-colors">
              Why Partner
            </a>
            <a href="#how-it-works" className="hover:text-[#E23744] transition-colors">
              How It Works
            </a>
            <a href="#requirements" className="hover:text-[#E23744] transition-colors">
              Requirements
            </a>
            <a href="#faqs" className="hover:text-[#E23744] transition-colors">
              FAQs
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-gray-300 bg-white text-xs sm:text-sm font-semibold text-gray-700 hover:border-gray-400 hover:bg-gray-50 h-10 px-4 rounded-xl"
            >
              <Link to="/login">Partner Login</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-[#E23744] hover:bg-[#d32f2f] text-white text-xs sm:text-sm font-bold shadow-md shadow-red-500/20 h-10 px-5 rounded-xl"
            >
              <a href="#onboarding-form">Register Restaurant</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-red-50/40 via-white to-[#F8F9FA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-bold text-[#E23744] shadow-xs">
            <Sparkles className="size-3.5 text-[#E23744]" />
            <span>0% commission for the 1st month for new restaurant partners!</span>
          </div>

          {/* Benchmark Headline */}
          <h1 className="mt-6 font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-gray-900 max-w-4xl mx-auto leading-[1.1]">
            Partner with OrderKing and grow your business
          </h1>

          {/* Subtitle */}
          <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-gray-600 font-normal leading-relaxed">
            Connect with thousands of customers across your city, boost your kitchen revenue, and take your restaurant to new heights.
          </p>

          {/* Instant 1-Tap Mobile Quick-Start Onboarding */}
          <form onSubmit={handleHeroQuickStart} className="mt-8 mx-auto max-w-lg flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500 font-mono">+91</span>
              <input
                type="tel"
                maxLength={10}
                value={heroPhone}
                onChange={(e) => setHeroPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Enter 10-digit mobile number"
                className="w-full h-14 pl-14 pr-4 rounded-2xl border border-gray-300 bg-white text-gray-900 font-mono text-base placeholder:text-gray-400 focus:border-[#E23744] focus:ring-2 focus:ring-red-500/20 shadow-sm outline-none transition"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto shrink-0 h-14 px-8 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold text-base rounded-2xl shadow-xl shadow-red-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="size-5" />
            </button>
          </form>

          {/* Quick Links & Existing Partner Login */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs sm:text-sm text-gray-600">
            <a href="#onboarding-form" className="hover:text-[#E23744] font-semibold underline underline-offset-4">
              Or fill 3-step self-serve details below ↓
            </a>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5">
              <span>Already registered?</span>
              <Link to="/login" className="font-bold text-[#E23744] hover:underline">
                Partner Login →
              </Link>
            </div>
          </div>

          {/* Zomato Benchmark 10-Minute Requirement Floating Card */}
          <div className="mt-14 max-w-4xl mx-auto rounded-3xl bg-white text-gray-900 p-6 sm:p-8 md:p-10 shadow-2xl text-left border border-gray-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
                    Get started: It only takes 10 minutes
                  </h2>
                  <p className="mt-1.5 text-xs sm:text-sm text-gray-500">
                    Please keep these documents and details ready for a smooth sign-up:
                  </p>
                </div>

                <ul className="space-y-3.5 pt-2 text-xs sm:text-sm font-semibold text-gray-800">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>PAN card</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>GST number, if applicable</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span>FSSAI license</span>
                      <div className="text-[11px] text-gray-500 font-normal mt-0.5">
                        Don&apos;t have a FSSAI license?{" "}
                        <a
                          href="https://foscos.fssai.gov.in"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#E23744] hover:underline font-semibold"
                        >
                          Apply here.
                        </a>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span>Menu and profile food image</span>
                      <div className="text-[11px] text-gray-500 font-normal mt-0.5">
                        What is profile food image?{" "}
                        <a
                          href="#requirements"
                          className="text-[#E23744] hover:underline font-semibold"
                        >
                          Refer here.
                        </a>
                      </div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Bank account details</span>
                  </li>
                </ul>
              </div>

              {/* Explainer Visual Card */}
              <div className="lg:col-span-5">
                <div className="relative overflow-hidden rounded-2xl border border-red-100 bg-red-50/60 p-6 text-gray-900 shadow-sm">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold text-[#E23744] uppercase tracking-wider">
                      <span>Quick Guide</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900">
                      How to onboard your restaurant
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Follow our 3-step self-serve guide to register your restaurant, upload your menu, and begin receiving live orders immediately.
                    </p>
                    <div className="pt-2">
                      <Button
                        asChild
                        size="sm"
                        className="w-full bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold text-xs rounded-xl h-11"
                      >
                        <a href="#onboarding-form">
                          Start 10-Minute Registration
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Active Partner Onboarding & Self-Serve Outlet Registration */}
      <section id="onboarding-form" className="py-14 border-t border-gray-200 bg-[#F4F5F7] scroll-mt-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SelfServeLandingModule />
        </div>
      </section>

      {/* Section 1: Why should you partner with OrderKing? */}
      <section id="why-partner" className="py-20 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-[#E23744]">
              <TrendingUp className="size-3.5" />
              PARTNER ADVANTAGE
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-black text-gray-900">
              Why should you partner with OrderKing?
            </h2>
            <p className="mt-3 text-gray-600 text-sm sm:text-base">
              OrderKing enables you to grow your business, reach new customers, and manage online orders efficiently.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: Attract new customers */}
            <div className="rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-200 hover:border-red-300 hover:shadow-lg shadow-sm">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50 text-[#E23744] border border-red-100">
                <Users className="size-7" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-gray-900">
                Attract new customers
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Reach thousands of hungry diners ordering food every day in your locality and expand your customer base across your city.
              </p>
            </div>

            {/* Card 2: Doorstep delivery facility */}
            <div className="rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-200 hover:border-red-300 hover:shadow-lg shadow-sm">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50 text-[#E23744] border border-red-100">
                <Bike className="size-7" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-gray-900">
                Doorstep delivery facility
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Reliable, professional delivery fleet network ensuring orders are picked up on time and delivered hot and fresh to customers.
              </p>
            </div>

            {/* Card 3: Unmatched delivery reach */}
            <div className="rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-200 hover:border-red-300 hover:shadow-lg shadow-sm">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50 text-[#E23744] border border-red-100">
                <Store className="size-7" />
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-gray-900">
                Unmatched delivery reach
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Expand your kitchen capacity beyond physical seating with high-volume online orders, table dining, and scheduled catering.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: How it works */}
      <section id="how-it-works" className="py-20 border-t border-gray-200 bg-[#F8F9FA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-bold text-gray-700 shadow-xs">
              <Clock className="size-3.5 text-[#E23744]" />
              SIMPLE PROCESS
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-black text-gray-900">
              How it works
            </h2>
            <p className="mt-3 text-gray-600 text-sm sm:text-base">
              Start receiving online food orders in 3 straightforward steps.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-xl bg-red-50 border border-red-100 text-[#E23744] font-black text-lg">
                  01
                </span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  STEP 1
                </span>
              </div>
              <h3 className="mt-6 font-display text-lg font-bold text-gray-900">
                Create your page
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Register outlet details, location address, and primary contact information for your restaurant.
              </p>
              <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" /> Instant mobile OTP verification
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-xl bg-red-50 border border-red-100 text-[#E23744] font-black text-lg">
                  02
                </span>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  STEP 2
                </span>
              </div>
              <h3 className="mt-6 font-display text-lg font-bold text-gray-900">
                Set up your menu
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Add dishes, prices, operating timings, and upload your FSSAI food license copy.
              </p>
              <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" /> Fast menu digitization &amp; dish photos
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-black text-lg">
                  03
                </span>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded">
                  GO LIVE
                </span>
              </div>
              <h3 className="mt-6 font-display text-lg font-bold text-gray-900">
                Start receiving orders
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Manage incoming orders seamlessly with our merchant app or web dashboard and start delivering.
              </p>
              <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" /> Automated T+1 bank payouts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: What you need to get started */}
      <section id="requirements" className="py-20 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-bold text-gray-700">
              <ShieldCheck className="size-3.5 text-[#E23744]" />
              ONBOARDING REQUIREMENTS
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-black text-gray-900">
              What you need to get started
            </h2>
            <p className="mt-3 text-gray-600 text-sm sm:text-base">
              Keep these simple details ready to complete your partner registration quickly.
            </p>
          </div>

          <div className="mt-12 rounded-3xl border border-gray-200 bg-gray-50 p-6 sm:p-10 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Requirement 1 */}
              <div className="flex items-start gap-4 p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#E23744] border border-red-100">
                  <Check className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">
                    FSSAI registration or license certificate
                  </h4>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                    A valid 14-digit FSSAI food safety registration or license number for your restaurant outlet.
                  </p>
                </div>
              </div>

              {/* Requirement 2 */}
              <div className="flex items-start gap-4 p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#E23744] border border-red-100">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">
                    PAN card &amp; business bank account details
                  </h4>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                    Authorized signatory PAN and active bank account details (account number &amp; IFSC) for regular payouts.
                  </p>
                </div>
              </div>

              {/* Requirement 3 */}
              <div className="flex items-start gap-4 p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#E23744] border border-red-100">
                  <FileText className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">
                    Restaurant menu card and dish pricing
                  </h4>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                    A physical or digital copy of your menu with dishes, portion sizes, prices, and dietary indicators.
                  </p>
                </div>
              </div>

              {/* Requirement 4 */}
              <div className="flex items-start gap-4 p-5 rounded-2xl border border-gray-200 bg-white shadow-xs">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#E23744] border border-red-100">
                  <Receipt className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base">
                    GSTIN certificate (Optional)
                  </h4>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                    Optional if your restaurant&apos;s annual turnover is under ₹20 Lakhs or if exempt under government regulations.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <Button
                asChild
                size="lg"
                className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold text-sm px-8 rounded-xl shadow-md shadow-red-500/20 h-12"
              >
                <a href="#onboarding-form" className="inline-flex items-center gap-2">
                  Ready to apply? Start registration <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Frequently Asked Questions */}
      <section id="faqs" className="py-20 border-t border-gray-200 bg-[#F8F9FA]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-bold text-gray-700 shadow-xs">
              <HelpCircle className="size-3.5 text-[#E23744]" />
              QUESTIONS &amp; ANSWERS
            </div>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-black text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-gray-600 text-sm sm:text-base">
              Everything you need to know about partnering and managing your restaurant with OrderKing.
            </p>
          </div>

          <div className="mt-12 space-y-4">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-gray-200 bg-white shadow-xs overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-gray-900 hover:text-[#E23744] transition-colors gap-4"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`size-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#E23744]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
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
      <section className="py-20 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Ready to grow your restaurant?
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-base sm:text-lg text-gray-600">
            Join restaurants across India expanding their reach with OrderKing.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-14 px-8 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold text-base rounded-2xl shadow-xl shadow-red-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <a href="#onboarding-form" className="flex items-center justify-center gap-2">
                Register your restaurant <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-14 px-8 rounded-2xl border border-gray-300 bg-white text-sm font-bold text-gray-800 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Link to="/login">Partner Login</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Modern Partner Footer */}
      <footer className="border-t border-gray-200 bg-white py-12 text-gray-600 text-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <OrderKingMark className="size-8 text-[#E23744]" />
            <span className="font-display text-lg font-bold text-gray-900">{platformConfig.brand.appName}</span>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-500">
              © {new Date().getFullYear()} OrderKing Foods Private Limited (GSTIN: 18AFXPH9838M1Z9, Assam - 788710). All rights reserved.
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-gray-600">
            <a href="#why-partner" className="hover:text-gray-900 transition">
              Why Partner
            </a>
            <a href="#how-it-works" className="hover:text-gray-900 transition">
              How It Works
            </a>
            <a href="#requirements" className="hover:text-gray-900 transition">
              Requirements
            </a>
            <a href="#faqs" className="hover:text-gray-900 transition">
              FAQs
            </a>
            <Link to="/login" className="hover:text-gray-900 transition font-medium">
              Partner Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
