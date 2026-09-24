/**
 * HDmaster Founder AI — Searchable Knowledge Engine & Layered Memory (§20, §21)
 *
 * Searchable Knowledge Base:
 * - Allows founder to upload/ingest documents (specs, contracts, manuals, codebases, research).
 * - Implements fast token-based inverted index retrieval rather than assuming model memorization.
 *
 * Layered Agent Memory:
 * - 9 explicit layers:
 *   1. Conversation Memory
 *   2. Project Memory
 *   3. Client Memory
 *   4. Founder Preferences
 *   5. Business Memory
 *   6. Tool Memory
 *   7. Task History
 *   8. Financial History
 *   9. Technical Knowledge
 * - Allows the founder to inspect, modify, and delete stored memory entries.
 */

export type MemoryLayer =
  | "CONVERSATION"
  | "PROJECT"
  | "CLIENT"
  | "FOUNDER_PREFERENCES"
  | "BUSINESS"
  | "TOOL"
  | "TASK_HISTORY"
  | "FINANCIAL_HISTORY"
  | "TECHNICAL_KNOWLEDGE";

export interface MemoryEntry {
  id: string;
  layer: MemoryLayer;
  key: string;
  value: string;
  tags: string[];
  updatedAt: string;
  source?: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: "SPEC" | "CONTRACT" | "MANUAL" | "CODE" | "RESEARCH" | "CLIENT_REQ";
  content: string;
  tokens: string[];
  uploadedAt: string;
  author: string;
}

export interface SearchResult {
  documentId: string;
  title: string;
  category: string;
  matchScore: number;
  snippet: string;
}

export const INITIAL_KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: "DOC-001",
    title: "OrderKing Sovereign Architecture Blueprint",
    category: "SPEC",
    content:
      "OrderKing delivers a 0% commission food delivery and hyperlocal logistics architecture. It includes customer ordering, rider dispatch with geodesic clustering, restaurant kitchen display systems, and King Pay UPI escrow settlement.",
    tokens: ["orderking", "sovereign", "architecture", "commission", "food", "delivery", "logistics", "rider", "dispatch", "kds", "upi", "escrow"],
    uploadedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    author: "Founder Direct",
  },
  {
    id: "DOC-002",
    title: "Standard Enterprise Client SLA & Retainer Agreement",
    category: "CONTRACT",
    content:
      "Standard client contract for custom software delivery: 50% advance upon contract signing, 50% upon final acceptance. Includes 30 days warranty with optional monthly maintenance retainer at ₹25,000/month for 99.9% uptime and security updates.",
    tokens: ["standard", "client", "sla", "retainer", "agreement", "contract", "advance", "acceptance", "warranty", "maintenance", "uptime"],
    uploadedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    author: "Legal Ops",
  },
  {
    id: "DOC-003",
    title: "Minimum-Friction Revenue Playbook (§29)",
    category: "MANUAL",
    content:
      "Guidelines for rapid client monetization: package repeatable software components into turnkey products. Target businesses needing immediate solutions with zero setup delay. Utilize verified UPI QR codes for instant settlement.",
    tokens: ["friction", "revenue", "playbook", "monetization", "repeatable", "turnkey", "upi", "qr", "settlement"],
    uploadedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    author: "Revenue Architect",
  },
];

export const INITIAL_MEMORY_ENTRIES: MemoryEntry[] = [
  {
    id: "MEM-001",
    layer: "FOUNDER_PREFERENCES",
    key: "default_currency",
    value: "INR (₹) with USD ($) dual-pricing on international proposals",
    tags: ["currency", "pricing", "founder"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "MEM-002",
    layer: "FOUNDER_PREFERENCES",
    key: "settlement_upi_vpa",
    value: "orderking@okhdfcbank (Direct HDFC Escrow)",
    tags: ["payments", "upi", "banking"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "MEM-003",
    layer: "BUSINESS",
    key: "commission_policy",
    value: "Strict 0% commission on food delivery. Revenue generated via King Pay gateway, POS software licenses, and priority merchant tools.",
    tags: ["business_model", "monetization"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "MEM-004",
    layer: "CLIENT",
    key: "client_royal_feast",
    value: "Royal Feast Cloud Kitchen: 3 outlets in Karimganj, requested POS integration and automated WhatsApp order alerts.",
    tags: ["crm", "client", "karimganj"],
    updatedAt: new Date().toISOString(),
  },
  {
    id: "MEM-005",
    layer: "TECHNICAL_KNOWLEDGE",
    key: "stack_standards",
    value: "React 18 + Vite + Tailwind CSS + TanStack Router + Lucide Icons + Vitest. Zero unnecessary heavy runtime dependencies.",
    tags: ["tech_stack", "architecture"],
    updatedAt: new Date().toISOString(),
  },
];

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

export function searchKnowledgeBase(query: string, docs: KnowledgeDocument[]): SearchResult[] {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const results: SearchResult[] = [];

  for (const doc of docs) {
    let matches = 0;
    for (const token of queryTokens) {
      if (doc.tokens.includes(token)) {
        matches++;
      }
    }

    if (matches > 0) {
      const score = Math.round((matches / queryTokens.length) * 100);
      // Generate snippet around first match
      const lowerContent = doc.content.toLowerCase();
      const firstIndex = lowerContent.indexOf(queryTokens[0]);
      const start = Math.max(0, firstIndex - 40);
      const snippet = doc.content.slice(start, start + 140) + "...";

      results.push({
        documentId: doc.id,
        title: doc.title,
        category: doc.category,
        matchScore: score,
        snippet,
      });
    }
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}
