import { jwtVerify, type JWTPayload, type KeyLike } from "jose";

export type VerifiedJwt = {
  payload: JWTPayload;
};

let cachedSecret: Uint8Array | null = null;

function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const raw = process.env.ORDERKING_JWT_SECRET?.trim();
  if (!raw || raw.length < 32) {
    throw new Error("ORDERKING_JWT_SECRET is missing or too short");
  }
  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
}

/**
 * Strict bearer-token verification for service-to-service routes.
 * Missing configuration is an error, never a permissive fallback.
 */
export async function verifyBearerJwt(
  authorization: string | null,
  options: {
    issuer?: string;
    audience?: string | string[];
  } = {},
): Promise<VerifiedJwt> {
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) throw new Error("Unauthorized");

  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
    issuer: options.issuer ?? process.env.ORDERKING_JWT_ISSUER,
    audience: options.audience ?? process.env.ORDERKING_JWT_AUDIENCE,
    clockTolerance: 5,
  });

  return { payload };
}

export function requireJwtSubject(payload: JWTPayload): string {
  if (!payload.sub) throw new Error("Unauthorized");
  return payload.sub;
}

export function requireJwtRole(payload: JWTPayload, allowedRoles: readonly string[]): string {
  const role = typeof payload.role === "string" ? payload.role : undefined;
  if (!role || !allowedRoles.includes(role)) throw new Error("Forbidden");
  return role;
}
