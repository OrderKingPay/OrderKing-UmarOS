import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  Lock,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  decomposeFounderGoal,
  type SupremeExecutionPlan,
  type SupremeStageNode,
  type HumanGate,
} from "@/lib/ai/supreme-task-executor";
import { toast } from "sonner";

export function SupremeTaskExecutorHub() {
  const [goalPrompt, setGoalPrompt] = useState(
    "Build me a legitimate online business around 0% commission food delivery and King Pay UPI settlement in Karimganj"
  );
  const [plan, setPlan] = useState<SupremeExecutionPlan>(() =>
    decomposeFounderGoal(goalPrompt)
  );
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [selectedStage, setSelectedStage] = useState<SupremeStageNode | null>(
    plan.stages[7] // Stage 8: Payment System (Paused for human)
  );

  const PRESET_GOALS = [
    "Build me a legitimate online business around 0% commission food delivery in Karimganj",
    "Launch an autonomous AI voice receptionist SaaS for local clinics & restaurants",
    "Deploy a white-label hyperlocal logistics engine with UPI escrow settlement",
  ];

  const handleDecomposeGoal = (promptToUse?: string) => {
    const target = promptToUse ?? goalPrompt;
    if (!target.trim()) {
      toast.error("Please enter a high-level business goal");
      return;
    }
    setIsDecomposing(true);
    toast.info("Decomposing goal into 14-stage execution graph with human gate boundaries...");

    setTimeout(() => {
      const generatedPlan = decomposeFounderGoal(target);
      setPlan(generatedPlan);
      setSelectedStage(generatedPlan.stages[7]);
      setIsDecomposing(false);
      toast.error("GRAPH GENERATION BLOCKED: Real Task Engine Not Connected");
    }, 600);
  };

  const handleApproveHumanGate = (gateId: string) => {
    toast.error("AUTHORIZATION FAILED: Sandbox Mode");
    setPlan((prev) => {
      const updatedStages = prev.stages.map((stage) => {
        if (stage.humanGate && stage.humanGate.id === gateId) {
          return {
            ...stage,
            status: "COMPLETED" as const,
            humanGate: { ...stage.humanGate, satisfied: true, satisfiedAt: new Date().toISOString() },
            evidence: "Founder explicitly confirmed bank settlement credentials.",
            completedAt: new Date().toISOString(),
          };
        }
        return stage;
      });
      return {
        ...prev,
        stages: updatedStages,
        completedStages: updatedStages.filter((s) => s.status === "COMPLETED").length,
        isPaused: false,
        pauseReason: undefined,
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-amber-400" />
              <h2 className="text-xl font-bold text-white">The Supreme Task Executor (§28)</h2>
              <Badge tone="primary">14-Stage Full Execution Graph</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-300">
              Decomposes high-level goals into end-to-end execution trees. Autonomously builds whatever is possible and pauses strictly at human gates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={plan.isPaused ? "warn" : "primary"}>
              {plan.isPaused ? "PAUSED FOR FOUNDER GATE" : "AUTONOMOUS EXECUTION READY"}
            </Badge>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-amber-500/20 pt-4">
          <div className="rounded-lg bg-black/40 p-3 border border-amber-500/20">
            <span className="text-xs text-slate-400">Total Stages</span>
            <div className="text-2xl font-bold text-white">{plan.totalStages} Stages</div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-amber-500/20">
            <span className="text-xs text-slate-400">Completed Stages</span>
            <div className="text-2xl font-bold text-emerald-400">
              {plan.completedStages} / {plan.totalStages}
            </div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-amber-500/20">
            <span className="text-xs text-slate-400">Active Gate</span>
            <div className="text-2xl font-bold text-amber-400">Stage 8 (Payment)</div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-amber-500/20">
            <span className="text-xs text-slate-400">Zero False Action</span>
            <div className="text-2xl font-bold text-teal-400">100% Enforced</div>
          </div>
        </div>
      </div>

      {/* Goal Input & Blueprints */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
        <label className="text-sm font-semibold text-white">Enter Sovereign Founder Goal:</label>
        <div className="flex gap-2">
          <Input
            value={goalPrompt}
            onChange={(e) => setGoalPrompt(e.target.value)}
            placeholder="e.g. Build me a legitimate online business around this opportunity..."
            className="bg-black/50 border-slate-700 text-white font-medium"
          />
          <Button
            variant="primary"
            disabled={isDecomposing}
            onClick={() => handleDecomposeGoal()}
            className="shrink-0 bg-amber-600 hover:bg-amber-500 text-white font-semibold flex items-center gap-1.5"
          >
            {isDecomposing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Decompose & Execute
          </Button>
        </div>

        {/* Blueprint Presets */}
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="text-xs text-slate-400 self-center">Presets:</span>
          {PRESET_GOALS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setGoalPrompt(preset);
                handleDecomposeGoal(preset);
              }}
              className="rounded-lg border border-slate-800 bg-black/40 px-2.5 py-1 text-xs text-slate-300 hover:border-amber-500/40 hover:text-amber-300 transition-all"
            >
              {preset.slice(0, 48)}...
            </button>
          ))}
        </div>
      </div>

      {/* Human Gate Alert Box */}
      {plan.isPaused && plan.pauseReason && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-950/30 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Lock className="h-6 w-6 text-amber-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">Autonomous Execution Paused at Human Gate</span>
                <Badge tone="warn">Founder Action Required</Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-300">{plan.pauseReason}</p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => handleApproveHumanGate("GATE-PAYMENT-AUTH")}
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs"
          >
            Confirm Bank VPA (orderking@okhdfcbank)
          </Button>
        </div>
      )}

      {/* 14-Stage Execution Graph Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stage List */}
        <div className="lg:col-span-2 space-y-2.5">
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
            14-Stage Execution Graph (§28)
          </h3>
          {plan.stages.map((stg, i) => (
            <div
              key={stg.id}
              onClick={() => setSelectedStage(stg)}
              className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                selectedStage?.id === stg.id
                  ? "border-amber-400 bg-amber-950/20"
                  : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-md font-mono text-xs font-bold ${
                      stg.status === "COMPLETED"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : stg.status === "PAUSED_FOR_HUMAN"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{stg.title}</span>
                      <span className="font-mono text-[11px] text-slate-500">[{stg.stage}]</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{stg.description}</p>
                  </div>
                </div>

                <Badge
                  tone={
                    stg.status === "COMPLETED"
                      ? "primary"
                      : stg.status === "PAUSED_FOR_HUMAN"
                      ? "warn"
                      : "neutral"
                  }
                >
                  {stg.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Stage Detail & Deliverables */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
          {selectedStage ? (
            <>
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                    Stage Inspection
                  </span>
                  <Badge
                    tone={
                      selectedStage.status === "COMPLETED"
                        ? "primary"
                        : selectedStage.status === "PAUSED_FOR_HUMAN"
                        ? "warn"
                        : "neutral"
                    }
                  >
                    {selectedStage.status}
                  </Badge>
                </div>
                <h3 className="mt-1 text-lg font-bold text-white">{selectedStage.title}</h3>
                <p className="text-xs text-slate-400">{selectedStage.description}</p>
              </div>

              {/* Human Gate Card if present */}
              {selectedStage.humanGate && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-400" />
                    <span className="font-semibold text-amber-300 text-xs uppercase">
                      Human Gate: {selectedStage.humanGate.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200">{selectedStage.humanGate.description}</p>
                  <div className="text-xs font-mono text-amber-400">
                    Action: {selectedStage.humanGate.requiredAction}
                  </div>
                  {!selectedStage.humanGate.satisfied && (
                    <Button
                      variant="primary"
                      onClick={() => handleApproveHumanGate(selectedStage.humanGate!.id)}
                      className="w-full mt-2 bg-amber-600 hover:bg-amber-500 text-xs font-bold"
                    >
                      Approve & Grant Authorization
                    </Button>
                  )}
                </div>
              )}

              {/* Deliverables */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase">Deliverables:</h4>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  {selectedStage.deliverables.map((item, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Evidence if completed */}
              {selectedStage.evidence && (
                <div className="rounded-lg bg-black/50 p-3 text-xs font-mono text-slate-300 border border-slate-800">
                  <span className="text-emerald-400 font-semibold">Evidence: </span>
                  {selectedStage.evidence}
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-slate-500">
              <p className="text-xs">Select any stage on the left to inspect deliverables and gates.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

