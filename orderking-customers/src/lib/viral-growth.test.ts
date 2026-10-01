import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildShareIntent, createReferralLink, generateDedupeKey } from "./engine/viral-loop.ts";

describe("verified viral referral engine", () => {
  it("builds a referral link with attribution parameters", () => {
    const link = createReferralLink("OK-ABC12345", "order-complete");
    assert.match(link, //r/OK-ABC12345/);
    assert.match(link, /utm_source=orderking/);
    assert.match(link, /utm_medium=referral/);
    assert.match(link, /utm_campaign=order-complete/);
  });

  it("creates platform share intents without requiring popup permissions", () => {
    const share = buildShareIntent("OK-ABC12345", "order-complete");
    assert.equal(share.link.includes("OK-ABC12345"), true);
    assert.match(share.text, /OrderKing/);
    assert.match(share.whatsapp, /^https://wa\.me\/\?text=/);
    assert.match(share.telegram, /^https://t\.me\/share\/url/);
  });

  it("creates deterministic attribution dedupe keys", async () => {
    const a = await generateDedupeKey(["campaign-1", "referrer-1", "order-1"]);
    const b = await generateDedupeKey(["campaign-1", "referrer-1", "order-1"]);
    const c = await generateDedupeKey(["campaign-1", "referrer-1", "order-2"]);
    assert.equal(a, b);
    assert.notEqual(a, c);
  });
});
