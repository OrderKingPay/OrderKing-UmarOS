import { describe, it, expect, beforeEach } from "vitest";
import {
  McpServerRuntime,
  verifyExecutionReceipt,
  JSON_RPC_ERRORS,
  type JsonRpcSuccessResponse,
  type JsonRpcErrorResponse,
  type McpToolCallResult,
} from "./mcp-runtime";

describe("UMAR OS Model Context Protocol (MCP) Runtime & Universal Connector", () => {
  const secretKey = "test_umar_os_mcp_hmac_secret_key_88291";
  let runtime: McpServerRuntime;

  beforeEach(() => {
    runtime = new McpServerRuntime({
      secretKey,
      requireAuth: true,
    });
  });

  // =========================================================================
  // 1. Tool Discovery & JSON Schema Definitions
  // =========================================================================
  describe("Tool Discovery & JSON Schema Definitions (tools/list)", () => {
    it("discovers all registered core ecosystem tools via tools/list RPC", async () => {
      const response = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "req_list_1",
        method: "tools/list",
      })) as JsonRpcSuccessResponse;

      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe("req_list_1");
      expect(response.result).toBeDefined();

      const tools = response.result.tools;
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThanOrEqual(3);

      const toolNames = tools.map((t: any) => t.name);
      expect(toolNames).toContain("orderking_dispatch_ride");
      expect(toolNames).toContain("kingpay_verify_settlement");
      expect(toolNames).toContain("social_publish_campaign");
    });

    it("provides complete, strictly valid JSON schema definitions for all tools", async () => {
      const tools = runtime.listTools();

      for (const tool of tools) {
        expect(tool.name).toBeDefined();
        expect(typeof tool.name).toBe("string");
        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe("string");

        const schema = tool.inputSchema;
        expect(schema.type).toBe("object");
        expect(schema.properties).toBeDefined();
        expect(typeof schema.properties).toBe("object");
        expect(Array.isArray(schema.required)).toBe(true);
        expect(schema.required?.length).toBeGreaterThan(0);

        // All required properties must exist in properties definition
        for (const reqProp of schema.required!) {
          expect(schema.properties[reqProp]).toBeDefined();
          expect(schema.properties[reqProp].type).toBeDefined();
        }
      }

      // Detailed check for orderking_dispatch_ride
      const rideTool = tools.find((t) => t.name === "orderking_dispatch_ride")!;
      expect(rideTool.inputSchema.required).toEqual(["orderId", "targetAddress"]);
      expect(rideTool.inputSchema.properties.orderId.type).toBe("string");
      expect(rideTool.inputSchema.properties.targetAddress.type).toBe("string");
      expect(rideTool.inputSchema.properties.vehicleType.enum).toContain("BIKE");

      // Detailed check for kingpay_verify_settlement
      const settleTool = tools.find((t) => t.name === "kingpay_verify_settlement")!;
      expect(settleTool.inputSchema.required).toEqual(["merchantId", "amountPaise"]);
      expect(settleTool.inputSchema.properties.amountPaise.minimum).toBe(1);

      // Detailed check for social_publish_campaign
      const socialTool = tools.find((t) => t.name === "social_publish_campaign")!;
      expect(socialTool.inputSchema.required).toEqual(["channel", "caption", "mediaUrl"]);
      expect(socialTool.inputSchema.properties.channel.enum).toContain("instagram_reels");
    });

    it("allows dynamic registration of custom ecosystem tools", async () => {
      runtime.registerTool({
        name: "kitchen_inventory_sync",
        description: "Synchronizes raw ingredient stocks with OrderKing procurement gateway.",
        inputSchema: {
          type: "object",
          properties: {
            outletId: { type: "string", description: "Kitchen outlet ID" },
            sku: { type: "string", description: "Item SKU code" },
            quantity: { type: "number", minimum: 0, description: "Stock count" },
          },
          required: ["outletId", "sku", "quantity"],
        },
        handler: async (args: { outletId: string; sku: string; quantity: number }) => {
          return { synced: true, sku: args.sku, quantity: args.quantity };
        },
      });

      const tools = runtime.listTools();
      const customTool = tools.find((t) => t.name === "kitchen_inventory_sync");
      expect(customTool).toBeDefined();
      expect(customTool?.inputSchema.required).toEqual(["outletId", "sku", "quantity"]);
    });
  });

  // =========================================================================
  // 2. Successful Tool Execution & Return Values
  // =========================================================================
  describe("Successful Tool Execution & Return Values (tools/call)", () => {
    it("successfully executes orderking_dispatch_ride with realistic return data", async () => {
      const response = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "call_dispatch_1",
        method: "tools/call",
        params: {
          name: "orderking_dispatch_ride",
          arguments: {
            orderId: "ord_indiranagar_9012",
            targetAddress: "Flat 402, Sovereign Residency, 100ft Rd, Indiranagar, Bengaluru",
            vehicleType: "BIKE",
          },
          _auth: {
            token: "ok_token_admin_super",
          },
        },
      })) as JsonRpcSuccessResponse<McpToolCallResult>;

      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe("call_dispatch_1");
      expect(response.result.isError).toBe(false);

      // Verify content block
      expect(response.result.content[0].type).toBe("text");
      const parsedText = JSON.parse(response.result.content[0].text);
      expect(parsedText.status).toBe("DISPATCHED");

      // Verify returned payload
      const data = response.result.data;
      expect(data.orderId).toBe("ord_indiranagar_9012");
      expect(data.targetAddress).toContain("Indiranagar");
      expect(data.status).toBe("DISPATCHED");
      expect(data.dispatchId).toMatch(/^dsp_[a-f0-9]{12}$/);
      expect(data.etaMinutes).toBe(14);
      expect(data.trackingUrl).toContain(data.dispatchId);
      expect(data.assignedDriver.name).toBe("Vikram R.");
      expect(data.assignedDriver.rating).toBeGreaterThan(4.5);
    });

    it("successfully executes kingpay_verify_settlement with precise financial metrics", async () => {
      const response = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "call_settle_1",
        method: "tools/call",
        params: {
          name: "kingpay_verify_settlement",
          arguments: {
            merchantId: "merch_royal_biryani_5510",
            amountPaise: 450000, // 4,500.00 INR
          },
          _auth: {
            token: "ok_token_finance_settle",
          },
        },
      })) as JsonRpcSuccessResponse<McpToolCallResult>;

      expect(response.result.isError).toBe(false);
      const data = response.result.data;
      expect(data.merchantId).toBe("merch_royal_biryani_5510");
      expect(data.amountPaise).toBe(450000);
      expect(data.amountInr).toBe(4500.0);
      expect(data.status).toBe("VERIFIED");
      expect(data.settlementId).toMatch(/^stl_[a-f0-9]{12}$/);
      expect(data.utr).toMatch(/^UTR\d+/);
      expect(data.bankRef).toMatch(/^BNK_[A-F0-9]{8}$/);
      expect(data.feePaise).toBe(Math.round(450000 * 0.012));
      expect(data.netSettledPaise).toBe(450000 - data.feePaise);
    });

    it("successfully executes social_publish_campaign with channel validation and analytics", async () => {
      const response = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "call_social_1",
        method: "tools/call",
        params: {
          name: "social_publish_campaign",
          arguments: {
            channel: "instagram_reels",
            caption: "Midnight Biryani delivered in 15 mins by OrderKing! #LateNightEats",
            mediaUrl: "https://cdn.orderking.in/assets/reels/midnight_rush.mp4",
          },
          _auth: {
            token: "ok_token_marketing_publish",
          },
        },
      })) as JsonRpcSuccessResponse<McpToolCallResult>;

      expect(response.result.isError).toBe(false);
      const data = response.result.data;
      expect(data.channel).toBe("instagram_reels");
      expect(data.status).toBe("PUBLISHED");
      expect(data.publishedUrl).toContain("instagram.reels.com");
      expect(data.campaignId).toMatch(/^camp_[a-f0-9]{12}$/);
      expect(data.metrics.estimatedReach).toBe(12000);
      expect(data.metrics.impressions).toBeGreaterThan(12000);
      expect(data.metrics.estimatedRoas).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 3. Rejection of Invalid Arguments or Unauthorized Tools
  // =========================================================================
  describe("Rejection of Invalid Arguments, Unauthorized Access, & Errors", () => {
    it("rejects orderking_dispatch_ride when targetAddress or orderId is missing", async () => {
      // Missing targetAddress
      const res1 = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "err_dispatch_1",
        method: "tools/call",
        params: {
          name: "orderking_dispatch_ride",
          arguments: {
            orderId: "ord_1001",
          },
          _auth: { token: "ok_token_admin_super" },
        },
      })) as JsonRpcErrorResponse;

      expect(res1.error).toBeDefined();
      expect(res1.error.code).toBe(JSON_RPC_ERRORS.INVALID_PARAMS);
      expect(res1.error.message).toContain("Missing required field 'targetAddress'");

      // Missing orderId
      const res2 = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "err_dispatch_2",
        method: "tools/call",
        params: {
          name: "orderking_dispatch_ride",
          arguments: {
            targetAddress: "MG Road, Bengaluru",
          },
          _auth: { token: "ok_token_admin_super" },
        },
      })) as JsonRpcErrorResponse;

      expect(res2.error.code).toBe(JSON_RPC_ERRORS.INVALID_PARAMS);
      expect(res2.error.message).toContain("Missing required field 'orderId'");
    });

    it("rejects kingpay_verify_settlement when amountPaise is non-positive or wrong type", async () => {
      // amountPaise <= 0
      const res1 = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "err_settle_1",
        method: "tools/call",
        params: {
          name: "kingpay_verify_settlement",
          arguments: {
            merchantId: "merch_123",
            amountPaise: 0,
          },
          _auth: { token: "ok_token_finance_settle" },
        },
      })) as JsonRpcErrorResponse;

      expect(res1.error.code).toBe(JSON_RPC_ERRORS.INVALID_PARAMS);
      expect(res1.error.message).toContain("must be greater than or equal to 1");

      // amountPaise is a string
      const res2 = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "err_settle_2",
        method: "tools/call",
        params: {
          name: "kingpay_verify_settlement",
          arguments: {
            merchantId: "merch_123",
            amountPaise: "4500" as any,
          },
          _auth: { token: "ok_token_finance_settle" },
        },
      })) as JsonRpcErrorResponse;

      expect(res2.error.code).toBe(JSON_RPC_ERRORS.INVALID_PARAMS);
      expect(res2.error.message).toContain("must be a valid number");
    });

    it("rejects social_publish_campaign with invalid channel or bad URL", async () => {
      // Invalid enum channel
      const res1 = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "err_social_1",
        method: "tools/call",
        params: {
          name: "social_publish_campaign",
          arguments: {
            channel: "myspace_bulletin" as any,
            caption: "Hello World",
            mediaUrl: "https://example.com/media.mp4",
          },
          _auth: { token: "ok_token_marketing_publish" },
        },
      })) as JsonRpcErrorResponse;

      expect(res1.error.code).toBe(JSON_RPC_ERRORS.INVALID_PARAMS);
      expect(res1.error.message).toContain("must be one of");

      // Bad media URL protocol
      const res2 = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "err_social_2",
        method: "tools/call",
        params: {
          name: "social_publish_campaign",
          arguments: {
            channel: "instagram_reels",
            caption: "Hello World",
            mediaUrl: "ftp://storage/local.mp4",
          },
          _auth: { token: "ok_token_marketing_publish" },
        },
      })) as JsonRpcErrorResponse;

      expect(res2.error).toBeDefined();
      expect(res2.error.message).toContain("mediaUrl must be a valid HTTP or HTTPS URL");
    });

    it("rejects execution when authentication credentials are missing", async () => {
      const res = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "unauth_1",
        method: "tools/call",
        params: {
          name: "orderking_dispatch_ride",
          arguments: {
            orderId: "ord_1001",
            targetAddress: "Whitefield, Bengaluru",
          },
        },
      })) as JsonRpcErrorResponse;

      expect(res.error).toBeDefined();
      expect(res.error.code).toBe(JSON_RPC_ERRORS.UNAUTHORIZED);
      expect(res.error.message).toContain("Missing authorization credentials");
    });

    it("rejects execution when token is invalid or unrecognized", async () => {
      const res = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "invalid_token_1",
        method: "tools/call",
        params: {
          name: "orderking_dispatch_ride",
          arguments: {
            orderId: "ord_1001",
            targetAddress: "Whitefield, Bengaluru",
          },
          _auth: {
            token: "invalid_unrecognized_fake_token",
          },
        },
      })) as JsonRpcErrorResponse;

      expect(res.error).toBeDefined();
      expect(res.error.code).toBe(JSON_RPC_ERRORS.UNAUTHORIZED);
      expect(res.error.message).toContain("Invalid or expired authorization token");
    });

    it("enforces RBAC authorization gate and rejects forbidden actions", async () => {
      // Marketing token cannot execute ride dispatch
      const res1 = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "forbidden_1",
        method: "tools/call",
        params: {
          name: "orderking_dispatch_ride",
          arguments: {
            orderId: "ord_1001",
            targetAddress: "Koramangala, Bengaluru",
          },
          _auth: {
            token: "ok_token_marketing_publish",
          },
        },
      })) as JsonRpcErrorResponse;

      expect(res1.error).toBeDefined();
      expect(res1.error.code).toBe(JSON_RPC_ERRORS.FORBIDDEN);
      expect(res1.error.message).toContain("does not possess required permission 'orderking:dispatch'");

      // Read-only token cannot execute settlement
      const res2 = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "forbidden_2",
        method: "tools/call",
        params: {
          name: "kingpay_verify_settlement",
          arguments: {
            merchantId: "merch_101",
            amountPaise: 50000,
          },
          _auth: {
            token: "ok_token_readonly_999",
          },
        },
      })) as JsonRpcErrorResponse;

      expect(res2.error.code).toBe(JSON_RPC_ERRORS.FORBIDDEN);
      expect(res2.error.message).toContain("does not possess required permission 'kingpay:settle'");
    });

    it("rejects calling an unregistered or nonexistent tool", async () => {
      const res = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "not_found_1",
        method: "tools/call",
        params: {
          name: "drone_autonomous_refuel",
          arguments: { batteryLevel: 12 },
          _auth: { token: "ok_token_admin_super" },
        },
      })) as JsonRpcErrorResponse;

      expect(res.error).toBeDefined();
      expect(res.error.code).toBe(JSON_RPC_ERRORS.METHOD_NOT_FOUND);
      expect(res.error.message).toContain("not found in registry");
    });

    it("rejects malformed JSON payloads and invalid RPC structure", async () => {
      // Malformed string
      const res1 = (await runtime.handleRpcRequest(
        "INVALID_NON_JSON_STRING"
      )) as JsonRpcErrorResponse;
      expect(res1.error.code).toBe(JSON_RPC_ERRORS.PARSE_ERROR);

      // Missing method
      const res2 = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: 1,
      } as any)) as JsonRpcErrorResponse;
      expect(res2.error.code).toBe(JSON_RPC_ERRORS.INVALID_REQUEST);

      // Unsupported RPC method
      const res3 = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "unknown_method",
        method: "resources/list",
      })) as JsonRpcErrorResponse;
      expect(res3.error.code).toBe(JSON_RPC_ERRORS.METHOD_NOT_FOUND);
    });
  });

  // =========================================================================
  // 4. Cryptographic HMAC Execution Receipt Generation & Verification
  // =========================================================================
  describe("Cryptographic Execution Receipts (HMAC-SHA256)", () => {
    it("generates an HMAC-SHA256 execution receipt on every tool execution", async () => {
      const args = {
        orderId: "ord_verified_receipt_99",
        targetAddress: "HSR Layout Sector 1, Bengaluru",
        vehicleType: "BIKE" as const,
      };

      const result = await runtime.executeTool(
        "orderking_dispatch_ride",
        args,
        { token: "ok_token_admin_super" }
      );

      expect(result.receipt).toBeDefined();
      expect(result.receipt.receiptId).toMatch(/^rcpt_[a-f0-9]{16}$/);
      expect(result.receipt.toolName).toBe("orderking_dispatch_ride");
      expect(result.receipt.status).toBe("SUCCESS");
      expect(result.receipt.algorithm).toBe("HMAC-SHA256");
      expect(result.receipt.signer).toBe("UMAR_OS_MCP_RUNTIME");
      expect(result.receipt.signature).toBeDefined();
      expect(result.receipt.signature.length).toBe(64); // SHA-256 hex string

      // Verify the cryptographic receipt signature
      const isValid = verifyExecutionReceipt(result.receipt, secretKey, args, result.data);
      expect(isValid).toBe(true);
    });

    it("fails cryptographic receipt verification if arguments or output are tampered", async () => {
      const args = {
        merchantId: "merch_honest_500",
        amountPaise: 250000,
      };

      const result = await runtime.executeTool(
        "kingpay_verify_settlement",
        args,
        { token: "ok_token_finance_settle" }
      );

      // Legitimate verification succeeds
      expect(verifyExecutionReceipt(result.receipt, secretKey, args, result.data)).toBe(true);

      // Tampered arguments fail verification
      const tamperedArgs = {
        merchantId: "merch_honest_500",
        amountPaise: 999999999, // Tampered amount
      };
      expect(verifyExecutionReceipt(result.receipt, secretKey, tamperedArgs, result.data)).toBe(
        false
      );

      // Tampered result data fails verification
      const tamperedData = {
        ...result.data,
        status: "FRAUDULENT",
      };
      expect(verifyExecutionReceipt(result.receipt, secretKey, args, tamperedData)).toBe(false);

      // Wrong secret key fails verification
      expect(
        verifyExecutionReceipt(result.receipt, "attacker_wrong_secret_key", args, result.data)
      ).toBe(false);

      // Tampered signature string fails verification
      const tamperedReceipt = {
        ...result.receipt,
        signature: "0000000000000000000000000000000000000000000000000000000000000000",
      };
      expect(verifyExecutionReceipt(tamperedReceipt, secretKey, args, result.data)).toBe(false);
    });

    it("embeds the cryptographic receipt inside tools/call JSON-RPC response", async () => {
      const response = (await runtime.handleRpcRequest({
        jsonrpc: "2.0",
        id: "call_receipt_check",
        method: "tools/call",
        params: {
          name: "social_publish_campaign",
          arguments: {
            channel: "youtube_shorts",
            caption: "Fastest biryani in Bengaluru! #shorts",
            mediaUrl: "https://cdn.orderking.in/shorts/biryani.mp4",
          },
          _auth: { token: "ok_token_marketing_publish" },
        },
      })) as JsonRpcSuccessResponse<McpToolCallResult>;

      expect(response.result.receipt).toBeDefined();
      expect(response.result.receipt.toolName).toBe("social_publish_campaign");
      expect(
        verifyExecutionReceipt(
          response.result.receipt,
          secretKey,
          {
            channel: "youtube_shorts",
            caption: "Fastest biryani in Bengaluru! #shorts",
            mediaUrl: "https://cdn.orderking.in/shorts/biryani.mp4",
          },
          response.result.data
        )
      ).toBe(true);
    });
  });
});
