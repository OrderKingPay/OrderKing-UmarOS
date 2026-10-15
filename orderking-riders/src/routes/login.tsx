import { createFileRoute, Link } from "@tanstack/react-router";
import { authClient } from "@/lib/auth/client";
import { DEFAULT_BRANDING } from "@/lib/rider/config";
import { useI18n } from "@/lib/rider/i18n-context";
import { LanguageSelector } from "@/components/rider/language-selector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Banknote,
  Bike,
  Calculator,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  FileCheck2,
  Phone,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";

export const Route = createFileRoute("/login")({ component: Login });

function resolveAuthEmail(identifier: string): { email: string; phone: string | null } {
  const trimmed = identifier.trim();
  if (trimmed.includes("@")) {
    return { email: trimmed.toLowerCase(), phone: null };
  }
  const digits = trimmed.replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, "");
  if (/^[6-9]\d{9}$/.test(digits)) {
    return { email: `${digits}@rider.orderking.in`, phone: digits };
  }
  throw new Error("Please enter a valid 10-digit Indian mobile number (starting with 6–9) or email address.");
}

function previewResolvedIdentity(identifier: string): string | null {
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) return `Email Login: ${trimmed.toLowerCase()}`;
  const digits = trimmed.replace(/\D/g, "").replace(/^(?:91|0)(?=\d{10}$)/, "");
  if (/^[6-9]\d{9}$/.test(digits)) {
    return `Mobile Partner ID: +91-${digits} (${digits}@rider.orderking.in)`;
  }
  return null;
}

function Login() {
  const { t } = useI18n();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [cityZone, setCityZone] = useState("Sribhumi / Karimganj");
  const [vehiclePref, setVehiclePref] = useState<"BIKE" | "SCOOTER" | "EV" | "CYCLE">("BIKE");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Interactive Payout Estimator State (100% real statutory formula)
  const [calcDistanceKm, setCalcDistanceKm] = useState(4.5);
  const [calcWaitMins, setCalcWaitMins] = useState(8);
  const [calcDailyOrders, setCalcDailyOrders] = useState(14);
  const [docChecklistTab, setDocChecklistTab] = useState<"MOTOR" | "EXEMPT">("MOTOR");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const resolvedPreview = useMemo(() => previewResolvedIdentity(identifier), [identifier]);

  const payoutBreakdown = useMemo(() => {
    const baseFareRs = 35;
    const extraKm = Math.max(0, calcDistanceKm - 2);
    const distancePayRs = Math.round(extraKm * 10);
    const billableWaitMins = Math.max(0, calcWaitMins - 5);
    const waitPayRs = Math.round(billableWaitMins * 1.5);
    const perOrderRs = baseFareRs + distancePayRs + waitPayRs;
    const dailyTotalRs = perOrderRs * calcDailyOrders;
    const weeklyTotalRs = dailyTotalRs * 6;
    return {
      baseFareRs,
      distancePayRs,
      waitPayRs,
      perOrderRs,
      dailyTotalRs,
      weeklyTotalRs,
    };
  }, [calcDistanceKm, calcWaitMins, calcDailyOrders]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { email: resolvedEmail, phone } = resolveAuthEmail(identifier);
      if (mode === "up") {
        if (!name.trim() || name.trim().length < 2) {
          throw new Error("Please enter your full legal name as per Aadhaar / Driving Licence.");
        }
        const { error: err } = await authClient.signUp.email({
          email: resolvedEmail,
          password,
          name: name.trim(),
          callbackURL: "/onboarding",
        });
        if (err) {
          if (err.message?.toLowerCase().includes("already exists") || (err as any).status === 422) {
            // Intelligent auto-recovery: account already exists, attempt automatic sign-in
            const { error: signInErr } = await authClient.signIn.email({
              email: resolvedEmail,
              password,
              callbackURL: "/onboarding",
            });
            if (!signInErr) {
              window.location.href = "/onboarding";
              return;
            }
            throw new Error(
              "An account with this mobile number / email already exists. Please switch to 'Sign In' or verify your password."
            );
          }
          throw new Error(err.message);
        }
        try {
          localStorage.setItem(
            "orderking_rider_prefill",
            JSON.stringify({
              fullName: name.trim(),
              phone: phone ?? "",
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
          password,
          callbackURL: "/",
        });
        if (err) throw new Error(err.message);
        window.location.href = "/";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unauthorized"));
    } finally {
      setPending(false);
    }
  }

  const SELF_SERVICE_FAQS = [
    {
      q: "How do I sign in using my 10-digit mobile number?",
      a: "Enter your 10-digit Indian mobile number (e.g., 9876543210) directly in the first box. The portal automatically maps it to your unique @rider.orderking.in Partner ID.",
    },
    {
      q: "Can I join with a Bicycle or Low-Speed Electric Scooter without a Driving Licence?",
      a: "Yes. Under Central Motor Vehicles Rules (CMVR Rule 2(u)), pedal bicycles and low-speed electric vehicles (<250W motor, top speed <25 km/h) are exempt from commercial Driving Licence (DL) and RTO RC requirements. Only Aadhaar (Last 4), PAN, and Bank/UPI details are required.",
    },
    {
      q: "How are my per-order earnings and settlements calculated?",
      a: "Every delivery guarantees a ₹35 minimum base fare (covering the first 2 km), plus ₹10/km distance pay beyond 2 km, ₹1.50/min restaurant wait-time compensation after 5 minutes of verified arrival, and 100% pass-through of customer tips. Settlements are transferred via NEFT/IMPS & UPI every Wednesday.",
    },
    {
      q: "What if I make a mistake in my KYC or UPI ID after submitting?",
      a: "You can open the Onboarding & KYC page at any time from your profile or sidebar and click 'Edit KYC / Bank Details' to update your UPI ID, bank account, or vehicle documents yourself without waiting for support.",
    },
  ];

  return (
    <main className="min-h-dvh bg-bg text-fg font-sans">
      {/* Top Institutional Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <img
              src={DEFAULT_BRANDING.logoUrl}
              alt=""
              className="size-10 rounded-xl border border-border"
            />
            <div>
              <p className="font-display text-lg font-bold leading-none text-fg">
                OrderKing Rider Partner
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {DEFAULT_BRANDING.legalCompanyName}
              </p>
            </div>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10 space-y-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          {/* Left Column: Sign-In & Partner Registration Card */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-slate-900 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                <ShieldCheck className="size-3.5 text-emerald-700" />
                Official Delivery Partner Portal
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {DEFAULT_BRANDING.domain}
              </span>
            </div>

            <h1 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-slate-900">
              {mode === "in" ? "Delivery Partner Sign In" : "Register as a Delivery Partner"}
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
              {mode === "in"
                ? t("loginLead")
                : "Create your OrderKing Delivery Partner account in 30 seconds using your 10-digit mobile number or email address."}
            </p>

            {/* Mode Switch Tabs */}
            <div className="mt-5 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("in");
                  setError(null);
                }}
                className={`rounded-lg py-2 text-xs font-bold transition ${
                  mode === "in"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("signIn")} (Existing Partner)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("up");
                  setError(null);
                }}
                className={`rounded-lg py-2 text-xs font-bold transition ${
                  mode === "up"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("signUp")} (New Partner)
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
              {mode === "up" ? (
                <>
                  <div>
                    <Label className="text-xs font-semibold text-slate-700">
                      Full Legal Name (as per Aadhaar / Driving Licence) *
                    </Label>
                    <Input
                      className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                      required
                      placeholder="e.g. Rajesh Kumar Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">
                        Operating City / Zone *
                      </Label>
                      <Input
                        className="mt-1 bg-slate-50 text-slate-900 focus:bg-white"
                        required
                        placeholder="e.g. Sribhumi, Guwahati, Kolkata"
                        value={cityZone}
                        onChange={(e) => setCityZone(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">
                        Delivery Vehicle Category *
                      </Label>
                      <select
                        value={vehiclePref}
                        onChange={(e) =>
                          setVehiclePref(e.target.value as "BIKE" | "SCOOTER" | "EV" | "CYCLE")
                        }
                        className="mt-1 h-11 w-full rounded-md border border-border bg-slate-50 px-3 text-xs font-semibold text-slate-900 focus:bg-white"
                      >
                        <option value="BIKE">Motorcycle (BIKE)</option>
                        <option value="SCOOTER">Scooter (SCOOTER)</option>
                        <option value="EV">Low-Speed EV (No DL/RC)</option>
                        <option value="CYCLE">Bicycle (No DL/RC)</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : null}

              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  10-Digit Mobile Number or Email Address *
                </Label>
                <div className="relative mt-1">
                  <Input
                    className="bg-slate-50 text-slate-900 focus:bg-white"
                    type="text"
                    required
                    placeholder="e.g. 9876543210 or partner@email.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                  />
                </div>
                {resolvedPreview ? (
                  <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    <CheckCircle2 className="size-3 text-emerald-700" />
                    <span>{resolvedPreview}</span>
                  </p>
                ) : (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                    <Phone className="size-3 text-slate-400" />
                    <span>
                      Enter your 10-digit mobile number (auto-maps to{" "}
                      <code className="font-mono text-slate-700">@rider.orderking.in</code>) or email.
                    </span>
                  </p>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">
                  {t("password")} / Partner Security PIN *
                </Label>
                <div className="relative mt-1">
                  <Input
                    className="bg-slate-50 pr-10 text-slate-900 focus:bg-white"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "up" ? "new-password" : "current-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{t("passwordHint")}</p>
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
                  {error}
                </div>
              ) : null}

              <Button
                size="lg"
                className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-slate-800"
                disabled={pending}
                type="submit"
              >
                {pending
                  ? "Authenticating..."
                  : mode === "up"
                    ? "Create Partner Account & Proceed to KYC →"
                    : t("signIn")}
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-600">
              <button
                type="button"
                className="font-semibold text-slate-900 underline underline-offset-2"
                onClick={() => {
                  setMode(mode === "up" ? "in" : "up");
                  setError(null);
                }}
              >
                {mode === "up" ? t("haveAccount") : t("needAccount")}
              </button>
              <Link
                to="/onboarding"
                className="font-semibold text-emerald-800 hover:underline"
              >
                Open Partner KYC &amp; Onboarding Portal →
              </Link>
            </div>
          </section>

          {/* Right Column: Institutional Value Cards & Self-Service Pre-Joining Checklist */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Institutional Partner Commitments
              </h2>
              <div className="mt-3.5 grid gap-3">
                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <Banknote className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Weekly Wednesday Bank Payouts
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                      Scheduled weekly NEFT/IMPS &amp; UPI settlements every Wednesday with transparent ₹35 base floor, ₹10/km distance pay (&gt;2 km), wait-time compensation, and 100% customer tips.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                    <UserCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Zero Joining Fee
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                      ₹0 onboarding or registration charges. Complete digital self-service KYC with Driving Licence &amp; RC (exempt for Cycle / Low-Speed EV), PAN, and Aadhaar Last 4.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
                    <CalendarClock className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Flexible Shift &amp; Gig Slots
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                      Operate full-time peak meal shifts or part-time gig slots across your preferred local delivery zones with zero mandatory login lock-in.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-800">
                    <ShieldAlert className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Emergency SOS &amp; Accidental Cover
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                      24×7 emergency safety desk, 112 emergency dispatch integration, live route telemetry, and on-duty accidental insurance support.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Required Documents Self-Service Checklist */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                  <FileCheck2 className="size-4 text-emerald-700" />
                  Pre-Joining KYC Document Checklist
                </span>
                <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setDocChecklistTab("MOTOR")}
                    className={`rounded-md px-2 py-1 transition ${
                      docChecklistTab === "MOTOR" ? "bg-slate-900 text-white" : "text-slate-600"
                    }`}
                  >
                    Bike / Scooter
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocChecklistTab("EXEMPT")}
                    className={`rounded-md px-2 py-1 transition ${
                      docChecklistTab === "EXEMPT" ? "bg-slate-900 text-white" : "text-slate-600"
                    }`}
                  >
                    Cycle / Low-Speed EV
                  </button>
                </div>
              </div>

              {docChecklistTab === "MOTOR" ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                    <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0" />
                    <span>Valid Driving Licence (LMV / MCWG)</span>
                  </li>
                  <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                    <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0" />
                    <span>Vehicle RC &amp; Valid Insurance</span>
                  </li>
                  <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                    <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0" />
                    <span>Aadhaar Card (Last 4 Digits) &amp; PAN</span>
                  </li>
                  <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                    <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0" />
                    <span>Active Bank Account (IFSC) &amp; UPI ID</span>
                  </li>
                </ul>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 font-medium">
                    No Driving Licence or RTO RC required under CMVR Rule 2(u) for pedal bicycles and sub-250W (&lt;25 km/h) electric scooters.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                    <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                      <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0" />
                      <span>Aadhaar Card (Last 4 Digits)</span>
                    </li>
                    <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                      <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0" />
                      <span>PAN Card (for TDS Compliance)</span>
                    </li>
                    <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                      <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0" />
                      <span>Active Bank Account &amp; UPI ID</span>
                    </li>
                    <li className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-100">
                      <CheckCircle2 className="size-3.5 text-emerald-700 shrink-0" />
                      <span>Emergency Family Contact Number</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Bottom Section: Transparent Rate Card Estimator & Self-Service FAQ */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Interactive Statutory Payout Calculator */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <Calculator className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Transparent Per-Order Payout Calculator
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Calculate exact earnings using OrderKing's statutory rate card
                  </p>
                </div>
              </div>
              <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                ₹35 Floor Guaranteed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  Order Distance: <strong>{calcDistanceKm} km</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={0.5}
                  value={calcDistanceKm}
                  onChange={(e) => setCalcDistanceKm(Number(e.target.value))}
                  className="mt-2 w-full accent-slate-900"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  First 2 km in base · ₹10/km extra
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  Restaurant Wait: <strong>{calcWaitMins} mins</strong>
                </label>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={1}
                  value={calcWaitMins}
                  onChange={(e) => setCalcWaitMins(Number(e.target.value))}
                  className="mt-2 w-full accent-slate-900"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  ₹1.50/min after 5 mins grace
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  Orders / Day: <strong>{calcDailyOrders} drops</strong>
                </label>
                <input
                  type="range"
                  min={4}
                  max={30}
                  step={1}
                  value={calcDailyOrders}
                  onChange={(e) => setCalcDailyOrders(Number(e.target.value))}
                  className="mt-2 w-full accent-slate-900"
                />
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Excludes 100% customer tips
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-center">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-900 block">
                  Per-Order Payout
                </span>
                <span className="text-lg font-extrabold text-slate-900">
                  ₹{payoutBreakdown.perOrderRs}
                </span>
                <span className="text-[10px] text-slate-600 block">
                  ₹{payoutBreakdown.baseFareRs} base + ₹{payoutBreakdown.distancePayRs} km + ₹
                  {payoutBreakdown.waitPayRs} wait
                </span>
              </div>
              <div className="border-x border-emerald-200/80 px-2">
                <span className="text-[10px] font-bold uppercase text-emerald-900 block">
                  Est. Daily Payout
                </span>
                <span className="text-lg font-extrabold text-slate-900">
                  ₹{payoutBreakdown.dailyTotalRs.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-slate-600 block">
                  For {calcDailyOrders} completed orders
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-900 block">
                  6-Day Weekly Payout
                </span>
                <span className="text-lg font-extrabold text-emerald-800">
                  ₹{payoutBreakdown.weeklyTotalRs.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-slate-600 block">
                  Settled every Wednesday
                </span>
              </div>
            </div>
          </section>

          {/* Self-Service Partner Help & Statutory Notice */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                <Bike className="size-4.5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Self-Service Partner Guide &amp; FAQ
                </h2>
                <p className="text-[11px] text-slate-500">
                  Instant answers for sign-in, vehicle eligibility, and weekly settlements
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {SELF_SERVICE_FAQS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={idx} className="p-3">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between gap-2 text-left text-xs font-bold text-slate-900"
                    >
                      <span>{item.q}</span>
                      {isOpen ? (
                        <ChevronUp className="size-4 shrink-0 text-slate-500" />
                      ) : (
                        <ChevronDown className="size-4 shrink-0 text-slate-500" />
                      )}
                    </button>
                    {isOpen && (
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-1 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <span>
                {DEFAULT_BRANDING.legalCompanyName} · Code on Social Security, 2020 &amp; IT Act, 2000 Compliant
              </span>
              <Link to="/" className="font-semibold text-slate-800 underline">
                {DEFAULT_BRANDING.domain}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
