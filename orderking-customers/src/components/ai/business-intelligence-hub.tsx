import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Pause,
  Play,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  generateBusinessIntelligenceReport,
  type BusinessIntelligenceReport,
} from "@/lib/ai/business-intelligence";
import {
  INITIAL_SCHEDULED_JOBS,
  executeScheduledJob,
  type ScheduledJob,
  type ScheduleExecutionEvent,
} from "@/lib/ai/autonomous-scheduler";
import { toast } from "sonner";

export function BusinessIntelligenceHub() {
  const [report, setReport] = useState<BusinessIntelligenceReport>(() =>
    generateBusinessIntelligenceReport()
  );
  const [jobs, setJobs] = useState<ScheduledJob[]>(INITIAL_SCHEDULED_JOBS);
  const [executionLogs, setExecutionLogs] = useState<ScheduleExecutionEvent[]>([]);
  const [executingJobId, setExecutingJobId] = useState<string | null>(null);

  const handleToggleJob = (jobId: string) => {
    setJobs((prev) =>
      prev.map((job) => {
        if (job.id === jobId) {
          const next = !job.enabled;
          toast.info(next ? `Resumed schedule: ${job.name}` : `Paused schedule: ${job.name}`);
          return { ...job, enabled: next };
        }
        return job;
      })
    );
  };

  const handleRunNow = async (jobId: string) => {
    setExecutingJobId(jobId);
    try {
      const event = await executeScheduledJob(jobId);
      setExecutionLogs((prev) => [event, ...prev]);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                lastRunTimestamp: event.timestamp,
                lastStatus: event.status,
                lastOutputSummary: event.outputSummary,
              }
            : j
        )
      );
      toast.success(`Executed ${event.jobName} successfully!`);
    } catch {
      toast.error("Execution failed for scheduled job.");
    } finally {
      setExecutingJobId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Business Intelligence & Autonomous Schedules (§15, §16)</h2>
              <Badge tone="primary">Empirical Reality</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-300">
              Continuously analyzes revenue drivers, highest-margin services, conversion bottlenecks, and autonomous background execution loops.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setReport(generateBusinessIntelligenceReport());
                toast.success("Business Intelligence Metrics Recomputed!");
              }}
              className="flex items-center gap-2 border-indigo-500/40 text-indigo-300 hover:bg-indigo-950/40"
            >
              <RefreshCw className="h-4 w-4" />
              Recompute Insights
            </Button>
          </div>
        </div>

        {/* Executive Telemetry Grid */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-indigo-500/20 pt-4">
          <div className="rounded-lg bg-black/40 p-3 border border-indigo-500/20">
            <span className="text-xs text-slate-400">Client Retention</span>
            <div className="text-2xl font-bold text-emerald-400">{report.clientRetentionRatePct}%</div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-indigo-500/20">
            <span className="text-xs text-slate-400">Total Repeat Revenue</span>
            <div className="text-2xl font-bold text-white">
              ₹{(report.totalRepeatRevenueInr / 100000).toFixed(2)} Lakhs
            </div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-indigo-500/20">
            <span className="text-xs text-slate-400">Top Channel Conversion</span>
            <div className="text-2xl font-bold text-amber-400">87.5% (Referral)</div>
          </div>
          <div className="rounded-lg bg-black/40 p-3 border border-indigo-500/20">
            <span className="text-xs text-slate-400">Active Schedules</span>
            <div className="text-2xl font-bold text-teal-400">
              {jobs.filter((j) => j.enabled).length} / {jobs.length} Active
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Insights Cards */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
          Strategic Empirical Insights (§15)
        </h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          {report.insights.map((insight, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-lg border border-slate-800 bg-black/40 p-3 text-xs text-slate-300"
            >
              <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two-Column Analytics Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Performance Leaderboard */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white">Service Margin & Revenue Ranking</h3>
            <span className="text-xs text-slate-400">Ranked by Revenue</span>
          </div>

          <div className="space-y-3">
            {report.topRevenueServices.map((svc) => (
              <div
                key={svc.serviceId}
                className="rounded-lg border border-slate-800 bg-black/30 p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white text-sm">{svc.name}</span>
                  <Badge tone="primary">{svc.averageMarginPct}% Margin</Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Completed: {svc.completedCount} Projects</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    ₹{(svc.totalRevenueInr / 1000).toFixed(0)}k Total
                  </span>
                  <span>Turnaround: {svc.averageDeliveryDays}d</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acquisition Channels & Bottlenecks */}
        <div className="space-y-6">
          {/* Acquisition Channels */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white">Acquisition Channel Conversion</h3>
              <span className="text-xs text-slate-400">Proposals to Won Deals</span>
            </div>

            <div className="space-y-2.5">
              {report.channelConversionRates.map((ch) => (
                <div
                  key={ch.channel}
                  className="flex items-center justify-between rounded-lg border border-slate-800 bg-black/30 p-2.5 text-xs"
                >
                  <span className="font-medium text-slate-200">{ch.channel.replace("_", " ")}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400">{ch.wonDeals} deals won</span>
                    <span className="font-bold text-emerald-400">{ch.conversionRatePct}%</span>
                    <span className="font-mono text-white">₹{(ch.totalRevenueInr / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Bottlenecks */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h3 className="font-bold text-white">Delivery Bottleneck Diagnosis</h3>
            </div>

            <div className="space-y-2">
              {report.deliveryBottlenecks.map((bn, idx) => (
                <div key={idx} className="rounded-lg bg-black/40 p-3 border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-300">{bn.stage}</span>
                    <span className="text-slate-400">
                      Avg: {bn.averageDurationHours}h (Target: {bn.standardDurationHours}h)
                    </span>
                  </div>
                  <p className="text-slate-400">{bn.commonRootCause}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Autonomous Operating Schedule Control Center (§16) */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-bold text-white">Autonomous Background Schedules (§16)</h3>
            <p className="text-xs text-slate-400">
              Autonomous execution loops for opportunity hunting, prospect enrichment, and payment sweeps.
            </p>
          </div>
          <Badge tone="primary">Founder Controllable</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className={`rounded-xl border p-4 space-y-3 transition-all ${
                job.enabled
                  ? "border-slate-800 bg-black/40"
                  : "border-slate-900 bg-black/20 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <Badge tone={job.enabled ? "primary" : "neutral"}>{job.interval}</Badge>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleJob(job.id)}
                    className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800"
                    title={job.enabled ? "Pause Schedule" : "Resume Schedule"}
                  >
                    {job.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                  </button>
                  <Button
                    variant="outline"
                    disabled={executingJobId === job.id}
                    onClick={() => handleRunNow(job.id)}
                    className="h-7 px-2 text-xs border-indigo-500/40 text-indigo-300"
                  >
                    {executingJobId === job.id ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      "Run Now"
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white text-sm">{job.name}</h4>
                <p className="mt-1 text-xs text-slate-400">{job.description}</p>
              </div>

              <div className="border-t border-slate-800/80 pt-2 text-[11px] text-slate-500 space-y-1">
                <div>Last Output: {job.lastOutputSummary ?? "Pending execution"}</div>
                <div>Status: {job.lastStatus ?? "IDLE"}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Execution Log Table */}
        {executionLogs.length > 0 && (
          <div className="mt-4 rounded-lg border border-slate-800 bg-black/50 p-3 space-y-2">
            <span className="text-xs font-semibold text-indigo-400">Recent Execution Events:</span>
            <div className="space-y-1 font-mono text-xs">
              {executionLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-slate-300">
                  <span>[{log.jobName}] {log.outputSummary}</span>
                  <span className="text-emerald-400">{log.executionDurationMs}ms</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
