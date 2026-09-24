/**
 * HDmaster Founder AI — Cost Control & Expense Optimization Engine (§24)
 *
 * Tracks:
 * - AI API costs (OpenAI, Anthropic, Gemini tokens)
 * - Hosting (Vercel, Cloudflare Pages, AWS)
 * - Storage & Database (PGlite local vs RDS/Supabase)
 * - Payment Gateway Fees (UPI 0% vs Razorpay/Stripe 2%)
 * - Third-Party Services & Telephony
 *
 * Strict Rule: Automatically recommend cheaper equivalent approaches
 * when quality, latency, and reliability are preserved.
 */

export interface ExpenseItem {
  id: string;
  category: "AI_TOKENS" | "HOSTING" | "DATABASE" | "PAYMENT_FEES" | "THIRD_PARTY";
  name: string;
  currentMonthlyCostInr: number;
  provider: string;
  isOptimized: boolean;
  alternative?: {
    recommendedSolution: string;
    projectedMonthlyCostInr: number;
    monthlySavingsInr: number;
    qualityImpact: "NONE" | "NEGLIGIBLE" | "MODERATE";
    implementationSteps: string;
  };
}

export interface CostControlReport {
  timestamp: string;
  totalMonthlySpendInr: number;
  totalProjectedSavingsInr: number;
  expenses: ExpenseItem[];
  optimizationRecommendations: string[];
}

export const INITIAL_EXPENSE_ITEMS: ExpenseItem[] = [
  {
    id: "EXP-PAYMENTS",
    category: "PAYMENT_FEES",
    name: "Payment Gateway Processing Fees",
    currentMonthlyCostInr: 18000,
    provider: "Traditional Card/Netbanking Gateway (2%)",
    isOptimized: false,
    alternative: {
      recommendedSolution: "King Pay Direct UPI QR Settlement (0% MDR)",
      projectedMonthlyCostInr: 0,
      monthlySavingsInr: 18000,
      qualityImpact: "NONE",
      implementationSteps: "Route all domestic transactions through direct UPI VPA (orderking@okhdfcbank). Instant bank settlement, zero gateway cut.",
    },
  },
  {
    id: "EXP-DATABASE",
    category: "DATABASE",
    name: "Managed Cloud Postgres Instance",
    currentMonthlyCostInr: 4500,
    provider: "AWS RDS PostgreSQL",
    isOptimized: false,
    alternative: {
      recommendedSolution: "In-Browser & Local PGlite WebAssembly Database",
      projectedMonthlyCostInr: 0,
      monthlySavingsInr: 4500,
      qualityImpact: "NONE",
      implementationSteps: "Run transactional queries in client-side PGlite WASM with local IndexedDB persistence for offline-first zero cloud cost.",
    },
  },
  {
    id: "EXP-AI-VOICE",
    category: "AI_TOKENS",
    name: "External Cloud Voice Synthesis",
    currentMonthlyCostInr: 12500,
    provider: "Cloud TTS Provider ($0.06/min)",
    isOptimized: false,
    alternative: {
      recommendedSolution: "Client-Side Web Speech Synthesis API",
      projectedMonthlyCostInr: 0,
      monthlySavingsInr: 12500,
      qualityImpact: "NONE",
      implementationSteps: "Use browser-native Web Speech synthesis with custom pitch/rate tuning. Sub-50ms latency, zero cloud API bills.",
    },
  },
  {
    id: "EXP-HOSTING",
    category: "HOSTING",
    name: "Edge Application Hosting",
    currentMonthlyCostInr: 1650,
    provider: "Vercel Pro Team",
    isOptimized: true,
  },
];

export function generateCostControlReport(): CostControlReport {
  const totalSpend = INITIAL_EXPENSE_ITEMS.reduce((acc, item) => acc + item.currentMonthlyCostInr, 0);
  const totalSavings = INITIAL_EXPENSE_ITEMS.reduce(
    (acc, item) => acc + (item.alternative ? item.alternative.monthlySavingsInr : 0),
    0
  );

  const recommendations = INITIAL_EXPENSE_ITEMS.filter((item) => !item.isOptimized && item.alternative).map(
    (item) =>
      `Switch "${item.name}" to ${item.alternative!.recommendedSolution}: Saves ₹${item.alternative!.monthlySavingsInr.toLocaleString()}/month with zero quality degradation.`
  );

  return {
    timestamp: new Date().toISOString(),
    totalMonthlySpendInr: totalSpend,
    totalProjectedSavingsInr: totalSavings,
    expenses: INITIAL_EXPENSE_ITEMS,
    optimizationRecommendations: recommendations,
  };
}
