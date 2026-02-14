import type React from 'react';
import type { RiskLevel } from '../../types';
import { clsx } from 'clsx';

export const RiskBadge: React.FC<{
  level: RiskLevel;
  variant?: 'default' | 'light' | 'cases';
}> = ({ level, variant = 'default' }) => {
  const label = level === 'HIGH' ? 'High' : level === 'MEDIUM' ? 'Medium' : 'Low';

  if (variant === 'light' || variant === 'cases') {
    const pillClass = clsx(
      'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium',
      {
        'bg-muted-dangerBg text-muted-danger': level === 'HIGH',
        'bg-riskMediumYellow-bg text-riskMediumYellow-text': level === 'MEDIUM',
        'bg-muted-successBg text-muted-success': level === 'LOW',
      }
    );
    const dotClass = clsx(
      'w-1.5 h-1.5 rounded-full flex-shrink-0',
      level === 'HIGH' && 'bg-muted-danger/60',
      level === 'MEDIUM' && 'bg-riskMediumYellow-text',
      level === 'LOW' && 'bg-muted-success/60'
    );
    return (
      <span className={pillClass}>
        <span className={dotClass} />
        {label}
      </span>
    );
  }

  const dotColor = clsx('w-2 h-2 rounded-full flex-shrink-0', {
    'bg-muted-danger': level === 'HIGH',
    'bg-muted-warning': level === 'MEDIUM',
    'bg-muted-success': level === 'LOW',
  });

  return (
    <div className="flex items-center gap-2.5">
      <div className={dotColor} />
      <span className="text-text-primary font-medium">{label}</span>
    </div>
  );
};
