import { Link, useRouterState } from "@tanstack/react-router";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useI18n } from "@/lib/rider/i18n-context";
import { DEFAULT_BRANDING } from "@/lib/rider/config";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  Bike,
  CircleHelp,
  History,
  House,
  Shield,
  Sparkles,
  WifiOff,
  MapPinOff,
  Zap
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const { t } = useI18n();
  const [online, setOnline] = useState(true);
  const [geoOk, setGeoOk] = useState(true);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    const handler = (ev: Event) => {
      const d = (ev as CustomEvent<{ ok: boolean }>).detail;
      setGeoOk(d.ok);
    };
    window.addEventListener("orderking-geo", handler);
    return () => window.removeEventListener("orderking-geo", handler);
  }, []);

  if (isPending) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg p-6 bg-[#0a0a0a] flex flex-col justify-center items-center">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-16 w-16 bg-fuchsia-600/20 rounded-2xl flex items-center justify-center border border-fuchsia-500/30">
            <Bike className="size-8 text-fuchsia-500" />
          </div>
          <div className="h-1 w-32 bg-fuchsia-900/30 rounded-full overflow-hidden">
             <motion.div 
               animate={{ x: ["-100%", "200%"] }} 
               transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
               className="h-full w-1/2 bg-fuchsia-500 rounded-full shadow-[0_0_10px_rgba(217,70,239,0.8)]"
             />
          </div>
        </motion.div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const nav = [
    { to: "/", icon: House, label: t("home") },
    { to: "/earnings", icon: Banknote, label: t("earnings") },
    { to: "/history", icon: History, label: t("history") },
    { to: "/safety", icon: Shield, label: t("safety") },
    { to: "/profile", icon: Bike, label: t("profile") },
  ] as const;

  return (
    <div className="min-h-dvh bg-[#050505] text-zinc-100 font-sans selection:bg-fuchsia-500/30 flex flex-col overflow-x-hidden">
      
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-fuchsia-600/10 blur-[100px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-64 bg-violet-600/10 blur-[120px]" />
      </div>

      {/* DYNAMIC ISLAND SYSTEM BANNERS */}
      <AnimatePresence>
        {(!online || !geoOk) && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-2 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none"
          >
            {!online && (
              <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-full text-red-500 text-[11px] font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(239,68,68,0.2)]">
                <WifiOff className="size-3.5" />
                {t("connectionLost")}
              </div>
            )}
            {!geoOk && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 backdrop-blur-xl border border-amber-500/20 rounded-full text-amber-500 text-[11px] font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(245,158,11,0.2)]">
                <MapPinOff className="size-3.5" />
                {t("locationUnavailable")}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <header className="relative z-30 mx-auto w-full max-w-5xl flex items-center justify-between px-4 py-3 md:py-4">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-600 to-violet-600 shadow-[0_0_15px_rgba(217,70,239,0.3)] transition-transform group-hover:scale-105">
            <Bike className="size-6 text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-500 border-2 border-[#050505]" />
          </div>
          <div>
            <p className="font-display text-lg font-black tracking-tight text-white leading-none">
              {DEFAULT_BRANDING.riderFacingBrand}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-400 mt-1">
              Active Duty
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link 
            to="/support" 
            className="flex size-10 items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors" 
            aria-label={t("support")}
          >
            <CircleHelp className="size-5 text-zinc-300" />
          </Link>
          <div className="hidden sm:block">
            <UserButton />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto grid w-full max-w-5xl flex-1 gap-6 px-4 pb-28 pt-2 lg:grid-cols-[1fr_20rem] lg:pb-8">
        <main className="min-w-0">
           <AnimatePresence mode="wait">
             <motion.div
               key={path}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 10 }}
               transition={{ duration: 0.3 }}
             >
               {children}
             </motion.div>
           </AnimatePresence>
        </main>

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
            <div className="mb-4 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Rider Console</div>
            <nav className="space-y-1.5">
              {nav.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "group relative flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-bold transition-all",
                    path === item.to 
                      ? "bg-fuchsia-600 text-white shadow-[0_4px_20px_rgba(217,70,239,0.3)]" 
                      : "text-zinc-400 hover:bg-white/10 hover:text-zinc-100",
                  )}
                >
                  <item.icon className={cn("size-5 transition-transform", path === item.to ? "scale-110" : "group-hover:scale-110")} />
                  {item.label}
                  {path === item.to && (
                    <motion.div 
                      layoutId="rider-desktop-nav"
                      className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white" 
                    />
                  )}
                </Link>
              ))}
            </nav>
            <div className="mt-6 pt-6 border-t border-white/10">
               <Link to="/assistant" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600/20 to-violet-600/20 border border-fuchsia-500/30 px-4 text-sm font-bold text-fuchsia-300 hover:bg-fuchsia-600/30 transition-all">
                 <Sparkles className="size-4" />
                 {t("assistant")}
               </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* PREMIUM MOBILE BOTTOM NAVIGATION */}
      <nav className="fixed inset-x-0 bottom-0 z-50 lg:hidden pointer-events-none px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-md pointer-events-auto">
          <div className="rounded-full border border-white/10 bg-black/80 backdrop-blur-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.5)] p-1.5">
            <ul className="grid grid-cols-5 items-center relative">
              {nav.map((item) => {
                const isActive = path === item.to;
                return (
                  <li key={item.to} className="relative z-10">
                    <Link
                      to={item.to}
                      className="flex min-h-14 flex-col items-center justify-center gap-1 relative z-10"
                    >
                      <motion.div 
                        animate={{ 
                           y: isActive ? -12 : 0,
                           scale: isActive ? 1.1 : 1,
                        }}
                        className={cn(
                          "flex items-center justify-center transition-colors duration-300 rounded-full",
                          isActive ? "bg-fuchsia-600 text-white shadow-[0_4px_15px_rgba(217,70,239,0.5)] p-3 border-4 border-[#050505]" : "text-zinc-500 p-2"
                        )}
                      >
                        <item.icon className="size-5" strokeWidth={isActive ? 2.5 : 2} />
                      </motion.div>
                      
                      <motion.span 
                        animate={{ opacity: isActive ? 1 : 0.7, y: isActive ? -4 : 0 }}
                        className={cn(
                          "absolute bottom-1 text-[9px] font-bold tracking-wider uppercase whitespace-nowrap",
                          isActive ? "text-fuchsia-400" : "text-zinc-500"
                        )}
                      >
                        {item.label}
                      </motion.span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}
