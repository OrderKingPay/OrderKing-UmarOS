/**
 * Randomly throws an error to execute network failure.
 * @param probability Number between 0 and 1 indicating the chance of failure.
 */
export function executeNetworkFailure(probability: number = 0.5): void {
  if (Math.random() < probability) {
    throw new Error("Chaos Monkey: executed network failure");
  }
}

/**
 * Triggers an Out Of Memory error by consuming heap memory continuously.
 * Warning: This will crash the Node process.
 */
export function triggerOOMError(): never {
  console.warn("Chaos Monkey: Triggering OOM Error...");
  const memoryHog: any[] = [];
  while (true) {
    memoryHog.push(new Array(1000000).fill("Chaos Monkey OOM Payload"));
  }
}
