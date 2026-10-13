import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardMeta, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compressImage, errorMessage, newIdempotencyKey } from "@/lib/client/errors";
import { formatPaise } from "@/lib/rider/money";
import { useI18n } from "@/lib/rider/i18n-context";
import { deliveryActionFn } from "@/lib/server/rider-fns";
import { TERMINAL_DELIVERY_STATES, type CashReconciliation, type Delivery } from "@/lib/rider/types";
import { enqueueRiderOfflineAction, getRiderNetworkSpeed } from "@/lib/rider/rider-low-network";
import { ChevronDown, ChevronUp, Clock3, HelpCircle, PhoneCall, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "./confirm-dialog";

export function DeliveryActions({
  delivery,
  cash,
  simulatedOtp,
  onChanged,
}: {
  delivery: Delivery;
  cash: CashReconciliation | null;
  simulatedOtp: string | null;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState("vehicle problem");
  const [sopOpen, setSopOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  async function act(
    action:
      | "ARRIVING"
      | "ARRIVE_RESTAURANT"
      | "NOT_READY"
      | "PICKUP"
      | "START"
      | "ARRIVE_CUSTOMER"
      | "COLLECT_CASH"
      | "DELIVER"
      | "UNAVAILABLE"
      | "CONTACT"
      | "CANCEL",
    extra: Record<string, unknown> = {},
  ) {
    setPending(true);
    setError(null);
    const idempotencyKey = newIdempotencyKey();

    if (getRiderNetworkSpeed() === "OFFLINE") {
      enqueueRiderOfflineAction({
        deliveryId: delivery.id,
        action,
        idempotencyKey,
        payload: extra,
      });
      onChanged();
      setPending(false);
      return;
    }

    try {
      await deliveryActionFn({
        data: {
          deliveryId: delivery.id,
          action,
          idempotencyKey,
          ...extra,
        } as never,
      });
      onChanged();
    } catch (e) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        enqueueRiderOfflineAction({
          deliveryId: delivery.id,
          action,
          idempotencyKey,
          payload: extra,
        });
        onChanged();
      } else {
        setError(errorMessage(e, t("actionNotConfirmed")));
      }
    } finally {
      setPending(false);
    }
  }

  async function onPhoto(file: File | undefined) {
    if (!file) return;
    setPending(true);
    try {
      const compressed = await compressImage(file, 180_000);

      // Upload to Supabase Storage
      const { supabase } = await import("@/lib/db-cloud");
      const path = `pod/${delivery.id}-${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("deliveries")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        throw new Error("Failed to upload photo to Supabase Storage: " + uploadError.message);
      }

      const publicUrl = supabase.storage.from("deliveries").getPublicUrl(path).data.publicUrl;

      await deliveryActionFn({
        data: {
          deliveryId: delivery.id,
          action: "POD",
          idempotencyKey: newIdempotencyKey(),
          pod: {
            method: "PHOTO",
            contentType: compressed.contentType,
            dataUrl: compressed.dataUrl,
            bytes: compressed.bytes,
            storageUrl: publicUrl,
          },
        },
      });
      onChanged();
    } catch (e) {
      setError(errorMessage(e, t("actionNotConfirmed")));
    } finally {
      setPending(false);
    }
  }

  const d = delivery;
  const kitchenWaitSec =
    d.arrivedRestaurantAt && !d.pickedUpAt
      ? Math.max(0, Math.floor((now - new Date(d.arrivedRestaurantAt).getTime()) / 1000))
      : 0;
  const kitchenWaitMins = Math.floor(kitchenWaitSec / 60);
  const kitchenBonusPaise = kitchenWaitMins > 10 ? (kitchenWaitMins - 10) * 100 : 0;

  const customerWaitSec =
    d.waitStartedAt && !d.deliveredAt
      ? Math.max(0, Math.floor((now - new Date(d.waitStartedAt).getTime()) / 1000))
      : 0;

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-display text-lg font-bold">
            {t("order")} #{d.orderCode}
          </p>
          <p className="text-sm text-muted-foreground">
            {d.restaurant.name} · {d.packageCount} {t("packages")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            {t("expectedPayout")}
          </p>
          <p className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
            {formatPaise(d.expectedPayoutPaise)}
          </p>
        </div>
      </div>

      {d.customer.instructions ? (
        <p className="rounded-md border-l-2 border-primary bg-muted/30 px-2.5 py-1.5 text-xs">
          Customer Note: {d.customer.instructions}
        </p>
      ) : null}
      {d.customer.contactAllowed && d.customer.contactMasked ? (
        <p className="text-xs text-muted-foreground">
          Masked Customer Contact: <span className="font-mono">{d.customer.contactMasked}</span>
        </p>
      ) : null}
      {d.cod ? (
        <div className="flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
          <span className="font-semibold text-amber-900 dark:text-amber-200">
            Cash on Delivery (COD) Order
          </span>
          <Badge tone="cod">
            {t("collectCash")} {formatPaise(d.codAmountPaise)}
          </Badge>
        </div>
      ) : null}

      {/* Zomato-style Rider Quick-Connect & Safety SOS Bar */}
      <div className="grid grid-cols-4 gap-2 border-t border-border pt-2">
        {d.customer.contactAllowed ? (
          <a
            href={`tel:${d.customer.contactMasked || "18001000"}`}
            className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-2 text-center text-xs font-medium text-primary transition hover:bg-muted/70"
          >
            <span className="text-base">📞</span>
            <span>Call</span>
            <span className="text-[10px] text-muted-foreground">Masked</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex flex-col items-center justify-center rounded-lg border border-border/50 bg-muted/10 p-2 text-center text-xs font-medium text-muted-foreground opacity-50"
          >
            <span className="text-base">📞</span>
            <span>Call</span>
            <span className="text-[10px]">Restricted</span>
          </button>
        )}

        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Hi, I am your OrderKing delivery partner for Order #${d.orderCode}!`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-center text-xs font-medium text-emerald-700 dark:text-emerald-400 transition hover:bg-emerald-500/20"
        >
          <span className="text-base">💬</span>
          <span>WhatsApp</span>
          <span className="text-[10px]">Chat</span>
        </a>

        <a
          href="tel:18001000"
          className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-2 text-center text-xs font-medium text-primary transition hover:bg-muted/70"
        >
          <span className="text-base">🏬</span>
          <span>Kitchen</span>
          <span className="text-[10px] text-muted-foreground">Direct</span>
        </a>

        <a
          href="tel:112"
          className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-center text-xs font-bold text-destructive transition hover:bg-destructive/10"
        >
          <span className="text-base">🚨</span>
          <span>SOS</span>
          <span className="text-[10px]">112</span>
        </a>
      </div>

      {/* Zomato-style Turn-by-Turn GPS Navigation Button */}
      {!TERMINAL_DELIVERY_STATES.has(d.state) &&
        (() => {
          const isHeadingToCustomer = [
            "PICKED_UP",
            "ON_THE_WAY",
            "OUT_FOR_DELIVERY",
            "ARRIVED_AT_CUSTOMER",
          ].includes(d.state);
          const navTarget = isHeadingToCustomer ? d.dropLocation : d.pickupLocation;
          const navTargetName = isHeadingToCustomer
            ? d.customer.displayName || d.customer.area || "Customer"
            : d.restaurant.name;
          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${navTarget.lat},${navTarget.lng}&travelmode=two_wheeler`;

          return (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99]"
            >
              <span>🧭</span> Navigate via Google Maps ({navTargetName})
            </a>
          );
        })()}

      {error ? <p className="text-sm text-offline">{error}</p> : null}

      {d.state === "ACCEPTED" ? (
        <Button size="lg" className="w-full" disabled={pending} onClick={() => void act("ARRIVING")}>
          {t("navigate")} — {d.restaurant.name}
        </Button>
      ) : null}

      {d.state === "ARRIVING_AT_RESTAURANT" ? (
        <Button
          size="lg"
          className="w-full"
          disabled={pending}
          onClick={() => void act("ARRIVE_RESTAURANT")}
        >
          {t("imAtRestaurant")}
        </Button>
      ) : null}

      {d.state === "ARRIVED_AT_RESTAURANT" || d.state === "RESTAURANT_NOT_READY" ? (
        <div className="space-y-3">
          {d.arrivedRestaurantAt ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock3 className="size-3.5 text-primary" />
                Kitchen Wait Time Elapsed:
              </span>
              <span className="font-mono font-semibold text-foreground">
                {Math.floor(kitchenWaitSec / 60)}m {String(kitchenWaitSec % 60).padStart(2, "0")}s
                {kitchenBonusPaise > 0 ? ` (+${formatPaise(kitchenBonusPaise)} Wait Bonus)` : " (₹1/min after 10m)"}
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <p className="text-sm">
              {t("pickupCode")}: <span className="font-mono font-bold tabular-nums">{d.pickupCode}</span>
            </p>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setCode(d.pickupCode)}
            >
              Autofill Code ({d.pickupCode})
            </Button>
          </div>

          <Label>{t("pickupCode")}</Label>
          <Input
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter 4-digit pickup code"
          />
          <Button
            size="lg"
            className="w-full"
            disabled={pending}
            onClick={() => void act("PICKUP", { pickupCode: code })}
          >
            {t("pickUp")}
          </Button>
          {d.state === "ARRIVED_AT_RESTAURANT" ? (
            <Button
              variant="outline"
              className="w-full"
              disabled={pending}
              onClick={() => void act("NOT_READY")}
            >
              {t("restaurantNotReady")}
            </Button>
          ) : (
            <CardMeta>{t("waitingRestaurant")}</CardMeta>
          )}
        </div>
      ) : null}

      {d.state === "PICKED_UP" ? (
        <Button size="lg" className="w-full" disabled={pending} onClick={() => void act("START")}>
          {t("startDelivery")}
        </Button>
      ) : null}

      {d.state === "ON_THE_WAY" || d.state === "OUT_FOR_DELIVERY" ? (
        <div className="space-y-2">
          <Button
            size="lg"
            className="w-full"
            disabled={pending}
            onClick={() => void act("ARRIVE_CUSTOMER")}
          >
            {t("iveArrived")}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={() => void act("UNAVAILABLE")}
          >
            {t("customerUnavailable")}
          </Button>
        </div>
      ) : null}

      {d.state === "ARRIVED_AT_CUSTOMER" || d.state === "SUPPORT_ESCALATION" ? (
        <div className="space-y-3">
          {d.cod && cash && cash.state === "EXPECTED" ? (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
              <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
                {t("cashMustMatch")} ({formatPaise(cash.expectedPaise)})
              </p>
              <Button
                size="lg"
                className="w-full"
                disabled={pending}
                onClick={() => void act("COLLECT_CASH")}
              >
                {t("cashCollected")} {formatPaise(cash.expectedPaise)}
              </Button>
            </div>
          ) : null}

          <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-950 dark:text-sky-200">
            <p className="font-semibold">🤝 Customer Handover Verification</p>
            <p className="mt-0.5 text-muted-foreground">
              Please ask the customer for their 4-digit PIN displayed on their OrderKing app screen or SMS receipt to confirm handover.
            </p>
          </div>

          <Label>{t("enterOtp")}</Label>
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="4-digit customer handover PIN"
          />
          <Label className="block">{t("photoPod")}</Label>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => void onPhoto(e.target.files?.[0])}
          />
          <Button
            size="lg"
            className="w-full"
            disabled={pending}
            onClick={() => void act("DELIVER", { otp })}
          >
            {t("confirmDelivered")}
          </Button>
        </div>
      ) : null}

      {d.state === "CUSTOMER_UNAVAILABLE" ? (
        <div className="space-y-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              {t("waitTimer")}: {Math.floor(customerWaitSec / 60)}m{" "}
              {String(customerWaitSec % 60).padStart(2, "0")}s / 10m 00s
            </span>
            <Badge tone="busy">
              {t("contactAttempt")}: {d.contactAttempts} / 3
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Log at least 3 contact attempts and wait 10 minutes at the drop location to protect your full delivery payout before escalating.
          </p>
          <Button
            className="w-full"
            disabled={pending}
            onClick={() => void act("CONTACT")}
          >
            {t("contactAttempt")} ({d.contactAttempts}/3 Logged)
          </Button>
        </div>
      ) : null}

      {/* Zomato-Standard On-Trip Self-Service Support & SOP Guide */}
      <div className="rounded-lg border border-border bg-muted/20 overflow-hidden">
        <button
          type="button"
          onClick={() => setSopOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 p-3 text-left text-xs font-semibold text-foreground hover:bg-muted/40 transition"
        >
          <span className="flex items-center gap-2">
            <HelpCircle className="size-4 text-primary" />
            On-Trip Self-Service Support &amp; Field Issue SOP Guide
          </span>
          {sopOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        {sopOpen ? (
          <div className="border-t border-border bg-card p-3 space-y-2.5 text-xs">
            <div className="rounded-md border border-border bg-muted/20 p-2.5 space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Clock3 className="size-3.5 text-primary" />
                1. Kitchen Delay &gt; 10 Minutes
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Tap <strong>{t("imAtRestaurant")}</strong> as soon as you reach the outlet and tap{" "}
                <strong>{t("restaurantNotReady")}</strong> if the package is still being prepared. Your wait timer starts automatically at arrival (`ARRIVED_AT_RESTAURANT`) and credits <strong>₹1.00/minute</strong> for every minute beyond 10 minutes upon delivery completion.
              </p>
            </div>

            <div className="rounded-md border border-border bg-muted/20 p-2.5 space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <PhoneCall className="size-3.5 text-primary" />
                2. Customer Unreachable at Drop Location
              </p>
              <p className="text-muted-foreground leading-relaxed">
                If the customer does not answer at the drop location, tap{" "}
                <strong>{t("customerUnavailable")}</strong> to start the mandatory 10-minute wait timer, and log <strong>3 contact attempts</strong> using the button above. Once 3 attempts and 10 minutes are recorded, your base + distance payout is protected.
              </p>
            </div>

            <div className="rounded-md border border-border bg-muted/20 p-2.5 space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Wallet className="size-3.5 text-primary" />
                3. COD Exact Change &amp; Handover Checklist
              </p>
              <p className="text-muted-foreground leading-relaxed">
                For Cash-on-Delivery orders, always tap{" "}
                <strong>{t("cashCollected")}</strong> after receiving the exact order amount ({formatPaise(d.codAmountPaise)}) before entering the 4-digit customer handover PIN. Collected cash is added to your Floating Cash ledger and offset in Wednesday settlement.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {d.state !== "DELIVERED" && d.state !== "RIDER_CANCELLED" && d.state !== "ORDER_CANCELLED" ? (
        <Button variant="ghost" className="w-full text-offline" onClick={() => setCancelOpen(true)}>
          {t("cancelDelivery")}
        </Button>
      ) : null}

      {cancelOpen ? (
        <div className="space-y-2 rounded-lg bg-muted p-3">
          <CardTitle className="text-sm">{t("cancelReason")}</CardTitle>
          <select
            className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="vehicle problem">{t("vehicleProblem")}</option>
            <option value="safety issue">{t("safetyIssue")}</option>
            <option value="wrong assignment">{t("wrongAssignment")}</option>
            <option value="restaurant issue">{t("restaurantIssue")}</option>
            <option value="customer issue">{t("customerIssue")}</option>
            <option value="other">{t("other")}</option>
          </select>
          <ConfirmDialog
            open
            title={t("cancelDelivery")}
            body={t("cancelReason")}
            confirmLabel={t("confirm")}
            cancelLabel={t("cancel")}
            danger
            onCancel={() => setCancelOpen(false)}
            onConfirm={() => {
              setCancelOpen(false);
              void act("CANCEL", { reason, confirmed: true });
            }}
          />
        </div>
      ) : null}
    </Card>
  );
}

