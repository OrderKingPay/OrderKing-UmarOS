/**
 * UMAR OS — Semantic Vector Search (Real pgvector via getSql)
 * Uses parameterized queries — NOT string interpolation.
 */
import { generateEmbedding } from './vector-embedder';
import { getSql } from '../../db';

export interface SearchResult {
  id: string;
  content: string;
  similarity: number;
}

/**
 * Search for semantically similar documents using pgvector.
 * Uses parameterized query via getSql tagged template — NOT string interpolation.
 */
export async function searchVectors(
  query: string,
  limit: number = 5,
): Promise<SearchResult[]> {
  const embedding = await generateEmbedding(query);
  const vectorStr = `[${Array.from(embedding).join(',')}]`;

  const sql = await getSql();

  const rows = await sql`
    SELECT
      id,
      content,
      1 - (embedding <=> ${vectorStr}::vector) AS similarity
    FROM documents
    ORDER BY embedding <=> ${vectorStr}::vector
    LIMIT ${limit}
  `;

  return rows.map((row: any) => ({
    id: row.id,
    content: row.content,
    similarity: Number(row.similarity),
  }));
}
