import { createFileRoute } from "@tanstack/react-router";
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
  type TicketCategory,
  type TicketPriority,
  type PartnerTicketView,
} from "@/lib/server/api-support";
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
    <VendorShell title="Help Center & Support Desk" dataLabel={vendor.dataLabel}>
      {/* Metrics Header */}
      <Card className="border-line bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <LifeBuoy className="size-5 text-amber-500" />
              <h1 className="text-base font-bold text-ink">
                Partner Help Center &amp; Support Tickets
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              Official dispute arbitration, payout reconciliations, and autonomous AI first-response for {ticketsQuery.data?.restaurantName || "your restaurant"}.
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center gap-1.5"
          >
            <Plus className="size-4" />
            Raise Support Ticket
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs font-mono">
          <div className="rounded-lg border border-line bg-surface-2/40 p-2.5">
            <div className="text-[10px] uppercase text-muted">Total Tickets</div>
            <div className="text-sm font-bold text-ink mt-0.5">{tickets.length}</div>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
            <div className="text-[10px] uppercase text-amber-400">Open / Under Review</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5">{openCount}</div>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5">
            <div className="text-[10px] uppercase text-emerald-400">AI Resolved</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">{resolvedCount}</div>
          </div>
          <div className="rounded-lg border border-chili/30 bg-chili/5 p-2.5">
            <div className="text-[10px] uppercase text-chili">Admin Escalations</div>
            <div className="text-sm font-bold text-chili mt-0.5">{escalatedCount}</div>
          </div>
        </div>
      </Card>

      {banner ? (
        <div className="flex items-center justify-between rounded-lg border border-leaf/40 bg-leaf-soft px-3 py-2 text-xs font-semibold text-leaf">
          <span>{banner}</span>
          <button type="button" onClick={() => setBanner(null)} className="underline text-[11px]">
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
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
                activeCategoryFilter === "ALL"
                  ? "border-amber-500 bg-amber-500/15 text-amber-300 font-bold"
                  : "border-line bg-surface text-muted hover:text-ink"
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
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition ${
                    activeCategoryFilter === c.id
                      ? "border-amber-500 bg-amber-500/15 text-amber-300 font-bold"
                      : "border-line bg-surface text-muted hover:text-ink"
                  }`}
                >
                  {c.icon} {c.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredTickets.length === 0 ? (
              <Card className="p-8 text-center border-line bg-surface">
                <CheckCircle2 className="size-8 mx-auto text-emerald-400 opacity-60" />
                <h3 className="mt-2 text-xs font-bold text-ink">Zero Active Disputes</h3>
                <p className="mt-0.5 text-[11px] text-muted">
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
                    className={`w-full text-left rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-amber-500 bg-amber-500/10 shadow-sm"
                        : "border-line bg-surface hover:bg-surface-2"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-[10px] font-bold text-muted">
                        #{t.ticketNumber}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold font-mono ${
                          t.status === "RESOLVED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : t.status === "ESCALATED_TO_ADMIN"
                              ? "bg-chili-soft text-chili font-extrabold animate-pulse"
                              : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="mt-1 font-semibold text-xs text-ink truncate">
                      {t.subject}
                    </div>

                    <p className="mt-0.5 text-[11px] text-muted line-clamp-2">
                      {t.description}
                    </p>

                    <div className="mt-2 flex items-center justify-between text-[10px] text-muted font-mono pt-1 border-t border-line/40">
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
            <Card className="border-line bg-surface p-4 flex flex-col h-full min-h-[500px]">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">
                      #{selectedTicket.ticketNumber}
                    </span>
                    <span className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-mono text-muted">
                      {selectedTicket.category.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold font-mono ${
                        selectedTicket.status === "RESOLVED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : selectedTicket.status === "ESCALATED_TO_ADMIN"
                            ? "bg-chili-soft text-chili"
                            : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>
                  <h2 className="mt-1 text-sm font-bold text-ink">{selectedTicket.subject}</h2>
                  {selectedTicket.orderId && (
                    <span className="text-[11px] font-mono text-muted">
                      Related Order: #{selectedTicket.orderId}
                    </span>
                  )}
                </div>

                {selectedTicket.status !== "RESOLVED" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void handleResolve(selectedTicket.id)}
                    className="text-xs"
                  >
                    Mark Resolved
                  </Button>
                )}
              </div>

              {/* Status Banner */}
              {selectedTicket.status === "ESCALATED_TO_ADMIN" && (
                <div className="mt-3 rounded-lg border border-chili/40 bg-chili-soft p-2.5 text-xs text-chili flex items-start gap-2">
                  <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Escalated to Human Platform Administration: </span>
                    Assigned to Hasan (Founder &amp; Platform Admin) at merchant.care@orderking.in. Priority SLA SLA active.
                  </div>
                </div>
              )}

              {selectedTicket.status === "RESOLVED" && (
                <div className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-xs text-emerald-300 flex items-center gap-2">
                  <ShieldCheck className="size-4 shrink-0" />
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
                            ? "bg-amber-500 font-medium text-black"
                            : isAi
                              ? "border border-sky-500/30 bg-sky-950/20 text-slate-200"
                              : "border border-purple-500/30 bg-purple-950/20 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-1 pb-1 border-b border-black/10 dark:border-white/10 font-mono">
                          <span className="font-bold">
                            {isAi ? "🤖 King AI First-Responder" : m.authorName}
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
              <div className="border-t border-line pt-3 flex gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendReply(selectedTicket.id);
                    }
                  }}
                  placeholder="Type your response to support..."
                  className="text-xs flex-1"
                />
                <Button
                  size="sm"
                  variant="primary"
                  disabled={!replyText.trim() || replying}
                  onClick={() => void handleSendReply(selectedTicket.id)}
                  className="bg-amber-500 text-black font-bold"
                >
                  <Send className="size-3.5 mr-1" />
                  {replying ? "Sending..." : "Reply"}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-12 text-center border-line bg-surface flex flex-col items-center justify-center min-h-[500px]">
              <LifeBuoy className="size-10 text-muted opacity-40 mb-2" />
              <h3 className="text-sm font-bold text-ink">Select a Ticket to View Thread</h3>
              <p className="text-xs text-muted max-w-sm mt-1">
                Choose an active ticket on the left or raise a new ticket to resolve payouts, transit spills, or menu adjustments.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-line bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <LifeBuoy className="size-5 text-amber-500" />
                <h2 className="text-sm font-bold text-ink">Raise New Support Ticket</h2>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="text-muted hover:text-ink text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-ink block mb-1">Issue Category</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewCategory(c.id)}
                      className={`rounded-lg border p-2 text-left transition ${
                        newCategory === c.id
                          ? "border-amber-500 bg-amber-500/15 font-bold text-amber-300"
                          : "border-line bg-surface-2 text-muted hover:text-ink"
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
                  <label className="font-semibold text-ink block mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-ink"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-ink block mb-1">Related Order ID (Optional)</label>
                  <Input
                    value={newOrderId}
                    onChange={(e) => setNewOrderId(e.target.value)}
                    placeholder="e.g. ord_live_101"
                    className="text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink block mb-1">Subject</label>
                <Input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Summary of the issue (e.g. Food container spilled in transit)"
                  required
                  className="text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-ink block mb-1">Description &amp; Details</label>
                <Textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe the issue in detail. OrderKing Autonomous AI will immediately analyze database logs."
                  required
                  rows={4}
                  className="text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-line">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={creating}
                  className="bg-amber-500 text-black font-bold"
                >
                  {creating ? "Logging Ticket..." : "Submit Ticket"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </VendorShell>
  );
}
