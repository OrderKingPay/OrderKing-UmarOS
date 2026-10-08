export interface RiderTelemetry {
  riderId: string;
  orderId: string;
  batteryLevel: number; // 0 to 100
  currentLocation: { lat: number; lng: number };
  destinationLocation: { lat: number; lng: number };
  estimatedDistanceKm: number;
  gyroscopeData: { x: number; y: number; z: number; timestamp: number }[];
  averageSpeedKmH: number; // average speed of the rider
}

export interface TelematicsAlert {
  riderId: string;
  orderId: string;
  alertType: 'LOW_BATTERY_RISK' | 'HARSH_BRAKING' | 'CRITICAL_RISK';
  requiresBackupRider: boolean;
  reason: string;
}

export class RiderTelematicsEngine {
  private static readonly BATTERY_DROP_PER_MINUTE = 2.0; // 2% per minute
  private static readonly HARSH_BRAKING_THRESHOLD = 5.0; // rate of change in gyroscope/accelerometer
  private static readonly CRITICAL_BATTERY_RESERVE = 2.0; // minimum battery to maintain

  /**
   * Process incoming rider telemetry and return alerts or backup rider triggers.
   */
  public analyzeTelemetry(telemetry: RiderTelemetry): TelematicsAlert[] {
    const alerts: TelematicsAlert[] = [];

    // 1. Harsh Braking Detection
    const hasHarshBraking = this.detectHarshBraking(telemetry.gyroscopeData);
    if (hasHarshBraking) {
      alerts.push({
        riderId: telemetry.riderId,
        orderId: telemetry.orderId,
        alertType: 'HARSH_BRAKING',
        requiresBackupRider: false,
        reason: 'Harsh braking detected based on device gyroscope telemetry rate of change.'
      });
    }

    // 2. Battery vs Distance Prediction
    // Estimate time to delivery
    // Avoid division by zero, assume minimum reasonable speed of 20 km/h in city
    const speed = telemetry.averageSpeedKmH > 0 ? telemetry.averageSpeedKmH : 20; 
    const estimatedHoursToDelivery = telemetry.estimatedDistanceKm / speed;
    const estimatedMinutesToDelivery = estimatedHoursToDelivery * 60;
    
    const estimatedBatteryDrop = estimatedMinutesToDelivery * RiderTelematicsEngine.BATTERY_DROP_PER_MINUTE;
    const projectedBatteryLevel = telemetry.batteryLevel - estimatedBatteryDrop;

    // Specific business rule: If rider has <= 5% battery and distance >= 10km
    // OR if projected battery falls below critical reserve.
    const isCriticalDistanceRisk = (telemetry.batteryLevel <= 5 && telemetry.estimatedDistanceKm >= 10) || 
                                   (projectedBatteryLevel < RiderTelematicsEngine.CRITICAL_BATTERY_RESERVE);

    if (isCriticalDistanceRisk) {
      alerts.push({
        riderId: telemetry.riderId,
        orderId: telemetry.orderId,
        alertType: 'CRITICAL_RISK',
        requiresBackupRider: true,
        reason: `Projected battery ${projectedBatteryLevel.toFixed(1)}% at delivery. High risk of dropped order. Dispatching backup.`
      });
    } else if (projectedBatteryLevel < 15) {
      alerts.push({
        riderId: telemetry.riderId,
        orderId: telemetry.orderId,
        alertType: 'LOW_BATTERY_RISK',
        requiresBackupRider: false,
        reason: `Battery projected to be low (${projectedBatteryLevel.toFixed(1)}%) at delivery.`
      });
    }

    return alerts;
  }

  private detectHarshBraking(gyroscopeData: { x: number; y: number; z: number; timestamp: number }[]): boolean {
    if (!gyroscopeData || gyroscopeData.length < 2) return false;

    for (let i = 1; i < gyroscopeData.length; i++) {
      const prev = gyroscopeData[i - 1];
      const curr = gyroscopeData[i];
      
      const dt = (curr.timestamp - prev.timestamp) / 1000; // time delta in seconds
      if (dt <= 0) continue;

      // Calculate magnitude change rate
      const magnitudePrev = Math.sqrt(prev.x * prev.x + prev.y * prev.y + prev.z * prev.z);
      const magnitudeCurr = Math.sqrt(curr.x * curr.x + curr.y * curr.y + curr.z * curr.z);

      const deltaM = Math.abs(magnitudeCurr - magnitudePrev);
      const rateOfChange = deltaM / dt;

      if (rateOfChange > RiderTelematicsEngine.HARSH_BRAKING_THRESHOLD) {
        return true;
      }
    }
    return false;
  }
}
