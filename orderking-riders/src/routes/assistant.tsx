// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { AppShell } from "@/components/rider/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare,
  Send,
  RotateCcw,
  PhoneCall,
  Bike,
  Wallet,
  UserCheck,
  Paperclip,
  CheckCircle2,
  X,
} from "lucide-react";

export const Route = createFileRoute("/assistant")({
  component: RiderAssistantPage,
});

interface RiderChatMsg {
  id: string;
  role: "assistant" | "user";
  text: string;
  files?: string[];
  actionTo?: { label: string; to: string };
}

const RIDER_PROMPTS = [
  "Order pickup / customer unreachable escalation",
  "Rate card: Base pay, distance pay, wait pay & target bonus",
  "Security deposit & COD cash limit settlement",
  "Upload photo/video proof or update bank/vehicle",
];

function getRiderReply(input: string, files: string[]): { text: string; actionTo?: { label: string; to: string } } {
  const q = input.toLowerCase();
  if (files.length > 0) {
    return {
      text: `Uploaded [${files.join(", ")}]. Proof attached to your active trip / profile without penalty.`,
      actionTo: { label: "Back to Duty & Orders (/)", to: "/" },
    };
  }
  if (q.includes("rate") || q.includes("earn") || q.includes("bonus") || q.includes("payout") || q.includes("pay")) {
    return {
      text: "OrderKing Delivery Partner Rate Card: Base Pay (₹25–₹35 first 2 km) + Distance Pay (₹10–₹14/km after 2 km) + Wait Pay (₹1/min after 5m at kitchen) + 100% Customer Tips + Daily Target Milestone Bonus.",
      actionTo: { label: "View Earnings (/earnings)", to: "/earnings" },
    };
  }
  if (q.includes("cod") || q.includes("deposit") || q.includes("cash")) {
    return {
      text: "Joining is ₹0 (Prepaid & UPI orders active immediately). Your COD cash limit matches your Security Deposit tier and can be settled anytime via UPI in Payouts.",
      actionTo: { label: "Open Payouts (/settlements)", to: "/settlements" },
    };
  }
  if (q.includes("pickup") || q.includes("drop") || q.includes("unreach") || q.includes("escalat")) {
    return {
      text: "For customer unreachable or spill/damage issues, attach a photo/video using Upload below or complete the 3-call check on your active order card to protect your trip payout.",
      actionTo: { label: "Open Active Order (/)", to: "/" },
    };
  }
  return {
    text: "Type any question or upload a photo/video/document below for instant support.",
    actionTo: { label: "Open Duty Console (/)", to: "/" },
  };
}

function RiderAssistantPage() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [messages, setMessages] = useState<RiderChatMsg[]>([
    {
      id: "w1",
      role: "assistant",
      text: "Hi Delivery Partner! Ask about orders, rate card, incentives, COD deposit, or upload photo/video/document proof below.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<string[]>([]);

  function sendMsg(textOverride?: string) {
    const q = (textOverride ?? draft).trim();
    if (!q && files.length === 0) return;
    const attached = [...files];
    const userText = q || `Uploaded: ${attached.join(", ")}`;
    const reply = getRiderReply(userText, attached);

    setMessages((prev) => [
      ...prev,
      { id: "u_" + Date.now(), role: "user", text: userText, files: attached.length ? attached : undefined },
      { id: "a_" + (Date.now() + 1), role: "assistant", text: reply.text, actionTo: reply.actionTo },
    ]);
    if (!textOverride) setDraft("");
    setFiles([]);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-4 space-y-4 text-slate-100">
        <div className="flex items-center justify-between rounded-2xl border border-[#1E283D] bg-[#121723] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#E5A93C]/20 text-[#E5A93C]">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Delivery Partner Support</h1>
              <p className="text-[11px] text-slate-400">Escalations, Photo/Video Proof & Payout Help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="tel:112"
              className="rounded-xl border border-rose-500/40 bg-rose-950/50 px-3 py-1.5 text-xs font-bold text-rose-300 flex items-center gap-1"
            >
              <PhoneCall className="size-3.5" />
              <span>SOS 112</span>
            </a>
            <button
              type="button"
              onClick={() => {
                setFiles([]);
                setMessages([
                  {
                    id: "w1",
                    role: "assistant",
                    text: "Hi Delivery Partner! Ask about orders, rate card, incentives, COD deposit, or upload photo/video/document proof below.",
                  },
                ]);
              }}
              className="rounded-xl border border-[#1E283D] bg-[#0E121B] px-2.5 py-1.5 text-xs text-slate-300 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RIDER_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => sendMsg(p)}
              className="rounded-xl border border-[#1E283D] bg-[#121723] hover:border-[#E5A93C]/50 px-3.5 py-2.5 text-left text-xs font-medium text-slate-200 transition"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-[#1E283D] bg-[#0E121B] p-4 space-y-3 min-h-[260px] max-h-[380px] overflow-y-auto">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed space-y-2 ${
                  m.role === "user"
                    ? "bg-[#E5A93C] text-black font-semibold"
                    : "border border-[#1E283D] bg-[#121723] text-slate-100"
                }`}
              >
                <div>{m.text}</div>
                {m.actionTo && (
                  <div>
                    <Link
                      to={m.actionTo.to}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#E5A93C]/20 border border-[#E5A93C]/40 px-2.5 py-1 text-[11px] font-bold text-[#E5A93C]"
                    >
                      <CheckCircle2 className="size-3" />
                      <span>{m.actionTo.label} →</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-xl border border-[#1E283D] bg-[#121723] p-2">
            {files.map((name, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-[#0E121B] px-2.5 py-1 text-xs text-slate-200">
                <Paperclip className="size-3 text-[#E5A93C]" />
                <span>{name}</span>
                <button type="button" onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}>
                  <X className="size-3 text-slate-400 hover:text-rose-400" />
                </button>
              </span>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMsg();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf"
            onChange={(e: any) => {
              const picked = Array.from(e.target.files || []).map((f: any) => f.name);
              if (picked.length) setFiles((prev) => [...prev, ...picked]);
              e.target.value = "";
            }}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            className="h-11 px-3 border-[#1E283D] bg-[#121723] text-slate-200 rounded-xl flex items-center gap-1 shrink-0"
          >
            <Paperclip className="size-4 text-[#E5A93C]" />
            <span className="text-xs font-semibold hidden sm:inline">Upload</span>
          </Button>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your message or upload proof..."
            className="h-11 bg-[#121723] border-[#1E283D] text-white placeholder:text-slate-400 rounded-xl"
          />
          <Button
            type="submit"
            className="h-11 px-5 bg-[#E5A93C] hover:bg-amber-400 text-black font-bold rounded-xl flex items-center gap-1.5 shrink-0"
          >
            <Send className="size-4" />
            <span>Send</span>
          </Button>
        </form>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <Link to="/" className="rounded-xl border border-[#1E283D] bg-[#121723] p-2.5 text-center text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5">
            <Bike className="size-3.5 text-[#E5A93C]" />
            <span>Duty</span>
          </Link>
          <Link to="/earnings" className="rounded-xl border border-[#1E283D] bg-[#121723] p-2.5 text-center text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5">
            <Wallet className="size-3.5 text-[#E5A93C]" />
            <span>Earnings</span>
          </Link>
          <Link to="/onboarding" className="rounded-xl border border-[#1E283D] bg-[#121723] p-2.5 text-center text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5">
            <UserCheck className="size-3.5 text-[#E5A93C]" />
            <span>Profile</span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
