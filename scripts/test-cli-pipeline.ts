#!/usr/bin/env tsx
/**
 * End-to-End CLI Pipeline Test
 * Tests: PDF upload → Gemini OCR → LO extraction → Codex MCQ gen → Lesson saved
 */

import { execGeminiOCR, execGeminiExtractLOs } from './cli-wrappers/gemini';
import { execCodexGenerateMCQs, execCodexValidateMCQ } from './cli-wrappers/codex';
import { interactiveLessonSchema } from '../lib/types/lesson';
import { promises as fs } from 'fs';
import path from 'path';

const TEST_PDF_1 = '/Users/kyin/Projects/Studyin/data/uploads/lower-limb-overview.pdf';
const TEST_PDF_2 = '/Users/kyin/Downloads/Lower Limb Overview Handout_Student.pdf'; // Copy to workspace if testing

async function testPipeline(pdfPath: string) {
  console.log('\n========================================');
  console.log(`Testing CLI Pipeline with: ${path.basename(pdfPath)}`);
  console.log('========================================\n');

  const startTime = Date.now();

  try {
    // STEP 1: Check file exists
    console.log('[1/5] Checking file...');
    const stats = await fs.stat(pdfPath);
    console.log(`✓ File found: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);

    // STEP 2: OCR via Gemini-CLI
    console.log('[2/5] Running Gemini OCR (this may take 10-30s for PDFs)...');
    const ocrStart = Date.now();

    // Note: For PDFs, we need to extract first page as image
    // For now, test with the PDF directly and see what Gemini returns
    const ocrResult = await execGeminiOCR(pdfPath);

    console.log(`✓ OCR complete in ${((Date.now() - ocrStart) / 1000).toFixed(1)}s`);
    console.log(`  Title: "${ocrResult.title}"`);
    console.log(`  Text length: ${ocrResult.text.length} characters`);
    console.log(`  Diagrams found: ${ocrResult.diagrams.length}`);
    if (ocrResult.diagrams.length > 0) {
      ocrResult.diagrams.forEach((d, i) => {
        console.log(`    ${i + 1}. ${d.description} (${d.location})`);
      });
    }
    console.log();

    // STEP 3: Extract Learning Objectives
    console.log('[3/5] Extracting learning objectives via Gemini...');
    const loStart = Date.now();
    const loResult = await execGeminiExtractLOs(ocrResult.text, ocrResult.diagrams);

    console.log(`✓ LO extraction complete in ${((Date.now() - loStart) / 1000).toFixed(1)}s`);
    console.log(`  Learning Objectives (${loResult.learningObjectives.length}):`);
    loResult.learningObjectives.forEach((lo, i) => {
      console.log(`    ${i + 1}. ${lo}`);
    });
    console.log(`  Main Concepts: ${loResult.mainConcepts.join(', ')}`);
    console.log(`  Difficulty: ${loResult.difficulty}\n`);

    // STEP 4: Generate MCQs via Codex
    console.log('[4/5] Generating MCQs via Codex (this may take 30-60s)...');
    const mcqStart = Date.now();
    const mcqCount = Math.min(loResult.learningObjectives.length * 2, 6); // 2 per LO, max 6

    const rawMCQs = await execCodexGenerateMCQs(loResult.learningObjectives, {
      difficulty: loResult.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard',
      count: mcqCount,
      includeEvidence: true,
      bloomLevel: 'understand'
    });

    console.log(`✓ MCQ generation complete in ${((Date.now() - mcqStart) / 1000).toFixed(1)}s`);
    console.log(`  Generated ${rawMCQs.length} MCQs:\n`);

    rawMCQs.forEach((mcq, i) => {
      console.log(`  MCQ ${i + 1}: ${mcq.stem}`);
      console.log(`    Choices: ${mcq.choices.length}`);
      console.log(`    Correct: ${mcq.correctChoice}`);
      console.log(`    LO: ${mcq.learningObjective}`);
      console.log();
    });

    // STEP 5: Validate first MCQ
    console.log('[5/5] Validating MCQ quality via Codex...');
    if (rawMCQs.length > 0) {
      const validationStart = Date.now();
      const validation = await execCodexValidateMCQ(rawMCQs[0]);

      console.log(`✓ Validation complete in ${((Date.now() - validationStart) / 1000).toFixed(1)}s`);
      console.log(`  Valid: ${validation.valid}`);
      console.log(`  Medical accuracy: ${(validation.medicalAccuracy * 100).toFixed(0)}%`);
      if (validation.issues.length > 0) {
        console.log(`  Issues: ${validation.issues.join('; ')}`);
      }
      if (validation.suggestions.length > 0) {
        console.log(`  Suggestions: ${validation.suggestions.join('; ')}`);
      }
      console.log();
    }

    // STEP 6: Build Lesson Schema (validate it parses)
    console.log('[6/6] Building lesson schema...');
    const lesson = interactiveLessonSchema.parse({
      schema_version: '1.0.0',
      id: `lesson.test.${Date.now()}`,
      lo_id: loResult.learningObjectives[0] || 'lo.generated',
      title: ocrResult.title || `Lower Limb Overview`,
      summary: ocrResult.text.substring(0, 200) + '...',
      high_yield: loResult.mainConcepts.slice(0, 5),
      pitfalls: [`Difficulty: ${loResult.difficulty}`],
      animation_timeline: ocrResult.diagrams.slice(0, 3).map((d, idx) => ({
        beat: idx,
        duration_s: 5,
        narration: d.description,
        visual: `Diagram ${idx + 1}`
      })),
      content: rawMCQs.map(mcq => ({
        type: 'multiple_choice_question' as const,
        id: mcq.id,
        learningObjective: mcq.learningObjective,
        stem: mcq.stem,
        choices: mcq.choices,
        correctChoice: mcq.correctChoice
      }))
    });

    console.log(`✓ Lesson schema validated successfully`);
    console.log(`  Lesson ID: ${lesson.id}`);
    console.log(`  Content blocks: ${lesson.content.length}`);
    console.log(`  Animation beats: ${lesson.animation_timeline?.length || 0}\n`);

    // Summary
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('========================================');
    console.log('✅ PIPELINE TEST PASSED');
    console.log(`Total time: ${totalTime}s`);
    console.log('========================================\n');

    return { success: true, lesson, ocrResult, loResult, mcqs: rawMCQs };

  } catch (error: any) {
    console.error('\n❌ PIPELINE TEST FAILED');
    console.error(`Error: ${error.message}`);
    console.error(error.stack);
    return { success: false, error };
  }
}

async function main() {
  console.log('🧠 Studyin CLI Pipeline Test');
  console.log('Testing Gemini-CLI (OCR) + Codex-CLI (MCQ Generation)\n');

  // Test with first PDF
  const result1 = await testPipeline(TEST_PDF_1);

  if (result1.success) {
    console.log('✅ Test 1 passed!\n');

    // Optionally test second PDF
    const testSecond = process.argv.includes('--both');
    if (testSecond) {
      console.log('Testing second PDF...\n');
      const result2 = await testPipeline(TEST_PDF_2);
      if (result2.success) {
        console.log('✅ Test 2 passed!\n');
      }
    } else {
      console.log('💡 Tip: Run with --both to test second PDF\n');
    }
  }
}

main().catch(console.error);
