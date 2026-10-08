import { createSession } from './browser-session';

export interface DishPrice {
  dish: string;
  price: string;
}

export async function automateCompetitorScraping(competitorUrl: string): Promise<DishPrice[]> {
  let session;
  
  try {
    console.log(`Starting competitor scraping for: ${competitorUrl}`);
    session = await createSession(competitorUrl, true);
    const { page, browser } = session;

    // Wait for generic dish elements (can be overridden by specific competitor templates)
    const itemSelector = '.dish-item, .menu-item, article, .product-card';
    const titleSelector = '.dish-title, .item-title, h2, h3, .product-name';
    const priceSelector = '.dish-price, .item-price, .price, .amount';
    
    // Additional wait for dynamic frameworks (React/Vue/Angular) to render elements
    await page.waitForTimeout(3000);

    const items = await page.$$(itemSelector);
    const results: DishPrice[] = [];

    // Extract top 10 items
    for (const item of items.slice(0, 10)) {
      const titleEl = await item.$(titleSelector);
      const priceEl = await item.$(priceSelector);
      
      const dish = titleEl ? await titleEl.innerText() : 'Unknown Dish';
      const price = priceEl ? await priceEl.innerText() : 'Unknown Price';
      
      if (dish !== 'Unknown Dish') {
        results.push({ dish: dish.trim(), price: price.trim() });
      }
    }
    
    console.log(`Successfully extracted ${results.length} dishes from ${competitorUrl}.`);
    return results;
  } catch (error) {
    console.error(`Error during automateCompetitorScraping for ${competitorUrl}:`, error);
    throw new Error(`Scraping automation failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (session?.browser) {
      console.log('Closing browser session safely...');
      await session.browser.close();
    }
  }
}
