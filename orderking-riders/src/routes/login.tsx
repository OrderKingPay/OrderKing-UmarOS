import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient, setPhoneSession } from "@/lib/auth/client";
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

  useEffect(() => {
    if (step !== "otp") return;
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
            setOtp(autoCode);
            void verifyCode(autoCode);
          }
        }
      })
      .catch(() => {});

    return () => {
      ac.abort();
    };
  }, [step]);

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

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP.";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  async function verifyCode(overrideCode?: string, e?: FormEvent) {
    if (e) e.preventDefault();

    const cleanCode = (overrideCode ?? otp).replace(/\D/g, "").trim();
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

      try {
        setPhoneSession({
          id: "rd_" + cleanPhone,
          phone: cleanPhone,
          email: `${cleanPhone}@rider.orderking.in`,
          name: "Delivery Partner",
          role: "rider",
        });
      } catch {}
      try {
        const sessionPayload = encodeURIComponent(
          JSON.stringify({
            phone: cleanPhone,
            email: `${cleanPhone}@rider.orderking.in`,
          }),
        );
        document.cookie = `orderking_rider_session=${sessionPayload}; path=/; max-age=2592000; SameSite=Lax`;
        localStorage.setItem(
          "orderking_rider_prefill",
          JSON.stringify({
            phone: cleanPhone,
          }),
        );
        localStorage.setItem(
          "orderking_rider_session",
          JSON.stringify({
            phone: cleanPhone,
            email: `${cleanPhone}@rider.orderking.in`,
          }),
        );
      } catch {
        /* ignore storage quota */
      }

      try {
        const signInRes = await authClient.signIn.email({
          email,
          password: credential,
          callbackURL: destination,
        });

        if (signInRes.error) {
          const signUpRes = await authClient.signUp.email({
            email,
            password: credential,
            name: "Delivery Partner",
            callbackURL: destination,
          });

          if (signUpRes.error) {
            await authClient.signIn.email({
              email,
              password: credential,
              callbackURL: destination,
            });
          }
        }
      } catch (authErr) {
        console.warn("Better Auth session sync warning:", authErr);
      }

      window.location.href = destination;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Verification failed.";
      setError(msg);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-gray-900 flex flex-col justify-between selection:bg-rose-500/20 selection:text-rose-900 font-sans">
      {/* Top Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3">
          {/* Brand Mark */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#E23744] text-white shadow-xs">
              <Bike className="size-5" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight leading-none text-gray-900">
                ORDERKING <span className="text-[#E23744]">DELIVERY</span>
              </p>
              <p className="text-[11px] text-gray-500 font-medium">
                Delivery Partner
              </p>
            </div>
          </div>

          {/* Language Quick Selector */}
          <div className="flex items-center gap-1">
            <div className="flex items-center rounded-full bg-gray-100 p-0.5 border border-gray-200">
              {PRIMARY_LANGUAGES.map((lang) => {
                const isActive = locale === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageSwitch(lang.code)}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${
                      isActive
                        ? "bg-[#E23744] text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
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
              className="flex size-7 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-600 hover:text-gray-900 transition"
              title="Select Partner Language"
              aria-label="Select Partner Language"
            >
              <Globe className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable Regional Languages Dropdown Tray */}
        {showAllLanguages && (
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="mx-auto max-w-lg">
              <div className="flex items-center justify-between pb-2 text-[11px] font-semibold text-gray-600">
                <span>Select Delivery Partner Language:</span>
                <button
                  type="button"
                  onClick={() => setShowAllLanguages(false)}
                  className="text-[#E23744] font-bold hover:underline"
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
                        ? "bg-[#E23744]/10 text-[#E23744] font-bold border border-[#E23744]/30"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    <span className="font-medium">{l.nativeLabel}</span>
                    <span className="block text-[10px] text-gray-500">{l.englishName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Delivery Partner Card */}
      <div className="mx-auto w-full max-w-md px-4 py-6 sm:py-8 flex-1 flex flex-col justify-center">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 sm:p-7 shadow-xs">
          {step === "phone" ? (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900">
                  Enter Mobile Number
                </h1>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
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
                  <Label htmlFor="mobile-input" className="text-xs font-semibold text-gray-700">
                    10-Digit Mobile Number
                  </Label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1.5 border-r border-gray-200 pr-2.5 text-sm font-bold text-gray-800 select-none">
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
                      className="border-gray-300 bg-white pl-20 text-gray-900 placeholder:text-gray-400 focus:border-[#E23744] focus:ring-2 focus:ring-[#E23744]/20 h-12 text-base font-semibold tracking-wide rounded-2xl shadow-xs"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 animate-in fade-in duration-150">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={pending || !isPhoneValid}
                  size="lg"
                  className="w-full rounded-2xl bg-[#E23744] hover:bg-[#d02e3b] py-3.5 text-base font-bold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-45 disabled:pointer-events-none h-12"
                >
                  {pending ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Sending OTP...
                    </span>
                  ) : (
                    "Send OTP →"
                  )}
                </Button>
              </form>

              <p className="text-center text-[11px] leading-relaxed text-gray-500">
                By continuing, you agree to the{" "}
                <Link
                  to="/onboarding"
                  className="font-medium text-[#E23744] underline hover:text-red-700 transition"
                >
                  Delivery Partner Terms
                </Link>{" "}
                &amp;{" "}
                <Link
                  to="/onboarding"
                  className="font-medium text-[#E23744] underline hover:text-red-700 transition"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-[#E23744] transition mb-2"
                >
                  <ArrowLeft className="size-3.5" />
                  Change Mobile Number
                </button>
                <h1 className="text-2xl font-black tracking-tight text-gray-900">
                  Verify Mobile Number
                </h1>
                <p className="mt-1 text-xs text-gray-500">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-bold text-gray-900">+91-{cleanPhone}</span>
                </p>
              </div>

              <form onSubmit={(e) => void verifyCode(undefined, e)} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="otp-input" className="text-xs font-semibold text-gray-700">
                      6-Digit OTP Code
                    </Label>
                    <span className="text-[11px] text-gray-400">Auto-detecting SMS</span>
                  </div>

                  <div className="relative">
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      {[0, 1, 2, 3, 4, 5].map((idx) => {
                        const digit = otp[idx] || "";
                        const isFocused = otp.length === idx || (idx === 5 && otp.length === 6);
                        const isFilled = Boolean(digit);
                        return (
                          <div
                            key={idx}
                            className={`relative flex h-14 flex-1 items-center justify-center rounded-2xl border-2 text-center font-mono text-2xl font-black transition-all ${
                              isFocused
                                ? "border-[#E23744] bg-white ring-2 ring-[#E23744]/20 text-gray-900 scale-[1.02]"
                                : isFilled
                                ? "border-gray-400 bg-white text-gray-900"
                                : "border-gray-200 bg-gray-50 text-gray-400"
                            }`}
                          >
                            {digit}
                            {isFocused && !digit && !pending && (
                              <span className="absolute bottom-3 h-0.5 w-4 rounded-full bg-[#E23744] animate-pulse" />
                            )}
                          </div>
                        );
                      })}
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
                        if (val.length === 6) {
                          void verifyCode(val);
                        }
                      }}
                      className="absolute inset-0 h-full w-full opacity-0 cursor-pointer text-transparent selection:bg-transparent selection:text-transparent"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 animate-in fade-in duration-150">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={pending || otp.replace(/\D/g, "").length !== 6}
                  size="lg"
                  className="w-full rounded-2xl bg-[#E23744] hover:bg-[#d02e3b] py-3.5 text-base font-bold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-45 disabled:pointer-events-none h-12"
                >
                  {pending ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Verifying Code...
                    </span>
                  ) : (
                    "Verify & Continue →"
                  )}
                </Button>

                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Didn't receive the OTP?</span>
                    {canResend ? (
                      <button
                        type="button"
                        onClick={() => void handleSendOtp("sms")}
                        className="font-bold text-[#E23744] hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="size-3" />
                        Resend via SMS
                      </button>
                    ) : (
                      <span className="text-gray-400">Resend in {countdown}s</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleSendOtp("whatsapp")}
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <MessageCircle className="size-3.5 text-emerald-600" />
                    Resend via WhatsApp
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-3 text-center text-[11px] text-gray-500">
        <p>
          © {DEFAULT_BRANDING.legalCompanyName} · Delivery Partner
        </p>
      </footer>
    </main>
  );
}
