import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

export async function fetchSecret(secretName: string): Promise<string> {
  const [accessResponse] = await client.accessSecretVersion({
    name: secretName,
  });

  const payload = accessResponse.payload?.data?.toString();
  if (!payload) {
    throw new Error(`Failed to retrieve secret: ${secretName}`);
  }
  return payload;
}
