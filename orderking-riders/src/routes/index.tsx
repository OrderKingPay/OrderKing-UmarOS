import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AppShell } from "@/components/rider/app-shell";
import { HomeView } from "@/components/rider/home-view";
import { Button } from "@/components/ui/button";
import {
  Bike,
  ShieldCheck,
  IndianRupee,
  Clock,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  MapPin,
  ChevronDown,
  FileCheck,
  Smartphone,
  Award,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: RiderEntry,
});

function RiderEntry() {
  const { user } = useCurrentUserState();

  if (user) {
    return (
      <AppShell>
        <HomeView />
      </AppShell>
    );
  }

  return <RiderPublicLanding />;
}

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "What are the document requirements to join OrderKing?",
    answer:
      "You need: 1) Aadhaar card or Government ID, 2) Driving License (MCWG or Commercial) for petrol bikes, 3) Vehicle RC, and 4) Bank account details or UPI ID for direct payouts. Electric cycles/slow EVs do not require a driving license.",
  },
  {
    question: "How and when do I get paid?",
    answer:
      "Earnings are transferred directly to your bank account or UPI ID on a T+1 daily or weekly settlement schedule. You retain 100% of all customer tips with zero commission deductions.",
  },
  {
    question: "Can I choose my working hours?",
    answer:
      "Yes. You are in full control of your schedule. Turn duty ON whenever you want to receive delivery requests and turn duty OFF whenever you are done.",
  },
  {
    question: "What is the per-delivery payout rate?",
    answer:
      "Every delivery guarantees a base floor of ₹35.00 for the first 2 km, plus ₹12.00/km distance compensation beyond 2 km, and ₹1.00/minute restaurant wait-time allowance after 10 minutes past arrival.",
  },
];

function RiderPublicLanding() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20">
              <Bike className="size-5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-white">OrderKing</span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Delivery Partner
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button
                variant="outline"
                className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 text-xs font-bold"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/onboarding">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20">
                Join Now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="size-4" /> Direct Bank Payouts · 100% Tips Retained
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Deliver with OrderKing. <br />
            <span className="text-emerald-400">Earn On Every Kilometer.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Deliver local orders with transparent base pay, per-kilometer distance pay, and direct bank payouts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/onboarding" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto h-12 px-8 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                <span>Start Application</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto h-12 px-8 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-sm rounded-xl"
              >
                Existing Partner Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Rate Card Grid */}
        <section className="mt-16 pt-8 border-t border-slate-800/80">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-white">Transparent Rate Card</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Every delivery payout is calculated with exact mathematical precision.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <IndianRupee className="size-5" />
              </div>
              <h3 className="font-extrabold text-white text-base">₹35.00 Base Floor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Base floor pay for the first 2.0 km on every completed delivery.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <MapPin className="size-5" />
              </div>
              <h3 className="font-extrabold text-white text-base">+₹12.00 / km</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatic distance compensation for every additional kilometer beyond 2.0 km.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Clock className="size-5" />
              </div>
              <h3 className="font-extrabold text-white text-base">+₹1.00 / min</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Wait-time compensation after 10 minutes past arrival at restaurant kitchen.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Award className="size-5" />
              </div>
              <h3 className="font-extrabold text-white text-base">100% Tips</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customer tips go directly to your payout ledger with zero platform deduction.
              </p>
            </div>
          </div>
        </section>

        {/* 4-Step Registration Checklist */}
        <section className="mt-16 rounded-3xl border border-slate-800 bg-slate-900/40 p-6 sm:p-10">
          <div className="max-w-2xl mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-white">What You Need to Start</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Complete your verification online in 5 minutes with these four documents.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="size-4" />
                <span>1. Government ID</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Aadhaar card or Government ID for UIDAI identity verification.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="size-4" />
                <span>2. Driving License</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Valid motorcycle license (MCWG) for petrol two-wheelers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="size-4" />
                <span>3. Vehicle RC</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Registration Certificate of your motorcycle, scooter, or EV.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="size-4" />
                <span>4. Bank Account / UPI</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Bank account number and IFSC code or UPI ID for direct payouts.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center sm:text-left">
            <Link to="/onboarding">
              <Button className="h-11 px-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-md">
                Register as Delivery Partner
              </Button>
            </Link>
          </div>
        </section>

        {/* FAQs */}
        <section className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-black text-white text-center mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-4 text-left text-sm font-bold text-white hover:text-emerald-400 transition"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`size-4 text-slate-400 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-emerald-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} OrderKing Fleet Operations. All rights reserved.</p>
      </footer>
    </div>
  );
}
