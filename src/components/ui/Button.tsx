import type React from 'react';
import { clsx } from 'clsx';

/**
 * Enterprise-grade button for SAR / banking compliance UI.
 *
 * Variant usage:
 * - primary: Main CTA (e.g. "New Case", "Submit for review")
 * - secondary: Secondary actions (e.g. "Open SAR Editor", "Save draft")
 * - ghost: Low emphasis (e.g. "Back to Cases")
 * - success: Positive action (e.g. "Approve")
 * - danger: Destructive action (e.g. "Reject")
 *
 * Sizes: sm (32px min-height), md (40px), lg (44px touch target).
 * Use `icon` for a leading icon and `loading` for async actions.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Left-aligned icon (e.g. plus for "New Case"). Spacing is applied automatically. */
  icon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
}

const baseClasses =
  'relative inline-flex items-center justify-center gap-2 font-medium tracking-[0.025em] rounded-button transition-[color,background-color,box-shadow,border-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--button-primary-bg)] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:transition-none disabled:pointer-events-none disabled:opacity-50 select-none';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--button-primary-bg)] text-[var(--button-primary-text)] shadow-button hover:bg-[var(--button-primary-hover)] hover:shadow-button-hover active:bg-[var(--button-primary-active)] active:shadow-button',
  secondary:
    'bg-[var(--button-secondary-bg)] text-[var(--button-secondary-text)] border border-[var(--button-secondary-border)] hover:bg-[var(--button-secondary-hover-bg)] active:bg-slate-200',
  ghost:
    'bg-transparent text-[var(--button-secondary-text)] hover:bg-slate-100 active:bg-slate-200',
  success:
    'bg-[var(--button-success)] text-white shadow-button hover:bg-[var(--button-success-hover)] hover:shadow-button-hover active:bg-[var(--button-success-active)] active:shadow-button',
  danger:
    'bg-white text-[var(--button-danger)] border border-[var(--button-danger)] hover:bg-rose-50 hover:border-[var(--button-danger-hover)] active:bg-rose-100 active:border-[var(--button-danger-active)]'
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'text-[13px] leading-5 px-3 py-2 min-h-[32px]',
  md: 'text-[var(--button-font-size)] leading-[var(--button-line-height)] px-5 py-2.5 min-h-[40px]',
  lg: 'text-[15px] leading-5 px-6 py-3 min-h-[44px] min-w-[44px]'
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
