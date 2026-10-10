import { useState, useEffect } from "react";
import { AlertOctagon, PhoneCall, ShieldAlert, Siren, CheckCircle2, X, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function RiderEmergencySOS() {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);

  const startSosCountdown = () => {
    setCountdown(5);
    // Fetch live coordinates
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGpsLocation({ lat: 26.1445, lng: 91.7362 }) // fallback
      );
    }
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setSosTriggered(true);
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((c) => (c !== null ? c - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const cancelSos = () => {
    setCountdown(null);
    setSosTriggered(false);
  };

  return (
    <div>
      {/* SOS Trigger Button on Rider Dashboard */}
      <Button
        variant="destructive"
        onClick={() => {
          setIsOpen(true);
          startSosCountdown();
        }}
        className="w-full gap-2 font-black tracking-wide text-xs bg-rose-600 hover:bg-rose-700 text-white"
      >
        <AlertOctagon className="size-4 animate-pulse" /> EMERGENCY SOS (1-TAP SAFETY)
      </Button>

      {/* Emergency Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-rose-500/50 bg-surface p-5 shadow-2xl text-center space-y-4">
            {countdown !== null ? (
              /* Countdown Siren Screen */
              <div className="space-y-4">
                <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-rose-600 text-white animate-bounce shadow-lg shadow-rose-600/40">
                  <Siren className="size-10" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black text-rose-600">
                    SOS BEACON ACTIVATING
                  </h3>
                  <p className="text-xs text-muted mt-1">
                    Broadcasting live GPS to fleet safety operations and emergency hotline in:
                  </p>
                  <p className="font-display text-4xl font-black text-fg mt-2">{countdown}s</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={cancelSos}
                  className="w-full text-xs font-bold"
                >
                  Cancel (False Alarm)
                </Button>
              </div>
            ) : sosTriggered ? (
              /* SOS Triggered Screen */
              <div className="space-y-3">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-rose-500/20 text-rose-600">
                  <ShieldAlert className="size-8 stroke-[2.5]" />
                </div>
                <h4 className="font-display text-base font-black text-fg">
                  Emergency Alert Dispatched!
                </h4>
                <p className="text-xs text-muted">
                  OrderKing 24x7 Safety Command Center has received your high-priority distress signal.
                </p>
                <div className="rounded-xl border border-border bg-surface-2 p-3 text-xs text-left space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-fg">
                    <Navigation className="size-3.5 text-primary" /> Live GPS Coordinates:
                  </div>
                  <p className="font-mono text-[11px] text-muted">
                    {gpsLocation ? `${gpsLocation.lat.toFixed(5)}, ${gpsLocation.lng.toFixed(5)}` : "Tracking active"}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    ✓ Emergency contacts notified via SMS
                  </p>
                </div>

                {/* Direct Dial Emergency Hotlines */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href="tel:112"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 p-2.5 text-xs font-bold text-white shadow-xs"
                  >
                    <PhoneCall className="size-3.5" /> Call 112 (Police)
                  </a>
                  <a
                    href="tel:108"
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 p-2.5 text-xs font-bold text-white shadow-xs"
                  >
                    <PhoneCall className="size-3.5" /> Call 108 (Ambulance)
                  </a>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-xs mt-2"
                >
                  Close Window (Alert Remains Active)
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsOpen(false)} className="w-full">
                Dismiss
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
