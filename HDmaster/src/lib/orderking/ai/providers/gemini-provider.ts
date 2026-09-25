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
import { GoogleGenAI } from "@google/genai";

export class GoogleGeminiProvider implements AIProvider {
  readonly id = "gemini";
  readonly name = "Google Gemini Core";
  readonly supportedModels = ["gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-pro"];

  private ai: GoogleGenAI;
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (this.apiKey) {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    } else {
      // Mock initialization to satisfy typescript, will throw in isConfigured check
      this.ai = new GoogleGenAI({ apiKey: "unconfigured" });
    }
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  private ensureConfigured() {
    if (!this.isConfigured) {
      throw new Error("Gemini API key is not configured in environment (GEMINI_API_KEY).");
    }
  }

  async chat(input: ChatRequest): Promise<ChatResponse> {
    this.ensureConfigured();
    const start = Date.now();
    const model = input.model || "gemini-2.5-pro";

    const contents = input.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: Array.isArray(m.content)
          ? m.content.map((p) => ({ text: p.text || "" }))
          : [{ text: m.content as string }],
      }));

    const tools = input.tools?.map(t => ({
        functionDeclarations: [{
            name: t.name,
            description: t.description,
            parameters: t.parameters as any
        }]
    }));

    const response = await this.ai.models.generateContent({
        model,
        contents,
        config: {
            temperature: input.temperature ?? 0.4,
            maxOutputTokens: input.maxTokens ?? 4096,
            systemInstruction: input.systemPrompt,
            tools: tools?.length ? tools : undefined,
            responseMimeType: input.responseFormat === "json_object" ? "application/json" : "text/plain"
        }
    });

    const text = response.text || "";
    const functionCalls = response.functionCalls || [];
    
    const toolCalls: ToolCall[] = functionCalls.map((fc: any, idx: number) => ({
      callId: `gemini_call_${idx}_${Date.now()}`,
      name: fc.name,
      arguments: fc.args as Record<string, unknown>,
    }));

    const usage = response.usageMetadata;
    const promptTokens = usage?.promptTokenCount || 0;
    const completionTokens = usage?.candidatesTokenCount || 0;

    return {
      provider: this.id,
      model,
      text: text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: usage?.totalTokenCount || promptTokens + completionTokens,
        estimatedCostUsd: (promptTokens * 0.0001 + completionTokens * 0.0004) / 1000,
      },
      latencyMs: Date.now() - start,
    };
  }

  async *stream(input: ChatRequest): AsyncIterable<ChatChunk> {
    this.ensureConfigured();
    const model = input.model || "gemini-2.5-pro";

    const contents = input.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: Array.isArray(m.content)
          ? m.content.map((p) => ({ text: p.text || "" }))
          : [{ text: m.content as string }],
      }));

    const stream = await this.ai.models.generateContentStream({
        model,
        contents,
        config: {
            temperature: input.temperature ?? 0.4,
            maxOutputTokens: input.maxTokens ?? 4096,
            systemInstruction: input.systemPrompt
        }
    });

    for await (const chunk of stream) {
        yield {
            deltaText: chunk.text || "",
            done: false
        };
    }
    yield {
        deltaText: "",
        done: true
    };
  }

  async analyze(input: AnalysisRequest): Promise<AnalysisResponse> {
    const res = await this.chat({
      messages: [
        {
          role: "user",
          content: `Perform deep executive analysis on the following target for objective: "${input.objective}".\nTarget data: ${JSON.stringify(
            input.target
          )}\nContext: ${JSON.stringify(input.context || {})}`,
        },
      ],
      systemPrompt:
        "You are an elite enterprise strategy analyst. Return strictly valid JSON with keys: 'summary' (string), 'findings' (array of strings), 'recommendations' (array of strings), and 'confidenceScore' (number between 0 and 1). No markdown.",
      responseFormat: "json_object",
    });

    const parsed = JSON.parse(res.text);
    if (!parsed.summary || !Array.isArray(parsed.findings)) {
      throw new Error(`Invalid schema from Gemini analyze: ${res.text}`);
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
          content: `Generate production-ready, typed ${input.language} code for the following specification:\n${
            input.specification
          }\nExisting context: ${input.existingCode || "None"}`,
        },
      ],
      systemPrompt:
        "You are a Principal Software Engineer. Write clean, robust code. Return strictly valid JSON with keys: 'code' (string), 'explanation' (string), 'unitTests' (optional string), 'dependencies' (optional array of strings).",
      responseFormat: "json_object",
    });

    const parsed = JSON.parse(res.text);
    if (!parsed.code) {
      throw new Error(`Invalid schema from Gemini generateCode: ${res.text}`);
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
          content: `Generate valid JSON matching this schema:\n${JSON.stringify(
            input.schema
          )}\nPrompt: ${input.prompt}`,
        },
      ],
      systemPrompt: "You are a structured data extractor. Return strictly valid JSON with no markdown backticks.",
      responseFormat: "json_object",
    });

    return JSON.parse(res.text) as T;
  }
}
