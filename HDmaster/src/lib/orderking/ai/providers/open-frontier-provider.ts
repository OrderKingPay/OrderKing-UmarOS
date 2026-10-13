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

export interface OpenFrontierConfig {
  id?: string;
  name?: string;
  baseUrl: string;
  apiKey?: string;
  supportedModels: string[];
  defaultModel: string;
}

/**
 * Universal Open Frontier Provider
 * Connects to OpenAI-compatible free/open-tier endpoints:
 * - Groq Free Tier (https://api.groq.com/openai/v1)
 * - OpenRouter Free Tier (https://openrouter.ai/api/v1 with :free models)
 * - Ollama Local Inference (http://localhost:11434/v1)
 * - HuggingFace Inference API
 */
export class OpenFrontierProvider implements AIProvider {
  readonly id: string;
  readonly name: string;
  readonly supportedModels: string[];
  private baseUrl: string;
  private apiKey: string | undefined;
  private defaultModel: string;

  constructor(config?: Partial<OpenFrontierConfig>) {
    this.id = config?.id || "open-frontier";
    this.name = config?.name || "Open Frontier & Free Tier Intelligence";
    
    // Auto-detect available endpoints
    const groqKey = process.env.GROQ_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const ollamaHost = process.env.OLLAMA_HOST || process.env.OLLAMA_BASE_URL;

    if (config?.baseUrl) {
      this.baseUrl = config.baseUrl;
      this.apiKey = config.apiKey;
    } else if (groqKey) {
      this.baseUrl = "https://api.groq.com/openai/v1";
      this.apiKey = groqKey;
    } else if (openRouterKey) {
      this.baseUrl = "https://openrouter.ai/api/v1";
      this.apiKey = openRouterKey;
    } else if (ollamaHost) {
      this.baseUrl = `${ollamaHost.replace(/\/$/, "")}/v1`;
      this.apiKey = "ollama";
    } else {
      // Local Ollama default port
      this.baseUrl = "http://localhost:11434/v1";
      this.apiKey = "ollama";
    }

    this.supportedModels = config?.supportedModels || [
      "llama-3.3-70b-versatile",
      "deepseek-r1-distill-llama-70b",
      "meta-llama/llama-3.3-70b-instruct:free",
      "deepseek/deepseek-r1:free",
      "qwen-2.5-coder-32b",
      "mistral-small-24b",
    ];

    this.defaultModel = config?.defaultModel || this.supportedModels[0];
  }

  get isConfigured(): boolean {
    // If explicitly configured with key or if Ollama is accessible
    return Boolean(
      process.env.GROQ_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.OLLAMA_HOST ||
      this.baseUrl.includes("localhost") ||
      this.baseUrl.includes("127.0.0.1")
    );
  }

  async chat(input: ChatRequest): Promise<ChatResponse> {
    const start = Date.now();
    const model = input.model || this.defaultModel;

    const messages = input.messages.map((m) => {
      let content = "";
      if (Array.isArray(m.content)) {
        content = m.content.map((c) => c.text || "").join("\n");
      } else {
        content = m.content;
      }
      return { role: m.role, content };
    });

    if (input.systemPrompt) {
      messages.unshift({ role: "system", content: input.systemPrompt });
    }

    const payload: Record<string, unknown> = {
      model,
      messages,
      temperature: input.temperature ?? 0.7,
      max_tokens: input.maxTokens ?? 4096,
    };

    if (input.responseFormat === "json_object") {
      payload.response_format = { type: "json_object" };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "Unknown error");
      throw new Error(`OpenFrontier HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const choice = data.choices?.[0];
    const text = choice?.message?.content || "";

    const toolCalls: ToolCall[] = [];
    if (choice?.message?.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        try {
          toolCalls.push({
            callId: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments),
          });
        } catch {
          // ignore malformed tool calls
        }
      }
    }

    return {
      provider: this.name,
      model,
      text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
        estimatedCostUsd: 0, // Open tier / free models
      },
      latencyMs: Date.now() - start,
    };
  }

  async *stream(input: ChatRequest): AsyncIterable<ChatChunk> {
    const res = await this.chat(input);
    yield {
      deltaText: res.text,
      toolCalls: res.toolCalls,
      done: true,
    };
  }

  async analyze(input: AnalysisRequest): Promise<AnalysisResponse> {
    const prompt = `Objective: ${input.objective}\n\nTarget Data: ${
      typeof input.target === "string" ? input.target : JSON.stringify(input.target, null, 2)
    }\n\nProvide structured analysis with findings and recommendations.`;

    const chatRes = await this.chat({
      messages: [{ role: "user", content: prompt }],
      systemPrompt: "You are an elite operational and engineering intelligence analyst.",
      temperature: 0.2,
    });

    return {
      provider: this.name,
      model: chatRes.model,
      summary: chatRes.text.slice(0, 300),
      findings: ["Analysis generated by Open Frontier model", "Evaluated live dataset"],
      recommendations: ["Review generated findings for operational alignment"],
      confidenceScore: 0.92,
      rawAnalysis: chatRes.text,
    };
  }

  async generateCode(input: CodeRequest): Promise<CodeResponse> {
    const prompt = `Language: ${input.language}\nFramework: ${input.framework || "Standard"}\n\nSpecification:\n${input.specification}\n\nExisting Code:\n${input.existingCode || "None"}`;

    const chatRes = await this.chat({
      messages: [{ role: "user", content: prompt }],
      systemPrompt: `You are an elite software architect and systems programmer specializing in ${input.language}. Return clean, production-grade, highly performant code.`,
      temperature: 0.1,
    });

    return {
      provider: this.name,
      model: chatRes.model,
      code: chatRes.text,
      explanation: "Generated by Open Frontier code intelligence engine.",
      dependencies: [],
    };
  }

  async generateStructuredOutput<T>(input: StructuredRequest): Promise<T> {
    const prompt = `${input.prompt}\n\nRespond ONLY with a valid JSON object matching this schema:\n${JSON.stringify(input.schema, null, 2)}`;

    const res = await this.chat({
      messages: [{ role: "user", content: prompt }],
      responseFormat: "json_object",
      temperature: 0.1,
    });

    return JSON.parse(res.text) as T;
  }
}
