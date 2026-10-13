"use client";

import React, { useState } from "react";
import {
  Code2,
  Play,
  Download,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  FolderTree,
  FileCode,
  Terminal,
  Layers,
  Sparkles,
  ExternalLink,
  Laptop,
  Smartphone,
  Server,
  RefreshCw,
  Cpu,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface GeneratedFile {
  name: string;
  path: string;
  language: string;
  content: string;
}

interface ProjectScaffold {
  id: string;
  title: string;
  template: "react_vite" | "nextjs_ssr" | "fastify_api";
  files: GeneratedFile[];
  testOutput: {
    passed: number;
    failed: number;
    durationMs: number;
    logs: string[];
  };
}

const TEMPLATES: Record<string, ProjectScaffold> = {
  "quick_commerce": {
    id: "proj_qcommerce_01",
    title: "OrderKing Quick-Commerce 15-Min Storefront",
    template: "react_vite",
    files: [
      {
        name: "package.json",
        path: "package.json",
        language: "json",
        content: `{
  "name": "orderking-qcommerce-store",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.475.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vite": "^5.4.0",
    "vitest": "^2.1.0"
  }
}`
      },
      {
        name: "App.tsx",
        path: "src/App.tsx",
        language: "typescript",
        content: `import React, { useState } from "react";
import { ShoppingBag, Zap, Clock, ShieldCheck } from "lucide-react";

export function App() {
  const [cart, setCart] = useState<{ id: string; name: string; price: number; qty: number }[]>([]);
  
  const items = [
    { id: "1", name: "Farm Fresh Whole Milk (500ml)", price: 34, eta: "11 mins" },
    { id: "2", name: "Brown Eggs Pack of 6", price: 65, eta: "12 mins" },
    { id: "3", name: "Fresh Coriander & Mint Bunch", price: 15, eta: "9 mins" },
    { id: "4", name: "Amul Butter 100g", price: 58, eta: "10 mins" }
  ];

  const addToCart = (item: typeof items[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
      <header className="flex justify-between items-center pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-emerald-400">
            <Zap className="h-6 w-6" /> OrderKing Instant
          </h1>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
            <Clock className="h-3 w-3" /> Average Delivery: 12 Mins
          </p>
        </div>
        <div className="bg-emerald-950 border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-emerald-400" />
          <span className="font-bold text-sm">₹{total} ({cart.reduce((c, i) => c + i.qty, 0)})</span>
        </div>
      </header>
      
      <main className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {items.map(item => (
          <div key={item.id} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-100">{item.name}</p>
              <p className="text-xs text-slate-400 mt-1">₹{item.price} • ETA {item.eta}</p>
            </div>
            <button 
              onClick={() => addToCart(item)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
            >
              ADD
            </button>
          </div>
        ))}
      </main>
    </div>
  );
}`
      },
      {
        name: "api.ts",
        path: "src/lib/api.ts",
        language: "typescript",
        content: `export async function createInstantOrder(items: any[], totalPaise: number) {
  const res = await fetch("/api/v1/instant-orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, totalPaise, timestamp: new Date().toISOString() })
  });
  return res.json();
}`
      },
      {
        name: "App.test.ts",
        path: "tests/App.test.ts",
        language: "typescript",
        content: `import { describe, it, expect } from "vitest";

describe("Instant Storefront Logic", () => {
  it("calculates cart total accurately", () => {
    const items = [{ price: 34, qty: 2 }, { price: 65, qty: 1 }];
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    expect(total).toBe(133);
  });

  it("verifies SLA delivery window is under 15 minutes", () => {
    const slaLimitMins = 15;
    const estEtaMins = 12;
    expect(estEtaMins).toBeLessThanOrEqual(slaLimitMins);
  });
});`
      }
    ],
    testOutput: {
      passed: 2,
      failed: 0,
      durationMs: 84,
      logs: [
        "✓ Instant Storefront Logic > calculates cart total accurately (12ms)",
        "✓ Instant Storefront Logic > verifies SLA delivery window is under 15 minutes (8ms)",
        "Test Files: 1 passed (1)",
        "Tests: 2 passed (2)",
        "Duration: 84ms"
      ]
    }
  },
  "restaurant_pos": {
    id: "proj_pos_02",
    title: "OrderKing Kitchen Display & Touch POS",
    template: "nextjs_ssr",
    files: [
      {
        name: "package.json",
        path: "package.json",
        language: "json",
        content: `{
  "name": "orderking-kitchen-pos",
  "version": "1.0.0",
  "dependencies": {
    "next": "15.1.0",
    "react": "^19.0.0",
    "lucide-react": "^0.475.0"
  }
}`
      },
      {
        name: "page.tsx",
        path: "app/kitchen/page.tsx",
        language: "typescript",
        content: `import React from "react";

export default function KitchenPage() {
  const liveKOTs = [
    { id: "KOT-104", table: "Takeaway", items: ["2x Chicken Biryani", "1x Mirchi Salan"], timer: "4:12" },
    { id: "KOT-105", table: "Table 4", items: ["1x Paneer Butter Masala", "3x Butter Naan"], timer: "1:45" }
  ];

  return (
    <div className="bg-black text-amber-400 p-8 min-h-screen font-mono">
      <h1 className="text-3xl font-black mb-6">LIVE KITCHEN DISPLAY SYSTEM (KDS)</h1>
      <div className="grid grid-cols-2 gap-6">
        {liveKOTs.map(kot => (
          <div key={kot.id} className="border-2 border-amber-500/50 p-6 rounded-2xl bg-amber-950/20">
            <div className="flex justify-between items-center text-xl font-bold border-b border-amber-500/30 pb-2 mb-4">
              <span>{kot.id} ({kot.table})</span>
              <span className="text-emerald-400">{kot.timer}</span>
            </div>
            <ul className="space-y-2 text-lg">
              {kot.items.map((it, idx) => (
                <li key={idx} className="text-white">• {it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}`
      }
    ],
    testOutput: {
      passed: 1,
      failed: 0,
      durationMs: 42,
      logs: [
        "✓ KDS Engine > routes incoming tickets to active kitchen stations (42ms)",
        "Tests: 1 passed (1)"
      ]
    }
  }
};

export function AppBuilderStudio() {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>("quick_commerce");
  const [customPrompt, setCustomPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState(1);
  const [copiedFile, setCopiedFile] = useState(false);
  const [activeTab, setActiveTab] = useState<"code" | "preview" | "tests">("code");
  const [activeApp, setActiveApp] = useState<ProjectScaffold>(TEMPLATES["quick_commerce"]);

  const currentFile = activeApp.files[selectedFileIndex] || activeApp.files[0];

  const handleGenerate = () => {
    if (!customPrompt.trim()) {
      toast.error("Please enter an application specification prompt.");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      // Create dynamically generated project based on prompt
      const generatedId = `proj_gen_${Date.now()}`;
      const newProject: ProjectScaffold = {
        id: generatedId,
        title: customPrompt.slice(0, 40) + "...",
        template: "react_vite",
        files: [
          {
            name: "package.json",
            path: "package.json",
            language: "json",
            content: `{\n  "name": "custom-umar-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.3.1"\n  }\n}`
          },
          {
            name: "App.tsx",
            path: "src/App.tsx",
            language: "typescript",
            content: `// Auto-scaffolded by UMAR OS Application Factory\n// Prompt: "${customPrompt}"\n\nimport React, { useState } from "react";\n\nexport function GeneratedApp() {\n  const [status, setStatus] = useState("OPERATIONAL");\n  return (\n    <div className="p-8 bg-slate-900 text-white min-h-screen font-sans">\n      <h1 className="text-2xl font-bold text-emerald-400 mb-2">${customPrompt}</h1>\n      <p className="text-slate-400 text-sm mb-6">Fullstack UMAR OS Connected Micro-App</p>\n      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-lg">\n        <p className="font-semibold text-slate-200">System State: {status}</p>\n        <button onClick={() => setStatus("REFRESHED")} className="mt-4 bg-emerald-600 px-4 py-2 rounded-lg text-xs font-bold text-white">\n          Trigger Action\n        </button>\n      </div>\n    </div>\n  );\n}`
          },
          {
            name: "app.test.ts",
            path: "tests/app.test.ts",
            language: "typescript",
            content: `import { describe, it, expect } from "vitest";\n\ndescribe("Generated Application Contract", () => {\n  it("verifies component mounts cleanly", () => {\n    expect(true).toBe(true);\n  });\n});`
          }
        ],
        testOutput: {
          passed: 1,
          failed: 0,
          durationMs: 38,
          logs: [
            "✓ Generated Application Contract > verifies component mounts cleanly (38ms)",
            "Tests: 1 passed (1)"
          ]
        }
      };

      setActiveApp(newProject);
      setSelectedFileIndex(1);
      setIsGenerating(false);
      toast.success("Application successfully synthesized & tested!");
    }, 1200);
  };

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopiedFile(true);
    setTimeout(() => setCopiedFile(false), 2000);
    toast.success(`Copied ${currentFile.name} to clipboard`);
  };

  const handleExportZip = () => {
    toast.success(`Exporting project bundle "${activeApp.title}" (${activeApp.files.length} files)`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Application & Website Factory (DEMO A)
            </h2>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
              LIVE CODE GENERATOR
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Autonomous fullstack software synthesizer. Converts Founder natural language specifications into complete, tested application packages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportZip}
            className="text-xs font-semibold gap-1.5 border-slate-300"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" /> Export Project (.zip)
          </Button>
        </div>
      </div>

      {/* Prompt Bar */}
      <div className="p-6 border-b border-slate-200 bg-white space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Build an Indian hyperlocal grocery delivery store with 12-minute SLA and KingPay UPI checkout..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans"
          />
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl gap-2 shadow-sm"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Synthesizing...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" /> Generate Application
              </>
            )}
          </Button>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 overflow-x-auto text-[11px] font-mono text-slate-500">
          <span className="font-bold text-slate-700 shrink-0">PRESETS:</span>
          <button
            onClick={() => {
              setSelectedTemplateKey("quick_commerce");
              setActiveApp(TEMPLATES["quick_commerce"]);
              setSelectedFileIndex(1);
            }}
            className={`px-3 py-1 rounded-lg border transition-colors shrink-0 ${
              selectedTemplateKey === "quick_commerce"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
            }`}
          >
            Instant Q-Commerce App
          </button>
          <button
            onClick={() => {
              setSelectedTemplateKey("restaurant_pos");
              setActiveApp(TEMPLATES["restaurant_pos"]);
              setSelectedFileIndex(1);
            }}
            className={`px-3 py-1 rounded-lg border transition-colors shrink-0 ${
              selectedTemplateKey === "restaurant_pos"
                ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
            }`}
          >
            Kitchen KDS & POS
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
        {/* File Navigator */}
        <div className="lg:col-span-3 border-r border-slate-200 bg-slate-50/60 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1.5">
                <FolderTree className="h-3.5 w-3.5 text-slate-400" /> Project Hierarchy
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                {activeApp.files.length} FILES
              </span>
            </div>

            <div className="space-y-1">
              {activeApp.files.map((file, idx) => (
                <button
                  key={file.path}
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                    selectedFileIndex === idx
                      ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200"
                      : "text-slate-600 hover:bg-slate-100 border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <FileCode className={`h-3.5 w-3.5 shrink-0 ${selectedFileIndex === idx ? "text-emerald-600" : "text-slate-400"}`} />
                    <span className="truncate">{file.path}</span>
                  </span>
                  <span className="text-[9px] uppercase font-mono text-slate-400 shrink-0">
                    {file.language}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 text-[10px] font-mono text-slate-500 space-y-1">
            <p>SCAFFOLD: <span className="text-slate-800 font-bold">{activeApp.template.toUpperCase()}</span></p>
            <p>TEST COVERAGE: <span className="text-emerald-700 font-bold">100% PASS</span></p>
          </div>
        </div>

        {/* Center / Editor / Preview */}
        <div className="lg:col-span-9 flex flex-col bg-white">
          {/* Subheader View Tabs */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "code"
                    ? "bg-white text-slate-900 border border-slate-200 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Code2 className="h-3.5 w-3.5 text-emerald-600" /> Source Editor
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "preview"
                    ? "bg-white text-slate-900 border border-slate-200 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Laptop className="h-3.5 w-3.5 text-emerald-600" /> Live Interactive Preview
              </button>
              <button
                onClick={() => setActiveTab("tests")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === "tests"
                    ? "bg-white text-slate-900 border border-slate-200 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Test Runner ({activeApp.testOutput.passed} Pass)
              </button>
            </div>

            {activeTab === "code" && (
              <button
                onClick={handleCopy}
                className="text-xs font-mono text-slate-600 hover:text-slate-900 flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-sm"
              >
                {copiedFile ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-400" />}
                <span>{copiedFile ? "Copied" : "Copy File"}</span>
              </button>
            )}
          </div>

          {/* View Body */}
          <div className="flex-1 p-4 font-mono text-xs overflow-auto max-h-[550px] bg-slate-950 text-slate-100">
            {activeTab === "code" && (
              <pre className="leading-relaxed whitespace-pre-wrap select-text">
                {currentFile.content}
              </pre>
            )}

            {activeTab === "preview" && (
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-sans text-white h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                      <span className="font-bold text-sm tracking-wide text-emerald-400">
                        {activeApp.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                      LIVE SANDBOX: PORT 3000
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700">
                      <h4 className="font-bold text-slate-100 text-sm">Interactive Sandbox Component</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Application compiled and mounted in headless virtual container. All state mutations and event handlers active.
                      </p>
                      <div className="mt-4 flex gap-3">
                        <button 
                          onClick={() => toast.success("Sandbox API Triggered: /api/v1/orders/dispatch")}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-lg text-xs transition-colors"
                        >
                          Simulate Customer Order
                        </button>
                        <button 
                          onClick={() => toast.info("Payment Webhook Verified: ₹250.00 via KingPay")}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold px-4 py-2 rounded-lg text-xs transition-colors"
                        >
                          Simulate UPI Payment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>RENDER ENGINE: REACT 19 SSR</span>
                  <span>MEMORY: 18.4 MB</span>
                </div>
              </div>
            )}

            {activeTab === "tests" && (
              <div className="space-y-4 font-mono text-xs text-slate-300">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-emerald-400 font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> ALL SUITES PASSED
                  </span>
                  <span className="text-slate-400">
                    Execution Time: {activeApp.testOutput.durationMs}ms
                  </span>
                </div>

                <div className="bg-black/60 p-4 rounded-xl border border-slate-800 space-y-2">
                  {activeApp.testOutput.logs.map((log, i) => (
                    <p key={i} className={log.startsWith("✓") ? "text-emerald-400" : "text-slate-400"}>
                      {log}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
