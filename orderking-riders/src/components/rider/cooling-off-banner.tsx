import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { CoolingOffInfo } from "@/lib/rider/types";
import { Clock, ShieldAlert, Sparkles, Coffee } from "lucide-react";

export function CoolingOffBanner({
  coolingOff,
  onExpired,
}: {
  coolingOff?: CoolingOffInfo | null;
  onExpired?: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    if (!coolingOff || !coolingOff.isActive || !coolingOff.until) return 0;
    const diff = Math.ceil((new Date(coolingOff.until).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    if (!coolingOff || !coolingOff.isActive || !coolingOff.until) {
      setSecondsLeft(0);
      return;
    }

    const updateTimer = () => {
      const diff = Math.ceil((new Date(coolingOff.until!).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsLeft(0);
        onExpired?.();
      } else {
        setSecondsLeft(diff);
      }
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [coolingOff?.until, coolingOff?.isActive, onExpired]);

  if (!coolingOff || !coolingOff.isActive || secondsLeft <= 0) {
    return null;
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <Card className="border border-orange-500/40 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent p-4 shadow-sm dark:border-orange-500/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400">
            <Coffee className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold text-foreground">
                Temporary Cooling-Off Active
              </h3>
              <Badge tone="busy" className="bg-orange-500/20 text-orange-700 dark:text-orange-300 font-semibold text-[10px]">
                Pausing Dispatches
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {coolingOff.reason || "High consecutive offer declines. New orders paused temporarily to balance fleet demand."}
            </p>
          </div>
        </div>

        {/* Live Countdown Display */}
        <div className="flex items-center gap-3 self-end sm:self-auto rounded-lg border border-orange-500/30 bg-orange-500/10 px-3.5 py-2">
          <Clock className="size-4 text-orange-600 dark:text-orange-400 animate-pulse" />
          <div>
            <span className="font-mono text-lg font-extrabold text-orange-950 dark:text-orange-200">
              {formattedTime}
            </span>
            <p className="text-[10px] text-muted-foreground font-medium">Resumes Automatically</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground">
        <Sparkles className="size-3.5 text-primary shrink-0" />
        <span>
          Take a short hydration break! Maintaining an acceptance rate above 70% keeps your account in prime status for high-payout orders.
        </span>
      </div>
    </Card>
  );
}
