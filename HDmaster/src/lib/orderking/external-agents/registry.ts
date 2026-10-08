export interface AgentIdentity {
    provider: string;
    publicKey: string;
}

export interface AgentCard {
    id: string;
    name: string;
    identity: AgentIdentity;
    capabilities: string[];
    securityScheme: string; // 'OAuth2' | 'JWT' | 'API_KEY'
    revoked: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export class ExternalAgentRegistry {
    private agents: Map<string, AgentCard> = new Map();

    async init() {
        // In-memory initialization
        return Promise.resolve();
    }

    async registerAgent(card: AgentCard): Promise<AgentCard> {
        const newCard = { 
            ...card, 
            createdAt: new Date(), 
            updatedAt: new Date() 
        };
        this.agents.set(card.id, newCard);
        return newCard;
    }

    async getAgent(id: string): Promise<AgentCard | null> {
        return this.agents.get(id) || null;
    }

    async revokeAgent(id: string): Promise<boolean> {
        const agent = this.agents.get(id);
        if (agent) {
            agent.revoked = true;
            agent.updatedAt = new Date();
            this.agents.set(id, agent);
            return true;
        }
        return false;
    }

    async listAgents(includeRevoked = false): Promise<AgentCard[]> {
        const allAgents = Array.from(this.agents.values());
        if (includeRevoked) {
            return allAgents;
        }
        return allAgents.filter(a => !a.revoked);
    }
}
