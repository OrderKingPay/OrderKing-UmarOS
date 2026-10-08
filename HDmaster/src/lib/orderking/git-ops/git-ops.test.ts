import test from 'node:test';
import assert from 'node:assert/strict';
import { GitClient } from './git-client';
import { CIPipeline } from './ci-pipeline';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

test('GitClient', async (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-ops-test-'));
  
  execSync('git init', { cwd: tempDir, stdio: 'ignore' });
  execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'ignore' });
  execSync('git config user.email "test@example.com"', { cwd: tempDir, stdio: 'ignore' });

  const git = new GitClient(tempDir);

  await t.test('status - empty', () => {
    const status = git.status();
    assert.strictEqual(status, '');
  });

  await t.test('branch - initial', () => {
    fs.writeFileSync(path.join(tempDir, 'test.txt'), 'hello world');
    execSync('git add test.txt', { cwd: tempDir });
    const commitMsg = git.commit('Initial commit');
    assert.ok(commitMsg.includes('Initial commit'));
  });

  await t.test('log', () => {
    const log = git.log(1);
    assert.ok(log.includes('Initial commit'));
  });

  await t.test('createBranch', () => {
    git.createBranch('feature-branch');
    const branches = git.branch();
    assert.ok(branches.includes('feature-branch'));
  });

  await t.test('status - modified', () => {
    fs.writeFileSync(path.join(tempDir, 'test.txt'), 'hello world updated');
    const status = git.status();
    assert.ok(status.includes('test.txt'), `Expected status to include 'test.txt'. Actual status: '${status}'`);
  });

  await t.test('diff', () => {
    const diff = git.diff();
    assert.ok(diff.includes('-hello world'));
    assert.ok(diff.includes('+hello world updated'));
  });

  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('CIPipeline', async (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-pipeline-test-'));
  const pipeline = new CIPipeline();

  await t.test('successful pipeline', () => {
    const result = pipeline.runPipeline(tempDir, [
      { name: 'echo', command: 'node -e "console.log(\'hello\')"' },
    ]);
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.stepResults.length, 1);
    assert.strictEqual(result.stepResults[0].success, true);
    assert.ok(result.stepResults[0].stdout.includes('hello'));
  });

  await t.test('failing pipeline', () => {
    const result = pipeline.runPipeline(tempDir, [
      { name: 'fail', command: 'node -e "process.exit(1)"' },
      { name: 'skip', command: 'node -e "console.log(\'skip\')"' }
    ]);
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.stepResults.length, 1);
    assert.strictEqual(result.stepResults[0].success, false);
  });

  fs.rmSync(tempDir, { recursive: true, force: true });
});
