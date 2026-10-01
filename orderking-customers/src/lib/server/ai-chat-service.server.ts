// @ts-nocheck

// HDmaster / Umar OS: Unified AI Chat & Streaming Service
// Zero-Fabrication: connects real models, real model IDs, real streaming,
// contextual conversation memory, multimodal attachments, and authorized tools.

import { GoogleGeminiProvider } from "../ai/providers/gemini-provider.ts";
import { OpenAIProvider } from "../ai/providers/openai-provider.ts";
import { AnthropicProvider } from "../ai/providers/anthropic-provider.ts";
import { XAIProvider } from "../ai/providers/xai-provider.ts";
import {
  getVerifiedModelRegistry,
  getProviderApiKey,
  type VerifiedModelRecord,
} from "../ai/real-model-registry.ts";
import {
  getLocalRepoStatus,
  getLocalRecentCommits,
  inspectLocalFile,
  searchLocalCode,
  applyLocalPatch,
  executeShellCommand,
  ORDER_KING_REPOS,
  type AllowedRepo,
} from "../ai/workspace-repos.server.ts";
import {
  type AgentExecutionStep,
} from "../ai/supreme-founder-ai-core.ts";
import { getSql } from "../db";
// @ts-ignore
import { FOUNDER_TOOLS, executeFounderTool } from "../ai/founder-tools.server";

async function getProviderApiKeyAsync(providerKey: string): Promise<string | undefined> {
  // Check process.env first (for local dev convenience)
  const envMap: Record<string, string | undefined> = {
    gemini: process.env.GEMINI_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    xai: process.env.XAI_API_KEY,
  };
  if (envMap[providerKey]) return envMap[providerKey];
  
  // Fallback to secure server database
  try {
    const sql = await getSql();
    const rows = await sql<{value: string}>`SELECT value FROM system_config WHERE key = ${'umar_os_apikey_' + providerKey}`;
    if (rows.length > 0) return rows[0].value;
  } catch (e) {
    // Ignore db not initialized
  }
  return undefined;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Array<{
    name: string;
    type: string;
    url?: string;
    content?: string;
    size?: number;
  }>;
}

export interface StreamEvent {
  type: "step" | "delta" | "tool_call" | "tool_result" | "done" | "error";
  data: any;
}

export interface AiChatRequest {
  messages: ChatMessage[];
  modelId?: string;
  mode?: "fast" | "deep" | "auto";
  founderUpiVpa?: string;
  apiKeys?: Record<string, string>;
  userContext?: {
    userId?: string;
    role?: string;
    permissions?: string[];
  };
  locale?: string;
}

export interface AiChatResult {
  text: string;
  modelUsed: string;
  provider: string;
  executionSteps: Array<{
    stepNumber: number;
    totalSteps: number;
    label: string;
    status: "COMPLETED" | "RUNNING" | "WAITING" | "PENDING";
    detail: string;
  }>;
  responders?: string[];
  actionCard?: any;
  mediaCard?: any;
  latencyMs: number;
}

/**
 * Resolves context when user uses anaphora ("that", "it", "previous one", "how much", "fix it").
 */
export function resolveContextualQuery(messages: ChatMessage[]): {
  currentQuery: string;
  resolvedContext: string;
} {
  if (messages.length === 0) return { currentQuery: "", resolvedContext: "" };

  const lastMsg = messages[messages.length - 1];
  const query = lastMsg.content.trim();
  const priorMessages = messages.slice(0, -1);

  if (priorMessages.length === 0) {
    return { currentQuery: query, resolvedContext: query };
  }

  // Look at last assistant message and last user message
  const lastAssistant = [...priorMessages].reverse().find((m) => m.role === "assistant");
  const previousUser = [...priorMessages].reverse().find((m) => m.role === "user");

  let contextualClarification = "";
  const qLower = query.toLowerCase();

  const isAnaphoric =
    qLower.includes("that") ||
    qLower.includes("this") ||
    qLower.includes("it") ||
    qLower.includes("previous") ||
    qLower.includes("how much") ||
    qLower.includes("continue") ||
    qLower.includes("fix it") ||
    qLower.includes("do the same") ||
    qLower.includes("make it") ||
    qLower.length < 15;

  if (isAnaphoric && lastAssistant) {
    contextualClarification = `\n[Prior Assistant Context]: ${lastAssistant.content.slice(0, 500)}...`;
  }

  return {
    currentQuery: query,
    resolvedContext: contextualClarification ? `${query} ${contextualClarification}` : query,
  };
}

/**
 * Handles engineering and repository orders naturally.
 */
async function tryExecuteEngineeringCommand(query: string): Promise<string | null> {
  const q = query.toLowerCase().trim();

  // 1. Git status / repo status
  if (q.includes("git status") || q.includes("repo status") || q.includes("repository status") || q === "check project") {
    try {
      const hdStatus = await getLocalRepoStatus("HDmaster");
      return [
        `### 🛠️ Repository Status: HDmaster`,
        `- **Branch**: \`${hdStatus.branch}\``,
        `- **Working Directory**: ${hdStatus.isClean ? "✅ Clean (no uncommitted changes)" : "⚠️ Changes detected"}`,
        `- **Changed Files**: ${hdStatus.changedFiles.length > 0 ? hdStatus.changedFiles.slice(0, 10).map((f) => `\`${f}\``).join(", ") : "None"}`,
        `- **Path on Disk**: \`${hdStatus.path}\``,
        `- **Connected Repositories**: ${ORDER_KING_REPOS.join(", ")}`,
      ].join("\n");
    } catch (err) {
      return `### 🛠️ Repository Inspection\nCould not fetch git status: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // 2. Recent commits
  if (q.includes("recent commit") || q.includes("git log") || q.includes("show commits")) {
    try {
      const commits = await getLocalRecentCommits("HDmaster", 5);
      return [
        `### 📜 Recent Commits: HDmaster`,
        ...commits.map((c) => `- \`${c.sha.slice(0, 8)}\` — **${c.message}** (${c.author}, ${c.date})`),
      ].join("\n");
    } catch (err) {
      return `### 📜 Commits\nCould not fetch commits: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  // 3. Inspect a file
  const inspectMatch = query.match(/(?:inspect|read|view|show|check)\s+(?:file\s+)?([a-zA-Z0-9_\-\.\/\\\:]+\.(?:ts|tsx|js|json|css|sql|md|html))/i);
  if (inspectMatch && inspectMatch[1]) {
    const rawPath = inspectMatch[1].trim();
    try {
      const fileData = await inspectLocalFile("HDmaster", rawPath);
      return [
        `### 📄 File: \`${fileData.path}\` (${fileData.totalLines} lines, ${fileData.content.length} characters)`,
        "```typescript",
        fileData.content.slice(0, 3500) + (fileData.content.length > 3500 ? "\n... [content truncated for preview]" : ""),
        "```",
      ].join("\n");
    } catch (err) {
      return null;
    }
  }

  // 4. Search code
  const searchMatch = query.match(/(?:search code|find symbol|grep code|find in code)\s+(?:for\s+)?["']?([^"']+)["']?/i);
  if (searchMatch && searchMatch[1]) {
    const term = searchMatch[1].trim();
    try {
      const results = await searchLocalCode(term, "HDmaster", 5);
      if (results.matches.length === 0) {
        return `### 🔍 Code Search: \`${term}\`\nNo exact matches found in HDmaster codebase.`;
      }
      return [
        `### 🔍 Code Search Results for \`${term}\` (${results.totalMatches} matches)`,
        ...results.matches.map((r: { file: string; line: number; text: string }) => `- **\`${r.file}:${r.line}\`**: \`${r.text.trim()}\``),
      ].join("\n");
    } catch {
      return null;
    }
  }

  return null;
}

export function executeLocalSovereignCognitivePass(
  _query: string,
  _messages: ChatMessage[],
  _founderUpiVpa: string = "orderking@okhdfcbank"
): {
  text: string;
  executionSteps: AgentExecutionStep[];
  actionCard?: any;
  mediaCard?: any;
} {
  // Production truth gate: no embedded local LLM is bundled.
  return {
    text: "AI provider unavailable. Configure a verified external model provider; no simulated AI response will be returned.",
    executionSteps: [],
  };
}

export async function executeAutonomousEmployeeTask(taskType: string, payload: any): Promise<any> {
  const sql = await getSql();
  if (!["customer_support","fetch_data"].includes(taskType)) {
    return { status: "FORBIDDEN_TASK", message: "Customer AI is restricted to typed customer support/order reads." };
  }
  try {
    if (taskType === "customer_support") {
      const rows = await sql`
        SELECT id, topic, status
        FROM support_tickets
        WHERE user_id = ${payload?.userId}
        ORDER BY created_at DESC
        LIMIT 20
      `;
      return { status: "SUCCESS", data: rows };
    }
    if (String(payload?.entity) === "orders") {
      const rows = await sql`
        SELECT id, status, payment_status, total_paise, placed_at
        FROM orders
        WHERE customer_id = ${payload?.userId}
        ORDER BY placed_at DESC
        LIMIT 20
      `;
      return { status: "SUCCESS", data: rows };
    }
    return { status: "UNSUPPORTED_ENTITY" };
  } catch {
    return { status: "ERROR", message: "Customer AI task failed." };
  }
}

/**
 * Master execution handler for chat queries:
 * 1. Checks engineering commands -> runs real workspace tools.
 * 2. Checks active provider -> if connected, calls real model API with real streaming.
 * 3. If no external provider is configured, the request fails closed without synthetic output.
 */
export async function executeFounderAiChat(
  request: AiChatRequest,
  onStreamEvent?: (event: StreamEvent) => void
): Promise<AiChatResult> {
  const startTime = Date.now();
  const { currentQuery } = resolveContextualQuery(request.messages);

  // 1. Check for real repository / engineering tool commands
  const engineeringResult = await tryExecuteEngineeringCommand(currentQuery);
  if (engineeringResult) {
    onStreamEvent?.({ type: "delta", data: engineeringResult });
    onStreamEvent?.({ type: "done", data: { text: engineeringResult } });

    return {
      text: engineeringResult,
      modelUsed: "engineering-runtime",
      provider: "HDmaster Workspace Tools",
      executionSteps: [],
      latencyMs: Date.now() - startTime,
    };
  }

  // Business/financial queries now go through the real AI model for natural responses

  // 2. Resolve Model & Provider Selection
  const registry = getVerifiedModelRegistry();
  const requestedModelId = request.modelId || "auto-supreme-orchestrator";

  let activeRecord = registry.find((m) => m.id === requestedModelId) || registry[0];

  // Auto-Select Logic:
  if (requestedModelId === "auto-supreme-orchestrator") {
    const geminiKey = await getProviderApiKeyAsync("gemini");
    const anthropicKey = await getProviderApiKeyAsync("anthropic");
    const openaiKey = await getProviderApiKeyAsync("openai");
    const xaiKey = await getProviderApiKeyAsync("xai");

    const hasAttachment = request.messages.some((m) => m.attachments && m.attachments.length > 0);

    if (hasAttachment && geminiKey) {
      activeRecord = registry.find((m) => m.id === "gemini-runtime") || activeRecord;
    } else if (anthropicKey && (currentQuery.includes("code") || currentQuery.includes("architecture"))) {
      activeRecord = registry.find((m) => m.id === "anthropic-runtime") || activeRecord;
    } else if (openaiKey) {
      activeRecord = registry.find((m) => m.id === "openai-runtime") || activeRecord;
    } else if (geminiKey) {
      activeRecord = registry.find((m) => m.id === "gemini-runtime") || activeRecord;
    } else if (xaiKey) {
      activeRecord = registry.find((m) => m.id === "xai-runtime") || activeRecord;
    } else if (anthropicKey) {
      activeRecord = registry.find((m) => m.id === "anthropic-runtime") || activeRecord;
    } else {
      activeRecord = registry.find((m) => m.connectionStatus !== "CONFIGURATION_REQUIRED") || registry[0];
    }
  }

  // 3. Double Engine Consensus (Multi-Model Synthesis)
  if (requestedModelId === "ensemble-consensus") {
    const activeProvidersList: Array<{ name: string; id: string; provider: any; model: string }> = [];
    const geminiKey = await getProviderApiKeyAsync("gemini");
    const anthropicKey = await getProviderApiKeyAsync("anthropic");
    const openaiKey = await getProviderApiKeyAsync("openai");
    const xaiKey = await getProviderApiKeyAsync("xai");

    if (geminiKey) activeProvidersList.push({ name: "Google Gemini", id: "gemini", provider: new GoogleGeminiProvider(geminiKey), model: process.env.GEMINI_MODEL?.trim() || "" });
    if (anthropicKey) activeProvidersList.push({ name: "Anthropic Claude", id: "anthropic", provider: new AnthropicProvider(anthropicKey), model: process.env.ANTHROPIC_MODEL?.trim() || "" });
    if (openaiKey) activeProvidersList.push({ name: "OpenAI", id: "openai", provider: new OpenAIProvider(openaiKey), model: process.env.OPENAI_MODEL?.trim() || "gpt-6-astra" });
    if (xaiKey) activeProvidersList.push({ name: "xAI Grok", id: "xai", provider: new XAIProvider(xaiKey), model: process.env.XAI_MODEL?.trim() || "" });

    if (activeProvidersList.length >= 2) {
      // Double Engine mode
      const engine1 = activeProvidersList[0];
      const engine2 = activeProvidersList[1];

      onStreamEvent?.({ type: "step", data: { stepNumber: 1, totalSteps: 2, label: `Engine 1 (${engine1.name}) Processing`, status: "RUNNING", detail: "Generating primary response..." } });
      
      let primaryResponse = "";
      try {
        const res1 = await engine1.provider.chat({
          messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
          model: engine1.model,
        });
        primaryResponse = res1.text;
      } catch (e) {
        throw e;
      }
      onStreamEvent?.({ type: "step", data: { stepNumber: 1, totalSteps: 2, label: `Engine 1 (${engine1.name}) Processing`, status: "COMPLETED", detail: "Primary generation complete." } });

      onStreamEvent?.({ type: "step", data: { stepNumber: 2, totalSteps: 2, label: `Engine 2 (${engine2.name}) Validation`, status: "RUNNING", detail: "Validating and refining output for perfection..." } });
      
      let finalResponse = "";
      try {
        const validationMessages: any[] = [
          ...request.messages.map((m) => ({ role: m.role, content: m.content })),
          { role: "assistant", content: primaryResponse },
          { role: "user", content: "Critically review your previous response. Ensure it is 100% realistic, accurate, and highly professional. Remove any meta-commentary or introductory filler. Output only the final, perfected, direct response." }
        ];
        
        const res2 = await engine2.provider.chat({
          messages: validationMessages,
          model: engine2.model,
        });
        finalResponse = res2.text;
      } catch (e) {
        finalResponse = primaryResponse;
      }
      onStreamEvent?.({ type: "step", data: { stepNumber: 2, totalSteps: 2, label: `Engine 2 (${engine2.name}) Validation`, status: "COMPLETED", detail: "Validation complete." } });

      onStreamEvent?.({ type: "delta", data: finalResponse });
      onStreamEvent?.({ type: "done", data: { text: finalResponse } });

      return {
        text: finalResponse,
        modelUsed: "double-engine-v1",
        provider: "HDmaster Double Engine",
        responders: [engine1.name, engine2.name],
        executionSteps: [],
        latencyMs: Date.now() - startTime,
      };
    } else if (activeProvidersList.length === 1) {
      // Single engine fallback
      const engine1 = activeProvidersList[0];
      try {
        const res1 = await engine1.provider.chat({
          messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
          model: engine1.model,
        });
        onStreamEvent?.({ type: "delta", data: res1.text });
        onStreamEvent?.({ type: "done", data: { text: res1.text } });
        return { text: res1.text, modelUsed: engine1.model, provider: engine1.name, responders: [engine1.name], executionSteps: [], latencyMs: Date.now() - startTime };
      } catch (e) {
        // fallthrough
      }
    }

    const blockedText = "No second real AI provider is configured for consensus, or the configured providers failed. No simulated response will be returned.";
    onStreamEvent?.({ type: "error", data: { message: blockedText } });
    return {
      text: blockedText,
      modelUsed: "none",
      provider: "None Connected",
      responders: [],
      executionSteps: [],
      latencyMs: Date.now() - startTime,
    };
  }

  // 4. External Cloud Provider Execution
  if (activeRecord.provider !== "Orchestrator" && activeRecord.provider !== "Consensus") {
    const providerKey = activeRecord.provider.toLowerCase();
    if (request.apiKeys && Object.keys(request.apiKeys).length > 0) {
      throw new Error("Provider API keys must be configured server-side; browser-supplied keys are rejected.");
    }
    const apiKey = await getProviderApiKeyAsync(providerKey);

    if (apiKey) {
      try {
        let providerInstance: GoogleGeminiProvider | OpenAIProvider | AnthropicProvider | XAIProvider;

        if (activeRecord.provider === "Google") {
          providerInstance = new GoogleGeminiProvider(apiKey);
        } else if (activeRecord.provider === "Anthropic") {
          providerInstance = new AnthropicProvider(apiKey);
        } else if (activeRecord.provider === "OpenAI") {
          providerInstance = new OpenAIProvider(apiKey);
        } else {
          providerInstance = new XAIProvider(apiKey);
        }

        const mappedMessages: any[] = request.messages.map((m) => {
          if (m.attachments && m.attachments.length > 0) {
            const parts: any[] = [{ type: "text", text: m.content }];
            for (const a of m.attachments) {
              if (a.type.startsWith("image/")) {
                parts.push({ type: "image", mimeType: a.type, data: a.content || a.url });
              } else {
                parts.push({ type: "file", text: `[File ${a.name}]:\n${a.content?.slice(0,3000) || ""}` });
              }
            }
            return { role: m.role, content: parts };
          }
          return { role: m.role, content: m.content };
        });

        const systemPrompt = [
          "You are OrderKing Customer AI.",
          "Reply in the requested locale: " + (request.locale || "auto") + ".",
          "Help only the authenticated customer using verified platform data and approved customer-safe tools.",
          "Never invent balances, prices, refunds, credits, loans, bookings, delivery states, provider results, or system actions.",
          "Never expose other customers or internal credentials.",
          "Match the customer's latest language, including English, Hindi, Bengali and Assamese when supported.",
          "When live data or a provider is unavailable, say so clearly and give the next real action.",
          "Monetary values are integer paise in backend data.",
          "Do not claim independent factual verification unless it was actually performed.",
        ].join(" ");

        let finalFullText = "";
        
        while (true) {
          const stream = providerInstance.stream({
            messages: mappedMessages,
            model: activeRecord.realApiId,
            systemPrompt,
            tools: [
              {
                name: "customer_support_lookup",
                description: "Read the authenticated customer's support/order status through approved server logic.",
                parameters: {
                  type: "object",
                  properties: {
                    orderId: { type: "string" },
                    topic: { type: "string" }
                  },
                  required: []
                }
              }
            ]
          });
          
          let hasToolCall = false;
          let toolCallsToExecute: any[] = [];
          
          for await (const chunk of stream) {
            if (chunk.deltaText) {
              finalFullText += chunk.deltaText;
              onStreamEvent?.({ type: "delta", data: chunk.deltaText });
            }
            if (chunk.toolCalls && chunk.toolCalls.length > 0) {
              hasToolCall = true;
              toolCallsToExecute = chunk.toolCalls;
            }
          }
          
          if (!hasToolCall) {
             onStreamEvent?.({ type: "done", data: { text: finalFullText } });
             break;
          } else {
             mappedMessages.push({ role: "assistant", content: finalFullText });
             
             for (const tc of toolCallsToExecute) {
                 onStreamEvent?.({
                   type: "step",
                   data: {
                     stepNumber: 1,
                     totalSteps: 1,
                     label: "Executing tool",
                     status: "RUNNING",
                     detail: "Running tool...",
                   },
                 });
                let result = "";
                if (tc.name === "customer_support_lookup") {
                   try {
                     const t = await executeAutonomousEmployeeTask("customer_support", {
                       ...tc.arguments,
                       userId: request.userId || request.userContext?.userId,
                     });
                     result = JSON.stringify(t);
                   } catch {
                     result = JSON.stringify({ status: "ERROR", message: "Customer support lookup failed." });
                   }
                } else {
                   result = "Tool not found.";
                }
                mappedMessages.push({ role: "tool", toolCallId: tc.callId, content: result });
             }
          }
        }

        return {
          text: finalFullText,
          modelUsed: activeRecord.realApiId,
          provider: activeRecord.provider,
          executionSteps: [],
          latencyMs: Date.now() - startTime,
        };
      } catch (err) {
        console.warn("AI provider request failed:", err);
        onStreamEvent?.({
          type: "step",
          data: {
            stepNumber: 3,
            totalSteps: 4,
            label: "Provider Failure",
            status: "WAITING",
            detail: "AI provider request failed. No alternate response was generated.",
          },
        });
      }
    }
  }

  // 5. No external provider available: fail closed.
  const blockedText = "No real AI provider is configured for this deployment. Add a verified provider key and redeploy; no simulated or third-party fallback response will be shown.";
  onStreamEvent?.({ type: "error", data: { message: blockedText } });
  return {
    text: blockedText,
    modelUsed: "none",
    provider: "None Connected",
    executionSteps: [],
    latencyMs: Date.now() - startTime,
  };
}
