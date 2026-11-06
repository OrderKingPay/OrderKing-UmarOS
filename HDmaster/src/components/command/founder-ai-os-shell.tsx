import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Cpu,
  Crown,
  DollarSign,
  FileCode,
  FolderTree,
  LayoutDashboard,
  Megaphone,
  Palette,
  Plug,
  Plus,
  RotateCcw,
  Send,
  Settings,
  ShieldCheck,
  Sliders,
  Sparkles,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PremiumFounderAiChat } from "./supreme-founder-ai-chat";
import { AppFactoryWorkspace } from "./app-factory-workspace";
import { RevenueOperatingSystemDashboard } from "./revenue-operating-system-dashboard";
import { FounderApprovalModal, ApprovalRequest } from "./founder-approval-modal";
import { crmEngine, CrmLead } from "@/lib/orderking/crm/pipeline-engine";
import { revenueGateway } from "@/lib/orderking/payments/revenue-gateway";
import { durableJobEngine } from "@/lib/orderking/ai/durable-job-engine";
import { modelRouter } from "@/lib/orderking/ai/providers";
import { RemoteContractGig } from "@/lib/orderking/ai/supreme-founder-ai-core";
import { getCuratedRemoteGigsFn } from "@/lib/orderking/actions";
import { StoragePurifierView } from "./storage-purifier-modal";
import {
  systemMasterController,
  DEFAULT_FOUNDER_LIVE_SETTINGS,
  type FounderLiveSettingsState,
} from "@/lib/orderking/ai/system-master-controller";

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
  const mainWorkspaceRef = useRef<HTMLDivElement | null>(null);

  // Collapsible Sidebar Category State (4 Structured Groups)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    ai_core: true,
    revenue_growth: true,
    app_factory: true,
    system_settings: true,
  });

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Bi-Directional UMAR AI <-> Live Platform Settings State
  const [liveSettings, setLiveSettings] = useState<FounderLiveSettingsState>(() =>
    systemMasterController.getLiveSettings(),
  );
  const [aiSettingsCommand, setAiSettingsCommand] = useState("");
  const [lastAiSummary, setLastAiSummary] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const [remoteGigs, setRemoteGigs] = useState<RemoteContractGig[]>([]);
  useEffect(() => {
    getCuratedRemoteGigsFn().then((res: any) => {
      if (res.ok && res.data) {
        setRemoteGigs(Object.values(res.data));
      }
    });
  }, []);

  // Sync live settings on mount & listen for UMAR AI customization events
  useEffect(() => {
    void systemMasterController.syncSettingsFromServer().then((synced) => {
      setLiveSettings(synced);
    });

    const onSettingsUpdated = (evt: Event) => {
      const custom = evt as CustomEvent<{ settings?: FounderLiveSettingsState }>;
      if (custom.detail?.settings) {
        setLiveSettings({ ...custom.detail.settings });
      } else {
        setLiveSettings(systemMasterController.getLiveSettings());
      }
    };

    window.addEventListener("hd-live-settings-updated", onSettingsUpdated);
    return () => window.removeEventListener("hd-live-settings-updated", onSettingsUpdated);
  }, []);

  // CRM State
  const [leads, setLeads] = useState(crmEngine.getLeads());
  const [selectedLead, setSelectedLead] = useState<CrmLead>(leads[0]);

  // Revenue State
  const [transactions] = useState(revenueGateway.getTransactions());
  const revenueMetrics = revenueGateway.getMetrics();

  // Tasks State
  const [jobs] = useState(durableJobEngine.getJobs());

  // Provider Status
  const providerStatuses = modelRouter.listProviderStatuses();

  const scrollWorkspace = (direction: "top" | "bottom") => {
    const container = mainWorkspaceRef.current;
    if (!container) return;
    const scrollTarget = container.querySelector<HTMLElement>("[data-os-scroll-area]") || container;
    scrollTarget.scrollTo({
      top: direction === "top" ? 0 : scrollTarget.scrollHeight,
      behavior: "smooth",
    });
  };

  const handleRunUmarSettingsCommand = async (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;
    setSavingSettings(true);
    try {
      const result = await systemMasterController.executeFounderLiveCustomization(trimmed);
      setLiveSettings(systemMasterController.getLiveSettings());
      setLastAiSummary(result.summary);
      if (result.matched) {
        toast.success(`UMAR AI Executed: ${result.summary}`);
        setAiSettingsCommand("");
      } else {
        toast.info(result.summary);
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const handleManualPatchSetting = async (patch: Partial<FounderLiveSettingsState>, label: string) => {
    setSavingSettings(true);
    try {
      const updated = await systemMasterController.applySettingsPatch(patch);
      setLiveSettings(updated);
      setLastAiSummary(`Manual Control Synced: ${label}`);
      toast.success(`Live Platform Updated: ${label}`);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleApproveAction = async (req: ApprovalRequest) => {
    try {
      const res = await fetch("/api/v1/founder/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: req.action,
          payload: { target: req.target, why: req.why },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(`Authorization rejected (${res.status}): ${data.error || "Permission required"}`);
        return;
      }
      toast.success(`Action "${req.action}" executed on backend: ${data.message || "Confirmed"}`);
      setActiveApproval(null);
    } catch (err: any) {
      toast.error(`Execution error: ${err?.message || "Failed to reach server"}`);
    }
  };

  const handleRejectAction = (req: ApprovalRequest) => {
    toast.info(`Action "${req.action}" was rejected by founder.`);
    setActiveApproval(null);
  };

  const sidebarCategories = [
    {
      id: "ai_core",
      title: "🧠 AI & Executive Core",
      items: [
        { id: "workspace", label: "Workspace", icon: LayoutDashboard, badge: "AI Core" },
        { id: "agents", label: "Agents", icon: Cpu, badge: "5 Specialists" },
        { id: "tasks", label: "Tasks", icon: Activity, badge: `${jobs.length}` },
      ],
    },
    {
      id: "revenue_growth",
      title: "💰 Revenue & Growth OS",
      items: [
        { id: "revenue_os", label: "Revenue OS", icon: DollarSign, badge: "Directive 2" },
        { id: "revenue", label: "Revenue", icon: Wallet, badge: "0% Cut" },
        { id: "clients", label: "Clients", icon: Users, badge: `${leads.length}` },
        { id: "opportunities", label: "Opportunities", icon: Briefcase, badge: "$80+/hr" },
      ],
    },
    {
      id: "app_factory",
      title: "🏗️ App Factory & Blueprints",
      items: [
        { id: "projects", label: "Projects", icon: Code2, badge: "Factory" },
        { id: "files", label: "Files", icon: FolderTree, badge: "Blueprints" },
        { id: "purifier", label: "Purifier", icon: Zap, badge: "Boost" },
      ],
    },
    {
      id: "system_settings",
      title: "⚙️ System, Gateways & Settings",
      items: [
        { id: "integrations", label: "Integrations", icon: Plug, badge: "Gateways" },
        { id: "settings", label: "Settings", icon: Settings, badge: "UMAR Sync" },
      ],
    },
  ] as const;

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[600px] w-full rounded-2xl border-2 border-amber-500/40 bg-[#050E0B] shadow-[0_0_60px_rgba(245,158,11,0.12)] overflow-hidden font-sans text-slate-100">
      {/* 1. Left OS Sidebar Navigation (Structured Category -> Sub-Category Tree) */}
      <aside className="w-60 shrink-0 border-r border-border/70 bg-black/75 p-3 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-3">
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

          {/* Quick Scroll Controls for Main Workspace */}
          <div className="grid grid-cols-2 gap-1.5 px-1">
            <button
              type="button"
              onClick={() => scrollWorkspace("top")}
              className="flex items-center justify-center gap-1 rounded-lg border border-border/60 bg-surface-2/60 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition"
            >
              <ArrowUp className="size-3" />
              <span>↑ Top</span>
            </button>
            <button
              type="button"
              onClick={() => scrollWorkspace("bottom")}
              className="flex items-center justify-center gap-1 rounded-lg border border-border/60 bg-surface-2/60 px-2 py-1 text-[10px] font-mono text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition"
            >
              <ArrowDown className="size-3" />
              <span>↓ Bottom</span>
            </button>
          </div>

          {/* Structured Collapsible Category -> Sub-Category Groups */}
          <nav className="space-y-2">
            {sidebarCategories.map((cat) => {
              const isOpen = expandedCategories[cat.id] ?? true;
              const hasActiveChild = cat.items.some((i) => i.id === currentView);
              return (
                <div
                  key={cat.id}
                  className="rounded-xl border border-border/50 bg-black/40 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                      hasActiveChild ? "text-amber-300 bg-amber-500/10" : "text-slate-300 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{cat.title}</span>
                    {isOpen ? (
                      <ChevronDown className="size-3.5 shrink-0 text-amber-400" />
                    ) : (
                      <ChevronRight className="size-3.5 shrink-0 text-slate-400" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="p-1 space-y-0.5">
                      {cat.items.map((item) => {
                        const Icon = item.icon;
                        const active = currentView === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setCurrentView(item.id as OsNavView)}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition ${
                              active
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-sm"
                                : "text-slate-400 hover:text-white hover:bg-surface-2"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className={`size-3.5 ${active ? "text-amber-400" : "text-slate-400"}`} />
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
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer System Health */}
        <div className="pt-3 mt-3 border-t border-border/60 text-[10px] space-y-1 text-slate-400 px-2">
          <div className="flex items-center justify-between">
            <span>Core Intelligence:</span>
            <span className="text-emerald-400 font-bold font-mono">100% ONLINE</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Commission / Fee:</span>
            <span className="text-amber-300 font-bold font-mono">
              {liveSettings.restaurant_commission_pct}% · ₹{liveSettings.base_delivery_fee_inr}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>King Pay UPI:</span>
            <span className="text-emerald-400 font-bold font-mono">
              {liveSettings.king_pay_upi_mdr_pct}% FEE CUT
            </span>
          </div>
        </div>
      </aside>

      {/* 2. Central Main Workspace */}
      <main
        ref={mainWorkspaceRef}
        className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-[#06140F] to-black"
      >
        {/* VIEW 1: MAIN WORKSPACE (CENTRAL AI CHAT & VOICE CALL) */}
        {currentView === "workspace" && (
          <div data-os-scroll-area className="flex-1 overflow-y-auto p-2 sm:p-4">
            <PremiumFounderAiChat />
          </div>
        )}

        {/* VIEW 1.5: REVENUE OPERATING SYSTEM (DIRECTIVES 1-30) */}
        {currentView === "revenue_os" && (
          <div data-os-scroll-area className="flex-1 overflow-y-auto">
            <RevenueOperatingSystemDashboard />
          </div>
        )}

        {/* VIEW: STORAGE & CACHE OPTIMIZER */}
        {currentView === "purifier" && (
          <div data-os-scroll-area className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <StoragePurifierView />
          </div>
        )}

        {/* VIEW 2: PROJECTS & APP FACTORY */}
        {currentView === "projects" && (
          <div data-os-scroll-area className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <AppFactoryWorkspace />
          </div>
        )}

        {/* VIEW 3: CLIENTS CRM PIPELINE */}
        {currentView === "clients" && (
          <div data-os-scroll-area className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
                      crmEngine.generateProposal(selectedLead.id);
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
          <div data-os-scroll-area className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
          <div data-os-scroll-area className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
          <div data-os-scroll-area className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
          <div data-os-scroll-area className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
          <div data-os-scroll-area className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
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
          <div data-os-scroll-area className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            <div className="pb-3 border-b border-border/70">
              <h3 className="font-display font-black text-lg text-white">Connected Gateways &amp; Services</h3>
              <p className="text-xs text-muted">Real-time status of payment gateways, cloud providers, and repositories.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: "King Pay UPI", status: "Consumer UPI gated", type: "Payment", ready: false },
                { name: "Razorpay Standard Gateway", status: "Credentials configured; live test pending", type: "Payment", ready: false },
                { name: "Stripe International", status: "Provider verification pending", type: "Payment", ready: false },
                { name: "Supabase PostgreSQL", status: "Database healthy; launch mode gated", type: "Database", ready: false },
                { name: "Cloudflare Workers & Pages", status: "Cloudflare-only production path", type: "Hosting", ready: false },
                { name: "WhatsApp Cloud Fleet", status: "Provider connection pending", type: "Messaging", ready: false },
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

        {/* VIEW 10: SETTINGS (BI-DIRECTIONAL UMAR AI <-> LIVE PLATFORM SETTINGS + MODEL INTELLIGENCE) */}
        {currentView === "settings" && (
          <div data-os-scroll-area className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
              <div>
                <h3 className="font-display font-black text-lg text-white">
                  Bi-Directional UMAR AI &amp; Live Platform Settings Deck
                </h3>
                <p className="text-xs text-muted">
                  Change any color, commission, delivery fee, dispatch radius, or theme either manually or by instructing UMAR AI.
                </p>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 font-mono text-xs">
                100% Unified AI ↔ Manual Sync
              </Badge>
            </div>

            {/* SECTION A: NATURAL-LANGUAGE UMAR AI SETTINGS EXECUTOR */}
            <div className="rounded-2xl border border-amber-500/40 bg-black/70 p-4 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Instruct UMAR AI to Customize Any Setting
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">
                  Live Endpoint: /api/v1/admin/settings
                </span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleRunUmarSettingsCommand(aiSettingsCommand);
                }}
                className="flex flex-col sm:flex-row gap-2"
              >
                <Input
                  value={aiSettingsCommand}
                  onChange={(e) => setAiSettingsCommand(e.target.value)}
                  placeholder="e.g. Set commission to 15%, base delivery ₹30, max radius 20km, or Theme: Sovereign Gold..."
                  className="flex-1 bg-surface-2/80 border-border text-xs text-white"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingSettings}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0"
                >
                  <Send className="size-3.5 mr-1.5" />
                  Execute via UMAR AI
                </Button>
              </form>

              {/* 1-Tap Quick Execution Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  "Set Commission to 15%",
                  "Base Delivery ₹30",
                  "Max Radius 20km",
                  "Theme: Royal Emerald",
                  "Theme: Sovereign Gold",
                  "Reset Branding",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => void handleRunUmarSettingsCommand(chip)}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-mono text-amber-200 hover:bg-amber-500/25 transition"
                  >
                    ⚡ {chip}
                  </button>
                ))}
              </div>

              {lastAiSummary && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300 font-mono">
                  ✓ {lastAiSummary}
                </div>
              )}
            </div>

            {/* SECTION B: MANUAL CATEGORY -> SUB-CATEGORY QUICK CONTROLS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Category 1: Brand Colors & Theme Mode */}
              <div className="rounded-xl border border-border/70 bg-black/60 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <Palette className="size-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">1. Brand Colors &amp; Theme</span>
                  </div>
                  <Badge className="bg-surface-2 text-[10px] font-mono text-slate-300">
                    {liveSettings.theme_preset.toUpperCase()} · {liveSettings.theme_mode.toUpperCase()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-muted block mb-1">Primary Brand Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={liveSettings.primary_brand_color}
                        onChange={(e) =>
                          void handleManualPatchSetting(
                            { primary_brand_color: e.target.value },
                            `Primary Color ${e.target.value}`,
                          )
                        }
                        className="h-8 w-10 rounded border border-border bg-transparent cursor-pointer"
                      />
                      <span className="font-mono text-slate-200">{liveSettings.primary_brand_color}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-muted block mb-1">Accent Brand Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={liveSettings.accent_brand_color}
                        onChange={(e) =>
                          void handleManualPatchSetting(
                            { accent_brand_color: e.target.value },
                            `Accent Color ${e.target.value}`,
                          )
                        }
                        className="h-8 w-10 rounded border border-border bg-transparent cursor-pointer"
                      />
                      <span className="font-mono text-slate-200">{liveSettings.accent_brand_color}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[11px] h-7"
                    onClick={() =>
                      void handleManualPatchSetting(
                        {
                          theme_preset: "emerald",
                          primary_brand_color: "#10B981",
                          accent_brand_color: "#F59E0B",
                        },
                        "Royal Emerald Theme",
                      )
                    }
                  >
                    Royal Emerald
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[11px] h-7"
                    onClick={() =>
                      void handleManualPatchSetting(
                        {
                          theme_preset: "gold",
                          primary_brand_color: "#F59E0B",
                          accent_brand_color: "#10B981",
                        },
                        "Sovereign Gold Theme",
                      )
                    }
                  >
                    Sovereign Gold
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[11px] h-7"
                    onClick={() =>
                      void handleManualPatchSetting(
                        {
                          theme_mode: liveSettings.theme_mode === "dark" ? "light" : "dark",
                        },
                        `Theme Mode: ${liveSettings.theme_mode === "dark" ? "Light" : "Dark"}`,
                      )
                    }
                  >
                    Mode: {liveSettings.theme_mode === "dark" ? "Dark" : "Light"}
                  </Button>
                </div>
              </div>

              {/* Category 2: Marketplace Fees & Commissions */}
              <div className="rounded-xl border border-border/70 bg-black/60 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="size-4 text-amber-400" />
                    <span className="text-xs font-bold text-white">2. Fees &amp; Commissions</span>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                    {liveSettings.restaurant_commission_pct}% Comm
                  </Badge>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">Restaurant Commission (%)</span>
                      <span className="font-mono font-bold text-amber-300">
                        {liveSettings.restaurant_commission_pct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={35}
                      step={1}
                      value={liveSettings.restaurant_commission_pct}
                      onChange={(e) =>
                        void handleManualPatchSetting(
                          { restaurant_commission_pct: Number(e.target.value) },
                          `Commission ${e.target.value}%`,
                        )
                      }
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">Base Delivery Fee (₹)</span>
                      <span className="font-mono font-bold text-emerald-300">
                        ₹{liveSettings.base_delivery_fee_inr}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={150}
                      step={5}
                      value={liveSettings.base_delivery_fee_inr}
                      onChange={(e) =>
                        void handleManualPatchSetting(
                          { base_delivery_fee_inr: Number(e.target.value) },
                          `Base Delivery Fee ₹${e.target.value}`,
                        )
                      }
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">Rider Payout per KM (₹/km)</span>
                      <span className="font-mono font-bold text-cyan-300">
                        ₹{liveSettings.rider_payout_per_km_inr}/km
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={30}
                      step={1}
                      value={liveSettings.rider_payout_per_km_inr}
                      onChange={(e) =>
                        void handleManualPatchSetting(
                          { rider_payout_per_km_inr: Number(e.target.value) },
                          `Rider Payout ₹${e.target.value}/km`,
                        )
                      }
                      className="w-full accent-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Category 3: Dispatch Algorithm Sliders & Safe Resets */}
              <div className="rounded-xl border border-border/70 bg-black/60 p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="size-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">3. Dispatch &amp; Safe Reset</span>
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                    {liveSettings.max_delivery_radius_km} KM
                  </Badge>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">Max Delivery Radius (KM)</span>
                      <span className="font-mono font-bold text-cyan-300">
                        {liveSettings.max_delivery_radius_km} km
                      </span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={50}
                      step={1}
                      value={liveSettings.max_delivery_radius_km}
                      onChange={(e) =>
                        void handleManualPatchSetting(
                          { max_delivery_radius_km: Number(e.target.value) },
                          `Max Delivery Radius ${e.target.value}km`,
                        )
                      }
                      className="w-full accent-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-300">Surge Multiplier Cap</span>
                      <span className="font-mono font-bold text-amber-300">
                        {liveSettings.surge_multiplier_cap}x ({liveSettings.surge_pricing_enabled ? "ON" : "OFF"})
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={liveSettings.surge_multiplier_cap}
                      onChange={(e) => {
                        const cap = Number(e.target.value);
                        void handleManualPatchSetting(
                          { surge_multiplier_cap: cap, surge_pricing_enabled: cap > 1 },
                          `Surge Cap ${cap}x`,
                        );
                      }}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  {/* Safe Reset Buttons */}
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[11px] h-7 border-amber-500/40 text-amber-300"
                      onClick={() => void handleRunUmarSettingsCommand("reset branding")}
                    >
                      <RotateCcw className="size-3 mr-1" />
                      Reset Branding
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[11px] h-7 border-rose-500/40 text-rose-300"
                      onClick={() =>
                        void handleManualPatchSetting(
                          { ...DEFAULT_FOUNDER_LIVE_SETTINGS },
                          "Factory Default Settings Restored",
                        )
                      }
                    >
                      <RotateCcw className="size-3 mr-1" />
                      Factory Reset All
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION C: MODEL INTELLIGENCE & ENVIRONMENT */}
            <div className="space-y-3 pt-2 border-t border-border/70">
              <div>
                <h4 className="font-display font-bold text-sm text-white">Model Intelligence &amp; Environment</h4>
                <p className="text-xs text-muted">
                  Configurable AI provider abstraction layer, model routing, and API status.
                </p>
              </div>

              <div className="space-y-2.5">
                {providerStatuses.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl bg-black/60 border border-border/70 p-3.5 flex items-center justify-between"
                  >
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
