import {
  A2AMessage,
  A2APayload,
  A2ATaskDelegationData,
  A2ATaskStatusData,
  A2ACapabilityAdvertisement
} from "./types.js";

export interface A2ATransport {
  send(message: A2AMessage): Promise<void>;
  subscribe(targetAgentId: string, handler: (msg: A2AMessage) => void): void;
}

export class A2AClient {
  private agentId: string;
  private transport: A2ATransport;
  private messageHandlers: Map<string, Array<(msg: A2AMessage) => void>> = new Map();

  constructor(agentId: string, transport: A2ATransport) {
    this.agentId = agentId;
    this.transport = transport;
    this.transport.subscribe(this.agentId, this.handleIncoming.bind(this));
  }

  private handleIncoming(message: A2AMessage) {
    const type = message.payload.type;
    const handlers = this.messageHandlers.get(type) || [];
    for (const h of handlers) {
      h(message);
    }
  }

  public on(payloadType: string, handler: (msg: A2AMessage) => void) {
    const existing = this.messageHandlers.get(payloadType) || [];
    existing.push(handler);
    this.messageHandlers.set(payloadType, existing);
  }

  private createHeader(targetAgentId: string, inReplyTo?: string): A2AMessage["header"] {
    return {
      sourceAgentId: this.agentId,
      targetAgentId,
      messageId: Date.now().toString() + "-" + Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      inReplyTo,
      priority: "normal"
    };
  }

  public async delegateTask(targetAgentId: string, task: A2ATaskDelegationData): Promise<string> {
    const header = this.createHeader(targetAgentId);
    const message: A2AMessage = {
      header,
      payload: {
        type: "task_delegation",
        data: task
      }
    };
    await this.transport.send(message);
    return header.messageId;
  }

  public async updateStatus(targetAgentId: string, status: A2ATaskStatusData, inReplyTo?: string): Promise<string> {
    const header = this.createHeader(targetAgentId, inReplyTo);
    const message: A2AMessage = {
      header,
      payload: {
        type: "status_update",
        data: status
      }
    };
    await this.transport.send(message);
    return header.messageId;
  }

  public async advertiseCapabilities(capabilities: A2ACapabilityAdvertisement): Promise<void> {
    // A broadcast target could be 'broadcast'
    const header = this.createHeader("broadcast");
    const message: A2AMessage = {
      header,
      payload: {
        type: "capability_advertisement",
        data: capabilities
      }
    };
    await this.transport.send(message);
  }
}
