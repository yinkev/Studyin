/**
 * Gemini-CLI Wrapper
 * Provides typed interfaces for Gemini Pro API via CLI
 * Features: OCR, LO extraction, evidence retrieval, image analysis
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Response types
export interface GeminiOCRResult {
  title: string;
  text: string;
  diagrams: Array<{
    description: string;
    location: string;
  }>;
}

export interface GeminiLOResult {
  learningObjectives: string[];
  mainConcepts: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface GeminiEvidenceResult {
  slideNumber: number;
  excerpt: string;
  relevance: number;
  imageDescription?: string;
}

export interface GeminiDiagramResult {
  description: string;
  structures: Array<{
    name: string;
    location: string;
    relationships: string[];
  }>;
}

/**
 * Extract text and diagrams from medical lecture slides using SOTA OCR
 * @param imagePath Absolute path to image file (PNG, JPG, PDF page) - must be within project workspace
 * @returns Structured OCR result with title, text, and diagram locations
 */
export async function execGeminiOCR(imagePath: string): Promise<GeminiOCRResult> {
  const prompt = `You are a medical education expert with SOTA OCR capabilities. Extract all text from this medical lecture slide/PDF with perfect accuracy.

Requirements:
- Extract the slide title (if visible)
- Extract all body text (preserve structure, bullet points, headings)
- Identify any diagrams, charts, or anatomical illustrations
- Describe each diagram's content and location on the slide

Output ONLY valid JSON with NO markdown code fences or extra text:
{
  "title": "slide title or document title",
  "text": "complete extracted text with preserved structure",
  "diagrams": [{"description": "anatomy diagram showing X and Y structures", "location": "center-right"}]
}`;

  // Gemini-CLI uses @ syntax for file references
  const { stdout } = await execAsync(`gemini "${prompt}" @"${imagePath}"`, { maxBuffer: 1024 * 1024 * 10 });

  // Clean up response (remove markdown code fences if present)
  const cleaned = stdout.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');

  // Extract JSON from output (Gemini sometimes includes thinking/metadata)
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in Gemini OCR output');
  }

  return JSON.parse(jsonMatch[0]);
}

/**
 * Extract learning objectives from lecture content
 * @param text Lecture text content
 * @param diagrams Optional diagram descriptions for context
 * @returns Structured learning objectives with difficulty rating
 */
export async function execGeminiExtractLOs(text: string, diagrams: GeminiOCRResult['diagrams'] = []): Promise<GeminiLOResult> {
  const diagramContext = diagrams.length > 0
    ? `\n\nDiagrams present: ${diagrams.map(d => d.description).join(', ')}`
    : '';

  const prompt = `You are a medical education expert. Extract learning objectives from this lecture content.

Lecture text:
${text}${diagramContext}

Requirements:
- Identify 2-5 specific, measurable learning objectives
- Use Bloom's taxonomy verbs (describe, identify, explain, analyze, etc.)
- Extract main medical concepts/terms
- Rate overall difficulty (Easy, Medium, Hard)

Output ONLY valid JSON with NO markdown code fences:
{
  "learningObjectives": ["Describe the anatomical boundaries of...", "Identify the major structures in..."],
  "mainConcepts": ["cubital fossa", "brachial artery", "median nerve"],
  "difficulty": "Medium"
}`;

  const { stdout } = await execAsync(`gemini -p '${prompt.replace(/'/g, "'\\''")}'`);
  const cleaned = stdout.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

/**
 * Find source evidence for a question stem
 * @param questionStem The MCQ question text
 * @param sourceFiles Array of source file paths (PDFs, images)
 * @returns Evidence location with relevance score
 */
export async function execGeminiFindEvidence(
  questionStem: string,
  sourceFiles: string[]
): Promise<GeminiEvidenceResult> {
  if (sourceFiles.length === 0) {
    throw new Error('No source files provided for evidence search');
  }

  const filesArg = sourceFiles.map(f => `--file "${f}"`).join(' ');
  const prompt = `You are a medical education expert. Find the source material that best explains this question:

Question: "${questionStem}"

Requirements:
- Identify the slide/page number where this concept is taught
- Extract the relevant excerpt (2-3 sentences)
- Rate relevance (0.0 to 1.0, where 1.0 is perfect match)
- If the slide contains an image, describe it briefly

Output ONLY valid JSON with NO markdown code fences:
{
  "slideNumber": 12,
  "excerpt": "The cubital fossa is bounded medially by...",
  "relevance": 0.95,
  "imageDescription": "Diagram showing cubital fossa boundaries"
}`;

  const { stdout } = await execAsync(`gemini -p '${prompt.replace(/'/g, "'\\''")}'${filesArg.length > 0 ? ' ' + filesArg : ''}`);
  const cleaned = stdout.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

/**
 * Analyze anatomical diagrams with medical precision
 * @param imagePath Path to anatomy diagram
 * @returns Structured description with labeled structures
 */
export async function execGeminiAnalyzeDiagram(imagePath: string): Promise<GeminiDiagramResult> {
  const prompt = `You are a medical anatomy expert. Analyze this anatomical diagram in detail.

Requirements:
- Provide overall description of what the diagram shows
- Identify all labeled structures
- Describe spatial relationships between structures
- Note any arrows, colors, or annotations

Output ONLY valid JSON with NO markdown code fences:
{
  "description": "Cross-sectional view of the cubital fossa",
  "structures": [
    {
      "name": "Brachioradialis",
      "location": "lateral boundary",
      "relationships": ["lateral to biceps tendon", "superficial to radial nerve"]
    }
  ]
}`;

  const { stdout } = await execAsync(`gemini -p "${prompt.replace(/"/g, '\\"')}" --image "${imagePath}"`);
  const cleaned = stdout.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

/**
 * Batch process multiple slides from a PDF
 * @param pdfPath Path to PDF file
 * @param options Processing options
 * @returns Array of OCR results per slide
 */
export async function execGeminiBatchOCR(
  _pdfPath: string,
  _options: { maxSlides?: number; startSlide?: number } = {}
): Promise<GeminiOCRResult[]> {
  // For now, this is a stub - requires PDF splitting
  // In production, you'd use pdf-lib or similar to extract pages
  throw new Error('Batch OCR not yet implemented - requires PDF page extraction');
}

/**
 * Extract structured medical data (drug tables, anatomy charts, etc.)
 * @param imagePath Path to table/chart image
 * @returns Structured data as JSON
 */
export async function execGeminiExtractTable(imagePath: string): Promise<any> {
  const prompt = `You are a medical data extraction expert. Extract all data from this medical table/chart with perfect accuracy.

Requirements:
- Preserve all headers and row labels
- Extract all cell values
- Maintain table structure
- Note any footnotes or legends

Output as a JSON array of objects where each object represents a row.`;

  const { stdout } = await execAsync(`gemini -p "${prompt.replace(/"/g, '\\"')}" --image "${imagePath}"`);
  const cleaned = stdout.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}
