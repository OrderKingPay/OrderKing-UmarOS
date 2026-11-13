import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Store,
  Percent,
  Save,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Layers,
  Send,
  Search,
  CheckSquare,
  Filter,
  DollarSign,
  Receipt,
  UserPlus,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loadOutletCommissionsFn,
  updateOutletCommissionFn,
} from "@/lib/orderking/actions";
import {
  calculateMultiUnitRoi,
  type RoiSimulationParams,
  type RoiSimulationResult,
} from "@/lib/orderking/b2b-sales-deck-engine";
import {
  crmEngine,
  CRM_STAGE_ORDER,
  SELLABLE_ORDERKING_SERVICES,
  type CrmLead,
  type CrmStage,
  type CommercialRevenueBreakdown,
} from "@/lib/orderking/crm/pipeline-engine";

export type B2BViewMode = "merchants" | "onboarding" | "crm" | "economics";

export function B2BSaaSSalesDeckGenerator() {
  const qc = useQueryClient();
  const [viewMode, setViewMode] = useState<B2BViewMode>("merchants");

  // Merchant search & editing
  const [merchantSearch, setMerchantSearch] = useState("");
  const [editingComm, setEditingComm] = useState<Record<string, number>>({});

  // Query live merchant outlets from PostgreSQL
  const outletsQ = useQuery({
    queryKey: ["outlet-commissions"],
    queryFn: () => loadOutletCommissionsFn(),
  });

  const outlets = (outletsQ.data && outletsQ.data.ok ? outletsQ.data.data : []) as Array<{
    id: string;
    name: string;
    cuisine: string;
    address: string;
    status: string;
    rating: number;
    commissionBps: number;
    commissionPct: number;
    weeklyGmvPaise: number;
    weeklyCommissionPaise: number;
  }>;

  const updateCommMutation = useMutation({
    mutationFn: (vars: { restaurantId: string; commissionBps: number }) =>
      updateOutletCommissionFn({
        data: {
          restaurantId: vars.restaurantId,
          commissionBps: vars.commissionBps,
          reason: "Founder updated merchant take-rate in B2B Hub",
        },
      }),
    onSuccess: (res) => {
      if (res && res.ok) {
        toast.success(`Updated commission to ${res.commissionPct}%`);
        void qc.invalidateQueries({ queryKey: ["outlet-commissions"] });
      } else {
        toast.error("Failed to update commission");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Error saving commission");
    },
  });

  // Unit Economics Calculator State
  const [roiParams, setRoiParams] = useState<RoiSimulationParams>({
    unitsCount: 10,
    dailyOrdersPerUnit: 80,
    avgTicketValue: 350,
    aggregatorFeePct: 28,
    orderkingCostPct: 8,
    currency: "INR",
    implementationCost: 25000,
    monthlySaaSFeePerUnit: 2999,
  });

  const roiResult: RoiSimulationResult = calculateMultiUnitRoi(roiParams);

  // Live CRM State
  const [crmLeads, setCrmLeads] = useState<CrmLead[]>(() => crmEngine.getLeads());
  const [revenueBreakdown, setRevenueBreakdown] = useState<CommercialRevenueBreakdown>(() =>
    crmEngine.getCommercialRevenueBreakdown()
  );
  const [stageFilter, setStageFilter] = useState<CrmStage | "ALL">("ALL");
  const [paymentInputs, setPaymentInputs] = useState<Record<string, { amountInr: string; utr: string }>>({});

  // Lead Intake Form State
  const [newLeadForm, setNewLeadForm] = useState<{
    businessName: string;
    category: CrmLead["category"];
    contactPerson: string;
    phone: string;
    email: string;
    location: string;
    monthlyRevenueEst: string;
    painPoint: string;
    selectedServiceId: string;
    dealValueInr: number;
    directDeliveryCostInr: number;
    source: "INBOUND" | "REFERRAL" | "MANUAL_ENTRY" | "AI_DISCOVERY";
    contactPermissionConfirmed: boolean;
  }>({
    businessName: "",
    category: "restaurant",
    contactPerson: "",
    phone: "",
    email: "",
    location: "",
    monthlyRevenueEst: "₹10,00,000",
    painPoint: "Direct ordering and lower delivery take-rates",
    selectedServiceId: SELLABLE_ORDERKING_SERVICES[0].id,
    dealValueInr: SELLABLE_ORDERKING_SERVICES[0].setupFeeInr,
    directDeliveryCostInr: SELLABLE_ORDERKING_SERVICES[0].estimatedDirectDeliveryCostInr,
    source: "MANUAL_ENTRY",
    contactPermissionConfirmed: true,
  });

  const syncCrmState = () => {
    setCrmLeads([...crmEngine.getLeads()]);
    setRevenueBreakdown(crmEngine.getCommercialRevenueBreakdown());
  };

  const handleCreateVerifiedLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadForm.businessName.trim() || !newLeadForm.contactPerson.trim()) {
      toast.error("Business Name and Contact Person are required.");
      return;
    }
    if (!newLeadForm.phone.trim() && !newLeadForm.email.trim()) {
      toast.error("Provide a valid phone or email.");
      return;
    }

    const svc = SELLABLE_ORDERKING_SERVICES.find((s) => s.id === newLeadForm.selectedServiceId);

    try {
      const created = crmEngine.addLead({
        businessName: newLeadForm.businessName.trim(),
        category: newLeadForm.category,
        contactPerson: newLeadForm.contactPerson.trim(),
        phone: newLeadForm.phone.trim(),
        email: newLeadForm.email.trim(),
        location: newLeadForm.location.trim() || "Assam, India",
        monthlyRevenueEst: newLeadForm.monthlyRevenueEst.trim() || "₹5,00,000",
        painPoint: newLeadForm.painPoint.trim(),
        dealValueInr: Math.max(0, Number(newLeadForm.dealValueInr || 0)),
        advanceLockedInr: Math.round(Math.max(0, Number(newLeadForm.dealValueInr || 0)) * 0.5),
        currentStage: "LEAD",
        source: newLeadForm.source,
        notes: [`Matched Service: ${svc ? svc.name : "Core Platform Suite"}`],
        nextFollowUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        dataProvenance: "VERIFIED_CRM_RECORD",
        contactPermissionConfirmed: true,
        verifiedCollectedInr: 0,
        invoicedInr: 0,
        refundsInr: 0,
        directDeliveryCostInr: Math.max(0, Number(newLeadForm.directDeliveryCostInr || 0)),
        selectedServiceId: svc?.id,
        selectedServiceName: svc?.name,
      });

      syncCrmState();
      setNewLeadForm((prev) => ({
        ...prev,
        businessName: "",
        contactPerson: "",
        phone: "",
        email: "",
        location: "",
      }));
      toast.success(`Merchant lead created: ${created.businessName}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add lead");
    }
  };

  const handleAdvanceStage = (lead: CrmLead, targetStage?: CrmStage) => {
    const currentIdx = CRM_STAGE_ORDER.indexOf(lead.currentStage);
    const nextStage =
      targetStage || CRM_STAGE_ORDER[Math.min(CRM_STAGE_ORDER.length - 1, currentIdx + 1)];
    if (nextStage === lead.currentStage) return;

    try {
      crmEngine.updateLeadStage(
        lead.id,
        nextStage,
        `Stage updated from ${lead.currentStage} to ${nextStage}`
      );
      syncCrmState();
      toast.success(`Updated ${lead.businessName} to ${nextStage}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Stage update failed");
    }
  };

  const handleRecordPayment = (lead: CrmLead) => {
    const input = paymentInputs[lead.id] || { amountInr: "", utr: "" };
    const amount = Number(input.amountInr);
    if (!amount || amount <= 0 || !input.utr.trim()) {
      toast.error("Valid amount and UTR number are required.");
      return;
    }
    try {
      crmEngine.recordVerifiedPayment(lead.id, amount, input.utr.trim(), lead.directDeliveryCostInr);
      syncCrmState();
      setPaymentInputs((prev) => ({
        ...prev,
        [lead.id]: { amountInr: "", utr: "" },
      }));
      toast.success(`Payment of ₹${amount.toLocaleString("en-IN")} recorded with UTR ${input.utr}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment record failed");
    }
  };

  const filteredOutlets = outlets.filter((o) => {
    if (!merchantSearch.trim()) return true;
    const q = merchantSearch.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      o.cuisine.toLowerCase().includes(q) ||
      o.address.toLowerCase().includes(q)
    );
  });

  const filteredLeads = crmLeads.filter((l) => {
    if (stageFilter === "ALL") return true;
    return l.currentStage === stageFilter;
  });

  return (
    <div className="w-full space-y-6 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-6 text-slate-100 shadow-xl font-sans">
      {/* 1. Header Bar: Clean Operational Controls */}
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Building2 className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                B2B Merchant Operations Hub
              </h1>
              <Badge className="border-emerald-500/40 bg-emerald-950/40 text-emerald-300 font-mono text-[10px]">
                PostgreSQL Live
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              Merchant contracts | Take-rate commissions | Direct onboarding | Ledger entries
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            type="button"
            onClick={() => setViewMode("merchants")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "merchants"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Store className="size-3.5" />
            <span>Merchants ({outlets.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("onboarding")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "onboarding"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="size-3.5" />
            <span>New Partner</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("crm")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "crm"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Receipt className="size-3.5" />
            <span>Deals & CRM ({crmLeads.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("economics")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "economics"
                ? "bg-emerald-500 text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Calculator className="size-3.5" />
            <span>Unit Economics</span>
          </button>
        </div>
      </div>

      {/* 2. MODE: MERCHANTS DIRECTORY & COMMISSION CONTROLS */}
      {viewMode === "merchants" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
              <Input
                value={merchantSearch}
                onChange={(e) => setMerchantSearch(e.target.value)}
                placeholder="Search merchant, cuisine or city..."
                className="pl-9 h-9 text-xs bg-slate-900 border-slate-800 text-white placeholder:text-slate-500"
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void qc.invalidateQueries({ queryKey: ["outlet-commissions"] })}
              className="border-slate-800 bg-slate-900 text-xs text-slate-300 hover:text-white"
            >
              <RefreshCw className="size-3.5 mr-1.5" />
              Refresh from Database
            </Button>
          </div>

          {outletsQ.isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading merchant network...</div>
          ) : filteredOutlets.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-xs text-slate-400">
              No registered merchants match your filter. Onboard a restaurant partner to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredOutlets.map((outlet) => {
                const currentVal =
                  editingComm[outlet.id] !== undefined
                    ? editingComm[outlet.id]
                    : outlet.commissionPct;
                const isDirty = editingComm[outlet.id] !== undefined && editingComm[outlet.id] !== outlet.commissionPct;

                return (
                  <div
                    key={outlet.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition-colors hover:border-slate-700"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{outlet.name}</span>
                        <Badge
                          className={`text-[10px] ${
                            outlet.status === "ACTIVE"
                              ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                              : "bg-orange-950/60 text-orange-300 border-orange-500/40"
                          }`}
                        >
                          {outlet.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        {outlet.cuisine || "Multi-Cuisine"} | {outlet.address || "Local Outlet"}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500">
                        ID: {outlet.id}
                      </p>
                    </div>

                    {/* Commission Take-Rate Slider & Save */}
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Take-Rate:</span>
                        <div className="flex items-center gap-1 rounded-lg bg-slate-950 border border-slate-800 px-2 py-1">
                          <input
                            type="number"
                            min="0"
                            max="35"
                            step="0.5"
                            value={currentVal}
                            onChange={(e) =>
                              setEditingComm((prev) => ({
                                ...prev,
                                [outlet.id]: Number(e.target.value),
                              }))
                            }
                            className="w-12 bg-transparent text-right font-mono text-xs font-bold text-emerald-400 focus:outline-none"
                          />
                          <span className="text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        disabled={!isDirty || updateCommMutation.isPending}
                        onClick={() =>
                          updateCommMutation.mutate({
                            restaurantId: outlet.id,
                            commissionBps: Math.round(currentVal * 100),
                          })
                        }
                        className="h-8 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                      >
                        <Save className="size-3.5 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. MODE: DIRECT PARTNER ONBOARDING FORM */}
      {viewMode === "onboarding" && (
        <div className="max-w-2xl mx-auto rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="size-4 text-emerald-400" />
              Onboard Restaurant Partner
            </h2>
            <p className="text-xs text-slate-400">
              Direct self-serve or admin onboarding with real database record creation.
            </p>
          </div>

          <form onSubmit={handleCreateVerifiedLead} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Business / Kitchen Name</label>
                <Input
                  required
                  value={newLeadForm.businessName}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, businessName: e.target.value })}
                  placeholder="Restaurant or franchise business name"
                  className="h-9 text-xs bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Contact Person / Owner</label>
                <Input
                  required
                  value={newLeadForm.contactPerson}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, contactPerson: e.target.value })}
                  placeholder="Owner / Manager name"
                  className="h-9 text-xs bg-slate-950 border-slate-800 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">10-Digit Mobile Number</label>
                <Input
                  required
                  type="tel"
                  maxLength={10}
                  value={newLeadForm.phone}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                  className="h-9 text-xs bg-slate-950 border-slate-800 text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Location / City</label>
                <Input
                  value={newLeadForm.location}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, location: e.target.value })}
                  placeholder="e.g. Station Road, Karimganj, Assam"
                  className="h-9 text-xs bg-slate-950 border-slate-800 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Operating Package / Plan</label>
              <select
                value={newLeadForm.selectedServiceId}
                onChange={(e) => {
                  const svc = SELLABLE_ORDERKING_SERVICES.find((s) => s.id === e.target.value);
                  setNewLeadForm({
                    ...newLeadForm,
                    selectedServiceId: e.target.value,
                    dealValueInr: svc ? svc.setupFeeInr : 0,
                    directDeliveryCostInr: svc ? svc.estimatedDirectDeliveryCostInr : 0,
                  });
                }}
                className="w-full h-9 rounded-md bg-slate-950 border border-slate-800 px-3 text-xs text-white focus:outline-none"
              >
                {SELLABLE_ORDERKING_SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — ₹{s.setupFeeInr.toLocaleString("en-IN")} setup
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              className="w-full h-9 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
            >
              <Plus className="size-3.5 mr-1.5" />
              Register Partner in CRM & Operations Desk
            </Button>
          </form>
        </div>
      )}

      {/* 4. MODE: REVENUE & CRM DEALS */}
      {viewMode === "crm" && (
        <div className="space-y-5">
          {/* Top Revenue Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
              <span className="text-[10px] text-slate-400 uppercase">Pipeline Value</span>
              <p className="text-base font-black text-white mt-1">
                ₹{revenueBreakdown.leadPipelineValueInr.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
              <span className="text-[10px] text-slate-400 uppercase">Cash Collected</span>
              <p className="text-base font-black text-emerald-400 mt-1">
                ₹{revenueBreakdown.verifiedMoneyCollectedInr.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
              <span className="text-[10px] text-slate-400 uppercase">Net Realized Margin</span>
              <p className="text-base font-black text-cyan-400 mt-1">
                ₹{revenueBreakdown.netProfitInr.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
              <span className="text-[10px] text-slate-400 uppercase">Verified Leads</span>
              <p className="text-base font-black text-orange-400 mt-1">
                {revenueBreakdown.verifiedLeadsCount}
              </p>
            </div>
          </div>

          {/* Stage Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Filter by Stage:</span>
            {(["ALL", ...CRM_STAGE_ORDER] as const).map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setStageFilter(stage)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                  stageFilter === stage
                    ? "bg-slate-200 text-slate-950"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {stage}
              </button>
            ))}
          </div>

          {/* Deals Table */}
          {filteredLeads.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-400">
              No leads currently in this stage.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{lead.businessName}</span>
                        <Badge className="bg-slate-800 text-slate-300 border-slate-700 text-[10px]">
                          {lead.currentStage}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        {lead.contactPerson} | {lead.phone} | {lead.location}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        ₹{lead.dealValueInr.toLocaleString("en-IN")}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAdvanceStage(lead)}
                        className="h-7 text-[11px] border-slate-700 bg-slate-800 text-slate-200 hover:text-white"
                      >
                        Advance Stage
                      </Button>
                    </div>
                  </div>

                  {/* Payment Record Inline */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-2.5 text-xs">
                    <span className="text-slate-400">Record Payment:</span>
                    <Input
                      type="number"
                      placeholder="Amount ₹"
                      value={paymentInputs[lead.id]?.amountInr || ""}
                      onChange={(e) =>
                        setPaymentInputs((prev) => ({
                          ...prev,
                          [lead.id]: {
                            amountInr: e.target.value,
                            utr: prev[lead.id]?.utr || "",
                          },
                        }))
                      }
                      className="w-28 h-7 text-xs bg-slate-950 border-slate-800 text-white"
                    />
                    <Input
                      placeholder="Bank UTR Number"
                      value={paymentInputs[lead.id]?.utr || ""}
                      onChange={(e) =>
                        setPaymentInputs((prev) => ({
                          ...prev,
                          [lead.id]: {
                            amountInr: prev[lead.id]?.amountInr || "",
                            utr: e.target.value,
                          },
                        }))
                      }
                      className="w-36 h-7 text-xs bg-slate-950 border-slate-800 text-white font-mono"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleRecordPayment(lead)}
                      className="h-7 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                    >
                      Record UTR
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. MODE: PURE UNIT ECONOMICS CALCULATOR */}
      {viewMode === "economics" && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator className="size-4 text-emerald-400" />
              Multi-Outlet Unit Economics Model
            </h2>
            <p className="text-xs text-slate-400">
              Verified financial calculation based on store count, order volume, and take-rate margin.
            </p>
          </div>

          {/* Calculator Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Number of Outlets</label>
              <Input
                type="number"
                min="1"
                value={roiParams.unitsCount}
                onChange={(e) =>
                  setRoiParams({ ...roiParams, unitsCount: Math.max(1, Number(e.target.value)) })
                }
                className="h-8 text-xs bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Daily Orders / Store</label>
              <Input
                type="number"
                min="1"
                value={roiParams.dailyOrdersPerUnit}
                onChange={(e) =>
                  setRoiParams({
                    ...roiParams,
                    dailyOrdersPerUnit: Math.max(1, Number(e.target.value)),
                  })
                }
                className="h-8 text-xs bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Average Ticket Value (₹)</label>
              <Input
                type="number"
                min="50"
                value={roiParams.avgTicketValue}
                onChange={(e) =>
                  setRoiParams({
                    ...roiParams,
                    avgTicketValue: Math.max(50, Number(e.target.value)),
                  })
                }
                className="h-8 text-xs bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Aggregator Take-Rate (%)</label>
              <Input
                type="number"
                min="1"
                max="40"
                value={roiParams.aggregatorFeePct}
                onChange={(e) =>
                  setRoiParams({ ...roiParams, aggregatorFeePct: Number(e.target.value) })
                }
                className="h-8 text-xs bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">OrderKing Take-Rate (%)</label>
              <Input
                type="number"
                min="1"
                max="40"
                value={roiParams.orderkingCostPct}
                onChange={(e) =>
                  setRoiParams({ ...roiParams, orderkingCostPct: Number(e.target.value) })
                }
                className="h-8 text-xs bg-slate-950 border-slate-800 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400">Monthly SaaS Fee / Store (₹)</label>
              <Input
                type="number"
                min="0"
                value={roiParams.monthlySaaSFeePerUnit ?? 0}
                onChange={(e) =>
                  setRoiParams({ ...roiParams, monthlySaaSFeePerUnit: Number(e.target.value) })
                }
                className="h-8 text-xs bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </div>

          {/* Results Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] text-slate-400 uppercase">Annual GMV</span>
              <p className="text-lg font-black text-white mt-1">
                ₹{Math.round(roiResult.annualGmv).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] text-slate-400 uppercase">Aggregator Deductions</span>
              <p className="text-lg font-black text-rose-400 mt-1">
                ₹{Math.round(roiResult.annualAggregatorFees).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <span className="text-[10px] text-slate-400 uppercase">OrderKing Direct Cost</span>
              <p className="text-lg font-black text-cyan-400 mt-1">
                ₹{Math.round(roiResult.annualOrderKingCost).toLocaleString("en-IN")}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
              <span className="text-[10px] text-emerald-400 uppercase font-bold">Annual Savings</span>
              <p className="text-lg font-black text-emerald-300 mt-1">
                ₹{Math.round(roiResult.annualNetProfitReclaimed).toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
