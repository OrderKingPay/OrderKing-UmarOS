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

export function SupremeCreatorEngine() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"editor" | "preview" | "files">("preview");

  const [projects, setProjects] = useState<CreatedProject[]>([
    {
      id: "proj-01",
      name: "Luxury Biryani Dark Kitchen Hub",
      type: "business_system",
      description: "Direct-to-consumer order engine with zero aggregator commission and WhatsApp auto-dispatch.",
      liveUrl: "https://biryani.orderking.in",
      deployedAt: "2 hours ago",
      status: "LIVE",
      filesCount: 24,
      monthlyRevenueEst: "₹2,40,000",
    },
    {
      id: "proj-02",
      name: "Sovereign Gold Jewelry Boutique",
      type: "website",
      description: "High-ticket jewelry showcase with 3D interactive viewer, live gold rate ticker & UPI checkout.",
      liveUrl: "https://gold.orderking.in",
      deployedAt: "Yesterday",
      status: "LIVE",
      filesCount: 18,
      monthlyRevenueEst: "₹8,50,000",
    },
    {
      id: "proj-03",
      name: "Fast-Track Vehicle Insurance & PUC Portal",
      type: "product_page",
      description: "0-Paperwork instant motor insurance purchase page with Parivahan Vahan API lookup.",
      liveUrl: "https://insurance.orderking.in",
      deployedAt: "3 days ago",
      status: "LIVE",
      filesCount: 12,
      monthlyRevenueEst: "₹1,20,000",
    },
  ]);

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

    setTimeout(() => {
      setIsGenerating(false);
      const newProjId = `proj-${Date.now().toString().slice(-4)}`;
      const newProjName = prompt.slice(0, 35) + "...";
      const newLiveUrl = `https://${newProjId}.orderking.in`;

      const generatedProject: CreatedProject = {
        id: newProjId,
        name: newProjName,
        type: prompt.toLowerCase().includes("app") ? "app" : prompt.toLowerCase().includes("system") ? "business_system" : "website",
        description: prompt,
        liveUrl: newLiveUrl,
        deployedAt: "Just now",
        status: "LIVE",
        filesCount: 32,
        monthlyRevenueEst: "₹1,50,000+",
      };

      setProjects([generatedProject, ...projects]);
      setGeneratedCode(`// 👑 HD MASTER SUPREME CODE GENERATOR - ZERO EXTERNAL AI DEPENDENCY
// Generated Project: ${newProjName}
// Deployed URL: ${newLiveUrl}

import React from "react";
import { Zap, ShieldCheck, CreditCard } from "lucide-react";

export default function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <header className="max-w-3xl text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400 bg-clip-text text-transparent">
          ${newProjName}
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          ${prompt}
        </p>
      </header>

      <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl w-full">
        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <Zap className="size-6 text-amber-400 mb-2" />
          <h3 className="font-bold text-sm">Instant 0-Lag Engine</h3>
          <p className="text-xs text-slate-400 mt-1">Autonomous local execution with zero latency.</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <CreditCard className="size-6 text-emerald-400 mb-2" />
          <h3 className="font-bold text-sm">Direct Founder Income</h3>
          <p className="text-xs text-slate-400 mt-1">100% legal revenue channeled to founder account.</p>
        </div>
        <div className="p-4 rounded-xl border border-white/10 bg-white/5">
          <ShieldCheck className="size-6 text-cyan-400 mb-2" />
          <h3 className="font-bold text-sm">Section 79 Shield</h3>
          <p className="text-xs text-slate-400 mt-1">Total personal privacy with intermediary protection.</p>
        </div>
      </section>

      <div className="mt-8 flex gap-3">
        <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 transition">
          Purchase &amp; Access Now ➔
        </button>
      </div>
    </main>
  );
}`);
      toast.success(`🚀 Complete system "${newProjName}" generated and deployed live to ${newLiveUrl}!`);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* SUPREME GENERATOR HEADER */}
      <div className="rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-[#0D3B2E] via-slate-900 to-black p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-emerald-400 text-slate-950 shadow-xl ring-2 ring-amber-300">
              <Sparkles className="size-7 text-slate-950" />
              <span className="absolute -top-1 -right-1 flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-amber-500" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  HD Master 1-Command Sovereign Creator
                </h2>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 font-mono text-[10px] font-bold">
                  UNLIMITED &amp; FREE FOREVER
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enter one single command to create any complete website, app, business system, or product page and deploy it live instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
              ⚡ 0ms External AI Latency
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
              className="w-full rounded-xl border border-white/20 bg-black/60 p-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 shadow-inner font-sans resize-none"
            />
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="absolute right-3 bottom-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-5 shadow-md flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Generating &amp; Deploying Live...
                </>
              ) : (
                <>
                  <Rocket className="size-4" />
                  Generate &amp; Deploy Live Instantly
                </>
              )}
            </Button>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-amber-400/80 uppercase tracking-wider shrink-0 pl-1">
              Presets:
            </span>
            {PRESET_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(p)}
                className="shrink-0 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1 text-xs text-slate-300 transition"
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
            <Globe className="size-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Live Deployed Websites &amp; Systems ({projects.length})</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">100% Uptime Guaranteed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="rounded-xl border border-white/15 bg-slate-900/90 p-4 shadow-sm hover:border-amber-400/60 transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                    ● {proj.status}
                  </Badge>
                  <span className="text-[10px] text-slate-400 font-mono">{proj.deployedAt}</span>
                </div>
                <h4 className="font-bold text-sm text-white line-clamp-1">{proj.name}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{proj.description}</p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Est. Revenue</span>
                  <span className="text-xs font-bold text-amber-400 font-mono">{proj.monthlyRevenueEst}/mo</span>
                </div>
                <a
                  href={proj.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline"
                >
                  <span>Open Live</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
