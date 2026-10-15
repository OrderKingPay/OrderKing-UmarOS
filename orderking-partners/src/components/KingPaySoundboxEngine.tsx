import React, { useEffect, useState, useRef } from "react";
import { INDIAN_LANGUAGE_CATALOG } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/platform-config";
import { Volume2, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KingPaySoundboxEngineProps {
  merchantId: string;
  defaultLang?: AppLanguage;
}

export function buildSoundboxSpeechAlert(lang: AppLanguage, amountRs: number): string {
  switch (lang) {
    case "hi":
      return `किंगपे पर ${amountRs} रुपये प्राप्त हुए।`;
    case "bn":
      return `কিংপে-তে ${amountRs} টাকা পাওয়া গেছে।`;
    case "gu":
      return `કિંગપે પર ${amountRs} રૂપિયા મળ્યા.`;
    case "kn":
      return `ಕಿಂಗ್‌ಪೇ ನಲ್ಲಿ ${amountRs} ರೂಪಾಯಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ.`;
    case "ml":
      return `കിംഗ്പേയിൽ ${amountRs} രൂപ ലഭിച്ചു.`;
    case "mr":
      return `किंगपे वर ${amountRs} रुपये मिळाले.`;
    case "pa":
      return `ਕਿੰਗਪੇ 'ਤੇ ${amountRs} ਰੁਪਏ ਪ੍ਰਾਪਤ ਹੋਏ।`;
    case "ta":
      return `கிங்பே-யில் ${amountRs} ரூபாய் பெறப்பட்டது.`;
    case "te":
      return `కింగ్‌పే లో ${amountRs} రూపాయలు వచ్చాయి.`;
    case "en":
    default:
      return `Received ₹${amountRs} on KingPay.`;
  }
}

export const KingPaySoundboxEngine: React.FC<KingPaySoundboxEngineProps> = ({
  merchantId,
  defaultLang = "hi",
}) => {
  const [lastTransaction, setLastTransaction] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [reconnectCount, setReconnectCount] = useState<number>(0);
  const [selectedLang, setSelectedLang] = useState<AppLanguage>(defaultLang);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const triggerAudioAlert = (amountRs: number, langToUse: AppLanguage = selectedLang) => {
    const message = buildSoundboxSpeechAlert(langToUse, amountRs);
    setLastTransaction(`₹${amountRs} · ${message}`);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(message);
      const bcp47 = INDIAN_LANGUAGE_CATALOG.find((l) => l.code === langToUse)?.bcp47 ?? "en-IN";
      utterance.lang = bcp47;
      utterance.rate = 0.95;
      utterance.pitch = 1.05;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    let unmounted = false;

    const connectWebSocket = () => {
      try {
        const wsUrl = `wss://api.orderking.com/ws/payments/${merchantId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (unmounted) return;
          setIsConnected(true);
          setReconnectCount(0);

          // Heartbeat ping every 20s
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "PING", timestamp: Date.now() }));
            }
          }, 20000);
        };

        ws.onmessage = (event) => {
          if (unmounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === "UPI_PAYMENT_RECEIVED" || data.type === "PAYMENT_SUCCESS") {
              const amountRs = Math.round(Number(data.amount) || (Number(data.amountPaise) || 0) / 100);
              triggerAudioAlert(amountRs, selectedLang);
            }
          } catch (error) {
            console.error("Error parsing KingPay payment data:", error);
          }
        };

        ws.onerror = () => {
          if (unmounted) return;
          setIsConnected(false);
        };

        ws.onclose = () => {
          if (unmounted) return;
          setIsConnected(false);
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
          }
          // Exponential backoff reconnect
          setReconnectCount((prev) => {
            const next = prev + 1;
            const delay = Math.min(10000, 1000 * Math.pow(1.5, next));
            reconnectTimeoutRef.current = setTimeout(connectWebSocket, delay);
            return next;
          });
        };
      } catch (err) {
        setIsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      unmounted = true;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [merchantId]);

  return (
    <div className="kingpay-soundbox-engine rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-xl">
              📢
            </span>
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-emerald-500" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-bold text-sm text-foreground">
                KingPay Virtual Soundbox Engine
              </h4>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-300">
                10 Benchmark Languages Active
              </span>
            </div>
            <p className="text-xs text-muted">
              Real-time WebSocket UPI Payment Broadcast. Instant voice announcement upon settlement.
            </p>
          </div>
        </div>

        {/* Connection & Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1 text-xs">
            {isConnected ? (
              <>
                <Wifi className="size-3.5 text-emerald-600 animate-pulse" />
                <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono text-[11px]">
                  LIVE WS CONNECTED
                </span>
              </>
            ) : (
              <>
                <WifiOff className="size-3.5 text-amber-600" />
                <span className="font-medium text-muted font-mono text-[11px]">
                  STANDBY {reconnectCount > 0 ? `(RETRY ${reconnectCount})` : ""}
                </span>
              </>
            )}
          </div>

          {/* Language Selector */}
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as AppLanguage)}
            className="rounded-lg border border-line bg-surface px-2 py-1 text-xs font-semibold text-foreground"
            aria-label="Soundbox Language"
          >
            {INDIAN_LANGUAGE_CATALOG.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.native} ({lang.label})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Soundbox Test Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted font-medium">Test Voice Alert:</span>
          {[50, 150, 450, 1200].map((amt) => (
            <Button
              key={amt}
              size="sm"
              variant="outline"
              type="button"
              onClick={() => triggerAudioAlert(amt, selectedLang)}
              className="h-7 px-2.5 text-xs font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
            >
              <Volume2 className="mr-1 size-3" /> ₹{amt}
            </Button>
          ))}
        </div>

        <span className="text-[10px] text-muted font-mono">
          Engine: Web Audio TTS · Voice: {INDIAN_LANGUAGE_CATALOG.find((l) => l.code === selectedLang)?.bcp47}
        </span>
      </div>

      {lastTransaction && (
        <div className="rounded-lg border border-emerald-500/30 bg-surface p-2.5 text-center font-mono text-xs text-emerald-800 dark:text-emerald-200 animate-fadeIn flex items-center justify-center gap-2">
          <span className="text-base">📢</span>
          <span className="font-bold">{lastTransaction}</span>
        </div>
      )}
    </div>
  );
};

export default KingPaySoundboxEngine;
