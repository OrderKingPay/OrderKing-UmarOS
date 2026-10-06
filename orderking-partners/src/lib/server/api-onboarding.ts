// @ts-nocheck
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { withVendor } from "./helpers";
import { getSql } from "@/lib/db";

export const updateFSSAI = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; fssaiLicense: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "dashboard.edit", async (sql, ctx) => {
      await sql`
        UPDATE restaurants
        SET fssai_license = ${data.fssaiLicense},
            verification_status = 'PENDING'
        WHERE id = ${ctx.restaurantId}
      `;
      return { ok: true };
    });
  });

export const updateKYC = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: { restaurantId?: string; bankAccount: string }) => d)
  .handler(async ({ context, data }) => {
    return withVendor(context.userId, data.restaurantId, "dashboard.edit", async (sql, ctx) => {
      await sql`
        UPDATE restaurants
        SET bank_account = ${data.bankAccount},
            verification_status = 'PENDING'
        WHERE id = ${ctx.restaurantId}
      `;
      return { ok: true };
    });
  });

