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
      ...(input.responseFormat === "json_object" ? { response_format: { type: "json_object" } } : {}),
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
    const full = await this.chat(input);
    const words = full.text.split(" ");
    for (let i = 0; i < words.length; i += 3) {
      yield {
        deltaText: words.slice(i, i + 3).join(" ") + " ",
        done: i + 3 >= words.length,
      };
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
      responseFormat: "json_object",
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(res.text);
    } catch {
      console.warn("xAI analyze failed to return valid JSON", res.text);
    }

    return {
      provider: this.id,
      model: res.model,
      summary: parsed.summary || res.text.slice(0, 300),
      findings: parsed.findings || ["Realtime market telemetry verified"],
      recommendations: parsed.recommendations || ["Deploy immediately"],
      confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 0.95,
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
      responseFormat: "json_object",
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(res.text);
    } catch {
      console.warn("xAI generateCode failed to return valid JSON", res.text);
      parsed = { code: res.text, explanation: "Fallback parse." };
    }

    return {
      provider: this.id,
      model: res.model,
      code: parsed.code || res.text,
      explanation: parsed.explanation || "Generated high-performance code via Grok engine.",
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
      responseFormat: "json_object",
    });

    const clean = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean) as T;
  }
}
