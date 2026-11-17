import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { can } from "./rbac.ts";

describe("rbac", () => {
  it("staff cannot see settlements or financial settings", () => {
    assert.equal(can("STAFF", "settlements.view"), false);
    assert.equal(can("STAFF", "settings.financial"), false);
    assert.equal(can("STAFF", "orders.accept"), true);
    assert.equal(can("STAFF", "availability.edit"), true);
  });

  it("accountant cannot edit the menu or accept orders", () => {
    assert.equal(can("ACCOUNTANT", "settlements.view"), true);
    assert.equal(can("ACCOUNTANT", "menu.edit"), false);
    assert.equal(can("ACCOUNTANT", "orders.accept"), false);
    assert.equal(can("ACCOUNTANT", "kitchen.view"), false);
  });

  it("manager cannot change bank/commission", () => {
    assert.equal(can("MANAGER", "menu.edit"), true);
    assert.equal(can("MANAGER", "settings.financial"), false);
    assert.equal(can("OWNER", "settings.financial"), true);
  });

  it("cashier can manage dining and billing but cannot access bank settings", () => {
    assert.equal(can("CASHIER", "dining.manage"), true);
    assert.equal(can("CASHIER", "billing.manage"), true);
    assert.equal(can("CASHIER", "kot.print"), true);
    assert.equal(can("CASHIER", "settings.financial"), false);
  });

  it("chef has pure KDS queue access and zero financial access", () => {
    assert.equal(can("CHEF", "kitchen.view"), true);
    assert.equal(can("CHEF", "orders.prepare"), true);
    assert.equal(can("CHEF", "orders.ready"), true);
    assert.equal(can("CHEF", "kot.print"), true);
    assert.equal(can("CHEF", "settlements.view"), false);
    assert.equal(can("CHEF", "settings.financial"), false);
  });
});
