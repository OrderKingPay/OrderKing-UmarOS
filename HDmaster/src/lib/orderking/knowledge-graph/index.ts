export interface GraphNode {
  id: string;
  properties: Record<string, any>;
}

export interface GraphEdge {
  from: string;
  to: string;
  relationship: string;
  properties: Record<string, any>;
}

export class KnowledgeGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge[]> = new Map();

  addNode(id: string, properties: Record<string, any> = {}): void {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { id, properties });
      this.edges.set(id, []);
    } else {
      const node = this.nodes.get(id)!;
      node.properties = { ...node.properties, ...properties };
    }
  }

  addEdge(from: string, to: string, relationship: string, properties: Record<string, any> = {}): void {
    if (!this.nodes.has(from)) {
      this.addNode(from);
    }
    if (!this.nodes.has(to)) {
      this.addNode(to);
    }

    const edge: GraphEdge = { from, to, relationship, properties };
    this.edges.get(from)!.push(edge);
  }

  queryPath(start: string, end: string): GraphEdge[] | null {
    if (!this.nodes.has(start) || !this.nodes.has(end)) {
      return null;
    }

    const queue: { current: string; path: GraphEdge[] }[] = [];
    queue.push({ current: start, path: [] });

    const visited: Set<string> = new Set();
    visited.add(start);

    while (queue.length > 0) {
      const { current, path } = queue.shift()!;

      if (current === end) {
        return path;
      }

      const outgoingEdges = this.edges.get(current) || [];
      for (const edge of outgoingEdges) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to);
          queue.push({
            current: edge.to,
            path: [...path, edge]
          });
        }
      }
    }

    return null;
  }
}

const defaultGraph = new KnowledgeGraph();

export const addNode = (id: string, properties: Record<string, any> = {}) => defaultGraph.addNode(id, properties);
export const addEdge = (from: string, to: string, relationship: string, properties: Record<string, any> = {}) => defaultGraph.addEdge(from, to, relationship, properties);
export const queryPath = (start: string, end: string) => defaultGraph.queryPath(start, end);
