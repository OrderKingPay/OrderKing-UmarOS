import { useQuery } from "@tanstack/react-query";
import { getDigitalWorkforceData } from "@/lib/server/business-os";
import { Badge } from "@/components/ui/badge";
import { Cpu, Activity, Clock, CheckCircle2, AlertTriangle, PlayCircle, History, Loader2, Bot } from "lucide-react";

export function DigitalWorkforceTab() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["digital-workforce-data"],
    queryFn: () => getDigitalWorkforceData(),
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-rose-400 text-sm font-mono flex-col gap-2 bg-white/5 backdrop-blur rounded-2xl border border-rose-500/20">
        <AlertTriangle className="size-6" />
        <span>Failed to load digital workforce data.</span>
      </div>
    );
  }

  const agents = data?.agents ?? [];
  const activeTasks = data?.activeTasks ?? [];
  const taskHistory = data?.taskHistory ?? [];

  return (
    <div className="space-y-6 text-slate-200 animate-fadeIn">
      {/* Header Stat Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col gap-1 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 z-10">
              <Bot className="size-4" />
              Active Agents
            </span>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 font-mono text-[9px] z-10">LIVE</Badge>
          </div>
          <span className="text-3xl font-black text-white z-10 font-mono">
            {agents.length}
          </span>
          <span className="text-xs text-slate-400 z-10">Total autonomous instances</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col gap-1 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5 z-10">
              <Activity className="size-4" />
              Tasks in Queue
            </span>
          </div>
          <span className="text-3xl font-black text-white z-10 font-mono">
            {activeTasks.length}
          </span>
          <span className="text-xs text-slate-400 z-10">Pending or running globally</span>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex flex-col gap-1 relative overflow-hidden shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 z-10">
              <History className="size-4" />
              Executions
            </span>
          </div>
          <span className="text-3xl font-black text-white z-10 font-mono">
            {taskHistory.length}
          </span>
          <span className="text-xs text-slate-400 z-10">Completed autonomous tasks</span>
        </div>
      </div>

      {/* Agents Registry */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-amber-500" />
            <h3 className="font-bold text-sm text-white">Agent Registry</h3>
          </div>
        </div>
        <div className="p-5">
          {agents.length === 0 ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
              <Bot className="size-8 text-slate-600 mb-2 opacity-50" />
              <span>0 Active Agents</span>
              <span className="text-xs text-slate-500">The digital workforce is currently idle.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {agents.map((agent: any) => (
                <div key={agent.id} className="p-4 rounded-xl bg-black/30 border border-white/5 flex items-start justify-between gap-3 hover:bg-black/50 transition-colors">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{agent.role}</span>
                      <Badge className={`text-[9px] font-mono border-white/10 ${agent.status === "AVAILABLE" ? "bg-emerald-500/20 text-emerald-300" : "bg-cyan-500/20 text-cyan-300"}`}>
                        {agent.status}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {agent.id.split("-")[0]}...</span>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end max-w-[120px]">
                    {Object.keys(agent.capabilities || {}).slice(0, 2).map((cap: string) => (
                      <span key={cap} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-300 whitespace-nowrap border border-white/10">
                        {cap}
                      </span>
                    ))}
                    {Object.keys(agent.capabilities || {}).length > 2 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                        +{Object.keys(agent.capabilities || {}).length - 2}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Task Queue */}
        <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl flex flex-col">
          <div className="px-5 py-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PlayCircle className="size-4 text-cyan-500" />
              <h3 className="font-bold text-sm text-white">Live Task Queue</h3>
            </div>
            <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[9px] font-mono">{activeTasks.length}</Badge>
          </div>
          <div className="p-5 flex-1 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {activeTasks.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-500 text-xs">
                No active tasks in the queue.
              </div>
            ) : (
              <div className="space-y-3">
                {activeTasks.map((task: any) => (
                  <div key={task.id} className="p-3 rounded-xl bg-black/30 border border-cyan-500/20 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-100">{task.role}</span>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[9px] font-mono animate-pulse">
                        {task.status}
                      </Badge>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono bg-black/40 p-2 rounded-lg truncate border border-white/5">
                      {JSON.stringify(task.payload)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Execution History */}
        <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 overflow-hidden shadow-2xl flex flex-col">
          <div className="px-5 py-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="size-4 text-emerald-500" />
              <h3 className="font-bold text-sm text-white">Execution Ledger</h3>
            </div>
          </div>
          <div className="p-5 flex-1 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {taskHistory.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-500 text-xs">
                No completed tasks found.
              </div>
            ) : (
              <div className="space-y-3">
                {taskHistory.map((task: any) => (
                  <div key={task.id} className="p-3 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {task.status === "COMPLETED" ? (
                          <CheckCircle2 className="size-3.5 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="size-3.5 text-rose-400" />
                        )}
                        <span className="text-xs font-bold text-white">{task.role}</span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {new Date(task.completed_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {task.cost && Number(task.cost) > 0 ? (
                      <span className="text-[9px] text-amber-400 font-mono font-bold">
                        Cost: ${Number(task.cost).toFixed(4)}
                      </span>
                    ) : null}
                    <div className="text-[10px] text-slate-400 font-mono bg-black/40 p-2 rounded-lg truncate border border-white/5">
                      {task.status === "FAILED" ? task.error_details : JSON.stringify(task.result)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

