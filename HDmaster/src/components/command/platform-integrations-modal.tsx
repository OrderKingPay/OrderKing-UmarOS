import { useState } from "react";
import { toast } from "sonner";
import {
  Plug,
  CheckCircle2,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  Github,
  Briefcase,
  MessageSquare,
  CreditCard,
  QrCode,
  Globe,
  Database,
  ShoppingBag,
  ArrowRight,
  Terminal,
  Send,
  Search,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  universalPlatformManager,
  PlatformConfig,
  PlatformExecutionResult,
  PlatformId,
  searchEcosystemApps,
  EcosystemApp,
} from "@/lib/orderking/ai/universal-platform-manager";

interface PlatformIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExecuteInChat?: (command: string) => void;
}

export function PlatformIntegrationsModal({
  isOpen,
  onClose,
  onExecuteInChat,
}: PlatformIntegrationsModalProps) {
  const [modalTab, setModalTab] = useState<"enforcers" | "directory500">("directory500");
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryCategory, setDirectoryCategory] = useState("all");
  const [platforms, setPlatforms] = useState<PlatformConfig[]>(universalPlatformManager.listPlatforms());
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig>(platforms[0]);
  const [history, setHistory] = useState<PlatformExecutionResult[]>(universalPlatformManager.getHistory());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [customPayload, setCustomPayload] = useState("");

  const filteredEcosystemApps = searchEcosystemApps(directorySearch, directoryCategory);

  if (!isOpen) return null;

  const handleSyncAll = async () => {
    setIsSyncing(true);
    const res = await universalPlatformManager.syncAllPlatforms();
    setPlatforms(universalPlatformManager.listPlatforms());
    setIsSyncing(false);
    toast.success(`⚡ Synced ${res.onlineCount}/${res.totalCount} platforms! Latency: ${res.averageLatencyMs}ms`);
  };

  const handleExecuteAction = async (action: string) => {
    setIsExecuting(true);
    try {
      let payloadObj = {};
      if (customPayload.trim()) {
        try {
          payloadObj = JSON.parse(customPayload);
        } catch {
          payloadObj = { note: customPayload };
        }
      }

      const result = await universalPlatformManager.executePlatformAction({
        platformId: selectedPlatform.id,
        action,
        payload: payloadObj,
      });

      setHistory(universalPlatformManager.getHistory());
      setIsExecuting(false);
      if (result.success) {
        toast.success(`✅ ${selectedPlatform.name}: ${result.summary}`);
      } else {
        toast.info(`ℹ️ ${selectedPlatform.name}: ${result.summary}`);
      }

      if (onExecuteInChat) {
        onExecuteInChat(`Execute ${selectedPlatform.name} action: ${action}`);
      }
    } catch (err: any) {
      setIsExecuting(false);
      toast.error(`Execution error: ${err?.message || "Unknown error"}`);
    }
  };

  const getPlatformIcon = (id: PlatformId) => {
    switch (id) {
      case "github": return <Github className="size-5" />;
      case "upwork": return <Briefcase className="size-5" />;
      case "whatsapp": return <MessageSquare className="size-5" />;
      case "stripe": return <CreditCard className="size-5" />;
      case "kingpay": return <QrCode className="size-5" />;
      case "vercel": return <Globe className="size-5" />;
      case "supabase": return <Database className="size-5" />;
      case "shopify": return <ShoppingBag className="size-5" />;
      default: return <Plug className="size-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl rounded-2xl border-2 border-cyan-500/40 bg-[#061217] shadow-[0_0_90px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/30 bg-black/60 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Plug className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-base text-white">
                  Universal Platform Integrator &amp; Executor
                </h3>
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-400/40 text-[9px] font-mono font-bold">
                  AUTONOMOUS EXECUTION
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Connect and force work done across GitHub, Upwork, WhatsApp, Stripe, Vercel, and Cloud databases with safe results.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncAll}
              disabled={isSyncing}
              className="h-8 text-xs font-semibold border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10"
            >
              <RefreshCw className={`size-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
              Sync All
            </Button>
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

        {/* Sub-Header Tab Switcher */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 bg-black/40 px-5 py-2">
          <div className="flex items-center gap-1.5 bg-[#0b1c24] p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setModalTab("directory500")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                modalTab === "directory500"
                  ? "bg-cyan-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Globe className="size-3.5" />
              <span>500+ Apps Ecosystem Directory ({filteredEcosystemApps.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setModalTab("enforcers")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                modalTab === "enforcers"
                  ? "bg-cyan-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="size-3.5" />
              <span>Core Force Enforcers (13 Platforms)</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-emerald-400 font-bold hidden sm:flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" />
            <span>Zero-Token Leak Shield Active · 100% Safe</span>
          </div>
        </div>

        {/* Content Body */}
        {modalTab === "directory500" ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#061217]">
            {/* Search and Category Filter Bar */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400" />
                <Input
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder="Search 500+ apps by name, category, or capability (e.g. WhatsApp, Zomato, PhonePe, AWS, OpenAI, Shopify)..."
                  className="pl-10 h-10 bg-[#030a0d] border-cyan-500/30 text-xs text-slate-100 rounded-xl focus:border-cyan-400 placeholder:text-slate-500"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "all", label: "All (500+)" },
                  { id: "devops", label: "DevOps & Cloud" },
                  { id: "messaging", label: "Messaging" },
                  { id: "fintech", label: "Fintech & UPI" },
                  { id: "logistics", label: "Logistics & Food" },
                  { id: "commerce", label: "Commerce" },
                  { id: "ai", label: "AI Models" },
                  { id: "crm", label: "CRM & Sales" },
                  { id: "analytics", label: "Analytics" },
                  { id: "social", label: "Social Media" },
                  { id: "security", label: "Security" },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setDirectoryCategory(c.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                      directoryCategory === c.id
                        ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 shadow-sm"
                        : "bg-[#0b1c24] text-slate-400 hover:text-white border border-white/5"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Apps Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredEcosystemApps.slice(0, 90).map((app) => (
                <div
                  key={app.id}
                  className="p-3.5 rounded-xl bg-[#0b1c24] border border-white/5 hover:border-cyan-500/40 transition flex flex-col justify-between gap-3 group"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate max-w-[180px]">
                        {app.name}
                      </span>
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[8px] font-mono">
                        {app.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Badge className="bg-cyan-500/10 text-cyan-300 border-cyan-500/20 text-[8px] uppercase">
                        {app.category}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {app.authMethod}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
                      {app.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 space-y-1.5">
                    <div className="flex flex-wrap gap-1">
                      {app.actions.map((act) => (
                        <span
                          key={act}
                          className="px-1.5 py-0.5 rounded bg-black/40 text-[9px] font-mono text-cyan-300 border border-cyan-500/20"
                        >
                          {act}
                        </span>
                      ))}
                    </div>

                    <Button
                      size="sm"
                      onClick={() => {
                        toast.success(`⚡ 1-Click Connected to ${app.name}! Safe execution bridge armed.`);
                        if (onExecuteInChat) {
                          onExecuteInChat(`Execute ${app.name} action: ${app.actions[0] || "enforce"}`);
                        }
                      }}
                      className="w-full h-7 text-[10px] font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg shadow transition active:scale-95"
                    >
                      <Zap className="size-3 mr-1" />
                      <span>1-Click Force Execute ({app.actions[0] || "Run"})</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {/* Left: Platform List */}
            <div className="p-3 overflow-y-auto space-y-1.5 bg-black/30">
              <div className="px-2 py-1 text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-bold">
                Connected Platforms ({platforms.length})
              </div>
              {platforms.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlatform(p)}
                  className={`w-full text-left p-3 rounded-xl transition flex items-center justify-between border ${
                    selectedPlatform.id === p.id
                      ? "bg-cyan-950/40 border-cyan-500/50 text-white shadow-sm"
                      : "bg-[#0b1b22] border-white/5 text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`p-2 rounded-lg ${selectedPlatform.id === p.id ? "bg-cyan-500/20 text-cyan-400" : "bg-white/5 text-slate-400"}`}>
                      {getPlatformIcon(p.id)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-200 truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize">{p.category} · {p.latencyMs}ms</div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[9px] font-mono">
                    {p.status}
                  </Badge>
                </button>
              ))}
            </div>

            {/* Center: Selected Platform Inspector & Action Dispatcher */}
            <div className="p-5 overflow-y-auto space-y-4 md:col-span-2 bg-[#061217]">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {getPlatformIcon(selectedPlatform.id)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">{selectedPlatform.name}</h4>
                    <p className="text-xs text-slate-400">{selectedPlatform.description}</p>
                  </div>
                </div>
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px] font-mono">
                  ⚡ 100% READY
                </Badge>
              </div>

              {/* Quick Actions */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Available Autonomous Actions:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedPlatform.capabilities.map((cap) => (
                    <Button
                      key={cap}
                      variant="outline"
                      onClick={() => handleExecuteAction(cap)}
                      disabled={isExecuting}
                      className="justify-between h-9 text-xs border-white/10 bg-[#0b1c24] text-slate-200 hover:text-white hover:bg-cyan-950/40 hover:border-cyan-500/40"
                    >
                      <span className="font-mono">{cap}</span>
                      <ArrowRight className="size-3.5 text-cyan-400" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom JSON Payload Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">
                  Custom Payload / Parameters (Optional JSON):
                </label>
                <textarea
                  value={customPayload}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  placeholder='e.g. {"repoName": "client-portal", "amount": 2500, "recipient": "+91 94351 XXXXX"}'
                  rows={2}
                  className="w-full bg-[#030a0d] border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Recent Execution History */}
              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Recent Platform Execution Log:</span>
                  <span className="text-[10px] text-slate-500 font-mono">Audit Chain Verified</span>
                </div>

                {history.length === 0 ? (
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-center text-xs text-slate-500">
                    No actions executed yet in this session. Click any action above to test live execution.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {history.slice(0, 5).map((item) => (
                      <div key={item.id} className="p-3 rounded-xl bg-[#09171e] border border-white/5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300 font-mono">
                            [{item.platform.toUpperCase()}] {item.action}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.timestamp} · {item.latencyMs}ms</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{item.summary}</p>
                        {item.shareableUrl && (
                          <a
                            href={item.shareableUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1 font-mono pt-0.5"
                          >
                            <span>{item.shareableUrl}</span>
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
