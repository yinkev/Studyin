import type { CandidateScore } from "./types";

export function buildWhyThisNext(
  signals: CandidateScore,
  extras: { thetaHat: number; se: number; masteryProb: number }
): string {
  const parts = [
    `Info ${signals.info.toFixed(2)}`,
    `Blueprint×${signals.blueprintMultiplier.toFixed(2)}`,
    `Exposure×${signals.exposureMultiplier.toFixed(2)}`,
    `Fatigue×${signals.fatigueScalar.toFixed(2)}`,
    `Median ${signals.medianTimeSeconds.toFixed(1)}s`,
    `θ̂=${extras.thetaHat.toFixed(2)}`,
    `SE=${extras.se.toFixed(2)}`,
    `Mastery=${extras.masteryProb.toFixed(2)}`
  ];
  return parts.join(" · ");
}
