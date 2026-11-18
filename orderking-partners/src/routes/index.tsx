import { createFileRoute, Link, Navigate, redirect } from "@tanstack/react-router";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { authClient, setPhoneSession, getPhoneSession } from "@/lib/auth/client";
import { OrderKingMark } from "@/components/mark";
import { platformConfig } from "@/lib/platform-config";
import { formatINR } from "@/lib/money";
import { SettlementEngine } from "@/features/finance/SettlementEngine";
import {
  sendPartnerOtpFn,
  verifyPartnerOtpFn,
  sanitizeIndianPhone,
  isValidIndianPhone,
} from "@/lib/server/sms-gateway";
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Clock,
  Banknote,
  Printer,
  ChevronDown,
  ChevronUp,
  Store,
  AlertCircle,
  RefreshCw,
  MessageCircle,
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const s = getPhoneSession();
      if (s?.user?.id || user?.id) {
        window.location.replace("/dashboard");
      }
    }
  }, [user]);

  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [providerNotice, setProviderNotice] = useState<string | null>(null);
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  // Statutory Settlement Calculator State
  const [dailyOrders, setDailyOrders] = useState<number>(30);
  const [avgOrderValue, setAvgOrderValue] = useState<number>(450);
  const [commissionRatePercent, setCommissionRatePercent] = useState<number>(22);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const cleanPhone = useMemo(() => sanitizeIndianPhone(mobileNumber), [mobileNumber]);
  const isPhoneValid = isValidIndianPhone(cleanPhone);

  // WebOTP API listener when waiting for verification code
  useEffect(() => {
    if (otpStep !== "code") return;
    if (typeof window === "undefined" || !("OTPCredential" in window)) return;

    const ac = new AbortController();
    (navigator as any).credentials
      ?.get({
        otp: { transport: ["sms"] },
        signal: ac.signal,
      })
      .then((otp: any) => {
        if (otp?.code) {
          setOtpCode(otp.code);
          void handleVerifyOtp(otp.code);
        }
      })
      .catch(() => {});

    return () => ac.abort();
  }, [otpStep]);

  // OTP Resend Countdown
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

  async function handleSendOtp(channel: "sms" | "whatsapp" = "sms") {
    if (!isPhoneValid) {
      setError("Enter a valid 10-digit Indian mobile number starting with 6–9.");
      return;
    }

    setWorking(true);
    setError(null);

    try {
      const res = await sendPartnerOtpFn({
        data: { phone: cleanPhone, channel },
      });
      if (!res?.success && res?.success !== undefined) {
        throw new Error("Verification code dispatch failed. Verify the mobile number and retry.");
      }
      if (res.providerNotice) setProviderNotice(res.providerNotice);
      if (res.whatsAppOtpUrl) setWhatsAppUrl(res.whatsAppOtpUrl);
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
      setError("Enter the 6-digit verification code.");
      return;
    }

    setWorking(true);
    setError(null);

    try {
      const verifyRes = await verifyPartnerOtpFn({
        data: { phone: cleanPhone, otp: code },
      });

      if (!verifyRes.success) {
        throw new Error("Invalid verification code. Check and retry.");
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
        setError("Enter a valid 10-digit Indian mobile number or registered business email.");
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

  // Exact integer-paise statutory settlement breakdown via SettlementEngine
  const monthlyOrdersCount = dailyOrders * 30;
  const perOrderBreakdown = useMemo(() => {
    const itemSubtotalPaise = avgOrderValue * 100;
    const customerGstPaise = Math.round(itemSubtotalPaise * 0.05);
    return SettlementEngine.calculateOrderSettlement({
      orderId: "calc-preview",
      deliveredAt: new Date().toISOString(),
      platformDiscountPaise: 0,
      itemSubtotalPaise,
      packagingChargePaise: 0,
      restaurantDiscountPaise: 0,
      customerGstPaise,
      customerPaidPaise: itemSubtotalPaise + customerGstPaise,
      commissionRatePercent,
      paymentMethod: "PREPAID_ONLINE",
      hasPan: true,
      hasGstin: true,
      penaltyPaise: 0,
    });
  }, [avgOrderValue, commissionRatePercent]);

  const monthlyGovPaise = perOrderBreakdown.taxableFoodValuePaise * monthlyOrdersCount;
  const monthlyCommissionPaise = perOrderBreakdown.platformCommissionPaise * monthlyOrdersCount;
  const monthlyCommissionGstPaise = perOrderBreakdown.commissionGstPaise * monthlyOrdersCount;
  const monthlyPgTotalPaise =
    (perOrderBreakdown.paymentGatewayFeePaise + perOrderBreakdown.paymentGatewayGstPaise) *
    monthlyOrdersCount;
  const monthlyTcsPaise = perOrderBreakdown.tcsDeductionPaise * monthlyOrdersCount;
  const monthlyTdsPaise = perOrderBreakdown.tdsDeductionPaise * monthlyOrdersCount;
  const monthlyNetPayoutPaise = perOrderBreakdown.netMerchantPayablePaise * monthlyOrdersCount;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-[#E23744]/20 selection:text-[#E23744]">
      {/* 1. Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
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

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
            <a href="#capabilities" className="hover:text-[#E23744] transition-colors">
              Operations
            </a>
            <a href="#onboarding-steps" className="hover:text-[#E23744] transition-colors">
              Onboarding
            </a>
            <a href="#calculator" className="hover:text-[#E23744] transition-colors">
              Settlement Schedule
            </a>
            <a href="#faqs" className="hover:text-[#E23744] transition-colors">
              FAQs
            </a>
          </nav>

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

      {/* 2. Primary Portal Access & Login */}
      <section className="relative overflow-hidden bg-gradient-to-b from-red-50/50 via-white to-gray-50/50 pt-10 sm:pt-16 pb-16 sm:pb-24 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
            {/* Left Column: Operational Capabilities Summary */}
            <div className="lg:col-span-7 space-y-8 pt-2 sm:pt-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-3.5 py-1.5 text-xs font-bold text-[#E23744] shadow-sm">
                <Store className="size-3.5 text-[#E23744]" />
                <span>OrderKing Restaurant Partner Platform</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 leading-[1.12]">
                  Manage live orders, kitchen dispatch, and daily settlements
                </h1>
                <p className="text-base sm:text-lg text-gray-600 font-normal leading-relaxed max-w-2xl">
                  Receive live customer delivery orders with continuous acoustic KDS alerts, 58mm/80mm ESC/POS thermal KOT printing, 1-tap menu stockout controls, and automated T+1 bank settlements.
                </p>
              </div>

              {/* 4 Core Functional Modules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl pt-2">
                <div className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-gray-200/80 shadow-sm">
                  <div className="rounded-xl bg-red-50 p-2 text-[#E23744] shrink-0">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Digital KYC Onboarding</h2>
                    <p className="text-xs text-gray-500 mt-0.5">14-digit FSSAI FoSCoS, PAN, GSTIN, and bank IFSC verification</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-gray-200/80 shadow-sm">
                  <div className="rounded-xl bg-green-50 p-2 text-green-700 shrink-0">
                    <Banknote className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">T+1 Daily Settlements</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Integer-paise ledger with UTR tracking and GSTR-1 statements</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-gray-200/80 shadow-sm">
                  <div className="rounded-xl bg-amber-50 p-2 text-amber-700 shrink-0">
                    <Printer className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Acoustic KDS &amp; Thermal KOT</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Continuous order siren, 4-digit rider OTP, WebUSB/Bluetooth printing</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl bg-white p-4 border border-gray-200/80 shadow-sm">
                  <div className="rounded-xl bg-blue-50 p-2 text-blue-700 shrink-0">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gray-900">Statutory Tax Compliance</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Section 9(5) CGST, Sec 52 TCS &amp; Sec 194-O TDS under 18AFXPH9838M1Z9</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <Link
                  to="/onboarding"
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#E23744] px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-red-500/20 hover:bg-[#c92f3b] active:scale-[0.98] transition-all text-center"
                >
                  <span>Register Restaurant</span>
                  <ArrowRight className="size-5" />
                </Link>
                <a
                  href="#calculator"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-300 bg-white px-6 py-4 text-base font-bold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all text-center"
                >
                  <span>View Settlement Breakdown</span>
                </a>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span>Mandatory 14-digit FSSAI FoSCoS • Contractual commission schedule (18%–28%) • SAC 996331</span>
              </div>
            </div>

            {/* Right Column: Partner Login Card */}
            <div id="login-card" className="lg:col-span-5 scroll-mt-28">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xl shadow-gray-200/50">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="text-2xl font-black tracking-tight text-gray-900">Partner Login</h2>
                    <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-bold border border-emerald-200">
                      Portal Active
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Sign in to access live KDS orders, menu stockouts, and settlements
                  </p>
                </div>

                {/* Auth Method Tabs */}
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
                    Mobile OTP
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

                {error && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

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
                              +91
                            </span>
                            <input
                              type="tel"
                              inputMode="numeric"
                              maxLength={10}
                              placeholder="Enter 10-digit mobile number"
                              value={mobileNumber}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, "");
                                setMobileNumber(val);
                                setError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && isPhoneValid && !working) {
                                  e.preventDefault();
                                  void handleSendOtp("sms");
                                }
                              }}
                              className="w-full px-3.5 py-3 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none"
                            />
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            A 6-digit verification code will be sent via SMS
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={!isPhoneValid || working}
                          onClick={() => void handleSendOtp("sms")}
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
                              setProviderNotice(null);
                              setWhatsAppUrl(null);
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
                            placeholder="••••••"
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

                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          {canResend ? (
                            <button
                              type="button"
                              onClick={() => void handleSendOtp("sms")}
                              disabled={working}
                              className="font-bold text-[#E23744] hover:underline"
                            >
                              Resend SMS OTP
                            </button>
                          ) : (
                            <span className="text-gray-500 font-mono">Resend in {countdown}s</span>
                          )}

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              disabled={working}
                              onClick={() => void handleSendOtp("whatsapp")}
                              className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline disabled:opacity-50"
                            >
                              <MessageCircle className="size-3.5" />
                              <span>WhatsApp OTP</span>
                            </button>
                            {whatsAppUrl ? (
                              <a
                                href={whatsAppUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-emerald-600 hover:underline"
                              >
                                Open WhatsApp
                              </a>
                            ) : null}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={otpCode.length !== 6 || working}
                          onClick={() => void handleVerifyOtp()}
                          className="w-full rounded-xl bg-[#E23744] py-3.5 text-sm font-extrabold text-white shadow-sm hover:bg-[#c92f3b] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2"
                        >
                          {working ? (
                            <>
                              <RefreshCw className="size-4 animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <>
                              <span>Verify &amp; Open Dashboard</span>
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
                        Registered Mobile or Business Email
                      </label>
                      <input
                        type="text"
                        placeholder="Registered mobile number or email"
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
                        placeholder="Enter account password"
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

                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-600">
                    Registering a new restaurant outlet?{" "}
                    <Link to="/onboarding" className="font-bold text-[#E23744] hover:underline">
                      Start statutory onboarding
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Platform Operational Specifications */}
      <section id="capabilities" className="py-16 sm:py-20 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-extrabold text-[#E23744] uppercase tracking-widest">
              Partner Platform Specifications
            </h2>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">
              Core Restaurant &amp; POS Operations
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-3xl border border-gray-200 bg-[#F8FAFC] p-6 space-y-3">
              <div className="size-11 rounded-2xl bg-red-100/70 text-[#E23744] flex items-center justify-center">
                <Store className="size-5" />
              </div>
              <h4 className="text-base font-black text-gray-900">Order Dispatch &amp; KDS</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Live order state machine with 120-second acceptance SLA, adjustable prep-time sliders, 1-tap Food Ready trigger, and 4-digit rider handover OTP.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-[#F8FAFC] p-6 space-y-3">
              <div className="size-11 rounded-2xl bg-green-100/70 text-green-700 flex items-center justify-center">
                <Banknote className="size-5" />
              </div>
              <h4 className="text-base font-black text-gray-900">T+1 Daily Settlements</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Daily payout batches credited to your verified bank account with UTR references, itemized order deductions, and monthly GSTR-1 statements.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-[#F8FAFC] p-6 space-y-3">
              <div className="size-11 rounded-2xl bg-amber-100/70 text-amber-700 flex items-center justify-center">
                <Printer className="size-5" />
              </div>
              <h4 className="text-base font-black text-gray-900">ESC/POS Thermal Printing</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Direct WebUSB and WebBluetooth raw ESC/POS printing for 58mm and 80mm thermal printers with offline print spooling and SAC 996331 tax receipts.
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-[#F8FAFC] p-6 space-y-3">
              <div className="size-11 rounded-2xl bg-blue-100/70 text-blue-700 flex items-center justify-center">
                <ShieldCheck className="size-5" />
              </div>
              <h4 className="text-base font-black text-gray-900">Statutory Tax Engine</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Automated Section 9(5) CGST collection (5% food services), 1% Section 52 TCS, and 0.1%/1.0% Section 194-O TDS under GSTIN 18AFXPH9838M1Z9.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 3-Step Statutory Onboarding */}
      <section id="onboarding-steps" className="py-16 sm:py-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-extrabold text-[#E23744] uppercase tracking-widest">
              Registration Workflow
            </h2>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">
              Required Documents &amp; Activation Steps
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl bg-white p-7 border border-gray-200/80 shadow-sm space-y-3">
              <div className="size-9 rounded-full bg-[#E23744] text-white flex items-center justify-center text-sm font-black">
                1
              </div>
              <h4 className="text-lg font-bold text-gray-900">Outlet Details &amp; Coordinates</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Submit legal trade name, street address, owner mobile number, operating shift timings, and GPS map coordinates for rider dispatch.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 border border-gray-200/80 shadow-sm space-y-3">
              <div className="size-9 rounded-full bg-[#E23744] text-white flex items-center justify-center text-sm font-black">
                2
              </div>
              <h4 className="text-lg font-bold text-gray-900">Menu &amp; Pricing Catalog</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Create menu categories, item prices, dietary tags (Veg, Non-Veg, Egg), portion weights, packaging charges, and dish photography.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-7 border border-gray-200/80 shadow-sm space-y-3">
              <div className="size-9 rounded-full bg-[#E23744] text-white flex items-center justify-center text-sm font-black">
                3
              </div>
              <h4 className="text-lg font-bold text-gray-900">FSSAI, PAN, GSTIN &amp; Bank</h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Validate 14-digit FSSAI FoSCoS license and expiry date, 10-character PAN, 15-character GSTIN (if applicable), and settlement bank account with IFSC.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/onboarding"
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-[#E23744] px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-red-500/20 hover:bg-[#c92f3b] active:scale-[0.98] transition-all"
            >
              <span>Start Restaurant Onboarding</span>
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Statutory Settlement Schedule Calculator (Exact SettlementEngine Math) */}
      <section id="calculator" className="py-16 sm:py-20 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <h2 className="text-xs font-extrabold text-[#E23744] uppercase tracking-widest">
              Commercial &amp; Statutory Schedule
            </h2>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">
              Monthly Settlement Estimator
            </h3>
            <p className="text-sm text-gray-600">
              Calculated in integer paise using agreed commission tiers, 18% GST on platform services, 1.84% payment gateway fee, 1% Section 52 TCS, and 0.1% Section 194-O TDS.
            </p>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-gray-50/70 p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
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

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-gray-700">Contract Commission Tier</label>
                    <span className="text-sm font-black text-[#E23744]">{commissionRatePercent}%</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[18, 22, 25, 28].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setCommissionRatePercent(rate)}
                        className={`rounded-xl py-2.5 text-xs font-bold border transition-all ${
                          commissionRatePercent === rate
                            ? "bg-[#E23744] text-white border-[#E23744] shadow-sm"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-4 border border-gray-200 text-xs text-gray-600 space-y-1">
                  <p className="font-semibold text-gray-800">Statutory Tax Remittance:</p>
                  <p>
                    5% GST on restaurant food services is collected from the customer and remitted directly to the government u/s 9(5) CGST Act. One-time onboarding setup fee (₹999–₹2,499) is amortized across initial settlement cycles.
                  </p>
                </div>
              </div>

              {/* Exact Settlement Breakdown Card */}
              <div className="rounded-2xl bg-white p-6 sm:p-7 border border-gray-200 shadow-md space-y-5">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Projected Monthly Ledger ({monthlyOrdersCount} Delivered Orders)
                </h4>

                <div className="space-y-2.5 border-b border-gray-100 pb-4 text-xs sm:text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Gross Food Sales (Taxable Base)</span>
                    <span className="font-bold font-mono text-gray-900">{formatINR(monthlyGovPaise)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Platform Commission ({commissionRatePercent}%)</span>
                    <span className="font-semibold font-mono text-red-600">−{formatINR(monthlyCommissionPaise)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>GST on Commission (18%)</span>
                    <span className="font-semibold font-mono text-red-600">−{formatINR(monthlyCommissionGstPaise)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Payment Gateway Fee (1.84% + 18% GST)</span>
                    <span className="font-semibold font-mono text-red-600">−{formatINR(monthlyPgTotalPaise)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Section 52 CGST TCS (1.0%)</span>
                    <span className="font-semibold font-mono text-amber-700">−{formatINR(monthlyTcsPaise)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Section 194-O Income Tax TDS (0.1% PAN)</span>
                    <span className="font-semibold font-mono text-amber-700">−{formatINR(monthlyTdsPaise)}</span>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 font-semibold mb-1">Estimated Monthly Net Bank Settlement</div>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono tracking-tight">
                    {formatINR(monthlyNetPayoutPaise)}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Settled daily (T+1) to your verified bank account with UTR tracking. Direct UPI orders carry 0% PG fee.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Frequently Asked Questions */}
      <section id="faqs" className="py-16 sm:py-20 bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-extrabold text-[#E23744] uppercase tracking-widest">
              Documentation &amp; Operations
            </h2>
            <h3 className="text-3xl font-black text-gray-900 tracking-tight">
              Frequently Asked Questions
            </h3>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "What statutory documents are mandatory for onboarding?",
                a: "You must provide: (1) valid 14-digit FSSAI FoSCoS license number and expiry date, (2) 10-character PAN of the proprietor or entity, (3) Bank account number and 11-character IFSC code for T+1 settlements, and (4) 15-character GSTIN if GST-registered.",
              },
              {
                q: "How does the daily T+1 settlement cycle work?",
                a: "All delivered orders from each operating day are aggregated into a settlement batch in integer paise. After statutory deductions (contract commission + 18% GST, 1.84% PG fee on card/wallet orders, 1% Sec 52 TCS, 0.1% Sec 194-O TDS), net payouts are transferred on T+1 with a 16-character UTR reference.",
              },
              {
                q: "Which thermal receipt printers are supported?",
                a: "OrderKing Partner connects directly from supported browsers via WebUSB and Web Bluetooth to standard 58mm (32-char) and 80mm (48-char) ESC/POS thermal printers for automated KOT tickets and SAC 996331 customer tax invoices.",
              },
              {
                q: "How are riders dispatched and verified at pickup?",
                a: "Once an order is accepted on KDS and marked Ready, nearby verified fleet riders are dispatched. At handover, the kitchen verifies the rider's 4-digit pickup OTP before marking the order dispatched.",
              },
              {
                q: "How do I pause orders or mark items out of stock?",
                a: "Use the header Online/Offline switch or Emergency Pause (30m, 60m, rest of day) on the Kitchen/Hours screen. Individual menu dishes support 1-tap stockout (86'ing) with automated next-day 06:00 AM reactivation.",
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
                <p className="text-[11px] text-gray-500">Restaurant Merchant &amp; POS Platform</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">
              <a href="#capabilities" className="hover:text-white transition-colors">
                Operations
              </a>
              <a href="#onboarding-steps" className="hover:text-white transition-colors">
                Onboarding
              </a>
              <a href="#calculator" className="hover:text-white transition-colors">
                Settlement Schedule
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
              <p className="text-gray-300 font-bold mb-1">Corporate &amp; Statutory Entity</p>
              <p>Operated by Orderkingpay</p>
              <p>GSTIN: <span className="font-mono text-gray-200">18AFXPH9838M1Z9</span></p>
              <p>Location: Hailakandi / Karimganj, Assam - 788710</p>
            </div>

            <div>
              <p className="text-gray-300 font-bold mb-1">Partner Desk &amp; Settlement Channels</p>
              <p>Partner Helpline: <a href="tel:+919395065587" className="text-gray-200 hover:underline">+91 9395065587</a></p>
              <p>UPI VPA: <span className="font-mono text-gray-200">orderking@ybl</span> / <span className="font-mono text-gray-200">9395065587@ybl</span></p>
              <p>Email: <a href="mailto:partner-support@orderkingpay.com" className="text-gray-200 hover:underline">partner-support@orderkingpay.com</a></p>
            </div>

            <div>
              <p className="text-gray-300 font-bold mb-1">Statutory Tax &amp; Regulatory Desk</p>
              <p>Section 9(5) CGST Act, 2017 (SAC 996331)</p>
              <p>Section 52 CGST TCS (1.0%) • Section 194-O TDS</p>
              <p>FSSAI Food Safety &amp; Standards Act, 2006</p>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-4">
            <p>© {new Date().getFullYear()} Orderkingpay (GSTIN: 18AFXPH9838M1Z9). All rights reserved.</p>
            <div className="flex gap-4">
              <Link to="/login" className="hover:text-gray-300 transition-colors">Partner Sign In</Link>
              <Link to="/onboarding" className="hover:text-gray-300 transition-colors">Merchant Onboarding</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
