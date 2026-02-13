import type React from 'react';
import type { RiskLevel } from '../../types';
import { clsx } from 'clsx';

export const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const label = level === 'HIGH' ? 'High' : level === 'MEDIUM' ? 'Medium' : 'Low';

  const dotClass = clsx('shrink-0 h-2 w-2 rounded-full', {
    'bg-emerald-600': level === 'LOW',
    'bg-amber-600': level === 'MEDIUM',
    'bg-rose-600': level === 'HIGH'
  });

  const wrapperClass = clsx(
    'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] font-medium border border-slate-200/80 bg-white',
    {
      'text-slate-700 border-l-[3px] border-l-emerald-600': level === 'LOW',
      'text-slate-700 border-l-[3px] border-l-amber-600': level === 'MEDIUM',
      'text-slate-700 border-l-[3px] border-l-rose-600': level === 'HIGH'
    }
  );

  return (
    <span className={wrapperClass}>
      <span className={dotClass} aria-hidden />
      <span>{label}</span>
    </span>
  );
};
