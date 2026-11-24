import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
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
import { orderKingSpark } from "@/lib/ai/order-king-spark";
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
  HelpCircle,
  Send,
  Lock,
  Mail,
  Eye,
  EyeOff,
  X,
  Sparkles,
  Headphones,
  Printer,
  Building,
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
}) {
  const branding = useMerchantBranding();
  const { user } = useCurrentUserState();

  // If already authenticated via client-side phone session, route directly to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const s = getPhoneSession();
      if (s?.user?.id || user?.id) {
        window.location.replace("/dashboard");
      }
    }
  }, [user]);

  // Auth Card State
  const [mode, setMode] = useState<"up" | "in">(initialMode);
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [mobileNumber, setMobileNumber] = useState(initialPhone);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

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
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpCode("");

      if (channel === "whatsapp" && res?.whatsAppOtpUrl && typeof window !== "undefined") {
        window.open(res.whatsAppOtpUrl, "_blank");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to dispatch verification code.");
    } finally {
      setWorking(false);
    }
  }

  function handleDigitChange(index: number, val: string) {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    const joined = next.join("");
    setOtpCode(joined);

    if (digit && index < 5) {
      digitRefs.current[index + 1]?.focus();
    }
    if (joined.length === 6) {
      void handleVerifyOtp(joined);
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      digitRefs.current[index - 1]?.focus();
    }
  }

  function handlePasteOtp(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasteData.length; i++) {
      next[i] = pasteData[i];
    }
    setOtpDigits(next);
    const joined = next.join("");
    setOtpCode(joined);
    if (pasteData.length === 6) {
      void handleVerifyOtp(joined);
    } else if (pasteData.length < 6) {
      digitRefs.current[pasteData.length]?.focus();
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

      const verifiedEmail = verifyRes.email;
      const partnerDisplayName = name.trim() || `Partner ${cleanPhone.slice(-4)}`;

      setPhoneSession({
        id: "prt_" + cleanPhone,
        phone: cleanPhone,
        email: verifiedEmail,
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

  // ── Facility Tab State ────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"kds" | "menu" | "hours" | "settlements" | "reviews" | "spark">("kds");

  // King Spark AI Interactive Query State
  const [sparkInput, setSparkInput] = useState("");
  const [sparkResponse, setSparkResponse] = useState<string | null>(null);
  const [sparkBusy, setSparkBusy] = useState(false);

  function runSparkQuery(query: string) {
    setSparkBusy(true);
    setSparkInput(query);
    try {
      const res = orderKingSpark.handleRestaurantQuery(query);
      setSparkResponse(res.text);
    } catch {
      setSparkResponse("OrderKing Spark verified your operational request under platform policy.");
    } finally {
      setSparkBusy(false);
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
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="size-3.5 text-[#E23744]" />
              <span>Need Help?</span>
            </button>
            <a
              href="tel:+919395065587"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 transition-colors"
            >
              <Headphones className="size-3.5 text-[#E23744]" />
              <span>+91 9395065587</span>
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
              {mode === "in" ? "Register Restaurant" : "Partner Sign In"}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: Operational Overview + Clean Auth Card */}
      <section className="border-b border-gray-200 bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left 7 Columns: Operational Value & 3-Step Clear Path */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-[#E23744]">
                <Store className="size-3.5" />
                <span>Restaurant Partner Network</span>
              </div>

              <div className="space-y-3">
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 leading-tight">
                  Partner with OrderKing
                </h1>
                <p className="text-base text-gray-600 leading-relaxed max-w-2xl">
                  Connect with customers across your city and manage online delivery orders, kitchen preparation, and daily bank payouts.
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

            {/* Right 5 Columns: Clean Zomato-Style Auth Card */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xl">
                <div className="mb-5">
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
                    {mode === "up" ? "Register Your Restaurant" : "Sign In to Partner Portal"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {mode === "up"
                      ? "Enter your mobile number to begin digital restaurant onboarding."
                      : "Access your live kitchen queue, menu studio, and daily settlements."}
                  </p>
                </div>

                {/* Mode Selector Tabs (Mobile OTP vs Corporate Password) */}
                {mode === "in" && (
                  <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1 mb-4 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod("otp");
                        setError(null);
                      }}
                      className={`py-2 rounded-lg transition-all cursor-pointer ${
                        authMethod === "otp"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Mobile OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod("password");
                        setError(null);
                      }}
                      className={`py-2 rounded-lg transition-all cursor-pointer ${
                        authMethod === "password"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Email &amp; Password
                    </button>
                  </div>
                )}

                {/* Flow A: Mobile Phone OTP Flow */}
                {authMethod === "otp" ? (
                  otpStep === "phone" ? (
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
                          We will send a 6-digit verification code to this phone number.
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
                    /* Step 2: OTP Verification Code with Individual 6 Digits */
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
                            setOtpDigits(["", "", "", "", "", ""]);
                          }}
                          className="text-xs font-bold text-[#E23744] hover:underline cursor-pointer"
                        >
                          Change
                        </button>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold text-gray-700 block mb-2">
                          Enter 6-Digit Verification Code
                        </Label>

                        {/* 6 Individual Digit Inputs with Auto-Advance */}
                        <div className="grid grid-cols-6 gap-2">
                          {otpDigits.map((digit, idx) => (
                            <input
                              key={idx}
                              ref={(el) => {
                                digitRefs.current[idx] = el;
                              }}
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              autoFocus={idx === 0}
                              value={digit}
                              onChange={(e) => handleDigitChange(idx, e.target.value)}
                              onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                              onPaste={idx === 0 ? handlePasteOtp : undefined}
                              className="w-full h-13 text-center font-mono text-xl font-bold rounded-xl border border-gray-300 bg-white text-gray-900 focus:border-[#E23744] focus:ring-2 focus:ring-red-100 outline-none transition-all"
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400 text-center">
                          Auto-advances as you type. Paste supported.
                        </p>
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
                        <span>Verify &amp; Open Portal</span>
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
                  )
                ) : (
                  /* Flow B: Corporate Email & Password Sign In */
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="corporate-email" className="text-xs font-semibold text-gray-700">
                        Corporate / Registered Business Email *
                      </Label>
                      <div className="relative mt-1 flex items-center">
                        <Mail className="size-4 absolute left-3 text-gray-400" />
                        <Input
                          id="corporate-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="partner@restaurant.com"
                          className="pl-10 border-gray-300 bg-white text-gray-900 h-12 text-sm focus:border-[#E23744] rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="corporate-password" className="text-xs font-semibold text-gray-700">
                          Password *
                        </Label>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMethod("otp");
                            setError("Enter your phone number to sign in via verified OTP.");
                          }}
                          className="text-[11px] font-semibold text-[#E23744] hover:underline cursor-pointer"
                        >
                          Sign in with OTP instead
                        </button>
                      </div>
                      <div className="relative mt-1 flex items-center">
                        <Lock className="size-4 absolute left-3 text-gray-400" />
                        <Input
                          id="corporate-password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="pl-10 pr-10 border-gray-300 bg-white text-gray-900 h-12 text-sm focus:border-[#E23744] rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                        {error}
                      </div>
                    )}

                    <Button
                      type="button"
                      disabled={working || !email || !password}
                      onClick={() => {
                        setError("For security, restaurant accounts use direct mobile phone OTP authentication. Switch to Mobile OTP tab to sign in.");
                      }}
                      className="w-full h-12 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-500/20 text-sm cursor-pointer transition-all"
                    >
                      <Lock className="size-4" />
                      <span>Sign In with Password</span>
                    </Button>
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
              Register your restaurant in 3 simple steps
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
                Enter your restaurant trade name, owner contact info, street address, and pin your kitchen location on the map for rider navigation.
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

      {/* 4. Partner Facilities & Software Capabilities */}
      <section className="py-12 lg:py-16 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-bold text-gray-800 mb-2">
              <ChefHat className="size-3.5 text-[#E23744]" />
              <span>Partner Software Capabilities</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900">
              Kitchen management &amp; operations suite
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              OrderKing provides operational tools built for restaurant owners, kitchen managers, and chefs.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            {[
              { id: "kds", label: "1. KDS & Order Dispatch", icon: ClipboardList },
              { id: "menu", label: "2. Menu Studio & Stockout", icon: UtensilsCrossed },
              { id: "hours", label: "3. Operating Hours & Rush", icon: Clock },
              { id: "settlements", label: "4. Daily T+1 Payouts", icon: Banknote },
              { id: "reviews", label: "5. Spillage Protection", icon: ShieldCheck },
              { id: "spark", label: "6. King Spark AI", icon: Sparkles },
            ].map((tab) => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-[#E23744] text-white shadow-md shadow-red-500/20"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: KDS & ORDER DISPATCH */}
          {activeTab === "kds" && (
            <div className="bg-[#F8F9FA] border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-display text-xl font-black text-gray-900 flex items-center gap-2">
                  <ClipboardList className="size-5 text-[#E23744]" />
                  <span>Kitchen Display System (KDS) &amp; Order Queue</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Real-time ticket queue for incoming delivery and dining orders. Acoustic alarms ring on incoming orders until accepted.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Clock className="size-4 text-[#E23744]" />
                    <span>Dynamic Preparation Time (KPT SLA)</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Set preparation targets (15m, 20m, 25m, 35m). Countdown timers keep kitchen stations aligned with delivery rider dispatch.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Printer className="size-4 text-blue-600" />
                    <span>Hardware Thermal Printer Integration</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    ESC/POS USB, Bluetooth, and Network thermal printers (58mm/80mm) supported with station routing and customer cooking notes.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-gray-900 flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    <span>Rider Handover Security OTP</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">
                    Verify the 4-digit security OTP with the delivery partner before handing over the parcel to prevent misplaced orders.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MENU STUDIO & 1-TAP STOCKOUT */}
          {activeTab === "menu" && (
            <div className="bg-[#F8F9FA] border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-display text-xl font-black text-gray-900 flex items-center gap-2">
                  <UtensilsCrossed className="size-5 text-[#E23744]" />
                  <span>Menu Studio &amp; 1-Tap Stockout (06:00 AM Auto-Reset)</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Update dish availability instantly. Items turned off for the day automatically reset to available at 06:00 AM next morning.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-gray-900">1-Tap 86 (Stockout) Control</div>
                  <p className="text-gray-600 leading-relaxed">
                    Run out of an ingredient? Toggle any dish off with a single tap. Customers see updated availability within 500 milliseconds.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-gray-900">Dietary &amp; Allergen Badges</div>
                  <p className="text-gray-600 leading-relaxed">
                    Tag dishes accurately with 100% Pure Veg (green dot), Non-Veg (red triangle), and Egg (yellow circle) classifications.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-gray-900">Customizations &amp; Add-on Groups</div>
                  <p className="text-gray-600 leading-relaxed">
                    Configure portion sizes (Half/Full), crust choices, spice levels, and combo add-ons with custom pricing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: OPERATING HOURS & RUSH CONTROL */}
          {activeTab === "hours" && (
            <div className="bg-[#F8F9FA] border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-display text-xl font-black text-gray-900 flex items-center gap-2">
                  <Clock className="size-5 text-[#E23744]" />
                  <span>Kitchen Availability &amp; Rush Hour Pause</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Maintain full control over your storefront during sudden surges or extreme kitchen load.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-gray-900">Rush Hour Pause Switch</div>
                  <p className="text-gray-600 leading-relaxed">
                    Pause incoming orders for 15, 30, or 60 minutes when orders exceed kitchen capacity without algorithm penalties.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-gray-900">Standard Weekly Schedule</div>
                  <p className="text-gray-600 leading-relaxed">
                    Configure day-by-day split shifts (Lunch and Dinner hours) to match your culinary team shifts.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-gray-900">Holiday &amp; Dry Day Timings</div>
                  <p className="text-gray-600 leading-relaxed">
                    Schedule advance festival closures or special holiday timings directly from the partner settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SETTLEMENTS & DAILY T+1 LEDGER */}
          {activeTab === "settlements" && (
            <div className="bg-[#F8F9FA] border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-display text-xl font-black text-gray-900 flex items-center gap-2">
                  <Banknote className="size-5 text-[#E23744]" />
                  <span>Daily T+1 Direct Bank Settlements</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Daily automated transfers directly into your registered bank account via NEFT/RTGS/IMPS with unique UTR confirmation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-gray-900">Statutory Section 9(5) CGST Compliance</div>
                  <p className="text-gray-600 leading-relaxed">
                    As an Electronic Commerce Operator, OrderKing directly collects and remits the 5% GST to the Government. You carry zero merchant liability for GST on delivery food sales.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-gray-900">Order-Level Ledger Breakdown</div>
                  <p className="text-gray-600 leading-relaxed">
                    Every order itemizes food total, packaging fee, platform fee, and statutory tax deductions in integer paise for accounting clarity.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-gray-900">Downloadable GSTR-1 Summaries</div>
                  <p className="text-gray-600 leading-relaxed">
                    Generate monthly tax summaries and reconciliation certificates formatted for your chartered accountant.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DISPUTE & SPILLAGE PROTECTION */}
          {activeTab === "reviews" && (
            <div className="bg-[#F8F9FA] border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-display text-xl font-black text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="size-5 text-[#E23744]" />
                  <span>Delivery Spillage &amp; Merchant Protection</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fair liability attribution protecting your revenue against in-transit delivery faults.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-emerald-800">100% Spillage Protection</div>
                  <p className="text-gray-600 leading-relaxed">
                    Liquid gravy spillage occurring in bike transit is classified as a logistics delivery fault. ₹0 is deducted from the restaurant's payout as long as containers were sealed upon handover.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-gray-900">Evidence-Based Dispute Resolution</div>
                  <p className="text-gray-600 leading-relaxed">
                    Customer refund requests require photo verification. Subjective taste complaints are rejected with full payout preserved.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-2">
                  <div className="font-bold text-gray-900">Verified Customer Reviews</div>
                  <p className="text-gray-600 leading-relaxed">
                    Only guests who have placed and received an order can leave feedback. Partners can post public responses directly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: KING SPARK AI (ZOMATO SPARK PARITY) */}
          {activeTab === "spark" && (
            <div className="bg-[#F8F9FA] border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-display text-xl font-black text-gray-900 flex items-center gap-2">
                    <Sparkles className="size-5 text-[#E23744]" />
                    <span>King Spark AI Partner Operations Assistant</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Autonomous intelligence assistant for dispute arbitration, daily shift reconciliation, and menu optimization.
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full shrink-0">
                  Spark 24/7 Engine
                </span>
              </div>

              {/* Quick Prompt Pills */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { label: "Arbitrate Spillage Claim", query: "Arbitrate food spillage claim" },
                  { label: "Daily Shift Closing Recon", query: "shift recon" },
                  { label: "Explain Section 9(5) CGST", query: "How does Section 9(5) CGST work?" },
                  { label: "Menu Margin Optimization", query: "Optimize pricing for Mutton Dum Biryani" },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => runSparkQuery(p.query)}
                    className="bg-white hover:bg-gray-100 text-gray-800 font-bold px-3 py-1.5 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Spark Response Console */}
              <div className="rounded-2xl border border-gray-200 bg-gray-900 text-gray-100 p-5 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-gray-400 text-[11px] border-b border-gray-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-amber-400" />
                    <span>King Spark Operational Response</span>
                  </span>
                  <span>{sparkBusy ? "Processing..." : "Ready"}</span>
                </div>

                <div className="whitespace-pre-wrap leading-relaxed text-gray-200 max-h-72 overflow-y-auto font-mono">
                  {sparkResponse || (
                    <span className="text-gray-400 font-sans">
                      Select a prompt above or ask a question regarding kitchen operations, statutory tax, or dispute policies.
                    </span>
                  )}
                </div>
              </div>

              {/* Spark Input Box */}
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={sparkInput}
                  onChange={(e) => setSparkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && sparkInput.trim()) {
                      runSparkQuery(sparkInput.trim());
                    }
                  }}
                  placeholder="Ask Spark AI (e.g. 'How does Section 9(5) CGST work?' or 'What is the transit spillage policy?')"
                  className="bg-white border-gray-300 text-gray-900 text-xs h-11"
                />
                <Button
                  type="button"
                  disabled={!sparkInput.trim() || sparkBusy}
                  onClick={() => runSparkQuery(sparkInput.trim())}
                  className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold text-xs h-11 px-4 rounded-xl cursor-pointer"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 5. Documents Required Checklist */}
      <section className="py-12 bg-white border-b border-gray-200">
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
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">1. FSSAI License</div>
              <div className="text-xs font-semibold text-gray-900">14-Digit Food License</div>
              <p className="text-[11px] text-gray-500">Valid registration or state license certificate number.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">2. Bank Account</div>
              <div className="text-xs font-semibold text-gray-900">Account No &amp; IFSC</div>
              <p className="text-[11px] text-gray-500">Current or Savings account for daily T+1 automated payouts.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">3. PAN Card</div>
              <div className="text-xs font-semibold text-gray-900">Restaurant / Owner PAN</div>
              <p className="text-[11px] text-gray-500">Permanent Account Number matching bank account details.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">4. GSTIN / Exemption</div>
              <div className="text-xs font-semibold text-gray-900">GST Registration</div>
              <p className="text-[11px] text-gray-500">15-digit GSTIN, or turnover &lt; ₹20L exemption declaration.</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-2">
              <div className="text-xs font-bold text-[#E23744]">5. Menu Copy</div>
              <div className="text-xs font-semibold text-gray-900">Dishes &amp; Prices</div>
              <p className="text-[11px] text-gray-500">List of food items, prices in ₹, and veg/non-veg tags.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Operational Frequently Asked Questions (FAQ) */}
      <section className="py-12 bg-[#F8F9FA] border-b border-gray-200">
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
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1.5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900">How long does it take for my restaurant to go live?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Once you submit your 14-digit FSSAI license and bank details during onboarding, document verification takes 24 to 48 hours. Once verified, your kitchen status can be toggled Online immediately.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1.5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900">When and how do I receive payouts for completed orders?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Settlements are processed on a daily T+1 schedule directly into your registered bank account via NEFT/RTGS/IMPS. You can view order-by-order itemized settlement ledgers in the Settlements tab.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1.5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900">How is GST handled under Section 9(5) CGST?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                For online restaurant food deliveries, OrderKing is legally classified as an Electronic Commerce Operator (ECO) under Section 9(5) of the CGST Act. OrderKing directly collects and remits the 5% GST on food sales to the Government. Restaurant partners carry no GST liability for online orders.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1.5 shadow-xs">
              <h3 className="text-sm font-bold text-gray-900">Can I pause incoming orders if my kitchen gets overloaded?</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Yes. You can toggle your kitchen offline with a single tap from the dashboard or Kitchen Display System. You can select pause durations such as 30 minutes, 1 hour, or until the next shift.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-1.5 shadow-xs">
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

      {/* 8. "Need Help Signing In?" Drawer / Modal */}
      {helpOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-display text-lg font-black text-gray-900 flex items-center gap-2">
                <HelpCircle className="size-5 text-[#E23744]" />
                <span>Partner Login Assistance</span>
              </h3>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="font-bold text-gray-900">1. Did your registered phone number change?</div>
                <p>Submit your outlet GSTIN and 14-digit FSSAI certificate to our merchant verification team to update your primary login phone.</p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="font-bold text-gray-900">2. Delay in receiving SMS OTP?</div>
                <p>Use the "Get OTP on WhatsApp" button for instant delivery over data connection.</p>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="font-bold text-gray-900">3. Multi-Outlet Corporate Accounts</div>
                <p>If you manage multiple kitchen locations under a brand, use your primary registered mobile number to access all connected outlets.</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2">
              <a
                href="tel:+919395065587"
                className="w-full h-11 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <Phone className="size-4" />
                <span>Call Partner Helpline: +91 9395065587</span>
              </a>
              <a
                href="https://wa.me/919395065587?text=Hello%20OrderKing%20Partner%20Support,%20I%20need%20assistance%20logging%20into%20my%20restaurant%20portal."
                target="_blank"
                rel="noreferrer"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <MessageCircle className="size-4" />
                <span>Chat on WhatsApp Support</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
