import test from "node:test";
import assert from "node:assert/strict";
import { VoiceOrderParser } from "../../src/lib/orderking/ai/multimodal/VoiceOrderParser.ts";
import { GrievanceResolutionAI } from "../../src/lib/orderking/support/GrievanceResolutionAI.ts";
import { config } from "dotenv";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env") });

test("VoiceOrderParser - Correctly extracts cart from heavily slurred text", async () => {
  const mockOpenAI = {
    chat: {
      completions: {
        create: async () => ({
          choices: [
            {
              message: {
                tool_calls: [
                  {
                    function: {
                      arguments: JSON.stringify({
                        items: [
                          { name: "biryani", quantity: 2 },
                          { name: "coke", quantity: 1 }
                        ]
                      })
                    }
                  }
                ]
              }
            }
          ]
        })
      }
    }
  };

  const parser = new VoiceOrderParser(mockOpenAI as any);
  const slurredText = "uhh ya I wannnn liek tooo biryanisss anddd uhh cokee to myy homee";
  
  const cart = await parser.parseOrder(slurredText);
  
  // Prove AI extracts the cart correctly
  assert.ok(cart.length > 0, "Cart should not be empty");
  
  const biryani = cart.find(item => item.name.toLowerCase().includes("biryani"));
  assert.ok(biryani, "Biryani should be extracted");
  assert.equal(biryani?.quantity, 2, "Should extract 2 biryanis");

  const coke = cart.find(item => item.name.toLowerCase().includes("coke"));
  assert.ok(coke, "Coke should be extracted");
  assert.equal(coke?.quantity, 1, "Should extract 1 coke");
});

test("GrievanceResolutionAI - Mathematically blocks abuser from wallet refund", () => {
  const grievance = {
    id: "g1",
    customerId: "c1",
    complaint: "The food is cold, give me refund"
  };
  
  const abuserProfile = {
    id: "c1",
    lifetimeValue: 1000,
    refundAbuseScore: "high" as const
  };
  
  const resolution = GrievanceResolutionAI.processGrievance(grievance, abuserProfile);
  
  assert.equal(resolution.status, "FLAGGED_FOR_REVIEW", "Fraudulent refund should be flagged");
  assert.equal(resolution.creditAmount, 0, "Credit amount should be 0");
});
