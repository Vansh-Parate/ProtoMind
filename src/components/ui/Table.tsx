import type React from 'react';
import { clsx } from 'clsx';

export const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="overflow-hidden border border-slate-200 rounded-card bg-white shadow-card table-container">
    <table className="min-w-full">{children}</table>
  </div>
);

export const THead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead className="bg-slate-50 border-b border-slate-200">
    {children}
  </thead>
);

export const TBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="bg-white">{children}</tbody>
);

export const TR: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className }) => (
  <tr
    onClick={onClick}
    className={clsx(
      'cursor-pointer hover:bg-slate-50/80 hover:border-l-[3px] hover:border-l-[#1e3a5f] even:bg-slate-50/50 table-row transition-colors',
      className
    )}
  >
    {children}
  </tr>
);

export const TH: React.FC<{
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
}> = ({ children, align = 'left' }) => (
  <th
    className={clsx(
      'px-5 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.1em] text-left select-none table-header',
      {
        'text-right': align === 'right',
        'text-center': align === 'center'
      }
    )}
  >
    {children}
  </th>
);

export const TD: React.FC<{
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
}> = ({ children, align = 'left' }) => (
  <td
    className={clsx('px-5 py-5 text-sm text-slate-700 border-b border-slate-100 table-cell', {
      'text-right': align === 'right',
      'text-center': align === 'center'
    })}
  >
    {children}
  </td>
);

