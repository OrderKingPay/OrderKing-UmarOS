import { describe, it, expect, vi, beforeEach } from 'vitest';
import { freezeSystem, killAgent, revokeTokens } from './index';
import * as dbModule from '../../db';

vi.mock('../../db', () => {
    const queryMock = vi.fn();
    const sqlMock = vi.fn().mockImplementation(() => Promise.resolve([]));
    (sqlMock as any).query = queryMock;
    
    return {
        getSql: vi.fn().mockResolvedValue(sqlMock),
    };
});

describe('Emergency Control Plane', () => {
    let sqlMock: any;

    beforeEach(async () => {
        vi.clearAllMocks();
        sqlMock = await dbModule.getSql();
    });

    it('should freeze system', async () => {
        await freezeSystem('finance');
        
        // Assert we called sql at least twice:
        // 1. CREATE TABLE
        // 2. INSERT ... ON CONFLICT DO UPDATE
        expect(sqlMock).toHaveBeenCalledTimes(2);
        
        // Basic check for the query text
        const createQuery = sqlMock.mock.calls[0][0][0];
        expect(createQuery).toContain('CREATE TABLE IF NOT EXISTS system_locks');
        
        const insertQuery = sqlMock.mock.calls[1][0][0];
        expect(insertQuery).toContain('INSERT INTO system_locks');
    });

    it('should kill an agent by updating its tasks and work items', async () => {
        await killAgent('agent-123');

        // 1 for autonomous_tasks
        // 1 for ai_work_items
        expect(sqlMock).toHaveBeenCalledTimes(2);
        
        const taskQuery = sqlMock.mock.calls[0][0][0];
        expect(taskQuery).toContain('UPDATE autonomous_tasks');
        
        const workItemQuery = sqlMock.mock.calls[1][0][0];
        expect(workItemQuery).toContain('UPDATE ai_work_items');
    });

    it('should revoke all identity tokens', async () => {
        await revokeTokens();

        // revokeTokens uses sql.query
        expect(sqlMock.query).toHaveBeenCalledTimes(2);
        
        const deleteSessionQuery = sqlMock.query.mock.calls[0][0];
        expect(deleteSessionQuery).toContain('DELETE FROM "session"');

        const updateAccountQuery = sqlMock.query.mock.calls[1][0];
        expect(updateAccountQuery).toContain('UPDATE "account"');
    });
});
