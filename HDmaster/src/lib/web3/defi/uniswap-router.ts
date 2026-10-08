import { ethers } from 'ethers';

const UNISWAP_V3_ROUTER_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564';
const UNISWAP_V3_ROUTER_ABI = [
  'function exactInput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)'
];

export async function swapExactTokensForTokens(
  amountIn: string,
  minOut: string,
  path: string,
  signer: ethers.Signer,
  deadline: number = Math.floor(Date.now() / 1000) + 60 * 20
) {
  const router = new ethers.Contract(UNISWAP_V3_ROUTER_ADDRESS, UNISWAP_V3_ROUTER_ABI, signer);
  const recipient = await signer.getAddress();
  
  const params = {
    path: path,
    recipient: recipient,
    deadline: deadline,
    amountIn: amountIn,
    amountOutMinimum: minOut,
  };

  const tx = await router.exactInput(params);
  return tx.wait();
}
