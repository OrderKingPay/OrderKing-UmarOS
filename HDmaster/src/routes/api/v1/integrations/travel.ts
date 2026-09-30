// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";

async function amadeusToken() {
  const clientId = process.env.AMADEUS_CLIENT_ID?.trim();
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("AMADEUS_NOT_CONFIGURED");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });
  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) throw new Error(`AMADEUS_TOKEN_HTTP_${response.status}`);
  return (await response.json()).access_token as string;
}

export const Route = createFileRoute("/api/v1/integrations/travel")({
  // @ts-expect-error
  server: {
    handlers: {
      POST: async ({ request }: any) => {
        const { requireUserId } = await import("@/lib/auth/verify.server");
        try {
          await requireUserId();
          const body = await request.json();
          const type = String(body?.type || "").toUpperCase();
          const origin = String(body?.origin || "").trim().toUpperCase();
          const destination = String(body?.destination || "").trim().toUpperCase();
          const date = String(body?.date || "").trim();

          if (!origin || !destination || !date) {
            return Response.json({ success: false, status: "INVALID_REQUEST", message: "origin, destination and date are required." }, { status: 400 });
          }

          if (type === "FLIGHT") {
            const token = await amadeusToken();
            const url = new URL("https://test.api.amadeus.com/v2/shopping/flight-offers");
            url.searchParams.set("originLocationCode", origin);
            url.searchParams.set("destinationLocationCode", destination);
            url.searchParams.set("departureDate", date);
            url.searchParams.set("adults", String(Math.max(1, Number(body?.adults || 1))));
            if (body?.returnDate) url.searchParams.set("returnDate", String(body.returnDate));

            const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const payload = await response.json();
            if (!response.ok) {
              return Response.json({ success: false, status: "TRAVEL_PROVIDER_ERROR", provider: "AMADEUS", details: payload }, { status: 502 });
            }
            return Response.json({ success: true, provider: "AMADEUS", data: payload });
          }

          if (type === "TRAIN") {
            if (!process.env.IRCTC_B2B_PARTNER_KEY || !process.env.IRCTC_B2B_API_URL) {
              return Response.json({ success: false, status: "PROVIDER_REQUIRED", provider: "IRCTC_B2B", message: "Licensed train-booking provider credentials are not configured." }, { status: 503 });
            }
            return Response.json({ success: false, status: "PROVIDER_ADAPTER_REQUIRED", message: "The configured IRCTC B2B adapter has not been verified for this deployment." }, { status: 503 });
          }

          return Response.json({ success: false, status: "INVALID_TRAVEL_TYPE" }, { status: 400 });
        } catch (error: any) {
          if (error?.message === "Unauthorized") return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
          return Response.json({ success: false, error: error?.message || "Travel provider request failed." }, { status: 503 });
        }
      },
    },
  },
});
