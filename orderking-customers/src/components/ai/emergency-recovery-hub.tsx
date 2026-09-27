import { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  History,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  INITIAL_DEPLOYMENT_HISTORY,
  executeEmergencyRecoverySequence,
  type DeploymentSnapshot,
  type IncidentRecord,
  type RecoveryStage,
} from "@/lib/ai/emergency-recovery";
import { toast } from "sonner";

export function EmergencyRecoveryHub() {
  const [history, setHistory] = useState<DeploymentSnapshot[]>(INITIAL_DEPLOYMENT_HISTORY);
  const [activeIncident, setActiveIncident] = useState<IncidentRecord | null>(null);
  const [stageEvents, setStageEvents] = useState<
    { stage: RecoveryStage; detail: string; timestamp: string }[]
  >([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const RECOVERY_STAGES: RecoveryStage[] = [
    "DETECT",
    "FREEZE",
    "COLLECT_LOGS",
    "DIAGNOSE",
    "ROLLBACK",
    "FIX",
    "TEST",
    "REDEPLOY",
    "VERIFY",
  ];

  const handleSimulateIncident = () => {
    setIsSimulating(true);
    toast.error("Emergency Failure Injected: Simulating deployment regression...");

    setTimeout(() => {
      const { incident, stageHistory } = executeEmergencyRecoverySequence(
        "Simulated 500 error on checkout route: unhandled promise rejection",
        "v2.3.9"
      );
      setActiveIncident(incident);
      setStageEvents(stageHistory);
      setIsSimulating(false);
      toast.success("Emergency Recovery Sequence Executed: System Restored & Verified!");
    }, 700);
  };

  const handleManualRollback = (version: string) => {
    toast.info(`Executing atomic rollback to ${version}...`);
    setTimeout(() => {
      setHistory((prev) =>
        prev.map((dep) =>
          dep.version === version
            ? { ...dep, status: "HEALTHY", summary: `Rolled back to ${version} by founder command` }
            : dep
        )
      );
      toast.success(`Successfully rolled back edge deployment to ${version}!`);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-rose-400" />
              <h2 className="text-xl font-bold text-white">Emergency Recovery & Deployment Rollback (§23)</h2>
              <Badge tone="danger">Circuit Breaker Equipped</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-300">
              8-stage automated recovery state machine: freeze risky changes, diagnose root cause, execute atomic rollback, and re-verify.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              disabled={isSimulating}
              onClick={handleSimulateIncident}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold"
            >
              {isSimulating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Executing Recovery...
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4" />
                  Simulate Incident & Auto-Recover
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Telemetry Bar */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-rose-500/20 pt-4">
          <div className="rounded-lg bg-black/40 p-3 border border-rose-500/20">
            <span className="text-xs text-slate-400">Current Deployment</span>
            <div className="text-2xl font-bold text-white">{history[0].version}</div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-rose-500/20">
            <span className="text-xs text-slate-400">System Health</span>
            <div className="text-2xl font-bold text-emerald-400">HEALTHY</div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-rose-500/20">
            <span className="text-xs text-slate-400">Rollback Target</span>
            <div className="text-2xl font-bold text-amber-400">{history[1]?.version ?? "None"}</div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-rose-500/20">
            <span className="text-xs text-slate-400">MTTR (Mean Time to Recover)</span>
            <div className="text-2xl font-bold text-teal-400">&lt; 15 seconds</div>
          </div>
        </div>
      </div>

      {/* 8-Stage Recovery State Machine Visualizer */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-bold text-white">8-Stage Autonomous Recovery Loop</h3>
          <span className="text-xs text-slate-400">
            {activeIncident ? "Status: INCIDENT RESOLVED" : "Status: STANDBY (MONITORING)"}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
          {RECOVERY_STAGES.map((stg, i) => {
            const isCompleted = activeIncident !== null;
            return (
              <div
                key={stg}
                className={`rounded-lg border p-2 text-center text-xs space-y-1 transition-all ${
                  isCompleted
                    ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                    : "border-slate-800 bg-black/40 text-slate-500"
                }`}
              >
                <div className="font-mono text-[10px] text-slate-400">{i + 1}</div>
                <div className="font-bold">{stg.replace("_", " ")}</div>
              </div>
            );
          })}
        </div>

        {/* Incident Details & Log Stream */}
        {activeIncident && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-black/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white text-sm">
                Incident Diagnostic Summary [{activeIncident.id}]
              </span>
              <Badge tone="primary">RESOLVED</Badge>
            </div>
            <p className="text-xs text-slate-300">{activeIncident.diagnosis}</p>

            <div className="space-y-1.5 border-t border-slate-800 pt-3">
              <span className="text-xs font-semibold text-rose-400">Execution Timeline:</span>
              <div className="space-y-1 text-xs font-mono">
                {stageEvents.map((evt, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-300">
                    <span className="text-emerald-400 font-bold">[{evt.stage}]</span>
                    <span className="truncate max-w-xl text-slate-400">{evt.detail}</span>
                    <span className="text-[11px] text-slate-600">Just now</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deployment History & Rollback Console */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-white">Deployment Snapshot History</h3>
            <p className="text-xs text-slate-400">
              Immutable deployment hashes ready for zero-downtime rollback.
            </p>
          </div>
          <History className="h-5 w-5 text-slate-400" />
        </div>

        <div className="space-y-3">
          {history.map((dep, idx) => (
            <div
              key={dep.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-black/30 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{dep.version}</span>
                  <span className="font-mono text-xs text-slate-400">({dep.commitHash})</span>
                  <Badge tone={dep.status === "HEALTHY" ? "primary" : "warn"}>{dep.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-400">{dep.summary}</p>
              </div>

              <div className="flex items-center gap-3">
                {idx !== 0 && (
                  <Button
                    variant="outline"
                    onClick={() => handleManualRollback(dep.version)}
                    className="flex items-center gap-1.5 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-950/40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Rollback to this Version
                  </Button>
                )}
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(dep.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
