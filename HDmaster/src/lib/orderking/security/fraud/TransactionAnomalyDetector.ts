export interface PaymentEvent {
  status: 'failed' | 'success';
  timestamp: number;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface TransactionInfo {
  accountId: string;
  deviceId: string;
  paymentEvents: PaymentEvent[];
  billingLocation: GeoLocation;
  deliveryLocation: GeoLocation;
}

export interface AccountCreationEvent {
  deviceId: string;
  timestamp: number;
}

export class TransactionAnomalyDetector {
  private static readonly MAX_RAPID_FAILURES = 5;
  private static readonly MAX_DISTANCE_KM = 500;
  private static readonly MAX_ACCOUNTS_PER_DEVICE = 10;
  private static readonly RAPID_FAILURE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

  private accountCreations: Map<string, AccountCreationEvent[]> = new Map();

  /**
   * Scores a transaction for fraud.
   * Returns a score from 0 to 100, where 100 is absolute fraud.
   */
  public analyzeTransaction(tx: TransactionInfo): number {
    let fraudScore = 0;

    // 1. Stolen Credit Card Pattern: 5 rapid failures followed by 1 success
    if (this.detectStolenCardPattern(tx.paymentEvents)) {
      fraudScore += 80;
    }

    // 2. Mismatching billing/delivery geo-locations
    const distance = this.calculateDistance(tx.billingLocation, tx.deliveryLocation);
    if (distance > TransactionAnomalyDetector.MAX_DISTANCE_KM) {
      fraudScore += 30; // Suspicious if too far
    }

    // Cap the score at 100
    return Math.min(fraudScore, 100);
  }

  /**
   * Records an account creation and checks for referral abuse.
   * Throws an error if abuse is detected.
   */
  public recordAccountCreation(deviceId: string, timestamp: number): void {
    const creations = this.accountCreations.get(deviceId) || [];
    creations.push({ deviceId, timestamp });
    
    // Clean up old creations to avoid memory leaks (keep last 30 days, simplified)
    const recentCreations = creations.filter(c => timestamp - c.timestamp < 30 * 24 * 60 * 60 * 1000);
    this.accountCreations.set(deviceId, recentCreations);

    if (recentCreations.length >= TransactionAnomalyDetector.MAX_ACCOUNTS_PER_DEVICE) {
      throw new Error(`Referral Abuse Detected: Too many accounts created from device ${deviceId}`);
    }
  }

  private detectStolenCardPattern(events: PaymentEvent[]): boolean {
    if (events.length < TransactionAnomalyDetector.MAX_RAPID_FAILURES + 1) {
      return false;
    }

    // Look for 5 failed payments followed by 1 success within the time window
    for (let i = 0; i <= events.length - (TransactionAnomalyDetector.MAX_RAPID_FAILURES + 1); i++) {
      const windowEvents = events.slice(i, i + TransactionAnomalyDetector.MAX_RAPID_FAILURES + 1);
      
      const lastEvent = windowEvents[windowEvents.length - 1];
      if (lastEvent.status !== 'success') {
        continue;
      }

      let failedCount = 0;
      let withinWindow = true;
      for (let j = 0; j < TransactionAnomalyDetector.MAX_RAPID_FAILURES; j++) {
        const ev = windowEvents[j];
        if (ev.status === 'failed' && (lastEvent.timestamp - ev.timestamp <= TransactionAnomalyDetector.RAPID_FAILURE_WINDOW_MS)) {
          failedCount++;
        } else {
          withinWindow = false;
          break;
        }
      }

      if (failedCount >= TransactionAnomalyDetector.MAX_RAPID_FAILURES && withinWindow) {
        return true;
      }
    }

    return false;
  }

  private calculateDistance(loc1: GeoLocation, loc2: GeoLocation): number {
    const toRad = (value: number) => (value * Math.PI) / 180;
    
    const R = 6371; // km
    const dLat = toRad(loc2.latitude - loc1.latitude);
    const dLon = toRad(loc2.longitude - loc1.longitude);
    const lat1 = toRad(loc1.latitude);
    const lat2 = toRad(loc2.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    const d = R * c;
    return d;
  }
}
