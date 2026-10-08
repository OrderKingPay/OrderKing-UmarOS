export interface JSONRPCRequest {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}

export interface JSONRPCResponse {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface JSONRPCNotification {
  jsonrpc: "2.0";
  method: string;
  params?: any;
}

export type JSONRPCMessage = JSONRPCRequest | JSONRPCResponse | JSONRPCNotification;

export interface MCPInitializeParams {
  protocolVersion: string;
  capabilities: {
    roots?: { listChanged?: boolean };
    sampling?: {};
  };
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface MCPInitializeResult {
  protocolVersion: string;
  capabilities: {
    tools?: { listChanged?: boolean };
    resources?: { subscribe?: boolean; listChanged?: boolean };
    prompts?: { listChanged?: boolean };
  };
  serverInfo: {
    name: string;
    version: string;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPCallToolRequest {
  name: string;
  arguments: Record<string, any>;
}

export interface MCPCallToolResult {
  content: Array<{
    type: "text" | "image";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPReadResourceRequest {
  uri: string;
}

export interface MCPReadResourceResult {
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
}
