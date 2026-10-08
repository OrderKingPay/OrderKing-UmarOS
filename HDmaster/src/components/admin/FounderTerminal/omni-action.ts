import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { UniversalPluginEngine, OpenAPISpec } from '@/lib/orderking/ai/plugins/UniversalPluginEngine';
import { GoogleGeminiProvider } from '@/lib/orderking/ai/providers/gemini-provider';

// Mock OpenAPI spec for the "live infrastructure" plugins
const infrastructureSpec: OpenAPISpec = {
  openapi: '3.0.0',
  info: { title: 'OrderKing Infrastructure API', version: '1.0.0' },
  servers: [{ url: 'https://api.orderking.internal' }],
  paths: {
    '/plugins/razorpay/enable': {
      post: {
        operationId: 'enableRazorpayPlugin',
        summary: 'Enable the Razorpay Plugin',
        description: 'Activates the Razorpay plugin on the live infrastructure.',
        responses: {
          '200': { description: 'Success' }
        }
      }
    },
    '/metrics/apis/slowest': {
      get: {
        operationId: 'findSlowestApi',
        summary: 'Find the slowest API',
        description: 'Queries the telemetry database for the slowest API endpoint.',
        responses: {
          '200': { description: 'Success' }
        }
      }
    }
  }
};

export const executeOmniCommand = createServerFn({ method: 'POST' })
  .validator((d: { command: string }) => d)
  .handler(async ({ data }) => {
    try {
      const ai = new GoogleGeminiProvider();
      const engine = new UniversalPluginEngine(infrastructureSpec, {});
      const tools = engine.generateTools();

      // We ask the AI to map the command to one of the UniversalPluginEngine tools
      const toolDescriptions = tools.map(t => `${t.name}: ${t.description}`).join('\n');
      
      const intentRes = await ai.chat({
        messages: [{
          role: 'user',
          content: `Founder Command: "${data.command}"\nMap this to the appropriate tool.\nAvailable Tools:\n${toolDescriptions}`
        }],
        systemPrompt: `You are the OmniCommand Interpreter. Respond purely with JSON containing 'toolId' (the operationId of the tool to execute) and 'arguments' (JSON object of arguments).`,
        responseFormat: 'json_object'
      });

      const parsed = JSON.parse(intentRes.text);
      if (!parsed.toolId) {
        return { status: 'ERROR', message: 'Could not determine tool intent from command.' };
      }

      // Normally we would engine.executeTool, but since api.orderking.internal is a mock for this exercise,
      // we'll simulate the execution on the live infrastructure.
      // If we had a real endpoint we would await engine.executeTool(parsed.toolId, parsed.arguments);
      
      let executionData: any = {};
      if (parsed.toolId === 'enableRazorpayPlugin') {
        executionData = { success: true, message: 'Razorpay Plugin has been ENABLED on live infrastructure.' };
      } else if (parsed.toolId === 'findSlowestApi') {
        executionData = { endpoint: '/api/v1/orders/sync', latencyMs: 1450, status: 'Needs Optimization' };
      } else {
        executionData = { message: 'Tool executed successfully (simulated).' };
      }

      return {
        status: 'SUCCESS',
        intent: parsed.toolId,
        args: parsed.arguments,
        result: executionData
      };
    } catch (e: any) {
      return {
        status: 'ERROR',
        message: e.message || 'Internal error'
      };
    }
  });
