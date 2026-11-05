// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVendor } from "@/components/use-vendor";
import { Sparkles, Send, RotateCcw, Store, Utensils, Banknote, Tag } from "lucide-react";

export const Route = createFileRoute("/assistant")({
  component: PartnerSparkAssistantPage,
});

export const INDIAN_CONSTITUTIONAL_LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", label: "Malayalam", native: "മലയാളം" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "pa", label: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
] as const;

interface ChatMsg {
  id: string;
  role: "assistant" | "user";
  text: string;
}

const QUICK_PROMPTS = [
  "Update dish prices or stock",
  "Check bank payout schedule",
  "Create discount offer",
  "Change prep time or pause orders",
];

function buildSparkReply(input: string, restaurantName: string): string {
  const q = input.toLowerCase();
  if (q.includes("menu") || q.includes("stock") || q.includes("price") || q.includes("dish")) {
    return `Open Menu (/menu) to add dishes, edit prices, or toggle any item In Stock / Out of Stock for ${restaurantName}.`;
  }
  if (q.includes("payout") || q.includes("bank") || q.includes("settle") || q.includes("money")) {
    return "Open Settlement (/settlements) to view order payouts and bank details, or update your Payout Schedule (Standard After Next Day or Next-Day T+1) in Restaurant Profile (/onboarding).";
  }
  if (q.includes("offer") || q.includes("promo") || q.includes("discount")) {
    return "Open Offers (/promotions) to activate a discount on orders above your minimum bill value.";
  }
  if (q.includes("prep") || q.includes("rush") || q.includes("pause") || q.includes("online") || q.includes("offline")) {
    return "Use the Online/Offline toggle and Prep Time selector on Home (/dashboard) or Kitchen (/kds).";
  }
  return `Manage ${restaurantName} using Orders (/orders), Menu (/menu), Settlement (/settlements), Offers (/promotions), or Profile (/onboarding).`;
}

function PartnerSparkAssistantPage() {
  const vendor = useVendor();
  const restName = vendor?.activeRestaurant?.displayName || vendor?.activeRestaurant?.name || "Your Restaurant";
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `Hi! Ask Spark anything about ${restName} orders, menu, offers, or payouts.`,
    },
  ]);
  const [draft, setDraft] = useState("");

  function handleSend(textToSend?: string) {
    const q = (textToSend ?? draft).trim();
    if (!q) return;
    const userMsg: ChatMsg = { id: "u_" + Date.now(), role: "user", text: q };
    const replyMsg: ChatMsg = {
      id: "a_" + (Date.now() + 1),
      role: "assistant",
      text: buildSparkReply(q, restName),
    };
    setMessages((prev) => [...prev, userMsg, replyMsg]);
    if (!textToSend) setDraft("");
  }

  return (
    <VendorShell title="Spark Assistant">
      <div className="mx-auto max-w-3xl py-4 space-y-4 text-slate-100">
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Spark Assistant</h1>
              <p className="text-xs text-slate-400">{restName}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setMessages([
                {
                  id: "welcome",
                  role: "assistant",
                  text: `Hi! Ask Spark anything about ${restName} orders, menu, offers, or payouts.`,
                },
              ])
            }
            className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800 text-xs h-9 px-3 rounded-xl flex items-center gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            <span>New Chat</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="rounded-xl border border-slate-800 bg-slate-900/90 hover:border-emerald-500/50 hover:bg-slate-900 px-4 py-3 text-left text-xs font-medium text-slate-200 transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3 min-h-[280px] max-h-[420px] overflow-y-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-emerald-600 text-white font-medium"
                    : "border border-slate-800 bg-slate-900 text-slate-100"
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
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask a question..."
            className="h-12 bg-slate-900 border-slate-800 text-white placeholder:text-slate-400 rounded-xl"
          />
          <Button
            type="submit"
            className="h-12 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-2 shrink-0"
          >
            <Send className="size-4" />
            <span>Send</span>
          </Button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <Link to="/orders" className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center text-xs font-semibold text-slate-200 hover:border-emerald-500/50 flex items-center justify-center gap-1.5">
            <Store className="size-4 text-emerald-400" />
            <span>Orders</span>
          </Link>
          <Link to="/menu" className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center text-xs font-semibold text-slate-200 hover:border-emerald-500/50 flex items-center justify-center gap-1.5">
            <Utensils className="size-4 text-emerald-400" />
            <span>Menu</span>
          </Link>
          <Link to="/settlements" className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center text-xs font-semibold text-slate-200 hover:border-emerald-500/50 flex items-center justify-center gap-1.5">
            <Banknote className="size-4 text-emerald-400" />
            <span>Settlement</span>
          </Link>
          <Link to="/promotions" className="rounded-xl border border-slate-800 bg-slate-900 p-3 text-center text-xs font-semibold text-slate-200 hover:border-emerald-500/50 flex items-center justify-center gap-1.5">
            <Tag className="size-4 text-emerald-400" />
            <span>Offers</span>
          </Link>
        </div>
      </div>
    </VendorShell>
  );
}
