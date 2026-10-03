// @ts-nocheck
import { getSql } from "@/lib/db";
import { cellToLatLng, latLngToCell } from "h3-js";
import { nid } from "./workspace.server";

// H3 resolution is used only as a spatial index for verified telemetry.
const H3_RESOLUTION = 9;

export interface TelemetryPayload {
  orgId: string;
  entityType: "RIDER" | "CUSTOMER" | "RESTAURANT";
  entityId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

/**
 * Stores verified geospatial telemetry and updates active-order coordinates.
 */
export async function logGeospatialTelemetry(payload: TelemetryPayload) {
  const sql = await getSql();

  const h3Index = latLngToCell(payload.lat, payload.lng, H3_RESOLUTION);

  try {
    await sql.query(
      `INSERT INTO geospatial_telemetry_100x (
        id, org_id, entity_type, entity_id, lat, lng, h3_index, speed, heading, accuracy
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        nid("tel"),
        payload.orgId,
        payload.entityType,
        payload.entityId,
        payload.lat,
        payload.lng,
        h3Index,
        payload.speed ?? null,
        payload.heading ?? null,
        payload.accuracy ?? null,
      ]
    );

    // If rider, also update their latest active coordinates in the orders table for live tracking
    if (payload.entityType === "RIDER") {
      await sql.query(
        `UPDATE orders 
         SET rider_lat = $1, rider_lng = $2, rider_heading = $3, last_ping_at = NOW() 
         WHERE rider_id = $4 AND status IN ('RIDER_ASSIGNED', 'OUT_FOR_DELIVERY')`,
        [payload.lat, payload.lng, payload.heading ?? null, payload.entityId]
      );
    }
  } catch (err) {
    console.error("Geospatial telemetry error:", err);
    throw new Error("Telemetry was not persisted");
  }

  return { persisted: true, h3Index };
}
