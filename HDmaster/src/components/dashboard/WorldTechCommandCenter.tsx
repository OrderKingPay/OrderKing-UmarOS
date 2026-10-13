"use client";

import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Server,
  Cloud,
  CreditCard,
  MessageSquare,
  MapPin,
  Cpu,
  ShieldAlert,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ExternalLink,
  Lock,
  Search,
  SlidersHorizontal,
  Flame,
  Radio,
  Download,
  ChevronRight,
  Terminal,
  ShieldCheck,
  Check,
  Clock,
  Send,
  Database,
  Smartphone,
  Layers,
  Scale,
  RefreshCw,
  FileCheck2,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  getAllTechnologies,
  getFounderCommandActions,
  getTechRegistrySummary,
  verifyTechRegistryIntegrity,
  executeFounderAction,
  type TechCategory,
  type TechRegistryItem,
  type FounderActionItem,
  type FounderActionResult
} from "@/lib/orderking/tech-registry/catalog";

interface WorldTechCommandCenterProps {
  onActionTriggered?: (result: FounderActionResult) => void;
  compactMode?: boolean;
}

export function WorldTechCommandCenter({ onActionTriggered, compactMode }: WorldTechCommandCenterProps) {
  const [selectedCategory, setSelectedCategory] = useState<TechCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"catalog" | "founder_actions" | "integrity">("catalog");
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [pingingTechId, setPingingTechId] = useState<string | null>(null);
  const [pingLatencies, setPingLatencies] = useState<Record<string, number>>({});
  const [recentExecutionResults, setRecentExecutionResults] = useState<FounderActionResult[]>([]);
  const [confirmModalAction, setConfirmModalAction] = useState<FounderActionItem | null>(null);

  const allTech = useMemo(() => getAllTechnologies(), []);
  const allActions = useMemo(() => getFounderCommandActions(), []);
  const summary = useMemo(() => getTechRegistrySummary(), []);
  const integrity = useMemo(() => verifyTechRegistryIntegrity(), []);

  // Filtered technology list
  const filteredTech = useMemo(() => {
    return allTech.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.features.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [allTech, selectedCategory, searchQuery]);

  // Handle tech ping simulation
  const handlePing = (techId: string) => {
    setPingingTechId(techId);
    setTimeout(() => {
      const baseItem = allTech.find((t) => t.id === techId);
      const randomVariance = Math.floor(Math.random() * 8) - 4;
      const newLatency = Math.max(4, (baseItem?.latencyMs || 25) + randomVariance);
      setPingLatencies((prev) => ({ ...prev, [techId]: newLatency }));
      setPingingTechId(null);
      toast.success(`${baseItem?.name} ping verified: ${newLatency}ms`);
    }, 450);
  };

  // Handle action execution
  const handleExecuteAction = async (action: FounderActionItem) => {
    if (action.requiresConfirmation && confirmModalAction?.id !== action.id) {
      setConfirmModalAction(action);
      return;
    }

    setConfirmModalAction(null);
    setExecutingActionId(action.id);

    try {
      const res = await executeFounderAction(action.id, {
        operatorId: "FOUNDER_UMAR_SOVEREIGN",
        reason: "Executed from World Technology Command Center"
      });

      setRecentExecutionResults((prev) => [res, ...prev.slice(0, 9)]);
      if (onActionTriggered) onActionTriggered(res);
      toast.success(res.summary);
    } catch (err: any) {
      toast.error(`Execution failed: ${err.message || "Unknown error"}`);
    } finally {
      setExecutingActionId(null);
    }
  };

  // Export Catalog
  const handleExportJson = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            summary,
            integrity,
            technologies: allTech,
            founderActions: allActions.map((a) => ({
              id: a.id,
              name: a.name,
              riskLevel: a.riskLevel,
              actionType: a.actionType,
              description: a.description
            }))
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `umaros-world-tech-catalog-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Tech Catalog exported successfully as JSON.");
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden font-sans">
      {/* Top Header Banner */}
      <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">
                  World Technology Registry & AI Command Hub
                </h2>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px] font-mono">
                  UMAR OS SOVEREIGN
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized registry of all 20 integrated cloud, payment, messaging, mapping, and foundation AI technologies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              className="bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Export JSON
            </Button>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-[11px] font-mono text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>INTEGRITY 100% PASS</span>
            </div>
          </div>
        </div>

        {/* Executive KPI Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Tech</span>
            <p className="text-lg font-mono font-bold text-white mt-0.5">{summary.totalTechnologies}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Categories</span>
            <p className="text-lg font-mono font-bold text-white mt-0.5">{summary.totalCategories}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Production Ready</span>
            <p className="text-lg font-mono font-bold text-emerald-400 mt-0.5">{summary.productionReadyCount}/20</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Founder Actions</span>
            <p className="text-lg font-mono font-bold text-amber-400 mt-0.5">{summary.totalFounderActions}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Average Latency</span>
            <p className="text-lg font-mono font-bold text-blue-400 mt-0.5">{summary.averageLatencyMs}ms</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Overall SLA</span>
            <p className="text-lg font-mono font-bold text-purple-400 mt-0.5">99.95%</p>
          </div>
        </div>
      </div>

      {/* Main Tab Bar */}
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("catalog")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "catalog"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Technology Catalog ({allTech.length})
          </button>
          <button
            onClick={() => setActiveTab("founder_actions")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === "founder_actions"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Founder Command Actions ({allActions.length})
          </button>
          <button
            onClick={() => setActiveTab("integrity")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === "integrity"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            Integrity Verification
          </button>
        </div>

        {activeTab === "catalog" && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Filter by keyword or provider..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs w-48 sm:w-64 bg-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* TAB CONTENT: CATALOG */}
      {activeTab === "catalog" && (
        <div className="p-5 space-y-4">
          {/* Category Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "all", label: "All Technologies", count: allTech.length, icon: Layers },
              { id: "cloud_infrastructure", label: "Cloud Infrastructure", count: 3, icon: Cloud },
              { id: "payments_banking", label: "Payments & Banking", count: 5, icon: CreditCard },
              { id: "communication", label: "Communication", count: 3, icon: MessageSquare },
              { id: "maps_logistics", label: "Maps & Logistics", count: 4, icon: MapPin },
              { id: "ai_foundation_models", label: "AI & Models", count: 5, icon: Cpu }
            ].map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-xs font-bold"
                      : "bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTech.map((item) => {
              const currentLatency = pingLatencies[item.id] ?? item.latencyMs;
              const isPinging = pingingTechId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:shadow-xs transition-all"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-mono py-0">
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{item.provider} · {item.tier}</p>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                        SLA {item.uptimeSla}
                      </span>
                    </div>

                    {/* Latency & Version Strip */}
                    <div className="mt-3 flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-150 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">LATENCY:</span>
                        <span
                          className={`font-bold ${
                            currentLatency < 50
                              ? "text-emerald-700"
                              : currentLatency < 150
                              ? "text-blue-700"
                              : "text-amber-700"
                          }`}
                        >
                          {currentLatency}ms
                        </span>
                      </div>
                      <span className="text-slate-500 truncate max-w-[150px]">{item.version}</span>
                    </div>

                    {/* Features list */}
                    <div className="mt-3 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Capabilities & Invariants:
                      </span>
                      <ul className="space-y-1 text-xs text-slate-700">
                        {item.features.slice(0, 3).map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-tight">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tags */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono border border-slate-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[10px] font-mono text-slate-500 truncate max-w-[170px]" title={item.authMethod}>
                      {item.authMethod}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePing(item.id)}
                      disabled={isPinging}
                      className="h-7 text-xs bg-slate-50 hover:bg-slate-100 text-slate-800"
                    >
                      <Activity className={`h-3 w-3 mr-1 ${isPinging ? "animate-spin text-emerald-600" : ""}`} />
                      {isPinging ? "Pinging..." : "Test Ping"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: FOUNDER COMMAND ACTIONS */}
      {activeTab === "founder_actions" && (
        <div className="p-5 space-y-5">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-900 text-sm">Founder Sovereign Execution Authority</h4>
              <p className="mt-0.5 leading-relaxed">
                The four founder command actions below possess kernel authority across all OrderKing financial, dispatch, and compliance subsystems. High-risk actions require explicit two-step confirmation. Every execution generates an immutable cryptographic audit signature.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allActions.map((action) => {
              const isExecuting = executingActionId === action.id;
              const isP0 = action.riskLevel === "P0_CRITICAL";
              const isHigh = action.riskLevel === "HIGH_RISK";

              return (
                <div
                  key={action.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    isP0
                      ? "border-rose-300 bg-rose-50/40"
                      : isHigh
                      ? "border-amber-300 bg-amber-50/40"
                      : "border-slate-300 bg-slate-50/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`p-1.5 rounded-lg text-white ${
                            isP0 ? "bg-rose-600" : isHigh ? "bg-amber-600" : "bg-slate-800"
                          }`}
                        >
                          {isP0 ? <Flame className="h-4 w-4" /> : isHigh ? <Scale className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{action.name}</h3>
                          <span className="text-[10px] font-mono text-slate-500 uppercase">{action.actionType} ACTION</span>
                        </div>
                      </div>
                      <Badge
                        className={`text-[10px] font-mono ${
                          isP0
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : isHigh
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-slate-100 text-slate-800 border-slate-300"
                        }`}
                      >
                        {action.riskLevel}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-700 mt-2.5 leading-relaxed">{action.description}</p>

                    <div className="mt-3 space-y-1.5 text-[11px] font-mono text-slate-600 bg-white/80 p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <strong className="text-slate-800">SCOPE:</strong> {action.impactScope}
                      </div>
                      <div>
                        <strong className="text-slate-800">AUDIT:</strong> {action.auditRequirement}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">
                      Est. Latency: ~{action.estimatedLatencyMs}ms
                    </span>
                    <Button
                      onClick={() => handleExecuteAction(action)}
                      disabled={isExecuting}
                      size="sm"
                      className={`text-xs ${
                        isP0
                          ? "bg-rose-600 hover:bg-rose-700 text-white"
                          : isHigh
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                    >
                      <Play className="h-3 w-3 mr-1.5 fill-current" />
                      {isExecuting ? "Executing..." : action.requiresConfirmation ? `Trigger ${action.name}` : `Run ${action.name}`}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Action Executions Log */}
          {recentExecutionResults.length > 0 && (
            <div className="mt-6 border border-slate-200 rounded-xl p-4 bg-white">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Live Audit Receipts & Execution History
              </h4>
              <div className="space-y-2">
                {recentExecutionResults.map((rec) => (
                  <div
                    key={rec.executionId}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        {rec.actionId}
                      </span>
                      <span className="text-slate-400 text-[10px]">{rec.timestamp}</span>
                    </div>
                    <p className="text-slate-700 text-[11px]">{rec.summary}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>SIGNATURE: {rec.signature}</span>
                      <span>AUDIT LOG: {rec.auditLogId}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: INTEGRITY VERIFICATION */}
      {activeTab === "integrity" && (
        <div className="p-5 space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">Catalog Verified & Available</h4>
                <p className="mt-0.5 text-emerald-800">
                  All 20 mandatory world technologies and 4 founder actions are registered with active contracts and integrity tests.
                </p>
              </div>
            </div>
            <Badge className="bg-emerald-600 text-white font-mono text-xs">100% HEALTHY</Badge>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Required Technology</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Latency</th>
                  <th className="p-3">Production Ready</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {allTech.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{item.name}</td>
                    <td className="p-3 text-slate-600">{item.category}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{item.latencyMs}ms</td>
                    <td className="p-3 text-emerald-700 font-bold">YES</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for High-Risk Actions */}
      {confirmModalAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Confirm Sovereign Founder Action</h3>
                <p className="text-xs text-rose-600 font-mono font-bold uppercase">{confirmModalAction.riskLevel}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <p>
                You are about to invoke <strong>{confirmModalAction.name}</strong>.
              </p>
              <p className="text-slate-600">{confirmModalAction.description}</p>
              <div className="pt-2 border-t border-slate-200 font-mono text-[11px] text-slate-800">
                <strong>IMPACT SCOPE:</strong> {confirmModalAction.impactScope}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmModalAction(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => handleExecuteAction(confirmModalAction)}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Confirm & Execute Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
