import { BrowserSession } from './cdp-client';

export class DOMInteractor {
  constructor(private session: BrowserSession) {}

  async navigate(url: string): Promise<void> {
    await this.session.sendCommand('Page.enable');
    await this.session.sendCommand('Page.navigate', { url });
  }

  async click(selector: string): Promise<void> {
    const result = await this.session.sendCommand('Runtime.evaluate', {
      expression: `document.querySelector('${selector}')?.click()`,
      returnByValue: true
    });
    if (result.exceptionDetails) {
      throw new Error(`Failed to click on ${selector}`);
    }
  }

  async extractText(selector: string): Promise<string> {
    const result = await this.session.sendCommand('Runtime.evaluate', {
      expression: `document.querySelector('${selector}')?.textContent`,
      returnByValue: true
    });
    if (result.exceptionDetails) {
      throw new Error(`Failed to extract text from ${selector}`);
    }
    return result.result.value;
  }
}
