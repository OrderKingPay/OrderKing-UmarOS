import {
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResponse,
  MCPInitializeParams,
  MCPInitializeResult,
  MCPTool,
  MCPCallToolRequest,
  MCPCallToolResult,
  MCPResource,
  MCPReadResourceRequest,
  MCPReadResourceResult
} from "./types.js";

export type TransportSender = (message: JSONRPCMessage) => void;

export class MCPClient {
  private nextId = 1;
  private pendingRequests: Map<string | number, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();
  private sendFn: TransportSender;
  public serverInfo?: { name: string; version: string };

  constructor(
    private clientInfo: { name: string; version: string },
    sendFn: TransportSender
  ) {
    this.sendFn = sendFn;
  }

  public handleMessage(message: JSONRPCMessage) {
    if ("id" in message && ("result" in message || "error" in message)) {
      const response = message as JSONRPCResponse;
      const req = this.pendingRequests.get(response.id);
      if (req) {
        this.pendingRequests.delete(response.id);
        if (response.error) {
          req.reject(response.error);
        } else {
          req.resolve(response.result);
        }
      }
    }
  }

  private request<T>(method: string, params?: any): Promise<T> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.sendFn({
        jsonrpc: "2.0",
        id,
        method,
        params
      });
    });
  }

  public async initialize(): Promise<MCPInitializeResult> {
    const result = await this.request<MCPInitializeResult>("initialize", {
      protocolVersion: "1.0",
      capabilities: {},
      clientInfo: this.clientInfo
    } as MCPInitializeParams);
    this.serverInfo = result.serverInfo;
    return result;
  }

  public async listTools(): Promise<MCPTool[]> {
    const result = await this.request<{ tools: MCPTool[] }>("tools/list");
    return result.tools;
  }

  public async callTool(name: string, args: Record<string, any>): Promise<MCPCallToolResult> {
    return await this.request<MCPCallToolResult>("tools/call", {
      name,
      arguments: args
    } as MCPCallToolRequest);
  }

  public async listResources(): Promise<MCPResource[]> {
    const result = await this.request<{ resources: MCPResource[] }>("resources/list");
    return result.resources;
  }

  public async readResource(uri: string): Promise<MCPReadResourceResult> {
    return await this.request<MCPReadResourceResult>("resources/read", { uri } as MCPReadResourceRequest);
  }
}
