import type React from 'react';
import type { CaseStatus } from '../../types';
import { clsx } from 'clsx';

export const StatusDot: React.FC<{
  status: CaseStatus;
  variant?: 'default' | 'light';
}> = ({ status, variant = 'default' }) => {
  const label =
    status === 'PENDING' ? 'Pending' :
      status === 'APPROVED' ? 'Approved' :
        'Rejected';

  const dotClass = clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', {
    'bg-muted-warning status-pending-dot': status === 'PENDING',
    'bg-muted-success': status === 'APPROVED',
    'bg-muted-neutral': status === 'REJECTED',
  });

  return (
    <div className="flex items-center gap-2">
      <div className={dotClass} />
      <span className="text-text-secondary text-sm">{label}</span>
    </div>
  );
};
