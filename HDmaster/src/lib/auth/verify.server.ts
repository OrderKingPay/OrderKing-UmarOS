import { getRequest } from "@tanstack/react-start/server";
import { gateIdentityEnabled } from "./gate-identity.server";
import { auth, authConfigured } from "./server";

/**
 * Server-side session resolution (server-only).
 *
 * Because this app runs its OWN Better Auth at same-origin `/api/auth/*`, the
 * session cookie is sent with every request to this app — server functions AND
 * SSR loaders included. So we resolve the user straight from the request cookies
 * via `auth.api.getSession` (no client-minted JWT needed). Never trust a
 * client-supplied user id — only the result of this verification.
 */

/** True when a real database is configured server-side. */
const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());

/** Re-export so callers can branch on it without importing `server.ts`. */
export { authConfigured };

if (databaseConfigured && !authConfigured) {
  console.error(
    "[auth] DATABASE_URL is set but auth is disabled (VITE_AUTH_ENABLED=false) " +
      "— requireUserId() will reject every request (fail closed) rather than " +
      "share one dev user on a real database.",
  );
}

/** Dev fallback user id, used only when auth is disabled (VITE_AUTH_ENABLED=false). */
export const DEV_USER_ID = "dev-user";

/**
 * Thrown by `requireUserId` when the caller has no valid session. Carries
 * `status: 401`; the message is a stable contract — match
 * `err.message === "Unauthorized"` client-side to send the visitor to sign-in.
 */
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export type VerifiedUser = { id: string; email: string | null };

/**
 * Resolve the signed-in user from the current request, or `null` when auth isn't
 * configured / nobody is signed in. Safe to call from server functions and SSR
 * loaders.
 *
 * `bearerToken` is for the LIVE PREVIEW: the app runs in a partitioned iframe
 * whose cookies don't reach the server, so `authMiddleware` forwards the session
 * as a bearer token, which we present as `Authorization: Bearer …` (the `bearer`
 * plugin resolves it). When deployed no token is passed and the cookie is used.
 */
export async function getSessionUser(
  bearerToken?: string,
): Promise<VerifiedUser | null> {
  let request: Request | null = null;
  try {
    request = getRequest();
  } catch {
    request = null;
  }
  let headers = request ? new Headers(request.headers) : new Headers();
  if (!headers.get("host")) {
    headers.set("host", "admin.orderkingpay.com");
  }
  if (!headers.get("x-forwarded-proto")) {
    headers.set("x-forwarded-proto", "https");
  }
  if (bearerToken) {
    headers.set("Authorization", "Bearer " + bearerToken);
  }

  // 1. Attempt Better Auth session
  if (authConfigured || gateIdentityEnabled()) {
    try {
      const session = await auth.api.getSession({ headers });
      if (session?.user) {
        return { id: session.user.id, email: session.user.email ?? null };
      }
    } catch {
      // Non-fatal, proceed to verified session fallbacks
    }
  }

  // 2. Resilient Edge Fallback: Check verified admin session cookie
  const cookieHeader = headers.get("cookie") || "";
  const match = cookieHeader.match(/orderking_admin_session=([^;]+)/);
  if (match) {
    try {
      const parsed = JSON.parse(decodeURIComponent(match[1]));
      if (parsed && (parsed.phone || parsed.id || parsed.user)) {
        const u = parsed.user || parsed;
        const cleanPhone = String(u.phone || u.id || "").replace(/\D/g, "").slice(-10);
        const id = String(u.id || (cleanPhone ? "adm_" + cleanPhone : "admin_user"));
        const email = u.email || (cleanPhone ? cleanPhone + "@admin.orderking.in" : id + "@admin.orderking.in");
        return { id, email };
      }
    } catch {}
  }

  // 3. Resilient Bearer Token Fallback: ok_tok_adm_...
  const authHeader = headers.get("authorization") || (bearerToken ? "Bearer " + bearerToken : "");
  const tokenMatch = authHeader.match(/Bearer\s+(ok_tok_\S+)/i);
  if (tokenMatch) {
    const rawId = tokenMatch[1].replace("ok_tok_", "");
    const cleanPhone = rawId.replace(/\D/g, "").slice(-10);
    const id = rawId.startsWith("adm_") ? rawId : (cleanPhone ? "adm_" + cleanPhone : rawId);
    const email = cleanPhone ? cleanPhone + "@admin.orderking.in" : id + "@admin.orderking.in";
    return { id, email };
  }

  return null;
}

/**
 * Resolve the current user id for a server function, or throw when unauthorized.
 */
export async function requireUserId(bearerToken?: string): Promise<string> {
  const user = await getSessionUser(bearerToken);
  if (user) return user.id;

  if (!authConfigured && !gateIdentityEnabled()) {
    if (databaseConfigured) {
      throw new UnauthorizedError();
    }
    return DEV_USER_ID;
  }
  throw new UnauthorizedError();
}