"use client";

import React, { useState } from "react";
import {
  Cpu,
  Zap,
  TrendingUp,
  DollarSign,
  Activity,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Clock,
  Layers,
  Scale,
  Percent,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FRONTIER_MODELS,
  calculateTokenCost,
  executeBenchmarkRun,
  compareModelsHeadToHead,
  type TaskBenchmarkResult,
  USD_TO_INR_EXCHANGE_RATE,
} from "@/lib/orderking/ai/benchmark-matrix";

export function MultimodelBenchmarkDashboard() {
  const [selectedTaskType, setSelectedTaskType] = useState<
    "code_generation" | "dispatch_optimization" | "fraud_detection" | "multilingual_voice"
  >("dispatch_optimization");
  const [activeBenchmarkRuns, setActiveBenchmarkRuns] = useState<TaskBenchmarkResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const modelKeys = Object.keys(FRONTIER_MODELS);

  const handleRunAllBenchmarks = () => {
    setIsRunning(true);
    setTimeout(() => {
      const results = modelKeys.map((key) =>
        executeBenchmarkRun(selectedTaskType, key, 1.0)
      );
      setActiveBenchmarkRuns(results);
      setIsRunning(false);
      toast.success(`Completed empirical benchmark across all 5 frontier models!`);
    }, 850);
  };

  const comparison = compareModelsHeadToHead(
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    { inputTokens: 5_000_000, outputTokens: 1_000_000 }
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Multimodel Intelligence Matrix & Cost Engine (DEMO G & J)
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
              EMPIRICAL BENCHMARKS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Real-time latency, token economics (USD & INR paise @ ₹{USD_TO_INR_EXCHANGE_RATE}/USD), and task accuracy across Google, Anthropic, DeepSeek, and Sovereign Local engines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleRunAllBenchmarks}
            disabled={isRunning}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Benchmarking...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Execute Matrix Benchmark
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Task Type Selector */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
          WORKLOAD:
        </span>
        <button
          onClick={() => setSelectedTaskType("dispatch_optimization")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedTaskType === "dispatch_optimization"
              ? "bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold"
              : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
        >
          Haversine Dispatch Optimization
        </button>
        <button
          onClick={() => setSelectedTaskType("code_generation")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedTaskType === "code_generation"
              ? "bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold"
              : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
        >
          Fullstack Monorepo Code Generation
        </button>
        <button
          onClick={() => setSelectedTaskType("fraud_detection")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedTaskType === "fraud_detection"
              ? "bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold"
              : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
        >
          KingPay Ledger Fraud Detection
        </button>
        <button
          onClick={() => setSelectedTaskType("multilingual_voice")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            selectedTaskType === "multilingual_voice"
              ? "bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold"
              : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
          }`}
        >
          Multilingual Soundbox DSP
        </button>
      </div>

      {/* Frontier Models Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-mono">
              <th className="p-4 font-bold">MODEL & PROVIDER</th>
              <th className="p-4 font-bold">INPUT COST / 1M</th>
              <th className="p-4 font-bold">OUTPUT COST / 1M</th>
              <th className="p-4 font-bold">P50 TTFT</th>
              <th className="p-4 font-bold">THROUGHPUT</th>
              <th className="p-4 font-bold">TOOL ACCURACY</th>
              <th className="p-4 font-bold">TASK SCORE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {modelKeys.map((key) => {
              const model = FRONTIER_MODELS[key];
              const benchmarkRun = activeBenchmarkRuns.find((r) => r.modelId === key);

              return (
                <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 font-sans text-xs">
                      {model.name}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase">
                      {model.provider}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-slate-800 font-bold">
                      ${model.inputCostPerMillionUsd.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      (₹{(model.inputCostPerMillionUsd * USD_TO_INR_EXCHANGE_RATE).toFixed(2)})
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="text-slate-800 font-bold">
                      ${model.outputCostPerMillionUsd.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      (₹{(model.outputCostPerMillionUsd * USD_TO_INR_EXCHANGE_RATE).toFixed(2)})
                    </span>
                  </td>
                  <td className="p-4 text-slate-700">
                    {model.typicalTtftMs}ms
                  </td>
                  <td className="p-4 text-slate-700">
                    {model.typicalTokensPerSec} tok/s
                  </td>
                  <td className="p-4">
                    <span className="text-emerald-700 font-bold">
                      {model.toolCallAccuracyPercent}%
                    </span>
                  </td>
                  <td className="p-4">
                    {benchmarkRun ? (
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                        {benchmarkRun.compositeEfficiencyIndex}/100
                      </span>
                    ) : (
                      <span className="text-slate-400">Awaiting Run</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Monthly Workload Head-to-Head Comparison Card */}
      <div className="p-6 border-t border-slate-200 bg-slate-50/60 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono block mb-1">
            Production Economic Arbitrage (5M Input / 1M Output Tokens / Mo)
          </span>
          <p className="text-xs text-slate-600 max-w-2xl">
            {comparison.rationale}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
          <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm text-center">
            <span className="text-[10px] text-slate-400 block">PRO RUNTIME</span>
            <span className="font-bold text-slate-900">₹{comparison.modelA.monthlyCostInr.toLocaleString('en-IN')}</span>
          </div>

          <span className="text-slate-400 font-bold">vs</span>

          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl shadow-sm text-center">
            <span className="text-[10px] text-emerald-600 block">FLASH RUNTIME</span>
            <span className="font-bold text-emerald-800">₹{comparison.modelB.monthlyCostInr.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
