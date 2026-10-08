import { chromium } from 'playwright';
import type { Browser, Page } from 'playwright';

export interface ComputerUseOptions {
  headless?: boolean;
}

export class BrowserAgent {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private options: ComputerUseOptions;

  constructor(options: ComputerUseOptions = {}) {
    this.options = options;
    this.options.headless = this.options.headless ?? true;
  }

  async start(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: this.options.headless });
      this.page = await this.browser.newPage();
    }
  }

  async stop(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  private ensurePage(): Page {
    if (!this.page) {
      throw new Error('Browser is not started. Call start() first.');
    }
    return this.page;
  }

  /**
   * Navigate to a specified URL.
   */
  async navigate(url: string): Promise<void> {
    const page = this.ensurePage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Click an element matching the selector.
   */
  async click(selector: string): Promise<void> {
    const page = this.ensurePage();
    await page.click(selector);
  }

  /**
   * Extract HTML content of the page or a specific selector.
   */
  async extractHtml(selector?: string): Promise<string> {
    const page = this.ensurePage();
    if (selector) {
      const element = await page.locator(selector).first();
      return await element.evaluate((node) => node.innerHTML);
    }
    return await page.content();
  }

  /**
   * Take a screenshot and return it as a base64 encoded string.
   */
  async takeScreenshot(fullPage: boolean = false): Promise<string> {
    const page = this.ensurePage();
    const buffer = await page.screenshot({ fullPage });
    return buffer.toString('base64');
  }

  /**
   * Evaluate arbitrary JS in the context of the page.
   */
  async evaluate<T>(pageFunction: string | ((...args: any[]) => T), ...args: any[]): Promise<T> {
    const page = this.ensurePage();
    return await page.evaluate(pageFunction as any, ...args);
  }
}
