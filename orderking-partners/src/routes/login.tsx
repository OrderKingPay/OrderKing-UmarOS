import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OrderKingMark } from "@/components/mark";
import { useT } from "@/components/use-t";
import { platformConfig } from "@/lib/platform-config";
import { ShieldCheck, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const isVercel = typeof window !== "undefined" && window.location.hostname.includes("vercel.app");
  const t = useT();
  const { user } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">(() => {
    if (typeof window !== "undefined") {
      const q = new URLSearchParams(window.location.search).get("mode");
      if (q === "up") return "up";
    }
    return "in";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  if (user) return <Navigate to="/dashboard" />;

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setWorking(true);
    setError(null);
    try {
      if (mode === "up") {
        const res = await authClient.signUp.email({ email, password, name: name || email.split("@")[0] });
        if (res.error) throw new Error(res.error.message || t("auth.error"));
        window.location.assign("/onboarding");
      } else {
        const res = await authClient.signIn.email({ email, password });
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
            <div className="text-xs text-slate-400">Zero-Fee Merchant Acquisition Gateway</div>
          </div>
        </Link>

        {/* Aggressive Enterprise Acquisition Guarantee */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400">
            <ShieldCheck className="size-4 shrink-0" />
            <span>Zero Setup Fees. Zero Hidden Charges. Live in 60 Seconds.</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            No payment gateways, credit cards, or upfront fees required. Instant kitchen deployment.
          </p>
        </div>

        <div className="rounded-[24px] border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between pb-2">
            <h1 className="font-display text-2xl font-bold text-white">
              {mode === "in" ? "Partner Sign In" : "Direct Merchant Registration"}
            </h1>
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
              ₹0 SETUP
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {mode === "in"
              ? "Access live kitchen operations, menu controls, and settlements."
              : "Register your restaurant in seconds. Zero gateway hurdles."}
          </p>

          {authEnabled && !isVercel ? (
            <div className="mt-5 grid gap-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="secondary"
                  className="border-slate-800 bg-slate-800/80 hover:bg-slate-700 text-slate-200"
                  onClick={() => signIn(p.providerId, { callbackURL: mode === "up" ? "/onboarding" : "/dashboard" })}
                >
                  {p.idp === "google" ? t("auth.continueGoogle") : t("auth.continueX")}
                </Button>
              ))}
            </div>
          ) : null}

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-500 font-mono">
            <span className="h-px flex-1 bg-slate-800" />
            {t("auth.orEmail")}
            <span className="h-px flex-1 bg-slate-800" />
          </div>

          <form className="space-y-3" onSubmit={onEmail}>
            {mode === "up" ? (
              <div>
                <Label htmlFor="name" className="text-xs text-slate-300">Contact / Owner Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="e.g. Vikram Sharma"
                  className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600"
                />
              </div>
            ) : null}
            <div>
              <Label htmlFor="email" className="text-xs text-slate-300">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="partner@restaurant.in"
                className="border-slate-800 bg-slate-950 text-slate-100 placeholder:text-slate-600"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs text-slate-300">{t("auth.password")}</Label>
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
            {error ? <p className="text-xs text-rose-400">{error}</p> : null}
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-md shadow-emerald-950 h-11"
              size="lg"
              disabled={working}
            >
              {working
                ? t("auth.working")
                : mode === "in"
                  ? "Sign In to Restaurant Portal"
                  : "Deploy Restaurant (Live in 60s)"}
            </Button>
          </form>

          <button
            type="button"
            className="mt-4 text-xs text-emerald-400 hover:underline inline-flex items-center gap-1"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
          >
            {mode === "in" ? "Need a restaurant account? Register free in 60s" : "Already registered? Sign in here"}
            <ArrowRight className="size-3" />
          </button>
        </div>
      </div>
    </main>
  );
}
