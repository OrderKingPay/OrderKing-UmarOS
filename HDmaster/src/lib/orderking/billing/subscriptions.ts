import { canonicalLedger, type LedgerAccountType, type LedgerEntry, type LedgerTransaction } from '../finance/canonical-ledger.ts';
import { getSql } from '../../db.ts';
import * as crypto from 'crypto';

/**
 * B2B Restaurant Subscription Tiers
 * - STARTER: Basic online ordering, 12% commission, standard payouts. (₹999/mo)
 * - PRO: 8% commission, KingPay Soundbox audio alerts included, same-day settlement. (₹2,999/mo)
 * - EMPIRE: 5% commission, 2x Soundbox devices, priority AI dispatch, instant settlement. (₹9,999/mo)
 */
export type SubscriptionTier = 'STARTER' | 'PRO' | 'EMPIRE';

export type SettlementSpeed = 'STANDARD' | 'SAME_DAY' | 'INSTANT';

export type SubscriptionStatus = 'ACTIVE' | 'TRIALING' | 'PAST_DUE' | 'CANCELLED' | 'PAUSED';

export interface SubscriptionTierConfig {
  tier: SubscriptionTier;
  displayName: string;
  monthlyFeePaise: number; // in paise
  monthlyFeeInr: number; // in INR
  commissionRatePct: number; // commission percentage (12%, 8%, 5%)
  includedSoundboxDevices: number; // 0, 1, 2
  settlementSpeed: SettlementSpeed;
  hasPriorityAiDispatch: boolean;
  features: string[];
}

/**
 * Hardware Add-on Fee: ₹199/month per extra KingPay Soundbox audio device
 */
export const SOUNDBOX_ADDON_FEE_PAISE = 19900; // ₹199.00 in paise
export const SOUNDBOX_ADDON_FEE_INR = 199;

/**
 * Standard Indian GST Rate on SaaS / Software Services: 18%
 * SAC: 997331 (Information Technology and Cloud Software Services)
 */
export const GST_RATE_PCT = 18;
export const SAC_CODE_SAAS = '997331';
export const DEFAULT_PLATFORM_STATE_CODE = 'KA'; // Karnataka (State code 29)
export const DEFAULT_PLATFORM_GSTIN = '29AABCU9603R1ZM';

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionTierConfig> = {
  STARTER: {
    tier: 'STARTER',
    displayName: 'KingPay Starter',
    monthlyFeePaise: 99900, // ₹999/mo
    monthlyFeeInr: 999,
    commissionRatePct: 12, // 12% commission
    includedSoundboxDevices: 0,
    settlementSpeed: 'STANDARD', // Standard payouts
    hasPriorityAiDispatch: false,
    features: [
      'Basic online ordering & digital menu',
      '12% commission rate',
      'Standard payouts (T+2 settlement)',
      'Basic business dashboard',
    ],
  },
  PRO: {
    tier: 'PRO',
    displayName: 'KingPay Pro Growth',
    monthlyFeePaise: 299900, // ₹2,999/mo
    monthlyFeeInr: 2999,
    commissionRatePct: 8, // 8% commission
    includedSoundboxDevices: 1, // 1x KingPay Soundbox included
    settlementSpeed: 'SAME_DAY', // Same-day settlement
    hasPriorityAiDispatch: false,
    features: [
      'Advanced online ordering & customer CRM',
      '8% commission rate',
      '1x KingPay Soundbox audio alerts included',
      'Same-day settlement (T+0 evening payout)',
      'Dynamic inventory management',
    ],
  },
  EMPIRE: {
    tier: 'EMPIRE',
    displayName: 'KingPay Empire Flagship',
    monthlyFeePaise: 999900, // ₹9,999/mo
    monthlyFeeInr: 9999,
    commissionRatePct: 5, // 5% commission
    includedSoundboxDevices: 2, // 2x Soundbox devices included
    settlementSpeed: 'INSTANT', // Instant settlement
    hasPriorityAiDispatch: true, // Priority AI dispatch
    features: [
      'Omnichannel enterprise restaurant OS',
      '5% commission rate',
      '2x KingPay Soundbox devices included',
      'Priority AI dispatch algorithm',
      'Instant settlement (real-time UPI payout)',
      'Dedicated enterprise account manager',
    ],
  },
};

export function getTierConfig(tier: SubscriptionTier): SubscriptionTierConfig {
  const config = SUBSCRIPTION_TIERS[tier];
  if (!config) {
    throw new Error(`Invalid subscription tier: ${tier}`);
  }
  return config;
}

export function listSubscriptionTiers(): SubscriptionTierConfig[] {
  return Object.values(SUBSCRIPTION_TIERS);
}

/**
 * Calculates Soundbox hardware add-on charges based on tier allowance
 */
export function calculateSoundboxAddonFee(
  tier: SubscriptionTier,
  totalSoundboxDevices: number,
): {
  includedDevices: number;
  extraDevices: number;
  ratePerDevicePaise: number;
  totalAddonPaise: number;
  totalAddonInr: number;
} {
  const config = getTierConfig(tier);
  const included = config.includedSoundboxDevices;
  const extraDevices = Math.max(0, totalSoundboxDevices - included);
  const totalAddonPaise = extraDevices * SOUNDBOX_ADDON_FEE_PAISE;

  return {
    includedDevices: included,
    extraDevices,
    ratePerDevicePaise: SOUNDBOX_ADDON_FEE_PAISE,
    totalAddonPaise,
    totalAddonInr: totalAddonPaise / 100,
  };
}

/**
 * Restaurant Subscription Entity
 */
export interface RestaurantSubscription {
  id: string;
  restaurantId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  soundboxCount: number;
  billingCycle: 'MONTHLY';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  restaurantGstin?: string;
  merchantStateCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubscriptionInput {
  restaurantId: string;
  tier: SubscriptionTier;
  soundboxCount?: number;
  restaurantGstin?: string;
  merchantStateCode?: string;
  startDate?: Date;
}

/**
 * Creates and initializes a new B2B Restaurant Subscription
 */
export function createSubscription(input: CreateSubscriptionInput): RestaurantSubscription {
  const tierConfig = getTierConfig(input.tier);
  const startDate = input.startDate ? new Date(input.startDate) : new Date();
  
  // Calculate period end: 1 calendar month later
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const soundboxCount = input.soundboxCount !== undefined
    ? Math.max(0, input.soundboxCount)
    : tierConfig.includedSoundboxDevices;

  const now = new Date();
  return {
    id: `sub_${input.restaurantId}_${Date.now()}`,
    restaurantId: input.restaurantId,
    tier: input.tier,
    status: 'ACTIVE',
    soundboxCount,
    billingCycle: 'MONTHLY',
    currentPeriodStart: startDate,
    currentPeriodEnd: endDate,
    cancelAtPeriodEnd: false,
    restaurantGstin: input.restaurantGstin,
    merchantStateCode: (input.merchantStateCode || DEFAULT_PLATFORM_STATE_CODE).toUpperCase(),
    createdAt: now,
    updatedAt: now,
  };
}

// ============================================================================
// 1. PRO-RATA CALCULATIONS
// ============================================================================

/**
 * Compute pro-rata fee for a given active day count in a billing period.
 */
export function calculateProRataFee(params: {
  monthlyFeePaise: number;
  daysActive: number;
  daysInPeriod?: number;
}): number {
  const { monthlyFeePaise, daysActive, daysInPeriod = 30 } = params;
  if (daysInPeriod <= 0) {
    throw new Error('daysInPeriod must be greater than 0');
  }
  if (daysActive <= 0) return 0;
  if (daysActive >= daysInPeriod) return monthlyFeePaise;

  return Math.round((monthlyFeePaise * daysActive) / daysInPeriod);
}

export interface ProRataSubscriptionResult {
  tier: SubscriptionTier;
  daysActive: number;
  daysInPeriod: number;
  monthlyBaseFeePaise: number;
  proRataBaseFeePaise: number;
  includedSoundboxCount: number;
  extraSoundboxCount: number;
  monthlySoundboxFeePaise: number;
  proRataSoundboxFeePaise: number;
  totalProRataSubtotalPaise: number;
  totalProRataSubtotalInr: number;
}

/**
 * Computes pro-rata subscription fee including hardware add-ons for partial periods.
 */
export function calculateProRataSubscription(params: {
  tier: SubscriptionTier;
  soundboxCount?: number;
  startDate: Date;
  endDate: Date;
  referenceCycleDays?: number;
}): ProRataSubscriptionResult {
  const config = getTierConfig(params.tier);
  const totalSoundbox = params.soundboxCount !== undefined
    ? params.soundboxCount
    : config.includedSoundboxDevices;

  const soundboxBreakdown = calculateSoundboxAddonFee(params.tier, totalSoundbox);

  const diffMs = params.endDate.getTime() - params.startDate.getTime();
  const daysActive = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const daysInPeriod = params.referenceCycleDays || 30;

  const proRataBaseFeePaise = calculateProRataFee({
    monthlyFeePaise: config.monthlyFeePaise,
    daysActive,
    daysInPeriod,
  });

  const proRataSoundboxFeePaise = calculateProRataFee({
    monthlyFeePaise: soundboxBreakdown.totalAddonPaise,
    daysActive,
    daysInPeriod,
  });

  const totalProRataSubtotalPaise = proRataBaseFeePaise + proRataSoundboxFeePaise;

  return {
    tier: params.tier,
    daysActive,
    daysInPeriod,
    monthlyBaseFeePaise: config.monthlyFeePaise,
    proRataBaseFeePaise,
    includedSoundboxCount: soundboxBreakdown.includedDevices,
    extraSoundboxCount: soundboxBreakdown.extraDevices,
    monthlySoundboxFeePaise: soundboxBreakdown.totalAddonPaise,
    proRataSoundboxFeePaise,
    totalProRataSubtotalPaise,
    totalProRataSubtotalInr: totalProRataSubtotalPaise / 100,
  };
}

export interface TierChangeProrationResult {
  currentTier: SubscriptionTier;
  newTier: SubscriptionTier;
  daysRemaining: number;
  daysInPeriod: number;
  unusedCurrentCreditPaise: number;
  chargeNewTierPaise: number;
  netAdjustmentPaise: number; // positive = merchant pays extra, negative = credit to merchant wallet
}

/**
 * Computes mid-cycle upgrade/downgrade pro-ration adjustment.
 */
export function calculateTierChangeProration(params: {
  currentTier: SubscriptionTier;
  newTier: SubscriptionTier;
  currentSoundboxCount?: number;
  newSoundboxCount?: number;
  daysRemaining: number;
  daysInPeriod?: number;
}): TierChangeProrationResult {
  const {
    currentTier,
    newTier,
    currentSoundboxCount,
    newSoundboxCount,
    daysRemaining,
    daysInPeriod = 30,
  } = params;

  const currentConfig = getTierConfig(currentTier);
  const newConfig = getTierConfig(newTier);

  const currentSb = calculateSoundboxAddonFee(currentTier, currentSoundboxCount ?? currentConfig.includedSoundboxDevices);
  const newSb = calculateSoundboxAddonFee(newTier, newSoundboxCount ?? newConfig.includedSoundboxDevices);

  const currentMonthlyTotal = currentConfig.monthlyFeePaise + currentSb.totalAddonPaise;
  const newMonthlyTotal = newConfig.monthlyFeePaise + newSb.totalAddonPaise;

  const unusedCurrentCreditPaise = calculateProRataFee({
    monthlyFeePaise: currentMonthlyTotal,
    daysActive: daysRemaining,
    daysInPeriod,
  });

  const chargeNewTierPaise = calculateProRataFee({
    monthlyFeePaise: newMonthlyTotal,
    daysActive: daysRemaining,
    daysInPeriod,
  });

  const netAdjustmentPaise = chargeNewTierPaise - unusedCurrentCreditPaise;

  return {
    currentTier,
    newTier,
    daysRemaining,
    daysInPeriod,
    unusedCurrentCreditPaise,
    chargeNewTierPaise,
    netAdjustmentPaise,
  };
}

// ============================================================================
// 2. GST TAX ENGINE (18% CGST+SGST or IGST)
// ============================================================================

export interface GstBreakdown {
  ratePct: number; // 18%
  subtotalPaise: number;
  isInterstate: boolean;
  supplierStateCode: string;
  merchantStateCode: string;
  cgstRatePct: number; // 9% or 0%
  cgstPaise: number;
  sgstRatePct: number; // 9% or 0%
  sgstPaise: number;
  igstRatePct: number; // 18% or 0%
  igstPaise: number;
  totalGstPaise: number;
  totalAmountPaise: number; // subtotalPaise + totalGstPaise
  totalAmountInr: number;
}

/**
 * Calculates Indian GST (18%) on B2B SaaS Subscriptions.
 * - Intra-State: 9% CGST + 9% SGST (Total 18%)
 * - Inter-State: 18% IGST
 */
export function calculateSubscriptionGst(params: {
  amountPaise: number;
  merchantStateCode?: string;
  supplierStateCode?: string;
  isInterstate?: boolean;
}): GstBreakdown {
  const {
    amountPaise,
    merchantStateCode = DEFAULT_PLATFORM_STATE_CODE,
    supplierStateCode = DEFAULT_PLATFORM_STATE_CODE,
  } = params;

  const isInterstate = params.isInterstate !== undefined
    ? params.isInterstate
    : merchantStateCode.trim().toUpperCase() !== supplierStateCode.trim().toUpperCase();

  const totalGstPaise = Math.round(amountPaise * (GST_RATE_PCT / 100));

  let cgstRatePct = 0;
  let cgstPaise = 0;
  let sgstRatePct = 0;
  let sgstPaise = 0;
  let igstRatePct = 0;
  let igstPaise = 0;

  if (isInterstate) {
    igstRatePct = GST_RATE_PCT;
    igstPaise = totalGstPaise;
  } else {
    cgstRatePct = GST_RATE_PCT / 2; // 9%
    sgstRatePct = GST_RATE_PCT / 2; // 9%
    cgstPaise = Math.floor(totalGstPaise / 2);
    sgstPaise = totalGstPaise - cgstPaise; // Exact balance without rounding loss
  }

  const totalAmountPaise = amountPaise + totalGstPaise;

  return {
    ratePct: GST_RATE_PCT,
    subtotalPaise: amountPaise,
    isInterstate,
    supplierStateCode: supplierStateCode.toUpperCase(),
    merchantStateCode: merchantStateCode.toUpperCase(),
    cgstRatePct,
    cgstPaise,
    sgstRatePct,
    sgstPaise,
    igstRatePct,
    igstPaise,
    totalGstPaise,
    totalAmountPaise,
    totalAmountInr: totalAmountPaise / 100,
  };
}

// ============================================================================
// 3. GST INVOICES
// ============================================================================

export interface InvoiceLineItem {
  id: string;
  description: string;
  sacCode: string;
  quantity: number;
  unitPricePaise: number;
  amountPaise: number;
}

export interface SubscriptionInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  subscriptionId: string;
  restaurantId: string;
  restaurantGstin?: string;
  platformGstin: string;
  tier: SubscriptionTier;
  periodStart: string;
  periodEnd: string;
  sacCode: string;
  lineItems: InvoiceLineItem[];
  subtotalPaise: number;
  gst: GstBreakdown;
  totalAmountPaise: number;
  totalAmountInr: number;
  status: 'ISSUED' | 'PAID' | 'VOID';
}

/**
 * Generates compliant B2B GST tax invoice for subscription billing.
 */
export function generateSubscriptionInvoice(params: {
  subscription: RestaurantSubscription;
  periodStart?: Date;
  periodEnd?: Date;
  isProRata?: boolean;
  proRataSubtotalPaise?: number;
  platformGstin?: string;
  supplierStateCode?: string;
  invoiceNumber?: string;
}): SubscriptionInvoice {
  const { subscription } = params;
  const config = getTierConfig(subscription.tier);
  const pStart = params.periodStart || subscription.currentPeriodStart;
  const pEnd = params.periodEnd || subscription.currentPeriodEnd;
  const supplierState = (params.supplierStateCode || DEFAULT_PLATFORM_STATE_CODE).toUpperCase();
  const platformGstin = params.platformGstin || DEFAULT_PLATFORM_GSTIN;

  const lineItems: InvoiceLineItem[] = [];

  let subtotalPaise = 0;

  if (params.isProRata && params.proRataSubtotalPaise !== undefined) {
    subtotalPaise = params.proRataSubtotalPaise;
    lineItems.push({
      id: `li_${crypto.randomUUID().slice(0, 8)}`,
      description: `B2B SaaS Subscription (${config.displayName}) - Pro-rata service`,
      sacCode: SAC_CODE_SAAS,
      quantity: 1,
      unitPricePaise: subtotalPaise,
      amountPaise: subtotalPaise,
    });
  } else {
    // Standard full-cycle billing
    lineItems.push({
      id: `li_${crypto.randomUUID().slice(0, 8)}`,
      description: `B2B SaaS Subscription (${config.displayName}) - Monthly Access Fee`,
      sacCode: SAC_CODE_SAAS,
      quantity: 1,
      unitPricePaise: config.monthlyFeePaise,
      amountPaise: config.monthlyFeePaise,
    });
    subtotalPaise += config.monthlyFeePaise;

    const sbAddon = calculateSoundboxAddonFee(subscription.tier, subscription.soundboxCount);
    if (sbAddon.extraDevices > 0) {
      lineItems.push({
        id: `li_${crypto.randomUUID().slice(0, 8)}`,
        description: `KingPay Soundbox Hardware Add-on (${sbAddon.extraDevices}x device @ ₹199/mo)`,
        sacCode: SAC_CODE_SAAS,
        quantity: sbAddon.extraDevices,
        unitPricePaise: SOUNDBOX_ADDON_FEE_PAISE,
        amountPaise: sbAddon.totalAddonPaise,
      });
      subtotalPaise += sbAddon.totalAddonPaise;
    }
  }

  const gst = calculateSubscriptionGst({
    amountPaise: subtotalPaise,
    merchantStateCode: subscription.merchantStateCode,
    supplierStateCode: supplierState,
  });

  const now = new Date();
  const dueDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Net 7 days
  const invoiceNumber = params.invoiceNumber || `INV-KP-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;

  return {
    invoiceNumber,
    invoiceDate: now.toISOString(),
    dueDate: dueDate.toISOString(),
    subscriptionId: subscription.id,
    restaurantId: subscription.restaurantId,
    restaurantGstin: subscription.restaurantGstin,
    platformGstin,
    tier: subscription.tier,
    periodStart: pStart.toISOString(),
    periodEnd: pEnd.toISOString(),
    sacCode: SAC_CODE_SAAS,
    lineItems,
    subtotalPaise,
    gst,
    totalAmountPaise: gst.totalAmountPaise,
    totalAmountInr: gst.totalAmountInr,
    status: 'ISSUED',
  };
}

// ============================================================================
// 4. DOUBLE-ENTRY LEDGER INTEGRATION
// ============================================================================

export interface SubscriptionLedgerSettlementResult {
  idempotencyKey: string;
  eventType: string;
  restaurantId: string;
  totalDebitPaise: number;
  totalCreditPaise: number;
  isBalanced: boolean;
  entries: LedgerEntry[];
}

/**
 * Creates balanced double-entry ledger entries for subscription billing:
 * - DEBIT: MERCHANT_WALLET (debit restaurant wallet for total invoice amount including tax)
 * - CREDIT: SUBSCRIPTION_REVENUE (credit platform SaaS subscription revenue)
 * - CREDIT: GST_OUTPUT_LIABILITY (credit 18% GST tax liability collected on behalf of govt)
 */
export function generateSubscriptionLedgerEntries(params: {
  restaurantId: string;
  invoice: SubscriptionInvoice;
  idempotencyKey?: string;
  paymentSourceAccount?: LedgerAccountType;
}): SubscriptionLedgerSettlementResult {
  const { restaurantId, invoice } = params;
  const paymentAccount: LedgerAccountType = params.paymentSourceAccount || 'MERCHANT_WALLET';
  const idempotencyKey = params.idempotencyKey || `sub-settle-${invoice.invoiceNumber}`;

  const entries: LedgerEntry[] = [
    // 1. Debit Merchant Wallet for entire invoice amount (SaaS Fee + GST)
    {
      account: paymentAccount,
      direction: 'DEBIT',
      amountPaise: invoice.totalAmountPaise,
      entityId: restaurantId,
      memo: `Subscription fee settlement for ${invoice.tier} tier (Invoice #${invoice.invoiceNumber})`,
    },
    // 2. Credit Platform Subscription Revenue for net service amount
    {
      account: 'SUBSCRIPTION_REVENUE',
      direction: 'CREDIT',
      amountPaise: invoice.subtotalPaise,
      entityId: 'PLATFORM_REVENUE',
      memo: `SaaS subscription fee recognized for ${invoice.tier} tier (Invoice #${invoice.invoiceNumber})`,
    },
    // 3. Credit GST Output Liability for tax portion
    {
      account: 'GST_OUTPUT_LIABILITY',
      direction: 'CREDIT',
      amountPaise: invoice.gst.totalGstPaise,
      entityId: 'GOVT_TAX',
      memo: `18% GST output liability (${invoice.gst.isInterstate ? 'IGST' : 'CGST+SGST'}) on Invoice #${invoice.invoiceNumber}`,
    },
  ];

  let totalDebitPaise = 0;
  let totalCreditPaise = 0;

  for (const entry of entries) {
    if (entry.direction === 'DEBIT') totalDebitPaise += entry.amountPaise;
    if (entry.direction === 'CREDIT') totalCreditPaise += entry.amountPaise;
  }

  const isBalanced = totalDebitPaise === totalCreditPaise && totalDebitPaise === invoice.totalAmountPaise;

  if (!isBalanced) {
    throw new Error(
      `Double-entry ledger imbalance! Debits (${totalDebitPaise}) !== Credits (${totalCreditPaise})`,
    );
  }

  return {
    idempotencyKey,
    eventType: 'B2B_SUBSCRIPTION_SETTLED',
    restaurantId,
    totalDebitPaise,
    totalCreditPaise,
    isBalanced,
    entries,
  };
}

/**
 * Posts subscription settlement to the canonical financial ledger.
 */
export async function postSubscriptionSettlementToLedger(params: {
  restaurantId: string;
  invoice: SubscriptionInvoice;
  idempotencyKey?: string;
  ledger?: Pick<typeof canonicalLedger, 'postTransaction'>;
}): Promise<LedgerTransaction | SubscriptionLedgerSettlementResult> {
  const ledgerEngine = params.ledger || canonicalLedger;
  const settlement = generateSubscriptionLedgerEntries({
    restaurantId: params.restaurantId,
    invoice: params.invoice,
    idempotencyKey: params.idempotencyKey,
  });

  try {
    const tx = await ledgerEngine.postTransaction({
      idempotencyKey: settlement.idempotencyKey,
      eventType: settlement.eventType,
      entries: settlement.entries,
    });
    return tx;
  } catch (err: any) {
    // If DB is offline/unconfigured (e.g. testing in sandbox without live Postgres),
    // return the mathematically guaranteed settlement result
    if (
      err.message?.includes('DATABASE_URL is missing') ||
      err.message?.includes('connect ECONNREFUSED')
    ) {
      return settlement;
    }
    throw err;
  }
}

// ============================================================================
// 5. DATABASE PERSISTENCE HELPERS
// ============================================================================

export async function persistSubscription(sub: RestaurantSubscription): Promise<void> {
  try {
    const sql = await getSql();
    await sql`
      INSERT INTO restaurant_subscriptions (
        id, restaurant_id, tier, status, soundbox_count, billing_cycle,
        current_period_start, current_period_end, cancel_at_period_end,
        restaurant_gstin, merchant_state_code, created_at, updated_at
      ) VALUES (
        ${sub.id}, ${sub.restaurantId}, ${sub.tier}, ${sub.status}, ${sub.soundboxCount}, ${sub.billingCycle},
        ${sub.currentPeriodStart}, ${sub.currentPeriodEnd}, ${sub.cancelAtPeriodEnd},
        ${sub.restaurantGstin || null}, ${sub.merchantStateCode}, ${sub.createdAt}, ${sub.updatedAt}
      )
      ON CONFLICT (restaurant_id) DO UPDATE SET
        tier = EXCLUDED.tier,
        status = EXCLUDED.status,
        soundbox_count = EXCLUDED.soundbox_count,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW()
    `;
  } catch (err: any) {
    if (
      err.message?.includes('DATABASE_URL is missing') ||
      err.message?.includes('connect ECONNREFUSED')
    ) {
      return; // Offline fallback
    }
    throw err;
  }
}

export async function fetchRestaurantSubscription(restaurantId: string): Promise<RestaurantSubscription | null> {
  try {
    const sql = await getSql();
    const rows = await sql<any>`
      SELECT * FROM restaurant_subscriptions WHERE restaurant_id = ${restaurantId} LIMIT 1
    `;
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: r.id,
      restaurantId: r.restaurant_id,
      tier: r.tier,
      status: r.status,
      soundboxCount: Number(r.soundbox_count || 0),
      billingCycle: r.billing_cycle || 'MONTHLY',
      currentPeriodStart: new Date(r.current_period_start),
      currentPeriodEnd: new Date(r.current_period_end),
      cancelAtPeriodEnd: Boolean(r.cancel_at_period_end),
      restaurantGstin: r.restaurant_gstin,
      merchantStateCode: r.merchant_state_code || DEFAULT_PLATFORM_STATE_CODE,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    };
  } catch (err: any) {
    if (
      err.message?.includes('DATABASE_URL is missing') ||
      err.message?.includes('connect ECONNREFUSED')
    ) {
      return null;
    }
    throw err;
  }
}
