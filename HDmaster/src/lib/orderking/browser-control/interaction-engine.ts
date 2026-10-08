import { Page } from 'playwright';

export async function clickElement(page: Page, selector: string, maxRetries: number = 3): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Wait for element to be visible and clickable
      await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
      await page.click(selector);
      return;
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed to click ${selector}`);
      if (i === maxRetries - 1) {
        throw new Error(`Failed to click ${selector} after ${maxRetries} retries: ${error}`);
      }
      await page.waitForTimeout(1000); // Backoff before retry
    }
  }
}

export async function fillForm(page: Page, selector: string, text: string, maxRetries: number = 3): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });
      await page.fill(selector, text);
      return;
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed to fill ${selector}`);
      if (i === maxRetries - 1) {
        throw new Error(`Failed to fill ${selector} after ${maxRetries} retries: ${error}`);
      }
      await page.waitForTimeout(1000); // Backoff before retry
    }
  }
}

export async function extractText(page: Page, selector: string, maxRetries: number = 3): Promise<string[]> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.waitForSelector(selector, { state: 'attached', timeout: 10000 });
      const elements = await page.$$(selector);
      const texts = await Promise.all(elements.map(el => el.innerText()));
      return texts.map(t => t.trim()).filter(t => t.length > 0);
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed to extract text from ${selector}`);
      if (i === maxRetries - 1) {
        throw new Error(`Failed to extract text from ${selector} after ${maxRetries} retries: ${error}`);
      }
      await page.waitForTimeout(1000); // Backoff before retry
    }
  }
  return [];
}
