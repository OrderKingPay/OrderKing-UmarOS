import { describe, it, expect, vi, beforeEach } from 'vitest';
import { freezeSystem, killAgent, revokeTokens } from './index';
import * as dbModule from '../../db';

vi.mock('../../db', () => {
    const querySimulated = vi.fn();
    const sqlSimulated = vi.fn().mockImplementation(() => Promise.resolve([]));
    (sqlSimulated as any).query = querySimulated;
    
    return {
        getSql: vi.fn().mockResolvedValue(sqlSimulated),
    };
});

describe('Emergency Control Plane', () => {
    let sqlSimulated: any;

    beforeEach(async () => {
        vi.clearAllSimulateds();
        sqlSimulated = await dbModule.getSql();
    });

    it('should freeze system', async () => {
        await freezeSystem('finance');
        
        // Assert we called sql at least twice:
        // 1. CREATE TABLE
        // 2. INSERT ... ON CONFLICT DO UPDATE
        expect(sqlSimulated).toHaveBeenCalledTimes(2);
        
        // Basic check for the query text
        const createQuery = sqlSimulated.mock.calls[0][0][0];
        expect(createQuery).toContain('CREATE TABLE IF NOT EXISTS system_locks');
        
        const insertQuery = sqlSimulated.mock.calls[1][0][0];
        expect(insertQuery).toContain('INSERT INTO system_locks');
    });

    it('should kill an agent by updating its tasks and work items', async () => {
        await killAgent('agent-123');

        // 1 for autonomous_tasks
        // 1 for ai_work_items
        expect(sqlSimulated).toHaveBeenCalledTimes(2);
        
        const taskQuery = sqlSimulated.mock.calls[0][0][0];
        expect(taskQuery).toContain('UPDATE autonomous_tasks');
        
        const workItemQuery = sqlSimulated.mock.calls[1][0][0];
        expect(workItemQuery).toContain('UPDATE ai_work_items');
    });

    it('should revoke all identity tokens', async () => {
        await revokeTokens();

        // revokeTokens uses sql.query
        expect(sqlSimulated.query).toHaveBeenCalledTimes(2);
        
        const deleteSessionQuery = sqlSimulated.query.mock.calls[0][0];
        expect(deleteSessionQuery).toContain('DELETE FROM "session"');

        const updateAccountQuery = sqlSimulated.query.mock.calls[1][0];
        expect(updateAccountQuery).toContain('UPDATE "account"');
    });
});
