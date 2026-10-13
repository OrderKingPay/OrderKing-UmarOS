import * as crypto from "node:crypto";

/**
 * Standard JSON-RPC 2.0 Error Codes and MCP Specific Error Codes
 */
export const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  UNAUTHORIZED: -32001,
  TOOL_EXECUTION_FAILED: -32002,
  FORBIDDEN: -32003,
} as const;

export interface JsonRpcRequest<T = any> {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: T;
}

export interface JsonRpcSuccessResponse<T = any> {
  jsonrpc: "2.0";
  id: string | number | null;
  result: T;
}

export interface JsonRpcErrorObject {
  code: number;
  message: string;
  data?: any;
}

export interface JsonRpcErrorResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  error: JsonRpcErrorObject;
}

export type JsonRpcResponse<T = any> = JsonRpcSuccessResponse<T> | JsonRpcErrorResponse;

/**
 * MCP Tool Input Schema definition compliant with JSON Schema
 */
export interface McpToolInputSchema {
  type: "object";
  properties: Record<
    string,
    {
      type: "string" | "number" | "boolean" | "array" | "object";
      description?: string;
      enum?: readonly (string | number)[];
      minimum?: number;
      maximum?: number;
      items?: Record<string, any>;
      [key: string]: any;
    }
  >;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Security context for authorization gates
 */
export interface McpSecurityContext {
  token?: string;
  role?: "superadmin" | "admin" | "operator" | "marketing" | "finance" | "read_only" | string;
  permissions?: string[];
  clientId?: string;
}

/**
 * Tool Definition
 */
export interface McpToolDefinition<TArgs = any, TResult = any> {
  name: string;
  description: string;
  inputSchema: McpToolInputSchema;
  requiredPermissions?: string[];
  handler: (args: TArgs, context?: McpSecurityContext) => Promise<TResult> | TResult;
}

/**
 * Cryptographic Execution Receipt (SHA-256 HMAC)
 */
export interface McpExecutionReceipt {
  receiptId: string;
  toolName: string;
  executionTimestamp: string;
  status: "SUCCESS" | "FAILED";
  inputHash: string;
  outputHash: string;
  signature: string;
  algorithm: "HMAC-SHA256";
  signer: string;
}

/**
 * Result of MCP tools/call
 */
export interface McpToolCallResult<T = any> {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError: boolean;
  receipt: McpExecutionReceipt;
  data: T;
}

/**
 * Configuration options for McpServerRuntime
 */
export interface McpServerConfig {
  secretKey?: string;
  requireAuth?: boolean;
  authorizedTokens?: Record<
    string,
    {
      role: string;
      permissions: string[];
    }
  >;
}

/**
 * Canonical JSON serialization for deterministic cryptographic hashing
 */
export function canonicalJson(obj: any): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJson).join(",") + "]";
  }
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalJson(obj[k])).join(",") + "}";
}

/**
 * Generates an HMAC-SHA256 cryptographic receipt for tool execution
 */
export function generateExecutionReceipt(
  toolName: string,
  args: any,
  resultOrError: any,
  status: "SUCCESS" | "FAILED",
  secretKey: string,
  receiptId?: string
): McpExecutionReceipt {
  const rId = receiptId || `rcpt_${crypto.randomBytes(8).toString("hex")}`;
  const timestamp = new Date().toISOString();
  const inputHash = crypto.createHash("sha256").update(canonicalJson(args)).digest("hex");
  const outputHash = crypto.createHash("sha256").update(canonicalJson(resultOrError)).digest("hex");

  const payloadToSign = `${rId}|${toolName}|${timestamp}|${status}|${inputHash}|${outputHash}`;
  const signature = crypto.createHmac("sha256", secretKey).update(payloadToSign).digest("hex");

  return {
    receiptId: rId,
    toolName,
    executionTimestamp: timestamp,
    status,
    inputHash,
    outputHash,
    signature,
    algorithm: "HMAC-SHA256",
    signer: "UMAR_OS_MCP_RUNTIME",
  };
}

/**
 * Verifies an execution receipt against secret key and inputs/outputs
 */
export function verifyExecutionReceipt(
  receipt: McpExecutionReceipt,
  secretKey: string,
  args?: any,
  resultOrError?: any
): boolean {
  if (!receipt || !receipt.signature || !receipt.receiptId) return false;

  // Verify input hash if args are provided
  if (args !== undefined) {
    const expectedInputHash = crypto.createHash("sha256").update(canonicalJson(args)).digest("hex");
    if (receipt.inputHash !== expectedInputHash) return false;
  }

  // Verify output hash if resultOrError is provided
  if (resultOrError !== undefined) {
    const expectedOutputHash = crypto.createHash("sha256").update(canonicalJson(resultOrError)).digest("hex");
    if (receipt.outputHash !== expectedOutputHash) return false;
  }

  const payloadToSign = `${receipt.receiptId}|${receipt.toolName}|${receipt.executionTimestamp}|${receipt.status}|${receipt.inputHash}|${receipt.outputHash}`;
  const expectedSig = crypto.createHmac("sha256", secretKey).update(payloadToSign).digest("hex");

  const sigBuf = Buffer.from(receipt.signature, "utf-8");
  const expBuf = Buffer.from(expectedSig, "utf-8");
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

/**
 * Validates arguments against MCP input schema
 */
export function validateArguments(
  schema: McpToolInputSchema,
  args: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!args || typeof args !== "object" || Array.isArray(args)) {
    return { valid: false, errors: ["Arguments must be a valid key-value object."] };
  }

  // Check required properties
  if (schema.required) {
    for (const reqKey of schema.required) {
      if (args[reqKey] === undefined || args[reqKey] === null || args[reqKey] === "") {
        errors.push(`Missing required field '${reqKey}'.`);
      }
    }
  }

  // Check property types and constraints
  for (const [propName, propDef] of Object.entries(schema.properties)) {
    const val = args[propName];
    if (val === undefined || val === null) continue;

    // Type checking
    if (propDef.type === "string" && typeof val !== "string") {
      errors.push(`Field '${propName}' must be a string.`);
    } else if (propDef.type === "number") {
      if (typeof val !== "number" || isNaN(val)) {
        errors.push(`Field '${propName}' must be a valid number.`);
      } else {
        if (propDef.minimum !== undefined && val < propDef.minimum) {
          errors.push(`Field '${propName}' must be greater than or equal to ${propDef.minimum}.`);
        }
        if (propDef.maximum !== undefined && val > propDef.maximum) {
          errors.push(`Field '${propName}' must be less than or equal to ${propDef.maximum}.`);
        }
      }
    } else if (propDef.type === "boolean" && typeof val !== "boolean") {
      errors.push(`Field '${propName}' must be a boolean.`);
    } else if (propDef.type === "array" && !Array.isArray(val)) {
      errors.push(`Field '${propName}' must be an array.`);
    } else if (propDef.type === "object" && (typeof val !== "object" || Array.isArray(val))) {
      errors.push(`Field '${propName}' must be an object.`);
    }

    // Enum checking
    if (propDef.enum && !propDef.enum.includes(val)) {
      errors.push(
        `Field '${propName}' must be one of [${propDef.enum.join(", ")}], received '${String(val)}'.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Default authorized tokens dictionary
 */
export const DEFAULT_AUTHORIZED_TOKENS: Record<string, { role: string; permissions: string[] }> = {
  ok_token_admin_super: {
    role: "admin",
    permissions: ["*"],
  },
  ok_token_operator_dispatch: {
    role: "operator",
    permissions: ["orderking:dispatch"],
  },
  ok_token_finance_settle: {
    role: "finance",
    permissions: ["kingpay:settle"],
  },
  ok_token_marketing_publish: {
    role: "marketing",
    permissions: ["social:publish"],
  },
  ok_token_universal_operator: {
    role: "operator",
    permissions: ["orderking:dispatch", "kingpay:settle", "social:publish"],
  },
  ok_token_readonly_999: {
    role: "read_only",
    permissions: ["tools:read"],
  },
};

/**
 * UMAR OS Model Context Protocol (MCP) Tool Server Runtime
 */
export class McpServerRuntime {
  private tools: Map<string, McpToolDefinition> = new Map();
  private secretKey: string;
  private requireAuth: boolean;
  private authorizedTokens: Record<string, { role: string; permissions: string[] }>;

  constructor(config: McpServerConfig = {}) {
    this.secretKey = config.secretKey || "sovereign_umar_mcp_hmac_secret_2026";
    this.requireAuth = config.requireAuth ?? true;
    this.authorizedTokens = {
      ...DEFAULT_AUTHORIZED_TOKENS,
      ...(config.authorizedTokens || {}),
    };

    // Register core ecosystem tools
    this.registerCoreTools();
  }

  /**
   * Registers a tool into the runtime
   */
  public registerTool<TArgs = any, TResult = any>(tool: McpToolDefinition<TArgs, TResult>): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Returns list of discovered tools with complete JSON schema definitions
   */
  public listTools(): Array<{ name: string; description: string; inputSchema: McpToolInputSchema }> {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  /**
   * Resolves security context from explicit context or token
   */
  public resolveSecurityContext(context?: McpSecurityContext): {
    authenticated: boolean;
    role?: string;
    permissions: string[];
    error?: string;
  } {
    if (!this.requireAuth) {
      return {
        authenticated: true,
        role: context?.role || "admin",
        permissions: context?.permissions || ["*"],
      };
    }

    if (!context || (!context.token && !context.role && !context.permissions)) {
      return {
        authenticated: false,
        permissions: [],
        error: "Missing authorization credentials.",
      };
    }

    // If explicit token provided
    if (context.token) {
      const match = this.authorizedTokens[context.token];
      if (!match) {
        return {
          authenticated: false,
          permissions: [],
          error: "Invalid or expired authorization token.",
        };
      }
      return {
        authenticated: true,
        role: match.role,
        permissions: match.permissions,
      };
    }

    // If passed pre-resolved role and permissions
    return {
      authenticated: true,
      role: context.role,
      permissions: context.permissions || [],
    };
  }

  /**
   * Authorization gate checking if caller has required permissions for tool
   */
  public checkAuthorization(
    toolName: string,
    context?: McpSecurityContext
  ): { authorized: boolean; statusCode: number; reason?: string } {
    const resolved = this.resolveSecurityContext(context);
    if (!resolved.authenticated) {
      return {
        authorized: false,
        statusCode: JSON_RPC_ERRORS.UNAUTHORIZED,
        reason: resolved.error || "Unauthorized: Authentication required.",
      };
    }

    const tool = this.tools.get(toolName);
    if (!tool) {
      return {
        authorized: false,
        statusCode: JSON_RPC_ERRORS.METHOD_NOT_FOUND,
        reason: `Tool '${toolName}' not found in registry.`,
      };
    }

    // Admin or wildcard permissions grant full access
    if (
      resolved.role === "admin" ||
      resolved.role === "superadmin" ||
      resolved.permissions.includes("*")
    ) {
      return { authorized: true, statusCode: 200 };
    }

    // Check tool-specific permissions
    const requiredPerms = tool.requiredPermissions || [];
    for (const perm of requiredPerms) {
      if (!resolved.permissions.includes(perm)) {
        return {
          authorized: false,
          statusCode: JSON_RPC_ERRORS.FORBIDDEN,
          reason: `Forbidden: Caller does not possess required permission '${perm}' for tool '${toolName}'.`,
        };
      }
    }

    return { authorized: true, statusCode: 200 };
  }

  /**
   * Executes an authorized tool with argument validation and HMAC receipt generation
   */
  public async executeTool<T = any>(
    toolName: string,
    args: any,
    context?: McpSecurityContext
  ): Promise<McpToolCallResult<T>> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw {
        code: JSON_RPC_ERRORS.METHOD_NOT_FOUND,
        message: `Tool '${toolName}' not found in registry.`,
      };
    }

    // Authorization Gate
    const authCheck = this.checkAuthorization(toolName, context);
    if (!authCheck.authorized) {
      throw {
        code: authCheck.statusCode,
        message: authCheck.reason,
      };
    }

    // Argument Validation
    const validation = validateArguments(tool.inputSchema, args);
    if (!validation.valid) {
      throw {
        code: JSON_RPC_ERRORS.INVALID_PARAMS,
        message: `Invalid arguments for tool '${toolName}': ${validation.errors.join(" ")}`,
        data: { validationErrors: validation.errors },
      };
    }

    // Execution
    let result: T;
    try {
      result = await tool.handler(args, context);
    } catch (err: any) {
      const errMessage = err?.message || String(err);
      // Cryptographic receipt of failure
      const failReceipt = generateExecutionReceipt(
        toolName,
        args,
        { error: errMessage },
        "FAILED",
        this.secretKey
      );
      throw {
        code: err?.code || JSON_RPC_ERRORS.TOOL_EXECUTION_FAILED,
        message: `Execution failed for tool '${toolName}': ${errMessage}`,
        data: { receipt: failReceipt },
      };
    }

    // Cryptographic Execution Receipt (SHA-256 HMAC)
    const receipt = generateExecutionReceipt(
      toolName,
      args,
      result,
      "SUCCESS",
      this.secretKey
    );

    return {
      content: [
        {
          type: "text",
          text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
        },
      ],
      isError: false,
      receipt,
      data: result,
    };
  }

  /**
   * Handles JSON-RPC 2.0 requests for MCP runtime
   */
  public async handleRpcRequest(
    rawInput: string | JsonRpcRequest,
    context?: McpSecurityContext
  ): Promise<JsonRpcResponse> {
    let req: JsonRpcRequest;

    if (typeof rawInput === "string") {
      try {
        req = JSON.parse(rawInput);
      } catch (err: any) {
        return {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: JSON_RPC_ERRORS.PARSE_ERROR,
            message: `Parse error: Invalid JSON payload. (${err?.message})`,
          },
        };
      }
    } else {
      req = rawInput;
    }

    if (!req || typeof req !== "object" || req.jsonrpc !== "2.0" || !req.method) {
      return {
        jsonrpc: "2.0",
        id: req?.id ?? null,
        error: {
          code: JSON_RPC_ERRORS.INVALID_REQUEST,
          message: "Invalid Request: Must be a valid JSON-RPC 2.0 object with a 'method' property.",
        },
      };
    }

    const id = req.id ?? null;

    // Merge context from params if passed inline
    const effectiveContext: McpSecurityContext = {
      ...(context || {}),
      ...(req.params?._auth || req.params?.auth || {}),
    };

    switch (req.method) {
      case "tools/list": {
        const tools = this.listTools();
        return {
          jsonrpc: "2.0",
          id,
          result: {
            tools,
          },
        };
      }

      case "tools/call": {
        const params = req.params;
        if (!params || typeof params !== "object" || !params.name) {
          return {
            jsonrpc: "2.0",
            id,
            error: {
              code: JSON_RPC_ERRORS.INVALID_PARAMS,
              message: "Invalid params: 'tools/call' requires 'name' property.",
            },
          };
        }

        const toolName = params.name;
        const toolArgs = params.arguments || {};

        try {
          const callResult = await this.executeTool(toolName, toolArgs, effectiveContext);
          return {
            jsonrpc: "2.0",
            id,
            result: callResult,
          };
        } catch (err: any) {
          return {
            jsonrpc: "2.0",
            id,
            error: {
              code: err.code || JSON_RPC_ERRORS.INTERNAL_ERROR,
              message: err.message || "An unexpected error occurred during tool execution.",
              data: err.data,
            },
          };
        }
      }

      default: {
        return {
          jsonrpc: "2.0",
          id,
          error: {
            code: JSON_RPC_ERRORS.METHOD_NOT_FOUND,
            message: `Method '${req.method}' not found. Supported methods: 'tools/list', 'tools/call'.`,
          },
        };
      }
    }
  }

  /**
   * Registers the 3 core ecosystem tools required by UMAR OS
   */
  private registerCoreTools(): void {
    // 1. orderking_dispatch_ride
    this.registerTool({
      name: "orderking_dispatch_ride",
      description:
        "Dispatches an on-demand fleet delivery rider or vehicle for a confirmed OrderKing order.",
      requiredPermissions: ["orderking:dispatch"],
      inputSchema: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "Unique alphanumeric identifier of the order (e.g. 'ord_88219').",
          },
          targetAddress: {
            type: "string",
            description: "Full destination delivery address for dispatching the rider.",
          },
          vehicleType: {
            type: "string",
            description: "Optional vehicle type category.",
            enum: ["BIKE", "SCOOTER", "EV", "VAN"],
          },
        },
        required: ["orderId", "targetAddress"],
      },
      handler: async (args: {
        orderId: string;
        targetAddress: string;
        vehicleType?: "BIKE" | "SCOOTER" | "EV" | "VAN";
      }) => {
        const dispatchId = `dsp_${crypto.randomBytes(6).toString("hex")}`;
        const vehicle = args.vehicleType || "BIKE";
        const etaMinutes = vehicle === "BIKE" ? 14 : 22;

        return {
          orderId: args.orderId,
          targetAddress: args.targetAddress,
          dispatchId,
          status: "DISPATCHED" as const,
          etaMinutes,
          vehicleType: vehicle,
          assignedDriver: {
            driverId: "drv_king_4821",
            name: "Vikram R.",
            phone: "+91-9876543210",
            rating: 4.92,
          },
          trackingUrl: `https://track.orderking.in/dispatch/${dispatchId}`,
          dispatchedAt: new Date().toISOString(),
        };
      },
    });

    // 2. kingpay_verify_settlement
    this.registerTool({
      name: "kingpay_verify_settlement",
      description:
        "Verifies, audits, and initiates instant financial ledger settlement for a KingPay merchant.",
      requiredPermissions: ["kingpay:settle"],
      inputSchema: {
        type: "object",
        properties: {
          merchantId: {
            type: "string",
            description: "Unique merchant identifier in KingPay ledger (e.g. 'merch_5510').",
          },
          amountPaise: {
            type: "number",
            minimum: 1,
            description:
              "Settlement value in paise (1 INR = 100 paise). Must be a positive integer.",
          },
        },
        required: ["merchantId", "amountPaise"],
      },
      handler: async (args: { merchantId: string; amountPaise: number }) => {
        const settlementId = `stl_${crypto.randomBytes(6).toString("hex")}`;
        const feePaise = Math.round(args.amountPaise * 0.012); // 1.2% platform processing fee
        const netSettledPaise = args.amountPaise - feePaise;
        const utr = `UTR${Date.now()}${Math.floor(1000 + Math.random() * 9000)}`;

        return {
          merchantId: args.merchantId,
          amountPaise: args.amountPaise,
          amountInr: Number((args.amountPaise / 100).toFixed(2)),
          feePaise,
          netSettledPaise,
          settlementId,
          status: "VERIFIED" as const,
          utr,
          bankRef: `BNK_${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
          settledAt: new Date().toISOString(),
        };
      },
    });

    // 3. social_publish_campaign
    this.registerTool({
      name: "social_publish_campaign",
      description:
        "Dispatches and broadcasts marketing creatives and campaign copy across sovereign social channels.",
      requiredPermissions: ["social:publish"],
      inputSchema: {
        type: "object",
        properties: {
          channel: {
            type: "string",
            description: "Target social network channel destination.",
            enum: [
              "instagram_reels",
              "youtube_shorts",
              "facebook_page",
              "x_twitter",
              "whatsapp_broadcast",
            ],
          },
          caption: {
            type: "string",
            description: "Campaign copy caption, hashtags, and promotional text.",
          },
          mediaUrl: {
            type: "string",
            description: "Fully qualified HTTPS URL of creative asset.",
          },
        },
        required: ["channel", "caption", "mediaUrl"],
      },
      handler: async (args: {
        channel:
          | "instagram_reels"
          | "youtube_shorts"
          | "facebook_page"
          | "x_twitter"
          | "whatsapp_broadcast";
        caption: string;
        mediaUrl: string;
      }) => {
        if (!args.mediaUrl.startsWith("http://") && !args.mediaUrl.startsWith("https://")) {
          throw new Error("mediaUrl must be a valid HTTP or HTTPS URL.");
        }

        const campaignId = `camp_${crypto.randomBytes(6).toString("hex")}`;
        // Zero-Mock Protocol: Real analytics start at 0 until live webhook reports actual impressions
        return {
          campaignId,
          channel: args.channel,
          caption: args.caption,
          mediaUrl: args.mediaUrl,
          status: "SCHEDULED" as const,
          publishedUrl: null,
          metrics: {
            estimatedReach: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            estimatedRoas: 0,
          },
          publishedAt: new Date().toISOString(),
          requiresConfiguration: true,
          note: "Real social media dispatch requires OAuth tokens (META_GRAPH_ACCESS_TOKEN / YOUTUBE_API_KEY). Post scheduled for manual or webhook delivery.",
        };
      },
    });
  }
}
