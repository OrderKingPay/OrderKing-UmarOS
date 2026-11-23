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
        </div>
      </header>

      {/* 2. Focused Center Card: Native Phone OTP Access */}
      <main className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xl">
            <div className="mb-6 text-center">
              <OrderKingMark className="size-12 mx-auto text-[#E23744] mb-3" />
              <h1 className="font-display text-2xl font-black text-gray-900">
                Partner with OrderKing
              </h1>
              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                Enter your mobile number to access your restaurant partner dashboard or register a new outlet.
              </p>
            </div>

            {otpStep === "phone" ? (
              <div className="space-y-4">
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
                  <span>Verify & Continue</span>
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
      </main>

      {/* 3. Statutory Compliance Footer */}
      <footer className="bg-white py-4 border-t border-gray-200 text-xs text-gray-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <OrderKingMark className="size-4 text-[#E23744]" />
            <span className="font-semibold text-gray-800">OrderKing Restaurant Partner Portal</span>
          </div>
          <div className="text-[11px] text-gray-400">
            Order King Foods Private Limited • GSTIN: 18AFXPH9838M1Z9 • Assam - 788710
          </div>
        </div>
      </footer>
    </div>
  );
}
