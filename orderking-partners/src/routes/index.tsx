import { createFileRoute, Link, Navigate, redirect } from "@tanstack/react-router";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { authClient, setPhoneSession, getPhoneSession } from "@/lib/auth/client";
import { OrderKingMark } from "@/components/mark";
import { platformConfig } from "@/lib/platform-config";
import {
  sendPartnerOtpFn,
  verifyPartnerOtpFn,
  sanitizeIndianPhone,
  isValidIndianPhone,
} from "@/lib/server/sms-gateway";
import {
  ShieldCheck,
  ArrowRight,
  Phone,
  Mail,
  Lock,
  CheckCircle2,
  Clock,
  Banknote,
  UtensilsCrossed,
  Printer,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  TrendingUp,
  Store,
  FileCheck,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.sessionUser) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: PartnerLandingAndLogin,
});

export function PartnerLandingAndLogin() {
  const routeContext = Route.useRouteContext();
  const { user } = useCurrentUserState();

  // If already authenticated via client session, bounce to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const s = getPhoneSession();
      if (s?.user?.id || user?.id) {
        window.location.replace("/dashboard");
      }
    }
  }, [user]);

  // Auth Form State (Zomato-grade Partner Login)
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [providerNotice, setProviderNotice] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  // Earnings Calculator State
  const [dailyOrders, setDailyOrders] = useState<number>(30);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(450);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const cleanPhone = useMemo(() => sanitizeIndianPhone(mobileNumber), [mobileNumber]);
  const isPhoneValid = isValidIndianPhone(cleanPhone);

  // OTP Countdown
  useEffect(() => {
    if (otpStep !== "code") return;
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpStep, countdown]);

  if (routeContext?.sessionUser || user) {
    return <Navigate to="/dashboard" />;
  }

  async function handleSendOtp() {
    if (!isPhoneValid) {
      setError("Please enter a valid 10-digit Indian mobile number (e.g., 9876543210).");
      return;
    }

    setWorking(true);
    setError(null);

    try {
      const res = await sendPartnerOtpFn({
        data: { phone: cleanPhone, channel: "sms" },
      });
      if (!res?.success && res?.success !== undefined) {
        throw new Error("SMS dispatch failed. Please verify the mobile number.");
      }
      if (res.providerNotice) setProviderNotice(res.providerNotice);
      setOtpStep("code");
      setCountdown(30);
      setCanResend(false);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Failed to send verification code.");
    } finally {
      setWorking(false);
    }
  }

  async function handleVerifyOtp(codeOverride?: string) {
    const code = (codeOverride || otpCode).replace(/\D/g, "").trim();
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit OTP code.");
      return;
    }

    setWorking(true);
    setError(null);

    try {
      const verifyRes = await verifyPartnerOtpFn({
        data: { phone: cleanPhone, otp: code },
      });

      if (!verifyRes.success) {
        throw new Error("Invalid verification code. Please check and retry.");
      }

      const email = verifyRes.email;
      const credential = verifyRes.credential;

      setPhoneSession({
        id: "prt_" + cleanPhone,
        phone: cleanPhone,
        email,
        name: `Partner ${cleanPhone.slice(-4)}`,
        role: "partner",
      });

      if (verifyRes.isNewUser) {
        const signUpRes = await authClient.signUp.email({
          email,
          password: credential,
          name: `Partner ${cleanPhone.slice(-4)}`,
        });
        if (signUpRes.error) {
          await authClient.signIn.email({ email, password: credential });
        }
        window.location.assign("/onboarding");
      } else {
        const signInRes = await authClient.signIn.email({
          email,
          password: credential,
        });
        if (signInRes.error) {
          await authClient.signUp.email({
            email,
            password: credential,
            name: `Partner ${cleanPhone.slice(-4)}`,
          });
        }
        window.location.assign("/dashboard");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Verification failed. Please retry.");
    } finally {
      setWorking(false);
    }
  }

  async function handlePasswordLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = identifier.trim();
    let loginEmail = trimmed;
    if (!trimmed.includes("@")) {
      const digits = trimmed.replace(/\D/g, "").slice(-10);
      if (!/^[6-9]\d{9}$/.test(digits)) {
        setError("Please enter a valid 10-digit mobile number or business email.");
        return;
      }
      loginEmail = `${digits}@partner.orderking.in`;
    }

    setWorking(true);
    try {
      const res = await authClient.signIn.email({
        email: loginEmail,
        password,
      });
      if (res.error) throw new Error(res.error.message || "Invalid credentials.");
      window.location.assign("/dashboard");
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
      setWorking(false);
    }
  }

  // Calculator figures
  const monthlyGov = dailyOrders * avgOrderValue * 30;
  const platformFee = Math.round(monthlyGov * 0.10); // 10% flat commission
  const netBankPayout = monthlyGov - platformFee;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-[#E23744]/20 selection:text-[#E23744]">
      {/* 1. Header (Zomato-grade Navigation Bar) */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Mark */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <OrderKingMark className="size-11 text-[#E23744] transition-transform duration-200 group-hover:scale-105" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-2xl font-black tracking-tight text-gray-900">
                  {platformConfig.brand.shortAppName}
                </span>
                <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[#E23744]">
                  Partner
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">Restaurant Partner Portal</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#why-partner" className="hover:text-[#E23744] transition-colors">
              Why Partner
            </a>
            <a href="#how-it-works" className="hover:text-[#E23744] transition-colors">
              How It Works
            </a>
            <a href="#calculator" className="hover:text-[#E23744] transition-colors">
              Earnings Calculator
            </a>
            <a href="#faqs" className="hover:text-[#E23744] transition-colors">
              FAQs
            </a>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            <a
              href="#login-card"
              className="text-sm font-semibold text-gray-700 hover:text-[#E23744] px-3 py-2 transition-colors hidden sm:inline-block"
            >
              Sign In
            </a>
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E23744] px-4 sm:px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#c92f3b] active:scale-[0.98] transition-all"
            >
              <span>Register Restaurant</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Split Layout: Value Pitch + Quick Login Card) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-50/60 via-white to-gray-50/50 pt-10 sm:pt-16 pb-16 sm:pb-24 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
            
            {/* Left Column: Hero Value Pitch */}
            <div className="lg:col-span-7 space-y-8 pt-2 sm:pt-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-3.5 py-1.5 text-xs font-bold text-[#E23744] shadow-sm">
                <Store className="size-3.5 text-[#E23744]" />
                <span>India's Most Transparent Restaurant Partner Network</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 leading-[1.1]">
                  Partner with <span className="text-[#E23744]">OrderKing</span> and grow your restaurant
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 font-normal leading-relaxed max-w-2xl">
                  Expand your kitchen beyond your dining room. Connect to hungry local diners with real-time acoustic KDS alerts, transparent 10% commission, and automated daily T+1 bank payouts.
                </p>
              </div>

              {/* 4 Pillars of Trust */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl pt-2">
                <div className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-gray-200/80 shadow-sm">
                  <div className="rounded-xl bg-red-50 p-2 text-[#E23744] shrink-0">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">10-Minute Instant Setup</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Quick digital onboarding with menu & FSSAI upload</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-gray-200/80 shadow-sm">
                  <div className="rounded-xl bg-green-50 p-2 text-green-700 shrink-0">
                    <Banknote className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">T+1 Daily Bank Payouts</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Automated morning settlements via NPCI Direct UPI</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-gray-200/80 shadow-sm">
                  <div className="rounded-xl bg-amber-50 p-2 text-amber-700 shrink-0">
                    <Printer className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Live Acoustic KDS & KOT</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Loud kitchen chimes & Bluetooth thermal printing</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-gray-200/80 shadow-sm">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-700 shrink-0">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Section 9(5) CGST Compliant</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Automated GST invoicing under GSTIN 18AFXPH9838M1Z9</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/onboarding"
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#E23744] px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-red-500/25 hover:bg-[#c92f3b] active:scale-[0.98] transition-all text-center"
                >
                  <span>Register Your Restaurant Now</span>
                  <ArrowRight className="size-5" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-6 py-4 text-base font-bold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all text-center"
                >
                  <span>See How It Works</span>
                </a>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Zero registration fees • 0% commission for first 30 days • Cancel anytime</span>
              </div>
            </div>

            {/* Right Column: Embedded Zomato-grade Partner Login Card */}
            <div id="login-card" className="lg:col-span-5 scroll-mt-28">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xl shadow-gray-200/50">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-2xl font-black tracking-tight text-gray-900">Partner Login</h2>
                    <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold border border-emerald-200">
                      Active Portal
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Log in to manage your kitchen orders, menu, and payouts
                  </p>
                </div>

                {/* Segmented Auth Selector (OTP vs Password) */}
                <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 mb-6 text-xs font-bold text-gray-700">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod("otp");
                      setError(null);
                    }}
                    className={`rounded-lg py-2 transition-all ${
                      authMethod === "otp"
                        ? "bg-white text-gray-900 shadow-sm font-extrabold"
                        : "hover:text-gray-900"
                    }`}
                  >
                    Mobile OTP (Instant)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod("password");
                      setError(null);
                    }}
                    className={`rounded-lg py-2 transition-all ${
                      authMethod === "password"
                        ? "bg-white text-gray-900 shadow-sm font-extrabold"
                        : "hover:text-gray-900"
                    }`}
                  >
                    Email / Password
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Notice Banner */}
                {providerNotice && (
                  <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700 flex items-start gap-2">
                    <ShieldCheck className="size-4 shrink-0 mt-0.5" />
                    <span>{providerNotice}</span>
                  </div>
                )}

                {/* 1. Mobile OTP Authentication Flow */}
                {authMethod === "otp" && (
                  <div className="space-y-4">
                    {otpStep === "phone" ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Registered Mobile Number
                          </label>
                          <div className="flex rounded-xl border border-gray-300 bg-white focus-within:border-[#E23744] focus-within:ring-2 focus-within:ring-[#E23744]/20 overflow-hidden transition-all">
                            <span className="flex items-center bg-gray-50 px-3.5 text-sm font-bold text-gray-600 border-r border-gray-200">
                              🇮🇳 +91
                            </span>
                            <input
                              type="tel"
                              inputMode="numeric"
                              maxLength={10}
                              placeholder="Enter 10-digit mobile"
                              value={mobileNumber}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                setMobileNumber(val);
                                setError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && isPhoneValid && !working) {
                                  e.preventDefault();
                                  void handleSendOtp();
                                }
                              }}
                              className="w-full px-3.5 py-3 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none"
                            />
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            We will send a 6-digit one-time password to verify your account
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={!isPhoneValid || working}
                          onClick={() => handleSendOtp()}
                          className="w-full rounded-xl bg-[#E23744] py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#c92f3b] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
                        >
                          {working ? (
                            <>
                              <RefreshCw className="size-4 animate-spin" />
                              <span>Sending OTP...</span>
                            </>
                          ) : (
                            <>
                              <span>Send Verification OTP</span>
                              <ArrowRight className="size-4" />
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* OTP Code Entry Step */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-gray-700">Code sent to:</span>
                            <span className="ml-1 text-xs font-black text-gray-900">+91 {cleanPhone}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setOtpStep("phone");
                              setOtpCode("");
                              setError(null);
                            }}
                            className="text-xs font-bold text-[#E23744] hover:underline"
                          >
                            Change
                          </button>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                            Enter 6-Digit OTP
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="• • • • • •"
                            value={otpCode}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              setOtpCode(val);
                              setError(null);
                              if (val.length === 6) {
                                void handleVerifyOtp(val);
                              }
                            }}
                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-2xl font-mono font-bold tracking-[0.4em] text-gray-900 focus:border-[#E23744] focus:outline-none focus:ring-2 focus:ring-[#E23744]/20"
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          {canResend ? (
                            <button
                              type="button"
                              onClick={() => handleSendOtp()}
                              disabled={working}
                              className="font-bold text-[#E23744] hover:underline"
                            >
                              Resend Verification Code
                            </button>
                          ) : (
                            <span className="text-gray-500">Resend code in {countdown}s</span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={otpCode.length !== 6 || working}
                          onClick={() => handleVerifyOtp()}
                          className="w-full rounded-xl bg-[#E23744] py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#c92f3b] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
                        >
                          {working ? (
                            <>
                              <RefreshCw className="size-4 animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <span>Verify & Enter Dashboard</span>
                              <ArrowRight className="size-4" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Password Authentication Flow */}
                {authMethod === "password" && (
                  <form onSubmit={handlePasswordLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Business Email or Mobile
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., manager@restaurant.com or 9876543210"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        className="w-full rounded-xl border border-gray-300 px-3.5 py-3 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] focus:outline-none focus:ring-2 focus:ring-[#E23744]/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="Enter your account password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full rounded-xl border border-gray-300 px-3.5 py-3 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] focus:outline-none focus:ring-2 focus:ring-[#E23744]/20"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={working || !identifier || !password}
                      className="w-full rounded-xl bg-[#E23744] py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#c92f3b] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
                    >
                      {working ? (
                        <>
                          <RefreshCw className="size-4 animate-spin" />
                          <span>Signing In...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In to Dashboard</span>
                          <ArrowRight className="size-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Card Onboarding Prompt */}
                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-600">
                    Want to list a new restaurant?{" "}
                    <Link to="/onboarding" className="font-bold text-[#E23744] hover:underline">
                      Register your restaurant in 10 minutes
                    </Link>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Why Partner with OrderKing? (4 Major Value Cards) */}
      <section id="why-partner" className="py-16 sm:py-24 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-extrabold text-[#E23744] uppercase tracking-widest">
              Merchant Advantage
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Why restaurants choose OrderKing
            </h3>
            <p className="text-base text-gray-600">
              Built ground-up with transparent commercials and high-reliability tools to empower Indian restaurant owners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Card 1 */}
            <div className="rounded-3xl border border-gray-200 bg-[#F8FAFC] p-6 hover:shadow-lg transition-all space-y-4">
              <div className="size-12 rounded-2xl bg-red-100/70 text-[#E23744] flex items-center justify-center font-black">
                <Store className="size-6" />
              </div>
              <h4 className="text-lg font-black text-gray-900">Massive Local Demand</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Connect with thousands of local food lovers across your delivery radius. Double your kitchen output during lunch and dinner rushes without expanding physical seating.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-3xl border border-gray-200 bg-[#F8FAFC] p-6 hover:shadow-lg transition-all space-y-4">
              <div className="size-12 rounded-2xl bg-green-100/70 text-green-700 flex items-center justify-center font-black">
                <Banknote className="size-6" />
              </div>
              <h4 className="text-lg font-black text-gray-900">T+1 Daily Settlements</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                No 15-day or monthly payout withholding. Earnings from delivered orders are automatically settled directly into your current bank account every morning via NPCI UPI & RazorpayX.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-3xl border border-gray-200 bg-[#F8FAFC] p-6 hover:shadow-lg transition-all space-y-4">
              <div className="size-12 rounded-2xl bg-amber-100/70 text-amber-700 flex items-center justify-center font-black">
                <Printer className="size-6" />
              </div>
              <h4 className="text-lg font-black text-gray-900">Acoustic KDS & KOT</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Persistent audible order chimes ensure zero missed tickets. Automated thermal printing supports 80mm and 58mm Bluetooth/USB kitchen receipt printers.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-3xl border border-gray-200 bg-[#F8FAFC] p-6 hover:shadow-lg transition-all space-y-4">
              <div className="size-12 rounded-2xl bg-blue-100/70 text-blue-700 flex items-center justify-center font-black">
                <ShieldCheck className="size-6" />
              </div>
              <h4 className="text-lg font-black text-gray-900">Transparent Economics</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Flat 10% platform commission with zero hidden tech fees, zero surge charges, and complete GST compliance under Section 9(5) CGST (GSTIN 18AFXPH9838M1Z9).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works (3 Steps to Start Receiving Orders) */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-extrabold text-[#E23744] uppercase tracking-widest">
              Simple 3-Step Journey
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Start receiving orders in 3 steps
            </h3>
            <p className="text-base text-gray-600">
              Get your restaurant live on OrderKing within 24 hours of submitting your basic verification documents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="rounded-3xl bg-white p-8 border border-gray-200/80 shadow-sm relative space-y-4">
              <div className="size-10 rounded-full bg-[#E23744] text-white flex items-center justify-center text-sm font-black">
                1
              </div>
              <h4 className="text-xl font-bold text-gray-900">Restaurant Details</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Provide restaurant name, location, owner contact, and operating cuisines. Pin your location on the map for accurate delivery dispatch.
              </p>
              <ul className="text-xs text-gray-500 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span>Restaurant name & complete address</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span>Owner contact & phone verification</span>
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="rounded-3xl bg-white p-8 border border-gray-200/80 shadow-sm relative space-y-4">
              <div className="size-10 rounded-full bg-[#E23744] text-white flex items-center justify-center text-sm font-black">
                2
              </div>
              <h4 className="text-xl font-bold text-gray-900">Menu & Photo Catalog</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Upload your menu card or enter dishes directly. Set dish prices, food tags (Veg, Non-Veg, Egg), and mouth-watering food photography.
              </p>
              <ul className="text-xs text-gray-500 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span>Categories (Starters, Biryani, Curries)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span>Transparent item pricing & portion sizes</span>
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="rounded-3xl bg-white p-8 border border-gray-200/80 shadow-sm relative space-y-4">
              <div className="size-10 rounded-full bg-[#E23744] text-white flex items-center justify-center text-sm font-black">
                3
              </div>
              <h4 className="text-xl font-bold text-gray-900">FSSAI & Bank Account</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Enter your 14-digit FSSAI license number and bank account details for direct T+1 daily earnings settlements.
              </p>
              <ul className="text-xs text-gray-500 space-y-1.5 pt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span>Valid FSSAI certificate details</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span>Bank account & IFSC for daily payouts</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#E23744] px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-red-500/20 hover:bg-[#c92f3b] active:scale-[0.98] transition-all"
            >
              <span>Start Free Restaurant Onboarding</span>
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Interactive Earnings & Payout Calculator */}
      <section id="calculator" className="py-16 sm:py-24 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-xs font-extrabold text-[#E23744] uppercase tracking-widest">
              Commercial Transparency
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Estimate your monthly earnings
            </h3>
            <p className="text-sm text-gray-600">
              See exact net bank payouts calculated transparently with OrderKing's flat 10% platform fee.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-50/70 p-6 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Controls */}
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-700">Daily Order Volume</label>
                    <span className="text-sm font-black text-[#E23744]">{dailyOrders} orders / day</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 30, 60, 100].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setDailyOrders(num)}
                        className={`rounded-xl py-2.5 text-xs font-bold border transition-all ${
                          dailyOrders === num
                            ? "bg-[#E23744] text-white border-[#E23744] shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {num} orders
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-700">Average Order Value (AOV)</label>
                    <span className="text-sm font-black text-[#E23744]">₹{avgOrderValue}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[250, 450, 750].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAvgOrderValue(val)}
                        className={`rounded-xl py-2.5 text-xs font-bold border transition-all ${
                          avgOrderValue === val
                            ? "bg-[#E23744] text-white border-[#E23744] shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        ₹{val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-gray-200 text-xs text-gray-500 space-y-1">
                  <p className="font-semibold text-gray-700">100% Direct Delivery Pass-Through:</p>
                  <p>Customer tips and delivery fees go 100% to verified delivery riders. Never deducted from your food revenue.</p>
                </div>
              </div>

              {/* Real-time Settlement Breakdown Card */}
              <div className="rounded-2xl bg-white p-6 sm:p-8 border border-gray-200 shadow-md space-y-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Projected Monthly Revenue & Settlements
                </h4>

                <div className="space-y-3 border-b border-gray-100 pb-5">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Monthly Gross Food Sales (GOV)</span>
                    <span className="font-bold text-gray-900">₹{monthlyGov.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>OrderKing Platform Fee (Flat 10%)</span>
                    <span className="font-bold text-red-600">-₹{platformFee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Introductory 30-day offer</span>
                    <span className="font-bold text-emerald-600">0% Commission</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 font-semibold mb-1">Estimated Monthly Net Bank Payout</div>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono tracking-tight">
                    ₹{netBankPayout.toLocaleString("en-IN")}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Credited daily (T+1) into your verified bank account via NPCI UPI / RazorpayX.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Frequently Asked Questions (Accordion) */}
      <section id="faqs" className="py-16 sm:py-24 bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <h2 className="text-xs font-extrabold text-[#E23744] uppercase tracking-widest">
              Got Questions?
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Frequently Asked Questions
            </h3>
            <p className="text-sm text-gray-600">
              Everything you need to know about partnering with OrderKing
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What documents are required to partner with OrderKing?",
                a: "You only need 3 basic documents: (1) 14-digit FSSAI license or registration certificate, (2) PAN card of the owner/proprietor, and (3) Bank account details (cancelled cheque or passbook copy) for direct T+1 daily payouts. GST certificate is required if you are registered under GST.",
              },
              {
                q: "How and when do I receive order payouts?",
                a: "Payouts are processed daily on a T+1 schedule. Earnings from all delivered orders from Monday are settled directly into your registered bank current account on Tuesday morning via NPCI Direct UPI or RazorpayX. Full transaction reconciliation is viewable in your Settlements tab.",
              },
              {
                q: "Do I need special POS hardware or a proprietary tablet?",
                a: "No special hardware required! The OrderKing Partner portal works smoothly in any modern web browser on your existing Android phone, iPhone, iPad, tablet, or desktop PC. For physical receipts, our portal seamlessly connects via Web Bluetooth to standard 80mm and 58mm ESC/POS thermal printers.",
              },
              {
                q: "How are delivery riders assigned to my orders?",
                a: "OrderKing automatically dispatches nearest verified delivery fleet riders as soon as your kitchen accepts the order. You can track rider arrival in real-time on your dashboard and hand over the order with an audible 4-digit pickup OTP.",
              },
              {
                q: "Can I turn off online ordering when my kitchen is busy?",
                a: "Yes. You have complete control. You can toggle your restaurant status from 'Online' to 'Busy' or 'Offline' with 1 click. You can also toggle individual out-of-stock items (86 stockout) instantly so customers cannot order unavailable dishes.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="size-5 text-[#E23744] shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="size-5 text-gray-400 shrink-0 ml-4" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Statutory Footer */}
      <footer className="bg-gray-900 text-gray-400 text-xs py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <OrderKingMark className="size-9 text-white" />
              <div>
                <span className="font-display text-xl font-black text-white">OrderKing Partner</span>
                <p className="text-[11px] text-gray-500">Official Restaurant Merchant Network</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">
              <a href="#why-partner" className="hover:text-white transition-colors">
                Why Partner
              </a>
              <a href="#how-it-works" className="hover:text-white transition-colors">
                Onboarding Steps
              </a>
              <a href="#calculator" className="hover:text-white transition-colors">
                Calculator
              </a>
              <Link to="/onboarding" className="hover:text-white transition-colors">
                Register Restaurant
              </Link>
              <a href="#login-card" className="hover:text-white transition-colors">
                Partner Sign In
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-[11px] leading-relaxed">
            <div>
              <p className="text-gray-300 font-bold mb-1">Corporate & Statutory Identity</p>
              <p>Operated by Orderkingpay</p>
              <p>GSTIN: <span className="font-mono text-gray-200">18AFXPH9838M1Z9</span></p>
              <p>Compliance: Section 9(5) CGST Act, 2017 & FSSAI Standards</p>
              <p>Location: Hailakandi / Silchar, Assam - 788710</p>
            </div>

            <div>
              <p className="text-gray-300 font-bold mb-1">Merchant Helpline & Support</p>
              <p>Direct Partner Phone: <a href="tel:+919395065587" className="text-gray-200 hover:underline">+91 9395065587</a></p>
              <p>UPI VPA: <span className="font-mono text-gray-200">orderking@ybl</span> / <span className="font-mono text-gray-200">9395065587@ybl</span></p>
              <p>Support Hours: 24/7 Priority Kitchen Support</p>
            </div>

            <div>
              <p className="text-gray-300 font-bold mb-1">Zero-Tolerance Standards</p>
              <p>100% authentic PostgreSQL database backed. Zero mocks or placeholder transactions. Transparent daily accounting for every restaurant merchant.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-4">
            <p>© {new Date().getFullYear()} OrderKing Foods Private Limited. All rights reserved.</p>
            <div className="flex gap-4">
              <span>Merchant Terms of Service</span>
              <span>Privacy Policy</span>
              <span>FSSAI Hygiene Undertaking</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
