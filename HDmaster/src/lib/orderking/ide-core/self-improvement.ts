import * as fs from 'node:fs';
import { requireFounderApproval } from '../auth/founder-policy';

export async function proposeAndExecuteRefactor(filePath: string, code: string): Promise<void> {
    const approved = await requireFounderApproval('self_refactor', 0);
    if (!approved) {
        throw new Error('Founder approval required for self_refactor');
    }
    fs.writeFileSync(filePath, code, 'utf8');
}
