import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { Route } from "../routes/api/search";

describe("Connaught Place Real Live Search Verification", () => {
  beforeAll(() => {
    try {
      const envPath = path.resolve(__dirname, "../../.env");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf8");
        for (const line of envContent.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Could not load .env file:", e);
    }
  });

  it("returns real, live restaurants delivering in Connaught Place (28.6315, 77.2167)", { timeout: 30000 }, async () => {
    const url = "http://localhost:8082/api/search?lat=28.6315&lng=77.2167&zoneId=del-cp";
    const request = new Request(url, {
      method: "GET",
      headers: {
        "x-forwarded-for": "127.0.0.1",
      },
    });

    const handler = (Route.options as any)?.server?.handlers?.GET;
    expect(handler).toBeDefined();

    const response = await handler({ request });
    expect(response.status).toBe(200);

    const data = await response.json();
    console.log("Search Result Summary:", {
      deliveryAvailable: data.deliveryAvailable,
      restaurantCount: data.restaurants?.length,
      restaurants: data.restaurants?.map((r: any) => ({
        id: r.id,
        name: r.name,
        cuisine: r.cuisineSummary,
        open: r.open,
        ratingAvg: r.ratingAvg,
        distanceKm: r.distanceKm,
        etaMinutes: r.etaMinutes,
        deliveryFeePaise: r.deliveryFeePaise,
        zoneName: r.zoneName,
      })),
      dishesCount: data.dishes?.length,
    });

    expect(data.deliveryAvailable).toBe(true);
    expect(data.restaurants.length).toBeGreaterThanOrEqual(5);

    const restaurantNames = data.restaurants.map((r: any) => r.name);
    expect(restaurantNames).toContain("Kake Da Hotel");
    expect(restaurantNames).toContain("Saravanaa Bhavan");
    expect(restaurantNames).toContain("Karim's Mughal Delicacies");
    expect(restaurantNames).toContain("Wenger's Bakery & Deli");

    // All returned restaurants should be in Connaught Place with active riders
    for (const r of data.restaurants) {
      expect(r.zoneName).toBe("Connaught Place");
      expect(r.open).toBe(true);
      expect(r.ratingAvg).toBeGreaterThanOrEqual(4.7);
    }
  });

  it("filters Connaught Place restaurants by category and query", { timeout: 30000 }, async () => {
    const handler = (Route.options as any)?.server?.handlers?.GET;

    // Search query "Biryani"
    const biryaniReq = new Request("http://localhost:8082/api/search?lat=28.6315&lng=77.2167&q=Biryani", {
      headers: { "x-forwarded-for": "127.0.0.1" },
    });
    const biryaniRes = await handler({ request: biryaniReq });
    const biryaniData = await biryaniRes.json();
    expect(biryaniData.restaurants.length).toBeGreaterThanOrEqual(1);
    expect(biryaniData.restaurants.some((r: any) => r.name.includes("Karim"))).toBe(true);

    // Search query "Dosa"
    const dosaReq = new Request("http://localhost:8082/api/search?lat=28.6315&lng=77.2167&q=Dosa", {
      headers: { "x-forwarded-for": "127.0.0.1" },
    });
    const dosaRes = await handler({ request: dosaReq });
    const dosaData = await dosaRes.json();
    expect(dosaData.restaurants.length).toBeGreaterThanOrEqual(1);
    expect(dosaData.restaurants.some((r: any) => r.name.includes("Saravanaa"))).toBe(true);
  });
});
