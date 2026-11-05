// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/rider/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, RotateCcw, PhoneCall, Bike, Wallet, UserCheck } from "lucide-react";

export const Route = createFileRoute("/assistant")({
  component: RiderAssistantPage,
});

interface RiderChatMsg {
  id: string;
  role: "assistant" | "user";
  text: string;
}

const RIDER_PROMPTS = [
  "Order pickup or customer drop help",
  "Check my earnings & payout schedule",
  "Free Joining & COD deposit limit",
  "Update vehicle or bank / UPI details",
];

function getRiderReply(input: string): string {
  const q = input.toLowerCase();
  if (q.includes("cod") || q.includes("deposit") || q.includes("cash") || q.includes("join")) {
    return "Joining is Free (₹0 onboarding fee) with Prepaid/UPI orders active immediately. COD cash capacity matches your Security Deposit tier and can be settled via UPI in Payouts (/settlements).";
  }
  if (q.includes("earn") || q.includes("payout") || q.includes("pay") || q.includes("money")) {
    return "Open Earnings (/earnings) and Payouts (/settlements) to check trip pay, distance pay, tips, and bank/UPI transfers.";
  }
  if (q.includes("pickup") || q.includes("drop") || q.includes("order") || q.includes("customer")) {
    return "On an active order, tap Reached Restaurant -> enter 4-digit pickup code -> Picked Up -> Reached Customer -> enter delivery OTP on Duty & Orders (/).";
  }
  return "Use Duty (/), Earnings (/earnings), Payouts (/settlements), or Profile (/onboarding).";
}

function RiderAssistantPage() {
  const [messages, setMessages] = useState<RiderChatMsg[]>([
    {
      id: "w1",
      role: "assistant",
      text: "Hi! Ask anything about your deliveries, earnings, payouts, or account.",
    },
  ]);
  const [draft, setDraft] = useState("");

  function sendMsg(text?: string) {
    const q = (text ?? draft).trim();
    if (!q) return;
    setMessages((prev) => [
      ...prev,
      { id: "u_" + Date.now(), role: "user", text: q },
      { id: "a_" + (Date.now() + 1), role: "assistant", text: getRiderReply(q) },
    ]);
    if (!text) setDraft("");
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-4 py-5 space-y-4 text-slate-100">
        <div className="flex items-center justify-between rounded-2xl border border-[#1E283D] bg-[#121723] px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-[#E5A93C]/20 text-[#E5A93C]">
              <MessageSquare className="size-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Delivery Partner Support</h1>
              <p className="text-[11px] text-slate-400">Orders, Earnings & Account Help</p>
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
              onClick={() =>
                setMessages([
                  {
                    id: "w1",
                    role: "assistant",
                    text: "Hi! Ask anything about your deliveries, earnings, payouts, or account.",
                  },
                ])
              }
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
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#E5A93C] text-black font-semibold"
                    : "border border-[#1E283D] bg-[#121723] text-slate-100"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMsg();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your question..."
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
