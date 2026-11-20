import type { Sql } from "@/lib/db";
import { assertCan, isRestaurantRole, type Permission, type RestaurantRole } from "@/lib/rbac";
import { IsolationError, assertSameRestaurant } from "@/lib/isolation-guard";

export { IsolationError, assertSameRestaurant };

export type StaffContext = {
  userId: string;
  restaurantId: string;
  outletId: string | null;
  role: RestaurantRole;
  restaurantName: string;
  dataLabel: "SIMULATED" | "REAL" | "VERIFIED";
  verificationStatus: string;
  commissionBps: number;
};

export async function loadMemberships(
  sql: Sql,
  userId: string,
): Promise<StaffContext[]> {
  const cleanPhone = userId.replace(/^prt_/, "").replace(/\D/g, "");
  let rows: Array<{
    restaurant_id: string;
    outlet_id: string | null;
    role: string;
    restaurant_name: string;
    data_label: string;
    verification_status: string;
    commission_bps: number;
  }> = [];

  try {
    rows = await sql<{
      restaurant_id: string;
      outlet_id: string | null;
      role: string;
      restaurant_name: string;
      data_label: string;
      verification_status: string;
      commission_bps: number;
    }>`
      select s.restaurant_id, s.outlet_id, s.role,
             coalesce(nullif(r.display_name, ''), nullif(r.name, ''), 'Restaurant Operations Center') as restaurant_name,
             r.data_label, r.verification_status, r.commission_bps
      from restaurant_staff s
      join restaurants r on r.id = s.restaurant_id
      where (s.user_id = ${userId} or (length(${cleanPhone}) >= 10 and s.user_id = ${cleanPhone}))
        and s.is_active = true
      union
      select r.id as restaurant_id, null as outlet_id, 'OWNER' as role,
             coalesce(nullif(r.display_name, ''), nullif(r.name, ''), 'Restaurant Operations Center') as restaurant_name,
             r.data_label, r.verification_status, r.commission_bps
      from restaurants r
      where r.owner_user_id = ${userId}
         or (length(${cleanPhone}) >= 10 and (r.owner_user_id = ${cleanPhone} or r.phone = ${cleanPhone}))
      order by restaurant_id asc
    `;
  } catch {
    try {
      rows = await sql<{
        restaurant_id: string;
        outlet_id: string | null;
        role: string;
        restaurant_name: string;
        data_label: string;
        verification_status: string;
        commission_bps: number;
      }>`
        select r.id as restaurant_id, null as outlet_id, 'OWNER' as role,
               coalesce(nullif(r.display_name, ''), nullif(r.name, ''), 'Restaurant Operations Center') as restaurant_name,
               r.data_label, r.verification_status, r.commission_bps
        from restaurants r
        where r.owner_user_id = ${userId}
           or (length(${cleanPhone}) >= 10 and (r.owner_user_id = ${cleanPhone} or r.phone = ${cleanPhone}))
      `;
    } catch {
      rows = [];
    }
  }

  const seen = new Set<string>();
  const results: StaffContext[] = [];
  for (const row of rows) {
    if (!isRestaurantRole(row.role)) continue;
    if (seen.has(row.restaurant_id)) continue;
    seen.add(row.restaurant_id);
    results.push({
      userId,
      restaurantId: row.restaurant_id,
      outletId: row.outlet_id,
      role: row.role as RestaurantRole,
      restaurantName: row.restaurant_name || "Restaurant Operations Center",
      dataLabel: (row.data_label as StaffContext["dataLabel"]) ?? "REAL",
      verificationStatus: row.verification_status,
      commissionBps: Number(row.commission_bps || 0),
    });
  }
  return results;
}

export async function requireRestaurant(
  sql: Sql,
  userId: string,
  restaurantId: string | undefined,
  permission: Permission,
): Promise<StaffContext> {
  const memberships = await loadMemberships(sql, userId);
  if (memberships.length === 0) {
    throw new IsolationError("No restaurant membership", 404);
  }
  const ctx = restaurantId
    ? memberships.find((m) => m.restaurantId === restaurantId)
    : memberships[0];
  if (!ctx) {
    throw new IsolationError("Restaurant not found for this user", 404);
  }
  assertCan(ctx.role, permission);
  return ctx;
}
