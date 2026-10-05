import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { OrderKingMark } from "@/components/mark";
import { useT } from "@/components/use-t";
import { platformConfig } from "@/lib/platform-config";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const t = useT();
  const { user } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">("in");
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
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) throw new Error(res.error.message || t("auth.error"));
      }
      window.location.assign("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.error"));
      setWorking(false);
    }
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#020202] px-4 py-10 selection:bg-chili/30">
      {/* 👑 PREMIUM BUSINESS ANIMATED BACKGROUND - UMAR OS SUPREME */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#020202]">
<motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15], rotate: [0, 45, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[15%] -left-[10%] h-[70%] w-[70%] rounded-full bg-gradient-to-br from-chili/20 via-orange-600/10 to-transparent blur-[140px]"
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.25, 0.1], rotate: [0, -45, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute -bottom-[20%] -right-[15%] h-[70%] w-[70%] rounded-full bg-gradient-to-tl from-zinc-500/20 via-chili/10 to-transparent blur-[160px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <Link to="/" className="flex flex-col items-center gap-3 text-white no-underline group mb-8">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="flex items-center justify-center rounded-3xl bg-gradient-to-br from-zinc-900 to-black p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] ring-1 ring-white/10 transition-all group-hover:ring-chili/50 group-hover:shadow-[0_8px_32px_0_rgba(220,38,38,0.2)]"
          >
            <OrderKingMark className="size-14 text-chili drop-shadow-md" />
          </motion.div>
          <div className="text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-white/90 to-white/60 drop-shadow-sm">
              {platformConfig.brand.appName}
            </h1>
            <p className="mt-2 text-sm font-bold tracking-widest uppercase text-zinc-500">
              {platformConfig.brand.tagline}
            </p>
          </div>
        </Link>

        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 p-8 shadow-[0_16px_60px_0_rgba(0,0,0,0.6)] backdrop-blur-3xl ring-1 ring-white/5 sm:p-10">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
          
          <div className="relative z-20">
            <motion.h2 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-3xl font-bold text-white drop-shadow-md"
            >
              {mode === "in" ? t("auth.signIn") : t("auth.signUp")}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-sm font-medium text-zinc-400"
            >
              {t("landing.forOwners")}
            </motion.p>

            {authEnabled ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8"
              >
                <div className="grid gap-3">
                  {GROK_PROVIDERS.map((p) => (
                    <Button
                      key={p.providerId}
                      type="button"
                      variant="secondary"
                      className="h-12 rounded-xl border border-white/10 bg-white/5 font-bold text-white hover:bg-white/10 hover:border-white/20 hover:shadow-[0_4px_12px_rgba(255,255,255,0.05)] transition-all"
                      onClick={() => signIn(p.providerId, { callbackURL: "/dashboard" })}
                    >
                      {p.idp === "google" ? t("auth.continueGoogle") : t("auth.continueX")}
                    </Button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <p className="mt-6 text-sm font-medium text-zinc-500">Sign-in is disabled.</p>
            )}

            <div className="my-8 flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-zinc-600">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              <span className="bg-[#0a0a0a] px-3 py-1 rounded-full">{t("auth.orEmail")}</span>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            <form className="space-y-4" onSubmit={onEmail}>
              <AnimatePresence mode="popLayout">
                {mode === "up" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label htmlFor="name" className="text-zinc-300 ml-1 font-semibold">{t("auth.name")}</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      autoComplete="name" 
                      className="mt-1.5 h-12 rounded-xl border-white/10 bg-black/50 px-4 text-white placeholder:text-zinc-600 transition-all focus:border-chili focus:ring-chili/20"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
              <div>
                <Label htmlFor="email" className="text-zinc-300 ml-1 font-semibold">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="mt-1.5 h-12 rounded-xl border-white/10 bg-black/50 px-4 text-white placeholder:text-zinc-600 transition-all focus:border-chili focus:ring-chili/20"
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-zinc-300 ml-1 font-semibold">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                  className="mt-1.5 h-12 rounded-xl border-white/10 bg-black/50 px-4 text-white placeholder:text-zinc-600 transition-all focus:border-chili focus:ring-chili/20"
                />
                <p className="mt-2 ml-1 text-xs font-medium text-zinc-500">{t("auth.passwordHint")}</p>
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
                type="submit" 
                className="relative mt-4 h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-chili to-red-600 font-bold text-white shadow-[0_4px_20px_rgba(220,38,38,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(220,38,38,0.5)] hover:scale-[1.02] active:translate-y-0 active:scale-95" 
                disabled={working}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity hover:opacity-100 mix-blend-overlay" />
                {working ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white" />
                ) : mode === "in" ? t("auth.signIn") : t("auth.signUp")}
              </Button>
            </form>

            <button
              type="button"
              className="mt-6 w-full text-center text-sm font-bold text-zinc-400 transition-colors hover:text-chili"
              onClick={() => setMode(mode === "in" ? "up" : "in")}
            >
              {mode === "in" ? t("auth.noAccount") : t("auth.haveAccount")}
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
