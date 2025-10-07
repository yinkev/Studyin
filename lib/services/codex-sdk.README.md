# OpenAI Codex SDK Wrapper

Production-ready TypeScript wrapper for the OpenAI API, optimized for medical education MCQ generation, validation, and refinement.

## Features

- **Official OpenAI SDK Integration** - Uses the latest `openai` package with structured outputs
- **Type-Safe with Zod** - Full schema validation for all inputs and outputs
- **Streaming Support** - Stream long responses for better UX
- **Automatic Retries** - Exponential backoff for transient failures
- **Rate Limiting** - Token bucket algorithm to respect API limits
- **Comprehensive Error Handling** - Custom error classes with retry hints
- **Structured Logging** - Pluggable logger interface
- **Production Ready** - Battle-tested patterns and best practices

## Installation

The SDK requires the OpenAI package:

```bash
npm install openai zod
```

## Quick Start

```typescript
import { createCodexSDK } from './lib/services/codex-sdk';

// Create SDK instance
const codex = createCodexSDK({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',
});

// Generate MCQs
const mcqs = await codex.generateMCQs(
  ['Identify the boundaries of the cubital fossa'],
  {
    difficulty: 'medium',
    count: 5,
    includeEvidence: true,
  }
);

console.log(`Generated ${mcqs.length} MCQs`);
```

## API Reference

### Configuration

```typescript
interface CodexConfig {
  apiKey?: string;              // OpenAI API key (defaults to OPENAI_API_KEY env var)
  model?: string;               // Model name (default: 'gpt-4o')
  maxRetries?: number;          // Max retry attempts (default: 3)
  timeout?: number;             // Request timeout in ms (default: 120000)
  baseURL?: string;             // Custom API base URL (optional)
}
```

### Core Methods

#### `generateMCQs(learningObjectives, options)`

Generate multiple-choice questions for specified learning objectives.

```typescript
const mcqs = await codex.generateMCQs(
  ['Describe the blood supply to the upper limb'],
  {
    difficulty: 'medium',    // 'easy' | 'medium' | 'hard' | 'adaptive'
    count: 5,                // Number of MCQs to generate
    includeEvidence: true,   // Include evidence-based rationale
    bloomLevel: 'understand', // Bloom's taxonomy level
    temperature: 0.7,        // OpenAI temperature (default: 0.7)
  }
);
```

**Returns:** `Promise<MCQ[]>`

#### `validateMCQ(mcq)`

Validate an MCQ for medical accuracy and quality.

```typescript
const validation = await codex.validateMCQ(mcq);

console.log(validation.valid);           // boolean
console.log(validation.medicalAccuracy); // 0.0 - 1.0
console.log(validation.issues);          // string[]
console.log(validation.suggestions);     // string[]
```

**Returns:** `Promise<ValidationResult>`

#### `generateDistractors(stem, correctAnswer, learningObjective)`

Generate plausible distractors for an MCQ stem.

```typescript
const distractors = await codex.generateDistractors(
  'Which muscle forms the medial boundary of the cubital fossa?',
  'Pronator teres',
  'Identify the boundaries of the cubital fossa'
);

distractors.distractors.forEach(d => {
  console.log(d.text);         // Distractor text
  console.log(d.reasoning);    // Why it's plausible
  console.log(d.plausibility); // 0.0 - 1.0
});
```

**Returns:** `Promise<DistractorSuggestions>`

#### `matchEvidence(mcq, sourceText)`

Match an MCQ to source evidence in lecture materials.

```typescript
const evidence = await codex.matchEvidence(mcq, lectureText);

console.log(evidence.snippet);    // Relevant text snippet
console.log(evidence.confidence); // 0.0 - 1.0
console.log(evidence.slideHint);  // Slide/section hint
```

**Returns:** `Promise<EvidenceMatch>`

#### `refineMCQ(mcq, feedback)`

Refine an MCQ based on validation feedback.

```typescript
const validation = await codex.validateMCQ(mcq);

if (!validation.valid) {
  const refined = await codex.refineMCQ(mcq, validation);
  console.log('Refined MCQ:', refined);
}
```

**Returns:** `Promise<MCQ>`

### Streaming

For long-running generation tasks, use streaming:

```typescript
const stream = codex.generateMCQsStream(learningObjectives, options);

for await (const chunk of stream) {
  process.stdout.write(chunk); // Stream to UI
}
```

### Utility Methods

```typescript
// Health check
const isHealthy = await codex.healthCheck();

// Get configuration
const config = codex.getConfig();

// Update configuration
codex.updateConfig({ model: 'gpt-4-turbo' });
```

## TypeScript Types

All types are exported from the SDK:

```typescript
import type {
  MCQ,
  MCQChoice,
  ValidationResult,
  DistractorSuggestions,
  EvidenceMatch,
  GenerateMCQOptions,
} from './lib/services/codex-sdk';
```

### MCQ Type

```typescript
interface MCQ {
  id: string;
  stem: string;
  choices: MCQChoice[];
  correctChoice: 'A' | 'B' | 'C' | 'D' | 'E';
  rationale: string;
  learningObjective: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  bloomLevel?: string;
}
```

## Error Handling

The SDK provides custom error classes:

```typescript
import { CodexError, RateLimitError, ValidationError } from './lib/services/codex-sdk';

try {
  const mcqs = await codex.generateMCQs(learningObjectives);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log('Rate limited, retry after:', error.retryAfter);
  } else if (error instanceof ValidationError) {
    console.log('Schema validation failed:', error.zodError);
  } else if (error instanceof CodexError) {
    console.log('Codex error:', error.code, error.message);
    console.log('Retryable:', error.retryable);
  }
}
```

## Logging

Use a custom logger for production:

```typescript
import type { Logger } from './lib/services/codex-sdk';

class ProductionLogger implements Logger {
  debug(message: string, meta?: Record<string, unknown>): void {
    // Send to logging service
  }

  info(message: string, meta?: Record<string, unknown>): void {
    logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    logger.warn(message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    logger.error(message, { error, ...meta });
  }
}

const codex = createCodexSDK({}, new ProductionLogger());
```

## Rate Limiting

The SDK includes a token bucket rate limiter (60 requests/minute by default). It automatically throttles requests to stay within OpenAI's limits.

For additional control:

```typescript
// Rate limiter handles this automatically
const promises = learningObjectives.map(lo =>
  codex.generateMCQs([lo], { count: 1 })
);

// SDK will queue and throttle these requests
const results = await Promise.all(promises);
```

## Retry Logic

Automatic exponential backoff for:
- Rate limit errors (429)
- Timeout errors (408)
- Server errors (5xx)

Configuration:

```typescript
const codex = createCodexSDK({
  maxRetries: 5,          // Max retry attempts
  timeout: 180000,        // 3 minute timeout
});
```

Retry delays:
- Attempt 1: 1 second
- Attempt 2: 2 seconds
- Attempt 3: 4 seconds
- Attempt 4: 8 seconds
- Attempt 5: 16 seconds (capped at 30s)

## Best Practices

### 1. Use Singleton for Application-Wide Access

```typescript
import { getDefaultCodexSDK } from './lib/services/codex-sdk';

// In your service layer
export async function generateQuestions(los: string[]) {
  const codex = getDefaultCodexSDK();
  return codex.generateMCQs(los);
}
```

### 2. Validate Before Saving

```typescript
async function createValidatedMCQ(lo: string): Promise<MCQ> {
  const codex = getDefaultCodexSDK();

  const [mcq] = await codex.generateMCQs([lo], { count: 1 });
  const validation = await codex.validateMCQ(mcq);

  if (validation.medicalAccuracy < 0.8) {
    return codex.refineMCQ(mcq, validation);
  }

  return mcq;
}
```

### 3. Batch Processing with Error Isolation

```typescript
async function batchGenerate(loSets: string[][]): Promise<MCQ[]> {
  const codex = getDefaultCodexSDK();
  const results: MCQ[] = [];

  for (const los of loSets) {
    try {
      const mcqs = await codex.generateMCQs(los, { count: 2 });
      results.push(...mcqs);
    } catch (error) {
      console.error(`Failed to generate for LOs:`, los, error);
      // Continue with next batch
    }
  }

  return results;
}
```

### 4. Stream for Long Responses

```typescript
async function streamToUI(los: string[]): Promise<void> {
  const codex = getDefaultCodexSDK();
  const stream = codex.generateMCQsStream(los, { count: 10 });

  let buffer = '';
  for await (const chunk of stream) {
    buffer += chunk;
    // Update UI incrementally
    updateProgressUI(buffer);
  }
}
```

## Migration from CLI Wrapper

If you're migrating from `scripts/cli-wrappers/codex.ts`:

**Before:**
```typescript
import { execCodexGenerateMCQs } from '@/scripts/cli-wrappers/codex';

const mcqs = await execCodexGenerateMCQs(learningObjectives, options);
```

**After:**
```typescript
import { getDefaultCodexSDK } from '@/lib/services/codex-sdk';

const codex = getDefaultCodexSDK();
const mcqs = await codex.generateMCQs(learningObjectives, options);
```

### Key Differences

1. **No CLI dependency** - Direct API calls via OpenAI SDK
2. **Structured outputs** - Uses `zodResponseFormat` for guaranteed JSON
3. **Better error handling** - Typed errors with retry hints
4. **Rate limiting** - Automatic throttling
5. **Streaming support** - Real-time progress updates
6. **Type safety** - Full TypeScript support with Zod schemas

## Examples

See `codex-sdk.example.ts` for comprehensive examples:

```bash
# Run a specific example
tsx lib/services/codex-sdk.example.ts basic
tsx lib/services/codex-sdk.example.ts validation
tsx lib/services/codex-sdk.example.ts streaming
tsx lib/services/codex-sdk.example.ts complete
```

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...

# Optional
OPENAI_MODEL=gpt-4o
OPENAI_MAX_RETRIES=3
OPENAI_TIMEOUT=120000
```

## Testing

```typescript
import { createCodexSDK } from './lib/services/codex-sdk';

// Use custom baseURL for testing
const testCodex = createCodexSDK({
  apiKey: 'test-key',
  baseURL: 'http://localhost:4010', // Mock server
});
```

## Performance

**Generation:** ~10-30 seconds for 5 MCQs (depending on complexity)
**Validation:** ~3-5 seconds per MCQ
**Refinement:** ~5-10 seconds per MCQ

**Tips:**
- Use `count` parameter to generate multiple MCQs in one request
- Batch validate in parallel with `Promise.all()`
- Use streaming for better perceived performance
- Cache results when possible

## Troubleshooting

### Rate Limit Errors

The SDK handles rate limiting automatically, but if you're still hitting limits:

```typescript
// Reduce parallelism
for (const lo of learningObjectives) {
  await codex.generateMCQs([lo], { count: 1 });
  await sleep(1000); // Extra delay
}
```

### Timeout Errors

Increase timeout for complex requests:

```typescript
const codex = createCodexSDK({ timeout: 300000 }); // 5 minutes
```

### Validation Errors

If Zod validation fails, the response doesn't match expected schema:

```typescript
try {
  const mcqs = await codex.generateMCQs(los);
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('Schema mismatch:', error.zodError);
    // Model may be hallucinating or format changed
  }
}
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact the development team.
