import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { newId } from "@/lib/ids";

export interface ParcelEstimateInput {
  pickup: string;
  drop: string;
  category: string;
  distanceKm: number;
  senderName?: string;
  senderPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
  notes?: string;
}

export interface ParcelFareBreakdown {
  distanceKm: number;
  baseFareInr: number;
  perKmRateInr: number;
  distanceFareInr: number;
  totalInr: number;
  baseFarePaise: number;
  distanceFarePaise: number;
  totalPaise: number;
}

/**
 * Standard Porter-style local parcel pickup & drop estimator:
 * Base fare: ₹30
 * Distance rate: ₹10 / km
 */
export function computeParcelFare(distanceKm: number): ParcelFareBreakdown {
  const validKm = Math.max(1, Math.round(distanceKm * 10) / 10);
  const baseFareInr = 30;
  const perKmRateInr = 10;
  const distanceFareInr = Math.round(validKm * perKmRateInr);
  const totalInr = baseFareInr + distanceFareInr;
  return {
    distanceKm: validKm,
    baseFareInr,
    perKmRateInr,
    distanceFareInr,
    totalInr,
    baseFarePaise: baseFareInr * 100,
    distanceFarePaise: distanceFareInr * 100,
    totalPaise: totalInr * 100,
  };
}

export const createParcelOrderFn = createServerFn({ method: "POST" })
  .validator((data: ParcelEstimateInput) => data)
  .handler(async ({ data }: { data: ParcelEstimateInput }) => {
    const fare = computeParcelFare(data.distanceKm);
    const sql = await getSql();
    const id = newId("pcl");
    const pclBuf = new Uint32Array(1);
    crypto.getRandomValues(pclBuf);
    const publicId = `OK-PCL-${100000 + (pclBuf[0] % 900000)}`;

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS parcel_courier_orders (
          id text primary key,
          public_id text unique not null,
          sender_name text,
          sender_phone text,
          pickup_address text not null,
          receiver_name text,
          receiver_phone text,
          drop_address text not null,
          category text not null,
          distance_km numeric not null,
          base_fare_paise integer not null default 3000,
          distance_fare_paise integer not null,
          total_fare_paise integer not null,
          status text not null default 'REQUESTED',
          created_at timestamptz not null default now()
        )
      `;

      await sql`
        INSERT INTO parcel_courier_orders (
          id,
          public_id,
          sender_name,
          sender_phone,
          pickup_address,
          receiver_name,
          receiver_phone,
          drop_address,
          category,
          distance_km,
          base_fare_paise,
          distance_fare_paise,
          total_fare_paise,
          status
        ) VALUES (
          ${id},
          ${publicId},
          ${data.senderName?.trim() || "Sender"},
          ${data.senderPhone?.trim() || ""},
          ${data.pickup.trim()},
          ${data.receiverName?.trim() || "Receiver"},
          ${data.receiverPhone?.trim() || ""},
          ${data.drop.trim()},
          ${data.category.trim()},
          ${fare.distanceKm},
          ${fare.baseFarePaise},
          ${fare.distanceFarePaise},
          ${fare.totalPaise},
          'REQUESTED'
        )
      `;
    } catch (err: any) {
      console.warn("[createParcelOrderFn] Database record log:", err?.message || err);
    }

    return {
      success: true,
      orderId: id,
      publicId,
      ...fare,
      category: data.category,
      pickup: data.pickup,
      drop: data.drop,
      status: "REQUESTED",
      createdAt: new Date().toISOString(),
    };
  });
