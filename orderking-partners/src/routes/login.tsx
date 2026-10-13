import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OrderKingMark } from "@/components/mark";
import { useT } from "@/components/use-t";
import { platformConfig } from "@/lib/platform-config";
import { ShieldCheck, ArrowRight, Phone, Mail, Building2, Globe } from "lucide-react";

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
  const { user } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("mode");
      if (q === "up") return "up";
    }
    return "in";
  });
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  if (user) return <Navigate to="/dashboard" />;

  async function onSubmit(e: FormEvent) {
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
    <main className="min-h-dvh bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-md space-y-6">
        <Link to="/" className="flex items-center gap-3 text-white">
          <OrderKingMark className="size-10 text-chili" />
          <div>
            <div className="font-display text-2xl font-bold tracking-tight">{platformConfig.brand.appName}</div>
            <div className="text-xs text-slate-400">
              Restaurant Partner Operations, KDS &amp; Statutory Settlement Portal
            </div>
          </div>
        </Link>

        {/* Institutional Trust & Compliance Summary */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <ShieldCheck className="size-4 shrink-0" />
            <span>Direct Partner Onboarding • FSSAI &amp; GST Compliant</span>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
            Manage live KDS orders, menu availability, preparation SLAs, and automated bank settlements with full CGST
            Sec 9(5), TCS Sec 52, and Income Tax Sec 194-O ledger transparency.
          </p>
        </div>

        <div className="rounded-[24px] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-2">
            <h1 className="font-display text-2xl font-bold text-white">
              {mode === "in" ? "Partner Sign In" : "Restaurant Partner Registration"}
            </h1>
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
              23 LANGUAGES
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {mode === "in"
              ? "Sign in with your 10-digit registered mobile number or restaurant email address."
              : "Create your partner account to complete FSSAI, GSTIN, and bank payout verification."}
          </p>

          <form className="mt-5 space-y-3.5" onSubmit={onSubmit}>
            {mode === "up" ? (
              <div>
                <Label htmlFor="name" className="text-xs text-slate-300">
                  Authorized Signatory / Owner Name
                </Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="e.g. Rajeshwari Iyer"
                  className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600"
                />
              </div>
            ) : null}

            <div>
              <Label htmlFor="identifier" className="flex items-center justify-between text-xs text-slate-300">
                <span>10-Digit Mobile Number or Business Email</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                  <Phone className="size-3" /> / <Mail className="size-3" />
                </span>
              </Label>
              <Input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                placeholder="9876543210 or partner@restaurant.in"
                className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Enter your 10-digit Indian mobile number (no @ needed) or your registered email ID.
              </p>
            </div>

            <div>
              <Label htmlFor="password" className="text-xs text-slate-300">
                {t("auth.password")}
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "up" ? "new-password" : "current-password"}
                placeholder="••••••••"
                className="border-slate-800 bg-slate-950 text-slate-100"
              />
              <p className="mt-1 text-[11px] text-slate-500">{t("auth.passwordHint")}</p>
            </div>

            {error ? (
              <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-300">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              className="h-11 w-full bg-emerald-600 font-medium text-white shadow-md shadow-emerald-950 hover:bg-emerald-500"
              size="lg"
              disabled={working}
            >
              {working
                ? t("auth.working")
                : mode === "in"
                  ? "Sign In to Partner Portal"
                  : "Continue to FSSAI & KYC Onboarding"}
            </Button>
          </form>

          <button
            type="button"
            className="mt-4 inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline"
            onClick={() => {
              setError(null);
              setMode(mode === "in" ? "up" : "in");
            }}
          >
            {mode === "in"
              ? "New restaurant partner? Register for onboarding"
              : "Already have a partner account? Sign in here"}
            <ArrowRight className="size-3" />
          </button>
        </div>

        {/* Institutional Partner Highlights */}
        <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-400">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <Building2 className="size-3.5 text-emerald-400" />
              <span>Self-Service Control</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Manage menu stock, rush prep SLAs, tax invoices, and bank accounts directly.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <Globe className="size-3.5 text-emerald-400" />
              <span>All 22 Indian Languages</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Native script UI &amp; voice KDS alerts across all 22 Eighth Schedule languages + English.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
