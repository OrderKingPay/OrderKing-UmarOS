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
  const cleanPhone = String(userId || "").replace(/\D/g, "").slice(-10);
  const rows = await sql<{
    restaurant_id: string;
    outlet_id: string | null;
    role: string;
    restaurant_name: string;
    data_label: string;
    verification_status: string;
    commission_bps: number;
  }>`
    select s.restaurant_id, s.outlet_id, s.role,
           r.display_name as restaurant_name,
           r.data_label, r.verification_status, r.commission_bps
    from restaurant_staff s
    join restaurants r on r.id = s.restaurant_id
    where (s.user_id = ${userId} or (${cleanPhone} != '' and (s.user_id = ${cleanPhone} or s.user_id = ${'prt_' + cleanPhone})))
      and (s.is_active is null or s.is_active = true)
    union
    select r.id as restaurant_id, null as outlet_id, 'OWNER' as role,
           r.display_name as restaurant_name,
           r.data_label, r.verification_status, r.commission_bps
    from restaurants r
    where (r.owner_user_id = ${userId}
       or (${cleanPhone} != '' and (r.owner_user_id = ${cleanPhone} or r.owner_user_id = ${'prt_' + cleanPhone} or r.phone = ${cleanPhone}))
       or r.email = ${userId})
    order by restaurant_name asc
  `;
  return rows
    .filter((row) => isRestaurantRole(row.role))
    .map((row) => ({
      userId,
      restaurantId: row.restaurant_id,
      outletId: row.outlet_id,
      role: row.role as RestaurantRole,
      restaurantName: row.restaurant_name,
      dataLabel: (row.data_label as StaffContext["dataLabel"]) ?? "REAL",
      verificationStatus: row.verification_status,
      commissionBps: Number(row.commission_bps),
    }));
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
