import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { setPhoneSession, getPhoneSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OrderKingMark } from "@/components/mark";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useMerchantBranding } from "@orderking/ui";
import { platformConfig } from "@/lib/platform-config";
import {
  sendPartnerOtpFn,
  verifyPartnerOtpFn,
  sanitizeIndianPhone,
  isValidIndianPhone,
} from "@/lib/server/sms-gateway";
import { ORDERKING_ONBOARDING_DRAFT_KEY } from "@/routes/onboarding";
import {
  ShieldCheck,
  Phone,
  MessageCircle,
  RefreshCw,
  Store,
  FileCheck2,
  Banknote,
  ChefHat,
  ClipboardList,
  Clock,
  UtensilsCrossed,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  ArrowRight,
  Shield,
  Award,
  Sparkles,
  Building,
  FileText,
  Check,
  Headphones,
} from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context?.sessionUser) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => <PartnerLandingPage initialMode="up" />,
});

export function PartnerLandingPage({
  initialMode = "up",
  initialPhone = "",
  initialName = "",
}: {
  initialMode?: "in" | "up";
  initialPhone?: string;
  initialName?: string;
} = {}) {
  const navigate = useNavigate();
  const { user } = useCurrentUserState();
  const branding = useMerchantBranding();

  // If already authenticated via client-side phone session, route directly to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const s = getPhoneSession();
      if (s?.user?.id || user?.id) {
        window.location.replace("/dashboard");
      }
    }
  }, [user]);

  const [mode, setMode] = useState<"up" | "in">(initialMode);
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [mobileNumber, setMobileNumber] = useState(initialPhone);
  const [name, setName] = useState(initialName);
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanPhone = useMemo(() => sanitizeIndianPhone(mobileNumber), [mobileNumber]);
  const isPhoneValid = isValidIndianPhone(cleanPhone);

  useEffect(() => {
    if (otpStep !== "code") return;
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const tId = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(tId);
  }, [otpStep, countdown]);

  async function handleSendOtp(channel: "sms" | "whatsapp" = "sms") {
    if (!isPhoneValid) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (mode === "up" && !name.trim()) {
      setError("Please enter the restaurant owner / manager full name.");
      return;
    }

    setWorking(true);
    setError(null);

    try {
      const res = await sendPartnerOtpFn({
        data: { phone: cleanPhone, channel },
      });
      if (!res?.success && res?.success !== undefined) {
        throw new Error("SMS was not delivered.");
      }
      setOtpStep("code");
      setCountdown(30);
      setCanResend(false);

      if (channel === "whatsapp" && res?.whatsAppOtpUrl && typeof window !== "undefined") {
        window.open(res.whatsAppOtpUrl, "_blank");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to dispatch verification code.");
    } finally {
      setWorking(false);
    }
  }

  async function handleVerifyOtp(codeToVerify?: string) {
    const code = (codeToVerify || otpCode).replace(/\D/g, "").trim();
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setWorking(true);
    setError(null);

    try {
      const verifyRes = await verifyPartnerOtpFn({
        data: { phone: cleanPhone, otp: code },
      });

      if (!verifyRes.success) {
        throw new Error("Invalid verification code. Please check or tap Resend.");
      }

      const email = verifyRes.email;
      const partnerDisplayName = name.trim() || `Partner ${cleanPhone.slice(-4)}`;

      setPhoneSession({
        id: "prt_" + cleanPhone,
        phone: cleanPhone,
        email,
        name: partnerDisplayName,
        role: "partner",
      });

      const hasRestaurant = Boolean((verifyRes as any)?.hasRestaurant);
      const shouldOnboard = !hasRestaurant || verifyRes.isNewUser;

      if (shouldOnboard) {
        if (typeof window !== "undefined") {
          try {
            const rawDraft = window.localStorage.getItem(ORDERKING_ONBOARDING_DRAFT_KEY);
            const prev = rawDraft ? JSON.parse(rawDraft) : {};
            window.localStorage.setItem(
              ORDERKING_ONBOARDING_DRAFT_KEY,
              JSON.stringify({
                ...prev,
                phone: cleanPhone,
                ownerName: name.trim() || prev.ownerName || "",
                name: prev.name || "",
                savedAt: new Date().toISOString(),
              })
            );
          } catch {}
        }
        window.location.assign("/onboarding");
      } else {
        window.location.assign("/dashboard");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Verification failed. Please check the code.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans flex flex-col justify-between selection:bg-red-500 selection:text-white">
      {/* 1. Header (Zomato for Business Standard) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <OrderKingMark className="size-9 text-[#E23744] transition-transform group-hover:scale-105" />
            <div>
              <div className="font-display text-xl font-black tracking-tight text-gray-900 flex items-center gap-1.5">
                <span>{branding.appName || platformConfig.brand.appName}</span>
                <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E23744]">
                  Partner
                </span>
              </div>
              <div className="text-[11px] text-gray-500 font-medium leading-none">
                Restaurant Partner Portal
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="tel:+919395065587"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 transition-colors"
            >
              <Headphones className="size-3.5 text-[#E23744]" />
              <span>Partner Desk: +91 9395065587</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setMode(mode === "in" ? "up" : "in");
                setError(null);
                setOtpStep("phone");
              }}
              className="text-xs font-bold text-[#E23744] hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              {mode === "in" ? "Register Restaurant" : "Sign In"}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: Operational Overview + Interactive OTP Card */}
      <section className="border-b border-gray-200 bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left 7 Columns: Value & 3-Step Clear Path */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-[#E23744]">
                <Store className="size-3.5" />
                <span>Restaurant Partner Network</span>
              </div>

              <div className="space-y-3">
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 leading-tight">
                  Partner with OrderKing to grow your restaurant business
                </h1>
                <p className="text-base text-gray-600 leading-relaxed max-w-2xl">
                  Receive online delivery orders, manage kitchen preparation in real time with our Kitchen Display System, and receive automated daily bank payouts.
                </p>
              </div>

              {/* 3 Clear Operational Steps */}
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black text-[#E23744]">
                    1
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Register your restaurant</div>
                    <div className="text-xs text-gray-500">Provide outlet address, 14-digit FSSAI food license, and bank account for daily payouts.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black text-[#E23744]">
                    2
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Configure menu &amp; operating hours</div>
                    <div className="text-xs text-gray-500">Set dish prices, veg/non-veg tags, standard preparation time (KPT), and opening timings.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black text-[#E23744]">
                    3
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Go live &amp; receive orders</div>
                    <div className="text-xs text-gray-500">Receive live orders with acoustic siren alerts, rider pickup verification, and daily direct bank settlements.</div>
                  </div>
                </div>
              </div>

              {/* Statutory Integrity Badges */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Food Safety</div>
                  <div className="text-xs font-bold text-gray-900 mt-0.5">14-Digit FSSAI</div>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Tax Remittance</div>
                  <div className="text-xs font-bold text-gray-900 mt-0.5">Section 9(5) CGST</div>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Settlements</div>
                  <div className="text-xs font-bold text-emerald-700 mt-0.5">Daily T+1 Payouts</div>
                </div>
              </div>
            </div>

            {/* Right 5 Columns: Interactive Native Mobile Phone OTP Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xl">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      {mode === "up" ? "New Restaurant Registration" : "Partner Portal Sign In"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setMode(mode === "in" ? "up" : "in");
                        setError(null);
                        setOtpStep("phone");
                      }}
                      className="text-xs font-bold text-[#E23744] hover:underline cursor-pointer"
                    >
                      {mode === "in" ? "Register outlet →" : "Sign in instead →"}
                    </button>
                  </div>
                  <h2 className="font-display text-2xl font-black text-gray-900">
                    {mode === "up" ? "Partner with OrderKing" : "Sign In to Your Kitchen"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {mode === "up"
                      ? "Enter your mobile number to begin digital restaurant onboarding."
                      : "Enter your registered mobile number to open your kitchen dashboard."}
                  </p>
                </div>

                {otpStep === "phone" ? (
                  <div className="space-y-4">
                    {mode === "up" && (
                      <div>
                        <Label htmlFor="owner-name" className="text-xs font-semibold text-gray-700">
                          Owner / Manager Full Name *
                        </Label>
                        <Input
                          id="owner-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full name as on PAN card"
                          className="mt-1 border-gray-300 bg-white text-gray-900 h-12 text-sm focus:border-[#E23744] rounded-xl"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="reg-phone" className="text-xs font-semibold text-gray-700">
                        10-Digit Mobile Number *
                      </Label>
                      <div className="relative mt-1 flex items-center">
                        <span className="absolute left-3 text-xs font-bold text-gray-500">+91</span>
                        <Input
                          id="reg-phone"
                          type="tel"
                          maxLength={10}
                          autoFocus
                          value={mobileNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setMobileNumber(val.startsWith("91") && val.length > 10 ? val.slice(2, 12) : val.slice(0, 10));
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && isPhoneValid && !working) {
                              void handleSendOtp("sms");
                            }
                          }}
                          placeholder="Enter mobile number"
                          className="pl-12 border-gray-300 bg-white text-gray-900 h-12 font-mono text-base focus:border-[#E23744] rounded-xl"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-gray-400">
                        We will send a 6-digit OTP code to verify your phone number.
                      </p>
                    </div>

                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        {error}
                      </div>
                    )}

                    <Button
                      type="button"
                      disabled={working || !isPhoneValid}
                      onClick={() => void handleSendOtp("sms")}
                      className="w-full h-12 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-500/20 text-sm cursor-pointer transition-all"
                    >
                      {working ? <RefreshCw className="size-4 animate-spin" /> : <Phone className="size-4" />}
                      <span>Continue with OTP</span>
                    </Button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        disabled={working || !isPhoneValid}
                        onClick={() => void handleSendOtp("whatsapp")}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline cursor-pointer disabled:opacity-50"
                      >
                        <MessageCircle className="size-3.5" />
                        <span>Get OTP on WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Step 2: OTP Verification */
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-gray-500">OTP dispatched to:</div>
                        <div className="text-sm font-bold text-gray-900 font-mono">+91 {cleanPhone}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep("phone");
                          setError(null);
                          setOtpCode("");
                        }}
                        className="text-xs font-bold text-[#E23744] hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <Label htmlFor="reg-code" className="text-xs font-semibold text-gray-700">
                        Enter 6-Digit Verification Code
                      </Label>
                      <Input
                        id="reg-code"
                        type="text"
                        maxLength={6}
                        autoFocus
                        value={otpCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setOtpCode(val);
                          if (val.length === 6) {
                            void handleVerifyOtp(val);
                          }
                        }}
                        placeholder="••••••"
                        className="mt-1 text-center font-mono text-2xl tracking-widest border-gray-300 bg-white text-gray-900 h-14 focus:border-[#E23744] rounded-xl"
                      />
                    </div>

                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        {error}
                      </div>
                    )}

                    <Button
                      type="button"
                      disabled={working || otpCode.length !== 6}
                      onClick={() => void handleVerifyOtp()}
                      className="w-full h-12 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-500/20 text-sm cursor-pointer transition-all"
                    >
                      {working ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-5" />}
                      <span>Verify &amp; Continue</span>
                    </Button>

                    <div className="pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => void handleSendOtp("whatsapp")}
                        className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        <MessageCircle className="size-3.5" />
                        <span>Send on WhatsApp</span>
                      </button>

                      {canResend ? (
                        <button
                          type="button"
                          onClick={() => void handleSendOtp("sms")}
                          className="font-bold text-[#E23744] hover:underline cursor-pointer"
                        >
                          Resend SMS
                        </button>
                      ) : (
                        <span className="font-mono text-gray-400">Resend in {countdown}s</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Step-by-Step Onboarding Walkthrough */}
      <section className="py-12 lg:py-16 bg-[#F8F9FA] border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-900">
              How to register your restaurant in 3 simple steps
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Complete your online registration in under 10 minutes. Go live once your FSSAI license and bank details are verified.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-[#E23744]">
                <Store className="size-5" />
              </div>
              <div className="font-display text-lg font-bold text-gray-900">
                1. Restaurant Information &amp; Location
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Enter your restaurant trade name, owner/manager contact info, street address, and pin your kitchen location on the map for rider navigation.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileCheck2 className="size-5" />
              </div>
              <div className="font-display text-lg font-bold text-gray-900">
                2. Legal Documents &amp; Bank Details
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Provide your 14-digit FSSAI food safety license number, PAN card details, and bank account with IFSC code for automated daily T+1 payouts.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <UtensilsCrossed className="size-5" />
              </div>
              <div className="font-display text-lg font-bold text-gray-900">
                3. Menu Studio, Timings &amp; Go Live
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Upload your menu dishes with prices, set standard preparation time (KPT: 15/20/25/30m), packaging charges, and go live to receive orders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Complete Platform Facilities & Features (Zomato Operational Parity) */}
      <section className="py-12 lg:py-16 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 mb-2">
              <ChefHat className="size-3.5 text-[#E23744]" />
              <span>Full Operational Suite</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
              Operational facilities built for professional kitchens
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Every tool needed to manage high-volume delivery, live kitchen queues, menu stockouts, and transparent finance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Facility 1: KDS & Siren */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6 space-y-3 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-red-100 text-[#E23744]">
                  <ClipboardList className="size-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                  Live KDS
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-gray-900">
                Kitchen Display System &amp; Audio Siren
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Acoustic audio siren alerts on every incoming order. Preparation SLA timer (15/20/25/30m) with 1-tap "Mark Food Ready" and mandatory rider pickup OTP verification.
              </p>
            </div>

            {/* Facility 2: Menu Studio */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6 space-y-3 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <UtensilsCrossed className="size-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                  Menu Studio
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-gray-900">
                Dish Studio &amp; 1-Tap Stockout
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Instant 1-tap stockout toggle ("In Stock" vs "Sold Out for Today") with automated 06:00 AM next-day reset. Veg, Non-Veg, Egg dietary tags, and paise pricing.
              </p>
            </div>

            {/* Facility 3: Operating Hours */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6 space-y-3 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Clock className="size-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                  Outlet Controls
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-gray-900">
                Operating Hours &amp; Kitchen Status
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Instant 1-tap Online/Offline emergency toggle to pause orders during rain surges, peak kitchen rush, or power outages. Weekly slot scheduler for lunch and dinner.
              </p>
            </div>

            {/* Facility 4: Settlements */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6 space-y-3 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Banknote className="size-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                  Daily Payouts
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-gray-900">
                Automated Daily T+1 Settlements
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Direct NEFT / RTGS / IMPS bank transfers every business day. Order-level ledger detailing gross value, commission, Section 9(5) CGST remitted to govt, and net payout.
              </p>
            </div>

            {/* Facility 5: Reviews & Spillage */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6 space-y-3 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <ShieldCheck className="size-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                  Dispute Protection
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-gray-900">
                Reviews &amp; Spillage Protection
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Direct customer feedback management with reply facility. Built-in Spillage Liability Protection: in-transit spills covered by platform delivery liability (₹0 merchant deduction).
              </p>
            </div>

            {/* Facility 6: King Spark AI */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6 space-y-3 hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <Sparkles className="size-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                  King Spark AI
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-gray-900">
                King Spark AI Partner Assistant
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                24/7 AI Partner Assistant built right into your portal. 1-click dispute arbitration, dynamic pricing recommendations, combo generation, and shift closing financial recon.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Documents Required Checklist */}
      <section className="py-12 bg-[#F8F9FA] border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-900">
              Documents required to register your restaurant
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Keep these details ready for fast digital verification and immediate activation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">1. FSSAI License</div>
              <div className="text-xs font-semibold text-gray-900">14-Digit Food License</div>
              <p className="text-[11px] text-gray-500">Valid registration or state license certificate number.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">2. Bank Account</div>
              <div className="text-xs font-semibold text-gray-900">Account No &amp; IFSC</div>
              <p className="text-[11px] text-gray-500">Current or Savings account for daily T+1 automated payouts.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">3. PAN Card</div>
              <div className="text-xs font-semibold text-gray-900">Restaurant / Owner PAN</div>
              <p className="text-[11px] text-gray-500">Permanent Account Number matching bank account details.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">4. GSTIN / Exemption</div>
              <div className="text-xs font-semibold text-gray-900">GST Registration</div>
              <p className="text-[11px] text-gray-500">15-digit GSTIN, or turnover &lt; ₹20L exemption declaration.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">5. Menu Copy</div>
              <div className="text-xs font-semibold text-gray-900">Dishes &amp; Prices</div>
              <p className="text-[11px] text-gray-500">List of food items, prices in ₹, and veg/non-veg tags.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Operational Frequently Asked Questions (FAQ) */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-900">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Straightforward operational details for restaurant owners.
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 p-5 space-y-1.5">
              <h3 className="text-sm font-bold text-gray-900">How long does it take for my restaurant to go live?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Once you submit your 14-digit FSSAI license and bank details during onboarding, document verification takes 24 to 48 hours. Once verified, your kitchen status can be toggled Online immediately.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-5 space-y-1.5">
              <h3 className="text-sm font-bold text-gray-900">When and how do I receive payouts for completed orders?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Settlements are processed on a daily T+1 schedule directly into your registered bank account via NEFT/RTGS/IMPS. You can view order-by-order itemized settlement ledgers in the Settlements tab.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-5 space-y-1.5">
              <h3 className="text-sm font-bold text-gray-900">How is GST handled under Section 9(5) CGST?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                For online restaurant food deliveries, OrderKing is legally classified as an Electronic Commerce Operator (ECO) under Section 9(5) of the CGST Act. OrderKing directly collects and remits the 5% GST on food sales to the Government. Restaurant partners carry no GST liability for online orders.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-5 space-y-1.5">
              <h3 className="text-sm font-bold text-gray-900">Can I pause incoming orders if my kitchen gets overloaded?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Yes. You can toggle your kitchen offline with a single tap from the dashboard or Kitchen Display System. You can select pause durations such as 30 minutes, 1 hour, or until the next shift.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 p-5 space-y-1.5">
              <h3 className="text-sm font-bold text-gray-900">What happens if an order spills or is damaged during transit?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                OrderKing provides delivery liability protection. In-transit spillage is classified as a logistics delivery fault. ₹0 is deducted from the restaurant's payout as long as containers are securely sealed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Statutory Compliance Footer */}
      <footer className="bg-white py-6 border-t border-gray-200 text-xs text-gray-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <OrderKingMark className="size-5 text-[#E23744]" />
            <span className="font-bold text-gray-900">OrderKing Restaurant Partner Portal</span>
          </div>
          <div className="text-center sm:text-right">
            <div>Order King Foods Private Limited • GSTIN: 18AFXPH9838M1Z9 • Assam - 788710</div>
            <div className="text-[11px] text-gray-400 mt-0.5">Section 9(5) CGST Compliance • SAC 996331 Restaurant Services</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
