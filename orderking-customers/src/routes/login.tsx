
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBrand, useT } from "@/components/providers";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const isVercel = typeof window !== "undefined" && window.location.hostname.includes("vercel.app");
  const { t } = useT();
  const { brand } = useBrand();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onEmail = async () => {
    setBusy(true);
    setError(null);
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

        <div className="flex items-center justify-between">
          <Wordmark />
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-950">
            👑 VIP Access
          </span>
        </div>

        <h1 className="mt-5 font-display text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          {t("auth.title", { name: brand.appName })}
        </h1>
        <p className="mt-1 text-xs text-stone-600 font-medium leading-relaxed">{t("auth.subtitle")}</p>

        {authEnabled && !isVercel ? (
          <div className="mt-6 space-y-3">
            {/* Viral Growth Hooks: WhatsApp OTP & Truecaller One-Tap */}
            <div className="space-y-2.5 pb-1">
              <Button
                type="button"
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
                onClick={() => console.log('Initiate WhatsApp OTP flow')}
              >
                <span>💬</span>
                <span>Sign in with WhatsApp OTP</span>
              </Button>
              <Button
                type="button"
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-xs"
                onClick={() => console.log('Initiate Truecaller One-Tap flow')}
              >
                <span>📞</span>
                <span>Truecaller 1-Tap Login</span>
              </Button>
            </div>
            
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

            <div className="space-y-2.5 pt-2">
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
              {error ? (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2 text-center">
                  ⚠️ {error}
                </p>
              ) : null}
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

            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/70 to-yellow-50/40 p-3.5 text-xs text-amber-950 shadow-2xs">
              <div className="flex items-center gap-1.5 font-black">
                <span>🛡️</span>
                <span>{t("auth.phoneSoon")}</span>
              </div>
              <p className="mt-0.5 text-stone-600 text-[11px] leading-relaxed">{t("auth.phoneSoonHint")}</p>
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
