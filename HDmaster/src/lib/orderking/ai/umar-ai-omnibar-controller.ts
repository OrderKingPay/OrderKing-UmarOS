/**
 * UMAR AI Interactive Command Omnibar Controller
 * Authority: Supreme Founder Autonomous AI Command & Governance
 *
 * Coordinates:
 * 1. Global Keyboard Shortcut Handling (Ctrl+K / Cmd+K / Escape)
 * 2. Natural Language Prompt Input & Speech Recognition (Web Speech API)
 * 3. 10-Stage Customization Compiler Pipeline Integration (stageChangePreview)
 * 4. Before/After Visual Diff Staging & Downstream Impact Inspection
 * 5. Founder Approval Gate Enforcement (Explicit 1-Click Signature for High-Risk Actions)
 * 6. 1-Click Rollback / Undo Pipeline
 */

import {
  UmarAiCustomizationCompiler,
  getUmarAiCompiler,
  type StagedPreviewDiff,
  type ExecutionReceipt,
} from "./umar-ai-customization-compiler";

export interface FounderActor {
  userId: string;
  role: string;
  name?: string;
  explicitApprovalGranted?: boolean;
}

export const DEFAULT_FOUNDER_ACTOR: FounderActor = {
  userId: "founder_umar_01",
  role: "SUPREME_FOUNDER",
  name: "Founder Umar",
};

export type OmnibarStatus =
  | "idle"
  | "listening"
  | "staging"
  | "preview_ready"
  | "executing"
  | "success"
  | "error";

export interface OmnibarHistoryItem {
  id: string;
  timestamp: string;
  prompt: string;
  preview: StagedPreviewDiff;
  receipt?: ExecutionReceipt;
}

export interface OmnibarState {
  isOpen: boolean;
  prompt: string;
  status: OmnibarStatus;
  isListening: boolean;
  interimTranscript: string;
  speechSupported: boolean;
  speechError: string | null;
  stagedPreview: StagedPreviewDiff | null;
  executionReceipt: ExecutionReceipt | null;
  lastExecutedReceipt: ExecutionReceipt | null;
  history: OmnibarHistoryItem[];
  error: string | null;
  currentVersion: number;
}

export type StateListener = (state: OmnibarState) => void;

// Web Speech API interface declarations for TypeScript compatibility
interface IWindowSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

export class UmarAiOmnibarController {
  private compiler: UmarAiCustomizationCompiler;
  private founder: FounderActor;
  private recognition: any = null;
  private listeners: Set<StateListener> = new Set();

  private state: OmnibarState = {
    isOpen: false,
    prompt: "",
    status: "idle",
    isListening: false,
    interimTranscript: "",
    speechSupported: false,
    speechError: null,
    stagedPreview: null,
    executionReceipt: null,
    lastExecutedReceipt: null,
    history: [],
    error: null,
    currentVersion: 1,
  };

  constructor(
    compiler?: UmarAiCustomizationCompiler,
    founder: FounderActor = DEFAULT_FOUNDER_ACTOR
  ) {
    this.compiler = compiler ?? getUmarAiCompiler();
    this.founder = founder;
    this.state.currentVersion = this.compiler.getEngine().getVersion();
    this.checkSpeechSupport();
  }

  // ==========================================================================
  // STATE MANAGEMENT & SUBSCRIPTIONS
  // ==========================================================================

  public getState(): Readonly<OmnibarState> {
    return { ...this.state };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private updateState(partial: Partial<OmnibarState>): void {
    this.state = {
      ...this.state,
      ...partial,
      currentVersion: this.compiler.getEngine().getVersion(),
    };
    const current = this.getState();
    for (const listener of this.listeners) {
      listener(current);
    }
  }

  // ==========================================================================
  // DIALOG VISIBILITY (CTRL+K / CMD+K / ESCAPE)
  // ==========================================================================

  public open(): void {
    this.updateState({ isOpen: true, error: null });
  }

  public close(): void {
    this.stopVoiceInput();
    this.updateState({
      isOpen: false,
      isListening: false,
      error: null,
    });
  }

  public toggle(): void {
    if (this.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public setPrompt(prompt: string): void {
    this.updateState({ prompt, error: null });
  }

  // ==========================================================================
  // VOICE MICROPHONE INTERFACE
  // ==========================================================================

  private checkSpeechSupport(): boolean {
    if (typeof window !== "undefined") {
      const win = window as IWindowSpeech;
      const supported = Boolean(win.SpeechRecognition || win.webkitSpeechRecognition);
      this.state.speechSupported = supported;
      return supported;
    }
    this.state.speechSupported = false;
    return false;
  }

  public startVoiceInput(): void {
    if (typeof window === "undefined") {
      this.updateState({
        speechError: "Speech recognition is only available in browser environments.",
      });
      return;
    }

    const win = window as IWindowSpeech;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      this.updateState({
        speechSupported: false,
        speechError: "Web Speech API is not supported in this browser.",
      });
      return;
    }

    try {
      if (this.recognition) {
        this.recognition.abort();
      }

      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onstart = () => {
        this.updateState({
          isListening: true,
          status: "listening",
          speechError: null,
        });
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const newPrompt = (this.state.prompt + " " + finalTranscript).trim();
        this.updateState({
          prompt: finalTranscript ? newPrompt : this.state.prompt,
          interimTranscript: interim,
        });
      };

      recognition.onerror = (event: any) => {
        this.updateState({
          isListening: false,
          status: "idle",
          speechError: `Voice error: ${event.error || "Recognition failed"}`,
        });
      };

      recognition.onend = () => {
        this.updateState({
          isListening: false,
          status: this.state.stagedPreview ? "preview_ready" : "idle",
          interimTranscript: "",
        });
      };

      this.recognition = recognition;
      recognition.start();
    } catch (err: any) {
      this.updateState({
        isListening: false,
        status: "idle",
        speechError: err?.message || "Failed to start microphone",
      });
    }
  }

  public stopVoiceInput(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore if already stopped
      }
      this.recognition = null;
    }
    if (this.state.isListening) {
      this.updateState({
        isListening: false,
        status: this.state.stagedPreview ? "preview_ready" : "idle",
        interimTranscript: "",
      });
    }
  }

  public toggleVoiceInput(): void {
    if (this.state.isListening) {
      this.stopVoiceInput();
    } else {
      this.startVoiceInput();
    }
  }

  /**
   * For testing or manual voice emulation
   */
  public simulateVoiceInput(transcript: string): void {
    this.updateState({
      prompt: transcript,
      isListening: false,
      interimTranscript: "",
      status: "idle",
    });
  }

  // ==========================================================================
  // STAGE 5: BEFORE/AFTER VISUAL DIFF MODAL STAGING
  // ==========================================================================

  public stagePrompt(promptToStage?: string): StagedPreviewDiff {
    const raw = (promptToStage ?? this.state.prompt).trim();
    if (!raw) {
      throw new Error("Cannot stage empty customization prompt.");
    }

    this.updateState({ status: "staging", error: null });

    try {
      const preview = this.compiler.stageChangePreview(raw);
      this.updateState({
        stagedPreview: preview,
        status: "preview_ready",
        error: null,
      });
      return preview;
    } catch (err: any) {
      const msg = err?.message || "Failed to stage customization preview.";
      this.updateState({
        status: "error",
        error: msg,
      });
      throw err;
    }
  }

  public clearPreview(): void {
    this.updateState({
      stagedPreview: null,
      status: "idle",
      error: null,
    });
  }

  // ==========================================================================
  // STAGE 6 & 7: FOUNDER APPROVAL GATE & REAL EXECUTION
  // ==========================================================================

  public executeStagedChange(explicitApprovalGranted: boolean = false): ExecutionReceipt {
    const preview = this.state.stagedPreview;
    if (!preview) {
      throw new Error("No staged preview available for execution.");
    }

    // Enforce Founder Approval Gate
    if (preview.requiresFounderApproval && !explicitApprovalGranted) {
      const msg = `Execution blocked by Founder Governance Gate: High-risk action [${preview.action}] requires explicit 1-click confirmation.`;
      this.updateState({ error: msg, status: "error" });
      throw new Error(msg);
    }

    this.updateState({ status: "executing", error: null });

    try {
      const receipt = this.compiler.executeStagedChange(preview.previewId, {
        ...this.founder,
        explicitApprovalGranted,
      });

      const historyItem: OmnibarHistoryItem = {
        id: receipt.executionId,
        timestamp: receipt.timestamp,
        prompt: preview.rawPrompt,
        preview,
        receipt,
      };

      this.updateState({
        status: "success",
        stagedPreview: null,
        executionReceipt: receipt,
        lastExecutedReceipt: receipt,
        history: [historyItem, ...this.state.history],
        prompt: "",
        error: null,
      });

      return receipt;
    } catch (err: any) {
      const msg = err?.message || "Execution failure.";
      this.updateState({
        status: "error",
        error: msg,
      });
      throw err;
    }
  }

  // ==========================================================================
  // STAGE 10: 1-CLICK UNDO / ROLLBACK ACTION
  // ==========================================================================

  public undoLastChange(): ExecutionReceipt {
    this.updateState({ status: "executing", error: null });

    try {
      const receipt = this.compiler.rollbackLastChange(this.founder);

      const historyItem: OmnibarHistoryItem = {
        id: receipt.executionId,
        timestamp: receipt.timestamp,
        prompt: "1-Click Undo / Rollback",
        preview: {
          previewId: receipt.previewId,
          timestamp: receipt.timestamp,
          rawPrompt: "1-Click Undo / Rollback",
          action: "ROLLBACK",
          targetPlatform: "all",
          targetElement: "SYSTEM_VERSION",
          previousValue: `Version ${receipt.rollbackSnapshotVersion}`,
          proposedValue: receipt.activeVersion,
          diffSummary: receipt.message,
          dependencyAnalysis: {
            affectedPlatforms: ["customer_app", "partner_app", "rider_app", "umaros"],
            affectedRoutes: ["/*"],
            downstreamComponents: [],
            breakingRisk: false,
          },
          requiresFounderApproval: false,
          approved: true,
        },
        receipt,
      };

      this.updateState({
        status: "success",
        stagedPreview: null,
        executionReceipt: receipt,
        lastExecutedReceipt: receipt,
        history: [historyItem, ...this.state.history],
        error: null,
      });

      return receipt;
    } catch (err: any) {
      const msg = err?.message || "Undo / Rollback failed.";
      this.updateState({
        status: "error",
        error: msg,
      });
      throw err;
    }
  }

  public getCompiler(): UmarAiCustomizationCompiler {
    return this.compiler;
  }
}
