export type SseEvent = {
  event?: string;
  data: unknown;
  id?: string;
};

type Subscriber = {
  controller: ReadableStreamDefaultController<Uint8Array>;
  signal: AbortSignal;
};

const encoder = new TextEncoder();

function encodeEvent(event: SseEvent): Uint8Array {
  const lines: string[] = [];
  if (event.id) lines.push(`id: ${event.id}`);
  if (event.event) lines.push(`event: ${event.event}`);
  const payload = typeof event.data === "string" ? event.data : JSON.stringify(event.data);
  for (const line of payload.split("\n")) lines.push(`data: ${line}`);
  lines.push("", "");
  return encoder.encode(lines.join("\n"));
}

export class SseHub {
  private readonly subscribers = new Set<Subscriber>();

  subscribe(signal?: AbortSignal): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        const subscriber: Subscriber = {
          controller,
          signal: signal ?? new AbortController().signal,
        };
        this.subscribers.add(subscriber);
        const onAbort = () => {
          this.subscribers.delete(subscriber);
          try { controller.close(); } catch { /* already closed */ }
        };
        if (subscriber.signal.aborted) {
          onAbort();
          return;
        }
        subscriber.signal.addEventListener("abort", onAbort, { once: true });
        controller.enqueue(encoder.encode(": connected\\n\\n"));
      },
      cancel: () => undefined,
    });
  }

  publish(event: SseEvent): number {
    const chunk = encodeEvent(event);
    let delivered = 0;
    for (const subscriber of this.subscribers) {
      if (subscriber.signal.aborted) {
        this.subscribers.delete(subscriber);
        continue;
      }
      try {
        subscriber.controller.enqueue(chunk);
        delivered += 1;
      } catch {
        this.subscribers.delete(subscriber);
      }
    }
    return delivered;
  }

  close(): void {
    for (const subscriber of this.subscribers) {
      try { subscriber.controller.close(); } catch { /* already closed */ }
    }
    this.subscribers.clear();
  }

  get size(): number {
    return this.subscribers.size;
  }
}

export function createSseStream(
  producer: (
    emit: (event: SseEvent) => void,
    signal: AbortSignal,
  ) => Promise<void>,
  request?: Request,
): ReadableStream<Uint8Array> {
  const signal = request?.signal ?? new AbortController().signal;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: SseEvent) => {
        if (signal.aborted) return;
        controller.enqueue(encodeEvent(event));
      };
      try {
        await producer(emit, signal);
        if (!signal.aborted) controller.close();
      } catch (error) {
        if (!signal.aborted) {
          emit({ event: "error", data: { message: error instanceof Error ? error.message : String(error) } });
          controller.close();
        }
      }
    },
    cancel() {
      // The request AbortSignal remains the source of truth for upstream cancellation.
    },
  });
}
