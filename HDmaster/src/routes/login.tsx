import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { GROK_PROVIDERS, authEnabled, signIn, authClient, setPhoneSession } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { OrderKingMark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  requestAdminPhoneOtpFn,
  verifyAdminPhoneOtpFn,
} from "@/lib/server/phone-auth";
import { Phone, Mail, ShieldCheck, ArrowLeft, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user } = useCurrentUserState();
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // WebOTP API for 1-tap SMS autofill on mobile/tablets
  useEffect(() => {
    if (!otpSent || typeof window === "undefined" || !("OTPCredential" in window)) return;

    const ac = new AbortController();
    navigator.credentials
      .get({
        otp: { transport: ["sms"] },
        signal: ac.signal,
      } as any)
      .then((otpCredential: any) => {
        if (otpCredential?.code) {
          const autoCode = String(otpCredential.code).replace(/\D/g, "").slice(0, 6);
          if (autoCode.length === 6) {
            setOtp(autoCode);
            void onVerifyPhoneOtp(autoCode);
          }
        }
      })
      .catch(() => {});

    return () => {
      ac.abort();
    };
  }, [otpSent]);

  // 30s countdown timer
  useEffect(() => {
    if (!otpSent) return;
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
  }, [otpSent, countdown]);

  if (user) return <Navigate to="/app" />;

  const cleanPhone = phone.replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, "");
  const isPhoneValid = /^[6-9]\d{9}$/.test(cleanPhone);

  async function onSendPhoneOtp(channel: "sms" | "whatsapp" = "sms") {
    if (!isPhoneValid) {
      setError("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).");
      return;
    }

    setBusy(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await requestAdminPhoneOtpFn({
        data: { phone: cleanPhone, channel },
      });
      setOtpSent(true);
      setCountdown(30);
      setCanResend(false);
      setSuccessMsg(
        channel === "whatsapp"
          ? `Verification code dispatched to WhatsApp (+91-${cleanPhone}).`
          : `Cellular SMS OTP dispatched to +91-${cleanPhone}.`
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to dispatch SMS OTP.");
    } finally {
      setBusy(false);
    }
  }

  async function onVerifyPhoneOtp(codeOverride?: string) {
    const code = (codeOverride || otp).replace(/\D/g, "").trim();
    if (code.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const res = await verifyAdminPhoneOtpFn({
        data: { phone: cleanPhone, otp: code },
      });

      // Synchronize Better Auth 90-day administrative session
      const signInRes = await authClient.signIn.email({
        email: res.email,
        password: res.password,
        callbackURL: "/app",
      });

      if (signInRes.error) {
        // If not registered yet, create the founder/operator account
        const signUpRes = await authClient.signUp.email({
          email: res.email,
          password: res.password,
          name: "Umar OS Administrator",
          callbackURL: "/app",
        });
        if (signUpRes.error) {
          // Retry sign-in
          await authClient.signIn.email({
            email: res.email,
            password: res.password,
            callbackURL: "/app",
          });
        }
      }

      window.location.href = "/app";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0] || "Operator",
          callbackURL: "/app",
        });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/app",
        });
        if (err) throw new Error(err.message);
      }
      window.location.href = "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#07090E] px-4 py-10 text-slate-100 font-sans">
      <div className="w-full max-w-md rounded-3xl border border-amber-500/20 bg-[#0C1018]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Top Glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-48 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="flex items-center gap-3 mb-6">
          <OrderKingMark className="size-11" />
          <div>
            <h1 className="font-display text-xl font-black tracking-tight text-white">
              Umar OS Command Center
            </h1>
            <p className="text-xs text-slate-400">
              Autonomous Governance &amp; Administration
            </p>
          </div>
        </div>

        {/* Auth Method Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#141A26] border border-[#1E283D] mb-5">
          <button
            type="button"
            onClick={() => {
              setAuthMethod("phone");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition ${
              authMethod === "phone"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Phone className="size-3.5" />
            <span>Mobile SMS OTP</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMethod("email");
              setError(null);
              setSuccessMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl transition ${
              authMethod === "email"
                ? "bg-amber-500 text-black shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Mail className="size-3.5" />
            <span>Work Email</span>
          </button>
        </div>

        {authMethod === "phone" ? (
          <div className="space-y-4">
            {!otpSent ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="admin-phone" className="text-xs font-semibold text-slate-300">
                    Administrator Mobile Number
                  </Label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1.5 border-r border-[#1E283D] pr-2.5 text-sm font-bold text-white select-none">
                      <span className="text-base" role="img" aria-label="India Flag">🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <Input
                      id="admin-phone"
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      autoFocus
                      placeholder="9876543210"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                        if (error) setError(null);
                      }}
                      className="border-[#1E283D] bg-[#141A26] pl-20 text-white placeholder:text-[#64748B] focus:border-amber-400 h-12 text-base font-medium rounded-2xl"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-400">
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-400">
                    {successMsg}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={() => void onSendPhoneOtp("sms")}
                  disabled={busy || !isPhoneValid}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 font-bold text-black text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-[0.98] transition hover:brightness-105"
                >
                  {busy ? "Dispatching SMS OTP..." : "Send Cellular SMS OTP →"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Code dispatched to <span className="text-white font-bold">+91-{cleanPhone}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setError(null);
                    }}
                    className="font-bold text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <ArrowLeft className="size-3" /> Change
                  </button>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="admin-otp" className="text-xs font-semibold text-slate-300">
                    6-Digit Verification Code
                  </Label>
                  <Input
                    id="admin-otp"
                    type="tel"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtp(val);
                      if (error) setError(null);
                      if (val.length === 6) {
                        void onVerifyPhoneOtp(val);
                      }
                    }}
                    className="text-center font-mono tracking-widest text-2xl font-black rounded-2xl border-2 border-amber-400/80 bg-[#141A26] text-white h-14 focus:border-amber-400"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-400">
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-xs font-semibold text-emerald-400">
                    {successMsg}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={() => void onVerifyPhoneOtp()}
                  disabled={busy || otp.replace(/\D/g, "").length !== 6}
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 font-bold text-black text-sm tracking-wide shadow-lg shadow-amber-500/20 active:scale-[0.98] transition hover:brightness-105"
                >
                  {busy ? "Verifying..." : "Verify & Enter Command Center →"}
                </Button>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Didn't receive SMS?</span>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={() => void onSendPhoneOtp("sms")}
                      className="font-bold text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="size-3" /> Resend SMS
                    </button>
                  ) : (
                    <span>Resend in {countdown}s</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {authEnabled ? (
              <div className="space-y-3">
                {GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="secondary"
                    className="w-full bg-[#161D2B] border border-[#1E283D] text-white hover:bg-[#1E283D]"
                    onClick={() => signIn(p.providerId, { callbackURL: "/app" })}
                  >
                    Continue with {p.label}
                  </Button>
                ))}
                {GROK_PROVIDERS.length > 0 && (
                  <div className="relative py-2 text-center text-xs uppercase tracking-widest text-slate-500">
                    or email
                  </div>
                )}
                <form className="space-y-3" onSubmit={onEmail}>
                  {mode === "up" ? (
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-xs text-slate-300">Name</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        className="bg-[#141A26] border-[#1E283D] text-white"
                      />
                    </div>
                  ) : null}
                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs text-slate-300">Work Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      className="bg-[#141A26] border-[#1E283D] text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-xs text-slate-300">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === "up" ? "new-password" : "current-password"}
                      className="bg-[#141A26] border-[#1E283D] text-white"
                    />
                  </div>
                  {error ? <p className="text-xs font-semibold text-rose-400">{error}</p> : null}
                  <Button
                    type="submit"
                    className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs"
                    disabled={busy}
                  >
                    {busy ? "Working…" : mode === "up" ? "Create Administrator Account" : "Sign in"}
                  </Button>
                </form>
                <button
                  type="button"
                  className="w-full text-center text-xs text-slate-400 hover:text-white"
                  onClick={() => setMode(mode === "in" ? "up" : "in")}
                >
                  {mode === "in" ? "Need an administrator account? Create one" : "Already have an account? Sign in"}
                </button>
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-400">Sign-in is disabled.</p>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#1E283D] flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          <span>Statutory Integrity · GSTIN 18AFXPH9838M1Z9 · 90-Day Session</span>
        </div>
      </div>
    </main>
  );
}
