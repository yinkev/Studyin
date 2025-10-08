"use client";

import React from "react";

export interface MD3ProgressProps extends React.HTMLAttributes<HTMLElement> {
  /** 0-100 value; omit for indeterminate */
  value?: number;
  fourColor?: boolean;
}

/**
 * MD3Progress — Linear progress bar using Material Web.
 */
export function MD3Progress({ value, fourColor, className, ...rest }: MD3ProgressProps) {
  const clamped = typeof value === "number" ? Math.max(0, Math.min(100, value)) : undefined;
  const normalized = typeof clamped === "number" ? clamped / 100 : undefined;
  return (
    <md-linear-progress
      className={className as any}
      value={normalized as any}
      {...(fourColor ? ({ fourColor: true } as any) : {})}
      {...(rest as any)}
    />
  );
}

export default MD3Progress;
