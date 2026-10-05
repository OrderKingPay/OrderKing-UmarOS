import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { DEFAULT_BRANDING } from "@/lib/rider/config";
import { LOCALE_LABELS } from "@/lib/rider/i18n";
import type { LocaleCode } from "@/lib/rider/types";
import { useI18n } from "@/lib/rider/i18n-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { t, locale, setLocale } = useI18n();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0] || "Partner",
          callbackURL: "/",
        });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/",
        });
        if (err) throw new Error(err.message);
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : t("unauthorized"));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full flex-col overflow-hidden bg-[#030303] selection:bg-blue-500/30">
      {/* 👑 PREMIUM LOGISTICS ANIMATED BACKGROUND - UMAR OS SUPREME */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#030303]">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15], rotate: [0, 90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] h-[70%] w-[70%] rounded-full bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-transparent blur-[140px]"
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.25, 0.1], rotate: [0, -90, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute -bottom-[20%] -right-[10%] h-[70%] w-[70%] rounded-full bg-gradient-to-tl from-cyan-500/20 via-blue-800/10 to-transparent blur-[160px]"
        />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 w-full max-w-md mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex w-full flex-wrap gap-2 justify-end"
        >
          {(Object.keys(LOCALE_LABELS) as LocaleCode[]).map((code) => (
            <Button
              key={code}
              size="sm"
              variant={locale === code ? "default" : "secondary"}
              className={`rounded-full px-4 text-[11px] font-bold tracking-wider transition-all ${locale === code ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-black/40 border border-white/10 text-zinc-400 hover:bg-white/10 backdrop-blur-md'}`}
              onClick={() => setLocale(code)}
            >
              {LOCALE_LABELS[code]}
            </Button>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden w-full rounded-[2.5rem] border border-white/10 bg-black/40 p-8 shadow-[0_16px_60px_0_rgba(0,0,0,0.6)] backdrop-blur-3xl ring-1 ring-white/5 sm:p-10"
        >
          {/* Glassmorphic Shine */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
          
          <div className="relative z-20 flex flex-col items-center text-center">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="relative rounded-3xl p-1 bg-gradient-to-br from-blue-500/20 to-indigo-500/20"
            >
              <img 
                src={DEFAULT_BRANDING.logoUrl} 
                alt="Logo" 
                className="size-16 rounded-2xl shadow-lg ring-1 ring-white/10" 
              />
            </motion.div>
            <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.3em] text-blue-400/80 drop-shadow-sm">
              {DEFAULT_BRANDING.legalCompanyName}
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/60 drop-shadow-sm">
              {DEFAULT_BRANDING.riderFacingBrand}
            </h1>
            <p className="mt-3 text-sm font-medium text-zinc-400">
              {t("loginLead")}
            </p>
          </div>

          <div className="mt-8 space-y-4 relative z-20">
            {authEnabled ? (
              <div className="space-y-3">
                {GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="secondary"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/5 font-bold text-white hover:bg-white/10 hover:border-white/20 hover:shadow-[0_4px_12px_rgba(255,255,255,0.05)] transition-all"
                    onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                  >
                    {p.idp === "twitter" ? t("continueX") : t("continueGoogle")}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm font-medium text-zinc-500">Sign-in is disabled.</p>
            )}

            <div className="my-6 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-600">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <span className="bg-[#0a0a0a] px-3 py-1 rounded-full">{t("or")}</span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            <form onSubmit={onEmail} className="space-y-4">
              <AnimatePresence mode="popLayout">
                {mode === "up" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label className="text-zinc-300 ml-1 font-semibold">{t("name")}</Label>
                    <Input 
                      className="mt-1.5 h-12 rounded-xl border-white/10 bg-black/50 px-4 text-white placeholder:text-zinc-600 transition-all focus:border-blue-500 focus:ring-blue-500/20" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      autoComplete="name" 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              
              <div>
                <Label className="text-zinc-300 ml-1 font-semibold">{t("email")}</Label>
                <Input
                  className="mt-1.5 h-12 rounded-xl border-white/10 bg-black/50 px-4 text-white placeholder:text-zinc-600 transition-all focus:border-blue-500 focus:ring-blue-500/20"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              
              <div>
                <Label className="text-zinc-300 ml-1 font-semibold">{t("password")}</Label>
                <Input
                  className="mt-1.5 h-12 rounded-xl border-white/10 bg-black/50 px-4 text-white placeholder:text-zinc-600 transition-all focus:border-blue-500 focus:ring-blue-500/20"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                />
                <p className="mt-2 ml-1 text-xs font-medium text-zinc-500">{t("passwordHint")}</p>
              </div>
              
              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, y: -5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -5 }}
                    className="rounded-xl bg-red-500/10 p-3 text-center text-sm font-semibold text-red-400 border border-red-500/20"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <Button 
                size="lg" 
                className="relative mt-4 h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-white shadow-[0_4px_20px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(37,99,235,0.5)] hover:scale-[1.02] active:translate-y-0 active:scale-95" 
                disabled={pending} 
                type="submit"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity hover:opacity-100 mix-blend-overlay" />
                {pending ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white" />
                ) : mode === "up" ? t("signUp") : t("signIn")}
              </Button>
            </form>
            
            <button
              type="button"
              className="mt-6 w-full text-center text-sm font-bold text-zinc-400 transition-colors hover:text-blue-400"
              onClick={() => setMode(mode === "up" ? "in" : "up")}
            >
              {mode === "up" ? t("haveAccount") : t("needAccount")}
            </button>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex flex-col items-center text-center"
        >
          <p className="text-[10px] font-medium tracking-widest text-zinc-600 uppercase">{t("legalNote")}</p>
          <Link to="/" className="mt-3 text-xs font-bold text-zinc-500 transition-colors hover:text-white">
            {DEFAULT_BRANDING.domain}
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
