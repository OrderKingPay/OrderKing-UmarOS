import { test, describe } from "node:test";
import * as assert from "node:assert";
import { CallChainContext, IdentityType, type ChainIdentity } from "./index.ts";
import { type AccessContext } from "../rbac.ts";
import { type Permission } from "../permissions.ts";

function createMockContext(roleKey: string, permissions: readonly Permission[]): AccessContext {
  return {
    userId: "user-123",
    employeeId: "emp-123",
    orgId: "org-1",
    roleKey,
    actingRoleKey: roleKey,
    permissions,
    cityId: null,
    areaId: null,
    status: "ACTIVE",
  };
}

describe("CallChainContext", () => {
  test("should allow when all identities have permission", () => {
    const human: ChainIdentity = {
      type: IdentityType.HUMAN,
      context: createMockContext("ADMIN", ["view_orders"]),
    };
    const agent: ChainIdentity = {
      type: IdentityType.AGENT,
      context: createMockContext("AI_AGENT", ["view_orders", "access_AI"]),
    };

    const chain = new CallChainContext().pushIdentity(human).pushIdentity(agent);

    assert.strictEqual(chain.hasPermission("view_orders"), true);
  });

  test("should deny when one identity lacks permission", () => {
    const human: ChainIdentity = {
      type: IdentityType.HUMAN,
      context: createMockContext("ADMIN", ["view_orders"]),
    };
    const agent: ChainIdentity = {
      type: IdentityType.AGENT,
      context: createMockContext("AI_AGENT", ["access_AI"]), // Missing view_orders
    };

    const chain = new CallChainContext().pushIdentity(human).pushIdentity(agent);

    assert.strictEqual(chain.hasPermission("view_orders"), false);
  });

  test("should throw ForbiddenError on requirePermission if missing", () => {
    const human: ChainIdentity = {
      type: IdentityType.HUMAN,
      context: createMockContext("ADMIN", ["view_orders"]),
    };
    const agent: ChainIdentity = {
      type: IdentityType.AGENT,
      context: createMockContext("AI_AGENT", ["access_AI"]),
    };

    const chain = new CallChainContext().pushIdentity(human).pushIdentity(agent);

    assert.throws(() => chain.requirePermission("view_orders"), {
      name: "ForbiddenError",
    });
  });

  test("should track full identity chain correctly", () => {
    const human: ChainIdentity = {
      type: IdentityType.HUMAN,
      context: createMockContext("ADMIN", ["manage_users"]),
    };
    const orchestrator: ChainIdentity = {
      type: IdentityType.ORCHESTRATOR,
      context: createMockContext("SYSTEM", ["manage_users"]),
    };
    const agent: ChainIdentity = {
      type: IdentityType.AGENT,
      context: createMockContext("AI_AGENT", ["manage_users"]),
    };
    const tool: ChainIdentity = {
      type: IdentityType.TOOL,
      context: createMockContext("SYSTEM_TOOL", ["manage_users"]),
    };

    let chain = new CallChainContext();
    chain = chain.pushIdentity(human).pushIdentity(orchestrator).pushIdentity(agent).pushIdentity(tool);

    assert.strictEqual(chain.identities.length, 4);
    assert.strictEqual(chain.identities[0].type, IdentityType.HUMAN);
    assert.strictEqual(chain.identities[3].type, IdentityType.TOOL);
    assert.strictEqual(chain.hasPermission("manage_users"), true);
  });
});
