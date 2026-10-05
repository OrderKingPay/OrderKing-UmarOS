import { Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { getSql } from "@/lib/db";

export class SubscriptionController {
  public static async subscribe(req: Request, res: Response) {
    try {
      const customerId = String(req.body?.customerId ?? "").trim();
      const planName = String(req.body?.planName ?? "").trim();

      if (!customerId || !planName) {
        return res.status(400).json({ error: "customerId and planName are required" });
      }

      const plans: Record<string, { pricePaise: number; durationMonths: number }> = {
        KING_PASS_MONTHLY: { pricePaise: 19900, durationMonths: 1 },
        KING_PASS_YEARLY: { pricePaise: 199900, durationMonths: 12 },
      };

      const plan = plans[planName];
      if (!plan) {
        return res.status(400).json({ error: "Invalid planName" });
      }

      const validUntil = new Date();
      validUntil.setMonth(validUntil.getMonth() + plan.durationMonths);

      const sql = await getSql();
      const subscriptionId = randomUUID();
      const result = await sql<{ id: string }>`
        INSERT INTO customer_subscriptions
          (id, customer_id, plan_name, price_paise, status, valid_until)
        VALUES
          (${subscriptionId}, ${customerId}, ${planName}, ${plan.pricePaise}, 'ACTIVE', ${validUntil.toISOString()})
        RETURNING id
      `;

      if (result.length !== 1 || result[0]?.id !== subscriptionId) {
        throw new Error("Subscription persistence failed");
      }

      return res.status(201).json({
        success: true,
        data: {
          subscriptionId,
          planName,
          validUntil,
          pricePaise: plan.pricePaise,
        },
      });
    } catch (error) {
      console.error("Subscription error:", error);
      return res.status(500).json({ error: "Subscription could not be created" });
    }
  }

  public static async getSubscription(req: Request, res: Response) {
    try {
      const customerId = String(req.params?.customerId ?? "").trim();
      if (!customerId) {
        return res.status(400).json({ error: "customerId is required" });
      }

      const sql = await getSql();
      const result = await sql<{
        id: string;
        customer_id: string;
        plan_name: string;
        price_paise: number;
        status: string;
        valid_until: string;
        created_at: string;
      }>`
        SELECT id, customer_id, plan_name, price_paise, status, valid_until, created_at
        FROM customer_subscriptions
        WHERE customer_id = ${customerId}
          AND status = 'ACTIVE'
          AND valid_until > NOW()
        ORDER BY valid_until DESC
        LIMIT 1
      `;

      return res.status(200).json({
        success: true,
        data: result[0] ?? null,
      });
    } catch (error) {
      console.error("Subscription lookup error:", error);
      return res.status(500).json({ error: "Subscription lookup failed" });
    }
  }
}
