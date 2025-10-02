"use client";
import * as React from 'react';

export interface WhySignals {
  info: number;
  blueprintMult: number;
  exposureMult: number;
  fatigue: number;
  medianSec: number;
  thetaHat: number;
  se: number;
  masteryProb: number;
  loIds: string[];
  itemId: string;
}

export function WhyThisNextPill({ signals, onClick }: { signals: WhySignals; onClick?: () => void }) {
  const parts = [
    { label: 'Info', value: signals.info.toFixed(2), key: 'info' },
    { label: 'Blueprint×', value: signals.blueprintMult.toFixed(2), key: 'blueprint' },
    { label: 'Exposure×', value: signals.exposureMult.toFixed(2), key: 'exposure' },
    { label: 'Median', value: `${signals.medianSec.toFixed(0)}s`, key: 'median' },
    { label: 'θ̂', value: signals.thetaHat.toFixed(2), key: 'theta' },
    { label: 'SE', value: signals.se.toFixed(2), key: 'se' },
    { label: 'Mastery', value: signals.masteryProb.toFixed(2), key: 'mastery' }
  ];

  const aria = `Why this next for ${signals.itemId}: ` +
    parts.map((p) => `${p.label}${p.label.endsWith('×') ? '' : '='}${p.value}`).join(', ');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      }}
      aria-label={aria}
      className="flex flex-wrap items-center gap-2"
    >
      {parts.map((p) => (
        <span
          key={p.key}
          className="okc-pill"
          data-why-next={p.key}
          title={`${p.label}${p.label.endsWith('×') ? '' : ' = '}${p.value}`}
        >
          <span className="opacity-70">{p.label}</span>
          <span>{p.value}</span>
        </span>
      ))}
    </div>
  );
}

