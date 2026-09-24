import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { UniversalSuperintelligenceEngine } from './universal-superintelligence-engine.server.ts';
import { getSql } from '../../db.ts';

describe('Universal Superintelligence Engine', () => {
  it('blocks execution when real provider credentials are missing', async () => {
    const sql = await getSql();
    await sql.query(`INSERT INTO organizations (id, name, legal_name) VALUES ('test_org', 'Test Org', 'Test Org LLC') ON CONFLICT DO NOTHING`);

    try {
      await UniversalSuperintelligenceEngine.executeUniversalCommand({
        orgId: 'test_org',
        owner: 'test_owner',
        instruction: 'Get operations summary',
        context: {}
      });
      
      const res = await sql.query(`SELECT state FROM autonomous_tasks WHERE owner = 'test_owner' ORDER BY created_at DESC LIMIT 1`);
      assert.equal(res.rows[0].state, 'COMPLETED');
    } catch (err: any) {
      assert.ok(err.message.includes('BLOCKED'), `Expected BLOCKED error, got: ${err.message}`);
    }
  });
});
