import { KeyManagementServiceClient } from '@google-cloud/kms';
import { ethers } from 'ethers';

const client = new KeyManagementServiceClient();

export async function signWithKMS(message: string | Uint8Array, keyName: string): Promise<string> {
  const digest = ethers.getBytes(ethers.hashMessage(message));
  
  const [signResponse] = await client.asymmetricSign({
    name: keyName,
    digest: {
      sha256: digest,
    },
  });

  if (!signResponse.signature) {
    throw new Error("Failed to sign message with KMS");
  }

  return ethers.hexlify(signResponse.signature);
}
