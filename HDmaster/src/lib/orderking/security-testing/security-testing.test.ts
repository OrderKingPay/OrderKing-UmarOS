import test from 'node:test';
import assert from 'node:assert';
import { PayloadFuzzer, AutomatedPenTester } from './index.ts';

test('Security Testing Framework - External Limitation Compliance', async () => {
  const fuzzer = new PayloadFuzzer();
  const tester = new AutomatedPenTester(fuzzer);
  
  const result = await tester.runScan('http://localhost:3000/api/users');
  assert.ok(result.report.includes('EXTERNAL_LIMITATION'));
});
