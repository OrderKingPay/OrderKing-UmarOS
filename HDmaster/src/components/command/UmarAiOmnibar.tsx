"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Mic,
  MicOff,
  Terminal,
  ArrowRight,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  Radio,
  Zap,
  Check,
  Copy,
  ChevronRight,
  Palette,
  DollarSign,
  Sliders,
  Eye,
  Info,
  CornerDownLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  UmarAiOmnibarController,
  type OmnibarState,
  type FounderActor,
  DEFAULT_FOUNDER_ACTOR,
} from "@/lib/orderking/ai/umar-ai-omnibar-controller";
import {
  UmarAiCustomizationCompiler,
  getUmarAiCompiler,
  type StagedPreviewDiff,
  type ExecutionReceipt,
} from "@/lib/orderking/ai/umar-ai-customization-compiler";

export interface UmarAiOmnibarProps {
  controller?: UmarAiOmnibarController;
  compiler?: UmarAiCustomizationCompiler;
  founder?: FounderActor;
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

const QUICK_COMMANDS = [
  {
    label: "Emerald Green Theme",
    icon: Palette,
    prompt: "Change customer app primary color to emerald green (#006A4E)",
    risk: "LOW",
  },
  {
    label: "Pay Button Wording",
    icon: Terminal,
    prompt: "Change checkout button to 'Confirm & Order Now'",
    risk: "LOW",
  },
  {
    label: "Reorder Sections",
    icon: Sliders,
    prompt: "Move promo banner above search bar on customer app",
    risk: "MEDIUM",
  },
  {
    label: "24% Commission (Gate)",
    icon: DollarSign,
    prompt: "Change commission to 24% for restaurant group",
    risk: "HIGH",
  },
  {
    label: "Delivery Fee Increase",
    icon: Zap,
    prompt: "Increase delivery charge by ₹5",
    risk: "HIGH",
  },
  {
    label: "Undo Last Change",
    icon: RotateCcw,
    prompt: "Undo last change",
    risk: "MEDIUM",
  },
];

export function UmarAiOmnibar({
  controller: customController,
  compiler: customCompiler,
  founder = DEFAULT_FOUNDER_ACTOR,
  isOpen: controlledIsOpen,
  onClose,
  className,
}: UmarAiOmnibarProps) {
  // Controller initialization
  const controllerRef = useRef<UmarAiOmnibarController | null>(null);
  if (!controllerRef.current) {
    const compiler = customCompiler ?? getUmarAiCompiler();
    controllerRef.current = customController ?? new UmarAiOmnibarController(compiler, founder);
  }
  const controller = controllerRef.current;

  // Local mirror of controller state
  const [state, setState] = useState<OmnibarState>(controller.getState());
  const [copiedHash, setCopiedHash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with controller state changes
  useEffect(() => {
    const unsubscribe = controller.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [controller]);

  // Handle controlled isOpen prop if provided
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      if (controlledIsOpen && !state.isOpen) {
        controller.open();
      } else if (!controlledIsOpen && state.isOpen) {
        controller.close();
      }
    }
  }, [controlledIsOpen, controller, state.isOpen]);

  // Global Keyboard Shortcuts: Ctrl+K / Cmd+K and Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Omnibar on Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        controller.toggle();
      }
      // Close on Escape
      if (e.key === "Escape" && state.isOpen) {
        e.preventDefault();
        controller.close();
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [controller, onClose, state.isOpen]);

  // Auto-focus input when opened
  useEffect(() => {
    if (state.isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [state.isOpen]);

  const handleClose = () => {
    controller.close();
    onClose?.();
  };

  const handleStagePrompt = (promptText?: string) => {
    const text = promptText ?? state.prompt;
    if (!text.trim()) {
      toast.error("Please enter a customization command or speak into the microphone.");
      return;
    }
    try {
      controller.setPrompt(text);
      const preview = controller.stagePrompt(text);
      toast.info(`Preview diff staged: ${preview.diffSummary}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to stage preview diff.");
    }
  };

  const handleExecute = (explicitApprovalGranted: boolean = false) => {
    try {
      const receipt = controller.executeStagedChange(explicitApprovalGranted);
      toast.success(receipt.message);
    } catch (err: any) {
      toast.error(err.message || "Execution blocked.");
    }
  };

  const handleUndo = () => {
    try {
      const receipt = controller.undoLastChange();
      toast.success(`Rolled back successfully to Version ${receipt.activeVersion}`);
    } catch (err: any) {
      toast.error(err.message || "Rollback failed.");
    }
  };

  const handleCopyAuditHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(true);
    toast.success("Audit SHA256 checksum copied to clipboard");
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const isColorHex = (val: unknown): boolean => {
    return typeof val === "string" && /^#[0-9a-fA-F]{6}$/.test(val);
  };

  // Render floating button when Omnibar is closed
  if (!state.isOpen) {
    return (
      <div className="fixed bottom-6 right-24 z-40 hidden sm:flex items-center gap-2">
        <button
          type="button"
          onClick={() => controller.open()}
          className="group flex items-center gap-2.5 rounded-full bg-zinc-950/90 border border-emerald-500/40 hover:border-emerald-400 px-4 py-2.5 text-xs font-semibold text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
          title="Open Umar AI Command Omnibar (Ctrl+K)"
        >
          <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 group-hover:rotate-12 transition-transform">
            <Sparkles className="size-3.5" />
          </div>
          <span className="font-mono tracking-wide text-zinc-100">Umar AI</span>
          <kbd className="inline-flex items-center gap-1 rounded bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-300 font-mono">
            <span>Ctrl</span>+<span>K</span>
          </kbd>
        </button>
      </div>
    );
  }

  const staged = state.stagedPreview;
  const receipt = state.executionReceipt;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20 px-3 sm:px-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={cn(
          "relative w-full max-w-3xl rounded-2xl border border-emerald-500/40 bg-zinc-950 shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden text-slate-100 flex flex-col max-h-[88vh]",
          className
        )}
      >
        {/* ================================================================= */}
        {/* HEADER BAR */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between border-b border-zinc-800 bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-950 px-4 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black tracking-wider text-emerald-400">
                  UMAR AI COMMAND OMNIBAR
                </span>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                  v{state.currentVersion}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Universal Natural Language & Voice Customization Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {state.currentVersion > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="h-7 text-xs gap-1 border-zinc-700 bg-zinc-900/80 text-amber-300 hover:bg-zinc-800 hover:text-amber-200"
                title="1-Click Undo / Rollback Previous Modification"
              >
                <RotateCcw className="size-3" />
                <span>Undo (v{state.currentVersion - 1})</span>
              </Button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Close (Escape)"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SEARCH & VOICE INPUT SECTION */}
        {/* ================================================================= */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 shrink-0">
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={state.prompt}
                onChange={(e) => controller.setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleStagePrompt();
                  }
                }}
                placeholder="Ask Umar AI... e.g. 'Change customer app primary color to emerald green (#006A4E)'"
                className="w-full rounded-xl bg-zinc-950 border border-zinc-700/80 focus:border-emerald-500 pl-11 pr-24 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-sans shadow-inner transition-colors"
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none">
                <Terminal className="size-4" />
              </div>

              {state.prompt && (
                <button
                  type="button"
                  onClick={() => controller.setPrompt("")}
                  className="absolute right-12 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 p-1 rounded-md"
                  title="Clear input"
                >
                  <X className="size-3.5" />
                </button>
              )}

              {/* Voice Microphone Trigger */}
              <button
                type="button"
                onClick={() => controller.toggleVoiceInput()}
                className={cn(
                  "absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all",
                  state.isListening
                    ? "bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.6)] animate-pulse"
                    : "text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800"
                )}
                title={
                  state.isListening
                    ? "Microphone is recording... Click to stop"
                    : "Voice Input (Click to speak command)"
                }
              >
                {state.isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>
            </div>

            {/* Stage Preview Action Button */}
            <Button
              variant="default"
              size="md"
              onClick={() => handleStagePrompt()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 h-11 px-4 shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0"
            >
              <span>Preview Diff</span>
              <CornerDownLeft className="size-3.5" />
            </Button>
          </div>

          {/* Voice status feedback */}
          {state.isListening && (
            <div className="flex items-center gap-2 mt-2 px-1 text-xs text-rose-400 animate-pulse font-mono">
              <span className="size-2 rounded-full bg-rose-500" />
              <span>Listening to founder voice command... {state.interimTranscript}</span>
            </div>
          )}

          {state.speechError && (
            <div className="flex items-center gap-2 mt-2 px-1 text-xs text-amber-400 font-mono">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>{state.speechError}</span>
            </div>
          )}

          {/* Quick preset suggestions */}
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider shrink-0 mr-1">
              Quick:
            </span>
            {QUICK_COMMANDS.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.label}
                  type="button"
                  onClick={() => handleStagePrompt(cmd.prompt)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 px-2.5 py-1 text-zinc-300 hover:text-emerald-300 transition shrink-0"
                >
                  <Icon className="size-3 text-emerald-400" />
                  <span>{cmd.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* BODY VIEWPORT (PREVIEW DIFF / RECEIPT / IDLE) */}
        {/* ================================================================= */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 1. STAGED BEFORE/AFTER VISUAL DIFF MODAL SECTION */}
          {staged && (
            <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 font-mono">
                    {staged.action}
                  </Badge>
                  <span className="text-xs text-zinc-400">Target:</span>
                  <span className="font-mono text-xs font-semibold text-zinc-200">
                    {staged.targetElement}
                  </span>
                  <span className="text-xs text-zinc-500">({staged.targetPlatform})</span>
                </div>

                <div className="flex items-center gap-2">
                  {staged.requiresFounderApproval ? (
                    <Badge variant="warning" className="bg-amber-500/10 text-amber-400 border-amber-500/40 gap-1">
                      <ShieldAlert className="size-3" />
                      FOUNDER GATE REQUIRED
                    </Badge>
                  ) : (
                    <Badge variant="success" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1">
                      <Check className="size-3" />
                      AUTO-APPROVED (LOW RISK)
                    </Badge>
                  )}
                  <button
                    type="button"
                    onClick={() => controller.clearPreview()}
                    className="text-zinc-500 hover:text-zinc-300 p-1"
                    title="Dismiss preview"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Diff summary title */}
              <div className="rounded-lg bg-zinc-950 p-3 border border-zinc-800/80">
                <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  Diff Proposal
                </div>
                <div className="text-sm text-zinc-100 font-medium mt-0.5">
                  {staged.diffSummary}
                </div>
              </div>

              {/* Side-by-Side Visual Diff Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* BEFORE / PREVIOUS VALUE */}
                <div className="rounded-xl border border-rose-500/30 bg-rose-950/15 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-rose-400 font-bold">
                    <span>PREVIOUS VALUE (BEFORE)</span>
                    <span className="text-[10px] uppercase">Active</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/50 border border-rose-500/20 text-zinc-200 font-mono text-xs break-all">
                    {isColorHex(staged.previousValue) ? (
                      <div className="flex items-center gap-3">
                        <div
                          className="size-7 rounded-lg border border-white/20 shadow-inner"
                          style={{ backgroundColor: String(staged.previousValue) }}
                        />
                        <span className="font-bold text-sm text-rose-300">
                          {String(staged.previousValue)}
                        </span>
                      </div>
                    ) : Array.isArray(staged.previousValue) ? (
                      <ol className="list-decimal pl-4 space-y-1 text-zinc-300">
                        {staged.previousValue.map((item, idx) => (
                          <li key={idx}>{String(item)}</li>
                        ))}
                      </ol>
                    ) : (
                      <span>{String(staged.previousValue ?? "None / Default")}</span>
                    )}
                  </div>
                </div>

                {/* AFTER / PROPOSED VALUE */}
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-emerald-400 font-bold">
                    <span>PROPOSED VALUE (AFTER)</span>
                    <span className="text-[10px] uppercase">Staged</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/50 border border-emerald-500/20 text-zinc-100 font-mono text-xs break-all">
                    {isColorHex(staged.proposedValue) ? (
                      <div className="flex items-center gap-3">
                        <div
                          className="size-7 rounded-lg border border-white/20 shadow-inner"
                          style={{ backgroundColor: String(staged.proposedValue) }}
                        />
                        <span className="font-bold text-sm text-emerald-300">
                          {String(staged.proposedValue)}
                        </span>
                      </div>
                    ) : Array.isArray(staged.proposedValue) ? (
                      <ol className="list-decimal pl-4 space-y-1 text-emerald-300 font-semibold">
                        {staged.proposedValue.map((item, idx) => (
                          <li key={idx}>{String(item)}</li>
                        ))}
                      </ol>
                    ) : (
                      <span className="font-bold text-emerald-300">
                        {String(staged.proposedValue)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Downstream Impact & Dependency Analysis */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 font-semibold">
                  <Layers className="size-3.5 text-emerald-400" />
                  <span>AFFECTED DOWNSTREAM PLATFORMS & COMPONENTS</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {staged.dependencyAnalysis.affectedPlatforms.map((plat) => (
                    <span
                      key={plat}
                      className="inline-flex items-center gap-1 rounded-md bg-zinc-900 border border-zinc-700 px-2 py-0.5 text-[11px] font-mono text-emerald-300"
                    >
                      <Radio className="size-2.5 text-emerald-400" />
                      {plat}
                    </span>
                  ))}
                  {staged.dependencyAnalysis.affectedRoutes.map((route) => (
                    <span
                      key={route}
                      className="inline-flex items-center rounded-md bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[11px] font-mono text-indigo-300"
                    >
                      {route}
                    </span>
                  ))}
                </div>

                {staged.dependencyAnalysis.downstreamComponents.length > 0 && (
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Components:{" "}
                    <span className="text-zinc-200">
                      {staged.dependencyAnalysis.downstreamComponents.join(", ")}
                    </span>
                  </div>
                )}

                {/* Accessibility contrast ratio impact */}
                {staged.dependencyAnalysis.accessibilityImpact && (
                  <div className="flex items-center gap-3 pt-1 text-[11px] font-mono">
                    <span className="text-zinc-400">Contrast Ratio:</span>
                    <span className="font-bold text-zinc-200">
                      {staged.dependencyAnalysis.accessibilityImpact.contrastRatio}:1
                    </span>
                    <span
                      className={cn(
                        "font-semibold",
                        staged.dependencyAnalysis.accessibilityImpact.passesAA
                          ? "text-emerald-400"
                          : "text-rose-400"
                      )}
                    >
                      WCAG AA: {staged.dependencyAnalysis.accessibilityImpact.passesAA ? "PASS" : "FAIL"}
                    </span>
                  </div>
                )}
              </div>

              {/* FOUNDER APPROVAL GATE BANNER & EXECUTION ACTIONS */}
              {staged.requiresFounderApproval ? (
                <div className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 to-zinc-950 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
                      <ShieldAlert className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-amber-300 tracking-wide">
                        FOUNDER APPROVAL GATE ENFORCED
                      </h4>
                      <p className="text-xs text-zinc-300 mt-0.5">
                        High-risk pricing/commission modification detected. This change alters core
                        financial economics or contract terms. Explicit 1-click founder confirmation is mandatory.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => controller.clearPreview()}
                      className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleExecute(true)}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.35)]"
                    >
                      <ShieldCheck className="size-4" />
                      <span>Founder Authorize & Execute (1-Click)</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => controller.clearPreview()}
                    className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleExecute(false)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    <CheckCircle2 className="size-4" />
                    <span>Apply & Deploy Modification</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 2. RECENT EXECUTION RECEIPT WITH 1-CLICK ROLLBACK */}
          {receipt && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
                      Execution Succeeded
                    </h4>
                    <p className="text-xs text-zinc-300">{receipt.message}</p>
                  </div>
                </div>

                <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 font-mono text-xs">
                  Active v{receipt.activeVersion}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400 pt-1">
                <div className="flex items-center gap-1.5">
                  <span>Execution ID:</span>
                  <span className="text-zinc-200">{receipt.executionId}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Audit SHA256:</span>
                  <button
                    type="button"
                    onClick={() => handleCopyAuditHash(receipt.auditHash)}
                    className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                    title="Click to copy full hash"
                  >
                    <span>{receipt.auditHash.substring(0, 12)}...</span>
                    {copiedHash ? <Check className="size-3" /> : <Copy className="size-3" />}
                  </button>
                </div>
              </div>

              {/* 1-CLICK UNDO / ROLLBACK ACTION BUTTON */}
              <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20">
                <span className="text-xs text-zinc-400 font-sans">
                  Snapshot saved at Version {receipt.rollbackSnapshotVersion}.
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  className="h-8 text-xs gap-1.5 border-amber-500/50 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 hover:text-amber-200 font-semibold"
                >
                  <RotateCcw className="size-3.5" />
                  <span>1-Click Undo / Rollback</span>
                </Button>
              </div>
            </div>
          )}

          {/* 3. IDLE GUIDANCE / HISTORY */}
          {!staged && !receipt && (
            <div className="space-y-4 py-6 text-center">
              <div className="flex justify-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 text-emerald-400 shadow-inner">
                  <Terminal className="size-7" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-zinc-100">
                  Ready for Customization Command
                </h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Type a prompt above or click the microphone to speak. The compiler will parse your
                  intent, stage a before/after visual diff, and enforce founder governance.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 max-w-xl mx-auto text-left">
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-400">
                    <Palette className="size-3.5" />
                    <span>Colors & Fonts</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    "Change customer app primary color to emerald green"
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-indigo-400">
                    <Sliders className="size-3.5" />
                    <span>Layout & UI</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    "Move promo banner above search bar on customer app"
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                    <ShieldAlert className="size-3.5" />
                    <span>Founder Gate</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    "Change commission to 24% for restaurant group"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* FOOTER BAR */}
        {/* ================================================================= */}
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs text-zinc-500 font-mono shrink-0">
          <div className="flex items-center gap-3">
            <span>
              Trigger: <kbd className="text-zinc-300">Ctrl+K</kbd> / <kbd className="text-zinc-300">Cmd+K</kbd>
            </span>
            <span>•</span>
            <span>
              Close: <kbd className="text-zinc-300">Esc</kbd>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 font-semibold">Umar AI Pipeline Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UmarAiOmnibar;
