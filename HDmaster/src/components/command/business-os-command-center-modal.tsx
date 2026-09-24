import { useState } from "react";
import { toast } from "sonner";
import {
  Briefcase,
  ShieldCheck,
  TrendingUp,
  Cpu,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  X,
  ArrowRight,
  Zap,
  Activity,
  DollarSign,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { liveOrchestrationEngine } from "@/lib/orderking/ai/live-orchestration-engine";
import { businessOsModules } from "@/lib/orderking/ai/business-os-modules";
import { founderApprovalGates, PendingApprovalRequest } from "@/lib/orderking/ai/founder-approval-gates";
import { autonomousCommandOrchestrator, AutonomousCommandResult } from "@/lib/orderking/ai/autonomous-command-orchestrator";

interface BusinessOsCommandCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteInChat?: (command: string) => void;
}

export function BusinessOsCommandCenterModal({
  isOpen,
  onClose,
  onExecuteInChat,
}: BusinessOsCommandCenterModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "modules" | "consensus" | "approvals" | "audit">("overview");
  const [commandInput, setCommandInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<AutonomousCommandResult | null>(null);

  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalRequest[]>(() =>
    founderApprovalGates.listPendingRequests()
  );

  const budgetStatus = liveOrchestrationEngine.getBudgetStatus();
  const adapters = liveOrchestrationEngine.listRegisteredAdapters();
  const pnl = businessOsModules.calculateFinancialPnL();
  const leads = businessOsModules.discoverLawfulOpportunities();
  const slas = businessOsModules.auditKitchenSlas();
  const inventory = businessOsModules.inspectInventoryAlerts();
  const sre = businessOsModules.inspectSreHealth();
  const roster = businessOsModules.getMinimalStaffRoster();
  const auditChain = founderApprovalGates.getAuditChain();

  if (!isOpen) return null;

  const handleRunCommand = async (cmd: string) => {
    if (!cmd.trim()) return;
    setIsExecuting(true);
    try {
      const result = await autonomousCommandOrchestrator.executeFounderCommand(cmd);
      setLastResult(result);
      setPendingApprovals(founderApprovalGates.listPendingRequests());
      setIsExecuting(false);
      toast.success("⚡ Autonomous Business Command Executed!");

      if (onExecuteInChat) {
        onExecuteInChat(cmd);
      }
    } catch (err: any) {
      setIsExecuting(false);
      toast.error(`Execution error: ${err?.message || "Unknown error"}`);
    }
  };

  const handleApprove = (id: string) => {
    const res = founderApprovalGates.approveRequest(id);
    if (res.success) {
      toast.success(res.message);
      setPendingApprovals(founderApprovalGates.listPendingRequests());
    } else {
      toast.error(res.message);
    }
  };

  const handleReject = (id: string) => {
    const res = founderApprovalGates.rejectRequest(id);
    if (res.success) {
      toast.info(res.message);
      setPendingApprovals(founderApprovalGates.listPendingRequests());
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md animate-fadeIn font-sans">
      <div className="relative w-full max-w-6xl rounded-2xl border-2 border-amber-500/40 bg-[#0c1015] shadow-[0_0_90px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col max-h-[92vh] text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-amber-500/30 bg-black/60 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-black font-black shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <Briefcase className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-base text-white flex items-center gap-2">
                  <span>Autonomous Business Operating System</span>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/40 text-[9px] font-mono font-bold">
                    ONE-FOUNDER ENTERPRISE
                  </Badge>
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Live multi-model orchestration · Lawful revenue discovery · Strict approval gates · Zero fabrication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono hidden sm:flex items-center gap-1">
              <ShieldCheck className="size-3.5" />
              <span>Budget: ₹{budgetStatus.accumulatedSpendInr} / ₹{budgetStatus.monthlyBudgetCapInr}</span>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="size-8 p-0 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-5 py-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 bg-[#141a22] p-1 rounded-xl border border-white/5">
            {[
              { id: "overview" as const, label: "⚡ One-Command Center" },
              { id: "modules" as const, label: "🏢 Business Modules (8)" },
              { id: "consensus" as const, label: `🧠 Multi-Model Consensus (${adapters.length})` },
              { id: "approvals" as const, label: `🔒 Approval Gates (${pendingApprovals.length})` },
              { id: "audit" as const, label: `📜 Audit Chain (${auditChain.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  activeTab === t.id
                    ? "bg-amber-500 text-black shadow-md font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {pendingApprovals.length > 0 && (
            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-[10px] animate-pulse">
              ⚠️ {pendingApprovals.length} Action(s) Require Founder Approval
            </Badge>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-[#0a0e14]">
          {/* TAB 1: ONE-COMMAND OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-5 max-w-4xl mx-auto">
              {/* Radically Simple One-Command Input */}
              <div className="p-5 rounded-2xl border-2 border-amber-500/30 bg-[#121720] shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
                    <Zap className="size-4 text-amber-400" />
                    <span>Radically Simple: Founder One-Command Execution</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Auto-plans → parallel agents → cross-verifies → executes
                  </span>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRunCommand(commandInput);
                    }}
                    placeholder="Enter any business command (e.g. 'Audit kitchen SLAs and disburse rider payouts' or 'Discover sales leads')..."
                    className="h-11 bg-[#070a0e] border-amber-500/30 text-xs text-white rounded-xl focus:border-amber-400"
                  />
                  <Button
                    onClick={() => handleRunCommand(commandInput)}
                    disabled={isExecuting || !commandInput.trim()}
                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-black shadow-md flex items-center gap-1.5"
                  >
                    {isExecuting ? <RefreshCw className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}
                    <span>Execute</span>
                  </Button>
                </div>

                {/* Quick 1-Tap Trigger Pills */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    "Audit kitchen SLAs and disburse partner earnings",
                    "Calculate 30-day P&L and GST input tax credit",
                    "Discover 4 high-margin restaurant sales leads",
                    "Inspect ingredient inventory and auto-reorder",
                    "Verify SRE health and canary status",
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setCommandInput(preset);
                        handleRunCommand(preset);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10.5px] text-slate-300 hover:text-white transition"
                    >
                      ⚡ {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Execution Pipeline Result Card */}
              {lastResult && (
                <div className="p-5 rounded-2xl border border-emerald-500/40 bg-[#121720] shadow-xl space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-5 text-emerald-400" />
                      <span className="text-sm font-bold text-white">Execution Pipeline Complete</span>
                      <Badge className="bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">
                        {lastResult.totalDurationMs}ms
                      </Badge>
                    </div>
                    <Badge className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                      Consensus: {lastResult.consensus.consensusAgreementScore}%
                    </Badge>
                  </div>

                  {/* 5-Stage Pipeline Progress Steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                    {lastResult.executionSteps.map((step) => (
                      <div
                        key={step.stepIndex}
                        className={`p-2.5 rounded-xl border flex flex-col justify-between gap-1.5 ${
                          step.status === "WAITING_APPROVAL"
                            ? "bg-rose-950/30 border-rose-500/40 text-rose-200"
                            : "bg-black/30 border-white/10 text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-amber-400 font-bold">
                            Stage {step.stepIndex}
                          </span>
                          <span className="text-[9px] font-mono text-slate-500">{step.durationMs}ms</span>
                        </div>
                        <span className="text-[11px] font-bold leading-tight text-white">{step.label}</span>
                        <span className="text-[9.5px] text-slate-400 line-clamp-2">{step.detail}</span>
                      </div>
                    ))}
                  </div>

                  {/* Concise Executive Summary */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                    {lastResult.conciseSummary}
                  </div>

                  {/* Inline Approval Prompt if Action Was Queued */}
                  {lastResult.pendingApproval && (
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                      <div>
                        <span className="text-xs font-bold text-rose-300 block">
                          🔒 Founder Gate Paused: {lastResult.pendingApproval.title}
                        </span>
                        <span className="text-[11px] text-slate-300">
                          {lastResult.pendingApproval.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(lastResult.pendingApproval!.id)}
                          className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                        >
                          Approve &amp; Execute
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(lastResult.pendingApproval!.id)}
                          className="h-8 px-3 rounded-lg border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs font-bold"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Business Overview Quick Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#121720] border border-white/5 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <DollarSign className="size-3.5 text-emerald-400" />
                    <span>Finance Intelligence</span>
                  </span>
                  <div className="text-lg font-black text-white font-mono">
                    ₹{pnl.netFounderProfitInr.toLocaleString("en-IN")}
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    Net Founder Profit · {pnl.cashRunwayMonths}m Runway
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#121720] border border-white/5 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <TrendingUp className="size-3.5 text-amber-400" />
                    <span>Sales Pipeline</span>
                  </span>
                  <div className="text-lg font-black text-white font-mono">
                    {leads.length} Real Outlets
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    ₹{(leads.reduce((s, l) => s + l.annualAggregatorLossInr, 0) / 100000).toFixed(1)}L Annual Losses
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#121720] border border-white/5 space-y-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                    <Activity className="size-3.5 text-cyan-400" />
                    <span>Minimal Staff &amp; Ops</span>
                  </span>
                  <div className="text-lg font-black text-white font-mono">
                    {roster.totalHumanStaff} Staff · {roster.automatedSubsystemsCount} Bots
                  </div>
                  <span className="text-[11px] text-slate-400 block">
                    ₹{(roster.monthlyPayrollSavingsInr / 1000).toFixed(0)}k/mo Headcount Saved
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BUSINESS MODULES */}
          {activeTab === "modules" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Finance Widget */}
              <div className="p-4 rounded-2xl bg-[#121720] border border-white/5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <DollarSign className="size-4 text-emerald-400" />
                    <span>Finance &amp; Cash Flow Intelligence</span>
                  </span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">LIVE P&amp;L</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-black/30">
                    <span className="text-[10px] text-slate-400 block">Trailing GMV:</span>
                    <span className="font-mono font-bold text-white">₹{pnl.grossMerchandiseValueInr.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30">
                    <span className="text-[10px] text-slate-400 block">Aggregator Savings:</span>
                    <span className="font-mono font-bold text-emerald-400">₹{pnl.aggregatorSavingsInr.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30">
                    <span className="text-[10px] text-slate-400 block">GST ITC Arbitrage:</span>
                    <span className="font-mono font-bold text-cyan-400">₹{pnl.gstInputTaxCreditInr.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-black/30">
                    <span className="text-[10px] text-slate-400 block">Retained Vault:</span>
                    <span className="font-mono font-bold text-amber-400">₹{pnl.retainedCapitalVaultInr.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Sales Leads Widget */}
              <div className="p-4 rounded-2xl bg-[#121720] border border-white/5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <TrendingUp className="size-4 text-amber-400" />
                    <span>Lawful Opportunity Discovery ({leads.length})</span>
                  </span>
                  <Badge className="bg-amber-500/20 text-amber-300 text-[9px] font-mono">0% FAKE</Badge>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {leads.map((l) => (
                    <div key={l.id} className="p-2 rounded-lg bg-black/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{l.businessName}</span>
                        <span className="text-[10px] text-slate-400">{l.locality} · {l.currentCommissionRatePct}% Comm.</span>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-400 text-[9px] font-mono">
                        Save ₹{(l.annualAggregatorLossInr / 1000).toFixed(0)}k/yr
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kitchen SLAs Widget */}
              <div className="p-4 rounded-2xl bg-[#121720] border border-white/5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Activity className="size-4 text-orange-400" />
                    <span>Kitchen SLAs &amp; Operations</span>
                  </span>
                  <Badge className="bg-orange-500/20 text-orange-300 text-[9px] font-mono">REALTIME</Badge>
                </div>
                <div className="space-y-1.5">
                  {slas.map((s) => (
                    <div key={s.restaurantId} className="p-2 rounded-lg bg-black/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{s.restaurantName}</span>
                        <span className="text-[10px] text-slate-400">Prep: {s.avgPrepMinutes}m · Cancel: {s.cancellationRatePct}%</span>
                      </div>
                      <Badge className={`text-[9px] font-mono ${s.complianceStatus === "OPTIMAL" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                        {s.complianceStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* SRE & Health Widget */}
              <div className="p-4 rounded-2xl bg-[#121720] border border-white/5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="size-4 text-cyan-400" />
                    <span>SRE &amp; Production Deploy Watchdog</span>
                  </span>
                  <Badge className="bg-cyan-500/20 text-cyan-300 text-[9px] font-mono">ALL GREEN</Badge>
                </div>
                <div className="space-y-1.5">
                  {sre.map((item) => (
                    <div key={item.service} className="p-2 rounded-lg bg-black/30 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{item.service}</span>
                        <span className="text-[10px] text-slate-400">P99: {item.latencyP99Ms}ms · Uptime: {item.uptimePct}%</span>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MULTI-MODEL CONSENSUS */}
          {activeTab === "consensus" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#121720] border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Live Multi-Model Frontier Adapters</h4>
                  <p className="text-xs text-slate-400">
                    Executes models concurrently to cross-validate logic, eliminate hallucinations, and enforce budget ceilings.
                  </p>
                </div>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-mono">
                  Monthly Cap: ₹{budgetStatus.monthlyBudgetCapInr}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {adapters.map((adapter) => (
                  <div key={adapter.id} className="p-4 rounded-xl bg-[#141a22] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{adapter.name}</span>
                      <Badge className={`text-[8px] font-mono ${adapter.isConfigured ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-500/20 text-slate-400"}`}>
                        {adapter.isConfigured ? "ACTIVE" : "STANDBY"}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-amber-400 block font-mono">
                      Vendor: {adapter.vendor} · Context: {(adapter.maxContextTokens / 1000).toFixed(0)}k
                    </span>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {adapter.activeModels.map((m) => (
                        <span key={m} className="px-1.5 py-0.5 rounded bg-black/40 text-[9px] font-mono text-slate-300 border border-white/5">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FOUNDER APPROVAL GATES */}
          {activeTab === "approvals" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#121720] border border-white/5">
                <h4 className="text-sm font-bold text-white">Founder Approval Governance Queue</h4>
                <p className="text-xs text-slate-400">
                  Strictly pauses high-risk operations (Financial, Legal, Destructive, Production, External) until explicitly authorized.
                </p>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="p-8 rounded-2xl bg-black/20 border border-white/5 text-center text-xs text-slate-500">
                  Zero pending approvals. All autonomous actions within safe operational limits.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((req) => (
                    <div key={req.id} className="p-4 rounded-xl bg-[#141a22] border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-amber-500/20 text-amber-300 text-[9px] uppercase font-bold">
                            {req.domain}
                          </Badge>
                          <span className="text-xs font-bold text-white">{req.title}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{req.createdAt}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{req.description}</p>
                        {req.amountInr && (
                          <span className="text-[11px] font-mono font-bold text-emerald-400 mt-0.5 block">
                            Amount: ₹{req.amountInr.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(req.id)}
                          className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(req.id)}
                          className="h-8 px-3 rounded-lg border-rose-500/40 text-rose-300 hover:bg-rose-500/10 text-xs font-bold"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUDIT CHAIN */}
          {activeTab === "audit" && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#121720] border border-white/5">
                <h4 className="text-sm font-bold text-white">Immutable HMAC-SHA256 Audit Trail</h4>
                <p className="text-xs text-slate-400">
                  Cryptographically chained append-only ledger of every automated and founder-approved action.
                </p>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditChain.slice().reverse().map((entry) => (
                  <div key={entry.sequence} className="p-3 rounded-xl bg-[#141a22] border border-white/5 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-cyan-500/20 text-cyan-300 text-[9px] font-mono">
                          #{entry.sequence}
                        </Badge>
                        <span className="font-bold text-white">{entry.action}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{entry.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-300">{entry.details}</p>
                    <div className="text-[9px] font-mono text-slate-500 truncate">
                      Hash: {entry.hash.slice(0, 24)}... (Prev: {entry.previousHash.slice(0, 16)}...)
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
