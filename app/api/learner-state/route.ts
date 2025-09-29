import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JsonLearnerStateRepository } from '../../../services/state/jsonRepository';

const repository = new JsonLearnerStateRepository();

const querySchema = z.object({
  learnerId: z.string().min(1, 'learnerId is required')
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
