import { type ClassValue, clsx } from 'clsx';

/**
 * Combines class names using clsx
 * (No Tailwind merge needed - we use MD3 design system!)
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
