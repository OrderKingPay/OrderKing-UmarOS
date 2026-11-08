import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { DeliveryActions } from "@/components/rider/delivery-actions";
import { MapPane } from "@/components/rider/map-pane";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { errorMessage, newIdempotencyKey } from "@/lib/client/errors";
import { formatPaise, calculateRestaurantWaitPayPaise } from "@/lib/rider/money";
import { useI18n } from "@/lib/rider/i18n-context";
import { createTicketFn, getDeliveryFn } from "@/lib/server/rider-fns";
import { useGpsHeartbeat } from "@/lib/hooks/use-gps-heartbeat";
import type { GeoPoint, TicketTopic } from "@/lib/rider/types";
import { ArrowLeft, HelpCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRiderCustomization } from "@/lib/rider/use-rider-customization";

export const Route = createFileRoute("/delivery/$id")({ component: Page });

const TRIP_TICKET_TOPICS: ReadonlyArray<{ topic: TicketTopic; label: string }> = [
  { topic: "RESTAURANT_ISSUE", label: "Kitchen Delay" },
  { topic: "CUSTOMER_UNAVAILABLE", label: "Customer Unreachable" },
  { topic: "CASH_DISPUTE", label: "COD Issue" },
  { topic: "PAYMENT_ISSUE", label: "Payout Query" },
  { topic: "ORDER_ISSUE", label: "Order Damage" },
];

function Page() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const { payout, surge } = useRiderCustomization();
  const [pack, setPack] = useState<Awaited<ReturnType<typeof getDeliveryFn>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [riderPos, setRiderPos] = useState<GeoPoint | null>(null);

  const [ticketTopic, setTicketTopic] = useState<TicketTopic>("RESTAURANT_ISSUE");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketBusy, setTicketBusy] = useState(false);
  const [ticketRef, setTicketRef] = useState<string | null>(null);
  const [showTicketForm, setShowTicketForm] = useState(false);

  const load = useCallback(() => {
    void getDeliveryFn({ data: { deliveryId: id } })
      .then(setPack)
      .catch((e: unknown) => setError(errorMessage(e, t("forbidden"))));
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  useGpsHeartbeat(
    Boolean(pack && pack.delivery),
    2000,
    (pos) => setRiderPos({ lat: pos.lat, lng: pos.lng }),
    pack?.delivery.riderId,
    id,
  );

  async function submitTripIssue() {
    if (!pack) return;
    setTicketBusy(true);
    try {
      const row = await createTicketFn({
        data: {
          topic: ticketTopic,
          deliveryId: pack.delivery.id,
          message:
            ticketMessage.trim() ||
            `On-trip issue for Order #${pack.delivery.orderCode} (${ticketTopic.replaceAll("_", " ")})`,
          idempotencyKey: newIdempotencyKey(),
        },
      });
      setTicketRef(row.id.slice(0, 8));
      setTicketMessage("");
    } catch (e: unknown) {
      setError(errorMessage(e, t("actionNotConfirmed")));
    } finally {
      setTicketBusy(false);
    }
  }

  const [now, setNow] = useState(() => Date.now());
  const d = pack?.delivery;

  useEffect(() => {
    if (d?.arrivedRestaurantAt && !d?.pickedUpAt) {
      const interval = setInterval(() => setNow(Date.now()), 15000);
      return () => clearInterval(interval);
    }
  }, [d?.arrivedRestaurantAt, d?.pickedUpAt]);

  const endWaitTime = d?.pickedUpAt
    ? new Date(d.pickedUpAt).getTime()
    : d?.arrivedRestaurantAt
      ? now
      : null;
  const kitchenWaitMins =
    d?.arrivedRestaurantAt && endWaitTime
      ? Math.max(
          0,
          Math.floor(
            (endWaitTime - new Date(d.arrivedRestaurantAt).getTime()) /
              60_000,
          ),
        )
      : 0;
  const waitBonusPaise = calculateRestaurantWaitPayPaise(kitchenWaitMins, 6, 100);

  return (
    <AppShell>
      {error ? <p className="text-sm text-offline">{error}</p> : null}
      {pack && d ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Link
                to="/history"
                className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition"
                aria-label="Back to History"
              >
                <ArrowLeft className="size-4" />
              </Link>
              <div>
                <h1 className="font-display text-2xl">Order #{d.orderCode}</h1>
                <p className="text-xs text-muted-foreground">
                  {d.restaurant.name} → {d.customer.area}
                </p>
              </div>
            </div>
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
          </div>

          <MapPane
            pickup={d.pickupLocation}
            drop={d.dropLocation}
            current={riderPos}
            pickupLabel={d.restaurant.name}
            dropLabel={d.customer.area}
            navigateLabel={t("mapsOpen")}
            deliveryState={d.state}
          />

          <DeliveryActions
            delivery={d}
            cash={pack.cash ?? null}
            onChanged={load}
          />

          {/* Clean Order Details & Earning Summary */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Trip Earning
                </span>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatPaise(d.expectedPayoutPaise + waitBonusPaise + (d.tipPaise ?? 0))}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Payment
                </span>
                <p className="text-xs font-semibold text-foreground">
                  {d.cod ? `COD · Collect ${formatPaise(d.codAmountPaise)}` : "Paid Online"}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <span className="mt-1 size-2 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">{d.restaurant.name}</p>
                  <p className="text-[11px] text-muted-foreground">{d.restaurant.address || d.restaurant.area}</p>
                  {d.restaurant.specialPickupInstructions ? (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                      Note: {d.restaurant.specialPickupInstructions}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-start gap-2">
                <span className="mt-1 size-2 rounded-full bg-rose-500 shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">{d.customer.displayName || d.customer.area}</p>
                  <p className="text-[11px] text-muted-foreground">{d.customer.address || d.customer.area}</p>
                  {d.customer.instructions ? (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                      Note: {d.customer.instructions}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Compact Timestamps */}
            <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-border text-[11px]">
              <div className="rounded bg-muted/40 p-1.5 text-center">
                <span className="text-[9px] uppercase text-muted-foreground block font-semibold">Assigned</span>
                <span className="font-mono text-foreground font-medium">
                  {new Date(d.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="rounded bg-muted/40 p-1.5 text-center">
                <span className="text-[9px] uppercase text-muted-foreground block font-semibold">At Store</span>
                <span className="font-mono text-foreground font-medium">
                  {d.arrivedRestaurantAt
                    ? new Date(d.arrivedRestaurantAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </span>
              </div>
              <div className="rounded bg-muted/40 p-1.5 text-center">
                <span className="text-[9px] uppercase text-muted-foreground block font-semibold">Picked</span>
                <span className="font-mono text-foreground font-medium">
                  {d.pickedUpAt
                    ? new Date(d.pickedUpAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </span>
              </div>
              <div className="rounded bg-muted/40 p-1.5 text-center">
                <span className="text-[9px] uppercase text-muted-foreground block font-semibold">Delivered</span>
                <span className="font-mono text-foreground font-medium">
                  {d.deliveredAt
                    ? new Date(d.deliveredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </span>
              </div>
            </div>
          </Card>

          {/* Need Help / Support Bar */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3.5 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HelpCircle className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Need help with this order?</p>
                <p className="text-[11px] text-muted-foreground">Kitchen delay, customer unreachable, cash dispute</p>
              </div>
            </div>
            <Link
              to="/assistant"
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition"
            >
              Get Help
            </Link>
          </div>

          {/* Optional Collapsible Issue Reporter */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowTicketForm((v) => !v)}
              className="w-full flex items-center justify-between p-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition rounded-lg border border-dashed border-border"
            >
              <span>Having an issue with this order?</span>
              <span className="text-primary font-semibold">{showTicketForm ? "Hide" : "Report"}</span>
            </button>

            {showTicketForm ? (
              <div className="rounded-xl border border-border bg-card p-3 space-y-2.5 text-xs">
                <div className="flex flex-wrap gap-1">
                  {TRIP_TICKET_TOPICS.map((item) => (
                    <button
                      key={item.topic}
                      type="button"
                      onClick={() => setTicketTopic(item.topic)}
                      className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                        ticketTopic === item.topic
                          ? "border-primary bg-primary/15 font-semibold text-primary"
                          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Describe issue (e.g., long counter delay)..."
                    className="text-xs"
                  />
                  <Button
                    size="sm"
                    disabled={ticketBusy}
                    onClick={() => void submitTripIssue()}
                    className="shrink-0"
                  >
                    {ticketBusy ? "Saving..." : "Submit"}
                  </Button>
                </div>
                {ticketRef ? (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Ticket #{ticketRef} submitted. Track under Support.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
