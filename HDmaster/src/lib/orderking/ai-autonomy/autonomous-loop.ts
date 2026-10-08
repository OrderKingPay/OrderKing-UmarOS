import { tools, toolImplementations } from './tool-registry';
import { enforcePolicy } from './policy-guard';

/**
 * Starts the autonomous agent loop using Gemini 2.5 tools.
 * 
 * @param goal The overarching goal for the AI to achieve.
 * @param aiClient A pre-configured @google/genai client instance.
 */
export async function startAutonomousAgent(goal: string, aiClient: any): Promise<void> {
    console.log(`[AUTONOMY] Starting autonomous agent with goal: "${goal}"`);
    
    let isGoalAchieved = false;
    // We maintain the history by continuously updating the prompt or using a chat session.
    // For simplicity in this functional example, we'll append to the prompt chain.
    let currentPrompt = `System Goal: ${goal}\nPlease execute necessary actions using your tools to achieve this goal.`;
    
    let iteration = 0;
    const MAX_ITERATIONS = 10;

    while (!isGoalAchieved && iteration < MAX_ITERATIONS) {
        iteration++;
        console.log(`\n[AUTONOMY] --- Iteration ${iteration} ---`);
        
        try {
            // Send request to Gemini 2.5
            const response = await aiClient.models.generateContent({
                model: 'gemini-2.5-pro', // or 'gemini-2.5-flash'
                contents: currentPrompt,
                config: {
                    tools: [{ functionDeclarations: tools }]
                }
            });

            // Extract function calls from the response
            const functionCalls = response.functionCalls || [];

            if (functionCalls.length > 0) {
                // Handle the first function call (can be extended to run parallel calls)
                const call = functionCalls[0];
                const { name, args } = call;
                
                console.log(`[AUTONOMY] Model requested tool call: ${name} with args`, args);

                // 1. Verify against policy guard
                if (enforcePolicy(name, args)) {
                    // 2. Execute underlying function safely
                    const impl = toolImplementations[name];
                    if (impl) {
                        const result = await impl(args);
                        console.log(`[AUTONOMY] Tool execution result:`, result);
                        
                        // Append tool execution result back to the AI for its next turn
                        currentPrompt += `\n\nUser: Tool ${name} executed successfully. Result: ${JSON.stringify(result)}. What is the next step to achieve the goal?`;
                    } else {
                        console.log(`[AUTONOMY] Tool ${name} is registered but has no implementation.`);
                        currentPrompt += `\n\nUser: Tool ${name} is not implemented. Please try another approach or end the loop.`;
                    }
                } else {
                    console.log(`[AUTONOMY] Execution blocked by policy guard for tool ${name}.`);
                    currentPrompt += `\n\nUser: Tool execution for ${name} was blocked by security policies (e.g., amount limits exceeded without human approval). Adjust your parameters, request human approval, or proceed differently.`;
                }
            } else {
                console.log("[AUTONOMY] Model text response:", response.text);
                // If no tool is called, assume the AI considers the task complete or requires user interaction
                console.log("[AUTONOMY] No further tools requested. Goal achieved or blocked.");
                isGoalAchieved = true; 
            }

        } catch (error) {
            console.error("[AUTONOMY] Error in autonomous loop:", error);
            break;
        }
    }
    
    console.log("[AUTONOMY] Autonomous agent loop terminated.");
}
