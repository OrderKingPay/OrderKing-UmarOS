import { createAPIFileRoute } from "@/lib/createAPIFileRoute";
import { getSessionUser } from "@/lib/auth/verify.server";
import { getSql } from "@/lib/db";

export const APIRoute = createAPIFileRoute("/api/v1/founder/pr-nominations")({
  GET: async () => {
    try {
      const session = await getSessionUser();
      if (!session?.id) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      const sql = await getSql();
      const roleRows = await sql`SELECT role FROM users WHERE id = ${session.id} LIMIT 1`;
      const role = roleRows.length > 0 ? String((roleRows[0] as any).role || "").toUpperCase() : "";
      if (!["SUPER_ADMIN", "FOUNDER", "ADMIN"].includes(role)) {
        return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      const awards = [
        {
          id: "forbes-asia",
          title: "Forbes 30 Under 30 Asia",
          organization: "Forbes Media",
          deadline: "Upcoming",
          url: "https://www.forbes.com/30-under-30/asia/",
          status: "OPEN_FOR_NOMINATIONS",
          pitch:
            "OrderKing is a food-delivery, restaurant SaaS, and logistics platform built with integer-paise financial accounting and edge infrastructure.",
        },
        {
          id: "ey-eoy",
          title: "EY Entrepreneur Of The Year - India",
          organization: "Ernst & Young",
          deadline: "Check Site for Next Cohort",
          url: "https://www.ey.com/en_in/entrepreneur-of-the-year",
          status: "PREPARING",
          pitch:
            "OrderKing provides direct-to-consumer restaurant ordering, merchant kitchen management, and transparent rider dispatch.",
        },
        {
          id: "tedx-global",
          title: "TEDx Speaker Application",
          organization: "TED Conferences",
          deadline: "Rolling",
          url: "https://www.ted.com/participate/organize-a-local-tedx-event/tedx-speaker-guidelines",
          status: "READY_TO_SUBMIT",
          pitch: "Topic: Transparent Unit Economics in Last-Mile Food Delivery and Regional Commerce.",
        },
        {
          id: "ycombinator",
          title: "Y Combinator Startup Application",
          organization: "Y Combinator",
          deadline: "Next Batch",
          url: "https://www.ycombinator.com/apply",
          status: "READY",
          pitch: "OrderKing unifies customer delivery, restaurant partner SaaS, rider logistics, and B2B franchise enablement.",
        },
      ];

      return new Response(JSON.stringify({ success: true, awards }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Failed to fetch awards:", error);
      return new Response(JSON.stringify({ success: false, error: "Failed to fetch honors and awards" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
