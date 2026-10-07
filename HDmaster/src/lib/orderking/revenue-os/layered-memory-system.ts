// Layered Agent Memory System (Directive 20)
// Implements 9 discrete memory layers:
// 1. Conversation Memory  2. Project Memory  3. Client Memory  4. Founder Preferences
// 5. Business Memory      6. Tool Memory     7. Task History   8. Financial History
// 9. Technical Knowledge
// Fully transparent: founder can inspect, modify, and delete any stored memory record.

export type MemoryLayer =
  | "CONVERSATION_MEMORY"
  | "PROJECT_MEMORY"
  | "CLIENT_MEMORY"
  | "FOUNDER_PREFERENCES"
  | "BUSINESS_MEMORY"
  | "TOOL_MEMORY"
  | "TASK_HISTORY"
  | "FINANCIAL_HISTORY"
  | "TECHNICAL_KNOWLEDGE";

export interface MemoryRecord {
  id: string;
  layer: MemoryLayer;
  key: string;
  value: unknown;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export class LayeredMemorySystem {
  private memories: Map<string, MemoryRecord> = new Map();

  constructor() {
    this.seedFounderPreferences();
  }

  private seedFounderPreferences() {
    this.save({
      layer: "FOUNDER_PREFERENCES",
      key: "payment_routing_preference",
      value: { defaultGateway: "KING_PAY_UPI", feeTolerance: 0, requireUtrVerification: true },
      tags: ["payments", "zero_fees", "upi"],
    });

    this.save({
      layer: "TECHNICAL_KNOWLEDGE",
      key: "preferred_fullstack_stack",
      value: { frontend: "Next.js 15 / React 19", backend: "Node.js / TypeScript", db: "PostgreSQL" },
      tags: ["stack", "architecture"],
    });

    this.save({
      layer: "BUSINESS_MEMORY",
      key: "target_operating_margin",
      value: { minimumMarginPercent: 75, targetMarginPercent: 90 },
      tags: ["economics", "pricing"],
    });
  }

  save(params: { layer: MemoryLayer; key: string; value: unknown; tags?: string[] }): MemoryRecord {
    const existing = Array.from(this.memories.values()).find(
      (m) => m.layer === params.layer && m.key === params.key
    );

    const now = new Date().toISOString().replace("T", " ").slice(0, 16);
    if (existing) {
      existing.value = params.value;
      existing.tags = params.tags || existing.tags;
      existing.updatedAt = now;
      return existing;
    }

    const id = `MEM-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: MemoryRecord = {
      id,
      layer: params.layer,
      key: params.key,
      value: params.value,
      tags: params.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    this.memories.set(id, record);
    return record;
  }

  get(layer: MemoryLayer, key: string): MemoryRecord | undefined {
    return Array.from(this.memories.values()).find((m) => m.layer === layer && m.key === key);
  }

  listByLayer(layer: MemoryLayer): MemoryRecord[] {
    return Array.from(this.memories.values()).filter((m) => m.layer === layer);
  }

  getAll(): MemoryRecord[] {
    return Array.from(this.memories.values());
  }

  update(id: string, newValue: unknown): MemoryRecord {
    const record = this.memories.get(id);
    if (!record) throw new Error(`Memory record ${id} not found.`);
    record.value = newValue;
    record.updatedAt = new Date().toISOString().replace("T", " ").slice(0, 16);
    return record;
  }

  delete(id: string): boolean {
    return this.memories.delete(id);
  }

  clearLayer(layer: MemoryLayer): number {
    let count = 0;
    for (const [id, record] of this.memories.entries()) {
      if (record.layer === layer) {
        this.memories.delete(id);
        count++;
      }
    }
    return count;
  }
}

export const layeredMemory = new LayeredMemorySystem();
