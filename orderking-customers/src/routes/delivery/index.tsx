import { createFileRoute, Link } from "@tanstack/react-router";
import { CustomerShell } from "@/components/market/shell";
import { MapPin, ShieldCheck, Sparkles, ArrowRight, Utensils } from "lucide-react";

const INDIAN_STATES_AND_HUBS = [
  {
    slug: "assam",
    name: "Assam",
    tagline: "Barak Valley & Brahmaputra Valley Express",
    hubs: [
      { name: "Karimganj", slug: "karimganj", popularAreas: ["Station Road", "Charbazar", "Main Road"] },
      { name: "Silchar", slug: "silchar", popularAreas: ["Tarapur", "Park Road", "Ambicapatty"] },
      { name: "Guwahati", slug: "guwahati", popularAreas: ["Paltan Bazar", "GS Road", "Zoo Road"] },
      { name: "Hailakandi", slug: "hailakandi", popularAreas: ["Central Town", "Hospital Road"] },
      { name: "Badarpur", slug: "badarpur", popularAreas: ["Railway Colony", "Town Bazar"] },
    ],
  },
  {
    slug: "west-bengal",
    name: "West Bengal",
    tagline: "Greater Kolkata & North Bengal Hubs",
    hubs: [
      { name: "Kolkata", slug: "kolkata", popularAreas: ["Salt Lake", "Park Street", "BBD Bagh"] },
      { name: "Siliguri", slug: "siliguri", popularAreas: ["Sevoke Road", "Hill Cart Road"] },
      { name: "Howrah", slug: "howrah", popularAreas: ["Golabari", "Shibpur"] },
    ],
  },
  {
    slug: "karnataka",
    name: "Karnataka",
    tagline: "Silicon Valley & Tech Corridors",
    hubs: [
      { name: "Bengaluru", slug: "bengaluru", popularAreas: ["Koramangala", "Indiranagar", "HSR Layout"] },
      { name: "Mysuru", slug: "mysuru", popularAreas: ["Gokulam", "Vijayanagar"] },
    ],
  },
  {
    slug: "maharashtra",
    name: "Maharashtra",
    tagline: "Financial Capital & Metros",
    hubs: [
      { name: "Mumbai", slug: "mumbai", popularAreas: ["Bandra West", "Andheri", "Colaba"] },
      { name: "Pune", slug: "pune", popularAreas: ["Koregaon Park", "Kothrud", "Viman Nagar"] },
    ],
  },
  {
    slug: "delhi-ncr",
    name: "Delhi NCR",
    tagline: "National Capital Region",
    hubs: [
      { name: "Delhi", slug: "delhi", popularAreas: ["Connaught Place", "Hauz Khas", "Lajpat Nagar"] },
      { name: "Noida", slug: "noida", popularAreas: ["Sector 18", "Sector 62"] },
      { name: "Gurugram", slug: "gurugram", popularAreas: ["Cyber Hub", "Golf Course Road"] },
    ],
  },
  {
    slug: "tripura",
    name: "Tripura",
    tagline: "Northeast Frontier",
    hubs: [
      { name: "Agartala", slug: "agartala", popularAreas: ["Battala", "City Centre", "Akhaura Road"] },
      { name: "Dharmanagar", slug: "dharmanagar", popularAreas: ["Bazar Area", "Station Road"] },
    ],
  },
  {
    slug: "meghalaya",
    name: "Meghalaya",
    tagline: "Shillong Plateau & Hills",
    hubs: [
      { name: "Shillong", slug: "shillong", popularAreas: ["Police Bazar", "Laitumkhrah"] },
    ],
  },
];

export const Route = createFileRoute("/delivery/")({
  head: () => {
    const pageUrl = "https://orderking.in/delivery";
    const title = "Food Delivery Directory Across India | 0% Menu Markup | OrderKing";
    const desc =
      "Explore local food delivery across Assam, West Bengal, Karnataka, Delhi, and PAN-India on OrderKing. Genuine kitchen prices, sub-25 min delivery, 0% commission markups.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: pageUrl },
        { property: "og:type", content: "website" },
        { property: "og:image", content: "https://orderking.in/icon-512.png" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: pageUrl }],
    };
  },
  component: DeliveryDirectoryPage,
});

function DeliveryDirectoryPage() {
  return (
    <CustomerShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Hero Section */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <MapPin className="size-3.5" />
            <span>Hyperlocal Organic Food Network · All 28 States &amp; 8 UTs</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-black text-foreground sm:text-4xl md:text-5xl">
            Find Food Delivery Near You in India
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
            OrderKing brings genuine kitchen pricing to your doorstep. Zero 30% aggregator commission markup,
            sub-25 minute express delivery, and pure 24K Digital Gold rewards on every single meal.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-foreground">
            <span className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5">
              <ShieldCheck className="size-4 text-emerald-500" /> 100% FSSAI-Licensed Kitchens
            </span>
            <span className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5">
              <Sparkles className="size-4 text-amber-500" /> ₹0 Hidden Packaging Surcharges
            </span>
            <span className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5">
              <Utensils className="size-4 text-primary" /> 24K Gold Coin Cashbacks
            </span>
          </div>
        </div>

        {/* States & Hubs Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {INDIAN_STATES_AND_HUBS.map((state) => (
            <div
              key={state.slug}
              className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-xs transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="border-b border-border/60 pb-3">
                <h2 className="font-display text-lg font-bold text-foreground">{state.name}</h2>
                <p className="text-xs text-muted">{state.tagline}</p>
              </div>

              <div className="mt-4 flex flex-1 flex-col gap-3">
                {state.hubs.map((hub) => (
                  <div key={hub.slug} className="rounded-xl border border-border/50 bg-surface-2/40 p-3">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/delivery/${hub.slug}/all`}
                        className="font-bold text-sm text-foreground hover:text-primary transition flex items-center gap-1"
                      >
                        <span>{hub.name}</span>
                        <ArrowRight className="size-3 text-muted" />
                      </Link>
                      <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">Active</span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {hub.popularAreas.map((area) => {
                        const areaSlug = area.toLowerCase().replace(/\s+/g, "-");
                        return (
                          <Link
                            key={area}
                            to={`/delivery/${hub.slug}/${areaSlug}`}
                            className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-muted hover:border-primary/40 hover:text-foreground transition"
                          >
                            {area}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CustomerShell>
  );
}
