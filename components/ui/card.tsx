import * as React from 'react';
import { cn } from './utils';

const baseSurface =
  'rounded-2xl border border-white/10 bg-white/5 text-slate-100 shadow-[0_12px_40px_-20px_rgba(14,116,144,0.45)] backdrop-blur-sm';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(baseSurface, className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-white/10 px-5 py-4 text-sm font-semibold text-white', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4 text-sm text-slate-200/90', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-t border-white/10 px-5 py-3 text-xs uppercase tracking-wide text-slate-300/90', className)} {...props} />;
}
