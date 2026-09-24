import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Key, X, Server, CheckCircle2, AlertTriangle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ModelConnectionTestResult } from "@/lib/ai/real-model-registry";
import { getVerifiedModelRegistry } from "@/lib/ai/real-model-registry";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function SystemMasterSettingsModal({ isOpen, onClose }: Props) {
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [xaiKey, setXaiKey] = useState("");
  
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<ModelConnectionTestResult[]>([]);

  // Load key existence on mount
  useEffect(() => {
    if (isOpen) {
      fetch("/api/admin/settings").then(res => res.json()).then(data => {
        if (data.umar_os_apikey_gemini) setGeminiKey("********");
        if (data.umar_os_apikey_openai) setOpenaiKey("********");
        if (data.umar_os_apikey_anthropic) setAnthropicKey("********");
        if (data.umar_os_apikey_xai) setXaiKey("********");
      }).catch(err => console.error("Failed to fetch settings", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAll = async () => {
    const payload: Record<string, string> = {};
    if (geminiKey && geminiKey !== "********") payload.umar_os_apikey_gemini = geminiKey;
    if (openaiKey && openaiKey !== "********") payload.umar_os_apikey_openai = openaiKey;
    if (anthropicKey && anthropicKey !== "********") payload.umar_os_apikey_anthropic = anthropicKey;
    if (xaiKey && xaiKey !== "********") payload.umar_os_apikey_xai = xaiKey;
    
    if (Object.keys(payload).length > 0) {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      toast.success("API Keys Saved Securely to Server Database");
    } else {
      toast("No new keys to save.");
    }
  };

  const handleTestConnections = async () => {
    setIsTesting(true);
    await handleSaveAll(); 
    
    const registry = getVerifiedModelRegistry();
    const results: ModelConnectionTestResult[] = [];
    
    for (const model of registry) {
      if (model.provider !== "Local Sovereign") {
        toast(`Testing ${model.displayName}...`);
        const res = await fetch("/api/admin/test-connection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelId: model.id })
        });
        if (res.ok) {
          results.push(await res.json());
        }
      }
    }
    
    setTestResults(results);
    setIsTesting(false);
    
    const successCount = results.filter(r => r.success).length;
    if (successCount > 0) {
      toast.success(`${successCount} Providers Successfully Connected!`);
    } else {
      toast.error("All external providers failed or missing keys.");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-indigo-900/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">System External Dependencies</h2>
              <p className="text-[10px] text-zinc-400">Manage real API keys to unlock platform capabilities</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-xs text-emerald-200 flex gap-3 items-start">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <p>
              <strong className="text-emerald-400">Secure Server Integration.</strong> Keys are now stored purely in the server database. 
              Zero secrets are kept in browser memory or LocalStorage.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              LLM Provider API Keys
            </h3>

            {/* OpenAI */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-400">OPENAI_API_KEY (GPT-4o, o3-mini)</label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 font-mono"
                placeholder="sk-proj-..."
              />
            </div>

            {/* Anthropic */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-400">ANTHROPIC_API_KEY (Claude 3.7)</label>
              <input
                type="password"
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 font-mono"
                placeholder="sk-ant-..."
              />
            </div>

            {/* Gemini */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-400">GEMINI_API_KEY (Gemini 2.0)</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 font-mono"
                placeholder="AIza..."
              />
            </div>

            {/* xAI */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-400">XAI_API_KEY (Grok 2)</label>
              <input
                type="password"
                value={xaiKey}
                onChange={(e) => setXaiKey(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 font-mono"
                placeholder="xai-..."
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Button onClick={handleSaveAll} variant="primary" className="w-full bg-indigo-600 hover:bg-indigo-500">
              Save Keys to DB Vault
            </Button>
            <Button onClick={handleTestConnections} disabled={isTesting} className="w-full bg-emerald-600 hover:bg-emerald-500 flex items-center gap-2">
              <Play className="w-4 h-4" />
              {isTesting ? "Verifying..." : "Verify Connection"}
            </Button>
          </div>

          {/* Results */}
          {testResults.length > 0 && (
            <div className="space-y-2 mt-4 p-4 bg-black/40 border border-white/5 rounded-xl">
              <h3 className="text-xs font-bold text-white mb-3">Live Server Verification Logs</h3>
              {testResults.map((r, idx) => (
                <div key={idx} className="flex items-start justify-between text-[11px] pb-2 border-b border-white/5 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2">
                    {r.success ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5" /> : <X className="w-3.5 h-3.5 text-red-500 mt-0.5" />}
                    <div>
                      <span className="font-bold text-zinc-300">{r.modelId}</span>
                      <p className="text-zinc-500 font-mono">{r.message}</p>
                    </div>
                  </div>
                  <span className={`font-mono ${r.success ? "text-emerald-400" : "text-zinc-500"}`}>{r.latencyMs}ms</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
