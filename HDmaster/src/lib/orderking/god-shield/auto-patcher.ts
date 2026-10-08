import * as fs from 'fs';
import * as path from 'path';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function autoPatch(errorLogPath: string, targetFilePath: string) {
    try {
        const errorLog = fs.readFileSync(errorLogPath, 'utf-8');
        const sourceCode = fs.readFileSync(targetFilePath, 'utf-8');

        const prompt = `
You are an auto-patcher.
Fix the following code based on the error log.
Output ONLY the corrected raw source code, without markdown blocks.

Error Log:
${errorLog}

Source Code:
${sourceCode}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const patchedCode = response.text?.trim();

        if (patchedCode) {
            fs.writeFileSync(targetFilePath, patchedCode, 'utf-8');
            console.log(`Successfully patched ${targetFilePath}`);
        } else {
            console.error('Failed to generate patch.');
        }
    } catch (error) {
        console.error('Error during auto-patch process:', error);
    }
}
