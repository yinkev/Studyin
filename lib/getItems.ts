import { promises as fs } from 'fs';
import path from 'path';
import type { AnalyticsSummary } from './getAnalytics';

export interface StudyItem {
  id: string;
  stem: string;
  choices: Record<'A' | 'B' | 'C' | 'D' | 'E', string>;
  key: 'A' | 'B' | 'C' | 'D' | 'E';
  rationale_correct: string;
  rationale_distractors: Partial<Record<'A' | 'B' | 'C' | 'D' | 'E', string>>;
  difficulty: 'easy' | 'medium' | 'hard';
  los: string[];
  evidence?: {
    citation?: string;
    cropPath?: string;
    source_url?: string;
    file?: string;
    page?: number;
    figure?: string;
    bbox?: [number, number, number, number];
    dataUri?: string;
  };
}

const DEFAULT_BANK_ROOT = path.join(process.cwd(), 'content', 'banks');

function resolveFromRoot(targetPath: string) {
  const root = process.cwd();
  return path.isAbsolute(targetPath) ? targetPath : path.join(root, targetPath);
}

function getScopes(): string[] {
  const input = process.env.SCOPE_DIRS ?? '';
  if (!input) return [DEFAULT_BANK_ROOT];
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(resolveFromRoot);
}

async function walkForItems(dir: string, out: string[]): Promise<void> {
  let entries: (string | undefined)[] = [];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (!name) continue;
    const p = path.join(dir, name);
    try {
      const stat = await fs.stat(p);
      if (stat.isDirectory()) await walkForItems(p, out);
      else if (stat.isFile() && name.endsWith('.item.json')) out.push(p);
    } catch {
      // ignore
    }
  }
}

async function loadEvidenceData(cropPath?: string): Promise<string | undefined> {
  if (!cropPath) return undefined;
  try {
    const fullPath = path.isAbsolute(cropPath) ? cropPath : path.join(process.cwd(), cropPath);
    const buffer = await fs.readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const mime = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.webp' ? 'image/webp' : ext === '.avif' ? 'image/avif' : 'image/png';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return undefined;
  }
}

export async function loadStudyItems(): Promise<StudyItem[]> {
  const scopes = getScopes();
  const files: string[] = [];
  for (const scope of scopes) {
    await walkForItems(scope, files);
  }
  files.sort((a, b) => a.localeCompare(b));
  const items: StudyItem[] = [];
  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    const json = JSON.parse(raw);
    const evidence = json.evidence ?? {};
    const dataUri = await loadEvidenceData(evidence.cropPath);
    items.push({
      id: json.id,
      stem: json.stem,
      choices: json.choices,
      key: json.key,
      rationale_correct: json.rationale_correct,
      rationale_distractors: json.rationale_distractors ?? {},
      difficulty: json.difficulty,
      los: json.los,
      evidence: {
        citation: evidence.citation,
        cropPath: evidence.cropPath,
        source_url: evidence.source_url,
        file: evidence.file,
        page: evidence.page,
        figure: evidence.figure,
        bbox: evidence.bbox,
        dataUri
      }
    });
  }
  return items;
}

export type { AnalyticsSummary };
