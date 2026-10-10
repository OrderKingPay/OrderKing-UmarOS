import { useState, useEffect } from "react";
import { Volume2, VolumeX, Bell, Check, Sparkles } from "lucide-react";

export interface LiveOrderVoiceAlertsProps {
  orderStatus?: "PLACED" | "PREPARING" | "DISPATCHED" | "NEARBY" | "DELIVERED";
  enabledDefault?: boolean;
}

export function LiveOrderVoiceAlerts({
  orderStatus = "PREPARING",
  enabledDefault = true,
}: LiveOrderVoiceAlertsProps) {
  const [audioEnabled, setAudioEnabled] = useState(enabledDefault);
  const [lastAnnouncement, setLastAnnouncement] = useState("");

  const STATUS_MESSAGES: Record<string, string> = {
    PLACED: "Order placed successfully! Sent to restaurant station.",
    PREPARING: "Chef is now cooking your fresh dishes.",
    DISPATCHED: "Delivery partner has picked up your order and is on the way!",
    NEARBY: "Delivery partner is reaching your location doorstep.",
    DELIVERED: "Order delivered! Enjoy your meal.",
  };

  const playVoiceChime = (text: string) => {
    if (!audioEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.lang = "en-IN";
      window.speechSynthesis.speak(utterance);
      setLastAnnouncement(text);
    } catch {
      // Audio playback blocked by browser gesture policies
    }
  };

  useEffect(() => {
    const text = STATUS_MESSAGES[orderStatus];
    if (text) {
      playVoiceChime(text);
    }
  }, [orderStatus, audioEnabled]);

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/60 px-3.5 py-2 text-xs">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`flex size-7 items-center justify-center rounded-lg border transition ${
            audioEnabled
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-surface text-muted"
          }`}
          title={audioEnabled ? "Mute audio updates" : "Enable voice announcements"}
        >
          {audioEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
        </button>
        <div>
          <p className="font-semibold text-fg flex items-center gap-1">
            <span>Voice Status Alerts</span>
            {audioEnabled && (
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </p>
          <p className="text-[10px] text-muted">
            {audioEnabled ? (lastAnnouncement || "Spoken status for updates") : "Voice muted"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => playVoiceChime(STATUS_MESSAGES[orderStatus] || "Order is on track!")}
        className="rounded-md bg-surface px-2 py-1 text-[10px] font-bold text-primary border border-border hover:bg-surface-2 transition"
      >
        Test Chime
      </button>
    </div>
  );
}
