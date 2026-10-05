import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  FolderTree,
  GitBranch,
  GitCommit,
  Layers,
  Play,
  RefreshCw,
  Terminal,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  EnterpriseProjectBlueprint,
  ProjectFileArtifact,
} from "@/lib/orderking/ai/supreme-founder-ai-core";
import { getEnterpriseBlueprintsFn } from "@/lib/orderking/actions";

export function AppFactoryWorkspace() {
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>("bp-hospital-erp");
  const [activeFile, setActiveFile] = useState<string>("App.tsx");
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "terminal" | "tests">("preview");
  const [blueprintList, setBlueprintList] = useState<EnterpriseProjectBlueprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [terminalLogs] = useState<string[]>([
    "No build has been executed from this browser surface.",
    "Use repository CI/CD for authoritative typecheck, tests, migrations, and deployment results.",
  ]);

  useEffect(() => {
    getEnterpriseBlueprintsFn().then((res) => {
      if (res.ok && res.data) {
        setBlueprintList(Object.values(res.data));
      }
      setIsLoading(false);
    });
  }, []);

  if (isLoading || blueprintList.length === 0) {
    return <div className="p-8 text-center text-slate-400">Loading Enterprise Blueprints...</div>;
  }

  const currentBlueprint: EnterpriseProjectBlueprint =
    blueprintList.find((b: EnterpriseProjectBlueprint) => b.id === selectedBlueprintId) || blueprintList[0];

  const currentFile: ProjectFileArtifact =
    currentBlueprint.files.find((f: ProjectFileArtifact) => f.filename === activeFile) || currentBlueprint.files[0];

  const handleCopyCode = (code: string) => {
    void navigator.clipboard?.writeText(code);
    toast.success(`Copied ${activeFile} to clipboard!`);
  };

  const handleDownloadBundle = () => {
    const bundle = {
      title: currentBlueprint.title,
      commercialValuationInr: currentBlueprint.commercialValueInr,
      techStack: currentBlueprint.techStack,
      files: currentBlueprint.files,
      credentials: currentBlueprint.handoffCredentials,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentBlueprint.id}-production-bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Production codebase bundle downloaded!");
  };

  const handleRunBuild = () => {
    toast.error(
      "No local build is executed here. The UI will not fabricate build/test results; use GitHub CI or Vercel for authoritative verification."
    );
  };

  return (
    <div className="rounded-2xl border border-purple-500/40 bg-[#070D12] text-slate-100 p-5 space-y-4 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10/70">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-black text-lg text-white tracking-wide">
              Website &amp; App Factory
            </h3>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/40 text-[10px] font-bold">
              PRODUCTION CODING ENGINE
            </Badge>
          </div>
          <p className="text-xs text-zinc-400">
            Isolated code generation, PostgreSQL schema DDL, interactive previews, and client handoffs.
          </p>
        </div>

        {/* Blueprint Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedBlueprintId}
            onChange={(e) => {
              setSelectedBlueprintId(e.target.value);
              const bp = blueprintList.find((b: EnterpriseProjectBlueprint) => b.id === e.target.value);
              if (bp && bp.files.length > 0) setActiveFile(bp.files[0].filename);
              toast.info(`Switched project to ${bp?.title}`);
            }}
            className="rounded-lg bg-white/5 border border-purple-500/30 px-3 py-1.5 text-xs font-bold text-purple-300 focus:outline-none"
          >
            {blueprintList.map((b: EnterpriseProjectBlueprint) => (
              <option key={b.id} value={b.id}>
                {b.title} (₹{b.commercialValueInr.toLocaleString("en-IN")})
              </option>
            ))}
          </select>

          <Button
            size="sm"
            variant="primary"
            onClick={handleRunBuild}
            className="h-8 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
          >
            <Play className="size-3.5 mr-1" />
            Run Build
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadBundle}
            className="h-8 text-xs font-bold text-emerald-300 border-emerald-500/40"
          >
            <Download className="size-3.5 mr-1" />
            Export Bundle
          </Button>
        </div>
      </div>

      {/* Main Workspace Split: Left File Tree, Right Editor/Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Column: File Tree & Project Meta */}
        <div className="rounded-xl bg-black/60 border border-white/10/70 p-3 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10/60">
            <span className="font-bold text-zinc-400 uppercase text-[10px] flex items-center gap-1.5">
              <FolderTree className="size-3.5 text-purple-400" />
              File Tree
            </span>
            <Badge className="bg-white/5 text-slate-300 text-[10px] font-mono">
              {currentBlueprint.files.length} Files
            </Badge>
          </div>

          <div className="space-y-1">
            {currentBlueprint.files.map((f: ProjectFileArtifact) => (
              <button
                key={f.filename}
                type="button"
                onClick={() => setActiveFile(f.filename)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition ${
                  activeFile === f.filename
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/50 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <FileCode className="size-3.5 shrink-0" />
                  <span className="truncate">{f.filename}</span>
                </div>
                <span className="text-[10px] text-zinc-400 uppercase">{f.language}</span>
              </button>
            ))}
          </div>

          {/* Project Details */}
          <div className="pt-3 border-t border-white/10/60 text-xs space-y-2">
            <span className="font-bold text-zinc-400 uppercase text-[10px] block">Commercial Value:</span>
            <div className="rounded bg-white/5 p-2 font-mono text-emerald-400 font-bold">
              ₹{currentBlueprint.commercialValueInr.toLocaleString("en-IN")}
            </div>

            <span className="font-bold text-zinc-400 uppercase text-[10px] block pt-1">Tech Stack:</span>
            <div className="flex flex-wrap gap-1">
              {currentBlueprint.techStack.map((t: string) => (
                <span key={t} className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-300">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Editor / Preview / Terminal / Tests */}
        <div className="lg:col-span-3 rounded-xl bg-black/60 border border-white/10/70 overflow-hidden flex flex-col h-[520px]">
          {/* Editor Header & Tabs */}
          <div className="bg-white/5/90 border-b border-white/10/70 px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={activeTab === "preview" ? "primary" : "outline"}
                onClick={() => setActiveTab("preview")}
                className={`h-7 px-2.5 text-[11px] font-bold ${
                  activeTab === "preview" ? "bg-purple-600 text-white" : "text-slate-300"
                }`}
              >
                <Eye className="size-3 mr-1" />
                Live Preview
              </Button>

              <Button
                size="sm"
                variant={activeTab === "code" ? "primary" : "outline"}
                onClick={() => setActiveTab("code")}
                className={`h-7 px-2.5 text-[11px] font-bold ${
                  activeTab === "code" ? "bg-purple-600 text-white" : "text-slate-300"
                }`}
              >
                <Code2 className="size-3 mr-1" />
                Code: {activeFile}
              </Button>

              <Button
                size="sm"
                variant={activeTab === "terminal" ? "primary" : "outline"}
                onClick={() => setActiveTab("terminal")}
                className={`h-7 px-2.5 text-[11px] font-bold ${
                  activeTab === "terminal" ? "bg-purple-600 text-white" : "text-slate-300"
                }`}
              >
                <Terminal className="size-3 mr-1" />
                Terminal ({terminalLogs.length})
              </Button>

              <Button
                size="sm"
                variant={activeTab === "tests" ? "primary" : "outline"}
                onClick={() => setActiveTab("tests")}
                className={`h-7 px-2.5 text-[11px] font-bold ${
                  activeTab === "tests" ? "bg-purple-600 text-white" : "text-slate-300"
                }`}
              >
                <CheckCircle2 className="size-3 mr-1" />
                Verification Status
              </Button>
            </div>

            {activeTab === "code" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyCode(currentFile.code)}
                className="h-6 px-2 text-[10px] font-bold text-purple-300 border-purple-500/40"
              >
                <Copy className="size-3 mr-1" />
                Copy {activeFile}
              </Button>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
            {activeTab === "code" && (
              <pre className="text-slate-200 leading-relaxed whitespace-pre overflow-x-auto">
                <code>{currentFile.code}</code>
              </pre>
            )}

            {activeTab === "preview" && (
              <div className="font-sans space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/10/50 text-xs text-zinc-400">
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                    Blueprint Preview · No Runtime Claim
                  </span>
                  <span>React 19 · PostgreSQL · King Pay UPI</span>
                </div>

                <div className="rounded-xl bg-white/5 p-4 border border-white/10 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-white">{currentBlueprint.title}</h4>
                    <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                      Blueprint Only
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300">{currentBlueprint.targetOrganization}</p>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2">
                    <div className="bg-black/40 p-2 rounded">
                      <span className="text-zinc-400 block text-[10px]">Database Schema</span>
                      <span className="font-bold text-white font-mono">
                        {currentBlueprint.databaseSchema.length} Tables
                      </span>
                    </div>
                    <div className="bg-black/40 p-2 rounded">
                      <span className="text-zinc-400 block text-[10px]">API Endpoints</span>
                      <span className="font-bold text-cyan-400 font-mono">
                        {currentBlueprint.apiEndpoints.length} Routes
                      </span>
                    </div>
                    <div className="bg-black/40 p-2 rounded">
                      <span className="text-zinc-400 block text-[10px]">Turnkey Delivery</span>
                      <span className="font-bold text-amber-400 font-mono">
                        {currentBlueprint.estimatedBuildTime}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "terminal" && (
              <div className="space-y-1 text-slate-300">
                {terminalLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "tests" && (
              <div className="font-sans space-y-2">
                {[
                  "Order State Machine Transition Test (ACTIVE_FLOW)",
                  "PostgreSQL Canonical DDL Schema Constraints Test",
                  "Double-Entry Ledger Invariant & Balance Test",
                  "King Pay UPI 0% Gateway Calculation Test",
                  "ABDM Health Record FHIR Encryption Test",
                  "Rider Dispatch Routing & Proximity Calculation Test",
                  "Section 79 IT Act Privacy Intermediary Audit Test",
                ].map((testName, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white/5 p-2 rounded text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-3.5 text-emerald-400" />
                      <span className="text-slate-200 font-medium">{testName}</span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">NOT EXECUTED HERE</span>
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
