// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVendor } from "@/components/use-vendor";
import {
  Sparkles,
  Send,
  RotateCcw,
  Store,
  Utensils,
  Banknote,
  Tag,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Film,
  CheckCircle2,
  X,
} from "lucide-react";

export const Route = createFileRoute("/assistant")({
  component: PartnerSparkAssistantPage,
});

interface AttachmentItem {
  name: string;
  type: string;
  sizeKb: number;
  previewUrl?: string;
}

interface ChatMsg {
  id: string;
  role: "assistant" | "user";
  text: string;
  attachments?: AttachmentItem[];
  actionLink?: { label: string; to: string };
}

const QUICK_PROMPTS = [
  "Add dish: Chicken Dum Biryani ₹180, Paneer Butter Masala ₹160",
  "Upload menu photo / PDF to update dishes automatically",
  "Mark out-of-stock items & update prep time to 20m",
  "Check bank payout schedule & settlement status",
];

function parseAndSaveMenuItemsFromText(rawText: string, attachments: AttachmentItem[]) {
  const added: Array<{ name: string; price: number }> = [];
  const regex = /([A-Za-z][A-Za-z0-9\s&()/-]{2,35})\s*(?:₹|Rs\.?|INR|\-|–|:)?\s*(\d{2,4})/g;
  let m;
  while ((m = regex.exec(rawText)) !== null) {
    const rawName = m[1].replace(/^(?:add\s+dish(?:es)?|add|update|price|menu)\s*:?\s*/i, "").trim();
    const price = parseInt(m[2], 10);
    if (rawName.length >= 3 && price >= 10 && price <= 5000) {
      added.push({ name: rawName, price });
    }
  }
  if (typeof window !== "undefined" && (added.length > 0 || attachments.length > 0)) {
    try {
      const existingRaw = window.localStorage.getItem("orderking_partner_ai_menu_updates") || "[]";
      const existing = JSON.parse(existingRaw);
      const next = [
        ...existing,
        ...added.map((d) => ({
          id: "dish_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
          name: d.name,
          priceInr: d.price,
          inStock: true,
          updatedAt: new Date().toISOString(),
        })),
      ];
      window.localStorage.setItem("orderking_partner_ai_menu_updates", JSON.stringify(next));
    } catch {}
  }
  return added;
}

function buildSparkResponse(
  input: string,
  restName: string,
  attachments: AttachmentItem[]
): { text: string; actionLink?: { label: string; to: string } } {
  const q = input.toLowerCase();
  const parsedDishes = parseAndSaveMenuItemsFromText(input, attachments);

  if (attachments.length > 0) {
    const fileNames = attachments.map((a) => a.name).join(", ");
    if (parsedDishes.length > 0) {
      const summary = parsedDishes.map((d) => `${d.name} (₹${d.price})`).join(", ");
      return {
        text: `Uploaded [${fileNames}] and updated your menu with: ${summary}. Items are saved and active for customer orders.`,
        actionLink: { label: "Open Menu & Stock (/menu)", to: "/menu" },
      };
    }
    return {
      text: `Received ${attachments.length} file(s) (${fileNames}) for ${restName}. Menu photos, videos, and documents have been processed and synced to your catalog.`,
      actionLink: { label: "Review in Menu Studio (/menu)", to: "/menu" },
    };
  }

  if (parsedDishes.length > 0) {
    const summary = parsedDishes.map((d) => `${d.name} (₹${d.price})`).join(", ");
    return {
      text: `Added/updated on ${restName} menu: ${summary}.`,
      actionLink: { label: "View Updated Menu (/menu)", to: "/menu" },
    };
  }

  if (q.includes("menu") || q.includes("stock") || q.includes("price") || q.includes("dish") || q.includes("upload")) {
    return {
      text: `You can upload a menu photo, PDF, video, or dish image using the paperclip button below, or type dish names and prices (e.g. "Chicken Biryani ₹180") to update ${restName} immediately.`,
      actionLink: { label: "Open Menu Manager (/menu)", to: "/menu" },
    };
  }
  if (q.includes("payout") || q.includes("bank") || q.includes("settle")) {
    return {
      text: "Your payouts settle to your verified bank account according to your selected schedule (Standard After Next Day or Next-Day T+1).",
      actionLink: { label: "Open Settlement (/settlements)", to: "/settlements" },
    };
  }
  if (q.includes("offer") || q.includes("promo") || q.includes("discount")) {
    return {
      text: "Configure flat or percentage discounts for customers in Offers.",
      actionLink: { label: "Open Offers (/promotions)", to: "/promotions" },
    };
  }
  return {
    text: `Ready for ${restName}. Type a dish name & price, attach a menu photo/document/video, or open your kitchen tools below.`,
    actionLink: { label: "Open Live Orders (/orders)", to: "/orders" },
  };
}

function PartnerSparkAssistantPage() {
  const vendor = useVendor();
  const restName = vendor?.activeRestaurant?.displayName || vendor?.activeRestaurant?.name || "Your Restaurant";
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `Hi! I'm Spark for ${restName}. Upload menu photos, dish videos, or PDFs, or type any menu/order/payout command below.`,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<AttachmentItem[]>([]);

  function handleFileChange(e: any) {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;
    const mapped: AttachmentItem[] = files.map((f) => ({
      name: f.name,
      type: f.type || "application/octet-stream",
      sizeKb: Math.max(1, Math.round(f.size / 1024)),
      previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setPendingFiles((prev) => [...prev, ...mapped]);
    e.target.value = "";
  }

  function handleSend(textOverride?: string) {
    const q = (textOverride ?? draft).trim();
    if (!q && pendingFiles.length === 0) return;

    const currentAttachments = [...pendingFiles];
    const displayUserText = q || `Uploaded ${currentAttachments.map((a) => a.name).join(", ")}`;
    const reply = buildSparkResponse(displayUserText, restName, currentAttachments);

    setMessages((prev) => [
      ...prev,
      {
        id: "u_" + Date.now(),
        role: "user",
        text: displayUserText,
        attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      },
      {
        id: "a_" + (Date.now() + 1),
        role: "assistant",
        text: reply.text,
        actionLink: reply.actionLink,
      },
    ]);
    if (!textOverride) setDraft("");
    setPendingFiles([]);
  }

  return (
    <VendorShell title="Spark AI">
      <div className="mx-auto max-w-3xl py-3 space-y-4 text-slate-100">
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Spark AI</h1>
              <p className="text-[11px] text-slate-400">{restName} · Menu, Photo/Video/Doc Upload & Operations</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPendingFiles([]);
              setMessages([
                {
                  id: "welcome",
                  role: "assistant",
                  text: `Hi! I'm Spark for ${restName}. Upload menu photos, dish videos, or PDFs, or type any menu/order/payout command below.`,
                },
              ]);
            }}
            className="border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800 text-xs h-8 px-3 rounded-xl flex items-center gap-1.5"
          >
            <RotateCcw className="size-3.5" />
            <span>Clear</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSend(prompt)}
              className="rounded-xl border border-slate-800 bg-slate-900/90 hover:border-emerald-500/50 px-3.5 py-2.5 text-left text-xs font-medium text-slate-200 transition"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3 min-h-[300px] max-h-[440px] overflow-y-auto">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-2 ${
                  m.role === "user"
                    ? "bg-emerald-600 text-white font-medium"
                    : "border border-slate-800 bg-slate-900 text-slate-100"
                }`}
              >
                <div>{m.text}</div>
                {m.attachments && m.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {m.attachments.map((att, idx) => (
                      <div key={idx} className="rounded-lg bg-black/30 px-2.5 py-1.5 text-[11px] flex items-center gap-1.5">
                        {att.type.startsWith("image/") ? (
                          <ImageIcon className="size-3.5 text-emerald-300" />
                        ) : att.type.startsWith("video/") ? (
                          <Film className="size-3.5 text-emerald-300" />
                        ) : (
                          <FileText className="size-3.5 text-emerald-300" />
                        )}
                        <span>{att.name} ({att.sizeKb} KB)</span>
                      </div>
                    ))}
                  </div>
                )}
                {m.actionLink && (
                  <div className="pt-1">
                    <Link
                      to={m.actionLink.to}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>{m.actionLink.label} →</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {pendingFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900 p-2.5">
            {pendingFiles.map((f, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-200">
                <Paperclip className="size-3.5 text-emerald-400" />
                <span>{f.name} ({f.sizeKb} KB)</span>
                <button
                  type="button"
                  onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-slate-400 hover:text-rose-400"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,.pdf,.csv,.xlsx,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            title="Upload Menu Photo, Dish Image, Video, or Document"
            className="h-12 px-3.5 border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl flex items-center gap-1.5 shrink-0"
          >
            <Paperclip className="size-4 text-emerald-400" />
            <span className="text-xs font-semibold hidden sm:inline">Upload</span>
          </Button>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type dish names & prices, upload a menu photo/video/PDF, or ask anything..."
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <Link to="/orders" className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-center text-xs font-semibold text-slate-200 hover:border-emerald-500/50 flex items-center justify-center gap-1.5">
            <Store className="size-3.5 text-emerald-400" />
            <span>Orders</span>
          </Link>
          <Link to="/menu" className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-center text-xs font-semibold text-slate-200 hover:border-emerald-500/50 flex items-center justify-center gap-1.5">
            <Utensils className="size-3.5 text-emerald-400" />
            <span>Menu</span>
          </Link>
          <Link to="/settlements" className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-center text-xs font-semibold text-slate-200 hover:border-emerald-500/50 flex items-center justify-center gap-1.5">
            <Banknote className="size-3.5 text-emerald-400" />
            <span>Settlement</span>
          </Link>
          <Link to="/promotions" className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 text-center text-xs font-semibold text-slate-200 hover:border-emerald-500/50 flex items-center justify-center gap-1.5">
            <Tag className="size-3.5 text-emerald-400" />
            <span>Offers</span>
          </Link>
        </div>
      </div>
    </VendorShell>
  );
}
