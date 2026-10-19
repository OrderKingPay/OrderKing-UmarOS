import { createFileRoute } from "@tanstack/react-router";

// Genuine railway status requires an authorized CRIS upstream service and STQC certification.
export const Route = createFileRoute("/api/travel/pnr-status")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const pnr = (new URL(request.url).searchParams.get("pnr") || "").replace(/\D/g, "");
        if (pnr.length !== 10) {
          return new Response(
            JSON.stringify({ error: "PNR must contain exactly 10 numeric digits." }),
            { status: 400, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
          );
        }
        return new Response(
          JSON.stringify({
            code: "PROVIDER_NOT_CONNECTED",
            pnr,
            error: "Direct in-app CRIS PRS live status query is disabled pending STQC certification and IRCTC PSP authorization. Indian Railways mandates direct captcha verification on official government portals.",
            officialPortalUrl: `https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?pnrno=${pnr}`,
            ntesPortalUrl: "https://enquiry.indianrail.gov.in/mntes/",
            complianceNote: "Synthetic PNR generation is strictly forbidden under Indian Railways e-Ticketing Policy.",
          }),
          { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
        );
      },
    },
  },
});
