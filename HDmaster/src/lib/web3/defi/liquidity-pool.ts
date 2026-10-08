import { ethers } from 'ethers';

const NONFUNGIBLE_POSITION_MANAGER_ADDRESS = '0xC36442b4a4522E871399CD717aBDD847Ab11FE88';
const POSITION_MANAGER_ABI = [
  'function mint(tuple(address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)'
];

export async function provideLiquidity(
  tokenA: string,
  tokenB: string,
  amountA: string,
  amountB: string,
  fee: number,
  tickLower: number,
  tickUpper: number,
  signer: ethers.Signer,
  deadline: number = Math.floor(Date.now() / 1000) + 60 * 20
) {
  const positionManager = new ethers.Contract(NONFUNGIBLE_POSITION_MANAGER_ADDRESS, POSITION_MANAGER_ABI, signer);
  const recipient = await signer.getAddress();

  const token0 = tokenA.toLowerCase() < tokenB.toLowerCase() ? tokenA : tokenB;
  const token1 = tokenA.toLowerCase() < tokenB.toLowerCase() ? tokenB : tokenA;
  
  const amount0Desired = tokenA.toLowerCase() === token0.toLowerCase() ? amountA : amountB;
  const amount1Desired = tokenA.toLowerCase() === token0.toLowerCase() ? amountB : amountA;

  const params = {
    token0,
    token1,
    fee,
    tickLower,
    tickUpper,
    amount0Desired,
    amount1Desired,
    amount0Min: 0,
    amount1Min: 0,
    recipient,
    deadline
  };

  const tx = await positionManager.mint(params);
  return tx.wait();
}
