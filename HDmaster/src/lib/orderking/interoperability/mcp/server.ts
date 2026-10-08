import type {
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
} from "./types.ts";

export type TransportSender = (message: JSONRPCMessage) => void;

export class MCPServer {
  private tools: Map<string, { definition: MCPTool; handler: (args: any) => Promise<MCPCallToolResult> }> = new Map();
  private resources: Map<string, { definition: MCPResource; reader: () => Promise<string | Buffer> }> = new Map();
  private sendFn: TransportSender;

  private serverInfo: { name: string; version: string };

  constructor(
    serverInfo: { name: string; version: string },
    sendFn: TransportSender
  ) {
    this.serverInfo = serverInfo;
    this.sendFn = sendFn;
  }

  public registerTool(tool: MCPTool, handler: (args: any) => Promise<MCPCallToolResult>) {
    this.tools.set(tool.name, { definition: tool, handler });
  }

  public registerResource(resource: MCPResource, reader: () => Promise<string | Buffer>) {
    this.resources.set(resource.uri, { definition: resource, reader });
  }

  public async handleMessage(message: JSONRPCMessage) {
    if ("id" in message && "method" in message) {
      // It's a request
      const req = message as JSONRPCRequest;
      try {
        const result = await this.dispatch(req.method, req.params);
        this.sendFn({
          jsonrpc: "2.0",
          id: req.id,
          result
        });
      } catch (error: any) {
        this.sendFn({
          jsonrpc: "2.0",
          id: req.id,
          error: {
            code: error.code || -32603,
            message: error.message || "Internal error",
            data: error.data
          }
        });
      }
    }
  }

  private async dispatch(method: string, params: any): Promise<any> {
    switch (method) {
      case "initialize":
        return this.handleInitialize(params);
      case "tools/list":
        return {
          tools: Array.from(this.tools.values()).map(t => t.definition)
        };
      case "tools/call":
        return this.handleCallTool(params);
      case "resources/list":
        return {
          resources: Array.from(this.resources.values()).map(r => r.definition)
        };
      case "resources/read":
        return this.handleReadResource(params);
      default:
        const err: any = new Error(`Method not found: ${method}`);
        err.code = -32601;
        throw err;
    }
  }

  private handleInitialize(params: MCPInitializeParams): MCPInitializeResult {
    return {
      protocolVersion: "1.0",
      capabilities: {
        tools: { listChanged: false },
        resources: { listChanged: false },
        prompts: { listChanged: false }
      },
      serverInfo: this.serverInfo
    };
  }

  private async handleCallTool(params: MCPCallToolRequest): Promise<MCPCallToolResult> {
    const tool = this.tools.get(params.name);
    if (!tool) {
      const err: any = new Error(`Tool not found: ${params.name}`);
      err.code = -32601;
      throw err;
    }
    return tool.handler(params.arguments);
  }

  private async handleReadResource(params: MCPReadResourceRequest): Promise<MCPReadResourceResult> {
    const resource = this.resources.get(params.uri);
    if (!resource) {
      const err: any = new Error(`Resource not found: ${params.uri}`);
      err.code = -32601;
      throw err;
    }
    const data = await resource.reader();
    if (typeof data === "string") {
      return {
        contents: [{ uri: params.uri, mimeType: resource.definition.mimeType, text: data }]
      };
    } else {
      return {
        contents: [{ uri: params.uri, mimeType: resource.definition.mimeType, blob: data.toString("base64") }]
      };
    }
  }
}
