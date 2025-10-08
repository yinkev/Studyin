'use client';

import { BentoCard } from '../layout/BentoCard';
import { ReactNode } from 'react';

interface ActionCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  buttonText: string;
  buttonIcon?: ReactNode;
  onAction: () => void;
  gradient?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ActionCard({
  title,
  description,
  icon,
  buttonText,
  buttonIcon,
  onAction,
  gradient = false,
  size = 'md',
}: ActionCardProps) {
  return (
    <BentoCard
      size={size}
      accent="primary"
      className={gradient ? 'bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10' : ''}
    >
      <div className="md3-surface-container md3-elevation-1 md3-shape-large md3-card interactive-card flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl" style={{ background: 'var(--brand-primary-alpha-10, rgba(96, 165, 250, 0.1))' }}>
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-high">{title}</h3>
              <p className="text-xs text-text-med mt-1">{description}</p>
            </div>
          </div>
        </div>
        <md-filled-button
          onClick={onAction}
          style={{ width: '100%', fontWeight: 800, padding: '0.875rem 1rem' }}
          aria-label={buttonText}
        >
          {buttonIcon ? (
            <span slot="icon" aria-hidden>
              {buttonIcon}
            </span>
          ) : null}
          {buttonText}
        </md-filled-button>
      </div>
    </BentoCard>
  );
}
