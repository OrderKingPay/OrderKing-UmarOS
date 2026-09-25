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

export class GoogleGeminiProvider implements AIProvider {
  readonly id = "gemini";
  readonly name = "Google Gemini Core";
  readonly supportedModels = ["gemini-2.0-flash", "gemini-2.5-pro", "gemini-1.5-pro"];

  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async chat(input: ChatRequest): Promise<ChatResponse> {
    if (!this.isConfigured) {
      throw new Error("Gemini API key is not configured in environment (GEMINI_API_KEY).");
    }

    const start = Date.now();
    const model = input.model || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const contents = input.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: Array.isArray(m.content)
          ? m.content.map((p) => ({ text: p.text || "" }))
          : [{ text: m.content }],
      }));

    const functionDeclarations = input.tools?.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));

    const payload: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: input.temperature ?? 0.4,
        maxOutputTokens: input.maxTokens ?? 4096,
        ...(input.responseFormat === "json_object" ? { responseMimeType: "application/json" } : {}),
      },
    };

    if (input.systemPrompt) {
      payload.systemInstruction = { parts: [{ text: input.systemPrompt }] };
    }

    // 10x Capability: Native Real-time Google Search (Web Grounding)
    payload.tools = [{ googleSearch: {} }] as any[];

    if (functionDeclarations && functionDeclarations.length > 0) {
      (payload.tools as any[]).push({ functionDeclarations });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
            functionCall?: { name: string; args: Record<string, unknown> };
          }>;
        };
      }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };

    const candidate = data.candidates?.[0]?.content?.parts ?? [];
    const textParts = candidate.map((p) => p.text).filter(Boolean);
    const toolCalls: ToolCall[] = candidate
      .filter((p) => p.functionCall)
      .map((p, idx) => ({
        callId: `gemini_call_${idx}_${Date.now()}`,
        name: p.functionCall!.name,
        arguments: p.functionCall!.args || {},
      }));

    const promptTokens = data.usageMetadata?.promptTokenCount || 0;
    const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;
    const totalTokens = data.usageMetadata?.totalTokenCount || promptTokens + completionTokens;

    return {
      provider: this.id,
      model,
      text: textParts.join("\n").trim(),
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUsd: (promptTokens * 0.0001 + completionTokens * 0.0004) / 1000,
      },
      latencyMs: Date.now() - start,
    };
  }

  async *stream(input: ChatRequest): AsyncIterable<ChatChunk> {
    if (!this.isConfigured) {
      throw new Error("Gemini API key is not configured in environment (GEMINI_API_KEY).");
    }

    const model = input.model || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const contents = input.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: Array.isArray(m.content)
          ? m.content.map((p) => ({ text: p.text || "" }))
          : [{ text: m.content }],
      }));

    const functionDeclarations = input.tools?.map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }));

    const payload: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: input.temperature ?? 0.4,
        maxOutputTokens: input.maxTokens ?? 4096,
      },
    };

    if (input.systemPrompt) {
      payload.systemInstruction = { parts: [{ text: input.systemPrompt }] };
    }

    // 10x Capability: Native Real-time Google Search (Web Grounding)
    payload.tools = [{ googleSearch: {} }] as any[];

    if (functionDeclarations && functionDeclarations.length > 0) {
      (payload.tools as any[]).push({ functionDeclarations });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    if (!response.body) throw new Error("No body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

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
          const candidate = parsed.candidates?.[0]?.content?.parts ?? [];
          
          let textDelta = "";
          const toolCalls: ToolCall[] = [];
          
          for (const p of candidate) {
            if (p.text) textDelta += p.text;
            if (p.functionCall) {
              toolCalls.push({
                callId: `gemini_call_${Date.now()}`,
                name: p.functionCall.name,
                arguments: p.functionCall.args || {},
              });
            }
          }
          
          if (textDelta || toolCalls.length > 0) {
            yield {
              deltaText: textDelta,
              toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
              done: false,
            };
          }
        } catch (e) {
          // Ignore incomplete chunk parse errors
        }
      }
    }
    yield { deltaText: "", done: true };
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
        "You are an elite enterprise strategy analyst. Return strictly valid JSON with keys: 'summary' (string), 'findings' (array of strings), 'recommendations' (array of strings), and 'confidenceScore' (number).",
      responseFormat: "json_object",
    });

    let parsed: any;
    try {
      parsed = JSON.parse(res.text);
    } catch (e) {
      throw new Error(`Gemini analyze failed to return valid JSON. Raw response: ${res.text}`);
    }

    if (!parsed.summary || !Array.isArray(parsed.findings)) {
        throw new Error(`Gemini analyze response did not match schema. Raw response: ${res.text}`);
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
        "You are a Principal Software Engineer. Write clean, robust, zero-placeholder code. Return strictly valid JSON with keys: 'code' (string), 'explanation' (string), 'unitTests' (optional string), 'dependencies' (optional array of strings).",
      responseFormat: "json_object",
    });

    let parsed: any;
    try {
      parsed = JSON.parse(res.text);
    } catch (e) {
      throw new Error(`Gemini generateCode failed to return valid JSON. Raw response: ${res.text}`);
    }

    if (!parsed.code) {
        throw new Error(`Gemini generateCode response did not contain 'code'. Raw response: ${res.text}`);
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
      systemPrompt: "You are a structured data extractor. Return strictly raw, valid JSON with no markdown backticks.",
      responseFormat: "json_object",
    });

    const clean = res.text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(clean) as T;
  }
}
