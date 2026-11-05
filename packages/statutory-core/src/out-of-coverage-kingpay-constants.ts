/**
 * Out-of-Coverage & KingPay Revenue Constants (out-of-coverage-kingpay-constants.ts)
 * Entity: Orderkingpay | GSTIN: 18AFXPH9838M1Z9 (Assam - 788710)
 */

export const MANDATORY_OUT_OF_COVERAGE_NOTICE =
  'Food delivery is currently expanding to your area. In the meantime, explore instant KingPay Travel, Utilities & Soundbox Services.';

export interface DomesticFlightCorridor {
  corridorCode: string;
  originIata: string;
  originCity: string;
  destinationIata: string;
  destinationCity: string;
  baseFarePaise: number;
  convenienceFeePaise: number; // ₹399 = 39900 paise (domestic) or ₹1,299 = 129900 paise (international)
  isInternational: boolean;
  kvCacheLatencyMs: number;
}

export const TOP_CACHED_FLIGHT_CORRIDORS: DomesticFlightCorridor[] = [
  {
    corridorCode: 'GAU-DEL',
    originIata: 'GAU',
    originCity: 'Guwahati',
    destinationIata: 'DEL',
    destinationCity: 'New Delhi',
    baseFarePaise: 489900,
    convenienceFeePaise: 39900,
    isInternational: false,
    kvCacheLatencyMs: 14,
  },
  {
    corridorCode: 'IXS-CCU',
    originIata: 'IXS',
    originCity: 'Silchar',
    destinationIata: 'CCU',
    destinationCity: 'Kolkata',
    baseFarePaise: 315000,
    convenienceFeePaise: 39900,
    isInternational: false,
    kvCacheLatencyMs: 11,
  },
  {
    corridorCode: 'DEL-BOM',
    originIata: 'DEL',
    originCity: 'New Delhi',
    destinationIata: 'BOM',
    destinationCity: 'Mumbai',
    baseFarePaise: 524000,
    convenienceFeePaise: 39900,
    isInternational: false,
    kvCacheLatencyMs: 9,
  },
  {
    corridorCode: 'BLR-DXB',
    originIata: 'BLR',
    originCity: 'Bengaluru',
    destinationIata: 'DXB',
    destinationCity: 'Dubai',
    baseFarePaise: 1485000,
    convenienceFeePaise: 129900,
    isInternational: true,
    kvCacheLatencyMs: 18,
  },
];

export interface EdTechCourseOffer {
  courseId: string;
  title: string;
  partnerInstitute: string;
  placementGuaranteeLabel: string;
  courseFeePaise: number;
  affiliateCommissionPaise: number; // ₹2,500 to ₹7,500 (250000 to 750000 paise)
  affiliateTrackingId: string;
  minPlacementCtcPaise?: number;
  durationWeeks?: number;
  curriculumTrack?: 'FULL_STACK' | 'FINOPS_DATA_ANALYTICS' | 'CLOUD_DEVOPS_AI';
}

export const PLACEMENT_EDTECH_OFFERS: EdTechCourseOffer[] = [
  {
    courseId: 'ED-FS-101',
    title: 'Full-Stack Cloud & FinTech Engineering Bootcamp',
    partnerInstitute: 'KingPay Career Academy',
    placementGuaranteeLabel: '100% Job Placement Guarantee (Min ₹6.5 LPA CTC)',
    courseFeePaise: 3499900,
    affiliateCommissionPaise: 550000, // ₹5,500.00
    affiliateTrackingId: 'OK-AFF-FS101-PLCMT',
    minPlacementCtcPaise: 65000000, // ₹6.5 LPA CTC
    durationWeeks: 24,
    curriculumTrack: 'FULL_STACK',
  },
  {
    courseId: 'ED-DA-202',
    title: 'Applied Data Analytics & GST FinOps Certification',
    partnerInstitute: 'Assam Digital Skills Mission Partner',
    placementGuaranteeLabel: 'Guaranteed Placement or 100% Tuition Refund',
    courseFeePaise: 1999900,
    affiliateCommissionPaise: 325000, // ₹3,250.00
    affiliateTrackingId: 'OK-AFF-DA202-FINOPS',
    minPlacementCtcPaise: 48000000, // ₹4.8 LPA CTC
    durationWeeks: 16,
    curriculumTrack: 'FINOPS_DATA_ANALYTICS',
  },
  {
    courseId: 'ED-AI-303',
    title: 'Cloud Native AI & Systems Architecture Accelerator',
    partnerInstitute: 'National Tech Career Alliance',
    placementGuaranteeLabel: 'Guaranteed Placement (Min ₹10 LPA CTC)',
    courseFeePaise: 4999900,
    affiliateCommissionPaise: 750000, // ₹7,500.00 (Upper Bound)
    affiliateTrackingId: 'OK-AFF-AI303-EXEC',
    minPlacementCtcPaise: 100000000, // ₹10 LPA CTC
    durationWeeks: 20,
    curriculumTrack: 'CLOUD_DEVOPS_AI',
  },
  {
    courseId: 'ED-FOP-104',
    title: 'FinTech Core Banking Operations & T+1 Settlement Associate',
    partnerInstitute: 'Barak Valley BFSI Skill Council',
    placementGuaranteeLabel: 'Direct Placement in Regional FinTech & Banking Hubs',
    courseFeePaise: 1499900,
    affiliateCommissionPaise: 250000, // ₹2,500.00 (Lower Bound)
    affiliateTrackingId: 'OK-AFF-FOP104-BANKING',
    minPlacementCtcPaise: 36000000, // ₹3.6 LPA CTC
    durationWeeks: 12,
    curriculumTrack: 'FINOPS_DATA_ANALYTICS',
  },
];

/**
 * Generates an authentic affiliate tracking link for student enrollment attribution
 */
export function generateAffiliateTrackingUrl(params: {
  courseId: string;
  studentId?: string;
  partnerRef?: string;
  channel?: string;
}): string {
  const offer = PLACEMENT_EDTECH_OFFERS.find((o) => o.courseId === params.courseId);
  const trackingId = offer?.affiliateTrackingId || `OK-AFF-${params.courseId}`;
  const student = params.studentId || 'anon';
  const channel = params.channel || 'portal';
  return `https://orderking.in/careers/edtech/enroll?course=${params.courseId}&affid=${trackingId}&sid=${student}&ch=${channel}`;
}

/**
 * Validates that an affiliate tracking ID follows the official OrderKing affiliate convention
 */
export function validateAffiliateTrackingId(trackingId: string): boolean {
  if (!trackingId || typeof trackingId !== 'string') return false;
  return /^OK-AFF-[A-Z0-9]+-[A-Z0-9]+$/i.test(trackingId.trim());
}
