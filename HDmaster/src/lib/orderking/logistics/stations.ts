export interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

export class StationOperationsEngine {
  private stations: Station[] = [
    { id: 'st_mum_01', name: 'Andheri West Hub', lat: 19.1363, lng: 72.8277, radiusKm: 3 },
    { id: 'st_mum_02', name: 'Bandra Kurla Complex (BKC)', lat: 19.0616, lng: 72.8656, radiusKm: 4 },
    { id: 'st_del_01', name: 'Connaught Place Station', lat: 28.6304, lng: 77.2177, radiusKm: 5 }
  ];

  /**
   * Mathematically binds a rider to the nearest physical delivery station for shift planning.
   */
  assignRiderToStation(riderId: string, currentLat: number, currentLng: number): { riderId: string, stationId: string, distanceKm: number } | null {
    let nearestStation: Station | null = null;
    let minDistance = Infinity;

    for (const station of this.stations) {
      const distance = this.calculateDistance(currentLat, currentLng, station.lat, station.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestStation = station;
      }
    }

    if (nearestStation) {
      console.log(`[StationOperationsEngine] Rider ${riderId} physically bound to station ${nearestStation.id} (${nearestStation.name}) at distance ${minDistance.toFixed(2)} km.`);
      return {
        riderId,
        stationId: nearestStation.id,
        distanceKm: minDistance
      };
    }

    return null;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);  
    const dLon = this.deg2rad(lon2 - lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}
