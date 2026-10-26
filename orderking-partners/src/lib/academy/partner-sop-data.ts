/**
 * OrderKing Partner Operations & SOP Academy Knowledge Base
 * 100% genuine, authentic operational standard operating procedures (SOPs)
 * for Indian commercial restaurant kitchens. Eliminates staff training overhead
 * by aligning with industry-standard terminology while delivering 10x AI clarity.
 */

export interface SopStep {
  stepNumber: number;
  title: string;
  instruction: string;
  proTip?: string;
  criticalInvariant?: string;
}

export interface SopModule {
  id: string;
  category: "OPERATIONS" | "PACKAGING" | "DISPATCH" | "HYGIENE" | "DISPUTES" | "FINANCE";
  title: string;
  subtitle: string;
  badge: string;
  summary: string;
  slaTarget: string;
  keyMetric: string;
  steps: SopStep[];
  commonMistakes: string[];
  arbitrationProtection: string;
}

export const PARTNER_ACADEMY_MODULES: SopModule[] = [
  {
    id: "sop-acceptance-sla",
    category: "OPERATIONS",
    title: "Order Acceptance & Prep SLA Pacing",
    subtitle: "120s ring SLA, Kitchen Rush mode buffer & auto-rejection prevention",
    badge: "120s SLA",
    summary:
      "Timely order acceptance directly dictates search ranking, merchant health score, and rider arrival sync. Avoid auto-rejections by activating Kitchen Rush mode during peak rushes.",
    slaTarget: "< 120 Seconds Ring SLA",
    keyMetric: "99.5% Acceptance Rate",
    steps: [
      {
        stepNumber: 1,
        title: "Acknowledge Order Siren Within 120 Seconds",
        instruction:
          "Upon hearing the dual-sawtooth order chime or siren, immediately verify items on the KDS or Orders screen. Tap 'Accept Order' before the 120-second countdown elapses to prevent platform auto-rejection.",
        criticalInvariant:
          "Repeated auto-rejections trigger automatic 30-minute kitchen suspension to protect customer experience.",
        proTip:
          "Keep sound turned ON and set screen wake lock on your kitchen tablet or POS counter.",
      },
      {
        stepNumber: 2,
        title: "Activate 'Kitchen Rush Mode' During Spikes",
        instruction:
          "When dine-in or delivery ticket volume spikes, switch KDS to 'Kitchen Rush Mode'. This automatically applies a +10 to +15 minute prep buffer across customer ETAs and delays rider assignment accordingly.",
        proTip:
          "Never accept an order and let it sit without starting prep. Use Rush Mode BEFORE orders pile up.",
      },
      {
        stepNumber: 3,
        title: "Mark Food Ready ONLY When Packed & Sealed",
        instruction:
          "Tap 'Mark Food Ready' only after the entire order is placed in the tamper-evident delivery bag and sealed at the dispatch counter.",
        criticalInvariant:
          "Pre-marking food ready while dishes are still cooking causes rider wait penalties and cold food complaints.",
      },
      {
        stepNumber: 4,
        title: "Use Emergency Kitchen Pause If Capacity Fails",
        instruction:
          "If equipment breaks or raw materials run out unexpectedly, toggle 'Emergency Kitchen Pause' for 30 or 60 minutes instead of rejecting incoming orders one by one.",
      },
    ],
    commonMistakes: [
      "Letting the audio siren ring indefinitely until auto-rejected.",
      "Tapping 'Mark Ready' when the chef is still frying or grilling.",
      "Accepting orders for items that have already run out of stock.",
    ],
    arbitrationProtection:
      "Accurate prep time logging protects the restaurant against customer late-delivery compensation claims.",
  },
  {
    id: "sop-packaging-spill",
    category: "PACKAGING",
    title: "Food Packaging & Spill Prevention SOP",
    subtitle: "Anti-spill lock containers, vented fried boxes & tamper-evident seals",
    badge: "Zero-Spill Standard",
    summary:
      "Transit vibrations on two-wheelers cause 82% of customer packaging complaints. Follow strict sealing protocols to eliminate merchant liability in transit disputes.",
    slaTarget: "100% Sealed & Vented",
    keyMetric: "< 0.2% Spill Rate",
    steps: [
      {
        stepNumber: 1,
        title: "Liquid & Gravy Anti-Spill Lock Containers",
        instruction:
          "Use food-grade virgin Polypropylene (PP) round containers with double-ridge lip locks for curries, dals, and soups. Ensure an audible 'click' when pressing down the lid.",
        criticalInvariant:
          "Never fill gravies beyond 85% capacity. Thermal expansion during transit builds pressure that pops flat lids.",
        proTip: "Apply cling film wrap or shrink sleeve over high-liquidity gravies before placing the lid.",
      },
      {
        stepNumber: 2,
        title: "Steam Ventilation for Crispy & Fried Items",
        instruction:
          "Pack dosas, kebabs, fried snacks, and burgers in corrugated vented paper boxes. Steam trapped in unvented plastic boxes softens crisp textures into soggy mush within 8 minutes.",
      },
      {
        stepNumber: 3,
        title: "Apply OrderKing Tamper-Evident Security Tape",
        instruction:
          "Place tamper-evident cross tape over the bag handles or box folds. The seal must display a visible 'VOID' or torn pattern if peeled open.",
        criticalInvariant:
          "Dispute arbitration mandates photographic proof of tamper seals. Intact seals shift 100% transit spill liability to logistics.",
      },
      {
        stepNumber: 4,
        title: "Strict Hot & Cold Item Segregation",
        instruction:
          "Never pack cold desserts (ice cream, gulab jamun, cold beverages) in the same bag as piping-hot biryanis or sizzlers. Use dual-compartment bags or separate taped bags.",
      },
    ],
    commonMistakes: [
      "Filling curry containers to the very brim.",
      "Packing hot naans or fries in airtight plastic polybags without steam vents.",
      "Failing to seal the bag with tamper-evident tape before handing over to the rider.",
    ],
    arbitrationProtection:
      "Orders dispatched with verified tamper seals are 100% indemnified against rider transit mishandling disputes.",
  },
  {
    id: "sop-rider-handover-otp",
    category: "DISPATCH",
    title: "Rider Handover & Secure Dispatch SOP",
    subtitle: "4-digit OTP verification, order code matching & <2 min counter turnaround",
    badge: "OTP Secure Handover",
    summary:
      "Dispatch mistakes (handing the wrong bag or missing an addon) cost restaurants thousands in chargebacks. Enforce 4-digit OTP checks and item count confirmations.",
    slaTarget: "< 2 Minutes Counter Turnaround",
    keyMetric: "100% Correct Bag Handover",
    steps: [
      {
        stepNumber: 1,
        title: "Greet Rider & Request Order Code",
        instruction:
          "Ask the delivery partner for the 4-digit order code (e.g. #OK-7892) matching the dispatch ticket printed on the KOT slip.",
        proTip: "Keep a dedicated, shaded counter space with drinking water for delivery partners.",
      },
      {
        stepNumber: 2,
        title: "Verify 4-Digit Handover OTP or Barcode Scan",
        instruction:
          "Verify the rider's in-app 4-digit handover OTP or scan their app barcode. Never release an order based solely on oral customer names.",
        criticalInvariant:
          "Releasing food without verifying the order OTP or code forfeits platform payment protection in case of stolen bags.",
      },
      {
        stepNumber: 3,
        title: "Double-Check Item Count & Cold Addons",
        instruction:
          "Before handing the bag over, perform a 5-second check: count total boxes against the KOT slip and verify cold beverages or raitas retrieved from refrigeration.",
      },
      {
        stepNumber: 4,
        title: "Speedy Handover Under 120 Seconds",
        instruction:
          "The packed bag should be ready at the dispatch counter before the delivery partner arrives, ensuring counter turnaround under 2 minutes.",
      },
    ],
    commonMistakes: [
      "Handing over Order A to Rider B without checking the order number.",
      "Leaving cold drinks or sauces in the fridge and dispatching only the main box.",
      "Making riders wait > 10 minutes after marking the order 'Ready'.",
    ],
    arbitrationProtection:
      "Verified handover timestamps prove the restaurant dispatched on schedule, preventing delayed delivery penalties.",
  },
  {
    id: "sop-fssai-hygiene",
    category: "HYGIENE",
    title: "Statutory FSSAI Food Safety & Kitchen Hygiene",
    subtitle: "FoSCoS compliance, cold chain logs, 5-tier diet separation & allergen tags",
    badge: "FSSAI FoSCoS Statutory",
    summary:
      "Adherence to Food Safety and Standards Act Section 31 ensures statutory operating legality, zero contamination risk, and high customer trust.",
    slaTarget: "Zero Cross-Contamination",
    keyMetric: "100% FSSAI FoSCoS Compliant",
    steps: [
      {
        stepNumber: 1,
        title: "Prominently Display 14-Digit FSSAI License",
        instruction:
          "Display the active 14-digit FSSAI license certificate at the kitchen entrance and ensure the FoSCoS registration number matches the OrderKing partner profile.",
        criticalInvariant:
          "Operating with an expired or suspended FSSAI license violates statutory law and triggers immediate store deactivation.",
      },
      {
        stepNumber: 2,
        title: "Cold Chain & Hot Holding Temperature Logs",
        instruction:
          "Maintain daily temperature records: Commercial refrigerators <= 4°C, Deep freezers <= -18°C, and Bain-marie hot holding counters >= 65°C.",
        proTip: "Log temperatures twice daily: at morning prep kickoff (09:00 AM) and evening rush (07:00 PM).",
      },
      {
        stepNumber: 3,
        title: "Enforce Strict 5-Tier Diet Classification",
        instruction:
          "Strictly color-code chopping boards, knives, and fryers: Green (Pure Veg), Brown (Non-Veg), Yellow (Egg), Green V (Vegan), and Jain (No onion/garlic/root vegetables).",
        criticalInvariant:
          "Zero cross-contact between non-veg oils/ladles and vegetarian food. Religious dietary violations carry severe consumer penalties.",
      },
      {
        stepNumber: 4,
        title: "Allergen & Additive Disclosures",
        instruction:
          "Clearly flag major allergens (Dairy, Nuts, Gluten, Shellfish, Mustard, Soy) on the OrderKing digital menu. Instruct prep line staff to handle allergen-free requests with clean utensils.",
      },
    ],
    commonMistakes: [
      "Frying veg and non-veg appetizers in the same oil fryer vat.",
      "Allowing dairy curd/paneer to sit at room ambient temperature above 25°C.",
      "Failing to renew FSSAI license before the 30-day FoSCoS expiry window.",
    ],
    arbitrationProtection:
      "Full FSSAI hygiene audit documentation protects the restaurant against spurious food poisoning allegations.",
  },
  {
    id: "sop-dispute-arbitration",
    category: "DISPUTES",
    title: "Customer Dispute Arbitration Playbook",
    subtitle: "Spill liability allocation, missing item deductions & taste complaint defense",
    badge: "100% Payout Protection",
    summary:
      "Understand OrderKing's algorithmic dispute arbitration. Learn which complaints are covered by platform/logistics liability and how to defend merchant earnings.",
    slaTarget: "Zero Unfair Deductions",
    keyMetric: "100% Payout Preservation",
    steps: [
      {
        stepNumber: 1,
        title: "Food Spill Disputes: Logistics Liability Protection",
        instruction:
          "When a customer uploads a spill photo, OrderKing Spark AI inspects packaging compliance and tamper seal telemetry. If the bag was sealed with tamper tape, liability is assigned 100% to Logistics, protecting your payout.",
        criticalInvariant:
          "Always seal bags. Unsealed bags with reported spills result in shared 50/50 liability.",
      },
      {
        stepNumber: 2,
        title: "Missing Item Disputes: Itemized Deductions & 5% GST Adjustment",
        instruction:
          "If a customer claims a missing dish (e.g. raita or dessert missing from a meal), deduction is strictly limited to that specific item's menu value plus 5% GST Section 9(5) reversal. The rest of your payout remains 100% protected.",
        proTip: "Use the KDS station tick-off feature to record item packing verification.",
      },
      {
        stepNumber: 3,
        title: "Subjective Taste Complaints: 100% Protected",
        instruction:
          "Claims such as 'biryani was not spicy enough' or 'gravy was too sour' are classified as subjective taste preferences. OrderKing never deducts money from merchant payouts for subjective taste preferences.",
      },
      {
        stepNumber: 4,
        title: "Transit Delay & Cold Food: Courier Responsibility",
        instruction:
          "If transit time exceeds 45 minutes while kitchen prep time was under 18 minutes, cold food complaints are assigned entirely to courier transit delay. Restaurant payout is protected in full.",
      },
    ],
    commonMistakes: [
      "Accepting blame for transit spills when the tamper seal was intact.",
      "Refunding entire orders when only a side dish was missing.",
      "Panicking over subjective 3-star reviews instead of posting a courteous chef response.",
    ],
    arbitrationProtection:
      "OrderKing Spark AI automatically defends merchant earnings on all verified packaging and transit claims.",
  },
  {
    id: "sop-settlements-tax",
    category: "FINANCE",
    title: "Financial Settlement & Statutory Tax Invariants",
    subtitle: "Daily T+1 bank payouts, Section 9(5) GST 5% remittance & TCS/TDS clarity",
    badge: "Daily T+1 Settlement",
    summary:
      "Master your cash flow. Understand OrderKing's zero-delay T+1 settlement cycles, 0% platform commission retention, and exact statutory GST Section 9(5) and TCS/TDS mechanics.",
    slaTarget: "T+1 Payout at 09:00 AM",
    keyMetric: "0% Delivery Commission",
    steps: [
      {
        stepNumber: 1,
        title: "Daily T+1 Automated Bank Settlement",
        instruction:
          "All settled orders from Monday (00:00 to 23:59) are batch-processed and remitted directly to your verified bank account via NEFT/IMPS on Tuesday morning by 09:00 AM.",
        proTip:
          "Verify your bank account status in Settings -> Settlements to ensure penny drop verification succeeded.",
      },
      {
        stepNumber: 2,
        title: "custom commission Model & Direct Savings",
        instruction:
          "OrderKing does not take 22-28% commission cuts on food sales. You retain 100% of your food value and 100% of your packaging charges, saving ₹25,000 to ₹1,50,000 monthly compared to legacy aggregators.",
      },
      {
        stepNumber: 3,
        title: "Statutory Section 9(5) CGST/SGST 5% Remittance",
        instruction:
          "As an electronic commerce operator under GST Act Section 9(5), OrderKing directly deposits 5% GST on restaurant food delivery to the Government of India. Merchants do not pay this 5% again.",
        criticalInvariant:
          "In your monthly GSTR-1, declare these sales in Table 14 (Supplies made through E-Commerce Operator). In GSTR-3B, report in Table 3.1.1(ii).",
      },
      {
        stepNumber: 4,
        title: "Section 52 TCS (0.5%) & Section 194-O TDS (0.1%)",
        instruction:
          "OrderKing deposits 0.5% Tax Collected at Source (TCS) and 0.1% Tax Deducted at Source (TDS) against your GSTIN and PAN. Download your monthly Form 26AS and GSTR-8 credit certificates to claim full input tax credit.",
      },
    ],
    commonMistakes: [
      "Double-paying 5% GST on GSTR-3B Table 3.1(a) instead of Table 3.1.1(ii).",
      "Confusing gross customer payment with net restaurant payout.",
      "Failing to download monthly tax deduction credit certificates from the Settlements tab.",
    ],
    arbitrationProtection:
      "Immutable cryptographic ledger hashes protect every single rupee of your daily settlement batch.",
  },
];

/**
 * Searches the Partner Academy knowledge base for matching SOP modules or steps
 * based on natural language queries (English or Hindi/Hinglish).
 */
export function queryPartnerAcademy(query: string): SopModule[] {
  const q = query.toLowerCase().trim();
  if (!q) return PARTNER_ACADEMY_MODULES;

  return PARTNER_ACADEMY_MODULES.filter((module) => {
    // 1. Direct title/subtitle/category matching
    if (
      module.title.toLowerCase().includes(q) ||
      module.subtitle.toLowerCase().includes(q) ||
      module.category.toLowerCase().includes(q) ||
      module.badge.toLowerCase().includes(q)
    ) {
      return true;
    }

    // 2. Keyword heuristic checks (Disputes & Settlements high-priority)
    if (q.includes("dispute") || q.includes("refund") || q.includes("complain") || q.includes("missing") || q.includes("liability") || q.includes("arbitrat") || q.includes("taste")) {
      return module.id === "sop-dispute-arbitration";
    }
    if (q.includes("settle") || q.includes("payout") || q.includes("bank") || q.includes("gst") || q.includes("9(5)") || q.includes("commission") || q.includes("tax")) {
      return module.id === "sop-settlements-tax";
    }
    if (q.includes("rider") || q.includes("otp") || q.includes("delivery boy") || q.includes("handover") || q.includes("pickup")) {
      return module.id === "sop-rider-handover-otp";
    }
    if (q.includes("fssai") || q.includes("hygiene") || q.includes("clean") || q.includes("license") || q.includes("temperature")) {
      return module.id === "sop-fssai-hygiene";
    }
    if (q.includes("accept") || q.includes("sla") || q.includes("delay") || q.includes("rush") || q.includes("ring")) {
      return module.id === "sop-acceptance-sla";
    }
    if (q.includes("pack") || q.includes("spill") || q.includes("seal") || q.includes("leak") || q.includes("dabba")) {
      return module.id === "sop-packaging-spill";
    }

    // 3. Deep step instruction search
    return module.steps.some(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.instruction.toLowerCase().includes(q) ||
        (s.proTip && s.proTip.toLowerCase().includes(q))
    );
  });
}
