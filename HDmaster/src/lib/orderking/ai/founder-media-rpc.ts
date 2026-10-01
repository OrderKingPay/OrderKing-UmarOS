import { createServerFn } from "@tanstack/react-start";

export const generateFounderImageRpc = createServerFn({ method: "POST" })
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
    const { generateFounderImage } = await import("./founder-media.server");
    return await generateFounderImage({ data });
  });
