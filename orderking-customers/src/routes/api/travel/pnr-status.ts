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
            error: "Redirecting to official Indian Railways enquiry portal. Direct captcha verification is required on government servers.",
            officialPortalUrl: `https://www.indianrail.gov.in/enquiry/PNR/PnrEnquiry.html?pnrno=${pnr}`,
            ntesPortalUrl: "https://enquiry.indianrail.gov.in/mntes/",
            complianceNote: "PNR status is verified directly via official Indian Railways portal.",
          }),
          { status: 503, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }
        );
      },
    },
  },
});
