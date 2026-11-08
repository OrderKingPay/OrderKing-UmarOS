import { Link, useRouterState } from "@tanstack/react-router";
import { RedirectToSignIn, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useI18n } from "@/lib/rider/i18n-context";
import { DEFAULT_BRANDING } from "@/lib/rider/config";
import { LanguageSelector } from "@/components/rider/language-selector";
import { bootstrapRiderFn } from "@/lib/server/rider-fns";
import type { RiderProfile } from "@/lib/rider/types";
import { RiderFloatingBottomNav } from "@/components/navigation/rider-bottom-nav";
import { RiderEmergencySafetySheet } from "@/components/rider/rider-emergency-sos";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Bot,
  CircleHelp,
  FileCheck2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const { t } = useI18n();
  const [online, setOnline] = useState(true);
  const [geoOk, setGeoOk] = useState(true);
  const [retryingGeo, setRetryingGeo] = useState(false);
  const [riderProfile, setRiderProfile] = useState<RiderProfile | null>(null);
  const [sosModalOpen, setSosModalOpen] = useState(false);
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

  useEffect(() => {
    if (!user) return;
    void bootstrapRiderFn()
      .then(setRiderProfile)
      .catch(() => undefined);
  }, [user, path]);

  function retryGpsPermission() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    setRetryingGeo(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setGeoOk(true);
        setRetryingGeo(false);
        window.dispatchEvent(new CustomEvent("orderking-geo", { detail: { ok: true } }));
      },
      () => {
        setGeoOk(false);
        setRetryingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  if (isPending) {
    return (
      <div className="mx-auto min-h-dvh max-w-md p-4 bg-white dark:bg-card">
        <p className="font-display text-2xl font-bold text-foreground">OrderKing Delivery Partner</p>
        <Skeleton className="mt-4 h-16 w-40" />
        <Skeleton className="mt-6 h-48 w-full rounded-xl" />
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const kycStatus = riderProfile?.kycStatus;

  return (
    <div className="min-h-dvh bg-slate-100/70 dark:bg-zinc-950 text-fg">
      <div className="mx-auto min-h-dvh max-w-md bg-white dark:bg-card shadow-2xl relative flex flex-col pb-24 border-x border-border/40">
        {!geoOk ? (
          <div className="bg-busy px-3 py-2 text-xs text-primary-foreground">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-medium">
                <MapPin className="size-4 shrink-0" />
                <span>{t("locationUnavailable")}</span>
              </span>
              <button
                type="button"
                disabled={retryingGeo}
                onClick={retryGpsPermission}
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-xs font-bold hover:bg-white/30 transition"
              >
                <RefreshCw className={cn("size-3", retryingGeo && "animate-spin")} />
                <span>{retryingGeo ? "Checking GPS..." : "Re-check GPS"}</span>
              </button>
            </div>
          </div>
        ) : null}

        {kycStatus === "REJECTED" && path !== "/onboarding" ? (
          <div className="border-b border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="size-4 shrink-0 text-rose-700" />
                <span>
                  KYC Requires Correction:{" "}
                  {riderProfile?.kycRejectReason || "Please review and re-upload your KYC details."}
                </span>
              </span>
              <Link
                to="/onboarding"
                className="rounded-lg bg-rose-800 px-2.5 py-1 text-xs font-bold text-white hover:bg-rose-900 transition"
              >
                Update KYC →
              </Link>
            </div>
          </div>
        ) : null}

        {/* Top Header - Mobile Optimized Parity with Benchmark Partner */}
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <Link to="/" className="flex items-center gap-2.5 min-w-0">
              <img
                src={DEFAULT_BRANDING.logoUrl}
                alt=""
                className="size-8.5 shrink-0 rounded-lg border border-border"
              />
              <div className="min-w-0">
                <p className="truncate font-display text-sm font-bold leading-none text-fg">
                  OrderKing Delivery Partner
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {riderProfile?.fullName || "Delivery Partner"}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-1.5 shrink-0">
              <LanguageSelector compact />

              <button
                type="button"
                onClick={() => setSosModalOpen(true)}
                aria-label="Emergency SOS 112"
                title="Emergency SOS 112"
                className="group relative flex items-center gap-1 rounded-full border border-red-500/80 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-2 py-1 text-white shadow-xs transition-all duration-200 active:scale-95 shrink-0"
              >
                <ShieldAlert className="size-3.5 stroke-[2.5] text-white shrink-0 drop-shadow-xs" />
                <span className="text-[10px] font-black tracking-wider uppercase text-white drop-shadow-xs">
                  SOS 112
                </span>
              </button>

              <Link
                to="/assistant"
                className="grid size-8 place-items-center rounded-lg border border-border bg-card hover:bg-muted transition"
                aria-label={t("assistant")}
                title={t("assistant")}
              >
                <Bot className="size-4" />
              </Link>

              <Link
                to="/support"
                className="grid size-8 place-items-center rounded-lg border border-border bg-card hover:bg-muted transition"
                aria-label={t("support")}
                title={t("support")}
              >
                <CircleHelp className="size-4" />
              </Link>

              <UserButton />
            </div>
          </div>
        </header>

        {/* Clean Centered Mobile Content Body */}
        <main className="min-w-0 flex-1 p-3.5 space-y-4">{children}</main>

        {/* 1-TAP EMERGENCY SOS SAFETY SHEET MODAL */}
        <RiderEmergencySafetySheet
          isOpen={sosModalOpen}
          onClose={() => setSosModalOpen(false)}
          riderName={riderProfile?.fullName}
          riderPhone={riderProfile?.phone}
        />

        {/* ULTRA-LUXURIOUS DOCKED BOTTOM NAVIGATION (All 5 Benchmark Tabs) */}
        <RiderFloatingBottomNav isDutyOnline={online && geoOk} />
      </div>
    </div>
  );
}
