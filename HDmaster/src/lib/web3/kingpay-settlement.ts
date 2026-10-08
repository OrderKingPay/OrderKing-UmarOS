import { ethers } from 'ethers';

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint amount)"
];

export class KingPaySettlement {
  private provider: ethers.JsonRpcProvider;
  
  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async verifyTransaction(txHash: string, expectedRecipient: string, expectedAmount: bigint, tokenAddress: string): Promise<boolean> {
    const tx = await this.provider.getTransaction(txHash);
    if (!tx) {
      throw new Error("Transaction not found");
    }

    const receipt = await this.provider.getTransactionReceipt(txHash);
    if (!receipt || receipt.status !== 1) {
      throw new Error("Transaction failed or pending");
    }

    if (tx.to?.toLowerCase() !== tokenAddress.toLowerCase()) {
      return false;
    }

    const iface = new ethers.Interface(ERC20_ABI);
    const parsedTx = iface.parseTransaction({ data: tx.data, value: tx.value });

    if (parsedTx?.name !== "transfer") {
      return false;
    }

    const recipient = parsedTx.args[0];
    const amount = parsedTx.args[1];

    if (recipient.toLowerCase() === expectedRecipient.toLowerCase() && amount === expectedAmount) {
      return true;
    }

    return false;
  }

  async deriveWalletAddress(privateKey: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  }

  async signPayload(privateKey: string, payload: string): Promise<string> {
    const wallet = new ethers.Wallet(privateKey);
    return await wallet.signMessage(payload);
  }
}
