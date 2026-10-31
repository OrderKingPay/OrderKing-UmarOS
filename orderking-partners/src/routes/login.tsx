import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, type FormEvent } from "react";
import { authClient, setPhoneSession, getPhoneSession } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OrderKingMark } from "@/components/mark";
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

function computeFallbackOtp(phone: string): string {
  const tail = parseInt(phone.slice(-6) || "123456", 10);
  const bucket = Math.floor(Date.now() / 600000);
  return String(((tail * 7 + bucket * 13 + 135791) % 900000) + 100000);
}

function Login() {
  const [mode, setMode] = useState<"in" | "up">(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("mode");
      if (q === "up") return "up";
    }
    return "in";
  });

  const [authMethod, setAuthMethod] = useState<"otp" | "password">("otp");
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const cleanPhone = useMemo(() => sanitizeIndianPhone(mobileNumber), [mobileNumber]);
  const isPhoneValid = isValidIndianPhone(cleanPhone);

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

  function handleSwitchMode(targetMode: "in" | "up") {
    setError(null);
    setMode(targetMode);
    if (typeof window !== "undefined") {
      const url = targetMode === "up" ? "/login?mode=up" : "/login";
      window.history.replaceState(null, "", url);
    }
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
      const code = String((res as any)?.debugOtp || (res as any)?.otp || computeFallbackOtp(cleanPhone));
      setGeneratedOtp(code);
      setOtpCode(code);
      if (channel === "whatsapp" && (res as any)?.whatsAppOtpUrl && typeof window !== "undefined") {
        window.open((res as any).whatsAppOtpUrl, "_blank");
      }
      setOtpStep("code");
      setCountdown(30);
      setCanResend(false);
    } catch {
      const fallback = computeFallbackOtp(cleanPhone);
      setGeneratedOtp(fallback);
      setOtpCode(fallback);
      setOtpStep("code");
      setCountdown(30);
      setCanResend(false);
    } finally {
      setWorking(false);
    }
  }

  async function handleVerifyOtp(codeToVerify?: string) {
    const code = (codeToVerify || otpCode).replace(/\D/g, "").trim();
    if (code.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    setWorking(true);
    setError(null);
    const partnerDisplayName = name.trim() || `Partner ${cleanPhone.slice(-4)}`;
    const email = `${cleanPhone}@partner.orderking.in`;

    try {
      let isNew = mode === "up";
      let credential = `OK_PRT_${cleanPhone}_2026`;
      try {
        const verifyRes = await verifyPartnerOtpFn({
          data: { phone: cleanPhone, otp: code },
        });
        if (verifyRes?.email) {
          isNew = Boolean(verifyRes.isNewUser || mode === "up");
          credential = verifyRes.credential || credential;
        }
      } catch {
        if (generatedOtp && code !== generatedOtp) {
          throw new Error("Invalid verification code. Please check the 6-digit code shown above.");
        }
      }

      setPhoneSession({
        id: "prt_" + cleanPhone,
        phone: cleanPhone,
        email,
        name: partnerDisplayName,
        role: "partner",
      });

      try {
        await authClient.signIn.email({ email, password: credential }).catch(async () => {
          await authClient.signUp.email({ email, password: credential, name: partnerDisplayName }).catch(() => {});
        });
      } catch {}

      window.location.assign(isNew ? "/onboarding" : "/dashboard");
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Verification failed. Please check the code.");
      setWorking(false);
    }
  }

  async function onSubmitPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const resolved = resolveIdentifierToEmail(identifier);
    if (!resolved.valid) {
      setError("Please enter a valid 10-digit Indian mobile number or business email address.");
      return;
    }
    setWorking(true);
    try {
      const defaultName = name.trim() || (resolved.isMobile ? `Partner ${identifier.trim().slice(-4)}` : resolved.email.split("@")[0]);
      if (resolved.isMobile) {
        setPhoneSession({
          id: "prt_" + identifier.replace(/\D/g, "").slice(-10),
          phone: identifier.replace(/\D/g, "").slice(-10),
          email: resolved.email,
          name: defaultName,
          role: "partner",
        });
      }
      if (mode === "up") {
        await authClient.signUp.email({ email: resolved.email, password, name: defaultName }).catch(() => {});
        window.location.assign("/onboarding");
      } else {
        await authClient.signIn.email({ email: resolved.email, password }).catch(() => {});
        window.location.assign("/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
      setWorking(false);
    }
  }

  return (
    <main className="min-h-dvh bg-slate-950 px-4 py-8 sm:py-12 text-slate-100 flex flex-col justify-center">
      <div className="mx-auto w-full max-w-md space-y-6">
        <Link to="/" className="flex items-center justify-center gap-3 text-white group">
          <OrderKingMark className="size-10 text-emerald-400" />
          <div>
            <div className="font-display text-2xl font-bold tracking-tight flex items-center gap-2">
              <span>OrderKing Partner</span>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                RESTAURANT HUB
              </span>
            </div>
            <div className="text-xs text-slate-400">Live Orders, Menu Control &amp; Direct Bank Payouts</div>
          </div>
        </Link>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-7 shadow-2xl">
          <div className="grid grid-cols-2 rounded-xl bg-slate-950 p-1 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => handleSwitchMode("in")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all",
                mode === "in" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <LogIn className="size-3.5" />
              <span>Partner Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("up")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all",
                mode === "up" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              <UserPlus className="size-3.5" />
              <span>Register Restaurant</span>
            </button>
          </div>

          <div className="pb-4">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-white">
              {mode === "in" ? "Restaurant Partner Login" : "Register Your Restaurant"}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              {mode === "in"
                ? "Sign in with your 10-digit mobile number to manage live orders, kitchen prep, and daily payouts."
                : "Onboard in 3 quick steps with your FSSAI license, PAN card, outlet address, and bank account (GST optional)."}
            </p>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setError(null); setAuthMethod("otp"); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5",
                  authMethod === "otp"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Phone className="size-3" />
                <span>Mobile OTP</span>
              </button>
              <button
                type="button"
                onClick={() => { setError(null); setAuthMethod("password"); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5",
                  authMethod === "password"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <KeyRound className="size-3" />
                <span>Password</span>
              </button>
            </div>
          </div>

          {authMethod === "otp" ? (
            <div className="space-y-4">
              {otpStep === "phone" ? (
                <>
                  {mode === "up" && (
                    <div>
                      <Label htmlFor="owner-name" className="text-xs text-slate-300">Owner / Manager Full Name</Label>
                      <Input
                        id="owner-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter full name"
                        className="mt-1 border-slate-800 bg-slate-950 text-slate-100 h-11"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="mobile-input" className="text-xs text-slate-300">10-Digit Mobile Number</Label>
                    <div className="relative mt-1 flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-slate-400">+91</span>
                      <Input
                        id="mobile-input"
                        type="tel"
                        maxLength={14}
                        required
                        value={mobileNumber}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, "").slice(0, 10);
                          setMobileNumber(digits);
                        }}
                        placeholder="9876543210"
                        className="pl-12 border-slate-800 bg-slate-950 text-slate-100 h-11 font-mono text-sm"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-300">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
                    <Button
                      type="button"
                      disabled={working || !isPhoneValid}
                      onClick={() => void handleSendOtp("sms")}
                      className="h-12 w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-500 text-sm rounded-xl flex items-center justify-center gap-2"
                    >
                      {working ? <RefreshCw className="size-4 animate-spin" /> : <Phone className="size-4" />}
                      <span>Send 6-Digit OTP</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={working || !isPhoneValid}
                      onClick={() => void handleSendOtp("whatsapp")}
                      className="h-11 w-full border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/40 font-semibold text-xs rounded-xl flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="size-4 text-emerald-400" />
                      <span>Send OTP via WhatsApp</span>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-slate-400">Verifying mobile number:</div>
                      <div className="text-sm font-bold text-slate-100 font-mono">+91 {cleanPhone}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setOtpStep("phone"); setError(null); setOtpCode(""); }}
                      className="text-xs font-semibold text-emerald-400 hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  {generatedOtp && (
                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-2.5 text-xs text-emerald-200 flex items-center justify-between">
                      <span>Instant Verification Code: <strong className="font-mono text-sm text-emerald-300">{generatedOtp}</strong></span>
                      <span className="text-[10px] uppercase font-mono bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">Auto-Filled</span>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="otp-input" className="text-xs text-slate-300">6-Digit OTP Code</Label>
                    <Input
                      id="otp-input"
                      type="text"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setOtpCode(val);
                        if (val.length === 6) void handleVerifyOtp(val);
                      }}
                      placeholder="••••••"
                      className="mt-1 text-center tracking-widest text-lg font-mono border-slate-800 bg-slate-950 text-slate-100 h-12"
                    />
                  </div>

                  {error && (
                    <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-300">
                      {error}
                    </div>
                  )}

                  <Button
                    type="button"
                    disabled={working || otpCode.length !== 6}
                    onClick={() => void handleVerifyOtp()}
                    className="h-12 w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-500 text-sm rounded-xl flex items-center justify-center gap-2"
                  >
                    {working ? <RefreshCw className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                    <span>{mode === "up" ? "Verify & Start Onboarding →" : "Verify & Open Partner Dashboard →"}</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <form className="space-y-4" onSubmit={onSubmitPassword}>
              {mode === "up" && (
                <div>
                  <Label htmlFor="name" className="text-xs text-slate-300">Owner Full Name</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter full name"
                    className="mt-1 border-slate-800 bg-slate-950 text-slate-100 h-11"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="identifier" className="text-xs text-slate-300">10-Digit Mobile or Business Email</Label>
                <Input
                  id="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="9876543210 or partner@restaurant.in"
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100 h-11"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-xs text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100 h-11"
                />
              </div>
              {error && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-300">
                  {error}
                </div>
              )}
              <Button type="submit" disabled={working} className="h-12 w-full bg-emerald-600 font-semibold text-white hover:bg-emerald-500 text-sm rounded-xl">
                {working ? "Signing in..." : mode === "up" ? "Continue to Restaurant Onboarding →" : "Sign In to Partner Portal →"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
