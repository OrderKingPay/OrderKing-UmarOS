import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  DollarSign,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Mail,
  MessageSquare,
  Plus,
  QrCode,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ClientLead } from "@/lib/ai/supreme-founder-ai-core";
import { getCuratedClientLeadsFn } from "@/lib/server/founder-actions";

export type CrmStage =
  | "LEAD"
  | "QUALIFIED"
  | "RESEARCH"
  | "OUTREACH"
  | "CONVERSATION"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "CONTRACT"
  | "INVOICE"
  | "PAYMENT"
  | "DELIVERY"
  | "REPEAT";

export const CRM_STAGES: Array<{ id: CrmStage; label: string; icon: string }> = [
  { id: "LEAD", label: "1. Lead Identified", icon: "🎯" },
  { id: "QUALIFIED", label: "2. Qualified", icon: "🔍" },
  { id: "RESEARCH", label: "3. Deep Research", icon: "📊" },
  { id: "OUTREACH", label: "4. Outreach Sent", icon: "📨" },
  { id: "CONVERSATION", label: "5. In Discussion", icon: "💬" },
  { id: "PROPOSAL", label: "6. Proposal Submitted", icon: "📄" },
  { id: "NEGOTIATION", label: "7. Negotiation", icon: "🤝" },
  { id: "CONTRACT", label: "8. Contract Signed", icon: "✍️" },
  { id: "INVOICE", label: "9. Invoice Emitted", icon: "🧾" },
  { id: "PAYMENT", label: "10. Advance Received", icon: "💰" },
  { id: "DELIVERY", label: "11. Project Delivered", icon: "🚀" },
  { id: "REPEAT", label: "12. Retainer / Repeat", icon: "👑" },
];

export interface FounderCrmHubProps {
  founderUpiVpa?: string;
  onSelectAction?: (action: string, payload: any) => void;
}

export function FounderCrmHub({
  founderUpiVpa = "orderking@okhdfcbank",
  onSelectAction,
}: FounderCrmHubProps) {
  const [leads, setLeads] = useState<
    Array<ClientLead & { crmStage: CrmStage; notes?: string; contactPerson?: string; email?: string }>
  >([]);
  const [selectedLead, setSelectedLead] = useState<(typeof leads)[0] | null>(null);

  useEffect(() => {
    getCuratedClientLeadsFn().then((data) => {
      setLeads(data.map((lead, idx) => ({
        ...lead,
        crmStage: idx === 0 ? "PROPOSAL" : idx === 1 ? "OUTREACH" : "LEAD",
        contactPerson: idx === 0 ? "Rajesh Singha (Owner)" : idx === 1 ? "Pranab Barman (MD)" : "Director of Ops",
        email: idx === 0 ? "rajesh@royaldarbar.in" : idx === 1 ? "pranab@assamteaexport.com" : "contact@enterprise.com",
        notes: "High interest in eliminating aggregator commissions.",
      })));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (leads.length > 0 && !selectedLead) {
      setSelectedLead(leads[0]);
    }
  }, [leads, selectedLead]);

  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);

  // New Lead Form State
  const [newBusinessName, setNewBusinessName] = useState("");
  const [newCategory, setNewCategory] = useState<ClientLead["category"]>("restaurant");
  const [newLocation, setNewLocation] = useState("");
  const [newBudget, setNewBudget] = useState(99999);
  const [newPainPoint, setNewPainPoint] = useState("");

  const filteredLeads = leads.filter((lead) => {
    const matchesCat = filterCategory === "ALL" || lead.category === filterCategory;
    const matchesSearch =
      lead.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalPipelineValue = leads.reduce((acc, curr) => acc + curr.projectBudget, 0);

  const handleAdvanceStage = (leadId: string) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          const currentIdx = CRM_STAGES.findIndex((s) => s.id === lead.crmStage);
          const nextIdx = Math.min(currentIdx + 1, CRM_STAGES.length - 1);
          const nextStage = CRM_STAGES[nextIdx]!.id;
          toast.success(`${lead.businessName} advanced to: ${CRM_STAGES[nextIdx]!.label}`);
          return { ...lead, crmStage: nextStage };
        }
        return lead;
      })
    );
    if (selectedLead && selectedLead.id === leadId) {
      const currentIdx = CRM_STAGES.findIndex((s) => s.id === selectedLead.crmStage);
      const nextIdx = Math.min(currentIdx + 1, CRM_STAGES.length - 1);
      setSelectedLead({ ...selectedLead, crmStage: CRM_STAGES[nextIdx]!.id });
    }
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessName.trim()) return;

    const newLead: (typeof leads)[0] = {
      id: `LEAD-${Date.now().toString().slice(-4)}`,
      businessName: newBusinessName,
      category: newCategory,
      location: newLocation || "India",
      monthlyRevenueEst: "₹5,00,000+",
      painPoint: newPainPoint || "High operational costs & manual processes.",
      projectBudget: Number(newBudget) || 50000,
      status: "IDENTIFIED",
      crmStage: "LEAD",
      suggestedSolution: "Turnkey OrderKing SaaS Suite & KingPay Integration.",
      potentialGmvGrowth: "+25% Net Margin",
      contactPerson: "Principal Owner",
      email: "inquiries@business.com",
      notes: "Newly identified qualified lead.",
    };

    setLeads((prev) => [newLead, ...prev]);
    setSelectedLead(newLead);
    setShowNewLeadModal(false);
    setNewBusinessName("");
    setNewLocation("");
    setNewPainPoint("");
    toast.success(`New prospect "${newBusinessName}" added to CRM pipeline!`);
  };

  return (
    <div className="flex flex-col h-full w-full bg-surface text-fg rounded-2xl border border-border overflow-hidden">
      {/* CRM Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/40 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Briefcase className="size-5 text-amber-500" />
            <h2 className="text-lg font-black tracking-tight">Client Acquisition Pipeline &amp; CRM</h2>
            <Badge tone="warn" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/30">
              Directive §8 &amp; §9
            </Badge>
          </div>
          <p className="text-xs text-muted">
            12-Stage Verifiable Pipeline · Total Active Value:{" "}
            <span className="font-bold text-fg">₹{totalPipelineValue.toLocaleString("en-IN")}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setShowNewLeadModal(true)}
            className="bg-primary text-white hover:bg-primary/90 text-xs font-bold"
          >
            <Plus className="size-3.5 mr-1" /> Add Prospect
          </Button>
        </div>
      </div>

      {/* Main CRM Workspace (Split: Left List, Right Detail) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Column: Leads Filter & List */}
        <div className="md:col-span-5 border-r border-border flex flex-col h-full bg-surface">
          {/* Search & Category Filter */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted" />
              <Input
                placeholder="Search prospects by name or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[11px]">
              {["ALL", "restaurant", "ecommerce", "enterprise", "fintech"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition shrink-0 ${
                    filterCategory === cat
                      ? "bg-primary text-white"
                      : "bg-surface-2 text-muted hover:text-fg border border-border"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Lead List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredLeads.map((lead) => {
              const isSelected = selectedLead?.id === lead.id;
              const stageObj = CRM_STAGES.find((s) => s.id === lead.crmStage) || CRM_STAGES[0]!;
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary shadow-xs"
                      : "bg-surface hover:bg-surface-2/60 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-bold text-xs text-fg leading-tight">{lead.businessName}</h4>
                    <span className="font-mono font-black text-xs text-emerald-600 dark:text-emerald-400 shrink-0">
                      ₹{lead.projectBudget.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted mb-2">
                    <span className="capitalize">{lead.category}</span>
                    <span>•</span>
                    <span>{lead.location}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 font-semibold text-fg border border-border">
                      <span>{stageObj.icon}</span>
                      <span>{stageObj.label}</span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdvanceStage(lead.id);
                      }}
                      className="text-primary hover:underline font-bold flex items-center gap-0.5"
                    >
                      Advance <ChevronRight className="size-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Prospect Dossier & Action Deck */}
        <div className="md:col-span-7 flex flex-col h-full overflow-y-auto bg-surface-2/20 p-4 space-y-4">
          {selectedLead ? (
            <>
              {/* Dossier Header */}
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-fg">{selectedLead.businessName}</h3>
                      <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                        {selectedLead.category.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted">
                      {selectedLead.location} · Estimated Monthly Rev: {selectedLead.monthlyRevenueEst}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase font-black tracking-wider text-muted">Project Value</p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      ₹{selectedLead.projectBudget.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                {/* 12-Stage Visual Progress Bar */}
                <div className="pt-2 border-t border-border space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-muted">Pipeline Progress:</span>
                    <span className="text-primary font-black">
                      {CRM_STAGES.find((s) => s.id === selectedLead.crmStage)?.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-1">
                    {CRM_STAGES.map((stg, i) => {
                      const curIdx = CRM_STAGES.findIndex((s) => s.id === selectedLead.crmStage);
                      const isDone = i <= curIdx;
                      return (
                        <div
                          key={stg.id}
                          title={stg.label}
                          className={`h-2 rounded-sm transition-all ${
                            isDone ? "bg-emerald-500 shadow-xs" : "bg-border"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Problem Analysis & Solution Architecture */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 space-y-1">
                  <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">
                    Client Pain Point
                  </span>
                  <p className="text-xs font-medium text-fg">{selectedLead.painPoint}</p>
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">
                    Tailored Solution &amp; ROI
                  </span>
                  <p className="text-xs font-medium text-fg">{selectedLead.suggestedSolution}</p>
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    Projected Impact: {selectedLead.potentialGmvGrowth}
                  </p>
                </div>
              </div>

              {/* Action Operations Deck */}
              <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-500" />
                  <span>Founder Action Deck (1-Tap Execution)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold justify-start"
                    onClick={() => {
                      const pitch = `Subject: Eliminating aggregator commissions for ${selectedLead.businessName}\n\nHi ${selectedLead.contactPerson},\n\nWe noticed you are currently losing significant margins to delivery platforms. We have deployed OrderKing White-Label which allows direct 0% commission ordering and 1-tap UPI payments.\n\nCould we schedule a 10-minute demo this week?\n\nBest regards,\nOrderKing Founder Operations`;
                      void navigator.clipboard?.writeText(pitch);
                      toast.success("Personalized outreach email copied to clipboard!");
                    }}
                  >
                    <Mail className="size-3.5 mr-1 text-primary" /> Copy Pitch Email
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold justify-start"
                    onClick={() => {
                      const proposal = `# Enterprise Proposal for ${selectedLead.businessName}\n\n**Scope:** ${selectedLead.suggestedSolution}\n**Total Investment:** ₹${selectedLead.projectBudget.toLocaleString("en-IN")}\n**Timeline:** 3 Weeks\n**Payment Terms:** 30% Advance, 40% Milestone 1, 30% Final Delivery.`;
                      void navigator.clipboard?.writeText(proposal);
                      toast.success("Formal proposal draft copied!");
                    }}
                  >
                    <FileText className="size-3.5 mr-1 text-blue-500" /> Draft Proposal
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold justify-start"
                    onClick={() => {
                      const invoiceId = `INV-${Date.now().toString().slice(-5)}`;
                      const upi = `upi://pay?pa=${founderUpiVpa}&pn=OrderKing&am=${selectedLead.projectBudget}&cu=INR&tn=Invoice ${invoiceId}`;
                      void navigator.clipboard?.writeText(upi);
                      toast.success(`Verifiable UPI Payment Link copied: ${upi}`);
                    }}
                  >
                    <QrCode className="size-3.5 mr-1 text-emerald-500" /> Generate Invoice
                  </Button>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted">
                    Contact: {selectedLead.contactPerson} ({selectedLead.email})
                  </span>

                  <Button
                    size="sm"
                    onClick={() => handleAdvanceStage(selectedLead.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Advance to Next Stage ➔
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted">
              Select a prospect from the left to view complete dossier and actions.
            </div>
          )}
        </div>
      </div>

      {/* New Lead Modal */}
      {showNewLeadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-bold text-sm text-fg">Add New Client Prospect</h3>
              <button
                type="button"
                onClick={() => setShowNewLeadModal(false)}
                className="text-muted hover:text-fg text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Business Name *</label>
                <Input
                  required
                  placeholder="e.g. Green Valley Organic Foods"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-lg border border-border bg-surface p-2 text-xs"
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="ecommerce">E-Commerce</option>
                    <option value="enterprise">Enterprise</option>
                    <option value="fintech">FinTech</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="logistics">Logistics</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Location</label>
                  <Input
                    placeholder="e.g. Guwahati / Silchar"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Estimated Project Budget (INR)</label>
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Key Pain Point</label>
                <Input
                  placeholder="e.g. Losing 28% to Swiggy/Zomato commissions"
                  value={newPainPoint}
                  onChange={(e) => setNewPainPoint(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewLeadModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="bg-primary text-white font-bold">
                  Save Prospect
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
