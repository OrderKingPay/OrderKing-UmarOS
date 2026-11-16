import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "./middleware";

/**
 * Server function to verify active administrator session.
 * Enforces fail-closed Better Auth and RBAC access via authMiddleware.
 */
export const verifyAdminSessionFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return { ok: true as const, userId: context.userId };
  });
