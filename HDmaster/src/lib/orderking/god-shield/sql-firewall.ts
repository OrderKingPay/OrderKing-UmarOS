/**
 * UMAR OS — SQL Injection Prevention Middleware
 *
 * SECURITY ARCHITECTURE:
 * 1. This middleware is a DETECTION + LOGGING layer, not a substitution
 *    for parameterized queries. The actual defense is the Neon tagged
 *    template SQL client (getSql) which parameterizes all queries.
 * 2. This middleware detects and BLOCKS requests containing known attack
 *    patterns, logging them to the database for security audit.
 * 3. It does NOT silently redact payloads (which is dangerous — an
 *    attacker could craft payloads that become valid after redaction).
 */
import { Request, Response, NextFunction } from 'express';
import { getSql } from '../../db';

// Known SQL injection patterns — detection only, not defense
const SQL_ATTACK_PATTERNS = [
  /('\s*(OR|AND)\s+[\d']+=[\d']+)/i,     // ' OR 1=1, ' AND ''='
  /(;\s*(DROP|TRUNCATE|DELETE|ALTER)\s)/i, // ; DROP TABLE
  /(UNION\s+(ALL\s+)?SELECT)/i,           // UNION SELECT
  /(\/\*[\s\S]*?\*\/)/,                   // /* comment bypass */
  /(EXEC(\s|\+)+(s|x)p)/i,               // EXEC xp_ (SQL Server)
  /(CHAR\(\d+\))/i,                       // CHAR() obfuscation
  /(0x[0-9a-fA-F]+)/,                     // Hex-encoded payloads
  /(WAITFOR\s+DELAY)/i,                   // Time-based blind SQLi
  /(BENCHMARK\s*\()/i,                    // MySQL time-based
  /(SLEEP\s*\(\d+\))/i,                   // Sleep injection
];

function containsSqlInjection(value: unknown): string | null {
  if (typeof value === 'string') {
    for (const pattern of SQL_ATTACK_PATTERNS) {
      if (pattern.test(value)) {
        return value.slice(0, 200); // Truncate for logging
      }
    }
  } else if (typeof value === 'object' && value !== null) {
    for (const key of Object.keys(value)) {
      const match = containsSqlInjection((value as any)[key]);
      if (match) return match;
    }
  }
  return null;
}

/**
 * Express middleware: detect SQL injection attempts and BLOCK the request.
 * Logs the attempt to the security_audits table asynchronously.
 * Does NOT silently modify payloads.
 */
export function sqlFirewall(req: Request, res: Response, next: NextFunction) {
  const bodyMatch = containsSqlInjection(req.body);
  const queryMatch = containsSqlInjection(req.query);
  const detected = bodyMatch || queryMatch;

  if (detected) {
    // Block the request immediately
    res.status(403).json({
      error: 'Request blocked by security policy',
      code: 'SQL_INJECTION_DETECTED',
    });

    // Log asynchronously — do not await, do not block the response
    logSecurityEvent(req, detected).catch(() => {
      /* swallow logging errors to avoid crashing the server */
    });
    return;
  }

  next();
}

/**
 * Asynchronously log the detected attack to the security audit table.
 */
async function logSecurityEvent(req: Request, payload: string): Promise<void> {
  try {
    const sql = await getSql();
    await sql`
      INSERT INTO security_audits (
        event_type, severity, source_ip, request_path, request_method,
        detected_payload, user_agent, created_at
      ) VALUES (
        'SQL_INJECTION_ATTEMPT',
        'CRITICAL',
        ${req.ip ?? 'unknown'},
        ${req.originalUrl},
        ${req.method},
        ${payload},
        ${req.get('user-agent') ?? 'unknown'},
        NOW()
      )
    `;
  } catch {
    // Logging failure must not crash the server
  }
}
