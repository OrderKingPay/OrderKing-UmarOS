import { defineEventHandler, getRequestHeader, createError } from "h3";
import { checkRateLimit } from "../../src/lib/orderking/server/rate-limiter";

// Helper to determine if the user agent looks like a headless browser or scraper
function isBotUserAgent(userAgent: string): boolean {
  if (!userAgent) return true; // Missing UA is suspicious
  const lowerUA = userAgent.toLowerCase();
  
  // Known headless / scraper signatures
  const botSignatures = [
    "headlesschrome",
    "phantomjs",
    "puppeteer",
    "selenium",
    "playwright",
    "cypress",
    "python-requests",
    "scrapy",
    "curl",
    "wget",
    "postmanruntime",
    "insomnia"
  ];
  
  return botSignatures.some(sig => lowerUA.includes(sig));
}

function isWebDriver(event: any): boolean {
  // Selenium/WebDriver often sends webdriver: true header or similar flags
  const webDriverHeader = getRequestHeader(event, "webdriver");
  if (webDriverHeader && webDriverHeader.toLowerCase() === "true") {
    return true;
  }
  return false;
}

export default defineEventHandler(async (event) => {
  const req = event.node?.req || (event as any).req;
  const url = req.url || "";
  
  // We care most about scraping menus, pricing, etc.
  // We can apply this generally to /api/ and /v1/ routes.
  if (url.startsWith("/api/") || url.startsWith("/v1/")) {
    const userAgent = getRequestHeader(event, "user-agent") || "";
    const acceptLanguage = getRequestHeader(event, "accept-language");
    
    // 1. Detect headless browsers, Selenium
    const isBotUA = isBotUserAgent(userAgent);
    const hasWebDriver = isWebDriver(event);
    
    // Real human customers use standard browsers that send accept-language. 
    // We combine heuristics to avoid false positives.
    const isSuspectedBot = isBotUA || hasWebDriver || (!acceptLanguage && !userAgent);

    // 2. Autonomous Rate Limiting (Strict for suspected bots, generous for normal)
    const rawIp = getRequestHeader(event, "x-forwarded-for") || req.socket?.remoteAddress || "unknown-client";
    const clientIp = Array.isArray(rawIp) ? rawIp[0] : rawIp.split(",")[0].trim();
    
    // Autonomous logic: if suspected bot, use a much tighter limit window and max requests
    // Using a different endpoint key for scraper protection to isolate it
    const pathOnly = url.split("?")[0];
    const endpoint = `ANTI_SCRAPE ${req.method} ${pathOnly}`;

    // Normal users shouldn't hit this strict limit, but we apply it
    // If it's a suspected bot, we limit them to very few requests.
    const rateLimitConfig = isSuspectedBot ? {
      windowMs: 60_000,
      maxRequests: 5, // Extremely strict for bots
      banThresholdMultiplier: 2,
      banDurationMs: 600_000, // 10 minute ban
    } : {
      windowMs: 60_000,
      maxRequests: 150, // Very generous for humans (never blocked)
      banThresholdMultiplier: 5,
      banDurationMs: 300_000,
    };
    
    const limitResult = checkRateLimit(clientIp, endpoint, rateLimitConfig);

    if (!limitResult.allowed) {
      // 3. Rate-limit aggressive IPs autonomously
      throw createError({ 
        statusCode: 429, 
        statusMessage: "Too Many Requests - Anti-Scrape Protection", 
        data: { retryAfter: limitResult.retryAfterMs } 
      });
    }
  }
});
