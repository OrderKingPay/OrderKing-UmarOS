// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowUp,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Cpu,
  Crown,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileCode,
  FileEdit,
  Flame,
  Globe,
  Headphones,
  Key,
  Laptop,
  Layers,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  Phone,
  PhoneCall,
  PhoneOff,
  Play,
  Plus,
  QrCode,
  Radio,
  RefreshCw,
  Rocket,
  RotateCcw,
  Save,
  Search,
  Send,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  TrendingUp,
  Volume2,
  VolumeX,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AgentExecutionStep,
  AiModelId,
  ClientInvoice,
  ClientLead,
  EnterpriseProjectBlueprint,
  ProjectFileArtifact,
  RemoteContractGig,
  SupremeAiMessage,
} from "@/lib/ai/supreme-founder-ai-core";
import {
  supremeAudioDsp,
  selectBestBrowserVoice,
  VOICE_PERSONAS,
  VoicePersonaId,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from "@/lib/ai/supreme-voice-engine";
import { BenchmarkRunReport } from "@/lib/ai/capability-benchmark";
import { CostControlReport } from "@/lib/ai/cost-control-engine";
import { SupremeExecutionPlan, SupremeStageNode } from "@/lib/ai/supreme-task-executor";
import { EnsembleConsensusEngine, type EnsembleConsensusResult } from "@/lib/ai/ensemble-consensus-engine";
import { InstantDeployEngine, type DeployTarget } from "@/lib/ai/instant-deploy-engine";
import { AutonomousModelUpdater, autonomousModelUpdater } from "@/lib/ai/autonomous-model-updater";
import { isDeliveryActiveInLocation, ACTIVE_DELIVERY_ZONES } from "@/lib/geo/geofence-guard";

interface SupremeFounderAiChatProps {
  founderUpiVpa?: string;
  onSelectAction?: (action: string, payload: any) => void;
  defaultCallMode?: boolean;
}

export interface FounderCredentials {
  openAiKey: string;
  anthropicKey: string;
  stripeKey: string;
  razorpayKey: string;
  founderUpiVpa: string;
}

const DEFAULT_CREDENTIALS: FounderCredentials = {
  openAiKey: "",
  anthropicKey: "",
  stripeKey: "",
  razorpayKey: "",
  founderUpiVpa: "orderking@okhdfcbank",
};

// 3D Glowing Radial Orb Canvas Visualizer (Gemini Live & Grok Voice style)
function RadialOrbVisualizer({
  isSpeaking,
  isListening,
  isCallMode,
  size = 180,
  personaColor = "#F59E0B",
}: {
  isSpeaking: boolean;
  isListening: boolean;
  isCallMode: boolean;
  size?: number;
  personaColor?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const baseRadius = size * 0.28;

      // Dynamic Audio Energy Multiplier
      let energy = 1.0;
      if (isSpeaking) {
        energy = 1.0 + Math.sin(phase * 3.5) * 0.38 + Math.cos(phase * 6) * 0.18;
      } else if (isListening) {
        energy = 1.0 + Math.sin(phase * 4.5) * 0.28;
      } else if (isCallMode) {
        energy = 1.0 + Math.sin(phase * 1.5) * 0.08;
      }

      // Outer Chromatic Glow Aura
      const outerGlow = ctx.createRadialGradient(cx, cy, baseRadius * 0.5, cx, cy, baseRadius * 2.3 * energy);
      if (isSpeaking) {
        outerGlow.addColorStop(0, `${personaColor}80`);
        outerGlow.addColorStop(0.5, "rgba(234, 179, 8, 0.35)");
        outerGlow.addColorStop(0.8, "rgba(16, 185, 129, 0.2)");
        outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else if (isListening) {
        outerGlow.addColorStop(0, "rgba(6, 182, 212, 0.6)");
        outerGlow.addColorStop(0.5, "rgba(59, 130, 246, 0.35)");
        outerGlow.addColorStop(0.8, "rgba(139, 92, 246, 0.18)");
        outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        outerGlow.addColorStop(0, "rgba(16, 185, 129, 0.35)");
        outerGlow.addColorStop(0.7, "rgba(5, 150, 105, 0.15)");
        outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      }
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 2.3 * energy, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Orbital Particle Rings
      const numRings = 3;
      for (let r = 0; r < numRings; r++) {
        const ringRadius = baseRadius * (1.2 + r * 0.35) * energy;
        const ringSpeed = (r % 2 === 0 ? 1 : -1) * (0.02 + r * 0.01);
        const rotation = phase * ringSpeed;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);

        ctx.strokeStyle = isSpeaking
          ? `${personaColor}66`
          : isListening
          ? `rgba(6, 182, 212, ${0.45 - r * 0.1})`
          : `rgba(16, 185, 129, ${0.35 - r * 0.1})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4 + r * 3, 6 + r * 4]);
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbiting Satellite Nodes
        const numNodes = 3 + r;
        for (let n = 0; n < numNodes; n++) {
          const angle = (Math.PI * 2 / numNodes) * n;
          const nx = Math.cos(angle) * ringRadius;
          const ny = Math.sin(angle) * ringRadius;
          ctx.fillStyle = isSpeaking ? personaColor : isListening ? "#67E8F9" : "#6EE7B7";
          ctx.beginPath();
          ctx.arc(nx, ny, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // Central Pulsing High-Energy Sphere with Sinusoidal Deform Waves
      const sphereRadius = baseRadius * energy;
      const coreGrad = ctx.createRadialGradient(cx - sphereRadius * 0.3, cy - sphereRadius * 0.3, sphereRadius * 0.1, cx, cy, sphereRadius);
      if (isSpeaking) {
        coreGrad.addColorStop(0, "#FFFBEB");
        coreGrad.addColorStop(0.3, personaColor);
        coreGrad.addColorStop(0.7, "#D97706");
        coreGrad.addColorStop(1, "#059669");
      } else if (isListening) {
        coreGrad.addColorStop(0, "#ECFEFF");
        coreGrad.addColorStop(0.3, "#22D3EE");
        coreGrad.addColorStop(0.7, "#2563EB");
        coreGrad.addColorStop(1, "#7C3AED");
      } else {
        coreGrad.addColorStop(0, "#ECFDF5");
        coreGrad.addColorStop(0.4, "#34D399");
        coreGrad.addColorStop(0.8, "#059669");
        coreGrad.addColorStop(1, "#064E3B");
      }

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      const numPoints = 64;
      for (let i = 0; i <= numPoints; i++) {
        const theta = (Math.PI * 2 / numPoints) * i;
        const wave = isSpeaking
          ? Math.sin(theta * 6 + phase * 4) * 4.5 + Math.cos(theta * 4 - phase * 3) * 2.5
          : isListening
          ? Math.sin(theta * 5 + phase * 3) * 3
          : Math.sin(theta * 3 + phase) * 1.5;
        const rad = sphereRadius + wave;
        const x = cx + Math.cos(theta) * rad;
        const y = cy + Math.sin(theta) * rad;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Specular Reflection Sheen
      const sheenGrad = ctx.createRadialGradient(cx - sphereRadius * 0.35, cy - sphereRadius * 0.35, 1, cx, cy, sphereRadius);
      sheenGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      sheenGrad.addColorStop(0.4, "rgba(255, 255, 255, 0.2)");
      sheenGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = sheenGrad;
      ctx.beginPath();
      ctx.arc(cx - sphereRadius * 0.25, cy - sphereRadius * 0.25, sphereRadius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      phase += isSpeaking ? 0.08 : isListening ? 0.05 : 0.02;
      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSpeaking, isListening, isCallMode, size, personaColor]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full drop-shadow-[0_0_25px_rgba(245,158,11,0.35)]"
      />
      <div className="absolute -bottom-2 text-center pointer-events-none">
        <span
          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm ${
            isSpeaking
              ? "bg-amber-500/20 text-amber-300 border-amber-400/50 animate-pulse"
              : isListening
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 animate-pulse"
              : "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
          }`}
        >
          {isSpeaking ? "AI Speaking (100% Real)" : isListening ? "Listening to Founder..." : "Duplex Voice Ready"}
        </span>
      </div>
    </div>
  );
}

// Interactive Live App Sandbox & Multi-File Codebase Viewer & Live Editor
function BlueprintSandbox({ blueprint }: { blueprint: EnterpriseProjectBlueprint }) {
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "edit" | "handoff">("preview");
  const [selectedFile, setSelectedFile] = useState<string>(
    blueprint.files[0]?.filename || "App.tsx"
  );
  const [copiedFile, setCopiedFile] = useState(false);

  // File Code State allowing founder in-chat editing
  const [fileCodes, setFileCodes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    blueprint.files.forEach((f) => {
      map[f.filename] = f.code;
    });
    return map;
  });

  // Live Sandbox States for interactive demonstration
  const [hospitalTokens, setHospitalTokens] = useState(14);
  const [hospitalQueue, setHospitalQueue] = useState([
    { token: 11, name: "Rahul Sharma", doctor: "Dr. A. K. Sen (Cardio)", status: "IN_CONSULTATION" },
    { token: 12, name: "Ananya Roy", doctor: "Dr. M. Begum (Gynae)", status: "WAITING" },
    { token: 13, name: "Kabir Das", doctor: "Dr. P. Baruah (Ortho)", status: "WAITING" },
  ]);
  const [newPatient, setNewPatient] = useState("");
  const [cartTotal, setCartTotal] = useState(0);
  const [ledgerBalance, setLedgerBalance] = useState(1450000);
  const [disbursedCount, setDisbursedCount] = useState(38);

  const currentCode = fileCodes[selectedFile] || blueprint.files[0]?.code || "";

  const handleCopyCode = (code: string) => {
    void navigator.clipboard?.writeText(code);
    setCopiedFile(true);
    toast.success(`Copied ${selectedFile} to clipboard!`);
    setTimeout(() => setCopiedFile(false), 2000);
  };

  const handleResetFileCode = () => {
    const original = blueprint.files.find((f) => f.filename === selectedFile)?.code || "";
    setFileCodes((prev) => ({ ...prev, [selectedFile]: original }));
    toast.info(`Reset ${selectedFile} to original template`);
  };

  const handleDownloadZip = () => {
    const updatedFiles = blueprint.files.map((f) => ({
      ...f,
      code: fileCodes[f.filename] || f.code,
    }));

    const bundle = {
      project: blueprint.title,
      commercialValue: blueprint.commercialValueInr,
      files: updatedFiles,
      credentials: blueprint.handoffCredentials,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${blueprint.id}-full-production-bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
    supremeAudioDsp.playTone("success_chime");
    toast.success("Complete production codebase bundle downloaded!");
  };

  return (
    <div className="rounded-xl border border-purple-500/40 bg-black/60 overflow-hidden shadow-2xl mt-3">
      {/* Top Header & Navigation Tabs */}
      <div className="border-b border-border/70 bg-surface-2/80 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/40 text-[10px] font-bold">
            {blueprint.category.toUpperCase()}
          </Badge>
          <h4 className="text-xs font-bold text-white tracking-wide">{blueprint.title}</h4>
          <span className="text-[11px] font-mono text-emerald-400 font-bold">
            ₹{blueprint.commercialValueInr.toLocaleString("en-IN")} Value
          </span>
        </div>

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
            Codebase ({blueprint.files.length})
          </Button>

          <Button
            size="sm"
            variant={activeTab === "edit" ? "primary" : "outline"}
            onClick={() => setActiveTab("edit")}
            className={`h-7 px-2.5 text-[11px] font-bold ${
              activeTab === "edit" ? "bg-amber-600 text-white" : "text-amber-300 border-amber-500/40"
            }`}
          >
            <Edit3 className="size-3 mr-1" />
            Live Code Editor
          </Button>

          <Button
            size="sm"
            variant={activeTab === "handoff" ? "primary" : "outline"}
            onClick={() => setActiveTab("handoff")}
            className={`h-7 px-2.5 text-[11px] font-bold ${
              activeTab === "handoff" ? "bg-purple-600 text-white" : "text-slate-300"
            }`}
          >
            <ShieldCheck className="size-3 mr-1" />
            Client Handoff
          </Button>
        </div>
      </div>

      {/* TAB 1: LIVE INTERACTIVE APP PREVIEW */}
      {activeTab === "preview" && (
        <div className="p-3.5 bg-slate-950/90 text-slate-200">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-border/50 text-[11px] text-muted">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
              Live Interactive Sandbox Mockup (Fully Functional Simulation)
            </span>
            <span className="font-mono text-[10px]">React 19 · Next.js · Node.js · PostgreSQL</span>
          </div>

          {/* Hospital ERP Interactive Mockup */}
          {blueprint.category === "erp" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-lg bg-surface-2 p-2 border border-border">
                  <span className="text-muted block text-[10px]">Active OPD Queue</span>
                  <span className="text-base font-black text-emerald-400 font-mono">{hospitalQueue.length} Patients</span>
                </div>
                <div className="rounded-lg bg-surface-2 p-2 border border-border">
                  <span className="text-muted block text-[10px]">Doctors On-Duty</span>
                  <span className="text-base font-black text-amber-400 font-mono">8 Specialists</span>
                </div>
                <div className="rounded-lg bg-surface-2 p-2 border border-border">
                  <span className="text-muted block text-[10px]">ABDM Sync Status</span>
                  <span className="text-base font-black text-cyan-400 font-mono">STATUS PENDING</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg bg-surface-2 p-3 border border-border space-y-2">
                  <span className="text-xs font-bold text-white block">Fast-Track Patient Triage</span>
                  <div className="flex gap-2">
                    <Input
                      value={newPatient}
                      onChange={(e) => setNewPatient(e.target.value)}
                      placeholder="Patient name (e.g. Joya Das)..."
                      className="h-8 text-xs bg-black/40"
                    />
                    <Button
                      size="sm"
                      className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shrink-0"
                      onClick={() => {
                        if (!newPatient.trim()) return;
                        const nextToken = hospitalTokens + 1;
                        setHospitalTokens(nextToken);
                        setHospitalQueue([
                          ...hospitalQueue,
                          { token: nextToken, name: newPatient, doctor: "General OPD Triage", status: "WAITING" },
                        ]);
                        setNewPatient("");
                        supremeAudioDsp.playTone("success_chime");
                        toast.success(`Token #${nextToken} generated for ${newPatient}!`);
                      }}
                    >
                      Issue Token
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg bg-surface-2 p-3 border border-border space-y-2">
                  <span className="text-xs font-bold text-white block">Live OPD Call Board</span>
                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {hospitalQueue.map((item) => (
                      <div
                        key={item.token}
                        className="flex items-center justify-between text-[11px] bg-black/40 px-2 py-1 rounded"
                      >
                        <span className="font-mono text-emerald-400 font-bold">#{item.token}</span>
                        <span className="font-semibold">{item.name}</span>
                        <span className="text-muted text-[10px]">{item.doctor}</span>
                        <Badge
                          className={`text-[9px] ${
                            item.status === "IN_CONSULTATION" ? "bg-amber-500/20 text-amber-300" : "bg-surface text-slate-300"
                          }`}
                        >
                          {item.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Marketplace Simulation */}
          {blueprint.category === "marketplace" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-lg bg-surface-2 p-2 border border-border">
                  <span className="text-muted block text-[10px]">Verified Merchants</span>
                  <span className="text-base font-black text-emerald-400 font-mono">148 Stores</span>
                </div>
                <div className="rounded-lg bg-surface-2 p-2 border border-border">
                  <span className="text-muted block text-[10px]">Cart Value</span>
                  <span className="text-base font-black text-amber-400 font-mono">₹{cartTotal}</span>
                </div>
                <div className="rounded-lg bg-surface-2 p-2 border border-border">
                  <span className="text-muted block text-[10px]">Direct UPI Fee</span>
                  <span className="text-base font-black text-cyan-400 font-mono">0% Flat</span>
                </div>
              </div>

              <div className="flex gap-2">
                {["Kolkata Biryani Hub (₹280)", "Guwahati Fresh Mart (₹450)", "Sylhet Spice Vault (₹190)"].map(
                  (item, idx) => {
                    const price = idx === 0 ? 280 : idx === 1 ? 450 : 190;
                    return (
                      <Button
                        key={item}
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8 text-[11px] bg-surface-2"
                        onClick={() => {
                          setCartTotal((prev) => prev + price);
                          supremeAudioDsp.playTone("interruption_ping");
                          toast.success(`Added ${item} to test cart!`);
                        }}
                      >
                        + Add {item}
                      </Button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* FinTech Ledger Simulation */}
          {blueprint.category === "fintech" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="rounded-lg bg-surface-2 p-2 border border-border">
                  <span className="text-muted block text-[10px]">Escrow Vault</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    ₹{ledgerBalance.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="rounded-lg bg-surface-2 p-2 border border-border">
                  <span className="text-muted block text-[10px]">Atomic Disbursals</span>
                  <span className="text-base font-black text-cyan-400 font-mono">{disbursedCount} Settled</span>
                </div>
                <div className="rounded-lg bg-surface-2 p-2 border border-border">
                  <span className="text-muted block text-[10px]">Ledger Audit</span>
                  <span className="text-base font-black text-amber-400 font-mono">Double-Entry OK</span>
                </div>
              </div>

              <div className="rounded-lg bg-surface-2 p-3 border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Instant ₹50,000 Vendor Disbursal Test</span>
                  <p className="text-[10px] text-muted">Atomic transaction with double-entry cryptographic debit &amp; credit</p>
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
                  onClick={() => {
                    setLedgerBalance((prev) => prev - 50000);
                    setDisbursedCount((prev) => prev + 1);
                    supremeAudioDsp.playTone("success_chime");
                    toast.success("₹50,000 disbursed atomically! SHA-256 block hash recorded.");
                  }}
                >
                  Test Disbursal
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MULTI-FILE CODEBASE VIEWER */}
      {activeTab === "code" && (
        <div className="flex flex-col bg-slate-950">
          <div className="flex items-center gap-1 overflow-x-auto border-b border-border/60 bg-black/60 px-3 py-1.5 text-xs scrollbar-none">
            {blueprint.files.map((f) => (
              <button
                key={f.filename}
                type="button"
                onClick={() => setSelectedFile(f.filename)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-mono transition shrink-0 ${
                  selectedFile === f.filename
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/50 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-surface-2"
                }`}
              >
                <FileCode className="size-3" />
                <span>{f.filename}</span>
              </button>
            ))}

            <div className="ml-auto flex items-center gap-1.5 shrink-0 pl-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopyCode(currentCode)}
                className="h-6 px-2 text-[10px] font-bold text-purple-300 border-purple-500/40"
              >
                <Copy className="size-3 mr-1" />
                {copiedFile ? "Copied!" : `Copy ${selectedFile}`}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadZip}
                className="h-6 px-2 text-[10px] font-bold text-emerald-300 border-emerald-500/40"
              >
                <Download className="size-3 mr-1" />
                Export Bundle (.JSON)
              </Button>
            </div>
          </div>

          <div className="p-3 font-mono text-xs text-slate-200 max-h-72 overflow-y-auto bg-black/80">
            <pre className="whitespace-pre overflow-x-auto leading-relaxed">
              <code>{currentCode}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: IN-CHAT LIVE CODE EDITOR */}
      {activeTab === "edit" && (
        <div className="flex flex-col bg-slate-950 p-3 space-y-2.5">
          <div className="flex items-center justify-between border-b border-border/60 pb-2 text-xs">
            <div className="flex items-center gap-2">
              <FileEdit className="size-3.5 text-amber-400" />
              <span className="font-bold text-white">Live Editing:</span>
              <select
                value={selectedFile}
                onChange={(e) => setSelectedFile(e.target.value)}
                className="bg-surface-2 border border-border px-2 py-0.5 rounded text-amber-300 font-mono text-xs"
              >
                {blueprint.files.map((f) => (
                  <option key={f.filename} value={f.filename}>
                    {f.filename} ({f.language})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleResetFileCode}
                className="h-6 px-2 text-[10px] text-muted hover:text-white"
              >
                <RotateCcw className="size-3 mr-1" />
                Reset File
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  supremeAudioDsp.playTone("success_chime");
                  toast.success(`Saved customized ${selectedFile}! Included in download bundle.`);
                }}
                className="h-6 px-2.5 text-[10px] font-bold bg-amber-600 hover:bg-amber-500 text-white"
              >
                <Save className="size-3 mr-1" />
                Save Edits
              </Button>
            </div>
          </div>

          <textarea
            value={currentCode}
            onChange={(e) => {
              const val = e.target.value;
              setFileCodes((prev) => ({ ...prev, [selectedFile]: val }));
            }}
            rows={12}
            className="w-full rounded-lg bg-black/90 border border-border p-3 font-mono text-xs text-amber-100 focus:outline-none focus:border-amber-500/70 resize-y leading-relaxed"
            placeholder="Write or modify TypeScript, SQL or JSON code here..."
          />
          <div className="flex justify-between items-center text-[10px] text-muted font-mono">
            <span>Lines: {currentCode.split("\n").length} · Characters: {currentCode.length}</span>
            <span>Edits persist in session memory and client export</span>
          </div>
        </div>
      )}

      {/* TAB 4: CLIENT HANDOFF & CONTRACT PACKAGE */}
      {activeTab === "handoff" && (
        <div className="p-4 bg-slate-950/90 text-xs space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-border/50">
            <div>
              <span className="text-xs font-bold text-white block">Commercial Turnkey Delivery Package</span>
              <p className="text-[10px] text-muted">Ready to deliver to client with zero technical debt</p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
              Ready for Production Deploy
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-surface-2 p-3 border border-border space-y-2">
              <span className="text-[11px] font-bold text-amber-300 block">Deliverable Checklist:</span>
              <ul className="space-y-1 text-[11px] text-slate-300">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                  <span>React 19 Next.js Production Client Portal</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                  <span>PostgreSQL DDL Database Schema &amp; Seeders</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                  <span>REST API Endpoints &amp; Role-Based Access Control</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                  <span>King Pay Direct UPI 0% Gateway Integration</span>
                </li>
              </ul>
            </div>

            <div className="rounded-lg bg-surface-2 p-3 border border-border space-y-2">
              <span className="text-[11px] font-bold text-cyan-300 block">Client Handoff Credentials:</span>
              <div className="space-y-1 text-[10px] font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-muted">Admin User:</span>
                  <span>{blueprint.handoffCredentials.adminEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Temp Pass:</span>
                  <span>{blueprint.handoffCredentials.temporaryPass}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Database URL:</span>
                  <span className="truncate max-w-[140px]">{blueprint.handoffCredentials.databaseUrl}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              className="flex-1 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
              onClick={() => {
                const pitch = `Turnkey Delivery Package for ${blueprint.title}:\n- Commercial Valuation: ₹${blueprint.commercialValueInr.toLocaleString("en-IN")}\n- Complete React 19 / Next.js Source Code\n- Live Architecture & Admin Access\n\nDirect Deployment Link: ${blueprint.livePreviewUrl}`;
                void navigator.clipboard?.writeText(pitch);
                toast.success("Client delivery pitch copied to clipboard!");
              }}
            >
              <Copy className="size-3 mr-1.5" />
              Copy Client Delivery Pitch
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadZip}
              className="text-xs font-bold text-emerald-300 border-emerald-500/40"
            >
              <Download className="size-3 mr-1.5" />
              Download All Source Files
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Action Card Renderer Component
function ActionCardView({ card, onSaveKeys }: { card: NonNullable<SupremeAiMessage["actionCard"]>; onSaveKeys?: (keys: FounderCredentials) => void }) {
  if (card.type === "lead_pitch") {
    const { lead, invoice } = card.data as { lead: ClientLead; invoice: ClientInvoice };
    return (
      <div className="rounded-xl border border-amber-500/40 bg-black/60 p-3.5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-400">🏢 {lead.businessName}</span>
            <Badge className="bg-amber-500/20 text-amber-300 text-[10px]">{lead.category.toUpperCase()}</Badge>
          </div>
          <span className="text-xs font-bold text-emerald-400 font-mono">
            ₹{lead.projectBudget.toLocaleString("en-IN")} Contract
          </span>
        </div>

        <div className="rounded-lg bg-surface-2 p-2.5 text-xs space-y-1">
          <p className="text-[11px] text-muted">Client Pain Point:</p>
          <p className="text-[11px] leading-relaxed">{lead.painPoint}</p>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1">Solution: {lead.suggestedSolution}</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md"
            onClick={() => {
              const pitch = `Respected Management at ${lead.businessName},\n\nTired of losing high margins to aggregator commissions? OrderKing provides you with a turnkey white-label direct ordering app with 0% commission and direct UPI settlements.\n\nReview your custom solution and 50% advance invoice (₹${invoice.advanceRequiredInr.toLocaleString("en-IN")}) here:\n${invoice.upiPaymentLink}\n\nLet's schedule a 10-minute setup call today.`;
              void navigator.clipboard?.writeText(pitch);
              supremeAudioDsp.playTone("interruption_ping");
              toast.success("Client WhatsApp pitch & invoice link copied to clipboard!");
            }}
          >
            <Copy className="size-3 mr-1.5" />
            Copy WhatsApp Pitch
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-xs font-bold text-emerald-300 border-emerald-500/40"
            onClick={() => {
              void navigator.clipboard?.writeText(invoice.upiPaymentLink);
              supremeAudioDsp.playTone("interruption_ping");
              toast.success("Direct UPI deep link copied!");
            }}
          >
            <Wallet className="size-3 mr-1.5" />
            Copy UPI Link
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-xs font-bold"
            onClick={() => {
              window.open(invoice.qrPayload, "_blank");
            }}
          >
            <QrCode className="size-3 mr-1.5" />
            View QR
          </Button>
        </div>
      </div>
    );
  }

  if (card.type === "invoice_pay") {
    const invoice = card.data as ClientInvoice;
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-black/60 p-3.5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400">💵 Invoice: {invoice.invoiceNumber}</span>
            <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px]">0% Gateway Cut</Badge>
          </div>
          <span className="text-[10px] text-muted">Due: {invoice.dueDate}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded bg-surface-2 p-2">
            <span className="text-muted block text-[10px]">Total Contract Value:</span>
            <span className="font-bold text-white font-mono text-sm">
              ₹{invoice.amountInr.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="rounded bg-surface-2 p-2">
            <span className="text-muted block text-[10px]">50% Advance Required:</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              ₹{invoice.advanceRequiredInr.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-surface-2 p-2.5 text-[11px] text-slate-300 space-y-1 border border-border/50">
          <div className="flex justify-between">
            <span className="text-muted">Payout Account:</span>
            <span className="font-mono text-emerald-400 font-bold">{invoice.payoutAccount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Legal Compliance:</span>
            <span className="text-slate-300">Section 79 IT Act (Direct Intermediary Exemption)</span>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
            onClick={() => {
              void navigator.clipboard?.writeText(invoice.upiPaymentLink);
              supremeAudioDsp.playTone("success_chime");
              toast.success("King Pay UPI link copied! Send to client for instant advance payment.");
            }}
          >
            <Copy className="size-3 mr-1.5" />
            Copy UPI Pay Link
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-xs font-bold"
            onClick={() => {
              window.open(invoice.qrPayload, "_blank");
            }}
          >
            <QrCode className="size-3 mr-1.5" />
            Open QR Code
          </Button>
        </div>
      </div>
    );
  }

  if (card.type === "enterprise_blueprint") {
    const bp = card.data as EnterpriseProjectBlueprint;
    return <BlueprintSandbox blueprint={bp} />;
  }

  if (card.type === "remote_gig_bid") {
    const gig = card.data as RemoteContractGig;
    return (
      <div className="rounded-xl border border-sky-500/40 bg-black/60 p-3.5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-300">{gig.title}</span>
            <Badge className="bg-sky-500/20 text-sky-300 text-[10px]">{gig.platform}</Badge>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
            {gig.matchScore}% Match
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="rounded bg-surface-2 p-2">
            <span className="text-muted block text-[10px]">Hourly Rate:</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">${gig.hourlyRateUsd}/hr</span>
          </div>
          <div className="rounded bg-surface-2 p-2">
            <span className="text-muted block text-[10px]">Estimated Budget:</span>
            <span className="font-bold text-white font-mono text-sm">
              ${gig.fixedBudgetUsd?.toLocaleString() || "Hourly"}
            </span>
          </div>
          <div className="rounded bg-surface-2 p-2">
            <span className="text-muted block text-[10px]">Client Location:</span>
            <span className="font-bold text-white">{gig.clientLocation}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {gig.skillsRequired.map((s) => (
            <span key={s} className="rounded bg-surface-2 px-2 py-0.5 text-[10px] font-mono text-sky-300">
              {s}
            </span>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white"
            onClick={() => {
              void navigator.clipboard?.writeText(gig.proposalTemplate);
              supremeAudioDsp.playTone("interruption_ping");
              toast.success("Tailored Upwork/Toptal proposal copied to clipboard!");
            }}
          >
            <Copy className="size-3 mr-1.5" />
            Copy Tailored Proposal to Submit
          </Button>
        </div>
      </div>
    );
  }

  // Card: Verified Capability Benchmarks (§26)
  if (card.type === "benchmark_results") {
    const report = card.data as BenchmarkRunReport;
    const voiceLatency = report.categoryScores?.voice_latency?.latencyMs ?? report.averageLatencyMs;
    const softwareLatency = report.categoryScores?.software_generation?.latencyMs ?? 85;

    return (
      <div className="rounded-xl border border-emerald-500/40 bg-black/60 p-3.5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">Capability Benchmark Telemetry</span>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
            {report.averageScore.toFixed(1)} / 100 Score
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded bg-surface-2 p-2">
            <span className="text-muted block text-[10px]">Tests Verified</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              {report.passedTests} / {report.totalTests} PASS
            </span>
          </div>
          <div className="rounded bg-surface-2 p-2">
            <span className="text-muted block text-[10px]">Voice Latency</span>
            <span className="font-bold text-cyan-400 font-mono text-sm">
              {voiceLatency.toFixed(0)} ms
            </span>
          </div>
          <div className="rounded bg-surface-2 p-2">
            <span className="text-muted block text-[10px]">Software Gen</span>
            <span className="font-bold text-amber-400 font-mono text-sm">
              {softwareLatency.toFixed(0)} ms
            </span>
          </div>
        </div>

        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
          {report.results.map((r) => (
            <div
              key={r.testId}
              className="flex items-center justify-between text-[11px] bg-surface-2/60 p-1.5 rounded border border-border/40"
            >
              <span className="font-bold text-white">{r.name}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-muted text-[10px]">{r.latencyMs.toFixed(0)}ms</span>
                <Badge className="bg-emerald-500/20 text-emerald-300 text-[9px] font-mono">
                  {r.score}/100
                </Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white"
            onClick={() => {
              void navigator.clipboard?.writeText(JSON.stringify(report, null, 2));
              supremeAudioDsp.playTone("success_chime");
              toast.success("Benchmark JSON evidence copied to clipboard!");
            }}
          >
            <Copy className="size-3 mr-1.5" />
            Copy Verified Evidence JSON
          </Button>
        </div>
      </div>
    );
  }

  // Card: Cost Optimization (§24)
  if (card.type === "cost_optimization") {
    const rep = card.data as CostControlReport;
    return (
      <div className="rounded-xl border border-amber-500/40 bg-black/60 p-3.5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-amber-400" />
            <span className="text-xs font-bold text-white">Expense Optimization Audit (§24)</span>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
            ₹{rep.totalProjectedSavingsInr.toLocaleString("en-IN")}/mo Savings
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded bg-surface-2 p-2">
            <span className="text-muted block text-[10px]">Current Spend</span>
            <span className="font-bold text-rose-400 font-mono text-sm">
              ₹{rep.totalMonthlySpendInr.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="rounded bg-surface-2 p-2">
            <span className="text-muted block text-[10px]">Optimized Spend</span>
            <span className="font-bold text-emerald-400 font-mono text-sm">
              ₹{(rep.totalMonthlySpendInr - rep.totalProjectedSavingsInr).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 text-[11px]">
          {rep.optimizationRecommendations.slice(0, 3).map((rec, i) => (
            <div key={i} className="flex items-start gap-1.5 text-slate-300 bg-surface-2/60 p-1.5 rounded">
              <Check className="size-3 text-emerald-400 shrink-0 mt-0.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Card: In-Chat Credential Configuration
  if (card.type === "credential_config") {
    return <InChatCredentialCard onSave={onSaveKeys} />;
  }

  // Card: Delivery Task Graph (§28)
  if (card.type === "delivery_graph") {
    const graph = card.data as SupremeExecutionPlan;
    return (
      <div className="rounded-xl border border-cyan-500/40 bg-black/60 p-3.5 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-cyan-400" />
            <span className="text-xs font-bold text-white line-clamp-1">{graph.goal || "14-Stage Execution Plan"}</span>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono shrink-0">
            {graph.completedStages} / {graph.totalStages} Stages
          </Badge>
        </div>

        <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
          {graph.stages.map((s: SupremeStageNode, idx: number) => (
            <div
              key={s.id || s.stage}
              className="flex items-center justify-between text-[11px] bg-surface-2/60 p-1.5 rounded border border-border/40"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono text-muted text-[10px] shrink-0">{idx + 1}.</span>
                <span className="font-bold text-slate-200 truncate">{s.title}</span>
              </div>
              <Badge
                className={`text-[9px] font-mono shrink-0 ${
                  s.status === "COMPLETED"
                    ? "bg-emerald-500/20 text-emerald-300"
                    : s.status === "PAUSED_FOR_HUMAN"
                    ? "bg-amber-500/20 text-amber-300 animate-pulse"
                    : "bg-surface text-muted"
                }`}
              >
                {s.status}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Card: Multi-Model Ensemble Consensus
  if (card.type === "ensemble_consensus") {
    const res = card.data as EnsembleConsensusResult;
    return (
      <div className="rounded-xl border border-cyan-500/40 bg-zinc-900/95 p-4 space-y-3.5 shadow-xl text-zinc-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="size-4 text-cyan-400" />
            <span className="text-sm font-bold text-white">6-Model Ensemble Consensus</span>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
            {res.overallConsensusAgreement}% Agreement · {res.verificationStatus}
          </Badge>
        </div>

        <div className="p-3 rounded-lg bg-zinc-800/80 border border-zinc-700/60 space-y-1.5">
          <span className="text-xs text-zinc-400 block font-medium">Primary Elected Lead:</span>
          <span className="text-sm font-bold text-cyan-300">{res.primaryModelWinner}</span>
          <p className="text-xs text-zinc-300 leading-relaxed mt-1">{res.unifiedSynthesis}</p>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold text-zinc-400 block">Cross-Evaluated Frontier Models:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {res.modelsBreakdown?.map((m: any) => (
              <div key={m.modelId} className="p-2.5 rounded bg-zinc-800/60 border border-zinc-700/50 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">{m.modelName}</span>
                  <span className="text-emerald-400 font-mono text-[11px]">{m.confidenceScore}%</span>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-1">{m.suggestedAction}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Card: Instant Live Edge Deployment
  if (card.type === "instant_deploy") {
    const deploy = card.data as DeployTarget;
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-zinc-900/95 p-4 space-y-3.5 shadow-xl text-zinc-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="size-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">Interactive Sandbox Ready</span>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
            {deploy.status}
          </Badge>
        </div>

        <div className="p-3 rounded-lg bg-zinc-800/80 border border-zinc-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Project Name:</span>
            <span className="text-sm font-bold text-zinc-100">{deploy.projectName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Target Domain:</span>
            <span className="text-xs font-mono text-zinc-300">{deploy.targetDomain || "localhost:8080"}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Runtime:</span>
            <span className="text-zinc-200">🔒 {deploy.sslCertificate} ({deploy.edgeLatencyMs}ms sandbox)</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
            onClick={() => {
              window.open(deploy.liveUrl, "_blank");
            }}
          >
            <ExternalLink className="size-3.5 mr-1" />
            Open In-Browser Sandbox
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs font-bold border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            onClick={() => {
              void navigator.clipboard?.writeText(deploy.deployScriptVercel);
              toast.success("Vercel production deploy command copied to clipboard!");
            }}
          >
            <Copy className="size-3.5 mr-1" />
            Copy Vercel CLI
          </Button>
        </div>
      </div>
    );
  }

  // Card: Autonomous Model Updates & Self-Evolution
  if (card.type === "model_updates") {
    const report = card.data;
    return (
      <div className="rounded-xl border border-amber-500/40 bg-zinc-900/95 p-4 space-y-3.5 shadow-xl text-zinc-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-amber-400" />
            <span className="text-sm font-bold text-white">Frontier Model Self-Evolution</span>
          </div>
          <Badge className="bg-amber-500/20 text-amber-300 text-[10px] font-bold">
            {report.availableUpgrades?.length || 0} Upgrades Ready
          </Badge>
        </div>

        <div className="space-y-2">
          {report.availableUpgrades?.map((u: any) => (
            <div key={u.id} className="p-3 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-zinc-100">{u.name}</span>
                  <Badge tone="neutral" className="text-[10px] text-zinc-400 border border-zinc-600">{u.provider} · {u.generation}</Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{u.improvements?.join(" · ")}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-emerald-400 font-medium">
                  <span>+{u.performanceGainPct}% Benchmark Gain</span>
                  <span>·</span>
                  <span>{u.benchmarkScore}/100 Score</span>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0 shadow-md"
                onClick={() => {
                  autonomousModelUpdater.applyUpgrade(u.id);
                  supremeAudioDsp.playTone("success_chime");
                  toast.success(`Hot-Upgraded Umar OS to ${u.name}! Zero downtime.`);
                }}
              >
                <Check className="size-3.5 mr-1" />
                Approve & Hot-Upgrade
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Card: 1,000x Strict Geofencing & Territory Guard
  if (card.type === "geofence_status") {
    const { zones } = card.data || {};
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-zinc-900/95 p-4 space-y-3.5 shadow-xl text-zinc-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">1,000x Strict Geofence Status</span>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
            Active: {zones?.[0]?.name || "Sribhumi / Karimganj"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-lg bg-zinc-800/80 border border-zinc-700/60 space-y-1">
            <span className="font-bold text-emerald-400 block">🟢 Food Delivery Territory</span>
            <p className="text-zinc-300">Active strictly within 12km radius of Karimganj / Sribhumi core.</p>
            <span className="text-[11px] text-zinc-400 font-mono block">Zero surge · 15-min delivery</span>
          </div>
          <div className="p-3 rounded-lg bg-zinc-800/80 border border-zinc-700/60 space-y-1">
            <span className="font-bold text-amber-400 block">👑 Pan-India Outside Zone</span>
            <p className="text-zinc-300">Food delivery is 100% invisible. Users see ONLY King Pay UPI & soundbox.</p>
            <span className="text-[11px] text-zinc-400 font-mono block">Section 79 IT Act Compliant</span>
          </div>
        </div>
      </div>
    );
  }

  // Card: Auto-Clean & Self-Correction
  if (card.type === "auto_clean") {
    return (
      <div className="rounded-xl border border-emerald-500/40 bg-zinc-900/95 p-4 space-y-2.5 shadow-xl text-zinc-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">State Clean & Verified</span>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
            EVIDENCE CHECK REQ
          </Badge>
        </div>
        <p className="text-xs text-zinc-300">
          All state discrepancies, transient errors, and cache invalidations resolved. Clean sovereign baseline restored.
        </p>
      </div>
    );
  }

  return null;
}

// In-Chat Credential Vault Card
function InChatCredentialCard({ onSave }: { onSave?: (keys: FounderCredentials) => void }) {
  const [keys, setKeys] = useState<FounderCredentials>(() => {
    if (typeof window === "undefined") return DEFAULT_CREDENTIALS;
    try {
      const saved = localStorage.getItem("orderking_founder_credentials");
      return saved ? JSON.parse(saved) : DEFAULT_CREDENTIALS;
    } catch {
      return DEFAULT_CREDENTIALS;
    }
  });

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("orderking_founder_credentials", JSON.stringify(keys));
    }
    if (onSave) onSave(keys);
    supremeAudioDsp.playTone("success_chime");
    toast.success("Credentials securely saved to Sovereign Local Vault!");
  };

  return (
    <div className="rounded-xl border border-amber-500/40 bg-black/70 p-3.5 space-y-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Key className="size-4 text-amber-400" />
          <span className="text-xs font-bold text-white">Founder Credential Vault (Local Storage)</span>
        </div>
        <Badge className="bg-amber-500/20 text-amber-300 text-[10px]">Client-Side Only</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[10px] text-muted block mb-0.5">OPENAI_API_KEY</label>
          <Input
            type="password"
            value={keys.openAiKey}
            onChange={(e) => setKeys({ ...keys, openAiKey: e.target.value })}
            placeholder="sk-..."
            className="h-7 text-xs bg-surface-2"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted block mb-0.5">ANTHROPIC_API_KEY</label>
          <Input
            type="password"
            value={keys.anthropicKey}
            onChange={(e) => setKeys({ ...keys, anthropicKey: e.target.value })}
            placeholder="sk-ant-..."
            className="h-7 text-xs bg-surface-2"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted block mb-0.5">STRIPE_SECRET_KEY</label>
          <Input
            type="password"
            value={keys.stripeKey}
            onChange={(e) => setKeys({ ...keys, stripeKey: e.target.value })}
            placeholder="sk_live_..."
            className="h-7 text-xs bg-surface-2"
          />
        </div>
        <div>
          <label className="text-[10px] text-muted block mb-0.5">FOUNDER_UPI_VPA</label>
          <Input
            value={keys.founderUpiVpa}
            onChange={(e) => setKeys({ ...keys, founderUpiVpa: e.target.value })}
            placeholder="e.g. orderking@okhdfcbank"
            className="h-7 text-xs bg-surface-2"
          />
        </div>
      </div>

      <Button
        size="sm"
        onClick={handleSave}
        className="w-full text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md"
      >
        <Save className="size-3 mr-1.5" />
        Save Credentials to Sovereign Vault
      </Button>
    </div>
  );
}

// Execution Steps Viewer
function ExecutionStepsViewer({ steps }: { steps: AgentExecutionStep[] }) {
  return null;
}

export function SupremeFounderAiChat({
  founderUpiVpa = "orderking@okhdfcbank",
  onSelectAction,
  defaultCallMode = false,
}: SupremeFounderAiChatProps) {
  const [selectedModel, setSelectedModel] = useState<AiModelId>("auto-supreme-orchestrator");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedPersona, setSelectedPersona] = useState<VoicePersonaId>("aria");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en-IN");
  const [inputQuery, setInputQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCallMode, setIsCallMode] = useState(defaultCallMode);
  const [isImmersiveCall, setIsImmersiveCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [showCredentialDrawer, setShowCredentialDrawer] = useState(false);
  const [doubleEngineEnabled, setDoubleEngineEnabled] = useState(true);
  const [attachments, setAttachments] = useState<Array<{file: File, url: string, type: 'image'|'file'}>>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);

  // Chat history with initial professional greeting
  const [messages, setMessages] = useState<SupremeAiMessage[]>([
    {
      id: "msg-init",
      sender: "ai",
      text: `Hello! How can I help you today?

You can ask me anything across software engineering, architecture, business analytics, operations, strategic planning, or general inquiries. Type a message or use the microphone to begin.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelUsed: "auto-supreme-orchestrator",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const cachedVoicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Load and cache browser voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        cachedVoicesRef.current = voices;
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Call timer effect
  useEffect(() => {
    let timer: any;
    if (isCallMode) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCallMode]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  // Speech Synthesis with Young Natural Female Acoustic Profile & Web Audio DSP
  const speakText = (text: string, langCode?: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !voiceEnabled) return;

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();

      supremeAudioDsp.init();
      const persona = VOICE_PERSONAS[selectedPersona];
      supremeAudioDsp.applyDspProfile(persona.dspProfile);

      // Strip markdown formatting, symbols, and bullets before sending to speech synthesis
      const cleanText = text
        .replace(/###\s+/g, "")
        .replace(/##\s+/g, "")
        .replace(/#\s+/g, "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/`{1,3}[^`]*`{1,3}/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/^\s*[-*+]\s+/gm, "")
        .replace(/^[0-9]+\.\s+/gm, "")
        .replace(/>\s*/g, "")
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = persona.rate;
      utterance.pitch = persona.pitch;

      const targetLang = langCode || selectedLanguage;
      utterance.lang = targetLang;

      const voices =
        cachedVoicesRef.current.length > 0
          ? cachedVoicesRef.current
          : window.speechSynthesis.getVoices();

      const bestVoice = selectBestBrowserVoice(voices, persona, targetLang);
      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        // Full duplex auto-turn-taking: when AI stops speaking, wake microphone automatically in call mode
        if (isCallMode) {
          setTimeout(() => {
            startListening();
          }, 250);
        }
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        if (isCallMode) {
          setTimeout(() => {
            startListening();
          }, 350);
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Speech Recognition (Speech-to-Text) with Auto-Interruption
  const startListening = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    // Auto-interruption: If AI is speaking and user speaks or taps mic, stop AI speech immediately
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      stopSpeaking();
      supremeAudioDsp.playTone("interruption_ping");
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = selectedLanguage;

    recognition.onstart = () => {
      setIsListening(true);
      setLiveTranscript("");
    };

    recognition.onresult = (event: any) => {
      let currentInterim = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const finalTranscript = event.results[i][0].transcript;
          setIsListening(false);
          setLiveTranscript(finalTranscript);
          if (finalTranscript.trim()) {
            handleSendQuery(finalTranscript);
          }
        } else {
          currentInterim += event.results[i][0].transcript;
          setLiveTranscript(currentInterim);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn("Recognition start failed:", e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      setIsListening(false);
    }
  };

  // Main Query Dispatcher with Real SSE Streaming & Local Sovereign Fallback
  const handleSendQuery = async (queryText: string) => {
    const text = queryText.trim();
    if (!text) return;

    // Add user message
    const userMsg: SupremeAiMessage = {
      id: `msg-${Date.now()}`,
      sender: "founder",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputQuery("");
    setIsProcessing(true);

    // Stop any ongoing speech
    stopSpeaking();

    const aiMsgId = `msg-ai-${Date.now()}`;
    const initialAiMsg: SupremeAiMessage = {
      id: aiMsgId,
      sender: "ai",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelUsed: selectedModel,
      executionSteps: [],
    };
    setMessages((prev) => [...prev, initialAiMsg]);

    try {
      const apiMessages: any[] = newMessages.slice(-10).map((m) => ({
        role: (m.sender === "founder" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      }));

      if (attachments.length > 0 && apiMessages.length > 0 && apiMessages[apiMessages.length - 1].role === "user") {
        const processedAttachments = await Promise.all(attachments.map(async (att) => {
          const contentBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(att.file);
          });
          return {
            name: att.file.name,
            type: att.file.type,
            content: contentBase64,
            size: att.file.size
          };
        }));
        
        apiMessages[apiMessages.length - 1].attachments = processedAttachments;
        setAttachments([]);
      }
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          messages: apiMessages,
          modelId: selectedModel,
          mode: "auto",
          founderUpiVpa,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = "";
      let executionSteps: AgentExecutionStep[] = [];
      let detectedLanguage = selectedLanguage || "en-IN";
      let actionCard: any = undefined;
      let mediaCard: any = undefined;
      let finalModelUsed = selectedModel;

      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const jsonStr = trimmed.slice(6);
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === "delta" && typeof event.data === "string") {
              streamedText += event.data;
              setMessages((prev) =>
                prev.map((m) => (m.id === aiMsgId ? { ...m, text: streamedText } : m))
              );
            } else if (event.type === "step" && event.data) {
              const stepObj = event.data;
              executionSteps = [
                ...executionSteps.filter((s) => s.stepNumber !== stepObj.stepNumber),
                {
                  stepNumber: stepObj.stepNumber || executionSteps.length + 1,
                  totalSteps: stepObj.totalSteps || 3,
                  label: stepObj.label || "Processing",
                  status: stepObj.status || "RUNNING",
                  detail: stepObj.detail,
                },
              ];
              setMessages((prev) =>
                prev.map((m) => (m.id === aiMsgId ? { ...m, executionSteps } : m))
              );
            } else if (event.type === "done") {
              if (event.data?.text && !streamedText) {
                streamedText = event.data.text;
              }
              actionCard = event.data?.actionCard;
              mediaCard = event.data?.mediaCard;
              finalModelUsed = event.data?.modelUsed || selectedModel;
              if (event.data?.executionSteps) {
                executionSteps = event.data.executionSteps;
              }
            }
          } catch (e) {
            console.warn("[ai-chat] Error parsing SSE chunk:", e);
          }
        }
      }

      setIsProcessing(false);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
                ...m,
                text: streamedText,
                language: detectedLanguage,
                modelUsed: finalModelUsed,
                executionSteps,
                actionCard,
                mediaCard,
              }
            : m
        )
      );
      supremeAudioDsp.playTone("interruption_ping");

      if (voiceEnabled) {
        const cleanSpoken = streamedText
          .replace(/```[\s\S]*?```/g, "Code implementation is ready on screen.")
          .replace(/#{1,6}\s?/g, "")
          .replace(/\*\*([^*]+)\*\*/g, "$1")
          .replace(/\*([^*]+)\*/g, "$1")
          .replace(/`([^`]+)`/g, "$1")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .replace(/[👑⚡💎🚀✨🛡️💡🎯🔥🩺📊💻👋]/g, "")
          .trim();
        const sentences = cleanSpoken.split(/(?<=[.?!])\s+/);
        const spoken = sentences.slice(0, 2).join(" ").slice(0, 250);
        speakText(spoken || "I have prepared the complete answer on your screen.", detectedLanguage);
      }
    } catch (err) {
      console.error("[ai-chat] AI Service unavailable:", err);
      setIsProcessing(false);
      
      const aiMsg: SupremeAiMessage = {
        id: aiMsgId,
        sender: "ai",
        text: `⚠️ **Critical System Fault**\n\nThe Supreme Founder AI engine could not be reached. The system strictly operates in Fail-Closed mode to guarantee security and prevent the emission of unauthorized simulated offline responses.\n\n**Error Details:** ${err instanceof Error ? err.message : String(err)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        language: "en-US",
        modelUsed: selectedModel
      };

      setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? aiMsg : m)));
      supremeAudioDsp.playTone("error");
      toast.error("Fail-Closed Protection Triggered: AI response aborted.");
    }
  };

  const toggleCallMode = () => {
    const next = !isCallMode;
    setIsCallMode(next);
    if (next) {
      supremeAudioDsp.playTone("call_connected");
      toast.error("📞 VOICE BLOCKED: WebRTC Provider Configuration Missing");
      speakText(
        "Voice call connected. How can I help you today?",
        selectedLanguage
      );
    } else {
      supremeAudioDsp.playTone("call_ended");
      stopSpeaking();
      stopListening();
      setIsImmersiveCall(false);
      toast.info("Voice call ended.");
    }
  };

  const currentPersonaObj = VOICE_PERSONAS[selectedPersona];

  return (
    <div className="relative flex h-[720px] max-h-[85vh] w-full rounded-2xl border border-zinc-800 bg-[#121214] text-zinc-100 shadow-2xl overflow-hidden font-sans">
      {/* 1. LEFT COLLAPSIBLE CHATGPT SIDEBAR */}
      {sidebarOpen && (
        <aside className="w-72 shrink-0 border-r border-zinc-800/80 bg-[#18181B] flex flex-col justify-between transition-all duration-300 z-20">
          <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
            {/* Brand Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-400/30">
                  <Crown className="size-4" />
                </div>
                <div>
                  <span className="font-extrabold text-sm tracking-tight text-white block">Umar OS</span>
                  <span className="text-[10px] text-zinc-400 block font-medium">Single Founder Control</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="size-4" />
              </button>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-zinc-400" />
              <Input
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search chats & commands..."
                className="h-8 pl-8 text-xs bg-zinc-900 border-zinc-700/70 text-zinc-200 placeholder:text-zinc-500 rounded-lg focus-visible:ring-amber-500/50"
              />
            </div>

            {/* + New Chat Button */}
            <Button
              size="sm"
              onClick={() => {
                setMessages([
                  {
                    id: `msg-${Date.now()}`,
                    sender: "ai",
                    text: `### 👑 Umar OS Active\nHow can I serve you right now, Founder? You have full access to all 6 frontier models, instant live app deployment, 500+ app connectors, and 1,000x strict geofencing.`,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    modelUsed: selectedModel,
                  },
                ]);
                toast.success("Started a fresh Umar OS session");
              }}
              className="w-full justify-start h-8 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60 rounded-lg transition"
            >
              <Plus className="size-3.5 mr-2 text-amber-400" />
              New Founder Chat
            </Button>

            {/* Pinned Sovereign Commands */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1 block">
                Frontier Capabilities
              </span>
              {[
                {
                  label: "Multi-Model Consensus",
                  icon: Cpu,
                  query: "Execute multi-model consensus across OpenAI GPT-4o, Claude 3.7 Sonnet, Grok 2, Gemini 2.0 Flash, Codex, and DeepSeek",
                  color: "text-cyan-400",
                },
                {
                  label: "1-Command Live App Deploy",
                  icon: Rocket,
                  query: "Scaffold and deploy a high-conversion client web portal live to edge in 1 command",
                  color: "text-emerald-400",
                },
                {
                  label: "500+ App Integrations",
                  icon: Globe,
                  query: "Inspect and connect external integrations with WhatsApp, Stripe, GitHub, and Shopify",
                  color: "text-blue-400",
                },
                {
                  label: "4K Media & Video Studio",
                  icon: Sparkles,
                  query: "Generate 4K cinematic product promo video and high-resolution marketing assets",
                  color: "text-amber-400",
                },
                {
                  label: "Pan-India Geofence Guard",
                  icon: ShieldCheck,
                  query: "Audit Pan-India geofencing: show food delivery active in Karimganj only, King Pay everywhere",
                  color: "text-emerald-400",
                },
                {
                  label: "Check Model Updates",
                  icon: RefreshCw,
                  query: "Scan AI frontier for next-generation model releases like GPT-6 and Claude 5",
                  color: "text-purple-400",
                },
                {
                  label: "Auto-Clean & Self-Correct",
                  icon: CheckCircle2,
                  query: "Run auto-clean and self-correct all system state glitches with zero downtime",
                  color: "text-rose-400",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSendQuery(item.query)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition text-left"
                  >
                    <Icon className={`size-3.5 shrink-0 ${item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Chat History Sessions */}
            <div className="space-y-1 pt-2 border-t border-zinc-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1 block">
                Recent Chats
              </span>
              {[
                { id: "c1", title: "Client Acquisition Pipeline" },
                { id: "c2", title: "Hospital ERP Scaffolding" },
                { id: "c3", title: "Direct UPI 0% Settlements" },
                { id: "c4", title: "Remote Work Radar ($120/hr)" },
                { id: "c5", title: "Pan-India Geofence Guard" },
                { id: "c6", title: "Autonomous Hot-Upgrades" },
              ]
                .filter((c) =>
                  searchFilter
                    ? c.title.toLowerCase().includes(searchFilter.toLowerCase())
                    : true
                )
                .map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => handleSendQuery(`Review ${session.title}`)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition text-left truncate"
                  >
                    <MessageSquare className="size-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Sidebar Footer: Founder Identity Mask & System Health */}
          <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-zinc-200">Founder Sovereign</span>
              </div>
              <Badge className="bg-zinc-800 text-[10px] text-zinc-400 border-zinc-700">Masked</Badge>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span>Edge Status:</span>
              <span className="text-emerald-400">EVIDENCE CHECK REQ</span>
            </div>
          </div>
        </aside>
      )}

      {/* 2. MAIN CHATGPT WORKSPACE */}
      <main className="flex-1 flex flex-col h-full bg-[#121214] overflow-hidden">
        {/* Top Cockpit Bar */}
        <header className="h-14 border-b border-zinc-800/80 bg-[#18181B]/80 px-4 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition mr-1"
                title="Open sidebar"
              >
                <PanelLeftOpen className="size-4" />
              </button>
            )}

            {/* Model Selector Dropdown */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDoubleEngineEnabled(!doubleEngineEnabled)}
                className={`hidden md:flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  doubleEngineEnabled 
                    ? "bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                    : "bg-zinc-900 text-zinc-400 border-zinc-700 hover:text-zinc-200"
                }`}
                title="Double Engine Consensus Validator (100x Realism)"
              >
                <Layers className="size-3.5 mr-1.5" />
                Double Engine: {doubleEngineEnabled ? "ON" : "OFF"}
              </button>
              <select
                value={selectedModel}
                onChange={(e) => {
                  const m = e.target.value as AiModelId;
                  setSelectedModel(m);
                  supremeAudioDsp.playTone("interruption_ping");
                  toast.success(`Active Model: ${m.toUpperCase()}`);
                }}
                className="h-8 rounded-lg bg-zinc-900 border border-zinc-700 px-3 text-xs font-bold text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="auto-supreme-orchestrator">⚡ Auto Supreme Orchestrator (Autonomous Best)</option>
                <option value="ensemble-consensus">🧠 Multi-Model Consensus (Real Verification)</option>
                <option value="gpt-5-6-omni">🔮 OpenAI GPT-4o (Frontier Multimodal)</option>
                <option value="claude-4-6-opus">⚡ Anthropic Claude 3.7 Sonnet (Hybrid Reasoning)</option>
                <option value="grok-4-6-super">🚀 xAI Grok 2 (Real-Time Intelligence)</option>
                <option value="gemini-3-8-ultra">💎 Google Gemini 2.0 Flash (Fast Reasoning)</option>
                <option value="codex-supreme">💻 Codex Architecture Engine (Local Core)</option>
                <option value="deepseek-r1-sovereign">🛡️ DeepSeek R1 (Local Reasoning)</option>
                <option value="sovereign-ultra">👑 Umar Local Sovereign Core</option>
              </select>

              {/* Generation Auto-Update Indicator */}
              <button
                type="button"
                onClick={() => handleSendQuery("Check frontier AI model releases and available generation upgrades")}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700/80 text-[11px] font-medium text-amber-400 hover:bg-zinc-800 transition"
              >
                <Sparkles className="size-3 text-amber-400" />
                <span>Auto-Updater Armed</span>
              </button>
            </div>
          </div>

          {/* Right Header Controls: Voice Persona, Audio toggle, and Call Button */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPersona}
              onChange={(e) => {
                const pid = e.target.value as VoicePersonaId;
                setSelectedPersona(pid);
                supremeAudioDsp.playTone("interruption_ping");
                toast.success(`Voice set to ${VOICE_PERSONAS[pid].name}`);
              }}
              className="hidden lg:block h-8 rounded-lg bg-zinc-900 border border-zinc-700 px-2 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="aria">🎙️ Aria (Global Executive)</option>
              <option value="priya">🎙️ Priya (Indian Founder)</option>
              <option value="ananya">🎙️ Ananya (Bengal/Sylheti)</option>
              <option value="zara">🎙️ Zara (European Polyglot)</option>
            </select>

            <select
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                supremeAudioDsp.playTone("interruption_ping");
                toast.info(`Language set to ${e.target.value}`);
              }}
              className="hidden sm:block h-8 rounded-lg bg-zinc-900 border border-zinc-700 px-2 text-xs text-zinc-300 focus:outline-none"
            >
              <option value="en-IN">🇮🇳 Indian English</option>
              <option value="bn-IN">🇮🇳 Bengali (বাংলা)</option>
              <option value="hi-IN">🇮🇳 Hindi (हिन्दी)</option>
              <option value="as-IN">🇮🇳 Assamese (অসমীয়া)</option>
              <option value="en-US">🇺🇸 Global English</option>
              <option value="es-ES">🇪🇸 Spanish</option>
              <option value="ar-SA">🇸🇦 Arabic</option>
            </select>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                if (voiceEnabled) stopSpeaking();
              }}
              className={`h-8 px-2.5 text-xs ${
                voiceEnabled ? "text-amber-400 border-amber-500/40 bg-zinc-900" : "text-zinc-500 border-zinc-800 bg-zinc-900"
              }`}
              title={voiceEnabled ? "Mute voice response" : "Unmute voice response"}
            >
              {voiceEnabled ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
            </Button>

            <Button
              size="sm"
              onClick={toggleCallMode}
              className={`h-8 px-3 font-bold text-xs shadow-md transition ${
                isCallMode
                  ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              {isCallMode ? (
                <>
                  <PhoneOff className="size-3.5 mr-1" />
                  End Call ({Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, "0")})
                </>
              ) : (
                <>
                  <PhoneCall className="size-3.5 mr-1" />
                  Voice Call
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Embedded Voice Call Banner (when active and not immersive) */}
        {isCallMode && !isImmersiveCall && (
          <div className="bg-zinc-900/90 border-b border-zinc-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-4">
              <RadialOrbVisualizer
                isSpeaking={isSpeaking}
                isListening={isListening}
                isCallMode={isCallMode}
                size={110}
                personaColor={currentPersonaObj.vocalAuraColor}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex size-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Hands-Free Voice Call Active
                  </span>
                  <Badge className="bg-zinc-800 text-amber-300 text-[10px] font-mono border-zinc-700">
                    {currentPersonaObj.name} Voice
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Speak naturally. Auto-turn-taking and zero-delay interruption active.
                </p>
                {liveTranscript && (
                  <div className="mt-1.5 text-xs font-mono text-cyan-300 bg-zinc-950 px-2 py-0.5 rounded border border-cyan-500/30">
                    🎤 &quot;{liveTranscript}&quot;
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsImmersiveCall(true)}
                className="h-8 text-xs font-bold text-amber-300 border-zinc-700 bg-zinc-800"
              >
                <Maximize2 className="size-3.5 mr-1" />
                Immersive View
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={isListening ? stopListening : startListening}
                className={`h-8 text-xs font-bold ${
                  isListening
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse"
                    : "bg-zinc-800 text-white border-zinc-700"
                }`}
              >
                {isListening ? <Mic className="size-3.5 mr-1 text-cyan-400" /> : <MicOff className="size-3.5 mr-1" />}
                {isListening ? "Listening..." : "Tap to Speak"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={toggleCallMode}
                className="h-8 text-xs font-bold text-rose-400 border-rose-500/40 hover:bg-rose-500/10"
              >
                <PhoneOff className="size-3.5 mr-1" />
                Disconnect
              </Button>
            </div>
          </div>
        )}

        {/* FULL-SCREEN / IMMERSIVE VOICE TELECONFERENCE */}
        {isCallMode && isImmersiveCall && (
          <div className="absolute inset-0 z-50 bg-[#121214] flex flex-col justify-between p-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Crown className="size-5 text-amber-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">Full-Duplex Executive Teleconference</h4>
                  <p className="text-xs text-zinc-400">
                    {currentPersonaObj.name} · {currentPersonaObj.tagline}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge className="bg-zinc-800 text-emerald-300 text-xs font-mono border-zinc-700">
                  Duration: {Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, "0")}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsImmersiveCall(false)}
                  className="h-8 text-xs font-bold text-zinc-300 border-zinc-700 bg-zinc-800"
                >
                  <Minimize2 className="size-3.5 mr-1" />
                  Minimize
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center my-auto space-y-6">
              <RadialOrbVisualizer
                isSpeaking={isSpeaking}
                isListening={isListening}
                isCallMode={isCallMode}
                size={240}
                personaColor={currentPersonaObj.vocalAuraColor}
              />
              <div className="max-w-xl text-center px-4">
                <p className="text-sm font-medium text-zinc-200 leading-relaxed min-h-[44px]">
                  {liveTranscript ? (
                    <span className="text-cyan-300">&quot;{liveTranscript}&quot;</span>
                  ) : isSpeaking ? (
                    <span className="text-amber-300">Umar OS is speaking...</span>
                  ) : (
                    <span className="text-zinc-500">Speak freely in English, Hindi, Bengali, or any language...</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 border-t border-zinc-800 pt-4">
              <Button
                size="lg"
                variant="outline"
                onClick={isListening ? stopListening : startListening}
                className={`h-11 px-5 text-xs font-bold rounded-full ${
                  isListening
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse"
                    : "bg-zinc-800 text-white border-zinc-700"
                }`}
              >
                {isListening ? <Mic className="size-4 mr-2 text-cyan-400" /> : <MicOff className="size-4 mr-2" />}
                {isListening ? "Listening..." : "Tap to Speak"}
              </Button>
              {isSpeaking && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={stopSpeaking}
                  className="h-11 px-5 text-xs font-bold rounded-full text-amber-300 border-amber-500/40 bg-zinc-800"
                >
                  <VolumeX className="size-4 mr-2" />
                  Interrupt AI
                </Button>
              )}
              <Button
                size="lg"
                onClick={toggleCallMode}
                className="h-11 px-6 text-xs font-bold rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-xl"
              >
                <PhoneOff className="size-4 mr-2" />
                Disconnect Call
              </Button>
            </div>
          </div>
        )}

        {/* Chat Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === "founder" ? "items-end" : "items-start"} space-y-1.5`}
            >
              <div className="flex items-center gap-2 text-[10px] text-zinc-400 px-1">
                <span className="font-semibold uppercase">
                  {m.sender === "founder" ? "👑 You (Founder)" : `⚡ Umar OS (${currentPersonaObj.name})`}
                </span>
                {m.modelUsed && <span className="font-mono text-amber-400">[{m.modelUsed}]</span>}
                <span>{m.timestamp}</span>
              </div>

              <div
                className={`rounded-2xl p-4 max-w-[95%] sm:max-w-[85%] text-xs sm:text-sm leading-relaxed ${
                  m.sender === "founder"
                    ? "bg-zinc-800 text-zinc-100 font-medium shadow-md border border-zinc-700/60 rounded-br-none"
                    : "bg-zinc-900/90 border border-zinc-800 text-zinc-200 shadow-md rounded-bl-none"
                }`}
              >
                <div className="whitespace-pre-line prose prose-invert prose-zinc max-w-none text-zinc-200">
                  {m.text}
                </div>

                {/* Render Autonomous Execution Steps Timeline */}
                {m.executionSteps && m.executionSteps.length > 0 && (
                  <ExecutionStepsViewer steps={m.executionSteps} />
                )}

                {/* Render Action Card if Available */}
                {m.actionCard && (
                  <div className="mt-3.5 pt-3.5 border-t border-zinc-800">
                    <ActionCardView card={m.actionCard} onSaveKeys={() => setShowCredentialDrawer(false)} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-amber-400 font-mono p-2">
              <Sparkles className="size-4 animate-spin text-amber-400" />
              <span>Umar OS executing consensus, telemetry &amp; live edge pipeline...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom ChatGPT Prompt Dock */}
        <div className="p-3 sm:p-4 bg-[#121214] border-t border-zinc-800/80 space-y-2 shrink-0">
          {/* Preset Action Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-[10px] uppercase font-bold text-zinc-500 shrink-0 mr-1">Quick:</span>
            {[
              {
                label: "🧠 Run Model Consensus",
                query: "Execute multi-model consensus across OpenAI GPT-4o, Claude 3.7 Sonnet, Grok 2, Gemini 2.0 Flash, Codex, and DeepSeek",
              },
              {
                label: "🚀 Deploy New App Live",
                query: "Scaffold and deploy a high-conversion client web portal live to edge in 1 command",
              },
              {
                label: "🌐 Connect 500+ Apps",
                query: "Inspect and connect external integrations with WhatsApp, Stripe, GitHub, and Shopify",
              },
              {
                label: "🎬 Media Studio",
                query: "Open media studio to manage product images, marketing assets, and design templates",
              },
              {
                label: "🛡️ Pan-India Geofence Guard",
                query: "Audit Pan-India geofencing: show food delivery active in Karimganj only, King Pay everywhere",
              },
              {
                label: "⚡ Check Model Updates",
                query: "Scan AI frontier for next-generation model releases like GPT-6 and Claude 5",
              },
              {
                label: "🧹 Auto-Clean & Fix",
                query: "Run auto-clean and self-correct all system state glitches with zero downtime",
              },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleSendQuery(chip.query)}
                className="rounded-full border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-700 transition shrink-0 font-medium text-[11px]"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Attachments Preview Row */}
          {attachments.length > 0 && (
            <div className="flex gap-2 p-2 mb-2 bg-zinc-900/50 rounded-xl overflow-x-auto border border-zinc-800 shadow-inner">
              {attachments.map((att, i) => (
                <div key={i} className="relative group shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                  {att.type === 'image' ? (
                    <img src={att.url} alt="upload" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-[10px] text-zinc-400 text-center px-1 truncate">
                      {att.file.name}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg z-10"
                  >
                    <Plus className="size-3 rotate-45" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Floating ChatGPT Prompt Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery(inputQuery);
            }}
            className="relative flex items-center rounded-3xl bg-[#212121] border border-zinc-600/50 px-3 py-2 shadow-2xl focus-within:border-zinc-400 transition"
          >
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-zinc-400 hover:text-zinc-200 p-2 h-auto mr-1 hover:bg-zinc-700/50 rounded-full"
              title="Attach files or datasets"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.onchange = (e) => {
                  const files = Array.from((e.target as HTMLInputElement).files || []);
                  files.forEach(f => {
                    const url = URL.createObjectURL(f);
                    setAttachments(prev => [...prev, {file: f, url, type: f.type.startsWith("image/") ? "image" : "file"}]);
                  });
                  toast.success(`Attached ${files.length} file(s) for Double Engine analysis.`);
                };
                input.click();
              }}
            >
              <Paperclip className="size-5" />
            </Button>
            
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={`p-2 h-auto mr-1 rounded-full transition ${webSearchEnabled ? 'text-blue-400 bg-blue-500/10' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50'}`}
              title="Toggle Web Search"
              onClick={() => setWebSearchEnabled(!webSearchEnabled)}
            >
              <Globe className="size-5" />
            </Button>

            <Input
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Message Umar OS... Ask anything, deploy apps, or give an executive order"
              className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-0 shadow-none px-2"
            />

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={isListening ? stopListening : startListening}
              className={`p-1.5 h-auto rounded-full mr-1.5 transition ${
                isListening ? "text-cyan-400 bg-cyan-500/20 animate-pulse" : "text-zinc-400 hover:text-zinc-200"
              }`}
              title="Voice dictation"
            >
              {isListening ? <Mic className="size-4 text-cyan-400" /> : <Mic className="size-4" />}
            </Button>

            <Button
              type="submit"
              disabled={!inputQuery.trim() || isProcessing}
              size="sm"
              className="size-8 p-0 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold disabled:opacity-30 disabled:hover:bg-amber-500 shadow-sm shrink-0 flex items-center justify-center"
            >
              <ArrowUp className="size-4" />
            </Button>
          </form>

          <p className="text-[10px] text-center text-zinc-500">
            Umar OS · Sovereign Autonomous Founder Core · Free &amp; Unlimited Forever · Section 79 IT Act Protected
          </p>
        </div>
      </main>
    </div>
  );
}

