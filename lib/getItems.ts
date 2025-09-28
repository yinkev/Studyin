import { promises as fs } from 'fs';
import path from 'path';
import type { AnalyticsSummary } from './getAnalytics';

export type StudyItemStatus = 'draft' | 'review' | 'published';

export interface StudyItem {
  schema_version?: string;
  id: string;
  stem: string;
  choices: Record<'A' | 'B' | 'C' | 'D' | 'E', string>;
  key: 'A' | 'B' | 'C' | 'D' | 'E';
  rationale_correct: string;
  rationale_distractors: Partial<Record<'A' | 'B' | 'C' | 'D' | 'E', string>>;
  difficulty: 'easy' | 'medium' | 'hard';
  bloom?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
  los: string[];
  tags?: string[];
  status?: StudyItemStatus;
  rubric_score?: number;
  author_ids?: string[];
  reviewer_ids?: string[];
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

export interface LoadStudyItemsOptions {
  /** Limit returned items to specific workflow statuses (draft/review/published). */
  statuses?: StudyItemStatus[];
  /** Optional hard cap on the number of items returned. */
  limit?: number;
  /**
   * Whether to embed evidence crops as base64 data URIs. Disable when payload size matters
   * (e.g., analytics jobs or lightweight API requests).
   */
  includeEvidenceData?: boolean;
  /** Filter down to a specific set of item identifiers. */
  ids?: string[];
}

const BANK_DIR = path.join(process.cwd(), 'content', 'banks', 'upper-limb-oms1');

async function safeReaddir(directory: string): Promise<string[]> {
  try {
    return await fs.readdir(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function loadEvidenceData(cropPath?: string): Promise<string | undefined> {
  if (!cropPath) return undefined;
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

export async function loadStudyItems(options: LoadStudyItemsOptions = {}): Promise<StudyItem[]> {
  const {
    statuses,
    limit,
    includeEvidenceData = true,
    ids
  } = options;

  const files = (await safeReaddir(BANK_DIR)).filter((file) => file.endsWith('.item.json')).sort();
  const statusFilter = statuses?.length ? new Set<StudyItemStatus>(statuses) : null;
  const idFilter = ids?.length ? new Set(ids) : null;

  const items: StudyItem[] = [];
  for (const file of files) {
    try {
      const raw = await fs.readFile(path.join(BANK_DIR, file), 'utf8');
      const json = JSON.parse(raw);
      const status = json.status as StudyItemStatus | undefined;

      if (statusFilter && (!status || !statusFilter.has(status))) {
        continue;
      }
      if (idFilter && !idFilter.has(json.id)) {
        continue;
      }

      const evidence = json.evidence ?? {};
      const dataUri = includeEvidenceData ? await loadEvidenceData(evidence.cropPath) : undefined;
      const evidencePayload =
        evidence && Object.keys(evidence).length > 0
          ? {
              citation: evidence.citation,
              cropPath: evidence.cropPath,
              source_url: evidence.source_url,
              file: evidence.file,
              page: evidence.page,
              figure: evidence.figure,
              bbox: evidence.bbox,
              dataUri
            }
          : includeEvidenceData
            ? dataUri
              ? { dataUri }
              : undefined
            : undefined;

      items.push({
        schema_version: json.schema_version,
        id: json.id,
        stem: json.stem,
        choices: json.choices,
        key: json.key,
        rationale_correct: json.rationale_correct,
        rationale_distractors: json.rationale_distractors ?? {},
        difficulty: json.difficulty,
        bloom: json.bloom,
        los: json.los,
        tags: json.tags ?? [],
        status,
        rubric_score: typeof json.rubric_score === 'number' ? json.rubric_score : undefined,
        author_ids: Array.isArray(json.author_ids) ? json.author_ids : undefined,
        reviewer_ids: Array.isArray(json.reviewer_ids) ? json.reviewer_ids : undefined,
        evidence: evidencePayload
      });

      if (limit && items.length >= limit) {
        break;
      }
    } catch (error) {
      console.error(`Failed to load study item from ${file}:`, error);
    }
  }
  return items;
}

export type { AnalyticsSummary };
