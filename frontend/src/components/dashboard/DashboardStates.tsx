/**
 * DashboardStates - Loading, Error, and Empty states
 */

import { motion } from 'motion/react';
import { TrendingUp, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { View } from '@/components/NavBar';

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      >
        <TrendingUp className="w-8 h-8 text-primary" />
      </motion.div>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-xl border-2 border-destructive/30 bg-destructive/5"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xl">⚠️</span>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-destructive mb-1">Unable to load materials</p>
          <p className="text-xs text-muted-foreground mb-3">{message}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function EmptyState({ onNavigate }: { onNavigate: (view: View) => void }) {
  return (
    <div className="py-16 text-center">
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-6xl mb-4"
      >
        📚
      </motion.div>
      <p className="text-lg font-semibold mb-2">Your library awaits!</p>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
        Start with one concise resource. Small, consistent additions build expertise without overwhelm.
      </p>
      <Button size="lg" onClick={() => onNavigate('upload')}>
        <BookOpen className="w-4 h-4 mr-2" />
        Upload First Material
      </Button>
    </div>
  );
}
