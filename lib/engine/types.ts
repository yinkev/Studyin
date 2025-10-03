export interface CandidateScore {
  itemId: string;
  loIds: string[];
  utility: number;
  info: number;
  blueprintMultiplier: number;
  exposureMultiplier: number;
  fatigueScalar: number;
  medianTimeSeconds: number;
}

