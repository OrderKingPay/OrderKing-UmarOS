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
import Anthropic from "@anthropic-ai/sdk";

export class AnthropicProvider implements AIProvider {
  readonly id = "anthropic";
  readonly name = "Anthropic Claude";
  readonly supportedModels = ["claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"];

  private client: Anthropic;
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY;
    this.client = new Anthropic({
        apiKey: this.apiKey || "unconfigured" // will throw in isConfigured check
    });
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  private ensureConfigured() {
    if (!this.isConfigured) {
      throw new Error("Anthropic API key is not configured in environment (ANTHROPIC_API_KEY).");
    }
  }

  async chat(input: ChatRequest): Promise<ChatResponse> {
    this.ensureConfigured();
    const start = Date.now();
    const model = input.model || "claude-3-7-sonnet-20250219";

    const messages = input.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" as const : "user" as const,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      }));

    const tools: Anthropic.Tool[] = input.tools ? input.tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters as Anthropic.Tool.InputSchema
    })) : [];

    const response = await this.client.messages.create({
        model,
        messages,
        max_tokens: input.maxTokens || 4096,
        temperature: input.temperature ?? 0.3,
        system: input.systemPrompt,
        tools: tools.length > 0 ? tools : undefined
    });

    const textParts = response.content.filter((c: any) => c.type === "text").map((c: any) => (c as Anthropic.TextBlock).text);
    const toolCalls: ToolCall[] = response.content
        .filter((c: any) => c.type === "tool_use")
        .map((c: any) => {
            const toolUse = c as Anthropic.ToolUseBlock;
            return {
                callId: toolUse.id,
                name: toolUse.name,
                arguments: toolUse.input as Record<string, unknown>
            };
        });

    const promptTokens = response.usage.input_tokens;
    const completionTokens = response.usage.output_tokens;

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
    this.ensureConfigured();
    const model = input.model || "claude-3-7-sonnet-20250219";

    const messages = input.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" as const : "user" as const,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      }));

    const stream = await this.client.messages.create({
        model,
        messages,
        max_tokens: input.maxTokens || 4096,
        temperature: input.temperature ?? 0.3,
        system: input.systemPrompt,
        stream: true
    });

    for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            yield {
                deltaText: chunk.delta.text,
                done: false
            };
        }
    }
    yield { deltaText: "", done: true };
  }

  async analyze(input: AnalysisRequest): Promise<AnalysisResponse> {
    const res = await this.chat({
      messages: [
        {
          role: "user",
          content: `Perform deep reasoning on target: ${JSON.stringify(input.target)} with goal: ${input.objective}\nReturn strictly valid JSON only.`,
        },
      ],
      systemPrompt: "You are Claude, an advanced analytical and reasoning intelligence. Return strictly valid JSON with keys: 'summary' (string), 'findings' (array of strings), 'recommendations' (array of strings), and 'confidenceScore' (number). No preamble or markdown.",
    });

    const clean = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (!parsed.summary || !Array.isArray(parsed.findings)) {
        throw new Error(`Invalid schema from Anthropic analyze: ${clean}`);
    }

    return {
      provider: this.id,
      model: res.model,
      summary: parsed.summary,
      findings: parsed.findings,
      recommendations: parsed.recommendations || [],
      confidenceScore: typeof parsed.confidenceScore === "number" ? parsed.confidenceScore : 0.96,
      rawAnalysis: res.text,
    };
  }

  async generateCode(input: CodeRequest): Promise<CodeResponse> {
    const res = await this.chat({
      messages: [
        {
          role: "user",
          content: `Generate ${input.language} code for: ${input.specification}\nReturn strictly valid JSON only.`,
        },
      ],
      systemPrompt: "You are a master systems architect. Return elegant, bug-free code. Return strictly valid JSON with keys: 'code' (string), 'explanation' (string), 'unitTests' (optional string), 'dependencies' (optional array of strings). No markdown formatting.",
    });

    const clean = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (!parsed.code) {
        throw new Error(`Invalid schema from Anthropic generateCode: ${clean}`);
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
          content: `Return valid JSON matching schema ${JSON.stringify(input.schema)}: ${input.prompt}\nReturn strictly valid JSON only.`,
        },
      ],
      systemPrompt: "Return raw JSON only.",
    });

    const clean = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean) as T;
  }
}
