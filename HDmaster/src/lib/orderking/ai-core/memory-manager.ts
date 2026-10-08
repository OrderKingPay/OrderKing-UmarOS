import { GoogleGenAI } from '@google/genai';
import { Pool } from 'pg';

const ai = new GoogleGenAI();
const pool = new Pool();

export async function storeMemory(userId: string, text: string) {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2',
    contents: text,
  });

  if (!response.embeddings || response.embeddings.length === 0) {
    throw new Error('Failed to generate embedding');
  }

  const embedding = response.embeddings[0].values;

  await pool.query(
    'INSERT INTO documents (user_id, content, embedding) VALUES ($1, $2, $3)',
    [userId, text, JSON.stringify(embedding)]
  );
}

export async function retrieveContext(userId: string, query: string, limit: number = 5) {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2',
    contents: query,
  });

  if (!response.embeddings || response.embeddings.length === 0) {
    throw new Error('Failed to generate embedding');
  }

  const queryEmbedding = response.embeddings[0].values;

  const result = await pool.query(
    `SELECT content
     FROM documents
     WHERE user_id = $1
     ORDER BY embedding <=> $2
     LIMIT $3`,
    [userId, JSON.stringify(queryEmbedding), limit]
  );

  return result.rows.map(row => row.content);
}
