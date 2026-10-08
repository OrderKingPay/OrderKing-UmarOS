/**
 * UMAR OS — Video Generation Engine
 * Model: veo-3.1-generate-preview (Google's current video generation model)
 * Replaces the removed Luma Dream Machine API integration.
 *
 * Uses the official @google/genai SDK's generateVideos method.
 * Supports text-to-video and image-to-video generation.
 */
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface VideoGenerationResult {
  operationName: string;
  videos: Array<{
    downloadPath: string;
  }>;
}

/**
 * Generate a video from a text prompt using Veo 3.1.
 * This is a long-running operation — the function polls until completion.
 *
 * @param prompt - Descriptive prompt for video generation
 * @param outputDir - Directory to save downloaded video files
 * @param numberOfVideos - Number of videos to generate (default 1)
 */
export async function generateVideoFromPrompt(
  prompt: string,
  outputDir: string = '.',
  numberOfVideos: number = 1,
): Promise<VideoGenerationResult> {
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-generate-preview',
    source: {
      prompt,
    },
    config: {
      numberOfVideos,
    },
  });

  // Poll until generation completes
  const maxWaitMs = 10 * 60 * 1000; // 10 minute timeout
  const pollIntervalMs = 10_000;
  let elapsed = 0;

  while (!operation.done) {
    if (elapsed >= maxWaitMs) {
      throw new Error(`Video generation timed out after ${maxWaitMs / 1000}s`);
    }
    await delay(pollIntervalMs);
    elapsed += pollIntervalMs;
    operation = await ai.operations.get({ operation });
  }

  const videos = operation.response?.generatedVideos;
  if (!videos || videos.length === 0) {
    throw new Error('Video generation completed but no videos were returned');
  }

  const results: VideoGenerationResult['videos'] = [];

  for (let i = 0; i < videos.length; i++) {
    const downloadPath = `${outputDir}/umar-os-video-${Date.now()}-${i}.mp4`;
    await ai.files.download({
      file: videos[i] as any,
      downloadPath,
    });
    results.push({ downloadPath });
  }

  return {
    operationName: (operation as any).name ?? 'completed',
    videos: results,
  };
}

/**
 * Generate a video from a base64 image (image-to-video).
 * The image becomes the first frame; the prompt describes the motion.
 */
export async function generateVideoFromImage(
  base64Image: string,
  prompt: string,
  outputDir: string = '.',
): Promise<VideoGenerationResult> {
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-generate-preview',
    source: {
      prompt,
      image: {
        imageBytes: base64Image,
        mimeType: 'image/jpeg',
      },
    } as any,
    config: {
      numberOfVideos: 1,
    },
  });

  const maxWaitMs = 10 * 60 * 1000;
  const pollIntervalMs = 10_000;
  let elapsed = 0;

  while (!operation.done) {
    if (elapsed >= maxWaitMs) {
      throw new Error(`Video generation timed out after ${maxWaitMs / 1000}s`);
    }
    await delay(pollIntervalMs);
    elapsed += pollIntervalMs;
    operation = await ai.operations.get({ operation });
  }

  const videos = operation.response?.generatedVideos;
  if (!videos || videos.length === 0) {
    throw new Error('Image-to-video generation completed but no videos returned');
  }

  const results: VideoGenerationResult['videos'] = [];
  for (let i = 0; i < videos.length; i++) {
    const downloadPath = `${outputDir}/umar-os-i2v-${Date.now()}-${i}.mp4`;
    await ai.files.download({
      file: videos[i] as any,
      downloadPath,
    });
    results.push({ downloadPath });
  }

  return {
    operationName: (operation as any).name ?? 'completed',
    videos: results,
  };
}
