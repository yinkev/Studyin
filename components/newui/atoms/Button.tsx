import { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'lg' | 'md' | 'sm';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand-light text-surface-bg0 hover:bg-brand-light/90',
  secondary: 'bg-brand-secondary text-surface-bg0 hover:bg-brand-secondary/90',
  ghost: 'bg-transparent border border-text-low/25 text-text-high hover:bg-surface-bg2/60',
  danger: 'bg-semantic-danger text-surface-bg0 hover:bg-semantic-danger/90',
};

const sizeStyles: Record<ButtonSize, string> = {
  lg: 'px-6 py-3 text-lg',
  md: 'px-5 py-2.5 text-base',
  sm: 'px-4 py-2 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  const loadingLabel = typeof children === 'string' ? children : 'Loading';

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light disabled:opacity-60 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? <span className="animate-pulse">{loadingLabel}</span> : children}
    </button>
  );
}
