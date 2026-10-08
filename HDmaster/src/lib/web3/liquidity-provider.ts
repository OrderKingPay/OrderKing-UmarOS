import { ethers } from 'ethers';

// ABI for the NonfungiblePositionManager
const positionManagerAbi = [
  'function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function increaseLiquidity(tuple(uint256 tokenId, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint128 liquidity, uint256 amount0, uint256 amount1)',
  'function decreaseLiquidity(tuple(uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint256 amount0, uint256 amount1)',
  'function collect(tuple(uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external payable returns (uint256 amount0, uint256 amount1)'
];

// ABI for a Uniswap V3 Pool
const poolAbi = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)'
];

const NONFUNGIBLE_POSITION_MANAGER_ADDRESS = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'; // Mainnet address

/**
 * Rebalances a Uniswap V3 LP position by minting a new position within the specified tick range.
 * 
 * @param poolAddress The address of the Uniswap V3 pool.
 * @param tickLower The lower tick of the position.
 * @param tickUpper The upper tick of the position.
 * @param providerUrl The RPC provider URL.
 * @param privateKey The treasury wallet's private key.
 */
export async function rebalanceUniswapV3Position(
  poolAddress: string,
  tickLower: number,
  tickUpper: number,
  providerUrl: string = process.env.RPC_URL || '',
  privateKey: string = process.env.TREASURY_PRIVATE_KEY || ''
) {
  if (!providerUrl || !privateKey) {
    throw new Error('Missing provider URL or private key for transaction execution.');
  }

  const provider = new ethers.JsonRpcProvider(providerUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  const poolContract = new ethers.Contract(poolAddress, poolAbi, provider);
  const positionManager = new ethers.Contract(NONFUNGIBLE_POSITION_MANAGER_ADDRESS, positionManagerAbi, wallet);

  // Fetch pool details
  const [token0, token1, fee, slot0] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
    poolContract.slot0()
  ]);

  const currentTick = slot0.tick;
  console.log(`Current Pool Tick: ${currentTick}`);
  console.log(`Rebalancing with new bounds: [${tickLower}, ${tickUpper}]`);

  // Target amounts based on portfolio requirements.
  // In a production setup, @uniswap/v3-sdk should be used to calculate exact `amount0Desired` and `amount1Desired`
  // given current sqrtRatioX96, but here we specify a placeholder base allocation.
  const amount0Desired = ethers.parseUnits('1', 18);
  const amount1Desired = ethers.parseUnits('1', 18);
  
  // Acceptable slippage tolerances
  // Should ideally not be 0 in production unless closely tracking mempool
  const amount0Min = 0n; 
  const amount1Min = 0n;
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes from now

  const mintParams = {
    token0,
    token1,
    fee,
    tickLower,
    tickUpper,
    amount0Desired,
    amount1Desired,
    amount0Min,
    amount1Min,
    recipient: wallet.address,
    deadline
  };

  try {
    console.log('Initiating LP mint transaction with Uniswap V3 NonfungiblePositionManager...');
    const tx = await positionManager.mint(mintParams, {
      gasLimit: 3000000
    });
    
    console.log(`Transaction submitted. Hash: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Transaction successfully mined in block: ${receipt.blockNumber}`);
    
    return receipt;
  } catch (error) {
    console.error('Critical failure while rebalancing position:', error);
    throw error;
  }
}
