import { ButtonHTMLAttributes, ReactNode } from 'react';

type IconButtonVariant = 'primary' | 'ghost' | 'danger';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  children: ReactNode;
}

const variantStyles: Record<IconButtonVariant, string> = {
  primary: 'bg-brand-light text-surface-bg0 hover:bg-brand-light/90',
  ghost: 'bg-transparent border border-text-low/20 text-text-high hover:bg-surface-bg2/60',
  danger: 'bg-semantic-danger text-surface-bg0 hover:bg-semantic-danger/85',
};

const sizeStyles: Record<IconButtonSize, string> = {
  sm: 'h-9 w-9 text-sm',
  md: 'h-11 w-11 text-base',
  lg: 'h-12 w-12 text-lg',
};

export function IconButton({ variant = 'primary', size = 'md', className = '', children, ...props }: IconButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
