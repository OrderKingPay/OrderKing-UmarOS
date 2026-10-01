import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/api/v1/growth/qualify")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const { requireUserId } = await import("@/lib/auth/verify.server");
          const { ensureWorkspace } = await import("@/lib/orderking/server/workspace.server");
          const { recordTargetQualification } = await import("@/lib/orderking/growth/target-bonus.server");
          const userId = await requireUserId();
          const workspace = await ensureWorkspace(userId);
          if (!workspace.ctx.permissions.includes("access_AI") && !workspace.ctx.permissions.includes("view_finance")) return Response.json({ error:"FORBIDDEN" },{status:403});
          const body = await request.json();
          const result = await recordTargetQualification({
            campaignId: String(body?.campaignId || ""),
            participantType: body?.participantType,
            participantId: String(body?.participantId || ""),
            periodStart: body?.periodStart,
            periodEnd: body?.periodEnd,
          });
          return Response.json(result);
        } catch (error: any) {
          return Response.json({ accepted:false, error:error?.message || "Growth qualification failed" },{status:400});
        }
      },
    },
  },
});