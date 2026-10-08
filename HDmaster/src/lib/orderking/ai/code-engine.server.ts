import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// Initialize the Gemini client
// Assumes GEMINI_API_KEY is in environment variables
const ai = new GoogleGenAI({});

/**
 * Modifies or creates a project code file based on a natural language request.
 * Uses @google/genai to generate code or precise search/replace blocks.
 * 
 * @param request The natural language instruction from the user.
 * @param targetFile The path to the file to modify (relative to CWD or absolute).
 * @returns A status message about the operation.
 */
export async function modifyProjectCode(request: string, targetFile: string): Promise<string> {
    const absoluteTargetFile = path.resolve(process.cwd(), targetFile);
    let originalContent = '';
    const fileExists = fs.existsSync(absoluteTargetFile);
    
    if (fileExists) {
        originalContent = fs.readFileSync(absoluteTargetFile, 'utf8');
    }

    const systemPrompt = `You are an elite code generation engine ("Cursor" level).
The user wants to modify or create a file in a complex monorepo.
Target file: ${targetFile}

If the file does not exist, return the complete new file content enclosed in standard markdown typescript code blocks.

If the file exists, analyze the user's request, and provide a SEARCH and REPLACE block to surgically update the AST/functions. 
Use the exact following format to replace code without breaking the rest of the file:
<<<<SEARCH>>>>
[exact code to replace from the original file, including original whitespace and indentation]
<<<<REPLACE>>>>
[new code to replace it with]
<<<<END>>>>

You may include multiple SEARCH/REPLACE blocks if necessary.
Make sure the search block matches the existing code EXACTLY.`;

    const prompt = `Original File Content:\n\`\`\`typescript\n${originalContent}\n\`\`\`\n\nUser Request: ${request}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.1,
            }
        });

        const resultText = response.text || '';

        if (!fileExists) {
            // Extract full content from markdown block for new files
            const match = resultText.match(/```(?:typescript|tsx|ts|javascript|js)?\n([\s\S]*?)\n```/);
            const newContent = match ? match[1] : resultText;
            
            // Ensure directory exists
            fs.mkdirSync(path.dirname(absoluteTargetFile), { recursive: true });
            fs.writeFileSync(absoluteTargetFile, newContent, 'utf8');
            return `Created new file at ${absoluteTargetFile}`;
        } else {
            // Apply precise SEARCH/REPLACE blocks for existing files
            let updatedContent = originalContent;
            const blockRegex = /<<<<SEARCH>>>>\n([\s\S]*?)\n<<<<REPLACE>>>>\n([\s\S]*?)\n<<<<END>>>>/g;
            let match;
            let replacements = 0;
            
            while ((match = blockRegex.exec(resultText)) !== null) {
                const searchStr = match[1];
                const replaceStr = match[2];
                if (updatedContent.includes(searchStr)) {
                    updatedContent = updatedContent.replace(searchStr, replaceStr);
                    replacements++;
                } else {
                    console.warn(`Code Engine Warning: Could not find exact search string block in ${targetFile}`);
                }
            }
            
            // Fallback: if they just sent a block of code, replace the whole file if no search blocks were found
            if (replacements === 0 && !resultText.includes('<<<<SEARCH>>>>')) {
               const codeMatch = resultText.match(/```(?:typescript|tsx|ts|javascript|js)?\n([\s\S]*?)\n```/);
               if (codeMatch) {
                   updatedContent = codeMatch[1];
                   replacements++;
               }
            }

            if (replacements > 0) {
                fs.writeFileSync(absoluteTargetFile, updatedContent, 'utf8');
                return `Successfully modified ${targetFile} (${replacements} blocks replaced or file fully updated).`;
            } else {
                return `No changes applied to ${targetFile}. AI did not return matching search blocks.`;
            }
        }
    } catch (error) {
        console.error("Code Engine Error:", error);
        throw error;
    }
}
