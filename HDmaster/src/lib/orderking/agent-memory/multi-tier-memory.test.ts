import test from "node:test";
import assert from "node:assert";
import { MultiTierMemoryEngine } from "./multi-tier-memory.ts";

test("MultiTierMemoryEngine - Access Policy Enforced", async (t) => {
  const engine = new MultiTierMemoryEngine();

  await assert.rejects(
    async () => await engine.storeMemory({
      tenantId: "",
      domainId: "",
      tier: "working",
      content: "Hello",
    }),
    /Governance Policy Violation/
  );

  await assert.rejects(
    async () => await engine.retrieveMemory({
      tenantId: "",
      domainId: ""
    }),
    /Governance Policy Violation/
  );
});

test("MultiTierMemoryEngine - store and retrieve", async (t) => {
  // Mock getSql
  let insertedData: any = null;
  const mockSql: any = async (strings: any, ...values: any[]) => {
    insertedData = values;
  };
  mockSql.query = async (text: string, params: any[]) => {
    return [{
      id: "mem1",
      tenant_id: params[0],
      domain_id: params[1],
      memory_tier: "semantic",
      content: "Test context",
      metadata: { source: "test" },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }];
  };

  const engine = new MultiTierMemoryEngine(async () => mockSql);

  // Test Store
  const id = await engine.storeMemory({
    tenantId: "t1",
    domainId: "d1",
    tier: "semantic",
    content: "Test context",
    embedding: [0.1, 0.2, 0.3],
    metadata: { source: "test" }
  });

  assert.ok(id);
  assert.equal(insertedData[1], "t1");
  assert.equal(insertedData[2], "d1");
  assert.equal(insertedData[3], "semantic");
  assert.equal(insertedData[5], "[0.1,0.2,0.3]"); // embedding

  // Test Retrieve
  const memories = await engine.retrieveMemory({
    tenantId: "t1",
    domainId: "d1",
    tier: "semantic",
    queryVector: [0.1, 0.2, 0.3],
    limit: 5,
    metadataFilter: { source: "test" }
  });

  assert.equal(memories.length, 1);
  assert.equal(memories[0].id, "mem1");
  assert.equal(memories[0].content, "Test context");
  assert.equal(memories[0].tier, "semantic");
  assert.equal(memories[0].metadata?.source, "test");

  // Test Metadata filter failure
  const filteredEmpty = await engine.retrieveMemory({
    tenantId: "t1",
    domainId: "d1",
    metadataFilter: { source: "other" }
  });
  assert.equal(filteredEmpty.length, 0);
});
