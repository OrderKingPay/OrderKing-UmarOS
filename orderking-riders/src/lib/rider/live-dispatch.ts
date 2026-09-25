import type { DispatchPort, ReadyOrderEvent, EligibleRider } from "./dispatch.ts";

// In a real implementation, this would connect to Postgres
import { getSql } from "@/lib/db";

export class LiveDispatchAdapter implements DispatchPort {
  async enqueueReady(event: ReadyOrderEvent): Promise<{ jobId: string }> {
    const sql = await getSql();
    const res = await sql`
      INSERT INTO dispatch_jobs (
        order_id, 
        pickup_lat, pickup_lng, 
        drop_lat, drop_lng, 
        status, 
        created_at
      ) VALUES (
        ${event.orderId},
        ${event.pickupLocation.lat}, ${event.pickupLocation.lng},
        ${event.dropLocation.lat}, ${event.dropLocation.lng},
        'QUEUED',
        NOW()
      )
      RETURNING id
    `;
    return { jobId: res[0].id };
  }

  async findEligibleRiders(jobId: string): Promise<EligibleRider[]> {
    const sql = await getSql();
    const jobRes = await sql`SELECT * FROM dispatch_jobs WHERE id = ${jobId}`;
    if (!jobRes.length) return [];
    
    const job = jobRes[0];
    
    // Find riders within 5km using PostGIS or bounding box
    const riders = await sql<{
      rider_id: string;
      user_id: string;
      status: string;
      kyc_status: string;
      lat: number;
      lng: number;
    }>`
      SELECT r.rider_id, r.user_id, r.status, r.kyc_status, l.lat, l.lng
      FROM riders r
      JOIN rider_locations l ON r.rider_id = l.rider_id
      WHERE r.status = 'ONLINE' 
      AND r.kyc_status = 'VERIFIED'
      AND ST_DWithin(
        ST_MakePoint(l.lng, l.lat)::geography, 
        ST_MakePoint(${job.pickup_lng}, ${job.pickup_lat})::geography, 
        5000
      )
    `;

    return riders.map((r) => ({
      riderId: r.rider_id,
      userId: r.user_id,
      status: r.status,
      kycStatus: r.kyc_status,
      preferredZones: [],
      lastPoint: { lat: r.lat, lng: r.lng }
    }));
  }

  async offerToRider(jobId: string, riderId: string, timeoutSeconds: number) {
    const sql = await getSql();
    const safeTimeout = Math.max(1, Math.min(600, Math.trunc(timeoutSeconds)));
    const res = await sql`
      INSERT INTO dispatch_offers (
        job_id, rider_id, status, expires_at
      ) VALUES (
        ${jobId}, ${riderId}, 'OPEN', NOW() + (${safeTimeout} || ' seconds')::interval
      )
      RETURNING id, job_id, rider_id, status
    `;
    return {
      offerId: res[0].id,
      jobId: res[0].job_id,
      riderId: res[0].rider_id,
      status: res[0].status,
    };
  }

  async exclusiveAccept(offerId: string, riderId: string): Promise<boolean> {
    const sql = await getSql();
    const res = await sql`
      UPDATE dispatch_offers 
      SET status = 'ACCEPTED' 
      WHERE id = ${offerId} 
      AND rider_id = ${riderId} 
      AND status = 'OPEN' 
      AND expires_at > NOW()
      RETURNING id
    `;
    
    if (res.length > 0) {
      // Also update the job
      await sql`
        UPDATE dispatch_jobs 
        SET status = 'ASSIGNED', assigned_rider_id = ${riderId}
        WHERE id = (SELECT job_id FROM dispatch_offers WHERE id = ${offerId})
      `;
      return true;
    }
    return false;
  }
}
