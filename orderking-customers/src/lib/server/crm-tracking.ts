import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export const trackEvent = createServerFn({ method: "POST" })
  .validator((data: { 
    eventType: string, 
    affiliateCode?: string, 
    referralCode?: string, 
    metadata?: Record<string, any> 
  }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    let affiliateId = null;
    let referralId = null;

    if (data.affiliateCode) {
      const aff = await sql<{ id: string }>`SELECT id FROM crm_affiliates WHERE affiliate_code = ${data.affiliateCode}`;
      if (aff.length > 0) affiliateId = aff[0].id;
    }

    if (data.referralCode) {
      const ref = await sql<{ id: string }>`SELECT id FROM crm_referral_programs WHERE referral_code = ${data.referralCode}`;
      if (ref.length > 0) referralId = ref[0].id;
    }

    await sql`
      INSERT INTO crm_tracking_events (event_type, affiliate_id, referral_id, metadata)
      VALUES (${data.eventType}, ${affiliateId}, ${referralId}, ${data.metadata ? JSON.stringify(data.metadata) : null})
    `;

    return { success: true };
  });

export const logCommunication = createServerFn({ method: "POST" })
  .validator((data: {
    channel: string,
    recipient: string,
    status: string,
    templateId?: string,
    metadata?: Record<string, any>
  }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    
    await sql`
      INSERT INTO crm_communications (channel, recipient, status, template_id, sent_at, metadata)
      VALUES (${data.channel}, ${data.recipient}, ${data.status}, ${data.templateId || null}, NOW(), ${data.metadata ? JSON.stringify(data.metadata) : null})
    `;

    return { success: true };
  });

export const getAffiliateStats = createServerFn({ method: "GET" })
  .validator((data: { affiliateCode: string }) => data)
  .handler(async ({ data }) => {
    const sql = await getSql();
    const stats = await sql<{ event_type: string, count: number }>`
      SELECT e.event_type, COUNT(*) as count 
      FROM crm_tracking_events e
      JOIN crm_affiliates a ON e.affiliate_id = a.id
      WHERE a.affiliate_code = ${data.affiliateCode}
      GROUP BY e.event_type
    `;
    
    return { affiliateCode: data.affiliateCode, stats };
  });
