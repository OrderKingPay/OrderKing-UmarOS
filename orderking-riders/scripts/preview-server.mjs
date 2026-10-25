#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const WORKER_PATH = path.join(DIST, '_worker.js', 'index.js');

const portArgIdx = process.argv.indexOf('--port');
const cliPort = portArgIdx !== -1 && process.argv[portArgIdx + 1] ? Number(process.argv[portArgIdx + 1]) : null;
const PORT = cliPort || Number(process.env.PORT) || 8083;
const HOST = process.env.HOST || '127.0.0.1';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8'
};

let worker = null;
if (fs.existsSync(WORKER_PATH)) {
  try {
    const mod = await import(pathToFileURL(WORKER_PATH).href);
    worker = mod.default || mod;
    console.log('[preview-server] Cloudflare Pages SSR worker loaded successfully.');
  } catch (err) {
    console.warn('[preview-server] Note: Cloudflare worker import deferred:', err.message);
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const rawUrl = req.url || '/';
    const parsedUrl = new URL(rawUrl, `http://${req.headers.host || `${HOST}:${PORT}`}`);
    let pathname = decodeURIComponent(parsedUrl.pathname);

    // 1. Try serving static file directly from dist
    let filePath = path.join(DIST, pathname);
    
    // Prevent directory traversal
    if (!filePath.startsWith(DIST)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      if (pathname.startsWith('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // 2. Delegate to SSR Worker if available
    if (worker && typeof worker.fetch === 'function') {
      const headers = new Headers();
      for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
          if (Array.isArray(value)) {
            for (const v of value) headers.append(key, v);
          } else {
            headers.set(key, value);
          }
        }
      }

      let body = null;
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        body = Buffer.concat(chunks);
      }

      const webReq = new Request(parsedUrl.toString(), {
        method: req.method,
        headers,
        body
      });

      const webRes = await worker.fetch(webReq, process.env, { waitUntil: () => {} });
      res.statusCode = webRes.status;
      webRes.headers.forEach((val, key) => {
        if (key.toLowerCase() !== 'transfer-encoding') {
          res.setHeader(key, val);
        }
      });

      const resBuf = Buffer.from(await webRes.arrayBuffer());
      res.end(resBuf);
      return;
    }

    // 3. Static fallback (offline.html or 404)
    const offlineHtml = path.join(DIST, 'offline.html');
    if (fs.existsSync(offlineHtml)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      fs.createReadStream(offlineHtml).pipe(res);
      return;
    }

    res.statusCode = 404;
    res.end('Not Found');
  } catch (err) {
    console.error('[preview-server] Error:', err);
    res.statusCode = 500;
    res.end('Internal Server Error: ' + err.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n======================================================`);
  console.log(`  ORDERKING RIDERS PREVIEW SERVER ACTIVE`);
  console.log(`  URL:  http://${HOST}:${PORT}/`);
  console.log(`  ROOT: ${DIST}`);
  console.log(`======================================================\n`);
});
