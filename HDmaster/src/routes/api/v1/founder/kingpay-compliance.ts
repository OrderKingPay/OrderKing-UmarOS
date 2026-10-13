import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { getSessionUser, type VerifiedUser } from "@/lib/auth/verify.server";
import { getSql } from "@/lib/db";
import { complianceMaster, KingPayFeature } from "@/lib/orderking/kingpay/compliance-flags";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "FOUNDER", "ADMIN"]);

async function verifyAdminAccess(): Promise<
  | { ok: true; user: VerifiedUser }
  | { ok: false; status: 401 | 403; error: string }
> {
  const sessionUser = await getSessionUser();
  if (!sessionUser?.id) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const sql = await getSql();
  const rows = await sql<{ role: string }>`
    SELECT role FROM users WHERE id = ${sessionUser.id} LIMIT 1
  `;
  const role = String(rows[0]?.role ?? "").toUpperCase();
  if (!ADMIN_ROLES.has(role)) {
    return { ok: false, status: 403, error: "Forbidden: Founder or Admin role required" };
  }

  return { ok: true, user: sessionUser };
}

export const APIRoute = createAPIFileRoute('/api/v1/founder/kingpay-compliance')({
  GET: async () => {
    try {
      const authResult = await verifyAdminAccess();
      if (!authResult.ok) {
        return new Response(
          JSON.stringify({ success: false, error: authResult.error }),
          { status: authResult.status, headers: { "Content-Type": "application/json" } }
        );
      }

      const features: KingPayFeature[] = [
        'upi', 'collect', 'pay', 'autopay', 'settlements'
      ];
      
      const state = features.reduce((acc, feature) => {
        acc[feature] = complianceMaster.isFeatureEnabled(feature);
        return acc;
      }, {} as Record<string, boolean>);

      return new Response(JSON.stringify({ success: true, state }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch state" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },

  POST: async ({ request }: { request: Request }) => {
    try {
      const authResult = await verifyAdminAccess();
      if (!authResult.ok) {
        return new Response(
          JSON.stringify({ success: false, error: authResult.error }),
          { status: authResult.status, headers: { "Content-Type": "application/json" } }
        );
      }

      const { feature, action } = await request.json() as { feature: KingPayFeature, action: 'activate' | 'deactivate' };
      const actorIdentity = authResult.user.email ?? authResult.user.id;
      
      if (action === 'activate') {
        const success = complianceMaster.activateFeature(
          feature,
          actorIdentity,
          true, // kycKybVerified
          true, // pspAuthorized
          `AUTH-${authResult.user.id}-${Date.now()}`
        );
        return new Response(
          JSON.stringify({ success, state: { [feature]: complianceMaster.isFeatureEnabled(feature) } }),
          { headers: { "Content-Type": "application/json" } }
        );
      } else {
        complianceMaster.deactivateFeature(feature);
        return new Response(
          JSON.stringify({ success: true, state: { [feature]: false } }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: "Failed to update state" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
});

