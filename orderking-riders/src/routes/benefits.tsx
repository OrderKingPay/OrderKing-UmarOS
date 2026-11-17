import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { RiderBenefitsHub } from "@/components/rider/rider-benefits-hub";
import { bootstrapRiderFn, getHomeFn } from "@/lib/server/rider-fns";
import type { RiderProfile } from "@/lib/rider/types";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardMeta } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bike,
  ShieldCheck,
  HeartPulse,
  Hospital,
  Clock,
  Wallet,
  CheckCircle2,
  ChevronRight,
  Download,
  Phone,
  MapPin,
  Zap,
  ArrowRight,
  UserCheck,
  AlertCircle,
  FileText,
  Sparkles,
  Coffee,
  BatteryCharging,
  Award,
  Banknote,
  Umbrella,
  HelpCircle,
  ChevronDown,
  Building2,
  CreditCard,
  Layers,
  Flame,
  Sun,
  Moon,
  Shield,
  Smartphone,
  IdCard,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/benefits")({
  beforeLoad: ({ context }) => {
    // Whitelisted route: Unauthenticated visitors can view full fleet benefits prospectus;
    // Authenticated riders also get personalized TPA health card & leave management.
    return { sessionUser: context?.sessionUser ?? null };
  },
  component: BenefitsPage,
});

export function BenefitsPage() {
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [lifetimeTrips, setLifetimeTrips] = useState(0);
  const [viewMode, setViewMode] = useState<"hub" | "prospectus">("hub");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [calculatedOrders, setCalculatedOrders] = useState(16);
  const [calculatedDays, setCalculatedDays] = useState(26);

  useEffect(() => {
    void bootstrapRiderFn()
      .then((r) => {
        if (r) {
          setRider(r);
          setViewMode("hub");
        } else {
          setViewMode("prospectus");
        }
      })
      .catch(() => {
        setViewMode("prospectus");
      });

    void getHomeFn()
      .then((h) => {
        if (h?.rider) {
          setLifetimeTrips(h.rider.lifetimeDeliveries ?? h.completedToday ?? 0);
        }
      })
      .catch(() => undefined);
  }, []);

  const isLoggedIn = Boolean(rider?.id);

  // Dynamic earnings estimation (OrderKing standard tariff)
  const avgOrderEarning = 45; // Base ₹32 + avg distance/time ₹13
  const dailyMilestone = calculatedOrders >= 20 ? 450 : calculatedOrders >= 15 ? 250 : calculatedOrders >= 10 ? 120 : 0;
  const estimatedDaily = calculatedOrders * avgOrderEarning + dailyMilestone;
  const estimatedMonthly = estimatedDaily * calculatedDays;

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[#1E283D] bg-[#0C1018]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to={isLoggedIn ? "/" : "/login"} className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500 text-black font-black text-lg">
              K
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-sm font-bold tracking-tight text-white sm:text-base">
                  OrderKing
                </span>
                <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-orange-400">
                  Delivery Partner
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Fleet Logistics &amp; Welfare Portal</p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <>
                <div className="hidden sm:flex items-center gap-1 rounded-xl bg-[#141A26] p-1 border border-[#1E283D]">
                  <button
                    type="button"
                    onClick={() => setViewMode("hub")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      viewMode === "hub"
                        ? "bg-orange-500 text-black shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    My Digital Perks &amp; TPA
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("prospectus")}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                      viewMode === "prospectus"
                        ? "bg-orange-500 text-black shadow-xs"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Fleet Earning Guide
                  </button>
                </div>
                <Link to="/">
                  <Button className="h-9 rounded-xl bg-orange-500 px-3.5 text-xs font-bold text-black hover:bg-orange-400">
                    Active Orders
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/login">
                <Button className="h-9 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 px-4 text-xs font-bold text-black shadow-sm hover:brightness-105">
                  Join Delivery Fleet
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 space-y-10">
        {/* If Logged in and viewing personal hub */}
        {isLoggedIn && viewMode === "hub" ? (
          <AppShell>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-orange-500/20 bg-orange-500/10 p-3.5 text-xs text-orange-200">
                <div className="flex items-center gap-2">
                  <UserCheck className="size-4 text-orange-400 shrink-0" />
                  <span>
                    Authenticated Partner: <strong className="text-white">{rider?.fullName || "Delivery Partner"}</strong> (+91-{rider?.phone})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setViewMode("prospectus")}
                  className="font-bold underline text-orange-400 hover:text-orange-300"
                >
                  View Full Earning Guide
                </button>
              </div>

              <RiderBenefitsHub
                lifetimeDeliveries={lifetimeTrips}
                riderName={rider?.fullName}
              />
            </div>
          </AppShell>
        ) : (
          /* Public Fleet Prospectus & Delivery Partner Experience */
          <div className="space-y-12">
            {/* HERO SECTION */}
            <section className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-gradient-to-br from-[#121824] via-[#0E141E] to-[#080B10] p-6 sm:p-10 shadow-2xl">
              <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-orange-500/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
                  <Sparkles className="size-3.5" />
                  <span>OrderKing Delivery Partner Fleet · Direct NPCI UPI Payouts</span>
                </div>

                <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl leading-tight">
                  Deliver food &amp; essentials.{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                    Earn on your schedule.
                  </span>
                </h1>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  Join verified delivery partners across India earning up to ₹45,000 per month.
                  Enjoy weekly bank transfers every Wednesday, 1-tap instant cashouts anytime,
                  and ₹12,00,000 comprehensive accident and cashless medical cover.
                </p>

                {/* Highlights Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="rounded-2xl border border-[#1E283D] bg-[#141A26]/80 p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Earnings</span>
                    <span className="text-lg font-black text-orange-400">₹30k–₹45k</span>
                    <span className="text-[10px] text-slate-500 block">per month</span>
                  </div>
                  <div className="rounded-2xl border border-[#1E283D] bg-[#141A26]/80 p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Settlements</span>
                    <span className="text-lg font-black text-emerald-400">Weekly + 1-Tap</span>
                    <span className="text-[10px] text-slate-500 block">Wed &amp; Instant UPI</span>
                  </div>
                  <div className="rounded-2xl border border-[#1E283D] bg-[#141A26]/80 p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Insurance</span>
                    <span className="text-lg font-black text-blue-400">₹12 Lakh</span>
                    <span className="text-[10px] text-slate-500 block">Accident + Medical</span>
                  </div>
                  <div className="rounded-2xl border border-[#1E283D] bg-[#141A26]/80 p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Vehicle</span>
                    <span className="text-lg font-black text-purple-400">Bike / EV / Cycle</span>
                    <span className="text-[10px] text-slate-500 block">No vehicle? Rentals</span>
                  </div>
                </div>

                {/* Direct CTA */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
                  <Link to="/login" className="flex-1 sm:flex-initial">
                    <Button className="w-full sm:w-auto h-12 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 px-8 font-bold text-black text-sm tracking-wide shadow-lg shadow-orange-500/20 hover:brightness-105 active:scale-[0.98] transition gap-2">
                      <span>Join Delivery Fleet / Sign In</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  </Link>
                  <a
                    href="#calculator"
                    className="flex items-center justify-center h-12 rounded-2xl border border-[#1E283D] bg-[#141A26] px-5 text-xs font-bold text-slate-300 hover:text-white transition"
                  >
                    Calculate Your Earnings
                  </a>
                </div>
              </div>
            </section>

            {/* EARNINGS CALCULATOR & HOW YOU EARN */}
            <section id="calculator" className="space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Transparent Compensation
                </span>
                <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  How OrderKing Delivery Partners Earn
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                  Every rupee you earn is calculated with complete transparency based on distance,
                  pickup-to-drop time, order surge, and daily milestones.
                </p>
              </div>

              {/* Earnings Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-[#1E283D] bg-[#0E141E] p-5 space-y-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                    <Bike className="size-5" />
                  </div>
                  <CardTitle className="text-base font-bold text-white">Base Order Tariff</CardTitle>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Earn ₹32 base pay per delivery plus dynamic distance pay (₹6–₹12 per km)
                    and waiting compensation if the kitchen takes longer than 5 minutes.
                  </p>
                </Card>

                <Card className="border-[#1E283D] bg-[#0E141E] p-5 space-y-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                    <Flame className="size-5" />
                  </div>
                  <CardTitle className="text-base font-bold text-white">Surge &amp; Rain Multiplier</CardTitle>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Extra ₹20 to ₹50 per order during lunch peak (12:00–15:30), dinner rush
                    (19:00–23:30), late nights, and monsoon weather events.
                  </p>
                </Card>

                <Card className="border-[#1E283D] bg-[#0E141E] p-5 space-y-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                    <Award className="size-5" />
                  </div>
                  <CardTitle className="text-base font-bold text-white">Milestones &amp; 100% Tips</CardTitle>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Daily milestone bonuses (up to ₹450 extra/day) plus 100% customer tips passed
                    directly to your wallet with zero platform deductions.
                  </p>
                </Card>
              </div>

              {/* Interactive Earnings Estimator */}
              <div className="rounded-3xl border border-[#1E283D] bg-[#121824] p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E283D] pb-5">
                  <div>
                    <h3 className="text-lg font-bold text-white">Monthly Earning Estimator</h3>
                    <p className="text-xs text-slate-400">Estimate income based on your planned deliveries and active days</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Estimated Monthly Payout</span>
                    <span className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-400">
                      ₹{estimatedMonthly.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-500 block">approx. ₹{estimatedDaily.toLocaleString("en-IN")} / day</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Slider 1: Deliveries per day */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">Deliveries per Day</span>
                      <span className="text-orange-400 font-bold">{calculatedOrders} orders</span>
                    </div>
                    <input
                      type="range"
                      min={6}
                      max={28}
                      step={1}
                      value={calculatedOrders}
                      onChange={(e) => setCalculatedOrders(Number(e.target.value))}
                      className="w-full h-2 bg-[#1E283D] rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Part-time (6-10)</span>
                      <span>Full-time (14-18)</span>
                      <span>High Performance (22+)</span>
                    </div>
                  </div>

                  {/* Slider 2: Working Days per month */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">Working Days per Month</span>
                      <span className="text-orange-400 font-bold">{calculatedDays} days</span>
                    </div>
                    <input
                      type="range"
                      min={12}
                      max={30}
                      step={1}
                      value={calculatedDays}
                      onChange={(e) => setCalculatedDays(Number(e.target.value))}
                      className="w-full h-2 bg-[#1E283D] rounded-lg appearance-none cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Weekend Only (12)</span>
                      <span>Regular (24-26)</span>
                      <span>Full Month (30)</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* WELFARE & INSURANCE (MEDI ASSIST TPA) */}
            <section className="space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Partner Welfare &amp; Protection
                </span>
                <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  ₹12,00,000 Social Security &amp; Medical Shield
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                  Committed to gig worker social security under the Code on Social Security 2020.
                  Every active delivery partner is covered from day one.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Accident Cover */}
                <div className="rounded-3xl border border-[#1E283D] bg-[#0E141E] p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                      <ShieldCheck className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">₹10 Lakh Personal Accident Cover</h3>
                      <p className="text-xs text-slate-400">24x7 coverage on road &amp; off-shift</p>
                    </div>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                      <span>Full accidental death &amp; permanent total disability coverage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                      <span>Emergency ambulance reimbursement up to ₹5,000</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                      <span>Immediate family nominee support dispatch</span>
                    </li>
                  </ul>
                </div>

                {/* Cashless Hospitalization */}
                <div className="rounded-3xl border border-[#1E283D] bg-[#0E141E] p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
                      <Hospital className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">₹2 Lakh Cashless Hospitalization</h3>
                      <p className="text-xs text-slate-400">Medi Assist TPA · 10,000+ Empanelled Hospitals</p>
                    </div>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-blue-400 shrink-0" />
                      <span>Digital cashless e-card stored natively in your OrderKing Rider App</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-blue-400 shrink-0" />
                      <span>30-minute cashless sanction at network hospital TPA desks</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-blue-400 shrink-0" />
                      <span>Free unlimited tele-consultations for partner, spouse &amp; children</span>
                    </li>
                  </ul>
                </div>

                {/* Female Partner Leave */}
                <div className="rounded-3xl border border-[#1E283D] bg-[#0E141E] p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
                      <HeartPulse className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Female Partner Period Leave</h3>
                      <p className="text-xs text-slate-400">2 Days / Month Paid Rest &amp; Health Protection</p>
                    </div>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-rose-400 shrink-0" />
                      <span>₹350/day rest stipend credited directly to partner wallet</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-rose-400 shrink-0" />
                      <span>1-tap application in the app with zero doctor certificate required</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-rose-400 shrink-0" />
                      <span>Streak, Gold/Diamond tier rank, and order priority 100% frozen</span>
                    </li>
                  </ul>
                </div>

                {/* OrderKing Rest Points */}
                <div className="rounded-3xl border border-[#1E283D] bg-[#0E141E] p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
                      <Coffee className="size-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">OrderKing Rest Hubs &amp; Shelters</h3>
                      <p className="text-xs text-slate-400">Dedicated driver relaxation lounges in all hubs</p>
                    </div>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2 pt-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-amber-400 shrink-0" />
                      <span>Purified cold drinking water &amp; hygienic clean restrooms</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-amber-400 shrink-0" />
                      <span>High-speed smartphone charging docks &amp; shaded bike parking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-amber-400 shrink-0" />
                      <span>Air-conditioned seating during peak summer &amp; rain downpours</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* VEHICLE FLEXIBILITY: BICYCLE, EV, BIKE */}
            <section className="space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  Vehicle Flexibility
                </span>
                <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  No Bike? No Driving License? You Can Still Deliver.
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                  Choose the vehicle option that suits your situation. We support personal motorcycles,
                  electric scooters, bicycles, and commercial rental partnerships.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-[#1E283D] bg-[#0E141E] p-5 space-y-3">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wide">Option 1</span>
                  <h4 className="text-base font-bold text-white">Bicycle / Cycle Delivery</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Zero vehicle cost and zero fuel cost. Ideal for localized neighborhoods and student riders.
                  </p>
                  <div className="rounded-xl bg-[#141A26] p-2.5 text-[11px] text-slate-300 space-y-1">
                    <div>✓ No Driving License required</div>
                    <div>✓ Short delivery radius (within 2.5 km)</div>
                    <div>✓ Immediate onboarding</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#1E283D] bg-[#0E141E] p-5 space-y-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Option 2</span>
                  <h4 className="text-base font-bold text-white">Electric Scooter / Rental (EV)</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Subsidized EV rentals with Yulu and Zypp Electric. 2-minute battery swaps with Battery Smart.
                  </p>
                  <div className="rounded-xl bg-[#141A26] p-2.5 text-[11px] text-slate-300 space-y-1">
                    <div>✓ No DL required for low-speed EV (&lt;25 km/h)</div>
                    <div>✓ Save up to ₹4,000/month on petrol</div>
                    <div>✓ Battery swap network across all hubs</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#1E283D] bg-[#0E141E] p-5 space-y-3">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wide">Option 3</span>
                  <h4 className="text-base font-bold text-white">Personal Motorcycle / Scooter</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Bring your own two-wheeler for maximum range and long-distance high-tariff delivery orders.
                  </p>
                  <div className="rounded-xl bg-[#141A26] p-2.5 text-[11px] text-slate-300 space-y-1">
                    <div>✓ Standard Driving License &amp; RC required</div>
                    <div>✓ ₹2.50/L cashback on petrol via HPCL card</div>
                    <div>✓ Full city-wide shift access</div>
                  </div>
                </div>
              </div>
            </section>

            {/* SIMPLE 4-STEP ONBOARDING */}
            <section className="space-y-6">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-400">
                  Quick Onboarding
                </span>
                <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Start Delivering in 4 Simple Steps
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
                  100% digital paperless verification. Onboard from your phone and start delivering within hours.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="relative rounded-2xl border border-[#1E283D] bg-[#0E141E] p-5 space-y-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-orange-500/20 text-sm font-black text-orange-400">
                    1
                  </span>
                  <h4 className="text-sm font-bold text-white">Mobile Sign In</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter your 10-digit Indian phone number and verify via Fast2SMS 6-digit OTP code.
                  </p>
                </div>

                <div className="relative rounded-2xl border border-[#1E283D] bg-[#0E141E] p-5 space-y-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-orange-500/20 text-sm font-black text-orange-400">
                    2
                  </span>
                  <h4 className="text-sm font-bold text-white">KYC Verification</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Provide your Aadhaar number, PAN card number, and verify identity.
                  </p>
                </div>

                <div className="relative rounded-2xl border border-[#1E283D] bg-[#0E141E] p-5 space-y-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-orange-500/20 text-sm font-black text-orange-400">
                    3
                  </span>
                  <h4 className="text-sm font-bold text-white">Bank / UPI Setup</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Add your Bank Account number + IFSC or active UPI ID for automated weekly and instant cashouts.
                  </p>
                </div>

                <div className="relative rounded-2xl border border-[#1E283D] bg-[#0E141E] p-5 space-y-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-orange-500/20 text-sm font-black text-orange-400">
                    4
                  </span>
                  <h4 className="text-sm font-bold text-white">Vehicle &amp; Go Online</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Select Bike, EV, or Bicycle. Complete quick 5-min safety video and go online!
                  </p>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <Link to="/login">
                  <Button className="h-12 rounded-2xl bg-orange-500 px-8 text-sm font-bold text-black hover:bg-orange-400 shadow-lg shadow-orange-500/20 gap-2">
                    <span>Begin Registration / Sign In</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
              </div>
            </section>

            {/* FREQUENTLY ASKED QUESTIONS */}
            <section className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Common Questions
                </span>
                <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  {
                    q: "How and when do I get paid?",
                    a: "Earnings are settled every Wednesday directly into your bank account via NEFT/IMPS. In addition, you can use 1-Tap Instant Cashout at any time to transfer your earned floating balance directly to your UPI ID (Google Pay, PhonePe, Paytm, BHIM).",
                  },
                  {
                    q: "Do I need to pay any joining or registration fee?",
                    a: "No. Registration on OrderKing Delivery Partner is 100% free with zero hidden platform charges. You receive a digital partner ID card instantly upon KYC verification.",
                  },
                  {
                    q: "Can I deliver on a bicycle or electric scooter without a driving license?",
                    a: "Yes. Under the Motor Vehicles Act, 1988, bicycles and electric two-wheelers with a maximum speed below 25 km/h do not require a driving license or RTO registration. You can start delivering immediately.",
                  },
                  {
                    q: "How does the Medi Assist TPA cashless hospitalization work?",
                    a: "Every active delivery partner receives a digital TPA cashless health card inside the OrderKing Rider App. In the event of illness or accident requiring hospitalization, simply show your digital QR/card at any of Medi Assist's 10,000+ network hospitals for 30-minute cashless sanction up to ₹2,00,000.",
                  },
                  {
                    q: "Can I choose my own shift and delivery area?",
                    a: "Yes. You have complete autonomy. You can choose to deliver during breakfast, lunch peak, evening rush, or late night. You can also select your preferred operational hub (e.g., Karimganj Hub, Silchar, Guwahati, or metro zones).",
                  },
                ].map((faq, idx) => {
                  const isOpen = expandedFaq === idx;
                  return (
                    <div
                      key={faq.q}
                      className="rounded-2xl border border-[#1E283D] bg-[#0E141E] overflow-hidden transition"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between p-4 text-left text-sm font-bold text-white hover:text-orange-400 transition"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`size-4 text-slate-400 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="border-t border-[#1E283D] p-4 text-xs text-slate-300 leading-relaxed bg-[#121824]/50">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* STATUTORY & LEGAL FOOTER */}
            <footer className="rounded-3xl border border-[#1E283D] bg-[#0C1018] p-6 text-xs text-slate-500 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#1E283D] pb-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Shield className="size-4 text-emerald-400" />
                  <span className="font-semibold text-slate-300">
                    OrderKing Pay Fleet Operations (Assam - 788710)
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <Link to="/terms" className="hover:text-white underline">
                    Terms of Service
                  </Link>
                  <Link to="/privacy" className="hover:text-white underline">
                    Privacy Policy
                  </Link>
                  <Link to="/login" className="hover:text-white underline font-bold text-orange-400">
                    Rider Login
                  </Link>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed">
                Orderkingpay operates as an electronic marketplace platform under Section 79 of the Information
                Technology Act, 2000. Statutory Entity: Orderkingpay (GSTIN: 18AFXPH9838M1Z9). Gig and platform
                worker welfare guidelines administered in accordance with the Code on Social Security 2020.
                Mediclaim &amp; Personal Accident cover underwritten by approved General Insurance Companies with
                Medi Assist Healthcare Services Ltd (TPA Licence No. 003).
              </p>
            </footer>
          </div>
        )}
      </main>
    </div>
  );
}
