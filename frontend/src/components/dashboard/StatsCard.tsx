/**
 * StatsCard - Reusable metric display component
 * NO GRADIENTS - solid colors with hover effects
 */

import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle: string;
  color: string;
  className?: string;
}

export function StatsCard({ icon, label, value, subtitle, color, className }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Card className={cn("glass h-full", className)}>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className={cn("w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center", color)}>
              {icon}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className={cn("text-3xl font-bold mt-1", color)}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
