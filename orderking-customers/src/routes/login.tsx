
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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-10">
      <Wordmark />
      <h1 className="mt-8 font-display text-3xl">{t("auth.title", { name: brand.appName })}</h1>
      <p className="mt-2 text-sm text-muted">{t("auth.subtitle")}</p>
      {authEnabled && !isVercel ? (
        <div className="mt-6 space-y-3">
          {/* Viral Growth Hooks: WhatsApp OTP & Truecaller One-Tap */}
          <div className="space-y-3 pb-3">
            <Button
              type="button"
              className="w-full bg-[#25D366] text-fg hover:bg-[#128C7E]"
              onClick={() => console.log('Initiate WhatsApp OTP flow')}
            >
              Sign in with WhatsApp OTP
            </Button>
            <Button
              type="button"
              className="w-full bg-[#0052FF] text-fg hover:bg-[#0038FF]"
              onClick={() => console.log('Initiate Truecaller One-Tap flow')}
            >
              Truecaller 1-Tap Login
            </Button>
          </div>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted/30" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-bg px-2 text-muted">Or continue with email</span></div>
          </div>

          {GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
            >
              {p.idp === "google" ? t("auth.google") : t("auth.x")}
            </Button>
          ))}
          <div className="space-y-2 pt-2">
            {mode === "up" ? (
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth.name")} autoComplete="name" />
            ) : null}
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.email")}
              autoComplete="email"
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.password")}
              autoComplete={mode === "up" ? "new-password" : "current-password"}
            />
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button className="w-full" disabled={busy || password.length < 8} onClick={() => void onEmail()}>
              {mode === "up" ? t("auth.emailSignUp") : t("auth.emailSignIn")}
            </Button>
            <button type="button" className="w-full text-sm text-primary" onClick={() => setMode(mode === "up" ? "in" : "up")}>
              {mode === "up" ? t("auth.switchToSignIn") : t("auth.switchToSignUp")}
            </button>
          </div>
          <div className="rounded-[var(--radius-lg)] bg-surface p-3 text-sm text-muted">
            <p className="font-medium text-fg">{t("auth.phoneSoon")}</p>
            <p>{t("auth.phoneSoonHint")}</p>
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">{t("auth.disabled")}</p>
      )}
      <Link to="/" className="mt-8 text-sm text-muted">
        ← {brand.appName}
      </Link>
    </main>
  );
}
