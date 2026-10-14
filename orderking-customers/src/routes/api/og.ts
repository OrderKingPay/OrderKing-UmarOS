import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/og")({
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        const url = new URL(request.url);
        const title = url.searchParams.get("title") || "OrderKing Fast Food Delivery";
        const subtitle = url.searchParams.get("subtitle") || "0% Menu Markup · Genuine Restaurant Prices";
        const price = url.searchParams.get("price");
        const rating = url.searchParams.get("rating") || "4.8★";
        const eta = url.searchParams.get("eta") || "25";
        const area = url.searchParams.get("area") || "Near You";

        // Sanitize text for SVG XML
        const sanitize = (text: string) =>
          text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");

        const safeTitle = sanitize(title.length > 34 ? title.substring(0, 31) + "..." : title);
        const safeSubtitle = sanitize(subtitle.length > 55 ? subtitle.substring(0, 52) + "..." : subtitle);
        const safeArea = sanitize(area);

        // Generate high-contrast, beautiful SVG card (1200x630 WhatsApp standard)
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

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)" />

  <!-- Accent Circle -->
  <circle cx="1100" cy="100" r="300" fill="#EA580C" opacity="0.12" filter="blur(60px)" />
  <circle cx="100" cy="550" r="250" fill="#10B981" opacity="0.08" filter="blur(60px)" />

  <!-- Brand Header -->
  <g transform="translate(80, 80)">
    <rect width="48" height="48" rx="12" fill="#EA580C" />
    <text x="24" y="32" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" fill="#FFFFFF" text-anchor="middle">👑</text>
    <text x="64" y="34" font-family="system-ui, -apple-system, sans-serif" font-size="30" font-weight="800" fill="#FFFFFF">OrderKing</text>
    <text x="220" y="34" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#10B981" letter-spacing="1">HYPERLOCAL FOOD</text>
  </g>

  <!-- Verified Trust Pills -->
  <g transform="translate(80, 160)">
    <rect width="160" height="36" rx="18" fill="#18181B" stroke="#27272A" />
    <text x="80" y="23" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#10B981" text-anchor="middle">🛡️ FSSAI VERIFIED</text>

    <rect x="175" width="130" height="36" rx="18" fill="#18181B" stroke="#27272A" />
    <text x="240" y="23" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#F59E0B" text-anchor="middle">⚡ ${eta} MIN ETA</text>

    <rect x="320" width="120" height="36" rx="18" fill="#18181B" stroke="#27272A" />
    <text x="380" y="23" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#FFFFFF" text-anchor="middle">⭐ ${rating}</text>
  </g>

  <!-- Title / Dish Name -->
  <text x="80" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="56" font-weight="900" fill="#FFFFFF">
    ${safeTitle}
  </text>

  <!-- Subtitle / Restaurant & Area -->
  <text x="80" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="500" fill="#A1A1AA">
    ${safeSubtitle}
  </text>

  <!-- Price Badge (if item shared) -->
  ${
    price
      ? `<g transform="translate(80, 385)">
    <rect width="180" height="64" rx="16" fill="url(#gold)" />
    <text x="90" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="900" fill="#000000" text-anchor="middle">₹${price}</text>
  </g>`
      : ""
  }

  <!-- Footer Banner: 24K Gold & Zero Markup Guarantee -->
  <g transform="translate(80, 500)">
    <rect width="1040" height="60" rx="16" fill="#18181B" stroke="#3F3F46" />
    <text x="30" y="37" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#FBBF24">👑 0% MENU MARKUP · FAIR PRICING GUARANTEE</text>
    <text x="1010" y="37" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#71717A" text-anchor="end">OrderKing ${safeArea}</text>
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
