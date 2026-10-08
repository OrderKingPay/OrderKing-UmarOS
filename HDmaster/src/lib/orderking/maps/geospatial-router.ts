export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteInfo {
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Calculates the great-circle distance between two points on the Earth's surface using the Haversine formula.
 */
export function haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (coord1.lat * Math.PI) / 180;
  const phi2 = (coord2.lat * Math.PI) / 180;
  const deltaPhi = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const deltaLambda = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Wrapper for Google Maps Distance Matrix API.
 * Uses the provided API key to calculate true road distance and ETA.
 */
export class MapsDistanceMatrixWrapper {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getRouteInfo(origin: Coordinates, destination: Coordinates): Promise<RouteInfo> {
    if (!this.apiKey) {
      throw new Error("Google Maps API key is required.");
    }

    const originStr = `${origin.lat},${origin.lng}`;
    const destinationStr = `${destination.lat},${destination.lng}`;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originStr}&destinations=${destinationStr}&key=${this.apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Distance Matrix API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Distance Matrix API returned error status: ${data.status}`);
    }

    const element = data.rows[0].elements[0];

    if (element.status !== "OK") {
      throw new Error(`Distance Matrix API element error: ${element.status}`);
    }

    return {
      distanceMeters: element.distance.value,
      durationSeconds: element.duration.value,
    };
  }
}
