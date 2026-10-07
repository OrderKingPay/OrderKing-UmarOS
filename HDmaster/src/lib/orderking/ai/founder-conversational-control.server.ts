import { GoogleGeminiProvider } from './providers/gemini-provider';
import { globalToolFabric, ToolContext } from './universal-tool-fabric';

const ai = new GoogleGeminiProvider();

export class FounderConversationalControl {
  
  async interpretAndExecute(command: string, context: ToolContext): Promise<any> {
    if (!ai.isConfigured) {
      return {
        status: 'REQUIRES_CREDENTIAL',
        message: 'Google Gemini API key is not configured. The founder control layer requires a valid intelligence provider.'
      };
    }

    const intentRes = await ai.chat({
      messages: [{
        role: 'user',
        content: `Founder Command: "${command}"\nDetermine the exact internal platform tool and arguments required to satisfy this command.`
      }],
      systemPrompt: `You are the UMAR OS Founder Conversational Control Layer.
You translate natural language queries from the CEO into strict internal tool executions.
Available Tools:
1. 'get_platform_state' - Summarizes total users, active orders, health.
2. 'find_operational_exceptions' - Locates unresolved issues like delayed orders or failed transactions.
3. 'diagnose_cancellations' - Analyzes recent cancelled orders.
4. 'get_financial_reconciliation' - Summarizes T+1 settlements and balances.
5. 'prepare_eligible_refunds' - Identifies and stages refunds for cancelled unrefunded orders.
Respond purely with JSON containing 'toolId' and 'arguments'.`,
      responseFormat: 'json_object'
    });

    try {
      const parsed = JSON.parse(intentRes.text);
      if (!parsed.toolId) {
        return { status: 'ERROR', message: 'Could not determine tool intent.' };
      }

      const result = await globalToolFabric.runTool(parsed.toolId, parsed.arguments, context);
      
      return {
        status: 'SUCCESS',
        toolExecuted: parsed.toolId,
        data: result
      };
    } catch (e: any) {
      return {
        status: 'EXECUTION_FAILED',
        message: e.message
      };
    }
  }
}

export const conversationalControl = new FounderConversationalControl();
