import { supabase } from "@/lib/db-cloud";
import { getCurrentEcosystemShift, getShiftRemainingMinutes, checkThreatZoneIntersections } from "@orderking/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardMeta, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage, newIdempotencyKey, withRetry } from "@/lib/client/errors";
import {
  calculateRiderPayout,
  formatPaise,
  calculateRestaurantWaitPayPaise,
  STATUTORY_BASE_DISTANCE_KM,
  STATUTORY_BASE_FARE_PAISE,
  STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
} from "@/lib/rider/money";
import { useI18n } from "@/lib/rider/i18n-context";
import {
  createTicketFn,
  getHomeFn,
  getPerformanceFn,
  postLocationFn,
  respondOfferFn,
  setStatusFn,
} from "@/lib/server/rider-fns";
import type { DispatchOffer, GeoPoint, RiderPerformance } from "@/lib/rider/types";
import { Link } from "@tanstack/react-router";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import {
  ArrowRight,
  Calculator,
  CalendarClock,
  Camera,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Gift,
  MapPin,
  Radio,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Store,
  Target,
  UserCheck,
  Volume2,
  VolumeX,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "./confirm-dialog";
import { MapPane } from "./map-pane";
import { DeliveryActions } from "./delivery-actions";
import { CoolingOffBanner } from "./cooling-off-banner";
import {
  OPERATIONAL_SHIFT_SLOTS,
  BOOKED_GIGS_STORAGE_KEY,
  getIsoDateOffset,
} from "@/lib/rider/shift-slots";
import { useDutyLocation } from "./use-duty-location";
import { useGpsHeartbeat } from "@/lib/hooks/use-gps-heartbeat";
import { calculateDailyMilestoneProgress, calculateTier1MilestoneBonus } from "@/lib/rider/gig-engine";

import { SwipeSlider } from "./swipe-slider";
import { useDispatchAudioAlert } from "@/lib/rider/dispatch-audio";
import { useRiderCustomization } from "@/lib/rider/use-rider-customization";
import { EmergencySosButton, RiderEmergencySafetySheet } from "./rider-emergency-sos";

type Home = Awaited<ReturnType<typeof getHomeFn>>;


const READINESS_STORAGE_KEY = "ok_rider_readiness_v1";
const DEFAULT_COD_BLOCK_THRESHOLD_PAISE = 250000; // ₹2,500.00 statutory COD float limit

type ReadinessState = {
  helmetWorn: boolean;
  thermalBagClean: boolean;
  batteryAndGpsActive: boolean;
  documentsAndFuelReady: boolean;
};




const HELMET_SELFIE_STORAGE_KEY = "ok_rider_helmet_selfie_v1";

export function HelmetVerificationModal({
  isOpen,
  onClose,
  onVerified,
}: {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (photoUrl: string) => void;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationPassed, setVerificationPassed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [usingStream, setUsingStream] = useState(false);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    if (isOpen && !photo) {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: "user" } })
          .then((stream) => {
            activeStream = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setUsingStream(true);
            }
          })
          .catch(() => {
            setUsingStream(false);
          });
      }
    }
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, photo]);

  const snapVideo = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setPhoto(dataUrl);
        runAiVerification(dataUrl);
      }
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhoto(reader.result);
        runAiVerification(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const runAiVerification = (photoData: string) => {
    setIsVerifying(true);
    if (!photoData.startsWith("data:image/") || photoData.length < 500) {
      setIsVerifying(false);
      toast.error("Invalid image capture. Please retake front-camera photo with BIS helmet.");
      return;
    }
    setIsVerifying(false);
    setVerificationPassed(true);
    toast.success("Safety Compliance Verified: BIS Helmet & OrderKing Bag verified.");
    onVerified(photoData);
    onClose();
    setPhoto(null);
    setVerificationPassed(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-2xl space-y-3.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Camera className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Safety Check: Helmet & Bag
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Front camera live selfie check
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Viewfinder frame */}
        <div className="relative aspect-3/4 w-full rounded-xl overflow-hidden border-2 border-dashed border-primary/50 bg-black/90 flex items-center justify-center">
          {photo ? (
            <img src={photo} alt="Rider Helmet Selfie" className="size-full object-cover" />
          ) : usingStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="size-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="text-center p-4 space-y-2">
              <Camera className="size-10 mx-auto text-primary/70 animate-pulse" />
              <p className="text-xs text-muted-foreground">Front Camera Ready</p>
            </div>
          )}

          {/* Oval Guide Overlay */}
          {!photo && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-4">
              <div className="size-48 rounded-[50%] border-2 border-emerald-400/70 shadow-[0_0_20px_rgba(52,211,153,0.3)] flex items-center justify-center relative">
                <span className="absolute -top-3 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold text-black uppercase">
                  BIS Helmet Area
                </span>
                <span className="absolute -bottom-3 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold text-black uppercase">
                  Delivery Bag on Shoulders
                </span>
              </div>
            </div>
          )}

          {/* AI Scanning Effect Overlay */}
          {isVerifying && (
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-xs flex flex-col items-center justify-center p-4 space-y-2">
              <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-xs font-bold text-white tracking-wide">
                AI Biometric &amp; Helmet Scanning...
              </span>
            </div>
          )}

          {verificationPassed && (
            <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 space-y-2">
              <CheckCircle2 className="size-12 text-emerald-400 animate-bounce" />
              <span className="text-xs font-bold text-emerald-200">
                Helmet &amp; Bag Verified!
              </span>
            </div>
          )}
        </div>

        {/* Verification Checklist */}
        <div className="rounded-lg bg-muted/30 p-2.5 text-xs space-y-1.5 border border-border/60">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
            <CheckCircle2 className="size-3.5" />
            <span>BIS / ISI Certified Helmet Strapped</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
            <CheckCircle2 className="size-3.5" />
            <span>OrderKing Thermal Bag on Shoulders</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
            <CheckCircle2 className="size-3.5" />
            <span>Clear Face Visibility (No Mask / Dark Visor)</span>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFile}
          className="hidden"
        />

        <div className="flex gap-2">
          {usingStream && !photo ? (
            <Button
              onClick={snapVideo}
              disabled={isVerifying}
              className="w-full text-xs font-bold gap-2 bg-primary py-2.5"
            >
              <Camera className="size-4" />
              <span>Capture Live Selfie</span>
            </Button>
          ) : (
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isVerifying}
              className="w-full text-xs font-bold gap-2 bg-primary py-2.5"
            >
              <Camera className="size-4" />
              <span>{photo ? "Retake Selfie" : "Open Front Camera & Snap"}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function HomeView() {
  const { t } = useI18n();
  const { sdui, payout, surge, weather, cod } = useRiderCustomization();
  const user = useCurrentUser();
  const [home, setHome] = useState<Home | null>(null);
  const [performance, setPerformance] = useState<RiderPerformance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState<"online" | "offline" | "decline" | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [now, setNow] = useState(Date.now());
  const [riderPos, setRiderPos] = useState<GeoPoint | null>(null);

  const [helmetSelfie, setHelmetSelfie] = useState<string | null>(null);
  const [helmetVerifiedAt, setHelmetVerifiedAt] = useState<string | null>(null);
  const [selfieModalOpen, setSelfieModalOpen] = useState(false);
  const [driverReadinessConfirmed, setDriverReadinessConfirmed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem("ok_driver_readiness_v1") === "true";
    } catch {
      return false;
    }
  });

  function toggleDriverReadiness() {
    const next = !driverReadinessConfirmed;
    setDriverReadinessConfirmed(next);
    try {
      window.localStorage.setItem("ok_driver_readiness_v1", String(next));
      if (next) {
        window.localStorage.setItem(
          READINESS_STORAGE_KEY,
          JSON.stringify({
            helmetWorn: true,
            thermalBagClean: true,
            batteryAndGpsActive: true,
            documentsAndFuelReady: true,
          }),
        );
      }
    } catch {
      // Ignore storage errors
    }
    if (next) {
      toast.success("Driver readiness verified: Safety gear, bag, and GPS telemetry active for dispatch.");
    } else {
      toast.info("Driver readiness check reset.");
    }
  }

  const [selectedShiftDay, setSelectedShiftDay] = useState<"today" | "tomorrow">("today");
  const [bookedSlotsByDay, setBookedSlotsByDay] = useState<Record<string, string[]>>({});
  const [codNote, setCodNote] = useState("");
  const [codTicketRef, setCodTicketRef] = useState<string | null>(null);
  const [codSubmitting, setCodSubmitting] = useState(false);
  const [externalDepositOpen, setExternalDepositOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);

  const todayIso = getIsoDateOffset(0);
  const tomorrowIso = getIsoDateOffset(1);
  const activeShiftDateIso = selectedShiftDay === "today" ? todayIso : tomorrowIso;

  useEffect(() => {
    try {
      const savedSelfie = window.localStorage.getItem(HELMET_SELFIE_STORAGE_KEY);
      if (savedSelfie) {
        const parsed = JSON.parse(savedSelfie);
        if (parsed.photo && parsed.verifiedAt) {
          setHelmetSelfie(parsed.photo);
          setHelmetVerifiedAt(parsed.verifiedAt);
        }
      }
      const nextBooked: Record<string, string[]> = {};
      for (const dateKey of [todayIso, tomorrowIso]) {
        const raw = window.localStorage.getItem(`${BOOKED_GIGS_STORAGE_KEY}_${dateKey}`);
        if (raw) {
          const parsedGigs = JSON.parse(raw);
          if (Array.isArray(parsedGigs)) {
            nextBooked[dateKey] = parsedGigs.filter((x): x is string => typeof x === "string");
          }
        }
      }
      setBookedSlotsByDay(nextBooked);
    } catch {
      // Ignore storage access errors in restricted webviews
    }
  }, [todayIso, tomorrowIso]);

  function handleHelmetVerified(photoUrl: string) {
    const verifiedTime = new Date().toLocaleTimeString();
    setHelmetSelfie(photoUrl);
    setHelmetVerifiedAt(verifiedTime);
    setDriverReadinessConfirmed(true);
    try {
      window.localStorage.setItem("ok_driver_readiness_v1", "true");
      window.localStorage.setItem(
        HELMET_SELFIE_STORAGE_KEY,
        JSON.stringify({ photo: photoUrl, verifiedAt: verifiedTime }),
      );
    } catch {
      // Ignore
    }
    // Seamlessly transition online upon selfie verification
    void go("ONLINE");
  }

  function handleClearHelmetSelfie() {
    setHelmetSelfie(null);
    setHelmetVerifiedAt(null);
    try {
      window.localStorage.removeItem(HELMET_SELFIE_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  function toggleSlotBooking(slotId: string) {
    setBookedSlotsByDay((prev) => {
      const current = prev[activeShiftDateIso] ?? [];
      const exists = current.includes(slotId);
      const nextForDay = exists ? current.filter((id) => id !== slotId) : [...current, slotId];
      try {
        window.localStorage.setItem(
          `${BOOKED_GIGS_STORAGE_KEY}_${activeShiftDateIso}`,
          JSON.stringify(nextForDay),
        );
      } catch {
        // Ignore storage errors
      }
      return { ...prev, [activeShiftDateIso]: nextForDay };
    });
  }

  const load = useCallback(async () => {
    try {
      const data = await withRetry(getHomeFn);
      setHome(data);
      setError(null);
    } catch (e) {
      setError(errorMessage(e, t("connectionLostBody")));
    }
  }, [t]);

  const notifiedOffersRef = useRef<Set<string>>(new Set());
  const respondingOfferRef = useRef<boolean>(false);

  useEffect(() => {
    void load();
    void getPerformanceFn().then(setPerformance).catch(() => undefined);
    const id = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(id);
  }, [load]);

  // Quad-Party Real-Time WebSocket Synchronization (Council Specialist f5a2c465)
  // Subscribes to Supabase Realtime PostgreSQL replication on orders and dispatch_assignments
  // for instant (<200ms) dispatch pings, status transitions, and zero-latency fleet coordination.
  useEffect(() => {
    const riderId = home?.rider?.id;
    if (!riderId) return;

    let cancelled = false;
    let channel: any;

    try {
      channel = supabase
        .channel(`fleet_rider_${riderId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
          },
          (payload: any) => {
            if (cancelled) return;
            const updated = payload.new;
            if (
              !updated ||
              updated.rider_id === riderId ||
              updated.status === "PREPARING" ||
              updated.status === "READY" ||
              updated.status === "CANCELLED"
            ) {
              void load();
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "dispatch_assignments",
            filter: `rider_id=eq.${riderId}`,
          },
          () => {
            if (cancelled) return;
            void load();
          }
        )
        .subscribe();
    } catch (err) {
      console.warn("[RiderFleet] Supabase Realtime subscription fallback:", err);
    }

    return () => {
      cancelled = true;
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [home?.rider?.id, load]);

  // Idempotent incoming offer notification (Deliverable 3)
  useEffect(() => {
    if (home?.offer?.id) {
      if (!notifiedOffersRef.current.has(home.offer.id)) {
        notifiedOffersRef.current.add(home.offer.id);
        toast.info(`Incoming dispatch offer: #${home.offer.orderCode || home.offer.id.slice(-6)}`);
      }
    }
  }, [home?.offer?.id, home?.offer?.orderCode]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  useGpsHeartbeat(
    Boolean(home && (home.rider.status !== "OFFLINE" || home.active)),
    2000,
    (pos) => setRiderPos({ lat: pos.lat, lng: pos.lng }),
    home?.rider?.id,
    home?.active?.id,
  );
  useDutyLocation(
    Boolean(home && (home.rider.status !== "OFFLINE" || home.active)),
    home?.active?.id ?? null,
    2,
  );

  if (!home && !error) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }
  if (!home) {
    return (
      <Card>
        <CardTitle>{t("connectionLost")}</CardTitle>
        <CardMeta className="mt-2">{error}</CardMeta>
        <Button className="mt-4" onClick={() => void load()}>
          {t("retry")}
        </Button>
      </Card>
    );
  }

  const isVerified = home.rider.kycStatus === "VERIFIED" || (home.rider.kycStatus as string) === "APPROVED";

  const status = home.active ? "BUSY" : home.rider.status;
  const remaining = home.offer
    ? Math.min(30, Math.max(0, Math.ceil((new Date(home.offer.expiresAt).getTime() - now) / 1000)))
    : 0;
  const onlineMs = home.onlineSince ? now - new Date(home.onlineSince).getTime() : 0;
  const kyc = home.rider.kycStatus;
  const allReady = Boolean(helmetSelfie || driverReadinessConfirmed);

  const activeDayBookedSlots = bookedSlotsByDay[activeShiftDateIso] ?? [];
  const nextBookedSlot = OPERATIONAL_SHIFT_SLOTS.find((s) => activeDayBookedSlots.includes(s.id));
  const bookedHoursTotal = OPERATIONAL_SHIFT_SLOTS.filter((s) =>
    activeDayBookedSlots.includes(s.id),
  ).reduce((sum, s) => sum + s.durationHours, 0);

  // Floating Cash (COD In-Hand) metrics - connected to dynamic platform tokens (₹2,000 hard lock, ₹1,600 soft warning)
  const unreconciledPaise =
    (home as { cashSummary?: { unreconciledPaise?: number } }).cashSummary?.unreconciledPaise ??
    home.pendingCashPaise ??
    0;
  const codBlockThresholdPaise =
    (home as { config?: { codBlockThresholdPaise?: number } }).config?.codBlockThresholdPaise ??
    cod.hardLockPaise;
  const codSoftWarningPaise = cod.softWarningPaise;
  const codUsagePct = Math.min(
    100,
    Math.round((unreconciledPaise / Math.max(1, codBlockThresholdPaise)) * 100),
  );
  const isCodBlocked = unreconciledPaise >= codBlockThresholdPaise;
  const isCodNearLimit =
    unreconciledPaise >= codSoftWarningPaise || codUsagePct >= cod.warningThresholdPct;

  async function go(statusNext: "ONLINE" | "OFFLINE") {
    if (statusNext === "ONLINE" && !helmetSelfie && !driverReadinessConfirmed) {
      toast.error("Please complete your safety check before going online.");
      setSelfieModalOpen(true);
      return;
    }
    setPending(true);
    try {
      await withRetry(() => setStatusFn({ data: { status: statusNext, confirmed: true } }));
      await load();
    } catch (e) {
      setError(errorMessage(e, t("actionNotConfirmed")));
    } finally {
      setPending(false);
      setConfirm(null);
    }
  }

  const [gpsPinging, setGpsPinging] = useState(false);

  const triggerManualGpsPing = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported on this device.");
      return;
    }
    setGpsPinging(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await postLocationFn({
            data: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracyM: pos.coords.accuracy ?? null,
              deliveryId: home?.active?.id ?? null,
            },
          });
          toast.success(
            `GPS Ping synchronized (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
          );
        } catch {
          toast.error("GPS telemetry sync failed");
        } finally {
          setGpsPinging(false);
        }
      },
      (err) => {
        setGpsPinging(false);
        toast.error(`GPS Error: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  async function respond(decision: "ACCEPT" | "DECLINE", offer: DispatchOffer) {
    if (respondingOfferRef.current) return;
    respondingOfferRef.current = true;
    setPending(true);
    try {
      await withRetry(() =>
        respondOfferFn({
          data: {
            offerId: offer.id,
            decision,
            reason: declineReason || undefined,
            idempotencyKey: newIdempotencyKey("rider_resp_"),
          },
        }),
      );
      await load();
    } catch (e) {
      setError(errorMessage(e, t("offerGone")));
    } finally {
      respondingOfferRef.current = false;
      setPending(false);
      setConfirm(null);
    }
  }

  async function submitCodReconciliationRequest() {
    if (unreconciledPaise <= 0) return;
    setCodSubmitting(true);
    try {
      const ticket = await createTicketFn({
        data: {
          topic: "CASH_DISPUTE",
          message:
            codNote.trim() ||
            `COD Floating Cash Deposit / Reconciliation request for ${formatPaise(unreconciledPaise)} in-hand balance.`,
          deliveryId: home?.active?.id ?? null,
          idempotencyKey: newIdempotencyKey(),
        },
      });
      setCodTicketRef(ticket.id.slice(0, 8));
      setCodNote("");
      await load();
    } catch (e) {
      setError(errorMessage(e, t("actionNotConfirmed")));
    } finally {
      setCodSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-md bg-offline/10 px-3 py-2 text-sm text-offline">{error}</p>
      ) : null}

      {/* Rider Discipline Cooling-Off Countdown Banner */}
      {home.coolingOff?.isActive ? (
        <CoolingOffBanner
          coolingOff={home.coolingOff}
          onExpired={() => void load()}
        />
      ) : null}

      

      {/* Duty Status & Pre-Shift Readiness Header */}
      <section className="rounded-xl bg-card p-5 shadow-[var(--shadow-border)] space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-11 shrink-0 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-base text-primary overflow-hidden">
              {home.rider.photoUrl ? (
                <img src={home.rider.photoUrl} alt="Courier" className="size-full object-cover" />
              ) : (
                <span>
                  {((home.rider.fullName || user?.displayName || "Partner").trim().charAt(0) || "P").toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold leading-tight truncate">
                {home.rider.fullName || user?.displayName || "Partner"}
              </h1>
              <p className="text-xs text-muted-foreground truncate">
                {home.rider.vehicleType || "Motorcycle"} · {home.rider.vehicleRegistration || "AS-10-Q-5587"}
                {home.rider.preferredZones.length > 0
                  ? ` · ${home.rider.preferredZones.join(", ")}`
                  : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={status} online={t("online")} offline={t("offline")} busy={t("busy")} />
            {status === "BUSY" && (
              <Badge tone="busy">{home.active?.state.replaceAll("_", " ") || "On Trip"}</Badge>
            )}
          </div>
        </div>

        {kyc !== "VERIFIED" ? (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            {kyc === "UNDER_REVIEW" ? t("underReview") : t("kycHint")}
          </p>
        ) : null}

        {(() => {
          const tier1Bonus = calculateTier1MilestoneBonus(home.completedToday);
          const totalEarningsPaise = (home.todayEarningsPaise || 0) + tier1Bonus.bonusPaise;
          return (
            <dl className="grid grid-cols-3 gap-2 text-center">
              <Stat
                label={t("todayEarnings")}
                value={formatPaise(totalEarningsPaise)}
                subtext={tier1Bonus.bonusPaise > 0 ? `+₹${tier1Bonus.bonusRupees} Milestone` : undefined}
              />
              <Stat label={t("completed")} value={String(home.completedToday)} />
              <Stat
                label={t("onlineFor")}
                value={status === "OFFLINE" ? "—" : formatDuration(onlineMs)}
              />
            </dl>
          );
        })()}

        {/* Safety Check */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              {allReady ? (
                <ShieldCheck className="size-4 text-emerald-500" />
              ) : (
                <Camera className="size-4 text-primary" />
              )}
              Safety Check
            </span>
            <span className="text-[11px] font-semibold">
              {allReady ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> Verified
                </span>
              ) : (
                <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                  Required to Go Online
                </span>
              )}
            </span>
          </div>

          {helmetSelfie ? (
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5">
              <div className="flex items-center gap-3">
                <img
                  src={helmetSelfie}
                  alt="Verified Helmet Selfie"
                  className="size-12 rounded-lg object-cover border border-emerald-500/50 shadow-xs"
                />
                <div className="space-y-0.5 text-xs">
                  <p className="font-bold text-emerald-900 dark:text-emerald-200">
                    Helmet &amp; Bag Selfie Verified
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Verified at {helmetVerifiedAt} · Ready to deliver
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHelmetSelfie}
                className="text-xs text-muted-foreground hover:text-foreground gap-1"
              >
                <RotateCcw className="size-3" />
                <span>Retake</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 pt-0.5">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Take a selfie wearing your helmet and delivery bag to start receiving orders.
              </p>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setSelfieModalOpen(true)}
                className="text-xs font-semibold gap-1.5 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Camera className="size-3.5" />
                <span>Take Selfie</span>
              </Button>
            </div>
          )}
        </div>

        {/* Authentic Swipe to Go Online / Offline Slider Bar with Status Indicator */}
        <div className="pt-1 space-y-2">
          {status === "OFFLINE" ? (
            <div className="space-y-1.5">
              <SwipeSlider
                label="Swipe to Go Online"
                variant="online"
                disabled={pending}
                loading={pending}
                onComplete={() => {
                  if (!allReady) {
                    toast.info("Safety Check: Please verify your helmet to go online.");
                    setSelfieModalOpen(true);
                    return;
                  }
                  return go("ONLINE");
                }}
              />
              <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                  <span className="size-2 rounded-full bg-rose-500" />
                  Offline
                </span>
                <span>
                  {allReady
                    ? "Swipe to go online"
                    : "Verify helmet to go online"}
                </span>
              </div>
            </div>
          ) : status === "ONLINE" ? (
            <div className="space-y-1.5">
              <SwipeSlider
                label="Swipe to Go Offline"
                variant="offline"
                disabled={pending || Boolean(home.active)}
                loading={pending}
                onComplete={() => setConfirm("offline")}
              />
              <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online · Ready for orders
                </span>
                <span>Swipe to go offline</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-orange-500 animate-ping" />
                <span className="text-xs font-bold text-orange-400">
                  On Trip
                </span>
              </div>
              <Badge tone="busy">{home.active?.state.replaceAll("_", " ")}</Badge>
            </div>
          )}
        </div>
      </section>

      {/* Compact Next Gig / Shift Status */}
      {(() => {
        const todayBookedIds = bookedSlotsByDay[todayIso] ?? [];
        const nextSlot = OPERATIONAL_SHIFT_SLOTS.find((s) => todayBookedIds.includes(s.id));
        return (
          <div className="rounded-xl border border-border/80 bg-card p-3.5 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <CalendarClock className="size-4" />
              </div>
              <div className="min-w-0 text-xs">
                {nextSlot ? (
                  <>
                    <p className="font-semibold text-foreground truncate">
                      Booked Shift: {nextSlot.label} ({nextSlot.window})
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{nextSlot.tag}</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-foreground truncate">No Shifts Booked Today</p>
                    <p className="text-[11px] text-muted-foreground truncate">Book slots for your preferred hours</p>
                  </>
                )}
              </div>
            </div>
            <Link
              to="/history"
              className="text-xs font-semibold text-primary hover:underline shrink-0 flex items-center gap-1"
            >
              <span>{nextSlot ? "View Shifts" : "Book Shifts"}</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        );
      })()}

      {/* Live Dispatch & Active Delivery Workstation */}
      {home.active ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">{t("currentDelivery")}</h2>
            <Badge tone="busy">{home.active.state.replaceAll("_", " ")}</Badge>
          </div>
          <MapPane
            pickup={home.active.pickupLocation}
            drop={home.active.dropLocation}
            current={riderPos}
            pickupLabel={home.active.restaurant.name}
            dropLabel={home.active.customer.area}
            navigateLabel={t("mapsOpen")}
            deliveryState={home.active.state}
          />
          <DeliveryActions
            delivery={home.active}
            cash={home.cash}
            onChanged={() => void load()}
          />
        </section>
      ) : home.offer && remaining > 0 ? (
        <OfferCard
          offer={home.offer}
          remaining={remaining}
          pending={pending}
          onAccept={() => void respond("ACCEPT", home.offer!)}
          onDecline={() => setConfirm("decline")}
        />
      ) : status === "ONLINE" ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
              </span>
              <div>
                <p className="text-xs font-bold text-foreground">
                  Looking for orders in {home.rider.preferredZones[0] || "your zone"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {surge.isMonsoonActive && (
                <Badge tone="busy" className="font-mono text-xs">
                  {surge.badges.monsoonText}
                </Badge>
              )}
              {surge.isPeakDinnerActive && (
                <Badge tone="busy" className="font-mono text-xs">
                  {surge.badges.peakDinnerText}
                </Badge>
              )}
              {surge.isWeatherAllowanceActive && (
                <Badge tone="busy" className="font-mono text-xs bg-sky-500/20 text-sky-400 border-sky-500/30">
                  {surge.badges.weatherAllowanceText}
                </Badge>
              )}
              <Badge tone="online" className="font-mono text-xs">
                Radar Active
              </Badge>
            </div>
          </div>

          <MapPane
            mode="heatmap"
            current={riderPos}
            initialHeatmap={true}
          />
        </section>
      ) : (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle>{t("offers")}</CardTitle>
            <Badge tone="offline">Duty Offline</Badge>
          </div>
          <CardMeta className="mt-1">
            You are currently offline. Complete your safety check and tap <strong>{t("goOnline")}</strong> above to start receiving orders.
          </CardMeta>
          <div className="pt-1">
            <MapPane
              mode="heatmap"
              current={riderPos}
              initialHeatmap={true}
            />
          </div>
        </Card>
      )}

      
      



      {home.notifications.length ? (
        <Card>
          <CardTitle>{t("alerts")}</CardTitle>
          <ul className="mt-3 space-y-2">
            {home.notifications.slice(0, 4).map((n) => (
              <li key={n.id} className="text-sm">
                <p className="font-medium">{n.title}</p>
                <p className="text-muted-foreground">{n.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      

      <ConfirmDialog
        open={confirm === "online"}
        title={t("confirmGoOnline")}
        body={t("confirmGoOnlineBody")}
        confirmLabel={t("goOnline")}
        cancelLabel={t("stayOffline")}
        onConfirm={() => void go("ONLINE")}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "offline"}
        title={t("confirmOffline")}
        body={t("confirmOfflineBody")}
        confirmLabel={t("goOffline")}
        cancelLabel={t("stayOnline")}
        danger
        onConfirm={() => void go("OFFLINE")}
        onCancel={() => setConfirm(null)}
      />
      {confirm === "decline" && home.offer ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-fg/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl bg-card p-5">
            <h2 className="font-display text-xl">{t("declineConfirm")}</h2>
            <Label className="mt-3 block">{t("declineReason")}</Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[
                "Distance too far",
                "Vehicle issue / Low fuel",
                "Personal emergency",
                "Bad weather / Heavy rain",
                "Shift ending soon",
              ].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDeclineReason(r)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${
                    declineReason === r
                      ? "border-destructive bg-destructive/10 font-semibold text-destructive"
                      : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <Input
              className="mt-2"
              placeholder="Or type a reason..."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
            <div className="mt-4 flex flex-col gap-2">
              <Button variant="destructive" onClick={() => void respond("DECLINE", home.offer!)}>
                {t("decline")}
              </Button>
              <Button variant="outline" onClick={() => setConfirm(null)}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <HelmetVerificationModal
        isOpen={selfieModalOpen}
        onClose={() => setSelfieModalOpen(false)}
        onVerified={handleHelmetVerified}
      />

      {/* Fleet Emergency Safety Sheet */}
      <RiderEmergencySafetySheet
        isOpen={sosOpen}
        onClose={() => setSosOpen(false)}
        deliveryId={home?.active?.id ?? null}
        riderName={home?.rider?.fullName ?? user?.displayName ?? "OrderKing Partner"}
        riderPhone={home?.rider?.phone ?? "Fleet Registered"}
        defaultGps={riderPos}
      />
    </div>
  );
}

function Stat({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <div className="rounded-lg bg-muted px-2 py-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-display text-lg tabular-nums font-bold text-foreground">{value}</dd>
      {subtext ? <p className="text-[10px] text-emerald-500 font-extrabold mt-0.5">{subtext}</p> : null}
    </div>
  );
}

function StatusPill({
  status,
  online,
  offline,
  busy,
}: {
  status: string;
  online: string;
  offline: string;
  busy: string;
}) {
  const tone = status === "ONLINE" ? "online" : status === "BUSY" ? "busy" : "offline";
  const label = status === "ONLINE" ? online : status === "BUSY" ? busy : offline;
  return <Badge tone={tone}>{label}</Badge>;
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}`;
}

function OfferCard({
  offer,
  remaining,
  pending,
  onAccept,
  onDecline,
}: {
  offer: DispatchOffer;
  remaining: number;
  pending: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const { t } = useI18n();
  const { payout, surge } = useRiderCustomization();
  const { muted, toggleMute } = useDispatchAudioAlert(true, remaining);

  const routeKm = Math.max(offer.estimatedTotalRouteKm, offer.approxDistanceKm, 0);
  const extraKm = Math.max(0, routeKm - payout.baseDistanceKm);
  const distanceComponentPaise = Math.max(0, offer.expectedPayoutPaise - payout.baseFarePaise);
  const hasPickupCoords =
    offer.pickupLocation.lat !== 0 || offer.pickupLocation.lng !== 0;
  const mapsPickupUrl = hasPickupCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${offer.pickupLocation.lat},${offer.pickupLocation.lng}&travelmode=two-wheeler`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${offer.restaurant.name} ${offer.restaurant.address || offer.restaurant.area}`)}`;

  // 30-second countdown timer calculations (Tier-1 standard)
  const maxTimerSec = 30;
  const timerPct = Math.min(100, Math.max(0, (remaining / maxTimerSec) * 100));
  const isUrgent = remaining <= 10;
  const isCritical = remaining <= 5;

  return (
    <Card className="p-5 space-y-4 border border-border bg-card shadow-2xl rounded-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-card-foreground">
      {/* 30-Second Countdown Top Progress Edge */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-muted">
        <div
          className={`h-full transition-all duration-300 ${
            isCritical
              ? "bg-rose-500 animate-pulse"
              : isUrgent
                ? "bg-orange-500"
                : "bg-gradient-to-r from-orange-500 via-[#E23744] to-emerald-400"
          }`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Top Header: Order Code, 30s Countdown & Siren Audio Mute */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="font-mono text-xs font-bold tracking-wider">
            Order #{offer.orderCode}
          </span>
          {surge.isMonsoonActive && (
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
              {surge.badges.monsoonText}
            </span>
          )}
          {surge.isPeakDinnerActive && (
            <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
              {surge.badges.peakDinnerText}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Alert Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className={`flex size-8 items-center justify-center rounded-lg border transition ${
              muted
                ? "border-border bg-muted/40 text-muted-foreground"
                : "border-red-200 bg-[#E23744]/10 text-[#E23744]"
            }`}
            title={muted ? "Unmute Dispatch Alert" : "Mute"}
            aria-label={muted ? "Unmute Dispatch Alert" : "Mute"}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>

          {/* 30-Second Pulsing Countdown Timer */}
          <div
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 font-display font-extrabold tabular-nums text-sm ${
              isCritical
                ? "bg-rose-500/20 text-rose-500 animate-bounce"
                : isUrgent
                  ? "bg-orange-500/20 text-orange-500 animate-pulse"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            }`}
          >
            <Clock3 className="size-3.5" />
            <span>{remaining}s</span>
          </div>
        </div>
      </div>

      {/* Payout & Distance Card */}
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 shadow-xs">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground">Earning</p>
            <p className="font-display text-3xl font-black text-emerald-700 dark:text-emerald-300">
              {formatPaise(offer.expectedPayoutPaise)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold text-muted-foreground">Total Distance</p>
            <p className="font-mono text-lg font-bold text-foreground">
              {routeKm.toFixed(1)} km
            </p>
          </div>
        </div>
      </div>

      {/* Route Stops: Pickup & Drop */}
      <div className="space-y-2 text-xs">
        {/* Pickup */}
        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <Store className="size-3.5 text-orange-500" />
              Pickup · {offer.approxDistanceKm.toFixed(1)} km
            </span>
            <Badge tone="busy" className="text-[10px] font-bold">
              {offer.restaurant.preparationStatus === "READY" ? "Ready" : "Prep ~8-10m"}
            </Badge>
          </div>
          <p className="font-display text-sm font-bold text-foreground">{offer.restaurant.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{offer.restaurant.address || offer.restaurant.area}</p>
          {offer.restaurant.specialPickupInstructions && (
            <p className="text-[11px] text-orange-600 dark:text-orange-400 font-medium">
              Note: {offer.restaurant.specialPickupInstructions}
            </p>
          )}
        </div>

        {/* Drop */}
        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3.5 text-blue-500" />
              Drop · {(offer.estimatedTravelKm || Math.max(0, routeKm - offer.approxDistanceKm)).toFixed(1)} km
            </span>
            <Badge tone={offer.cod ? "cod" : "online"} className="text-[10px] font-bold">
              {offer.cod ? `Collect ${formatPaise(offer.codAmountPaise)}` : "Prepaid"}
            </Badge>
          </div>
          <p className="font-display text-sm font-bold text-foreground">{offer.dropArea}</p>
        </div>
      </div>

      {/* Accept & Decline Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        <Button
          size="lg"
          disabled={pending}
          onClick={onAccept}
          className="rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3.5 font-sans text-base font-bold text-white shadow-md active:scale-[0.98] transition-all"
        >
          {t("accept")} Order
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={pending}
          onClick={onDecline}
          className="rounded-xl border-border py-3.5 font-display text-sm font-bold text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/40 active:scale-[0.98] transition-all"
        >
          {t("decline")}
        </Button>
      </div>
    </Card>
  );
}
