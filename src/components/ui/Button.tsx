import type React from 'react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-gradient-to-tr from-blue-600 to-blue-700 text-white shadow-[0_2px_4px_rgba(37,99,235,0.2)] hover:from-blue-700 hover:to-blue-800',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
  success:
    'bg-gradient-to-tr from-emerald-500 to-emerald-600 text-white shadow-[0_2px_4px_rgba(16,185,129,0.2)] hover:from-emerald-600 hover:to-emerald-700',
  danger:
    'bg-white text-red-600 border-2 border-red-600 hover:bg-red-50',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100'
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2.5'
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}) => {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 active:scale-[0.98] button',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
};

