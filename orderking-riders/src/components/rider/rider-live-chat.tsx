import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Phone, User, Shield, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface RiderChatMessage {
  id: string;
  sender: "rider" | "customer" | "dispatch";
  text: string;
  timestamp: string;
}

export interface RiderLiveChatProps {
  orderCode?: string;
  customerName?: string;
  customerPhone?: string;
  dropAddress?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function RiderLiveChat({
  orderCode = "OK-94281",
  customerName = "Priya Sharma",
  customerPhone = "+91 98765 43210",
  dropAddress = "Flat 402, Block B, Green Glen Heights",
  isOpen = false,
  onClose,
}: RiderLiveChatProps) {
  const [open, setOpen] = useState(isOpen);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<RiderChatMessage[]>([
    {
      id: "rm-1",
      sender: "dispatch",
      text: `Live chat enabled for Order #${orderCode}. Your phone number is masked for privacy.`,
      timestamp: "18:10",
    },
    {
      id: "rm-2",
      sender: "customer",
      text: "Hi, please leave the parcel on the shoe rack outside the main flat door.",
      timestamp: "18:12",
    },
  ]);

  const QUICK_CANNED = [
    "📍 I have arrived outside your building gate",
    "🔢 Please share your 4-digit delivery OTP",
    "🚪 I am outside your flat door now",
    "📞 Calling your phone now, please pick up",
    "🏢 Security guard is not allowing bikes inside",
  ];

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text) return;

    const newMsg: RiderChatMessage = {
      id: `rm-${Date.now()}`,
      sender: "rider",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    // Simulated reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `rm-${Date.now() + 1}`,
          sender: "customer",
          text: "Thanks, opening the door right now!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1200);
  };

  if (!open && !isOpen) {
    return (
      <Button
        variant="secondary"
        onClick={() => setOpen(true)}
        className="w-full gap-2 text-xs"
      >
        <MessageSquare className="size-4" /> Chat with Customer ({customerName})
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs">
      <div className="flex h-[85vh] sm:h-[550px] w-full max-w-md flex-col rounded-t-3xl sm:rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-2 p-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
              <User className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-fg">{customerName}</h3>
              <p className="text-[10px] text-muted flex items-center gap-1">
                <MapPin className="size-3" /> {dropAddress}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <a
              href={`tel:${customerPhone}`}
              className="rounded-full p-2 text-muted hover:bg-surface hover:text-fg transition"
              title="Call customer via masked hotline"
            >
              <Phone className="size-4" />
            </a>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onClose?.();
              }}
              className="rounded-full p-2 text-muted hover:bg-surface hover:text-fg transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs no-scrollbar">
          {messages.map((m) => {
            if (m.sender === "dispatch") {
              return (
                <div key={m.id} className="text-center my-1">
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[10px] text-muted border border-border">
                    {m.text}
                  </span>
                </div>
              );
            }
            const isMe = m.sender === "rider";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    isMe
                      ? "bg-primary text-primary-fg rounded-br-xs"
                      : "bg-surface-2 text-fg border border-border rounded-bl-xs"
                  }`}
                >
                  <p>{m.text}</p>
                </div>
                <span className="text-[9px] text-muted mt-0.5 px-1">{m.timestamp}</span>
              </div>
            );
          })}
        </div>

        {/* 1-Tap Canned Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border/50 bg-surface px-2.5 py-1.5 text-xs no-scrollbar">
          {QUICK_CANNED.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(chip)}
              className="shrink-0 rounded-full border border-border bg-surface-2 px-2 py-0.8 text-[10px] hover:border-primary transition"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="border-t border-border bg-surface p-2.5 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message customer..."
            className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-1.5 text-xs focus:border-primary focus:outline-hidden"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button size="sm" onClick={() => handleSend()} disabled={!input.trim()}>
            <Send className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
