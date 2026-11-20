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
  const { locale, setLocale } = useI18n();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [mobileNumber, setMobileNumber] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("orderking_rider_prefill");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.phone) return String(parsed.phone);
        }
      }
    } catch { }
    return "";
  });
  const [otp, setOtp] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  const cleanPhone = useMemo(() => sanitizePhone(mobileNumber), [mobileNumber]);
  const isPhoneValid = /^[6-9]\d{9}$/.test(cleanPhone);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("orderking_rider_session");
      if (raw && !window.location.search.includes("logout")) {
        const parsed = JSON.parse(raw);
        if (parsed?.phone && /^[6-9]\d{9}$/.test(parsed.phone)) {
          const cookieVal = encodeURIComponent(raw);
          document.cookie = `orderking_rider_session=${cookieVal}; path=/; max-age=2592000; SameSite=Lax; Secure`;
          window.location.href = "/";
        }
      }
    } catch { }
  }, []);

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
      .catch(() => { });

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
        throw new Error(res.message || "SMS was not delivered. Try again.");
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

      const { email, credential, destination, name } = verifyRes as { email: string; credential: string; destination: string; name?: string };

      try {
        setPhoneSession({
          id: "rd_" + cleanPhone,
          phone: cleanPhone,
          email: `${cleanPhone}@rider.orderking.in`,
          name: name || "Delivery Partner",
          role: "rider",
        });
      } catch { }
      try {
        const sessionPayload = encodeURIComponent(
          JSON.stringify({
            phone: cleanPhone,
            email: `${cleanPhone}@rider.orderking.in`,
          }),
        );
        document.cookie = `orderking_rider_session=${sessionPayload}; path=/; max-age=2592000; SameSite=Lax; Secure`;
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
            name: name || "Delivery Partner",
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
    <main className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-rose-500/20 selection:text-rose-900 font-sans">
      {/* Top Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-3">
          {/* Brand Mark */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Bike className="size-5" />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight leading-none text-foreground">
                ORDERKING <span className="text-primary">DELIVERY</span>
              </p>
              <p className="text-[11px] text-muted-foreground font-medium">
                Delivery Partner
              </p>
            </div>
          </div>

          {/* Language Quick Selector */}
          <div className="flex items-center gap-1">
            <div className="flex items-center rounded-full bg-muted p-0.5 border border-border">
              {PRIMARY_LANGUAGES.map((lang) => {
                const isActive = locale === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageSwitch(lang.code)}
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold transition ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
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
              className="flex size-7 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground hover:text-foreground transition"
              title="Select Partner Language"
              aria-label="Select Partner Language"
            >
              <Globe className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable Regional Languages Dropdown Tray */}
        {showAllLanguages && (
          <div className="border-t border-border bg-muted/60 px-4 py-3 text-xs animate-in slide-in-from-top-2 duration-150">
            <div className="mx-auto max-w-lg">
              <div className="flex items-center justify-between pb-2 text-[11px] font-semibold text-muted-foreground">
                <span>Select Delivery Partner Language:</span>
                <button
                  type="button"
                  onClick={() => setShowAllLanguages(false)}
                  className="text-primary font-bold hover:underline"
                >
                  Close
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
                        ? "bg-primary/10 text-primary font-bold border border-primary/30"
                        : "bg-card text-foreground hover:bg-muted border border-border"
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
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-7 shadow-xs">
          {step === "phone" ? (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  Enter Mobile Number
                </h1>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
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
                  <Label htmlFor="mobile-input" className="text-xs font-semibold text-foreground">
                    10-Digit Mobile Number
                  </Label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 flex items-center gap-1.5 border-r border-border pr-2.5 text-sm font-bold text-foreground select-none">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-muted-foreground" aria-label="India">IN</span>
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
                      placeholder="Enter 10-digit mobile"
                      value={mobileNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setMobileNumber(val);
                        if (error) setError(null);
                      }}
                      className="border-border bg-background pl-20 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 h-12 text-base font-semibold tracking-wide rounded-2xl shadow-xs"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 animate-in fade-in duration-150">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={pending || !isPhoneValid}
                  size="lg"
                  className="w-full rounded-2xl bg-primary hover:bg-primary/90 py-3.5 text-base font-bold text-primary-foreground shadow-sm transition active:scale-[0.99] disabled:opacity-45 disabled:pointer-events-none h-12"
                >
                  {pending ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                      Sending OTP...
                    </span>
                  ) : (
                    "Send OTP"
                  )}
                </Button>

                <div className="pt-2 text-center">
                  <Link
                    to="/benefits"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>View Partner Rate Card &amp; Benefits</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </form>

              <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
                By continuing, you agree to the{" "}
                <Link
                  to="/terms"
                  className="font-medium text-primary underline hover:text-primary/80 transition"
                >
                  Delivery Partner Terms
                </Link>{" "}
                &amp;{" "}
                <Link
                  to="/privacy"
                  className="font-medium text-primary underline hover:text-primary/80 transition"
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
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition mb-2"
                >
                  <ArrowLeft className="size-3.5" />
                  Change Mobile Number
                </button>
                <h1 className="text-2xl font-black tracking-tight text-foreground">
                  Verify Mobile Number
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-bold text-foreground">+91-{cleanPhone}</span>
                </p>
              </div>

              <form onSubmit={(e) => void verifyCode(undefined, e)} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="otp-input" className="text-xs font-semibold text-foreground">
                      6-Digit OTP Code
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Auto-detecting SMS</span>
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
                                ? "border-primary bg-card ring-2 ring-primary/20 text-foreground scale-[1.02]"
                                : isFilled
                                  ? "border-muted-foreground/40 bg-card text-foreground"
                                  : "border-border bg-muted/40 text-muted-foreground"
                            }`}
                          >
                            {digit}
                            {isFocused && !digit && !pending && (
                              <span className="absolute bottom-3 h-0.5 w-4 rounded-full bg-primary animate-pulse" />
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
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 animate-in fade-in duration-150">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={pending || otp.replace(/\D/g, "").length !== 6}
                  size="lg"
                  className="w-full rounded-2xl bg-primary hover:bg-primary/90 py-3.5 text-base font-bold text-primary-foreground shadow-sm transition active:scale-[0.99] disabled:opacity-45 disabled:pointer-events-none h-12"
                >
                  {pending ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                      Verifying Code...
                    </span>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>

                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Didn't receive the OTP?</span>
                    {canResend ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => void handleSendOtp("sms")}
                          className="font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="size-3" />
                          Resend via SMS
                        </button>
                        <span className="text-border">|</span>
                        <button
                          type="button"
                          onClick={() => void handleSendOtp("whatsapp")}
                          className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          Resend via WhatsApp
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Resend in {countdown}s</span>
                    )}
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-3 text-center text-[11px] text-muted-foreground">
        <p>
          © {DEFAULT_BRANDING.legalCompanyName} · Delivery Partner
        </p>
      </footer>
    </main>
  );
}
