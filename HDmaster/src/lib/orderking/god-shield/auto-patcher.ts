/**
 * UMAR OS — Safe Auto-Patcher with Approval Gate
 * 
 * SECURITY MODEL:
 * 1. Read error log + source file
 * 2. Ask GenAI for a fix
 * 3. Create a BACKUP of the original file
 * 4. Write the proposed patch to a .patch file (NOT to the source directly)
 * 5. Generate a human-readable diff summary
 * 6. Return the proposal — DOES NOT apply it automatically
 * 7. Separate applyPatch() function requires explicit founder approval
 * 8. Rollback restores from backup at any time
 */
import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface PatchProposal {
  originalPath: string;
  backupPath: string;
  patchPath: string;
  originalCode: string;
  patchedCode: string;
  diffSummary: string;
  timestamp: string;
  approved: boolean;
}

/**
 * Generate a patch PROPOSAL. Does NOT modify the original file.
 * Creates a backup and writes the proposed fix to a .patch file.
 */
export async function proposePatch(
  errorLogPath: string,
  targetFilePath: string,
): Promise<PatchProposal> {
  if (!fs.existsSync(errorLogPath)) {
    throw new Error(`Error log not found: ${errorLogPath}`);
  }
  if (!fs.existsSync(targetFilePath)) {
    throw new Error(`Target file not found: ${targetFilePath}`);
  }

  const errorLog = fs.readFileSync(errorLogPath, 'utf-8');
  const sourceCode = fs.readFileSync(targetFilePath, 'utf-8');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  // Step 1: Create backup BEFORE anything else
  const backupDir = path.join(path.dirname(targetFilePath), '.umar-os-backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupPath = path.join(
    backupDir,
    `${path.basename(targetFilePath)}.${timestamp}.bak`,
  );
  fs.copyFileSync(targetFilePath, backupPath);

  // Step 2: Ask GenAI for a fix
  const prompt = `You are a code repair assistant.
Fix the following code based on the error log.
Output ONLY the corrected raw source code, without markdown blocks or explanations.

Error Log:
${errorLog.slice(0, 4000)}

Source Code:
${sourceCode}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const patchedCode = response.text?.trim();
  if (!patchedCode) {
    throw new Error('GenAI returned empty patch');
  }

  // Step 3: Write proposed patch to separate file (NOT the original)
  const patchPath = path.join(
    backupDir,
    `${path.basename(targetFilePath)}.${timestamp}.proposed`,
  );
  fs.writeFileSync(patchPath, patchedCode, 'utf-8');

  // Step 4: Generate diff summary
  const originalLines = sourceCode.split('\n');
  const patchedLines = patchedCode.split('\n');
  const diffSummary = [
    `Original: ${originalLines.length} lines`,
    `Proposed: ${patchedLines.length} lines`,
    `Backup saved: ${backupPath}`,
    `Patch file: ${patchPath}`,
    `Status: AWAITING FOUNDER APPROVAL`,
  ].join('\n');

  return {
    originalPath: targetFilePath,
    backupPath,
    patchPath,
    originalCode: sourceCode,
    patchedCode,
    diffSummary,
    timestamp,
    approved: false,
  };
}

/**
 * Apply a previously proposed patch ONLY after explicit approval.
 * This is the only function that modifies the original source file.
 */
export async function applyPatch(proposal: PatchProposal): Promise<string> {
  if (!proposal.approved) {
    throw new Error(
      'SECURITY: Patch has not been approved. Set proposal.approved = true after founder review.',
    );
  }

  // Verify backup exists before overwriting
  if (!fs.existsSync(proposal.backupPath)) {
    throw new Error(`Backup not found at ${proposal.backupPath}. Aborting.`);
  }

  // Apply the patch
  fs.writeFileSync(proposal.originalPath, proposal.patchedCode, 'utf-8');
  return `Patch applied to ${proposal.originalPath}. Backup at ${proposal.backupPath}`;
}

/**
 * Rollback: restore original file from backup.
 */
export async function rollbackPatch(proposal: PatchProposal): Promise<string> {
  if (!fs.existsSync(proposal.backupPath)) {
    throw new Error(`Backup not found at ${proposal.backupPath}. Cannot rollback.`);
  }

  fs.copyFileSync(proposal.backupPath, proposal.originalPath);
  return `Rolled back ${proposal.originalPath} from backup ${proposal.backupPath}`;
}
