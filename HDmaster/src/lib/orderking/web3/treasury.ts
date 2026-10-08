export interface ApprovalRequest {
  id: string;
  amount: bigint;
  token: string;
  destination: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvals: string[];
}

export class DeFiTreasury {
  private balances: Map<string, bigint> = new Map();
  private approvalRequests: Map<string, ApprovalRequest> = new Map();

  updateBalance(token: string, amount: bigint) {
    const current = this.balances.get(token) || 0n;
    this.balances.set(token, current + amount);
  }

  getBalance(token: string) {
    return this.balances.get(token) || 0n;
  }

  requestApproval(id: string, amount: bigint, token: string, destination: string) {
    const request: ApprovalRequest = {
      id,
      amount,
      token,
      destination,
      status: 'PENDING',
      approvals: []
    };
    this.approvalRequests.set(id, request);
    return request;
  }

  approveRequest(id: string, founderAddress: string, requiredApprovals: number) {
    const request = this.approvalRequests.get(id);
    if (!request) throw new Error("Request not found");
    if (request.status !== 'PENDING') throw new Error("Request already processed");
    
    if (!request.approvals.includes(founderAddress)) {
      request.approvals.push(founderAddress);
    }

    if (request.approvals.length >= requiredApprovals) {
      request.status = 'APPROVED';
      const currentBalance = this.getBalance(request.token);
      if (currentBalance < request.amount) {
          throw new Error("Insufficient balance in treasury");
      }
      this.balances.set(request.token, currentBalance - request.amount);
    }
    return request;
  }
}
