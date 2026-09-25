import { z } from "zod";
import * as crypto from "crypto";

export const TokenPayloadSchema = z.object({
  userId: z.string(),
  role: z.enum(["FOUNDER", "ADMIN", "AI_AGENT", "SYSTEM"]),
  exp: z.number().int().positive()
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;

/**
 * Task 1.3 [RBAC Vault]
 * Strict JSON Web Token (JWT) boundary validation for autonomous AI tool executions.
 * Validates the human userId and cryptographic role before accessing financial tables.
 */
export class RBACVault {
  private static SECRET = process.env.RBAC_SECRET_KEY || "fallback_dev_secret_key_change_me_in_prod";

  static sign(payload: Omit<TokenPayload, "exp">, expiresInMinutes = 60): string {
    const fullPayload: TokenPayload = {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + expiresInMinutes * 60,
    };
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
    
    const signature = crypto
      .createHmac("sha256", this.SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");
      
    return `${header}.${body}.${signature}`;
  }

  static verifyAndAuthorize(token: string, requiredRoles: TokenPayload["role"][]): TokenPayload {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid token format");
    }

    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", this.SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (signature !== expectedSignature) {
      throw new Error("Invalid token signature");
    }

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    const parsedPayload = TokenPayloadSchema.parse(payload);

    if (parsedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token expired");
    }

    if (!requiredRoles.includes(parsedPayload.role)) {
      throw new Error(`Unauthorized role. Expected one of: ${requiredRoles.join(", ")}`);
    }

    return parsedPayload;
  }
}
