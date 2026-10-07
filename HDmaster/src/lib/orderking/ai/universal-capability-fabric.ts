import { z } from 'zod';

export type CapabilityStatus = 'ACTIVE' | 'IMPLEMENTABLE NOW' | 'REQUIRES CONFIGURATION' | 'REQUIRES CREDENTIAL' | 'REQUIRES EXTERNAL SERVICE' | 'REQUIRES PARTNERSHIP' | 'REQUIRES HARDWARE' | 'REQUIRES HUMAN AUTHORIZATION' | 'NOT AVAILABLE';

export interface CapabilityFabric {
  identity: string;
  domain: string;
  provider: string;
  version: string;
  dependencies: string[];
  permissions: string[];
  inputs: z.ZodType<any, any, any>;
  outputs: z.ZodType<any, any, any>;
  configuration: Record<string, any>;
  health: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  availability: number; // e.g. 99.99
  costUsd?: number;
  audit: {
    lastChecked: string;
    verifiedBy: string;
  };
  versionHistory: Array<{ version: string; date: string; changes: string }>;
  rollbackRecovery: string;
  failureState: string;
  status: CapabilityStatus;
}

export class CapabilityRegistry {
  private capabilities: Map<string, CapabilityFabric> = new Map();

  register(capability: CapabilityFabric) {
    this.capabilities.set(capability.identity, capability);
  }

  get(identity: string): CapabilityFabric | undefined {
    return this.capabilities.get(identity);
  }

  listActive(): CapabilityFabric[] {
    return Array.from(this.capabilities.values()).filter(c => c.status === 'ACTIVE');
  }

  listAll(): CapabilityFabric[] {
    return Array.from(this.capabilities.values());
  }
}

export const globalCapabilityRegistry = new CapabilityRegistry();
