'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { LearnerState } from '../server/study-state';

export const learnerStateKeys = {
  all: ['learner-state'] as const,
  detail: (learnerId: string) => [...learnerStateKeys.all, learnerId] as const
};

async function fetchLearnerState(learnerId: string): Promise<LearnerState> {
  const params = new URLSearchParams({ learnerId });
  const response = await fetch(`/api/learner-state?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
  });
  if (!response.ok) {
    throw new Error('Failed to load learner state');
  }
  const data = (await response.json()) as { learnerState: LearnerState };
  return data.learnerState;
}

function cloneLearnerState(state: LearnerState): LearnerState {
  return {
    learnerId: state.learnerId,
    updatedAt: state.updatedAt,
    los: Object.fromEntries(
      Object.entries(state.los).map(([loId, value]) => [
        loId,
        {
          ...value,
          recentSes: Array.isArray(value.recentSes) ? [...value.recentSes] : []
        }
      ])
    ),
    items: Object.fromEntries(
      Object.entries(state.items).map(([itemId, value]) => [
        itemId,
        {
          ...value,
          recentAttempts: Array.isArray(value.recentAttempts) ? [...value.recentAttempts] : undefined
        }
      ])
    ),
    retention: Object.fromEntries(
      Object.entries(state.retention).map(([itemId, card]) => [
        itemId,
        {
          ...card
        }
      ])
    )
  } satisfies LearnerState;
}

type Setter = LearnerState | ((previous: LearnerState) => LearnerState);

export type OptimisticLearnerStateUpdate = (
  updater: (state: LearnerState) => LearnerState
) => Promise<LearnerState>;

export function useLearnerState(learnerId: string, initialState: LearnerState) {
  const queryClient = useQueryClient();
  const initialStateRef = useRef(initialState);
  const queryKey = useMemo(() => learnerStateKeys.detail(learnerId), [learnerId]);

  useEffect(() => {
    initialStateRef.current = initialState;
  }, [initialState]);

  const query = useQuery({
    queryKey,
    queryFn: () => fetchLearnerState(learnerId),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    initialData: initialState,
    initialDataUpdatedAt: Date.parse(initialState.updatedAt ?? '') || Date.now()
  });

  const setLearnerState = useCallback(
    (updater: Setter) => {
      queryClient.setQueryData(queryKey, (prev?: LearnerState) => {
        const previous = prev ?? initialStateRef.current;
        const base = cloneLearnerState(previous);
        const next =
          typeof updater === 'function' ? (updater as (value: LearnerState) => LearnerState)(base) : updater;
        initialStateRef.current = next;
        return next;
      });
    },
    [queryClient, queryKey]
  );

  const optimisticUpdate: OptimisticLearnerStateUpdate = useCallback(
    async (updater) => {
      await queryClient.cancelQueries({ queryKey });
      const current =
        (queryClient.getQueryData(queryKey) as LearnerState | undefined) ?? initialStateRef.current;
      const snapshot = cloneLearnerState(current);
      const next = updater(cloneLearnerState(current));
      queryClient.setQueryData(queryKey, next);
      initialStateRef.current = next;
      return snapshot;
    },
    [queryClient, queryKey]
  );

  const invalidateLearnerState = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    [queryClient, queryKey]
  );

  return { ...query, setLearnerState, optimisticUpdate, invalidateLearnerState };
}
