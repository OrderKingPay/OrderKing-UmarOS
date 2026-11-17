import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/vcard")({
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        const url = new URL(request.url);
        const town = url.searchParams.get("town") || "Karimganj / Barak Valley";
        const phone = process.env.WHATSAPP_SUPPORT_PHONE || "+913843295000";

        const vcard = [
          "BEGIN:VCARD",
          "VERSION:3.0",
          "N:OrderKing;Customer Support;;;",
          `FN:OrderKing Customer Support (${town})`,
          "ORG:OrderKing Hyperlocal Foods;",
          "TITLE:Hyperlocal Delivery & Customer Support",
          `TEL;TYPE=CELL,VOICE,WA;VALUE=uri:tel:${phone}`,
          "EMAIL;TYPE=WORK:support@orderking.in",
          "URL:https://orderking.in",
          "NOTE:Official OrderKing customer support contact for order tracking, kitchen updates, and inquiries.",
          "X-WA-BIZ-DESCRIPTION:Official OrderKing Customer Support for Karimganj & Barak Valley",
          "END:VCARD",
        ].join("\r\n");

        return new Response(vcard, {
          status: 200,
          headers: {
            "Content-Type": "text/vcard; charset=utf-8",
            "Content-Disposition": 'attachment; filename="OrderKing_Support_Contact.vcf"',
            "Cache-Control": "public, max-age=86400",
          },
        });
      },
    },
  },
});
