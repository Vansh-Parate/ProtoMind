import type React from 'react';
import type { CaseStatus } from '../../types';
import { clsx } from 'clsx';

export const StatusDot: React.FC<{ status: CaseStatus }> = ({ status }) => {
  const dotClass =
    status === 'PENDING'
      ? 'bg-amber-500 status-pending-dot'
      : status === 'APPROVED'
      ? 'bg-emerald-600'
      : 'bg-slate-400';

  const textClass =
    status === 'PENDING'
      ? 'text-slate-700'
      : status === 'APPROVED'
      ? 'text-slate-700'
      : 'text-slate-500';

  return (
    <span className={clsx('inline-flex items-center gap-2 text-[13px] font-medium', textClass)}>
      <span className={clsx('h-2 w-2 rounded-full', dotClass)} />
      <span>{status}</span>
    </span>
  );
};

