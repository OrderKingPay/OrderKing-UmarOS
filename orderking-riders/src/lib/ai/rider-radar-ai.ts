// Rider Radar AI: Sovereign Dispatch, Weather Surge, & Earnings Engine

export interface RiderDispatchInstruction {
  stepNumber: number;
  headline: string;
  spokenGuidance: string;
  actionRequired: "NAVIGATE_TO_KITCHEN" | "VERIFY_PICKUP_OTP" | "RIDE_TO_CUSTOMER" | "CONTACTLESS_DROP";
}

export interface RainSurgeAssessment {
  isRainSurgeActive: boolean;
  surgeBonusPaise: number; // e.g. 2500 paise = ₹25.00
  weatherCondition: "CLEAR" | "DRIZZLE" | "HEAVY_RAIN" | "MONSOON_STORM";
  roadSafetySpeedLimitKmh: number;
  acousticAlertText: string;
}

export interface EarningsOptimalGuidance {
  completedTripsToday: number;
  todayNetPaise: number;
  nextMilestoneRemainingTrips: number;
  nextMilestoneBonusPaise: number;
  pendingCodFloatPaise: number;
  codHeadroomRemainingPaise: number; // ₹2,500 statutory limit
  payoutAdvice: string;
}

export class RiderRadarAiSovereign {
  private static readonly COD_LIMIT_PAISE = 250_000; // ₹2,500 limit

  /**
   * 1. Voice-assisted dispatch instructions based on active delivery state
   */
  public generateDispatchVoiceInstructions(
    orderCode: string,
    state: "ASSIGNED" | "ARRIVED_STORE" | "PICKED_UP" | "ARRIVED_CUSTOMER",
    restaurantName: string,
    customerArea: string,
    otpCode?: string
  ): RiderDispatchInstruction {
    switch (state) {
      case "ASSIGNED":
        return {
          stepNumber: 1,
          headline: `Navigate to ${restaurantName}`,
          spokenGuidance: `Order #${orderCode} accepted. Head directly to ${restaurantName}. Park safely and tap Arrived at Store when at the pickup counter.`,
          actionRequired: "NAVIGATE_TO_KITCHEN",
        };
      case "ARRIVED_STORE":
        return {
          stepNumber: 2,
          headline: `Verify Order #${orderCode} & Pickup`,
          spokenGuidance: `At ${restaurantName}: Check customer thermal seal. Match item list and verify 4-digit pickup code before sliding to confirm pickup.`,
          actionRequired: "VERIFY_PICKUP_OTP",
        };
      case "PICKED_UP":
        return {
          stepNumber: 3,
          headline: `Transit to ${customerArea}`,
          spokenGuidance: `Delivery in transit towards ${customerArea}. Follow live GPS route. Do not rush; maintain safe riding speeds.`,
          actionRequired: "RIDE_TO_CUSTOMER",
        };
      case "ARRIVED_CUSTOMER":
        return {
          stepNumber: 4,
          headline: `Handover & Contact Customer`,
          spokenGuidance: `Arrived at customer location. Ring doorbell once. Customer OTP verification required${otpCode ? `: Code is ${otpCode}` : ""}.`,
          actionRequired: "CONTACTLESS_DROP",
        };
    }
  }

  /**
   * 2. Rain surge alerts & road safety throttling
   */
  public evaluateRainSurge(
    ambientRainState: boolean,
    hourlyPrecipitationMm: number
  ): RainSurgeAssessment {
    if (!ambientRainState && hourlyPrecipitationMm < 1) {
      return {
        isRainSurgeActive: false,
        surgeBonusPaise: 0,
        weatherCondition: "CLEAR",
        roadSafetySpeedLimitKmh: 35,
        acousticAlertText: "Clear weather conditions. Standard delivery compensation active.",
      };
    }

    const isSevere = hourlyPrecipitationMm > 15;
    const bonusPaise = isSevere ? 3500 : 2500; // ₹35 or ₹25 per drop

    return {
      isRainSurgeActive: true,
      surgeBonusPaise: bonusPaise,
      weatherCondition: isSevere ? "MONSOON_STORM" : "HEAVY_RAIN",
      roadSafetySpeedLimitKmh: 20, // Strict wet surface safety limit
      acousticAlertText: `Rain Surge Active! Additional ₹${(bonusPaise / 100).toFixed(2)} bonus credited per completed drop. Drive carefully on wet roads.`,
    };
  }

  /**
   * 3. Optimal earnings guidance & milestone tracking
   */
  public computeOptimalEarnings(
    completedTrips: number,
    todayNetPaise: number,
    pendingCodPaise: number
  ): EarningsOptimalGuidance {
    let nextMilestoneRemainingTrips = 0;
    let nextMilestoneBonusPaise = 0;

    if (completedTrips < 8) {
      nextMilestoneRemainingTrips = 8 - completedTrips;
      nextMilestoneBonusPaise = 10_000; // +₹100
    } else if (completedTrips < 14) {
      nextMilestoneRemainingTrips = 14 - completedTrips;
      nextMilestoneBonusPaise = 22_000; // +₹220
    } else if (completedTrips < 20) {
      nextMilestoneRemainingTrips = 20 - completedTrips;
      nextMilestoneBonusPaise = 40_000; // +₹400
    }

    const codHeadroomRemainingPaise = Math.max(
      0,
      RiderRadarAiSovereign.COD_LIMIT_PAISE - pendingCodPaise
    );

    const advice =
      codHeadroomRemainingPaise < 30_000
        ? "⚠️ Warning: You have collected ₹" +
          (pendingCodPaise / 100).toFixed(2) +
          " in COD cash. Deposit via UPI to avoid dispatch lock."
        : `You are ${nextMilestoneRemainingTrips} trips away from an extra ₹${(nextMilestoneBonusPaise / 100).toFixed(2)} milestone bonus!`;

    return {
      completedTripsToday: completedTrips,
      todayNetPaise,
      nextMilestoneRemainingTrips,
      nextMilestoneBonusPaise,
      pendingCodFloatPaise: pendingCodPaise,
      codHeadroomRemainingPaise,
      payoutAdvice: advice,
    };
  }
}

export const riderRadarAi = new RiderRadarAiSovereign();
