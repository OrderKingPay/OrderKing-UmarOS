/**
 * UMAR OS — Web3 Smart Contract Manager (Secure Vault Architecture)
 *
 * SECURITY MODEL:
 * 1. Private key NEVER exposed as a class property or passed in plaintext
 * 2. All transactions require explicit founder approval via TransactionProposal
 * 3. Immutable audit log of every approved/rejected transaction
 * 4. Signer obtained from encrypted vault or hardware wallet only
 */
import { Contract, Provider, Signer, Interface, InterfaceAbi, TransactionResponse } from 'ethers';

export interface TransactionProposal {
  id: string;
  type: 'ERC20_TRANSFER' | 'OWNERSHIP_TRANSFER' | 'CUSTOM';
  contractAddress: string;
  description: string;
  estimatedGasWei: bigint;
  params: Record<string, unknown>;
  createdAt: string;
  approved: boolean;
  executedAt?: string;
  txHash?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

export interface TransactionAuditEntry {
  proposalId: string;
  action: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'FAILED';
  timestamp: string;
  details: string;
}

export class SmartContractManager {
  private signer: Signer;
  private auditLog: TransactionAuditEntry[] = [];
  private pendingProposals: Map<string, TransactionProposal> = new Map();

  /**
   * @param signer — Must come from a secure source (hardware wallet,
   * KMS, or encrypted keystore). NEVER from a plaintext env var in production.
   */
  constructor(signer: Signer) {
    this.signer = signer;
  }

  public getContract(address: string, abi: Interface | InterfaceAbi | string[]): Contract {
    return new Contract(address, abi, this.signer);
  }

  /**
   * STEP 1: Propose an ERC20 transfer. Does NOT execute.
   * Returns a proposal that must be approved before execution.
   */
  public async proposeERC20Transfer(
    contractAddress: string,
    to: string,
    amount: bigint,
    description: string,
  ): Promise<TransactionProposal> {
    const abi = ['function transfer(address to, uint256 amount) returns (bool)'];
    const contract = this.getContract(contractAddress, abi);

    // Estimate gas without executing
    const estimatedGas = await contract.transfer.estimateGas(to, amount);

    const proposal: TransactionProposal = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'ERC20_TRANSFER',
      contractAddress,
      description,
      estimatedGasWei: estimatedGas,
      params: { to, amount: amount.toString() },
      createdAt: new Date().toISOString(),
      approved: false,
    };

    this.pendingProposals.set(proposal.id, proposal);
    this.audit(proposal.id, 'PROPOSED', `Transfer ${amount} to ${to}`);
    return proposal;
  }

  /**
   * STEP 2: Founder approves the proposal.
   */
  public approveProposal(proposalId: string): TransactionProposal {
    const proposal = this.pendingProposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
    if (proposal.approved) throw new Error(`Proposal ${proposalId} already approved`);

    proposal.approved = true;
    this.audit(proposalId, 'APPROVED', 'Founder approved');
    return proposal;
  }

  /**
   * Founder rejects the proposal.
   */
  public rejectProposal(proposalId: string, reason: string): TransactionProposal {
    const proposal = this.pendingProposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found`);

    proposal.rejectedAt = new Date().toISOString();
    proposal.rejectionReason = reason;
    this.audit(proposalId, 'REJECTED', reason);
    this.pendingProposals.delete(proposalId);
    return proposal;
  }

  /**
   * STEP 3: Execute an APPROVED proposal. Throws if not approved.
   */
  public async executeProposal(proposalId: string): Promise<TransactionResponse> {
    const proposal = this.pendingProposals.get(proposalId);
    if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
    if (!proposal.approved) {
      throw new Error(
        `SECURITY: Proposal ${proposalId} has not been approved by the founder.`,
      );
    }

    try {
      let tx: TransactionResponse;

      if (proposal.type === 'ERC20_TRANSFER') {
        const abi = ['function transfer(address to, uint256 amount) returns (bool)'];
        const contract = this.getContract(proposal.contractAddress, abi);
        tx = await contract.transfer(
          proposal.params.to as string,
          BigInt(proposal.params.amount as string),
        );
      } else if (proposal.type === 'OWNERSHIP_TRANSFER') {
        const abi = ['function transferOwnership(address newOwner)'];
        const contract = this.getContract(proposal.contractAddress, abi);
        tx = await contract.transferOwnership(proposal.params.newOwner as string);
      } else {
        throw new Error(`Unknown proposal type: ${proposal.type}`);
      }

      proposal.executedAt = new Date().toISOString();
      proposal.txHash = tx.hash;
      this.audit(proposalId, 'EXECUTED', `TX: ${tx.hash}`);
      this.pendingProposals.delete(proposalId);
      return tx;
    } catch (error: any) {
      this.audit(proposalId, 'FAILED', error.message);
      throw error;
    }
  }

  /**
   * Get the full immutable audit log.
   */
  public getAuditLog(): TransactionAuditEntry[] {
    return [...this.auditLog];
  }

  /**
   * Get all pending proposals.
   */
  public getPendingProposals(): TransactionProposal[] {
    return Array.from(this.pendingProposals.values());
  }

  private audit(proposalId: string, action: TransactionAuditEntry['action'], details: string): void {
    this.auditLog.push({
      proposalId,
      action,
      timestamp: new Date().toISOString(),
      details,
    });
  }
}
