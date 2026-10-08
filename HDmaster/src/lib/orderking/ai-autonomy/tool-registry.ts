// Standard Gemini JSON schema definitions compatible with @google/genai

export const tools = [
    {
        name: 'refundCustomer',
        description: 'Refund a customer a specific amount.',
        parameters: {
            type: 'OBJECT',
            properties: {
                userId: { type: 'STRING', description: 'The ID of the user to refund.' },
                amount: { type: 'NUMBER', description: 'The amount to refund in dollars.' },
                reason: { type: 'STRING', description: 'The reason for the refund.' },
                humanApprovalToken: { type: 'STRING', description: 'Optional token if human approval was obtained for amounts > $100.' }
            },
            required: ['userId', 'amount']
        }
    },
    {
        name: 'banUser',
        description: 'Ban a user from the platform securely.',
        parameters: {
            type: 'OBJECT',
            properties: {
                userId: { type: 'STRING', description: 'The ID of the user to ban.' },
                reason: { type: 'STRING', description: 'The reason for banning the user.' }
            },
            required: ['userId', 'reason']
        }
    },
    {
        name: 'adjustPricing',
        description: 'Adjust the pricing of a specific item.',
        parameters: {
            type: 'OBJECT',
            properties: {
                itemId: { type: 'STRING', description: 'The ID of the item.' },
                newPrice: { type: 'NUMBER', description: 'The new price of the item.' }
            },
            required: ['itemId', 'newPrice']
        }
    }
];

// Implementations for the actual execution
export const toolImplementations: Record<string, (args: any) => Promise<any>> = {
    refundCustomer: async (args) => {
        // Actual execution logic goes here
        return { status: 'success', message: `Refunded $${args.amount} to user ${args.userId}.` };
    },
    banUser: async (args) => {
        // Actual execution logic goes here
        return { status: 'success', message: `Banned user ${args.userId} for reason: ${args.reason}.` };
    },
    adjustPricing: async (args) => {
        // Actual execution logic goes here
        return { status: 'success', message: `Adjusted price of item ${args.itemId} to $${args.newPrice}.` };
    }
};
