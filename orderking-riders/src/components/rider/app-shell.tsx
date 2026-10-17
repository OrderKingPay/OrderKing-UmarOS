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
  Banknote,
  Bike,
  Bot,
  Building2,
  CircleHelp,
  FileCheck2,
  History,
  House,
  MapPin,
  Navigation,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  WifiOff,
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
      <div className="mx-auto min-h-dvh max-w-lg p-4">
        <p className="font-display text-2xl font-bold text-foreground">OrderKing Partner</p>
        <Skeleton className="mt-4 h-16 w-40" />
        <Skeleton className="mt-6 h-48 w-full rounded-xl" />
        <Skeleton className="mt-4 h-24 w-full rounded-xl" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const nav = [
    { to: "/", icon: House, label: t("duty") || "Duty & Orders" },
    { to: "/trips", icon: Navigation, label: t("trips") || "Trips" },
    { to: "/earnings", icon: Banknote, label: t("earnings") || "Earnings & COD" },
    { to: "/settlements", icon: Building2, label: t("payouts") || "Weekly Payouts" },
    { to: "/profile", icon: UserCheck, label: t("profile") || "Profile & Fleet KYC" },
  ] as const;

  const kycStatus = riderProfile?.kycStatus;

  return (
    <div className="min-h-dvh bg-bg text-fg">


      {!geoOk ? (
        <div className="bg-busy px-4 py-2 text-xs sm:text-sm text-primary-foreground">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-medium">
              <MapPin className="size-4 shrink-0" />
              <span>{t("locationUnavailable")}</span>
            </span>
            <button
              type="button"
              disabled={retryingGeo}
              onClick={retryGpsPermission}
              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/20 px-2.5 py-1 text-xs font-bold hover:bg-white/30 transition"
            >
              <RefreshCw className={cn("size-3", retryingGeo && "animate-spin")} />
              <span>{retryingGeo ? "Checking GPS..." : "Re-check GPS"}</span>
            </button>
          </div>
        </div>
      ) : null}

      {kycStatus === "REJECTED" && path !== "/onboarding" ? (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-900">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-4 shrink-0 text-rose-700" />
              <span>
                KYC Requires Correction:{" "}
                {riderProfile?.kycRejectReason || "Please review and re-upload your KYC details."}
              </span>
            </span>
            <Link
              to="/onboarding"
              className="rounded-lg bg-rose-800 px-3 py-1 text-xs font-bold text-white hover:bg-rose-900 transition"
            >
              Update &amp; Resubmit KYC →
            </Link>
          </div>
        </div>
      ) : null}

      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 sm:gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <img
              src={DEFAULT_BRANDING.logoUrl}
              alt=""
              className="size-9 shrink-0 rounded-lg border border-border"
            />
            <div className="min-w-0">
              <p className="truncate font-display text-base sm:text-lg font-bold leading-none text-fg">
                OrderKing Partner
              </p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {riderProfile?.fullName
                  ? `${riderProfile.fullName} · ${DEFAULT_BRANDING.domain}`
                  : DEFAULT_BRANDING.tagline}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <LanguageSelector compact />

            {kycStatus === "VERIFIED" ? (
              <Badge tone="online" className="hidden md:inline-flex items-center gap-1 normal-case">
                <ShieldCheck className="size-3.5" />
                <span>Verified Partner</span>
              </Badge>
            ) : kycStatus === "SUBMITTED" || kycStatus === "UNDER_REVIEW" ? (
              <Link to="/onboarding" className="hidden md:inline-flex">
                <Badge tone="busy" className="items-center gap-1 normal-case hover:opacity-90">
                  <FileCheck2 className="size-3.5" />
                  <span>KYC In Review</span>
                </Badge>
              </Link>
            ) : kycStatus ? (
              <Link to="/onboarding" className="hidden md:inline-flex">
                <Badge tone="offline" className="items-center gap-1 normal-case hover:opacity-90">
                  <AlertTriangle className="size-3.5" />
                  <span>Complete KYC</span>
                </Badge>
              </Link>
            ) : (
              <Badge tone="online" className="hidden md:inline-flex items-center gap-1 normal-case">
                <ShieldCheck className="size-3.5" />
                <span>Verified Fleet</span>
              </Badge>
            )}

            <button
              type="button"
              onClick={() => setSosModalOpen(true)}
              aria-label="OrderKing Emergency SOS 112 Safety Shield"
              title="Emergency SOS 112 - Direct Police, Medical & Fleet Safety Command"
              className="group relative flex items-center gap-1.5 rounded-full border border-red-500/80 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-2.5 sm:px-3 py-1.5 text-white shadow-md shadow-red-600/35 transition-all duration-200 hover:from-red-500 hover:to-rose-600 active:scale-95 shrink-0"
            >
              <span className="absolute -inset-0.5 rounded-full bg-red-500/30 opacity-70 blur-xs animate-ping group-hover:opacity-100 pointer-events-none" />
              <ShieldAlert className="size-4 animate-pulse stroke-[2.5] text-white shrink-0 drop-shadow-xs" />
              <div className="flex flex-col text-left leading-none">
                <span className="text-[11px] font-black tracking-wider uppercase text-white drop-shadow-xs">
                  SOS 112
                </span>
                <span className="text-[8px] font-bold text-rose-200 tracking-tight hidden xs:inline">
                  Safety Shield
                </span>
              </div>
            </button>

            <Link
              to="/assistant"
              className="grid size-9 place-items-center rounded-lg border border-border bg-card hover:bg-muted transition"
              aria-label={t("assistant")}
              title={t("assistant")}
            >
              <Bot className="size-4.5" />
            </Link>

            <Link
              to="/support"
              className="grid size-9 place-items-center rounded-lg border border-border bg-card hover:bg-muted transition"
              aria-label={t("support")}
              title={t("support")}
            >
              <CircleHelp className="size-4.5" />
            </Link>

            <div className="hidden sm:block">
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 px-4 pt-4 pb-28 lg:grid-cols-[1fr_18rem] lg:pb-8">
        <main className="min-w-0">{children}</main>
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-1.5 rounded-xl bg-card p-3 shadow-[var(--shadow-border)]">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition",
                  path === item.to ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}

            <div className="my-2 border-t border-border pt-2 space-y-1.5">
              <Link
                to="/onboarding"
                className={cn(
                  "flex min-h-10 items-center justify-between gap-2 rounded-lg px-3 text-xs font-semibold transition",
                  path === "/onboarding" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <span className="flex items-center gap-2">
                  <FileCheck2 className="size-4" />
                  <span>KYC &amp; Bank Setup</span>
                </span>
                {kycStatus && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-fg">
                    {kycStatus}
                  </span>
                )}
              </Link>

              <Link
                to="/assistant"
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition",
                  path === "/assistant" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <Bot className="size-4" />
                <span>{t("assistant")}</span>
              </Link>

              <Link
                to="/support"
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition",
                  path === "/support" ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <CircleHelp className="size-4" />
                <span>{t("support")}</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* 1-TAP EMERGENCY SOS SAFETY SHEET MODAL */}
      <RiderEmergencySafetySheet
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        riderName={riderProfile?.fullName}
        riderPhone={riderProfile?.phone}
      />

      {/* ULTRA-LUXURIOUS FLOATING DOCKED BOTTOM NAVIGATION */}
      <RiderFloatingBottomNav isDutyOnline={online && geoOk} />
    </div>
  );
}
