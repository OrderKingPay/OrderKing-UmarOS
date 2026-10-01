export type RetryPolicy = { retries?: number; baseDelayMs?: number; maxDelayMs?: number; timeoutMs?: number };
export type ResilientFetchOptions = RequestInit & { retryPolicy?: RetryPolicy };
const DEFAULT_POLICY: Required<RetryPolicy> = { retries: 4, baseDelayMs: 350, maxDelayMs: 6000, timeoutMs: 12000 };
function sleep(ms: number) { return new Promise<void>((resolve) => setTimeout(resolve, ms)); }
function retryDelay(attempt: number, policy: Required<RetryPolicy>) {
  const exp = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** attempt);
  const jitter = Math.round(exp * (0.15 + Math.random() * 0.2));
  return Math.min(policy.maxDelayMs, exp + jitter);
}
async function singleAttempt(input: RequestInfo | URL, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    if (init.signal) {
      if (init.signal.aborted) controller.abort();
      init.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
    return await fetch(input, { ...init, signal: controller.signal });
  } finally { clearTimeout(timeout); }
}
export async function resilientFetch(input: RequestInfo | URL, options: ResilientFetchOptions = {}) {
  const policy = { ...DEFAULT_POLICY, ...(options.retryPolicy ?? {}) };
  const method = String(options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);
  // Silent first-party device-instance signal for fraud correlation.
  // VPN/proxy users remain allowed; this is a risk signal, not an access block.
  if (typeof window !== "undefined") {
    try {
      let deviceId = window.localStorage.getItem("ok_device_instance_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        window.localStorage.setItem("ok_device_instance_id", deviceId);
      }
      headers.set("x-orderking-device-id", deviceId);
    } catch {
      // Privacy/storage-restricted browsers simply omit the optional signal.
    }
  }
  const retrySafe = ["GET", "HEAD", "OPTIONS"].includes(method) || headers.has("Idempotency-Key");
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= policy.retries; attempt += 1) {
    try {
      const response = await singleAttempt(input, { ...options, headers }, policy.timeoutMs);
      if (response.ok) return response;
      const retryable = retrySafe && (response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500);
      if (!retryable || attempt === policy.retries) return response;
    } catch (error) {
      lastError = error;
      if (!retrySafe || attempt === policy.retries) throw error;
    }
    await sleep(retryDelay(attempt, policy));
  }
  throw lastError instanceof Error ? lastError : new Error("Network request failed");
}
export async function resilientJson<T>(input: RequestInfo | URL, options: ResilientFetchOptions = {}) {
  const response = await resilientFetch(input, { ...options, headers: { Accept: "application/json", ...(options.headers ?? {}) } });
  return { response, data: (await response.json()) as T };
}
export function shouldUseLowBandwidthMode() {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
  return Boolean(connection?.saveData) || ["slow-2g", "2g"].includes(connection?.effectiveType ?? "");
}