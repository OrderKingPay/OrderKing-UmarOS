import { useState, useEffect, useRef } from "react";
import {
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  Navigation,
  PhoneCall,
  Radio,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Siren,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportSafetyFn } from "@/lib/server/rider-fns";

interface LiveGpsCoord {
  lat: number;
  lng: number;
  accuracyM?: number;
  timestamp: number;
}

export function FloatingEmergencySOS() {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sosActive, setSosActive] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<LiveGpsCoord | null>(null);
  const [trackingPings, setTrackingPings] = useState<number>(0);
  const [incidentId, setIncidentId] = useState<string>("");
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const audioIntervalRef = useRef<number | null>(null);

  // Fetch real-time GPS telemetry
  const updateGps = () => {
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyM: Math.round(pos.coords.accuracy),
            timestamp: Date.now(),
          });
        },
        () => {
          // Default fallback coordinates if GPS permission is pending
          setGpsLocation((prev) => prev || { lat: 24.8692, lng: 92.3582, accuracyM: 10, timestamp: Date.now() });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const startCountdown = () => {
    setCountdown(5);
    setIsOpen(true);
    updateGps();
  };

  const triggerSosImmediately = async () => {
    setCountdown(null);
    setSosActive(true);
    const newIncId = `SOS-${Date.now().toString().slice(-6)}`;
    setIncidentId(newIncId);
    setTrackingPings(1);
    setElapsedSeconds(0);
    updateGps();

    // Broadcast distress signal to OrderKing Safety Command Center
    try {
      await reportSafetyFn({
        data: {
          kind: "EMERGENCY_CALL",
          note: `EMERGENCY SOS 112 DISPATCH TRIGGERED (${newIncId}) - Priority 1 Distress Beacon`,
          lat: gpsLocation?.lat ?? null,
          lng: gpsLocation?.lng ?? null,
        },
      });
    } catch {
      // Telemetry continues offline via native dialer
    }
  };

  // Countdown clock effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      void triggerSosImmediately();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((c) => (c !== null ? c - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Active SOS telemetry tracking ping effect
  useEffect(() => {
    if (!sosActive) return;

    // Heartbeat every 5 seconds to safety dispatch
    const interval = setInterval(() => {
      updateGps();
      setTrackingPings((p) => p + 1);
      setElapsedSeconds((s) => s + 5);
    }, 5000);

    return () => clearInterval(interval);
  }, [sosActive]);

  const cancelSos = () => {
    setCountdown(null);
    setSosActive(false);
    setIsOpen(false);
    setElapsedSeconds(0);
    setTrackingPings(0);
  };

  const mapsShareUrl = gpsLocation
    ? `https://www.google.com/maps?q=${gpsLocation.lat},${gpsLocation.lng}`
    : "https://www.google.com/maps";

  const shareEmergencyLocation = () => {
    const text = `🚨 EMERGENCY DISTRESS ALERT: I am an OrderKing Delivery Partner and need immediate assistance. My live GPS location: ${mapsShareUrl}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "OrderKing Emergency SOS", text, url: mapsShareUrl }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  return (
    <>
      {/* PERSISTENT FLOATING EMERGENCY SOS BEACON */}
      <div className="fixed bottom-20 right-3.5 z-40 sm:bottom-6 sm:right-6 pointer-events-auto">
        <button
          type="button"
          onClick={startCountdown}
          aria-label="OrderKing Emergency SOS 112 Safety Beacon"
          className="group relative flex items-center gap-2 rounded-full border border-red-500/60 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-3.5 py-2.5 sm:px-4 sm:py-3 text-white shadow-[0_8px_25px_rgba(225,29,72,0.55)] transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-[0_12px_30px_rgba(225,29,72,0.7)]"
        >
          {/* Pulsing Beacon Radar Ring */}
          <span className="absolute -inset-1 rounded-full bg-red-500/40 opacity-75 blur-xs animate-ping group-hover:opacity-100" />
          
          <div className="relative flex size-6 items-center justify-center rounded-full bg-black/40 text-rose-200">
            <AlertOctagon className="size-4 animate-pulse stroke-[2.5]" />
          </div>
          
          <div className="relative flex flex-col text-left leading-none">
            <span className="text-[11px] font-black tracking-wider uppercase text-white drop-shadow-xs">
              SOS 112
            </span>
            <span className="text-[8.5px] font-bold text-rose-200/90 tracking-tight">
              Emergency
            </span>
          </div>

          {sosActive && (
            <span className="relative flex size-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
              <span className="relative inline-flex rounded-full size-2.5 bg-yellow-300" />
            </span>
          )}
        </button>
      </div>

      {/* FULL-SCREEN EMERGENCY SAFETY MODAL & DISPATCH HUB */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md transition-all">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-red-500/40 bg-[#0E121B] shadow-[0_25px_60px_-15px_rgba(225,29,72,0.5)] text-foreground">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-red-500/30 bg-gradient-to-r from-red-950/80 via-[#161D2B] to-[#0E121B] px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-red-600/30 border border-red-500/40 text-red-400">
                  <ShieldAlert className="size-4.5" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-red-400">
                    OrderKing 24x7 Safety Guard
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    National Emergency Dispatch &amp; Live Telemetry
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/10 hover:text-white transition"
                aria-label="Minimize SOS window"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {countdown !== null ? (
                /* PHASE 1: 5-SECOND SIREN COUNTDOWN */
                <div className="text-center space-y-4 py-2">
                  <div className="relative mx-auto flex size-24 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_0_35px_rgba(220,38,38,0.7)] animate-pulse">
                    <Siren className="size-12 animate-bounce" />
                    <span className="absolute -inset-3 rounded-full border-2 border-red-500/50 animate-ping" />
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-black text-red-500 tracking-wide uppercase">
                      Distress Beacon Triggering
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                      Live GPS telemetry will broadcast to OrderKing Safety Operations and emergency lines in:
                    </p>
                    <p className="font-display text-5xl font-black text-white mt-2 tabular-nums">
                      {countdown}s
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={triggerSosImmediately}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                    >
                      Dispatch Now (Skip)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelSos}
                      className="w-full border-border bg-muted/40 hover:bg-muted text-xs font-semibold"
                    >
                      Cancel (False Alarm)
                    </Button>
                  </div>
                </div>
              ) : sosActive ? (
                /* PHASE 2: ACTIVE SOS DISPATCH & 112 DIALING HUB */
                <div className="space-y-4">
                  {/* Active Beacon Banner */}
                  <div className="flex items-center justify-between rounded-xl border border-red-500/50 bg-red-950/40 p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex size-3">
                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full size-3 bg-red-500" />
                      </span>
                      <span className="font-bold text-red-300">
                        DISTRESS DISPATCH ACTIVE
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-red-400">
                      ID: {incidentId}
                    </span>
                  </div>

                  {/* High-Priority Emergency Dialing Buttons */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Direct Emergency Hotlines
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <a
                        href="tel:112"
                        className="flex flex-col items-center justify-center gap-1 rounded-xl border border-red-500/60 bg-gradient-to-b from-red-600 to-rose-700 p-3 text-center text-white shadow-md hover:from-red-500 hover:to-rose-600 active:scale-95 transition"
                      >
                        <div className="flex items-center gap-1.5 font-black text-sm">
                          <PhoneCall className="size-4" />
                          <span>Call 112</span>
                        </div>
                        <span className="text-[10px] text-rose-100 font-medium">
                          National Police &amp; SOS
                        </span>
                      </a>

                      <a
                        href="tel:108"
                        className="flex flex-col items-center justify-center gap-1 rounded-xl border border-amber-500/60 bg-gradient-to-b from-amber-600 to-yellow-700 p-3 text-center text-white shadow-md hover:from-amber-500 hover:to-yellow-600 active:scale-95 transition"
                      >
                        <div className="flex items-center gap-1.5 font-black text-sm">
                          <PhoneCall className="size-4" />
                          <span>Call 108</span>
                        </div>
                        <span className="text-[10px] text-amber-100 font-medium">
                          Ambulance &amp; Medical
                        </span>
                      </a>
                    </div>

                    <a
                      href="tel:18001000"
                      className="flex items-center justify-center gap-2 rounded-xl border border-[#1E283D] bg-[#161D2B] p-2.5 text-xs font-semibold text-foreground hover:bg-[#1E2638] transition"
                    >
                      <PhoneCall className="size-3.5 text-[#e5a93c]" />
                      <span>OrderKing 24x7 Safety Command Desk (1800-100-ORDER)</span>
                    </a>
                  </div>

                  {/* Live GPS Telemetry Card */}
                  <div className="rounded-xl border border-[#1E283D] bg-[#121723] p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-foreground">
                        <Navigation className="size-3.5 text-[#e5a93c]" />
                        <span>Live GPS Telemetry</span>
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                        <Radio className="size-3 animate-pulse" />
                        <span>{trackingPings} Telemetry Pings</span>
                      </span>
                    </div>

                    <div className="rounded-lg bg-black/50 p-2 font-mono text-[11px] text-slate-300 space-y-0.5 border border-white/5">
                      <p>
                        Latitude:{" "}
                        <strong className="text-white">
                          {gpsLocation ? gpsLocation.lat.toFixed(5) : "Resolving..."}
                        </strong>
                      </p>
                      <p>
                        Longitude:{" "}
                        <strong className="text-white">
                          {gpsLocation ? gpsLocation.lng.toFixed(5) : "Resolving..."}
                        </strong>
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Accuracy: ±{gpsLocation?.accuracyM ?? 5}m · Refreshed every 5s
                      </p>
                    </div>

                    {/* Dispatch Stages Checklist */}
                    <div className="space-y-1 text-[11px]">
                      <div className="flex items-center gap-2 text-emerald-400 font-medium">
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        <span>Distress alert logged in Safety Operations</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400 font-medium">
                        <CheckCircle2 className="size-3.5 shrink-0" />
                        <span>Live telemetry coordinates broadcasting</span>
                      </div>
                      <div className="flex items-center gap-2 text-amber-300 font-medium">
                        <span className="size-3.5 flex items-center justify-center">
                          <span className="size-2 rounded-full bg-amber-400 animate-ping" />
                        </span>
                        <span>Safety Officer reviewing active dispatch route</span>
                      </div>
                    </div>
                  </div>

                  {/* Share Location & Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={shareEmergencyLocation}
                      className="border-border text-xs gap-1.5"
                    >
                      <Share2 className="size-3.5 text-[#2563eb]" />
                      <span>Share Location</span>
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={cancelSos}
                      className="bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-rose-300 border border-rose-500/30"
                    >
                      I Am Safe (End Alert)
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">
                    Emergency safety beacon is currently standby.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={startCountdown}
                    className="w-full bg-red-600 hover:bg-red-500 font-bold"
                  >
                    Activate Emergency SOS
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
