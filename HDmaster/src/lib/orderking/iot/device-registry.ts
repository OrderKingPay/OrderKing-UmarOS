import { randomUUID, createHash } from 'node:crypto';

export type DeviceType = 'robot' | 'kitchen_display' | 'rider' | 'sensor';

export interface DeviceCredentials {
  deviceId: string;
  publicKey: string;
  certificate: string;
}

export interface DeviceStatus {
  connected: boolean;
  lastSeenAt: Date;
  metadata?: Record<string, any>;
}

export interface RegisteredDevice {
  id: string;
  type: DeviceType;
  credentials: DeviceCredentials;
  status: DeviceStatus;
  createdAt: Date;
}

export class DeviceRegistry {
  private devices: Map<string, RegisteredDevice> = new Map();

  /**
   * Registers a new device in the system, generating credentials for it.
   */
  public registerDevice(type: DeviceType, publicKey: string): RegisteredDevice {
    const id = randomUUID();
    const certificate = this.generateCertificate(id, publicKey);
    
    const device: RegisteredDevice = {
      id,
      type,
      credentials: {
        deviceId: id,
        publicKey,
        certificate
      },
      status: {
        connected: false,
        lastSeenAt: new Date()
      },
      createdAt: new Date()
    };
    
    this.devices.set(id, device);
    return device;
  }

  /**
   * Generates a provisioned certificate based on device ID and public key.
   */
  private generateCertificate(deviceId: string, publicKey: string): string {
    const hash = createHash('sha256');
    hash.update(`${deviceId}:${publicKey}:${Date.now()}`);
    return `cert-${hash.digest('hex')}`;
  }

  /**
   * Validates a device's credentials.
   */
  public validateCredentials(deviceId: string, certificate: string): boolean {
    const device = this.devices.get(deviceId);
    if (!device) {
      return false;
    }
    return device.credentials.certificate === certificate;
  }

  /**
   * Updates a device's connection status.
   */
  public updateStatus(deviceId: string, connected: boolean, metadata?: Record<string, any>): void {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`);
    }
    device.status.connected = connected;
    device.status.lastSeenAt = new Date();
    if (metadata) {
      device.status.metadata = { ...device.status.metadata, ...metadata };
    }
  }

  public getDevice(deviceId: string): RegisteredDevice | undefined {
    return this.devices.get(deviceId);
  }

  public listDevices(type?: DeviceType): RegisteredDevice[] {
    const all = Array.from(this.devices.values());
    if (type) {
      return all.filter(d => d.type === type);
    }
    return all;
  }
  
  public removeDevice(deviceId: string): boolean {
    return this.devices.delete(deviceId);
  }
}
