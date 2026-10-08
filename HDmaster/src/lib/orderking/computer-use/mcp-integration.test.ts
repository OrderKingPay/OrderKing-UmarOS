import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import { MCPServer } from '../interoperability/mcp/server.ts';
import { BrowserAgent } from './browser-agent.ts';
import { registerBrowserTools } from './mcp-integration.ts';

describe('MCP Browser Integration', () => {
  let agent: BrowserAgent;
  let server: MCPServer;
  const messages: any[] = [];

  before(async () => {
    agent = new BrowserAgent({ headless: true });
    await agent.start();
    server = new MCPServer({ name: 'test', version: '1.0' }, (msg) => {
      messages.push(msg);
    });
    registerBrowserTools(server, agent);
  });

  after(async () => {
    await agent.stop();
  });

  it('should list registered tools', async () => {
    await server.handleMessage({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
    const response = messages.pop();
    assert.strictEqual(response.id, 1);
    const tools = response.result.tools;
    const toolNames = tools.map((t: any) => t.name);
    assert.strictEqual(toolNames.includes('browser_navigate'), true);
    assert.strictEqual(toolNames.includes('browser_click'), true);
    assert.strictEqual(toolNames.includes('browser_extractHtml'), true);
    assert.strictEqual(toolNames.includes('browser_takeScreenshot'), true);
  });

  it('should execute browser_navigate and browser_extractHtml', async () => {
    await server.handleMessage({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'browser_navigate', arguments: { url: 'data:text/html,<h1>Example Domain</h1>' } }
    });
    const navResponse = messages.pop();
    assert.strictEqual(navResponse.id, 2);
    assert.strictEqual(navResponse.result.content[0].text.includes('Navigated to'), true);

    await server.handleMessage({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'browser_extractHtml', arguments: { selector: 'h1' } }
    });
    const htmlResponse = messages.pop();
    assert.strictEqual(htmlResponse.id, 3);
    assert.strictEqual(htmlResponse.result.content[0].text.includes('Example Domain'), true);
  });
});
