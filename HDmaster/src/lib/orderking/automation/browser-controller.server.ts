export interface WebScrapingResult {
  success: boolean;
  url: string;
  data: string[];
  error?: string;
}

export interface ComputerActionPayload {
  actionType: 'click' | 'type' | 'scroll' | 'keyPress';
  targetX?: number;
  targetY?: number;
  text?: string;
  key?: string;
}

export class BrowserController {
  /**
   * Executes a web scraping task to extract content matching a given CSS class/id basic selector pattern.
   * Uses raw fetch and regex parsing for zero-dependency execution.
   */
  async executeWebScrapingTask(url: string, selector: string): Promise<WebScrapingResult> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      
      // Basic regex implementation to extract text based on a generic tag/class selector
      const results: string[] = [];
      
      let pattern;
      if (selector.startsWith('.')) {
        const className = selector.slice(1);
        pattern = new RegExp(`<[^>]+class=["'][^"']*?\\b${className}\\b[^"']*?["'][^>]*>(.*?)<\\/[^>]+>`, 'gis');
      } else if (selector.startsWith('#')) {
        const idName = selector.slice(1);
        pattern = new RegExp(`<[^>]+id=["']${idName}["'][^>]*>(.*?)<\\/[^>]+>`, 'gis');
      } else {
        pattern = new RegExp(`<${selector}[^>]*>(.*?)<\\/${selector}>`, 'gis');
      }

      let match;
      while ((match = pattern.exec(html)) !== null) {
        // Strip inner HTML tags to get raw text
        const innerText = match[1].replace(/<[^>]+>/g, '').trim();
        if (innerText) {
          results.push(innerText);
        }
      }

      return {
        success: true,
        url,
        data: results
      };
    } catch (error: any) {
      return {
        success: false,
        url,
        data: [],
        error: error.message || 'Unknown error occurred during scraping'
      };
    }
  }

  /**
   * Prepares the payload for an MCP (Model Context Protocol) client to execute computer actions.
   */
  prepareComputerAction(action: ComputerActionPayload): Record<string, any> {
    const mcpPayload = {
      jsonrpc: '2.0',
      method: 'execute_computer_action',
      params: {
        action: action.actionType,
        parameters: {
          x: action.targetX,
          y: action.targetY,
          text: action.text,
          key: action.key,
          timestamp: Date.now()
        }
      },
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()
    };
    
    return mcpPayload;
  }
}
