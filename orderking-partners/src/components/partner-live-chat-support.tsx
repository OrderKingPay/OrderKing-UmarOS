import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Phone, Bike, User, HelpCircle, X, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export interface ChatThread {
  id: string;
  type: "RIDER" | "CUSTOMER" | "SUPPORT";
  targetName: string;
  orderNumber?: string;
  lastMessage: string;
  timeAgo: string;
  unread: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "me" | "them" | "system";
  text: string;
  timestamp: string;
}

export function PartnerLiveChatSupport() {
  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: "th-1",
      type: "RIDER",
      targetName: "Rider Amit Kumar",
      orderNumber: "OK-94281",
      lastMessage: "I have reached outside the restaurant pickup gate.",
      timeAgo: "1m ago",
      unread: true,
    },
    {
      id: "th-2",
      type: "CUSTOMER",
      targetName: "Priya S. (Customer)",
      orderNumber: "OK-94280",
      lastMessage: "Please make sure to add extra mint chutney packets.",
      timeAgo: "6m ago",
      unread: false,
    },
    {
      id: "th-3",
      type: "SUPPORT",
      targetName: "OrderKing Merchant Operations",
      lastMessage: "Daily settlements batch initiated at 18:00 IST.",
      timeAgo: "22m ago",
      unread: false,
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string>("th-1");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({
    "th-1": [
      { id: "m1", sender: "system", text: "Chat connected with assigned rider Amit Kumar for Order #OK-94281", timestamp: "18:02" },
      { id: "m2", sender: "them", text: "I have reached outside the restaurant pickup gate.", timestamp: "18:04" },
    ],
    "th-2": [
      { id: "m3", sender: "them", text: "Please make sure to add extra mint chutney packets.", timestamp: "17:58" },
      { id: "m4", sender: "me", text: "Sure Priya, we have packed 2 extra containers with your Biryani!", timestamp: "18:00" },
    ],
    "th-3": [
      { id: "m5", sender: "them", text: "Daily settlements batch initiated at 18:00 IST.", timestamp: "17:45" },
    ],
  });

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];
  const activeMessages = messages[activeThreadId] || [];

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: `m-${Date.now()}`,
      sender: "me",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), newMsg],
    }));
    setInput("");

    // Quick simulated rider acknowledgement
    if (activeThread.type === "RIDER") {
      setTimeout(() => {
        setMessages((prev) => ({
          ...prev,
          [activeThreadId]: [
            ...(prev[activeThreadId] || []),
            {
              id: `m-${Date.now() + 1}`,
              sender: "them",
              text: "Got it! Waiting at collection counter.",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ],
        }));
      }, 1000);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl border border-border bg-surface overflow-hidden min-h-[500px]">
      {/* Threads Sidebar */}
      <div className="border-r border-border bg-surface-2/40 p-3 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-border/50">
          <h3 className="text-xs font-bold text-fg flex items-center gap-1.5">
            <MessageSquare className="size-3.5 text-primary" /> Live Communication
          </h3>
          <span className="text-[10px] text-muted">Real-Time</span>
        </div>

        <div className="space-y-1">
          {threads.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => {
                setActiveThreadId(th.id);
                setThreads((prev) =>
                  prev.map((t) => (t.id === th.id ? { ...t, unread: false } : t))
                );
              }}
              className={`w-full rounded-xl p-2.5 text-left transition flex items-start gap-2.5 ${
                activeThreadId === th.id
                  ? "bg-primary text-primary-fg shadow-xs"
                  : "bg-surface text-fg hover:bg-surface-2"
              }`}
            >
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  activeThreadId === th.id
                    ? "bg-primary-fg/20 text-primary-fg"
                    : "bg-surface-2 text-muted"
                }`}
              >
                {th.type === "RIDER" && <Bike className="size-4" />}
                {th.type === "CUSTOMER" && <User className="size-4" />}
                {th.type === "SUPPORT" && <HelpCircle className="size-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold truncate">{th.targetName}</p>
                  <span className="text-[9px] opacity-75">{th.timeAgo}</span>
                </div>
                {th.orderNumber && (
                  <p className="text-[10px] opacity-80">#{th.orderNumber}</p>
                )}
                <p className="text-[11px] truncate opacity-85 mt-0.5">{th.lastMessage}</p>
              </div>
              {th.unread && (
                <span className="size-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Pane */}
      <div className="md:col-span-2 flex flex-col justify-between h-full bg-surface">
        {/* Chat Pane Header */}
        <div className="flex items-center justify-between border-b border-border p-3.5 bg-surface-2/60">
          <div>
            <h4 className="text-xs font-bold text-fg flex items-center gap-1.5">
              {activeThread.targetName}
              {activeThread.orderNumber && (
                <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-mono text-primary">
                  Order #{activeThread.orderNumber}
                </span>
              )}
            </h4>
            <p className="text-[10px] text-muted">Direct messaging channel</p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-semibold text-fg hover:bg-surface-2 transition"
          >
            <Phone className="size-3" /> Call Partner
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs max-h-80">
          {activeMessages.map((msg) => {
            if (msg.sender === "system") {
              return (
                <div key={msg.id} className="text-center my-1">
                  <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[10px] text-muted border border-border">
                    {msg.text}
                  </span>
                </div>
              );
            }
            const isMe = msg.sender === "me";
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs ${
                    isMe
                      ? "bg-primary text-primary-fg rounded-br-xs"
                      : "bg-surface-2 text-fg border border-border rounded-bl-xs"
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="text-[9px] text-muted mt-0.5 px-1">{msg.timestamp}</span>
              </div>
            );
          })}
        </div>

        {/* Quick Canned Action Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-t border-border/60 bg-surface-2/30 p-2 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => handleSend("Order is packed and ready at the counter!")}
            className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] hover:border-primary transition"
          >
            📦 Ready for pickup
          </button>
          <button
            type="button"
            onClick={() => handleSend("Prep delay: fresh batch will take 5 more minutes")}
            className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] hover:border-primary transition"
          >
            ⏳ Delay 5 mins
          </button>
          <button
            type="button"
            onClick={() => handleSend("Extra condiments & napkins included in parcel")}
            className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] hover:border-primary transition"
          >
            🥫 Condiments added
          </button>
        </div>

        {/* Input Bar */}
        <div className="border-t border-border p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${activeThread.targetName}...`}
            className="flex-1 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs focus:border-primary focus:outline-hidden"
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
