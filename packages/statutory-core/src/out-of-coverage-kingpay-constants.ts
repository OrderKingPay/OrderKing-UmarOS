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
}

export const PLACEMENT_EDTECH_OFFERS: EdTechCourseOffer[] = [
  {
    courseId: 'ED-FS-101',
    title: 'Full-Stack Cloud & FinTech Engineering Bootcamp',
    partnerInstitute: 'KingPay Career Academy',
    placementGuaranteeLabel: '100% Job Placement Guarantee (Min ₹6.5 LPA CTC)',
    courseFeePaise: 3499900,
    affiliateCommissionPaise: 550000, // ₹5,500.00
  },
  {
    courseId: 'ED-DA-202',
    title: 'Applied Data Analytics & GST FinOps Certification',
    partnerInstitute: 'Assam Digital Skills Mission Partner',
    placementGuaranteeLabel: 'Guaranteed Placement or 100% Tuition Refund',
    courseFeePaise: 1999900,
    affiliateCommissionPaise: 325000, // ₹3,250.00
  },
];
