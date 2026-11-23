import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { setPhoneSession, getPhoneSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OrderKingMark } from "@/components/mark";
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
} from "lucide-react";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { mode?: "in" | "up"; phone?: string; name?: string } => ({
    mode: search.mode === "up" ? "up" : "in",
    phone: typeof search.phone === "string" ? search.phone : undefined,
    name: typeof search.name === "string" ? search.name : undefined,
  }),
  component: Login,
});

function Login() {
  const branding = useMerchantBranding();

  const [mode, setMode] = useState<"in" | "up">(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("mode");
      if (q === "up") return "up";
    }
    return "in";
  });

  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [mobileNumber, setMobileNumber] = useState(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("phone");
      if (p) return p.replace(/\D/g, "").slice(-10);
      try {
        const raw = window.localStorage.getItem(ORDERKING_ONBOARDING_DRAFT_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          if (d.phone) return String(d.phone).replace(/\D/g, "").slice(-10);
        }
      } catch {}
    }
    return "";
  });
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const [name, setName] = useState(() => {
    if (typeof window !== "undefined") {
      const n = new URLSearchParams(window.location.search).get("name");
      if (n) return n.trim();
      try {
        const raw = window.localStorage.getItem(ORDERKING_ONBOARDING_DRAFT_KEY);
        if (raw) {
          const d = JSON.parse(raw);
          if (d.ownerName || d.name) return String(d.ownerName || d.name).trim();
        }
      } catch {}
    }
    return "";
  });

  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const cleanPhone = useMemo(() => sanitizeIndianPhone(mobileNumber), [mobileNumber]);
  const isPhoneValid = isValidIndianPhone(cleanPhone);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const m = q.get("mode");
    if (m === "up" || m === "in") setMode(m);
    const p = q.get("phone");
    if (p) {
      const sanitized = p.replace(/\D/g, "").slice(-10);
      if (sanitized) setMobileNumber(sanitized);
    }
    const n = q.get("name");
    if (n && n.trim()) setName(n.trim());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const s = getPhoneSession();
      if (s?.user?.id) {
        window.location.replace("/dashboard");
      }
    }
  }, []);

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

  useEffect(() => {
    if (otpStep !== "code") return;
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const tId = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(tId);
  }, [otpStep, countdown]);

  function handleSwitchMode(target: "in" | "up") {
    setMode(target);
    setError(null);
    setInfoMsg(null);
    setOtpStep("phone");
    setOtpCode("");
  }

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
    setInfoMsg(null);

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

      if (res?.providerNotice) {
        setInfoMsg(res.providerNotice);
      }

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

      // Verified phone session established — route immediately
      if (mode === "up" || verifyRes.isNewUser) {
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
    <main className="min-h-dvh bg-[#F8F9FA] px-4 py-8 sm:py-12 text-gray-900 flex flex-col justify-center font-sans">
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* Brand Header */}
        <Link to="/" className="flex items-center justify-center gap-3 text-gray-900 group">
          <OrderKingMark className="size-10 text-[#E23744] transition-transform duration-200 group-hover:scale-105" />
          <div>
            <div className="font-display text-2xl font-black tracking-tight flex items-center gap-2">
              <span>{branding.appName || platformConfig.brand.appName}</span>
              <span className="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E23744]">
                Partner
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Restaurant Partner Portal
            </div>
          </div>
        </Link>

        {/* Main Card */}
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-8 shadow-xl">
          {/* Segmented Mode Switcher (Sign In vs Register) */}
          <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1 border border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => handleSwitchMode("in")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all duration-150 cursor-pointer",
                mode === "in"
                  ? "bg-[#E23744] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              <LogIn className="size-3.5" />
              <span>Partner Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("up")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all duration-150 cursor-pointer",
                mode === "up"
                  ? "bg-[#E23744] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900",
              )}
            >
              <UserPlus className="size-3.5" />
              <span>Register Restaurant</span>
            </button>
          </div>

          {/* Heading */}
          <div className="pb-4">
            <h1 className="font-display text-xl sm:text-2xl font-black text-gray-900">
              {mode === "in" ? "Partner Login" : "Partner Registration"}
            </h1>
            <p className="mt-1 text-xs text-gray-500">
              {mode === "in"
                ? "Enter your mobile number to sign in to your restaurant dashboard."
                : "Enter your mobile number to register your restaurant on OrderKing."}
            </p>
          </div>

          {/* 1-Tap OTP Flow */}
          <div className="space-y-4">
            {otpStep === "phone" ? (
              <>
                {mode === "up" ? (
                  <div>
                    <Label htmlFor="owner-name" className="text-xs font-semibold text-gray-700">
                      Owner / Manager Full Name *
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="owner-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name as on PAN card"
                        className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11"
                      />
                    </div>
                  </div>
                ) : null}

                <div>
                  <Label htmlFor="mobile-input" className="flex items-center justify-between text-xs font-semibold text-gray-700">
                    <span>Mobile Number *</span>
                    <span className="text-[11px] text-gray-400 font-normal">
                      10-digit number
                    </span>
                  </Label>
                  <div className="relative mt-1 flex items-center">
                    <span className="absolute left-3 text-xs font-bold text-gray-500">+91</span>
                    <Input
                      id="mobile-input"
                      type="tel"
                      maxLength={10}
                      required
                      value={mobileNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setMobileNumber(val.startsWith("91") && val.length > 10 ? val.slice(2, 12) : val.slice(0, 10));
                      }}
                      placeholder="Enter 10-digit mobile"
                      className="pl-12 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11 font-mono tracking-wider text-sm"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    We will send an OTP verification code.
                  </p>
                </div>

                {infoMsg ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
                    {infoMsg}
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="space-y-2.5 pt-1">
                  <Button
                    type="button"
                    disabled={working || !isPhoneValid}
                    onClick={() => void handleSendOtp("sms")}
                    className="h-12 w-full bg-[#E23744] font-bold text-white shadow-md shadow-red-500/20 hover:bg-[#d32f2f] text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {working ? (
                      <RefreshCw className="size-4 animate-spin" />
                    ) : (
                      <Phone className="size-4" />
                    )}
                    <span>{mode === "up" ? "Continue to Onboarding" : "Send Login Code"}</span>
                  </Button>
                </div>
              </>
            ) : (
              /* Step 2: Code Verification */
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-gray-500">Verifying mobile number:</div>
                    <div className="text-sm font-bold text-gray-900 font-mono tracking-wider">
                      +91 {cleanPhone}
                    </div>
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
                  <Label htmlFor="otp-input" className="text-xs font-semibold text-gray-700">
                    Enter 6-Digit Verification Code
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="otp-input"
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setOtpCode(val);
                        if (val.length === 6) {
                          void handleVerifyOtp(val);
                        }
                      }}
                      placeholder="••••••"
                      className="text-center tracking-widest text-lg font-mono border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-12"
                    />
                  </div>
                </div>

                {infoMsg ? (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
                    {infoMsg}
                  </div>
                ) : null}

                {error ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                    {error}
                  </div>
                ) : null}

                <Button
                  type="button"
                  disabled={working || otpCode.length !== 6}
                  onClick={() => void handleVerifyOtp()}
                  className="h-12 w-full bg-[#E23744] font-bold text-white shadow-md shadow-red-500/20 hover:bg-[#d32f2f] text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
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

          {/* Bottom Switch Link */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <button
              type="button"
              className="text-xs font-semibold text-gray-600 hover:text-[#E23744] transition-colors cursor-pointer"
              onClick={() => handleSwitchMode(mode === "in" ? "up" : "in")}
            >
              {mode === "in"
                ? "New to OrderKing? Register your restaurant →"
                : "Already registered? Sign in to your portal →"}
            </button>
          </div>
        </div>

        {/* Security & Statutory Details */}
        <div className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 text-gray-400" />
          <span>OrderKing Restaurant Partner Portal • GSTIN: 18AFXPH9838M1Z9</span>
        </div>
      </div>
    </main>
  );
}
