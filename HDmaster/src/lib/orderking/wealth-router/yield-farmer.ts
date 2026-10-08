import { ethers } from 'ethers';

const AAVE_POOL_ABI = [
  "function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external"
];

export async function calculateSweepGas(
  provider: ethers.Provider,
  userAddress: string,
  usdcAddress: string,
  aavePoolAddress: string,
  amount: bigint
): Promise<bigint> {
  const poolContract = new ethers.Contract(aavePoolAddress, AAVE_POOL_ABI, provider);
  
  try {
    const gasEstimate = await poolContract.supply.estimateGas(
      usdcAddress,
      amount,
      userAddress,
      0,
      { from: userAddress }
    );
    return gasEstimate;
  } catch (error) {
    console.error("Failed to estimate gas for sweep:", error);
    throw error;
  }
}

export async function calculateGasCost(
    provider: ethers.Provider,
    gasEstimate: bigint
): Promise<bigint> {
    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas || 0n;
    return gasEstimate * maxFeePerGas;
}
