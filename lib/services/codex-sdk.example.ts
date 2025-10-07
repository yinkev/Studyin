/**
 * CodexSDK Usage Examples
 *
 * This file demonstrates how to use the CodexSDK wrapper for:
 * - MCQ generation
 * - MCQ validation
 * - Distractor generation
 * - Evidence matching
 * - MCQ refinement
 * - Streaming responses
 */

import {
  CodexSDK,
  createCodexSDK,
  getDefaultCodexSDK,
  type MCQ,
  type ValidationResult,
  LogLevel,
  type Logger,
} from './codex-sdk';

// ============================================================================
// Basic Usage
// ============================================================================

async function basicExample() {
  // Create SDK instance with default configuration
  const codex = createCodexSDK();

  // Or with custom configuration
  const customCodex = createCodexSDK({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
    maxRetries: 5,
    timeout: 180000, // 3 minutes
  });

  // Generate MCQs
  const learningObjectives = [
    'Identify the boundaries of the cubital fossa',
    'Describe the contents of the cubital fossa',
  ];

  const mcqs = await codex.generateMCQs(learningObjectives, {
    difficulty: 'medium',
    count: 3,
    includeEvidence: true,
    bloomLevel: 'understand',
  });

  console.log(`Generated ${mcqs.length} MCQs`);
  console.log(JSON.stringify(mcqs, null, 2));
}

// ============================================================================
// Validation and Refinement Workflow
// ============================================================================

async function validationWorkflow() {
  const codex = getDefaultCodexSDK();

  // Generate an MCQ
  const mcqs = await codex.generateMCQs(['Explain the mechanism of action of beta-blockers'], {
    count: 1,
    difficulty: 'medium',
  });

  const mcq = mcqs[0];
  console.log('Generated MCQ:', mcq);

  // Validate the MCQ
  const validation = await codex.validateMCQ(mcq);
  console.log('Validation result:', validation);

  // If validation found issues, refine the MCQ
  if (!validation.valid || validation.issues.length > 0) {
    console.log('Refining MCQ based on validation feedback...');
    const refinedMcq = await codex.refineMCQ(mcq, validation);
    console.log('Refined MCQ:', refinedMcq);

    // Validate again to confirm improvements
    const revalidation = await codex.validateMCQ(refinedMcq);
    console.log('Revalidation result:', revalidation);

    return refinedMcq;
  }

  return mcq;
}

// ============================================================================
// Distractor Generation
// ============================================================================

async function distractorExample() {
  const codex = createCodexSDK();

  const stem = 'Which muscle forms the medial boundary of the cubital fossa?';
  const correctAnswer = 'Pronator teres';
  const learningObjective = 'Identify the boundaries of the cubital fossa';

  const distractors = await codex.generateDistractors(stem, correctAnswer, learningObjective);

  console.log('Generated distractors:');
  distractors.distractors.forEach((d, i) => {
    console.log(`${i + 1}. ${d.text}`);
    console.log(`   Reasoning: ${d.reasoning}`);
    console.log(`   Plausibility: ${d.plausibility}`);
  });
}

// ============================================================================
// Evidence Matching
// ============================================================================

async function evidenceMatchingExample() {
  const codex = createCodexSDK();

  // Example MCQ
  const mcq: MCQ = {
    id: 'mcq_001',
    stem: 'Which structure forms the medial boundary of the cubital fossa?',
    choices: [
      { id: 'A', text: 'Pronator teres' },
      { id: 'B', text: 'Brachioradialis' },
      { id: 'C', text: 'Biceps brachii' },
      { id: 'D', text: 'Flexor carpi radialis' },
    ],
    correctChoice: 'A',
    rationale: 'The pronator teres forms the medial boundary of the cubital fossa.',
    learningObjective: 'Identify the boundaries of the cubital fossa',
    difficulty: 'medium',
  };

  // Example lecture text
  const lectureText = `
    The Cubital Fossa

    The cubital fossa is a triangular depression on the anterior aspect of the elbow.

    Boundaries:
    - Superior: Imaginary line between the medial and lateral epicondyles
    - Medial: Pronator teres muscle
    - Lateral: Brachioradialis muscle
    - Floor: Brachialis and supinator muscles
    - Roof: Skin, fascia, and bicipital aponeurosis

    Contents (from lateral to medial):
    1. Radial nerve
    2. Biceps tendon
    3. Brachial artery
    4. Median nerve

    Clinical significance: The brachial artery is commonly used for blood pressure measurement.
  `;

  const evidence = await codex.matchEvidence(mcq, lectureText);

  console.log('Evidence match:');
  console.log(`Confidence: ${evidence.confidence}`);
  console.log(`Snippet: ${evidence.snippet}`);
  console.log(`Slide hint: ${evidence.slideHint}`);
}

// ============================================================================
// Streaming Example
// ============================================================================

async function streamingExample() {
  const codex = createCodexSDK();

  const learningObjectives = ['Describe the blood supply to the upper limb'];

  console.log('Streaming MCQ generation...\n');

  const stream = codex.generateMCQsStream(learningObjectives, {
    count: 2,
    difficulty: 'medium',
  });

  let buffer = '';
  for await (const chunk of stream) {
    buffer += chunk;
    process.stdout.write(chunk);
  }

  console.log('\n\nGeneration complete!');
}

// ============================================================================
// Error Handling
// ============================================================================

async function errorHandlingExample() {
  const codex = createCodexSDK();

  try {
    const mcqs = await codex.generateMCQs(['Test learning objective'], {
      count: 5,
    });
    console.log('Success:', mcqs.length, 'MCQs generated');
  } catch (error) {
    if (error instanceof CodexSDK) {
      console.error('Codex error:', error.code, error.message);

      if (error.retryable) {
        console.log('Error is retryable, could implement custom retry logic');
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// ============================================================================
// Custom Logger Example
// ============================================================================

class CustomLogger implements Logger {
  debug(message: string, meta?: Record<string, unknown>): void {
    // Send to your logging service (e.g., Winston, Pino, DataDog)
    console.debug('[DEBUG]', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.info('[INFO]', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn('[WARN]', message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    console.error('[ERROR]', message, error, meta);
    // Could send to error tracking service (e.g., Sentry)
  }
}

async function customLoggerExample() {
  const logger = new CustomLogger();
  const codex = createCodexSDK({}, logger);

  // All SDK operations will use the custom logger
  await codex.generateMCQs(['Test objective'], { count: 1 });
}

// ============================================================================
// Batch Processing Example
// ============================================================================

async function batchProcessingExample() {
  const codex = createCodexSDK();

  const learningObjectiveSets = [
    ['Describe the anatomy of the shoulder joint'],
    ['Explain rotator cuff muscles and their functions'],
    ['Identify nerves of the brachial plexus'],
  ];

  console.log('Processing multiple LO sets in batch...');

  // Process sequentially to respect rate limits
  const allMcqs: MCQ[] = [];

  for (const loSet of learningObjectiveSets) {
    console.log(`Generating MCQs for: ${loSet[0]}`);

    const mcqs = await codex.generateMCQs(loSet, {
      count: 2,
      difficulty: 'medium',
    });

    allMcqs.push(...mcqs);

    // The SDK handles rate limiting internally, but you can add extra delays if needed
    // await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`Total MCQs generated: ${allMcqs.length}`);

  // Validate all MCQs
  console.log('Validating all MCQs...');

  const validations = await Promise.all(
    allMcqs.map(mcq => codex.validateMCQ(mcq))
  );

  const invalidCount = validations.filter(v => !v.valid).length;
  console.log(`${invalidCount} MCQs need refinement`);

  // Refine invalid MCQs
  const refinedMcqs = await Promise.all(
    allMcqs.map((mcq, i) => {
      const validation = validations[i];
      if (!validation.valid) {
        return codex.refineMCQ(mcq, validation);
      }
      return mcq;
    })
  );

  return refinedMcqs;
}

// ============================================================================
// Complete Workflow: Generate, Validate, Match Evidence
// ============================================================================

async function completeWorkflow() {
  const codex = createCodexSDK();

  // Step 1: Generate MCQs
  console.log('Step 1: Generating MCQs...');
  const mcqs = await codex.generateMCQs(
    ['Describe the anatomy and function of the cubital fossa'],
    {
      count: 3,
      difficulty: 'medium',
      includeEvidence: true,
      bloomLevel: 'understand',
    }
  );

  // Step 2: Validate each MCQ
  console.log('Step 2: Validating MCQs...');
  const validatedMcqs: Array<{ mcq: MCQ; validation: ValidationResult }> = [];

  for (const mcq of mcqs) {
    const validation = await codex.validateMCQ(mcq);
    validatedMcqs.push({ mcq, validation });
  }

  // Step 3: Refine MCQs that need improvement
  console.log('Step 3: Refining MCQs...');
  const finalMcqs: MCQ[] = [];

  for (const { mcq, validation } of validatedMcqs) {
    if (!validation.valid || validation.medicalAccuracy < 0.8) {
      console.log(`Refining MCQ ${mcq.id} (accuracy: ${validation.medicalAccuracy})`);
      const refined = await codex.refineMCQ(mcq, validation);
      finalMcqs.push(refined);
    } else {
      finalMcqs.push(mcq);
    }
  }

  // Step 4: Match evidence (if you have lecture materials)
  console.log('Step 4: Matching evidence...');
  const lectureText = `
    The cubital fossa is a triangular space on the anterior elbow.
    It is bounded medially by the pronator teres and laterally by the brachioradialis.
    The floor consists of the brachialis and supinator muscles.
    Contents include the biceps tendon, brachial artery, and median nerve.
  `;

  const evidenceMatches = await Promise.all(
    finalMcqs.map(mcq => codex.matchEvidence(mcq, lectureText))
  );

  // Step 5: Generate report
  console.log('\n=== MCQ Generation Report ===');
  console.log(`Total MCQs: ${finalMcqs.length}`);
  console.log(`Average evidence confidence: ${
    evidenceMatches.reduce((sum, e) => sum + e.confidence, 0) / evidenceMatches.length
  }`);

  finalMcqs.forEach((mcq, i) => {
    const validation = validatedMcqs[i].validation;
    const evidence = evidenceMatches[i];

    console.log(`\nMCQ ${i + 1}:`);
    console.log(`  ID: ${mcq.id}`);
    console.log(`  Valid: ${validation.valid}`);
    console.log(`  Accuracy: ${validation.medicalAccuracy}`);
    console.log(`  Evidence confidence: ${evidence.confidence}`);
    console.log(`  Stem: ${mcq.stem.substring(0, 60)}...`);
  });

  return finalMcqs;
}

// ============================================================================
// Health Check
// ============================================================================

async function healthCheckExample() {
  const codex = createCodexSDK();

  const isHealthy = await codex.healthCheck();

  if (isHealthy) {
    console.log('Codex SDK is healthy and ready to use');
  } else {
    console.error('Codex SDK health check failed');
  }
}

// ============================================================================
// Run Examples
// ============================================================================

if (require.main === module) {
  const examples = {
    basic: basicExample,
    validation: validationWorkflow,
    distractor: distractorExample,
    evidence: evidenceMatchingExample,
    streaming: streamingExample,
    errors: errorHandlingExample,
    batch: batchProcessingExample,
    complete: completeWorkflow,
    health: healthCheckExample,
  };

  const exampleName = process.argv[2] as keyof typeof examples;

  if (exampleName && examples[exampleName]) {
    console.log(`Running example: ${exampleName}\n`);
    examples[exampleName]()
      .then(() => console.log('\n✓ Example completed'))
      .catch(err => console.error('\n✗ Example failed:', err));
  } else {
    console.log('Available examples:');
    Object.keys(examples).forEach(name => console.log(`  - ${name}`));
    console.log('\nUsage: tsx codex-sdk.example.ts <example-name>');
  }
}

export {
  basicExample,
  validationWorkflow,
  distractorExample,
  evidenceMatchingExample,
  streamingExample,
  errorHandlingExample,
  batchProcessingExample,
  completeWorkflow,
  healthCheckExample,
};
