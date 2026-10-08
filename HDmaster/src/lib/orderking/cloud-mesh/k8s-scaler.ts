/**
 * UMAR OS — Kubernetes Auto-Scaler
 * Replaces executed "Math.random() CPU load" with real PostgreSQL
 * telemetry via pg_stat_activity and pg_stat_database.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { getSql } from '../../db';

const execAsync = promisify(exec);

export interface DatabaseLoad {
  activeConnections: number;
  maxConnections: number;
  utilizationPercent: number;
  longestQuerySec: number;
}

/**
 * Query real database telemetry from PostgreSQL system views.
 * Returns actual connection utilization and longest-running query duration.
 */
export async function getDatabaseLoad(): Promise<DatabaseLoad> {
  const sql = await getSql();

  // Get active connection count
  const activeResult = await sql`
    SELECT count(*) as active_count
    FROM pg_stat_activity
    WHERE state = 'active'
  `;

  // Get max connections setting
  const maxResult = await sql`
    SELECT setting::int as max_conn
    FROM pg_settings
    WHERE name = 'max_connections'
  `;

  // Get longest running query duration in seconds
  const longestResult = await sql`
    SELECT COALESCE(
      EXTRACT(EPOCH FROM (now() - min(query_start))),
      0
    ) as longest_sec
    FROM pg_stat_activity
    WHERE state = 'active'
      AND query NOT LIKE '%pg_stat_activity%'
  `;

  const active = Number((activeResult[0] as any).active_count) || 0;
  const max = Number((maxResult[0] as any).max_conn) || 100;
  const longestSec = Number((longestResult[0] as any).longest_sec) || 0;

  return {
    activeConnections: active,
    maxConnections: max,
    utilizationPercent: Math.round((active / max) * 100),
    longestQuerySec: Math.round(longestSec),
  };
}

/**
 * Scale a Kubernetes deployment to a specified replica count.
 */
export async function scaleDeployment(
  deployment: string,
  replicas: number,
  namespace: string = 'default',
): Promise<string> {
  // Validate inputs to prevent injection
  if (!/^[a-zA-Z0-9-]+$/.test(deployment)) {
    throw new Error(`Invalid deployment name: ${deployment}`);
  }
  if (!/^[a-zA-Z0-9-]+$/.test(namespace)) {
    throw new Error(`Invalid namespace: ${namespace}`);
  }
  if (!Number.isInteger(replicas) || replicas < 0 || replicas > 50) {
    throw new Error(`Invalid replica count: ${replicas} (must be 0-50)`);
  }

  const { stdout } = await execAsync(
    `kubectl scale deployment ${deployment} --replicas=${replicas} -n ${namespace}`,
  );
  return stdout.trim();
}

/**
 * Monitor real database load and auto-scale the deployment accordingly.
 * Uses actual PostgreSQL telemetry — no execution.
 */
export async function monitorAndScale(
  deployment: string,
  connectionThresholdPercent: number = 70,
  namespace: string = 'default',
): Promise<{ action: string; load: DatabaseLoad }> {
  const load = await getDatabaseLoad();

  if (load.utilizationPercent > connectionThresholdPercent) {
    // Scale up: 1 replica per 20% utilization above threshold
    const overshoot = load.utilizationPercent - connectionThresholdPercent;
    const additionalReplicas = Math.ceil(overshoot / 20);
    const newReplicas = Math.min(2 + additionalReplicas, 10); // cap at 10

    const result = await scaleDeployment(deployment, newReplicas, namespace);
    return {
      action: `SCALED UP to ${newReplicas} replicas: ${result}`,
      load,
    };
  }

  return {
    action: `No scaling needed. Utilization: ${load.utilizationPercent}%`,
    load,
  };
}
