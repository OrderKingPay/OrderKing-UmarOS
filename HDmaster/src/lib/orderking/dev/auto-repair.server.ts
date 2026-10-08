import { exec } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function autoRepairBuild() {
    return new Promise((resolve, reject) => {
        exec('npx tsc', async (error, stdout, stderr) => {
            if (error) {
                console.log('Build failed. Initiating auto-repair...');
                const output = stdout + '\n' + stderr;
                
                // Extract file path from tsc error output
                const match = output.match(/([a-zA-Z0-9_\-\.\/\\]+\.ts)\(\d+,\d+\): error/);
                
                if (match && match[1]) {
                    const filePath = match[1];
                    try {
                        const sourceCode = readFileSync(filePath, 'utf-8');
                        
                        const prompt = `Fix the following TypeScript error in this file:
                        
File: ${filePath}

Source:
\`\`\`typescript
${sourceCode}
\`\`\`

Error:
${output}

Return ONLY the complete, fixed source code in a \`\`\`typescript code block, nothing else.`;

                        const response = await ai.models.generateContent({
                            model: 'gemini-2.5-pro',
                            contents: prompt,
                        });
                        
                        let fixedCode = response.text || '';
                        
                        // Extract from markdown block if present
                        const codeMatch = fixedCode.match(/```typescript\n([\s\S]*?)```/);
                        if (codeMatch && codeMatch[1]) {
                            fixedCode = codeMatch[1];
                        }
                        
                        writeFileSync(filePath, fixedCode, 'utf-8');
                        console.log(`Successfully repaired ${filePath}. Re-running build to verify...`);
                        
                        // Re-run the build to verify fix and catch further errors
                        await autoRepairBuild();
                        resolve(true);
                    } catch (e) {
                        console.error('Auto-repair process failed:', e);
                        reject(e);
                    }
                } else {
                    console.log('Could not identify file to repair from output. Error output was:', output);
                    reject(new Error("Could not parse file path from error output"));
                }
            } else {
                console.log('Build succeeded. No repairs needed.');
                resolve(true);
            }
        });
    });
}
