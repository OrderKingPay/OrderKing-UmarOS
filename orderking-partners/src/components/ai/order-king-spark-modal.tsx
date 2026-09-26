import { useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { askAssistant } from "@/lib/server/api-more";
import { useVendor } from "@/components/use-vendor";

interface OrderKingSparkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ChatMessage = {
  id: string;
  sender: "user" | "spark";
  text: string;
  timestamp: string;
};

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function OrderKingSparkModal({ isOpen, onClose }: OrderKingSparkModalProps) {
  const { restaurantId } = useVendor();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "spark",
      text:
        "OrderKing Restaurant AI is connected to the restaurant support endpoint. Ask about verified orders, menu availability, preparation issues, settlements, or operational problems. It will not claim an action was completed without a verified backend result.",
      timestamp: nowTime(),
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (text: string) => {
    const question = text.trim();
    if (!question || sending) return;

    setMessages((prev) => [
      ...prev,
      { id: `usr-${Date.now()}`, sender: "user", text: question, timestamp: nowTime() },
    ]);
    setInputQuery("");
    setSending(true);

    try {
      const result = await askAssistant({ data: { restaurantId, question } });
      setMessages((prev) => [
        ...prev,
        {
          id: `spark-${Date.now()}`,
          sender: "spark",
          text: result.text,
          timestamp: nowTime(),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `spark-error-${Date.now()}`,
          sender: "spark",
          text:
            error instanceof Error
              ? `Restaurant AI request failed: ${error.message}`
              : "Restaurant AI request failed. No simulated answer was generated.",
          timestamp: nowTime(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative flex h-[700px] max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-amber-500/30 bg-[#121214] text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-[#18181B] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500 text-black">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold">OrderKing Spark</span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  RESTAURANT AI
                </span>
              </div>
              <span className="text-[11px] text-zinc-400">Verified data support · Operations · Menu · Settlements</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            aria-label="Close restaurant AI"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-800/80 bg-zinc-900/60 px-4 py-2">
          {[
            "Show my verified settlement and earnings data",
            "Show my current menu availability",
            "Check verified kitchen prep SLA and delays",
            "Give evidence-based growth ideas from my restaurant data",
          ].map((query) => (
            <button
              key={query}
              type="button"
              onClick={() => void handleSend(query)}
              className="whitespace-nowrap rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-[11px] font-semibold text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
            >
              {query}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={
                  "max-w-[88%] rounded-2xl p-3.5 text-sm leading-relaxed " +
                  (msg.sender === "user"
                    ? "bg-amber-500 text-black"
                    : "border border-zinc-800 bg-zinc-900 text-zinc-200")
                }
              >
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                  {msg.sender === "spark" ? <Bot className="size-3.5" /> : null}
                  <span>{msg.sender === "spark" ? "Spark" : "You"}</span>
                </div>
                <div className="mt-1 whitespace-pre-wrap">{msg.text}</div>
                <div className="mt-2 text-[10px] opacity-50">{msg.timestamp}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 border-t border-zinc-800 bg-[#18181B] p-3">
          <Input
            value={inputQuery}
            onChange={(event) => setInputQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend(inputQuery);
              }
            }}
            placeholder="Ask Spark about your restaurant..."
            className="h-10 flex-1 border-zinc-700 bg-zinc-900 text-white"
          />
          <Button
            type="button"
            onClick={() => void handleSend(inputQuery)}
            disabled={!inputQuery.trim() || sending}
            className="h-10 bg-amber-500 font-bold text-black hover:bg-amber-400"
          >
            <Send className="mr-1.5 size-3.5" />
            {sending ? "Thinking…" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
