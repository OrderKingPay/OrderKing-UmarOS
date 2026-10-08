import { chromium, Browser, Page, BrowserContext } from 'playwright';

export interface SessionResult {
  browser: Browser;
  context: BrowserContext;
  page: Page;
}

export async function createSession(url: string, headless: boolean = true): Promise<SessionResult> {
  // Launch Playwright chromium with evasion and ad-blocker style arguments
  const browser = await chromium.launch({
    headless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-extensions'
    ]
  });

  // Create browser context with a realistic user agent
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
  });

  // Stealth evasion via init script
  await context.addInitScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");

  // Create page and navigate to url
  const page = await context.newPage();
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  } catch (error) {
    // Attempt recovery on initial timeout
    console.warn(`Navigation to ${url} timed out, retrying...`, error);
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  }

  return { browser, context, page };
}
