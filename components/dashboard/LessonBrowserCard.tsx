'use client';

import { BentoCard } from '../layout/BentoCard';
import { LessonBrowser } from './LessonBrowser';

interface LessonBrowserCardProps {
  size?: 'full' | 'xl';
}

export function LessonBrowserCard({ size = 'full' }: LessonBrowserCardProps) {
  return (
    <BentoCard size={size}>
      <div className="p-6">
        <LessonBrowser />
      </div>
    </BentoCard>
  );
}
