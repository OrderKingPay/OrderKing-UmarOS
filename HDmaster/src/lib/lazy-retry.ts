import { lazy, type ComponentType } from "react";

/**
 * Detects whether an error is caused by a chunk loading failure or network mismatch.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const msg = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : "";
  return (
    name === "ChunkLoadError" ||
    /failed to fetch dynamically imported module/i.test(msg) ||
    /loading chunk [\d\w_-]+ failed/i.test(msg) ||
    /importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /unable to preload css/i.test(msg) ||
    /networkerror when attempting to fetch resource/i.test(msg) ||
    /failed to load resource/i.test(msg)
  );
}

export interface ImportWithRetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  name?: string;
  autoReloadOnFailure?: boolean;
}

const RELOAD_LOCK_KEY = "hdmaster_chunk_reload_lock";
const RELOAD_COOLDOWN_MS = 25_000;

/**
 * Triggers a safe, cache-busting reload to fetch updated chunks from deployment.
 * Guarded against reload loops using sessionStorage cooldown.
 */
export function triggerSelfHealingReload(reason: string = "chunk_load_error"): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(RELOAD_LOCK_KEY);
    const lastReload = raw ? parseInt(raw, 10) : 0;
    const now = Date.now();

    if (now - lastReload < RELOAD_COOLDOWN_MS) {
      console.warn(`[HDmaster Self-Healing] Reload suppressed by cooldown (${now - lastReload}ms < ${RELOAD_COOLDOWN_MS}ms). Reason: ${reason}`);
      return false;
    }

    sessionStorage.setItem(RELOAD_LOCK_KEY, now.toString());
    console.info(`[HDmaster Self-Healing] Auto-healing chunk mismatch via cache-busting reload (${reason})...`);

    // Attempt to purge stale browser caches if Cache API is available
    if ("caches" in window) {
      window.caches.keys().then((keys) => {
        keys.forEach((key) => window.caches.delete(key));
      }).catch(() => {});
    }

    // Force hard reload to get latest HTML and bundle hashes
    window.location.reload();
    return true;
  } catch (err) {
    console.error("[HDmaster Self-Healing] Failed to execute reload:", err);
    return false;
  }
}

/**
 * Wraps a dynamic import() with automatic retries and self-healing reload fallback.
 */
export async function importWithRetry<T>(
  importer: () => Promise<T>,
  options: ImportWithRetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 400,
    backoffFactor = 2,
    name = "module",
    autoReloadOnFailure = true,
  } = options;

  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await importer();
    } catch (err) {
      const isChunk = isChunkLoadError(err);
      console.warn(
        `[HDmaster LazyRetry] Import failed for "${name}" (Attempt ${attempt}/${maxRetries}, chunkError=${isChunk}):`,
        err
      );

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= backoffFactor;
      } else {
        // Last attempt failed
        if (isChunk && autoReloadOnFailure) {
          const reloaded = triggerSelfHealingReload(`chunk_fail_${name}`);
          if (reloaded) {
            // Keep promise pending while reload executes
            return new Promise<never>(() => {});
          }
        }
        throw err;
      }
    }
  }

  return importer();
}

/**
 * Self-healing replacement for React.lazy that intercepts chunk failures,
 * retries with backoff, supports named exports, and auto-recovers.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T } | { [key: string]: any }>,
  exportName?: string,
  options?: ImportWithRetryOptions
): React.LazyExoticComponent<T> {
  const componentName = exportName || options?.name || "LazyComponent";

  return lazy(() =>
    importWithRetry(async () => {
      const module = await importer();
      if (exportName && exportName in module) {
        return { default: (module as any)[exportName] as T };
      }
      if ("default" in module) {
        return { default: module.default as T };
      }
      // If neither default nor named export match directly, try finding the first component
      const keys = Object.keys(module);
      for (const k of keys) {
        if (typeof (module as any)[k] === "function") {
          return { default: (module as any)[k] as T };
        }
      }
      throw new Error(`[HDmaster LazyRetry] Export "${componentName}" not found in imported module.`);
    }, { ...options, name: componentName })
  );
}

/**
 * Installs global unhandled error and rejection listeners to catch ChunkLoadErrors
 * triggered across TanStack Router transitions or third-party scripts.
 */
let isInstalled = false;
export function installChunkErrorRecovery(): () => void {
  if (typeof window === "undefined" || isInstalled) return () => {};
  isInstalled = true;

  const handleRejection = (event: PromiseRejectionEvent) => {
    if (isChunkLoadError(event.reason)) {
      console.warn("[HDmaster Self-Healing] Intercepted unhandled chunk rejection:", event.reason);
      const reloaded = triggerSelfHealingReload("unhandled_chunk_rejection");
      if (reloaded) {
        event.preventDefault();
      }
    }
  };

  const handleError = (event: ErrorEvent) => {
    if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) {
      console.warn("[HDmaster Self-Healing] Intercepted unhandled chunk error event:", event.message);
      const reloaded = triggerSelfHealingReload("unhandled_chunk_error");
      if (reloaded) {
        event.preventDefault();
      }
    }
  };

  window.addEventListener("unhandledrejection", handleRejection);
  window.addEventListener("error", handleError);

  return () => {
    window.removeEventListener("unhandledrejection", handleRejection);
    window.removeEventListener("error", handleError);
    isInstalled = false;
  };
}
