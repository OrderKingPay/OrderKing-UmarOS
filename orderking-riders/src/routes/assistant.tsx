import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/rider/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/client/errors";
import { useI18n } from "@/lib/rider/i18n-context";
import { formatPaise } from "@/lib/rider/money";
import type { LocaleCode } from "@/lib/rider/types";
import {
  getHomeFn,
  getEarningsFn,
  getSettlementsFn,
  listTicketsFn,
} from "@/lib/server/rider-fns";
import { askAssistantFn, type ResolutionAction } from "@/lib/server/assistant";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  AlertOctagon,
  ArrowLeft,
  Bot,
  Camera,
  CheckCircle2,
  FileText,
  PhoneCall,
  RefreshCw,
  Send,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/assistant")({ component: Page });

const SPEECH_LANG_MAP: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  mr: "mr-IN",
  pa: "pa-IN",
  ta: "ta-IN",
  te: "te-IN",
};

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  at: string;
  attachment?: {
    name: string;
    type: string;
    dataUrl: string;
    previewUrl?: string;
  } | null;
  resolutionAction?: ResolutionAction | null;
  waitResult?: {
    credited: boolean;
    waitedMins: number;
    billableMins: number;
    amountPaise: number;
    restaurantName?: string;
    orderCode?: string;
  } | null;
  emergencyBroadcast?: {
    dispatched: boolean;
    coords: { lat: number; lng: number };
    emergencyNumbers: string[];
    insuranceCover: string;
  } | null;
}

function Page() {
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    size: number;
    dataUrl: string;
    previewUrl?: string;
  } | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        previewUrl: file.type.startsWith("image/") ? dataUrl : undefined,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const [lines, setLines] = useState<ChatMessage[]>(() => [
    {
      role: "assistant",
      text: "Hello! How can I assist you with your shift, order, or payout today?",
      at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [home, setHome] = useState<Awaited<ReturnType<typeof getHomeFn>> | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [autoCreditNotice, setAutoCreditNotice] = useState<string | null>(null);
  const [sosActiveCoords, setSosActiveCoords] = useState<{ lat: number; lng: number } | null>(null);

  async function refreshLiveState(initial = false) {
    setLoadingContext(true);
    try {
      const h = await getHomeFn();
      setHome(h);
      setBusy(Boolean(h.active));
      if (initial && h.active) {
        setLines([
          {
            role: "assistant",
            text: `Hello ${h.rider.fullName?.split(" ")[0] || "Partner"}! You have active Order #${h.active.orderCode} (${h.active.restaurant.name} to ${h.active.customer.area}). I can verify kitchen wait pay, resolve unreachable customer SOP, or guide navigation.`,
            at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch {
      // Keep UI responsive even if initial fetch fails
    } finally {
      setLoadingContext(false);
    }
  }

  useEffect(() => {
    void refreshLiveState(true);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function speakText(text: string, id: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speakingIdx === id) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[\u2022\u2600-\u27BF\u{1F300}-\u{1FAFF}]/gu, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = SPEECH_LANG_MAP[locale] || "en-IN";
    utterance.rate = 0.96;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);
    setSpeakingIdx(id);
    window.speechSynthesis.speak(utterance);
  }

  async function askQuestion(
    questionText: string,
    action?:
      | "auto_credit_wait"
      | "emergency_distress"
      | "verify_navigation"
      | "payout_breakdown"
      | "customer_unreachable"
      | "restaurant_issue"
      | "cash_dispute"
      | "query",
  ) {
    if (!questionText.trim() && !attachment) return;
    const question = questionText.trim() || (attachment ? `Attached photo proof: ${attachment.name}` : "");
    const nowLabel = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const currentAttachment = attachment;
    setQ("");
    setAttachment(null);
    setLines((l) => [
      ...l,
      {
        role: "user",
        text: question,
        at: nowLabel,
        attachment: currentAttachment,
      },
    ]);
    setPending(true);

    let coords: { lat: number; lng: number } | undefined = undefined;
    if (action === "emergency_distress" && typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setSosActiveCoords(coords);
      } catch {
        coords = { lat: 26.1445, lng: 91.7362 };
      }
    }

    try {
      const res = await askAssistantFn({
        data: {
          question,
          busy,
          locale,
          action,
          coords,
          attachment: currentAttachment
            ? {
              name: currentAttachment.name,
              type: currentAttachment.type,
              size: currentAttachment.size,
              dataUrl: currentAttachment.dataUrl,
            }
            : undefined,
        },
      });

      if (res.waitCreditResult?.credited) {
        setAutoCreditNotice(
          `Kitchen wait pay of ₹${(res.waitCreditResult.amountPaise / 100).toFixed(2)} credited to your shift ledger.`,
        );
      }
      if (res.emergencyBroadcast?.dispatched) {
        setSosActiveCoords(res.emergencyBroadcast.coords);
      }

      setLines((l) => [
        ...l,
        {
          role: "assistant",
          text: res.text,
          at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          waitResult: res.waitCreditResult,
          emergencyBroadcast: res.emergencyBroadcast,
          resolutionAction: res.resolutionAction,
        },
      ]);
      void refreshLiveState(false);
    } catch (err) {
      setLines((l) => [
        ...l,
        {
          role: "assistant",
          text: errorMessage(err, t("aiUnavailable")),
          at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    await askQuestion(q, "query");
  }

  const firstName = home?.rider.fullName?.trim().split(" ")[0] || "Partner";
  const activeOrder = home?.active ?? null;

  return (
    <AppShell>
      <div className="space-y-3 max-w-md mx-auto">
        {/* Clean Header Bar */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <h1 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Bot className="size-4 text-primary" />
                <span>Partner Support</span>
              </h1>
              <p className="text-[11px] text-muted-foreground">
                {firstName} · {activeOrder ? `Order #${activeOrder.orderCode}` : "Idle"}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={loadingContext}
            onClick={() => void refreshLiveState(false)}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`size-3.5 ${loadingContext ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Active Order Notice (If on delivery) */}
        {activeOrder ? (
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">Order #{activeOrder.orderCode}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {activeOrder.restaurant.name} to {activeOrder.customer.area}
              </p>
            </div>
            <Badge tone="busy">{activeOrder.state.replaceAll("_", " ")}</Badge>
          </div>
        ) : null}

        {/* Notification Pill */}
        {autoCreditNotice ? (
          <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <div className="flex items-center gap-2">
              <Zap className="size-4 shrink-0 text-emerald-500" />
              <span>{autoCreditNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setAutoCreditNotice(null)}
              className="text-xs font-bold hover:opacity-75"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : null}

        {/* SOS Alert Banner */}
        {sosActiveCoords ? (
          <div className="rounded-xl border border-rose-500/60 bg-rose-500/10 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertOctagon className="size-4" />
                Emergency Dispatched (112 / 108)
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                GPS: {sosActiveCoords.lat.toFixed(4)}, {sosActiveCoords.lng.toFixed(4)}
              </span>
            </div>
            <div className="flex gap-2 pt-1">
              <a
                href="tel:112"
                className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700"
              >
                Call 112
              </a>
              <a
                href="tel:108"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
              >
                Call 108 (Ambulance)
              </a>
            </div>
          </div>
        ) : null}

        {/* 4 Quick Resolution Action Chips */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              void askQuestion(
                "Verify kitchen wait time outside restaurant and credit wait pay if waiting over 6 mins",
                "auto_credit_wait",
              )
            }
            className="h-10 text-xs font-semibold justify-start border-border bg-card hover:bg-muted text-foreground"
          >
            <Zap className="size-3.5 text-orange-500 mr-1.5 shrink-0" />
            <span className="truncate">Kitchen Delay (&gt;6m)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              void askQuestion(
                "Customer not reachable after 3 calls and 10 mins wait at doorstep",
                "customer_unreachable",
              )
            }
            className="h-10 text-xs font-semibold justify-start border-border bg-card hover:bg-muted text-foreground"
          >
            <PhoneCall className="size-3.5 text-blue-500 mr-1.5 shrink-0" />
            <span className="truncate">Customer Unreachable</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              void askQuestion(
                "Cash on delivery amount mismatch / customer paid online directly to merchant",
                "cash_dispute",
              )
            }
            className="h-10 text-xs font-semibold justify-start border-border bg-card hover:bg-muted text-foreground"
          >
            <FileText className="size-3.5 text-emerald-500 mr-1.5 shrink-0" />
            <span className="truncate">Cash / COD Dispute</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              void askQuestion(
                "EMERGENCY SOS: Route signal to 112 / 108 with live GPS coordinates immediately",
                "emergency_distress",
              )
            }
            className="h-10 text-xs font-semibold justify-start border-rose-500/40 bg-rose-500/5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
          >
            <AlertOctagon className="size-3.5 text-rose-500 mr-1.5 shrink-0" />
            <span className="truncate">Emergency SOS</span>
          </Button>
        </div>

        {/* Conversation Thread */}
        <div className="space-y-2.5 min-h-[280px]">
          {lines.map((l, i) => (
            <Card
              key={i}
              className={
                l.role === "user"
                  ? "ml-6 border border-primary/20 bg-muted/40 p-3 text-foreground shadow-xs"
                  : "border border-border/80 bg-card p-3.5 text-foreground shadow-xs"
              }
            >
              <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-border/40 pb-1">
                <span className="text-[11px] font-semibold text-muted-foreground">
                  {l.role === "user" ? firstName : "Support"} · {l.at}
                </span>
                {l.role === "assistant" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
                    onClick={() => speakText(l.text, i)}
                  >
                    {speakingIdx === i ? <VolumeX className="size-3" /> : <Volume2 className="size-3" />}
                  </Button>
                ) : null}
              </div>

              {/* Attached Image / File Display */}
              {l.attachment ? (
                <div className="mb-2">
                  {l.attachment.previewUrl ? (
                    <img
                      src={l.attachment.previewUrl}
                      alt={l.attachment.name}
                      className="max-h-40 rounded-lg border border-border object-cover"
                    />
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                      <FileText className="size-3.5 text-primary" />
                      <span className="font-mono text-[11px] truncate max-w-[200px]">{l.attachment.name}</span>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Action Resolution Pill */}
              {l.resolutionAction ? (
                <div className="mb-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground flex items-center gap-1">
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      {l.resolutionAction.title}
                    </span>
                    {l.resolutionAction.ticketId ? (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        #{l.resolutionAction.ticketId.slice(0, 8)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-[11px]">{l.resolutionAction.details}</p>
                </div>
              ) : null}

              <p className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-foreground">{l.text}</p>
            </Card>
          ))}
        </div>

        {/* Input Bar with Camera & File Upload */}
        <div className="sticky bottom-20 pt-2 bg-gradient-to-t from-background via-background to-transparent">
          {attachment ? (
            <div className="mb-2 flex items-center gap-2 rounded-xl border border-primary/40 bg-muted/60 p-2 text-xs">
              {attachment.previewUrl ? (
                <img
                  src={attachment.previewUrl}
                  alt={attachment.name}
                  className="size-9 rounded-md object-cover border border-border shrink-0"
                />
              ) : (
                <FileText className="size-5 text-primary shrink-0" />
              )}
              <span className="flex-1 truncate font-medium">{attachment.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAttachment(null)}
                className="size-6 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ) : null}

          <form onSubmit={send} className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={pending}
              onClick={() => fileInputRef.current?.click()}
              title="Attach Photo Proof"
              className="size-10 shrink-0 border-border hover:bg-muted"
            >
              <Camera className="size-4 text-muted-foreground" />
            </Button>
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={attachment ? "Describe this photo proof..." : "Type your message..."}
              disabled={pending}
              className="border-border bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary h-10 text-xs sm:text-sm"
            />
            <Button
              type="submit"
              disabled={pending || (!q.trim() && !attachment)}
              className="bg-primary text-primary-foreground font-semibold size-10 shrink-0 p-0 hover:bg-primary/90"
            >
              {pending ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
