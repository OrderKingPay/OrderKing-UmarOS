import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Assuming API keys are in process.env
const geminiApiKey = process.env.GEMINI_API_KEY;
const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
const openaiApiKey = process.env.OPENAI_API_KEY;

// Initialize clients if keys are present
const geminiClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;
const anthropicClient = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null;
const openaiClient = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

export interface SupremeAnswerResult {
  synthesizedAnswer: string;
  analytics: {
    totalLatencyMs: number;
    modelsUsed: string[];
    estimatedCost: string; 
  };
}

export async function getSupremeAnswer(prompt: string): Promise<SupremeAnswerResult> {
  const startTime = Date.now();
  const modelsUsed: string[] = [];

  // Fallback check: Gemini is required for synthesis
  if (!geminiClient) {
    throw new Error("Gemini API key is required for the Supreme Consensus Engine.");
  }

  const promises: Promise<{ source: string, answer: string | null }>[] = [];

  // 1. Google Gemini
  promises.push(
    geminiClient.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    }).then(response => {
      modelsUsed.push('Gemini');
      return { source: 'Gemini', answer: response.text ?? null };
    }).catch(error => {
      console.error('Gemini error:', error);
      return { source: 'Gemini', answer: null };
    })
  );

  // 2. Anthropic Claude
  if (anthropicClient) {
    promises.push(
      anthropicClient.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      }).then(response => {
        modelsUsed.push('Claude');
        const text = response.content.map(c => c.type === 'text' ? c.text : '').join('');
        return { source: 'Claude', answer: text || null };
      }).catch(error => {
        console.error('Claude error:', error);
        return { source: 'Claude', answer: null };
      })
    );
  }

  // 3. OpenAI
  if (openaiClient) {
    promises.push(
      openaiClient.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }]
      }).then(response => {
        modelsUsed.push('OpenAI');
        return { source: 'OpenAI', answer: response.choices[0]?.message?.content ?? null };
      }).catch(error => {
        console.error('OpenAI error:', error);
        return { source: 'OpenAI', answer: null };
      })
    );
  }

  // Execute all available models simultaneously
  const results = await Promise.all(promises);

  // Filter out failed responses
  const successfulAnswers = results.filter(r => r.answer !== null);
  
  if (successfulAnswers.length === 0) {
    throw new Error("All models failed to generate a response.");
  }

  // Format the answers for the synthesis prompt
  let synthesisPrompt = `You are the Supreme AI. Evaluate these 3 expert responses and synthesize the ultimate, flawless master answer.\n\nOriginal Prompt: ${prompt}\n\n`;
  successfulAnswers.forEach((result, index) => {
    synthesisPrompt += `--- Expert ${index + 1} (${result.source}) ---\n${result.answer}\n\n`;
  });

  // Feed the answers back into Gemini for synthesis
  const synthesisResponse = await geminiClient.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: synthesisPrompt,
  });

  const endTime = Date.now();
  const totalLatencyMs = endTime - startTime;

  return {
    synthesizedAnswer: synthesisResponse.text ?? "Failed to synthesize answer.",
    analytics: {
      totalLatencyMs,
      modelsUsed,
      estimatedCost: 'To be calculated based on token usage',
    }
  };
}
