import { describe, it, expect, beforeEach } from "vitest";
import {
  type SocialPostPayload,
  validateSocialPost,
  signSocialPayload,
  verifySocialPayloadSignature,
  SocialRateLimiter,
  dispatchSocialCampaign,
} from "./social-publisher";

describe("UMAR OS Social Publishing & Multi-Channel Campaign Connector", () => {
  const secretKey = "test_sovereign_secret_key_123456";
  let rateLimiter: SocialRateLimiter;

  beforeEach(() => {
    rateLimiter = new SocialRateLimiter();
  });

  const validReel: SocialPostPayload = {
    id: "camp_001",
    channel: "instagram_reels",
    title: "OrderKing Midnight Cravings",
    caption: "Craving late night biryani? OrderKing delivers in 18 minutes. #OrderKing #Biryani",
    hashtags: ["#OrderKing", "#Biryani"],
    mediaUrl: "https://cdn.orderking.in/campaigns/biryani_reel.mp4",
    mediaType: "video",
    aspectRatio: "9:16",
    status: "DRAFT",
    retryCount: 0,
    maxRetries: 3,
  };

  it("validates channel-specific constraints correctly", () => {
    const valid = validateSocialPost(validReel);
    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);

    // Invalid: Instagram Reel must be video
    const invalidImageReel: SocialPostPayload = {
      ...validReel,
      mediaType: "image",
    };
    const check1 = validateSocialPost(invalidImageReel);
    expect(check1.valid).toBe(false);
    expect(check1.errors[0]).toContain("requires video media");

    // Invalid: wrong aspect ratio for Reel
    const invalidRatioReel: SocialPostPayload = {
      ...validReel,
      aspectRatio: "16:9",
    };
    const check2 = validateSocialPost(invalidRatioReel);
    expect(check2.valid).toBe(false);
    expect(check2.errors[0]).toContain("Aspect ratio 16:9 not supported");
  });

  it("generates and verifies SHA-256 HMAC payload signatures", () => {
    const signature = signSocialPayload(validReel, secretKey);
    expect(signature).toBeDefined();
    expect(signature.length).toBe(64); // SHA-256 hex string

    const signedPost: SocialPostPayload = { ...validReel, signature };
    expect(verifySocialPayloadSignature(signedPost, secretKey)).toBe(true);

    // Tampered payload fails verification
    const tamperedPost: SocialPostPayload = {
      ...signedPost,
      caption: "Tampered caption content",
    };
    expect(verifySocialPayloadSignature(tamperedPost, secretKey)).toBe(false);
  });

  it("enforces channel rate limiting", () => {
    // Consume all tokens for instagram_reels (max 5)
    for (let i = 0; i < 5; i++) {
      expect(rateLimiter.checkAndConsume("instagram_reels")).toBe(true);
    }

    // 6th consumption must fail
    expect(rateLimiter.checkAndConsume("instagram_reels")).toBe(false);
  });

  it("successfully schedules campaign with zero synthetic metrics until live reporting", () => {
    const result = dispatchSocialCampaign(validReel, secretKey, rateLimiter);
    expect(result.success).toBe(true);
    expect(result.post.status).toBe("SCHEDULED");
    expect(result.post.signature).toBeDefined();
    expect(result.post.analytics).toBeDefined();
    expect(result.post.analytics?.estimatedReach).toBe(0);
    expect(result.post.analytics?.estimatedRoas).toBe(0);
  });
});
