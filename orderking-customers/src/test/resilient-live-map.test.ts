import { describe, it, expect } from "vitest";
import {
  calculateHaversineDistance,
  calculateIndianRoadDistance,
  calculateBearing,
  calculateETA,
  getGoogleMapsTwoWheelerDeepLink,
  getGoogleMapsTwoWheelerIntent,
  latLngToWorldPx,
  worldPxToLatLng,
  getTileUrl,
  INDIAN_ROAD_FACTOR,
  EARTH_RADIUS_KM,
} from "../components/tracking/resilient-live-map";

describe("ResilientLiveMap: Geodetic & Indian Road Mathematics", () => {
  const kolkataRestaurant = { lat: 22.5726, lng: 88.3639 };
  const kolkataCustomer = { lat: 22.585, lng: 88.375 };

  it("calculates 0 km distance for identical coordinates", () => {
    const dist = calculateHaversineDistance(kolkataRestaurant.lat, kolkataRestaurant.lng, kolkataRestaurant.lat, kolkataRestaurant.lng);
    expect(dist).toBe(0);
  });

  it("calculates accurate straight-line Haversine distance", () => {
    const dist = calculateHaversineDistance(
      kolkataRestaurant.lat,
      kolkataRestaurant.lng,
      kolkataCustomer.lat,
      kolkataCustomer.lng
    );
    // Approximately 1.80 - 1.85 km straight line
    expect(dist).toBeGreaterThan(1.7);
    expect(dist).toBeLessThan(2.0);
  });

  it("is symmetric: dist(A, B) === dist(B, A)", () => {
    const d1 = calculateHaversineDistance(kolkataRestaurant.lat, kolkataRestaurant.lng, kolkataCustomer.lat, kolkataCustomer.lng);
    const d2 = calculateHaversineDistance(kolkataCustomer.lat, kolkataCustomer.lng, kolkataRestaurant.lat, kolkataRestaurant.lng);
    expect(d1).toBeCloseTo(d2, 8);
  });

  it("applies the Indian road winding multiplier (Haversine × 1.35)", () => {
    const straight = calculateHaversineDistance(
      kolkataRestaurant.lat,
      kolkataRestaurant.lng,
      kolkataCustomer.lat,
      kolkataCustomer.lng
    );
    const road = calculateIndianRoadDistance(
      kolkataRestaurant.lat,
      kolkataRestaurant.lng,
      kolkataCustomer.lat,
      kolkataCustomer.lng
    );
    expect(INDIAN_ROAD_FACTOR).toBe(1.35);
    expect(road).toBeCloseTo(straight * 1.35, 6);
  });

  it("computes accurate forward azimuth / bearing", () => {
    // Due North: from equator (0,0) to (1,0) should be 0 deg
    const north = calculateBearing(0, 0, 1, 0);
    expect(north).toBeCloseTo(0, 1);

    // Due East: from (0,0) to (0,1) should be 90 deg
    const east = calculateBearing(0, 0, 0, 1);
    expect(east).toBeCloseTo(90, 1);

    // Due South: from (1,0) to (0,0) should be 180 deg
    const south = calculateBearing(1, 0, 0, 0);
    expect(south).toBeCloseTo(180, 1);

    // Due West: from (0,1) to (0,0) should be 270 deg
    const west = calculateBearing(0, 1, 0, 0);
    expect(west).toBeCloseTo(270, 1);
  });

  it("computes ETA based on 22 km/h Indian two-wheeler urban traffic", () => {
    // 2.2 km at 22 km/h takes 0.1 hr = 6 minutes
    const eta = calculateETA(2.2, 22);
    expect(eta).toBe(6);

    // Minimum floor: at least 2 minutes for small distances
    expect(calculateETA(0.3, 22)).toBe(2);

    // Arrival floor: 1 minute when distance <= 0.05 km
    expect(calculateETA(0.02, 22)).toBe(1);
  });

  it("generates Google Maps Turn-by-Turn two-wheeler web deep link", () => {
    const link = getGoogleMapsTwoWheelerDeepLink(kolkataCustomer.lat, kolkataCustomer.lng);
    expect(link).toContain("https://www.google.com/maps/dir/?api=1");
    expect(link).toContain("destination=22.585,88.375");
    expect(link).toContain("travelmode=two-wheeler");
  });

  it("generates native Android navigation intent with mode=b (two-wheeler)", () => {
    const intent = getGoogleMapsTwoWheelerIntent(kolkataCustomer.lat, kolkataCustomer.lng);
    expect(intent).toBe("google.navigation:q=22.585,88.375&mode=b");
  });
});

describe("ResilientLiveMap: Slippy Map Tile Mathematics (0 API Keys)", () => {
  it("converts lat/lng to Web Mercator world pixel and inverts back cleanly", () => {
    const lat = 22.5726;
    const lng = 88.3639;
    const zoom = 15;

    const px = latLngToWorldPx(lat, lng, zoom);
    expect(px.x).toBeGreaterThan(0);
    expect(px.y).toBeGreaterThan(0);

    const inverted = worldPxToLatLng(px.x, px.y, zoom);
    expect(inverted.lat).toBeCloseTo(lat, 4);
    expect(inverted.lng).toBeCloseTo(lng, 4);
  });

  it("generates free Carto Voyager tile URLs with zero API keys", () => {
    const tileUrl = getTileUrl(100, 200, 15, "carto_voyager");
    expect(tileUrl).toMatch(/https:\/\/[abcd]\.basemaps\.cartocdn\.com\/rastertiles\/voyager\/15\/100\/200\.png/);
  });

  it("generates free OpenStreetMap tile URLs with zero API keys", () => {
    const tileUrl = getTileUrl(100, 200, 15, "osm");
    expect(tileUrl).toBe("https://tile.openstreetmap.org/15/100/200.png");
  });

  it("handles out of bounds tile Y coordinates gracefully", () => {
    const outOfBounds = getTileUrl(10, 999999, 10, "carto_voyager");
    expect(outOfBounds).toBe("");
  });
});
