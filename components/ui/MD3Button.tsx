"use client";

import React from "react";

type Variant = "filled" | "outlined" | "text" | "elevated" | "tonal";

export interface MD3ButtonProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "color"> {
  variant?: Variant;
  disabled?: boolean;
  /** Optional icon placed before label */
  startIcon?: React.ReactNode;
  /** Optional icon placed after label */
  endIcon?: React.ReactNode;
}

function tagForVariant(variant: Variant) {
  switch (variant) {
    case "outlined":
      return "md-outlined-button" as const;
    case "text":
      return "md-text-button" as const;
    case "elevated":
      return "md-elevated-button" as const;
    case "tonal":
      return "md-filled-tonal-button" as const;
    case "filled":
    default:
      return "md-filled-button" as const;
  }
}

/**
 * MD3Button — React-friendly wrapper over Material Web buttons.
 * Maps variant to the appropriate custom element and exposes icon slots.
 */
export function MD3Button({
  variant = "filled",
  disabled,
  startIcon,
  endIcon,
  children,
  className,
  ...rest
}: MD3ButtonProps) {
  const Tag: any = tagForVariant(variant);
  return (
    <Tag disabled={disabled} className={className} {...(rest as any)}>
      {startIcon ? <span slot="icon">{startIcon}</span> : null}
      {children}
      {endIcon ? <span slot="trailing-icon">{endIcon}</span> : null}
    </Tag>
  );
}

export default MD3Button;
