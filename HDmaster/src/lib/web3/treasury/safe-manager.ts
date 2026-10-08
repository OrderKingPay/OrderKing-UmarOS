import Safe from '@safe-global/protocol-kit';
import { SafeTransactionDataPartial } from '@safe-global/safe-core-sdk-types';
import { ethers } from 'ethers';

export async function createSafeTransaction(
  safeAddress: string, 
  to: string, 
  value: string, 
  data: string,
  provider: ethers.Provider,
  signer: ethers.Signer
) {
  const safeSdk = await Safe.init({
    provider: provider as any,
    signer: signer as any,
    safeAddress
  });

  const safeTransactionData: SafeTransactionDataPartial = {
    to,
    value,
    data,
  };

  const safeTransaction = await safeSdk.createTransaction({ transactions: [safeTransactionData] });
  
  return safeTransaction;
}
