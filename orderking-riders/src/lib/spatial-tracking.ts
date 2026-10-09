export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface TelematicsPayload {
  riderId: string;
  location: GPSCoordinate;
  batteryLevel: number;
  networkType: '5G' | '4G' | '3G' | '2G' | 'Starlink' | 'Offline';
}

class TelematicsQueue {
  private queue: TelematicsPayload[] = [];
  
  enqueue(payload: TelematicsPayload) {
    this.queue.push(payload);
  }
  
  dequeueAll(): TelematicsPayload[] {
    const payloads = [...this.queue];
    this.queue = [];
    return payloads;
  }
  
  get length(): number {
    return this.queue.length;
  }
}

export class SpatialTrackingService {
  private isTracking = false;
  private riderId: string;
  private watchId?: number;
  private fallbackQueue = new TelematicsQueue();
  private umarOSEndpoint = 'https://api.umaros.orderking.com/telematics/ingest';
  
  constructor(riderId: string) {
    this.riderId = riderId;
  }

  public async startTracking(): Promise<void> {
    if (this.isTracking) return;
    
    if (!('geolocation' in navigator)) {
      throw new Error('Geolocation is not supported by this device.');
    }
    
    this.isTracking = true;
    
    // Battery-efficient background geolocation polling setup
    this.watchId = navigator.geolocation.watchPosition(
      this.handlePositionUpdate.bind(this),
      this.handlePositionError.bind(this),
      {
        enableHighAccuracy: false, // For battery efficiency
        timeout: 10000,
        maximumAge: 30000,
      }
    );
    
    // Fallback sync loop
    setInterval(() => this.syncFallbackQueue(), 60000);
  }

  public stopTracking(): void {
    if (!this.isTracking) return;
    this.isTracking = false;
    
    if (this.watchId !== undefined) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = undefined;
    }
  }

  private async handlePositionUpdate(position: GeolocationPosition): Promise<void> {
    const coordinate: GPSCoordinate = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      altitude: position.coords.altitude || undefined,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: position.timestamp,
    };
    
    const payload: TelematicsPayload = {
      riderId: this.riderId,
      location: coordinate,
      batteryLevel: await this.getBatteryLevel(),
      networkType: this.getNetworkType(),
    };
    
    await this.transmitToUmarOS(payload);
  }
  
  private handlePositionError(error: GeolocationPositionError): void {
    console.error(`Geolocation error (${error.code}): ${error.message}`);
  }

  private async transmitToUmarOS(payload: TelematicsPayload): Promise<void> {
    try {
      if (!navigator.onLine) {
        throw new Error('Device offline, routing to fallback queue.');
      }
      
      const response = await fetch(this.umarOSEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Target-Engines': 'RiderTelematicsEngine,AutonomousFleetEngine'
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`UmarOS ingestion failed with status ${response.status}`);
      }
    } catch (error) {
      console.warn('Transmission failed, queuing for Starlink/2G fallback sync.', error);
      this.fallbackQueue.enqueue(payload);
    }
  }

  private async syncFallbackQueue(): Promise<void> {
    if (this.fallbackQueue.length === 0 || !navigator.onLine) {
      return;
    }
    
    const payloads = this.fallbackQueue.dequeueAll();
    
    try {
      const response = await fetch(`${this.umarOSEndpoint}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Target-Engines': 'RiderTelematicsEngine,AutonomousFleetEngine'
        },
        body: JSON.stringify({ batch: payloads }),
      });
      
      if (!response.ok) {
        throw new Error(`Batch UmarOS ingestion failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Fallback sync failed, requeuing payloads.', error);
      payloads.forEach(p => this.fallbackQueue.enqueue(p));
    }
  }

  private async getBatteryLevel(): Promise<number> {
    try {
      if ('getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        return battery.level * 100;
      }
      return 100; // Mock if unsupported
    } catch {
      return 100;
    }
  }

  private getNetworkType(): TelematicsPayload['networkType'] {
    if (!navigator.onLine) return 'Offline';
    
    const connection: any = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
          return '2G';
        case '3g':
          return '3G';
        case '4g':
          return '4G';
        default:
          return '5G';
      }
    }
    return 'Starlink'; // Default fallback assumption for high-latency sat connections
  }
}
