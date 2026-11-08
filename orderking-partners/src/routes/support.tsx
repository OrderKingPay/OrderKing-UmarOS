import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { VendorShell } from "@/components/vendor-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { useVendor } from "@/components/use-vendor";
import {
  getPartnerTickets,
  createPartnerTicket,
  replyToPartnerTicket,
  resolvePartnerTicket,
  getStoreDiagnostics,
  type TicketCategory,
  type TicketPriority,
  type PartnerTicketView,
  type StoreDiagnosticsResult,
} from "@/lib/server/api-support";
import { quickThrottleKitchen } from "@/lib/server/api-orders";
import {
  LifeBuoy,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Sparkles,
  Paperclip,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
  UserCheck,
  Store,
  Activity,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/support")({ component: SupportPage });

const CATEGORIES: { id: TicketCategory; label: string; icon: string }[] = [
  { id: "PAYOUT_ISSUE", label: "Payout & Settlements", icon: "💳" },
  { id: "ORDER_DISPUTE", label: "Order & Transit Disputes", icon: "⚖️" },
  { id: "MENU_UPDATE_REQUEST", label: "Menu & Pricing Update", icon: "🍲" },
  { id: "HARDWARE_POS_SYNC", label: "Printers, KOT & POS Sync", icon: "🖨️" },
  { id: "FSSAI_COMPLIANCE", label: "FSSAI & Tax Compliance", icon: "📜" },
  { id: "OTHER", label: "General Support", icon: "❓" },
];

const PRIORITIES: { id: TicketPriority; label: string }[] = [
  { id: "LOW", label: "Low" },
  { id: "NORMAL", label: "Normal (Standard SLA)" },
  { id: "HIGH", label: "High (Urgent)" },
  { id: "CRITICAL", label: "Critical (Escalate to Admin)" },
];

function SupportPage() {
  const vendor = useVendor();
  const qc = useQueryClient();

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("ALL");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // New ticket form state
  const [newCategory, setNewCategory] = useState<TicketCategory>("ORDER_DISPUTE");
  const [newPriority, setNewPriority] = useState<TicketPriority>("NORMAL");
  const [newSubject, setNewSubject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newOrderId, setNewOrderId] = useState("");
  const [creating, setCreating] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const [diagnosticsOpen, setDiagnosticsOpen] = useState(true);
  const [resuming, setResuming] = useState(false);

  const diagQuery = useQuery({
    queryKey: ["store_diagnostics", vendor.restaurantId],
    queryFn: () => getStoreDiagnostics({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
    refetchInterval: 15000,
  });

  const diag = diagQuery.data;

  async function handleResumeStore() {
    if (!vendor.restaurantId || resuming) return;
    setResuming(true);
    try {
      await quickThrottleKitchen({ data: { restaurantId: vendor.restaurantId, mode: "RESUME" } });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["store_diagnostics", vendor.restaurantId] }),
        qc.invalidateQueries({ queryKey: ["dashboard", vendor.restaurantId] }),
        qc.invalidateQueries({ queryKey: ["bootstrap"] }),
      ]);
      setBanner("✅ Storefront successfully resumed Online. Live orders enabled.");
    } catch (err) {
      setBanner(`❌ Failed to resume store: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setResuming(false);
    }
  }

  const ticketsQuery = useQuery({
    queryKey: ["partner_tickets", vendor.restaurantId],
    queryFn: () => getPartnerTickets({ data: { restaurantId: vendor.restaurantId } }),
    enabled: Boolean(vendor.restaurantId),
    refetchInterval: 12000,
  });

  const tickets = ticketsQuery.data?.tickets ?? [];

  const filteredTickets = tickets.filter((t) => {
    if (activeCategoryFilter === "ALL") return true;
    return t.category === activeCategoryFilter;
  });

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) ?? filteredTickets[0] ?? null;

  const openCount = tickets.filter((t) => t.status === "OPEN" || t.status === "AI_INVESTIGATING").length;
  const resolvedCount = tickets.filter((t) => t.status === "RESOLVED").length;
  const escalatedCount = tickets.filter((t) => t.status === "ESCALATED_TO_ADMIN").length;

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim() || creating) return;

    setCreating(true);
    try {
      const res = await createPartnerTicket({
        data: {
          restaurantId: vendor.restaurantId,
          category: newCategory,
          priority: newPriority,
          subject: newSubject.trim(),
          description: newDescription.trim(),
          orderId: newOrderId.trim() || undefined,
        },
      });

      setCreateModalOpen(false);
      setNewSubject("");
      setNewDescription("");
      setNewOrderId("");
      setSelectedTicketId(res.ticketId);

      setBanner(
        res.status === "RESOLVED"
          ? `✅ Ticket #${res.ticketNumber} created and resolved by King AI Autonomous First-Responder.`
          : res.status === "ESCALATED_TO_ADMIN"
            ? `⚠️ Ticket #${res.ticketNumber} escalated with Priority SLA to Platform Admin (Hasan / merchant.care@orderking.in).`
            : `Ticket #${res.ticketNumber} logged. King AI diagnostic active.`
      );

      await qc.invalidateQueries({ queryKey: ["partner_tickets", vendor.restaurantId] });
    } catch (err) {
      setBanner(`❌ Error creating ticket: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleSendReply(ticketId: string) {
    if (!replyText.trim() || replying) return;
    setReplying(true);
    try {
      await replyToPartnerTicket({
        data: {
          restaurantId: vendor.restaurantId,
          ticketId,
          body: replyText.trim(),
        },
      });
      setReplyText("");
      await qc.invalidateQueries({ queryKey: ["partner_tickets", vendor.restaurantId] });
    } catch (err) {
      setBanner(`❌ Failed to send reply: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setReplying(false);
    }
  }

  async function handleResolve(ticketId: string) {
    try {
      await resolvePartnerTicket({
        data: {
          restaurantId: vendor.restaurantId,
          ticketId,
          note: "Merchant confirmed issue is resolved.",
        },
      });
      setBanner("Ticket marked as resolved.");
      await qc.invalidateQueries({ queryKey: ["partner_tickets", vendor.restaurantId] });
    } catch (err) {
      setBanner(`❌ Failed to resolve ticket: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return (
    <VendorShell title="Help Desk &amp; Issue Escalations" dataLabel={vendor.dataLabel}>
      {/* Metrics Header */}
      <Card className="border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <LifeBuoy className="size-5 text-[#E23744]" />
              <h1 className="text-base font-bold text-gray-900">
                Partner Help Desk &amp; Escalations
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              Submit tickets for payouts, order transit disputes, rider delays, or hardware support for {ticketsQuery.data?.restaurantName || "your restaurant"}.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold flex items-center gap-1.5 rounded-xl h-9 px-4 cursor-pointer"
          >
            <Plus className="size-4" />
            Raise Support Ticket
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs font-mono">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-2.5">
            <div className="text-[10px] uppercase text-gray-400 font-bold">Total Tickets</div>
            <div className="text-sm font-bold text-gray-900 mt-0.5">{tickets.length}</div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-2.5">
            <div className="text-[10px] uppercase text-amber-700 font-bold">Open / In Progress</div>
            <div className="text-sm font-bold text-amber-700 mt-0.5">{openCount}</div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-2.5">
            <div className="text-[10px] uppercase text-emerald-700 font-bold">Resolved</div>
            <div className="text-sm font-bold text-emerald-700 mt-0.5">{resolvedCount}</div>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-2.5">
            <div className="text-[10px] uppercase text-red-700 font-bold">Admin Escalated</div>
            <div className="text-sm font-bold text-red-700 mt-0.5">{escalatedCount}</div>
          </div>
        </div>
      </Card>

      {/* 1. Storefront Health & Order Diagnostics (Why am I not receiving orders?) */}
      <Card className="border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex size-8 items-center justify-center rounded-lg ${
                diag?.isOnline ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-[#E23744]"
              }`}
            >
              <Store className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">
                  Storefront Status &amp; Order Diagnostics
                </span>
                {diag && (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      diag.isOnline
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${diag.isOnline ? "bg-emerald-500" : "bg-rose-500"}`}
                    />
                    {diag.isEmergencyClosed ? "PAUSED" : diag.isOpenByHours ? "ONLINE" : "CLOSED SHIFT"}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Instant live diagnosis of storefront readiness, operating shifts, menu inventory, and delivery connectivity.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDiagnosticsOpen(!diagnosticsOpen)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900 cursor-pointer"
          >
            <span>{diagnosticsOpen ? "Hide" : "Show Check"}</span>
            {diagnosticsOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>

        {diagnosticsOpen && (
          <div className="mt-3.5 space-y-3 pt-3 border-t border-gray-100">
            {diagQuery.isLoading ? (
              <div className="text-xs text-gray-500 py-2">Running live storefront diagnostics...</div>
            ) : diag ? (
              <>
                {/* Status Alert Banner */}
                {diag.isEmergencyClosed ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 font-medium">
                    <div className="flex items-center gap-2">
                      <XCircle className="size-4 text-rose-600 shrink-0" />
                      <span>
                        <strong>Storefront is currently PAUSED.</strong> Live customer orders cannot be received until you resume.
                      </span>
                    </div>
                    <Button
                      size="sm"
                      disabled={resuming}
                      onClick={() => void handleResumeStore()}
                      className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold text-xs rounded-lg h-7 px-3 cursor-pointer"
                    >
                      {resuming ? "Resuming..." : "Resume Store Online"}
                    </Button>
                  </div>
                ) : !diag.isOpenByHours ? (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 font-medium">
                    <Clock className="size-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>Outside Operating Shift.</strong> Current time is {diag.currentTimeIst}. Today&apos;s shift: {diag.currentShiftLabel}. Orders resume during shift hours.
                    </span>
                  </div>
                ) : diag.totalItems === 0 ? (
                  <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 font-medium">
                    <span>
                      <strong>No Active Dishes.</strong> All items are inactive. Add dishes in the Menu section to start receiving orders.
                    </span>
                    <Link to="/menu" className="font-bold underline text-amber-900">
                      Go to Menu
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900 font-medium">
                    <CheckCircle className="size-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Storefront is Healthy and Online.</strong> Orders from nearby customers within your delivery radius in {diag.city} will ring directly on your Kitchen Desk.
                    </span>
                  </div>
                )}

                {/* 4 Checklist Cards */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-2.5">
                    <div className="text-[10px] uppercase font-bold text-gray-400">Store State</div>
                    <div
                      className={`mt-0.5 font-bold ${diag.isEmergencyClosed ? "text-rose-600" : "text-emerald-700"}`}
                    >
                      {diag.isEmergencyClosed ? "Paused (Emergency)" : "Online & Active"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-2.5">
                    <div className="text-[10px] uppercase font-bold text-gray-400">Operating Shift</div>
                    <div className="mt-0.5 font-bold text-gray-800 truncate" title={diag.currentShiftLabel}>
                      {diag.isOpenByHours ? "Active Shift" : "Shift Closed"} ({diag.currentShiftLabel})
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-2.5">
                    <div className="text-[10px] uppercase font-bold text-gray-400">Menu Inventory</div>
                    <div className="mt-0.5 font-bold text-gray-800">
                      {diag.totalItems} Active ({diag.outOfStockCount} Out of Stock)
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-2.5">
                    <div className="text-[10px] uppercase font-bold text-gray-400">FSSAI / KYC</div>
                    <div className="mt-0.5 font-bold text-gray-800 truncate">
                      {diag.fssaiNumber ? `Verified (${diag.fssaiNumber})` : "Pending Registration"}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-xs text-gray-500 py-1">Connect your restaurant outlet to view diagnostics.</div>
            )}
          </div>
        )}
      </Card>

      {/* Quick Action Navigation Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to="/reviews"
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-[#E23744] hover:text-[#E23744] transition shadow-xs"
        >
          <span>⚖️ Order Complaints &amp; Spillage Deductions</span>
          <ArrowRight className="size-3 text-gray-400" />
        </Link>
        <Link
          to="/settlements"
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-[#E23744] hover:text-[#E23744] transition shadow-xs"
        >
          <span>💳 Bank Settlements &amp; Daily Payout Ledger</span>
          <ArrowRight className="size-3 text-gray-400" />
        </Link>
        <Link
          to="/hours"
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-[#E23744] hover:text-[#E23744] transition shadow-xs"
        >
          <span>🕒 Kitchen Hours &amp; Shift Timings</span>
          <ArrowRight className="size-3 text-gray-400" />
        </Link>
      </div>

      {banner ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-900">
          <span>{banner}</span>
          <button type="button" onClick={() => setBanner(null)} className="underline text-[11px] cursor-pointer">
            Dismiss
          </button>
        </div>
      ) : null}

      {/* Main Grid: Ticket List + Selected Ticket Detail */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left Column: Tickets List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter("ALL")}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                activeCategoryFilter === "ALL"
                  ? "border-[#E23744] bg-red-50 text-[#E23744] font-bold"
                  : "border-gray-200 bg-white text-gray-600 hover:text-gray-900"
              }`}
            >
              All ({tickets.length})
            </button>
            {CATEGORIES.map((c) => {
              const count = tickets.filter((t) => t.category === c.id).length;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCategoryFilter(c.id)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                    activeCategoryFilter === c.id
                      ? "border-[#E23744] bg-red-50 text-[#E23744] font-bold"
                      : "border-gray-200 bg-white text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {c.icon} {c.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <Card className="p-8 text-center border-gray-200 bg-white rounded-2xl shadow-xs">
                <CheckCircle2 className="size-8 mx-auto text-emerald-500 opacity-80" />
                <h3 className="mt-2 text-xs font-bold text-gray-900">No Tickets</h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  No tickets found in this category. All systems operating normally.
                </p>
              </Card>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left rounded-2xl border p-3.5 transition cursor-pointer ${
                      isSelected
                        ? "border-[#E23744] bg-red-50/40 shadow-xs"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-bold text-gray-400">
                        #{t.ticketNumber}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold font-mono ${
                          t.status === "RESOLVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : t.status === "ESCALATED_TO_ADMIN"
                              ? "bg-red-50 text-[#E23744] border border-red-200 font-bold"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="mt-1 font-bold text-xs text-gray-900 truncate">
                      {t.subject}
                    </div>

                    <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-2">
                      {t.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1.5 border-t border-gray-100">
                      <span>{t.category.replace(/_/g, " ")}</span>
                      <span>{new Date(t.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Conversation Thread */}
        <div className="lg:col-span-7">
          {selectedTicket ? (
            <Card className="border-gray-200 bg-white p-4.5 rounded-2xl shadow-xs flex flex-col h-full min-h-[500px]">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#E23744]">
                      #{selectedTicket.ticketNumber}
                    </span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-mono text-gray-600 font-medium">
                      {selectedTicket.category.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold font-mono ${
                        selectedTicket.status === "RESOLVED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : selectedTicket.status === "ESCALATED_TO_ADMIN"
                            ? "bg-red-50 text-[#E23744] border border-red-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>
                  <h2 className="mt-1 text-sm font-bold text-gray-900">{selectedTicket.subject}</h2>
                  {selectedTicket.orderId && (
                    <span className="text-[11px] font-mono text-gray-500">
                      Related Order: #{selectedTicket.orderId}
                    </span>
                  )}
                </div>

                {selectedTicket.status !== "RESOLVED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleResolve(selectedTicket.id)}
                    className="text-xs rounded-xl border-gray-300"
                  >
                    Mark Resolved
                  </Button>
                )}
              </div>

              {/* Status Banner */}
              {selectedTicket.status === "ESCALATED_TO_ADMIN" && (
                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-900 flex items-start gap-2">
                  <ShieldAlert className="size-4 shrink-0 mt-0.5 text-[#E23744]" />
                  <div>
                    <span className="font-bold">Platform Merchant Care Escalation: </span>
                    Assigned with high-priority SLA (care@orderkingpay.com). Merchant care team reviewing logs.
                  </div>
                </div>
              )}

              {selectedTicket.status === "RESOLVED" && (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900 flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
                  <span>
                    Resolved under code <strong>{selectedTicket.resolutionCode || "MERCHANT_RESOLVED"}</strong> on{" "}
                    {selectedTicket.resolvedAt ? new Date(selectedTicket.resolvedAt).toLocaleString() : "today"}.
                  </span>
                </div>
              )}

              {/* Messages Thread */}
              <div className="flex-1 space-y-3 overflow-y-auto py-4">
                {selectedTicket.messages.map((m) => {
                  const isMerchant = m.authorType === "MERCHANT";
                  const isAi = m.authorType === "AI_ASSISTANT";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isMerchant ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          isMerchant
                            ? "bg-[#E23744] font-medium text-white shadow-xs"
                            : isAi
                              ? "border border-gray-200 bg-gray-50 text-gray-900"
                              : "border border-purple-200 bg-purple-50 text-purple-900"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-1 pb-1 border-b border-black/10 dark:border-white/10 font-mono">
                          <span className="font-bold">
                            {isAi ? "Platform Support Assistant" : m.authorName}
                          </span>
                          <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div className="whitespace-pre-wrap">{m.body}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input */}
              <div className="border-t border-gray-100 pt-3 flex gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendReply(selectedTicket.id);
                    }
                  }}
                  placeholder="Type your message to merchant support..."
                  className="text-xs flex-1 rounded-xl border-gray-300"
                />
                <Button
                  size="sm"
                  disabled={!replyText.trim() || replying}
                  onClick={() => void handleSendReply(selectedTicket.id)}
                  className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold rounded-xl px-4 cursor-pointer"
                >
                  <Send className="size-3.5 mr-1" />
                  {replying ? "Sending..." : "Reply"}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center border-gray-200 bg-white rounded-2xl shadow-xs flex flex-col items-center justify-center min-h-[500px]">
              <LifeBuoy className="size-10 text-gray-300 mb-2" />
              <h3 className="text-sm font-bold text-gray-900">Select a Ticket</h3>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                Choose a ticket from the left or raise a new ticket for payout disputes, transit spills, or menu adjustments.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="w-full max-w-lg border-gray-200 bg-white p-5 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <LifeBuoy className="size-5 text-[#E23744]" />
                <h2 className="text-sm font-bold text-gray-900">Raise Support Ticket</h2>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-gray-400 hover:text-gray-900 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Issue Category</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewCategory(c.id)}
                      className={`rounded-xl border p-2 text-left transition cursor-pointer ${
                        newCategory === c.id
                          ? "border-[#E23744] bg-red-50 font-bold text-[#E23744]"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="mr-1.5">{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 font-medium"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Related Order ID (Optional)</label>
                  <Input
                    value={newOrderId}
                    onChange={(e) => setNewOrderId(e.target.value)}
                    placeholder="e.g. ord_live_101"
                    className="text-xs rounded-xl border-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Subject</label>
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Summary of the issue (e.g. Transit spillage on order #1042)"
                  required
                  className="text-xs rounded-xl border-gray-300"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Description &amp; Details</label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  required
                  rows={4}
                  className="text-xs rounded-xl border-gray-300"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={creating}
                  className="bg-[#E23744] hover:bg-[#d32f2f] text-white font-bold rounded-xl px-5"
                >
                  {creating ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </VendorShell>
  );
}
