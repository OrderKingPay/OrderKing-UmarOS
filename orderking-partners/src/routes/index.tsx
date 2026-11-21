import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { authClient, setPhoneSession, getPhoneSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OrderKingMark } from "@/components/mark";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useMerchantBranding } from "@orderking/ui";
import { platformConfig } from "@/lib/platform-config";
import { cn } from "@/lib/utils";
import {
  sendPartnerOtpFn,
  verifyPartnerOtpFn,
  sanitizeIndianPhone,
  isValidIndianPhone,
} from "@/lib/server/sms-gateway";
import { ORDERKING_ONBOARDING_DRAFT_KEY } from "@/routes/onboarding";
import {
  Store,
  FileCheck2,
  Banknote,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  RefreshCw,
  UtensilsCrossed,
  Printer,
  FileText,
  HelpCircle,
  ChevronDown,
  LogIn,
  UserPlus,
} from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context?.sessionUser) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: PartnerLandingPage,
});

export function PartnerLandingPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const branding = useMerchantBranding();

  // If already authenticated via client-side phone session, seamlessly route to dashboard
  useEffect(() => {
    if (typeof window !== "undefined") {
      const s = getPhoneSession();
      if (s?.user?.id || user?.id) {
        window.location.replace("/dashboard");
      }
    }
  }, [user]);

  const [mode, setMode] = useState<"up" | "in">("up");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [mobileNumber, setMobileNumber] = useState("");
  const [name, setName] = useState("");
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
      const credential = verifyRes.credential;
      const partnerDisplayName = name.trim() || `Partner ${cleanPhone.slice(-4)}`;

      setPhoneSession({
        id: "prt_" + cleanPhone,
        phone: cleanPhone,
        email,
        name: partnerDisplayName,
        role: "partner",
      });

      if (verifyRes.isNewUser || mode === "up") {
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

        const signUpRes = await authClient.signUp.email({
          email,
          password: credential,
          name: partnerDisplayName,
        });

        if (signUpRes.error) {
          await authClient.signIn.email({
            email,
            password: credential,
          });
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
      setError(err instanceof Error ? err.message : "Verification failed. Please check the code.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans flex flex-col justify-between selection:bg-red-500 selection:text-white">
      {/* 1. Header (Zomato for Business Parity) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <OrderKingMark className="size-9 transition-transform group-hover:scale-105" />
            <div>
              <div className="font-display text-xl font-black tracking-tight text-gray-900 flex items-center gap-1.5">
                <span>OrderKing</span>
                <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E23744]">
                  Partner
                </span>
              </div>
              <div className="text-[11px] text-gray-500 font-medium leading-none">
                Restaurant Partner Network
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setMode("in");
                setOtpStep("phone");
                setError(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-xs font-bold text-gray-700 hover:text-[#E23744] transition-colors px-3 py-2"
            >
              Partner Sign In
            </button>
            <Button
              type="button"
              onClick={() => {
                setMode("up");
                setOtpStep("phone");
                setError(null);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="bg-[#E23744] hover:bg-[#d32f2f] text-white text-xs font-bold h-9 px-4 rounded-xl shadow-xs"
            >
              Register Restaurant
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section: Registration & Onboarding Gateway */}
      <section className="relative overflow-hidden bg-white border-b border-gray-200 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3.5 py-1 text-xs font-bold text-[#E23744]">
                <Store className="size-3.5" />
                <span>Zero Commission on Dine-In Orders</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-[1.15]">
                Partner with OrderKing and grow your restaurant business
              </h1>

              <p className="text-sm sm:text-base text-gray-600 max-w-2xl leading-relaxed">
                Connect your kitchen to thousands of hungry foodies in your locality. Enjoy 0% commission on dine-in table QR orders, dedicated delivery fleet, and automated daily T+1 bank payouts.
              </p>

              {/* 3 Value Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                  <div className="text-xs font-bold text-[#E23744] uppercase tracking-wider">0% Take-Rate</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">Dine-In QR Orders</div>
                  <div className="text-[11px] text-gray-500 mt-1">Zero platform fee on table reservations.</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Daily Payouts</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">T+1 Bank Transfers</div>
                  <div className="text-[11px] text-gray-500 mt-1">Direct IMPS/NEFT to your verified account.</div>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Tax Compliant</div>
                  <div className="text-sm font-bold text-gray-900 mt-0.5">Section 9(5) CGST</div>
                  <div className="text-[11px] text-gray-500 mt-1">Platform remits 5% GST on food orders.</div>
                </div>
              </div>
            </div>

            {/* Right Column: Real 1-Tap OTP Registration Box */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xl">
                {/* Segmented Switcher */}
                <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 border border-gray-200 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("up");
                      setOtpStep("phone");
                      setError(null);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all",
                      mode === "up" ? "bg-[#E23744] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <UserPlus className="size-3.5" />
                    <span>Register Restaurant</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("in");
                      setOtpStep("phone");
                      setError(null);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all",
                      mode === "in" ? "bg-[#E23744] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <LogIn className="size-3.5" />
                    <span>Partner Sign In</span>
                  </button>
                </div>

                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    {mode === "up" ? "Register Your Kitchen" : "Access Partner Portal"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {mode === "up"
                      ? "Enter your mobile number to begin self-serve restaurant onboarding."
                      : "Enter your registered mobile number to manage orders & payouts."}
                  </p>
                </div>

                {otpStep === "phone" ? (
                  <div className="space-y-4">
                    {mode === "up" && (
                      <div>
                        <Label htmlFor="reg-owner" className="text-xs font-semibold text-gray-700">
                          Owner / Manager Full Name *
                        </Label>
                        <Input
                          id="reg-owner"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full name as on PAN card"
                          className="mt-1 border-gray-300 bg-white text-gray-900 h-11 focus:border-[#E23744]"
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
                          value={mobileNumber}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setMobileNumber(val.startsWith("91") && val.length > 10 ? val.slice(2, 12) : val.slice(0, 10));
                          }}
                          placeholder="Enter 10-digit mobile"
                          className="pl-12 border-gray-300 bg-white text-gray-900 h-11 font-mono text-sm focus:border-[#E23744]"
                        />
                      </div>
                      <p className="mt-1 text-[11px] text-gray-500">
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
                      className="w-full h-12 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-500/20 text-sm cursor-pointer"
                    >
                      {working ? <RefreshCw className="size-4 animate-spin" /> : <Phone className="size-4" />}
                      <span>{mode === "up" ? "Continue to Onboarding" : "Send Login Code"}</span>
                    </Button>
                  </div>
                ) : (
                  /* Step 2: OTP Verification */
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 flex items-center justify-between">
                      <div>
                        <div className="text-[11px] text-gray-500">Verifying mobile:</div>
                        <div className="text-sm font-bold text-gray-900 font-mono">+91 {cleanPhone}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep("phone");
                          setError(null);
                          setOtpCode("");
                        }}
                        className="text-xs font-bold text-[#E23744] hover:underline"
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
                        value={otpCode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setOtpCode(val);
                          if (val.length === 6) {
                            void handleVerifyOtp(val);
                          }
                        }}
                        placeholder="••••••"
                        className="mt-1 text-center font-mono text-lg tracking-widest border-gray-300 bg-white text-gray-900 h-12 focus:border-[#E23744]"
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
                      className="w-full h-12 bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-md shadow-red-500/20 text-sm cursor-pointer"
                    >
                      {working ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-5" />}
                      <span>{mode === "up" ? "Verify & Open Onboarding" : "Verify & Open Dashboard"}</span>
                    </Button>

                    <div className="pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100">
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => void handleSendOtp("whatsapp")}
                        className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                      >
                        <MessageCircle className="size-3.5" />
                        <span>Send on WhatsApp</span>
                      </button>

                      {canResend ? (
                        <button
                          type="button"
                          onClick={() => void handleSendOtp("sms")}
                          className="font-bold text-[#E23744] hover:underline"
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

      {/* 3. Checklist of Required Documents (Zomato Parity) */}
      <section className="py-12 bg-[#F8F9FA] border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div>
            <h2 className="font-display text-2xl font-black text-gray-900 tracking-tight">
              Keep these documents ready for restaurant onboarding
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Having these official proofs on hand ensures instant verification and fast go-live within 24 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-2.5 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-[#E23744] border border-red-200">
                <FileCheck2 className="size-5" />
              </div>
              <div className="font-bold text-sm text-gray-900">1. 14-Digit FSSAI License</div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Mandatory Food Safety license / registration certificate from FoSCoS. Trade name must match outlet address.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-2.5 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                <FileText className="size-5" />
              </div>
              <div className="font-bold text-sm text-gray-900">2. PAN Card</div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Proprietor PAN or Business Entity PAN copy. Name on PAN will be verified against the settlement bank account.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-2.5 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                <Banknote className="size-5" />
              </div>
              <div className="font-bold text-sm text-gray-900">3. Settlement Bank Account</div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Bank account number and IFSC code (Current or Savings). Cancelled cheque or passbook copy for daily payout routing.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-2.5 shadow-xs">
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                <UtensilsCrossed className="size-5" />
              </div>
              <div className="font-bold text-sm text-gray-900">4. Restaurant Menu &amp; GST</div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Digital or photo copy of your menu. GSTIN is optional for turnover &lt; ₹20L (platform remits Section 9(5) CGST).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The 3 Onboarding Steps (Exact Zomato Procedure) */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Simple 3-step restaurant onboarding procedure
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              Complete these three procedural steps to get your restaurant verified, listed, and live on OrderKing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-gray-200 bg-gray-50/70 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#E23744] text-white font-mono font-bold text-xs">
                  1
                </span>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Step 1</span>
              </div>
              <h3 className="font-bold text-base text-gray-900">Restaurant Information &amp; Location</h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                <li>Restaurant trade name and customer display name.</li>
                <li>Complete street address, city, pincode, and landmark.</li>
                <li>Kitchen GPS map coordinates lock for delivery rider dispatch.</li>
                <li>Cuisines, meal categories (Veg / Non-Veg), and operational hours.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50/70 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#E23744] text-white font-mono font-bold text-xs">
                  2
                </span>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Step 2</span>
              </div>
              <h3 className="font-bold text-base text-gray-900">Legal Documents &amp; Tax Compliance</h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                <li>14-digit FSSAI Food Safety license number with FoSCoS link.</li>
                <li>FSSAI certificate validity date &amp; optional document upload.</li>
                <li>10-character PAN card number and legal entity name.</li>
                <li>GSTIN entry or automatic turnover &lt; ₹20L exemption toggle.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gray-50/70 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#E23744] text-white font-mono font-bold text-xs">
                  3
                </span>
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Step 3</span>
              </div>
              <h3 className="font-bold text-base text-gray-900">Bank Details &amp; Partner Agreement</h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                <li>Bank account number and 11-character IFSC code verification.</li>
                <li>Account type (Current / Savings) matching PAN legal name.</li>
                <li>0% dine-in commission &amp; transparent delivery take-rate schedule.</li>
                <li>Section 9(5) CGST statutory covenant acceptance and live activation.</li>
              </ul>
            </div>
          </div>

          <div className="text-center pt-2">
            <Button
              type="button"
              onClick={() => {
                setMode("up");
                setOtpStep("phone");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold h-12 px-8 rounded-xl shadow-md shadow-red-500/20 text-sm cursor-pointer"
            >
              Start Restaurant Registration <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Authentic Commercial FAQs */}
      <section className="py-12 bg-[#F8F9FA] border-b border-gray-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="font-display text-2xl font-black text-gray-900 tracking-tight">
              Frequently asked partner questions
            </h2>
            <p className="text-xs text-gray-500">
              Clear, transparent answers on payouts, commission, and restaurant verification.
            </p>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-1">
              <div className="text-sm font-bold text-gray-900">Do I need a GSTIN to list my restaurant?</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                No. If your annual turnover is under ₹20 Lakhs, GST registration is not mandatory. Under Section 9(5) of the CGST Act, OrderKing collects and directly remits the 5% restaurant GST to the government under GSTIN 18AFXPH9838M1Z9.
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-1">
              <div className="text-sm font-bold text-gray-900">What is the platform commission rate?</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                Dine-in table QR orders carry strictly 0% platform commission. Online delivery orders follow the agreed transparent schedule (18.0% to 28.0% + 18% GST) with full breakdown on every order ticket.
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-1">
              <div className="text-sm font-bold text-gray-900">When and how do I receive my order payouts?</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                Payouts are transferred automatically on a daily T+1 schedule directly into your verified settlement bank account via IMPS or NEFT. You can download complete itemized GSTR-1 settlement ledgers directly from your dashboard.
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-1">
              <div className="text-sm font-bold text-gray-900">What hardware or printer is required?</div>
              <div className="text-xs text-gray-600 leading-relaxed">
                No proprietary hardware is required. You can manage orders on any mobile, tablet, or laptop. Our platform natively integrates with standard ESC/POS Bluetooth and USB thermal receipt printers for automated Kitchen Order Ticket (KOT) printing.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Statutory Footer */}
      <footer className="bg-white py-8 border-t border-gray-200 text-xs text-gray-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <OrderKingMark className="size-6" />
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
