import { generateKeyPair, SignJWT, jwtVerify } from 'jose';
import type { KeyLike } from 'jose';

export interface WorkloadIdentityOptions {
  issuer: string;
  audience: string;
  expirationTime?: string;
}

export interface IssuedIdentity {
  token: string;
  kid: string;
  expiresAt: number;
}

/**
 * WorkloadIdentityManager
 * 
 * An internal certificate/identity issuance system for workload identities.
 * Issues short-lived, rotatable, scopes-authorized JWTs using RS256.
 * No shared standing credentials.
 */
export class WorkloadIdentityManager {
  private activeKeyPair: { publicKey: KeyLike; privateKey: KeyLike; kid: string } | null = null;
  private verificationKeys: Map<string, KeyLike> = new Map();
  private options: WorkloadIdentityOptions;

  constructor(options: WorkloadIdentityOptions) {
    this.options = {
      expirationTime: '15m', // default to very short-lived
      ...options,
    };
  }

  /**
   * Generates a new RS256 keypair, setting it as active.
   * This provides the rotatable aspect of the identities.
   */
  async rotateKeys(): Promise<void> {
    const { publicKey, privateKey } = await generateKeyPair('RS256');
    const kid = `wl-key-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    this.activeKeyPair = { publicKey, privateKey, kid };
    this.verificationKeys.set(kid, publicKey);
    
    // In a real system, we might prune keys older than the max token lifetime
    // to prevent memory leaks over very long periods.
  }

  /**
   * Issues a short-lived, scopes-authorized JWT for a specific agent/worker.
   * 
   * @param agentId The unique identifier for the worker/agent
   * @param scopes Array of permitted scopes (e.g., ['orders:read', 'orders:write'])
   */
  async issueIdentity(agentId: string, scopes: string[]): Promise<IssuedIdentity> {
    if (!this.activeKeyPair) {
      await this.rotateKeys();
    }

    const { privateKey, kid } = this.activeKeyPair!;

    const token = await new SignJWT({ scopes })
      .setProtectedHeader({ alg: 'RS256', kid })
      .setIssuedAt()
      .setIssuer(this.options.issuer)
      .setAudience(this.options.audience)
      .setSubject(agentId)
      .setExpirationTime(this.options.expirationTime!)
      .sign(privateKey);

    const payload = await jwtVerify(token, this.activeKeyPair!.publicKey);
    
    return {
      token,
      kid,
      expiresAt: payload.payload.exp as number,
    };
  }

  /**
   * Verifies the provided token, ensuring it is signed by a valid key,
   * not expired, and contains valid scopes.
   * 
   * @param token The JWT string to verify
   */
  async verifyIdentity(token: string): Promise<{ agentId: string; scopes: string[] }> {
    const getKey = async (protectedHeader: any) => {
      const kid = protectedHeader.kid;
      if (!kid) throw new Error('Missing kid in token header');
      const key = this.verificationKeys.get(kid);
      if (!key) throw new Error(`Unknown or rotated key ID: ${kid}`);
      return key;
    };

    const { payload } = await jwtVerify(token, getKey, {
      issuer: this.options.issuer,
      audience: this.options.audience,
    });

    return {
      agentId: payload.sub as string,
      scopes: (payload.scopes as string[]) || [],
    };
  }
}
