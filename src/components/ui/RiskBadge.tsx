import type React from 'react';
import type { RiskLevel } from '../../types';
import { clsx } from 'clsx';

export const RiskBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const label = level === 'HIGH' ? 'HIGH RISK' : level === 'MEDIUM' ? 'MEDIUM' : 'LOW';

  const classes = clsx(
    'inline-flex items-center px-4 py-2 rounded-lg text-[13px] font-bold tracking-[0.05em] uppercase',
    {
      'bg-[linear-gradient(135deg,#fee2e2_0%,#fecaca_100%)] text-red-800 border-2 border-red-500 border-l-[6px] shadow-[0_2px_4px_rgba(239,68,68,0.15)]':
        level === 'HIGH',
      'bg-[linear-gradient(135deg,#fef3c7_0%,#fde68a_100%)] text-amber-800 border-2 border-amber-500 border-l-[6px] shadow-[0_2px_4px_rgba(245,158,11,0.15)]':
        level === 'MEDIUM',
      'bg-[linear-gradient(135deg,#f0f9ff_0%,#e0f2fe_100%)] text-sky-900 border-2 border-sky-400 border-l-[6px] shadow-[0_2px_4px_rgba(14,165,233,0.15)]':
        level === 'LOW'
    }
  );

  return <span className={classes}>{label}</span>;
};

