import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Flame,
  Info,
  Key,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  inspectSystemDependencies,
  DISCOVERED_ECOSYSTEM_CAPABILITIES,
  type SystemDependency,
} from "@/lib/ai/dependency-inspector";
import { toast } from "sonner";

export function DependencyInspectorHub() {
  const [data, setData] = useState(() => inspectSystemDependencies());
  const [selectedDep, setSelectedDep] = useState<SystemDependency | null>(null);
  const [activeTab, setActiveTab] = useState<"DEPENDENCIES" | "ECOSYSTEM">("DEPENDENCIES");

  const handleRefresh = () => {
    const updated = inspectSystemDependencies();
    setData(updated);
    toast.success("Environment & Connector Dependencies Re-scanned!");
  };

  const handleCopyEnv = (envVar: string) => {
    navigator.clipboard.writeText(`${envVar}=your_secret_key_here`);
    toast.success(`Copied "${envVar}=" template to clipboard!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Key className="h-6 w-6 text-sky-400" />
              <h2 className="text-xl font-bold text-white">Dependency Inspector & Ecosystem Discovery (§27, §30)</h2>
              <Badge tone="primary">Zero-Fabrication Reality</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-300">
              Actively inspects API credentials, highlights missing keys with setup guides, and enforces verified local fallback execution.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="flex items-center gap-2 border-sky-500/40 text-sky-300 hover:bg-sky-950/40"
            >
              <RefreshCw className="h-4 w-4" />
              Re-Scan Environment
            </Button>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-sky-500/20 pt-4">
          <div className="rounded-lg bg-black/40 p-3 border border-sky-500/20">
            <span className="text-xs text-slate-400">Total Connectors</span>
            <div className="text-2xl font-bold text-white">{data.total}</div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-sky-500/20">
            <span className="text-xs text-slate-400">Direct API Configured</span>
            <div className="text-2xl font-bold text-emerald-400">{data.configured}</div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-sky-500/20">
            <span className="text-xs text-slate-400">Local Fallback Active</span>
            <div className="text-2xl font-bold text-amber-400">{data.fallbackActive}</div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-sky-500/20">
            <span className="text-xs text-slate-400">System Availability</span>
            <div className="text-2xl font-bold text-teal-400">100% (No Crash)</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("DEPENDENCIES")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "DEPENDENCIES"
              ? "bg-sky-500 text-black font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Environment Dependencies ({data.total})
        </button>
        <button
          onClick={() => setActiveTab("ECOSYSTEM")}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            activeTab === "ECOSYSTEM"
              ? "bg-sky-500 text-black font-bold"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Newly Discovered AI & APIs ({DISCOVERED_ECOSYSTEM_CAPABILITIES.length})
        </button>
      </div>

      {/* Main Content */}
      {activeTab === "DEPENDENCIES" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dependency List */}
          <div className="lg:col-span-2 space-y-3">
            {data.dependencies.map((dep) => (
              <div
                key={dep.id}
                onClick={() => setSelectedDep(dep)}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  selectedDep?.id === dep.id
                    ? "border-sky-400 bg-sky-950/30"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{dep.name}</span>
                      <span className="font-mono text-xs text-sky-400">{dep.envVar}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{dep.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={dep.status === "CONFIGURED" ? "primary" : "warn"}>
                      {dep.status === "CONFIGURED" ? "DIRECT CONNECTED" : "LOCAL FALLBACK"}
                    </Badge>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-900 pt-2.5 text-xs">
                  <span className="text-slate-400">
                    <span className="text-emerald-400 font-semibold">Mode: </span>
                    {dep.fallbackModeDescription}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyEnv(dep.envVar);
                    }}
                    className="flex items-center gap-1 text-sky-400 hover:underline"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Env Var
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Setup Guide Drawer / Inspector Panel */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
            {selectedDep ? (
              <>
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                      Setup Guide & Instructions
                    </span>
                    <Badge tone={selectedDep.status === "CONFIGURED" ? "primary" : "warn"}>
                      {selectedDep.status}
                    </Badge>
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-white">{selectedDep.name}</h3>
                  <p className="font-mono text-xs text-slate-400">{selectedDep.envVar}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase">Capabilities Unlocked:</h4>
                  <ul className="mt-2 space-y-1 text-xs text-slate-300">
                    {selectedDep.unlockedCapabilities.map((cap, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase">Step-by-Step Setup:</h4>
                  <ol className="mt-2 space-y-1.5 text-xs text-slate-400 list-decimal list-inside">
                    {selectedDep.setupInstructions.map((step, i) => (
                      <li key={i} className="text-slate-300">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
                  <a
                    href={selectedDep.setupGuideUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500"
                  >
                    Open Official Key Console
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    onClick={() => handleCopyEnv(selectedDep.envVar)}
                    className="flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-black/40 px-4 py-2 text-xs text-slate-300 hover:bg-black/60"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy Env Line
                  </button>
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <Info className="mx-auto h-8 w-8 text-slate-600" />
                <p className="mt-2 text-xs">Select any dependency on the left to view setup instructions and unlocked capabilities.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Ecosystem Capabilities */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DISCOVERED_ECOSYSTEM_CAPABILITIES.map((cap) => (
            <div
              key={cap.id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3 hover:border-sky-500/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <h3 className="font-bold text-white">{cap.name}</h3>
                </div>
                <Badge tone={cap.status === "INTEGRATED" ? "primary" : "neutral"}>
                  {cap.status}
                </Badge>
              </div>

              <p className="text-xs text-slate-300">{cap.description}</p>

              <div className="flex items-center justify-between border-t border-slate-900 pt-3 text-xs text-slate-400">
                <span>Provider: {cap.provider}</span>
                <span className="font-semibold text-emerald-400">
                  Compatibility: {cap.compatibilityRating}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
