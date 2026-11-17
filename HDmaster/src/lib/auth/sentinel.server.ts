import { getSql } from "../db";

export interface AuthAttemptContext {
  ip: string;
  accountIdentifier?: string;
  userAgent?: string;
  endpoint: string;
  metadata?: Record<string, unknown>;
}

export interface SentinelCheckResult {
  allowed: boolean;
  remainingAttempts: number;
  lockoutExpiresInSec?: number;
  reason?: string;
}

interface AttemptTracker {
  failedCount: number;
  firstAttemptAt: number;
  lockedUntil: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const HARD_LOCKOUT_MS = 30 * 60 * 1000;    // 30 minutes

export class AuthRateLimitSentinel {
  private static instance: AuthRateLimitSentinel;

  private ipAttempts: Map<string, AttemptTracker> = new Map();
  private accountAttempts: Map<string, AttemptTracker> = new Map();

  private constructor() {}

  public static getInstance(): AuthRateLimitSentinel {
    if (!AuthRateLimitSentinel.instance) {
      AuthRateLimitSentinel.instance = new AuthRateLimitSentinel();
    }
    return AuthRateLimitSentinel.instance;
  }

  private cleanExpired(tracker: AttemptTracker): boolean {
    const now = Date.now();
    if (tracker.lockedUntil > 0 && now < tracker.lockedUntil) {
      return false; // Still locked
    }
    if (now - tracker.firstAttemptAt > WINDOW_DURATION_MS && now >= tracker.lockedUntil) {
      return true; // Window expired
    }
    return false;
  }

  public checkRateLimit(ip: string, accountIdentifier?: string): SentinelCheckResult {
    const now = Date.now();
    const cleanIp = ip.trim();

    // 1. Check IP level lockout
    const ipRecord = this.ipAttempts.get(cleanIp);
    if (ipRecord) {
      if (this.cleanExpired(ipRecord)) {
        this.ipAttempts.delete(cleanIp);
      } else if (ipRecord.lockedUntil > now) {
        const remainingSec = Math.ceil((ipRecord.lockedUntil - now) / 1000);
        return {
          allowed: false,
          remainingAttempts: 0,
          lockoutExpiresInSec: remainingSec,
          reason: `IP ${cleanIp} is locked out due to multiple failed authentication attempts. Retry in ${remainingSec}s.`,
        };
      }
    }

    // 2. Check Account level lockout
    if (accountIdentifier) {
      const cleanAcct = accountIdentifier.trim().toLowerCase();
      const acctRecord = this.accountAttempts.get(cleanAcct);
      if (acctRecord) {
        if (this.cleanExpired(acctRecord)) {
          this.accountAttempts.delete(cleanAcct);
        } else if (acctRecord.lockedUntil > now) {
          const remainingSec = Math.ceil((acctRecord.lockedUntil - now) / 1000);
          return {
            allowed: false,
            remainingAttempts: 0,
            lockoutExpiresInSec: remainingSec,
            reason: `Account ${cleanAcct} is temporarily locked for security. Retry in ${remainingSec}s.`,
          };
        }
      }
    }

    const currentAttempts = Math.max(
      ipRecord?.failedCount || 0,
      accountIdentifier ? this.accountAttempts.get(accountIdentifier.trim().toLowerCase())?.failedCount || 0 : 0
    );

    return {
      allowed: true,
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - currentAttempts),
    };
  }

  public async recordFailedAttempt(ctx: AuthAttemptContext): Promise<SentinelCheckResult> {
    const now = Date.now();
    const cleanIp = ctx.ip.trim();

    // 1. Update IP tracking
    let ipTracker = this.ipAttempts.get(cleanIp);
    if (!ipTracker || this.cleanExpired(ipTracker)) {
      ipTracker = { failedCount: 1, firstAttemptAt: now, lockedUntil: 0 };
    } else {
      ipTracker.failedCount++;
    }

    if (ipTracker.failedCount >= MAX_FAILED_ATTEMPTS) {
      ipTracker.lockedUntil = now + HARD_LOCKOUT_MS;
    }
    this.ipAttempts.set(cleanIp, ipTracker);

    // 2. Update Account tracking if present
    let acctTracker: AttemptTracker | undefined;
    if (ctx.accountIdentifier) {
      const cleanAcct = ctx.accountIdentifier.trim().toLowerCase();
      acctTracker = this.accountAttempts.get(cleanAcct);
      if (!acctTracker || this.cleanExpired(acctTracker)) {
        acctTracker = { failedCount: 1, firstAttemptAt: now, lockedUntil: 0 };
      } else {
        acctTracker.failedCount++;
      }

      if (acctTracker.failedCount >= MAX_FAILED_ATTEMPTS) {
        acctTracker.lockedUntil = now + HARD_LOCKOUT_MS;
      }
      this.accountAttempts.set(cleanAcct, acctTracker);
    }

    // 3. Log to security incident queue in PostgreSQL
    await this.logSecurityIncident(ctx, ipTracker.failedCount, ipTracker.lockedUntil > 0);

    const isLocked = (ipTracker.lockedUntil > now) || Boolean(acctTracker && acctTracker.lockedUntil > now);
    const lockoutExpiresInSec = isLocked ? Math.ceil(HARD_LOCKOUT_MS / 1000) : undefined;

    return {
      allowed: !isLocked,
      remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - ipTracker.failedCount),
      lockoutExpiresInSec,
      reason: isLocked
        ? `Security lock activated: 5 failed authentication attempts exceeded. Locked for 30 minutes.`
        : undefined,
    };
  }

  public recordSuccessfulAttempt(ip: string, accountIdentifier?: string): void {
    this.ipAttempts.delete(ip.trim());
    if (accountIdentifier) {
      this.accountAttempts.delete(accountIdentifier.trim().toLowerCase());
    }
  }

  private async logSecurityIncident(
    ctx: AuthAttemptContext,
    failedCount: number,
    isLocked: boolean
  ): Promise<void> {
    try {
      const sql = await getSql();
      const incidentId = `sec_inc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await sql.query(
        `INSERT INTO audit_logs (
          id, org_id, action, target_type, target_id,
          ip, user_agent, entity, entity_id, actor_role, reason, metadata
        ) VALUES (
          $1, 'org_orderking', 'AUTH_FAILED_ATTEMPT', 'security_incident', $2,
          $3, $4, 'auth_sentinel', $5, 'ANONYMOUS', $6, $7
        )`,
        [
          incidentId,
          ctx.accountIdentifier || ctx.ip,
          ctx.ip,
          ctx.userAgent || null,
          ctx.endpoint,
          isLocked
            ? `Hard lockout triggered: ${failedCount} failed attempts on ${ctx.endpoint}`
            : `Failed authentication attempt #${failedCount} on ${ctx.endpoint}`,
          JSON.stringify({
            failedCount,
            isLocked,
            metadata: ctx.metadata || {},
          }),
        ]
      );
    } catch (err) {
      console.warn("[AuthRateLimitSentinel] DB incident logging skipped:", err);
    }
  }

  public resetAllForTesting(): void {
    this.ipAttempts.clear();
    this.accountAttempts.clear();
  }
}

export const authRateLimitSentinel = AuthRateLimitSentinel.getInstance();
