export type ActionType = 'click' | 'type' | 'scroll';

export interface ClickAction {
  type: 'click';
  selector: string;
}

export interface TypeAction {
  type: 'type';
  selector: string;
  text: string;
}

export interface ScrollAction {
  type: 'scroll';
  x: number;
  y: number;
}

export type Action = ClickAction | TypeAction | ScrollAction;

export const ActionSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['type'],
  properties: {
    type: { type: 'string', enum: ['click', 'type', 'scroll'] },
    selector: { type: 'string' },
    text: { type: 'string' },
    x: { type: 'number' },
    y: { type: 'number' }
  },
  allOf: [
    {
      if: { properties: { type: { const: 'click' } } },
      then: { required: ['selector'] }
    },
    {
      if: { properties: { type: { const: 'type' } } },
      then: { required: ['selector', 'text'] }
    },
    {
      if: { properties: { type: { const: 'scroll' } } },
      then: { required: ['x', 'y'] }
    }
  ]
};

export class ActionSimulator {
  simulate(action: Action): void {
    console.log(`Simulating action: ${action.type}`);
    // Implementation to forward to MCP client
  }
}
