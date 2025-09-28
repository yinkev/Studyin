import { NextResponse } from 'next/server';
import { loadBlueprint } from '../../../../lib/getBlueprint';
import { loadStudyItems } from '../../../../lib/getItems';

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed <= 0 ? fallback : parsed;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const length = parsePositiveInt(url.searchParams.get('length'), 20);
  const seedParam = url.searchParams.get('seed');
  const seed = seedParam ? Number.parseInt(seedParam, 10) : undefined;
  const bankId = url.searchParams.get('bankId') ?? undefined;

  try {
    const [blueprint, itemsResult] = await Promise.all([
      loadBlueprint(),
      loadStudyItems({ bankId, includeEvidenceDataUri: false })
    ]);

    const { buildFormGreedy, isBlueprintFeasible } = (await import(
      '../../../../scripts/lib/blueprint.mjs'
    )) as typeof import('../../../../scripts/lib/blueprint.mjs');

    const availableLength = Math.min(length, itemsResult.items.length);
    if (availableLength === 0) {
      return NextResponse.json(
        { error: 'No items available for requested bank', bankId: itemsResult.bankId },
        { status: 404 }
      );
    }

    if (!isBlueprintFeasible(blueprint, itemsResult.items, availableLength)) {
      return NextResponse.json(
        { error: 'Blueprint infeasible with current item supply', bankId: itemsResult.bankId },
        { status: 409 }
      );
    }

    const form = buildFormGreedy({
      blueprint,
      items: itemsResult.items,
      formLength: availableLength,
      seed: seed && !Number.isNaN(seed) ? seed : 1
    });

    return NextResponse.json({
      bankId: itemsResult.bankId,
      blueprint: blueprint.id,
      length: availableLength,
      items: form.map((item) => ({
        id: item.id,
        stem: item.stem,
        choices: item.choices,
        key: item.key,
        difficulty: item.difficulty,
        los: item.los,
        status: item.status,
        rationale_correct: item.rationale_correct,
        rationale_distractors: item.rationale_distractors
      }))
    });
  } catch (error) {
    console.error('Exam form API error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
