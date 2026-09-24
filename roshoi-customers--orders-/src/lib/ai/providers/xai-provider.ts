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

export class XAIProvider implements AIProvider {
  readonly id = "xai";
  readonly name = "xAI Grok";
  readonly supportedModels = ["grok-3", "grok-2", "grok-beta"];

  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.XAI_API_KEY;
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async chat(input: ChatRequest): Promise<ChatResponse> {
    if (!this.isConfigured) {
      throw new Error("xAI API key is not configured in environment (XAI_API_KEY).");
    }

    const start = Date.now();
    const model = input.model || "grok-3";
    const url = "https://api.x.ai/v1/chat/completions";

    const messages: Array<Record<string, unknown>> = [];
    if (input.systemPrompt) {
      messages.push({ role: "system", content: input.systemPrompt });
    }

    for (const m of input.messages) {
      messages.push({
        role: m.role,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      });
    }

    const tools = input.tools?.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const payload: Record<string, unknown> = {
      model,
      messages,
      temperature: input.temperature ?? 0.3,
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`xAI API error (${response.status}): ${err}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
          tool_calls?: Array<{
            id: string;
            function: { name: string; arguments: string };
          }>;
        };
      }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    const choice = data.choices?.[0]?.message;
    const toolCalls: ToolCall[] = (choice?.tool_calls ?? []).map((c) => {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(c.function.arguments);
      } catch {}
      return {
        callId: c.id,
        name: c.function.name,
        arguments: args,
      };
    });

    const promptTokens = data.usage?.prompt_tokens || 0;
    const completionTokens = data.usage?.completion_tokens || 0;

    return {
      provider: this.id,
      model,
      text: choice?.content || "",
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        estimatedCostUsd: (promptTokens * 0.002 + completionTokens * 0.01) / 1000,
      },
      latencyMs: Date.now() - start,
    };
  }

  async *stream(input: ChatRequest): AsyncIterable<ChatChunk> {
    if (!this.isConfigured) {
      throw new Error("xAI API key is not configured in environment (XAI_API_KEY).");
    }

    const model = input.model || "grok-3";
    const url = "https://api.x.ai/v1/chat/completions";

    const messages: Array<Record<string, unknown>> = [];
    if (input.systemPrompt) {
      messages.push({ role: "system", content: input.systemPrompt });
    }

    for (const m of input.messages) {
      messages.push({
        role: m.role,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      });
    }

    const tools = input.tools?.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    const payload: Record<string, unknown> = {
      model,
      messages,
      temperature: input.temperature ?? 0.3,
      stream: true,
    };

    if (tools && tools.length > 0) {
      payload.tools = tools;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`xAI API error (${response.status}): ${err}`);
    }

    if (!response.body) throw new Error("No body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    const toolCallBuffers = new Map<number, { id: string; name: string; args: string }>();

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
        if (dataStr === "[DONE]") {
          if (toolCallBuffers.size > 0) {
            const toolCalls: ToolCall[] = Array.from(toolCallBuffers.values()).map(tc => {
              let parsedArgs = {};
              try { parsedArgs = JSON.parse(tc.args); } catch {}
              return { callId: tc.id, name: tc.name, arguments: parsedArgs };
            });
            yield { deltaText: "", toolCalls, done: false };
          }
          yield { deltaText: "", done: true };
          return;
        }
        
        try {
          const parsed = JSON.parse(dataStr);
          const choice = parsed.choices?.[0];
          if (!choice) continue;
          
          const delta = choice.delta;
          if (delta?.content) {
            yield { deltaText: delta.content, done: false };
          }
          
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index;
              if (!toolCallBuffers.has(idx)) {
                toolCallBuffers.set(idx, { id: tc.id || "", name: tc.function?.name || "", args: "" });
              }
              const existing = toolCallBuffers.get(idx)!;
              if (tc.function?.arguments) {
                existing.args += tc.function.arguments;
              }
            }
          }
          
          if (choice.finish_reason === "tool_calls") {
            const toolCalls: ToolCall[] = Array.from(toolCallBuffers.values()).map(tc => {
              let parsedArgs = {};
              try { parsedArgs = JSON.parse(tc.args); } catch {}
              return { callId: tc.id, name: tc.name, arguments: parsedArgs };
            });
            yield { deltaText: "", toolCalls, done: false };
            toolCallBuffers.clear();
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
          content: `Real-time analysis on target: ${JSON.stringify(input.target)} for: ${input.objective}`,
        },
      ],
      systemPrompt: "You are Grok, an ultra-fast, unfiltered, highly capable analytical intelligence. Return strictly valid JSON with keys: 'summary' (string), 'findings' (array of strings), 'recommendations' (array of strings), and 'confidenceScore' (number).",
    });

    let parsed: any;
    try {
      const clean = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      throw new Error(`xAI analyze failed to return valid JSON. Raw response: ${res.text}`);
    }

    if (!parsed.summary || !Array.isArray(parsed.findings)) {
        throw new Error(`xAI analyze response did not match schema. Raw response: ${res.text}`);
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
          content: `Write high-performance ${input.language} code for: ${input.specification}`,
        },
      ],
      systemPrompt: "You are Grok, writing concise, high-throughput software. Return strictly valid JSON with keys: 'code' (string), 'explanation' (string), 'unitTests' (optional string), 'dependencies' (optional array of strings).",
    });

    let parsed: any;
    try {
      const clean = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(clean);
    } catch (e) {
      throw new Error(`xAI generateCode failed to return valid JSON. Raw response: ${res.text}`);
    }

    if (!parsed.code) {
        throw new Error(`xAI generateCode response did not contain 'code'. Raw response: ${res.text}`);
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
          content: `Return JSON for schema ${JSON.stringify(input.schema)}: ${input.prompt}`,
        },
      ],
      systemPrompt: "Return raw JSON only.",
    });

    const clean = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean) as T;
  }
}
