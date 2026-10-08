import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';
import { Request, Response, NextFunction } from 'express';

export interface TraceContext {
  correlationId: string;
  requestId: string;
}

export const traceStorage = new AsyncLocalStorage<TraceContext>();

export function requestTracer(req: Request, res: Response, next: NextFunction) {
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();

  res.setHeader('x-correlation-id', correlationId);
  res.setHeader('x-request-id', requestId);

  const context: TraceContext = { correlationId, requestId };

  traceStorage.run(context, () => {
    next();
  });
}

export function getTraceContext(): TraceContext | undefined {
  return traceStorage.getStore();
}

export function getCorrelationId(): string | undefined {
  return getTraceContext()?.correlationId;
}

export function getRequestId(): string | undefined {
  return getTraceContext()?.requestId;
}
