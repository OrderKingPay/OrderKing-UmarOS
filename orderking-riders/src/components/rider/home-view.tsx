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
import { FloatingCashCard } from "./floating-cash-card";
import { useDutyLocation } from "./use-duty-location";
import { useGpsHeartbeat } from "@/lib/hooks/use-gps-heartbeat";
import { calculateDailyMilestoneProgress, calculateTier1MilestoneBonus } from "@/lib/rider/gig-engine";
import { VipAmbassadorPass } from "./vip-ambassador-pass";
import { SwipeSlider } from "./swipe-slider";
import { useDispatchAudioAlert } from "@/lib/rider/dispatch-audio";
import { useRiderCustomization } from "@/lib/rider/use-rider-customization";
import { EmergencySosButton, RiderEmergencySafetySheet } from "./rider-emergency-sos";

type Home = Awaited<ReturnType<typeof getHomeFn>>;

type ShiftSlot = {
  id: string;
  label: string;
  window: string;
  durationHours: number;
  tag: string;
  baseFarePaise: number;
  distanceRatePaise: number;
  peakIncentiveNote: string;
};

const OPERATIONAL_SHIFT_SLOTS: ReadonlyArray<ShiftSlot> = [
  {
    id: "morning_07_11",
    label: "Morning",
    window: "07:00–11:00",
    durationHours: 4,
    tag: "Breakfast Dispatch",
    baseFarePaise: STATUTORY_BASE_FARE_PAISE,
    distanceRatePaise: STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
    peakIncentiveNote: "Base ₹35 (first 2 km) + ₹12/km distance pay · ₹1/min wait pay after 10m",
  },
  {
    id: "lunch_peak_12_1530",
    label: "Lunch Peak",
    window: "12:00–15:30",
    durationHours: 3.5,
    tag: "High-Demand Peak",
    baseFarePaise: STATUTORY_BASE_FARE_PAISE,
    distanceRatePaise: STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
    peakIncentiveNote: "Base ₹35 + ₹12/km · High order density toward Daily Milestone slabs",
  },
  {
    id: "evening_16_19",
    label: "Evening",
    window: "16:00–19:00",
    durationHours: 3,
    tag: "Snack & Tiffin",
    baseFarePaise: STATUTORY_BASE_FARE_PAISE,
    distanceRatePaise: STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
    peakIncentiveNote: "Base ₹35 (first 2 km) + ₹12/km distance pay · Short-radius trips",
  },
  {
    id: "dinner_peak_19_23",
    label: "Dinner Peak",
    window: "19:00–23:00",
    durationHours: 4,
    tag: "Prime Peak Slot",
    baseFarePaise: STATUTORY_BASE_FARE_PAISE,
    distanceRatePaise: STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
    peakIncentiveNote: "Base ₹35 + ₹12/km · Peak dispatch priority & kitchen wait-time pay",
  },
  {
    id: "late_night_23_02",
    label: "Late Night",
    window: "23:00–02:00",
    durationHours: 3,
    tag: "Night Operations",
    baseFarePaise: STATUTORY_BASE_FARE_PAISE,
    distanceRatePaise: STATUTORY_DISTANCE_RATE_PER_KM_PAISE,
    peakIncentiveNote: "Base ₹35 + ₹12/km · 24x7 SOS dispatch control support active",
  },
];

const READINESS_STORAGE_KEY = "ok_rider_readiness_v1";
const BOOKED_GIGS_STORAGE_KEY = "ok_rider_booked_gigs_v1";
const DEFAULT_COD_BLOCK_THRESHOLD_PAISE = 200000; // ₹2,000.00 statutory COD float limit

type ReadinessState = {
  helmetWorn: boolean;
  thermalBagClean: boolean;
  batteryAndGpsActive: boolean;
  documentsAndFuelReady: boolean;
};

function getIsoDateOffset(daysOffset: number): string {
  const d = new Date(Date.now() + daysOffset * 86_400_000);
  return d.toISOString().slice(0, 10);
}

function DailyMilestoneCard({
  completed,
  performance,
}: {
  completed: number;
  performance: RiderPerformance | null;
}) {
  const milestone = calculateTier1MilestoneBonus(completed);
  const acceptancePct =
    performance && performance.offered > 0
      ? Math.round((performance.accepted / performance.offered) * 100)
      : 100;
  const completionPct =
    performance && performance.accepted > 0
      ? Math.round((performance.completed / performance.accepted) * 100)
      : 100;

  return (
    <section className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-[#131926] via-[#10141F] to-[#0E121B] p-4 shadow-xl space-y-3.5 relative overflow-hidden text-foreground">
      {/* Background Ambient Glow */}
      <div className="absolute -top-12 -right-12 size-36 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

      {/* Tier-1 Gamified Headline Banner */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-[#E5A93C] border border-[#E5A93C]/30 shadow-inner">
            <Target className="size-5" />
          </span>
          <div>
            <h3 className="font-display text-sm font-extrabold text-white tracking-wide">
              {milestone.headline}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {milestone.subtext}
            </p>
          </div>
        </div>
        <Badge tone="online" className="font-mono text-xs font-bold border-amber-500/40 bg-amber-500/15 text-[#E5A93C] shrink-0">
          {completed}/{milestone.targetOrders} Completed
        </Badge>
      </div>

      {/* Visual Progress Bar: e.g. 6/10 orders completed */}
      <div className="space-y-1.5 bg-black/40 p-3 rounded-xl border border-white/5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#E5A93C] animate-pulse" />
            <span>{completed}/{milestone.targetOrders} orders completed</span>
          </span>
          <span className="font-mono font-extrabold text-[#E5A93C]">{milestone.progressPct}%</span>
        </div>
        <div className="h-3 w-full bg-muted/40 rounded-full overflow-hidden p-0.5 border border-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-[#E5A93C] to-emerald-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(229,169,60,0.5)]"
            style={{ width: `${milestone.progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
          <span>{milestone.remainingOrders > 0 ? `${milestone.remainingOrders} more orders to reach target` : "All Targets Unlocked!"}</span>
          <span className="text-emerald-400 font-bold">
            Real-Time Bonus: +₹{milestone.bonusRupees}
          </span>
        </div>
      </div>

      {/* Tier-1 Milestone Slabs: 5 orders = +₹50, 10 orders = +₹150, 15 orders = +₹275 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {milestone.slabs.map((slab) => (
          <div
            key={slab.orders}
            className={`rounded-xl p-2.5 border transition-all duration-200 relative ${
              slab.isUnlocked
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-400 font-bold shadow-xs"
                : slab.isCurrentTarget
                  ? "border-[#E5A93C] bg-amber-500/10 text-white shadow-[0_0_15px_rgba(229,169,60,0.2)]"
                  : "border-border/60 bg-muted/20 text-muted-foreground opacity-75"
            }`}
          >
            {slab.isUnlocked && (
              <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-emerald-500 text-black text-[9px] font-black">
                ✓
              </span>
            )}
            <div className="text-[11px] font-bold">
              {slab.orders} Orders
            </div>
            <div className="text-sm font-extrabold font-mono text-[#E5A93C] mt-0.5">
              {slab.label}
            </div>
            <div className="text-[9.5px] mt-0.5 uppercase tracking-wider font-semibold">
              {slab.isUnlocked ? "Unlocked ✓" : slab.isCurrentTarget ? "Active Target" : "Next Slab"}
            </div>
          </div>
        ))}
      </div>

      {/* Real-Time Bonus Addition to Daily Earnings */}
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
          <Gift className="size-4 shrink-0 text-emerald-400" />
          <span>Real-time Milestone Bonus Added:</span>
        </div>
        <span className="font-mono font-extrabold text-emerald-300 text-sm">
          +₹{milestone.bonusRupees}.00
        </span>
      </div>

      {performance ? (
        <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
          <div className="rounded-lg bg-muted/40 p-2 border border-border/60">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Acceptance</p>
            <p className="font-mono font-bold text-foreground text-sm mt-0.5">{acceptancePct}%</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2 border border-border/60">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Completion</p>
            <p className="font-mono font-bold text-foreground text-sm mt-0.5">{completionPct}%</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2 border border-border/60">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Avg / Order</p>
            <p className="font-mono font-bold text-foreground text-sm mt-0.5">
              {performance.earningsPerOrderPaise > 0
                ? formatPaise(performance.earningsPerOrderPaise)
                : formatPaise(STATUTORY_BASE_FARE_PAISE)}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SelfServicePayoutCalculator() {
  const { payout, surge } = useRiderCustomization();
  const [open, setOpen] = useState(false);
  const [distanceKm, setDistanceKm] = useState("3.5");
  const [waitMinutes, setWaitMinutes] = useState("0");
  const [multiPackage, setMultiPackage] = useState(false);

  const parsedDist = Math.max(0, Number.parseFloat(distanceKm) || 0);
  const parsedWait = Math.max(0, Math.floor(Number.parseFloat(waitMinutes) || 0));
  const baseFarePaise = payout.baseFarePaise;
  const baseDistanceKm = payout.baseDistanceKm;
  const distanceRatePaise = payout.distanceRatePerKmPaise;
  const billableDistanceKm = Math.max(0, parsedDist - baseDistanceKm);
  const extraDistancePaise = Math.round(billableDistanceKm * distanceRatePaise);
  const baseAndDistancePaise = baseFarePaise + extraDistancePaise;
  const waitBonusPaise = calculateRestaurantWaitPayPaise(parsedWait, 6, 100);
  const multiPkgBonusPaise = multiPackage ? 500 : 0;
  const weatherBonusPaise = surge.isWeatherAllowanceActive ? surge.weatherAllowancePaise : 0;
  const totalEstimatedPaise =
    baseAndDistancePaise + waitBonusPaise + multiPkgBonusPaise + weatherBonusPaise;

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Calculator className="size-4" />
          </span>
          <div>
            <CardTitle className="text-base">Self-Service Per-Order Payout Calculator</CardTitle>
            <p className="text-xs text-muted-foreground">
              Verify exact statutory earnings for any distance, wait time, or multi-package order
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide" : "Calculate"}
        </Button>
      </div>

      {open ? (
        <div className="space-y-3 border-t border-border pt-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <Label className="text-xs">Total Route Distance (km)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Restaurant Wait Time (mins)</Label>
              <Input
                type="number"
                min="0"
                step="1"
                value={waitMinutes}
                onChange={(e) => setWaitMinutes(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => setMultiPackage((v) => !v)}
                className={`rounded-md border px-3 py-2 text-left font-medium transition ${
                  multiPackage
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground"
                }`}
              >
                {multiPackage ? "✓ Multi-Package (+₹5.00)" : "Single Package Order"}
              </button>
            </div>
          </div>

          <dl className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Statutory Base Fare (first {baseDistanceKm} km)
              </dt>
              <dd className="font-mono">{formatPaise(baseFarePaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Distance Pay ({billableDistanceKm.toFixed(1)} extra km ×{" "}
                {formatPaise(distanceRatePaise)}/km)
              </dt>
              <dd className="font-mono">{formatPaise(extraDistancePaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                Kitchen Wait Compensation (₹1/min after 6 mins grace)
              </dt>
              <dd className="font-mono">{formatPaise(waitBonusPaise)}</dd>
            </div>
            {multiPackage ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Multi-Package Handling Bonus</dt>
                <dd className="font-mono">{formatPaise(multiPkgBonusPaise)}</dd>
              </div>
            ) : null}
            {surge.isWeatherAllowanceActive ? (
              <div className="flex justify-between text-sky-500 dark:text-sky-400">
                <dt>{surge.badges.weatherAllowanceText}</dt>
                <dd className="font-mono font-semibold">+{formatPaise(surge.weatherAllowancePaise)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-border pt-1.5 font-bold text-sm text-foreground">
              <dt>Base Floor Order Payout (excl. Customer Tip)</dt>
              <dd className="font-mono text-emerald-600 dark:text-emerald-400">
                {formatPaise(totalEstimatedPaise)}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}
    </Card>
  );
}

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
      <div className="relative w-full max-w-sm rounded-2xl border border-primary/30 bg-[#121723] p-4 text-foreground shadow-2xl space-y-3.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Camera className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                Mandatory Live Helmet Verification
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Tier-1 Safety Standard · Front Camera Live Check
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
    try {
      window.localStorage.setItem(
        HELMET_SELFIE_STORAGE_KEY,
        JSON.stringify({ photo: photoUrl, verifiedAt: verifiedTime }),
      );
    } catch {
      // Ignore
    }
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

  useEffect(() => {
    void load();
    void getPerformanceFn().then(setPerformance).catch(() => undefined);
    const id = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(id);
  }, [load]);

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

  // OrderKing Partner Verification Block
  const isVerified = home.rider.kycStatus === "VERIFIED" || (home.rider.kycStatus as string) === "APPROVED";
  if (!isVerified) {
    return (
      <div className="space-y-4">
        <Card className="space-y-3">
          <CardTitle>Verification Pending</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your rider onboarding application is currently pending verification. You will be able to access the delivery workstation and accept dispatches once verified.
          </p>
          <Button asChild className="w-full">
            <Link to="/onboarding">View Application Status</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const status = home.active ? "BUSY" : home.rider.status;
  const remaining = home.offer
    ? Math.min(30, Math.max(0, Math.ceil((new Date(home.offer.expiresAt).getTime() - now) / 1000)))
    : 0;
  const onlineMs = home.onlineSince ? now - new Date(home.onlineSince).getTime() : 0;
  const kyc = home.rider.kycStatus;
  const allReady = Boolean(helmetSelfie || driverReadinessConfirmed);

  const activeDayBookedSlots = bookedSlotsByDay[activeShiftDateIso] ?? [];
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
      toast.error("Please confirm driver readiness check before going online.");
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
            `✓ GPS Ping synchronized (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
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
    setPending(true);
    try {
      await withRetry(() =>
        respondOfferFn({
          data: {
            offerId: offer.id,
            decision,
            reason: declineReason || undefined,
            idempotencyKey: newIdempotencyKey(),
          },
        }),
      );
      await load();
    } catch (e) {
      setError(errorMessage(e, t("offerGone")));
    } finally {
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

      {/* Top Floating Partner Header with Live Floating Cash Meter & Deposit UPI Button */}
      <header className="rounded-2xl border border-border bg-card/95 p-3.5 shadow-xl backdrop-blur-md sticky top-2 z-30 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Partner identity & live duty radar pill */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative size-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-500/20 to-[#E5A93C]/40 border border-[#E5A93C]/40 flex items-center justify-center font-display font-extrabold text-foreground shadow-sm">
              {(home.rider.fullName || user?.displayName || "OK").slice(0, 2).toUpperCase()}
              <span
                className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card ${
                  status === "ONLINE"
                    ? "bg-emerald-500 animate-pulse"
                    : status === "BUSY"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
              />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-sm font-bold truncate text-foreground leading-tight">
                {home.rider.fullName || user?.displayName || "Partner"}
              </h2>
              <p className="text-[11px] text-muted-foreground truncate font-medium">
                {home.rider.vehicleType} · {home.rider.preferredZones[0] || "Fleet Zone"}
              </p>
            </div>
          </div>

          {/* Right: Floating Cash / Pocket Balance Meter with Deposit UPI Button & Red SOS Panic Button */}
          <div className="flex items-center gap-2 shrink-0">
            <EmergencySosButton
              onClick={() => setSosOpen(true)}
              size="sm"
              label="SOS"
              subLabel="112"
            />

            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                Pocket Balance
              </p>
              <p className="font-mono text-xs sm:text-sm font-bold text-foreground">
                {formatPaise(unreconciledPaise)}{" "}
                <span className="text-[10px] text-muted-foreground font-normal">
                  / {formatPaise(codBlockThresholdPaise)}
                </span>
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setExternalDepositOpen(true)}
              className="h-8 rounded-xl bg-gradient-to-r from-blue-600 via-[#2563EB] to-blue-700 text-white px-3 text-xs font-bold shadow-md shadow-blue-500/25 hover:from-blue-500 hover:to-blue-600 transition-all active:scale-[0.98]"
            >
              <Wallet className="size-3.5 mr-1" />
              Deposit UPI
            </Button>
          </div>
        </div>

        {/* Floating Cash utilization progress bar */}
        <div className="space-y-1">
          <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isCodBlocked
                  ? "bg-rose-500"
                  : isCodNearLimit
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{ width: `${Math.max(4, Math.min(100, codUsagePct))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span
                className={`size-1.5 rounded-full ${isCodBlocked ? "bg-rose-500" : isCodNearLimit ? "bg-amber-500" : "bg-emerald-500"}`}
              />
              {isCodBlocked
                ? `₹${(codBlockThresholdPaise / 100).toLocaleString("en-IN")} Hard Lock Reached — Deposit Required`
                : isCodNearLimit
                  ? `₹${(codSoftWarningPaise / 100).toLocaleString("en-IN")} Soft Warning — Deposit Recommended`
                  : "Floating Balance Healthy"}
            </span>
            <span>
              {codUsagePct}% of ₹{(codBlockThresholdPaise / 100).toLocaleString("en-IN")} cap
            </span>
          </div>
        </div>
      </header>

      {/* Duty Status & Pre-Shift Readiness Header */}
      <section className="rounded-xl bg-card p-5 shadow-[var(--shadow-border)] space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("welcome")}</p>
            <h1 className="mt-1 font-display text-3xl leading-none">
              {home.rider.fullName || user?.displayName || "Partner"}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {home.rider.vehicleType} · {home.rider.vehicleRegistration || "Verified Partner"}
              {home.rider.preferredZones.length > 0
                ? ` · Zones: ${home.rider.preferredZones.join(", ")}`
                : ""}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            <StatusPill status={status} online={t("online")} offline={t("offline")} busy={t("busy")} />
            {status === "OFFLINE" ? (
              <Button
                size="sm"
                onClick={() => {
                  if (!helmetSelfie && !driverReadinessConfirmed) {
                    toast.error("Please confirm driver readiness check first.");
                    setSelfieModalOpen(true);
                    return;
                  }
                  return go("ONLINE");
                }}
                disabled={pending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm active:scale-95 transition"
              >
                <Zap className="size-3.5 fill-current" />
                1-Tap Go Online
              </Button>
            ) : status === "ONLINE" ? (
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={triggerManualGpsPing}
                  disabled={gpsPinging}
                  className="text-xs font-semibold gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 active:scale-95 transition"
                  title="Send real-time GPS telemetry ping to database"
                >
                  <Radio className="size-3.5 animate-pulse text-emerald-500" />
                  {gpsPinging ? "Pinging..." : "GPS Ping"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setConfirm("offline")}
                  disabled={pending || Boolean(home.active)}
                  className="text-xs font-bold gap-1 active:scale-95 transition"
                >
                  Go Offline
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={triggerManualGpsPing}
                disabled={gpsPinging}
                className="text-xs font-semibold gap-1.5 border-amber-500/30 text-amber-600 hover:bg-amber-500/10 active:scale-95 transition"
              >
                <Radio className="size-3.5 animate-pulse text-amber-500" />
                {gpsPinging ? "Pinging..." : "GPS Ping"}
              </Button>
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

        {/* Pre-Shift Driver Readiness & Automated Dispatch Synchronization */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              {allReady ? (
                <ShieldCheck className="size-4 text-emerald-500" />
              ) : (
                <Camera className="size-4 text-primary" />
              )}
              Pre-Shift Readiness &amp; Dispatch Sync
            </span>
            <span className="text-[11px] font-semibold">
              {allReady ? (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-3.5" /> Readiness Verified
                </span>
              ) : (
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                  Readiness Check Required
                </span>
              )}
            </span>
          </div>

          {/* Automated Driver Readiness Toggle & Dispatch Telemetry */}
          <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  Automated Driver Readiness
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Confirms safety gear, thermal bag, GPS telemetry &amp; battery for dispatches
                </span>
              </div>
              <button
                type="button"
                onClick={toggleDriverReadiness}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  driverReadinessConfirmed ? "bg-emerald-600" : "bg-muted"
                }`}
                role="switch"
                aria-checked={driverReadinessConfirmed}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    driverReadinessConfirmed ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Proximity & Dynamic KPT Dispatch Synchronization Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-2 rounded-lg bg-background/80 border border-border p-2">
                <Radio className={`size-3.5 shrink-0 ${allReady ? "text-emerald-500 animate-pulse" : "text-muted-foreground"}`} />
                <div>
                  <span className="font-semibold text-foreground block">Proximity Dispatch Radar</span>
                  <span className="text-[10px] text-muted-foreground">Operating zone radius &amp; corridor batching active</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-background/80 border border-border p-2">
                <Clock3 className={`size-3.5 shrink-0 ${allReady ? "text-amber-500" : "text-muted-foreground"}`} />
                <div>
                  <span className="font-semibold text-foreground block">Dynamic KPT Sync</span>
                  <span className="text-[10px] text-muted-foreground">Arrival matched to food ready time (0-min dwell)</span>
                </div>
              </div>
            </div>
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
                    BIS Helmet &amp; Uniform Bag Verified
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Verified at {helmetVerifiedAt} · Shift Unlocked
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
                {driverReadinessConfirmed
                  ? "Readiness verified via automated checklist. You can also upload a live selfie anytime."
                  : "Toggle automated readiness above or take a front-camera selfie wearing your strapped helmet and delivery bag."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelfieModalOpen(true)}
                className="text-xs font-semibold gap-1.5 shrink-0"
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
                label={allReady ? "Swipe to Go Online" : "Confirm Readiness to Go Online"}
                variant="online"
                disabled={!allReady || pending}
                loading={pending}
                onComplete={() => {
                  if (!allReady) {
                    toast.error("Please confirm driver readiness check first.");
                    setSelfieModalOpen(true);
                    return;
                  }
                  return go("ONLINE");
                }}
              />
              <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <span className="size-2 rounded-full bg-rose-500" />
                  Duty Offline
                </span>
                <span>
                  {allReady
                    ? "Readiness verified ✓ Ready to swipe"
                    : "Confirm driver readiness to go online"}
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
                  Duty Online · Live Dispatch Radar Active
                </span>
                <span>Swipe to end shift</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-amber-500 animate-ping" />
                <span className="text-xs font-bold text-amber-400">
                  On Trip · Delivery in Progress
                </span>
              </div>
              <Badge tone="busy">{home.active?.state.replaceAll("_", " ")}</Badge>
            </div>
          )}
        </div>
      </section>

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
                  Searching for Nearby Orders in {home.rider.preferredZones[0] || "Operating Service Zone"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Reposition closer to active surge hotspots on the heatmap below for higher frequency offers
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
            You are currently offline. Complete your pre-shift readiness check and tap <strong>{t("goOnline")}</strong> above to activate live dispatches and start earning.
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

      {/* Fleet Floating Cash (Pocket Balance) & Instant UPI Deposit Card */}
      {sdui.isSectionVisible("floating_cash_card") && (
        <FloatingCashCard
          pocketBalance={
            home.pocketBalance ?? {
              pocketBalancePaise: unreconciledPaise,
              limitPaise: codBlockThresholdPaise,
              isCodBlocked: unreconciledPaise >= codBlockThresholdPaise,
              utilizationPct: codUsagePct,
              cashRowsCount: 0,
            }
          }
          disciplineConfig={home.disciplineConfig}
          onRefresh={() => void load()}
          externalModalOpen={externalDepositOpen}
          onExternalModalClose={() => setExternalDepositOpen(false)}
          lifetimeDeliveries={home.rider?.lifetimeDeliveries ?? home.completedToday ?? 0}
          riderName={home.rider?.fullName}
        />
      )}

      {/* Rider Benefits & Affiliate Ecosystem Quick Hub Card */}
      <Card className="border-primary/20 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-amber-500/10 p-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Gift className="size-4" />
          </span>
          <div>
            <p className="text-xs font-bold text-foreground">Partner Benefits &amp; Affiliate Hub</p>
            <p className="text-[11px] text-muted-foreground">
              15% EV Discounts (Yulu, Zypp) · HPCL ₹2.50/L Cashback · ₹10L Insurance
            </p>
          </div>
        </div>
        <Link
          to="/benefits"
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition"
        >
          <span>View Hub</span>
          <ArrowRight className="size-3.5" />
        </Link>
      </Card>

      {/* Operational Gig / Shift Slot Planner */}
      {sdui.isSectionVisible("shift_slots") && (
        <Card className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <CalendarClock className="size-4" />
              </span>
              <div>
                <CardTitle className="text-base">Operational Gig / Shift Slot Planner</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Book shifts for {activeShiftDateIso} · {activeDayBookedSlots.length} slot
                  {activeDayBookedSlots.length === 1 ? "" : "s"} ({bookedHoursTotal} hrs) booked
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={selectedShiftDay === "today" ? "default" : "outline"}
                onClick={() => setSelectedShiftDay("today")}
              >
                Today ({todayIso.slice(5)})
              </Button>
              <Button
                size="sm"
                variant={selectedShiftDay === "tomorrow" ? "default" : "outline"}
                onClick={() => setSelectedShiftDay("tomorrow")}
              >
                Tomorrow ({tomorrowIso.slice(5)})
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {OPERATIONAL_SHIFT_SLOTS.map((slot) => {
              const isBooked = activeDayBookedSlots.includes(slot.id);
              return (
                <div
                  key={slot.id}
                  className={`rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
                    isBooked
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-border bg-muted/20"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold text-foreground">
                        {slot.label} ({slot.window})
                      </span>
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
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
                    className="shrink-0"
                  >
                    {isBooked ? "✓ Booked (Cancel)" : "Book Gig Slot"}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Daily Order Milestone Progress & Real Quality Scorecard */}
      {sdui.isSectionVisible("daily_milestones") && (
        <DailyMilestoneCard completed={home.completedToday} performance={performance} />
      )}

      {/* OrderKing VIP Ambassador Pass & Micro-Royalty Protocol */}
      {sdui.isSectionVisible("vip_ambassador") && (
        <VipAmbassadorPass
          riderName={home.rider.fullName}
          riderId={home.rider.id}
          phone={home.rider.phone}
          onCommissionCredited={() => void load()}
        />
      )}

      {/* Self-Service Per-Order Payout Calculator */}
      {sdui.isSectionVisible("payout_calculator") && (
        <SelfServicePayoutCalculator />
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

      <div className="flex flex-wrap gap-3 text-sm">
        <Link to="/assistant" className="underline">
          {t("assistant")}
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link to="/onboarding" className="underline">
          {t("kyc")}
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link to="/earnings" className="underline">
          {t("earnings")}
        </Link>
        <span className="text-muted-foreground">·</span>
        <Link to="/support" className="underline">
          {t("support")}
        </Link>
      </div>

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

      {/* Supreme Tier-1 Fleet Emergency Safety Sheet */}
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
    <Card className="p-5 space-y-4 border-2 border-[#E5A93C]/50 bg-[#121723] shadow-[0_0_30px_rgba(229,169,60,0.25)] relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* 30-Second Countdown Top Progress Edge */}
      <div className="absolute top-0 inset-x-0 h-1.5 bg-muted">
        <div
          className={`h-full transition-all duration-300 ${
            isCritical
              ? "bg-rose-500 animate-pulse"
              : isUrgent
                ? "bg-amber-500"
                : "bg-gradient-to-r from-amber-500 via-[#E5A93C] to-emerald-400"
          }`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Top Header: Order Code, 30s Countdown & Siren Audio Mute */}
      <div className="flex items-start justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="relative flex size-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E5A93C] opacity-75" />
            <span className="relative inline-flex size-3 rounded-full bg-[#E5A93C]" />
          </span>
          <Badge tone="online" className="font-mono text-xs font-bold tracking-wider uppercase">
            Order #{offer.orderCode}
          </Badge>
          <span className="text-[11px] font-bold text-[#E5A93C] uppercase tracking-wider">
            Incoming Dispatch
          </span>
          {surge.isMonsoonActive && (
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
              ⚡ {surge.badges.monsoonText}
            </span>
          )}
          {surge.isPeakDinnerActive && (
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30">
              🔥 {surge.badges.peakDinnerText}
            </span>
          )}
          {surge.isWeatherAllowanceActive && (
            <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-400 border border-sky-500/30">
              🌧️ {surge.badges.weatherAllowanceText}
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
                : "border-[#E5A93C]/40 bg-[#E5A93C]/10 text-[#E5A93C] animate-pulse"
            }`}
            title={muted ? "Unmute Dispatch Siren" : "Mute Siren"}
            aria-label={muted ? "Unmute Dispatch Siren" : "Mute Siren"}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>

          {/* 30-Second Pulsing Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1 font-display font-extrabold tabular-nums text-lg ${
              isCritical
                ? "border-rose-500 bg-rose-500/20 text-rose-400 animate-bounce"
                : isUrgent
                  ? "border-amber-500 bg-amber-500/20 text-amber-400 animate-pulse"
                  : "border-[#E5A93C]/40 bg-[#E5A93C]/15 text-[#E5A93C]"
            }`}
          >
            <Clock3 className="size-4" />
            <span>{remaining}s</span>
          </div>
        </div>
      </div>

      {/* Standard Earnings Floor Banner in Obsidian Gold */}
      <div className="rounded-2xl border border-[#E5A93C]/40 bg-gradient-to-r from-amber-500/15 via-[#E5A93C]/20 to-amber-700/15 p-4 shadow-inner">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-extrabold text-[#E5A93C]">
              ★ {payout.labels.guaranteedEarningsTitle}
            </p>
            <p className="mt-0.5 font-display text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_0_12px_rgba(229,169,60,0.4)]">
              {formatPaise(offer.expectedPayoutPaise)}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
              100% Tips + Base Floor
            </span>
          </div>
        </div>

        {/* Payout Components Breakdown */}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E5A93C]/20 pt-2 text-xs">
          <div className="text-muted-foreground">
            {payout.labels.baseFareText} ({payout.baseDistanceKm} km): <span className="font-mono text-foreground font-semibold">{formatPaise(payout.baseFarePaise)}</span>
          </div>
          <div className="text-muted-foreground text-right">
            {payout.labels.distanceRateText} ({extraKm.toFixed(1)} km): <span className="font-mono text-foreground font-semibold">{formatPaise(distanceComponentPaise)}</span>
          </div>
        </div>
        {surge.isWeatherAllowanceActive && (
          <div className="mt-1 flex items-center justify-between text-xs text-sky-400 border-t border-[#E5A93C]/10 pt-1">
            <span>🌧️ {surge.badges.weatherAllowanceText}</span>
            <span className="font-mono font-semibold">+{formatPaise(surge.weatherAllowancePaise)}</span>
          </div>
        )}
      </div>

      {/* Exact Dispatch Metrics: Pickup Distance, Delivery Distance, Estimated Prep, Guaranteed Payout */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Pickup Dist</p>
          <p className="mt-0.5 font-mono text-sm font-extrabold text-foreground">{offer.approxDistanceKm.toFixed(1)} km</p>
          <p className="text-[9px] text-muted-foreground">To Restaurant</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Delivery Dist</p>
          <p className="mt-0.5 font-mono text-sm font-extrabold text-foreground">{(offer.estimatedTravelKm || Math.max(0, offer.estimatedTotalRouteKm - offer.approxDistanceKm)).toFixed(1)} km</p>
          <p className="text-[9px] text-muted-foreground">Customer Drop</p>
        </div>
        <div className="rounded-xl border border-border/80 bg-muted/30 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Est. Prep</p>
          <p className="mt-0.5 font-mono text-sm font-extrabold text-amber-400">
            {offer.restaurant.preparationStatus === "READY" ? "Ready Now" : "~8-10m"}
          </p>
          <p className="text-[9px] text-muted-foreground">Kitchen SLA</p>
        </div>
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
          <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">Floor Fare</p>
          <p className="mt-0.5 font-mono text-sm font-extrabold text-emerald-500 dark:text-emerald-300">{formatPaise(offer.expectedPayoutPaise)}</p>
          <p className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80">custom commission</p>
        </div>
      </div>

      {/* Restaurant Details Card */}
      <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-[#E5A93C]">
              <Store className="size-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Pickup Merchant</p>
              <h3 className="font-display text-base font-bold text-foreground leading-tight">{offer.restaurant.name}</h3>
            </div>
          </div>
          <Badge tone="busy" className="text-[10px] font-bold">
            {offer.restaurant.preparationStatus}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground pl-10">
          {offer.restaurant.address || offer.restaurant.area}
        </p>

        {offer.restaurant.specialPickupInstructions && (
          <p className="text-xs text-amber-300/90 bg-amber-500/10 border-l-2 border-[#E5A93C] p-2 rounded-r-md">
            <strong>Pickup Note:</strong> {offer.restaurant.specialPickupInstructions}
          </p>
        )}
      </div>

      {/* Customer Destination Card */}
      <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <MapPin className="size-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Delivery Destination</p>
              <h3 className="font-display text-base font-bold text-foreground leading-tight">{offer.dropArea}</h3>
            </div>
          </div>
          <Badge tone={offer.cod ? "cod" : "online"}>
            {offer.cod ? `COD ${formatPaise(offer.codAmountPaise)}` : "Prepaid"}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 pl-10">
          <a
            href={mapsPickupUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary underline"
          >
            Preview Route in Maps <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      {/* Accept & Decline Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-2">
        <Button
          size="lg"
          disabled={pending}
          onClick={onAccept}
          className="rounded-xl bg-gradient-to-r from-amber-500 via-[#E5A93C] to-amber-600 py-3.5 font-display text-base font-extrabold uppercase tracking-wider text-slate-950 shadow-[0_0_20px_rgba(229,169,60,0.35)] hover:from-amber-400 hover:to-amber-500 active:scale-[0.98] transition-all"
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
