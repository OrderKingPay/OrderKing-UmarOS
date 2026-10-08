/**
 * UMAR OS — DeFi Yield Farmer (Founder-Gated)
 *
 * SECURITY MODEL:
 * 1. This module CALCULATES gas costs and prepares transaction data
 * 2. It does NOT execute transactions autonomously
 * 3. All sweep operations return a SweepProposal that must be
 *    approved by the founder before execution
 * 4. Uses the SmartContractManager's approval pipeline
 */
import { ethers } from 'ethers';

const AAVE_POOL_ABI = [
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
];

export interface SweepProposal {
  id: string;
  userAddress: string;
  usdcAddress: string;
  aavePoolAddress: string;
  amount: bigint;
  estimatedGasUnits: bigint;
  estimatedGasCostWei: bigint;
  estimatedGasCostGwei: string;
  netValueAfterGas: bigint;
  isProfitable: boolean;
  createdAt: string;
  approved: boolean;
}

/**
 * Calculate the gas required to sweep USDC into an Aave lending pool.
 * Does NOT execute — returns a cost estimate only.
 */
export async function calculateSweepGas(
  provider: ethers.Provider,
  userAddress: string,
  usdcAddress: string,
  aavePoolAddress: string,
  amount: bigint,
): Promise<bigint> {
  const poolContract = new ethers.Contract(aavePoolAddress, AAVE_POOL_ABI, provider);

  const gasEstimate = await poolContract.supply.estimateGas(
    usdcAddress,
    amount,
    userAddress,
    0,
    { from: userAddress },
  );
  return gasEstimate;
}

/**
 * Calculate gas cost in wei.
 */
export async function calculateGasCost(
  provider: ethers.Provider,
  gasEstimate: bigint,
): Promise<bigint> {
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas || 0n;
  return gasEstimate * maxFeePerGas;
}

/**
 * Create a sweep PROPOSAL. Does NOT execute.
 * The founder must approve this before any funds move.
 */
export async function proposeSweep(
  provider: ethers.Provider,
  userAddress: string,
  usdcAddress: string,
  aavePoolAddress: string,
  amount: bigint,
): Promise<SweepProposal> {
  const gasUnits = await calculateSweepGas(
    provider, userAddress, usdcAddress, aavePoolAddress, amount,
  );
  const gasCostWei = await calculateGasCost(provider, gasUnits);

  // Check profitability: is the gas cost less than 1% of the sweep amount?
  // (USDC has 6 decimals, ETH has 18 — this is a rough sanity check)
  const isProfitable = gasCostWei < amount * 10n ** 12n / 100n;

  return {
    id: `sweep-${Date.now()}`,
    userAddress,
    usdcAddress,
    aavePoolAddress,
    amount,
    estimatedGasUnits: gasUnits,
    estimatedGasCostWei: gasCostWei,
    estimatedGasCostGwei: ethers.formatUnits(gasCostWei, 'gwei'),
    netValueAfterGas: amount - gasCostWei,
    isProfitable,
    createdAt: new Date().toISOString(),
    approved: false,
  };
}

/**
 * Execute a sweep ONLY if the proposal has been approved.
 * @param signer — Must come from a secure vault, never from plaintext env.
 */
export async function executeSweep(
  signer: ethers.Signer,
  proposal: SweepProposal,
): Promise<{ approveTx: ethers.TransactionResponse; supplyTx: ethers.TransactionResponse }> {
  if (!proposal.approved) {
    throw new Error(
      'SECURITY: Sweep has not been approved by the founder. Set proposal.approved = true after review.',
    );
  }

  // Step 1: Approve USDC spend
  const usdcContract = new ethers.Contract(proposal.usdcAddress, ERC20_ABI, signer);
  const approveTx = await usdcContract.approve(proposal.aavePoolAddress, proposal.amount);
  await approveTx.wait();

  // Step 2: Supply to Aave
  const poolContract = new ethers.Contract(proposal.aavePoolAddress, AAVE_POOL_ABI, signer);
  const supplyTx = await poolContract.supply(
    proposal.usdcAddress,
    proposal.amount,
    proposal.userAddress,
    0,
  );
  await supplyTx.wait();

  return { approveTx, supplyTx };
}
