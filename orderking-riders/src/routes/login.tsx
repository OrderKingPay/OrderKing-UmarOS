import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth/client";
import { DEFAULT_BRANDING } from "@/lib/rider/config";
import { useI18n } from "@/lib/rider/i18n-context";
import {
  sendRiderOtpFn,
  verifyRiderOtpFn,
  setLocaleFn,
} from "@/lib/server/rider-fns";
import type { LocaleCode } from "@/lib/rider/types";
import { RIDER_LANGUAGES } from "@/components/rider/language-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Bike,
  Globe,
  MessageCircle,
  RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

export const Route = createFileRoute("/login")({ component: Login });

const PRIMARY_LANGUAGES: ReadonlyArray<{ code: LocaleCode; label: string; native: string }> = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "as", label: "Assamese", native: "অসমীয়া" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
];

function sanitizePhone(input: string): string {
  return input.replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, "");
}

function Login() {
  const { locale, setLocale, t } = useI18n();

  // 2-Step Benchmark Authentication: "phone" -> "otp"
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  const cleanPhone = useMemo(() => sanitizePhone(mobileNumber), [mobileNumber]);
  const isPhoneValid = /^[6-9]\d{9}$/.test(cleanPhone);

  // 30s countdown timer on Step 2 (OTP)
  useEffect(() => {
    if (step !== "otp") return;
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
  }, [step, countdown]);

  function handleLanguageSwitch(newLocale: LocaleCode) {
    setLocale(newLocale);
    void setLocaleFn({ data: { locale: newLocale } }).catch(() => undefined);
  }

  // Step 1: Send OTP
  async function handleSendOtp(channel: "sms" | "whatsapp" = "sms") {
    if (!isPhoneValid) {
      setError("Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const res = await sendRiderOtpFn({
        data: { phone: cleanPhone, channel },
      });

      if (!res.ok) {
        throw new Error(res.message || "Failed to dispatch OTP. Please try again.");
      }

      setStep("otp");
      setCountdown(30);
      setCanResend(false);

      if (channel === "whatsapp" && res.whatsAppOtpUrl && typeof window !== "undefined") {
        window.open(res.whatsAppOtpUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP.";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  // Step 2: Verify OTP & Authenticate Session
  async function handleVerifyOtp(e?: FormEvent) {
    if (e) e.preventDefault();

    const cleanCode = otp.replace(/\D/g, "").trim();
    if (cleanCode.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const verifyRes = await verifyRiderOtpFn({
        data: { phone: cleanPhone, otp: cleanCode },
      });

      if (!verifyRes.ok) {
        throw new Error("Invalid verification code. Please check or request a new code.");
      }

      const { email, credential, destination } = verifyRes;

      // 1. Save prefill in localStorage for subsequent onboarding KYC prefill
      try {
        localStorage.setItem(
          "orderking_rider_prefill",
          JSON.stringify({
            phone: cleanPhone,
          }),
        );
      } catch {
        /* ignore storage quota */
      }

      // 2. Authenticate session with Better Auth
      const signInRes = await authClient.signIn.email({
        email,
        password: credential,
        callbackURL: destination,
      });

      if (signInRes.error) {
        // If not registered, create account then sign in
        const signUpRes = await authClient.signUp.email({
          email,
          password: credential,
          name: "Delivery Partner",
          callbackURL: destination,
        });

        if (signUpRes.error) {
          // Fallback retry sign in
          const retrySignIn = await authClient.signIn.email({
            email,
            password: credential,
            callbackURL: destination,
          });
          if (retrySignIn.error) {
            throw new Error(retrySignIn.error.message || "Authentication failed.");
          }
        }
      }

      // 3. Seamlessly redirect: verified -> `/`, new / draft -> `/onboarding`
      window.location.href = destination;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0D14] text-slate-100 flex flex-col justify-between selection:bg-[#E5A93C]/30 selection:text-white">
      {/* Top Delivery Partner Navigation Header */}
      <header className="border-b border-[#1E283D] bg-[#0E121B]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3">
          {/* Brand Mark */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/30 border border-[#E5A93C]/40 shadow-[0_0_12px_rgba(229,169,60,0.2)]">
              <img
                src={DEFAULT_BRANDING.logoUrl}
                alt="OrderKing Delivery Partner"
                className="size-7 rounded-lg object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <Bike className="size-5 text-[#E5A93C] absolute" />
            </div>
            <div>
              <p className="font-display text-sm font-bold tracking-wider leading-none text-white">
                ORDERKING <span className="text-[#E5A93C]">DELIVERY PARTNER</span>
              </p>
              <p className="text-[10px] text-[#94A3B8] font-medium tracking-wide">
                Delivery Partner Fleet
              </p>
            </div>
          </div>

          {/* Language Quick Selector */}
          <div className="flex items-center gap-1">
            <div className="flex items-center rounded-full bg-[#161D2B] p-0.5 border border-[#1E283D]">
              {PRIMARY_LANGUAGES.map((lang) => {
                const isActive = locale === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageSwitch(lang.code)}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${
                      isActive
                        ? "bg-[#E5A93C] text-black shadow-sm"
                        : "text-[#94A3B8] hover:text-white"
                    }`}
                  >
                    {lang.native}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowAllLanguages((v) => !v)}
              className="flex size-7 items-center justify-center rounded-full border border-[#1E283D] bg-[#161D2B] text-[#94A3B8] hover:text-white hover:border-[#E5A93C]/50 transition"
              title="Select Partner Language"
              aria-label="Select Partner Language"
            >
              <Globe className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable Regional Languages Dropdown Tray */}
        {showAllLanguages && (
          <div className="border-t border-[#1E283D] bg-[#121723] px-4 py-3 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="mx-auto max-w-lg">
              <div className="flex items-center justify-between pb-2 text-[11px] font-semibold text-[#94A3B8]">
                <span>Select Delivery Partner Language:</span>
                <button
                  type="button"
                  onClick={() => setShowAllLanguages(false)}
                  className="text-[#E5A93C] hover:underline"
                >
                  Close ✕
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {RIDER_LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      handleLanguageSwitch(l.code);
                      setShowAllLanguages(false);
                    }}
                    className={`rounded-lg px-2.5 py-1.5 text-left text-xs transition truncate ${
                      locale === l.code
                        ? "bg-[#E5A93C]/20 text-[#E5A93C] font-bold border border-[#E5A93C]/40"
                        : "bg-[#161D2B] text-slate-300 hover:bg-[#1E283D]"
                    }`}
                  >
                    <span className="font-medium">{l.nativeLabel}</span>
                    <span className="block text-[10px] text-muted-foreground">{l.englishName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Delivery Partner Card */}
      <div className="mx-auto w-full max-w-md px-4 py-6 sm:py-8 flex-1 flex flex-col justify-center">
        <div className="rounded-3xl border border-[#1E283D] bg-[#121723]/95 p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full bg-[#E5A93C]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-48 rounded-full bg-[#2563EB]/10 blur-3xl" />

          {/* ========================================================================= */}
          {/* STEP 1: PHONE NUMBER ENTRY (Benchmark Screen 1)                           */}
          {/* ========================================================================= */}
          {step === "phone" ? (
            <div className="mt-5 space-y-5">
              <div>
                <h1 className="font-display text-2xl font-black tracking-tight text-white">
                  Enter Mobile Number
                </h1>
                <p className="mt-1 text-xs text-[#94A3B8] leading-relaxed">
                  We'll send a 6-digit OTP to verify your delivery partner account.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSendOtp("sms");
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="mobile-input" className="text-xs font-semibold text-[#94A3B8]">
                    10-Digit Mobile Number
                  </Label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1.5 border-r border-[#1E283D] pr-2.5 text-sm font-bold text-white select-none">
                      <span className="text-base" role="img" aria-label="India Flag">🇮🇳</span>
                      <span>+91</span>
                    </div>
                    <Input
                      id="mobile-input"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      autoFocus
                      required
                      placeholder="e.g. 9876543210"
                      value={mobileNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setMobileNumber(val);
                        if (error) setError(null);
                      }}
                      className="border-[#1E283D] bg-[#161D2B] pl-20 text-white placeholder:text-[#64748B] focus:border-[#E5A93C] focus:bg-[#0E121B] h-12 text-base font-medium tracking-wide rounded-2xl"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-400 animate-in fade-in duration-150">
                    {error}
                  </div>
                )}

                {/* Benchmark Send OTP Button */}
                <Button
                  type="submit"
                  disabled={pending || !isPhoneValid}
                  size="lg"
                  className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-[#E5A93C] to-amber-600 py-3.5 font-display text-base font-extrabold uppercase tracking-wide text-black shadow-lg shadow-amber-500/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-45 disabled:pointer-events-none h-12"
                >
                  {pending ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                      Sending OTP...
                    </span>
                  ) : (
                    "Send OTP →"
                  )}
                </Button>
              </form>

              {/* Clean Legal Terms */}
              <p className="text-center text-[11px] leading-relaxed text-[#94A3B8]">
                By continuing, you agree to the{" "}
                <Link
                  to="/onboarding"
                  className="font-medium text-[#E5A93C] underline hover:text-amber-300 transition"
                >
                  Delivery Partner Terms
                </Link>{" "}
                &amp;{" "}
                <Link
                  to="/onboarding"
                  className="font-medium text-[#E5A93C] underline hover:text-amber-300 transition"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          ) : (
            /* ========================================================================= */
            /* STEP 2: 6-DIGIT OTP VERIFICATION (Benchmark Screen 2)                      */
            /* ========================================================================= */
            <div className="mt-5 space-y-5">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#94A3B8] hover:text-[#E5A93C] transition mb-2"
                >
                  <ArrowLeft className="size-3.5" />
                  Change Mobile Number
                </button>
                <h1 className="font-display text-2xl font-black tracking-tight text-white">
                  Verify Mobile Number
                </h1>
                <p className="mt-1 text-xs text-[#94A3B8]">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-bold text-white">+91-{cleanPhone}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="otp-input" className="text-xs font-semibold text-[#94A3B8]">
                      6-Digit OTP Code
                    </Label>
                  </div>
                  <Input
                    id="otp-input"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    required
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtp(val);
                      if (error) setError(null);
                    }}
                    className="border-[#1E283D] bg-[#161D2B] text-center font-mono text-2xl tracking-[0.6em] font-extrabold text-white placeholder:tracking-normal placeholder:font-sans placeholder:text-sm focus:border-[#E5A93C] focus:bg-[#0E121B] h-13 rounded-2xl"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-400 animate-in fade-in duration-150">
                    {error}
                  </div>
                )}

                {/* Benchmark Verify & Continue CTA */}
                <Button
                  type="submit"
                  disabled={pending || otp.replace(/\D/g, "").length !== 6}
                  size="lg"
                  className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-[#E5A93C] to-amber-600 py-3.5 font-display text-base font-extrabold uppercase tracking-wide text-black shadow-lg shadow-amber-500/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-45 disabled:pointer-events-none h-12"
                >
                  {pending ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                      Verifying Code...
                    </span>
                  ) : (
                    "Verify & Continue →"
                  )}
                </Button>

                {/* Resend OTP Options */}
                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-[#94A3B8]">
                    <span>Didn't receive the OTP?</span>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={() => void handleSendOtp("sms")}
                        className="font-bold text-[#E5A93C] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="size-3" />
                        Resend via SMS
                      </button>
                    ) : (
                      <span className="text-[#64748B]">Resend in {countdown}s</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSendOtp("whatsapp")}
                    className="w-full rounded-xl border border-[#1E283D] bg-[#161D2B] py-2 text-xs font-semibold text-emerald-400 hover:bg-[#1E283D] hover:border-emerald-500/40 transition flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="size-3.5 text-emerald-400" />
                    Resend via WhatsApp
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#1E283D] bg-[#0E121B] px-4 py-3 text-center text-[11px] text-[#64748B]">
        <p>
          OrderKing Delivery Partner Network · {DEFAULT_BRANDING.legalCompanyName}
        </p>
      </footer>
    </main>
  );
}
