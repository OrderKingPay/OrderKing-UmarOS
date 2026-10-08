import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { WorkloadIdentityManager } from './index.ts';

describe('WorkloadIdentityManager', () => {
  test('should issue and verify a workload identity token', async () => {
    const manager = new WorkloadIdentityManager({
      issuer: 'orderking-master',
      audience: 'orderking-internal-workforce',
      expirationTime: '5m',
    });

    const agentId = 'agent-x-123';
    const scopes = ['orders:read', 'orders:write'];

    // Issue Identity
    const issued = await manager.issueIdentity(agentId, scopes);
    assert.ok(issued.token, 'Token should be generated');
    assert.ok(issued.kid, 'Key ID should be present');
    assert.ok(issued.expiresAt > Date.now() / 1000, 'Expiration should be in the future');

    // Verify Identity
    const verified = await manager.verifyIdentity(issued.token);
    assert.strictEqual(verified.agentId, agentId, 'Agent ID should match');
    assert.deepStrictEqual(verified.scopes, scopes, 'Scopes should match exactly');
  });

  test('should fail to verify an invalid token', async () => {
    const manager = new WorkloadIdentityManager({
      issuer: 'orderking-master',
      audience: 'orderking-internal-workforce',
    });

    try {
      await manager.verifyIdentity('invalid.jwt.token');
      assert.fail('Should have thrown an error on invalid token');
    } catch (error: any) {
      assert.match(error.message, /JWS Protected Header is invalid|Invalid Compact JWS|Missing kid/, 'Error should relate to invalid token');
    }
  });

  test('should handle key rotation seamlessly', async () => {
    const manager = new WorkloadIdentityManager({
      issuer: 'orderking-master',
      audience: 'orderking-internal-workforce',
    });

    // Issue with initial key
    const issued1 = await manager.issueIdentity('agent-1', ['scope-1']);
    
    // Rotate keys
    await manager.rotateKeys();
    
    // Issue with new key
    const issued2 = await manager.issueIdentity('agent-2', ['scope-2']);
    
    assert.notStrictEqual(issued1.kid, issued2.kid, 'Keys should be different after rotation');

    // Both tokens should still be verifiable because the manager keeps track of old keys
    const verified1 = await manager.verifyIdentity(issued1.token);
    assert.strictEqual(verified1.agentId, 'agent-1');

    const verified2 = await manager.verifyIdentity(issued2.token);
    assert.strictEqual(verified2.agentId, 'agent-2');
  });
});
