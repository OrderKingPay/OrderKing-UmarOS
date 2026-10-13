import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const CANONICAL_HOST = "https://orderking.in";

// 28 States & 8 Union Territories of India for Programmatic SEO Directory
const INDIAN_STATES_AND_UTS = [
  "andhra-pradesh", "arunachal-pradesh", "assam", "bihar", "chhattisgarh", "goa", "gujarat", 
  "haryana", "himachal-pradesh", "jharkhand", "karnataka", "kerala", "madhya-pradesh", 
  "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland", "odisha", "punjab", 
  "rajasthan", "sikkim", "tamil-nadu", "telangana", "tripura", "uttar-pradesh", 
  "uttarakhand", "west-bengal", "andaman-and-nicobar", "chandigarh", "dadra-and-nagar-haveli-and-daman-and-diu", 
  "delhi", "jammu-and-kashmir", "ladakh", "lakshadweep", "puducherry"
];

// High-Volume Organic Food Queries across India
const POPULAR_CUISINES = [
  "biryani", "rolls", "thali", "pizza", "burger", "momos", "chaat", 
  "north-indian", "bengali-food", "chinese", "south-indian", "sweets-mithai"
];

export const Route = createFileRoute("/api/sitemap")({
  server: {
    handlers: {
      GET: async ({ request }: any) => {
        const url = new URL(request.url);
        const section = url.searchParams.get("section");
        const today = new Date().toISOString().split("T")[0];
        const cacheHeaders = {
          "Content-Type": "application/xml; charset=utf-8",
          "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
        };

        const sql = await getSql();

        try {
          // ==================================================================
          // ROOT: SITEMAP INDEX (<sitemapindex>)
          // ==================================================================
          if (!section) {
            const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${CANONICAL_HOST}/api/sitemap?section=core</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${CANONICAL_HOST}/api/sitemap?section=states</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${CANONICAL_HOST}/api/sitemap?section=cities</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${CANONICAL_HOST}/api/sitemap?section=areas</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${CANONICAL_HOST}/api/sitemap?section=restaurants</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${CANONICAL_HOST}/api/sitemap?section=cuisines</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>`.trim();
            return new Response(xml, { status: 200, headers: cacheHeaders });
          }

          // ==================================================================
          // SECTION 1: CORE STATIC ROUTES
          // ==================================================================
          if (section === "core") {
            const coreRoutes = [
              { path: "/", priority: "1.0", changefreq: "daily" },
              { path: "/delivery", priority: "0.95", changefreq: "daily" },
              { path: "/search", priority: "0.9", changefreq: "daily" },
              { path: "/offers", priority: "0.85", changefreq: "daily" },
              { path: "/earn", priority: "0.8", changefreq: "weekly" },
              { path: "/king-pay", priority: "0.8", changefreq: "weekly" },
              { path: "/rewards", priority: "0.75", changefreq: "weekly" },
              { path: "/about", priority: "0.5", changefreq: "monthly" },
              { path: "/support", priority: "0.5", changefreq: "monthly" },
              { path: "/legal/privacy", priority: "0.3", changefreq: "yearly" },
              { path: "/legal/terms", priority: "0.3", changefreq: "yearly" },
              { path: "/legal/refunds", priority: "0.3", changefreq: "yearly" },
            ];

            const nodes = coreRoutes.map(
              (r) => `  <url>
    <loc>${CANONICAL_HOST}${escapeXml(r.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
            );

            return new Response(
              `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nodes.join("\n")}\n</urlset>`,
              { status: 200, headers: cacheHeaders }
            );
          }

          // ==================================================================
          // SECTION 2: STATES & UTs DIRECTORY
          // ==================================================================
          if (section === "states") {
            const nodes = INDIAN_STATES_AND_UTS.map(
              (st) => `  <url>
    <loc>${CANONICAL_HOST}/delivery/${escapeXml(st)}/all</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>`
            );

            return new Response(
              `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nodes.join("\n")}\n</urlset>`,
              { status: 200, headers: cacheHeaders }
            );
          }

          // ==================================================================
          // SECTION 3: CITIES & DISTRICTS
          // ==================================================================
          if (section === "cities") {
            const cities = await sql<{ id: string; name: string }>`
              SELECT id, name FROM cities WHERE active = true ORDER BY name
            `;

            // Always ensure Tier 1-3 anchors are present
            const anchorCities = [
              { id: "karimganj", name: "Karimganj" },
              { id: "silchar", name: "Silchar" },
              { id: "hailakandi", name: "Hailakandi" },
              { id: "guwahati", name: "Guwahati" },
              { id: "badarpur", name: "Badarpur" },
              { id: "kolkata", name: "Kolkata" },
              { id: "delhi", name: "Delhi" },
              { id: "bengaluru", name: "Bengaluru" },
              { id: "mumbai", name: "Mumbai" },
            ];

            const seenCities = new Set<string>();
            const nodes: string[] = [];

            for (const c of [...cities, ...anchorCities]) {
              const slug = c.id.toLowerCase().replace(/\s+/g, "-");
              if (!seenCities.has(slug)) {
                seenCities.add(slug);
                nodes.push(`  <url>
    <loc>${CANONICAL_HOST}/delivery/${escapeXml(slug)}/all</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`);
              }
            }

            return new Response(
              `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nodes.join("\n")}\n</urlset>`,
              { status: 200, headers: cacheHeaders }
            );
          }

          // ==================================================================
          // SECTION 4: HYPERLOCAL AREAS & PIN CODES
          // ==================================================================
          if (section === "areas") {
            const areas = await sql<{
              city_id: string;
              area_name: string;
            }>`
              SELECT DISTINCT
                c.id AS city_id,
                COALESCE(NULLIF(TRIM(o.area), ''), TRIM(z.name)) AS area_name
              FROM cities c
              JOIN service_zones z ON z.city_id = c.id AND z.active = true
              JOIN restaurant_outlets o ON o.zone_id = z.id AND o.active = true
              WHERE c.active = true
            `;

            const priorityPincodes = [
              { town: "karimganj", pincode: "788710", area: "station-road" },
              { town: "karimganj", pincode: "788711", area: "charbazar" },
              { town: "silchar", pincode: "788001", area: "tarapur" },
              { town: "silchar", pincode: "788005", area: "park-road" },
              { town: "guwahati", pincode: "781001", area: "paltan-bazar" },
              { town: "guwahati", pincode: "781005", area: "gs-road" },
              { town: "kolkata", pincode: "700001", area: "b-b-d-bagh" },
              { town: "kolkata", pincode: "700091", area: "salt-lake" },
              { town: "bengaluru", pincode: "560034", area: "koramangala" },
              { town: "mumbai", pincode: "400050", area: "bandra-west" },
            ];

            const nodes: string[] = [];
            const seenAreas = new Set<string>();

            for (const row of areas) {
              const townSlug = row.city_id.toLowerCase().replace(/\s+/g, "-");
              const areaSlug = row.area_name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
              const key = `${townSlug}/${areaSlug}`;
              if (areaSlug && !seenAreas.has(key)) {
                seenAreas.add(key);
                nodes.push(`  <url>
    <loc>${CANONICAL_HOST}/delivery/${escapeXml(townSlug)}/${escapeXml(areaSlug)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`);
              }
            }

            for (const pin of priorityPincodes) {
              const key = `${pin.town}/${pin.pincode}`;
              if (!seenAreas.has(key)) {
                seenAreas.add(key);
                nodes.push(`  <url>
    <loc>${CANONICAL_HOST}/delivery/${pin.town}/${pin.pincode}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.85</priority>
  </url>`);
              }
            }

            return new Response(
              `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nodes.join("\n")}\n</urlset>`,
              { status: 200, headers: cacheHeaders }
            );
          }

          // ==================================================================
          // SECTION 5: LIVE RESTAURANTS
          // ==================================================================
          if (section === "restaurants") {
            const restaurants = await sql<{
              slug: string;
              updated_at: string | null;
            }>`
              SELECT slug, created_at AS updated_at
              FROM restaurants
              WHERE active = true
              ORDER BY slug
            `;

            const nodes = restaurants.map((r) => {
              const lastMod = r.updated_at ? new Date(r.updated_at).toISOString().split("T")[0] : today;
              return `  <url>
    <loc>${CANONICAL_HOST}/r/${escapeXml(r.slug)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
            });

            return new Response(
              `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nodes.join("\n")}\n</urlset>`,
              { status: 200, headers: cacheHeaders }
            );
          }

          // ==================================================================
          // SECTION 6: CUISINES & FOOD INTENT
          // ==================================================================
          if (section === "cuisines") {
            const anchorCities = ["karimganj", "silchar", "guwahati", "kolkata", "delhi", "bengaluru", "mumbai"];
            const nodes: string[] = [];

            for (const town of anchorCities) {
              for (const cuisine of POPULAR_CUISINES) {
                nodes.push(`  <url>
    <loc>${CANONICAL_HOST}/delivery/${town}/cuisine/${cuisine}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
              }
            }

            return new Response(
              `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${nodes.join("\n")}\n</urlset>`,
              { status: 200, headers: cacheHeaders }
            );
          }

          return new Response("Section Not Found", { status: 404 });
        } catch (error) {
          console.error("Sitemap generation error:", error);
          return new Response(
            `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${CANONICAL_HOST}/</loc></url>\n</urlset>`,
            { status: 200, headers: cacheHeaders }
          );
        }
      },
    },
  },
});
