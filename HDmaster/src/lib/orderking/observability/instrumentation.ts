// @ts-nocheck
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { Resource } from '@opentelemetry/resources'; // @ts-ignore
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const traceExporter = process.env.OTLP_ENDPOINT 
  ? new OTLPTraceExporter({ url: process.env.OTLP_ENDPOINT }) 
  : new ConsoleSpanExporter();

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'orderking-service',
  }),
  traceExporter,
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new PgInstrumentation(),
  ],
});

export const initializeTracing = async (): Promise<void> => {
  try {
    sdk.start();
    console.log('OpenTelemetry tracing initialized.');
    
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => console.log('OpenTelemetry tracing terminated'))
        .catch((error) => console.log('Error terminating OpenTelemetry tracing', error))
        .finally(() => process.exit(0));
    });
  } catch (error) {
    console.log('Error initializing OpenTelemetry tracing', error);
  }
};
