import test from 'node:test';
import assert from 'node:assert/strict';
import { Domain } from './domains';
import { BoundaryGate } from './boundary-gate';
import { AuditLog } from './audit-log';

test('Domain Isolation Enforcement', async (t) => {
  t.beforeEach(() => {
    AuditLog.clear();
  });

  await t.test('allows intra-domain access', () => {
    const decision = BoundaryGate.authorize(Domain.ORDERKING, Domain.ORDERKING, 'internal_action');
    assert.equal(decision.allowed, true);
    assert.equal(decision.reason, 'Intra-domain access is allowed.');
    
    const logs = AuditLog.getAuditLog();
    assert.equal(logs.length, 1);
    assert.equal(logs[0].decision, 'ALLOWED');
  });

  await t.test('allows explicitly authorized cross-domain access', () => {
    const decision = BoundaryGate.authorize(Domain.ORDERKING, Domain.KINGPAY, 'initiate_payment');
    assert.equal(decision.allowed, true);
    
    const logs = AuditLog.getAuditLog();
    assert.equal(logs.length, 1);
    assert.equal(logs[0].decision, 'ALLOWED');
    assert.equal(logs[0].action, 'initiate_payment');
  });

  await t.test('denies undefined cross-domain access', () => {
    const decision = BoundaryGate.authorize(Domain.CUSTOMER, Domain.SECURITY, 'hack_system');
    assert.equal(decision.allowed, false);
    assert.match(decision.reason, /No cross-domain access configured/);
    
    const logs = AuditLog.getAuditLog();
    assert.equal(logs.length, 1);
    assert.equal(logs[0].decision, 'DENIED');
  });

  await t.test('denies unauthorized action between allowed domains', () => {
    const decision = BoundaryGate.authorize(Domain.ORDERKING, Domain.KINGPAY, 'unauthorized_action');
    assert.equal(decision.allowed, false);
    assert.match(decision.reason, /Action 'unauthorized_action' is denied/);
    
    const logs = AuditLog.getAuditLog();
    assert.equal(logs.length, 1);
    assert.equal(logs[0].decision, 'DENIED');
  });

  await t.test('maintains audit trail', () => {
    BoundaryGate.authorize(Domain.ORDERKING, Domain.KINGPAY, 'initiate_payment');
    BoundaryGate.authorize(Domain.CUSTOMER, Domain.ORDERKING, 'place_order');
    BoundaryGate.authorize(Domain.RIDER, Domain.FINANCE, 'view_balances');

    const logs = AuditLog.getAuditLog();
    assert.equal(logs.length, 3);
    assert.equal(logs[0].decision, 'ALLOWED');
    assert.equal(logs[1].decision, 'ALLOWED');
    assert.equal(logs[2].decision, 'DENIED');
  });
});
