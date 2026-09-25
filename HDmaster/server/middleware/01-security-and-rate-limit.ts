import { defineEventHandler, getRequestHeader, setResponseHeader, createError } from "h3";
import { checkRateLimit, getRateLimitHeaders, startCleanup } from "../../src/lib/orderking/server/rate-limiter";

// Initialize rate limiter cleanup for massive scale to prevent memory leaks
startCleanup();


export default defineEventHandler(async (event) => {
  const req = event.node?.req || (event as any).req;

  // 1. CORS Headers (Robust)
  setResponseHeader(event, "Access-Control-Allow-Origin", "*");
  setResponseHeader(event, "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  setResponseHeader(event, "Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");

  // 2. Security Headers (Perfectly tuned for massive scale)
  setResponseHeader(event, "X-DNS-Prefetch-Control", "off");
  setResponseHeader(event, "X-Frame-Options", "DENY");
  setResponseHeader(event, "X-Content-Type-Options", "nosniff");
  setResponseHeader(event, "Referrer-Policy", "strict-origin-when-cross-origin");
  setResponseHeader(event, "Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  setResponseHeader(event, "Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https:;");

  // Fast-path OPTIONS requests (debounce/preflight)
  if (req.method === "OPTIONS") {
    const res = event.node?.res || (event as any).res;
    if (res) {
      res.statusCode = 204;
      res.end();
    }
    return;
  }

  // 3. Advanced Payload Compression Checks & Size Limits
  const contentLength = getRequestHeader(event, "content-length");
  const contentEncoding = getRequestHeader(event, "content-encoding");
  
  const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024; // 5MB uncompressed limit
  const MAX_COMPRESSED_SIZE = 1 * 1024 * 1024; // 1MB compressed (Zip Bomb Protection)

  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (contentEncoding && ["gzip", "deflate", "br"].includes(contentEncoding.toLowerCase())) {
      if (size > MAX_COMPRESSED_SIZE) {
        throw createError({ statusCode: 413, statusMessage: "Compressed Payload Too Large (Zip Bomb Protection)" });
      }
    } else {
      if (size > MAX_PAYLOAD_SIZE) {
        throw createError({ statusCode: 413, statusMessage: "Payload Too Large" });
      }
    }
  }

  // 4. Rate Limiting for API routes
  if (req.url && (req.url.startsWith("/api/") || req.url.startsWith("/v1/"))) {
    const rawIp = getRequestHeader(event, "x-forwarded-for") || req.socket?.remoteAddress || "unknown-client";
    const clientIp = Array.isArray(rawIp) ? rawIp[0] : rawIp.split(",")[0].trim();
    
    const pathOnly = req.url.split("?")[0];
    const endpoint = `${req.method} ${pathOnly}`;

    const limitResult = checkRateLimit(clientIp, endpoint);
    const limitHeaders = getRateLimitHeaders(limitResult);
    
    for (const [key, value] of Object.entries(limitHeaders)) {
      setResponseHeader(event, key, value);
    }

    if (!limitResult.allowed) {
      throw createError({ 
        statusCode: 429, 
        statusMessage: "Too Many Requests", 
        data: { retryAfter: limitResult.retryAfterMs } 
      });
    }
  }
});
