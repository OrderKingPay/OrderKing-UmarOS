import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/og")({
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        const url = new URL(request.url);
        const title = url.searchParams.get("title") || "OrderKing";
        const subtitle = url.searchParams.get("subtitle") || "Local Food Delivery & KingPay";
        const price = url.searchParams.get("price");
        const rating = url.searchParams.get("rating");
        const eta = url.searchParams.get("eta");
        const verified = url.searchParams.get("verified") === "true";
        const area = url.searchParams.get("area") || "";

        const sanitize = (text: string) =>
          text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");

        const safeTitle = sanitize(title.length > 34 ? title.substring(0, 31) + "..." : title);
        const safeSubtitle = sanitize(subtitle.length > 55 ? subtitle.substring(0, 52) + "..." : subtitle);
        const safeArea = area ? sanitize(area) : "";
        const safePrice = price && price.trim() ? sanitize(price.trim()) : null;
        const safeRating = rating && rating.trim() ? sanitize(rating.trim()) : null;
        const safeEta = eta && eta.trim() ? sanitize(eta.trim()) : null;

        const pills: string[] = [];
        let pillX = 0;
        if (verified) {
          pills.push(`<rect x="${pillX}" width="165" height="36" rx="18" fill="#18181B" stroke="#27272A" />
    <text x="${pillX + 82}" y="23" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#10B981" text-anchor="middle">FSSAI VERIFIED</text>`);
          pillX += 180;
        }
        if (safeEta) {
          pills.push(`<rect x="${pillX}" width="130" height="36" rx="18" fill="#18181B" stroke="#27272A" />
    <text x="${pillX + 65}" y="23" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#F59E0B" text-anchor="middle">${safeEta} MIN ETA</text>`);
          pillX += 145;
        }
        if (safeRating) {
          pills.push(`<rect x="${pillX}" width="120" height="36" rx="18" fill="#18181B" stroke="#27272A" />
    <text x="${pillX + 60}" y="23" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#FFFFFF" text-anchor="middle">${safeRating}</text>`);
        }

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0a" />
      <stop offset="50%" stop-color="#141414" />
      <stop offset="100%" stop-color="#1c1917" />
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#F59E0B" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="1100" cy="100" r="300" fill="#EA580C" opacity="0.12" filter="blur(60px)" />
  <circle cx="100" cy="550" r="250" fill="#10B981" opacity="0.08" filter="blur(60px)" />

  <g transform="translate(80, 80)">
    <rect width="48" height="48" rx="12" fill="#EA580C" />
    <text x="24" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle">OK</text>
    <text x="64" y="34" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="800" fill="#FFFFFF">OrderKing</text>
    <text x="220" y="34" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#10B981" letter-spacing="1">HYPERLOCAL FOOD</text>
  </g>

  ${pills.length > 0 ? `<g transform="translate(80, 160)">\n    ${pills.join("\n    ")}\n  </g>` : ""}

  <text x="80" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="900" fill="#FFFFFF">
    ${safeTitle}
  </text>

  <text x="80" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="500" fill="#A1A1AA">
    ${safeSubtitle}
  </text>

  ${
    safePrice
      ? `<g transform="translate(80, 385)">
    <rect width="180" height="64" rx="16" fill="url(#gold)" />
    <text x="90" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#000000" text-anchor="middle">₹${safePrice}</text>
  </g>`
      : ""
  }

  <g transform="translate(80, 500)">
    <rect width="1040" height="60" rx="16" fill="#18181B" stroke="#3F3F46" />
    <text x="30" y="37" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#FBBF24">ORDERKING · KINGPAY</text>
    <text x="1010" y="37" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#71717A" text-anchor="end">${safeArea ? `OrderKing ${safeArea}` : "OrderKing"}</text>
  </g>
</svg>`.trim();

        return new Response(svg, {
          status: 200,
          headers: {
            "Content-Type": "image/svg+xml",
            "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
          },
        });
      },
    },
  },
});
