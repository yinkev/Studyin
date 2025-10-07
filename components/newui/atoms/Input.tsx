import { forwardRef, InputHTMLAttributes } from 'react';

type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  size?: InputSize;
  error?: boolean;
}

const sizeStyles: Record<InputSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3 text-lg',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', error = false, className = '', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-xl border bg-surface-bg0/80 text-text-high placeholder:text-text-med shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light ${sizeStyles[size]} ${error ? 'border-semantic-danger' : 'border-text-low/20'} ${className}`}
      {...props}
    />
  );
});
