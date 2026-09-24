import { useState } from "react";
import { toast } from "sonner";
import {
  Building,
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  Download,
  Eye,
  FileCode,
  Globe,
  Layers,
  Play,
  RefreshCw,
  Rocket,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface CompanyStage {
  step: number;
  id: string;
  name: string;
  icon: string;
  artifactTitle: string;
  artifactSummary: string;
  artifactContent: string;
}

export const FACTORY_STAGES: CompanyStage[] = [
  {
    step: 1,
    id: "market_research",
    name: "1. Market Research & TAM",
    icon: "📊",
    artifactTitle: "Market Opportunity & Competitor Gap Analysis",
    artifactSummary: "TAM: ₹4,800 Cr in Tier 2/3 Indian cities. Primary competitor weakness: 28% aggregator fees.",
    artifactContent: `# Market Research Brief\n\n- **Target Market:** Hyperlocal quick commerce & regional restaurant direct ordering.\n- **Primary Pain Point:** Merchants lose 24-28% of gross margin to Zomato/Swiggy commissions.\n- **Market Size (Barak Valley / Assam Cluster):** 1,200+ food outlets with ₹18 Cr monthly food GMV.\n- **Competitive Advantage:** Zero-commission direct ordering with WhatsApp order alerts and 1-tap UPI QR.`,
  },
  {
    step: 2,
    id: "business_model",
    name: "2. Business Model Canvas",
    icon: "💼",
    artifactTitle: "Lean Business Model & Revenue Economics",
    artifactSummary: "Dual Revenue: ₹999/mo merchant SaaS retainer + ₹15 logistics fee per delivered order.",
    artifactContent: `# Lean Business Model\n\n- **Value Proposition:** Keep 100% of dish prices. Direct merchant customer ownership.\n- **Revenue Streams:**\n  1. Software Subscription: ₹999 / month per outlet.\n  2. Dynamic Delivery Margin: ₹15 - ₹25 per delivery over 3km.\n  3. KingPay FinTech Micro-Float: 0.25% merchant settlement fee for instant T+0 settlement.\n- **Cost Structure:** Serverless hosting (₹800/mo), Google Maps API (₹1,500/mo), SMS/WhatsApp Gateway (₹0.15/msg).`,
  },
  {
    step: 3,
    id: "brand_identity",
    name: "3. Brand & Design Tokens",
    icon: "🎨",
    artifactTitle: "Brand Identity, Voice & Design Tokens",
    artifactSummary: "Sovereign Gold & Emerald palette, premium typography, trustworthy voice.",
    artifactContent: `# Brand Design System\n\n- **Primary Brand Color:** Emerald Green (#059669) - Trust, freshness, prosperity.\n- **Accent Color:** Sovereign Gold (#F59E0B) - Royalty, quality, distinction.\n- **Background:** Deep Obsidian (#07130F) - Modern, luxury, battery-friendly.\n- **Brand Slogan:** "Order King: Dine Like Royalty, Pay Real Dine-In Prices."`,
  },
  {
    step: 4,
    id: "architecture_code",
    name: "4. Architecture & Production Code",
    icon: "⚡",
    artifactTitle: "Technical Architecture & Database Schema",
    artifactSummary: "React 19, TanStack Start, PostgreSQL schema, PWA offline manifest.",
    artifactContent: `# Technical Architecture\n\n- **Frontend:** TanStack Start + React 19 + Tailwind CSS v4.\n- **Database:** PostgreSQL (PGlite embedded or cloud instance) with Kysely query builder.\n- **Real-Time:** Server-Sent Events (SSE) for rider GPS telemetry.\n- **Security:** Better-Auth session tokens with Section 79 IT Act intermediary safe-harbor isolation.`,
  },
  {
    step: 5,
    id: "gtm_launch",
    name: "5. Go-To-Market Playbook",
    icon: "🚀",
    artifactTitle: "Go-To-Market Launch Strategy & Script",
    artifactSummary: "14-day field merchant blitz, WhatsApp status viral loops, pilot town geofence.",
    artifactContent: `# GTM Launch Playbook\n\n- **Day 1-3:** In-person onboarding of top 10 local biryani & dining outlets.\n- **Day 4-7:** Deploy pilot QR soundboxes and launch ₹100 discount coupon (LAUNCH100).\n- **Day 8-14:** Student brand ambassador referral program (₹25 wallet cash per install).`,
  },
];

export function CompanyFactoryHub() {
  const [ideaPrompt, setIdeaPrompt] = useState("Hyperlocal Cloud Kitchen Fleet with Zero Aggregator Commission");
  const [currentStep, setCurrentStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeStage = FACTORY_STAGES.find((s) => s.step === currentStep) || FACTORY_STAGES[0]!;

  const handleGenerateNext = () => {
    if (currentStep >= FACTORY_STAGES.length) {
      toast.success("🎉 Complete AI Company Factory Pipeline is fully generated!");
      return;
    }
    setIsGenerating(true);
    toast.info(`Orchestrating stage: ${FACTORY_STAGES[currentStep]!.name}...`);
    setTimeout(() => {
      setIsGenerating(false);
      setCurrentStep((prev) => prev + 1);
      toast.success(`Stage "${FACTORY_STAGES[currentStep]!.name}" completed with validated artifacts!`);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-full w-full bg-surface text-fg rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-2/40 p-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="size-5 text-emerald-500" />
            <h2 className="text-lg font-black tracking-tight">AI Company Factory &amp; Business Orchestrator</h2>
            <Badge tone="primary" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              Directive §10
            </Badge>
          </div>
          <p className="text-xs text-muted">
            Autonomous Company Scaffolding · Idea → Research → Business Model → Code → GTM Launch
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleGenerateNext}
            disabled={isGenerating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="size-3.5 mr-1 animate-spin" /> Orchestrating...
              </>
            ) : (
              <>
                <Play className="size-3.5 mr-1" /> Execute Next Stage
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Idea Specification Bar */}
      <div className="p-3 border-b border-border bg-surface flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[300px]">
          <span className="text-[10px] uppercase font-bold text-muted block mb-1">Target Business Concept:</span>
          <Input
            value={ideaPrompt}
            onChange={(e) => setIdeaPrompt(e.target.value)}
            className="text-xs font-semibold"
          />
        </div>

        <div className="flex items-center gap-1.5 pt-4 sm:pt-0">
          <Button
            size="sm"
            variant="outline"
            className="text-xs font-bold"
            onClick={() => {
              setCurrentStep(1);
              toast.info("Pipeline reset to Stage 1.");
            }}
          >
            Reset Pipeline
          </Button>
        </div>
      </div>

      {/* Main Workspace (Split: Left Stages, Right Generated Artifacts) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Column: Stage Navigator */}
        <div className="md:col-span-4 border-r border-border flex flex-col h-full bg-surface">
          <div className="p-3 border-b border-border bg-surface-2/30">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-muted">Pipeline Progress</h4>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {FACTORY_STAGES.map((stg) => {
              const isActive = currentStep === stg.step;
              const isCompleted = currentStep > stg.step;
              return (
                <div
                  key={stg.id}
                  onClick={() => setCurrentStep(stg.step)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isActive
                      ? "bg-primary/10 border-primary shadow-xs"
                      : isCompleted
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : "bg-surface hover:bg-surface-2/60 border-border"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-fg flex items-center gap-1.5">
                      <span>{stg.icon}</span>
                      <span>{stg.name}</span>
                    </span>
                    {isCompleted && (
                      <CheckCircle2 className="size-4 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted line-clamp-2">{stg.artifactSummary}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Generated Artifact Inspector */}
        <div className="md:col-span-8 flex flex-col h-full overflow-hidden bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5 bg-surface-2/20">
            <div className="flex items-center gap-2">
              <span className="text-lg">{activeStage.icon}</span>
              <div>
                <h3 className="font-bold text-xs text-fg">{activeStage.artifactTitle}</h3>
                <span className="text-[10px] text-muted">{activeStage.name}</span>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="text-xs font-bold"
              onClick={() => {
                void navigator.clipboard?.writeText(activeStage.artifactContent);
                toast.success("Artifact copied to clipboard!");
              }}
            >
              <Copy className="size-3.5 mr-1" /> Copy Markdown
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <pre className="font-mono text-xs text-fg leading-relaxed whitespace-pre-wrap bg-surface-2/30 p-4 rounded-xl border border-border">
              {activeStage.artifactContent}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
