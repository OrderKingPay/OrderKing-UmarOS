// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { requireUserId } from "@/lib/auth/verify.server";
import { ensureWorkspace } from "@/lib/orderking/server/workspace.server";
import { executeFounderTool } from "./founder-tools.server";

export const generateFounderImage = createServerFn({ method: "POST" })
  .inputValidator((data: { prompt: string; size?: string; quality?: string }) => {
    const prompt = typeof data.prompt === "string" ? data.prompt.trim() : "";
    if (!prompt) throw new Error("IMAGE_PROMPT_REQUIRED");
    if (prompt.length > 8000) throw new Error("IMAGE_PROMPT_TOO_LONG");
    return {
      prompt,
      size: data.size || "1536x1024",
      quality: data.quality || "high",
    };
  })
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const workspace = await ensureWorkspace(userId);
    if (!workspace.ctx.permissions.includes("access_AI")) {
      throw new Error("AI_PERMISSION_REQUIRED");
    }

    const result = await executeFounderTool("generate_media", {
      prompt: data.prompt,
      type: "image",
      size: data.size,
      quality: data.quality,
    });

    if (!result || result.status !== "SUCCESS" || typeof result.mediaUrl !== "string") {
      throw new Error(result?.detail || result?.message || "IMAGE_GENERATION_FAILED");
    }

    return {
      ...result,
      sizeBytes: Math.ceil((result.mediaUrl.length * 3) / 4),
      generatedAt: new Date().toISOString(),
    };
  });

