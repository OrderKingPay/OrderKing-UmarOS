import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { errorMessage, newIdempotencyKey } from "@/lib/client/errors";
import { haversineKm } from "@/lib/rider/eta";
import {
  formatPaise,
  STATUTORY_BASE_DISTANCE_KM,
  STATUTORY_BASE_FARE_PAISE,
  STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
} from "@/lib/rider/money";
import { useI18n } from "@/lib/rider/i18n-context";
import type { Delivery } from "@/lib/rider/types";
import { createTicketFn, getHistoryFn, getPerformanceFn } from "@/lib/server/rider-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Clock3,
  Download,
  ExternalLink,
  FileQuestion,
  MapPin,
  Route as RouteIcon,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  OPERATIONAL_SHIFT_SLOTS,
  BOOKED_GIGS_STORAGE_KEY,
  getIsoDateOffset,
} from "@/lib/rider/shift-slots";

export const Route = createFileRoute("/history")({ component: Page });

const formatINR = formatPaise;

type HistoryRow = Awaited<ReturnType<typeof getHistoryFn>>[number];
type StatusFilter = "ALL" | "DELIVERED" | "CANCELLED" | "COD";

function getTripDistanceKm(d: Delivery, recordedPayoutPaise: number): number {
  const hasPickupCoords = d.pickupLocation.lat !== 0 || d.pickupLocation.lng !== 0;
  const hasDropCoords = d.dropLocation.lat !== 0 || d.dropLocation.lng !== 0;
  if (hasPickupCoords && hasDropCoords) {
    const gpsKm = haversineKm(d.pickupLocation, d.dropLocation);
    if (Number.isFinite(gpsKm) && gpsKm >= 0.1) {
      return Math.round(gpsKm * 10) / 10;
    }
  }
  const grossPaise = recordedPayoutPaise || d.expectedPayoutPaise;
  const extraPaise = Math.max(0, grossPaise - STATUTORY_BASE_FARE_PAISE);
  const derivedKm =
    STATUTORY_BASE_DISTANCE_KM + extraPaise / STATUTORY_DISTANCE_RATE_PER_KM_PAISE;
  return Math.round(derivedKm * 10) / 10;
}

function getTripDurationMinutes(d: Delivery, distanceKm: number): number {
  const startMs = new Date(d.createdAt).getTime();
  const endIso = d.deliveredAt ?? d.updatedAt;
  const endMs = endIso ? new Date(endIso).getTime() : NaN;
  if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs) {
    const diffMins = Math.round((endMs - startMs) / 60_000);
    if (diffMins >= 1 && diffMins <= 240) {
      return diffMins;
    }
  }
  return Math.max(8, Math.round(distanceKm * 4.5));
}

export function Page() {
  const { t } = useI18n();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [activeTab, setActiveTab] = useState<"gigs" | "trips">(() =>
    path === "/history" ? "trips" : "gigs",
  );

  const [selectedShiftDay, setSelectedShiftDay] = useState<"today" | "tomorrow">("today");
  const [bookedSlotsByDay, setBookedSlotsByDay] = useState<Record<string, string[]>>({});

  const todayIso = getIsoDateOffset(0);
  const tomorrowIso = getIsoDateOffset(1);
  const activeShiftDateIso = selectedShiftDay === "today" ? todayIso : tomorrowIso;
  const activeDayBookedSlots = bookedSlotsByDay[activeShiftDateIso] ?? [];

  useEffect(() => {
    try {
      const nextBooked: Record<string, string[]> = {};
      for (const dateKey of [todayIso, tomorrowIso]) {
        const raw = window.localStorage.getItem(`${BOOKED_GIGS_STORAGE_KEY}_${dateKey}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            nextBooked[dateKey] = parsed.filter((x): x is string => typeof x === "string");
          }
        }
      }
      setBookedSlotsByDay(nextBooked);
    } catch {
      // Ignore storage errors in restricted webviews
    }
  }, [todayIso, tomorrowIso]);

  function toggleSlotBooking(slotId: string) {
    const current = bookedSlotsByDay[activeShiftDateIso] ?? [];
    const exists = current.includes(slotId);
    const updated = exists ? current.filter((x) => x !== slotId) : [...current, slotId];
    setBookedSlotsByDay((prev) => ({ ...prev, [activeShiftDateIso]: updated }));
    try {
      window.localStorage.setItem(
        `${BOOKED_GIGS_STORAGE_KEY}_${activeShiftDateIso}`,
        JSON.stringify(updated),
      );
    } catch {
      // Ignore storage errors
    }
    const slot = OPERATIONAL_SHIFT_SLOTS.find((s) => s.id === slotId);
    if (!exists) {
      toast.success(
        `Gig Booked: ${slot?.label || slotId} (${slot?.window || activeShiftDateIso}).`,
      );
    } else {
      toast.info(`Gig Cancelled: ${slot?.label || slotId} slot released.`);
    }
  }

  const bookedHoursTotal = activeDayBookedSlots.reduce((acc, slotId) => {
    const s = OPERATIONAL_SHIFT_SLOTS.find((x) => x.id === slotId);
    return acc + (s?.durationHours ?? 0);
  }, 0);

  const [preset, setPreset] = useState<"today" | "yesterday" | "week" | "month">("week");
  const [trips, setTrips] = useState<Awaited<ReturnType<typeof getHistoryFn>>>([]);
  const [perf, setPerf] = useState<Awaited<ReturnType<typeof getPerformanceFn>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [queryTripId, setQueryTripId] = useState<string | null>(null);
  const [queryNote, setQueryNote] = useState("");
  const [queryBusy, setQueryBusy] = useState(false);
  const [queryTicketRef, setQueryTicketRef] = useState<string | null>(null);

  useEffect(() => {
    void getHistoryFn({ data: { preset } })
      .then(setTrips)
      .catch((e: unknown) => setError(errorMessage(e, t("connectionLostBody"))));
    void getPerformanceFn().then(setPerf).catch(() => undefined);
  }, [preset, t]);

  const tripSummary = useMemo(() => {
    let completedCount = 0;
    let cancelledCount = 0;
    let codCount = 0;
    let totalDistanceKm = 0;
    let totalBasePaise = 0;
    let totalDistancePaise = 0;
    let totalIncentivePaise = 0;
    let totalTipPaise = 0;
    let totalAdjustmentPaise = 0;

    for (const r of trips) {
      const d = r.delivery;
      if (d.cod) codCount += 1;
      if (d.state === "DELIVERED") {
        completedCount += 1;
        const distKm = getTripDistanceKm(d, r.payout);
        totalDistanceKm += distKm;
        const grossOrderPayout = r.payout || d.expectedPayoutPaise;
        const basePaise = Math.min(STATUTORY_BASE_FARE_PAISE, grossOrderPayout);
        const distancePaise = Math.max(0, grossOrderPayout - basePaise);
        totalBasePaise += basePaise;
        totalDistancePaise += distancePaise;
        totalIncentivePaise += r.incentive;
        totalTipPaise += d.tipPaise ?? 0;
      } else if (
        d.state === "RIDER_CANCELLED" ||
        d.state === "ORDER_CANCELLED" ||
        d.state === "DELIVERY_FAILED"
      ) {
        cancelledCount += 1;
      }
      totalAdjustmentPaise += r.adjustment;
    }

    const totalEarningsPaise =
      totalBasePaise +
      totalDistancePaise +
      totalIncentivePaise +
      totalTipPaise +
      totalAdjustmentPaise;

    return {
      completedCount,
      cancelledCount,
      codCount,
      totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
      totalBasePaise,
      totalDistancePaise,
      totalIncentivePaise,
      totalTipPaise,
      totalAdjustmentPaise,
      totalEarningsPaise,
    };
  }, [trips]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return trips.filter((r) => {
      const d = r.delivery;
      const state = d.state;
      if (statusFilter === "DELIVERED" && state !== "DELIVERED") return false;
      if (
        statusFilter === "CANCELLED" &&
        state !== "RIDER_CANCELLED" &&
        state !== "ORDER_CANCELLED" &&
        state !== "DELIVERY_FAILED"
      ) {
        return false;
      }
      if (statusFilter === "COD" && !d.cod) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        d.orderCode,
        d.restaurant.name,
        d.restaurant.area,
        d.customer.area,
        d.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [trips, searchQuery, statusFilter]);

  function exportTripsCsv() {
    if (filteredRows.length === 0) return;
    const headers = [
      "Order Code",
      "Created At (ISO)",
      "Delivered At (ISO)",
      "Restaurant",
      "Pickup Area",
      "Drop Area",
      "Distance (km)",
      "Duration (min)",
      "State",
      "Base Fare (INR)",
      "Distance Component (INR)",
      "Wait & Incentive Bonus (INR)",
      "Tip (INR)",
      "Adjustment / Cancel Penalty (INR)",
      "Total Trip Payout (INR)",
      "Total Trip Payout (Paise)",
      "COD Amount (INR)",
    ];
    const csvRows = filteredRows.map((r) => {
      const d = r.delivery;
      const isDelivered = d.state === "DELIVERED";
      const distKm = getTripDistanceKm(d, r.payout);
      const durationMin = getTripDurationMinutes(d, distKm);
      const grossOrderPayout = isDelivered ? r.payout || d.expectedPayoutPaise : 0;
      const basePaise = isDelivered ? Math.min(STATUTORY_BASE_FARE_PAISE, grossOrderPayout) : 0;
      const distancePaise = isDelivered ? Math.max(0, grossOrderPayout - basePaise) : 0;
      const tipPaise = d.tipPaise ?? 0;
      const totalPaise = grossOrderPayout + r.incentive + r.adjustment + tipPaise;
      return [
        d.orderCode,
        d.createdAt,
        d.deliveredAt ?? "",
        `"${(d.restaurant.name ?? "").replaceAll('"', '""')}"`,
        `"${(d.restaurant.area ?? "").replaceAll('"', '""')}"`,
        `"${(d.customer.area ?? "").replaceAll('"', '""')}"`,
        distKm.toFixed(1),
        String(durationMin),
        d.state,
        (basePaise / 100).toFixed(2),
        (distancePaise / 100).toFixed(2),
        (r.incentive / 100).toFixed(2),
        (tipPaise / 100).toFixed(2),
        (r.adjustment / 100).toFixed(2),
        (totalPaise / 100).toFixed(2),
        String(totalPaise),
        d.cod ? (d.codAmountPaise / 100).toFixed(2) : "0.00",
      ].join(",");
    });

    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orderking-trip-history-${preset}-${statusFilter.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function submitTripQuery(row: HistoryRow) {
    setQueryBusy(true);
    try {
      const d = row.delivery;
      const ticket = await createTicketFn({
        data: {
          topic: "PAYMENT_ISSUE",
          deliveryId: d.id,
          message: `[Order #${d.orderCode}] ${queryNote.trim() ||
            "Please verify the base, distance, and wait-time payout for this trip."
            }`,
          idempotencyKey: newIdempotencyKey(),
        },
      });
      setQueryTicketRef(ticket.id.slice(0, 8));
      setQueryTripId(null);
      setQueryNote("");
    } catch (e: unknown) {
      setError(errorMessage(e, t("actionNotConfirmed")));
    } finally {
      setQueryBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Segmented Tab Bar: Shifts vs Past Orders */}
        <div className="grid grid-cols-2 rounded-xl bg-muted/70 p-1 border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("gigs")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition",
              activeTab === "gigs"
                ? "bg-white dark:bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <CalendarClock className="size-4" />
            <span>Shifts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("trips")}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition",
              activeTab === "trips"
                ? "bg-white dark:bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <RouteIcon className="size-4" />
            <span>Past Orders</span>
          </button>
        </div>

        {activeTab === "gigs" ? (
          <Card className="space-y-3.5 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-red-50 text-[#E23744] border border-red-200">
                  <CalendarClock className="size-5" />
                </span>
                <div>
                  <CardTitle className="text-base font-bold">Shift Slot Planner</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Available shifts for {activeShiftDateIso} · {activeDayBookedSlots.length} slot
                    {activeDayBookedSlots.length === 1 ? "" : "s"} ({bookedHoursTotal} hrs) booked
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant={selectedShiftDay === "today" ? "default" : "outline"}
                  onClick={() => setSelectedShiftDay("today")}
                  className="text-xs"
                >
                  Today ({todayIso.slice(5)})
                </Button>
                <Button
                  size="sm"
                  variant={selectedShiftDay === "tomorrow" ? "default" : "outline"}
                  onClick={() => setSelectedShiftDay("tomorrow")}
                  className="text-xs"
                >
                  Tomorrow ({tomorrowIso.slice(5)})
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {OPERATIONAL_SHIFT_SLOTS.map((slot) => {
                const isBooked = activeDayBookedSlots.includes(slot.id);
                return (
                  <div
                    key={slot.id}
                    className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${isBooked
                        ? "border-emerald-500/40 bg-emerald-500/5 shadow-xs"
                        : "border-border bg-muted/20"
                      }`}
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-sm font-bold text-foreground">
                          {slot.label} ({slot.window})
                        </span>
                        <span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-[#E23744]">
                          {slot.tag}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {slot.durationHours}h
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{slot.peakIncentiveNote}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={isBooked ? "outline" : "default"}
                      onClick={() => toggleSlotBooking(slot.id)}
                      className={`shrink-0 font-bold ${isBooked
                          ? "border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white"
                        }`}
                    >
                      {isBooked ? "Booked" : "Book Slot"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="font-display text-3xl">Order History</h1>
                <p className="text-xs text-muted-foreground">
                  Completed and past delivery orders
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={filteredRows.length === 0}
                onClick={exportTripsCsv}
              >
                <Download className="size-3.5" />
                Export Trip Statement (CSV)
              </Button>
            </div>

            {/* Period Presets */}
            <div className="flex flex-wrap gap-2">
              {(["today", "yesterday", "week", "month"] as const).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={preset === p ? "default" : "outline"}
                  onClick={() => setPreset(p)}
                >
                  {p === "today"
                    ? t("today")
                    : p === "yesterday"
                      ? t("yesterday")
                      : p === "week"
                        ? t("thisWeek")
                        : t("thisMonth")}
                </Button>
              ))}
            </div>

            {/* Real Trips Summary KPIs */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="space-y-1 p-3.5">
                <p className="text-xs font-medium text-muted-foreground">Total Completed Trips</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
                  {tripSummary.completedCount}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {trips.length} total logged · {tripSummary.codCount} COD · {tripSummary.cancelledCount} cancelled/failed
                  {perf ? ` · ${pct(perf.accepted, perf.offered)} acceptance` : ""}
                </p>
              </Card>

              <Card className="space-y-1 p-3.5">
                <p className="text-xs font-medium text-muted-foreground">Total Distance Covered</p>
                <p className="font-mono text-2xl font-bold tabular-nums text-foreground">
                  {tripSummary.totalDistanceKm.toFixed(1)} km
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Rate card: {formatINR(STATUTORY_BASE_FARE_PAISE)} first {STATUTORY_BASE_DISTANCE_KM} km +{" "}
                  {formatINR(STATUTORY_DISTANCE_RATE_PER_KM_PAISE)}/km
                </p>
              </Card>

              <Card className="space-y-1 p-3.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Total Base + Distance + Tip Earnings
                </p>
                <p className="font-mono text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatINR(tripSummary.totalEarningsPaise)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Base {formatINR(tripSummary.totalBasePaise)} · Dist {formatINR(tripSummary.totalDistancePaise)} · Tips{" "}
                  {formatINR(tripSummary.totalTipPaise)}
                </p>
              </Card>
            </div>

            {/* Search & Filter Pills Bar */}
            <Card className="space-y-3">
              <div className="relative">
                <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Order ID, Restaurant Name, Pickup Area, or Drop Area..."
                  className="pl-9 text-xs"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: "ALL", label: "All Trips", count: trips.length },
                      { id: "DELIVERED", label: "Delivered", count: tripSummary.completedCount },
                      {
                        id: "CANCELLED",
                        label: "Cancelled / Failed",
                        count: tripSummary.cancelledCount,
                      },
                      { id: "COD", label: "COD Trips", count: tripSummary.codCount },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusFilter(tab.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${statusFilter === tab.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${statusFilter === tab.id
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-background text-foreground"
                          }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  Showing {filteredRows.length} of {trips.length} trip{trips.length === 1 ? "" : "s"}
                </span>
              </div>
            </Card>

            {queryTicketRef ? (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                Trip payout query logged (#{queryTicketRef}). View updates in{" "}
                <Link to="/support" className="underline font-semibold">
                  Support Tickets
                </Link>
                .
              </div>
            ) : null}

            {error ? <p className="text-sm text-offline">{error}</p> : null}
            {filteredRows.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-sm font-medium text-foreground">{t("noHistory")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Completed, cancelled, and COD deliveries for the selected period appear here with full payout breakdowns.
                </p>
              </Card>
            ) : null}

            <ul className="space-y-2.5">
              {filteredRows.map((r) => {
                const d = r.delivery;
                const isExpanded = expandedId === d.id;
                const isDelivered = d.state === "DELIVERED";
                const tripDistanceKm = getTripDistanceKm(d, r.payout);
                const tripDurationMins = getTripDurationMinutes(d, tripDistanceKm);
                const grossOrderPayout = isDelivered ? r.payout || d.expectedPayoutPaise : 0;
                const basePaise = isDelivered
                  ? Math.min(STATUTORY_BASE_FARE_PAISE, grossOrderPayout)
                  : 0;
                const distancePaise = isDelivered ? Math.max(0, grossOrderPayout - basePaise) : 0;
                const tipPaise = d.tipPaise ?? 0;
                const totalTripPaise = grossOrderPayout + r.incentive + r.adjustment + tipPaise;

                const waitMins =
                  d.arrivedRestaurantAt && d.pickedUpAt
                    ? Math.max(
                      0,
                      Math.floor(
                        (new Date(d.pickedUpAt).getTime() -
                          new Date(d.arrivedRestaurantAt).getTime()) /
                        60_000,
                      ),
                    )
                    : 0;

                return (
                  <li key={d.id}>
                    <Card className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              to="/delivery/$id"
                              params={{ id: d.id }}
                              className="font-display text-base font-bold hover:underline"
                            >
                              Order #{d.orderCode}
                            </Link>
                            <Badge
                              tone={
                                d.state === "DELIVERED"
                                  ? "online"
                                  : d.state === "RIDER_CANCELLED" ||
                                    d.state === "ORDER_CANCELLED" ||
                                    d.state === "DELIVERY_FAILED"
                                    ? "offline"
                                    : "busy"
                              }
                            >
                              {d.state.replaceAll("_", " ")}
                            </Badge>
                            {d.cod ? (
                              <Badge tone="cod">COD {formatINR(d.codAmountPaise)}</Badge>
                            ) : (
                              <Badge tone="muted">PREPAID</Badge>
                            )}
                          </div>

                          <p className="text-sm font-medium text-foreground">
                            {d.restaurant.name}{" "}
                            <span className="font-normal text-muted-foreground">
                              ({d.restaurant.area || "Pickup"}) to {d.customer.area || "Customer Drop"}
                            </span>
                          </p>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 font-mono">
                              <RouteIcon className="size-3.5 text-primary" />
                              {tripDistanceKm.toFixed(1)} km route
                            </span>
                            <span className="inline-flex items-center gap-1 font-mono">
                              <Clock3 className="size-3.5 text-primary" />
                              {tripDurationMins} mins duration
                            </span>
                            {waitMins > 0 ? (
                              <span className="inline-flex items-center gap-1 font-mono">
                                <MapPin className="size-3.5 text-orange-600" />
                                {waitMins}m kitchen wait
                              </span>
                            ) : null}
                            <span>{new Date(d.createdAt).toLocaleString("en-IN")}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-mono text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {formatINR(totalTripPaise)}
                          </p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {totalTripPaise.toLocaleString("en-IN")} paise
                          </p>
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : d.id)}
                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                          >
                            {isExpanded ? (
                              <>
                                Hide Breakdown <ChevronUp className="size-3.5" />
                              </>
                            ) : (
                              <>
                                Payout Breakdown <ChevronDown className="size-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Compact Per-Trip Summary Pill Strip */}
                      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-muted/25 px-3 py-1.5 text-[11px] font-mono text-muted-foreground">
                        <span>Base: {formatINR(basePaise)}</span>
                        <span>·</span>
                        <span>Dist ({tripDistanceKm.toFixed(1)} km): {formatINR(distancePaise)}</span>
                        <span>·</span>
                        <span>Wait/Bonus: {formatINR(r.incentive)}</span>
                        <span>·</span>
                        <span>Tip: {formatINR(tipPaise)}</span>
                        {r.adjustment !== 0 ? (
                          <>
                            <span>·</span>
                            <span>Adj: {formatINR(r.adjustment)}</span>
                          </>
                        ) : null}
                      </div>

                      {isExpanded ? (
                        <div className="border-t border-border pt-3 space-y-3 text-xs">
                          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                            Trip Payout Breakdown
                          </CardTitle>
                          <dl className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">
                                Pickup to Drop Distance &amp; Duration
                              </dt>
                              <dd className="font-mono">
                                {tripDistanceKm.toFixed(1)} km · {tripDurationMins} mins
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">
                                Base Fare ({STATUTORY_BASE_DISTANCE_KM}.0 km)
                              </dt>
                              <dd className="font-mono">
                                {formatINR(basePaise)}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">
                                Distance Pay ({Math.max(0, tripDistanceKm - STATUTORY_BASE_DISTANCE_KM).toFixed(1)} km beyond {STATUTORY_BASE_DISTANCE_KM} km)
                              </dt>
                              <dd className="font-mono">
                                {formatINR(distancePaise)}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">
                                Wait-Time ({waitMins}m at kitchen) &amp; Multi-Package Bonus
                              </dt>
                              <dd className="font-mono">
                                {formatINR(r.incentive)}
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">Customer Tip (100% Partner Retained)</dt>
                              <dd className="font-mono">
                                {formatINR(tipPaise)} ({tipPaise.toLocaleString("en-IN")} paise)
                              </dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-muted-foreground">
                                Adjustment / Validated Deduction
                              </dt>
                              <dd className="font-mono">
                                {formatINR(r.adjustment)} ({r.adjustment.toLocaleString("en-IN")} paise)
                              </dd>
                            </div>
                            <div className="flex justify-between border-t border-border pt-1.5 font-bold text-sm text-foreground">
                              <dt>Total Trip Payout</dt>
                              <dd className="font-mono text-emerald-600 dark:text-emerald-400">
                                {formatINR(totalTripPaise)} ({totalTripPaise.toLocaleString("en-IN")} paise)
                              </dd>
                            </div>
                          </dl>

                          {d.cancelReason || d.failReason ? (
                            <p className="text-xs text-muted-foreground">
                              Recorded Reason:{" "}
                              <strong className="text-foreground">
                                {d.cancelReason || d.failReason}
                              </strong>
                            </p>
                          ) : null}

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <Link
                              to="/delivery/$id"
                              params={{ id: d.id }}
                              className="inline-flex items-center gap-1 font-medium text-primary underline"
                            >
                              Open Full Trip Details <ExternalLink className="size-3" />
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setQueryTripId(queryTripId === d.id ? null : d.id);
                                setQueryTicketRef(null);
                              }}
                            >
                              <FileQuestion className="size-3.5" />
                              Raise Trip Payout Query
                            </Button>
                          </div>

                          {queryTripId === d.id ? (
                            <div className="rounded-lg border border-primary/40 bg-primary/5 p-2.5 space-y-2">
                              <Input
                                value={queryNote}
                                onChange={(e) => setQueryNote(e.target.value)}
                                placeholder="Describe the distance, kitchen wait, or payout query..."
                                className="text-xs"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={queryBusy}
                                  onClick={() => void submitTripQuery(r)}
                                >
                                  {queryBusy ? "Submitting..." : "Submit Query"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setQueryTripId(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </Card>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function pct(n: number, d: number) {
  if (!d) return "—";
  return `${Math.round((n / d) * 100)}%`;
}
