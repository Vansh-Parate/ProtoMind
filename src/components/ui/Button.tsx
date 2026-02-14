import type React from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}

const baseClasses =
  'relative inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-text-primary text-white hover:opacity-90 active:opacity-100',
  secondary:
    'bg-white text-text-primary border border-border-light hover:bg-bg-hover active:bg-gray-100',
  ghost:
    'bg-transparent text-text-secondary hover:text-text-primary hover:bg-bg-hover active:bg-gray-100',
  success:
    'bg-white text-muted-success border border-muted-success hover:bg-muted-successBg active:bg-muted-successBg/80',
  danger:
    'bg-white text-muted-danger border border-muted-danger hover:bg-muted-dangerBg active:bg-muted-dangerBg/80',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-5 py-2.5',
  lg: 'text-sm px-5 py-2.5',
};

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={clsx('animate-spin', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <Spinner className="h-4 w-4" />
        </span>
      )}
      {!loading && icon && (
        <span className="shrink-0 [&>svg]:size-4 [&>svg]:shrink-0" aria-hidden>
          {icon}
        </span>
      )}
      <span className={loading ? 'invisible' : undefined}>{children}</span>
    </button>
  );
};
