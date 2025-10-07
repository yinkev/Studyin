/**
 * Codex-CLI Wrapper
 * Provides typed interfaces for OpenAI Codex via CLI
 * Features: MCQ generation, validation, evidence matching, distractor creation
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Response types
export interface MCQChoice {
  id: string; // A, B, C, D, E
  text: string;
}

export interface MCQ {
  id: string;
  stem: string;
  choices: MCQChoice[];
  correctChoice: string;
  rationale: string;
  learningObjective: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  bloomLevel?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: string[];
  suggestions: string[];
  medicalAccuracy: number; // 0.0 to 1.0
}

export interface DistractorSuggestions {
  item_id: string;
  distractors: Array<{
    text: string;
    reasoning: string;
    plausibility: number;
  }>;
}

/**
 * Generate MCQs for specific learning objectives
 * @param learningObjectives Array of LO strings
 * @param options Generation options
 * @returns Array of MCQ objects
 */
export async function execCodexGenerateMCQs(
  learningObjectives: string[],
  options: {
    difficulty?: 'easy' | 'medium' | 'hard' | 'adaptive';
    count?: number;
    includeEvidence?: boolean;
    bloomLevel?: 'remember' | 'understand' | 'apply' | 'analyze';
  } = {}
): Promise<MCQ[]> {
  const { difficulty = 'medium', count = 5, includeEvidence = true, bloomLevel = 'understand' } = options;

  const prompt = `You are a medical education expert specializing in assessment design. Generate ${count} high-quality multiple-choice questions.

Learning Objectives:
${learningObjectives.map((lo, i) => `${i + 1}. ${lo}`).join('\n')}

Requirements:
- Difficulty level: ${difficulty}
- Bloom's taxonomy level: ${bloomLevel}
- Each question must have 4-5 answer choices (A, B, C, D, E)
- Mark the correct answer
- ${includeEvidence ? 'Include evidence-based rationale citing medical references' : 'Include brief rationale'}
- Ensure distractors are plausible (based on common student errors)
- Avoid "all of the above" or "none of the above"
- Use clear, concise language (medical students, year 1-2 level)

Output ONLY valid JSON array with NO markdown code fences or extra text:
[
  {
    "id": "mcq_001",
    "stem": "Which structure forms the medial boundary of the cubital fossa?",
    "choices": [
      {"id": "A", "text": "Pronator teres"},
      {"id": "B", "text": "Brachioradialis"},
      {"id": "C", "text": "Biceps brachii"},
      {"id": "D", "text": "Flexor carpi radialis"}
    ],
    "correctChoice": "A",
    "rationale": "The pronator teres forms the medial boundary of the cubital fossa. The brachioradialis forms the lateral boundary.",
    "learningObjective": "${learningObjectives[0] || 'Primary LO'}",
    "difficulty": "medium",
    "bloomLevel": "remember"
  }
]`;

  // Use stdin for long prompts to avoid shell escaping issues
  const tempFile = `/tmp/codex-prompt-${Date.now()}.txt`;
  await fs.writeFile(tempFile, prompt);

  try {
    const { stdout } = await execAsync(`cat "${tempFile}" | codex exec`, { maxBuffer: 1024 * 1024 * 10 }); // 10MB buffer

    // Clean output: remove markdown code fences if present
    let cleaned = stdout.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');

    // Extract JSON from output (Codex sometimes includes thinking/metadata)
    // Use greedy match to get the complete JSON array (not non-greedy)
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('[codex] Raw output:', stdout.substring(0, 500));
      throw new Error('No valid JSON array found in Codex output');
    }

    const jsonString = jsonMatch[0].trim();

    // Try to parse, log on failure
    let mcqs;
    try {
      mcqs = JSON.parse(jsonString);
    } catch (parseError) {
      // Attempt to repair incomplete JSON by closing unclosed structures
      console.warn('[codex] JSON parse failed, attempting repair...');
      let repairedJson = jsonString;

      // Remove incomplete trailing field name (e.g., "learningObjective without closing quote/colon/value)
      // Find the last complete field ending with ", or "}
      const lastComma = repairedJson.lastIndexOf('",');
      const lastCloseBrace = repairedJson.lastIndexOf('"}');
      const cutoffPoint = Math.max(lastComma, lastCloseBrace);

      if (cutoffPoint > 0) {
        // Check if there's incomplete content after the last valid field
        const afterCutoff = repairedJson.substring(cutoffPoint + 2).trim();
        if (afterCutoff && !afterCutoff.startsWith(']') && !afterCutoff.startsWith('}')) {
          // Truncate to last complete field
          repairedJson = repairedJson.substring(0, cutoffPoint + (lastComma > lastCloseBrace ? 2 : 2));
        }
      }

      // Count opening and closing brackets/braces
      const openBrackets = (repairedJson.match(/\[/g) || []).length;
      const closeBrackets = (repairedJson.match(/\]/g) || []).length;
      const openBraces = (repairedJson.match(/\{/g) || []).length;
      const closeBraces = (repairedJson.match(/\}/g) || []).length;

      // Close unclosed braces and brackets
      for (let i = 0; i < openBraces - closeBraces; i++) {
        repairedJson += '\n  }';
      }
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        repairedJson += '\n]';
      }

      try {
        mcqs = JSON.parse(repairedJson);
        console.log('[codex] JSON repair successful');
      } catch (repairError) {
        console.error('[codex] Failed to parse JSON:', jsonString.substring(0, 500));
        console.error('[codex] Parse error:', parseError);
        console.error('[codex] Repair also failed:', repairError);
        throw new Error(`JSON parse failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
    }

    // Validate structure
    if (!Array.isArray(mcqs)) {
      throw new Error('Codex output is not an array');
    }

    return mcqs;
  } finally {
    // Cleanup temp file
    await fs.unlink(tempFile).catch(() => {});
  }
}

/**
 * Validate an MCQ for medical accuracy and quality
 * @param mcq MCQ object to validate
 * @returns Validation result with issues and suggestions
 */
export async function execCodexValidateMCQ(mcq: MCQ): Promise<ValidationResult> {
  const prompt = `You are a medical education quality assurance expert. Validate this multiple-choice question for medical accuracy, clarity, and assessment best practices.

Question:
${JSON.stringify(mcq, null, 2)}

Check for:
1. Medical accuracy (correct answer is factually correct)
2. Distractor plausibility (wrong answers are believable but wrong)
3. Stem clarity (question is unambiguous)
4. No cueing (correct answer not obviously longer/different)
5. Appropriate difficulty for learning objective
6. No grammatical/formatting issues

Output ONLY valid JSON with NO markdown code fences:
{
  "valid": true,
  "issues": ["Distractor B is implausible because..."],
  "suggestions": ["Consider revising distractor B to..."],
  "medicalAccuracy": 0.95
}`;

  const tempFile = `/tmp/codex-validate-${Date.now()}.txt`;
  await fs.writeFile(tempFile, prompt);

  try {
    const { stdout } = await execAsync(`cat "${tempFile}" | codex exec`);

    // Clean output: remove markdown code fences if present
    let cleaned = stdout.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');

    // Use greedy match for complete object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[codex-validate] Raw output:', stdout.substring(0, 500));
      throw new Error('No valid JSON found in validation output');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[codex-validate] Failed to parse JSON:', jsonMatch[0].substring(0, 500));
      throw new Error(`Validation JSON parse failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  } finally {
    await fs.unlink(tempFile).catch(() => {});
  }
}

/**
 * Generate plausible distractors for an MCQ stem
 * @param stem Question stem
 * @param correctAnswer The correct answer
 * @param learningObjective Related LO
 * @returns Suggested distractors with reasoning
 */
export async function execCodexGenerateDistractors(
  stem: string,
  correctAnswer: string,
  learningObjective: string
): Promise<DistractorSuggestions> {
  const prompt = `You are a medical education expert. Generate 4-5 plausible but incorrect answer choices (distractors) for this question.

Question stem: "${stem}"
Correct answer: "${correctAnswer}"
Learning objective: "${learningObjective}"

Requirements:
- Distractors must be plausible (students should need to think)
- Base distractors on common misconceptions or errors
- Ensure distractors are definitively wrong (no ambiguity)
- Vary distractor types (e.g., close but wrong, opposite, related concept)
- Rate plausibility 0.0-1.0 (how believable to a student)

Output ONLY valid JSON:
{
  "item_id": "generated_mcq",
  "distractors": [
    {
      "text": "Brachioradialis",
      "reasoning": "Students often confuse medial vs lateral boundaries",
      "plausibility": 0.85
    }
  ]
}`;

  const tempFile = `/tmp/codex-distractors-${Date.now()}.txt`;
  await fs.writeFile(tempFile, prompt);

  try {
    const { stdout } = await execAsync(`cat "${tempFile}" | codex exec`);
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in distractor output');
    }
    return JSON.parse(jsonMatch[0]);
  } finally {
    await fs.unlink(tempFile).catch(() => {});
  }
}

/**
 * Match MCQ to source evidence from lecture materials
 * @param mcq The MCQ to match
 * @param sourceText Lecture text content
 * @returns Evidence snippet with confidence score
 */
export async function execCodexMatchEvidence(
  mcq: MCQ,
  sourceText: string
): Promise<{ snippet: string; confidence: number; slideHint: string }> {
  const prompt = `You are a medical education expert. Find the source evidence in this lecture that supports this MCQ.

Question:
Stem: ${mcq.stem}
Correct answer: ${mcq.correctChoice} - ${mcq.choices.find(c => c.id === mcq.correctChoice)?.text}

Source lecture text:
${sourceText.substring(0, 5000)} ${sourceText.length > 5000 ? '...(truncated)' : ''}

Requirements:
- Find the text snippet that teaches this concept
- Rate confidence 0.0-1.0 (how well the source supports the question)
- Provide a hint about which slide/section (if discernible)

Output ONLY valid JSON:
{
  "snippet": "The cubital fossa is bounded medially by the pronator teres...",
  "confidence": 0.95,
  "slideHint": "Slide on cubital fossa anatomy, likely slide 12-15"
}`;

  const tempFile = `/tmp/codex-evidence-${Date.now()}.txt`;
  await fs.writeFile(tempFile, prompt);

  try {
    const { stdout } = await execAsync(`cat "${tempFile}" | codex exec`);
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in evidence matching output');
    }
    return JSON.parse(jsonMatch[0]);
  } finally {
    await fs.unlink(tempFile).catch(() => {});
  }
}

/**
 * Refine an MCQ based on validation feedback
 * @param mcq Original MCQ
 * @param validationResult Validation feedback
 * @returns Improved MCQ
 */
export async function execCodexRefineMCQ(mcq: MCQ, validationResult: ValidationResult): Promise<MCQ> {
  if (validationResult.valid && validationResult.issues.length === 0) {
    return mcq; // Already good
  }

  const prompt = `You are a medical education expert. Refine this MCQ based on quality feedback.

Original MCQ:
${JSON.stringify(mcq, null, 2)}

Feedback:
Issues: ${validationResult.issues.join('; ')}
Suggestions: ${validationResult.suggestions.join('; ')}

Requirements:
- Address all identified issues
- Maintain the same learning objective
- Keep the same correct answer (unless medically inaccurate)
- Improve stem clarity and distractor plausibility

Output ONLY the refined MCQ as valid JSON (same structure as input).`;

  const tempFile = `/tmp/codex-refine-${Date.now()}.txt`;
  await fs.writeFile(tempFile, prompt);

  try {
    const { stdout } = await execAsync(`cat "${tempFile}" | codex exec`);

    // Clean output: remove markdown code fences if present
    let cleaned = stdout.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');

    // Use greedy match for complete object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[codex-refine] Raw output:', stdout.substring(0, 500));
      throw new Error('No valid JSON found in refined MCQ output');
    }

    try {
      return JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('[codex-refine] Failed to parse JSON:', jsonMatch[0].substring(0, 500));
      throw new Error(`Refine JSON parse failed: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  } finally {
    await fs.unlink(tempFile).catch(() => {});
  }
}
