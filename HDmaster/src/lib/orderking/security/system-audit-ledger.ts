import crypto from "node:crypto";
import { getSql } from "../../db.ts";

export interface SystemAuditEntry {
  actorId: string;
  actorRole: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  actionType:
    | "ORDER_MANUAL_CANCEL"
    | "PAYOUT_BATCH_APPROVED"
    | "FEE_MODIFIED"
    | "ROLE_ELEVATED"
    | "EMERGENCY_KILLSWITCH_TRIGGERED"
    | "GEOFENCE_OVERRIDE"
    | "RIDER_FORCE_OFFLINE"
    | "MERCHANT_SUSPENDED"
    | "DISPUTE_RESOLVED"
    | "REFUND_AUTHORIZED"
    | string;
  targetEntity: string;
  targetId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
}

export interface SystemAuditRecord {
  id: string;
  actorId: string;
  actorRole: string;
  ipAddress: string | null;
  userAgent: string | null;
  actionType: string;
  targetEntity: string;
  targetId: string;
  beforeStateSnapshot: Record<string, unknown> | null;
  afterStateSnapshot: Record<string, unknown> | null;
  previousChecksum: string;
  cryptographicChecksum: string;
  createdAt: string;
}

const GENESIS_CHECKSUM = "0000000000000000000000000000000000000000000000000000000000000000";

export function computeAuditChecksum(
  id: string,
  actorId: string,
  actionType: string,
  targetEntity: string,
  targetId: string,
  beforeJson: string,
  afterJson: string,
  previousChecksum: string,
  timestampStr: string
): string {
  const payload = [
    id,
    actorId,
    actionType,
    targetEntity,
    targetId,
    beforeJson,
    afterJson,
    previousChecksum,
    timestampStr,
  ].join("|");

  return crypto.createHash("sha256").update(payload).digest("hex");
}

export class SystemAuditLedger {
  private static instance: SystemAuditLedger;

  private constructor() {}

  public static getInstance(): SystemAuditLedger {
    if (!SystemAuditLedger.instance) {
      SystemAuditLedger.instance = new SystemAuditLedger();
    }
    return SystemAuditLedger.instance;
  }

  public async record(entry: SystemAuditEntry): Promise<SystemAuditRecord> {
    const sql = await getSql();

    // 1. Fetch latest audit log checksum for cryptographic chaining
    const latest = await sql.query<{ cryptographic_checksum: string }>(
      `SELECT cryptographic_checksum FROM system_audit_logs ORDER BY created_at DESC, id DESC LIMIT 1`
    );
    const previousChecksum = latest[0]?.cryptographic_checksum || GENESIS_CHECKSUM;

    const id = `sys_aud_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const beforeJson = entry.beforeState ? JSON.stringify(entry.beforeState) : "{}";
    const afterJson = entry.afterState ? JSON.stringify(entry.afterState) : "{}";
    const nowIso = new Date().toISOString();

    const cryptographicChecksum = computeAuditChecksum(
      id,
      entry.actorId,
      entry.actionType,
      entry.targetEntity,
      entry.targetId,
      beforeJson,
      afterJson,
      previousChecksum,
      nowIso
    );

    await sql.query(
      `INSERT INTO system_audit_logs (
        id, actor_id, actor_role, ip_address, user_agent, action_type,
        target_entity, target_id, before_state_snapshot, after_state_snapshot,
        previous_checksum, cryptographic_checksum, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12, $13)`,
      [
        id,
        entry.actorId,
        entry.actorRole,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.actionType,
        entry.targetEntity,
        entry.targetId,
        beforeJson,
        afterJson,
        previousChecksum,
        cryptographicChecksum,
        nowIso,
      ]
    );

    return {
      id,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      actionType: entry.actionType,
      targetEntity: entry.targetEntity,
      targetId: entry.targetId,
      beforeStateSnapshot: entry.beforeState || null,
      afterStateSnapshot: entry.afterState || null,
      previousChecksum,
      cryptographicChecksum,
      createdAt: nowIso,
    };
  }

  public async verifyAuditChainIntegrity(limit = 100): Promise<{ valid: boolean; recordsChecked: number; error?: string }> {
    const sql = await getSql();
    const rows = await sql.query<{
      id: string;
      actor_id: string;
      action_type: string;
      target_entity: string;
      target_id: string;
      before_state_snapshot: any;
      after_state_snapshot: any;
      previous_checksum: string;
      cryptographic_checksum: string;
      created_at: string;
    }>(
      `SELECT * FROM system_audit_logs ORDER BY created_at ASC LIMIT $1`,
      [limit]
    );

    if (rows.length === 0) {
      return { valid: true, recordsChecked: 0 };
    }

    let expectedPrev = GENESIS_CHECKSUM;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]!;
      if (row.previous_checksum !== expectedPrev) {
        return {
          valid: false,
          recordsChecked: i,
          error: `Chain broken at index ${i} (ID: ${row.id}): expected previous checksum ${expectedPrev}, found ${row.previous_checksum}`,
        };
      }

      const beforeJson = row.before_state_snapshot ? JSON.stringify(row.before_state_snapshot) : "{}";
      const afterJson = row.after_state_snapshot ? JSON.stringify(row.after_state_snapshot) : "{}";
      const timestampIso = new Date(row.created_at).toISOString();

      const computed = computeAuditChecksum(
        row.id,
        row.actor_id,
        row.action_type,
        row.target_entity,
        row.target_id,
        beforeJson,
        afterJson,
        row.previous_checksum,
        timestampIso
      );

      if (computed !== row.cryptographic_checksum) {
        return {
          valid: false,
          recordsChecked: i,
          error: `Tampered signature at index ${i} (ID: ${row.id}): record payload does not match cryptographic checksum`,
        };
      }

      expectedPrev = row.cryptographic_checksum;
    }

    return { valid: true, recordsChecked: rows.length };
  }
}

export const systemAuditLedger = SystemAuditLedger.getInstance();
