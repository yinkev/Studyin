import { NextResponse } from 'next/server';
import { BlueprintDeficitError, buildExamForm } from '../../../lib/server/forms';

export const runtime = 'nodejs';

function parseBoolean(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized === '1' || normalized === 'true';
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lengthParam = url.searchParams.get('length');
  const seedParam = url.searchParams.get('seed');
  const publishedOnlyParam = url.searchParams.get('publishedOnly');

  const length = lengthParam ? Number.parseInt(lengthParam, 10) : 20;
  const seed = seedParam ? Number.parseInt(seedParam, 10) : 1;
  const publishedOnly = parseBoolean(publishedOnlyParam);

  if (!Number.isInteger(length) || length <= 0) {
    return NextResponse.json({ ok: false, error: 'length must be a positive integer' }, { status: 400 });
  }

  if (!Number.isInteger(seed) || seed <= 0) {
    return NextResponse.json({ ok: false, error: 'seed must be a positive integer' }, { status: 400 });
  }

  try {
    const form = await buildExamForm({ length, seed, publishedOnly });
    return NextResponse.json({ ok: true, form });
  } catch (error) {
    if (error instanceof BlueprintDeficitError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Blueprint infeasible for requested form',
          blueprint_id: error.blueprintId,
          deficits: error.deficits
        },
        { status: 409 }
      );
    }
    console.error({ route: 'forms', error });
    return NextResponse.json({ ok: false, error: 'Failed to build exam form' }, { status: 500 });
  }
}
