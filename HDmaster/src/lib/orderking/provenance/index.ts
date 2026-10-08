import * as crypto from 'crypto';

export interface ProvenanceMetadata {
  origin: string;
  source: string;
  identity: string;
  timestamp: string;
  version: string;
  transformationHistory: string[];
}

export interface ProvenanceData<T> {
  data: T;
  provenance: {
    metadata: ProvenanceMetadata;
    signature: string;
  };
}

export class ProvenanceTracker {
  private privateKey: crypto.KeyObject;
  private publicKey: crypto.KeyObject;

  constructor() {
    // Generate a key pair for signing and verifying
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    this.privateKey = privateKey;
    this.publicKey = publicKey;
  }

  attachProvenance<T>(data: T, metadata: ProvenanceMetadata): ProvenanceData<T> {
    const payload = JSON.stringify({ data, metadata });
    
    const signature = crypto.sign('sha256', Buffer.from(payload), this.privateKey).toString('base64');
    
    return {
      data,
      provenance: {
        metadata,
        signature
      }
    };
  }

  verifyProvenance<T>(provenanceData: ProvenanceData<T>): boolean {
    const { data, provenance } = provenanceData;
    const payload = JSON.stringify({ data, metadata: provenance.metadata });
    
    return crypto.verify(
      'sha256',
      Buffer.from(payload),
      this.publicKey,
      Buffer.from(provenance.signature, 'base64')
    );
  }
}
