/**
 * 🇮🇳 ORDERKING / UMAROS MULTI-BRAND VIRTUAL KITCHEN MULTIPLIER ENGINE
 * packages/ui/src/virtual-kitchen.ts
 *
 * Statutory Compliance & Operating Standards:
 * 1. Food Safety and Standards Act, 2006 (Act 34 of 2006) & FoSCoS:
 *    - Allows 1 physical commercial kitchen with 1 valid 14-digit FSSAI license/registration
 *      to host multiple virtual brand storefronts (Cloud Kitchen Multiplier).
 *    - All hosted virtual brands MUST inherit, display, and validate the physical kitchen's
 *      primary 14-digit FSSAI license on storefronts and customer receipts.
 *    - Statutory Multiplier Capacity: Maximum 5 virtual brands per physical commercial kitchen
 *      premises to prevent KDS dispatch congestion, cross-contamination, and food safety failure.
 * 2. Food Safety and Standards (Labelling and Display) Regulations, 2020:
 *    - Dietary classifications (VEG, NON_VEG, EGG, MIXED) declared for each brand.
 * 3. Section 9(5) CGST Act 2017:
 *    - 5% GST on prepared food supplies across all hosted virtual brands, remitted under
 *      OrderKing GSTIN (18AFXPH9838M1Z9) without ITC.
 * 4. Consumer Protection (E-Commerce) Rules & CCPA Packaging Guardrails:
 *    - Packaging charges capped at statutory limits (₹50.00 / 5,000 paise ceiling).
 * 5. KDS & Thermal KOT Unified Routing:
 *    - Single physical kitchen dispatch queue routing orders for all 5 hosted virtual brands
 *      with clear brand demarcation on Kitchen Order Tickets.
 *
 * 100% SafeInteger paise arithmetic. Strict TypeScript typing with Zero Any.
 */

import { validateFssaiNumber, calculateFssaiExpiryStatus } from "./fssai.ts";

// ============================================================================
// 1. STATUTORY CONSTANTS
// ============================================================================

/** Maximum virtual brand storefronts permitted per physical commercial kitchen premise */
export const MAX_VIRTUAL_BRANDS_PER_KITCHEN = 5;

/** Maximum allowable packaging charge per order under CCPA guidelines (₹50.00 in paise) */
export const CCPA_MAX_PACKAGING_CHARGE_PAISE = 5000;

/** Default OrderKing Statutory GSTIN (Assam, State Code 18) */
export const ORDERKING_STATUTORY_GSTIN = "18AFXPH9838M1Z9";

/** Section 9(5) CGST Food Tax Rate (500 bps = 5.00%) */
export const FOOD_GST_BPS = 500;

export const CUISINE_CATEGORIES = [
  "BIRYANI",
  "NORTH_INDIAN",
  "SOUTH_INDIAN",
  "CHINESE",
  "FAST_FOOD_BURGERS",
  "PIZZA_PASTA",
  "BEVERAGES_CHAI",
  "BAKERY_DESSERTS",
  "MUGHLAI",
  "HEALTHY_SALADS",
  "REGIONAL_ASSAMESE",
  "STREET_FOOD",
] as const;

export type CuisineCategory = (typeof CUISINE_CATEGORIES)[number];

export type BrandDietaryType = "VEG" | "NON_VEG" | "EGG" | "MIXED";

// ============================================================================
// 2. ERROR CLASSES
// ============================================================================

export class VirtualKitchenCapacityError extends Error {
  public readonly code = "VIRTUAL_KITCHEN_CAPACITY_EXCEEDED" as const;
  public readonly currentCount: number;
  public readonly maxCapacity: number;

  constructor(currentCount: number, maxCapacity: number = MAX_VIRTUAL_BRANDS_PER_KITCHEN) {
    super(
      `STATUTORY_CAPACITY_EXCEEDED: Commercial kitchen currently hosts ${currentCount} virtual brand(s). ` +
        `Cannot exceed statutory limit of ${maxCapacity} virtual brands per physical FSSAI premises.`
    );
    this.name = "VirtualKitchenCapacityError";
    this.currentCount = currentCount;
    this.maxCapacity = maxCapacity;
  }
}

export class VirtualKitchenComplianceError extends Error {
  public readonly code:
    | "INVALID_FSSAI_LICENSE"
    | "FSSAI_LICENSE_EXPIRED"
    | "DUPLICATE_BRAND_SLUG"
    | "DUPLICATE_BRAND_ID"
    | "INVALID_SLUG_FORMAT"
    | "KITCHEN_INACTIVE"
    | "BRAND_NOT_FOUND"
    | "BRAND_INACTIVE"
    | "INVALID_PACKAGING_CHARGE"
    | "INVALID_PINCODE"
    | "INVALID_GSTIN";

  constructor(
    code: VirtualKitchenComplianceError["code"],
    message: string
  ) {
    super(message);
    this.name = "VirtualKitchenComplianceError";
    this.code = code;
  }
}

// ============================================================================
// 3. TYPES & INTERFACES
// ============================================================================

export interface VirtualBrandStorefront {
  brandId: string;
  kitchenId: string;
  brandName: string;
  slug: string;
  cuisineCategory: CuisineCategory;
  dietaryType: BrandDietaryType;
  /** Shared FSSAI license strictly inherited from physical kitchen */
  fssaiLicenseNumber: string;
  /** GSTIN applicable for brand operations */
  gstin: string;
  menuItemCount: number;
  packagingChargeCapPaise: number;
  active: boolean;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface PhysicalCommercialKitchen {
  kitchenId: string;
  kitchenName: string;
  legalEntityName: string;
  fssaiLicenseNumber: string;
  fssaiExpiryDate: string; // YYYY-MM-DD
  gstin: string;
  address: string;
  city: string;
  stateCode: string;
  pincode: string;
  latitude: number;
  longitude: number;
  maxVirtualBrands: 5;
  virtualBrands: VirtualBrandStorefront[];
  isActive: boolean;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface CreatePhysicalKitchenInput {
  kitchenId: string;
  kitchenName: string;
  legalEntityName: string;
  fssaiLicenseNumber: string;
  fssaiExpiryDate: string;
  gstin?: string;
  address: string;
  city: string;
  stateCode: string;
  pincode: string;
  latitude: number;
  longitude: number;
  isActive?: boolean;
}

export interface RegisterVirtualBrandInput {
  brandId?: string;
  brandName: string;
  slug: string;
  cuisineCategory: CuisineCategory;
  dietaryType: BrandDietaryType;
  menuItemCount?: number;
  packagingChargeCapPaise?: number;
  gstin?: string;
}

export interface VirtualKitchenUtilization {
  kitchenId: string;
  kitchenName: string;
  fssaiLicenseNumber: string;
  totalCapacity: 5;
  registeredBrandCount: number;
  activeBrandCount: number;
  availableSlots: number;
  isAtCapacity: boolean;
  brands: Array<{
    brandId: string;
    brandName: string;
    slug: string;
    cuisineCategory: CuisineCategory;
    active: boolean;
    menuItemCount: number;
  }>;
}

export interface DispatchLineItem {
  name: string;
  quantity: number;
  unitPricePaise: number;
  specialInstructions?: string;
}

export interface CreateDispatchTicketInput {
  orderNumber: string;
  orderType: "DELIVERY" | "TAKEAWAY" | "DINE_IN";
  customerArea?: string;
  items: DispatchLineItem[];
  packagingPaise?: number;
}

export interface VirtualKitchenDispatchTicket {
  ticketId: string;
  orderNumber: string;
  orderType: "DELIVERY" | "TAKEAWAY" | "DINE_IN";
  kitchenId: string;
  kitchenName: string;
  brandId: string;
  brandName: string;
  fssaiLicenseNumber: string;
  statutoryDisclosure: string;
  physicalLocation: {
    address: string;
    city: string;
    stateCode: string;
    pincode: string;
    latitude: number;
    longitude: number;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPricePaise: number;
    lineTotalPaise: number;
    specialInstructions?: string;
  }>;
  subtotalPaise: number;
  packagingPaise: number;
  foodGstPaise: number; // 5% CGST+SGST under Sec 9(5)
  totalPaise: number;
  timestampIso: string;
  asciiTicket: string;
}

// ============================================================================
// 4. CORE ENGINE FUNCTIONS
// ============================================================================

/**
 * Validates and provisions a verified Physical Commercial Kitchen entity.
 * Enforces 14-digit FSSAI licensing and statutory address standards.
 */
export function createPhysicalCommercialKitchen(
  input: CreatePhysicalKitchenInput,
  referenceDate: Date = new Date()
): PhysicalCommercialKitchen {
  // 1. Validate 14-digit FSSAI Number
  if (!validateFssaiNumber(input.fssaiLicenseNumber)) {
    throw new VirtualKitchenComplianceError(
      "INVALID_FSSAI_LICENSE",
      `Invalid FSSAI License Number '${input.fssaiLicenseNumber}'. Must be a valid 14-digit Indian FSSAI registration.`
    );
  }

  // 2. Validate FSSAI License Expiry
  const expiryCheck = calculateFssaiExpiryStatus(input.fssaiExpiryDate, referenceDate);
  if (expiryCheck.isExpired) {
    throw new VirtualKitchenComplianceError(
      "FSSAI_LICENSE_EXPIRED",
      `Commercial kitchen FSSAI license expired on ${input.fssaiExpiryDate}. ${expiryCheck.message}`
    );
  }

  // 3. Validate Pincode (6 digits)
  if (!/^[1-9][0-9]{5}$/.test(input.pincode.trim())) {
    throw new VirtualKitchenComplianceError(
      "INVALID_PINCODE",
      `Invalid Indian Postal Code '${input.pincode}'. Must be 6 numeric digits starting with 1-9.`
    );
  }

  // 4. Validate GSTIN format if provided
  const gstin = (input.gstin || ORDERKING_STATUTORY_GSTIN).trim().toUpperCase();
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
    throw new VirtualKitchenComplianceError(
      "INVALID_GSTIN",
      `Invalid GSTIN '${gstin}'. Must adhere to statutory 15-character Indian GST format.`
    );
  }

  const nowIso = referenceDate.toISOString();

  return {
    kitchenId: input.kitchenId.trim(),
    kitchenName: input.kitchenName.trim(),
    legalEntityName: input.legalEntityName.trim(),
    fssaiLicenseNumber: input.fssaiLicenseNumber.trim(),
    fssaiExpiryDate: input.fssaiExpiryDate.trim(),
    gstin,
    address: input.address.trim(),
    city: input.city.trim(),
    stateCode: input.stateCode.trim(),
    pincode: input.pincode.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    maxVirtualBrands: 5,
    virtualBrands: [],
    isActive: input.isActive ?? true,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };
}

/**
 * Registers a new Virtual Brand Storefront within a Physical Commercial Kitchen.
 * Strictly enforces:
 * - Maximum 5 virtual brands multiplier ceiling.
 * - FSSAI license inheritance and active validation.
 * - Unique slug and brand ID constraints.
 * - CCPA packaging charge limits.
 */
export function registerVirtualBrandStorefront(
  kitchen: PhysicalCommercialKitchen,
  input: RegisterVirtualBrandInput,
  referenceDate: Date = new Date()
): VirtualBrandStorefront {
  // 1. Verify kitchen is active
  if (!kitchen.isActive) {
    throw new VirtualKitchenComplianceError(
      "KITCHEN_INACTIVE",
      `Cannot register virtual brand: Physical commercial kitchen '${kitchen.kitchenId}' is marked INACTIVE.`
    );
  }

  // 2. Verify kitchen FSSAI is not expired
  const expiryCheck = calculateFssaiExpiryStatus(kitchen.fssaiExpiryDate, referenceDate);
  if (expiryCheck.isExpired) {
    throw new VirtualKitchenComplianceError(
      "FSSAI_LICENSE_EXPIRED",
      `Cannot register virtual brand: Physical kitchen FSSAI license has expired (${kitchen.fssaiExpiryDate}).`
    );
  }

  // 3. Enforce Statutory Multiplier Capacity (Ceiling: 5)
  if (kitchen.virtualBrands.length >= kitchen.maxVirtualBrands) {
    throw new VirtualKitchenCapacityError(kitchen.virtualBrands.length, kitchen.maxVirtualBrands);
  }

  // 4. Validate Brand Name
  const brandName = input.brandName.trim();
  if (brandName.length < 2) {
    throw new VirtualKitchenComplianceError(
      "INVALID_SLUG_FORMAT",
      "Virtual brand name must be at least 2 characters long."
    );
  }

  // 5. Validate Slug Format (lowercase alphanumeric with hyphens)
  const cleanSlug = input.slug.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) {
    throw new VirtualKitchenComplianceError(
      "INVALID_SLUG_FORMAT",
      `Invalid slug format '${cleanSlug}'. Slugs must contain only lowercase letters, numbers, and single hyphens.`
    );
  }

  // 6. Enforce Slug Uniqueness within the Kitchen
  const slugExists = kitchen.virtualBrands.some((b) => b.slug.toLowerCase() === cleanSlug);
  if (slugExists) {
    throw new VirtualKitchenComplianceError(
      "DUPLICATE_BRAND_SLUG",
      `A virtual brand storefront with slug '${cleanSlug}' already exists in this commercial kitchen.`
    );
  }

  // 7. Enforce Brand ID Uniqueness
  const brandId = input.brandId?.trim() || `vb_${cleanSlug}_${kitchen.kitchenId.slice(-4)}`;
  const idExists = kitchen.virtualBrands.some((b) => b.brandId === brandId);
  if (idExists) {
    throw new VirtualKitchenComplianceError(
      "DUPLICATE_BRAND_ID",
      `A virtual brand with ID '${brandId}' already exists in this commercial kitchen.`
    );
  }

  // 8. Packaging Charge Cap Validation per CCPA guidelines
  let packagingCap = input.packagingChargeCapPaise ?? CCPA_MAX_PACKAGING_CHARGE_PAISE;
  if (packagingCap < 0) {
    throw new VirtualKitchenComplianceError(
      "INVALID_PACKAGING_CHARGE",
      "Packaging charge cap cannot be negative."
    );
  }
  if (packagingCap > CCPA_MAX_PACKAGING_CHARGE_PAISE) {
    packagingCap = CCPA_MAX_PACKAGING_CHARGE_PAISE;
  }

  const nowIso = referenceDate.toISOString();

  // 9. Construct brand storefront with inherited FSSAI license & GSTIN
  const newBrand: VirtualBrandStorefront = {
    brandId,
    kitchenId: kitchen.kitchenId,
    brandName,
    slug: cleanSlug,
    cuisineCategory: input.cuisineCategory,
    dietaryType: input.dietaryType,
    fssaiLicenseNumber: kitchen.fssaiLicenseNumber, // Strictly inherited from physical kitchen!
    gstin: input.gstin?.trim() || kitchen.gstin,
    menuItemCount: Math.max(0, input.menuItemCount ?? 0),
    packagingChargeCapPaise: packagingCap,
    active: true,
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
  };

  kitchen.virtualBrands.push(newBrand);
  kitchen.updatedAtIso = nowIso;

  return newBrand;
}

/**
 * Returns current utilization telemetry for the Physical Commercial Kitchen.
 */
export function getVirtualKitchenUtilization(
  kitchen: PhysicalCommercialKitchen
): VirtualKitchenUtilization {
  const registeredBrandCount = kitchen.virtualBrands.length;
  const activeBrandCount = kitchen.virtualBrands.filter((b) => b.active).length;
  const availableSlots = Math.max(0, kitchen.maxVirtualBrands - registeredBrandCount);
  const isAtCapacity = registeredBrandCount >= kitchen.maxVirtualBrands;

  return {
    kitchenId: kitchen.kitchenId,
    kitchenName: kitchen.kitchenName,
    fssaiLicenseNumber: kitchen.fssaiLicenseNumber,
    totalCapacity: 5,
    registeredBrandCount,
    activeBrandCount,
    availableSlots,
    isAtCapacity,
    brands: kitchen.virtualBrands.map((b) => ({
      brandId: b.brandId,
      brandName: b.brandName,
      slug: b.slug,
      cuisineCategory: b.cuisineCategory,
      active: b.active,
      menuItemCount: b.menuItemCount,
    })),
  };
}

/**
 * Toggles a virtual brand storefront's active status.
 */
export function setVirtualBrandActiveStatus(
  kitchen: PhysicalCommercialKitchen,
  brandId: string,
  active: boolean,
  referenceDate: Date = new Date()
): VirtualBrandStorefront {
  const brand = kitchen.virtualBrands.find((b) => b.brandId === brandId);
  if (!brand) {
    throw new VirtualKitchenComplianceError(
      "BRAND_NOT_FOUND",
      `Virtual brand with ID '${brandId}' not found in commercial kitchen '${kitchen.kitchenId}'.`
    );
  }

  // If activating, verify kitchen FSSAI is not expired
  if (active) {
    const expiryCheck = calculateFssaiExpiryStatus(kitchen.fssaiExpiryDate, referenceDate);
    if (expiryCheck.isExpired) {
      throw new VirtualKitchenComplianceError(
        "FSSAI_LICENSE_EXPIRED",
        `Cannot activate virtual brand: Physical kitchen FSSAI license is expired (${kitchen.fssaiExpiryDate}).`
      );
    }
  }

  brand.active = active;
  brand.updatedAtIso = referenceDate.toISOString();
  kitchen.updatedAtIso = brand.updatedAtIso;
  return brand;
}

/**
 * Generates an authentic Kitchen Order Ticket (KOT) for thermal printing and KDS dispatch.
 * Embeds physical kitchen premises address, shared 14-digit FSSAI license,
 * virtual brand storefront name, Section 9(5) CGST calculations, and CCPA packaging caps.
 */
export function generateVirtualBrandDispatchTicket(
  kitchen: PhysicalCommercialKitchen,
  brandId: string,
  input: CreateDispatchTicketInput,
  referenceDate: Date = new Date()
): VirtualKitchenDispatchTicket {
  const brand = kitchen.virtualBrands.find((b) => b.brandId === brandId);
  if (!brand) {
    throw new VirtualKitchenComplianceError(
      "BRAND_NOT_FOUND",
      `Virtual brand '${brandId}' not found in kitchen '${kitchen.kitchenId}'.`
    );
  }

  if (!brand.active) {
    throw new VirtualKitchenComplianceError(
      "BRAND_INACTIVE",
      `Virtual brand '${brand.brandName}' (${brand.brandId}) is currently paused or inactive.`
    );
  }

  // Calculate SafeInteger item line totals
  let subtotalPaise = 0;
  const processedItems = input.items.map((it) => {
    const qty = Math.max(1, Math.floor(it.quantity));
    const price = Math.max(0, Math.floor(it.unitPricePaise));
    const lineTotal = qty * price;
    subtotalPaise += lineTotal;
    return {
      name: it.name.trim(),
      quantity: qty,
      unitPricePaise: price,
      lineTotalPaise: lineTotal,
      specialInstructions: it.specialInstructions?.trim() || undefined,
    };
  });

  // Packaging charge respecting brand CCPA cap
  const requestedPacking = Math.max(0, Math.floor(input.packagingPaise ?? 0));
  const packagingPaise = Math.min(requestedPacking, brand.packagingChargeCapPaise);

  // Section 9(5) CGST Food Tax: 5% on (subtotal + packaging)
  const taxableAmountPaise = subtotalPaise + packagingPaise;
  const foodGstPaise = Math.round((taxableAmountPaise * FOOD_GST_BPS) / 10000);
  const totalPaise = taxableAmountPaise + foodGstPaise;

  const ticketId = `KOT-${brand.slug.slice(0, 3).toUpperCase()}-${input.orderNumber}`;
  const nowIso = referenceDate.toISOString();

  const statutoryDisclosure = `FSSAI Lic. No. ${kitchen.fssaiLicenseNumber} | Prepared at: ${kitchen.kitchenName}, ${kitchen.address}, ${kitchen.city} - ${kitchen.pincode}`;

  // Build clean ASCII KDS / Thermal format
  const divider = "================================================";
  const thinDivider = "------------------------------------------------";
  const asciiLines: string[] = [
    divider,
    `   ORDERKING KITCHEN ORDER TICKET (KOT)`,
    `   VIRTUAL BRAND: ${brand.brandName.toUpperCase()}`,
    `   COMMERCIAL KITCHEN: ${kitchen.kitchenName}`,
    divider,
    `Order Number : ${input.orderNumber}`,
    `Ticket ID    : ${ticketId}`,
    `Order Type   : ${input.orderType}${input.customerArea ? ` (${input.customerArea})` : ""}`,
    `Date & Time  : ${referenceDate.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST`,
    thinDivider,
    `ITEM                               QTY    TOTAL`,
    thinDivider,
  ];

  for (const item of processedItems) {
    const nameCol = item.name.padEnd(32).slice(0, 32);
    const qtyCol = String(item.quantity).padStart(3);
    const priceCol = `₹${(item.lineTotalPaise / 100).toFixed(2)}`.padStart(9);
    asciiLines.push(`${nameCol} ${qtyCol} ${priceCol}`);
    if (item.specialInstructions) {
      asciiLines.push(`  ** Note: ${item.specialInstructions}`);
    }
  }

  asciiLines.push(thinDivider);
  asciiLines.push(`Subtotal (Food Value):          ₹${(subtotalPaise / 100).toFixed(2).padStart(8)}`);
  if (packagingPaise > 0) {
    asciiLines.push(`Packaging (CCPA Compliant):     ₹${(packagingPaise / 100).toFixed(2).padStart(8)}`);
  }
  asciiLines.push(`CGST + SGST (5% Sec 9(5)):      ₹${(foodGstPaise / 100).toFixed(2).padStart(8)}`);
  asciiLines.push(divider);
  asciiLines.push(`GRAND TOTAL:                    ₹${(totalPaise / 100).toFixed(2).padStart(8)}`);
  asciiLines.push(divider);
  asciiLines.push(`STATUTORY FSSAI MANDATE:`);
  asciiLines.push(`Lic. No. : ${kitchen.fssaiLicenseNumber}`);
  asciiLines.push(`Location : ${kitchen.address}, ${kitchen.city}`);
  asciiLines.push(`Operator : ${kitchen.legalEntityName}`);
  asciiLines.push(divider);

  return {
    ticketId,
    orderNumber: input.orderNumber,
    orderType: input.orderType,
    kitchenId: kitchen.kitchenId,
    kitchenName: kitchen.kitchenName,
    brandId: brand.brandId,
    brandName: brand.brandName,
    fssaiLicenseNumber: kitchen.fssaiLicenseNumber,
    statutoryDisclosure,
    physicalLocation: {
      address: kitchen.address,
      city: kitchen.city,
      stateCode: kitchen.stateCode,
      pincode: kitchen.pincode,
      latitude: kitchen.latitude,
      longitude: kitchen.longitude,
    },
    items: processedItems,
    subtotalPaise,
    packagingPaise,
    foodGstPaise,
    totalPaise,
    timestampIso: nowIso,
    asciiTicket: asciiLines.join("\n"),
  };
}

/**
 * Performs a comprehensive statutory compliance audit on a Physical Commercial Kitchen
 * and its hosted virtual brands cluster.
 */
export function auditVirtualKitchenCluster(
  kitchen: PhysicalCommercialKitchen,
  referenceDate: Date = new Date()
): {
  isFullyCompliant: boolean;
  activeBrandsCount: number;
  fssaiValid: boolean;
  fssaiDaysRemaining: number;
  capacityWithinLimit: boolean;
  complianceIssues: string[];
} {
  const issues: string[] = [];

  // 1. Audit Kitchen FSSAI
  const isFssaiStructureValid = validateFssaiNumber(kitchen.fssaiLicenseNumber);
  if (!isFssaiStructureValid) {
    issues.push(`Invalid 14-digit FSSAI license structure '${kitchen.fssaiLicenseNumber}' on physical kitchen.`);
  }

  const expiry = calculateFssaiExpiryStatus(kitchen.fssaiExpiryDate, referenceDate);
  if (expiry.isExpired) {
    issues.push(`Physical kitchen FSSAI license has expired (${kitchen.fssaiExpiryDate}).`);
  }

  // 2. Audit Capacity Limit (Max 5)
  const capacityWithinLimit = kitchen.virtualBrands.length <= kitchen.maxVirtualBrands;
  if (!capacityWithinLimit) {
    issues.push(
      `Virtual kitchen exceeds statutory ceiling: hosts ${kitchen.virtualBrands.length} brands (max allowed: ${kitchen.maxVirtualBrands}).`
    );
  }

  // 3. Audit Slug Uniqueness & FSSAI Inheritance across all hosted brands
  const seenSlugs = new Set<string>();
  for (const b of kitchen.virtualBrands) {
    if (seenSlugs.has(b.slug)) {
      issues.push(`Duplicate virtual brand slug '${b.slug}' detected.`);
    }
    seenSlugs.add(b.slug);

    if (b.fssaiLicenseNumber !== kitchen.fssaiLicenseNumber) {
      issues.push(
        `Brand '${b.brandName}' FSSAI '${b.fssaiLicenseNumber}' does not match physical kitchen FSSAI '${kitchen.fssaiLicenseNumber}'.`
      );
    }

    if (b.packagingChargeCapPaise > CCPA_MAX_PACKAGING_CHARGE_PAISE) {
      issues.push(
        `Brand '${b.brandName}' packaging cap (${b.packagingChargeCapPaise} paise) exceeds CCPA statutory ceiling of ${CCPA_MAX_PACKAGING_CHARGE_PAISE} paise.`
      );
    }
  }

  return {
    isFullyCompliant: issues.length === 0,
    activeBrandsCount: kitchen.virtualBrands.filter((b) => b.active).length,
    fssaiValid: isFssaiStructureValid && !expiry.isExpired,
    fssaiDaysRemaining: expiry.daysRemaining,
    capacityWithinLimit,
    complianceIssues: issues,
  };
}
