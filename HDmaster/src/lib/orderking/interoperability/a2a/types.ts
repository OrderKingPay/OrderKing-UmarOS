export interface A2AMessageHeader {
  sourceAgentId: string;
  targetAgentId: string;
  messageId: string;
  timestamp: string;
  inReplyTo?: string;
  priority?: "low" | "normal" | "high" | "critical";
}

export interface A2APayload {
  type: string; // e.g., "task_delegation", "status_update", "query", "capability_advertisement"
  data: any;
}

export interface A2AMessage {
  header: A2AMessageHeader;
  payload: A2APayload;
  signature?: string; // Optional security layer
}

export interface A2ATaskDelegationData {
  taskId: string;
  objective: string;
  constraints?: string[];
  context?: Record<string, any>;
}

export interface A2ATaskStatusData {
  taskId: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  progress?: number;
  result?: any;
  error?: string;
}

export interface A2ACapability {
  domain: string;
  actions: string[];
  version: string;
}

export interface A2ACapabilityAdvertisement {
  capabilities: A2ACapability[];
}
