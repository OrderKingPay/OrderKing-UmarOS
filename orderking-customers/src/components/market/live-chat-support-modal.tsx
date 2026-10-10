import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Paperclip, X, UserCheck, ShieldAlert, PhoneCall, Sparkles, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface LiveChatMessage {
  id: string;
  sender: "customer" | "agent" | "system";
  text: string;
  timestamp: string;
  agentName?: string;
  attachmentUrl?: string;
}

export interface LiveChatSupportModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  orderId?: string;
  orderNumber?: string;
  restaurantName?: string;
}

export function LiveChatSupportModal({
  isOpen = false,
  onClose,
  orderId,
  orderNumber = "OK-94281",
  restaurantName = "Royal Kitchens",
}: LiveChatSupportModalProps) {
  const [open, setOpen] = useState(isOpen);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<LiveChatMessage[]>([
    {
      id: "msg-1",
      sender: "system",
      text: `Live chat session connected for Order #${orderNumber} (${restaurantName}). Support Executive Assigned.`,
      timestamp: "Just now",
    },
    {
      id: "msg-2",
      sender: "agent",
      agentName: "Aarav Sharma (Senior Resolution Executive)",
      text: "Namaste! I'm Aarav from OrderKing Priority Care. I have your order details open right now. How may I assist you today?",
      timestamp: "Just now",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text) return;

    const newMsg: LiveChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "customer",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate realistic live agent escalation response
    setTimeout(() => {
      setIsTyping(false);
      let reply = "I understand completely. Let me check the real-time telemetry with our kitchen and delivery fleet.";
      if (text.toLowerCase().includes("where") || text.toLowerCase().includes("delay") || text.toLowerCase().includes("late")) {
        reply = "I checked with our delivery partner who is 1.4 km away. If your delivery exceeds our estimated time, ₹50 will be auto-credited to your account instantly under our On-Time Guarantee!";
      } else if (text.toLowerCase().includes("cancel")) {
        reply = "I've flagged this to the restaurant station. If food preparation has not commenced, 100% refund will be credited instantly to your original payment mode.";
      } else if (text.toLowerCase().includes("spill") || text.toLowerCase().includes("damage") || text.toLowerCase().includes("cold")) {
        reply = "We sincerely apologize for this bad experience! Could you please share a photo using the attachment icon? I will initiate an immediate replacement or full dish refund.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: "agent",
          agentName: "Aarav Sharma",
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }, 1200);
  };

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 font-semibold text-primary-fg shadow-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl"
        aria-label="Open Live Chat Support"
      >
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
        </span>
        <MessageSquare className="size-4" />
        <span className="text-xs">Live Support (Online)</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-white/60 p-0 sm:p-4 backdrop-blur-xs">
      <div className="flex h-[90vh] sm:h-[600px] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-2 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
              👑
              <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-surface bg-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-fg">OrderKing Live Support</h3>
                <Badge tone="success" className="text-[10px] py-0 px-1.5">LIVE</Badge>
              </div>
              <p className="text-[11px] text-muted flex items-center gap-1">
                <Clock className="size-3 text-muted" /> Avg Response &lt; 45s · Executive Connected
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1.5 text-muted hover:bg-surface hover:text-fg transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Order Context Pill */}
        <div className="flex items-center justify-between bg-surface-2/60 px-4 py-2 text-xs border-b border-border/50">
          <span className="text-muted">
            Order <strong className="text-fg">#{orderNumber}</strong> ({restaurantName})
          </span>
          <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            Priority Queue
          </span>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs no-scrollbar">
          {messages.map((m) => {
            if (m.sender === "system") {
              return (
                <div key={m.id} className="text-center my-2">
                  <span className="rounded-full bg-surface-2 px-3 py-1 text-[11px] text-muted border border-border">
                    {m.text}
                  </span>
                </div>
              );
            }
            const isMe = m.sender === "customer";
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <span className="mb-1 text-[10px] font-semibold text-muted pl-1">
                    {m.agentName || "Support"}
                  </span>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-2xs ${
                    isMe
                      ? "bg-primary text-primary-fg rounded-br-xs"
                      : "bg-surface-2 text-fg border border-border rounded-bl-xs"
                  }`}
                >
                  <p>{m.text}</p>
                </div>
                <span className="mt-1 text-[9px] text-muted px-1">{m.timestamp}</span>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-muted pl-1">
              <span className="flex size-2 rounded-full bg-primary animate-ping" />
              <span>Aarav is typing a response...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 1-Tap Quick Action Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border/50 bg-surface px-3 py-2 no-scrollbar">
          <button
            type="button"
            onClick={() => handleSend("Where is my order right now?")}
            className="shrink-0 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium hover:border-primary transition"
          >
            🛵 Where is rider?
          </button>
          <button
            type="button"
            onClick={() => handleSend("I want to cancel this order")}
            className="shrink-0 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-danger hover:border-danger transition"
          >
            🛑 Cancel Order
          </button>
          <button
            type="button"
            onClick={() => handleSend("Food package was spilled or damaged")}
            className="shrink-0 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium hover:border-primary transition"
          >
            🥣 Food Spilled
          </button>
          <button
            type="button"
            onClick={() => handleSend("Can I speak with a telephone supervisor?")}
            className="shrink-0 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium hover:border-primary transition"
          >
            📞 Request Call
          </button>
        </div>

        {/* Input Bar */}
        <div className="border-t border-border bg-surface p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              className="rounded-full p-2 text-muted hover:bg-surface-2 hover:text-fg transition"
              title="Attach photo or receipt"
            >
              <Paperclip className="size-4" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message to support agent..."
              className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs focus:border-primary focus:outline-hidden"
            />
            <Button size="sm" type="submit" disabled={!input.trim()}>
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
