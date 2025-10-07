/**
 * OpenAI Codex SDK Wrapper
 * Modern TypeScript implementation using official OpenAI SDK
 */

import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Schemas
export const MCQChoiceSchema = z.object({ id: z.string(), text: z.string() });
export const MCQSchema = z.object({
  id: z.string(), stem: z.string(), choices: z.array(MCQChoiceSchema),
  correctChoice: z.string(), rationale: z.string(), learningObjective: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(), bloomLevel: z.string().optional(),
});
export const ValidationResultSchema = z.object({
  valid: z.boolean(), issues: z.array(z.string()), suggestions: z.array(z.string()),
  medicalAccuracy: z.number().min(0).max(1),
});

export type MCQ = z.infer<typeof MCQSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); }
    catch (error: any) {
      if (i === maxRetries - 1 || (error.status >= 400 && error.status < 500)) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries');
}

function extractJSON(text: string): any {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '');
  const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (!match) throw new Error('No JSON found');
  return JSON.parse(match[0]);
}

export async function generateMCQs(learningObjectives: string[], options: any = {}): Promise<MCQ[]> {
  const { difficulty = 'medium', count = 5 } = options;
  const prompt = `Generate ${count} MCQs for: ${learningObjectives.join(', ')}. Difficulty: ${difficulty}. Output JSON array only.`;
  
  return withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', messages: [{ role: 'user', content: prompt }],
      temperature: 0.7, max_tokens: 4000,
    });
    return z.array(MCQSchema).parse(extractJSON(response.choices[0]?.message?.content || ''));
  });
}

export async function validateMCQ(mcq: MCQ): Promise<ValidationResult> {
  const prompt = `Validate this MCQ: ${JSON.stringify(mcq)}. Output JSON only.`;
  return withRetry(async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', messages: [{ role: 'user', content: prompt }],
      temperature: 0.3, max_tokens: 2000,
    });
    return ValidationResultSchema.parse(extractJSON(response.choices[0]?.message?.content || ''));
  });
}
