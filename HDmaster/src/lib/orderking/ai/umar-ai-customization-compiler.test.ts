import { describe, expect, it } from "vitest";
import { UniversalCustomizationEngine } from "../customization/universal-customization-engine";
import { UmarAiCustomizationCompiler } from "./umar-ai-customization-compiler";

describe("UmarAiCustomizationCompiler (10-Stage Prompt Execution Pipeline)", () => {
  const founder = {
    userId: "founder_umar_01",
    role: "SUPREME_FOUNDER",
    name: "Founder Umar",
  };

  it("stages and executes color customization via short prompt", () => {
    const engine = new UniversalCustomizationEngine();
    const compiler = new UmarAiCustomizationCompiler(engine);

    // 1. Stage Preview from Prompt
    const preview = compiler.stageChangePreview("Change customer app primary color to emerald green (#006A4E)");
    expect(preview.action).toBe("UPDATE_COLOR");
    expect(preview.proposedValue).toBe("#006A4E");
    expect(preview.requiresFounderApproval).toBe(false); // Low risk color change

    // 2. Execute Staged Change
    const receipt = compiler.executeStagedChange(preview.previewId, founder);
    expect(receipt.success).toBe(true);
    expect(receipt.activeVersion).toBe(2);
    expect(receipt.verifiedPlatforms).toContain("customer_app");
    expect(engine.getState().designTokens.palette.primary).toBe("#006A4E");
  });

  it("stages and updates text elements with instant preview diff", () => {
    const engine = new UniversalCustomizationEngine();
    const compiler = new UmarAiCustomizationCompiler(engine);

    const preview = compiler.stageChangePreview("Change checkout button to 'Confirm & Order Now'");
    expect(preview.action).toBe("UPDATE_TEXT");
    expect(preview.proposedValue).toBe("Confirm & Order Now");

    const receipt = compiler.executeStagedChange(preview.previewId, founder);
    expect(receipt.success).toBe(true);
    expect(engine.getText("customer.checkout.pay_button", "en")).toBe("Confirm & Order Now");
  });

  it("reorders layout sections via natural language prompt", () => {
    const engine = new UniversalCustomizationEngine();
    const compiler = new UmarAiCustomizationCompiler(engine);

    const preview = compiler.stageChangePreview("Move promo banner above search bar on customer app");
    expect(preview.action).toBe("REORDER_LAYOUT");

    const receipt = compiler.executeStagedChange(preview.previewId, founder);
    expect(receipt.success).toBe(true);

    const homeLayout = engine.getState().pageLayouts["customer_home"];
    expect(homeLayout.sections[0].id).toBe("promo_carousel");
  });

  it("blocks high-risk financial changes unless explicit founder approval is granted", () => {
    const engine = new UniversalCustomizationEngine();
    const compiler = new UmarAiCustomizationCompiler(engine);

    const preview = compiler.stageChangePreview("Change commission to 24% for restaurant group");
    expect(preview.action).toBe("ADJUST_COMMISSION");
    expect(preview.requiresFounderApproval).toBe(true); // HIGH RISK

    // Attempting execution without explicitApprovalGranted must throw!
    expect(() => {
      compiler.executeStagedChange(preview.previewId, {
        ...founder,
        explicitApprovalGranted: false,
      });
    }).toThrow(/Execution blocked by Founder Governance Gate/);

    // Attempting execution with explicitApprovalGranted succeeds!
    const receipt = compiler.executeStagedChange(preview.previewId, {
      ...founder,
      explicitApprovalGranted: true,
    });
    expect(receipt.success).toBe(true);
  });

  it("safely rolls back changes via short undo prompt", () => {
    const engine = new UniversalCustomizationEngine();
    const compiler = new UmarAiCustomizationCompiler(engine);

    // Make a change (v2)
    const prev1 = compiler.stageChangePreview("Change primary color to blue (#1D70B8)");
    compiler.executeStagedChange(prev1.previewId, founder);
    expect(engine.getVersion()).toBe(2);
    expect(engine.getState().designTokens.palette.primary).toBe("#1D70B8");

    // Founder says: "Undo last change"
    const undoPreview = compiler.stageChangePreview("Undo last change");
    expect(undoPreview.action).toBe("ROLLBACK");

    const undoReceipt = compiler.executeStagedChange(undoPreview.previewId, founder);
    expect(undoReceipt.success).toBe(true);
    // Verified restoration of initial color
    expect(engine.getState().designTokens.palette.primary).toBe("#E23744");
  });
});
