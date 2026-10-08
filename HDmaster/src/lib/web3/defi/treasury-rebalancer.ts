import { ethers } from 'ethers';
// Assuming the `safe-manager` module is defined as stated in requirements
// @ts-ignore
import { proposeTransaction } from '../safe-manager';
import { requireFounderApproval } from '../../orderking/auth/founder-policy';

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const AAVE_POOL_ADDRESS = '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2'; // Aave V3 Pool mainnet

const ERC20_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

const AAVE_POOL_ABI = [
  'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)'
];

export async function rebalanceTreasury(
  treasuryAddress: string,
  provider: ethers.Provider,
  totalTreasuryValueUSD: bigint
) {
  const usdc = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, provider);
  const usdcBalance: bigint = await usdc.balanceOf(treasuryAddress);
  
  // Using simplified 1:1 USDC to USD logic for demonstration
  // totalTreasuryValueUSD should be in 6 decimals scale to match USDC
  const threshold = totalTreasuryValueUSD / 2n;

  if (usdcBalance > threshold) {
    const excess = usdcBalance - threshold;
    const totalUsdcValue = Number(excess) / 10000; // convert 6 decimals to cents

    requireFounderApproval('treasury_sweep', totalUsdcValue);
    
    const usdcInterface = new ethers.Interface(ERC20_ABI);
    const approveData = usdcInterface.encodeFunctionData('approve', [AAVE_POOL_ADDRESS, excess]);
    
    // Propose approval transaction via Gnosis Safe
    await proposeTransaction({
      to: USDC_ADDRESS,
      value: '0',
      data: approveData,
      operation: 0, // Call
    });

    const aaveInterface = new ethers.Interface(AAVE_POOL_ABI);
    const supplyData = aaveInterface.encodeFunctionData('supply', [USDC_ADDRESS, excess, treasuryAddress, 0]);

    // Propose supply to Aave via Gnosis Safe
    await proposeTransaction({
      to: AAVE_POOL_ADDRESS,
      value: '0',
      data: supplyData,
      operation: 0, // Call
    });
    
    console.log(`Proposed treasury rebalance of ${ethers.formatUnits(excess, 6)} USDC to Aave.`);
  } else {
    console.log('USDC balance is within acceptable limits. No rebalancing needed.');
  }
}
