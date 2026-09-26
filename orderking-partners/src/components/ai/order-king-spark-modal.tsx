import { useState } from "react";
import { Sparkles, X, Send } from "lucide-react";
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

export function OrderKingSparkModal({ isOpen, onClose }: OrderKingSparkModalProps) {
  const { restaurantId } = useVendor();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "spark",
      text: "OrderKing Restaurant AI is ready. Ask about your authorized restaurant orders, sales, menu availability, preparation issues, settlements, or operations. Responses use the connected AI service and verified restaurant data; no simulated answer is generated.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
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
      {
        id: `usr-${Date.now()}`,
        sender: "user",
        text: question,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
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
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: "spark",
          text: `Restaurant AI request failed: ${error instanceof Error ? error.message : "Unknown error"}. No simulated answer was generated.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative flex h-[700px] max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-amber-500/30 bg-[#121214] text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-[#18181B] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-black">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold tracking-wide text-white">Order King Spark</span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">RESTAURANT AI</span>
              </div>
              <span className="mt-0.5 block text-[11px] text-zinc-400">Verified restaurant data · Operations · Menu · Settlements</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-800/80 bg-zinc-900/60 px-4 py-2">
          {[
            ["Settlement & Earnings", "Show my verified settlement and earnings data"],
            ["Menu Availability", "Show my current menu availability"],
            ["Kitchen SLA", "Check verified kitchen prep SLA and delays"],
            ["Growth Advice", "Give me evidence-based growth ideas from my restaurant data"],
          ].map(([label, query]) => (
            <button
              key={label}
              type="button"
              onClick={() => handleSend(query)}
              disabled={sending}
              className="whitespace-nowrap rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-[11px] font-semibold text-zinc-300 transition hover:bg-zinc-700 hover:text-white disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
              <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed sm:text-sm ${msg.sender === "user" ? "bg-amber-500 font-medium text-black" : "border border-zinc-800 bg-zinc-900 text-zinc-200"}`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>
              <span className="mt-1 px-1 text-[10px] text-zinc-500">{msg.timestamp}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 border-t border-zinc-800 bg-[#18181B] p-3">
          <Input
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend(inputQuery);
              }
            }}
            placeholder="Ask Restaurant AI about your verified restaurant operations..."
            className="h-10 flex-1 border-zinc-700 bg-zinc-900 text-xs text-white placeholder:text-zinc-500 sm:text-sm"
          />
          <Button type="button" onClick={() => void handleSend(inputQuery)} disabled={!inputQuery.trim() || sending} className="h-10 bg-amber-500 px-4 text-xs font-bold text-black hover:bg-amber-400">
            <Send className="mr-1.5 size-3.5" />
            {sending ? "Thinking…" : "Send"}
          </Button>
        </div>
      </div>
    </div>
  );
}
