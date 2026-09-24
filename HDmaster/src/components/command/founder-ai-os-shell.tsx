import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Code2,
  Cpu,
  Crown,
  Database,
  DollarSign,
  Download,
  Eye,
  FileCode,
  FolderTree,
  GitBranch,
  Globe,
  Headphones,
  Laptop,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  Megaphone,
  Mic,
  Network,
  PhoneCall,
  Play,
  Plug,
  Plus,
  QrCode,
  Radio,
  RefreshCw,
  Search,
  Send,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SupremeFounderAiChat } from "./supreme-founder-ai-chat";
import { AppFactoryWorkspace } from "./app-factory-workspace";
import { RevenueOperatingSystemDashboard } from "./revenue-operating-system-dashboard";
import { FounderApprovalModal, ApprovalRequest } from "./founder-approval-modal";
import { crmEngine, CrmLead, CRM_STAGE_ORDER } from "@/lib/orderking/crm/pipeline-engine";
import { revenueGateway } from "@/lib/orderking/payments/revenue-gateway";
import { durableJobEngine, DurableJob } from "@/lib/orderking/ai/durable-job-engine";
import { modelRouter } from "@/lib/orderking/ai/providers";
import { RemoteContractGig } from "@/lib/orderking/ai/supreme-founder-ai-core";
import { getCuratedRemoteGigsFn } from "@/lib/orderking/actions";
import { StoragePurifierView } from "./storage-purifier-modal";

export type OsNavView =
  | "workspace"
  | "revenue_os"
  | "purifier"
  | "projects"
  | "clients"
  | "opportunities"
  | "revenue"
  | "tasks"
  | "agents"
  | "files"
  | "integrations"
  | "settings";

export function FounderAiOsShell() {
  const [currentView, setCurrentView] = useState<OsNavView>("workspace");
  const [activeApproval, setActiveApproval] = useState<ApprovalRequest | null>(null);

  const [remoteGigs, setRemoteGigs] = useState<RemoteContractGig[]>([]);
  useEffect(() => {
    getCuratedRemoteGigsFn().then((res: any) => {
      if (res.ok && res.data) {
        setRemoteGigs(Object.values(res.data));
      }
    });
  }, []);

  // CRM State
  const [leads, setLeads] = useState(crmEngine.getLeads());
  const [selectedLead, setSelectedLead] = useState<CrmLead>(leads[0]);

  // Revenue State
  const [transactions, setTransactions] = useState(revenueGateway.getTransactions());
  const revenueMetrics = revenueGateway.getMetrics();

  // Tasks State
  const [jobs, setJobs] = useState(durableJobEngine.getJobs());

  // Provider Status
  const providerStatuses = modelRouter.listProviderStatuses();

  const handleApproveAction = (req: ApprovalRequest) => {
    toast.success(`Action "${req.action}" authorized and executed successfully!`);
    setActiveApproval(null);
  };

  const handleRejectAction = (req: ApprovalRequest) => {
    toast.info(`Action "${req.action}" was rejected by founder.`);
    setActiveApproval(null);
  };

  return (
    <div className="flex min-h-[820px] rounded-2xl border-2 border-amber-500/40 bg-[#050E0B] shadow-[0_0_60px_rgba(245,158,11,0.12)] overflow-hidden font-sans text-slate-100">
      {/* 1. Left OS Sidebar Navigation */}
      <aside className="w-56 shrink-0 border-r border-border/70 bg-black/70 p-3 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Logo & Operating System Label */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Crown className="size-4" />
            </div>
            <div>
              <h2 className="font-display font-black text-sm text-white tracking-wide leading-tight">
                Umar OS
              </h2>
              <span className="text-[9px] font-mono text-amber-300 uppercase tracking-widest block font-bold">
                Founder Command Core
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {[
              { id: "workspace", label: "Workspace", icon: LayoutDashboard, badge: "AI Core" },
              { id: "revenue_os", label: "Revenue OS", icon: DollarSign, badge: "Directive 2" },
              { id: "purifier", label: "Purifier", icon: Zap, badge: "100x Boost" },
              { id: "projects", label: "Projects", icon: Code2, badge: "Factory" },
              { id: "clients", label: "Clients", icon: Users, badge: `${leads.length}` },
              { id: "opportunities", label: "Opportunities", icon: Briefcase, badge: "$80+/hr" },
              { id: "revenue", label: "Revenue", icon: Wallet, badge: "0% Cut" },
              { id: "tasks", label: "Tasks", icon: Activity, badge: `${jobs.length}` },
              { id: "agents", label: "Agents", icon: Cpu, badge: "5 Specialists" },
              { id: "files", label: "Files", icon: FolderTree, badge: "Blueprints" },
              { id: "integrations", label: "Integrations", icon: Plug, badge: "Gateways" },
              { id: "settings", label: "Settings", icon: Settings, badge: "Models" },
            ].map((item) => {
              const Icon = item.icon;
              const active = currentView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrentView(item.id as OsNavView)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition ${
                    active
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-surface-2"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`size-4 ${active ? "text-amber-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                        active
                          ? "bg-amber-500/30 text-amber-200"
                          : "bg-surface-2 text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer System Health */}
        <div className="pt-3 border-t border-border/60 text-[10px] space-y-1 text-slate-400 px-2">
          <div className="flex items-center justify-between">
            <span>Core Intelligence:</span>
            <span className="text-emerald-400 font-bold font-mono">100% ONLINE</span>
          </div>
          <div className="flex items-center justify-between">
            <span>King Pay UPI:</span>
            <span className="text-emerald-400 font-bold font-mono">0% FEE CUT</span>
          </div>
        </div>
      </aside>

      {/* 2. Central Main Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-[#06140F] to-black">
        {/* VIEW 1: MAIN WORKSPACE (CENTRAL AI CHAT & VOICE CALL) */}
        {currentView === "workspace" && (
          <div className="flex-1 overflow-hidden p-2 sm:p-4">
            <SupremeFounderAiChat />
          </div>
        )}

        {/* VIEW 1.5: REVENUE OPERATING SYSTEM (DIRECTIVES 1-30) */}
        {currentView === "revenue_os" && (
          <div className="flex-1 overflow-hidden">
            <RevenueOperatingSystemDashboard />
          </div>
        )}

        {/* VIEW: SOVEREIGN STORAGE & CACHE PURIFIER (100X BETTER THAN BROWSER) */}
        {currentView === "purifier" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <StoragePurifierView />
          </div>
        )}

        {/* VIEW 2: PROJECTS & APP FACTORY */}
        {currentView === "projects" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <AppFactoryWorkspace />
          </div>
        )}

        {/* VIEW 3: CLIENTS CRM PIPELINE */}
        {currentView === "clients" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
              <div>
                <h3 className="font-display font-black text-lg text-white">Client Acquisition CRM</h3>
                <p className="text-xs text-muted">
                  15-stage lifecycle from Lead qualification to contract, invoice, and repeat business.
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  toast.success("AI scanning regional targets for high-margin business leads...");
                }}
                className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black"
              >
                <Plus className="size-3.5 mr-1" />
                Add / Scan New Lead
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: Leads List */}
              <div className="space-y-2">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      selectedLead.id === lead.id
                        ? "bg-surface-2 border-amber-500/50 shadow-md"
                        : "bg-black/50 border-border/60 hover:bg-surface-2/60"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{lead.businessName}</span>
                      <Badge className="bg-amber-500/20 text-amber-300 text-[9px] font-mono">
                        {lead.currentStage}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-[11px] mt-2">
                      <span className="text-muted">{lead.location}</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        ₹{lead.dealValueInr.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Selected Lead Details & Actions */}
              <div className="lg:col-span-2 rounded-xl bg-black/60 border border-border/70 p-4 space-y-4">
                <div className="flex justify-between items-start pb-2 border-b border-border/60">
                  <div>
                    <h4 className="text-sm font-black text-white">{selectedLead.businessName}</h4>
                    <p className="text-xs text-muted">
                      {selectedLead.contactPerson} · {selectedLead.phone} · {selectedLead.email}
                    </p>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 text-xs font-mono">
                    Stage: {selectedLead.currentStage}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded bg-surface-2 p-2.5">
                    <span className="text-muted block text-[10px]">Monthly Revenue:</span>
                    <span className="font-bold text-white font-mono">{selectedLead.monthlyRevenueEst}</span>
                  </div>
                  <div className="rounded bg-surface-2 p-2.5">
                    <span className="text-muted block text-[10px]">50% Advance Lock:</span>
                    <span className="font-bold text-amber-400 font-mono">
                      ₹{selectedLead.advanceLockedInr.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="rounded bg-surface-2/70 p-3 text-xs space-y-1">
                  <span className="text-amber-400 font-bold block text-[10px]">Identified Pain Point:</span>
                  <p className="text-slate-300">{selectedLead.painPoint}</p>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/60">
                  <Button
                    size="sm"
                    variant="primary"
                    className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black"
                    onClick={() => {
                      const proposal = crmEngine.generateProposal(selectedLead.id);
                      setLeads(crmEngine.getLeads());
                      toast.success(`Proposal compiled for ${selectedLead.businessName}! Stage: PROPOSAL`);
                    }}
                  >
                    Generate Proposal
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold text-emerald-300 border-emerald-500/40"
                    onClick={() => {
                      const contract = crmEngine.generateContract(selectedLead.id);
                      setLeads(crmEngine.getLeads());
                      toast.success(`Contract ${contract.contractId} generated! Stage: CONTRACT`);
                    }}
                  >
                    Draft MSA Contract
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs font-bold text-cyan-300 border-cyan-500/40"
                    onClick={() => {
                      setActiveApproval({
                        id: `appr-${Date.now()}`,
                        action: "DISPATCH_WHATSAPP_PITCH",
                        why: "Close 50% milestone advance for turnkey direct ordering app.",
                        expectedResult: `Client receives custom pitch and ₹${selectedLead.advanceLockedInr.toLocaleString("en-IN")} invoice.`,
                        risk: "LOW",
                        cost: "₹0 (Direct WhatsApp)",
                        target: selectedLead.businessName,
                        preview: `Respected Management at ${selectedLead.businessName},\n\nTired of 28% aggregator fees? Review your custom solution and 50% advance invoice (₹${selectedLead.advanceLockedInr.toLocaleString("en-IN")}) with 0% gateway cuts.`,
                        timestamp: new Date().toLocaleTimeString(),
                      });
                    }}
                  >
                    Send Outreach Pitch
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: OPPORTUNITIES (REMOTE WORK RADAR) */}
        {currentView === "opportunities" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border/70">
              <div>
                <h3 className="font-display font-black text-lg text-white">High-Paid Remote Work Radar</h3>
                <p className="text-xs text-muted">Curated $80–$150/hr software contracts matching founder capabilities.</p>
              </div>
              <Badge className="bg-sky-500/20 text-sky-300 font-mono text-xs">
                {remoteGigs.length} Active Verified Contracts
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {remoteGigs.map((gig) => (
                <div key={gig.id} className="rounded-xl border border-sky-500/30 bg-black/60 p-4 space-y-3 shadow-lg">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-sky-300 leading-tight">{gig.title}</h4>
                    <Badge className="bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                      {gig.matchScore}% Match
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Rate / Budget:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      ${gig.hourlyRateUsd}/hr (${gig.fixedBudgetUsd?.toLocaleString()})
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted">Platform / Location:</span>
                    <span className="text-slate-300">{gig.platform} · {gig.clientLocation}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {gig.skillsRequired.map((s) => (
                      <span key={s} className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                        {s}
                      </span>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white"
                    onClick={() => {
                      void navigator.clipboard?.writeText(gig.proposalTemplate);
                      toast.success("Tailored proposal copied to clipboard!");
                    }}
                  >
                    Copy Tailored Upwork Proposal
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: REVENUE & PAYMENTS STUDIO */}
        {currentView === "revenue" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border/70">
              <div>
                <h3 className="font-display font-black text-lg text-white">Revenue &amp; Payout Studio</h3>
                <p className="text-xs text-muted">Direct founder bank settlements via King Pay UPI with 0% intermediary fee cuts.</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 text-xs font-mono">
                Section 79 IT Act Protected
              </Badge>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl bg-surface-2/80 p-3 border border-border">
                <span className="text-[10px] text-muted block uppercase font-bold">Total Confirmed GMV</span>
                <span className="text-xl font-black text-white font-mono">
                  ₹{revenueMetrics.totalGrossInr.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="rounded-xl bg-surface-2/80 p-3 border border-border">
                <span className="text-[10px] text-muted block uppercase font-bold">Net Founder Deposited</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  ₹{revenueMetrics.netFounderDepositedInr.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="rounded-xl bg-surface-2/80 p-3 border border-border">
                <span className="text-[10px] text-muted block uppercase font-bold">Saved Gateway Fees</span>
                <span className="text-xl font-black text-amber-400 font-mono">
                  ₹{revenueMetrics.totalSavedGatewayFeesInr.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="rounded-xl bg-surface-2/80 p-3 border border-border">
                <span className="text-[10px] text-muted block uppercase font-bold">Pending Invoices</span>
                <span className="text-xl font-black text-cyan-400 font-mono">
                  {revenueMetrics.pendingInvoicesCount} (₹{revenueMetrics.pendingInvoicesValueInr.toLocaleString("en-IN")})
                </span>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="rounded-xl bg-black/60 border border-border/70 p-4 space-y-3">
              <span className="text-xs font-bold text-white block uppercase tracking-wider">
                Confirmed Transaction Ledger
              </span>
              <div className="space-y-2">
                {transactions.map((t) => (
                  <div key={t.id} className="flex items-center justify-between bg-surface-2/70 p-3 rounded-lg border border-border/50 text-xs">
                    <div>
                      <span className="font-bold text-white block">{t.clientName}</span>
                      <span className="text-[10px] text-muted">{t.description} · Ref: {t.referenceNumber}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400 font-mono block">
                        +₹{t.amountInr.toLocaleString("en-IN")}
                      </span>
                      <Badge className="bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">
                        {t.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 6: TASKS (DURABLE BACKGROUND JOBS) */}
        {currentView === "tasks" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-border/70">
              <div>
                <h3 className="font-display font-black text-lg text-white">Durable Job &amp; Task Engine</h3>
                <p className="text-xs text-muted">Background task graphs, checkpoints, retry workers, and failure recovery.</p>
              </div>
              <Badge className="bg-purple-500/20 text-purple-300 font-mono text-xs">
                {jobs.length} Registered Workers
              </Badge>
            </div>

            <div className="space-y-3">
              {jobs.map((job) => (
                <div key={job.id} className="rounded-xl bg-black/60 border border-border/70 p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-white block">{job.title}</span>
                      <span className="text-[10px] text-muted">ID: {job.id} · Category: {job.category.toUpperCase()}</span>
                    </div>
                    <Badge className="bg-emerald-500/20 text-emerald-400 font-mono text-xs">
                      {job.status} ({job.progressPercent}%)
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 transition-all duration-500" style={{ width: `${job.progressPercent}%` }} />
                  </div>

                  {/* Steps List */}
                  <div className="space-y-1">
                    {job.steps.map((s) => (
                      <div key={s.id} className="flex items-center justify-between text-[11px] bg-surface-2/40 px-2 py-1 rounded">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-3 text-emerald-400" />
                          <span className="text-slate-300">{s.label}</span>
                        </div>
                        {s.durationMs && <span className="text-[10px] text-muted font-mono">{s.durationMs}ms</span>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 7: AGENTS (SPECIALIST TEAM) */}
        {currentView === "agents" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="pb-3 border-b border-border/70">
              <h3 className="font-display font-black text-lg text-white">Specialist Autonomous AI Team</h3>
              <p className="text-xs text-muted">Autonomous executive agents governing operations, engineering, growth, and security.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { title: "CEO Executive Intelligence", role: "Strategy & Capital", icon: Crown, status: "Active" },
                { title: "CTO & Lead Systems Architect", role: "Software & Infrastructure", icon: Code2, status: "Active" },
                { title: "Growth & Client Acquisition Lead", role: "Sales & Marketing", icon: Megaphone, status: "Active" },
                { title: "Chief Financial Officer", role: "King Pay UPI & Ledger", icon: Wallet, status: "Active" },
                { title: "Security & Compliance Auditor", role: "Section 79 & RBAC", icon: ShieldCheck, status: "Active" },
              ].map((agent) => {
                const Icon = agent.icon;
                return (
                  <div key={agent.title} className="rounded-xl border border-border/70 bg-black/60 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-surface-2 text-amber-400">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{agent.title}</h4>
                          <span className="text-[10px] text-muted">{agent.role}</span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                        {agent.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 8: FILES (PROJECT BLUEPRINTS & CODE ARTIFACTS) */}
        {currentView === "files" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="pb-3 border-b border-border/70">
              <h3 className="font-display font-black text-lg text-white">Project Artifacts &amp; Files</h3>
              <p className="text-xs text-muted">Generated production source files, database schemas, and client handoffs.</p>
            </div>

            <div className="rounded-xl bg-black/60 border border-border/70 p-4 space-y-2 font-mono text-xs">
              {[
                { name: "Hospital-ERP/App.tsx", type: "React 19 Frontend", size: "14.2 KB" },
                { name: "Hospital-ERP/schema.sql", type: "PostgreSQL DDL", size: "4.8 KB" },
                { name: "Hospital-ERP/api-routes.ts", type: "REST Endpoints", size: "8.1 KB" },
                { name: "Multi-Vendor-Food/App.tsx", type: "Marketplace UI", size: "16.4 KB" },
                { name: "Multi-Vendor-Food/schema.sql", type: "PostgreSQL DDL", size: "5.2 KB" },
                { name: "FinTech-Ledger/App.tsx", type: "Double-Entry Ledger", size: "12.0 KB" },
              ].map((f) => (
                <div key={f.name} className="flex items-center justify-between bg-surface-2/60 p-2.5 rounded border border-border/40">
                  <div className="flex items-center gap-2">
                    <FileCode className="size-4 text-purple-400" />
                    <span className="text-slate-200">{f.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted text-[11px]">{f.type}</span>
                    <span className="text-slate-400">{f.size}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 9: INTEGRATIONS */}
        {currentView === "integrations" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="pb-3 border-b border-border/70">
              <h3 className="font-display font-black text-lg text-white">Connected Gateways &amp; Services</h3>
              <p className="text-xs text-muted">Real-time status of payment gateways, cloud providers, and repositories.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: "King Pay UPI Deep-Link", status: "Active (0% Fee)", type: "Payment", ready: true },
                { name: "Razorpay Standard Gateway", status: "Active (Key Ready)", type: "Payment", ready: true },
                { name: "Stripe International", status: "Active (API Ready)", type: "Payment", ready: true },
                { name: "PostgreSQL / PGlite", status: "Connected (Live DDL)", type: "Database", ready: true },
                { name: "Vercel / Edge Preview", status: "Ready for Deploy", type: "Hosting", ready: true },
                { name: "WhatsApp Cloud Fleet", status: "Dispatcher Ready", type: "Messaging", ready: true },
              ].map((ig) => (
                <div key={ig.name} className="rounded-xl border border-border/70 bg-black/60 p-3.5 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-white">{ig.name}</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                      {ig.status}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted uppercase tracking-wider block">{ig.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 10: SETTINGS (MODEL INTELLIGENCE & PROVIDERS) */}
        {currentView === "settings" && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="pb-3 border-b border-border/70">
              <h3 className="font-display font-black text-lg text-white">Model Intelligence &amp; Environment</h3>
              <p className="text-xs text-muted">Configurable AI provider abstraction layer, model routing, and API status.</p>
            </div>

            <div className="space-y-3">
              {providerStatuses.map((p) => (
                <div key={p.id} className="rounded-xl bg-black/60 border border-border/70 p-3.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">{p.name}</span>
                    <span className="text-[10px] text-muted">
                      Models: {p.supportedModels.join(", ")} · Env: {p.requiredEnvVar}
                    </span>
                  </div>
                  <Badge
                    className={
                      p.isConfigured
                        ? "bg-emerald-500/20 text-emerald-400 font-mono text-xs"
                        : "bg-surface-2 text-slate-400 font-mono text-xs"
                    }
                  >
                    {p.isConfigured ? "CONFIGURED" : "FALLBACK ACTIVE"}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 3. Founder Approval Modal (Section 14) */}
      <FounderApprovalModal
        request={activeApproval}
        onApprove={handleApproveAction}
        onReject={handleRejectAction}
        onClose={() => setActiveApproval(null)}
      />
    </div>
  );
}
