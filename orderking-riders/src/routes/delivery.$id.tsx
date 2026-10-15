import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { DeliveryActions } from "@/components/rider/delivery-actions";
import { MapPane } from "@/components/rider/map-pane";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardMeta, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { errorMessage, newIdempotencyKey } from "@/lib/client/errors";
import {
  formatPaise,
  STATUTORY_BASE_DISTANCE_KM,
  STATUTORY_BASE_FARE_PAISE,
  calculateRestaurantWaitPayPaise,
} from "@/lib/rider/money";
import { useI18n } from "@/lib/rider/i18n-context";
import { createTicketFn, getDeliveryFn } from "@/lib/server/rider-fns";
import { useGpsHeartbeat } from "@/lib/hooks/use-gps-heartbeat";
import type { GeoPoint, TicketTopic } from "@/lib/rider/types";
import { ArrowLeft, Clock3, FileQuestion } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export const Route = createFileRoute("/delivery/$id")({ component: Page });

const TRIP_TICKET_TOPICS: ReadonlyArray<{ topic: TicketTopic; label: string }> = [
  { topic: "RESTAURANT_ISSUE", label: "Kitchen Delay / Packaging" },
  { topic: "CUSTOMER_UNAVAILABLE", label: "Customer Unreachable / Pin Mismatch" },
  { topic: "CASH_DISPUTE", label: "COD Cash / Change Issue" },
  { topic: "PAYMENT_ISSUE", label: "Distance / Wait Payout Audit" },
  { topic: "ORDER_ISSUE", label: "Missing / Damaged Item" },
];

function Page() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const [pack, setPack] = useState<Awaited<ReturnType<typeof getDeliveryFn>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [riderPos, setRiderPos] = useState<GeoPoint | null>(null);

  const [ticketTopic, setTicketTopic] = useState<TicketTopic>("RESTAURANT_ISSUE");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketBusy, setTicketBusy] = useState(false);
  const [ticketRef, setTicketRef] = useState<string | null>(null);

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
            `On-trip support log for Order #${pack.delivery.orderCode} (${ticketTopic.replaceAll("_", " ")})`,
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
  const distanceComponentPaise = d
    ? Math.max(0, d.expectedPayoutPaise - STATUTORY_BASE_FARE_PAISE)
    : 0;

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
            simulatedOtp={pack.simulatedOtp}
            onChanged={load}
          />

          {/* Order Payout & Timestamp Audit Card */}
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock3 className="size-4 text-primary" />
                Trip Timeline &amp; Payout Audit
              </CardTitle>
              <Badge tone="online">{formatPaise(d.expectedPayoutPaise + waitBonusPaise)}</Badge>
            </div>

            <dl className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Statutory Base Fare (first {STATUTORY_BASE_DISTANCE_KM} km)
                </dt>
                <dd className="font-mono">{formatPaise(STATUTORY_BASE_FARE_PAISE)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Distance &amp; Order Rate Component</dt>
                <dd className="font-mono">{formatPaise(distanceComponentPaise)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">
                  Kitchen Wait Bonus ({kitchenWaitMins}m recorded · ₹1/m after 6m grace)
                </dt>
                <dd className="font-mono">{formatPaise(waitBonusPaise)}</dd>
              </div>
              {d.tipPaise ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Customer Tip (100% Retained)</dt>
                  <dd className="font-mono">{formatPaise(d.tipPaise)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-1.5 font-bold text-sm text-foreground">
                <dt>Guaranteed Trip Total</dt>
                <dd className="font-mono text-emerald-600 dark:text-emerald-400">
                  {formatPaise(d.expectedPayoutPaise + waitBonusPaise + (d.tipPaise ?? 0))}
                </dd>
              </div>
            </dl>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
                <span className="text-[10px] uppercase text-muted-foreground block">Dispatched</span>
                <span className="font-mono font-medium">
                  {new Date(d.createdAt).toLocaleTimeString("en-IN")}
                </span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
                <span className="text-[10px] uppercase text-muted-foreground block">At Kitchen</span>
                <span className="font-mono font-medium">
                  {d.arrivedRestaurantAt
                    ? new Date(d.arrivedRestaurantAt).toLocaleTimeString("en-IN")
                    : "—"}
                </span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
                <span className="text-[10px] uppercase text-muted-foreground block">Picked Up</span>
                <span className="font-mono font-medium">
                  {d.pickedUpAt ? new Date(d.pickedUpAt).toLocaleTimeString("en-IN") : "—"}
                </span>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2">
                <span className="text-[10px] uppercase text-muted-foreground block">Delivered</span>
                <span className="font-mono font-medium">
                  {d.deliveredAt ? new Date(d.deliveredAt).toLocaleTimeString("en-IN") : "—"}
                </span>
              </div>
            </div>
          </Card>

          {/* Self-Service Trip Issue & Dispute Logger */}
          <Card className="space-y-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileQuestion className="size-4 text-primary" />
                Log Self-Service Issue for Order #{d.orderCode}
              </CardTitle>
              <CardMeta className="mt-1">
                Record kitchen delays, pin mismatches, COD discrepancies, or payout audits directly on this order ID.
              </CardMeta>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TRIP_TICKET_TOPICS.map((item) => (
                <button
                  key={item.topic}
                  type="button"
                  onClick={() => setTicketTopic(item.topic)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    ticketTopic === item.topic
                      ? "border-primary bg-primary/15 font-semibold text-primary"
                      : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Add details (e.g., waited 18 mins at counter, customer gate locked)..."
                className="text-xs"
              />
              <Button
                size="sm"
                disabled={ticketBusy}
                onClick={() => void submitTripIssue()}
                className="shrink-0"
              >
                {ticketBusy ? "Logging..." : "Log Order Ticket"}
              </Button>
            </div>

            {ticketRef ? (
              <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                Order ticket #{ticketRef} logged for Order #{d.orderCode}. Track resolution under{" "}
                <Link to="/support" className="underline font-semibold">
                  Support
                </Link>
                .
              </p>
            ) : null}
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}
