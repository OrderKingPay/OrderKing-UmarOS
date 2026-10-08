import { GoogleGenAI } from '@google/genai';
import { getSql } from '@/lib/db';

export async function searchMenuItemsBySemantic(query: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.embedContent({
    model: 'text-embedding-004',
    contents: query,
  });

  const embedding = response.embeddings?.[0]?.values;
  if (!embedding || embedding.length === 0) {
      return [];
  }
  
  const embeddingString = `[${embedding.join(',')}]`;

  const sql = await getSql();

  const results = await sql`
    SELECT id, name, description, price, 1 - (embedding <=> ${embeddingString}::vector) as similarity
    FROM menu_items
    ORDER BY embedding <=> ${embeddingString}::vector
    LIMIT 10;
  `;

  return results;
}
