import { toast } from "sonner";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBrand, useT } from "@/components/providers";
import { requestPhoneOtpFn, verifyPhoneOtpFn } from "@/lib/server/phone-auth";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const isVercel = typeof window !== "undefined" && window.location.hostname.includes("vercel.app");
  const { t } = useT();
  const { brand } = useBrand();

  // Authentication method tabs: 'phone' (default) | 'email'
  const [authMethod, setAuthMethod] = useState<"phone" | "email">("phone");

  // Phone state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneName, setPhoneName] = useState("");
  const [whatsAppUrl, setWhatsAppUrl] = useState<string | null>(null);
  const [debugOtpCode, setDebugOtpCode] = useState<string | null>(null);
  const [providerNotice, setProviderNotice] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Email state
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Shared state
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // WebOTP API auto-credential detection (Zero-Tap OTP fill on mobile)
  useEffect(() => {
    if (!otpSent || typeof window === "undefined" || !("OTPCredential" in window)) return;

    const ac = new AbortController();
    navigator.credentials
      .get({
        otp: { transport: ["sms"] },
        signal: ac.signal,
      } as any)
      .then((otpCredential: any) => {
        if (otpCredential && otpCredential.code) {
          setOtp(otpCredential.code);
          setSuccessMsg("SMS OTP auto-detected securely via WebOTP.");
        }
      })
      .catch((err) => {
        console.debug("[WebOTP] Auto-detection skipped or timed out:", err);
      });

    return () => {
      ac.abort();
    };
  }, [otpSent]);

  // Auto-verify when 6 digits are reached (via WebOTP auto-fill or direct entry)
  useEffect(() => {
    if (otpSent && otp.trim().length === 6 && !busy) {
      void onVerifyOtp();
    }
  }, [otp, otpSent]);

  // Request Phone OTP via SMS or WhatsApp
  const onSendOtp = async (channel: "sms" | "whatsapp" = "sms") => {
    const cleanNumber = phone.replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, "");
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      setError("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).");
      return;
    }

    setBusy(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Direct server dispatch via Fast2SMS Quick route ("q") with live balance
      const res = await requestPhoneOtpFn({
        data: {
          phone: cleanNumber,
          channel,
          name: phoneName.trim() || undefined,
        },
      });

      setOtpSent(true);
      setWhatsAppUrl(res.whatsAppOtpUrl || null);
      if (res.debugOtp) {
        setDebugOtpCode(res.debugOtp);
      }
      if (res.providerNotice) {
        setProviderNotice(res.providerNotice);
      }
      setResendTimer(30);

      if (channel === "whatsapp") {
        setSuccessMsg(`Verification code sent to WhatsApp (+91-${cleanNumber}).`);
      } else {
        setSuccessMsg(`Verification code sent via SMS to +91-${cleanNumber}.`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to dispatch verification code.");
    } finally {
      setBusy(false);
    }
  };

  // Verify Phone OTP and complete sign in
  const onVerifyOtp = async () => {
    const cleanNumber = phone.replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, "");
    if (!/^\d{6}$/.test(otp.trim())) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const res = await verifyPhoneOtpFn({
        data: {
          phone: cleanNumber,
          otp: otp.trim(),
        },
      });

      if (!res.verified) {
        throw new Error("Verification failed. Please check your code.");
      }

      setSuccessMsg("Verification successful! Initializing your session...");

      // Bridge to Better Auth session
      try {
        const signRes = await authClient.signIn.email({
          email: res.email,
          password: res.password,
          callbackURL: "/",
        });

        if (signRes?.error) {
          // If first time sign-in, register user account then sign in
          await authClient.signUp.email({
            email: res.email,
            password: res.password,
            name: phoneName.trim() || `Customer ${cleanNumber.slice(-4)}`,
          });

          await authClient.signIn.email({
            email: res.email,
            password: res.password,
            callbackURL: "/",
          });
        }
      } catch (authError) {
        console.warn("[Auth Bridge] Direct Better Auth auto-signup fallback:", authError);
      }

      // Smooth redirect to app home
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid or expired OTP. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  // Traditional Email sign in / sign up
  const onEmail = async () => {
    setBusy(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({ email, password, name: name || email.split("@")[0]! });
        if (res.error) throw new Error(res.error.message);
      }
      const res = await authClient.signIn.email({ email, password, callbackURL: "/" });
      if (res.error) throw new Error(res.error.message);
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] flex flex-col justify-center px-4 py-8">
      <main className="mx-auto w-full max-w-md rounded-3xl border-2 border-amber-400/60 bg-white/95 backdrop-blur-xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(245,158,11,0.15)] relative overflow-hidden">
        {/* Golden ambient radial flare */}
        <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-gradient-to-br from-amber-400/25 to-yellow-300/15 blur-2xl" />

        <div className="flex items-center justify-center">
          <Wordmark />
        </div>

        <h1 className="mt-5 font-display text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          {t("auth.title", { name: brand.appName })}
        </h1>
        <p className="mt-1 text-xs text-stone-600 font-medium leading-relaxed">{t("auth.subtitle")}</p>

        {authEnabled && !isVercel ? (
          <div className="mt-6 space-y-4">
            {/* Method Toggle: Mobile OTP vs Email */}
            <div className="grid grid-cols-2 p-1 bg-amber-100/60 rounded-2xl border border-amber-200">
              <button
                type="button"
                className={`py-2 px-3 text-xs font-black rounded-xl transition-all ${
                  authMethod === "phone"
                    ? "bg-white text-stone-900 shadow-md shadow-amber-900/5"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                onClick={() => {
                  setAuthMethod("phone");
                  setError(null);
                  setSuccessMsg(null);
                }}
              >
                📱 Mobile OTP
              </button>
              <button
                type="button"
                className={`py-2 px-3 text-xs font-black rounded-xl transition-all ${
                  authMethod === "email"
                    ? "bg-white text-stone-900 shadow-md shadow-amber-900/5"
                    : "text-stone-600 hover:text-stone-900"
                }`}
                onClick={() => {
                  setAuthMethod("email");
                  setError(null);
                  setSuccessMsg(null);
                }}
              >
                ✉️ Email & Password
              </button>
            </div>


            {/* Notifications */}
            {error ? (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl text-center flex items-center justify-center gap-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            ) : null}

            {successMsg ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl text-center flex items-center justify-center gap-2">
                <span>✅</span>
                <span>{successMsg}</span>
              </div>
            ) : null}

            {/* TAB 1: PHONE AUTHENTICATION */}
            {authMethod === "phone" ? (
              <div className="space-y-3.5">
                {!otpSent ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black uppercase tracking-wider text-stone-500">
                        Enter Mobile Number
                      </label>
                      <div className="flex gap-2">
                        <div className="flex items-center justify-center px-3 rounded-xl border border-amber-200 bg-amber-50/50 text-xs font-black text-stone-800 shrink-0">
                          🇮🇳 +91
                        </div>
                        <Input
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          autoComplete="tel-national"
                          autoFocus
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="98765 43210"
                          className="rounded-xl border-amber-200 bg-amber-50/30 text-stone-900 placeholder:text-stone-400 font-bold h-11 text-sm focus:bg-white focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Input
                        type="text"
                        value={phoneName}
                        onChange={(e) => setPhoneName(e.target.value)}
                        placeholder="Your Name (Optional)"
                        className="rounded-xl border-amber-200 bg-amber-50/30 text-stone-900 placeholder:text-stone-400 font-medium h-10 text-xs focus:bg-white focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <Button
                        type="button"
                        disabled={busy || phone.replace(/\D/g, "").length !== 10}
                        className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-sm tracking-wide shadow-lg shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all"
                        onClick={() => void onSendOtp("sms")}
                      >
                        {busy ? (
                          <span className="flex items-center gap-2">
                            <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Dispatching SMS OTP...
                          </span>
                        ) : (
                          "Send SMS Verification Code"
                        )}
                      </Button>

                      <Button
                        type="button"
                        disabled={busy || phone.replace(/\D/g, "").length !== 10}
                        className="w-full h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        onClick={() => void onSendOtp("whatsapp")}
                      >
                        <span>💬</span>
                        <span>Send OTP via WhatsApp</span>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1 text-center">
                      <p className="text-xs text-stone-600">
                        Code sent to <span className="font-bold text-stone-900">+91-{phone}</span>
                      </p>
                      <button
                        type="button"
                        className="text-[11px] font-bold text-amber-800 hover:underline"
                        onClick={() => {
                          setOtpSent(false);
                          setOtp("");
                          setDebugOtpCode(null);
                        }}
                      >
                        Change Number
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="one-time-code"
                        autoFocus
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••••"
                        className="text-center font-mono tracking-widest text-2xl font-black rounded-2xl border-2 border-amber-400 bg-amber-50/30 text-stone-900 h-14 focus:bg-white focus:border-amber-600"
                      />
                    </div>


                    {/* Sovereign WhatsApp Dispatch Action */}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy || resendTimer > 0}
                      onClick={() => void onSendOtp("whatsapp")}
                      className="w-full h-11 rounded-2xl border-emerald-500/40 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <span className="text-sm">💬</span>
                      <span>
                        {resendTimer > 0
                          ? `Resend via WhatsApp in ${resendTimer}s`
                          : "Deliver OTP to WhatsApp"}
                      </span>
                    </Button>

                    <Button
                      type="button"
                      disabled={busy || otp.trim().length !== 6}
                      className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-sm tracking-wide shadow-lg shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all"
                      onClick={() => void onVerifyOtp()}
                    >
                      {busy ? (
                        <span className="flex items-center gap-2">
                          <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Verifying OTP...
                        </span>
                      ) : (
                        "Verify & Sign In"
                      )}
                    </Button>

                    <div className="flex justify-between items-center text-xs pt-1 px-1">
                      <span className="text-stone-500 text-[11px]">Didn&apos;t receive code?</span>
                      {resendTimer > 0 ? (
                        <span className="font-bold text-stone-400 text-[11px]">
                          Resend in {resendTimer}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="font-black text-amber-800 hover:underline text-[11px]"
                          onClick={() => void onSendOtp("sms")}
                        >
                          Resend SMS OTP 🔄
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {/* TAB 2: EMAIL & PASSWORD AUTHENTICATION */}
            {authMethod === "email" ? (
              <div className="space-y-2.5">
                {mode === "up" ? (
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("auth.name")}
                    autoComplete="name"
                    className="rounded-xl border-amber-200 bg-amber-50/30 text-stone-900 placeholder:text-stone-400 font-medium h-11 text-xs focus:bg-white focus:border-amber-500"
                  />
                ) : null}
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.email")}
                  autoComplete="email"
                  className="rounded-xl border-amber-200 bg-amber-50/30 text-stone-900 placeholder:text-stone-400 font-medium h-11 text-xs focus:bg-white focus:border-amber-500"
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.password")}
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                  className="rounded-xl border-amber-200 bg-amber-50/30 text-stone-900 placeholder:text-stone-400 font-medium h-11 text-xs focus:bg-white focus:border-amber-500"
                />

                <Button
                  className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-sm tracking-wide shadow-lg shadow-orange-500/25 hover:from-amber-600 hover:to-orange-600 active:scale-95 transition-all"
                  disabled={busy || password.length < 8}
                  onClick={() => void onEmail()}
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating...
                    </span>
                  ) : mode === "up" ? (
                    t("auth.emailSignUp")
                  ) : (
                    t("auth.emailSignIn")
                  )}
                </Button>

                <button
                  type="button"
                  className="w-full text-xs font-black text-amber-800 hover:underline pt-1 text-center"
                  onClick={() => setMode(mode === "up" ? "in" : "up")}
                >
                  {mode === "up" ? t("auth.switchToSignIn") : t("auth.switchToSignUp")}
                </button>
              </div>
            ) : null}

            {/* Social Logins Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-amber-900/10" />
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-wider">
                <span className="bg-white px-2.5 text-stone-400">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl border-amber-200 bg-amber-50/40 hover:bg-amber-100/70 text-stone-900 font-bold text-xs h-10 shadow-2xs"
                  onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
                >
                  {p.idp === "google" ? `🌐 ${t("auth.google")}` : `✖️ ${t("auth.x")}`}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-stone-500">{t("auth.disabled")}</p>
        )}

        <div className="mt-6 pt-4 border-t border-amber-900/10 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-black text-amber-800 hover:underline">
            ← Return to {brand.appName}
          </Link>
        </div>
      </main>
    </div>
  );
}
