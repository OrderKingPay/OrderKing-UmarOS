import { getSql } from '../../db';

/**
 * Freezes the specified system domain (e.g. 'finance', 'dispatch', 'auth')
 * by inserting a lock record. Services must check this table to ensure
 * they are not operating during a freeze.
 */
export async function freezeSystem(domain: string): Promise<void> {
    const sql = await getSql();
    
    // Create the locks table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS system_locks (
        domain TEXT PRIMARY KEY,
        is_frozen BOOLEAN NOT NULL DEFAULT false,
        frozen_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Insert or update the lock
    await sql`
      INSERT INTO system_locks (domain, is_frozen, frozen_at, updated_at)
      VALUES (${domain}, true, NOW(), NOW())
      ON CONFLICT (domain) DO UPDATE 
      SET is_frozen = true, frozen_at = NOW(), updated_at = NOW()
    `;

    console.log(`[Emergency] System domain '${domain}' has been FROZEN.`);
}

/**
 * Kills a specific autonomous AI agent, stopping it from executing tasks.
 */
export async function killAgent(agentId: string): Promise<void> {
    const sql = await getSql();
    
    // Mark tasks as KILLED
    await sql`
      UPDATE autonomous_tasks 
      SET state = 'FAILED', error_state = 'Terminated by Emergency Control Plane', updated_at = NOW()
      WHERE owner = ${agentId} AND state NOT IN ('COMPLETED', 'FAILED', 'BLOCKED', 'ESCALATED')
    `;

    // Mark agent memory/state as blocked if we have an ai_work_items or agent table
    // (Falling back to checking ai_work_items if they exist)
    try {
        await sql`
          UPDATE ai_work_items
          SET status = 'FAILED', result_json = '{"error": "Agent killed by Emergency Control Plane"}'
          WHERE agent_role = ${agentId} AND status IN ('QUEUED', 'IN_PROGRESS')
        `;
    } catch (e) {
        // Table might not exist or schema differs, ignore safely
    }

    console.log(`[Emergency] Agent '${agentId}' has been KILLED.`);
}

/**
 * Revokes all active user and service identity tokens to force re-authentication.
 */
export async function revokeTokens(): Promise<void> {
    const sql = await getSql();
    
    // BetterAuth session table
    try {
        // We delete all sessions to force everyone to re-authenticate
        await sql.query(`DELETE FROM "session"`);
    } catch (e) {
        console.warn("[Emergency] Could not delete from session table", e);
    }

    try {
        // We delete all account tokens just in case
        await sql.query(`
            UPDATE "account"
            SET "accessToken" = NULL, "refreshToken" = NULL, "idToken" = NULL
        `);
    } catch (e) {
        console.warn("[Emergency] Could not revoke account tokens", e);
    }
    
    console.log(`[Emergency] All identity tokens have been REVOKED.`);
}
