import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldUseLowBandwidthMode } from "./engine/starlink-net.ts";

describe("low-network transport", () => {
  it("does not assume low bandwidth on the server", () => {
    assert.equal(shouldUseLowBandwidthMode(), false);
  });
});
