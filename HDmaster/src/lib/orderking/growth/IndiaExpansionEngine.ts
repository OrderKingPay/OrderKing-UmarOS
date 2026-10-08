import { ViralDistributionEngine } from './ViralDistributionEngine.ts';
import { ReferralRewardCalculator, CustomerLTVStats, RestaurantLTVStats } from './ReferralRewardCalculator.ts';

// --- Production-Ready Types & Interfaces ---
export type PincodeTier = 'TIER_1' | 'TIER_2' | 'TIER_3';
export type RegionalLanguage = 'en' | 'hi' | 'ta' | 'te' | 'mr' | 'bn' | 'kn' | 'gu';

export interface PinCodeMetrics {
  pincode: string;
  waitlistedCustomers: number;
  interestedRestaurants: number;
  availableRiders: number;
  tier: PincodeTier;
  primaryLanguage: RegionalLanguage;
  averageLocalAOV_INR: number;
}

export interface WaitlistProgress {
  pincode: string;
  isUnlocked: boolean;
  customerProgressPct: number;
  restaurantProgressPct: number;
  riderProgressPct: number;
  overallProgressPct: number;
  missingCustomers: number;
  missingRestaurants: number;
  missingRiders: number;
}

// --- Dynamic Thresholds Based on Density & Economics ---
const TIER_THRESHOLDS = {
  TIER_1: { CUSTOMERS: 1000, RESTAURANTS: 30, RIDERS: 50 }, // e.g., Mumbai, BLR, Delhi
  TIER_2: { CUSTOMERS: 500, RESTAURANTS: 15, RIDERS: 25 },  // e.g., Jaipur, Indore, Surat
  TIER_3: { CUSTOMERS: 250, RESTAURANTS: 8, RIDERS: 10 },   // e.g., Small towns (high virgin market potential)
};

const LOCALIZED_TEMPLATES: Record<RegionalLanguage, (refereeReward: number, pincode: string, progress: number, url: string) => string> = {
  en: (reward, pin, prog, url) => `Drop the 30% markup apps. We are bringing OrderKing to ${pin}! We are ${prog}% unlocked. Sign up here to push us to 100% and we both get ₹${reward} direct to UPI upon launch! 🚀🍔 ${url}`,
  hi: (reward, pin, prog, url) => `Zomato/Swiggy ko chhodo! Hum ${pin} me OrderKing la rahe hain. Area ${prog}% unlock ho chuka hai. Link se sign up karo, launch par hum dono ko ₹${reward} UPI me milenge! 🚀🍔 ${url}`,
  ta: (reward, pin, prog, url) => `Zomato/Swiggy ஐ விடுங்கள்! ${pin} இல் OrderKing ஐக் கொண்டு வருகிறோம். ${prog}% திறக்கப்பட்டுவிட்டது. இப்போதே இணையுங்கள், ₹${reward} UPI இல் பெறுங்கள்! 🚀🍔 ${url}`,
  te: (reward, pin, prog, url) => `Zomato/Swiggy వదిలేయండి! మేము ${pin} లో OrderKing తెస్తున్నాము. ${prog}% అన్‌లాక్ అయింది. లింక్ ద్వారా చేరండి, ₹${reward} UPI పొందండి! 🚀🍔 ${url}`,
  mr: (reward, pin, prog, url) => `Zomato/Swiggy सोडा! आम्ही ${pin} मध्ये OrderKing आणत आहोत. ${prog}% अनलॉक झाले आहे. आत्ताच साइन अप करा आणि ₹${reward} UPI मिळवा! 🚀🍔 ${url}`,
  bn: (reward, pin, prog, url) => `Zomato/Swiggy ছাড়ুন! আমরা ${pin} এ OrderKing আনছি। ${prog}% আনলক হয়েছে। সাইন আপ করুন এবং ₹${reward} UPI পান! 🚀🍔 ${url}`,
  kn: (reward, pin, prog, url) => `Zomato/Swiggy ಬಿಡಿ! ನಾವು ${pin} ಗೆ OrderKing ತರುತ್ತಿದ್ದೇವೆ. ${prog}% ಅನ್‌ಲಾಕ್ ಆಗಿದೆ. ಈಗಲೇ ಸೇರಿ, ₹${reward} UPI ಪಡೆಯಿರಿ! 🚀🍔 ${url}`,
  gu: (reward, pin, prog, url) => `Zomato/Swiggy છોડો! અમે ${pin} માં OrderKing લાવી રહ્યા છીએ. ${prog}% અનલૉક થયું છે. સાઇન અપ કરો અને ₹${reward} UPI મેળવો! 🚀🍔 ${url}`,
};

export class IndiaExpansionEngine {
  private viralEngine: ViralDistributionEngine;
  private rewardCalculator: ReferralRewardCalculator;
  
  // Zomato/Swiggy exploit: They charge 25-30%. We charge a hyper-competitive flat 5% or zero-commission SaaS.
  private readonly COMPETITIVE_PLATFORM_FEE = 0.05; 
  private readonly MICRO_FRANCHISE_CUT = 0.02; // 2% perpetual cut of AOV to the influencer

  constructor(baseUrl: string = 'https://orderking.in') {
    this.viralEngine = new ViralDistributionEngine(baseUrl);
    this.rewardCalculator = new ReferralRewardCalculator();
  }

  /**
   * Evaluates if a specific pincode in India is ready for autonomous launch.
   * Utilizes density-based dynamic tiering rather than static numbers.
   */
  public evaluateAutonomousLaunch(metrics: PinCodeMetrics): WaitlistProgress {
    const thresholds = TIER_THRESHOLDS[metrics.tier];
    
    const missingCustomers = Math.max(0, thresholds.CUSTOMERS - metrics.waitlistedCustomers);
    const missingRestaurants = Math.max(0, thresholds.RESTAURANTS - metrics.interestedRestaurants);
    const missingRiders = Math.max(0, thresholds.RIDERS - metrics.availableRiders);

    const customerProgressPct = Math.min(100, (metrics.waitlistedCustomers / thresholds.CUSTOMERS) * 100);
    const restaurantProgressPct = Math.min(100, (metrics.interestedRestaurants / thresholds.RESTAURANTS) * 100);
    const riderProgressPct = Math.min(100, (metrics.availableRiders / thresholds.RIDERS) * 100);

    const overallProgressPct = Math.floor((customerProgressPct + restaurantProgressPct + riderProgressPct) / 3);
    const isUnlocked = missingCustomers === 0 && missingRestaurants === 0 && missingRiders === 0;

    return {
      pincode: metrics.pincode,
      isUnlocked,
      customerProgressPct,
      restaurantProgressPct,
      riderProgressPct,
      overallProgressPct,
      missingCustomers,
      missingRestaurants,
      missingRiders
    };
  }

  /**
   * Generates a deeply localized, gamified WhatsApp viral loop campaign.
   * Leverages FOMO (progress %) and exact regional languages for maximum viral coefficient.
   */
  public generateLocalizedWhatsAppLoop(
    metrics: PinCodeMetrics, 
    referrerId: string, 
    ltvStats: CustomerLTVStats
  ): { url: string, message: string, expectedRewardINR: number } {
    
    // Ensure we are working with localized economics
    const invite = this.viralEngine.generateCustomerInvite(referrerId, ltvStats, `pincode_fomo_${metrics.pincode}`, 'whatsapp');
    
    const progress = this.evaluateAutonomousLaunch(metrics);
    const template = LOCALIZED_TEMPLATES[metrics.primaryLanguage] || LOCALIZED_TEMPLATES['en'];
    
    // Round to standard INR denominations (no decimals in viral messaging)
    const roundedReward = Math.floor(invite.refereeReward);
    const message = template(roundedReward, metrics.pincode, progress.overallProgressPct, invite.url);
    
    return {
      url: `https://wa.me/?text=${encodeURIComponent(message)}`,
      message,
      expectedRewardINR: roundedReward
    };
  }

  /**
   * Automates the onboarding of local food vloggers on Instagram/YouTube.
   * EXPLOIT: Instead of one-time referral, offers them a Micro-Franchisee smart contract.
   * They get a perpetual 2% cut of the GMV of any restaurant they bring online.
   */
  public generateMicroFranchiseOffer(influencerId: string, metrics: PinCodeMetrics, restaurantLtvStats: RestaurantLTVStats) {
    const invite = this.viralEngine.generateRestaurantInvite(influencerId, restaurantLtvStats, `micro_franchise_${metrics.pincode}`, 'instagram_b2b');

    // Calculate real financial upside to guarantee conversion.
    // Assuming 5% platform fee, influencer gets 2% perpetual.
    const averageMonthlyGMV = restaurantLtvStats.averageMonthlyRevenue;
    const monthlyInfluencerCutPerRest = averageMonthlyGMV * this.MICRO_FRANCHISE_CUT;

    return {
      influencerId,
      targetPincode: metrics.pincode,
      franchiseLink: invite.url,
      businessPitch: `Zomato takes 25%. We take 5%. Onboard your favorite eateries in ${metrics.pincode} to OrderKing. We save them 20%, and pay YOU a perpetual 2% of their total GMV.`,
      estimatedMonthlyPassiveIncomePerRestaurantINR: Math.floor(monthlyInfluencerCutPerRest),
      platformCompetitiveAdvantage: '2000bps margin improvement for restaurants',
    };
  }
}
