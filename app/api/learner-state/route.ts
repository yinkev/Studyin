import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JsonLearnerStateRepository } from '../../../services/state/jsonRepository';
import { LearnerState, RetentionCard, createDefaultLoState } from '../../../lib/server/study-state';

const repository = new JsonLearnerStateRepository();

const querySchema = z.object({
  learnerId: z.string().min(1, 'learnerId is required')
});

const patchSchema = z.object({
  learnerId: z.string().min(1, 'learnerId is required'),
  learnerState: z.record(z.any())
});

type RawLearnerState = Record<string, unknown> & {
  learnerId?: unknown;
  updatedAt?: unknown;
  los?: Record<string, unknown>;
  items?: Record<string, unknown>;
  retention?: Record<string, unknown>;
};

function normaliseLearnerState(raw: RawLearnerState, learnerId: string): LearnerState {
  const losEntries = Object.entries(raw.los ?? {});
  const los: LearnerState['los'] = {};
  for (const [loId, value] of losEntries) {
    const partial = (typeof value === 'object' && value) ? (value as Record<string, unknown>) : {};
    const base = createDefaultLoState();
    const recentSesSource = Array.isArray(partial.recentSes) ? partial.recentSes : [];
    los[loId] = {
      thetaHat: typeof partial.thetaHat === 'number' && Number.isFinite(partial.thetaHat) ? partial.thetaHat : base.thetaHat,
      se: typeof partial.se === 'number' && Number.isFinite(partial.se) ? partial.se : base.se,
      itemsAttempted:
        typeof partial.itemsAttempted === 'number' && Number.isFinite(partial.itemsAttempted)
          ? Math.max(0, Math.floor(partial.itemsAttempted))
          : base.itemsAttempted,
      recentSes: recentSesSource
        .map((entry) => (typeof entry === 'number' ? entry : Number(entry)))
        .filter((entry) => Number.isFinite(entry))
        .slice(-10),
      lastProbeDifficulty:
        typeof partial.lastProbeDifficulty === 'number' && Number.isFinite(partial.lastProbeDifficulty)
          ? partial.lastProbeDifficulty
          : undefined,
      masteryConfirmed: typeof partial.masteryConfirmed === 'boolean' ? partial.masteryConfirmed : undefined,
      priorMu: typeof partial.priorMu === 'number' && Number.isFinite(partial.priorMu) ? partial.priorMu : base.priorMu,
      priorSigma:
        typeof partial.priorSigma === 'number' && Number.isFinite(partial.priorSigma)
          ? partial.priorSigma
          : base.priorSigma
    } satisfies LearnerState['los'][string];
  }

  const itemsEntries = Object.entries(raw.items ?? {});
  const items: LearnerState['items'] = {};
  for (const [itemId, value] of itemsEntries) {
    const partial = (typeof value === 'object' && value) ? (value as Record<string, unknown>) : {};
    const attempts = typeof partial.attempts === 'number' && Number.isFinite(partial.attempts) ? partial.attempts : 0;
    const correct = typeof partial.correct === 'number' && Number.isFinite(partial.correct) ? partial.correct : 0;
    const recentAttemptsRaw = Array.isArray(partial.recentAttempts) ? partial.recentAttempts : [];
    items[itemId] = {
      attempts: Math.max(0, Math.floor(attempts)),
      correct: Math.max(0, Math.floor(correct)),
      lastAttemptTs:
        typeof partial.lastAttemptTs === 'number' && Number.isFinite(partial.lastAttemptTs)
          ? partial.lastAttemptTs
          : undefined,
      recentAttempts: recentAttemptsRaw
        .map((entry) => (typeof entry === 'number' ? entry : Number(entry)))
        .filter((entry) => Number.isFinite(entry))
        .slice(-20)
    };
  }

  const retentionEntries = Object.entries(raw.retention ?? {});
  const retention: Record<string, RetentionCard> = {};
  for (const [itemId, value] of retentionEntries) {
    const partial = (typeof value === 'object' && value) ? (value as Record<string, unknown>) : {};
    const loIds = Array.isArray(partial.loIds)
      ? partial.loIds.filter((entry): entry is string => typeof entry === 'string')
      : [];
    const halfLifeHours =
      typeof partial.halfLifeHours === 'number' && Number.isFinite(partial.halfLifeHours)
        ? Math.max(partial.halfLifeHours, 1 / 60)
        : 12;
    const nextReviewMs =
      typeof partial.nextReviewMs === 'number' && Number.isFinite(partial.nextReviewMs)
        ? partial.nextReviewMs
        : Date.now() + 12 * 60 * 60 * 1000;
    const lastReviewMs =
      typeof partial.lastReviewMs === 'number' && Number.isFinite(partial.lastReviewMs)
        ? partial.lastReviewMs
        : undefined;
    const lapses =
      typeof partial.lapses === 'number' && Number.isFinite(partial.lapses)
        ? Math.max(0, Math.floor(partial.lapses))
        : undefined;

    retention[itemId] = { loIds, halfLifeHours, nextReviewMs, lastReviewMs, lapses };
  }

  return {
    learnerId,
    updatedAt: new Date().toISOString(),
    los,
    items,
    retention
  } satisfies LearnerState;
}

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
  if (typeof learnerState !== 'object' || learnerState === null) {
    return NextResponse.json({ error: 'Invalid learner state payload' }, { status: 422 });
  }

  if (typeof (learnerState as RawLearnerState).learnerId === 'string' && (learnerState as RawLearnerState).learnerId !== learnerId) {
    return NextResponse.json({ error: 'learnerId mismatch' }, { status: 422 });
  }

  const normalised = normaliseLearnerState(learnerState as RawLearnerState, learnerId);
  const saved = await repository.save(learnerId, normalised);
  return NextResponse.json({ learnerState: saved });
}
