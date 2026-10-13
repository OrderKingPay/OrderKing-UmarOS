import { createFileRoute } from "@tanstack/react-router";
import QRCode from "qrcode";

export const Route = createFileRoute("/api/qr")({
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        const url = new URL(request.url);
        const targetUrl = url.searchParams.get("url");
        const format = url.searchParams.get("format") || "svg";

        if (!targetUrl) {
          return new Response("Missing 'url' query parameter", { status: 400 });
        }

        try {
          if (format === "png") {
            const buffer = await QRCode.toBuffer(targetUrl, {
              type: "png",
              width: 512,
              margin: 2,
              color: { dark: "#000000", light: "#FFFFFF" },
              errorCorrectionLevel: "H",
            });
            return new Response(new Uint8Array(buffer), {
              status: 200,
              headers: {
                "Content-Type": "image/png",
                "Cache-Control": "public, max-age=604800, immutable",
              },
            });
          }

          const svgString = await QRCode.toString(targetUrl, {
            type: "svg",
            margin: 2,
            color: { dark: "#000000", light: "#FFFFFF" },
            errorCorrectionLevel: "H",
          });

          return new Response(svgString, {
            status: 200,
            headers: {
              "Content-Type": "image/svg+xml",
              "Cache-Control": "public, max-age=604800, immutable",
            },
          });
        } catch (error) {
          console.error("QR generation error:", error);
          return new Response("Failed to generate QR code", { status: 500 });
        }
      },
    },
  },
});
