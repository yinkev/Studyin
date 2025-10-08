"use client";

import React from "react";

export interface MD3CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: keyof JSX.IntrinsicElements;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  interactive?: boolean;
}

/**
 * MD3Card — lightweight container styled with MD3 tokens.
 * Uses surface container colors, shape, and elevation utilities from globals-md3.css.
 */
export function MD3Card({
  as = "div",
  elevation = 1,
  interactive = false,
  className = "",
  style,
  children,
  ...rest
}: MD3CardProps) {
  const Element: any = as;
  const elevationClass = `md3-elevation-${elevation}`;
  const interactiveClass = interactive ? "interactive-card" : "";

  return (
    <Element
      className={`md3-surface-container md3-shape-large md3-card ${elevationClass} ${interactiveClass} ${className}`}
      style={style}
      {...rest}
    >
      {children}
    </Element>
  );
}

export default MD3Card;

