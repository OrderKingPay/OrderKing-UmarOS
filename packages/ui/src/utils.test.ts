import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatInr, formatInrExact, formatPct, initials, cn, relativeTime, clockTime, shortDate } from "./utils.ts";

describe("@orderking/ui utils & helpers", () => {
  it("formats INR currency correctly", () => {
    assert.strictEqual(formatInr(10000).replace(/\u00a0/g, " "), "₹100");
    assert.strictEqual(formatInrExact(10050).replace(/\u00a0/g, " "), "₹100.50");
    assert.strictEqual(formatInrExact(10000).replace(/\u00a0/g, " "), "₹100");
  });

  it("formats percentage correctly", () => {
    assert.strictEqual(formatPct(0.18), "18%");
    assert.strictEqual(formatPct(1800, true), "18%");
  });

  it("computes initials correctly", () => {
    assert.strictEqual(initials("Umar Khan"), "UK");
    assert.strictEqual(initials("OrderKing"), "O");
    assert.strictEqual(initials("Test Partner Name"), "TP");
  });

  it("merges classes correctly", () => {
    assert.strictEqual(cn("px-2 py-1", "px-4"), "py-1 px-4");
    assert.strictEqual(cn("text-red-500", false && "hidden", "text-blue-500"), "text-blue-500");
  });

  it("handles relative and clock time", () => {
    const now = Date.now();
    assert.strictEqual(relativeTime(new Date(now - 10000).toISOString(), now), "10 seconds ago");
    assert.strictEqual(relativeTime(null), "—");
    assert.strictEqual(clockTime(null), "—");
    assert.strictEqual(shortDate(null), "—");
  });
});
