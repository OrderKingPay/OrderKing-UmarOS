import { useState } from "react";
import { toast } from "sonner";
import {
  Code,
  Copy,
  ExternalLink,
  Eye,
  FileCode,
  FolderTree,
  Globe,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Send,
  Server,
  Sparkles,
  Terminal,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export type CreatedProject = {
  id: string;
  name: string;
  type: "website" | "app" | "business_system" | "product_page";
  description: string;
  liveUrl: string;
  deployedAt: string;
  status: "LIVE" | "BUILDING" | "READY";
  filesCount: number;
  monthlyRevenueEst: string;
};

export function PremiumCreatorEngine() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "preview" | "files">("preview");

  const [projects, setProjects] = useState<CreatedProject[]>([]);

  const PRESET_PROMPTS = [
    "Build a complete multi-vendor organic grocery marketplace with 15-min delivery and UPI soundbox",
    "Create a high-converting luxury hotel booking website with zero commission and instant PNR generation",
    "Generate an AI-powered automated digital agency client portal with invoicing and contract signing",
    "Build a course and webinar sales page with instant Razorpay/UPI payment and locked video vault",
  ];

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a command or select a preset prompt");
      return;
    }
    setIsGenerating(true);
    setGeneratedCode(null);

    throw new Error("NO live CLAIMS: Real generation API is not connected.");

  };

  return (
    <div className="space-y-6">
      {/* APPLICATION CREATOR HEADER */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs relative overflow-hidden text-slate-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex size-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
              <Sparkles className="size-6 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Application Deployment &amp; Template Engine
                </h2>
                <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-mono text-[10px] font-semibold">
                  ENTERPRISE BUILDER
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure application templates, micro-frontends, and automated deployment pipelines.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              PIPELINE READY
            </span>
          </div>
        </div>

        {/* PROMPT INPUT BAR */}
        <div className="mt-5 space-y-3">
          <div className="relative">
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create (e.g. 'Build a complete digital product store with UPI payment link, automated licensing, and customer portal')..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-inner font-sans resize-none"
            />
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="absolute right-3 bottom-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 shadow-xs flex items-center gap-2 rounded-lg"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Generating &amp; Deploying...
                </>
              ) : (
                <>
                  <Rocket className="size-4" />
                  Deploy Pipeline
                </>
              )}
            </Button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 pl-1">
              Presets:
            </span>
            {PRESET_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(p)}
                className="shrink-0 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1 text-xs text-slate-700 transition"
              >
                {p.slice(0, 40)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* GENERATED PREVIEW & CODE INSPECTOR */}
      {generatedCode && (
        <div className="rounded-2xl border border-white/15 bg-black/80 p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={activeTab === "preview" ? "default" : "outline"}
                onClick={() => setActiveTab("preview")}
                className="text-xs font-bold gap-1.5"
              >
                <Eye className="size-3.5" />
                Live Preview
              </Button>
              <Button
                size="sm"
                variant={activeTab === "editor" ? "default" : "outline"}
                onClick={() => setActiveTab("editor")}
                className="text-xs font-bold gap-1.5"
              >
                <Code className="size-3.5" />
                Source Code
              </Button>
              <Button
                size="sm"
                variant={activeTab === "files" ? "default" : "outline"}
                onClick={() => setActiveTab("files")}
                className="text-xs font-bold gap-1.5"
              >
                <FolderTree className="size-3.5" />
                Project Tree (32 Files)
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard?.writeText(generatedCode);
                  toast.success("Source code copied to clipboard!");
                }}
                className="text-xs font-bold gap-1"
              >
                <Copy className="size-3.5" />
                Copy Code
              </Button>
              <a
                href={projects[0]?.liveUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:underline px-2"
              >
                <span>Visit Live URL</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          {activeTab === "editor" && (
            <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 overflow-x-auto max-h-96 scrollbar-thin border border-white/10">
              {generatedCode}
            </pre>
          )}

          {activeTab === "preview" && (
            <div className="rounded-xl border border-white/10 bg-slate-950 p-6 text-center space-y-4">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 text-xs font-bold">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE PRODUCTION CONTAINER
              </div>
              <h3 className="text-2xl font-black text-white">{projects[0]?.name}</h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">{projects[0]?.description}</p>
              <div className="flex justify-center gap-3 pt-2">
                <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-6">
                  Experience Live Deployment ➔
                </Button>
              </div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-300">
              {["src/main.tsx", "src/App.tsx", "src/routes/index.tsx", "src/routes/checkout.tsx", "src/components/hero.tsx", "src/components/pricing.tsx", "src/lib/payments.ts", "package.json"].map((f) => (
                <div key={f} className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                  <FileCode className="size-4 text-amber-400" />
                  <span className="truncate">{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CREATED PROJECTS DIRECTORY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="size-5 text-slate-600" />
            <h3 className="text-base font-bold text-slate-900">Active Deployed Environments ({projects.length})</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Telemetry Active</span>
        </div>

        {projects.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
            <Globe className="size-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <span>No deployment configurations active. Configure a template above to generate deployment pipelines.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                      ● {proj.status}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-mono">{proj.deployedAt}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{proj.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{proj.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Est. Revenue</span>
                    <span className="text-xs font-bold text-slate-800 font-mono">{proj.monthlyRevenueEst}/mo</span>
                  </div>
                  <a
                    href={proj.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    <span>Open Live</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
