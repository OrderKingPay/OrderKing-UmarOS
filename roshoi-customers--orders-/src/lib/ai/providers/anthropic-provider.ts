import type {
  AIProvider,
  AnalysisRequest,
  AnalysisResponse,
  ChatChunk,
  ChatRequest,
  ChatResponse,
  CodeRequest,
  CodeResponse,
  StructuredRequest,
  ToolCall,
} from "./provider-interface.ts";

export class AnthropicProvider implements AIProvider {
  readonly id = "anthropic";
  readonly name = "Anthropic Claude";
  readonly supportedModels = ["claude-3-7-sonnet", "claude-3-5-sonnet", "claude-3-5-haiku"];

  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async chat(input: ChatRequest): Promise<ChatResponse> {
    if (!this.isConfigured) {
      throw new Error("Anthropic API key is not configured in environment (ANTHROPIC_API_KEY).");
    }

    const start = Date.now();
    const model = input.model || "claude-3-7-sonnet";
    const url = "https://api.anthropic.com/v1/messages";

    const messages = input.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      }));

    const tools = input.tools?.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));

    const payload: Record<string, unknown> = {
      model,
      messages,
      max_tokens: input.maxTokens || 4096,
      temperature: input.temperature ?? 0.3,
    };

    if (input.systemPrompt) {
      payload.system = input.systemPrompt;
    }

    if (tools && tools.length > 0) {
      payload.tools = tools;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${err}`);
    }

    const data = (await response.json()) as {
      content?: Array<{
        type: "text" | "tool_use";
        text?: string;
        id?: string;
        name?: string;
        input?: Record<string, unknown>;
      }>;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
      };
    };

    const textParts = (data.content ?? []).filter((c) => c.type === "text").map((c) => c.text || "");
    const toolCalls: ToolCall[] = (data.content ?? [])
      .filter((c) => c.type === "tool_use")
      .map((c) => ({
        callId: c.id || `claude_call_${Date.now()}`,
        name: c.name || "unknown",
        arguments: c.input || {},
      }));

    const promptTokens = data.usage?.input_tokens || 0;
    const completionTokens = data.usage?.output_tokens || 0;

    return {
      provider: this.id,
      model,
      text: textParts.join("\n").trim(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCostUsd: (promptTokens * 0.003 + completionTokens * 0.015) / 1000,
      },
      latencyMs: Date.now() - start,
    };
  }

  async *stream(input: ChatRequest): AsyncIterable<ChatChunk> {
    if (!this.isConfigured) {
      throw new Error("Anthropic API key is not configured in environment (ANTHROPIC_API_KEY).");
    }

    const model = input.model || "claude-3-7-sonnet";
    const url = "https://api.anthropic.com/v1/messages";

    const messages = input.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      }));

    const tools = input.tools?.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters,
    }));

    const payload: Record<string, unknown> = {
      model,
      messages,
      max_tokens: input.maxTokens || 4096,
      temperature: input.temperature ?? 0.3,
      stream: true,
    };

    if (input.systemPrompt) {
      payload.system = input.systemPrompt;
    }

    if (tools && tools.length > 0) {
      payload.tools = tools;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${err}`);
    }

    if (!response.body) throw new Error("No body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    // For tools
    let currentToolName = "";
    let currentToolArgs = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const dataStr = trimmed.slice(6);
        
        try {
          const parsed = JSON.parse(dataStr);
          
          if (parsed.type === "content_block_delta") {
            if (parsed.delta.type === "text_delta") {
              yield { deltaText: parsed.delta.text, done: false };
            } else if (parsed.delta.type === "input_json_delta") {
              currentToolArgs += parsed.delta.partial_json;
            }
          } else if (parsed.type === "content_block_start") {
            if (parsed.content_block.type === "tool_use") {
              currentToolName = parsed.content_block.name;
            }
          } else if (parsed.type === "content_block_stop") {
            if (currentToolName) {
              let args = {};
              try { args = JSON.parse(currentToolArgs); } catch {}
              yield {
                deltaText: "",
                toolCalls: [{
                  callId: `claude_call_${Date.now()}`,
                  name: currentToolName,
                  arguments: args
                }],
                done: false
              };
              currentToolName = "";
              currentToolArgs = "";
            }
          } else if (parsed.type === "message_stop") {
            yield { deltaText: "", done: true };
            return;
          }
        } catch (e) {
          // Ignore incomplete chunk parse errors
        }
      }
    }
  }

  async analyze(input: AnalysisRequest): Promise<AnalysisResponse> {
    const res = await this.chat({
      messages: [
        {
          role: "user",
          content: `Perform deep reasoning on target: ${JSON.stringify(input.target)} with goal: ${input.objective}`,
        },
      ],
      systemPrompt: "You are Claude, an advanced analytical and reasoning intelligence. Return strictly valid JSON with keys: 'summary' (string), 'findings' (array of strings), 'recommendations' (array of strings), and 'confidenceScore' (number).",
    });

    let parsed: any;
    try {
      const clean = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      throw new Error(`Anthropic analyze failed to return valid JSON. Raw response: ${res.text}`);
    }

    if (!parsed.summary || !Array.isArray(parsed.findings)) {
        throw new Error(`Anthropic analyze response did not match schema. Raw response: ${res.text}`);
    }

    return {
      provider: this.id,
      model: res.model,
      summary: parsed.summary,
      findings: parsed.findings,
      recommendations: parsed.recommendations || [],
      confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 1.0,
      rawAnalysis: res.text,
    };
  }

  async generateCode(input: CodeRequest): Promise<CodeResponse> {
    const res = await this.chat({
      messages: [
        {
          role: "user",
          content: `Generate ${input.language} code for: ${input.specification}`,
        },
      ],
      systemPrompt: "You are a master systems architect. Return elegant, bug-free code. Return strictly valid JSON with keys: 'code' (string), 'explanation' (string), 'unitTests' (optional string), 'dependencies' (optional array of strings).",
    });

    let parsed: any;
    try {
      const clean = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      throw new Error(`Anthropic generateCode failed to return valid JSON. Raw response: ${res.text}`);
    }

    if (!parsed.code) {
        throw new Error(`Anthropic generateCode response did not contain 'code'. Raw response: ${res.text}`);
    }

    return {
      provider: this.id,
      model: res.model,
      code: parsed.code,
      explanation: parsed.explanation || "",
      unitTests: parsed.unitTests,
      dependencies: parsed.dependencies,
    };
  }

  async generateStructuredOutput<T>(input: StructuredRequest): Promise<T> {
    const res = await this.chat({
      messages: [
        {
          role: "user",
          content: `Return valid JSON matching schema ${JSON.stringify(input.schema)}: ${input.prompt}`,
        },
      ],
      systemPrompt: "Return raw JSON only.",
    });

    const clean = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean) as T;
  }
}
