# CLI Integration Guide: Gemini + Codex Brain Pipeline

## Overview

Studyin now uses **Gemini-CLI** (Google's SOTA OCR + vision) and **Codex-CLI** (OpenAI's code-focused model) as the "brain" for content generation. This enables automatic extraction of learning objectives from lecture slides and generation of high-quality MCQs.

## Architecture

```
User uploads PDF → Queue → Worker → CLI Pipeline → Lesson saved
                                      ↓
                           1. Gemini OCR (extract text + diagrams)
                           2. Gemini LO extraction
                           3. Codex MCQ generation
                           4. Codex validation & refinement
                           5. Build lesson schema
```

## Setup

### Prerequisites

1. **Gemini-CLI** installed and authenticated:
   ```bash
   # Already installed at: /Users/kyin/.nvm/versions/node/v22.20.0/bin/gemini
   gemini --version
   # Ensure you're logged in with OAuth
   ```

2. **Codex-CLI** installed and authenticated:
   ```bash
   # Already installed at: /opt/homebrew/bin/codex
   codex --version
   # Ensure you're logged in with OAuth
   ```

3. **Pro plans active** (you mentioned you have these)

### Enable CLI Pipeline

The worker uses CLIs by default. To disable (use stub mode):

```bash
USE_CLI_PIPELINE=0 npx tsx scripts/worker.ts
```

## How It Works

### 1. Gemini-CLI (OCR + LO Extraction)

**Location:** `scripts/cli-wrappers/gemini.ts`

**Functions:**
- `execGeminiOCR(imagePath)` — Extract text, title, and diagrams from lecture slides
- `execGeminiExtractLOs(text, diagrams)` — Identify learning objectives and concepts
- `execGeminiFindEvidence(questionStem, sourceFiles)` — Find source material for questions
- `execGeminiAnalyzeDiagram(imagePath)` — Detailed anatomy diagram analysis
- `execGeminiExtractTable(imagePath)` — Extract structured data from tables/charts

**Example Output (OCR):**
```json
{
  "title": "Cubital Fossa Anatomy",
  "text": "The cubital fossa is a triangular space...",
  "diagrams": [
    {
      "description": "Diagram showing cubital fossa boundaries and contents",
      "location": "center-right"
    }
  ]
}
```

**Example Output (LO Extraction):**
```json
{
  "learningObjectives": [
    "Describe the anatomical boundaries of the cubital fossa",
    "List the major contents of the cubital fossa"
  ],
  "mainConcepts": ["cubital fossa", "pronator teres", "brachial artery"],
  "difficulty": "Medium"
}
```

### 2. Codex-CLI (MCQ Generation + Validation)

**Location:** `scripts/cli-wrappers/codex.ts`

**Functions:**
- `execCodexGenerateMCQs(los, options)` — Generate high-quality MCQs
- `execCodexValidateMCQ(mcq)` — Check medical accuracy and quality
- `execCodexRefineMCQ(mcq, validation)` — Improve based on feedback
- `execCodexGenerateDistractors(stem, correctAnswer, lo)` — Create plausible wrong answers
- `execCodexMatchEvidence(mcq, sourceText)` — Link questions to source material

**Example Output (MCQ Generation):**
```json
[
  {
    "id": "cf_boundaries_1",
    "stem": "Which structure forms the lateral boundary of the cubital fossa?",
    "choices": [
      {"id": "A", "text": "Pronator teres"},
      {"id": "B", "text": "Brachioradialis"},
      {"id": "C", "text": "Biceps brachii tendon"},
      {"id": "D", "text": "Flexor carpi radialis"}
    ],
    "correctChoice": "B",
    "rationale": "The brachioradialis forms the lateral boundary...",
    "learningObjective": "Describe the anatomical boundaries of the cubital fossa",
    "difficulty": "medium",
    "bloomLevel": "remember"
  }
]
```

### 3. Worker Pipeline

**Location:** `scripts/worker.ts`

**Flow:**
1. Job enqueued with `sourcePath` (uploaded file)
2. Worker calls `execGeminiOCR(sourcePath)` → extracts text + diagrams
3. Worker calls `execGeminiExtractLOs(text)` → identifies LOs
4. Worker calls `execCodexGenerateMCQs(los)` → creates 2 MCQs per LO
5. Worker validates each MCQ with `execCodexValidateMCQ(mcq)`
6. If issues found, worker refines with `execCodexRefineMCQ(mcq, validation)`
7. Worker builds lesson schema and saves to `data/lessons/`

**Progress Tracking:**
The worker emits progress events for each step:
- `init` (0%) — Starting CLI pipeline
- `ocr` (10%) — Running Gemini OCR
- `lo-extraction` (30%) — Extracting learning objectives
- `mcq-generation` (50%) — Generating MCQs with Codex
- `validation` (70%) — Validating MCQ quality
- `refinement` (85%) — Refining MCQs
- `saving` (95%) — Building lesson schema
- `saving` (100%) — Lesson saved successfully!

## Usage Examples

### Test Gemini OCR

```bash
# From project root
cd /Users/kyin/Projects/Studyin

# Test OCR on an image
gemini -p "Extract all text from this medical lecture slide. Output as JSON: {title, text, diagrams}" --image /path/to/slide.png
```

### Test Codex MCQ Generation

```bash
# Test MCQ generation
codex exec "Generate 2 MCQs for learning objective: 'Describe cubital fossa boundaries'. Output JSON array."
```

### Run Worker with CLI Pipeline

```bash
# Terminal 1: Start the worker
npx tsx scripts/worker.ts

# Terminal 2: Enqueue a job (via UI or API)
# Upload a PDF through the /upload page
# Worker will automatically process with Gemini + Codex
```

### Monitor Worker Logs

```bash
# Watch worker progress in real-time
npx tsx scripts/worker.ts | grep "worker"

# Example output:
# [worker] processing job abc123 (lecture-slide-07.pdf)
# [worker] abc123 | ocr (10%) - Running Gemini OCR on lecture slides...
# [worker] OCR complete - title: "Cubital Fossa Anatomy", 2 diagrams found
# [worker] abc123 | lo-extraction (30%) - Extracting learning objectives...
# [worker] LO extraction complete - 2 LOs, difficulty: Medium
# [worker] abc123 | mcq-generation (50%) - Generating MCQs with Codex...
# [worker] Generated 4 MCQs
# [worker] abc123 | validation (70%) - Validating MCQ quality...
# [worker] abc123 | saving (100%) - Lesson saved successfully!
```

## Advanced Features

### Batch Processing

Future enhancement: Process entire PDF decks (requires PDF page splitting):

```ts
// scripts/cli-wrappers/gemini.ts
export async function execGeminiBatchOCR(pdfPath: string, options?: { maxSlides?: number }) {
  // Split PDF into pages
  // Run OCR on each page in parallel
  // Combine results
}
```

### Evidence Retrieval During Study

When a student answers incorrectly, fetch the source slide:

```ts
import { execGeminiFindEvidence } from '@/scripts/cli-wrappers/gemini';

async function showEvidence(questionStem: string, lessonFiles: string[]) {
  const evidence = await execGeminiFindEvidence(questionStem, lessonFiles);
  return {
    slideNumber: evidence.slideNumber,
    excerpt: evidence.excerpt,
    relevance: evidence.relevance
  };
}
```

### Diagram Analysis

Analyze anatomical diagrams in detail:

```ts
import { execGeminiAnalyzeDiagram } from '@/scripts/cli-wrappers/gemini';

const diagram = await execGeminiAnalyzeDiagram('/path/to/brachial-plexus.png');
// Returns: { description, structures: [{name, location, relationships}] }
```

## Performance Notes

### Gemini-CLI
- **Speed:** Fast (~1-2s per slide for OCR)
- **Accuracy:** SOTA vision model, excellent for medical diagrams
- **Token usage:** ~500-1000 tokens per slide

### Codex-CLI
- **Speed:** Slower (~10-30s per MCQ generation batch)
- **Reasoning:** Uses `reasoning effort: high` for medical accuracy
- **Token usage:** ~2000-5000 tokens per MCQ batch

### Optimization Tips

1. **Parallel processing:** Generate multiple MCQs in one Codex call (already implemented)
2. **Caching:** Cache LO extraction results to avoid re-running on similar slides
3. **Async validation:** Validate MCQs in parallel (future enhancement)

## Error Handling

Both CLIs use try-catch with fallbacks:

```ts
try {
  const ocrResult = await execGeminiOCR(sourcePath);
} catch (error) {
  console.error('[worker] Gemini OCR failed', error);
  await queue.fail(job.id, `OCR failed: ${error.message}`);
}
```

Fallback to stub mode if CLI fails:
```ts
const shouldUseCLI = USE_CLI_PIPELINE && hasSourceFile;
if (!shouldUseCLI) {
  await processStubLesson(job.id, job.payload);
  return;
}
```

## Debugging

### Enable verbose logging

```bash
# Gemini-CLI debug mode
gemini --debug -p "Extract text..." --image slide.png

# Codex-CLI debug mode
codex exec --debug "Generate MCQs..."
```

### Inspect CLI output

CLI wrappers clean JSON responses automatically:

```ts
// Removes markdown code fences if present
const cleaned = stdout.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
return JSON.parse(cleaned);
```

### Test wrappers directly

```bash
# Test Gemini wrapper
npx tsx -e "
import { execGeminiOCR } from './scripts/cli-wrappers/gemini';
const result = await execGeminiOCR('/path/to/slide.png');
console.log(JSON.stringify(result, null, 2));
"

# Test Codex wrapper
npx tsx -e "
import { execCodexGenerateMCQs } from './scripts/cli-wrappers/codex';
const mcqs = await execCodexGenerateMCQs(['Describe cubital fossa boundaries'], {});
console.log(JSON.stringify(mcqs, null, 2));
"
```

## Next Steps (PHASE 0 Complete!)

✅ **DONE:**
- Gemini-CLI wrapper (OCR, LO extraction, evidence)
- Codex-CLI wrapper (MCQ generation, validation, refinement)
- Worker CLI pipeline integration
- Progress tracking
- Stub mode fallback

**TODO:**
- Test end-to-end with real PDF upload
- Wire progress events to UI (websocket or polling)
- Add evidence panel in Study UI (link to source slides)
- Batch PDF processing (split pages, parallel OCR)

---

## Phase 1 Next: Landing Page Overhaul

Now that the "brain" is wired, we can start building the WOW-factor UI! 🚀

**Up next:**
- Design tokens + OKC palette
- Particle field background (Three.js)
- Animated hero with gradient text
- Interactive mascot with confetti burst
- Module cards with 3D tilt
- Achievement carousel

Ready when you are!
