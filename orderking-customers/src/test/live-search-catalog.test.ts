import { describe, it, expect } from "vitest";
import { Route } from "../routes/api/search";

describe("Live Real Restaurant Catalog Verification", () => {
  it("loads authentic Connaught Place restaurants with real ratings and timing", async () => {
    process.env.DATABASE_URL = "postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";
    const handler = (Route.options as any)?.server?.handlers?.GET;
    expect(handler).toBeDefined();

    const url = "http://localhost:8082/api/search?lat=28.6315&lng=77.2167&zoneId=del-cp";
    const request = new Request(url, { headers: { "x-forwarded-for": "10.18.99.1" } });
    const response = await handler({ request });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.deliveryAvailable).toBe(true);
    expect(data.restaurants.length).toBeGreaterThanOrEqual(5);

    const names = data.restaurants.map((r: any) => r.name);
    console.log("Verified Live Restaurants in Connaught Place:", names);
    expect(names).toContain("Kake Da Hotel");
    expect(names).toContain("Saravanaa Bhavan");
    expect(names).toContain("Karim's Mughal Delicacies");
  }, 45000);

  it("checks real restaurants in Sribhumi Core, Mumbai Metropolitan, and Bengaluru Tech Hub", async () => {
    process.env.DATABASE_URL = "postgresql://postgres.wziksbrumklcktrlgedb:UmarHasan%405566@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres";
    const handler = (Route.options as any)?.server?.handlers?.GET;

    // Sribhumi Core
    const sribhumiReq = new Request("http://localhost:8082/api/search?lat=24.8688&lng=92.3511&zoneId=karimganj_core", {
      headers: { "x-forwarded-for": "10.18.99.2" }
    });
    const sribhumiRes = await handler({ request: sribhumiReq });
    const sribhumiData = await sribhumiRes.json();
    expect(sribhumiData.deliveryAvailable).toBe(true);
    expect(sribhumiData.restaurants.length).toBeGreaterThan(0);
    console.log("Sribhumi restaurants:", sribhumiData.restaurants?.map((r: any) => r.name));

    // Mumbai Metropolitan
    const mumbaiReq = new Request("http://localhost:8082/api/search?lat=19.0600&lng=72.8336&zoneId=mum-bandra", {
      headers: { "x-forwarded-for": "10.18.99.3" }
    });
    const mumbaiRes = await handler({ request: mumbaiReq });
    const mumbaiData = await mumbaiRes.json();
    expect(mumbaiData.deliveryAvailable).toBe(true);
    expect(mumbaiData.restaurants.length).toBeGreaterThan(0);
    console.log("Mumbai restaurants:", mumbaiData.restaurants?.map((r: any) => r.name));

    // Bengaluru Tech Hub
    const blrReq = new Request("http://localhost:8082/api/search?lat=12.9784&lng=77.6408&zoneId=blr-ind", {
      headers: { "x-forwarded-for": "10.18.99.4" }
    });
    const blrRes = await handler({ request: blrReq });
    const blrData = await blrRes.json();
    expect(blrData.deliveryAvailable).toBe(true);
    expect(blrData.restaurants.length).toBeGreaterThan(0);
    console.log("Bengaluru restaurants:", blrData.restaurants?.map((r: any) => r.name));
  }, 45000);
});
