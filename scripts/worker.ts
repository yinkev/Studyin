#!/usr/bin/env tsx
import { setTimeout as sleep } from 'timers/promises';
import { createDevQueueAdapter } from '../lib/queue';
import { interactiveLessonSchema } from '../lib/types/lesson';
import { defaultLessonStorage } from '../lib/services/lessonService';
import { lessonCreatedEventSchema } from '../core/types/events';
import { globalEventBus } from '../lib/eventBus';
import { execGeminiOCR, execGeminiExtractLOs } from './cli-wrappers/gemini';
import { execCodexGenerateMCQs, execCodexValidateMCQ, execCodexRefineMCQ } from './cli-wrappers/codex';
import type { MCQ } from './cli-wrappers/codex';

type UploadJobPayload = {
  fileName: string;
  fileSize: number;
  sourcePath?: string;
};

type UploadJobResult = {
  lessonId: string;
  outputPath: string;
};

type JobProgress = {
  step: 'init' | 'ocr' | 'lo-extraction' | 'mcq-generation' | 'validation' | 'refinement' | 'saving';
  progress: number; // 0-100
  message: string;
};

const queue = createDevQueueAdapter<UploadJobPayload, UploadJobResult>();
const USE_CLI_PIPELINE = process.env.USE_CLI_PIPELINE !== '0'; // Enable by default

async function emitProgress(jobId: string, progress: JobProgress) {
  console.log(`[worker] ${jobId} | ${progress.step} (${progress.progress}%) - ${progress.message}`);
  // Future: emit to UI via websocket or queue metadata update
}

async function processNext(): Promise<void> {
  const job = await queue.peek();
  if (!job) {
    return;
  }
  await queue.markProcessing(job.id);
  console.log(`[worker] processing job ${job.id} (${job.payload.fileName})`);
  const startedAt = Date.now();

  try {
    // Determine if we have a real source file for CLI processing
    const hasSourceFile = Boolean(job.payload.sourcePath);
    const shouldUseCLI = USE_CLI_PIPELINE && hasSourceFile;

    if (!shouldUseCLI) {
      console.log(`[worker] Using stub mode (USE_CLI_PIPELINE=${USE_CLI_PIPELINE}, hasSourceFile=${hasSourceFile})`);
      await processStubLesson(job.id, job.payload);
      return;
    }

    await emitProgress(job.id, { step: 'init', progress: 0, message: 'Starting CLI pipeline' });

    // STEP 1: OCR via Gemini-CLI (SOTA vision)
    await emitProgress(job.id, { step: 'ocr', progress: 10, message: 'Running Gemini OCR on lecture slides...' });
    const ocrResult = await execGeminiOCR(job.payload.sourcePath!);
    console.log(`[worker] OCR complete - title: "${ocrResult.title}", ${ocrResult.diagrams.length} diagrams found`);

    // STEP 2: Extract Learning Objectives via Gemini-CLI
    await emitProgress(job.id, { step: 'lo-extraction', progress: 30, message: 'Extracting learning objectives...' });
    const loResult = await execGeminiExtractLOs(ocrResult.text, ocrResult.diagrams);
    console.log(`[worker] LO extraction complete - ${loResult.learningObjectives.length} LOs, difficulty: ${loResult.difficulty}`);

    // STEP 3: Generate MCQs via Codex-CLI
    await emitProgress(job.id, { step: 'mcq-generation', progress: 50, message: 'Generating MCQs with Codex...' });
    const rawMCQs = await execCodexGenerateMCQs(loResult.learningObjectives, {
      difficulty: loResult.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard',
      count: Math.min(loResult.learningObjectives.length * 2, 10), // 2 MCQs per LO, max 10
      includeEvidence: true,
      bloomLevel: 'understand'
    });
    console.log(`[worker] Generated ${rawMCQs.length} MCQs`);

    // STEP 4: Validate & Refine MCQs via Codex-CLI
    await emitProgress(job.id, { step: 'validation', progress: 70, message: 'Validating MCQ quality...' });
    const validatedMCQs: MCQ[] = [];

    for (let i = 0; i < rawMCQs.length; i++) {
      const mcq = rawMCQs[i];
      await emitProgress(job.id, {
        step: 'validation',
        progress: 70 + (i / rawMCQs.length) * 15,
        message: `Validating MCQ ${i + 1}/${rawMCQs.length}...`
      });

      const validation = await execCodexValidateMCQ(mcq);

      if (!validation.valid && validation.issues.length > 0) {
        console.log(`[worker] MCQ ${mcq.id} has issues, refining...`);
        await emitProgress(job.id, {
          step: 'refinement',
          progress: 85 + (i / rawMCQs.length) * 10,
          message: `Refining MCQ ${i + 1}/${rawMCQs.length}...`
        });
        const refined = await execCodexRefineMCQ(mcq, validation);
        validatedMCQs.push(refined);
      } else {
        validatedMCQs.push(mcq);
      }
    }

    // STEP 5: Build Lesson Schema
    await emitProgress(job.id, { step: 'saving', progress: 95, message: 'Building lesson schema...' });

    const lesson = interactiveLessonSchema.parse({
      schema_version: '1.0.0',
      id: `lesson.${job.id}`,
      lo_id: loResult.learningObjectives[0] || 'lo.generated',
      title: ocrResult.title || `Lesson: ${job.payload.fileName}`,
      summary: ocrResult.text.substring(0, 200) + (ocrResult.text.length > 200 ? '...' : ''),
      high_yield: loResult.mainConcepts.slice(0, 5),
      pitfalls: [`Difficulty level: ${loResult.difficulty}`, `Generated from ${job.payload.fileName}`],
      animation_timeline: ocrResult.diagrams.slice(0, 3).map((diagram, idx) => ({
        beat: idx,
        duration_s: 5,
        narration: diagram.description,
        visual: `Diagram ${idx + 1}: ${diagram.location}`
      })),
      content: validatedMCQs.map(mcq => ({
        type: 'multiple_choice_question' as const,
        id: mcq.id,
        learningObjective: mcq.learningObjective,
        stem: mcq.stem,
        choices: mcq.choices,
        correctChoice: mcq.correctChoice
      }))
    });

    await defaultLessonStorage.save(lesson);

    const result = {
      lessonId: lesson.id,
      outputPath: `lesson:${lesson.id}`
    } satisfies UploadJobResult;

    await queue.complete(job.id, result);
    await globalEventBus.emit(
      lessonCreatedEventSchema.parse({
        type: 'LESSON_CREATED',
        lesson,
        jobId: job.id,
        ts: Date.now(),
        durationMs: Date.now() - startedAt
      })
    );

    await emitProgress(job.id, { step: 'saving', progress: 100, message: 'Lesson saved successfully!' });
    console.log(`[worker] completed job ${job.id} with CLI pipeline in ${Date.now() - startedAt}ms`);

  } catch (error: any) {
    console.error(`[worker] job ${job.id} failed`, error);
    await queue.fail(job.id, error?.message ?? 'Unhandled worker error');
  }
}

// Stub lesson generator (fallback when no source file or CLI disabled)
async function processStubLesson(jobId: string, payload: UploadJobPayload) {
  await sleep(500);

  const lesson = interactiveLessonSchema.parse({
    schema_version: '1.0.0',
    id: `lesson.${jobId}`,
    lo_id: 'lo.dev.stub',
    title: `Auto lesson for ${payload.fileName}`,
    summary: 'Generated by the dev worker stub. Enable USE_CLI_PIPELINE=1 and provide sourcePath for full CLI pipeline.',
    high_yield: [
      'High-yield placeholder derived from the job payload.',
      'Wire your AI content here to replace the stub.'
    ],
    pitfalls: ['This lesson was generated by the background worker stub.'],
    animation_timeline: [
      { beat: 0, duration_s: 4, narration: 'Highlight the uploaded file context.', visual: 'Hero card splash' },
      { beat: 1, duration_s: 5, narration: 'Introduce the learner objective.', visual: 'Text reveal' }
    ],
    content: [
      {
        type: 'multiple_choice_question',
        id: `mcq-${jobId}`,
        learningObjective: 'lo.dev.stub',
        stem: `What file kicked off this lesson?`,
        choices: [
          { id: 'A', text: payload.fileName },
          { id: 'B', text: 'The worker guessed randomly.' },
          { id: 'C', text: 'No idea, this is blank.' },
          { id: 'D', text: 'A secret system file.' }
        ],
        correctChoice: 'A'
      }
    ]
  });

  await defaultLessonStorage.save(lesson);

  const result = {
    lessonId: lesson.id,
    outputPath: `lesson:${lesson.id}`
  } satisfies UploadJobResult;

  await queue.complete(jobId, result);
  await globalEventBus.emit(
    lessonCreatedEventSchema.parse({
      type: 'LESSON_CREATED',
      lesson,
      jobId,
      ts: Date.now(),
      durationMs: 500
    })
  );
  console.log(`[worker] completed stub job ${jobId}`);
}

async function main() {
  console.log('[worker] dev content factory online');
  while (true) {
    const start = Date.now();
    await processNext();
    const elapsed = Date.now() - start;
    if (elapsed < 1500) {
      await sleep(1500 - elapsed);
    }
  }
}

main().catch((error) => {
  console.error('[worker] fatal error', error);
  process.exit(1);
});
