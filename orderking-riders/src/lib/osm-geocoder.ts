// Real OpenStreetMap Nominatim Geocoding & Haversine Routing Engine (Zero API Key Required)
export interface GeoSearchResult {
  placeId: string;
  displayName: string;
  shortName: string;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
}
export async function searchRealPlaces(query: string, limit = 6): Promise<GeoSearchResult[]> {
  const q = String(query || "").trim();
  if (q.length < 2) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=in&limit=${limit}&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en-IN,en;q=0.9" },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as any[];
    return rows.map((r) => {
      const addr = r.address || {};
      const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || "Guwahati";
      const state = addr.state || "Assam";
      const pincode = addr.postcode || "781001";
      const shortName =
        addr.suburb ||
        addr.neighbourhood ||
        addr.road ||
        r.name ||
        String(r.display_name || "").split(",")[0] ||
        city;
      return {
        placeId: String(r.place_id),
        displayName: String(r.display_name || shortName),
        shortName,
        city,
        state,
        pincode,
        lat: Number(r.lat),
        lng: Number(r.lon),
      };
    });
  } catch {
    return [];
  }
}
export async function reverseGeocodeReal(lat: number, lng: number): Promise<GeoSearchResult | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lng}`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en-IN,en;q=0.9" },
    });
    if (!res.ok) return null;
    const r = (await res.json()) as any;
    const addr = r.address || {};
    const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || "Guwahati";
    const state = addr.state || "Assam";
    const pincode = addr.postcode || "781001";
    const shortName =
      [addr.house_number, addr.road, addr.suburb || addr.neighbourhood]
        .filter(Boolean)
        .join(", ") ||
      r.name ||
      String(r.display_name || "").split(",").slice(0, 2).join(", ") ||
      city;
    return {
      placeId: String(r.place_id || `${lat},${lng}`),
      displayName: String(r.display_name || `${shortName}, ${city}`),
      shortName,
      city,
      state,
      pincode,
      lat: Number(r.lat ?? lat),
      lng: Number(r.lon ?? lng),
    };
  } catch {
    return null;
  }
}
export function calculateRoadDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const straightKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(0.2, Math.round(straightKm * 1.28 * 10) / 10);
}
