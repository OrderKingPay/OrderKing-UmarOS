export type NodeId = string;
export type EdgeId = string;

export interface LineageNode {
  id: NodeId;
  type: 'ORDER_RECEIVED' | 'ORDER_MODIFIED' | 'DISPATCHED' | 'FULFILLED' | 'LEDGER_ENTRY' | 'REFUND_INITIATED' | string;
  data: any;
  timestamp: Date;
}

export interface LineageEdge {
  id: EdgeId;
  source: NodeId;
  target: NodeId;
  relationship: 'TRANSFORMED_TO' | 'TRIGGERED' | 'DERIVED_FROM' | string;
  metadata?: any;
}

export class DataLineageTracker {
  private nodes: Map<NodeId, LineageNode> = new Map();
  private edges: Map<EdgeId, LineageEdge> = new Map();

  public addNode(node: LineageNode): void {
    this.nodes.set(node.id, node);
  }

  public addEdge(sourceId: NodeId, targetId: NodeId, relationship: string, metadata?: any): void {
    if (!this.nodes.has(sourceId)) throw new Error(`Source node ${sourceId} not found`);
    if (!this.nodes.has(targetId)) throw new Error(`Target node ${targetId} not found`);

    const edgeId = `${sourceId}->${targetId}`;
    this.edges.set(edgeId, {
      id: edgeId,
      source: sourceId,
      target: targetId,
      relationship,
      metadata
    });
  }

  public getNode(id: NodeId): LineageNode | undefined {
    return this.nodes.get(id);
  }

  public getTrace(endNodeId: NodeId): { nodes: LineageNode[], edges: LineageEdge[] } {
    const visitedNodes = new Set<NodeId>();
    const visitedEdges = new Set<EdgeId>();
    const traceNodes: LineageNode[] = [];
    const traceEdges: LineageEdge[] = [];

    // Backward traversal (from target to source)
    const traverse = (nodeId: NodeId) => {
      if (visitedNodes.has(nodeId)) return;
      visitedNodes.add(nodeId);
      
      const node = this.nodes.get(nodeId);
      if (node) traceNodes.push(node);

      for (const edge of this.edges.values()) {
        if (edge.target === nodeId) {
          if (!visitedEdges.has(edge.id)) {
            visitedEdges.add(edge.id);
            traceEdges.push(edge);
            traverse(edge.source);
          }
        }
      }
    };

    traverse(endNodeId);

    return {
      nodes: traceNodes,
      edges: traceEdges
    };
  }

  public getForwardTrace(startNodeId: NodeId): { nodes: LineageNode[], edges: LineageEdge[] } {
    const visitedNodes = new Set<NodeId>();
    const visitedEdges = new Set<EdgeId>();
    const traceNodes: LineageNode[] = [];
    const traceEdges: LineageEdge[] = [];

    // Forward traversal (from source to target)
    const traverse = (nodeId: NodeId) => {
      if (visitedNodes.has(nodeId)) return;
      visitedNodes.add(nodeId);
      
      const node = this.nodes.get(nodeId);
      if (node) traceNodes.push(node);

      for (const edge of this.edges.values()) {
        if (edge.source === nodeId) {
          if (!visitedEdges.has(edge.id)) {
            visitedEdges.add(edge.id);
            traceEdges.push(edge);
            traverse(edge.target);
          }
        }
      }
    };

    traverse(startNodeId);

    return {
      nodes: traceNodes,
      edges: traceEdges
    };
  }
}
