// @ts-nocheck
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GROK_PROVIDERS, authEnabled, signIn, authClient } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { OrderKingMark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user } = useCurrentUserState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"in" | "up">("in");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/app" />;

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0] || "Operator",
          callbackURL: "/app",
        });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/app",
        });
        if (err) throw new Error(err.message);
      }
      window.location.href = "/app";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#020202] px-4 py-10 text-zinc-100 selection:bg-emerald-500/30">
      {/* UMAR OS SUPREME COMMAND CENTER BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-[#020202]">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[length:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_80%)] opacity-70" />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15], rotate: [0, 90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[15%] -left-[10%] h-[75%] w-[75%] rounded-full bg-gradient-to-br from-emerald-600/20 via-teal-800/10 to-transparent blur-[150px]"
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.3, 0.1], rotate: [0, -90, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute -bottom-[20%] -right-[10%] h-[80%] w-[80%] rounded-full bg-gradient-to-tl from-cyan-600/20 via-emerald-900/15 to-transparent blur-[160px]"
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 180 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-900/50 to-teal-900/30 p-5 shadow-[0_0_50px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/30 backdrop-blur-2xl"
          >
            <OrderKingMark className="size-16 text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.6)]" />
          </motion.div>
        </div>

        <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-[#050505]/60 p-8 shadow-[0_16px_80px_0_rgba(0,0,0,0.8)] backdrop-blur-3xl ring-1 ring-white/5 sm:p-12">
          {/* Top Glass Shine */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-50" />
          
          <div className="text-center mb-10 relative z-20">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-b from-white via-white/90 to-white/60 bg-clip-text font-display text-4xl font-extrabold tracking-tight text-transparent drop-shadow-sm"
            >
              OrderKing OS
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-3 text-xs font-bold uppercase tracking-[0.3em] text-emerald-400/90 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]"
            >
              Master Orchestrator Protocol
            </motion.p>
          </div>

          {authEnabled ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-5 relative z-20"
            >
              {GROK_PROVIDERS.length > 0 && (
                <div className="space-y-4">
                  {GROK_PROVIDERS.map((p) => (
                    <Button
                      key={p.providerId}
                      type="button"
                      variant="secondary"
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 font-bold tracking-wide text-white transition-all hover:bg-white/10 hover:border-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                      onClick={() => signIn(p.providerId, { callbackURL: "/app" })}
                    >
                      Authenticate with {p.label}
                    </Button>
                  ))}
                  <div className="my-8 flex items-center gap-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-600">
                    <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
                    <span className="bg-[#0a0a0a] px-3 py-1 rounded-full border border-white/5">override</span>
                    <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
                  </div>
                </div>
              )}

              <form className="space-y-5" onSubmit={onEmail}>
                <AnimatePresence mode="popLayout">
                  {mode === "up" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: "auto", scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Label htmlFor="name" className="text-emerald-500/80 ml-2 text-[10px] font-bold uppercase tracking-[0.2em]">Operator Designation</Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        autoComplete="name" 
                        className="mt-2 h-14 rounded-2xl border-white/10 bg-[#0a0a0a]/80 px-5 text-emerald-400 placeholder:text-zinc-700 transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:bg-black"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div>
                  <Label htmlFor="email" className="text-emerald-500/80 ml-2 text-[10px] font-bold uppercase tracking-[0.2em]">Clearance Key (Email)</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="mt-2 h-14 rounded-2xl border-white/10 bg-[#0a0a0a]/80 px-5 text-emerald-400 placeholder:text-zinc-700 transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:bg-black"
                  />
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-emerald-500/80 ml-2 text-[10px] font-bold uppercase tracking-[0.2em]">Passphrase</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "up" ? "new-password" : "current-password"}
                    className="mt-2 h-14 rounded-2xl border-white/10 bg-[#0a0a0a]/80 px-5 text-emerald-400 placeholder:text-zinc-700 transition-all focus:border-emerald-500 focus:ring-emerald-500/20 focus:bg-black font-mono tracking-widest"
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -5 }}
                      className="rounded-xl bg-red-500/10 p-4 text-center text-sm font-bold text-red-400 border border-red-500/20"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button 
                  type="submit" 
                  className="relative mt-6 h-14 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 font-extrabold tracking-[0.15em] text-white shadow-[0_8px_30px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(16,185,129,0.5)] hover:scale-[1.02] active:translate-y-0 active:scale-95" 
                  disabled={busy}
                >
                  <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity hover:opacity-100 mix-blend-overlay" />
                  {busy ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white" />
                  ) : mode === "up" ? "INITIALIZE OPERATOR" : "ACCESS TERMINAL"}
                </Button>
              </form>
              
              <button
                type="button"
                className="mt-8 w-full text-center text-[10px] font-extrabold tracking-[0.2em] uppercase text-zinc-500 transition-colors hover:text-emerald-400"
                onClick={() => setMode(mode === "in" ? "up" : "in")}
              >
                {mode === "in" ? "Request Protocol Access" : "Acknowledge Existing Clearance"}
              </button>
            </motion.div>
          ) : (
            <p className="mt-8 text-center text-sm font-bold text-zinc-500 uppercase tracking-widest">Terminal offline.</p>
          )}
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 text-center"
        >
          <p className="font-mono text-[9px] font-bold text-zinc-600/80 uppercase tracking-[0.3em] drop-shadow-sm">HDmaster Node v100.x.x (Active)</p>
          <div className="mt-4 flex justify-center gap-1">
            <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]"></span>
            <span className="h-1 w-1 rounded-full bg-emerald-500/40"></span>
            <span className="h-1 w-1 rounded-full bg-emerald-500/20"></span>
          </div>
        </motion.div>
      </motion.div>
    </main>
  );
}
