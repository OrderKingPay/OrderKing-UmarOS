import test from 'node:test';
import assert from 'node:assert';
import { KingPayComplianceMaster } from './compliance-flags';
import { RegulatoryAuditLogger } from './regulatory-audit';

test('KingPayComplianceMaster - All features default to false', () => {
  const compliance = new KingPayComplianceMaster();
  
  assert.strictEqual(compliance.isFeatureEnabled('upi'), false);
  assert.strictEqual(compliance.isFeatureEnabled('collect'), false);
  assert.strictEqual(compliance.isFeatureEnabled('pay'), false);
  assert.strictEqual(compliance.isFeatureEnabled('scan'), false);
  assert.strictEqual(compliance.isFeatureEnabled('wallet'), false);
  assert.strictEqual(compliance.isFeatureEnabled('recharge'), false);
  assert.strictEqual(compliance.isFeatureEnabled('autopay'), false);
  assert.strictEqual(compliance.isFeatureEnabled('settlements'), false);
});

test('KingPayComplianceMaster - Reject activation without KYC/KYB', () => {
  const compliance = new KingPayComplianceMaster();
  
  const result = compliance.activateFeature('upi', 'admin', false, true, 'auth-123');
  
  assert.strictEqual(result, false);
  assert.strictEqual(compliance.isFeatureEnabled('upi'), false);
});

test('KingPayComplianceMaster - Reject activation without PSP authorization', () => {
  const compliance = new KingPayComplianceMaster();
  
  const result = compliance.activateFeature('upi', 'admin', true, false, 'auth-123');
  
  assert.strictEqual(result, false);
  assert.strictEqual(compliance.isFeatureEnabled('upi'), false);
});

test('KingPayComplianceMaster - Reject activation without authorization reference', () => {
  const compliance = new KingPayComplianceMaster();
  
  const result = compliance.activateFeature('upi', 'admin', true, true, undefined);
  
  assert.strictEqual(result, false);
  assert.strictEqual(compliance.isFeatureEnabled('upi'), false);
});

test('KingPayComplianceMaster - Allow activation with all requirements met', () => {
  const compliance = new KingPayComplianceMaster();
  
  const result = compliance.activateFeature('wallet', 'compliance-officer', true, true, 'gov-auth-456');
  
  assert.strictEqual(result, true);
  assert.strictEqual(compliance.isFeatureEnabled('wallet'), true);
});

test('RegulatoryAuditLogger - Logs attempts correctly', () => {
  const auditLogger = new RegulatoryAuditLogger();
  const compliance = new KingPayComplianceMaster(auditLogger);
  
  compliance.activateFeature('settlements', 'test-user', false, false);
  
  const logs = auditLogger.getAuditLogs();
  assert.strictEqual(logs.length, 1);
  assert.strictEqual(logs[0].featureName, 'settlements');
  assert.strictEqual(logs[0].requestedBy, 'test-user');
  assert.strictEqual(logs[0].kycKybVerified, false);
  assert.strictEqual(logs[0].pspAuthorized, false);
});
