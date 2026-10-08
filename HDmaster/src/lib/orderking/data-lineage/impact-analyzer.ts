import { DataLineageTracker, NodeId, LineageNode } from './data-lineage-tracker';

export class ImpactAnalyzer {
  constructor(private tracker: DataLineageTracker) {}

  /**
   * Analyzes the monetary flow of a given raw order down to its ledger entries
   */
  public analyzeMonetaryImpact(startNodeId: NodeId): { totalAmount: number; ledgers: LineageNode[] } {
    const { nodes } = this.tracker.getForwardTrace(startNodeId);
    
    const ledgers = nodes.filter(n => n.type === 'LEDGER_ENTRY');
    
    const totalAmount = ledgers.reduce((acc, node) => {
      const amount = typeof node.data?.amount === 'number' ? node.data.amount : 0;
      return acc + amount;
    }, 0);

    return {
      totalAmount,
      ledgers
    };
  }

  /**
   * Identifies all raw events that contributed to a specific ledger transaction,
   * allowing the Founder to trace any dollar back to its origin event.
   */
  public getContributingEvents(ledgerNodeId: NodeId): LineageNode[] {
    const { nodes } = this.tracker.getTrace(ledgerNodeId);
    
    // We filter out the ledger entry itself to return the raw events that led to it.
    return nodes.filter(n => n.id !== ledgerNodeId);
  }
}
