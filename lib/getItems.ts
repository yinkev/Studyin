import { promises as fs } from 'fs';
import path from 'path';
import type { AnalyticsSummary } from './getAnalytics';

export type ItemDifficulty = 'easy' | 'medium' | 'hard';
export type ItemStatus = 'draft' | 'review' | 'published';

export interface StudyItemEvidence {
  citation?: string;
  cropPath?: string;
  source_url?: string;
  file?: string;
  page?: number;
  figure?: string;
  bbox?: [number, number, number, number];
  dataUri?: string;
}

export interface StudyItem {
  id: string;
  stem: string;
  choices: Record<'A' | 'B' | 'C' | 'D' | 'E', string>;
  key: 'A' | 'B' | 'C' | 'D' | 'E';
  rationale_correct: string;
  rationale_distractors: Partial<Record<'A' | 'B' | 'C' | 'D' | 'E', string>>;
  difficulty: ItemDifficulty;
  bloom?: string;
  los: string[];
  tags?: string[];
  status: ItemStatus;
  rubric_score?: number;
  evidence?: StudyItemEvidence;
}

export interface LoadStudyItemsOptions {
  bankId?: string;
  los?: string[];
  difficulties?: ItemDifficulty[];
  status?: ItemStatus[];
  limit?: number;
  includeEvidenceDataUri?: boolean;
}

export interface LoadStudyItemsResult {
  bankId: string;
  total: number;
  items: StudyItem[];
}

export class ItemBankNotFoundError extends Error {
  constructor(public bankId: string) {
    super(`Item bank not found: ${bankId}`);
    this.name = 'ItemBankNotFoundError';
  }
}

const BANKS_ROOT = path.join(process.cwd(), 'content', 'banks');

function resolveBankDir(bankId: string): string {
  return path.join(BANKS_ROOT, bankId);
}

async function loadEvidenceData(cropPath: string | undefined, include: boolean): Promise<string | undefined> {
  if (!cropPath || !include) return undefined;
  try {
    const fullPath = path.isAbsolute(cropPath) ? cropPath : path.join(process.cwd(), cropPath);
    const buffer = await fs.readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const mime =
      ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.webp'
        ? 'image/webp'
        : ext === '.avif'
        ? 'image/avif'
        : 'image/png';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return undefined;
  }
}

const VALID_STATUSES: ItemStatus[] = ['draft', 'review', 'published'];

function normalizeStatus(status: unknown): ItemStatus {
  if (typeof status === 'string' && (VALID_STATUSES as string[]).includes(status)) {
    return status as ItemStatus;
  }
  return 'draft';
}

export async function loadStudyItems(options: LoadStudyItemsOptions = {}): Promise<LoadStudyItemsResult> {
  const {
    bankId = 'upper-limb-oms1',
    los,
    difficulties,
    status,
    limit,
    includeEvidenceDataUri = true
  } = options;

  const bankDir = resolveBankDir(bankId);
  let fileNames: string[];
  try {
    fileNames = (await fs.readdir(bankDir)).filter((file) => file.endsWith('.item.json')).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new ItemBankNotFoundError(bankId);
    }
    throw error;
  }

  const filtered: StudyItem[] = [];
  const losFilter = los && los.length ? new Set(los) : null;
  const difficultyFilter = difficulties && difficulties.length ? new Set(difficulties) : null;
  const statusFilter = status && status.length ? new Set(status) : null;

  for (const file of fileNames) {
    const raw = await fs.readFile(path.join(bankDir, file), 'utf8');
    const json = JSON.parse(raw) as Record<string, unknown>;

    const itemLos = Array.isArray(json.los) ? (json.los as string[]) : [];
    if (losFilter && !itemLos.some((lo) => losFilter.has(lo))) {
      continue;
    }

    const difficulty = json.difficulty as ItemDifficulty | undefined;
    if (difficultyFilter && (!difficulty || !difficultyFilter.has(difficulty))) {
      continue;
    }

    const itemStatus = normalizeStatus(json.status);
    if (statusFilter && !statusFilter.has(itemStatus)) {
      continue;
    }

    const evidence = (json.evidence as Record<string, unknown> | undefined) ?? {};
    const dataUri = await loadEvidenceData(evidence.cropPath as string | undefined, includeEvidenceDataUri);

    filtered.push({
      id: json.id as string,
      stem: json.stem as string,
      choices: json.choices as StudyItem['choices'],
      key: json.key as StudyItem['key'],
      rationale_correct: json.rationale_correct as string,
      rationale_distractors: (json.rationale_distractors as StudyItem['rationale_distractors']) ?? {},
      difficulty: (difficulty ?? 'medium') as ItemDifficulty,
      bloom: json.bloom as string | undefined,
      los: itemLos,
      tags: (json.tags as string[]) ?? [],
      status: itemStatus,
      rubric_score: json.rubric_score as number | undefined,
      evidence: {
        citation: evidence.citation as string | undefined,
        cropPath: evidence.cropPath as string | undefined,
        source_url: evidence.source_url as string | undefined,
        file: evidence.file as string | undefined,
        page: evidence.page as number | undefined,
        figure: evidence.figure as string | undefined,
        bbox: evidence.bbox as [number, number, number, number] | undefined,
        dataUri
      }
    });
  }

  const total = filtered.length;
  const items = typeof limit === 'number' ? filtered.slice(0, Math.max(0, limit)) : filtered;

  return { bankId, total, items };
}

export type { AnalyticsSummary };
