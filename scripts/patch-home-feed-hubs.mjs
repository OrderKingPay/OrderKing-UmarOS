import fs from "fs";

const file = "orderking-customers/src/components/market/home-feed.tsx";
let content = fs.readFileSync(file, "utf8");

// 1. Add icons if missing
if (!content.includes("Store,")) {
  content = content.replace(
    /(\s+Utensils,\r?\n\s+ChevronRight,\r?\n\s+CloudRain,)/,
    "$1\r\n  Sparkles,\r\n  Store,\r\n  ExternalLink,"
  );
}

// 2. Replace empty availability note with interactive active flagship hubs and restaurant partner CTA
const targetText = `<div role="status" data-testid="food-availability-note"`;
const targetEnd = `</div>\r\n          </div>\r\n        ) : (`;
const targetEndLF = `</div>\n          </div>\n        ) : (`;

const isCRLF = content.includes("\r\n");
const newline = isCRLF ? "\r\n" : "\n";

const replacementWidget = `<div role="status" data-testid="food-availability-note"
              className="rounded-3xl border border-stone-200 bg-white p-5 text-left shadow-sm space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-stone-900">
                    {!isDeliveryActive || list.data?.deliveryAvailable === false
                      ? "Food delivery is expanding to your current GPS pin"
                      : "No restaurants currently open for this address"}
                  </h3>
                  <p className="mt-0.5 text-xs text-stone-500">
                    OrderKing operates with 0% platform commission. Explore live kitchens in active flagship hubs or onboard your local restaurant.
                  </p>
                </div>
              </div>

              {/* 1-Click Active Delivery Hub Quick Switchers */}
              <div className="space-y-2 pt-2 border-t border-stone-100">
                <span className="text-[11px] font-black uppercase tracking-wider text-stone-400">
                  Explore Live Kitchens in Active Flagship Hubs
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      name: "Connaught Place Central",
                      tagline: "Delhi NCR Flagship (Saravanaa, Karim's, Kake Da Hotel)",
                      location: { cityId: "del", cityName: "New Delhi", zoneId: "del-cp", zoneName: "Connaught Place", label: "Connaught Place, New Delhi", line1: "Inner Circle, Connaught Place, New Delhi", lat: 28.6315, lng: 77.2167 },
                    },
                    {
                      name: "Sribhumi Core",
                      tagline: "Karimganj / Assam Flagship Kitchens",
                      location: { cityId: "karimganj", cityName: "Karimganj", zoneId: "sribhumi_core", zoneName: "Sribhumi Core", label: "Main Road, Sribhumi, Karimganj", line1: "Station Road, Karimganj, Assam", lat: 24.8688, lng: 92.3511 },
                    },
                    {
                      name: "Mumbai Metropolitan",
                      tagline: "Bandra & BKC Premium Kitchens",
                      location: { cityId: "mumbai", cityName: "Mumbai", zoneId: "mumbai_metro", zoneName: "Bandra BKC", label: "BKC, Mumbai", line1: "G Block, Bandra Kurla Complex, Mumbai", lat: 19.0596, lng: 72.8295 },
                    },
                    {
                      name: "Bengaluru Tech Hub",
                      tagline: "Indiranagar & Koramangala Hubs",
                      location: { cityId: "bengaluru", cityName: "Bengaluru", zoneId: "bengaluru_hub", zoneName: "Indiranagar", label: "Indiranagar, Bengaluru", line1: "100 Feet Road, Indiranagar, Bengaluru", lat: 12.9784, lng: 77.6408 },
                    },
                  ].map((hub) => (
                    <button
                      key={hub.name}
                      type="button"
                      onClick={() => {
                        useLocationStore.getState().setLocation(hub.location);
                        toast.success(\`Switched to \${hub.name}\`);
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 hover:border-amber-400/60 transition text-left cursor-pointer group"
                    >
                      <div>
                        <div className="text-xs font-black text-stone-900 group-hover:text-amber-600 transition">
                          {hub.name}
                        </div>
                        <div className="text-[11px] text-stone-500">{hub.tagline}</div>
                      </div>
                      <ChevronRight className="size-4 text-stone-400 group-hover:text-amber-600 transition shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct 60-Second Restaurant Partner Onboarding Banner */}
              <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <Store className="size-3.5 text-amber-600" /> Are you a restaurant or kitchen owner?
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Onboard your kitchen in 60 seconds. Instant 1-tap agreement, keep 100% earnings with 0% commission.
                  </p>
                </div>
                <a
                  href="https://partners.orderkingpay.com/onboarding"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black whitespace-nowrap text-center transition flex items-center justify-center gap-1"
                >
                  <span>Register Kitchen</span>
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </div>
        ) : (`;

const startIdx = content.indexOf(targetText);
if (startIdx !== -1) {
  let endIdx = content.indexOf(targetEnd, startIdx);
  let endLen = targetEnd.length;
  if (endIdx === -1) {
    endIdx = content.indexOf(targetEndLF, startIdx);
    endLen = targetEndLF.length;
  }
  if (endIdx !== -1) {
    content = content.slice(0, startIdx) + replacementWidget + content.slice(endIdx + endLen);
    fs.writeFileSync(file, content, "utf8");
    console.log("Successfully patched home-feed.tsx with active discovery hubs and partner onboarding banner!");
  } else {
    console.error("Could not find end of availability note block.");
    process.exit(1);
  }
} else {
  console.error("Could not find start of availability note block.");
  process.exit(1);
}
