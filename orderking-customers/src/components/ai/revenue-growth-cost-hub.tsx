import { useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  CreditCard,
  DollarSign,
  FileCheck,
  FileText,
  Flame,
  Globe,
  PiggyBank,
  QrCode,
  Receipt,
  RefreshCw,
  Repeat,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  buildCustomizedApplication,
  type ApplicationDraft,
} from "@/lib/ai/application-engine";
import {
  INITIAL_CLIENT_INVOICES,
  verifyAndProcessWebhook,
  type ClientInvoiceRecord,
  type PaymentWebhookPayload,
} from "@/lib/ai/payment-infrastructure";
import {
  INITIAL_REPEAT_OPPORTUNITIES,
  generateRepeatProposal,
  type RepeatBusinessOpportunity,
} from "@/lib/ai/repeat-business-engine";
import {
  generateCostControlReport,
  type CostControlReport,
} from "@/lib/ai/cost-control-engine";
import { VERIFIED_OPPORTUNITIES, type Opportunity } from "@/lib/ai/opportunity-hunter";
import { toast } from "sonner";

export function RevenueGrowthCostHub({ founderUpiVpa = "orderking@okhdfcbank" }: { founderUpiVpa?: string }) {
  const [activeSubTab, setActiveSubTab] = useState<"APPLICATIONS" | "PAYMENTS" | "REPEAT_BIZ" | "COST_CONTROL">(
    "APPLICATIONS"
  );

  // Application Engine State
  const [selectedOpp, setSelectedOpp] = useState<Opportunity>(VERIFIED_OPPORTUNITIES[0]);
  const [applicationDraft, setApplicationDraft] = useState<ApplicationDraft>(() =>
    buildCustomizedApplication(VERIFIED_OPPORTUNITIES[0])
  );

  // Payment Infrastructure State
  const [invoices, setInvoices] = useState<ClientInvoiceRecord[]>(INITIAL_CLIENT_INVOICES);
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoiceRecord>(INITIAL_CLIENT_INVOICES[0]);

  // Repeat Business State
  const [repeatOpportunities, setRepeatOpportunities] = useState<RepeatBusinessOpportunity[]>(
    INITIAL_REPEAT_OPPORTUNITIES
  );

  // Cost Control State
  const [costReport, setCostReport] = useState<CostControlReport>(() => generateCostControlReport());

  const handleGenerateApplication = (opp: Opportunity) => {
    setSelectedOpp(opp);
    const draft = buildCustomizedApplication(opp);
    setApplicationDraft(draft);
    toast.success(`Application drafted for "${opp.title}" with zero fabricated credentials!`);
  };

  const handleApproveAndSubmitApp = () => {
    setApplicationDraft((prev) => ({
      ...prev,
      status: "SUBMITTED",
      submittedAt: new Date().toISOString(),
    }));
    toast.success("Application officially submitted and recorded in CRM!");
  };

  const handleSimulateWebhook = () => {
    const targetInvoice = invoices.find((inv) => inv.status === "ESCROW_LOCKED") || invoices[0];
    const payload: PaymentWebhookPayload = {
      eventId: `EVT-${Date.now().toString(36)}`,
      provider: "UPI_BANK",
      eventType: "bank.settlement.received",
      amount: targetInvoice.totalInr,
      currency: "INR",
      invoiceId: targetInvoice.id,
      signature: "sha256_verified_hdfc_signature_ok",
      timestamp: new Date().toISOString(),
    };

    const res = verifyAndProcessWebhook(payload, invoices);
    if (res.success && res.invoice) {
      setInvoices((prev) => prev.map((inv) => (inv.id === res.invoice!.id ? res.invoice! : inv)));
      toast.success(`Webhook Verified: Payment Received for ${targetInvoice.id}! Amount: ₹${payload.amount.toLocaleString()}`);
    } else {
      toast.error(`Webhook Verification Failed: ${res.error}`);
    }
  };

  const handleApproveRepeatOpp = (oppId: string) => {
    setRepeatOpportunities((prev) =>
      prev.map((opp) => (opp.id === oppId ? { ...opp, approvalStatus: "APPROVED" } : opp))
    );
    toast.success("Repeat business proposal approved for client outreach!");
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="h-6 w-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">
                Revenue Collection, Growth &amp; Cost Control (§5, §10, §13, §14, §24)
              </h2>
              <Badge tone="primary">End-to-End Execution</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-300">
              Automated application drafting, real-time UPI invoicing, webhook reconciliation, post-project retainers, and cost optimization.
            </p>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-emerald-500/20 pt-4">
          <div className="rounded-lg bg-black/40 p-3 border border-emerald-500/20">
            <span className="text-xs text-slate-400">Total Invoiced</span>
            <div className="text-2xl font-bold text-white">
              ₹{(invoices.reduce((acc, inv) => acc + inv.totalInr, 0) / 1000).toFixed(0)}k
            </div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-emerald-500/20">
            <span className="text-xs text-slate-400">Verified Received</span>
            <div className="text-2xl font-bold text-emerald-400">
              ₹{(invoices.filter((i) => i.status === "RECEIVED").reduce((acc, inv) => acc + inv.totalInr, 0) / 1000).toFixed(0)}k
            </div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-emerald-500/20">
            <span className="text-xs text-slate-400">Projected Monthly Savings</span>
            <div className="text-2xl font-bold text-amber-400">
              ₹{(costReport.totalProjectedSavingsInr / 1000).toFixed(0)}k /mo
            </div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-emerald-500/20">
            <span className="text-xs text-slate-400">Repeat Pipeline</span>
            <div className="text-2xl font-bold text-teal-400">
              ₹{(repeatOpportunities.reduce((acc, o) => acc + o.proposedMonthlyInr, 0) / 1000).toFixed(0)}k /mo
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Pills */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab("APPLICATIONS")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeSubTab === "APPLICATIONS"
              ? "bg-emerald-500 text-black font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          💼 Automatic Application Engine (§5)
        </button>
        <button
          onClick={() => setActiveSubTab("PAYMENTS")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeSubTab === "PAYMENTS"
              ? "bg-emerald-500 text-black font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          💳 Invoicing &amp; Webhooks (§10)
        </button>
        <button
          onClick={() => setActiveSubTab("REPEAT_BIZ")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeSubTab === "REPEAT_BIZ"
              ? "bg-emerald-500 text-black font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🔄 Repeat Business &amp; Retainers (§13, §14)
        </button>
        <button
          onClick={() => setActiveSubTab("COST_CONTROL")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeSubTab === "COST_CONTROL"
              ? "bg-emerald-500 text-black font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          📉 Cost Control &amp; Zero-Cost Infra (§24)
        </button>
      </div>

      {/* Sub-Tab 1: Automatic Application Engine */}
      {activeSubTab === "APPLICATIONS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Opportunity Selector */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Select Opportunity to Apply</h3>
            {VERIFIED_OPPORTUNITIES.map((opp) => (
              <div
                key={opp.id}
                onClick={() => handleGenerateApplication(opp)}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                  selectedOpp.id === opp.id
                    ? "border-emerald-400 bg-emerald-950/20"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Badge tone="primary">{opp.source}</Badge>
                  <span className="font-mono text-xs text-emerald-400 font-bold">
                    ₹{(opp.statedBudget ?? 0).toLocaleString()}
                  </span>
                </div>
                <h4 className="mt-1 text-sm font-semibold text-white line-clamp-1">{opp.title}</h4>
                <p className="mt-1 text-xs text-slate-400">Client: {opp.client ?? "Direct Enterprise"}</p>
              </div>
            ))}
          </div>

          {/* Generated Customized Application Draft */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase">
                  Customized Proposal Draft (§5)
                </span>
                <h3 className="text-lg font-bold text-white">{applicationDraft.opportunityTitle}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={applicationDraft.status === "SUBMITTED" ? "primary" : "warn"}>
                  {applicationDraft.status}
                </Badge>
                {applicationDraft.status !== "SUBMITTED" && (
                  <Button
                    variant="primary"
                    onClick={handleApproveAndSubmitApp}
                    className="bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Approve &amp; Submit Proposal
                  </Button>
                )}
              </div>
            </div>

            {/* Commercials Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-black/40 p-2.5 border border-slate-800 text-xs">
                <span className="text-slate-400">Proposed Pricing</span>
                <div className="font-bold text-emerald-400 text-sm">
                  ₹{applicationDraft.proposedPriceInr.toLocaleString()} (${applicationDraft.proposedPriceUsd})
                </div>
              </div>
              <div className="rounded-lg bg-black/40 p-2.5 border border-slate-800 text-xs">
                <span className="text-slate-400">Estimated Effort</span>
                <div className="font-bold text-white text-sm">
                  {applicationDraft.estimatedEffortHours} Hours ({Math.ceil(applicationDraft.estimatedEffortHours / 40)}w)
                </div>
              </div>
              <div className="rounded-lg bg-black/40 p-2.5 border border-slate-800 text-xs">
                <span className="text-slate-400">Contribution Margin</span>
                <div className="font-bold text-amber-400 text-sm">{applicationDraft.marginPct}% Margin</div>
              </div>
            </div>

            {/* Cover Letter Content */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase">Custom Cover Letter:</label>
              <div className="mt-1.5 rounded-lg bg-black/60 p-4 text-xs font-mono text-slate-300 whitespace-pre-wrap border border-slate-800">
                {applicationDraft.customCoverLetter}
              </div>
            </div>

            {/* Verified Portfolio Attachments */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase">
                Verified Portfolio Material (Zero Inventions):
              </label>
              <div className="mt-2 space-y-2">
                {applicationDraft.verifiedPortfolioAttachments.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-slate-800 bg-black/40 p-3 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{item.title}</span>
                      <span className="font-mono text-[11px] text-emerald-400">{item.liveUrl}</span>
                    </div>
                    <p className="text-slate-400">{item.description}</p>
                    <div className="text-[11px] text-teal-300 font-medium">Evidence: {item.verifiedMetric}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Invoicing & Webhook Infrastructure */}
      {activeSubTab === "PAYMENTS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invoices List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Client Invoices</h3>
              <Button
                variant="outline"
                onClick={handleSimulateWebhook}
                className="h-7 text-xs border-emerald-500/40 text-emerald-300"
              >
                Simulate Webhook
              </Button>
            </div>

            {invoices.map((inv) => (
              <div
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedInvoice.id === inv.id
                    ? "border-emerald-400 bg-emerald-950/20"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-300">{inv.id}</span>
                  <Badge tone={inv.status === "RECEIVED" ? "primary" : "warn"}>{inv.status}</Badge>
                </div>
                <h4 className="mt-1 font-semibold text-white text-sm">{inv.clientName}</h4>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-900 pt-2">
                  <span>Method: {inv.paymentMethod}</span>
                  <span className="font-mono text-emerald-400 font-bold">₹{inv.totalInr.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Invoice Detail & Live UPI QR */}
          <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase font-mono">
                  {selectedInvoice.id} • {selectedInvoice.status}
                </span>
                <h3 className="text-lg font-bold text-white">{selectedInvoice.projectName}</h3>
                <p className="text-xs text-slate-400">
                  Client: {selectedInvoice.clientName} ({selectedInvoice.clientEmail})
                </p>
              </div>
              <Badge tone={selectedInvoice.status === "RECEIVED" ? "primary" : "warn"}>
                {selectedInvoice.status === "RECEIVED" ? "PROVIDER CONFIRMED" : "AWAITING SETTLEMENT"}
              </Badge>
            </div>

            {/* Items Table */}
            <div className="rounded-lg border border-slate-800 bg-black/40 overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-slate-800 bg-black/60 text-slate-400">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-right">Quantity</th>
                    <th className="p-2.5 text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-slate-300">
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-2.5">{item.description}</td>
                      <td className="p-2.5 text-right">{item.quantity}</td>
                      <td className="p-2.5 text-right font-mono">₹{item.totalInr.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="font-bold text-white bg-black/40">
                    <td colSpan={2} className="p-2.5 text-right">
                      Total Due:
                    </td>
                    <td className="p-2.5 text-right font-mono text-emerald-400 text-sm">
                      ₹{selectedInvoice.totalInr.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* UPI QR & Direct Payment Link */}
            <div className="rounded-xl border border-emerald-500/30 bg-black/50 p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-emerald-400" />
                  <span className="font-bold text-white text-sm">Sovereign Direct UPI QR Code</span>
                </div>
                <p className="text-xs text-slate-400">
                  Scan with GPay, PhonePe, Paytm, or BHIM. Zero gateway commissions.
                </p>
                <div className="text-xs font-mono text-emerald-400">VPA: {founderUpiVpa}</div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={selectedInvoice.paymentLink}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  Pay via UPI App
                </a>
              </div>
            </div>

            {selectedInvoice.providerEventId && (
              <div className="rounded-lg bg-black/60 p-3 text-xs font-mono text-emerald-400 border border-emerald-500/20">
                ✓ Provider Event Verified: {selectedInvoice.providerEventId} (Paid at:{" "}
                {new Date(selectedInvoice.paidAt!).toLocaleString()})
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Repeat Business & Retainers */}
      {activeSubTab === "REPEAT_BIZ" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              Post-Project Repeat &amp; Retainer Opportunities (§13, §14)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Identified from completed projects and CSAT feedback. Requires founder sign-off before sending.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repeatOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3 hover:border-emerald-500/40"
              >
                <div className="flex items-center justify-between">
                  <Badge tone="primary">{opp.type.replace("_", " ")}</Badge>
                  <span className="text-xs text-amber-400 font-bold">★ {opp.csatRating} CSAT</span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm">{opp.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">Client: {opp.clientName}</p>
                </div>

                <p className="text-xs text-slate-300">{opp.rationale}</p>

                <div className="grid grid-cols-2 gap-2 border-t border-slate-900 pt-3 text-xs">
                  <div>
                    <span className="text-slate-400">Monthly Retainer</span>
                    <div className="font-bold text-emerald-400">₹{opp.proposedMonthlyInr.toLocaleString()}/mo</div>
                  </div>
                  <div>
                    <span className="text-slate-400">Expected Annual LTV</span>
                    <div className="font-bold text-white">₹{opp.expectedAnnualLtvInr.toLocaleString()}</div>
                  </div>
                </div>

                <div className="rounded-lg bg-black/50 p-2.5 text-[11px] font-mono text-slate-400 border border-slate-800">
                  {opp.proposalDraft}
                </div>

                <div className="pt-2 flex justify-end">
                  {opp.approvalStatus === "APPROVED" ? (
                    <Badge tone="primary">APPROVED &amp; QUEUED</Badge>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => handleApproveRepeatOpp(opp.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold"
                    >
                      Approve Outreach
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Cost Control & Zero-Cost Infra */}
      {activeSubTab === "COST_CONTROL" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">
                Cost Control &amp; Expense Optimization (§24)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically identifies expensive cloud/API dependencies and recommends zero-cost equivalent architectures.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400">Total Monthly Savings</span>
              <div className="text-xl font-bold text-emerald-400">
                ₹{costReport.totalProjectedSavingsInr.toLocaleString()} /month
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {costReport.expenses.map((exp) => (
              <div
                key={exp.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{exp.name}</span>
                  <Badge tone={exp.isOptimized ? "primary" : "warn"}>
                    {exp.isOptimized ? "OPTIMIZED" : "SAVINGS AVAILABLE"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Provider: {exp.provider}</span>
                  <span className="font-mono text-rose-400 font-bold">
                    ₹{exp.currentMonthlyCostInr.toLocaleString()}/mo
                  </span>
                </div>

                {exp.alternative && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300">
                        Recommendation: {exp.alternative.recommendedSolution}
                      </span>
                      <span className="font-bold text-emerald-400">
                        -₹{exp.alternative.monthlySavingsInr.toLocaleString()}/mo
                      </span>
                    </div>
                    <p className="text-slate-300">{exp.alternative.implementationSteps}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
