
import { createFileRoute } from "@tanstack/react-router";
import { testModelConnectivity } from "@/lib/ai/real-model-registry";
import { getSessionUser } from "@/lib/auth/verify.server";

export const Route = createFileRoute("/api/admin/test-connection")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        try {
          const user = await getSessionUser();
          if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "content-type": "application/json" },
            });
          }

          const founderEmails = new Set(
            (process.env.ORDERKING_FOUNDER_EMAILS ||
              "hmhabibullah9@gmail.com,founder@orderking.app,hasan@orderking.app")
              .split(",")
              .map((email) => email.trim().toLowerCase())
              .filter(Boolean),
          );
          if (!user.email || !founderEmails.has(user.email.trim().toLowerCase())) {
            return new Response(JSON.stringify({ error: "Founder access required" }), {
              status: 403,
              headers: { "content-type": "application/json" },
            });
          }

          const body = await request.json() as { modelId: string };
          const result = await testModelConnectivity(body.modelId);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          console.error("POST /api/admin/test-connection error:", error);
          return new Response(
            JSON.stringify({ error: "Internal error testing connection" }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});
