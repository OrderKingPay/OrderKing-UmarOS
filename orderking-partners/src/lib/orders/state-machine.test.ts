import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertTransition,
  canTransition,
  isTerminal,
  MARKETPLACE_TRACK,
  RESTAURANT_NEXT,
  SIMULATED_RIDER_NEXT,
  trackIndex,
} from "./state-machine.ts";

describe("partner order state machine", () => {
  it("restaurant happy path", () => {
    assert.equal(canTransition("PLACED", "ACCEPTED", "restaurant"), true);
    assert.equal(canTransition("ACCEPTED", "PREPARING", "restaurant"), true);
    assert.equal(canTransition("PREPARING", "READY", "restaurant"), true);
    assert.equal(RESTAURANT_NEXT.PLACED, "ACCEPTED");
  });

  it("blocks customer from accepting", () => {
    assert.equal(canTransition("PLACED", "ACCEPTED", "customer"), false);
  });

  it("simulated rider completes after READY", () => {
    let state: string = "READY";
    while (state !== "DELIVERED") {
      const next = SIMULATED_RIDER_NEXT[state as keyof typeof SIMULATED_RIDER_NEXT];
      assert.ok(next, `missing sim step from ${state}`);
      assertTransition(state as "READY", next, "simulated_rider");
      state = next as typeof state;
    }
  });

  it("track + terminal helpers", () => {
    assert.equal(trackIndex("PLACED"), 0);
    assert.equal(trackIndex("DELIVERED"), MARKETPLACE_TRACK.length - 1);
    assert.equal(isTerminal("DELIVERED"), true);
    assert.equal(isTerminal("READY"), false);
  });

  it("supports autonomous zero-human dispatch pipeline (AUTO_ACCEPTED -> PREPARING -> READY -> RIDER_ASSIGNED -> ON_THE_WAY -> DELIVERED)", () => {
    // 1. System transitions PLACED -> AUTO_ACCEPTED
    assert.equal(canTransition("PLACED", "AUTO_ACCEPTED", "system"), true);

    // 2. Kitchen / System transitions AUTO_ACCEPTED -> PREPARING
    assert.equal(canTransition("AUTO_ACCEPTED", "PREPARING", "system"), true);
    assert.equal(canTransition("AUTO_ACCEPTED", "PREPARING", "restaurant"), true);

    // 3. Kitchen marks food cooked PREPARING -> READY
    assert.equal(canTransition("PREPARING", "READY", "restaurant"), true);

    // 4. Autonomous dispatch matches rider READY -> RIDER_ASSIGNED
    assert.equal(canTransition("READY", "RIDER_ASSIGNED", "system"), true);

    // 5. Courier arrives and picks up RIDER_ASSIGNED -> PICKED_UP
    assert.equal(canTransition("RIDER_ASSIGNED", "PICKED_UP", "rider"), true);

    // 6. Courier starts transit PICKED_UP -> ON_THE_WAY
    assert.equal(canTransition("PICKED_UP", "ON_THE_WAY", "rider"), true);

    // 7. OTP verified on delivery ON_THE_WAY -> DELIVERED
    assert.equal(canTransition("ON_THE_WAY", "DELIVERED", "rider"), true);

    // 8. Track index parity
    assert.equal(trackIndex("AUTO_ACCEPTED"), 1);
    assert.equal(RESTAURANT_NEXT.AUTO_ACCEPTED, "PREPARING");
  });
});
