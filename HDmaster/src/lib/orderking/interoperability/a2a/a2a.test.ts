import { A2AClient, A2ATransport } from "./client.js";
import { A2AMessage } from "./types.js";

class LocalA2ATransport implements A2ATransport {
  private subscribers: Map<string, (msg: A2AMessage) => void> = new Map();

  subscribe(targetAgentId: string, handler: (msg: A2AMessage) => void): void {
    this.subscribers.set(targetAgentId, handler);
  }

  async send(message: A2AMessage): Promise<void> {
    // Simulate network delay
    setTimeout(() => {
      if (message.header.targetAgentId === "broadcast") {
        this.subscribers.forEach((handler) => handler(message));
      } else {
        const handler = this.subscribers.get(message.header.targetAgentId);
        if (handler) {
          handler(message);
        }
      }
    }, 10);
  }
}

async function runTests() {
  const transport = new LocalA2ATransport();

  const agent1 = new A2AClient("agent-1", transport);
  const agent2 = new A2AClient("agent-2", transport);

  agent2.on("task_delegation", async (msg) => {
    console.log(`[Agent-2] Received task delegation: ${msg.payload.data.taskId}`);
    if (msg.payload.data.taskId === "task-001") {
      console.log(`[Agent-2] Processing task...`);
      await agent2.updateStatus(msg.header.sourceAgentId, {
        taskId: "task-001",
        status: "completed",
        result: { success: true }
      }, msg.header.messageId);
    }
  });

  return new Promise((resolve, reject) => {
    agent1.on("status_update", (msg) => {
      console.log(`[Agent-1] Received status update from ${msg.header.sourceAgentId}:`, msg.payload.data);
      if (msg.payload.data.status === "completed") {
        console.log("✅ A2A Test Passed");
        resolve(true);
      } else {
        console.error("❌ A2A Test Failed: unexpected status");
        process.exit(1);
      }
    });

    console.log("Delegating task to Agent-2...");
    agent1.delegateTask("agent-2", {
      taskId: "task-001",
      objective: "Analyze user query"
    }).catch(reject);
  });
}

runTests();
