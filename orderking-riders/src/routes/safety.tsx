import { getCurrentEcosystemShift, getShiftRemainingMinutes, CANONICAL_THREAT_ZONES } from "@orderking/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardMeta, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEFAULT_CONFIG } from "@/lib/rider/config";
import { errorMessage } from "@/lib/client/errors";
import { useI18n } from "@/lib/rider/i18n-context";
import { bootstrapRiderFn, getHomeFn, reportSafetyFn } from "@/lib/server/rider-fns";
import type { Delivery, RiderProfile, SafetyIncident, SafetyKind } from "@/lib/rider/types";
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  HeartPulse,
  MapPin,
  Phone,
  Share2,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/safety")({ component: Page });

const KINDS: SafetyKind[] = [
  "UNSAFE_SITUATION",
  "ROAD_BLOCKAGE",
  "ACCIDENT",
  "CUSTOMER_ISSUE",
  "RESTAURANT_ISSUE",
  "PLATFORM_SUPPORT",
];

const QUICK_INCIDENT_NOTES: ReadonlyArray<string> = [
  "Vehicle tyre puncture / mechanical breakdown on route",
  "Minor roadside incident — safe on shoulder, need order reassignment",
  "Road blocked / heavy waterlogging — unable to pass safely",
  "Unsafe drop location / unlit lane — requesting customer at gate",
];

const PROTOCOL_STEPS: ReadonlyArray<{ step: string; title: string; detail: string }> = [
  {
    step: "Step 1",
    title: "Move to Immediate Roadside Safety",
    detail:
      "Pull over away from moving traffic, switch on vehicle hazard indicators, and prioritize personal physical safety over active food packages.",
  },
  {
    step: "Step 2",
    title: "Dial Emergency Medical / Police Response (112 / 108 / 100)",
    detail:
      "Use the 1-tap emergency dialers above to reach National Emergency (112), Medical Ambulance (108), Police Control Room (100), or your personal emergency contact.",
  },
  {
    step: "Step 3",
    title: "Log SOS Incident for Order Reassignment & Protection",
    detail:
      "Select ACCIDENT, ROAD BLOCKAGE, or UNSAFE SITUATION below to attach your current GPS coordinates and active order ID. Active deliveries are reassigned without cancellation or rating impact.",
  },
  {
    step: "Step 4",
    title: "Medical Assistance & Hospitalization Documentation",
    detail:
      "Retain hospital admission slips, medical bills, and police GD/FIR records if applicable, and share them with Rider Support for statutory welfare and insurance assistance.",
  },
];

function Page() {
  const { t } = useI18n();
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [activeDelivery, setActiveDelivery] = useState<Delivery | null>(null);

  const [note, setNote] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loggedIncidents, setLoggedIncidents] = useState<SafetyIncident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [liveGps, setLiveGps] = useState<{
    lat: number;
    lng: number;
    accuracyM: number | null;
    fetchedAt: string;
  } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [copiedGps, setCopiedGps] = useState(false);

  useEffect(() => {
    void bootstrapRiderFn().then(setRider).catch(() => undefined);
    void getHomeFn()
      .then((h) => setActiveDelivery(h.active))
      .catch(() => undefined);
  }, []);

  async function fetchCurrentGps(): Promise<{ lat: number | null; lng: number | null }> {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return { lat: null, lng: null };
    }
    setGpsLoading(true);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          const coords = {
            lat: Number(p.coords.latitude.toFixed(6)),
            lng: Number(p.coords.longitude.toFixed(6)),
            accuracyM: p.coords.accuracy ? Math.round(p.coords.accuracy) : null,
            fetchedAt: new Date().toLocaleTimeString("en-IN"),
          };
          setLiveGps(coords);
          setGpsLoading(false);
          resolve({ lat: coords.lat, lng: coords.lng });
        },
        () => {
          setGpsLoading(false);
          resolve({ lat: null, lng: null });
        },
        { enableHighAccuracy: true, timeout: 4000 },
      );
    });
  }

  async function report(kind: SafetyKind) {
    setSubmitting(true);
    try {
      const coords = liveGps
        ? { lat: liveGps.lat, lng: liveGps.lng }
        : await fetchCurrentGps();
      const row = await reportSafetyFn({
        data: {
          kind,
          note:
            note.trim() ||
            (activeDelivery
              ? `${kind.replaceAll("_", " ")} reported during Order #${activeDelivery.orderCode}`
              : `${kind.replaceAll("_", " ")} reported by rider on duty`),
          deliveryId: activeDelivery?.id ?? null,
          lat: coords.lat,
          lng: coords.lng,
        },
      });
      setStatus(row.id);
      setLoggedIncidents((prev) => [row, ...prev]);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, t("actionNotConfirmed")));
    } finally {
      setSubmitting(false);
    }
  }

  const mapsPinUrl = liveGps
    ? `https://maps.google.com/?q=${liveGps.lat},${liveGps.lng}`
    : null;

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl">{t("safety")}</h1>
          <Badge tone="online">24x7 SOS</Badge>
        </div>

        {/* Dynamic Shift Boundaries & Real-Time Safety Exclusion Zones */}
        <Card className="space-y-3 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <CardTitle className="text-base">
                Operational Shift: {getCurrentEcosystemShift().name}
              </CardTitle>
            </div>
            <Badge tone={getCurrentEcosystemShift().type === "LATE_NIGHT" ? "busy" : getCurrentEcosystemShift().type === "EVENING" ? "cod" : "online"}>
              Max Radius: {getCurrentEcosystemShift().maxRadiusKm} km
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>
              Shift Window: {getCurrentEcosystemShift().startHour}:00 &ndash; {getCurrentEcosystemShift().endHour}:00 IST ({getShiftRemainingMinutes()} mins remaining)
            </span>
            <span className="font-mono text-[10px] uppercase font-bold text-amber-500">
              Threat Level: {getCurrentEcosystemShift().threatLevel}
            </span>
          </div>

          {/* Active Canonical Safety Threat & Exclusion Zones */}
          <div className="space-y-2 pt-1 border-t border-border/50">
            <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-amber-500" />
              <span>Active Threat Exclusion Zones (Current Shift)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CANONICAL_THREAT_ZONES.filter((tz) => tz.activeShifts.includes(getCurrentEcosystemShift().type)).map((tz) => (
                <div key={tz.id} className="rounded-xl border border-border/80 bg-muted/40 p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-foreground">{tz.name}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-extrabold shrink-0 ${tz.threatLevel === "EXCLUSION_CURFEW" ? "bg-destructive/20 text-destructive" : "bg-amber-500/20 text-amber-500"}`}>
                      {tz.threatLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{tz.advisoryNote}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* 1-Tap Statutory Emergency Helplines & Personal Emergency Contact */}
        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="size-5 text-destructive" />
                {t("emergency")}
              </CardTitle>
              <CardMeta className="mt-1">{t("emergencyNote")}</CardMeta>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <Button asChild size="lg" variant="destructive" className="w-full">
              <a href="tel:112">
                <Phone className="size-4" />
                112 · National SOS
              </a>
            </Button>
            <Button asChild size="lg" variant="destructive" className="w-full">
              <a href="tel:108">
                <HeartPulse className="size-4" />
                108 · Ambulance
              </a>
            </Button>
            <Button asChild size="lg" variant="destructive" className="w-full">
              <a href="tel:100">
                <Phone className="size-4" />
                100 · Police
              </a>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button asChild variant="outline" className="w-full">
              <a href={`tel:${DEFAULT_CONFIG.supportPhone}`}>
                <Phone className="size-4" />
                {t("support")} ({DEFAULT_CONFIG.supportPhone})
              </a>
            </Button>

            {rider?.emergencyPhone ? (
              <Button asChild variant="outline" className="w-full border-primary/40">
                <a href={`tel:${rider.emergencyPhone}`}>
                  <UserCheck className="size-4 text-primary" />
                  ICE: {rider.emergencyName || "Emergency Contact"} ({rider.emergencyPhone})
                </a>
              </Button>
            ) : (
              <Button asChild variant="outline" className="w-full">
                <Link to="/profile">
                  <UserCheck className="size-4" />
                  Add Personal Emergency Contact
                </Link>
              </Button>
            )}
          </div>
        </Card>

        {/* Live GPS Coordinate Finder & 1-Tap Copy/Share */}
        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <MapPin className="size-4" />
              </span>
              <div>
                <CardTitle className="text-base">Live Roadside GPS Coordinates</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Fetch and share exact coordinates with emergency responders or roadside assistance
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={gpsLoading}
              onClick={() => void fetchCurrentGps()}
            >
              {gpsLoading ? "Locating..." : liveGps ? "Refresh GPS" : "Fetch My GPS"}
            </Button>
          </div>

          {liveGps ? (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono font-semibold text-foreground">
                  Lat: {liveGps.lat}, Lng: {liveGps.lng}
                  {liveGps.accuracyM ? ` (±${liveGps.accuracyM}m)` : ""}
                </span>
                <span className="text-muted-foreground">Fetched at {liveGps.fetchedAt}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const text = `OrderKing Rider Emergency Location: ${liveGps.lat}, ${liveGps.lng} — ${mapsPinUrl}`;
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      void navigator.clipboard.writeText(text);
                      setCopiedGps(true);
                      window.setTimeout(() => setCopiedGps(false), 2500);
                    }
                  }}
                >
                  <Copy className="size-3.5" />
                  {copiedGps ? "Copied GPS Link" : "Copy Coordinates & Map Link"}
                </Button>
                {mapsPinUrl ? (
                  <a
                    href={mapsPinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-primary underline"
                  >
                    Open in Google Maps <ExternalLink className="size-3" />
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </Card>

        {/* Live Incident Logger */}
        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">Log On-Duty Safety / SOS Incident</CardTitle>
              <CardMeta className="mt-1">
                Captures your current GPS coordinates and creates an audited safety incident ticket for operations response.
              </CardMeta>
            </div>
            {activeDelivery ? (
              <Badge tone="busy">Order #{activeDelivery.orderCode}</Badge>
            ) : null}
          </div>

          <Button
            variant="outline"
            className="w-full"
            disabled={submitting}
            onClick={() => {
              const url = mapsPinUrl ?? window.location.origin;
              if (navigator.share) {
                void navigator.share({
                  title: "Order King Rider Emergency Location",
                  text: liveGps
                    ? `Rider GPS: ${liveGps.lat}, ${liveGps.lng}`
                    : "Order King Rider Location",
                  url,
                });
              } else {
                void report("SHARE_LOCATION");
              }
            }}
          >
            <Share2 className="size-4" />
            {t("shareLocation")}
          </Button>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Quick Roadside Note Templates (1-Tap Fill):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_INCIDENT_NOTES.map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => setNote(tpl)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] text-left transition ${
                    note === tpl
                      ? "border-primary bg-primary/15 font-semibold text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {tpl}
                </button>
              ))}
            </div>
          </div>

          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("message")}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {KINDS.map((k) => (
              <Button
                key={k}
                variant="outline"
                className="w-full"
                disabled={submitting}
                onClick={() => void report(k)}
              >
                {k.replaceAll("_", " ")}
              </Button>
            ))}
          </div>

          {status ? (
            <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
              {t("ticketRef")} #{status.slice(0, 8)} logged with GPS timestamp.
            </p>
          ) : null}
          {error ? <p className="text-sm text-offline">{error}</p> : null}

          {loggedIncidents.length > 0 ? (
            <div className="border-t border-border pt-2.5 space-y-1.5 text-xs">
              <p className="font-semibold text-foreground">Logged Incidents in Current Session:</p>
              <ul className="space-y-1">
                {loggedIncidents.map((inc) => (
                  <li
                    key={inc.id}
                    className="rounded border border-border bg-muted/20 px-2.5 py-1.5 flex items-center justify-between"
                  >
                    <span>
                      <strong>{inc.kind.replaceAll("_", " ")}</strong> · #{inc.id.slice(0, 8)}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {new Date(inc.createdAt).toLocaleTimeString("en-IN")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        {/* OrderKing Partner Standard Accident & Medical Assistance Protocol */}
        <Card className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-4" />
              </span>
              <div>
                <CardTitle className="text-base">
                  Accident &amp; Medical Assistance Protocol
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Standard operating procedure for delivery partners on active duty
                </p>
              </div>
            </div>
            <Badge tone="busy">Duty SOP</Badge>
          </div>

          <div className="space-y-2.5 pt-1">
            {PROTOCOL_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-border bg-muted/20 p-3 space-y-1 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                    {item.step}
                  </span>
                  <span className="font-semibold text-foreground">{item.title}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
