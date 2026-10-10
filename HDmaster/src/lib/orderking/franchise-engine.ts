import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import crypto from "node:crypto";

export type FranchiseTier = "STANDARD_MERCHANT" | "PRIORITY_PARTNER" | "EXECUTIVE_FLAGSHIP";

export interface B2BFranchiseContractRecord {
  id: string;
  contract_number: string;
  invoice_number: string;
  restaurant_id: string | null;
  restaurant_name: string;
  legal_entity_name: string;
  brand_name: string;
  signatory_name: string;
  signatory_title: string;
  contact_email: string;
  contact_phone: string;
  gstin: string | null;
  pan_number: string | null;
  fssai_license: string | null;
  registered_address: string;
  city: string;
  state: string;
  pincode: string;
  tier: FranchiseTier;
  setup_fee_inr: number;
  gst_rate_pct: number;
  gst_amount_inr: number;
  total_payable_inr: number;
  payment_status: "PENDING" | "PAID" | "VERIFIED_ESCROW" | "SETTLED";
  payment_method: string | null;
  payment_reference: string | null;
  paid_at: string | null;
  contract_status: "DRAFT" | "ISSUED" | "SIGNED" | "EXECUTED";
  signed_at: string | null;
  digital_signature_hash: string | null;
  terms_accepted: boolean;
  ip_address: string | null;
  deliverables: string[];
  custom_terms: string[];
  created_at: string;
  updated_at: string;
}

export interface FranchiseSummaryMetrics {
  totalContracts: number;
  totalCapitalCollectedInr: number;
  pendingCapitalPipelineInr: number;
  totalSetupFeeInvoicedInr: number;
  executedContractsCount: number;
  avgDealValueInr: number;
}

export interface ExistingRestaurantOption {
  id: string;
  name: string;
  legal_name: string | null;
  address: string | null;
  status: string;
  kyc_status: string;
}

export const TIER_CONFIGS: Record<
  FranchiseTier,
  {
    name: string;
    tagline: string;
    baseFeeInr: number;
    recommendedTakeRatePct: number;
    deliverables: string[];
  }
> = {
  STANDARD_MERCHANT: {
    name: "Standard Priority Merchant",
    tagline: "Foundational Merchant Digitization & VIP Catalog Onboarding",
    baseFeeInr: 10000,
    recommendedTakeRatePct: 18.0,
    deliverables: [
      "Expedited 48-Hour Menu Ingestion, High-Resolution Photography Tagging & Category Optimization",
      "Dedicated OrderKing Merchant Partner Web/Tablet Console License & Staff Operational Guide",
      "Standard Thermal Kitchen Display System (KDS) Driver Integration Protocol",
      "Pre-Launch FSSAI Hygiene Audit & Official Digital Verification Crest on Consumer App",
      "Introductory 30-Day Zero Commission Take-Rate Waiver (Subsidized on First ₹50,000 GMV)",
    ],
  },
  PRIORITY_PARTNER: {
    name: "Growth Franchise Partner",
    tagline: "Hyperlocal Zone Radiance & Accelerated Dispatch Fleet Priority",
    baseFeeInr: 25000,
    recommendedTakeRatePct: 16.5,
    deliverables: [
      "Everything in Standard Priority Merchant Tier",
      "Top-3 Zone Grid Boost: Guaranteed High-Visibility Geofence Placement on Consumer App Launch",
      "Dedicated Merchant UPI/Card Gateway Instance with T+1 Automated Escrow Sweep Settlements",
      "AI Predictive Demand Tuning: Menu Dynamic Pricing Engine & Inventory Stockout Protection",
      "3x Featured In-App Carousel Placements during Platform Grand Opening Week",
      "Direct Founder Strategy Briefing: Hyperlocal Delivery Economics & Revenue Optimization",
    ],
  },
  EXECUTIVE_FLAGSHIP: {
    name: "Sovereign Flagship & Multi-Outlet Brand",
    tagline: "Bespoke Multi-Node Kitchen Orchestration & VIP Fleet Dispatch SLA",
    baseFeeInr: 50000,
    recommendedTakeRatePct: 15.0,
    deliverables: [
      "Everything in Growth Franchise Partner Tier",
      "Sub-8 Minute Priority Courier Dispatch SLA with Guaranteed Fleet Routing Allocation",
      "Multi-Outlet Cloud Routing Matrix for Central Production Kitchens & Cloud Brands",
      "Direct Custom ERP & POS Webhook Bridge (Petpooja, UrbanPiper, POSist, POS-Bridge)",
      "Exclusive Co-Branded Marketing Push Notification Blitz to 10,000+ Verified Area Foodies",
      "Lifetime 1.5% Commercial Take-Rate Discount on Gross Platform Order Value",
      "24/7 Dedicated Institutional Key Account Manager & Direct Founder Support Escalation Line",
    ],
  },
};

// 1. GET: Fetch all contracts, metrics, and real existing restaurants
export const getFranchiseOnboardingData = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    contracts: B2BFranchiseContractRecord[];
    metrics: FranchiseSummaryMetrics;
    restaurants: ExistingRestaurantOption[];
  }> => {
    try {
      const sql = await getSql();

      // Query real contracts from Postgres
      const rows = await sql<B2BFranchiseContractRecord>`
        SELECT 
          id,
          contract_number,
          invoice_number,
          restaurant_id,
          restaurant_name,
          legal_entity_name,
          brand_name,
          signatory_name,
          signatory_title,
          contact_email,
          contact_phone,
          gstin,
          pan_number,
          fssai_license,
          registered_address,
          city,
          state,
          pincode,
          tier,
          setup_fee_inr,
          gst_rate_pct,
          gst_amount_inr,
          total_payable_inr,
          payment_status,
          payment_method,
          payment_reference,
          paid_at,
          contract_status,
          signed_at,
          digital_signature_hash,
          terms_accepted,
          ip_address,
          deliverables,
          custom_terms,
          created_at,
          updated_at
        FROM b2b_franchise_contracts
        ORDER BY created_at DESC
      `;

      // Query real restaurants in system
      let restaurants: ExistingRestaurantOption[] = [];
      try {
        restaurants = await sql<ExistingRestaurantOption>`
          SELECT id, name, legal_name, address, status, kyc_status 
          FROM restaurants 
          ORDER BY name ASC 
          LIMIT 50
        `;
      } catch (e) {
        console.warn("Could not load restaurants:", e);
      }

      // Compute exact mathematical metrics from database records
      let totalCollected = 0;
      let totalPipeline = 0;
      let totalInvoiced = 0;
      let executedCount = 0;

      rows.forEach((c) => {
        const total = Number(c.total_payable_inr) || 0;
        totalInvoiced += total;
        if (c.payment_status === "PAID" || c.payment_status === "SETTLED") {
          totalCollected += total;
        } else {
          totalPipeline += total;
        }
        if (c.contract_status === "EXECUTED" || c.terms_accepted) {
          executedCount++;
        }
      });

      const avgDeal = rows.length > 0 ? Math.round(totalInvoiced / rows.length) : 0;

      return {
        contracts: rows,
        metrics: {
          totalContracts: rows.length,
          totalCapitalCollectedInr: totalCollected,
          pendingCapitalPipelineInr: totalPipeline,
          totalSetupFeeInvoicedInr: totalInvoiced,
          executedContractsCount: executedCount,
          avgDealValueInr: avgDeal,
        },
        restaurants,
      };
    } catch (err) {
      console.error("Error in getFranchiseOnboardingData:", err);
      return {
        contracts: [],
        metrics: {
          totalContracts: 0,
          totalCapitalCollectedInr: 0,
          pendingCapitalPipelineInr: 0,
          totalSetupFeeInvoicedInr: 0,
          executedContractsCount: 0,
          avgDealValueInr: 0,
        },
        restaurants: [],
      };
    }
  }
);

// 2. CREATE: Generate new Master Merchant Franchise Contract & Tax Invoice
export interface CreateContractInput {
  restaurantId?: string;
  restaurantName: string;
  legalEntityName: string;
  brandName: string;
  signatoryName: string;
  signatoryTitle: string;
  contactEmail: string;
  contactPhone: string;
  gstin?: string;
  panNumber?: string;
  fssaiLicense?: string;
  registeredAddress: string;
  city: string;
  state: string;
  pincode: string;
  tier: FranchiseTier;
  setupFeeInr: number;
  paymentMethod?: string;
  customTerms?: string[];
}

export const createFranchiseContract = createServerFn({ method: "POST" })
  .validator((input: CreateContractInput) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; contractId?: string; error?: string }> => {
    try {
      const sql = await getSql();

      const fee = Math.max(10000, Math.min(50000, Number(data.setupFeeInr) || 25000));
      const gstRate = 18.0;
      const gstAmount = Math.round(fee * 0.18);
      const totalPayable = fee + gstAmount;

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const year = new Date().getFullYear();
      const contractNumber = `OK-MMSA-${year}-${randomSuffix}`;
      const invoiceNumber = `INV-B2B-${year}-${randomSuffix}`;
      const id = `b2b_cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      // Tier deliverables
      const tierConfig = TIER_CONFIGS[data.tier] || TIER_CONFIGS.PRIORITY_PARTNER;
      const deliverablesList = tierConfig.deliverables;

      // Cryptographic signature hash representing agreement data authenticity
      const hashPayload = `${contractNumber}:${invoiceNumber}:${data.legalEntityName}:${fee}:${Date.now()}`;
      const digitalSignatureHash = crypto.createHash("sha256").update(hashPayload).digest("hex");

      const deliverablesJson = JSON.stringify(deliverablesList);
      const customTermsJson = JSON.stringify(data.customTerms || []);

      await sql`
        INSERT INTO b2b_franchise_contracts (
          id,
          contract_number,
          invoice_number,
          restaurant_id,
          restaurant_name,
          legal_entity_name,
          brand_name,
          signatory_name,
          signatory_title,
          contact_email,
          contact_phone,
          gstin,
          pan_number,
          fssai_license,
          registered_address,
          city,
          state,
          pincode,
          tier,
          setup_fee_inr,
          gst_rate_pct,
          gst_amount_inr,
          total_payable_inr,
          payment_status,
          payment_method,
          contract_status,
          digital_signature_hash,
          terms_accepted,
          deliverables,
          custom_terms,
          created_at,
          updated_at
        ) VALUES (
          ${id},
          ${contractNumber},
          ${invoiceNumber},
          ${data.restaurantId || null},
          ${data.restaurantName},
          ${data.legalEntityName},
          ${data.brandName},
          ${data.signatoryName},
          ${data.signatoryTitle},
          ${data.contactEmail},
          ${data.contactPhone},
          ${data.gstin || null},
          ${data.panNumber || null},
          ${data.fssaiLicense || null},
          ${data.registeredAddress},
          ${data.city},
          ${data.state},
          ${data.pincode},
          ${data.tier},
          ${fee},
          ${gstRate},
          ${gstAmount},
          ${totalPayable},
          'PENDING',
          ${data.paymentMethod || 'UPI_NEFT_IMPS'},
          'ISSUED',
          ${digitalSignatureHash},
          false,
          ${deliverablesJson}::jsonb,
          ${customTermsJson}::jsonb,
          NOW(),
          NOW()
        )
      `;

      return { ok: true, contractId: id };
    } catch (err: any) {
      console.error("Failed to create franchise contract:", err);
      return { ok: false, error: err?.message || "Internal database error" };
    }
  });

// 3. UPDATE: Record Payment Settled for Upfront Setup Fee
export interface RecordPaymentInput {
  contractId: string;
  paymentMethod: string;
  paymentReference: string;
}

export const recordFranchisePayment = createServerFn({ method: "POST" })
  .validator((input: RecordPaymentInput) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const sql = await getSql();
      await sql`
        UPDATE b2b_franchise_contracts
        SET 
          payment_status = 'PAID',
          payment_method = ${data.paymentMethod},
          payment_reference = ${data.paymentReference},
          paid_at = NOW(),
          updated_at = NOW()
        WHERE id = ${data.contractId}
      `;
      return { ok: true };
    } catch (err: any) {
      console.error("Failed to record payment:", err);
      return { ok: false, error: err?.message || "Internal database error" };
    }
  });

// 4. EXECUTE: Digitally Attest and Execute Contract
export interface ExecuteSignatureInput {
  contractId: string;
  signatoryName: string;
  signatoryTitle: string;
  ipAddress?: string;
}

export const executeContractSignature = createServerFn({ method: "POST" })
  .validator((input: ExecuteSignatureInput) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const sql = await getSql();
      await sql`
        UPDATE b2b_franchise_contracts
        SET 
          contract_status = 'EXECUTED',
          terms_accepted = true,
          signed_at = NOW(),
          signatory_name = ${data.signatoryName},
          signatory_title = ${data.signatoryTitle},
          ip_address = ${data.ipAddress || '127.0.0.1'},
          updated_at = NOW()
        WHERE id = ${data.contractId}
      `;
      return { ok: true };
    } catch (err: any) {
      console.error("Failed to execute digital signature:", err);
      return { ok: false, error: err?.message || "Internal database error" };
    }
  });

// 5. DELETE: Remove Draft / Void Contract
export const deleteFranchiseContract = createServerFn({ method: "POST" })
  .validator((input: { contractId: string }) => input)
  .handler(async ({ data }): Promise<{ ok: boolean; error?: string }> => {
    try {
      const sql = await getSql();
      await sql`
        DELETE FROM b2b_franchise_contracts
        WHERE id = ${data.contractId}
      `;
      return { ok: true };
    } catch (err: any) {
      console.error("Failed to delete franchise contract:", err);
      return { ok: false, error: err?.message || "Internal database error" };
    }
  });
