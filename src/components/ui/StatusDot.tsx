import type React from 'react';
import type { CaseStatus } from '../../types';
import { clsx } from 'clsx';

export const StatusDot: React.FC<{ status: CaseStatus }> = ({ status }) => {
  const dotClass =
    status === 'PENDING'
      ? 'bg-amber-500 status-pending-dot'
      : status === 'APPROVED'
      ? 'bg-emerald-500'
      : 'bg-slate-400';

  const textClass =
    status === 'PENDING'
      ? 'text-amber-800'
      : status === 'APPROVED'
      ? 'text-emerald-800'
      : 'text-slate-500';

  return (
    <span className={clsx('inline-flex items-center gap-2 text-[13px] font-medium', textClass)}>
      <span className={clsx('h-2.5 w-2.5 rounded-full', dotClass)} />
      <span>{status}</span>
    </span>
  );
};

