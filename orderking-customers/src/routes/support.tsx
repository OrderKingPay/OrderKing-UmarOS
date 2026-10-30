
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
      content: "Hello! I'm here to help you right away with your food orders, missing or wrong items, instant refunds, UPI & utility bill payments, or travel bookings. Tell me what you need and I'll take care of it.",
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

  if (isPending) {
    return (
      <CustomerShell>
        <div className="p-6">{t("common.loading")}</div>
      </CustomerShell>
    );
  }

  const recentOrders = orders.data?.orders ?? [];

  const handleSendChat = async (textToSend?: string) => {
    /* Guest & signed-in customers both supported immediately */
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
      toast.error("AI assistant is momentarily busy. ");
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
      toast.success(res.title);
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
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-b from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFEB] px-4 py-5 pb-28 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-black text-stone-900 tracking-tight">
              {t("support.title")}
            </h1>
            <p className="mt-0.5 text-xs font-bold text-amber-800">
              24x7 Intelligent AI Concierge &amp; Statutory Grievance Redressal
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-xs font-black text-emerald-800 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            Live 24x7 Active
          </span>
        </div>

        {/* 24x7 Conversational AI Support Assistant */}
        <div className="rounded-3xl border-2 border-amber-400/80 bg-gradient-to-br from-white via-amber-50/40 to-yellow-50/20 p-5 sm:p-6 shadow-[0_12px_40px_rgba(245,158,11,0.12)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 text-stone-950 shadow-md shadow-amber-400/30 text-xl">
                🤖
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.2 text-[10px] font-black text-emerald-700">
                    AI Concierge
                  </span>
                  <span className="text-[10px] text-stone-500">Autonomous Assistance</span>
                </div>
                <h2 className="font-display text-lg font-black text-stone-900">
                  OrderKing Intelligent AI Support
                </h2>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg">
              Instant Guidance
            </span>
          </div>

          {/* Chat Messages Log */}
          <div className="mt-4 max-h-80 overflow-y-auto space-y-3 rounded-2xl border border-amber-200/80 bg-white/95 backdrop-blur-md p-4 text-xs shadow-inner no-scrollbar">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-2xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-medium rounded-br-xs shadow-md shadow-orange-500/20"
                      : "bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 text-amber-50 border border-amber-400/40 font-medium rounded-bl-xs shadow-md"
                  }`}
                >
                  <p>{msg.content}</p>

                  {/* Action Chip from Bot */}
                  {msg.actionChip && (
                    <div className="mt-2.5 pt-2 border-t border-white/10">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs h-7 px-3 rounded-lg shadow-xs"
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
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                      {msg.links.map((link, lIdx) => (
                        <a
                          key={lIdx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 border border-amber-400/40 px-2 py-1 text-[10px] font-bold text-amber-200 hover:text-white"
                        >
                          <span>{link.title}</span>
                          {link.phone && <span className="text-amber-300">({link.phone})</span>}
                          <span>↗</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <span className="mt-1 text-[9px] text-stone-400 px-1 font-mono">{msg.timestamp}</span>
              </div>
            ))}
            {isChatting && (
              <div className="flex items-center gap-2 text-xs text-amber-800 font-bold">
                <span className="flex size-2 rounded-full bg-amber-500 animate-ping" />
                <span>OrderKing Assistant is synthesizing answer...</span>
              </div>
            )}
          </div>

          {/* Quick Inquiry Chips */}
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {[
              "Where is my order? ⚡",
              "Which King Pay services are active? 💳",
              "LPG Cylinder Booking 🔥",
              "Cancellation & Refunds 🛑",
              "Food Hygiene & FSSAI 🥗",
              "Govt Ombudsman Links 🏛️",
              "Record a support request 📝",
            ].map((promptText) => (
              <button
                key={promptText}
                type="button"
                onClick={() => void handleSendChat(promptText)}
                className="rounded-full border border-amber-300/80 bg-amber-50/80 hover:bg-amber-100 text-amber-950 font-bold px-3 py-1.5 text-xs shadow-2xs transition-all active:scale-95"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendChat();
            }}
            className="mt-3.5 flex gap-2"
          >
            <input
              type="text"
              className="w-full rounded-2xl border border-amber-300/80 bg-white px-3.5 py-2.5 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-500 shadow-2xs"
              placeholder="Ask anything about orders, KingPay, refunds, or ombudsman..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={isChatting || !user}
            />
            <Button
              size="sm"
              type="submit"
              disabled={isChatting || !user || !chatInput.trim()}
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black px-5 rounded-2xl shadow-md shadow-orange-500/25 active:scale-95 transition-all text-xs h-10"
            >
              Send ➔
            </Button>
          </form>
        </div>

        {/* Instant Support & Order Diagnostics */}
        <div className="rounded-3xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2">
            <span className="flex size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2.5 py-0.5 text-xs font-black text-amber-950">
              Order Diagnostics Bot
            </span>
            <h2 className="font-display text-lg font-black text-stone-900">Order Status &amp; Resolution</h2>
          </div>
          <p className="mt-1 text-xs text-stone-600 leading-relaxed font-medium">
            Check recorded status or save a formal inquiry for review. Refunds and cancellations require confirmation.
          </p>

          {/* Quick Action Diagnostics Chips */}
          {recentOrders.length > 0 ? (
            <div className="mt-3.5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDiagnosing}
                className="text-xs h-9 px-3 rounded-xl border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-950 font-bold"
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
                className="text-xs h-9 px-3 rounded-xl border-rose-300 bg-rose-50 text-rose-700 font-bold hover:bg-rose-100"
                onClick={() => {
                  setIssueType("cancel_order");
                  void triggerQuickResolve("cancel_order");
                }}
              >
                Request cancellation
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDiagnosing}
                className="text-xs h-9 px-3 rounded-xl border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-950 font-bold"
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
                className="text-xs h-9 px-3 rounded-xl border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-950 font-bold"
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
                className="text-xs h-9 px-3 rounded-xl border-amber-200 bg-amber-50/50 hover:bg-amber-100 text-amber-950 font-bold"
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
                <label className="block text-xs font-bold text-stone-700">Select Recent Order</label>
                <select
                  className="mt-1 min-h-11 w-full rounded-2xl border border-amber-200 bg-amber-50/30 px-3 text-xs font-medium text-stone-900"
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
                <label className="block text-xs font-bold text-stone-700">What issue are you facing?</label>
                <select
                  className="mt-1 min-h-11 w-full rounded-2xl border border-amber-200 bg-amber-50/30 px-3 text-xs font-medium text-stone-900"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as SupportIssueType)}
                >
                  <option value="where_order">Where is my order? (Recorded status)</option>
                  <option value="cancel_order">Request cancellation</option>
                  <option value="missing_item">Missing items in my delivery</option>
                  <option value="food_spilled">Food spilled or damaged package</option>
                  <option value="food_cold">Food arrived cold or poor quality</option>
                  <option value="payment_issue">Payment or charge dispute</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700">Additional Details (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Missing 1 extra naan, or rider arrived late"
                  className="mt-1 h-11 w-full rounded-2xl border border-amber-200 bg-amber-50/30 px-3 text-xs font-medium text-stone-900"
                  value={issueDetails}
                  onChange={(e) => setIssueDetails(e.target.value)}
                />
              </div>

              <Button
                onClick={handleInstantResolve}
                disabled={isDiagnosing}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-orange-500/25 active:scale-95 transition-all text-xs"
              >
                {isDiagnosing ? "Diagnosing order..." : "Check Status or Record Request ➔"}
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-xs text-stone-500">
              No recent orders found. You can submit a general support inquiry below.
            </p>
          )}

          {/* Resolution Result Banner */}
          {resolution ? (
            <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-amber-950">{resolution.title}</span>
                <span className="rounded-lg bg-amber-200/80 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-900">
                  {resolution.actionTaken}
                </span>
              </div>
              <p className="mt-2 text-xs text-stone-700 leading-relaxed font-medium">{resolution.explanation}</p>
            </div>
          ) : null}
        </div>

        {/* Official Statutory Grievance & Government Ombudsman Hub */}
        <div className="rounded-3xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-stone-950 shadow-xs text-lg">
                🏛️
              </div>
              <div>
                <h2 className="font-display text-base font-black text-stone-900">
                  Official Statutory Grievance &amp; Government Ombudsman
                </h2>
                <p className="text-xs text-stone-500">
                  Direct official escalation portals and national statutory toll-free helplines
                </p>
              </div>
            </div>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[10px] font-black uppercase text-amber-900">
              Official Portals
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* National Consumer Helpline */}
            <div className="rounded-2xl border border-amber-900/10 bg-amber-50/30 p-4 flex flex-col justify-between hover:border-amber-300 transition-all shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900">National Consumer Helpline (NCH)</span>
                  <span className="text-xs">⚖️</span>
                </div>
                <p className="mt-1 text-xs text-stone-600">
                  Dept of Consumer Affairs, Govt of India. Direct consumer grievance resolution.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-amber-900/10 text-xs">
                <a href="tel:1915" className="font-black text-amber-800 hover:underline">
                  📞 Toll-Free 1915
                </a>
                <a
                  href="https://consumerhelpline.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-stone-500 hover:text-stone-900"
                >
                  Portal ↗
                </a>
              </div>
            </div>

            {/* RBI Banking Ombudsman */}
            <div className="rounded-2xl border border-amber-900/10 bg-amber-50/30 p-4 flex flex-col justify-between hover:border-amber-300 transition-all shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900">RBI Banking Ombudsman (CMS)</span>
                  <span className="text-xs">🏦</span>
                </div>
                <p className="mt-1 text-xs text-stone-600">
                  Reserve Bank of India Complaint Management System for digital wallet &amp; UPI payment disputes.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-amber-900/10 text-xs">
                <span className="text-stone-400 text-[11px]">Eligibility applies</span>
                <a
                  href="https://cms.rbi.org.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black text-amber-800 hover:underline"
                >
                  File Complaint ↗
                </a>
              </div>
            </div>

            {/* National Cyber Crime Reporting */}
            <div className="rounded-2xl border border-amber-900/10 bg-amber-50/30 p-4 flex flex-col justify-between hover:border-amber-300 transition-all shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900">Cyber Crime Reporting (MHA)</span>
                  <span className="text-xs">🛡️</span>
                </div>
                <p className="mt-1 text-xs text-stone-600">
                  Ministry of Home Affairs. For financial cyber fraud, unauthorized debits, and phishing.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-amber-900/10 text-xs">
                <a href="tel:1930" className="font-black text-rose-700 hover:underline">
                  🚨 Helpline 1930
                </a>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-stone-500 hover:text-stone-900"
                >
                  Report Portal ↗
                </a>
              </div>
            </div>

            {/* FSSAI National Food Safety */}
            <div className="rounded-2xl border border-amber-900/10 bg-amber-50/30 p-4 flex flex-col justify-between hover:border-amber-300 transition-all shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900">FSSAI Food Safety (FoSCoS)</span>
                  <span className="text-xs">🥗</span>
                </div>
                <p className="mt-1 text-xs text-stone-600">
                  Food Safety &amp; Standards Authority of India. Official restaurant hygiene grievances.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-amber-900/10 text-xs">
                <span className="text-stone-400 text-[11px]">Food Hygiene</span>
                <a
                  href="https://foscos.fssai.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black text-amber-800 hover:underline"
                >
                  FSSAI Portal ↗
                </a>
              </div>
            </div>

            {/* NPCI UPI Dispute Redressal */}
            <div className="rounded-2xl border border-amber-900/10 bg-amber-50/30 p-4 flex flex-col justify-between hover:border-amber-300 transition-all shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900">NPCI UPI Dispute Redressal</span>
                  <span className="text-xs">⚡</span>
                </div>
                <p className="mt-1 text-xs text-stone-600">
                  National Payments Corporation of India. Information about UPI dispute mechanisms.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-amber-900/10 text-xs">
                <span className="text-stone-400 text-[11px]">UPI &amp; BBPS</span>
                <a
                  href="https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black text-amber-800 hover:underline"
                >
                  NPCI Portal ↗
                </a>
              </div>
            </div>

            {/* OrderKing Grievance Officer */}
            <div className="rounded-2xl border border-amber-900/10 bg-amber-50/30 p-4 flex flex-col justify-between hover:border-amber-300 transition-all shadow-2xs">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900">OrderKing Grievance Officer</span>
                  <span className="text-xs">📜</span>
                </div>
                <p className="mt-1 text-xs text-stone-600">
                  Direct statutory customer redressal under Consumer Protection (E-Commerce) Rules, 2020.
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between pt-2 border-t border-amber-900/10 text-xs">
                <span className="text-stone-400 text-[11px]">Founder Cell</span>
                <a
                  href="#support-request"
                  className="font-black text-amber-800 hover:underline"
                >
                  Support Form ↓
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Standard Manual Ticket Submission */}
        <div id="support-request" className="rounded-3xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 pb-2 border-b border-amber-900/10">
            <span className="text-amber-600 text-sm">📝</span>
            <h2 className="font-display text-lg font-black text-stone-900">Submit Formal Support Ticket</h2>
          </div>
          <form
            className="mt-4 space-y-3.5"
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
            <label className="block text-xs font-bold text-stone-700">
              {t("support.topic")}
              <select
                className="mt-1 min-h-11 w-full rounded-2xl border border-amber-200 bg-amber-50/30 px-3 text-xs font-medium text-stone-900"
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
            <label className="block text-xs font-bold text-stone-700">
              {t("support.message")}
              <textarea
                className="mt-1 min-h-24 w-full rounded-2xl border border-amber-200 bg-amber-50/30 p-3 text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-amber-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your question or feedback in detail..."
                required
              />
            </label>
            <Button
              type="submit"
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black py-3 px-7 rounded-2xl shadow-lg shadow-orange-500/25 active:scale-95 transition-all text-xs"
            >
              {t("support.send")} ➔
            </Button>
          </form>
        </div>

        {/* Existing Tickets List */}
        <div className="space-y-3">
          <h2 className="font-display text-lg font-black text-stone-900">{t("support.tickets")}</h2>
          <ul className="space-y-2.5">
            {(tickets.data?.tickets ?? []).length === 0 ? (
              <li className="rounded-2xl border border-amber-200/60 bg-amber-50/30 p-4 text-xs font-medium text-stone-500 text-center">
                No tickets recorded yet.
              </li>
            ) : (
              (tickets.data?.tickets ?? []).map((tk) => (
                <li
                  key={tk.id}
                  className="rounded-2xl border border-amber-900/10 bg-white/95 backdrop-blur-md p-4 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-black text-xs uppercase tracking-wide text-amber-800">{tk.topic}</p>
                    <span className="rounded-md bg-amber-100/80 px-2.5 py-0.5 text-[10px] font-black uppercase text-amber-900">
                      {tk.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-stone-900 font-medium text-xs">{tk.message}</p>
                  <p className="mt-1 text-[10px] text-stone-400 font-mono">{new Date(tk.createdAt).toLocaleString()}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </CustomerShell>
  );
}

