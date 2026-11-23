import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { setPhoneSession, getPhoneSession } from "@/lib/auth/client";
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
  ShieldCheck,
  Phone,
  MessageCircle,
  RefreshCw,
  LogIn,
  UserPlus,
  Store,
  FileCheck2,
  Banknote,
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("in");
                setOtpStep("phone");
                setError(null);
              }}
              className={cn(
                "text-xs font-bold px-3 py-2 rounded-lg transition-colors cursor-pointer",
                mode === "in" ? "text-[#E23744] bg-red-50" : "text-gray-700 hover:text-gray-900"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("up");
                setOtpStep("phone");
                setError(null);
              }}
              className={cn(
                "text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer",
                mode === "up" ? "bg-[#E23744] text-white shadow-xs" : "text-gray-700 hover:bg-gray-100"
              )}
            >
              Register Restaurant
            </button>
          </div>
        </div>
      </header>

      {/* 2. Focused Center Card: OTP Signup & Login */}
      <main className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6">
        <div className="w-full max-w-md space-y-6">
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
                  "flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer",
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
                  "flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer",
                  mode === "in" ? "bg-[#E23744] text-white shadow-xs" : "text-gray-600 hover:text-gray-900"
                )}
              >
                <LogIn className="size-3.5" />
                <span>Partner Sign In</span>
              </button>
            </div>

            <div className="mb-4">
              <h1 className="font-display text-xl sm:text-2xl font-black text-gray-900">
                {mode === "up" ? "Register Your Restaurant" : "Partner Sign In"}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {mode === "up"
                  ? "Enter your mobile number to begin step-by-step restaurant onboarding."
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

          {/* Statutory Badges */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-white border border-gray-200 shadow-xs">
              <div className="text-[10px] font-bold text-gray-500 uppercase">Food Safety</div>
              <div className="text-xs font-bold text-gray-900 mt-0.5">14-Digit FSSAI</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-gray-200 shadow-xs">
              <div className="text-[10px] font-bold text-gray-500 uppercase">Tax Remittance</div>
              <div className="text-xs font-bold text-gray-900 mt-0.5">Section 9(5) CGST</div>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-gray-200 shadow-xs">
              <div className="text-[10px] font-bold text-gray-500 uppercase">Settlements</div>
              <div className="text-xs font-bold text-emerald-700 mt-0.5">Daily T+1 Payouts</div>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Clean Statutory Footer */}
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
