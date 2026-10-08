/**
 * UMAR OS — Image Generation Adapter
 * Model: gemini-3.1-flash-image (Gemini native image generation)
 * Replaces deprecated imagen-3.0-generate-002 (shut down in Gemini API)
 *
 * Uses the official Interactions API for native Gemini image generation.
 * Falls back to imagen-4.0-generate-001 via generateImages when Vertex AI
 * is configured (set GOOGLE_GENAI_USE_VERTEXAI=true).
 */
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

/**
 * Generate an image from a text prompt using Gemini 3.1 Flash Image
 * (native Gemini image generation via Interactions API).
 * Returns base64-encoded image data.
 */
export async function generateImageFromPrompt(prompt: string): Promise<string> {
  // Use Gemini native image generation (Interactions API)
  const interaction = await ai.interactions.create({
    model: 'gemini-3.1-flash-image',
    input: prompt,
  });

  const outputImage = (interaction as any).outputImage ?? (interaction as any).output_image;
  if (!outputImage?.data) {
    throw new Error('Image generation failed: no image data returned from gemini-3.1-flash-image');
  }

  return outputImage.data;
}

/**
 * Generate an image using Imagen 4 via Vertex AI.
 * Requires GOOGLE_GENAI_USE_VERTEXAI=true, GOOGLE_CLOUD_PROJECT,
 * and GOOGLE_CLOUD_LOCATION environment variables.
 */
export async function generateImageFromPromptVertexAI(prompt: string): Promise<string> {
  const vertexAI = new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GOOGLE_CLOUD_LOCATION,
  });

  const response = await vertexAI.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt,
    config: {
      numberOfImages: 1,
    },
  });

  const base64Image = response?.generatedImages?.[0]?.image?.imageBytes;
  if (!base64Image) {
    throw new Error('Image generation failed: no image data returned from imagen-4.0');
  }

  return base64Image;
}
