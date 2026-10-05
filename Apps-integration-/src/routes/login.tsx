// @ts-nocheck
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthSplash } from "@/components/auth-splash";
import { OrderKingMark } from "@/components/brand/mark";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return <AuthSplash />;
  }
  if (user) return <Navigate to="/" />;

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({ email, password, name });
        if (err) throw new Error(err.message ?? "Could not create account");
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message ?? "Could not sign in");
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh bg-black text-white lg:grid-cols-[1.2fr_1fr] overflow-hidden selection:bg-rose-500/30">
      {/* PREMIUM LEFT SECTION */}
      <section className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex border-r border-white/5 bg-[#0a0a0a]">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[length:32px_32px] opacity-70" />
          <div
            className="absolute -top-[30%] -left-[10%] h-[80%] w-[80%] rounded-full bg-gradient-to-br from-rose-600/30 to-orange-600/10 blur-[150px]"
          />
          <div
            className="absolute -bottom-[20%] right-[0%] h-[70%] w-[70%] rounded-full bg-gradient-to-tl from-purple-600/20 to-rose-900/20 blur-[140px]"
          />
        </div>

        <div className="relative z-10">
          <div
            className="flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600/30 to-orange-600/30 border border-rose-500/20 shadow-[0_0_20px_rgba(225,29,72,0.2)]">
               <OrderKingMark className="size-7 text-rose-400" />
            </div>
            <p className="font-display text-2xl font-bold tracking-tight text-white">OrderKing <span className="text-rose-400 font-light">Global</span></p>
          </div>
        </div>
        
        <div className="relative z-10 max-w-xl">
          <div
          >
            <h1 className="font-display text-5xl leading-[1.1] tracking-tight font-semibold bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent mb-6">
              Command the ecosystem with absolute clarity.
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed font-light">
              The master control plane for orders, restaurants, riders, and capital flows. A unified architecture separating the signal from the noise.
            </p>
          </div>
        </div>
        
        <div className="relative z-10">
          <p
            className="flex items-center gap-2 text-xs font-mono text-zinc-500 tracking-wider uppercase"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            Active Region: Global Headquarters
          </motion.p>
        </div>
      </section>

      {/* RIGHT SECTION: AUTH */}
      <section className="relative flex items-center justify-center p-6 bg-[#030303] overflow-hidden">
        {/* Subtle right side glow */}
        <div className="absolute top-0 right-0 h-full w-full pointer-events-none">
           <div className="absolute top-1/4 right-0 h-[50%] w-[50%] bg-rose-900/10 blur-[120px]" />
        </div>

        <div
          className="relative z-10 w-full max-w-[420px]"
        >
          <div className="mb-8">
            <div className="lg:hidden flex items-center gap-2 mb-6">
              <OrderKingMark className="size-8 text-rose-500" />
              <p className="font-display text-xl font-bold tracking-tight">OrderKing</p>
            </div>
            <h2 className="font-display text-3xl font-bold text-white mb-2">Access Portal</h2>
            <p className="text-sm text-zinc-400">First authentication binds the master administrative account.</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-xl">
            {authEnabled ? (
              <div className="space-y-4">
                <div className="space-y-3">
                  {GROK_PROVIDERS.map((p) => (
                    <Button
                      key={p.providerId}
                      type="button"
                      variant="secondary"
                      className="h-12 w-full border border-white/10 bg-white/5 font-semibold text-white hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] transition-all"
                      onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                    >
                      Continue with {p.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 text-center bg-white/5 p-3 rounded-lg border border-white/10">Authentication currently suspended.</p>
            )}

            <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] font-semibold text-zinc-600">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
              Or manual entry
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
            </div>

            <form className="space-y-4" onSubmit={onEmail}>
              <div>
                {mode === "up" && (
                  <div
                    className="space-y-1.5"
                  >
                    <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 ml-1">Full Legal Name</Label>
                    <Input 
                      className="h-12 rounded-xl border-white/10 bg-black/50 px-4 text-white placeholder:text-zinc-600 focus:border-rose-500 focus:ring-rose-500/20" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 ml-1">Official Email</Label>
                <Input 
                  className="h-12 rounded-xl border-white/10 bg-black/50 px-4 text-white placeholder:text-zinc-600 focus:border-rose-500 focus:ring-rose-500/20" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  autoComplete="username" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 ml-1">Security Key</Label>
                <Input 
                  className="h-12 rounded-xl border-white/10 bg-black/50 px-4 text-white placeholder:text-zinc-600 focus:border-rose-500 focus:ring-rose-500/20 font-mono" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  autoComplete={mode === "up" ? "new-password" : "current-password"} 
                />
              </div>

              <div>
                {error && (
                  <p
                    className="rounded-lg bg-red-500/10 p-3 text-center text-sm font-medium text-red-400 border border-red-500/20"
                  >
                    {error}
                  </motion.p>
                )}
              </div>

              <Button 
                type="submit" 
                className="relative mt-2 h-12 w-full overflow-hidden rounded-xl bg-white font-bold tracking-wide text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:-translate-y-0.5 hover:bg-zinc-200 hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)] active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0" 
                disabled={busy}
              >
                {busy ? (
                  <div className="h-5 w-5 rounded-full border-2 border-black/20 border-t-black" />
                ) : mode === "up" ? "INITIALIZE CLEARANCE" : "AUTHENTICATE SESSION"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button 
                type="button" 
                className="text-xs font-medium text-zinc-500 transition-colors hover:text-white" 
                onClick={() => setMode(mode === "up" ? "in" : "up")}
              >
                {mode === "up" ? "Already cleared? Sign in" : "Require access? Request clearance"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
