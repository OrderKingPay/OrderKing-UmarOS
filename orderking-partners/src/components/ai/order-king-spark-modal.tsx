import { useState } from "react";
import {
  Bot,
  Sparkles,
  X,
  Send,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Utensils,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAssistant } from "@/lib/server/api-more";
import { useVendor } from "@/components/use-vendor";

interface OrderKingSparkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderKingSparkModal({ isOpen, onClose }: OrderKingSparkModalProps) {
  const { restaurantId } = useVendor();
  const [messages, setMessages] = useState<Array<{ id: string; sender: "user" | "spark"; text: string; timestamp: string }>>([
    {
      id: "init",
      sender: "spark",
      text: "### 🍳 OrderKing Restaurant AI\nAsk about your verified orders, sales, menu availability, preparation issues, settlements, or restaurant operations. Answers come from your authorized restaurant data and a real OpenAI provider; no simulated restaurant data is used.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (text: string) => {
    if (!text.trim() || sending) return;

    const userMsg: SparkChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setSending(true);
    try {
      const result = await askAssistant({ data: { restaurantId, question: text.trim() } });
      setMessages((prev) => [...prev, {
        id: `spark-${Date.now()}`,
        sender: "spark" as const,
        text: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: `spark-error-${Date.now()}`,
        sender: "spark" as const,
        text: `Restaurant AI request failed: ${error instanceof Error ? error.message : "Unknown error"}. No simulated answer was generated.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally {
      setSending(false);
    }
  };

mport { useState } from "react";
import {
  Bot,
  Sparkles,
  X,
  Send,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Utensils,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAssistant } from "@/lib/server/api-more";
import { useVendor } from "@/components/use-vendor";

interface OrderKingSparkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderKingSparkModal({ isOpen, onClose }: OrderKingSparkModalProps) {
  const { restaurantId } = useVendor();
  const [messages, setMessages] = useState<Array<{ id: string; sender: "user" | "spark"; text: string; timestamp: string }>>([
    {
      id: "init",
      sender: "spark",
      text: "### 🍳 OrderKing Restaurant AI\nAsk about your verified orders, sales, menu availability, preparation issues, settlements, or restaurant operations. Answers come from your authorized restaurant data and a real OpenAI provider; no simulated restaurant data is used.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (text: string) => {
    if (!text.trim() || sending) return;

    const userMsg: SparkChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setSending(true);
    try {
      const result = await askAssistant({ data: { restaurantId, question: text.trim() } });
      setMessages((prev) => [...prev, {
        id: `spark-${Date.now()}`,
        sender: "spark" as const,
        text: result.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        id: `spark-error-${Date.now()}`,
        sender: "spark" as const,
        text: `Restaurant AI request failed: ${error instanceof Error ? error.message : "Unknown error"}. No simulated answer was generated.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } finally {
      setSending(false);
    }
  };

  const handleToggleItem = (itemId: string) => {
    const res = orderKingSpark.toggleItemAvailability(itemId);
    if (res.success && res.item) {
      setMenuItems([...orderKingSpark.getMenuItems()]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn font-sans">
      <div className="relative flex flex-col h-[700px] max-h-[92vh] w-full max-w-3xl rounded-2xl border border-amber-500/30 bg-[#121214] text-slate-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-[#18181B] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-black font-bold shadow-md shadow-amber-500/20">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white tracking-wide">Order King Spark</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  RESTAURANT AI
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  RESTAURANT AI
                </span>
              </div>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                Verified restaurant data · Operations · Menu · Settlements
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/60 scrollbar-none">
          {[
            { label: "💰 Settlement & Earnings", query: "Show my verified settlement and earnings data" },
            { label: "📋 Menu Availability", query: "Show my current menu availability" },
            { label: "🍳 Kitchen SLA", query: "Check verified kitchen prep SLA and delays" },
            { label: "🚀 Growth Advice", query: "Give me evidence-based growth ideas from my restaurant data" },
          ].map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(pill.query)}
              className="px-3 py-1 rounded-full text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 whitespace-nowrap transition active:scale-95 flex items-center gap-1.5"
            >
              <span>{pill.label}</span>
            </button>
          ))}
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  msg.sender === "user"
                    ? "bg-amber-500 text-black font-medium"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-200"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

              </div>
                    <div className="flex items-center justify-between text-xs border-t border-zinc-800 pt-1.5">
                      <span className="text-zinc-400">OrderKing Commission:</span>
                      <span className="font-bold text-emerald-400 font-mono">₹0 (0%)</span>
                    </div>
                  </div>
                )}

                {msg.actionCard?.type === "menu_toggle" && (
                  <div className="mt-3 space-y-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Live Menu Items:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {menuItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-between gap-2"
                        >
                          <div>
                            <span className="text-xs font-bold text-white block">{item.name}</span>
                            <span className="text-[11px] font-mono text-zinc-400">
                              ₹{(item.pricePaise / 100).toFixed(0)} · {item.preparationMinutes}m prep
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleItem(item.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                              item.isAvailable
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                                : "bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                            }`}
                          >
                            {item.isAvailable ? "In Stock" : "Sold Out"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {msg.actionCard?.type === "anomaly_alert" && (
                  <div className="mt-3 space-y-2">
                    {((msg.actionCard.data.anomalies as SparkKitchenAnomaly[]) || []).map((anom) => (
                      <div
                        key={anom.anomalyId}
                        className="p-3 rounded-xl bg-black/60 border border-amber-500/30 space-y-1.5"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                          <AlertTriangle className="size-4 text-amber-400 shrink-0" />
                          <span>{anom.headline}</span>
                        </div>
                        <p className="text-[11px] text-zinc-300 leading-relaxed">
                          <strong>Root Cause:</strong> {anom.rootCauseHypothesis}
                        </p>
                        <p className="text-[11px] text-emerald-400">
                          <strong>Recommended:</strong> {anom.recommendedAction}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-zinc-800 bg-[#18181B] flex items-center gap-2">
          <Input
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(inputQuery);
              }
            }}
            placeholder="Ask Spark (e.g., 'Make biryani sold out' or 'Show today's savings')..."
            className="flex-1 bg-zinc-900 border-zinc-700 text-xs sm:text-sm text-white placeholder:text-zinc-500 h-10"
          />
          <Button
            type="button"
            onClick={() => handleSend(inputQuery)}
            disabled={!inputQuery.trim() || sending}
            className="h-10 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0 shadow-md"
          >
            <Send className="size-3.5 mr-1.5" />
            <span>{sending ? "Thinking…" : "Send"}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
