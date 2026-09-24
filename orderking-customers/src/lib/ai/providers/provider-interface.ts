// Universal AI Provider Abstraction Interface
// Governs Chat, Streaming, Multimodal Analysis, Code Generation, and Structured Output

export type ModelRole = "system" | "user" | "assistant" | "tool";

export interface MessagePart {
  type: "text" | "image" | "file" | "code";
  text?: string;
  mimeType?: string;
  data?: string; // base64 or raw string
}

export interface ChatMessage {
  role: ModelRole;
  content: string | MessagePart[];
  name?: string;
  toolCallId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ToolCall {
  callId: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ChatRequest {
  messages: ChatMessage[];
  systemPrompt?: string;
  tools?: ToolDefinition[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
  responseFormat?: "text" | "json_object";
}

export interface ChatResponse {
  provider: string;
  model: string;
  text: string;
  toolCalls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCostUsd?: number;
  };
  latencyMs?: number;
}

export interface ChatChunk {
  deltaText: string;
  toolCalls?: ToolCall[];
  done: boolean;
}

export interface AnalysisRequest {
  target: string | Record<string, unknown>;
  objective: string;
  context?: Record<string, unknown>;
  instructions?: string;
}

export interface AnalysisResponse {
  provider: string;
  model: string;
  summary: string;
  findings: string[];
  recommendations: string[];
  confidenceScore: number;
  rawAnalysis: string;
}

export interface CodeRequest {
  language: "typescript" | "sql" | "python" | "html" | "css" | "json";
  specification: string;
  existingCode?: string;
  framework?: string;
  fileContext?: Record<string, string>;
}

export interface CodeResponse {
  provider: string;
  model: string;
  code: string;
  explanation: string;
  unitTests?: string;
  dependencies?: string[];
}

export interface StructuredRequest {
  schema: Record<string, unknown>;
  prompt: string;
  context?: Record<string, unknown>;
}

export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly supportedModels: string[];
  readonly isConfigured: boolean;

  chat(input: ChatRequest): Promise<ChatResponse>;
  stream(input: ChatRequest): AsyncIterable<ChatChunk>;
  analyze(input: AnalysisRequest): Promise<AnalysisResponse>;
  generateCode(input: CodeRequest): Promise<CodeResponse>;
  generateStructuredOutput<T>(input: StructuredRequest): Promise<T>;
}
