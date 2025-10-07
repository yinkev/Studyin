import { ComponentPropsWithoutRef, ElementType } from 'react';

type TextVariant = 'high' | 'med' | 'low' | 'disabled';
type TextSize = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
type TextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
type TextFont = 'body' | 'display' | 'mono';

interface TextProps<T extends ElementType> {
  as?: T;
  variant?: TextVariant;
  size?: TextSize;
  weight?: TextWeight;
  font?: TextFont;
  className?: string;
  children: React.ReactNode;
}

const sizeStyles: Record<TextSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
  '4xl': 'text-4xl',
  '5xl': 'text-5xl',
};

const variantStyles: Record<TextVariant, string> = {
  high: 'text-text-high',
  med: 'text-text-med',
  low: 'text-text-low',
  disabled: 'text-text-disabled',
};

const weightStyles: Record<TextWeight, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

const fontStyles: Record<TextFont, string> = {
  body: 'font-sans',
  display: 'font-sans tracking-tight',
  mono: 'font-mono',
};

export function Text<T extends ElementType = 'p'>(
  { as, variant = 'high', size = 'base', weight = 'regular', font = 'body', className = '', children, ...props }: TextProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof TextProps<T>>
) {
  const Component = (as ?? 'p') as ElementType;

  return (
    <Component
      className={`${sizeStyles[size]} ${variantStyles[variant]} ${weightStyles[weight]} ${fontStyles[font]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
