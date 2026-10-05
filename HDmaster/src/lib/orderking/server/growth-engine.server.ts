import { getSql } from "@/lib/db";
import { randomUUID } from "crypto";

export type GrowthReferral = {
  id: string;
  orgId: string;
  referrerId: string;
  referrerType: 'CUSTOMER' | 'RIDER' | 'RESTAURANT';
  referredId: string;
  referredType: 'CUSTOMER' | 'RIDER' | 'RESTAURANT';
  signupLat?: number;
  signupLng?: number;
  signupH3Index?: string;
  status: 'PENDING' | 'ACTIVATED' | 'FIRST_ORDER_DONE';
  rewardAmountInr: number;
  rewardPaidOut: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function getGrowthReferralsFromDb(orgId: string): Promise<GrowthReferral[]> {
  const sql = await getSql();
  const rows = await sql`
    SELECT * FROM growth_referrals
    WHERE org_id = ${orgId}
    ORDER BY created_at DESC
  `;
  return rows.map(r => ({
    id: String(r.id),
    orgId: String(r.org_id),
    referrerId: String(r.referrer_id),
    referrerType: String(r.referrer_type) as any,
    referredId: String(r.referred_id),
    referredType: String(r.referred_type) as any,
    signupLat: r.signup_lat ? Number(r.signup_lat) : undefined,
    signupLng: r.signup_lng ? Number(r.signup_lng) : undefined,
    signupH3Index: r.signup_h3_index ? String(r.signup_h3_index) : undefined,
    status: String(r.status) as any,
    rewardAmountInr: Number(r.reward_amount_inr),
    rewardPaidOut: Boolean(r.reward_paid_out),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  }));
}

export async function saveGrowthReferralToDb(
  orgId: string, 
  data: Omit<GrowthReferral, "id" | "orgId" | "createdAt" | "updatedAt">
): Promise<void> {
  const sql = await getSql();
  const id = randomUUID();
  await sql`
    INSERT INTO growth_referrals (
      id, org_id, referrer_id, referrer_type, referred_id, referred_type, 
      signup_lat, signup_lng, signup_h3_index, status, reward_amount_inr, reward_paid_out
    ) VALUES (
      ${id}, ${orgId}, ${data.referrerId}, ${data.referrerType}, ${data.referredId}, ${data.referredType},
      ${data.signupLat ?? null}, ${data.signupLng ?? null}, ${data.signupH3Index ?? null}, 
      ${data.status}, ${data.rewardAmountInr}, ${data.rewardPaidOut}
    )
  `;
}
