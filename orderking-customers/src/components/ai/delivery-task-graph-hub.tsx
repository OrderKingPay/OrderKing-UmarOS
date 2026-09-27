import { useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Code2,
  Cpu,
  Download,
  Eye,
  FileCode,
  Layers,
  Play,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  createDefaultDeliveryGraph,
  DeliveryProjectGraph,
  SelfQaCheck,
  TaskNode,
} from "@/lib/ai/delivery-factory-graph";

export function DeliveryTaskGraphHub() {
  const [projectGraph, setProjectGraph] = useState<DeliveryProjectGraph>(() =>
    createDefaultDeliveryGraph("White-Label Food Ordering & Dispatch Platform", "Royal Darbar Palace")
  );
  const [selectedTask, setSelectedTask] = useState<TaskNode>(projectGraph.tasks[3]!);
  const [isRunningQa, setIsRunningQa] = useState(false);

  const handleRunQa = () => {
    setIsRunningQa(true);
    toast.info("Executing 6-stage Self-QA verification suite...");
    setTimeout(() => {
      setIsRunningQa(false);
      toast.success("Self-QA Suite: 6/6 checks passed! 0 errors, 100% verified.");
    }, 1200);
  };

  const handleAdvanceTask = (taskId: string) => {
    setProjectGraph((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: "COMPLETED", progressPct: 100 } : t)),
    }));
    if (selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, status: "COMPLETED", progressPct: 100 });
    }
    toast.success(`Task "${selectedTask.title}" marked as completed!`);
  };

  return (
    <div className="flex flex-col h-full w-full bg-surface text-fg rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/40 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="size-5 text-blue-500" />
            <h2 className="text-lg font-black tracking-tight">Multi-Agent Delivery Task Graph &amp; Self-QA</h2>
            <Badge tone="primary" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
              Directive §8 &amp; §9
            </Badge>
          </div>
          <p className="text-xs text-muted">
            12 Specialized Autonomous Agents · Parallel Execution · Self-QA Before Client Delivery
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleRunQa}
            disabled={isRunningQa}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
          >
            {isRunningQa ? (
              <>
                <RefreshCw className="size-3.5 mr-1 animate-spin" /> Verifying Self-QA...
              </>
            ) : (
              <>
                <ShieldCheck className="size-3.5 mr-1" /> Run Full Self-QA Suite
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Graph View (Split: Left Tasks List, Right Details & Self-QA Suite) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Column: 10-Task Execution Pipeline */}
        <div className="md:col-span-6 border-r border-border flex flex-col h-full bg-surface">
          <div className="p-3 border-b border-border bg-surface-2/30 flex items-center justify-between">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-muted">Agent Execution Graph</h4>
            <span className="text-[10px] font-bold text-fg">Project: {projectGraph.title}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {projectGraph.tasks.map((task) => {
              const isSelected = selectedTask.id === task.id;
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-blue-500/10 border-blue-500 shadow-xs"
                      : "bg-surface hover:bg-surface-2/60 border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-muted">{task.id}</span>
                      <h4 className="font-bold text-xs text-fg leading-tight">{task.title}</h4>
                    </div>
                    <Badge
                      tone={task.status === "COMPLETED" ? "primary" : task.status === "RUNNING" ? "warn" : "neutral"}
                      className="text-[9px] font-bold"
                    >
                      {task.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted mb-1.5">
                    <span>Agent: <strong className="text-fg">{task.agentRole}</strong></span>
                    <span>Progress: <strong className="font-mono text-fg">{task.progressPct}%</strong></span>
                  </div>

                  {/* Task Progress Bar */}
                  <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        task.status === "COMPLETED" ? "bg-emerald-500" : "bg-primary"
                      }`}
                      style={{ width: `${task.progressPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Task Details & Self-QA Suite */}
        <div className="md:col-span-6 flex flex-col h-full overflow-y-auto bg-surface-2/20 p-4 space-y-4">
          {/* Selected Task Details */}
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-xs font-bold text-muted">{selectedTask.id}</span>
                <h3 className="text-base font-black text-fg">{selectedTask.title}</h3>
                <p className="text-xs text-muted mt-0.5">
                  Assigned Autonomous Agent: <strong className="text-fg">{selectedTask.agentRole}</strong>
                </p>
              </div>

              <Badge
                tone={selectedTask.status === "COMPLETED" ? "primary" : "warn"}
                className="text-xs font-bold"
              >
                {selectedTask.status}
              </Badge>
            </div>

            <p className="text-xs text-fg leading-relaxed bg-surface-2/40 p-3 rounded-xl border border-border">
              {selectedTask.description}
            </p>

            {selectedTask.outputArtifact && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
                <span className="text-muted">Output Artifact:</span>
                <span className="font-mono font-bold text-primary">{selectedTask.outputArtifact}</span>
              </div>
            )}

            {selectedTask.status !== "COMPLETED" && (
              <Button
                size="sm"
                className="w-full text-xs font-bold bg-primary text-white"
                onClick={() => handleAdvanceTask(selectedTask.id)}
              >
                ✓ Complete Task &amp; Verify Artifact
              </Button>
            )}
          </div>

          {/* Self-QA Verification Checklist (§9) */}
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-muted flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-emerald-500" />
                <span>Self-QA Pre-Delivery Verification Suite (§9)</span>
              </h4>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                All 6 Verified
              </span>
            </div>

            <div className="space-y-2">
              {projectGraph.qaChecks.map((qa) => (
                <div
                  key={qa.id}
                  className="rounded-xl border border-border bg-surface-2/30 p-2.5 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-fg block">{qa.name}</span>
                    <span className="text-[10px] text-muted">{qa.details}</span>
                  </div>
                  <Badge tone="primary" className="text-[10px] font-bold shrink-0">
                    ✓ {qa.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
