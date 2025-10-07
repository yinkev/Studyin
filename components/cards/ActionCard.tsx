'use client';

import { BentoCard } from '../layout/BentoCard';
import { Button } from '@mantine/core';
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
      <div className="flex flex-col h-full justify-between p-6">
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
        <Button
          fullWidth
          size="lg"
          className="clinical-button font-bold shadow-clinical-md hover:shadow-clinical-lg transition-all"
          leftSection={buttonIcon}
          onClick={onAction}
        >
          {buttonText}
        </Button>
      </div>
    </BentoCard>
  );
}
