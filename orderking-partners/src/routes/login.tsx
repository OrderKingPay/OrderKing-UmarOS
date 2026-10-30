import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo, type FormEvent } from "react";
import { authClient, setPhoneSession } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OrderKingMark } from "@/components/mark";
import { useT } from "@/components/use-t";
import { platformConfig } from "@/lib/platform-config";
import { useMerchantBranding, useCommissionTokens } from "@orderking/ui";
import { cn } from "@/lib/utils";
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
  Globe,
  LogIn,
  UserPlus,
  Lock,
  Sparkles,
  CheckCircle2,
  KeyRound,
  MessageCircle,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

/**
 * Resolves either a 10-digit Indian mobile number (+91 optional) or a standard email address
 * into a canonical authentication email identifier for Better-Auth.
 */
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
  const commissionTokens = useCommissionTokens();
  const { user } = useCurrentUserState();

  const [mode, setMode] = useState<"in" | "up">(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("mode");
      if (q === "up") return "up";
    }
    return "in";
  });

  // Auth method: 1-Tap OTP (Fast2SMS / Firebase / WhatsApp) vs Password
  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");

  // OTP State
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [providerNotice, setProviderNotice] = useState<string | null>(null);

  // Password State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Shared State
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const cleanPhone = useMemo(() => sanitizeIndianPhone(mobileNumber), [mobileNumber]);
  const isPhoneValid = isValidIndianPhone(cleanPhone);

  // WebOTP API for 1-tap SMS autofill on mobile devices
  useEffect(() => {
    if (otpStep !== "code") return;
    if (typeof window === "undefined" || !("OTPCredential" in window)) return;

    const ac = new AbortController();
    (navigator.credentials as any)
      ?.get({
        otp: { transport: ["sms"] },
        signal: ac.signal,
      })
      .then((otpCredential: any) => {
        if (otpCredential?.code) {
          const autoCode = String(otpCredential.code).replace(/\D/g, "").slice(0, 6);
          if (autoCode.length === 6) {
            setOtpCode(autoCode);
            void handleVerifyOtp(autoCode);
          }
        }
      })
      .catch(() => {});

    return () => {
      ac.abort();
    };
  }, [otpStep]);

  // 30-second OTP countdown timer
  useEffect(() => {
    if (otpStep !== "code") return;
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpStep, countdown]);

  if (user) return <Navigate to="/dashboard" />;

  function handleSwitchMode(targetMode: "in" | "up") {
    setError(null);
    setMode(targetMode);
    if (typeof window !== "undefined") {
      const url = targetMode === "up" ? "/login?mode=up" : "/login";
      window.history.replaceState(null, "", url);
    }
  }

  // Send OTP via Firebase Phone Auth or Fast2SMS Smart OTP fallback
  async function handleSendOtp(channel: "sms" | "whatsapp" = "sms") {
    if (!isPhoneValid) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    setWorking(true);
    setError(null);

    try {
      // Direct server dispatch via Fast2SMS Quick Route "q" or Meta WhatsApp API
      const res = await sendPartnerOtpFn({
        data: { phone: cleanPhone, channel },
      });
      setWhatsAppUrl(res.whatsAppOtpUrl || null);
      if ((res as any)?.debugOtp) {
        setOtpCode(String((res as any).debugOtp));
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

  // Verify OTP and sign in / register partner
  async function handleVerifyOtp(codeToVerify?: string) {
    const code = (codeToVerify || otpCode).replace(/\D/g, "").trim();
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setWorking(true);
    setError(null);

    try {
      // Validate OTP with server store and synchronize Better-Auth credentials
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

      // 3. Fault-tolerant Better-Auth sync (never blocks verified phone session)
      try {
        if (verifyRes.isNewUser || mode === "up") {
          const partnerName = name.trim() || `Partner ${cleanPhone.slice(-4)}`;
          const signUpRes = await authClient.signUp.email({
            email,
            password: credential,
            name: partnerName,
          });
          if (signUpRes?.error) {
            await authClient.signIn.email({ email, password: credential }).catch(() => {});
          }
          window.location.assign("/onboarding");
          return;
        } else {
          const signInRes = await authClient.signIn.email({
            email,
            password: credential,
          });
          if (signInRes?.error) {
            await authClient.signUp.email({
              email,
              password: credential,
              name: `Partner ${cleanPhone.slice(-4)}`,
            }).catch(() => {});
          }
          window.location.assign("/dashboard");
          return;
        }
      } catch (syncErr) {
        console.warn("[Partner Auth] Proceeding with verified edge phone session:", syncErr);
        window.location.assign(verifyRes.isNewUser || mode === "up" ? "/onboarding" : "/dashboard");
        return;
      }
      if (false) {window.location.assign("/dashboard");
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Verification failed. Please check the code.");
    } finally {
      setWorking(false);
    }
  }

  // Password submission handler
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
    <main className="min-h-dvh bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 px-4 py-8 sm:py-12 text-slate-100 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-md space-y-6">
        {/* Brand Header */}
        <Link to="/" className="flex items-center justify-center gap-3 text-white group">
          <OrderKingMark className="size-10 text-chili transition-transform duration-200 group-hover:scale-105" />
          <div>
            <div className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>{branding.appName || platformConfig.brand.appName}</span>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                PORTAL
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Kitchen Command &amp; Direct Bank Settlements
            </div>
          </div>
        </Link>

        {/* Commercial Status Strip */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3.5 py-2.5 shadow-sm text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-300">
            <ShieldCheck className="size-3.5 text-emerald-400 shrink-0" />
            <span>
              Orderkingpay Merchant Platform · GSTIN 18AFXPH9838M1Z9 · T+1 Direct Payouts
            </span>
          </div>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-7 shadow-2xl backdrop-blur-md">
          {/* Segmented Mode Switcher (Sign In vs Register) */}
          <div className="grid grid-cols-2 rounded-xl bg-slate-950/90 p-1 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => handleSwitchMode("in")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all duration-150",
                mode === "in"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50",
              )}
            >
              <LogIn className="size-3.5" />
              <span>Partner Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("up")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all duration-150",
                mode === "up"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50",
              )}
            >
              <UserPlus className="size-3.5" />
              <span>Register Restaurant</span>
            </button>
          </div>

          {/* Heading */}
          <div className="pb-4">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-white">
              {mode === "in" ? "Welcome Back to Your Kitchen" : `Partner With ${branding.shortAppName || branding.appName || "Order King"}`}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              {mode === "in"
                ? "Enter your 10-digit mobile number or business email to access live dining, orders, and settlements."
                : "Join India's premier culinary collective. Simple paperless setup, dedicated partner support, and 24-hour express go-live."}
            </p>
          </div>

          {/* Auth Method Selector (1-Tap OTP vs Password) */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
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
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                <Phone className="size-3" />
                <span>1-Tap Mobile OTP</span>
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
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "text-slate-400 hover:text-slate-200",
                )}
              >
                <KeyRound className="size-3" />
                <span>Password</span>
              </button>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Active Merchant Access</span>
          </div>

          {/* Method 1: 1-Tap OTP Flow (Firebase + Fast2SMS Smart OTP + WhatsApp Zero-Lockout) */}
          {authMethod === "otp" ? (
            <div className="space-y-4">
              {otpStep === "phone" ? (
                <>
                  {mode === "up" ? (
                    <div>
                      <Label htmlFor="owner-name" className="text-xs text-slate-300">
                        Restaurateur / Owner Full Name
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="owner-name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Chef Rajeshwari Iyer"
                          className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 h-11"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <Label htmlFor="mobile-input" className="flex items-center justify-between text-xs text-slate-300">
                      <span>Indian 10-Digit Mobile Number</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                        <Phone className="size-3" /> Jio / Airtel / Vi / BSNL
                      </span>
                    </Label>
                    <div className="relative mt-1 flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-slate-400">+91</span>
                      <Input
                        id="mobile-input"
                        type="tel"
                        maxLength={10}
                        required
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210"
                        className="pl-12 border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 h-11 font-mono tracking-wider text-sm"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      We will send an authentic 6-digit carrier SMS verification code.
                    </p>
                  </div>

                  {error ? (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-300">
                      {error}
                    </div>
                  ) : null}

                  <div className="space-y-2 pt-1">
                    <Button
                      type="button"
                      disabled={working || !isPhoneValid}
                      onClick={() => void handleSendOtp("sms")}
                      className="h-12 w-full bg-emerald-600 font-semibold text-white shadow-lg shadow-emerald-950 hover:bg-emerald-500 text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      {working ? (
                        <RefreshCw className="size-4 animate-spin" />
                      ) : (
                        <Phone className="size-4" />
                      )}
                      <span>Send Verification Code (SMS)</span>
                    </Button>

                    {/* Zero-Lockout 1-Tap WhatsApp Fallback */}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={working || !isPhoneValid}
                      onClick={() => void handleSendOtp("whatsapp")}
                      className="h-11 w-full border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <MessageCircle className="size-4 text-emerald-400" />
                      <span>Instant Sign In via WhatsApp OTP</span>
                    </Button>
                  </div>
                </>
              ) : (
                /* Step 2: Code Verification */
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400">Verifying mobile number:</div>
                      <div className="text-sm font-bold text-slate-100 font-mono tracking-wider">
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
                      className="text-xs font-semibold text-emerald-400 hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <div>
                    <Label htmlFor="otp-input" className="text-xs text-slate-300">
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
                        className="text-center tracking-widest text-lg font-mono border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 h-12"
                      />
                    </div>
                  </div>

                  {error ? (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-300">
                      {error}
                    </div>
                  ) : null}

                  <Button
                    type="button"
                    disabled={working || otpCode.length !== 6}
                    onClick={() => void handleVerifyOtp()}
                    className="h-12 w-full bg-emerald-600 font-semibold text-white shadow-lg shadow-emerald-950 hover:bg-emerald-500 text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    {working ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    <span>Verify &amp; Launch Kitchen</span>
                  </Button>

                  {/* Resend Actions & WhatsApp Link */}
                  <div className="pt-2 flex flex-col gap-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Didn't receive the SMS code?</span>
                      {canResend ? (
                        <button
                          type="button"
                          onClick={() => void handleSendOtp("sms")}
                          className="font-bold text-emerald-400 hover:underline"
                        >
                          Resend SMS
                        </button>
                      ) : (
                        <span className="font-mono text-slate-500">Resend in {countdown}s</span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={working || !canResend}
                      onClick={() => void handleSendOtp("whatsapp")}
                      className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/50 disabled:opacity-50 text-xs font-semibold transition"
                    >
                      <MessageCircle className="size-3.5 text-emerald-400" />
                      <span>{canResend ? "Deliver OTP to WhatsApp" : `Resend WhatsApp in ${countdown}s`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Method 2: Password Sign In Flow */
            <form className="space-y-4" onSubmit={onSubmitPassword}>
              {mode === "up" ? (
                <div>
                  <Label htmlFor="name" className="text-xs text-slate-300">
                    Restaurateur or Owner Full Name
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      placeholder="e.g. Chef Rajeshwari Iyer"
                      className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 h-11"
                    />
                  </div>
                </div>
              ) : null}

              <div>
                <Label htmlFor="identifier" className="flex items-center justify-between text-xs text-slate-300">
                  <span>10-Digit Mobile or Business Email</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
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
                    placeholder="9876543210 or chef@restaurant.in"
                    className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 h-11"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Indian 10-digit mobile number (starts with 6–9) or registered restaurant email.
                </p>
              </div>

              <div>
                <Label htmlFor="password" className="flex items-center justify-between text-xs text-slate-300">
                  <span>{t("auth.password")}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
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
                    className="border-slate-800 bg-slate-950 text-slate-100 focus:border-emerald-500 h-11"
                  />
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-300">
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                className="h-12 w-full bg-emerald-600 font-semibold text-white shadow-lg shadow-emerald-950 hover:bg-emerald-500 text-sm rounded-xl transition-all"
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
          <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              onClick={() => handleSwitchMode(mode === "in" ? "up" : "in")}
            >
              <span>
                {mode === "in"
                  ? `New to ${branding.shortAppName || branding.appName || "Order King"}? Join our restaurant network`
                  : `Already registered with ${branding.shortAppName || branding.appName || "Order King"}? Sign in to your portal`}
              </span>
              <ArrowRight className="size-3 text-emerald-400" />
            </button>
          </div>
        </div>


        {/* Key Partner Highlights */}
        <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <CheckCircle2 className="size-3.5 text-emerald-400" />
              <span>Direct Daily Settlements</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-snug">
              Automated daily payouts directly to your bank account with complete transparency.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <Globe className="size-3.5 text-emerald-400" />
              <span>23 Indian Languages &amp; Audio</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 leading-snug">
              Full vernacular kitchen controls with real-time King AI and Soundbox order chimes.
            </p>
          </div>
        </div>

        {/* Security & Hospitality Guarantee */}
        <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          <span>Bank-Grade 256-Bit Encryption • FSSAI Food Safety Partner • Zero Hidden Platform Fees</span>
        </div>
      </div>
    </main>
  );
}
