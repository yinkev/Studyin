import { NextResponse } from 'next/server';
import {
  ItemBankNotFoundError,
  type ItemDifficulty,
  type ItemStatus,
  loadStudyItems
} from '../../../lib/getItems';

function parseList(searchParams: URLSearchParams, key: string): string[] | undefined {
  const values = searchParams.getAll(key);
  if (!values.length) {
    const single = searchParams.get(key);
    if (!single) return undefined;
    values.push(single);
  }
  const expanded = values
    .flatMap((value) => value.split(',').map((entry) => entry.trim()))
    .filter((value) => value.length > 0);
  return expanded.length ? expanded : undefined;
}

const DIFFICULTY_SET = new Set<ItemDifficulty>(['easy', 'medium', 'hard']);
const STATUS_SET = new Set<ItemStatus>(['draft', 'review', 'published']);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const bankId = searchParams.get('bankId') ?? undefined;
  const los = parseList(searchParams, 'los');
  const difficultiesRaw = parseList(searchParams, 'difficulty');
  const difficulties = difficultiesRaw
    ?.filter((value): value is ItemDifficulty => DIFFICULTY_SET.has(value as ItemDifficulty));
  const statusRaw = parseList(searchParams, 'status');
  const status = statusRaw?.filter((value): value is ItemStatus => STATUS_SET.has(value as ItemStatus));
  const includeEvidence = searchParams.get('includeEvidence') !== 'false';
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  if (limit !== undefined && (Number.isNaN(limit) || limit < 0)) {
    return NextResponse.json({ error: 'limit must be a non-negative integer' }, { status: 400 });
  }

  try {
    const result = await loadStudyItems({
      bankId: bankId ?? undefined,
      los,
      difficulties,
      status,
      limit,
      includeEvidenceDataUri: includeEvidence
    });

    return NextResponse.json({
      bankId: result.bankId,
      total: result.total,
      count: result.items.length,
      items: result.items
    });
  } catch (error) {
    if (error instanceof ItemBankNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('Items API error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
