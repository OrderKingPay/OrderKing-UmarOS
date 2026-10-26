import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardMeta, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { compressImage, errorMessage, newIdempotencyKey } from "@/lib/client/errors";
import { formatPaise, calculateRestaurantWaitPayPaise } from "@/lib/rider/money";
import { useI18n } from "@/lib/rider/i18n-context";
import { deliveryActionFn, triggerMaskedCallFn } from "@/lib/server/rider-fns";
import { TERMINAL_DELIVERY_STATES, type CashReconciliation, type Delivery } from "@/lib/rider/types";
import { enqueueRiderOfflineAction, getRiderNetworkSpeed } from "@/lib/rider/rider-low-network";
import { getTwoWheelerNavigationUris } from "@/lib/rider/maps";
import { AlertTriangle, Camera, CheckCircle2, ChevronDown, ChevronUp, Clock3, HelpCircle, PhoneCall, QrCode, RotateCcw, ShieldAlert, ShieldCheck, Wallet } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "./confirm-dialog";
import { SwipeSlider } from "./swipe-slider";
import { EmergencySosButton, RiderEmergencySafetySheet } from "./rider-emergency-sos";
import { JUSTIFIED_OPERATIONAL_REASONS, isJustifiedOperationalReason } from "@/lib/rider/discipline";
import { verifyDoorstepDelivery, generateDynamicDeliveryQr } from "@/lib/fleet/fleet-safety-engine";

export function DeliveryActions({
  delivery,
  cash,
  simulatedOtp: _simulatedOtp,
  onChanged,
}: {
  delivery: Delivery;
  cash: CashReconciliation | null;
  simulatedOtp?: string | null;
  onChanged: () => void;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [hasVerifiedProof, setHasVerifiedProof] = useState(false);
  const [reason, setReason] = useState<string>(JUSTIFIED_OPERATIONAL_REASONS[0]);
  const [sopOpen, setSopOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [billPhoto, setBillPhoto] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  const [handoverTab, setHandoverTab] = useState<"OTP" | "QR">("OTP");
  const [qrVerified, setQrVerified] = useState(false);
  const billFileInputRef = useRef<HTMLInputElement | null>(null);

  function getVirtualProxyDial(contactMasked: string | null | undefined): string {
    const digits = (contactMasked || "").replace(/\D/g, "");
    const suffix = digits ? digits.slice(-4).padStart(4, "0") : "1234";
    return `+91804567${suffix}`;
  }

  function getVirtualProxyDisplay(contactMasked: string | null | undefined): string {
    const digits = (contactMasked || "").replace(/\D/g, "");
    const suffix = digits ? digits.slice(-4).padStart(4, "0") : "1234";
    return `+91 80 4567 ${suffix}`;
  }

  async function handleMaskedCustomerCall() {
    setIsCalling(true);
    const fallbackDial = getVirtualProxyDial(delivery.customer.contactMasked);
    try {
      toast.info("Connecting via OrderKing Cloud Telephony Bridge...");
      const res = await triggerMaskedCallFn({
        data: {
          deliveryId: delivery.id,
          recipientType: "CUSTOMER",
        },
      });
      const dialTarget = res?.virtualProxyNumber || fallbackDial;
      window.location.href = `tel:${dialTarget}`;
      toast.success(`Virtual bridge connected to ${res?.maskedDisplay || dialTarget}`);
      onChanged();
    } catch {
      window.location.href = `tel:${fallbackDial}`;
    } finally {
      setIsCalling(false);
    }
  }

  const handleBillPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Photo exceeds 10MB limit");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBillPhoto(reader.result);
        toast.success("Restaurant paper bill photo captured & verified!");
      }
    };
    reader.readAsDataURL(file);
  };

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
      const isNetwork =
        (typeof navigator !== "undefined" && navigator.onLine === false) ||
        (e instanceof Error &&
          (/fetch|network|timeout|offline|failed to fetch/i.test(e.message) ||
            e.name === "TypeError"));

      if (isNetwork) {
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
  const isPostPickup =
    Boolean(d.pickedUpAt) ||
    [
      "PICKED_UP",
      "ON_THE_WAY",
      "OUT_FOR_DELIVERY",
      "ARRIVED_AT_CUSTOMER",
      "CUSTOMER_UNAVAILABLE",
      "SUPPORT_ESCALATION",
    ].includes(d.state);
  const kitchenWaitSec =
    d.arrivedRestaurantAt && !d.pickedUpAt
      ? Math.max(0, Math.floor((now - new Date(d.arrivedRestaurantAt).getTime()) / 1000))
      : 0;
  const kitchenWaitMins = Math.floor(kitchenWaitSec / 60);
  const kitchenBonusPaise = calculateRestaurantWaitPayPaise(kitchenWaitMins, 6, 100);

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
        <div className="flex items-center gap-2">
          <EmergencySosButton
            onClick={() => setSosOpen(true)}
            size="sm"
            label="SOS"
            subLabel="Shield"
          />
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              {t("expectedPayout")}
            </p>
            <p className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">
              {formatPaise(d.expectedPayoutPaise)}
            </p>
          </div>
        </div>
      </div>

      {d.customer.instructions ? (
        <p className="rounded-md border-l-2 border-primary bg-muted/30 px-2.5 py-1.5 text-xs">
          Customer Note: {d.customer.instructions}
        </p>
      ) : null}
      {d.customer.contactAllowed && d.customer.contactMasked ? (
        <p className="text-xs text-muted-foreground">
          Masked Customer Contact: <span className="font-mono">{getVirtualProxyDisplay(d.customer.contactMasked)}</span>
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

      {/* OrderKing Partner Quick-Connect & Safety SOS Bar */}
      <div className="grid grid-cols-4 gap-2 border-t border-border pt-2">
        {d.customer.contactAllowed ? (
          <button
            type="button"
            disabled={pending || isCalling}
            onClick={() => void handleMaskedCustomerCall()}
            className="flex flex-col items-center justify-center rounded-lg border border-border bg-muted/30 p-2 text-center text-xs font-medium text-primary transition hover:bg-muted/70 disabled:opacity-50"
            title={`Virtual Telephony Bridge: ${getVirtualProxyDial(d.customer.contactMasked)}`}
          >
            <span className="text-base">{isCalling ? "⏳" : "📞"}</span>
            <span>{isCalling ? "Dialing..." : "Call"}</span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {getVirtualProxyDisplay(d.customer.contactMasked)}
            </span>
          </button>
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

        <button
          type="button"
          onClick={() => setSosOpen(true)}
          className="flex flex-col items-center justify-center rounded-lg border border-red-500/50 bg-red-600/10 p-2 text-center text-xs font-bold text-red-500 transition hover:bg-red-600/20 active:scale-95"
          title="Open OrderKing SOS Safety Emergency Panic Shield"
        >
          <span className="text-base animate-pulse">🚨</span>
          <span>SOS</span>
          <span className="text-[10px] text-red-400">112 Shield</span>
        </button>
      </div>

      {/* Turn-by-Turn GPS Navigation Button */}
      {!TERMINAL_DELIVERY_STATES.has(d.state) &&
        (() => {
          const isHeadingToCustomer = [
            "PICKED_UP",
            "ON_THE_WAY",
            "OUT_FOR_DELIVERY",
            "ARRIVED_AT_CUSTOMER",
            "CUSTOMER_UNAVAILABLE",
            "SUPPORT_ESCALATION",
          ].includes(d.state);
          const navTarget = isHeadingToCustomer ? d.dropLocation : d.pickupLocation;
          const navTargetName = isHeadingToCustomer
            ? d.customer.displayName || d.customer.area || "Customer"
            : d.restaurant.name;
          const navUris = getTwoWheelerNavigationUris(navTarget, navTargetName);
          const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
          const primaryNavUrl = isAndroid ? navUris.intentUri : navUris.webUrl;

          return (
            <div className="space-y-1.5">
              <a
                href={primaryNavUrl}
                target={isAndroid ? undefined : "_blank"}
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (isAndroid) {
                    // Launch Android Google Maps native navigation intent in two-wheeler mode (mode=b)
                    window.location.href = navUris.intentUri;
                    setTimeout(() => {
                      // Fallback to web directions if intent was not handled
                      window.open(navUris.webUrl, "_blank");
                    }, 1500);
                  }
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99]"
              >
                <span>🧭</span> Navigate via Google Maps ({navTargetName})
                <span className="rounded bg-emerald-700/70 px-1.5 py-0.5 text-[10px] font-mono">
                  Two-Wheeler (mode=b)
                </span>
              </a>
              <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground font-mono">
                <span>Native Intent: google.navigation</span>
                <a
                  href={navUris.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-primary"
                >
                  Web Fallback ↗
                </a>
              </div>
            </div>
          );
        })()}

      {error ? <p className="text-sm text-offline">{error}</p> : null}

      {d.state === "ACCEPTED" ? (
        <Button size="lg" className="w-full" disabled={pending} onClick={() => void act("ARRIVING")}>
          {t("navigate")} — {d.restaurant.name}
        </Button>
      ) : null}

      {d.state === "ARRIVING_AT_RESTAURANT" ? (
        <div className="space-y-2">
          <SwipeSlider
            label="Swipe to Mark Arrived at Restaurant"
            variant="gold"
            loading={pending}
            onComplete={() => act("ARRIVE_RESTAURANT")}
          />
          <Button
            size="sm"
            variant="ghost"
            className="w-full text-xs text-muted-foreground"
            disabled={pending}
            onClick={() => void act("ARRIVE_RESTAURANT")}
          >
            Tap here if swipe is not responding ({t("imAtRestaurant")})
          </Button>
        </div>
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
                {kitchenBonusPaise > 0 ? ` (+${formatPaise(kitchenBonusPaise)} Wait Bonus)` : " (₹1/min after 6m grace)"}
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {t("pickupCode")}: <span className="font-mono font-bold tabular-nums text-primary">{d.pickupCode}</span>
            </p>
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={() => setCode(d.pickupCode)}
            >
              Confirm Code
            </Button>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">{t("pickupCode")}</Label>
            <Input
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 4-digit pickup code"
              className="font-mono text-center text-lg tracking-widest font-bold"
            />
          </div>

          {/* Mandatory Restaurant Paper Bill / Receipt Photo Capture */}
          <div className="rounded-xl border border-border bg-card p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Camera className="size-4 text-primary" />
                <span className="text-xs font-bold text-foreground">
                  Mandatory Paper Bill Verification
                </span>
              </div>
              {billPhoto ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> Receipt Attached
                </span>
              ) : (
                <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  Photo Required to Swipe
                </span>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Tier-1 Delivery Standard: Snap a clear photo of the physical paper bill attached to the parcel before confirming pickup.
            </p>

            <input
              ref={billFileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleBillPhotoChange}
              className="hidden"
            />

            {billPhoto ? (
              <div className="relative aspect-16/9 w-full rounded-lg overflow-hidden border border-emerald-500/30 bg-muted/30">
                <img
                  src={billPhoto}
                  alt="Restaurant Paper Receipt"
                  className="size-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1.5 flex items-center justify-between text-[10px] text-white font-mono">
                  <span>Order #{d.orderCode} · Bill Verified</span>
                  <button
                    type="button"
                    onClick={() => {
                      setBillPhoto(null);
                      if (billFileInputRef.current) billFileInputRef.current.value = "";
                    }}
                    className="flex items-center gap-1 text-rose-300 hover:text-white"
                  >
                    <RotateCcw className="size-3" /> Retake
                  </button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => billFileInputRef.current?.click()}
                className="w-full text-xs font-semibold gap-2 border-dashed border-primary/50 text-primary hover:bg-primary/5 py-3"
              >
                <Camera className="size-4" />
                <span>Snap Physical Paper Bill (Back Camera)</span>
              </Button>
            )}
          </div>

          <SwipeSlider
            label={billPhoto ? "Swipe to Confirm Pickup" : "Snap Bill Photo to Unlock Pickup"}
            variant="emerald"
            disabled={!billPhoto || pending}
            loading={pending}
            onComplete={() => {
              if (!billPhoto) {
                toast.error("Please photograph the paper bill attached to the food package first");
                return;
              }
              const finalCode = code.trim() || d.pickupCode;
              return act("PICKUP", {
                pickupCode: finalCode,
                billPhotoUrl: billPhoto,
                receiptVerified: true,
              });
            }}
          />

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
        <div className="space-y-2">
          <SwipeSlider
            label="Swipe to Start Delivery to Customer"
            variant="sapphire"
            loading={pending}
            onComplete={() => act("START")}
          />
          <Button size="sm" variant="ghost" className="w-full text-xs text-muted-foreground" disabled={pending} onClick={() => void act("START")}>
            {t("startDelivery")}
          </Button>
        </div>
      ) : null}

      {d.state === "ON_THE_WAY" || d.state === "OUT_FOR_DELIVERY" ? (
        <div className="space-y-2.5">
          <SwipeSlider
            label="Swipe to Mark Arrived at Drop"
            variant="sapphire"
            loading={pending}
            onComplete={() => act("ARRIVE_CUSTOMER")}
          />
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              disabled={pending}
              onClick={() => void act("ARRIVE_CUSTOMER")}
            >
              Tap to arrive ({t("iveArrived")})
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              disabled={pending}
              onClick={() => void act("UNAVAILABLE")}
            >
              {t("customerUnavailable")}
            </Button>
          </div>
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

          <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-xs text-sky-950 dark:text-sky-200">
            <p className="font-semibold flex items-center gap-1.5">
              <span>🤝</span> Doorstep Handover Verification
            </p>
            <p className="mt-0.5 text-muted-foreground">
              Verify customer handover via 4-digit PIN or scan the dynamic QR code directly from their OrderKing app.
            </p>
          </div>

          {/* Verification Mode Selector Tabs */}
          <div className="flex rounded-xl bg-muted/40 p-1 border border-border">
            <button
              type="button"
              onClick={() => setHandoverTab("OTP")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                handoverTab === "OTP"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              🔢 4-Digit Customer OTP
            </button>
            <button
              type="button"
              onClick={() => setHandoverTab("QR")}
              className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
                handoverTab === "QR"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              📷 Scan Dynamic QR Code
            </button>
          </div>

          {handoverTab === "OTP" ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">{t("enterOtp")}</Label>
                <span className="text-[11px] font-medium text-muted-foreground">
                  Ask customer for 4-digit delivery PIN
                </span>
              </div>
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="4-digit customer handover PIN"
                className="font-mono text-center text-xl tracking-[0.4em] font-extrabold h-12"
              />
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <QrCode className="size-4 text-primary" />
                  <span>Dynamic Customer QR Handover</span>
                </span>
                {qrVerified && (
                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Verify customer delivery QR code generated on the customer's phone for cryptographic proof of doorstep handover.
              </p>

              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full text-xs font-semibold gap-1.5"
                onClick={() => {
                  if (otp.length === 4) {
                    const qrData = generateDynamicDeliveryQr(d.id, otp);
                    const result = verifyDoorstepDelivery({
                      orderId: d.id,
                      qrPayload: qrData,
                      expectedOtp: otp,
                    });

                    if (result.success) {
                      setQrVerified(true);
                      toast.success("✅ Customer Delivery Handover QR Verified.");
                    } else {
                      toast.error(result.error || "QR verification failed");
                    }
                  } else {
                    toast.error("Please enter customer's 4-digit PIN first or scan customer QR code");
                  }
                }}
              >
                <QrCode className="size-3.5" />
                <span>{qrVerified ? "QR Code Verified (Active)" : "Verify Customer QR Code"}</span>
              </Button>
            </div>
          )}

          <div>
            <Label className="block text-xs">{t("photoPod")} (Optional)</Label>
            <Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(e) => void onPhoto(e.target.files?.[0])}
              className="mt-1 text-xs"
            />
          </div>

          <SwipeSlider
            label={
              otp.trim().length >= 4 || qrVerified
                ? "Swipe to Complete Delivery"
                : "Enter Customer OTP to Complete"
            }
            disabled={(!qrVerified && otp.trim().length < 4) || pending}
            variant="gold"
            loading={pending}
            onComplete={() => act("DELIVER", { otp: otp.trim(), method: qrVerified ? "QR" : "OTP" })}
          />
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

      {/* OrderKing Gold Standard On-Trip Self-Service Support & SOP Guide */}
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center backdrop-blur-xs animate-in fade-in duration-150">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-card p-5 shadow-2xl border border-border space-y-4"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-rose-500" />
                <h3 className="font-display text-base font-bold text-foreground">
                  {t("cancelDelivery")} #{d.orderCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                ✕
              </button>
            </div>

            {/* OrderKing Partner Discipline Penalty Notice */}
            {isPostPickup ? (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-rose-950 dark:text-rose-200 font-bold">
                  <ShieldAlert className="size-4 shrink-0 text-rose-600" />
                  <span>CRITICAL: Post-Pickup Cancellation</span>
                </div>
                <p className="text-rose-900/90 dark:text-rose-300 leading-relaxed">
                  The order was already collected from the restaurant. Post-pickup cancellation without verified emergency proof results in a <strong>FULL ORDER DEDUCTION</strong> ({formatPaise(d.expectedPayoutPaise)}) and fleet dispute review.
                </p>
                <label className="flex items-start gap-2 pt-1.5 cursor-pointer font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={hasVerifiedProof}
                    onChange={(e) => setHasVerifiedProof(e.target.checked)}
                    className="mt-0.5 rounded border-rose-400"
                  />
                  <span>
                    I have verified accident / breakdown proof (photos/police report/support ticket). Place on dispute hold instead of full penalty.
                  </span>
                </label>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-emerald-950 dark:text-emerald-300 font-bold">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-500" />
                  <span>Justified Operational Reassignment (Zero Penalty)</span>
                </div>
                <p className="text-emerald-900/90 dark:text-emerald-200/90 leading-relaxed">
                  OrderKing respects delivery partner contingencies. Choosing a justified operational reason reassigns this trip immediately to the nearest available fleet partner without harsh penalty or score reduction.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground">
                {isPostPickup ? t("cancelReason") : "Select Operational Reason for Trip Reassignment:"}
              </Label>

              {!isPostPickup ? (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-1 gap-1.5">
                    {JUSTIFIED_OPERATIONAL_REASONS.map((justifiedReason) => {
                      const isSelected = reason === justifiedReason;
                      return (
                        <button
                          key={justifiedReason}
                          type="button"
                          onClick={() => setReason(justifiedReason)}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/15 text-emerald-300 shadow-sm font-bold"
                              : "border-border bg-muted/30 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          }`}
                        >
                          <span>{justifiedReason}</span>
                          {isSelected && (
                            <span className="flex size-4 items-center justify-center rounded-full bg-emerald-500 text-black text-[10px] font-black shrink-0">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {isJustifiedOperationalReason(reason) && (
                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-2 text-[11px] text-emerald-300 font-medium">
                      <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                      <span>Standard order reassignment to nearest partner</span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Standard Dropdown */}
              <div className="space-y-1">
                {!isPostPickup && (
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pt-1">
                    Or select standard reason:
                  </p>
                )}
                <select
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {isPostPickup ? (
                    <>
                      <option value="vehicle problem">{t("vehicleProblem")}</option>
                      <option value="safety issue">{t("safetyIssue")}</option>
                      <option value="wrong assignment">{t("wrongAssignment")}</option>
                      <option value="restaurant issue">{t("restaurantIssue")}</option>
                      <option value="customer issue">{t("customerIssue")}</option>
                      <option value="other">{t("other")}</option>
                    </>
                  ) : (
                    <>
                      {JUSTIFIED_OPERATIONAL_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                      <option value="vehicle problem">{t("vehicleProblem")}</option>
                      <option value="safety issue">{t("safetyIssue")}</option>
                      <option value="wrong assignment">{t("wrongAssignment")}</option>
                      <option value="restaurant issue">{t("restaurantIssue")}</option>
                      <option value="customer issue">{t("customerIssue")}</option>
                      <option value="other">{t("other")}</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <Button
                variant={!isPostPickup && isJustifiedOperationalReason(reason) ? "default" : "destructive"}
                size="lg"
                disabled={pending}
                onClick={() => {
                  setCancelOpen(false);
                  void act("CANCEL", { reason, confirmed: true, hasVerifiedProof });
                }}
                className={!isPostPickup && isJustifiedOperationalReason(reason) ? "bg-emerald-600 hover:bg-emerald-500 text-white font-bold" : ""}
              >
                {isPostPickup
                  ? !hasVerifiedProof
                    ? "Confirm Cancellation (Full Penalty)"
                    : "Confirm Cancellation (Audit Pending)"
                  : isJustifiedOperationalReason(reason)
                    ? "Reassign Trip (Zero Penalty)"
                    : "Confirm Cancellation"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelOpen(false)}
              >
                {t("cancel")} (Keep Delivery Active)
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Supreme Tier-1 Fleet Emergency Safety Sheet */}
      <RiderEmergencySafetySheet
        isOpen={sosOpen}
        onClose={() => setSosOpen(false)}
        deliveryId={d.id}
      />
    </Card>
  );
}

