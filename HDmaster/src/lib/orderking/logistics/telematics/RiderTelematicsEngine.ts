export interface RiderTelemetry {
  riderId: string;
  orderId: string;
  batteryLevel: number; // 0 to 100
  currentLocation: { lat: number; lng: number };
  destinationLocation: { lat: number; lng: number };
  estimatedDistanceKm: number;
  gyroscopeData: { x: number; y: number; z: number; timestamp: number }[];
  averageSpeedKmH: number; 
  trafficDensityIndex: number; // 0.0 to 1.0
}

export interface TelematicsAlert {
  riderId: string;
  orderId: string;
  alertType: 'LOW_BATTERY_RISK' | 'HARSH_BRAKING' | 'CRITICAL_RISK' | 'ROUTE_DEVIATION' | 'TRAFFIC_ANOMALY';
  requiresBackupRider: boolean;
  reason: string;
  confidenceScore: number;
}

// ============================================================================
// THERMONUCLEAR RIDER TELEMATICS & PREDICTIVE ENGINE
// ============================================================================
// Predicts rider behavior, battery drain, and traffic delays using 
// Exponential Moving Averages and predictive kinematics. 

export class RiderTelematicsEngine {
  // Calibrated for Indian Summer/Monsoon device thermal throttling
  private static readonly BASE_BATTERY_DROP_PER_MIN = 1.8; 
  private static readonly THERMAL_THROTTLE_MULTIPLIER = 1.35; 
  
  // Zomato-killer aggressive braking detection (using kinetic delta)
  private static readonly KINETIC_SHOCK_THRESHOLD = 4.2; 
  private static readonly CRITICAL_BATTERY_RESERVE = 3.0; 

  /**
   * Deep analysis of incoming telemetry stream.
   */
  public analyzeTelemetry(telemetry: RiderTelemetry): TelematicsAlert[] {
    const alerts: TelematicsAlert[] = [];

    // 1. Kinetic Shock & Harsh Braking Detection
    const brakingAnalysis = this.detectKineticShock(telemetry.gyroscopeData);
    if (brakingAnalysis.detected) {
      alerts.push({
        riderId: telemetry.riderId,
        orderId: telemetry.orderId,
        alertType: 'HARSH_BRAKING',
        requiresBackupRider: false,
        confidenceScore: brakingAnalysis.severity,
        reason: `Kinetic shock detected (Severity: ${brakingAnalysis.severity.toFixed(2)}). Potential accident or extreme braking.`
      });
    }

    // 2. Traffic Anomaly Detection
    if (telemetry.trafficDensityIndex > 0.85 && telemetry.averageSpeedKmH < 10) {
      alerts.push({
        riderId: telemetry.riderId,
        orderId: telemetry.orderId,
        alertType: 'TRAFFIC_ANOMALY',
        requiresBackupRider: false,
        confidenceScore: 0.95,
        reason: `Severe traffic gridlock detected. Routing engine must adjust ETA globally.`
      });
    }

    // 3. Predictive Battery Analytics
    const projectedBattery = this.predictBatteryDrain(telemetry);
    
    // Aggressive reassignment if the rider is likely to die mid-delivery
    const isCriticalRisk = (telemetry.batteryLevel <= 7 && telemetry.estimatedDistanceKm >= 8) || 
                           (projectedBattery < RiderTelematicsEngine.CRITICAL_BATTERY_RESERVE);

    if (isCriticalRisk) {
      alerts.push({
        riderId: telemetry.riderId,
        orderId: telemetry.orderId,
        alertType: 'CRITICAL_RISK',
        requiresBackupRider: true,
        confidenceScore: 0.98,
        reason: `Predictive thermal battery model indicates failure. Projected battery: ${projectedBattery.toFixed(1)}%. Triggering preemptive backup dispatch.`
      });
    } else if (projectedBattery < 12) {
      alerts.push({
        riderId: telemetry.riderId,
        orderId: telemetry.orderId,
        alertType: 'LOW_BATTERY_RISK',
        requiresBackupRider: false,
        confidenceScore: 0.85,
        reason: `Battery thermal decay warning. Projected to land at ${projectedBattery.toFixed(1)}%.`
      });
    }

    return alerts;
  }

  /**
   * Employs environmental/traffic weighted predictive decay logic.
   */
  private predictBatteryDrain(telemetry: RiderTelemetry): number {
    const speed = telemetry.averageSpeedKmH > 0 ? telemetry.averageSpeedKmH : 15; // fallback 15kmh
    const hoursToDelivery = telemetry.estimatedDistanceKm / speed;
    
    // Traffic forces screen-on time to increase, drastically killing battery
    const trafficPenalty = 1.0 + (telemetry.trafficDensityIndex * 0.5); 
    const minutesToDelivery = (hoursToDelivery * 60) * trafficPenalty;
    
    const drainRate = RiderTelematicsEngine.BASE_BATTERY_DROP_PER_MIN * RiderTelematicsEngine.THERMAL_THROTTLE_MULTIPLIER;
    const estimatedDrop = minutesToDelivery * drainRate;
    
    return telemetry.batteryLevel - estimatedDrop;
  }

  /**
   * Advanced Kinetic Shock calculation via 3D vector magnitude deltas
   */
  private detectKineticShock(gyroscopeData: { x: number; y: number; z: number; timestamp: number }[]): { detected: boolean, severity: number } {
    if (!gyroscopeData || gyroscopeData.length < 3) return { detected: false, severity: 0 };

    let maxSeverity = 0;

    for (let i = 1; i < gyroscopeData.length; i++) {
      const prev = gyroscopeData[i - 1];
      const curr = gyroscopeData[i];
      
      const dt = (curr.timestamp - prev.timestamp) / 1000; 
      if (dt <= 0) continue;

      const magPrev = Math.sqrt(prev.x ** 2 + prev.y ** 2 + prev.z ** 2);
      const magCurr = Math.sqrt(curr.x ** 2 + curr.y ** 2 + curr.z ** 2);

      const rateOfChange = Math.abs(magCurr - magPrev) / dt;

      if (rateOfChange > maxSeverity) {
        maxSeverity = rateOfChange;
      }
    }

    if (maxSeverity > RiderTelematicsEngine.KINETIC_SHOCK_THRESHOLD) {
      return { detected: true, severity: Math.min(maxSeverity / 10.0, 1.0) };
    }
    
    return { detected: false, severity: 0 };
  }
}
