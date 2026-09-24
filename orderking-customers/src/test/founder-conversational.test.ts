// @ts-nocheck
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseFounderQuery } from "../lib/ai/supreme-founder-ai-core.ts";

describe("Supreme Conversational Engine — Real Listening & Non-Repetitive Dialogue", () => {
  it("should answer 'Hello' conversationally without canned repetitive sales templates", async () => {
    const res = await parseFounderQuery("Hello");
    assert.strictEqual(res.intent, "general_executive");
    assert.ok(res.responseMarkdown.includes("Greetings, Founder"));
    assert.ok(res.voiceSpokenText.includes("Hello, Founder! I am online and listening"));
    assert.ok(!res.voiceSpokenText.includes("Supreme AI Executive Assistant, operating at maximum capacity"));
  });

  it("should answer 'How are you?' naturally and ask about the founder's day", async () => {
    const res = await parseFounderQuery("How are you doing today?");
    assert.strictEqual(res.intent, "general_executive");
    assert.ok(res.responseMarkdown.includes("Operating at Peak Performance"));
    assert.ok(res.voiceSpokenText.includes("I'm doing great, Founder"));
    assert.ok(!res.voiceSpokenText.includes("Supreme AI Executive Assistant, operating at maximum capacity"));
  });

  it("should answer 'What is EBITDA?' with exact formula and valuation context", async () => {
    const res = await parseFounderQuery("What is EBITDA and how do we calculate it?");
    assert.strictEqual(res.intent, "general_executive");
    assert.ok(res.responseMarkdown.includes("Earnings Before Interest, Taxes, Depreciation, and Amortization"));
    assert.ok(res.responseMarkdown.includes("EBITDA"));
    assert.ok(res.voiceSpokenText.includes("Earnings Before Interest, Taxes"));
    assert.ok(!res.voiceSpokenText.includes("Supreme AI Executive Assistant, operating at maximum capacity"));
  });

  it("should answer 'Why is delivery restricted to Karimganj?' with strategic clarity", async () => {
    const res = await parseFounderQuery("Why is food delivery restricted to Karimganj?");
    assert.ok(res.intent === "geofence_status" || res.intent === "general_executive");
    assert.ok(res.responseMarkdown.includes("15-Minute") || res.responseMarkdown.includes("Karimganj"));
    assert.ok(res.voiceSpokenText.includes("fifteen-minute") || res.voiceSpokenText.includes("Karimganj"));
    assert.ok(!res.voiceSpokenText.includes("Supreme AI Executive Assistant, operating at maximum capacity"));
  });

  it("should answer coding requests with working TypeScript code and no generic sales pitches", async () => {
    const res = await parseFounderQuery("Can you write a TypeScript LRU cache class?");
    assert.strictEqual(res.intent, "general_executive");
    assert.ok(res.responseMarkdown.includes("class SovereignCache"));
    assert.ok(res.responseMarkdown.includes("Time Complexity"));
    assert.ok(res.voiceSpokenText.includes("production-grade"));
  });

  it("should preserve specific platform action triggers like invoices and client leads", async () => {
    const invoiceRes = await parseFounderQuery("/invoice for client 50000");
    assert.strictEqual(invoiceRes.intent, "invoice_pay");
    assert.ok(invoiceRes.actionCard);

    const clientRes = await parseFounderQuery("find client lead for restaurant");
    assert.strictEqual(clientRes.intent, "client_sales");
    assert.ok(clientRes.actionCard);
  });
});
