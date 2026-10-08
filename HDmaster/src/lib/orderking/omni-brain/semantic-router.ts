import { generateEmbedding } from './vector-embedder';

export async function searchVectors(query: string, limit: number = 5): Promise<string> {
  const embedding = await generateEmbedding(query);
  const vectorStr = `[${Array.from(embedding).join(',')}]`;
  
  const getSql = () => {
    return `SELECT id, content, 1 - (embedding <=> '${vectorStr}') AS similarity
            FROM documents
            ORDER BY embedding <=> '${vectorStr}'
            LIMIT ${limit};`;
  };
  
  return getSql();
}
