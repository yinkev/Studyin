'use client';

import { PropsWithChildren } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface GlowCardProps {
  className?: string;
  glowColor?: string;
  delayMs?: number;
  variant?: 'default' | 'comfort' | 'flow' | 'achievement' | 'safety';
}

export function GlowCard({
  className,
  glowColor,
  delayMs = 0,
  variant = 'default',
  children,
}: PropsWithChildren<GlowCardProps>) {
  const shouldReduceMotion = useReducedMotion();

  // Map variants to MD3 container roles
  const getVariantStyles = () => {
    switch (variant) {
      case 'flow':
        return {
          backgroundColor: 'var(--md-sys-color-secondary-container)',
          color: 'var(--md-sys-color-on-secondary-container)',
          border: '1px solid var(--md-sys-color-outline-variant)',
        } as const;
      case 'achievement':
        return {
          backgroundColor: 'var(--md-sys-color-primary-container)',
          color: 'var(--md-sys-color-on-primary-container)',
          border: '1px solid var(--md-sys-color-outline-variant)',
        } as const;
      case 'safety':
        return {
          backgroundColor: 'var(--md-sys-color-tertiary-container)',
          color: 'var(--md-sys-color-on-tertiary-container)',
          border: '1px solid var(--md-sys-color-outline-variant)',
        } as const;
      case 'comfort':
        return {
          backgroundColor: 'var(--md-sys-color-surface-container-high)',
          color: 'var(--md-sys-color-on-surface)',
          border: '1px solid var(--md-sys-color-outline-variant)',
        } as const;
      case 'default':
      default:
        return {
          backgroundColor: 'var(--md-sys-color-surface-container)',
          color: 'var(--md-sys-color-on-surface)',
          border: '1px solid var(--md-sys-color-outline-variant)',
        } as const;
    }
  };

  const baseStyle: React.CSSProperties = {
    borderRadius: 'var(--md-sys-shape-corner-large)',
    boxShadow: 'var(--md-sys-elevation-2)',
    overflow: 'hidden',
  };

  const paddingStyle: React.CSSProperties = {
    padding: '1.5rem',
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? {} : { opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: delayMs / 1000, ease: [0.19, 1, 0.22, 1] }}
      className={className}
      style={{ ...baseStyle, ...getVariantStyles(), ...(glowColor ? { boxShadow: `0 4px 24px ${glowColor}` } : {}) }}
    >
      <div style={paddingStyle}>{children}</div>
    </motion.div>
  );
}

export default GlowCard;
