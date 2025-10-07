import * as React from 'react';
import { cn } from './utils';

const baseSurface = 'duo-card';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(baseSurface, className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-b border-gray-200 px-5 py-4 text-sm font-semibold text-gray-900', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4 text-sm text-gray-700', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('border-t border-gray-200 px-5 py-3 text-xs uppercase tracking-wide text-gray-500', className)} {...props} />;
}
