import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JsonLearnerStateRepository } from '../../../services/state/jsonRepository';
import { learnerStateSchema, normaliseLearnerState } from '../../../lib/server/study-state';

const repository = new JsonLearnerStateRepository();

const querySchema = z.object({
  learnerId: z.string().min(1, 'learnerId is required')
});

const patchSchema = z
  .object({
    learnerId: z.string().min(1, 'learnerId is required'),
    learnerState: learnerStateSchema
  })
  .refine((value) => value.learnerState.learnerId === value.learnerId, {
    message: 'learnerId mismatch',
    path: ['learnerState', 'learnerId']
  });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parseResult = querySchema.safeParse({ learnerId: searchParams.get('learnerId') ?? '' });
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid learnerId', issues: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const learnerState = await repository.load(parseResult.data.learnerId);
  return NextResponse.json({ learnerState });
}

export async function PATCH(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const parseResult = patchSchema.safeParse(payload);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Invalid learner state', issues: parseResult.error.flatten() },
      { status: 422 }
    );
  }

  const { learnerId, learnerState } = parseResult.data;
  const normalised = normaliseLearnerState(learnerState, learnerId);
  await repository.save(normalised);
  return NextResponse.json({ learnerState: normalised });
}
