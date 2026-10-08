export interface VectorSearchResult {
  id: string;
  score: number;
}

export class VectorSearch {
  private vectors: Map<string, number[]> = new Map();

  addVector(id: string, vector: number[]): void {
    this.vectors.set(id, vector);
  }

  removeVector(id: string): void {
    this.vectors.delete(id);
  }

  search(queryVector: number[], topK: number = 10): VectorSearchResult[] {
    const results: VectorSearchResult[] = [];

    const queryNorm = this.magnitude(queryVector);
    if (queryNorm === 0) return []; // Cannot compute cosine similarity with zero vector

    for (const [id, vector] of this.vectors.entries()) {
      if (vector.length !== queryVector.length) continue; // Skip vectors of different dimensions
      const norm = this.magnitude(vector);
      if (norm === 0) continue;

      const dot = this.dotProduct(queryVector, vector);
      const similarity = dot / (queryNorm * norm);

      results.push({ id, score: similarity });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  private dotProduct(v1: number[], v2: number[]): number {
    let sum = 0;
    for (let i = 0; i < v1.length; i++) {
      sum += v1[i] * v2[i];
    }
    return sum;
  }

  private magnitude(v: number[]): number {
    let sum = 0;
    for (let i = 0; i < v.length; i++) {
      sum += v[i] * v[i];
    }
    return Math.sqrt(sum);
  }
}
