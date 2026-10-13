/**
 * OrderKing Offline Resilience & Network Adaptability Engine
 *
 * Provides:
 * 1. Network status monitor (online/offline, effective connection type 2g/3g/4g, latency ping).
 * 2. Idempotent queued mutation engine (unique idempotencyKey, target endpoint, payload, retryCount, maxRetries).
 * 3. Queue replay mechanism when connectivity restores with exponential backoff and jitter.
 * 4. Data-saver mode: triggers automatic image downsampling / low-res placeholder flags on 2G or slow networks.
 */

export type EffectiveConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

export interface NetworkInformationLike {
  effectiveType?: EffectiveConnectionType;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (type: string, listener: (ev: Event) => void) => void;
  removeEventListener?: (type: string, listener: (ev: Event) => void) => void;
}

export interface NetworkStatus {
  isOnline: boolean;
  effectiveType: EffectiveConnectionType;
  downlink?: number;
  rtt?: number;
  saveData: boolean;
  latencyMs: number | null;
  isDataSaverMode: boolean;
  lastChecked: number;
}

export type NetworkStatusListener = (status: NetworkStatus) => void;

export interface NetworkMonitorOptions {
  pingEndpoint?: string;
  pingTimeoutMs?: number;
  customPingFn?: () => Promise<number>;
  initialOnline?: boolean;
  initialEffectiveType?: EffectiveConnectionType;
  initialSaveData?: boolean;
  highLatencyThresholdMs?: number;
  targetWindow?: Window | null;
}

/**
 * Calculates exponential backoff with full or proportional jitter.
 * Formula: delay = min(maxDelayMs, baseDelayMs * 2^(retryCount - 1)) + random * jitterFactor * delay
 */
export function calculateBackoffWithJitter(
  retryCount: number,
  baseDelayMs: number = 500,
  maxDelayMs: number = 30000,
  jitterFactor: number = 0.25,
  randomFn: () => number = Math.random
): number {
  if (retryCount <= 0) return 0;
  const exponentialDelay = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, retryCount - 1));
  const jitter = randomFn() * jitterFactor * exponentialDelay;
  return Math.round(exponentialDelay + jitter);
}

/**
 * Monitors device/browser network connectivity, bandwidth tiers, and latency.
 */
export class NetworkMonitor {
  private online: boolean;
  private effectiveType: EffectiveConnectionType;
  private saveData: boolean;
  private latencyMs: number | null = null;
  private dataSaverOverride: boolean | null = null;
  private readonly listeners = new Set<NetworkStatusListener>();
  private readonly pingEndpoint: string;
  private readonly pingTimeoutMs: number;
  private readonly highLatencyThresholdMs: number;
  private readonly customPingFn?: () => Promise<number>;
  private readonly boundOnlineHandler: () => void;
  private readonly boundOfflineHandler: () => void;
  private readonly boundConnectionChangeHandler: () => void;
  private readonly targetWindow: Window | null;
  private readonly connectionObj: NetworkInformationLike | null = null;

  constructor(options: NetworkMonitorOptions = {}) {
    this.pingEndpoint = options.pingEndpoint ?? '/api/health';
    this.pingTimeoutMs = options.pingTimeoutMs ?? 3000;
    this.highLatencyThresholdMs = options.highLatencyThresholdMs ?? 1500;
    this.customPingFn = options.customPingFn;

    const detectedWindow = options.targetWindow !== undefined
      ? options.targetWindow
      : (typeof window !== 'undefined' ? window : null);
    this.targetWindow = detectedWindow;

    const nav = typeof navigator !== 'undefined' ? navigator : null;
    const navConn = nav && 'connection' in nav
      ? (nav as unknown as { connection?: NetworkInformationLike }).connection ?? null
      : null;
    this.connectionObj = navConn;

    this.online = options.initialOnline ?? (nav ? nav.onLine : true);
    this.effectiveType = options.initialEffectiveType ?? (navConn?.effectiveType ?? '4g');
    this.saveData = options.initialSaveData ?? (navConn?.saveData ?? false);

    this.boundOnlineHandler = () => this.handleOnline();
    this.boundOfflineHandler = () => this.handleOffline();
    this.boundConnectionChangeHandler = () => this.handleConnectionChange();

    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    if (this.targetWindow) {
      this.targetWindow.addEventListener('online', this.boundOnlineHandler);
      this.targetWindow.addEventListener('offline', this.boundOfflineHandler);
    }
    if (this.connectionObj && typeof this.connectionObj.addEventListener === 'function') {
      this.connectionObj.addEventListener('change', this.boundConnectionChangeHandler);
    }
  }

  public handleOnline(): void {
    this.setOnline(true);
  }

  public handleOffline(): void {
    this.setOnline(false);
  }

  public handleConnectionChange(): void {
    if (this.connectionObj) {
      if (this.connectionObj.effectiveType) {
        this.effectiveType = this.connectionObj.effectiveType;
      }
      if (typeof this.connectionObj.saveData === 'boolean') {
        this.saveData = this.connectionObj.saveData;
      }
      this.notifyListeners();
    }
  }

  public setOnline(online: boolean): void {
    if (this.online !== online) {
      this.online = online;
      this.notifyListeners();
    }
  }

  public setEffectiveType(effectiveType: EffectiveConnectionType): void {
    if (this.effectiveType !== effectiveType) {
      this.effectiveType = effectiveType;
      this.notifyListeners();
    }
  }

  public setSaveData(saveData: boolean): void {
    if (this.saveData !== saveData) {
      this.saveData = saveData;
      this.notifyListeners();
    }
  }

  public setDataSaverOverride(override: boolean | null): void {
    this.dataSaverOverride = override;
    this.notifyListeners();
  }

  public isDataSaverActive(): boolean {
    if (this.dataSaverOverride !== null) {
      return this.dataSaverOverride;
    }
    if (this.saveData) {
      return true;
    }
    if (this.effectiveType === 'slow-2g' || this.effectiveType === '2g') {
      return true;
    }
    if (this.latencyMs !== null && this.latencyMs >= this.highLatencyThresholdMs) {
      return true;
    }
    return false;
  }

  public getStatus(): NetworkStatus {
    return {
      isOnline: this.online,
      effectiveType: this.effectiveType,
      saveData: this.saveData,
      latencyMs: this.latencyMs,
      isDataSaverMode: this.isDataSaverActive(),
      lastChecked: Date.now(),
    };
  }

  public isOnline(): boolean {
    return this.online;
  }

  public subscribe(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    for (const listener of this.listeners) {
      try {
        listener(status);
      } catch (err) {
        console.error('NetworkMonitor listener error:', err);
      }
    }
  }

  public async ping(endpoint?: string): Promise<number | null> {
    const start = Date.now();
    try {
      if (this.customPingFn) {
        const measured = await this.customPingFn();
        this.latencyMs = measured;
        this.online = true;
        this.notifyListeners();
        return measured;
      }

      if (typeof fetch === 'function') {
        const target = endpoint ?? this.pingEndpoint;
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller
          ? setTimeout(() => controller.abort(), this.pingTimeoutMs)
          : null;

        const response = await fetch(target, {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller?.signal,
        });

        if (timeoutId) clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Ping failed with status code ${response.status}`);
        }

        const latency = Date.now() - start;
        this.latencyMs = latency;
        this.online = true;
        this.notifyListeners();
        return latency;
      }

      return null;
    } catch {
      this.latencyMs = null;
      this.online = false;
      this.notifyListeners();
      return null;
    }
  }

  public destroy(): void {
    if (this.targetWindow) {
      this.targetWindow.removeEventListener('online', this.boundOnlineHandler);
      this.targetWindow.removeEventListener('offline', this.boundOfflineHandler);
    }
    if (this.connectionObj && typeof this.connectionObj.removeEventListener === 'function') {
      this.connectionObj.removeEventListener('change', this.boundConnectionChangeHandler);
    }
    this.listeners.clear();
  }
}

/**
 * Thrown when attempting to enqueue a mutation with an existing idempotencyKey.
 */
export class DuplicateMutationError extends Error {
  public readonly idempotencyKey: string;

  constructor(idempotencyKey: string) {
    super(`Duplicate mutation rejected: idempotencyKey "${idempotencyKey}" is already registered in the mutation queue`);
    this.name = 'DuplicateMutationError';
    this.idempotencyKey = idempotencyKey;
    Object.setPrototypeOf(this, DuplicateMutationError.prototype);
  }
}

export type MutationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QueuedMutation<T = unknown> {
  id: string;
  idempotencyKey: string;
  endpoint: string;
  payload: T;
  method: string;
  headers: Record<string, string>;
  retryCount: number;
  maxRetries: number;
  status: MutationStatus;
  createdAt: number;
  lastAttemptAt: number | null;
  nextRetryAt?: number | null;
  error?: string | null;
  response?: unknown;
}

export interface EnqueueMutationOptions<T = unknown> {
  idempotencyKey: string;
  endpoint: string;
  payload: T;
  method?: string;
  headers?: Record<string, string>;
  maxRetries?: number;
}

export type MutationExecutor = (mutation: QueuedMutation) => Promise<unknown>;

export interface ReplayResult {
  processed: number;
  succeeded: number;
  failed: number;
  skipped?: boolean;
}

export interface ImageTransformOptions {
  width?: number;
  quality?: number;
  lowResQuality?: number;
  format?: string;
}

export interface ImageDeliveryConfig {
  originalUrl: string;
  optimizedUrl: string;
  isDownsampled: boolean;
  isLowResPlaceholder: boolean;
  quality: number;
  width?: number;
  fetchPriority: 'low' | 'auto' | 'high';
}

export interface OfflineResilienceConfig {
  monitor?: NetworkMonitor;
  executor?: MutationExecutor;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterFactor?: number;
  defaultMaxRetries?: number;
  autoReplayOnOnline?: boolean;
  randomFn?: () => number;
}

/**
 * OrderKing Customer & Rider Offline Resilience Orchestrator
 */
export class OfflineResilienceEngine {
  public readonly networkMonitor: NetworkMonitor;
  private readonly queue: QueuedMutation[] = [];
  private readonly mutationMap = new Map<string, QueuedMutation>();
  private readonly executor: MutationExecutor;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly jitterFactor: number;
  private readonly defaultMaxRetries: number;
  private readonly autoReplayOnOnline: boolean;
  private readonly randomFn: () => number;
  private isReplaying = false;
  private unsubscribeMonitor?: () => void;

  constructor(config: OfflineResilienceConfig = {}) {
    this.networkMonitor = config.monitor ?? new NetworkMonitor();
    this.baseDelayMs = config.baseDelayMs ?? 500;
    this.maxDelayMs = config.maxDelayMs ?? 30000;
    this.jitterFactor = config.jitterFactor ?? 0.25;
    this.defaultMaxRetries = config.defaultMaxRetries ?? 3;
    this.autoReplayOnOnline = config.autoReplayOnOnline ?? true;
    this.randomFn = config.randomFn ?? Math.random;

    this.executor = config.executor ?? (async (mutation) => {
      if (typeof fetch !== 'function') {
        throw new Error('Default executor requires a global fetch API.');
      }
      const response = await fetch(mutation.endpoint, {
        method: mutation.method,
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': mutation.idempotencyKey,
          ...mutation.headers,
        },
        body: JSON.stringify(mutation.payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    });

    if (this.autoReplayOnOnline) {
      let previousOnline = this.networkMonitor.isOnline();
      this.unsubscribeMonitor = this.networkMonitor.subscribe((status) => {
        if (!previousOnline && status.isOnline) {
          void this.replayQueue();
        }
        previousOnline = status.isOnline;
      });
    }
  }

  /**
   * Returns all mutations in the queue.
   */
  public get queuedMutations(): QueuedMutation[] {
    return [...this.queue];
  }

  /**
   * Enqueues a new mutation. Rejects duplicate mutations by idempotencyKey.
   */
  public enqueue<T = unknown>(options: EnqueueMutationOptions<T>): QueuedMutation<T> {
    if (!options.idempotencyKey || typeof options.idempotencyKey !== 'string') {
      throw new Error('Mutation must specify a non-empty string idempotencyKey');
    }

    if (this.mutationMap.has(options.idempotencyKey)) {
      throw new DuplicateMutationError(options.idempotencyKey);
    }

    const mutation: QueuedMutation<T> = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      idempotencyKey: options.idempotencyKey,
      endpoint: options.endpoint,
      payload: options.payload,
      method: options.method ?? 'POST',
      headers: options.headers ?? {},
      retryCount: 0,
      maxRetries: options.maxRetries ?? this.defaultMaxRetries,
      status: 'pending',
      createdAt: Date.now(),
      lastAttemptAt: null,
      error: null,
    };

    this.queue.push(mutation as unknown as QueuedMutation);
    this.mutationMap.set(options.idempotencyKey, mutation as unknown as QueuedMutation);

    return mutation;
  }

  public hasMutation(idempotencyKey: string): boolean {
    return this.mutationMap.has(idempotencyKey);
  }

  public getMutation(idempotencyKey: string): QueuedMutation | undefined {
    return this.mutationMap.get(idempotencyKey);
  }

  public getPendingMutations(): QueuedMutation[] {
    return this.queue.filter((m) => m.status === 'pending');
  }

  public calculateBackoff(retryCount: number): number {
    return calculateBackoffWithJitter(
      retryCount,
      this.baseDelayMs,
      this.maxDelayMs,
      this.jitterFactor,
      this.randomFn
    );
  }

  /**
   * Safely replays pending mutations with exponential backoff and jitter.
   */
  public async replayQueue(options: { force?: boolean } = {}): Promise<ReplayResult> {
    if (this.isReplaying) {
      return { processed: 0, succeeded: 0, failed: 0, skipped: true };
    }

    if (!options.force && !this.networkMonitor.isOnline()) {
      return { processed: 0, succeeded: 0, failed: 0, skipped: true };
    }

    this.isReplaying = true;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      const pending = this.queue.filter((m) => m.status === 'pending');

      for (const mutation of pending) {
        if (!options.force && !this.networkMonitor.isOnline()) {
          break;
        }

        mutation.status = 'processing';
        mutation.lastAttemptAt = Date.now();
        processed++;

        try {
          const result = await this.executor(mutation);
          mutation.status = 'completed';
          mutation.response = result;
          mutation.error = null;
          succeeded++;
        } catch (err) {
          mutation.retryCount++;
          const errorMessage = err instanceof Error ? err.message : String(err);
          mutation.error = errorMessage;

          if (mutation.retryCount < mutation.maxRetries) {
            mutation.status = 'pending';
            const backoffDelay = this.calculateBackoff(mutation.retryCount);
            mutation.nextRetryAt = Date.now() + backoffDelay;
          } else {
            mutation.status = 'failed';
            failed++;
          }
        }
      }

      return { processed, succeeded, failed, skipped: false };
    } finally {
      this.isReplaying = false;
    }
  }

  /**
   * Checks if Data-Saver mode is active.
   */
  public isDataSaverActive(): boolean {
    return this.networkMonitor.isDataSaverActive();
  }

  /**
   * Calculates optimized image delivery parameters based on network condition.
   * On 2G / slow networks, automatically enables downsampling and low-res placeholder flags.
   */
  public getImageDeliveryOptions(url: string, options: ImageTransformOptions = {}): ImageDeliveryConfig {
    const isDataSaver = this.isDataSaverActive();

    if (isDataSaver) {
      const quality = options.lowResQuality ?? 30;
      const width = options.width ? Math.round(options.width * 0.5) : 320;
      const optimizedUrl = this.buildOptimizedImageUrl(url, quality, width, true);

      return {
        originalUrl: url,
        optimizedUrl,
        isDownsampled: true,
        isLowResPlaceholder: true,
        quality,
        width,
        fetchPriority: 'low',
      };
    }

    const quality = options.quality ?? 85;
    const width = options.width;
    const optimizedUrl = this.buildOptimizedImageUrl(url, quality, width, false);

    return {
      originalUrl: url,
      optimizedUrl,
      isDownsampled: false,
      isLowResPlaceholder: false,
      quality,
      width,
      fetchPriority: 'auto',
    };
  }

  /**
   * Generates a transformed image URL with quality and downsampling flags.
   */
  public getOptimizedImageUrl(url: string, options: ImageTransformOptions = {}): string {
    return this.getImageDeliveryOptions(url, options).optimizedUrl;
  }

  private buildOptimizedImageUrl(
    url: string,
    quality: number,
    width: number | undefined,
    isLowRes: boolean
  ): string {
    try {
      const base = 'https://orderking.in';
      const isRelative = url.startsWith('/');
      const parsed = new URL(url, base);

      parsed.searchParams.set('q', String(quality));
      if (width) {
        parsed.searchParams.set('w', String(width));
      }
      if (isLowRes) {
        parsed.searchParams.set('lowres', '1');
      }

      if (isRelative) {
        return parsed.pathname + parsed.search;
      }
      return parsed.toString();
    } catch {
      const delimiter = url.includes('?') ? '&' : '?';
      const lowresParam = isLowRes ? '&lowres=1' : '';
      const widthParam = width ? `&w=${width}` : '';
      return `${url}${delimiter}q=${quality}${widthParam}${lowresParam}`;
    }
  }

  public clearCompleted(): void {
    const active = this.queue.filter((m) => m.status !== 'completed');
    this.queue.length = 0;
    this.queue.push(...active);

    this.mutationMap.clear();
    for (const m of this.queue) {
      this.mutationMap.set(m.idempotencyKey, m);
    }
  }

  public clearQueue(): void {
    this.queue.length = 0;
    this.mutationMap.clear();
  }

  public destroy(): void {
    if (this.unsubscribeMonitor) {
      this.unsubscribeMonitor();
    }
    this.networkMonitor.destroy();
  }
}

/**
 * Shared singleton instance for default application resilience.
 */
export const offlineResilience = new OfflineResilienceEngine();
