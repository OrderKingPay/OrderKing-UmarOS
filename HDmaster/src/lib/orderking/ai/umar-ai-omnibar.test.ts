import { describe, expect, it } from "vitest";
import { UniversalCustomizationEngine } from "../customization/universal-customization-engine";
import {
  UmarAiCustomizationCompiler,
  getUmarAiCompiler,
  resetDefaultUmarAiCompiler,
} from "./umar-ai-customization-compiler";
import {
  UmarAiOmnibarController,
  type OmnibarState,
} from "./umar-ai-omnibar-controller";

describe("Umar AI Interactive Command Omnibar & Voice Controller", () => {
  const founder = {
    userId: "founder_umar_01",
    role: "SUPREME_FOUNDER",
    name: "Founder Umar",
  };

  it("initializes with closed state, tracking live engine version", () => {
    const engine = new UniversalCustomizationEngine();
    const compiler = new UmarAiCustomizationCompiler(engine);
    const controller = new UmarAiOmnibarController(compiler, founder);

    const state = controller.getState();
    expect(state.isOpen).toBe(false);
    expect(state.status).toBe("idle");
    expect(state.prompt).toBe("");
    expect(state.currentVersion).toBe(1);
    expect(state.stagedPreview).toBeNull();
    expect(state.executionReceipt).toBeNull();
  });

  it("toggles open and close state (Ctrl+K trigger simulation)", () => {
    const engine = new UniversalCustomizationEngine();
    const compiler = new UmarAiCustomizationCompiler(engine);
    const controller = new UmarAiOmnibarController(compiler, founder);

    expect(controller.getState().isOpen).toBe(false);

    controller.open();
    expect(controller.getState().isOpen).toBe(true);

    controller.close();
    expect(controller.getState().isOpen).toBe(false);

    controller.toggle();
    expect(controller.getState().isOpen).toBe(true);

    controller.toggle();
    expect(controller.getState().isOpen).toBe(false);
  });

  it("stages natural language prompt into Before/After preview diff with downstream platforms", () => {
    const engine = new UniversalCustomizationEngine();
    const compiler = new UmarAiCustomizationCompiler(engine);
    const controller = new UmarAiOmnibarController(compiler, founder);

    controller.setPrompt("Change customer app primary color to emerald green (#006A4E)");
    const preview = controller.stagePrompt();

    expect(preview.action).toBe("UPDATE_COLOR");
    expect(preview.proposedValue).toBe("#006A4E");
    expect(preview.previousValue).toBe("#E23744"); // Default brand color
    expect(preview.requiresFounderApproval).toBe(false);
    expect(preview.dependencyAnalysis.affectedPlatforms).toContain("customer_app");
    expect(preview.dependencyAnalysis.downstreamComponents).toContain("Button");

    const state = controller.getState();
    expect(state.status).toBe("preview_ready");
    expect(state.stagedPreview).toEqual(preview);
  });

  it("executes low-risk customization and generates cryptographic receipt", () => {
    const engine = new UniversalCustomizationEngine();
    const compiler = new UmarAiCustomizationCompiler(engine);
    const controller = new UmarAiOmnibarController(compiler, founder);

    controller.stagePrompt("Change checkout button to 'Confirm & Order Now'");
    expect(controller.getState().stagedPreview?.action).toBe("UPDATE_TEXT");

    const receipt = controller.executeStagedChange(false);
    expect(receipt.success).toBe(true);
    expect(receipt.activeVersion).toBe(2);
    expect(receipt.auditHash).toBeDefined();
    expect(receipt.verifiedPlatforms).toContain("customer_app");

    // Engine reflects change
    expect(engine.getText("customer.checkout.pay_button", "en")).toBe("Confirm & Order Now");

    // Controller updates state and history
    const state = controller.getState();
    expect(state.status).toBe("success");
    expect(state.currentVersion).toBe(2);
    expect(state.history.length).toBe(1);
    expect(state.history[0].receipt?.activeVersion).toBe(2);
  });

  it("enforces Founder Approval Gate: blocks high-risk commission actions without explicit 1-click confirmation", () => {
    const engine = new UniversalCustomizationEngine();
    const compiler = new UmarAiCustomizationCompiler(engine);
    const controller = new UmarAiOmnibarController(compiler, founder);

    const preview = controller.stagePrompt("Change commission to 24% for restaurant group");
    expect(preview.action).toBe("ADJUST_COMMISSION");
    expect(preview.requiresFounderApproval).toBe(true);
    expect(preview.dependencyAnalysis.affectedPlatforms).toEqual(
      expect.arrayContaining(["partner_app", "customer_app", "finance"])
    );

    // 1. Attempting execution WITHOUT explicit approval MUST throw
    expect(() => {
      controller.executeStagedChange(false);
    }).toThrow(/Execution blocked by Founder Governance Gate/);

    expect(controller.getState().status).toBe("error");

    // 2. Explicit 1-Click Founder Confirmation succeeds!
    const receipt = controller.executeStagedChange(true);
    expect(receipt.success).toBe(true);
    expect(controller.getState().status).toBe("success");
    expect(controller.getState().executionReceipt?.previewId).toBe(preview.previewId);
  });

  it("enforces Founder Approval Gate for high-risk delivery fee adjustments", () => {
    const engine = new UniversalCustomizationEngine();
    const compiler = new UmarAiCustomizationCompiler(engine);
    const controller = new UmarAiOmnibarController(compiler, founder);

    const preview = controller.stagePrompt("Increase delivery charge by ₹5");
    expect(preview.action).toBe("ADJUST_DELIVERY_FEE");
    expect(preview.requiresFounderApproval).toBe(true);

    expect(() => {
      controller.executeStagedChange(false);
    }).toThrow(/Execution blocked by Founder Governance Gate/);

    const receipt = controller.executeStagedChange(true);
    expect(receipt.success).toBe(true);
  });

  it("supports 1-click Undo / Rollback action to instantly revert previous modifications", () => {
    const engine = new UniversalCustomizationEngine();
    const compiler = new UmarAiCustomizationCompiler(engine);
    const controller = new UmarAiOmnibarController(compiler, founder);

    // Initial state: brand primary is #E23744
    expect(engine.getState().designTokens.palette.primary).toBe("#E23744");

    // Apply color change to blue (#1D70B8) -> becomes Version 2
    controller.stagePrompt("Change customer app primary color to blue (#1D70B8)");
    const receipt1 = controller.executeStagedChange(false);
    expect(receipt1.activeVersion).toBe(2);
    expect(engine.getState().designTokens.palette.primary).toBe("#1D70B8");

    // 1-Click Undo / Rollback
    const undoReceipt = controller.undoLastChange();
    expect(undoReceipt.success).toBe(true);
    expect(undoReceipt.activeVersion).toBe(3); // New active version reflecting the rollback event
    expect(undoReceipt.rollbackSnapshotVersion).toBe(2);

    // Verified rollback: brand primary is reverted to initial #E23744
    expect(engine.getState().designTokens.palette.primary).toBe("#E23744");
    expect(controller.getState().currentVersion).toBe(3);
    expect(controller.getState().status).toBe("success");
  });

  it("supports voice microphone interface and simulated transcript capture", () => {
    const engine = new UniversalCustomizationEngine();
    const compiler = new UmarAiCustomizationCompiler(engine);
    const controller = new UmarAiOmnibarController(compiler, founder);

    expect(controller.getState().isListening).toBe(false);

    // Simulate voice capture
    controller.simulateVoiceInput("Change customer app primary color to emerald green (#006A4E)");
    expect(controller.getState().prompt).toBe("Change customer app primary color to emerald green (#006A4E)");

    // Stage from voice input
    const preview = controller.stagePrompt();
    expect(preview.action).toBe("UPDATE_COLOR");
    expect(preview.proposedValue).toBe("#006A4E");
  });

  it("supports state listener subscriptions for real-time React UI binding", () => {
    const engine = new UniversalCustomizationEngine();
    const compiler = new UmarAiCustomizationCompiler(engine);
    const controller = new UmarAiOmnibarController(compiler, founder);

    const states: OmnibarState[] = [];
    const unsubscribe = controller.subscribe((s) => {
      states.push(s);
    });

    controller.open();
    controller.setPrompt("Change checkout button to 'Pay Now'");
    controller.close();

    unsubscribe();
    controller.open(); // Should not notify after unsubscribe

    expect(states.length).toBe(4); // initial + open + setPrompt + close
    expect(states[1].isOpen).toBe(true);
    expect(states[2].prompt).toBe("Change checkout button to 'Pay Now'");
    expect(states[3].isOpen).toBe(false);
  });
});
