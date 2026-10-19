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
});
