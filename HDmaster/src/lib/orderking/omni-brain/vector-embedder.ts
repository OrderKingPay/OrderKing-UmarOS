/**
 * UMAR OS — Vector Embedding Engine
 * Model: gemini-embedding-2 (current, multimodal-capable)
 * Replaces deprecated text-embedding-004 (shutdown Jan 2026)
 */
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

/**
 * Generate embeddings for a batch of text strings using the current
 * gemini-embedding-2 model. Returns Float32Array per input.
 */
export async function generateEmbeddings(texts: string[]): Promise<Float32Array[]> {
  const arrays: Float32Array[] = [];
  for (const text of texts) {
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-2',
      contents: text,
    });

    if (response.embeddings && response.embeddings.length > 0) {
      const values = response.embeddings[0].values;
      if (!values) throw new Error('Embedding returned no values');
      arrays.push(new Float32Array(values));
    } else {
      throw new Error(`Failed to embed text: "${text.slice(0, 50)}..."`);
    }
  }
  return arrays;
}

/**
 * Generate a single embedding vector.
 */
export async function generateEmbedding(text: string): Promise<Float32Array> {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2',
    contents: text,
  });

  if (response.embeddings && response.embeddings.length > 0) {
    const values = response.embeddings[0].values;
    if (!values) throw new Error('Embedding returned no values');
    return new Float32Array(values);
  }
  throw new Error('Failed to generate embedding');
}
