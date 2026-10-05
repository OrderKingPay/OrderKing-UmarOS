
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBrand, useT } from "@/components/providers";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
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
    <main className="relative mx-auto flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#030303] px-5 py-10 selection:bg-primary/30">
      {/* 👑 PREMIUM ANIMATED BACKGROUND - UMAR OS SUPREME */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#030303]">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15], rotate: [0, 90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] h-[70%] w-[70%] rounded-full bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.25, 0.1], rotate: [0, -90, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-[20%] -right-[10%] h-[70%] w-[70%] rounded-full bg-gradient-to-tl from-emerald-500/20 via-cyan-500/10 to-transparent blur-[140px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/40 p-8 pt-10 shadow-[0_8px_40px_0_rgba(0,0,0,0.5)] backdrop-blur-3xl ring-1 ring-white/5 sm:p-12">
          {/* Glassmorphic Shine */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
          
          <div className="flex flex-col items-center text-center relative z-20">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Wordmark />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-8 bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text font-display text-3xl font-bold tracking-tight text-transparent drop-shadow-sm"
            >
              {t("auth.title", { name: brand.appName })}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-2 text-sm font-medium text-zinc-400"
            >
              {t("auth.subtitle")}
            </motion.p>
          </div>

          {authEnabled ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mt-8 space-y-5 relative z-20"
            >
              {/* Viral Growth Hooks: WhatsApp OTP & Truecaller One-Tap */}
              <div className="space-y-3 pb-2">
                <Button
                  type="button"
                  className="group relative w-full h-12 overflow-hidden rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all duration-300"
                  onClick={() => console.log('Initiate WhatsApp OTP flow')}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 font-bold tracking-wide">
                    Sign in with WhatsApp
                  </span>
                  <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                </Button>
                <Button
                  type="button"
                  className="group relative w-full h-12 overflow-hidden rounded-xl border border-[#0052FF]/30 bg-[#0052FF]/10 text-[#0052FF] hover:bg-[#0052FF] hover:text-white hover:shadow-[0_0_20px_rgba(0,82,255,0.4)] transition-all duration-300"
                  onClick={() => console.log('Initiate Truecaller One-Tap flow')}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 font-bold tracking-wide">
                    Truecaller 1-Tap Login
                  </span>
                </Button>
              </div>
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest font-semibold"><span className="bg-[#0c0c0c] px-4 text-zinc-500 rounded-full">Or continue with</span></div>
              </div>

              <div className="space-y-3">
                {GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl border-white/10 bg-white/5 font-bold text-white shadow-sm transition-all hover:bg-white/10 hover:border-white/20 hover:shadow-[0_4px_12px_rgba(255,255,255,0.05)]"
                    onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
                  >
                    {p.idp === "google" ? t("auth.google") : t("auth.x")}
                  </Button>
                ))}
              </div>

              <div className="space-y-4 pt-4">
                <AnimatePresence mode="popLayout">
                  {mode === "up" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: "auto", scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        placeholder={t("auth.name")} 
                        autoComplete="name" 
                        className="h-12 rounded-xl border-white/10 bg-black/50 text-white placeholder:text-zinc-600 transition-all focus:border-primary focus:ring-primary/20"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.email")}
                  autoComplete="email"
                  className="h-12 rounded-xl border-white/10 bg-black/50 text-white placeholder:text-zinc-600 transition-all focus:border-primary focus:ring-primary/20"
                />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.password")}
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                  className="h-12 rounded-xl border-white/10 bg-black/50 text-white placeholder:text-zinc-600 transition-all focus:border-primary focus:ring-primary/20"
                />
                
                <AnimatePresence>
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -5 }}
                      className="text-center text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 py-2 rounded-lg"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button 
                  className="relative mt-2 h-12 w-full overflow-hidden rounded-xl font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_4px_20px_0_rgba(251,191,36,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(251,191,36,0.5)] hover:scale-[1.02] active:translate-y-0 active:scale-95" 
                  disabled={busy || password.length < 8} 
                  onClick={() => void onEmail()}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity hover:opacity-100 mix-blend-overlay" />
                  {busy ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-5 w-5 rounded-full border-2 border-black/30 border-t-black" />
                  ) : mode === "up" ? t("auth.emailSignUp") : t("auth.emailSignIn")}
                </Button>
                
                <button 
                  type="button" 
                  className="mt-4 w-full text-center text-sm font-bold text-zinc-400 transition-colors hover:text-amber-400" 
                  onClick={() => setMode(mode === "up" ? "in" : "up")}
                >
                  {mode === "up" ? t("auth.switchToSignIn") : t("auth.switchToSignUp")}
                </button>
              </div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-center text-sm backdrop-blur-sm"
              >
                <p className="font-bold text-amber-500">👑 {t("auth.phoneSoon")}</p>
                <p className="mt-1 text-xs text-zinc-400 font-medium">{t("auth.phoneSoonHint")}</p>
              </motion.div>
            </motion.div>
          ) : (
            <p className="mt-8 text-center text-sm font-medium text-zinc-500">{t("auth.disabled")}</p>
          )}
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-8 z-10"
      >
        <Link to="/" className="flex items-center gap-2 text-sm font-bold tracking-wide text-zinc-500 transition-colors hover:text-white">
          <span>←</span> Back to {brand.appName}
        </Link>
      </motion.div>
    </main>
  );
}

