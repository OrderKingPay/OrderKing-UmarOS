import { getSql } from "@/lib/db";
import { getSessionUser, UnauthorizedError } from "./verify.server";
import { isActiveFounderEmployee } from "./founder-privileges";

/**
 * Founder-only access. No preview/dev user, bearer sent from the browser, or
 * self-reported admin role is trusted. The session must exist in Better Auth,
 * and that exact user must have an ACTIVE SUPER_ADMIN employee record.
 * No employee account is created or promoted by this read-only access check.
 */
export async function requireVerifiedFounderSession(): Promise<string> {
  const user = await getSessionUser();
  if (!user?.id) throw new UnauthorizedError();

  const sql = await getSql();
  const rows = await sql<{ role_key: string; status: string }>`
    SELECT role_key, status
    FROM employees
    WHERE user_id = ${user.id}
    LIMIT 1
  `;
  const row = rows[0];
  if (!isActiveFounderEmployee(row)) {
    throw new Error("FOUNDER_ACCESS_REQUIRED");
  }
  return user.id;
}
