import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import { BrowserAgent } from './browser-agent.ts';

describe('BrowserAgent', () => {
  let agent: BrowserAgent;

  before(async () => {
    agent = new BrowserAgent({ headless: true });
    await agent.start();
  });

  after(async () => {
    await agent.stop();
  });

  it('should navigate and extract HTML', async () => {
    // Navigate to a simple data URL to avoid network issues
    await agent.navigate('data:text/html,<h1>Example Domain</h1>');
    
    const html = await agent.extractHtml('h1');
    assert.strictEqual(html.includes('Example Domain'), true, 'Should find Example Domain in h1');
  });

  it('should take a screenshot', async () => {
    const screenshotBase64 = await agent.takeScreenshot();
    assert.strictEqual(typeof screenshotBase64, 'string');
    assert.strictEqual(screenshotBase64.length > 0, true, 'Screenshot base64 should not be empty');
  });
});
