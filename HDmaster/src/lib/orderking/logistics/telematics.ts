import { getSql } from '@/lib/db';

export class RiderTelematicsEngine {
  /**
   * Syncs rider location in real-time.
   */
  async syncRiderLocation(riderId: string, lat: number, lng: number): Promise<void> {
    const sql = await getSql();
    
    const current_geohash = this.calculateGeohash(lat, lng, 9);

    await sql`
      UPDATE user_profiles
      SET 
        latitude = ${lat},
        longitude = ${lng},
        current_geohash = ${current_geohash},
        updated_at = NOW()
      WHERE id = ${riderId}
    `;
  }

  /**
   * Basic geohash calculation
   */
  private calculateGeohash(lat: number, lon: number, precision: number = 9): string {
    const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";
    let isEven = true;
    let latMin = -90, latMax = 90;
    let lonMin = -180, lonMax = 180;
    let hash = "";
    let bit = 0;
    let ch = 0;

    while (hash.length < precision) {
      if (isEven) {
        const mid = (lonMin + lonMax) / 2;
        if (lon > mid) {
          ch |= (1 << (4 - bit));
          lonMin = mid;
        } else {
          lonMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (lat > mid) {
          ch |= (1 << (4 - bit));
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      isEven = !isEven;
      if (bit < 4) {
        bit++;
      } else {
        hash += BASE32[ch];
        bit = 0;
        ch = 0;
      }
    }
    return hash;
  }
}
