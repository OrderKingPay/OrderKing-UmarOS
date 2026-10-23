/** Pure role predicate; caller must first verify the Better Auth session. */
export function isActiveFounderEmployee(
  record?: { role_key: string; status: string } | null,
): boolean {
  return Boolean(record?.role_key === "SUPER_ADMIN" && record.status === "ACTIVE");
}
