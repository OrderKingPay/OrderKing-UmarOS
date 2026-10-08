import { MCPServer } from "./server.js";
import { MCPClient } from "./client.js";
import { JSONRPCMessage, MCPCallToolResult } from "./types.js";

// A simple local transport simulation for testing
class LocalTransport {
  public serverToClient: (msg: JSONRPCMessage) => void = () => {};
  public clientToServer: (msg: JSONRPCMessage) => void = () => {};
}

async function runTests() {
  const transport = new LocalTransport();

  const server = new MCPServer({ name: "TestServer", version: "1.0" }, (msg) => {
    // Send to client
    setTimeout(() => transport.serverToClient(msg), 10);
  });

  server.registerTool({
    name: "calculator",
    description: "Adds two numbers",
    inputSchema: {
      type: "object",
      properties: {
        a: { type: "number" },
        b: { type: "number" }
      },
      required: ["a", "b"]
    }
  }, async (args: any) => {
    return {
      content: [{ type: "text", text: String(args.a + args.b) }]
    } as MCPCallToolResult;
  });

  const client = new MCPClient({ name: "TestClient", version: "1.0" }, (msg) => {
    // Send to server
    setTimeout(() => server.handleMessage(msg), 10);
  });

  transport.serverToClient = (msg) => client.handleMessage(msg);
  transport.clientToServer = (msg) => server.handleMessage(msg);

  try {
    console.log("Initializing client...");
    const initRes = await client.initialize();
    console.log("Initialization successful:", initRes);

    console.log("Listing tools...");
    const tools = await client.listTools();
    console.log("Tools found:", tools);

    console.log("Calling tool...");
    const callRes = await client.callTool("calculator", { a: 5, b: 7 });
    console.log("Tool execution result:", callRes);

    if (callRes.content[0].text === "12") {
      console.log("✅ MCP Test Passed");
    } else {
      console.error("❌ MCP Test Failed: unexpected result");
      process.exit(1);
    }

  } catch (err) {
    console.error("❌ Test failed with error:", err);
    process.exit(1);
  }
}

runTests();
