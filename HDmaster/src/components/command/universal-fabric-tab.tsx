import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Play, Activity, AlertCircle, FileText, Settings, Lock } from "lucide-react";

export function UniversalFabricTab() {
  const [executing, setExecuting] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  const executeTool = async (command: string, id: string) => {
    setExecuting(id);
    try {
      const res = await fetch("/api/v1/founder/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Execution failed");
      }
      setResults(prev => ({ ...prev, [id]: data }));
      toast.success(`Executed: ${command}`);
    } catch (e: any) {
      setResults(prev => ({ ...prev, [id]: { status: 'ERROR', message: e.message } }));
      toast.error(`Error: ${e.message}`);
    } finally {
      setExecuting(null);
    }
  };

  const tools = [
    { id: "state", icon: Activity, name: "Show complete platform state", color: "text-blue-400" },
    { id: "exceptions", icon: AlertCircle, name: "Find every unresolved operational exception", color: "text-red-400" },
    { id: "cancellations", icon: FileText, name: "Diagnose why cancellations increased", color: "text-amber-400" },
    { id: "reconciliation", icon: Settings, name: "Show today's financial reconciliation", color: "text-emerald-400" },
    { id: "refunds", icon: Lock, name: "Prepare eligible refunds", color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-black p-5 shadow-xl space-y-4">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Lock className="size-5 text-indigo-400" />
            Universal Conversational Control Fabric
          </h3>
          <p className="text-xs text-indigo-300/70 mt-1 max-w-2xl font-mono">
            Execute native system tools directly against the production database without navigating menus.
            This matrix bypasses the frontend and issues strictly verified backend operations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tools.map((t) => {
            const Icon = t.icon;
            const res = results[t.id];
            const isRunning = executing === t.id;

            return (
              <div key={t.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`size-4 ${t.color}`} />
                      <span className="text-sm font-bold text-white">{t.name}</span>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => executeTool(t.name, t.id)}
                      disabled={isRunning}
                      className="bg-indigo-500 hover:bg-indigo-400 text-white h-7 px-3 text-[10px]"
                    >
                      {isRunning ? "Executing..." : <><Play className="size-3 mr-1" /> Run</>}
                    </Button>
                  </div>
                </div>

                {res && (
                  <div className="mt-3 p-3 bg-black/50 rounded-lg font-mono text-[10px] text-zinc-300 overflow-x-auto max-h-48 overflow-y-auto border border-white/5 shadow-inner">
                    {res.status === 'SUCCESS' ? (
                       <pre className="whitespace-pre-wrap">{JSON.stringify(res.data, null, 2)}</pre>
                    ) : (
                       <span className="text-red-400">{res.message}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
