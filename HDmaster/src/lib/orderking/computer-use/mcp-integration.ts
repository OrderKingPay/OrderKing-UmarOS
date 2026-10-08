import { MCPServer } from '../interoperability/mcp/server.ts';
import { BrowserAgent } from './browser-agent.ts';
import type { MCPTool } from '../interoperability/mcp/types.ts';

export function registerBrowserTools(server: MCPServer, browserAgent: BrowserAgent) {
  server.registerTool(
    {
      name: 'browser_navigate',
      description: 'Navigate to a URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' }
        },
        required: ['url']
      }
    },
    async (args: { url: string }) => {
      await browserAgent.navigate(args.url);
      return {
        content: [{ type: 'text', text: `Navigated to ${args.url}` }]
      };
    }
  );

  server.registerTool(
    {
      name: 'browser_click',
      description: 'Click an element on the page',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string' }
        },
        required: ['selector']
      }
    },
    async (args: { selector: string }) => {
      await browserAgent.click(args.selector);
      return {
        content: [{ type: 'text', text: `Clicked ${args.selector}` }]
      };
    }
  );

  server.registerTool(
    {
      name: 'browser_extractHtml',
      description: 'Extract HTML from the page or a specific selector',
      inputSchema: {
        type: 'object',
        properties: {
          selector: { type: 'string' }
        }
      }
    },
    async (args: { selector?: string }) => {
      const html = await browserAgent.extractHtml(args.selector);
      return {
        content: [{ type: 'text', text: html }]
      };
    }
  );

  server.registerTool(
    {
      name: 'browser_takeScreenshot',
      description: 'Take a screenshot of the page',
      inputSchema: {
        type: 'object',
        properties: {
          fullPage: { type: 'boolean' }
        }
      }
    },
    async (args: { fullPage?: boolean }) => {
      const base64 = await browserAgent.takeScreenshot(args.fullPage);
      return {
        content: [{ type: 'text', text: base64 }]
      };
    }
  );
}
