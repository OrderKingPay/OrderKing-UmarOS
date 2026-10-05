// @ts-nocheck
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { getSql } from "@/lib/db";
import { nid } from "@/lib/orderking/server/workspace.server";

type EscalationPayload = {
  escalationId: string;
  restaurantId: string;
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  subject: string;
  details: string;
  geographicContext?: string | null;
  createdByUserId?: string | null;
};

const priorityFor = (severity: EscalationPayload["severity"]): string => {
  if (severity === "CRITICAL") return "CRITICAL";
  if (severity === "HIGH") return "HIGH";
  if (severity === "LOW") return "LOW";
  return "MEDIUM";
};

export const APIRoute = createAPIFileRoute("/api/internal/partner-escalations")({
  POST: async ({ request }: { request: Request }) => {
        const configuredSecret = process.env.UMAR_OS_ESCALATION_SECRET?.trim();
        if (!configuredSecret) {
          return new Response(JSON.stringify({ ok: false, error: "connector_not_configured" }), {
            status: 503,
            headers: { "content-type": "application/json" },
          });
        }

        const authorization = request.headers.get("authorization") || "";
        if (authorization !== `Bearer ${configuredSecret}`) {
          return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }

        try {
          const body = (await request.json()) as EscalationPayload;
          if (!body?.escalationId || !body?.restaurantId || !body?.subject || !body?.details) {
            return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            });
          }

          const sql = await getSql();
          const restaurants = await sql.query<{
            org_id: string;
            city_id: string;
            zone_id: string;
            name: string;
          }>(
            `select org_id, city_id, zone_id, name
             from restaurants
             where id = $1
             limit 1`,
            [body.restaurantId],
          );
          const restaurant = restaurants[0];
          if (!restaurant) {
            return new Response(JSON.stringify({ ok: false, error: "restaurant_not_found" }), {
              status: 404,
              headers: { "content-type": "application/json" },
            });
          }

          const ticketId = nid("tkt");
          await sql.query(
            `insert into tickets (
              id, org_id, city_id, queue, category, status, priority, subject,
              restaurant_id, sla_minutes, data_mode
            ) values ($1,$2,$3,'partner',$4,'OPEN',$5,$6,$7,$8,'ACTUAL')`,
            [
              ticketId,
              restaurant.org_id,
              restaurant.city_id,
              body.category.slice(0, 80),
              priorityFor(body.severity),
              body.subject.slice(0, 180),
              body.restaurantId,
              body.severity === "CRITICAL" ? 15 : body.severity === "HIGH" ? 30 : 60,
            ],
          );

          await sql.query(
            `insert into ticket_messages (
              id, ticket_id, org_id, visibility, author_type, body
            ) values ($1,$2,$3,'internal','system',$4)`,
            [
              nid("tm"),
              ticketId,
              restaurant.org_id,
              [
                `Partner escalation source: ${body.escalationId}`,
                `Restaurant: ${restaurant.name} (${body.restaurantId})`,
                `Details: ${body.details.slice(0, 6000)}`,
                body.geographicContext ? `Geographic context: ${body.geographicContext.slice(0, 300)}` : "",
                body.createdByUserId ? `Created by partner user: ${body.createdByUserId}` : "",
              ].filter(Boolean).join("\n"),
            ],
          );

          return new Response(JSON.stringify({
            ok: true,
            ticketId,
            status: "OPEN",
            queue: "partner",
            dataMode: "ACTUAL",
          }), {
            status: 201,
            headers: { "content-type": "application/json" },
          });
        } catch (error) {
          return new Response(JSON.stringify({
            ok: false,
            error: error instanceof Error ? error.message : "internal_error",
          }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }
  },
});
