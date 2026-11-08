import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { authClient, setPhoneSession, getPhoneSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OrderKingMark } from "@/components/mark";
import { useT } from "@/components/use-t";
import { platformConfig } from "@/lib/platform-config";
import { useMerchantBranding } from "@orderking/ui";
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
  ArrowRight,
  Phone,
  Mail,
  Globe,
  LogIn,
  UserPlus,
  Lock,
  CheckCircle2,
  KeyRound,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

function resolveIdentifierToEmail(rawInput: string): { email: string; isMobile: boolean; valid: boolean } {
  const trimmed = rawInput.trim();
  if (trimmed.includes("@")) {
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    return { email: trimmed.toLowerCase(), isMobile: false, valid: emailValid };
  }
  const digitsOnly = trimmed.replace(/\D/g, "");
  const normalizedMobile =
    digitsOnly.length === 12 && digitsOnly.startsWith("91") ? digitsOnly.slice(2) : digitsOnly;
  const mobileValid = /^[6-9]\d{9}$/.test(normalizedMobile);
  return {
    email: `${normalizedMobile}@partner.orderking.in`,
    isMobile: true,
    valid: mobileValid,
  };
}

function Login() {
  const t = useT();
  const branding = useMerchantBranding();

  const [mode, setMode] = useState<"in" | "up">(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("mode");
      if (q === "up") return "up";
    }
    return "in";
  });

  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");

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
  const [, setWhatsAppUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [, setProviderNotice] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
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
    setOtpStep("phone");
    setOtpCode("");
  }

  async function handleSendOtp(channel: "sms" | "whatsapp" = "sms") {
    if (!isPhoneValid) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
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
      if (res.providerNotice) setProviderNotice(res.providerNotice);

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
        const partnerName = name.trim() || `Partner ${cleanPhone.slice(-4)}`;
        const signUpRes = await authClient.signUp.email({
          email,
          password: credential,
          name: partnerName,
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

  async function onSubmitPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const resolved = resolveIdentifierToEmail(identifier);
    if (!resolved.valid) {
      setError(
        "Please enter a valid 10-digit Indian mobile number (starting with 6–9) or a valid business email address.",
      );
      return;
    }

    setWorking(true);
    try {
      if (mode === "up") {
        const defaultName =
          name.trim() ||
          (resolved.isMobile ? `Partner ${identifier.trim().slice(-4)}` : resolved.email.split("@")[0]);
        const res = await authClient.signUp.email({
          email: resolved.email,
          password,
          name: defaultName,
        });
        if (res.error) throw new Error(res.error.message || t("auth.error"));
        window.location.assign("/onboarding");
      } else {
        const res = await authClient.signIn.email({
          email: resolved.email,
          password,
        });
        if (res.error) throw new Error(res.error.message || t("auth.error"));
        window.location.assign("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.error"));
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
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all duration-150",
                mode === "in"
                  ? "bg-[#E23744] text-white shadow-sm"
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
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all duration-150",
                mode === "up"
                  ? "bg-[#E23744] text-white shadow-sm"
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

          {/* Auth Method Selector */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setAuthMethod("otp");
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5",
                  authMethod === "otp"
                    ? "bg-red-50 text-[#E23744] border border-red-200"
                    : "text-gray-500 hover:text-gray-800",
                )}
              >
                <Phone className="size-3" />
                <span>Mobile OTP</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setAuthMethod("password");
                }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5",
                  authMethod === "password"
                    ? "bg-red-50 text-[#E23744] border border-red-200"
                    : "text-gray-500 hover:text-gray-800",
                )}
              >
                <KeyRound className="size-3" />
                <span>Password</span>
              </button>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">Merchant Access</span>
          </div>

          {/* Method 1: 1-Tap OTP Flow */}
          {authMethod === "otp" ? (
            <div className="space-y-4">
              {otpStep === "phone" ? (
                <>
                  {mode === "up" ? (
                    <div>
                      <Label htmlFor="owner-name" className="text-xs font-semibold text-gray-700">
                        Owner / Manager Full Name
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="owner-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <Label htmlFor="mobile-input" className="flex items-center justify-between text-xs font-semibold text-gray-700">
                      <span>Mobile Number</span>
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
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210"
                        className="pl-12 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11 font-mono tracking-wider text-sm"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">
                      We will send an OTP verification code.
                    </p>
                  </div>

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
                      className="h-12 w-full bg-[#E23744] font-bold text-white shadow-md shadow-red-500/20 hover:bg-[#d32f2f] text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {working ? (
                        <RefreshCw className="size-4 animate-spin" />
                      ) : (
                        <Phone className="size-4" />
                      )}
                      <span>Send code by SMS</span>
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
                        setProviderNotice(null);
                      }}
                      className="text-xs font-bold text-[#E23744] hover:underline"
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

                  {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                      {error}
                    </div>
                  ) : null}

                  <Button
                    type="button"
                    disabled={working || otpCode.length !== 6}
                    onClick={() => void handleVerifyOtp()}
                    className="h-12 w-full bg-[#E23744] font-bold text-white shadow-md shadow-red-500/20 hover:bg-[#d32f2f] text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {working ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-5" />}
                    <span>Verify &amp; Continue</span>
                  </Button>

                  <div className="pt-2 flex flex-col gap-2 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Didn&apos;t receive the SMS code?</span>
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
                </div>
              )}
            </div>
          ) : (
            /* Method 2: Password Sign In Flow */
            <form className="space-y-4" onSubmit={onSubmitPassword}>
              {mode === "up" ? (
                <div>
                  <Label htmlFor="name" className="text-xs font-semibold text-gray-700">
                    Owner / Manager Full Name
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      placeholder="e.g. Rajeshwari Iyer"
                      className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11"
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <Label htmlFor="identifier" className="flex items-center justify-between text-xs font-semibold text-gray-700">
                  <span>10-Digit Mobile or Business Email</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                    <Phone className="size-3" /> / <Mail className="size-3" />
                  </span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                    placeholder="9876543210 or owner@restaurant.com"
                    className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] h-11"
                  />
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  Indian 10-digit mobile number (starts with 6–9) or registered restaurant email.
                </p>
              </div>

              <div>
                <Label htmlFor="password" className="flex items-center justify-between text-xs font-semibold text-gray-700">
                  <span>{t("auth.password")}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                    <Lock className="size-3" /> Minimum 8 characters
                  </span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "up" ? "new-password" : "current-password"}
                    placeholder="••••••••"
                    className="border-gray-300 bg-white text-gray-900 focus:border-[#E23744] h-11"
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                className="h-12 w-full bg-[#E23744] font-bold text-white shadow-md shadow-red-500/20 hover:bg-[#d32f2f] text-sm rounded-xl transition-all"
                size="lg"
                disabled={working}
              >
                {working
                  ? t("auth.working")
                  : mode === "in"
                    ? "Sign In to Partner Portal"
                    : "Begin Partner Onboarding"}
              </Button>
            </form>
          )}

          {/* Bottom Switch Link */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#E23744] transition-colors"
              onClick={() => handleSwitchMode(mode === "in" ? "up" : "in")}
            >
              <span>
                {mode === "in"
                  ? "New to OrderKing? Join our restaurant network"
                  : "Already registered? Sign in to your portal"}
              </span>
              <ArrowRight className="size-3 text-[#E23744]" />
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
