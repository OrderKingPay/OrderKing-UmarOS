/**
 * OrderKing x UmarOS: 5-Day Hyperlocal Launch Playbook & Field Operations Engine
 * 
 * Target: 20 Live Restaurants, 15 Verified Delivery Partners, 500 Local Customer Leads
 * Radius: 3km Hyperlocal Cluster (1km dense core expanding to 3-4km perimeter)
 * 
 * ALL monetary math is strictly executed in integer PAISE (1 INR = 100 Paise).
 * ZERO generic fluff, ZERO floating-point currency drift, 100% ground-truth operational realism.
 */

// ---------------------------------------------------------------------------
// 1. Core Interfaces and Domain Types
// ---------------------------------------------------------------------------

export type MerchantCategory = "ANCHOR_RESTAURANT" | "STANDALONE_RESTAURANT" | "CLOUD_KITCHEN";

export interface ClusterConfig {
  id: string;
  name: string;
  city: string;
  pinCode: string;
  coreRadiusKm: number; // typically 1.0 km core
  maxRadiusKm: number;  // typically 3.0 to 4.0 km
  targetRestaurants: number; // 20
  targetRiders: number;      // 15
  targetCustomerLeads: number; // 500
  launchBudgetMinPaise: number; // 6,500,000 paise (₹65,000)
  launchBudgetStandardPaise: number; // 8,500,000 paise (₹85,000)
  launchBudgetMaxPaise: number; // 9,500,000 paise (₹95,000)
}

export interface DayTargetQuota {
  day: number;
  cumulativeRestaurants: number;
  cumulativeRiders: number;
  cumulativeCustomerLeads: number;
  dailyRestaurantTarget: number;
  dailyRiderTarget: number;
  dailyCustomerTarget: number;
  focusArea: string;
}

export interface CommercialOfferTier {
  category: MerchantCategory;
  name: string;
  commissionBps: number; // Basis points: 1600 = 16%, 2000 = 20%, 2200 = 22%, 2500 = 25%
  commissionPct: number;
  settlementTerms: "T+1 Daily Auto-Bank Transfer" | "T+2 Verified Batch";
  onboardingFeePaise: number; // 0 paise
  hardwareCompulsion: "Zero Hardware Compulsion (BYO Phone & BT Printer)";
  keySellingPoint: string;
  competitorComparison: string;
}

export interface WalkInScriptStage {
  stage: string;
  timeRangeMinutes: string;
  goal: string;
  englishScript: string;
  hinglishScript: string;
  fieldActionNote: string;
}

export interface ObjectionCounter {
  id: string;
  objectionTitle: string;
  merchantPainPoint: string;
  founderResponseEnglish: string;
  founderResponseHinglish: string;
  operationalCommitment: string;
  fieldMove: string;
}

export interface RestaurantBattlecard {
  commercialTiers: Record<MerchantCategory, CommercialOfferTier>;
  walkInScript: WalkInScriptStage[];
  objections: ObjectionCounter[];
  mandatoryActivationChecklist: string[];
}

export interface RiderPayStructure {
  shiftDurationHours: number; // 8
  dailyFloorGuaranteePaise: number; // 50,000 paise (₹500)
  floorQualificationCondition: string; // "Completed 4 assigned orders OR 6 peak on-duty hours with >=90% acceptance"
  baseFarePaise: number; // 2,500 paise (₹25)
  baseDistanceThresholdKm: number; // 2.0 km
  perKmRateBeyondThresholdPaise: number; // 850 paise (₹8.50/km)
  perKmRateStandardPaise: number; // 850 paise (₹8.50/km)
  weatherSurgeBonusPaise: number; // 1,500 paise (₹15)
  pickupTravelAllowancePerKmPaise: number; // 850 paise for pickup > 1km
  kitDepositModel: {
    totalCostPaise: number; // 120,000 paise (₹1,200) for full kit / 50,000 paise (₹500) for standard bag
    upfrontDeductionPaise: number; // 0 paise
    dailyDeductionPaise: number; // 5,000 paise (₹50/day)
    startDeductionDay: number; // Day 4 onwards
    maxDaysAmortization: number; // 24 days (for ₹1200) or 10 days (for ₹500)
    safeguardRule: string; // Deduct ONLY if rider earnings strictly exceed the daily net floor
    returnableOption: string; // 100% free returnable kit option with zero deductions on exit
  };
}

export interface RiderRecruitmentPlan {
  payStructure: RiderPayStructure;
  shiftRoster15: {
    lunchPrimaryRiders: number; // 5
    dinnerPrimaryRiders: number; // 7
    peakReserves: number;       // 2
    flexibleFloatingBackup: number; // 1
    totalFleetSize: number;     // 15
  };
  pitchScriptHinglish: string;
  pitchScriptEnglish: string;
  targetLocations: string[];
  kycVerificationChecklist: string[];
}

export interface CustomerLaunchPlan {
  promotionalOffer: {
    couponCode: string; // "LOCAL40"
    discountPaise: number; // 4,000 paise (₹40 FLAT OFF)
    minOrderValuePaise: number; // 14,900 paise (₹149 minimum) or 29,900 paise (₹299)
    freeDeliveryOrdersCount: number; // First 2 orders
    redemptionCapPerCluster: number; // 100 first eligible orders
    budgetCapPaise: number; // 400,000 paise (₹4,000)
  };
  whatsAppBroadcastCopy: {
    customerDirectHinglish: string;
    customerDirectEnglish: string;
    merchantRiderReferralHinglish: string;
  };
  qrTentCardCopy: {
    tableTentHeadline: string;
    tableTentBody: string;
    counterCallToAction: string;
    staff15SecScript: string;
  };
  acquisitionChannels: {
    channel: string;
    targetLeads: number;
    method: string;
  }[];
}

export interface HourlyChecklistItem {
  timeSlot: string;
  taskTitle: string;
  operationalDetail: string;
  ownerRole: "Founder" | "Merchant Executive" | "Rider Captain" | "Customer Promoter" | "All";
  deliverable: string;
}

export interface StreetTimetableDay {
  dayNumber: number;
  dayTitle: string;
  primaryStrategicObjective: string;
  restaurantQuota: number;
  riderQuota: number;
  customerLeadQuota: number;
  schedule: HourlyChecklistItem[];
  endOfDayReconciliationAudit: string[];
}

export interface LaunchCashEnvelopeItem {
  id: string;
  item: string;
  category: "FLEET_GUARANTEE" | "KITS" | "CUSTOMER_SUBSIDY" | "FIELD_STAFF" | "MARKETING_COLLATERAL" | "CONTINGENCY";
  standardBudgetPaise: number;
  leanBudgetPaise: number;
  scaleBudgetPaise: number;
  basis: string;
  notes: string;
}

export interface LaunchCashEnvelope {
  summary: {
    leanTotalPaise: number;     // ₹65,000
    standardTotalPaise: number; // ₹85,000
    scaleTotalPaise: number;    // ₹95,000
  };
  items: LaunchCashEnvelopeItem[];
}

// ---------------------------------------------------------------------------
// 2. Pure Mathematical Calculator Types & Functions
// ---------------------------------------------------------------------------

export interface OrderEconomicsInput {
  foodSubtotalPaise: number;
  commissionRateBps: number; // e.g. 2200 for 22%, 1600 for 16%
  deliveryDistanceKm: number;
  customerDeliveryFeePaise?: number; // e.g. 2,900 paise (₹29) or 0 if promo
  customerDiscountPaise?: number; // e.g. 4,000 paise (₹40)
  platformFundedDiscountPaise?: number; // e.g. 4,000 paise
  restaurantFundedDiscountPaise?: number; // e.g. 0 paise
  weatherSurgePaise?: number; // e.g. 1,500 paise (₹15) or 0
  baseFarePaise?: number; // default 2,500 paise
  baseDistanceThresholdKm?: number; // default 2.0 km
  perKmRateBeyondThresholdPaise?: number; // default 850 paise
  pickupExcessKm?: number; // pickup distance beyond 1km
  gstRateBps?: number; // default 1800 (18% on platform commission)
  tdsRateBps?: number; // default 10 (0.1% TDS u/s 194-O)
}

export interface OrderEconomicsOutput {
  foodSubtotalPaise: number;
  // Merchant Breakdown
  merchantCommissionPaise: number;
  gstOnCommissionPaise: number;
  tdsSection194OPaise: number;
  restaurantFundedDiscountPaise: number;
  totalMerchantDeductionsPaise: number;
  netMerchantPayablePaise: number;
  // Rider Payout Breakdown
  riderBaseFarePaise: number;
  riderDistanceFarePaise: number;
  riderPickupExcessFarePaise: number;
  riderWeatherSurgePaise: number;
  riderGrossPayoutPaise: number;
  // Platform Inflow & Outflow
  customerDeliveryFeePaise: number;
  platformFundedDiscountPaise: number;
  grossPlatformInflowPaise: number; // commission + customer delivery fee
  grossPlatformOutflowPaise: number; // rider payout + platform discount
  platformContributionMarginPaise: number; // gross inflow - gross outflow
  platformMarginPctOfFood: number; // percentage
}

export interface RiderShiftEconomicsInput {
  shiftHours: number;
  dailyFloorGuaranteePaise?: number; // default 50,000 paise (₹500)
  completedDeliveries: {
    distanceKm: number;
    weatherSurge?: boolean;
    pickupExcessKm?: number;
  }[];
  kitDeductionActive?: boolean;
  kitDailyDeductionPaise?: number; // default 5,000 paise (₹50)
  dayNumber?: number; // if < 4, kit deduction is 0
}

export interface RiderShiftEconomicsOutput {
  totalOrdersDelivered: number;
  grossOrderEarningsPaise: number;
  dailyFloorGuaranteePaise: number;
  guaranteeTopUpPaise: number;
  grossShiftEarningsPaise: number;
  kitDeductionAppliedPaise: number;
  netTakeHomePayoutPaise: number;
  averageEarningPerDeliveryPaise: number;
}

export interface MerchantEconomicsComparison {
  orderSubtotalPaise: number;
  orderKingCommissionRateBps: number;
  competitorCommissionRateBps: number; // e.g. 3000 (30%)
  orderKingNetPayoutPaise: number;
  competitorNetPayoutPaise: number;
  merchantSavingsPerOrderPaise: number;
  projectedMonthlySavings300OrdersPaise: number;
}

// ---------------------------------------------------------------------------
// 3. Ground Truth Data & Constants
// ---------------------------------------------------------------------------

export const DEFAULT_CLUSTER_CONFIG: ClusterConfig = {
  id: "blr-hbr-01",
  name: "HBR Layout & Kalyan Nagar Dense Cluster",
  city: "Bengaluru",
  pinCode: "560043",
  coreRadiusKm: 1.0,
  maxRadiusKm: 3.5,
  targetRestaurants: 20,
  targetRiders: 15,
  targetCustomerLeads: 500,
  launchBudgetMinPaise: 6500000,      // ₹65,000
  launchBudgetStandardPaise: 8500000, // ₹85,000
  launchBudgetMaxPaise: 9500000,      // ₹95,000
};

export const FIVE_DAY_CUMULATIVE_QUOTAS: DayTargetQuota[] = [
  {
    day: 1,
    cumulativeRestaurants: 3,
    cumulativeRiders: 4,
    cumulativeCustomerLeads: 40,
    dailyRestaurantTarget: 3,
    dailyRiderTarget: 4,
    dailyCustomerTarget: 40,
    focusArea: "Prove the First Loop: 3 anchor kitchens, 4 verified riders, real-money end-to-end delivery test",
  },
  {
    day: 2,
    cumulativeRestaurants: 7,
    cumulativeRiders: 7,
    cumulativeCustomerLeads: 120,
    dailyRestaurantTarget: 4,
    dailyRiderTarget: 3,
    dailyCustomerTarget: 80,
    focusArea: "Build Dense Street Spine: 7 complementary cuisines, QR cards installed, log all owner objections",
  },
  {
    day: 3,
    cumulativeRestaurants: 12,
    cumulativeRiders: 10,
    cumulativeCustomerLeads: 240,
    dailyRestaurantTarget: 5,
    dailyRiderTarget: 3,
    dailyCustomerTarget: 120,
    focusArea: "Fix Service Failure & Bottlenecks: Audit print latency, preparation delays, correct pin drops",
  },
  {
    day: 4,
    cumulativeRestaurants: 16,
    cumulativeRiders: 13,
    cumulativeCustomerLeads: 370,
    dailyRestaurantTarget: 4,
    dailyRiderTarget: 3,
    dailyCustomerTarget: 130,
    focusArea: "Fill Daypart & Cuisine Gaps: Add breakfast/late-night anchors, standby riders, society group opt-ins",
  },
  {
    day: 5,
    cumulativeRestaurants: 20,
    cumulativeRiders: 15,
    cumulativeCustomerLeads: 500,
    dailyRestaurantTarget: 4,
    dailyRiderTarget: 2,
    dailyCustomerTarget: 130,
    focusArea: "Lock Fleet & Validate Real Repeat: Reconcile all T+1 payments, personal founder checks on merchant/rider delight",
  },
];

export const COMMERCIAL_TIERS: Record<MerchantCategory, CommercialOfferTier> = {
  ANCHOR_RESTAURANT: {
    category: "ANCHOR_RESTAURANT",
    name: "Strategic Anchor Partner",
    commissionBps: 1600, // 16%
    commissionPct: 16,
    settlementTerms: "T+1 Daily Auto-Bank Transfer",
    onboardingFeePaise: 0,
    hardwareCompulsion: "Zero Hardware Compulsion (BYO Phone & BT Printer)",
    keySellingPoint: "Special low 16% rate for strategic volume anchors driving local demand.",
    competitorComparison: "Legacy aggregators charge 28-32% with delayed weekly settlements. OrderKing saves ~12-16% margin with T+1 payouts.",
  },
  CLOUD_KITCHEN: {
    category: "CLOUD_KITCHEN",
    name: "Cloud Kitchen Operator",
    commissionBps: 2000, // 20%
    commissionPct: 20,
    settlementTerms: "T+1 Daily Auto-Bank Transfer",
    onboardingFeePaise: 0,
    hardwareCompulsion: "Zero Hardware Compulsion (BYO Phone & BT Printer)",
    keySellingPoint: "Kitchen-first direct Bluetooth thermal order printing without buying another proprietary terminal.",
    competitorComparison: "Avoid 25-30% aggregator commission and forced marketing packages. Transparent 20% with full customer data ownership.",
  },
  STANDALONE_RESTAURANT: {
    category: "STANDALONE_RESTAURANT",
    name: "Standalone Dine-in & Takeaway",
    commissionBps: 2200, // 22%
    commissionPct: 22,
    settlementTerms: "T+1 Daily Auto-Bank Transfer",
    onboardingFeePaise: 0,
    hardwareCompulsion: "Zero Hardware Compulsion (BYO Phone & BT Printer)",
    keySellingPoint: "Clear, written 22% non-exclusive rate card. Zero hidden commissions, zero onboarding fee, zero setup penalty.",
    competitorComparison: "Replaces opaque 28-32% commission plus mandatory ads. You keep an additional ₹20-₹30 per ₹300 order in your bank account.",
  },
};

export const RESTAURANT_WALK_IN_SCRIPT: WalkInScriptStage[] = [
  {
    stage: "Stage 1: Hook & Pain Discovery",
    timeRangeMinutes: "00:00–02:30 (3:30 PM Window)",
    goal: "Respect owner's post-lunch calm, establish non-threatening local presence, surface aggregator commission & payout frustration.",
    englishScript: `Good afternoon, boss. I'm building OrderKing right here for restaurants in this local area. I can see your lunch rush is over, so I'll only take two minutes initially.

I'm not here to ask you to stop existing delivery apps. Just one honest question: after commissions, deductions, sponsored ads and discounts, are you genuinely satisfied with what actually hits your bank account every week from online orders?

We are launching an additional sales channel with a simple, written rate card and live kitchen KOT printing on your existing phone. If it makes financial sense, we can do a small test trial.`,
    hinglishScript: `Hello bhaiya, main OrderKing ka founder hoon. Yahin local area mein food delivery start kar rahe hain. Lunch ka rush abhi khatam hua hoga, bas do minute lunga.

Aapse purane delivery apps band karwane nahi aaya hoon. Ek seedhi baat poochhun? Online order mein 28-30% commission, deductions aur customer discount ke baad jo haath mein paisa aata hai, kya aap usse satisfied hain?

Hum ek additional order channel de rahe hain. Rate pehle se written rahega—koi hidden deduction nahi. Aapko live demo dikha deta hoon. Pasand aaye toh chhota trial kar sakte hain.`,
    fieldActionNote: "Field Rule: Stop speaking immediately after asking the question. Let the owner vent about deductions, weekly payment holds, fake cancellations, or device rental fees. Frame the rest of the pitch around their exact stated pain.",
  },
  {
    stage: "Stage 2: Live POS & Bluetooth KOT Demonstration",
    timeRangeMinutes: "02:30–07:00",
    goal: "Demonstrate that zero new hardware is needed and prove real-time order receipt and thermal printer firing.",
    englishScript: `Our rate card is completely transparent: 22% for standalone restaurants, 20% for cloud kitchens, and 16% for anchor partners. 

You keep all existing platforms running. There is ₹0 joining fee, no lock-in contract, and absolutely no compulsion to buy our POS device. 

Watch this 30-second live test: I will place a real order from my phone right now. Your phone chimes immediately, you tap 'Accept', and your existing Bluetooth thermal printer automatically prints the KOT ticket with exact items and kitchen modifiers.`,
    hinglishScript: `Hamara commission card bilkul saaf hai: standalone restaurant ke liye 22%, cloud kitchen ke liye 20%, aur strategic anchor ke liye 16%.

Aapke purane delivery apps jaise chal rahe hain, waise hi chalenge. Joining fee zero hai. Koi naya hardware ya machine kharidne ki zaroorat nahi hai.

Dekhiye, main apne phone se live test order karta hoon. Aapke phone par ring bajegi, aap 'Accept' karenge, aur aapke existing Bluetooth printer par bina kisi jhanjhat ke KOT print nikal aayega.`,
    fieldActionNote: "Field Rule: Fire a live test order. Verify Bluetooth KOT prints with correct item names, customization notes, order number, and timestamp. If Bluetooth fails, demonstrate the instant on-screen kitchen display ticket.",
  },
  {
    stage: "Stage 3: Economics Comparison & Transparent Payout",
    timeRangeMinutes: "07:00–12:00",
    goal: "Prove on paper that the restaurant earns ₹25-₹30 more per order on OrderKing vs legacy aggregators.",
    englishScript: `Let's look at the real math on your standard ₹300 thali or biryani order before tax adjustments:

On legacy aggregators at 30% commission:
• Food Subtotal: ₹300.00
• Commission (30%): -₹90.00
• GST on Commission (18%): -₹16.20
• Gross deductions: ₹106.20 | Net to you: ~₹193.80

On OrderKing at 22% transparent commission:
• Food Subtotal: ₹300.00
• Commission (22%): -₹66.00
• GST on Commission (18%): -₹11.88
• Section 194-O TDS (0.1%): -₹0.30
• Net payable to your bank: ₹221.82

You save ₹28.02 extra pure cash on EVERY single ₹300 order. At 300 orders a month, that is over ₹8,400 in direct savings, credited T+1 daily into your bank account.`,
    hinglishScript: `Aapke ₹300 ke food order ka hisaab saamne dekh lijiye:

Legacy aggregator par 30% commission:
• Food order: ₹300
• Commission (30%): -₹90
• GST on Commission: -₹16.20
• Aapke haath mein aaya: ~₹193.80

OrderKing par 22% clear commission:
• Food order: ₹300
• Commission (22%): -₹66
• GST on Commission (18%): -₹11.88
• TDS 194-O (0.1%): -₹0.30
• Aapke bank account mein: ₹221.82

Har ek ₹300 ke order par aapko ₹28 zyada mil raha hai. Mahine mein 300 order hue toh ₹8,400 seedha aapka profit badha. Aur payment 7 din baad nahi, T+1 daily settlement se kal subah aapke bank mein aayegi.`,
    fieldActionNote: "Field Rule: Use the merchant's actual paper settlement sheet if they are willing to show it. Highlight how competitor 'marketing charges' and 'delays' erode their real margin.",
  },
  {
    stage: "Stage 4: Paper Agreement Close & Instant WhatsApp Confirmation",
    timeRangeMinutes: "12:00–15:00",
    goal: "Close on a low-commitment trial with top 8 hero items and send an official WhatsApp confirmation before leaving.",
    englishScript: `Boss, instead of a massive commitment, let's start with just your top 8 best-selling items.

We will keep your current apps running untouched. We test the kitchen notification and assign dedicated riders in this 3km cluster. There is zero setup fee.

Can we activate this trial with your approval right now? I will hand you the signed commercial agreement sheet and send an immediate confirmation to your official WhatsApp number.`,
    hinglishScript: `Bhaiya, bada risk mat lijiye. Pehle aapke 8 sabse popular, fast-moving items se shuru karte hain.

Purane apps band karne ki koi zaroorat nahi. Hum setup aur delivery test karenge. Registration ya onboarding fee ₹0 hai.

Aap agree karein toh abhi 5 minute mein trial activate kar dete hain. Commission, T+1 settlement aur terms main aapko written agreement mein sign karke aur WhatsApp par abhi bhej deta hoon.`,
    fieldActionNote: "Field Rule: Send the official WhatsApp confirmation from the verified OrderKing business line with the signed rate card, contact info, and escalation captain before walking out the door.",
  },
];

export const OBJECTION_COUNTERS: ObjectionCounter[] = [
  {
    id: "obj-already-have-apps",
    objectionTitle: "Already have existing food delivery apps. Don't want another machine.",
    merchantPainPoint: "Counter clutter, device fatigue, fear of upfront investment and double commissions.",
    founderResponseEnglish: `Completely understand, boss. You should definitely not buy another machine. 

We built OrderKing specifically so you do NOT need another bulky device. The merchant partner app runs smoothly on your existing Android phone, and kitchen tickets print directly through your existing Bluetooth printer. 

We are an additional sales channel, not a replacement. If you receive zero orders, you pay exactly ₹0. Can we run one demo order right now to verify?`,
    founderResponseHinglish: `Bilkul sahi bhaiya. Counter par ek aur machine rakhne ki zaroorat bilkul nahi hai. 

Humne OrderKing is tarah design kiya hai ki aapke existing Android phone par chalega aur KOT aapke existing Bluetooth printer se nikal aayega. 

Hum aapka extra order channel hain, purane apps ka replacement nahi. Agar din mein zero order aaya toh aapse ₹1 bhi nahi liya jayega. Ek demo order karke dekh lein?`,
    operationalCommitment: "Zero hardware required. Full compatibility with standard ESC/POS 58mm & 80mm Bluetooth printers and Android/iOS smartphones.",
    fieldMove: "Ask permission to pair their existing printer or use a 58mm pocket demo printer from the executive's kit. Never take the owner's phone without permission.",
  },
  {
    id: "obj-riders-wont-show-up",
    objectionTitle: "Riders won't show up. Customers will blame me for food getting cold.",
    merchantPainPoint: "Delivery unreliability, food spoiling on counter, angry customers giving 1-star reviews.",
    founderResponseEnglish: `That is the single most genuine risk in food delivery, boss. That is why we did not just build software—we deployed a dedicated physical fleet right here in this 3km cluster.

Our dispatch rule is strict:
1. We confirm a rider within 3 minutes of you accepting the order before you start heavy preparation.
2. If no rider accepts in 3 minutes, our dedicated Rider Captain is automatically alerted on ground.
3. At 5 minutes, if there is any delay, we notify both you and the customer with complete honesty.
4. If a delivery ever fails due to platform or rider delay, OrderKing absorbs 100% of the food cost. You never suffer a loss for our logistics failure.`,
    founderResponseHinglish: `Aapki baat 100% genuine hai bhaiya. Sabse bada dar yehi hota hai ki khana tayyar pada hai aur rider nahi aaya.

Isliye hum bina fleet ke launch nahi kar rahe. Is 3km cluster mein hamare 15 verified riders aur ek dedicated Rider Captain ground par rehte hain:
1. Jaise hi order aayega, 3 minute mein rider confirm hoga tabhi preparation shuru karni hai.
2. Agar 3 minute mein rider assign nahi hua, Rider Captain manually nearest rider dispatch karega.
3. Agar delivery mein hamari taraf se galti hui, toh khane ka poora paisa OrderKing aapko degi. Aapka 1 rupee ka bhi nuksaan nahi hoga.`,
    operationalCommitment: "3-minute rider assignment SLA, 5-minute captain manual dispatch override, 100% food waste compensation policy on platform delivery failures, 2 dedicated peak-hour standby riders.",
    fieldMove: "Introduce the Rider Captain in person or show the live rider GPS cluster on the founder app demonstrating 4+ active riders within 800 meters of their doorstep.",
  },
  {
    id: "obj-too-complicated-fees",
    objectionTitle: "Too complicated / I won't pay any onboarding or setup fees.",
    merchantPainPoint: "Fear of hidden charges, complex onboarding forms, and high upfront listing fees.",
    founderResponseEnglish: `Sir, our joining fee is strictly ₹0. We will not take a single rupee from you for registration, onboarding, or app setup.

There are no monthly subscription fees, no menu upload fees, and no compulsory marketing packages. 

Our commission is deducted only on completed, chargeable deliveries as per the signed agreement. We start with just your top 8 items, which takes less than 5 minutes to verify. Let me give you the signed rate card right now.`,
    founderResponseHinglish: `Sir, joining fee strictly ₹0 hai. Registration ya onboarding ke naam par aapse ek naya paisa nahi liya jayega.

Na koi monthly charge hai, na menu upload ka paisa, na koi mandatory ad pack.

Hamara commission sirf tabhi katega jab khana customer tak deliver hoga aur payment aayegi. Sirf 8 popular items se shuru karenge, 5 minute mein paper contract sign ho jata hai. Ye lijiye written agreement copy.`,
    operationalCommitment: "100% ₹0 onboarding fee guarantee. Paper contract signed in under 3 minutes. Zero mandatory promotional deductions.",
    fieldMove: "Hand over the physical physical 1-page paper agreement with large bold print: 'ONBOARDING FEE: ₹0.00' and 'COMMISSION: 22% FLAT'.",
  },
];

export const RIDER_RECRUITMENT_CONFIG: RiderRecruitmentPlan = {
  payStructure: {
    shiftDurationHours: 8,
    dailyFloorGuaranteePaise: 50000, // ₹500
    floorQualificationCondition: "Completed at least 4 assigned deliveries OR 6 on-duty peak hours with >=90% order acceptance rate",
    baseFarePaise: 2500, // ₹25 base
    baseDistanceThresholdKm: 2.0, // base covers up to 2km
    perKmRateBeyondThresholdPaise: 850, // ₹8.50/km beyond 2km
    perKmRateStandardPaise: 850, // ₹8.50/km
    weatherSurgeBonusPaise: 1500, // ₹15 weather surge
    pickupTravelAllowancePerKmPaise: 850, // ₹8.50/km for pickup distance > 1km
    kitDepositModel: {
      totalCostPaise: 120000, // ₹1,200 full kit (bag, t-shirt, rain jacket, phone mount)
      upfrontDeductionPaise: 0, // ₹0 upfront
      dailyDeductionPaise: 5000, // ₹50/day
      startDeductionDay: 4, // Day 4 onwards
      maxDaysAmortization: 24, // 24 active earning days
      safeguardRule: "Deduction of ₹50 occurs ONLY on days where gross earnings exceed ₹500, ensuring take-home never drops below floor.",
      returnableOption: "Option for 100% free returnable kit with zero deductions, returned upon contract conclusion.",
    },
  },
  shiftRoster15: {
    lunchPrimaryRiders: 5,
    dinnerPrimaryRiders: 7,
    peakReserves: 2,
    flexibleFloatingBackup: 1,
    totalFleetSize: 15,
  },
  pitchScriptHinglish: `Bhai, OrderKing ki local delivery start ho rahi hai. Door shehar mein nahi bhagna padega—poora kaam isi 3–4 km ke local cluster mein rahega.

Payment calculation bilkul clear aur honest hai:
• ₹25 base fare + ₹8.50 per kilometre (2km ke upar).
• Barish ya extreme weather mein ₹15 extra surge per delivery.
• Agar aapne 8 ghante ki shift complete ki, toh ₹500 ka minimum gross floor guarantee company ki taraf se pakka hai.
• Agar orders se ₹750 bane toh poora ₹750 aapka. Agar kisi din kam orders aaye aur ₹350 bane, toh company ₹150 top-up karke ₹500 poora karegi.
• Kit ke liye aaj ₹0 advance dena hai. Bag aur t-shirt ka cost Day 4 ke baad chhota-chhota ₹50 karke tabhi katega jab aapki kamai floor se upar ho.
• Har shaam ko poora digital hisaab app mein dikhega aur bank account mein regular payout aayega.

Aap documents verify karwa kar ek supervised test delivery kar lo, kal se shift confirm!`,
  pitchScriptEnglish: `Brother, OrderKing is launching local food deliveries right here. You won't have to ride across the entire city—all orders are within this tight 3–4 km local cluster.

The pay structure is transparent and reliable:
• ₹25 pickup base fare + ₹8.50 per kilometre for distance beyond 2km.
• Additional ₹15 weather surge during heavy rain or extreme heat.
• Guaranteed ₹500 gross floor for an 8-hour shift (or 4 deliveries with 90% acceptance).
• If your delivery earnings reach ₹750, you keep the full ₹750. If orders are slow and you earn ₹350, OrderKing adds ₹150 top-up to ensure you take home ₹500.
• ₹0 upfront kit payment. The equipment cost is recovered at ₹50/day from Day 4 onwards ONLY on high-earning days.
• Daily transparent digital ledger with direct bank payouts.

Let's verify your DL, Aadhaar, and bike documents, run one quick test pickup, and lock your shift for tomorrow!`,
  targetLocations: [
    "Prominent tea stalls (chai tapris) near restaurant market strips between 3:00 PM and 5:00 PM",
    "Local 2-wheeler mechanic and puncture repair shops where gig riders get servicing",
    "High-traffic petrol pumps with food joints / waiting bays",
    "Direct referrals from signed restaurant owners (trusted local boys)",
    "Existing gig rider WhatsApp communities (off-peak local courier meetups)",
  ],
  kycVerificationChecklist: [
    "Aadhaar Card / Government Identity Verification (Age >= 18)",
    "Valid Commercial or Two-Wheeler Driving Licence (DL)",
    "Motorcycle / Scooter Registration Certificate (RC) & Active Insurance",
    "Valid Pollution Under Control (PUC) certificate where mandatory",
    "Working Android Smartphone (Android 9.0+) with GPS & Camera",
    "Verified Bank Account / Bank Passbook / UPI VPA for T+1 payouts",
    "Emergency Family Contact Number with relationship proof",
    "Mandatory Food Safety & Hygiene Protocol Briefing (Thermal Bag usage)",
  ],
};

export const CUSTOMER_LAUNCH_PLAN: CustomerLaunchPlan = {
  promotionalOffer: {
    couponCode: "LOCAL40",
    discountPaise: 4000, // ₹40 FLAT OFF
    minOrderValuePaise: 14900, // ₹149 minimum order value
    freeDeliveryOrdersCount: 2, // Free delivery on first 2 orders
    redemptionCapPerCluster: 100, // Cap at first 100 orders
    budgetCapPaise: 400000, // ₹4,000 maximum discount envelope
  },
  whatsAppBroadcastCopy: {
    customerDirectHinglish: `🍔 *OrderKing ab aapke area mein live hai!* 👑

Ab apne pasandida local restaurants se direct order kijiye fast delivery ke saath!

🎉 *EXCLUSIVE LAUNCH OFFER:*
✨ *₹40 FLAT OFF* on orders above ₹149!
🛵 *FREE DELIVERY* on your first 2 orders!
🏷️ Use Promo Code: *LOCAL40*

📍 Applicable at top rated local restaurants within 3km.
⏳ Limited to first 100 orders only!

👉 *Order Now:* https://orderking.in/app?cluster=blr-hbr-01&promo=LOCAL40

Apne friends aur family ke saath zaroor share karein! ❤️
— Team OrderKing`,
    customerDirectEnglish: `🍔 *OrderKing is now LIVE in your neighborhood!* 👑

Order fresh, hot food directly from your favorite local kitchens with rapid delivery!

🎉 *EXCLUSIVE NEIGHBORHOOD LAUNCH OFFER:*
✨ *₹40 FLAT OFF* on orders above ₹149!
🛵 *FREE DELIVERY* on your first 2 orders!
🏷️ Use Promo Code: *LOCAL40*

📍 Valid at premier neighborhood kitchens within 3km.
⏳ Limited launch allocation: First 100 orders only!

👉 *Order Now:* https://orderking.in/app?cluster=blr-hbr-01&promo=LOCAL40

Share the taste with your family and neighbors! ❤️
— Team OrderKing`,
    merchantRiderReferralHinglish: `Bhai, hamare local area mein *OrderKing* food delivery live ho gaya hai.

Nearby best restaurants listed hain aur direct fast delivery ho rahi hai. 
First order ₹149+ par *₹40 FLAT OFF + FREE DELIVERY* mil raha hai—coupon code: *LOCAL40*.

Ye raha direct link: https://orderking.in/app?cluster=blr-hbr-01&promo=LOCAL40

Try karke dekho aur feedback zaroor batana! 🚀`,
  },
  qrTentCardCopy: {
    tableTentHeadline: "Order Fresh to Your Doorstep · Flat ₹40 OFF + Free Delivery",
    tableTentBody: "Loved dining here? Enjoy the exact same fresh food delivered to your home in 25-35 minutes directly through OrderKing. Scan the QR code below and use code LOCAL40 at checkout.",
    counterCallToAction: "Scan to Order on OrderKing & Get ₹40 OFF Instant Welcome Bonus",
    staff15SecScript: "Bhaiya, yeh hamara official local ordering QR hai. First order par flat ₹40 off aur free delivery mil rahi hai. Scan karke menu dekh lijiye!",
  },
  acquisitionChannels: [
    {
      channel: "20 Partner Restaurant Counters & Table Tents",
      targetLeads: 200,
      method: "Branded acrylic QR tent cards on billing counters and takeaway pick-up bays; counter staff incentives.",
    },
    {
      channel: "2 Dedicated Field Promoters (Street Intercepts)",
      targetLeads: 200,
      method: "20 verified phone OTP opt-ins per promoter per day for 5 days in high footfall commercial zones.",
    },
    {
      channel: "Local Society WhatsApp & Commercial Complexes",
      targetLeads: 100,
      method: "Admin-permissioned broadcasts to resident welfare associations (RWAs) and nearby business hubs within 1.5km.",
    },
  ],
};

export const FIVE_DAY_STREET_TIMETABLE: StreetTimetableDay[] = [
  {
    dayNumber: 1,
    dayTitle: "Day 1 — Prove the First Working Loop",
    primaryStrategicObjective: "Onboard 3 anchor restaurants, recruit 4 verified riders, execute first real-money end-to-end delivery loop.",
    restaurantQuota: 3,
    riderQuota: 4,
    customerLeadQuota: 40,
    schedule: [
      {
        timeSlot: "09:00–10:00 AM",
        taskTitle: "Morning Mission Briefing & Cash Box Setup",
        operationalDetail: "Founder aligns 7-person team; issue demo phones, 58mm test thermal printers, paper agreements, and verify cash envelope ledger.",
        ownerRole: "Founder",
        deliverable: "Team deployed; physical kit checklists signed off.",
      },
      {
        timeSlot: "10:00 AM–12:00 PM",
        taskTitle: "Anchor Chai Tapri Rider Recruitment",
        operationalDetail: "Rider Captain visits key chai stall hub; interview 10 delivery partners; inspect DL, RC, phone and thermal bag; verify first 4 partners.",
        ownerRole: "Rider Captain",
        deliverable: "4 riders verified, apps installed, test GPS ping successful.",
      },
      {
        timeSlot: "12:00–02:00 PM",
        taskTitle: "Lunch Rush Field Scouting (Zero Cold Calls)",
        operationalDetail: "Observe kitchen order dispatch at target restaurants; note average prep times, ticket volume, and aggregator delays. Do NOT disturb owners.",
        ownerRole: "Merchant Executive",
        deliverable: "Ranked list of 15 top candidate restaurants with owner names.",
      },
      {
        timeSlot: "02:30–05:00 PM",
        taskTitle: "Owner 15-Minute Walk-in Demonstrations",
        operationalDetail: "Execute 6 walk-ins using 3:30 PM hook; run Bluetooth KOT live demo; present 16-22% rate card vs legacy aggregator math; close first 3 anchor partners.",
        ownerRole: "Founder",
        deliverable: "3 signed paper agreements, menu photos taken, bank details captured.",
      },
      {
        timeSlot: "05:00–06:30 PM",
        taskTitle: "Menu Digitization, Printer Test & Activation",
        operationalDetail: "Upload top 8 hero items per restaurant; configure packing charges and prep times; perform test order on owner's Bluetooth printer.",
        ownerRole: "Merchant Executive",
        deliverable: "3 restaurants set to LIVE status in UmarOS; test prints passed.",
      },
      {
        timeSlot: "06:30–10:00 PM",
        taskTitle: "Dinner Rush Pilot & Supervised Live Deliveries",
        operationalDetail: "Rider captain rosters 4 riders; execute real customer pilot orders; promoter acquires first 40 opt-ins; monitor pickup to drop SLA.",
        ownerRole: "All",
        deliverable: "Minimum 5-8 real orders delivered; 0 dropped orders.",
      },
      {
        timeSlot: "10:00–10:30 PM",
        taskTitle: "Nightly Financial & Operational Audit",
        operationalDetail: "Reconcile daily UPI/COD cash, verify merchant payout ledger, verify rider floor guarantees (₹500), send confirmation WhatsApps.",
        ownerRole: "Founder",
        deliverable: "Daily closure sheet published; T+1 settlement batch generated.",
      },
    ],
    endOfDayReconciliationAudit: [
      "Verify 3 restaurants verified with menu, pricing, KOT print and FSSAI number.",
      "Verify 4 riders completed KYC and performed at least 1 test/live order.",
      "Verify 40 verified customer phone leads with OTP validation.",
      "Reconcile customer payments, merchant credit, and rider payout ledger.",
    ],
  },
  {
    dayNumber: 2,
    dayTitle: "Day 2 — Build the Dense Street Spine",
    primaryStrategicObjective: "Expand to 7 live restaurants (adding complementary cuisines), 7 active riders, and 120 customer leads.",
    restaurantQuota: 7,
    riderQuota: 7,
    customerLeadQuota: 120,
    schedule: [
      {
        timeSlot: "09:00–10:00 AM",
        taskTitle: "Day 1 Service Failure Review",
        operationalDetail: "Analyze yesterday's prep times, KOT Bluetooth disconnects, and rider travel delays; update battlecard objection logs.",
        ownerRole: "Founder",
        deliverable: "Corrective actions logged; Day 2 route map assigned.",
      },
      {
        timeSlot: "10:00 AM–12:00 PM",
        taskTitle: "Rider Fleet Scaling & Bag Distribution",
        operationalDetail: "Recruit 3 additional delivery partners from mechanic shop hub; distribute OrderKing thermal bags with signed zero-upfront agreement.",
        ownerRole: "Rider Captain",
        deliverable: "Cumulative 7 verified riders ready for lunch roster.",
      },
      {
        timeSlot: "12:00–02:00 PM",
        taskTitle: "Lunch Operations & Counter QR Deployment",
        operationalDetail: "Deploy 2 customer promoters at Day 1 restaurants; install branded QR tent cards on billing counters; assist dine-in guests to scan.",
        ownerRole: "Customer Promoter",
        deliverable: "40 new customer opt-ins acquired; lunch orders fulfilled smoothly.",
      },
      {
        timeSlot: "02:30–05:00 PM",
        taskTitle: "Merchant Acquisition: Complementary Cuisines",
        operationalDetail: "Pitch 8 restaurants (focusing on Biryani, Chinese, South Indian, Pizza); overcome 'Already have existing delivery apps' objection; close 4 new restaurants.",
        ownerRole: "Merchant Executive",
        deliverable: "4 new signed merchant agreements; cumulative 7 signed.",
      },
      {
        timeSlot: "05:00–06:30 PM",
        taskTitle: "KOT Printer Pairing & Staff SOP Training",
        operationalDetail: "Pair Bluetooth printers at 4 new outlets; train cashier and head chef on accepting orders and marking ready in under 3 minutes.",
        ownerRole: "Merchant Executive",
        deliverable: "7 total restaurants live with active order notifications.",
      },
      {
        timeSlot: "06:30–10:00 PM",
        taskTitle: "Dinner Peak Dispatch & Broadcast Test",
        operationalDetail: "Deploy 5 primary + 2 standby riders; trigger targeted WhatsApp broadcast to Day 1 & Day 2 leads with LOCAL40 code.",
        ownerRole: "Rider Captain",
        deliverable: "15-25 completed dinner deliveries; average delivery time < 32 mins.",
      },
      {
        timeSlot: "10:00–10:30 PM",
        taskTitle: "Nightly Ledger & Rider Floor Top-Up",
        operationalDetail: "Calculate rider earnings; execute guarantee top-up where order count < ₹500 floor; trigger T+1 bank payouts for Day 1 merchants.",
        ownerRole: "Founder",
        deliverable: "Day 1 merchant bank transfers confirmed; cumulative 120 leads verified.",
      },
    ],
    endOfDayReconciliationAudit: [
      "Check 7 restaurants live across at least 3 distinct food categories.",
      "Check 7 riders clocked in, zero unfulfilled orders during dinner rush.",
      "Check 120 cumulative opt-in leads in database.",
      "Verify zero negative balance in merchant escrow ledger.",
    ],
  },
  {
    dayNumber: 3,
    dayTitle: "Day 3 — Eliminate Friction & Scale to 12 Restaurants",
    primaryStrategicObjective: "Reach 12 live restaurants, 10 active riders, 240 customer leads; optimize prep time and dispatch latency.",
    restaurantQuota: 12,
    riderQuota: 10,
    customerLeadQuota: 240,
    schedule: [
      {
        timeSlot: "09:00–10:00 AM",
        taskTitle: "Platform Hardening & Payout Verification",
        operationalDetail: "Confirm Day 1 bank credits with merchant owners in person; show proof of prompt settlement to strengthen trust.",
        ownerRole: "Founder",
        deliverable: "Owner testimonials recorded; word-of-mouth referral unlocked.",
      },
      {
        timeSlot: "10:00 AM–12:00 PM",
        taskTitle: "Fleet Expansion to 10 Partners",
        operationalDetail: "Onboard 3 new riders via referrals from existing partners; brief on emergency SOS, COD handling limits (₹2,500), and customer privacy.",
        ownerRole: "Rider Captain",
        deliverable: "10 active verified delivery partners rostered.",
      },
      {
        timeSlot: "12:00–02:00 PM",
        taskTitle: "Lunch Rush Quality & Packing Audit",
        operationalDetail: "Inspect tamper-proof taping and packing charges across live restaurants; ensure hot food insulation in delivery bags.",
        ownerRole: "Merchant Executive",
        deliverable: "Zero food leakage complaints; customer rating >= 4.7.",
      },
      {
        timeSlot: "02:30–05:00 PM",
        taskTitle: "Merchant Acquisition: Afternoon Drive",
        operationalDetail: "Visit 10 shortlisted merchants; leverage Day 1 & 2 payment success stories; counter 'Riders won't show up' with live GPS fleet demo; sign 5.",
        ownerRole: "Founder",
        deliverable: "5 new signed agreements; cumulative 12 merchants signed.",
      },
      {
        timeSlot: "05:00–06:30 PM",
        taskTitle: "Rapid Onboarding & Tent Card Deployment",
        operationalDetail: "Activate 5 new kitchens; upload top 8 items; place counter QR cards; test Bluetooth print on all 5 new terminals.",
        ownerRole: "Merchant Executive",
        deliverable: "12 total restaurants live with tested KOT printing.",
      },
      {
        timeSlot: "06:30–10:00 PM",
        taskTitle: "High-Volume Dinner Dispatch",
        operationalDetail: "Rider captain coordinates 8 active riders + 2 reserves; promoters engage shoppers in commercial market; distribute LOCAL40 vouchers.",
        ownerRole: "All",
        deliverable: "30-40 completed deliveries; cumulative 240 customer leads.",
      },
      {
        timeSlot: "10:00–10:30 PM",
        taskTitle: "Nightly Reconciliation & Payout Batching",
        operationalDetail: "Calculate rider daily shift earnings; apply ₹500 floor rule; verify discount budget burn (<₹2,000 spent so far).",
        ownerRole: "Founder",
        deliverable: "Day 2 merchant payouts scheduled; cash box verified.",
      },
    ],
    endOfDayReconciliationAudit: [
      "12 live merchants with accurate menus and operational Bluetooth printers.",
      "10 active delivery partners; rider assignment latency < 3 minutes.",
      "240 cumulative opt-in customer leads verified via SMS/OTP.",
      "Total discount burn tracked strictly within ₹4,000 budget cap.",
    ],
  },
  {
    dayNumber: 4,
    dayTitle: "Day 4 — Fill Daypart Gaps & Reach 16 Merchants",
    primaryStrategicObjective: "Onboard 4 breakfast/dessert/cloud kitchens to hit 16 merchants, reach 13 riders, and acquire 370 customer leads.",
    restaurantQuota: 16,
    riderQuota: 13,
    customerLeadQuota: 370,
    schedule: [
      {
        timeSlot: "09:00–10:00 AM",
        taskTitle: "Morning Fleet Muster & Kit Deduction Orientation",
        operationalDetail: "Brief riders on Day 4 kit deduction policy: ₹50/day will only be deducted on days where gross earnings exceed ₹500, ensuring floor protection.",
        ownerRole: "Rider Captain",
        deliverable: "100% rider agreement on kit deduction terms; zero disputes.",
      },
      {
        timeSlot: "10:00 AM–12:00 PM",
        taskTitle: "Recruit Final Roster Cadre",
        operationalDetail: "Recruit 3 final delivery partners for dinner peak and weekend standby; conduct route orientation around 3km cluster landmarks.",
        ownerRole: "Rider Captain",
        deliverable: "13 verified riders ready and rostered.",
      },
      {
        timeSlot: "12:00–02:00 PM",
        taskTitle: "Lunch Drive & Society Group Activation",
        operationalDetail: "Promoters visit 3 nearby gated apartment security/admin desks; secure approval to post QR flyers on community notice boards.",
        ownerRole: "Customer Promoter",
        deliverable: "60 new customer leads acquired from local apartment clusters.",
      },
      {
        timeSlot: "02:30–05:00 PM",
        taskTitle: "Merchant Acquisition: Dessert, Bakery & Late Night",
        operationalDetail: "Target sweet shops, bakeries, and late-night shawarma/roll outlets to expand order window; sign 4 new merchants.",
        ownerRole: "Founder",
        deliverable: "4 new signed agreements; cumulative 16 signed.",
      },
      {
        timeSlot: "05:00–06:30 PM",
        taskTitle: "KOT Integration & Packaging Standards Check",
        operationalDetail: "Setup printing for new outlets; verify ice cream / cold item packaging and hot food separation protocols.",
        ownerRole: "Merchant Executive",
        deliverable: "16 live restaurants ready for full evening dinner volume.",
      },
      {
        timeSlot: "06:30–10:00 PM",
        taskTitle: "Cluster Peak Fulfillment Command",
        operationalDetail: "Execute dinner orders across 16 outlets; maintain rider pickup wait time under 6 minutes; send broadcast to society leads.",
        ownerRole: "All",
        deliverable: "45-60 dinner orders completed; cumulative 370 customer leads.",
      },
      {
        timeSlot: "10:00–10:30 PM",
        taskTitle: "Day 4 Payouts & Amortization Check",
        operationalDetail: "Apply first ₹50 kit amortization deduction on qualifying riders; confirm Day 3 merchant T+1 bank payouts.",
        ownerRole: "Founder",
        deliverable: "Reconciled ledger; zero compliance breaches.",
      },
    ],
    endOfDayReconciliationAudit: [
      "16 verified live restaurants with comprehensive cuisine coverage.",
      "13 ready delivery partners; average customer delivery time < 30 mins.",
      "370 verified local customer leads with phone numbers and PIN codes.",
      "Kit deduction audit: ₹50 deducted only where rider earnings >= ₹550.",
    ],
  },
  {
    dayNumber: 5,
    dayTitle: "Day 5 — Full 20/15/500 Target Achievement & Cluster Validation",
    primaryStrategicObjective: "Hit all 3 final targets: 20 live restaurants, 15 delivery partners, 500 customer leads; validate sustainable marketplace unit economics.",
    restaurantQuota: 20,
    riderQuota: 15,
    customerLeadQuota: 500,
    schedule: [
      {
        timeSlot: "09:00–10:00 AM",
        taskTitle: "Final Target Alignment & Quota Review",
        operationalDetail: "Founder reviews remaining gap: need 4 restaurants, 2 riders, 130 customer leads to cross all 5-day success metrics.",
        ownerRole: "Founder",
        deliverable: "Field teams dispatched with clear targets.",
      },
      {
        timeSlot: "10:00 AM–12:00 PM",
        taskTitle: "Fleet Finalization: 15 Ready Partners",
        operationalDetail: "Onboard final 2 riders; complete full roster verification (5 lunch, 7 dinner, 2 reserve, 1 flexible); verify all bags and gear.",
        ownerRole: "Rider Captain",
        deliverable: "15/15 target riders verified, trained and ready on grid.",
      },
      {
        timeSlot: "12:00–02:00 PM",
        taskTitle: "Full Cluster Lunch Rush Operations",
        operationalDetail: "Promoters execute high-energy counter sampling at anchor restaurants; distribute final batch of LOCAL40 cards.",
        ownerRole: "Customer Promoter",
        deliverable: "70 new leads acquired; 25 lunch deliveries completed.",
      },
      {
        timeSlot: "02:30–05:00 PM",
        taskTitle: "Final Merchant Sprint: Close Last 4 Outlets",
        operationalDetail: "Visit warm leads identified on Day 2 & 3; present written proof of active 15-rider fleet and 400+ ordering customers; close 4 outlets.",
        ownerRole: "Founder",
        deliverable: "20/20 target restaurants signed and paper agreements executed.",
      },
      {
        timeSlot: "05:00–06:30 PM",
        taskTitle: "Final Outlets Activation & System Health Check",
        operationalDetail: "Fast-track menu uploads for outlets 17-20; test Bluetooth KOT printers; verify all 20 outlets visible on customer app within 3km.",
        ownerRole: "Merchant Executive",
        deliverable: "20/20 restaurants officially LIVE and accepting orders.",
      },
      {
        timeSlot: "06:30–10:00 PM",
        taskTitle: "Grand Launch Evening Delivery Surge",
        operationalDetail: "Mobilize full 15-rider fleet; customer promoters push final 60 sign-ups to cross 500 mark; manage surge without dropped orders.",
        ownerRole: "All",
        deliverable: "60-80 dinner orders delivered; 500/500 customer lead goal achieved.",
      },
      {
        timeSlot: "10:00–10:30 PM",
        taskTitle: "5-Day Mission Accomplished Closure & Payout Audit",
        operationalDetail: "Audit total 5-day cash burn against ₹85,000 envelope; celebrate team milestone; schedule T+1 payouts for all 20 restaurants.",
        ownerRole: "Founder",
        deliverable: "Final launch report published; cluster transitions to standard operations.",
      },
    ],
    endOfDayReconciliationAudit: [
      "Exact target achieved: 20 restaurants live, active, and test-verified.",
      "Exact target achieved: 15 delivery partners verified and on shift.",
      "Exact target achieved: 500 unique verified local customer leads.",
      "Total 5-day cash expenditure reconciled within ₹65,000 to ₹95,000 envelope.",
    ],
  },
];

export const LAUNCH_CASH_ENVELOPE: LaunchCashEnvelope = {
  summary: {
    leanTotalPaise: 6500000,     // ₹65,000 (minimum lean execution)
    standardTotalPaise: 8500000, // ₹85,000 (realistic standard baseline)
    scaleTotalPaise: 9500000,    // ₹95,000 (enhanced buffer / scale execution)
  },
  items: [
    {
      id: "item-rider-guarantee",
      item: "Rider Earnings Floor Guarantee Commitment",
      category: "FLEET_GUARANTEE",
      standardBudgetPaise: 3750000, // ₹37,500
      leanBudgetPaise: 2750000,     // ₹27,500 (staggered shifts)
      scaleBudgetPaise: 4250000,    // ₹42,500 (surge & extended night shifts)
      basis: "15 riders × ₹500 floor × 5 days (maximum baseline commitment)",
      notes: "Every qualifying completed 8-hour shift is protected at ₹500 minimum. Actual payout is top-up between order earnings and floor.",
    },
    {
      id: "item-rider-kits",
      item: "Reusable Thermal Delivery Bags & Rider Kits",
      category: "KITS",
      standardBudgetPaise: 750000,  // ₹7,500
      leanBudgetPaise: 500000,      // ₹5,000 (10 core kits + 5 returnable)
      scaleBudgetPaise: 1200000,    // ₹12,000 (15 full deluxe kits with rain jackets)
      basis: "15 kits @ ₹500 each standard bag (or amortized via ₹50/day deduction from Day 4)",
      notes: "Company purchases upfront. Recovered over time via ₹50/day deduction or returned undamaged upon driver departure.",
    },
    {
      id: "item-customer-discounts",
      item: "Customer Launch Acquisition Discounts (LOCAL40)",
      category: "CUSTOMER_SUBSIDY",
      standardBudgetPaise: 400000,  // ₹4,000
      leanBudgetPaise: 300000,      // ₹3,000 (75 orders @ ₹40)
      scaleBudgetPaise: 500000,     // ₹5,000 (125 orders @ ₹40)
      basis: "100 first eligible orders × ₹40 FLAT OFF (minimum order ₹149)",
      notes: "Strict hard cap enforced in checkout code. Once 100 redemptions occur, coupon code auto-expires.",
    },
    {
      id: "item-promoters",
      item: "Street Promoters (Lead Generation & QR Demonstrations)",
      category: "FIELD_STAFF",
      standardBudgetPaise: 700000,  // ₹7,000
      leanBudgetPaise: 560000,      // ₹5,600 (2 promoters × ₹560/day)
      scaleBudgetPaise: 800000,     // ₹8,000 (2 promoters × ₹800/day)
      basis: "2 promoters × ₹700 daily stipend × 5 days",
      notes: "Tasked with acquiring 20 genuine verified opt-in leads each per day at high footfall market points and dining tables.",
    },
    {
      id: "item-merchant-staff",
      item: "Merchant Acquisition & Activation Field Executives",
      category: "FIELD_STAFF",
      standardBudgetPaise: 1200000, // ₹12,000
      leanBudgetPaise: 900000,      // ₹9,000 (3 staff × ₹600/day)
      scaleBudgetPaise: 1350000,    // ₹13,500 (3 staff × ₹900/day)
      basis: "3 executives (2 acquisition + 1 activation/printer tech) × ₹800/day × 5 days",
      notes: "Responsible for visiting 60-80 restaurants, signing 20-25 agreements, menu photography, Bluetooth printer pairing, and staff training.",
    },
    {
      id: "item-rider-captain",
      item: "Rider Fleet Captain (Dispatch Supervisor & Dispatcher)",
      category: "FIELD_STAFF",
      standardBudgetPaise: 400000,  // ₹4,000
      leanBudgetPaise: 350000,      // ₹3,500 (1 captain × ₹700/day)
      scaleBudgetPaise: 500000,     // ₹5,000 (1 captain × ₹1,000/day)
      basis: "1 captain × ₹800 daily stipend × 5 days",
      notes: "Full operational authority over rider muster, KYC verification, shift rostering, manual dispatch overrides, and cash collection audit.",
    },
    {
      id: "item-marketing-collateral",
      item: "Physical Collateral (QR Tent Cards, Posters, Agreement Books)",
      category: "MARKETING_COLLATERAL",
      standardBudgetPaise: 300000,  // ₹3,000
      leanBudgetPaise: 200000,      // ₹2,000 (minimalist vinyl stickers)
      scaleBudgetPaise: 400000,     // ₹4,000 (premium acrylic stands + banners)
      basis: "50 acrylic table tents + 100 counter QR cards + 50 paper agreement triplicates",
      notes: "High-contrast QR stands placed on cash counters and dining tables with clear call-to-action.",
    },
    {
      id: "item-contingency-buffer",
      item: "Operational Contingency, Food Loss Cover & Emergency Fuel",
      category: "CONTINGENCY",
      standardBudgetPaise: 1000000, // ₹10,000
      leanBudgetPaise: 940000,      // ₹9,400
      scaleBudgetPaise: 500000,     // ₹5,000
      basis: "Food spill/delay compensation reserve, emergency fuel allowance, battery packs, and miscellaneous expenses",
      notes: "Used to guarantee 100% merchant reimbursement if food is wasted due to logistics delays, maintaining complete goodwill.",
    },
  ],
};

// ---------------------------------------------------------------------------
// 4. Mathematical Execution Engines (All Integer Paise)
// ---------------------------------------------------------------------------

/**
 * Calculates complete unit economics for a single food order on OrderKing.
 * Guaranteed 100% exact integer paise calculations without floating-point drift.
 */
export function calculateLaunchEconomics(params: OrderEconomicsInput): OrderEconomicsOutput {
  const foodSubtotalPaise = Math.round(params.foodSubtotalPaise);
  const commissionRateBps = Math.round(params.commissionRateBps);
  const gstRateBps = Math.round(params.gstRateBps ?? 1800); // 18% GST on platform fee
  const tdsRateBps = Math.round(params.tdsRateBps ?? 10);   // 0.1% TDS u/s 194-O

  // 1. Merchant Calculations
  const merchantCommissionPaise = Math.round((foodSubtotalPaise * commissionRateBps) / 10000);
  const gstOnCommissionPaise = Math.round((merchantCommissionPaise * gstRateBps) / 10000);
  const tdsSection194OPaise = Math.round((foodSubtotalPaise * tdsRateBps) / 10000);
  const restaurantFundedDiscountPaise = Math.round(params.restaurantFundedDiscountPaise ?? 0);

  const totalMerchantDeductionsPaise = 
    merchantCommissionPaise + gstOnCommissionPaise + tdsSection194OPaise + restaurantFundedDiscountPaise;
  const netMerchantPayablePaise = foodSubtotalPaise - totalMerchantDeductionsPaise;

  // 2. Rider Payout Calculations
  const baseFarePaise = Math.round(params.baseFarePaise ?? 2500); // ₹25
  const baseDistanceThresholdKm = params.baseDistanceThresholdKm ?? 2.0;
  const perKmRateBeyondThresholdPaise = Math.round(params.perKmRateBeyondThresholdPaise ?? 850); // ₹8.50/km
  
  // Calculate billable distance beyond base distance threshold (e.g. > 2km)
  const distanceKm = Math.max(0, params.deliveryDistanceKm);
  const excessKm = Math.max(0, distanceKm - baseDistanceThresholdKm);
  const riderDistanceFarePaise = Math.round(excessKm * perKmRateBeyondThresholdPaise);

  // Pickup distance beyond 1km
  const pickupExcessKm = Math.max(0, (params.pickupExcessKm ?? 0));
  const riderPickupExcessFarePaise = Math.round(pickupExcessKm * 850);

  const riderWeatherSurgePaise = Math.round(params.weatherSurgePaise ?? 0);
  const riderGrossPayoutPaise = 
    baseFarePaise + riderDistanceFarePaise + riderPickupExcessFarePaise + riderWeatherSurgePaise;

  // 3. Platform Unit Inflow & Outflow
  const customerDeliveryFeePaise = Math.round(params.customerDeliveryFeePaise ?? 2900); // default ₹29
  const platformFundedDiscountPaise = Math.round(
    params.platformFundedDiscountPaise ?? params.customerDiscountPaise ?? 0
  );

  const grossPlatformInflowPaise = merchantCommissionPaise + customerDeliveryFeePaise;
  const grossPlatformOutflowPaise = riderGrossPayoutPaise + platformFundedDiscountPaise;
  const platformContributionMarginPaise = grossPlatformInflowPaise - grossPlatformOutflowPaise;
  
  const platformMarginPctOfFood = foodSubtotalPaise > 0 
    ? Number(((platformContributionMarginPaise / foodSubtotalPaise) * 100).toFixed(2)) 
    : 0;

  return {
    foodSubtotalPaise,
    merchantCommissionPaise,
    gstOnCommissionPaise,
    tdsSection194OPaise,
    restaurantFundedDiscountPaise,
    totalMerchantDeductionsPaise,
    netMerchantPayablePaise,
    riderBaseFarePaise: baseFarePaise,
    riderDistanceFarePaise,
    riderPickupExcessFarePaise,
    riderWeatherSurgePaise,
    riderGrossPayoutPaise,
    customerDeliveryFeePaise,
    platformFundedDiscountPaise,
    grossPlatformInflowPaise,
    grossPlatformOutflowPaise,
    platformContributionMarginPaise,
    platformMarginPctOfFood,
  };
}

/**
 * Calculates rider shift economics including the ₹500 floor guarantee and Day 4+ kit deduction.
 */
export function calculateRiderShiftPayout(input: RiderShiftEconomicsInput): RiderShiftEconomicsOutput {
  const dailyFloorGuaranteePaise = input.dailyFloorGuaranteePaise ?? 50000; // ₹500
  let grossOrderEarningsPaise = 0;

  for (const delivery of input.completedDeliveries) {
    const excessKm = Math.max(0, delivery.distanceKm - 2.0);
    const distanceFare = Math.round(excessKm * 850);
    const pickupFare = delivery.pickupExcessKm ? Math.round(delivery.pickupExcessKm * 850) : 0;
    const weatherSurge = delivery.weatherSurge ? 1500 : 0;
    grossOrderEarningsPaise += (2500 + distanceFare + pickupFare + weatherSurge);
  }

  // Guarantee Top-up
  const guaranteeTopUpPaise = Math.max(0, dailyFloorGuaranteePaise - grossOrderEarningsPaise);
  const grossShiftEarningsPaise = grossOrderEarningsPaise + guaranteeTopUpPaise;

  // Kit Deduction: Only Day 4 onwards, and only if gross earnings exceed floor so take-home is protected
  let kitDeductionAppliedPaise = 0;
  const dayNumber = input.dayNumber ?? 1;
  const kitDeductionActive = input.kitDeductionActive ?? (dayNumber >= 4);

  if (kitDeductionActive && grossShiftEarningsPaise >= dailyFloorGuaranteePaise) {
    const dailyDeduction = input.kitDailyDeductionPaise ?? 5000; // ₹50
    kitDeductionAppliedPaise = dailyDeduction;
  }

  const netTakeHomePayoutPaise = grossShiftEarningsPaise - kitDeductionAppliedPaise;
  const averageEarningPerDeliveryPaise = input.completedDeliveries.length > 0
    ? Math.round(grossShiftEarningsPaise / input.completedDeliveries.length)
    : 0;

  return {
    totalOrdersDelivered: input.completedDeliveries.length,
    grossOrderEarningsPaise,
    dailyFloorGuaranteePaise,
    guaranteeTopUpPaise,
    grossShiftEarningsPaise,
    kitDeductionAppliedPaise,
    netTakeHomePayoutPaise,
    averageEarningPerDeliveryPaise,
  };
}

/**
 * Performs side-by-side merchant net payout comparison between OrderKing and legacy aggregator (30%).
 */
export function compareMerchantNetPayout(
  orderSubtotalPaise: number,
  orderKingCommissionRateBps = 2200, // 22%
  competitorCommissionRateBps = 3000  // 30%
): MerchantEconomicsComparison {
  const okResult = calculateLaunchEconomics({
    foodSubtotalPaise: orderSubtotalPaise,
    commissionRateBps: orderKingCommissionRateBps,
    deliveryDistanceKm: 2.0,
    customerDeliveryFeePaise: 2900,
  });

  const compCommissionPaise = Math.round((orderSubtotalPaise * competitorCommissionRateBps) / 10000);
  const compGstPaise = Math.round((compCommissionPaise * 1800) / 10000);
  const compTdsPaise = Math.round((orderSubtotalPaise * 10) / 10000);
  const competitorNetPayoutPaise = orderSubtotalPaise - (compCommissionPaise + compGstPaise + compTdsPaise);

  const merchantSavingsPerOrderPaise = okResult.netMerchantPayablePaise - competitorNetPayoutPaise;
  const projectedMonthlySavings300OrdersPaise = merchantSavingsPerOrderPaise * 300;

  return {
    orderSubtotalPaise,
    orderKingCommissionRateBps,
    competitorCommissionRateBps,
    orderKingNetPayoutPaise: okResult.netMerchantPayablePaise,
    competitorNetPayoutPaise,
    merchantSavingsPerOrderPaise,
    projectedMonthlySavings300OrdersPaise,
  };
}

// ---------------------------------------------------------------------------
// 5. Utility & Formatting Helpers
// ---------------------------------------------------------------------------

export function formatPaiseToInr(paise: number): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = (absPaise / 100).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? "-" : ""}₹${rupees}`;
}

export function formatInrWhole(paise: number): string {
  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = Math.round(absPaise / 100).toLocaleString("en-IN");
  return `${isNegative ? "-" : ""}₹${rupees}`;
}
