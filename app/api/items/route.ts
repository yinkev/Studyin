import { NextResponse } from 'next/server';
import { loadStudyItems, type StudyItemStatus } from '../../../lib/getItems';

export const revalidate = 0;

const VALID_STATUSES: StudyItemStatus[] = ['draft', 'review', 'published'];

function parseStatuses(searchParams: URLSearchParams): StudyItemStatus[] | undefined {
  const raw = new Set<string>();
  const multi = searchParams.getAll('status');
  multi.forEach((value) => raw.add(value));
  const commaSeparated = searchParams.get('status');
  if (commaSeparated) {
    commaSeparated.split(',').forEach((value) => raw.add(value));
  }

  const parsed = Array.from(raw)
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is StudyItemStatus => VALID_STATUSES.includes(value as StudyItemStatus));

  return parsed.length ? parsed : undefined;
}

function parseIds(searchParams: URLSearchParams): string[] | undefined {
  const values = new Set<string>();
  searchParams.getAll('id').forEach((value) => values.add(value));
  const csv = searchParams.get('ids');
  if (csv) {
    csv.split(',').forEach((value) => values.add(value));
  }
  const ids = Array.from(values)
    .map((value) => value.trim())
    .filter(Boolean);
  return ids.length ? ids : undefined;
}

function parseLimit(searchParams: URLSearchParams): number | undefined {
  const limitParam = searchParams.get('limit');
  if (!limitParam) return undefined;
  const parsed = Number.parseInt(limitParam, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return undefined;
  return parsed;
}

function parseIncludeEvidence(searchParams: URLSearchParams): boolean | undefined {
  if (!searchParams.has('includeEvidence')) return undefined;
  const raw = searchParams.get('includeEvidence');
  if (raw === null) return undefined;
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  return undefined;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const statuses = parseStatuses(searchParams);
    const ids = parseIds(searchParams);
    const limit = parseLimit(searchParams);
    const includeEvidence = parseIncludeEvidence(searchParams);

    const items = await loadStudyItems({
      statuses,
      ids,
      limit,
      includeEvidenceData: includeEvidence ?? true
    });

    return NextResponse.json(
      {
        count: items.length,
        items
      },
      {
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error) {
    console.error('items api error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
