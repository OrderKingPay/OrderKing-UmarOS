import assert from 'node:assert/strict';
import { describe, it, before } from 'node:test';
import type { AgentCard } from './registry.ts';
import { ExternalAgentRegistry } from './registry.ts';

describe('ExternalAgentRegistry', () => {
    let registry: ExternalAgentRegistry;

    before(async () => {
        registry = new ExternalAgentRegistry();
        await registry.init();
    });

    it('should register a new agent', async () => {
        const card: AgentCard = {
            id: 'agent-123',
            name: 'Test Partner Agent',
            identity: {
                provider: 'PartnerX',
                publicKey: 'pub_key_xyz'
            },
            capabilities: ['READ_ORDERS', 'WRITE_INVENTORY'],
            securityScheme: 'OAuth2',
            revoked: false
        };

        const result = await registry.registerAgent(card);
        assert.equal(result.id, 'agent-123');
        assert.equal(result.name, 'Test Partner Agent');
        assert.deepEqual(result.capabilities, ['READ_ORDERS', 'WRITE_INVENTORY']);
        assert.equal(result.revoked, false);
    });

    it('should get an agent by ID', async () => {
        const result = await registry.getAgent('agent-123');
        assert.ok(result);
        assert.equal(result?.name, 'Test Partner Agent');
        assert.equal(result?.identity.provider, 'PartnerX');
    });

    it('should revoke an agent', async () => {
        const success = await registry.revokeAgent('agent-123');
        assert.equal(success, true);

        const result = await registry.getAgent('agent-123');
        assert.ok(result);
        assert.equal(result?.revoked, true);
    });

    it('should list only non-revoked agents by default', async () => {
        await registry.registerAgent({
            id: 'agent-456',
            name: 'Active Agent',
            identity: { provider: 'PartnerY', publicKey: 'pub_key_abc' },
            capabilities: ['READ_ORDERS'],
            securityScheme: 'JWT',
            revoked: false
        });

        const activeAgents = await registry.listAgents(false);
        assert.equal(activeAgents.some(a => a.id === 'agent-456'), true);
        assert.equal(activeAgents.some(a => a.id === 'agent-123'), false); // revoked

        const allAgents = await registry.listAgents(true);
        assert.equal(allAgents.some(a => a.id === 'agent-456'), true);
        assert.equal(allAgents.some(a => a.id === 'agent-123'), true);
    });
});
