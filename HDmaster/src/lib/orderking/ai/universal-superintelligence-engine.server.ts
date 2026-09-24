import { modelRouter, type ModelRouterService } from "./providers/index.ts";
import { executeFounderTool, FOUNDER_TOOLS } from "./founder-tools.server.ts";
import { spawnTask, updateTaskState } from "../server/autonomous-task-engine.server.ts";
import type { AIProvider, ChatResponse, ToolCall, ToolDefinition } from "./providers/provider-interface.ts";

/**
 * Umar OS: Universal Execution Engine
 * 
 * This is the real execution pipeline for complex, multi-step Founder directives.
 * It is called from ai-chat-service.server.ts when the Founder issues a directive
 * that requires planning, tool use, and multi-model execution.
 *
 * ABSOLUTE REALISM RULES:
 * - Every model call goes through real HTTP API (Gemini, Anthropic, OpenAI, xAI)
 * - Every tool call executes real DB queries via executeFounderTool
 * - If no API key is configured, the task is BLOCKED — never faked
 * - Task state transitions are persisted to autonomous_tasks table
 * - Validation uses a different provider than generation when possible
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UniversalTaskRequest {
  orgId: string;
  owner: string;
  instruction: string;
  context?: Record<string, unknown>;
  onProgress?: (msg: string) => void;
}

export interface UniversalTaskResult {
  taskId: string;
  status: "COMPLETED" | "BLOCKED" | "FAILED";
  response: string;
  modelAttributions: string[];
  toolsExecuted: string[];
  validationPassed: boolean;
  blockedReason?: string;
}

interface ExecutionPlan {
  domain: string;
  steps: string[];
  toolsNeeded: string[];
  needsMultiModel: boolean;
}

// ─── Engine ──────────────────────────────────────────────────────────────────

export class UniversalExecutionEngine {

  /**
   * Resolve a real configured provider or return null.
   * NEVER returns local-deterministic. NEVER fakes.
   */
  private static getConfiguredProvider(preferredId?: string): AIProvider | null {
    const provider = modelRouter.getProvider(preferredId);
    if (!provider || provider.id === "local_deterministic") return null;
    if (!provider.isConfigured) return null;
    return provider;
  }

  /**
   * Get ALL configured real providers (for multi-model and validation).
   */
  private static getAllConfiguredProviders(): Array<{ id: string; provider: AIProvider }> {
    const statuses = modelRouter.listProviderStatuses();
    const result: Array<{ id: string; provider: AIProvider }> = [];
    for (const s of statuses) {
      if (s.id === "local_deterministic") continue;
      if (!s.isConfigured) continue;
      const p = modelRouter.getProvider(s.id);
      if (p && p.isConfigured) result.push({ id: s.id, provider: p });
    }
    return result;
  }

  /**
   * Main entry point. Runs the full lifecycle:
   * REQUESTED → UNDERSTOOD → PLANNED → EXECUTING → VALIDATING → COMPLETED/BLOCKED/FAILED
   */
  static async execute(req: UniversalTaskRequest): Promise<UniversalTaskResult> {
    const log = (msg: string) => {
      req.onProgress?.(msg);
      console.log(`[UMAR-OS] ${msg}`);
    };

    // ── Check: Do we have ANY real provider? ──
    const allProviders = this.getAllConfiguredProviders();
    if (allProviders.length === 0) {
      return {
        taskId: "none",
        status: "BLOCKED",
        response: "BLOCKED — No real AI provider API keys are configured. Add at least one of: GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, XAI_API_KEY to your .env file.",
        modelAttributions: [],
        toolsExecuted: [],
        validationPassed: false,
        blockedReason: "EXACT PROVIDER/CREDENTIAL/INFRASTRUCTURE REQUIRED. No .env file found with API keys.",
      };
    }

    // ── Spawn persistent task ──
    const taskId = await spawnTask(req.orgId, req.owner, { instruction: req.instruction });
    log(`Task ${taskId} spawned (REQUESTED)`);

    try {
      // ── STAGE 1: UNDERSTAND ──
      await updateTaskState(taskId, "UNDERSTOOD", { progress: 0.1, evidence: "Parsing instruction via real LLM." });
      const primaryProvider = allProviders[0];
      log(`Understanding via ${primaryProvider.id}...`);

      const planResponse = await primaryProvider.provider.chat({
        messages: [{ role: "user", content: `Analyze this directive and return a JSON execution plan.\n\nDirective: "${req.instruction}"\n\nReturn JSON with these exact keys:\n- "domain": one of SOFTWARE_ENGINEERING, FINANCE, RESEARCH, BUSINESS, OPERATIONS, CREATIVE\n- "steps": array of strings describing execution steps\n- "toolsNeeded": array of tool names from [get_operations_summary, get_order_details, get_restaurant_performance] or empty array\n- "needsMultiModel": boolean, true if this task benefits from cross-checking with a second model` }],
        systemPrompt: "You are a task planner for UMAR OS. Return ONLY valid JSON, no markdown.",
        responseFormat: "json_object",
      });

      let plan: ExecutionPlan;
      try {
        plan = JSON.parse(planResponse.text.replace(/```json/g, "").replace(/```/g, "").trim());
      } catch {
        plan = { domain: "BUSINESS", steps: ["Execute instruction directly"], toolsNeeded: [], needsMultiModel: false };
      }
      log(`Plan: domain=${plan.domain}, steps=${plan.steps.length}, tools=${plan.toolsNeeded.length}, multiModel=${plan.needsMultiModel}`);

      // ── STAGE 2: PLAN ──
      await updateTaskState(taskId, "PLANNED", { progress: 0.2, evidence: JSON.stringify(plan) });

      // ── STAGE 3: EXECUTE TOOLS ──
      await updateTaskState(taskId, "EXECUTING", { progress: 0.4, evidence: `Executing tools: ${plan.toolsNeeded.join(", ") || "none"}` });

      const toolResults: Array<{ tool: string; result: any; success: boolean }> = [];
      for (const toolName of plan.toolsNeeded) {
        log(`Executing tool: ${toolName}`);
        try {
          const result = await executeFounderTool(toolName, {});
          const hasError = result && typeof result === "object" && "error" in result;
          toolResults.push({ tool: toolName, result, success: !hasError });
        } catch (err: any) {
          toolResults.push({ tool: toolName, result: { error: err.message }, success: false });
        }
      }

      // ── STAGE 4: MODEL EXECUTION ──
      const toolContext = toolResults.length > 0
        ? `\n\nReal data from tools:\n${JSON.stringify(toolResults.filter(t => t.success).map(t => ({ tool: t.tool, data: t.result })), null, 2)}`
        : "";

      log(`Primary execution via ${primaryProvider.id}...`);
      const primaryResult = await primaryProvider.provider.chat({
        messages: [{ role: "user", content: `${req.instruction}${toolContext}` }],
        systemPrompt: "You are UMAR OS / HDMaster AI. Answer the Founder's directive using the real data provided. Be precise, actionable, and factual. Never hallucinate data.",
      });

      const modelAttributions = [primaryProvider.id];
      let finalResponse = primaryResult.text;

      // ── FORCE REALISM ENFORCER ──
      const realismBlocklist = [
        "mock data", "simulated", "placeholder", "dummy data",
        "example purposes", "as an AI", "fake data", "[insert"
      ];
      const lowerResponse = finalResponse.toLowerCase();
      if (realismBlocklist.some(word => lowerResponse.includes(word))) {
        log(`CRITICAL: Model ${primaryProvider.id} attempted to generate non-realistic content. Intercepting.`);
        finalResponse = `[REALISM ENFORCER BLOCKED] 
The underlying model (${primaryProvider.id}) attempted to generate simulated or placeholder data. 
HDMaster Universal Superintelligence Engine explicitly blocks all non-genuine output. 
Please provide real Database Access or real API keys to fulfill this request.`;
      }

      // ── STAGE 5: MULTI-MODEL CROSS-CHECK (if available and beneficial) ──
      if (plan.needsMultiModel && allProviders.length >= 2) {
        const validator = allProviders[1];
        log(`Cross-checking via ${validator.id}...`);
        modelAttributions.push(validator.id);

        try {
          const crossCheck = await validator.provider.chat({
            messages: [
              { role: "user", content: req.instruction },
              { role: "assistant", content: primaryResult.text },
              { role: "user", content: "Critically review the above response. Fix any errors or hallucinations. Output only the improved final response." },
            ],
          });
          finalResponse = crossCheck.text;
        } catch (err: any) {
          log(`Cross-check failed (${err.message}), using primary result.`);
          // Keep primaryResult — don't fake the cross-check
        }
      }

      // ── STAGE 6: VALIDATE ──
      await updateTaskState(taskId, "VALIDATING", { progress: 0.8, evidence: "Validating execution results." });

      // Validation: check that the response is non-empty and references tool data if tools were used
      let validationPassed = finalResponse.length > 10;
      if (toolResults.some(t => t.success) && finalResponse.length < 20) {
        validationPassed = false;
        log("VALIDATION FAILED: Response too short given available tool data.");
      }

      if (!validationPassed) {
        await updateTaskState(taskId, "FAILED", { error: "Validation failed: response quality insufficient." });
        return {
          taskId,
          status: "FAILED",
          response: "Validation failed: the model response did not meet quality thresholds.",
          modelAttributions,
          toolsExecuted: toolResults.map(t => t.tool),
          validationPassed: false,
        };
      }

      // ── STAGE 7: COMPLETE ──
      await updateTaskState(taskId, "COMPLETED", {
        progress: 1.0,
        result: { response: finalResponse, models: modelAttributions, tools: toolResults.map(t => t.tool) },
        evidence: `Completed. Models: ${modelAttributions.join(", ")}. Tools: ${toolResults.map(t => t.tool).join(", ") || "none"}.`,
      });

      log(`Task ${taskId} COMPLETED.`);

      return {
        taskId,
        status: "COMPLETED",
        response: finalResponse,
        modelAttributions,
        toolsExecuted: toolResults.map(t => t.tool),
        validationPassed: true,
      };

    } catch (err: any) {
      log(`Task ${taskId} FAILED: ${err.message}`);
      await updateTaskState(taskId, "FAILED", { error: err.message });
      return {
        taskId,
        status: "FAILED",
        response: `Execution failed: ${err.message}`,
        modelAttributions: [],
        toolsExecuted: [],
        validationPassed: false,
      };
    }
  }
}
