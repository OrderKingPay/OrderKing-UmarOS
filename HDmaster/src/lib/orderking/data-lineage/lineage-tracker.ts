export interface TransformationMeta {
  [key: string]: any;
}

export interface LineageEdge {
  sourceId: string;
  targetId: string;
  type: string;
  meta?: TransformationMeta;
}

export class LineageTracker {
  private forwardEdges: Map<string, LineageEdge[]> = new Map();
  private backwardEdges: Map<string, LineageEdge[]> = new Map();

  recordTransformation(sourceId: string, targetId: string, type: string, meta?: TransformationMeta): void {
    const edge: LineageEdge = { sourceId, targetId, type, meta };

    if (!this.forwardEdges.has(sourceId)) {
      this.forwardEdges.set(sourceId, []);
    }
    this.forwardEdges.get(sourceId)!.push(edge);

    if (!this.backwardEdges.has(targetId)) {
      this.backwardEdges.set(targetId, []);
    }
    this.backwardEdges.get(targetId)!.push(edge);
  }

  getLineage(id: string): LineageEdge[] {
    const lineage: LineageEdge[] = [];
    const visited: Set<string> = new Set();
    const queue: string[] = [id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const edges = this.backwardEdges.get(currentId) || [];
      for (const edge of edges) {
        if (!lineage.includes(edge)) {
          lineage.push(edge);
        }
        if (!visited.has(edge.sourceId) && !queue.includes(edge.sourceId)) {
          queue.push(edge.sourceId);
        }
      }
    }
    return lineage;
  }

  getDescendants(id: string): LineageEdge[] {
    const descendants: LineageEdge[] = [];
    const visited: Set<string> = new Set();
    const queue: string[] = [id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const edges = this.forwardEdges.get(currentId) || [];
      for (const edge of edges) {
        if (!descendants.includes(edge)) {
          descendants.push(edge);
        }
        if (!visited.has(edge.targetId) && !queue.includes(edge.targetId)) {
          queue.push(edge.targetId);
        }
      }
    }
    return descendants;
  }

  getForwardEdges(id: string): LineageEdge[] {
    return this.forwardEdges.get(id) || [];
  }

  getBackwardEdges(id: string): LineageEdge[] {
    return this.backwardEdges.get(id) || [];
  }
}
