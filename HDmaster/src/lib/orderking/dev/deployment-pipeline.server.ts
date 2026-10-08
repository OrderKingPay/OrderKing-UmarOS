import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Simulated database using a local file to persist the hash across process restarts.
// In a production environment, this would integrate with your primary database (e.g., PostgreSQL, MongoDB).
const DB_FILE_PATH = path.join(process.cwd(), '.safe_deployment_state.json');

/**
 * Retrieves the last known good commit hash from the database.
 */
async function getSafeHashFromDB(): Promise<string | null> {
    try {
        const data = await fs.readFile(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(data);
        return parsed.safeCommitHash || null;
    } catch (error) {
        return null; 
    }
}

/**
 * Saves a safe commit hash to the database.
 */
async function saveSafeHashToDB(commitHash: string): Promise<void> {
    await fs.writeFile(DB_FILE_PATH, JSON.stringify({ safeCommitHash: commitHash }, null, 2), 'utf-8');
}

/**
 * Creates a snapshot of the current deployment state by saving the commit hash.
 * 
 * @param commitHash The git commit hash to mark as the last known good state.
 */
export async function createDeploymentSnapshot(commitHash: string): Promise<void> {
    await saveSafeHashToDB(commitHash);
    console.log(`[Deployment Pipeline] Snapshot saved. Safe commit: ${commitHash}`);
}

/**
 * Rolls back the repository to the last known good state tracked in the database.
 * WARNING: This uses destructive git operations (`reset --hard` and `clean -fd`).
 */
export async function rollbackToSafeState(): Promise<void> {
    const safeCommitHash = await getSafeHashFromDB();

    if (!safeCommitHash) {
        throw new Error("No safe commit hash found in the database to rollback to.");
    }

    console.log(`[Deployment Pipeline] Initiating rollback to ${safeCommitHash}...`);

    try {
        // Execute real git commands using child_process wrapped in Promises
        console.log(`[Deployment Pipeline] Running: git reset --hard ${safeCommitHash}`);
        const { stdout: resetOut } = await execAsync(`git reset --hard ${safeCommitHash}`);
        console.log(`[Git Reset Output]\n${resetOut.trim()}`);

        console.log(`[Deployment Pipeline] Running: git clean -fd`);
        const { stdout: cleanOut } = await execAsync(`git clean -fd`);
        console.log(`[Git Clean Output]\n${cleanOut.trim()}`);

        console.log("[Deployment Pipeline] Rollback completed successfully. System is now at the last known good state.");
    } catch (error) {
        console.error("[Deployment Pipeline] FATAL: Rollback failed. Manual intervention required.", error);
        throw error;
    }
}
