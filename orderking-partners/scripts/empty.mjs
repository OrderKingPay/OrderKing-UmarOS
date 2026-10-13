// Better Auth telemetry is intentionally disabled. Preserve the expected API shape.
// No authentication, session, payment, or business operation is simulated here.
export async function createTelemetry() {
  return { publish: async () => {} };
}
export const getTelemetryAuthConfig = () => ({});
export default {};
