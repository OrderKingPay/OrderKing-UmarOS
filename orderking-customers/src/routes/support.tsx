
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CustomerShell } from "@/components/market/shell";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { createTicket, listTickets } from "@/lib/server/account";
import { listMyOrders } from "@/lib/server/orders";
import {
  diagnoseAndResolveOrder,
  askAiSupportAssistant,
  type AiChatMessage,
  type ResolutionResult,
  type SupportIssueType,
} from "@/lib/server/ai-support";
import { getReferralStats } from "@/lib/server/referrals";

export const Route = createFileRoute("/support")({ component: SupportPage });

const TOPICS = [
  "where",
  "issue",
  "missing",
  "wrong",
  "payment",
  "cancel",
  "refund",
  "restaurant",
  "delivery",
  "other",
] as const;

export function SupportPage() {
  const { t } = useT();
  const { user, isPending } = useCurrentUserState();
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>("issue");
  const [message, setMessage] = useState("");

  // Instant AI Assistant & Order Diagnostics State
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [issueType, setIssueType] = useState<SupportIssueType>("where_order");
  const [issueDetails, setIssueDetails] = useState("");
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [resolution, setResolution] = useState<ResolutionResult | null>(null);

  // 24x7 Conversational AI Chat Assistant State
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [chatMessages, setChatMessages] = useState<AiChatMessage[]>([
    {
      role: "assistant",
      content: "Hello! I am your OrderKing 24x7 Intelligent Assistant. How can I help you today? You can ask about your order tracking, ₹50 late delivery compensation, 0% interest KingPay Later, LPG cylinder bookings, refunds, or official regulatory ombudsman contacts.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const tickets = useQuery({
    queryKey: ["tickets"],
    queryFn: () => listTickets(),
    enabled: Boolean(user),
  });

  const orders = useQuery({
    queryKey: ["myOrdersSupport"],
    queryFn: () => listMyOrders(),
    enabled: Boolean(user),
  });

  const referralStats = useQuery({
    queryKey: ["referralStats"],
    queryFn: () => getReferralStats(),
    enabled: Boolean(user),
  });

  if (isPending) {
    return (
      <CustomerShell>
        <div className="p-6">{t("common.loading")}</div>
      </CustomerShell>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const recentOrders = orders.data?.orders ?? [];

  const handleSendChat = async (textToSend?: string) => {
    const q = (textToSend ?? chatInput).trim();
    if (!q || isChatting) return;
    const userMsg: AiChatMessage = {
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsChatting(true);
    try {
      const res = await askAiSupportAssistant({
        data: {
          query: q,
          orderId: selectedOrderId || recentOrders[0]?.id,
        },
      });
      const botMsg: AiChatMessage = {
        role: "assistant",
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        links: res.links,
        actionChip: res.actionChip,
      };
      setChatMessages((prev) => [...prev, botMsg]);
    } catch {
      toast.error("AI assistant is momentarily busy. Please try again.");
    } finally {
      setIsChatting(false);
    }
  };

  const triggerQuickResolve = async (specificType: SupportIssueType) => {
    const targetOrderId = selectedOrderId || recentOrders[0]?.id;
    if (!targetOrderId) {
      toast.error("Please select an order to resolve.");
      return;
    }
    setIsDiagnosing(true);
    setResolution(null);
    try {
      const res = await diagnoseAndResolveOrder({
        data: {
          orderId: targetOrderId,
          issueType: specificType,
          details: issueDetails.trim() || undefined,
        },
      });
      setResolution(res);
      toast.success("Resolution processed!");
      void tickets.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve issue");
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleInstantResolve = async () => {
    await triggerQuickResolve(issueType);
  };

  return (
    <CustomerShell>
      <div className="px-4 py-5 space-y-6">
        <div>
          <h1 className="font-display text-3xl">{t("support.title")}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t("support.hint")}</p>
        </div>

        {/* 24x7 Conversational AI Support Assistant */}
        <div className="rounded-[var(--radius-2xl)] border-2 border-primary/40 bg-gradient-to-br from-primary/20 via-surface to-primary/10 p-6 shadow-[0_0_25px_rgba(var(--primary-rgb),0.15)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/20 text-xl">
                🤖
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    24x7 Live
                  </span>
                  <span className="text-[10px] text-zinc-400">Zero Wait Time</span>
                </div>
                <h2 className="font-display text-lg font-bold text-white">
                  OrderKing Intelligent AI Assistant
                </h2>
              </div>
            </div>
            <span className="text-xs text-zinc-400">Instant Q&A & Policy Bot</span>
          </div>

          {/* Chat Messages Log */}
          <div className="mt-5 max-h-80 overflow-y-auto space-y-4 rounded-2xl border border-white/10/80 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]/90 p-4 text-sm no-scrollbar shadow-inner">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-2xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-xs"
                      : "bg-white/5 border border-white/10 text-white rounded-bl-xs"
                  }`}
                >
                  <p>{msg.content}</p>

                  {/* Action Chip from Bot */}
                  {msg.actionChip && (
                    <div className="mt-2.5 pt-2 border-t border-white/10/40">
                      <Button
                        size="sm"
                        variant="primary"
                        className="text-xs h-7 px-3 font-semibold"
                        onClick={() => {
                          setIssueType(msg.actionChip!.issueType);
                          void triggerQuickResolve(msg.actionChip!.issueType);
                        }}
                      >
                        {msg.actionChip.label}
                      </Button>
                    </div>
                  )}

                  {/* Suggested Links from Bot */}
                  {msg.links && msg.links.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/10/40 flex flex-wrap gap-1.5">
                      {msg.links.map((link, lIdx) => (
                        <a
                          key={lIdx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/10 px-2 py-1.5 text-[10px] font-medium text-primary hover:underline"
                        >
                          <span>{link.title}</span>
                          {link.phone && <span className="text-zinc-400">({link.phone})</span>}
                          <span>↗</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <span className="mt-1 text-[9px] text-zinc-400 px-1">{msg.timestamp}</span>
              </div>
            ))}
            {isChatting && (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="flex size-2 rounded-full bg-primary animate-ping" />
                <span>OrderKing Assistant is thinking...</span>
              </div>
            )}
          </div>

          {/* Quick Inquiry Chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleSendChat("Where is my order and how does the ₹50 delay credit work?")}
              className="rounded-full border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-3 py-1.5 text-xs font-medium hover:border-primary/50 transition"
            >
              ⚡ ₹50 Late Guarantee
            </button>
            <button
              type="button"
              onClick={() => void handleSendChat("What is KingPay Later and how is it 0% interest?")}
              className="rounded-full border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-3 py-1.5 text-xs font-medium hover:border-primary/50 transition"
            >
              💳 KingPay Later (0% Interest)
            </button>
            <button
              type="button"
              onClick={() => void handleSendChat("How to track Indane or HP LPG gas cylinder booking?")}
              className="rounded-full border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-3 py-1.5 text-xs font-medium hover:border-primary/50 transition"
            >
              🔥 LPG Cylinder Booking
            </button>
            <button
              type="button"
              onClick={() => void handleSendChat("How do I cancel my order and get an instant refund?")}
              className="rounded-full border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-3 py-1.5 text-xs font-medium hover:border-primary/50 transition"
            >
              🛑 Cancellation & Refunds
            </button>
            <button
              type="button"
              onClick={() => void handleSendChat("How to report food hygiene to FSSAI?")}
              className="rounded-full border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-3 py-1.5 text-xs font-medium hover:border-primary/50 transition"
            >
              🥗 Food Hygiene & FSSAI
            </button>
            <button
              type="button"
              onClick={() => void handleSendChat("Show me official government ombudsman links for dispute escalation.")}
              className="rounded-full border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-3 py-1.5 text-xs font-medium hover:border-primary/50 transition"
            >
              🏛️ Govt Ombudsman Links
            </button>
            <button
              type="button"
              onClick={() => void handleSendChat("Where is my order? How much time will it take?")}
              className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition"
            >
              ⚡ Where is my order?
            </button>
            <button
              type="button"
              onClick={() => void handleSendChat("I want to speak with executive support regarding my delivery.")}
              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 transition"
            >
              🎧 Talk to Support Executive
            </button>
          </div>

          {/* WhatsApp Automated 24x7 Support Banner */}
          <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <div>
                <p className="font-bold text-emerald-900 dark:text-emerald-200">Prefer WhatsApp Support?</p>
                <p className="text-xs text-zinc-400">Chat 24x7 with OrderKing AI Assistant on WhatsApp (Zero wait time)</p>
              </div>
            </div>
            <a
              href="https://wa.me/919223166166?text=Hi%20OrderKing%20Support%20I%20need%20help%20with%20my%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] transition"
            >
              Open WhatsApp ↗
            </a>
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendChat();
            }}
            className="mt-3 flex gap-2"
          >
            <input
              type="text"
              className="w-full rounded-[var(--radius-md)] border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-3 py-2 text-xs"
              placeholder="Ask anything about orders, KingPay, recharges, refunds, or ombudsman..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isChatting}
            />
            <Button size="sm" type="submit" disabled={isChatting || !chatInput.trim()}>
              Send
            </Button>
          </form>
        </div>

        {/* Instant Support & Order Diagnostics (Zomato-Style) */}
        <div className="rounded-[var(--radius-2xl)] border-2 border-white/10 bg-gradient-to-b from-surface to-surface/50 p-6 shadow-md backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-success animate-pulse" />
            <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold text-primary">
              AI Support Bot
            </span>
            <h2 className="font-display text-xl font-black tracking-tight text-white">Instant 1-Click Resolution</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Automated instant resolution for delays, missing items, cancellations, and delivery disputes.
          </p>

          {/* 1-Tap Quick Action Diagnostics Chips (Zomato-Style) */}
          {recentOrders.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDiagnosing}
                className="text-xs h-8 px-3"
                onClick={() => {
                  setIssueType("where_order");
                  void triggerQuickResolve("where_order");
                }}
              >
                ⚡ Where is my food?
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDiagnosing}
                className="text-xs h-8 px-3 text-danger border-danger/40"
                onClick={() => {
                  setIssueType("cancel_order");
                  void triggerQuickResolve("cancel_order");
                }}
              >
                🛑 Cancel order
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDiagnosing}
                className="text-xs h-8 px-3"
                onClick={() => {
                  setIssueType("missing_item");
                  void triggerQuickResolve("missing_item");
                }}
              >
                🍜 Missing item
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDiagnosing}
                className="text-xs h-8 px-3"
                onClick={() => {
                  setIssueType("food_spilled");
                  void triggerQuickResolve("food_spilled");
                }}
              >
                🥣 Spilled / Damaged
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDiagnosing}
                className="text-xs h-8 px-3"
                onClick={() => {
                  setIssueType("payment_issue");
                  void triggerQuickResolve("payment_issue");
                }}
              >
                💳 Refund status
              </Button>
            </div>
          ) : null}

          {recentOrders.length > 0 ? (
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-zinc-400">Select Recent Order</label>
                <select
                  className="mt-1 min-h-11 w-full rounded-[var(--radius-md)] border border-white/10 bg-white/5 px-3 text-sm"
                  value={selectedOrderId || recentOrders[0]?.id}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                >
                  {recentOrders.slice(0, 5).map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.publicId} · {o.restaurantName} ({o.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">What issue are you facing?</label>
                <select
                  className="mt-1 min-h-11 w-full rounded-[var(--radius-md)] border border-white/10 bg-white/5 px-3 text-sm"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as SupportIssueType)}
                >
                  <option value="where_order">Where is my order? (Check live ETA & delay)</option>
                  <option value="cancel_order">Cancel this order</option>
                  <option value="missing_item">Missing items in my delivery</option>
                  <option value="food_spilled">Food spilled or damaged package</option>
                  <option value="food_cold">Food arrived cold or poor quality</option>
                  <option value="payment_issue">Payment or charge dispute</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400">Additional Details (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Missing 1 extra naan, or rider arrived late"
                  className="mt-1 h-10 w-full rounded-[var(--radius-md)] border border-white/10 bg-white/5 px-3 text-sm"
                  value={issueDetails}
                  onChange={(e) => setIssueDetails(e.target.value)}
                />
              </div>

              <Button
                onClick={handleInstantResolve}
                disabled={isDiagnosing}
                className="w-full sm:w-auto"
              >
                {isDiagnosing ? "Diagnosing order..." : "⚡ Get Instant Resolution"}
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-zinc-400">
              No recent orders found. You can submit a general support inquiry below.
            </p>
          )}

          {/* Resolution Result Banner */}
          {resolution ? (
            <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-primary">{resolution.title}</span>
                <span className="rounded bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                  {resolution.actionTaken}
                </span>
              </div>
              <p className="mt-2 text-sm text-white leading-relaxed">{resolution.explanation}</p>
              {resolution.compensationPaise ? (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-success/15 px-3 py-1.5.5 text-xs font-semibold text-success">
                  🎁 ₹{Math.round(resolution.compensationPaise / 100)} credited to your loyalty rewards!
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Official Statutory Grievance & Government Ombudsman Hub */}
        <div className="rounded-[var(--radius-2xl)] border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-surface to-surface p-6 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/5 text-lg">
                🏛️
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-white">
                  Official Statutory Grievance & Government Ombudsman
                </h2>
                <p className="text-xs text-zinc-400">
                  Direct legal escalation under Consumer Protection Rules, RBI Directives & FSSAI Guidelines
                </p>
              </div>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-0.5 text-[10px] font-bold uppercase text-zinc-400">
              Zero Headache · 100% Legal
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* National Consumer Helpline */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-white/5 transition-all p-4 shadow-sm hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">National Consumer Helpline (NCH)</span>
                  <span className="text-xs">⚖️</span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  Department of Consumer Affairs, Govt. of India. Direct consumer grievance resolution.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10/50 text-xs">
                <a href="tel:1915" className="font-bold text-primary hover:underline">
                  📞 Toll-Free 1915
                </a>
                <a
                  href="https://consumerhelpline.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-zinc-400 hover:text-white"
                >
                  Portal ↗
                </a>
              </div>
            </div>

            {/* RBI Banking Ombudsman */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-white/5 transition-all p-4 shadow-sm hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">RBI Banking Ombudsman (CMS)</span>
                  <span className="text-xs">🏦</span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  Reserve Bank of India Complaint Management System for digital wallet & UPI payment disputes.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10/50 text-xs">
                <span className="text-zinc-400">Direct Escalation</span>
                <a
                  href="https://cms.rbi.org.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-primary hover:underline"
                >
                  File Complaint ↗
                </a>
              </div>
            </div>

            {/* National Cyber Crime Reporting */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-white/5 transition-all p-4 shadow-sm hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Cyber Crime Reporting (MHA)</span>
                  <span className="text-xs">🛡️</span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  Ministry of Home Affairs. For financial cyber fraud, unauthorized debits, and phishing.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10/50 text-xs">
                <a href="tel:1930" className="font-bold text-danger hover:underline">
                  🚨 Helpline 1930
                </a>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-zinc-400 hover:text-white"
                >
                  Report Portal ↗
                </a>
              </div>
            </div>

            {/* FSSAI National Food Safety */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-white/5 transition-all p-4 shadow-sm hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">FSSAI Food Safety (FoSCoS)</span>
                  <span className="text-xs">🥗</span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  Food Safety and Standards Authority of India. Official restaurant hygiene and quality grievances.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10/50 text-xs">
                <span className="text-zinc-400">Food Hygiene</span>
                <a
                  href="https://foscos.fssai.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-primary hover:underline"
                >
                  FSSAI Portal ↗
                </a>
              </div>
            </div>

            {/* NPCI UPI Dispute Redressal */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-white/5 transition-all p-4 shadow-sm hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">NPCI UPI Dispute Redressal</span>
                  <span className="text-xs">⚡</span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  National Payments Corporation of India. Instant dispute resolution for UPI transfers and BBPS.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10/50 text-xs">
                <span className="text-zinc-400">UPI & BBPS</span>
                <a
                  href="https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-primary hover:underline"
                >
                  NPCI Portal ↗
                </a>
              </div>
            </div>

            {/* OrderKing Grievance Officer */}
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] hover:bg-white/5 transition-all p-4 shadow-sm hover:shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Statutory Grievance Officer</span>
                  <span className="text-xs">📜</span>
                </div>
                <p className="mt-1 text-xs text-zinc-400">
                  OrderKing Foods Pvt Ltd · Designated Grievance Redressal Officer under IT & E-Commerce Rules.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/10/50 text-xs">
                <span className="text-zinc-400">SLA: 48 Hours</span>
                <a
                  href="mailto:grievance@orderking.in"
                  className="font-bold text-primary hover:underline"
                >
                  grievance@orderking.in ↗
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 🚨 MANDATORY CUSTOMER RECRUITMENT MODULE (NON-NEGOTIABLE GROWTH) */}
        <div className="rounded-[24px] border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-surface to-black p-6 shadow-xl relative overflow-hidden mt-8">
          <div className="absolute top-0 right-0 p-2">
            <span className="flex size-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-3 rounded-full bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <span className="text-2xl">💸</span>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-emerald-300">
                EARN ₹100 CASH FOR EVERY FRIEND
              </h3>
              <p className="text-xs text-zinc-300 mt-1">
                You must share your VIP referral link on WhatsApp, Facebook, and Instagram. When they order, ₹100 is instantly credited to your bank account via UPI.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-emerald-500/30 bg-black/40 p-3.5 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-200">
                {referralStats.data?.shareUrl ?? "Loading..."}
              </span>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-7 px-3 text-[10px]"
                onClick={() => {
                  if (referralStats.data?.shareUrl) {
                    navigator.clipboard.writeText(referralStats.data.shareUrl);
                    toast.success("✅ VIP Link Copied! Share it everywhere now!");
                  }
                }}
              >
                COPY VIP LINK
              </Button>
            </div>

            <Button
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black py-4 rounded-xl shadow-lg border border-emerald-400/30 text-sm tracking-wide flex items-center justify-center gap-2"
              onClick={() => {
                if (referralStats.data?.shareUrl) {
                  const text = encodeURIComponent("Use my VIP link to get ₹50 off your first OrderKing food delivery! 🍔💸");
                  const url = encodeURIComponent(referralStats.data.shareUrl);
                  window.open(`https://wa.me/?text=${text}%20${url}`, "_blank");
                }
              }}
            >
              <span>📲</span> SHARE IMMEDIATELY ON WHATSAPP
            </Button>
          </div>
        </div>

        {/* Standard Manual Ticket Submission */}
        <div className="mt-8">
          <h2 className="font-display text-xl">Submit Support Ticket</h2>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void createTicket({ data: { topic, message } })
                .then(() => {
                  setMessage("");
                  toast.success(t("support.sent"));
                  void tickets.refetch();
                })
                .catch((err: Error) => toast.error(err.message));
            }}
          >
            <label className="block text-sm">
              {t("support.topic")}
              <select
                className="mt-1 min-h-11 w-full rounded-[var(--radius-md)] border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-3"
                value={topic}
                onChange={(e) => setTopic(e.target.value as (typeof TOPICS)[number])}
              >
                {TOPICS.map((key) => (
                  <option key={key} value={key}>
                    {t(`support.topics.${key}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              {t("support.message")}
              <textarea
                className="mt-1 min-h-24 w-full rounded-[var(--radius-md)] border border-white/10 bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-3 text-sm"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question or feedback..."
                required
              />
            </label>
            <Button type="submit" variant="secondary">
              {t("support.send")}
            </Button>
          </form>
        </div>

        {/* Existing Tickets List */}
        <h2 className="mt-8 font-display text-xl">{t("support.tickets")}</h2>
        <ul className="mt-3 space-y-2">
          {(tickets.data?.tickets ?? []).length === 0 ? (
            <li className="rounded-[var(--radius-lg)] bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-4 text-xs text-zinc-400">
              No tickets recorded yet.
            </li>
          ) : (
            (tickets.data?.tickets ?? []).map((tk) => (
              <li key={tk.id} className="rounded-[var(--radius-lg)] bg-[#0a0a0a]/80 backdrop-blur-2xl border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-3 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-xs uppercase tracking-wide text-primary">{tk.topic}</p>
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] uppercase text-zinc-400">
                    {tk.status}
                  </span>
                </div>
                <p className="mt-1 text-white">{tk.message}</p>
                <p className="mt-1 text-xs text-zinc-400">{new Date(tk.createdAt).toLocaleString()}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </CustomerShell>
  );
}
