import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('orderking-tracer');

export const withSpan = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  return tracer.startActiveSpan(name, async (span) => {
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      span.setAttribute('execution.time_ms', duration);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      span.setAttribute('execution.time_ms', duration);
      span.recordException(error instanceof Error ? error : new Error(String(error)));
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      span.end();
    }
  });
};
