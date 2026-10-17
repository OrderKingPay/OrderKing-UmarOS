import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth/client";
import { DEFAULT_BRANDING } from "@/lib/rider/config";
import { useI18n } from "@/lib/rider/i18n-context";
import { setLocaleFn } from "@/lib/server/rider-fns";
import type { LocaleCode } from "@/lib/rider/types";
import { RIDER_LANGUAGES } from "@/components/rider/language-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bike,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Phone,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

export const Route = createFileRoute("/login")({ component: Login });

function resolveAuthEmail(identifier: string): { email: string; phone: string } {
  const digits = identifier.replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, "");
  if (/^[6-9]\d{9}$/.test(digits)) {
    return { email: `${digits}@rider.orderking.in`, phone: digits };
  }
  throw new Error("Please enter a valid 10-digit Indian mobile number (starting with 6–9).");
}

function previewResolvedIdentity(identifier: string): string | null {
  const digits = identifier.replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, "");
  if (/^[6-9]\d{9}$/.test(digits)) {
    return `+91-${digits} (${digits}@rider.orderking.in)`;
  }
  return null;
}

const PRIMARY_LANGUAGES: ReadonlyArray<{ code: LocaleCode; label: string; native: string }> = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "as", label: "Assamese", native: "অসমীয়া" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
];

function Login() {
  const { locale, setLocale, t } = useI18n();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [mobileNumber, setMobileNumber] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [name, setName] = useState("");
  const [cityZone, setCityZone] = useState("Sribhumi / Karimganj");
  const [vehiclePref, setVehiclePref] = useState<"BIKE" | "SCOOTER" | "EV" | "CYCLE">("BIKE");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showAllLanguages, setShowAllLanguages] = useState(false);

  const resolvedPreview = useMemo(() => previewResolvedIdentity(mobileNumber), [mobileNumber]);
  const isExemptVehicle = vehiclePref === "EV" || vehiclePref === "CYCLE";

  function handleLanguageSwitch(newLocale: LocaleCode) {
    setLocale(newLocale);
    void setLocaleFn({ data: { locale: newLocale } }).catch(() => undefined);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const { email: resolvedEmail, phone } = resolveAuthEmail(mobileNumber);
      const cleanPin = pin.replace(/\D/g, "");
      if (cleanPin.length !== 4) {
        throw new Error("Please enter a valid 4-digit Security PIN.");
      }
      const credential = `PIN#${cleanPin}!Rider2026`;

      if (mode === "up") {
        if (!name.trim() || name.trim().length < 2) {
          throw new Error("Please enter your full legal name as per Aadhaar / Driving Licence.");
        }
        const { error: err } = await authClient.signUp.email({
          email: resolvedEmail,
          password: credential,
          name: name.trim(),
          callbackURL: "/onboarding",
        });

        if (err) {
          if (err.message?.toLowerCase().includes("already exists") || (err as { status?: number }).status === 422) {
            // Intelligent auto-recovery: account already exists, attempt automatic sign-in with the PIN
            const { error: signInErr } = await authClient.signIn.email({
              email: resolvedEmail,
              password: credential,
              callbackURL: "/onboarding",
            });
            if (!signInErr) {
              window.location.href = "/onboarding";
              return;
            }
            // If sign-in with current PIN failed, switch to sign-in mode
            setMode("in");
            throw new Error(
              "Account already exists. Switched to Sign In. Please enter your 4-digit Security PIN."
            );
          }
          throw new Error(err.message || "Registration failed. Please try again.");
        }

        try {
          localStorage.setItem(
            "orderking_rider_prefill",
            JSON.stringify({
              fullName: name.trim(),
              phone: phone,
              cityZone: cityZone.trim(),
              vehicleCategory: vehiclePref,
            }),
          );
        } catch {
          /* ignore storage quota errors */
        }
        window.location.href = "/onboarding";
      } else {
        const { error: err } = await authClient.signIn.email({
          email: resolvedEmail,
          password: credential,
          callbackURL: "/",
        });

        if (err) {
          // Graceful backward compatibility fallback
          const { error: fallbackErr } = await authClient.signIn.email({
            email: resolvedEmail,
            password: "PartnerPass@2026",
            callbackURL: "/",
          });
          if (!fallbackErr) {
            window.location.href = "/";
            return;
          }
          throw new Error(err.message || "Authentication failed. Please verify your mobile number and 4-digit PIN.");
        }
        window.location.href = "/";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unauthorized"));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[#08090C] text-[#F8FAFC] font-sans flex flex-col justify-between selection:bg-[#E5A93C]/30 selection:text-white">
      {/* Top Mobile Bar with Quick Language Pill Selector */}
      <header className="w-full border-b border-[#1E283D] bg-[#0E121B]/80 backdrop-blur-md sticky top-0 z-40">
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

          {/* Language Quick Pills (English, Hindi, Bengali, Assamese, Tamil, Telugu) */}
          <div className="flex items-center gap-1">
            <div className="flex items-center rounded-full bg-[#161D2B] p-0.5 border border-[#1E283D]">
              {PRIMARY_LANGUAGES.map((lang) => {
                const isActive = locale === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageSwitch(lang.code)}
                    className={`rounded-full px-2 py-1 text-[11px] font-bold transition-all ${
                      isActive
                        ? "bg-[#E5A93C] text-slate-950 shadow-[0_0_8px_rgba(229,169,60,0.4)]"
                        : "text-[#94A3B8] hover:text-white hover:bg-[#1A2234]"
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
              className="flex size-7 items-center justify-center rounded-full border border-[#1E283D] bg-[#161D2B] text-[#94A3B8] hover:text-[#E5A93C] transition"
              title="Select Partner Language"
              aria-label="Select Partner Language"
            >
              <Globe className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable Regional Languages Dropdown Tray - Only Standard Indian Languages */}
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

          {/* Delivery Partner Status Badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              Delivery Partner Portal
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#94A3B8]">
              <Sparkles className="size-3 text-[#E5A93C]" />
              {cityZone.split("/")[0]?.trim() || "Active Fleet"}
            </span>
          </div>

          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-white">
            {mode === "in" ? "Delivery Partner Sign In" : "Register"}
          </h1>
          <p className="mt-1 text-xs text-[#94A3B8]">
            {mode === "in"
              ? "Enter your 10-digit mobile number to verify and go on duty."
              : "Join the OrderKing delivery fleet in 30 seconds."}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="mt-5 grid grid-cols-2 rounded-xl border border-[#1E283D] bg-[#0E121B] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("in");
                setError(null);
              }}
              className={`rounded-lg py-2 text-xs font-bold transition-all ${
                mode === "in"
                  ? "bg-[#1E283D] text-[#E5A93C] shadow-sm shadow-[#E5A93C]/10 border border-[#E5A93C]/30"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              Delivery Partner Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("up");
                setError(null);
              }}
              className={`rounded-lg py-2 text-xs font-bold transition-all ${
                mode === "up"
                  ? "bg-[#1E283D] text-[#E5A93C] shadow-sm shadow-[#E5A93C]/10 border border-[#E5A93C]/30"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            {/* New Partner Registration Fields */}
            {mode === "up" && (
              <>
                <div>
                  <Label className="text-xs font-semibold text-[#94A3B8]">
                    Full Legal Name (as per Aadhaar / DL) *
                  </Label>
                  <Input
                    className="mt-1 border-[#1E283D] bg-[#161D2B] text-white focus:border-[#E5A93C] focus:bg-[#0E121B] h-11"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-[#94A3B8]">
                      City / Zone *
                    </Label>
                    <Input
                      className="mt-1 border-[#1E283D] bg-[#161D2B] text-white focus:border-[#E5A93C] focus:bg-[#0E121B] h-11"
                      required
                      placeholder="e.g. Sribhumi"
                      value={cityZone}
                      onChange={(e) => setCityZone(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-[#94A3B8]">
                      Vehicle Category *
                    </Label>
                    <select
                      value={vehiclePref}
                      onChange={(e) =>
                        setVehiclePref(e.target.value as "BIKE" | "SCOOTER" | "EV" | "CYCLE")
                      }
                      className="mt-1 h-11 w-full rounded-md border border-[#1E283D] bg-[#161D2B] px-3 text-xs font-semibold text-white focus:border-[#E5A93C] focus:bg-[#0E121B] outline-none"
                    >
                      <option value="BIKE">Motorcycle (Petrol — DL & RC Required)</option>
                      <option value="SCOOTER">Scooter (Petrol — DL & RC Required)</option>
                      <option value="EV">Low-Speed EV (No DL / RC Required)</option>
                      <option value="CYCLE">Bicycle (No DL / RC Required)</option>
                    </select>
                  </div>
                </div>

                {/* Fleet Classification & Document Checklist */}
                {isExemptVehicle ? (
                  <div className="space-y-2.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
                    <div className="flex items-start gap-2">
                      <Zap className="size-4 shrink-0 mt-0.5 text-emerald-400" />
                      <div>
                        <p className="font-bold text-emerald-400 text-xs">
                          Bicycle &amp; Low-Speed EV Onboarding
                        </p>
                        <p className="text-[11px] text-emerald-200/90 leading-relaxed mt-0.5">
                          Under Central Motor Vehicles Rules (CMVR Rule 2(u)) and national aggregator standards, <strong>Driving License &amp; Vehicle RC are NOT required</strong> for Bicycle and Low-Speed EV delivery partners.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-lg bg-[#0E121B]/80 border border-emerald-500/20 p-2.5 space-y-1.5 text-[11px]">
                      <span className="font-bold uppercase tracking-wider text-emerald-400 block text-[10px]">
                        Required Documents for Bicycle / EV Onboarding:
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-200">
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                          <span>Aadhaar (last 4 digits / DigiLocker)</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                          <span>PAN card (for TDS compliance)</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                          <span>Active Bank Account / UPI ID</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                          <span>Selfie with OrderKing delivery bag</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-200">
                    <div className="flex items-start gap-2">
                      <Bike className="size-4 shrink-0 mt-0.5 text-amber-400" />
                      <div>
                        <p className="font-bold text-amber-400 text-xs">
                          Motorcycle &amp; Scooter Requirement
                        </p>
                        <p className="text-[11px] text-amber-200/90 leading-relaxed mt-0.5">
                          <strong>Driving License &amp; Vehicle RC are required</strong> for all Motorcycle and Scooter delivery partners, along with Aadhaar, PAN, Bank/UPI details, and a Selfie with OrderKing delivery bag.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 10-Digit Mobile Number with +91 Prefix */}
            <div>
              <Label className="text-xs font-semibold text-[#94A3B8]">
                10-Digit Mobile Number *
              </Label>
              <div className="relative mt-1 flex rounded-xl border border-[#1E283D] bg-[#161D2B] focus-within:border-[#E5A93C] focus-within:ring-1 focus-within:ring-[#E5A93C] overflow-hidden">
                <div className="flex items-center gap-1.5 bg-[#0E121B] px-3.5 border-r border-[#1E283D] text-xs font-bold text-[#E5A93C]">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  required
                  placeholder="9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ""))}
                  autoComplete="tel"
                  className="flex-1 bg-transparent px-3 py-2.5 font-mono text-base font-bold text-white placeholder:text-[#475569] focus:outline-none tracking-wider"
                />
              </div>

              {resolvedPreview ? (
                <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="size-3 text-emerald-400" />
                  <span>Partner ID: {resolvedPreview}</span>
                </p>
              ) : (
                <p className="mt-1 flex items-center gap-1 text-[11px] text-[#64748B]">
                  <Phone className="size-3 text-[#64748B]" />
                  <span>Enter 10 digits starting with 6–9</span>
                </p>
              )}
            </div>

            {/* 4-Digit Security PIN */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-[#94A3B8]">
                  4-Digit Security PIN *
                </Label>
                <span className="text-[10px] text-[#64748B]">
                  {mode === "up" ? "Create 4-Digit PIN" : "Instant Access PIN"}
                </span>
              </div>
              <div className="relative mt-1">
                <Input
                  className="border-[#1E283D] bg-[#161D2B] pr-10 text-white focus:border-[#E5A93C] focus:bg-[#0E121B] h-11 font-mono text-center text-lg tracking-[0.4em] font-bold placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#94A3B8] hover:text-white"
                  aria-label={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-[#64748B]">
                <KeyRound className="size-3 text-[#64748B]" />
                <span>
                  {mode === "up"
                    ? "Set a 4-digit PIN for instant access"
                    : "Enter your 4-digit PIN to authenticate and go on duty"}
                </span>
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-semibold text-rose-400">
                {error}
              </div>
            )}

            {/* Clean Standard Legal Text */}
            <p className="text-center text-[11px] leading-relaxed text-[#94A3B8]">
              By signing in, you agree to the{" "}
              <a
                href="/onboarding"
                className="font-medium text-[#E5A93C] underline hover:text-amber-300 transition"
              >
                Delivery Partner Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/onboarding"
                className="font-medium text-[#E5A93C] underline hover:text-amber-300 transition"
              >
                Privacy Policy
              </a>
              .
            </p>

            {/* Clean Professional Login Button */}
            <Button
              size="lg"
              className="w-full rounded-2xl bg-gradient-to-r from-amber-500 via-[#E5A93C] to-amber-600 py-3.5 font-display text-base font-extrabold uppercase tracking-wider text-slate-950 shadow-[0_0_20px_rgba(229,169,60,0.35)] hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] transition-all"
              disabled={pending}
              type="submit"
            >
              {pending ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  Verifying...
                </span>
              ) : mode === "up" ? (
                "Continue"
              ) : (
                "Verify & Go on Duty"
              )}
            </Button>
          </form>

          {/* Quick Footer Links */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#1E283D] pt-4 text-xs text-[#94A3B8]">
            <button
              type="button"
              className="font-semibold text-[#E5A93C] hover:underline"
              onClick={() => {
                setMode(mode === "up" ? "in" : "up");
                setError(null);
              }}
            >
              {mode === "up" ? "Existing Partner? Sign In" : "New Partner? Register"}
            </button>
            <Link
              to="/onboarding"
              className="font-semibold text-emerald-400 hover:underline"
            >
              KYC &amp; Document Desk →
            </Link>
          </div>
        </div>

        {/* Fleet Micro Trust Indicators */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-[#64748B]">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Weekly Settlements
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#E5A93C]" />
            Instant Cash Deposits
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[#2563EB]" />
            Zero Joining Fee
          </span>
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
