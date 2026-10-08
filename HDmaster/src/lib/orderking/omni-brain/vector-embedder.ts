import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

export async function generateEmbeddings(texts: string[]): Promise<Float32Array[]> {
  const arrays: Float32Array[] = [];
  for (const text of texts) {
    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });
    
    if (response.embeddings && response.embeddings.length > 0) {
      arrays.push(new Float32Array(response.embeddings[0].values || []));
    }
  }
  return arrays;
}

export async function generateEmbedding(text: string): Promise<Float32Array> {
  const response = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: text,
  });
  
  if (response.embeddings && response.embeddings.length > 0) {
    return new Float32Array(response.embeddings[0].values || []);
  }
  throw new Error('Failed to generate embedding');
}
