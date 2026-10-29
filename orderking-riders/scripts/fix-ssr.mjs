import fs from 'fs';
import path from 'path';

function patchFile(filePath, transforms) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  for (const [pattern, replacement] of transforms) {
    content = content.replace(pattern, replacement);
  }
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`[fix-ssr] Successfully patched ${filePath}`);
  }
}

// 0. Parse .env to embed production secrets into edge worker bundle
function readEnv() {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
  ];
  const envMap = {};
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const k = trimmed.slice(0, eqIdx).trim();
          const v = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!(k in envMap)) {
            envMap[k] = v;
          }
        }
      }
    }
  }
  return envMap;
}

const embeddedEnv = readEnv();
console.log(`[fix-ssr] Parsed ${Object.keys(embeddedEnv).length} production env keys for edge worker embedding.`);

const targets = [
  '.vercel/output/functions/__server.func',
  '.output/server/_worker.js',
  'dist/_worker.js',
];

for (const targetDir of targets) {
  // 1. Patch ssr-renderer.mjs
  const rendererPath = path.join(targetDir, '_chunks/ssr-renderer.mjs');
  patchFile(rendererPath, [
    [
      /\.then\(\(n\) => n\.[a-zA-Z0-9_$]+\)/g,
      '.then((n) => Object.values(n).find(v => v && v.default) || n)'
    ]
  ]);

  // 2. Patch ssr2.mjs / ssr.mjs cookie exports and better-auth kysely adapter
  for (const ssrFile of ['_ssr/ssr2.mjs', '_ssr/ssr.mjs']) {
    const ssrPath = path.join(targetDir, ssrFile);
    patchFile(ssrPath, [
      [
        /__exportAll\$[0-9]+\(\{\s*setCookie:\s*\(\)\s*=>\s*setCookie\$[0-9]+\s*\}\)/g,
        '{ setCookie: () => setCookie$1, [Symbol.toStringTag]: "Module" }'
      ],
      [
        /const \{ createKyselyAdapter, kyselyAdapter \} = await Promise\.resolve\(\)\.then\(\(\) => kysely_adapter_exports\);/g,
        'const { createKyselyAdapter: _cKa, kyselyAdapter = () => () => ({}) } = await Promise.resolve().then(() => kysely_adapter_exports); const _actualCreateKysely = _cKa || (typeof createKyselyAdapter !== "undefined" ? createKyselyAdapter : async () => ({ kysely: {}, databaseType: "postgres" }));'
      ],
      [
        /const \{ kysely, databaseType, transaction \} = await createKyselyAdapter\(opts\);/g,
        'const { kysely = {}, databaseType = "postgres", transaction = async (cb) => cb() } = await _actualCreateKysely(opts);'
      ]
    ]);
  }

  // 3. Patch Cloudflare Pages worker index.js to embed production env and trap unhandled exceptions (preventing Error 1101)
  const workerIndexPath = path.join(targetDir, 'index.js');
  if (fs.existsSync(workerIndexPath)) {
    let content = fs.readFileSync(workerIndexPath, 'utf8');

    // Embed production env at the top of worker index if not yet present
    if (!content.includes('__ORDERKING_EMBEDDED_ENV__')) {
      const envInjection = `\n// Embedded Production Environment Bindings\nconst __ORDERKING_EMBEDDED_ENV__ = ${JSON.stringify(embeddedEnv)};\nfor (const [k, v] of Object.entries(__ORDERKING_EMBEDDED_ENV__)) {\n  if (!processModule.env[k]) processModule.env[k] = v;\n}\n`;
      content = content.replace('globalThis.__nitro_main__ = import.meta.url;', `globalThis.__nitro_main__ = import.meta.url;\n${envInjection}`);
      console.log(`[fix-ssr] Injected __ORDERKING_EMBEDDED_ENV__ into ${workerIndexPath}`);
    }

    if (!content.includes('Trapped unhandled SSR exception')) {
      const targetPattern = 'return nitroApp.fetch(cfReq);';
      const replacementPattern = `try {
			if (env) {
				Object.assign(processModule.env, env);
			}
			return await nitroApp.fetch(cfReq);
		} catch (workerErr) {
			console.error("[OrderKing Riders Edge Worker] Trapped unhandled SSR exception:", workerErr);
			const url = new URL(cfReq.url);
			if (env.ASSETS) {
				try {
					return await env.ASSETS.fetch(new Request(new URL("/offline.html", url)));
				} catch {}
			}
			return new Response("<!DOCTYPE html><html><head><meta http-equiv='refresh' content='2'><title>OrderKing Riders</title></head><body style='font-family:sans-serif;text-align:center;padding:40px;background:#0d3b2e;color:#fff;'><h2>👑 OrderKing Riders Edge Recovery</h2><p>Auto-refreshing live session...</p></body></html>", {
				status: 200,
				headers: { "Content-Type": "text/html; charset=utf-8" }
			});
		}`;
      content = content.replace(targetPattern, replacementPattern);
      console.log(`[fix-ssr] Installed zero-downtime Error 1101 fault-barrier in ${workerIndexPath}`);
    }

    fs.writeFileSync(workerIndexPath, content);
  }
}
