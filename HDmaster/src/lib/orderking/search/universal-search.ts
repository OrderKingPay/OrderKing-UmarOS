export interface SearchOptions {
  domain?: string;
}

export interface SearchResult {
  docId: string;
  score: number;
}

class DomainIndex {
  docCount: number = 0;
  docLengths: Map<string, number> = new Map();
  // term -> (docId -> count)
  invertedIndex: Map<string, Map<string, number>> = new Map();

  tokenize(text: string): string[] {
    return text.toLowerCase().split(/[\W_]+/).filter(w => w.length > 0);
  }

  index(docId: string, content: string) {
    if (this.docLengths.has(docId)) {
      this.remove(docId);
    }
    const tokens = this.tokenize(content);
    this.docCount++;
    this.docLengths.set(docId, tokens.length);

    for (const token of tokens) {
      if (!this.invertedIndex.has(token)) {
        this.invertedIndex.set(token, new Map());
      }
      const postingList = this.invertedIndex.get(token)!;
      postingList.set(docId, (postingList.get(docId) || 0) + 1);
    }
  }

  remove(docId: string) {
    if (!this.docLengths.has(docId)) return;

    this.docCount--;
    this.docLengths.delete(docId);

    for (const [term, postingList] of this.invertedIndex.entries()) {
      if (postingList.has(docId)) {
        postingList.delete(docId);
        if (postingList.size === 0) {
          this.invertedIndex.delete(term);
        }
      }
    }
  }

  search(query: string): SearchResult[] {
    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0 || this.docCount === 0) return [];

    const scores: Map<string, number> = new Map();

    for (const token of queryTokens) {
      const postingList = this.invertedIndex.get(token);
      if (!postingList) continue;

      // IDF with smoothing
      const idf = Math.log(1 + (this.docCount / postingList.size));

      for (const [docId, count] of postingList.entries()) {
        const docLength = this.docLengths.get(docId)!;
        const tf = count / docLength;
        const tfIdf = tf * idf;
        
        scores.set(docId, (scores.get(docId) || 0) + tfIdf);
      }
    }

    const results = Array.from(scores.entries()).map(([docId, score]) => ({ docId, score }));
    results.sort((a, b) => b.score - a.score);
    return results;
  }
}

export class UniversalSearch {
  private domains: Map<string, DomainIndex> = new Map();

  index(domain: string, docId: string, content: string): void {
    if (!this.domains.has(domain)) {
      this.domains.set(domain, new DomainIndex());
    }
    this.domains.get(domain)!.index(docId, content);
  }

  search(query: string, opts?: SearchOptions): SearchResult[] {
    if (opts?.domain) {
      const domainIndex = this.domains.get(opts.domain);
      if (!domainIndex) return [];
      return domainIndex.search(query);
    } else {
      const scores: Map<string, number> = new Map();
      for (const domainIndex of this.domains.values()) {
        const results = domainIndex.search(query);
        for (const res of results) {
           scores.set(res.docId, (scores.get(res.docId) || 0) + res.score);
        }
      }
      const finalResults = Array.from(scores.entries()).map(([docId, score]) => ({ docId, score }));
      finalResults.sort((a, b) => b.score - a.score);
      return finalResults;
    }
  }

  remove(domain: string, docId: string): void {
    const domainIndex = this.domains.get(domain);
    if (domainIndex) {
      domainIndex.remove(docId);
    }
  }
}
