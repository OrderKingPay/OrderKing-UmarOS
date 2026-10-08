import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('orderking-meter');

const apiLatencyHistogram = meter.createHistogram('api_latency', {
  description: 'Records the latency of API requests',
  unit: 'ms',
});

export const recordApiLatency = (route: string, ms: number): void => {
  apiLatencyHistogram.record(ms, { route });
};

const counters = new Map<string, ReturnType<typeof meter.createCounter>>();

export const incrementCounter = (name: string): void => {
  let counter = counters.get(name);
  if (!counter) {
    counter = meter.createCounter(name, {
      description: `Counter for ${name}`,
    });
    counters.set(name, counter);
  }
  counter.add(1);
};
