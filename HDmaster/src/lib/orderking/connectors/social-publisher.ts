import * as crypto from "node:crypto";

export type SocialChannel = "instagram_reels" | "youtube_shorts" | "facebook_page" | "x_twitter" | "whatsapp_broadcast";

export type CampaignStatus = "DRAFT" | "SCHEDULED" | "DISPATCHING" | "PUBLISHED" | "FAILED";

export interface SocialPostPayload {
  id: string;
  channel: SocialChannel;
  title: string;
  caption: string;
  hashtags: string[];
  mediaUrl: string;
  mediaType: "video" | "image";
  aspectRatio: "9:16" | "16:9" | "1:1";
  targetCatchment?: string;
  scheduledTime?: string;
  status: CampaignStatus;
  retryCount: number;
  maxRetries: number;
  signature?: string;
  dispatchedAt?: string;
  publishedUrl?: string;
  analytics?: {
    estimatedReach: number;
    impressions: number;
    clicks: number;
    conversions: number;
    estimatedRoas: number;
  };
}

export interface ChannelConstraints {
  maxCaptionLength: number;
  allowedAspectRatios: ("9:16" | "16:9" | "1:1")[];
  maxHourlyRate: number;
  requiresVideo: boolean;
  maxHashtags?: number;
}

export const CHANNEL_CONSTRAINTS: Record<SocialChannel, ChannelConstraints> = {
  instagram_reels: {
    maxCaptionLength: 2200,
    allowedAspectRatios: ["9:16"],
    maxHourlyRate: 5,
    requiresVideo: true,
    maxHashtags: 30,
  },
  youtube_shorts: {
    maxCaptionLength: 100, // Short title length
    allowedAspectRatios: ["9:16"],
    maxHourlyRate: 8,
    requiresVideo: true,
    maxHashtags: 5,
  },
  facebook_page: {
    maxCaptionLength: 5000,
    allowedAspectRatios: ["9:16", "16:9", "1:1"],
    maxHourlyRate: 10,
    requiresVideo: false,
    maxHashtags: 30,
  },
  x_twitter: {
    maxCaptionLength: 280,
    allowedAspectRatios: ["16:9", "1:1"],
    maxHourlyRate: 20,
    requiresVideo: false,
    maxHashtags: 5,
  },
  whatsapp_broadcast: {
    maxCaptionLength: 1024,
    allowedAspectRatios: ["1:1", "16:9"],
    maxHourlyRate: 15,
    requiresVideo: false,
    maxHashtags: 3,
  },
};

/**
 * Validates post payload against channel constraints
 */
export function validateSocialPost(post: SocialPostPayload): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const constraints = CHANNEL_CONSTRAINTS[post.channel];

  if (!constraints) {
    errors.push(`Unsupported channel: ${post.channel}`);
    return { valid: false, errors };
  }

  if (constraints.requiresVideo && post.mediaType !== "video") {
    errors.push(`${post.channel} requires video media.`);
  }

  if (!constraints.allowedAspectRatios.includes(post.aspectRatio)) {
    errors.push(`Aspect ratio ${post.aspectRatio} not supported on ${post.channel}. Allowed: ${constraints.allowedAspectRatios.join(", ")}`);
  }

  if (post.caption.length > constraints.maxCaptionLength) {
    errors.push(`Caption exceeds maximum length of ${constraints.maxCaptionLength} characters (got ${post.caption.length}).`);
  }

  if (!post.mediaUrl.trim()) {
    errors.push("Media URL cannot be empty.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Computes timing-safe SHA-256 HMAC signature for social payload
 */
export function signSocialPayload(payload: Omit<SocialPostPayload, "signature">, secretKey: string): string {
  const serialized = JSON.stringify({
    id: payload.id,
    channel: payload.channel,
    caption: payload.caption,
    mediaUrl: payload.mediaUrl,
    scheduledTime: payload.scheduledTime || "",
  });

  return crypto.createHmac("sha256", secretKey).update(serialized).digest("hex");
}

/**
 * Verifies payload signature using constant-time comparison
 */
export function verifySocialPayloadSignature(
  post: SocialPostPayload,
  secretKey: string
): boolean {
  if (!post.signature) return false;

  const expectedSig = signSocialPayload(post, secretKey);
  const sigBuf = Buffer.from(post.signature, "utf-8");
  const expectedBuf = Buffer.from(expectedSig, "utf-8");

  if (sigBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}

/**
 * In-memory token bucket rate limiter per channel
 */
export class SocialRateLimiter {
  private channelBuckets: Map<SocialChannel, { tokens: number; lastRefillMs: number }> = new Map();

  constructor() {
    for (const channel of Object.keys(CHANNEL_CONSTRAINTS) as SocialChannel[]) {
      this.channelBuckets.set(channel, {
        tokens: CHANNEL_CONSTRAINTS[channel].maxHourlyRate,
        lastRefillMs: Date.now(),
      });
    }
  }

  public checkAndConsume(channel: SocialChannel): boolean {
    const bucket = this.channelBuckets.get(channel);
    if (!bucket) return false;

    const now = Date.now();
    const elapsedHours = (now - bucket.lastRefillMs) / (1000 * 60 * 60);
    const maxCapacity = CHANNEL_CONSTRAINTS[channel].maxHourlyRate;

    // Refill tokens
    bucket.tokens = Math.min(maxCapacity, bucket.tokens + elapsedHours * maxCapacity);
    bucket.lastRefillMs = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  public getAvailableTokens(channel: SocialChannel): number {
    const bucket = this.channelBuckets.get(channel);
    return bucket ? Math.floor(bucket.tokens) : 0;
  }
}

/**
 * Simulates campaign dispatch with realistic metrics estimation
 */
export function dispatchSocialCampaign(
  post: SocialPostPayload,
  secretKey: string,
  rateLimiter: SocialRateLimiter
): {
  success: boolean;
  post: SocialPostPayload;
  message: string;
} {
  const validation = validateSocialPost(post);
  if (!validation.valid) {
    return {
      success: false,
      post: { ...post, status: "FAILED" },
      message: `Validation failed: ${validation.errors.join("; ")}`,
    };
  }

  if (!rateLimiter.checkAndConsume(post.channel)) {
    return {
      success: false,
      post: { ...post, status: "FAILED" },
      message: `Rate limit exceeded for channel ${post.channel}. Please retry in a few minutes.`,
    };
  }

  // Sign payload
  const signature = signSocialPayload(post, secretKey);

  // Compute real dispatch payload - initialize real analytics to 0 until webhook reports actual performance
  const publishedPost: SocialPostPayload = {
    ...post,
    status: "SCHEDULED",
    signature,
    dispatchedAt: new Date().toISOString(),
    publishedUrl: undefined,
    analytics: {
      estimatedReach: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      estimatedRoas: 0,
    },
  };

  return {
    success: true,
    post: publishedPost,
    message: `Successfully dispatched to ${post.channel} (ID: ${post.id})`,
  };
}
