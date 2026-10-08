import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { trace, Span, SpanStatusCode } from '@opentelemetry/api';

// Configure the SDK
const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'orderking-agent',
  }),
  spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),
});

// Start the SDK
sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

export const tracer = trace.getTracer('orderking-agent-tracer');

// Helper functions for agent lifecycle tracing
export function withAgentTrace<T>(name: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: any) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}

export function traceModelCall<T>(modelName: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(`model_call:${modelName}`, async (span) => {
    span.setAttribute('agent.action', 'model_call');
    span.setAttribute('agent.model', modelName);
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: any) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}

export function traceToolCall<T>(toolName: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(`tool_call:${toolName}`, async (span) => {
    span.setAttribute('agent.action', 'tool_call');
    span.setAttribute('agent.tool', toolName);
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: any) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}

export function traceMemoryRead<T>(memoryKey: string, fn: (span: Span) => Promise<T>): Promise<T> {
  return tracer.startActiveSpan(`memory_read:${memoryKey}`, async (span) => {
    span.setAttribute('agent.action', 'memory_read');
    span.setAttribute('agent.memory_key', memoryKey);
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error: any) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
