import type React from 'react';
import { clsx } from 'clsx';

export const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="w-full">
    <table className="w-full text-left border-collapse">{children}</table>
  </div>
);

export const THead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <thead>{children}</thead>
);

export const TBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tbody className="text-sm">{children}</tbody>
);

export const TR: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}> = ({ children, onClick, className }) => (
  <tr
    onClick={onClick}
    className={clsx(
      'group hover:bg-bg-hover transition-colors cursor-pointer',
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
      'py-4 px-6 text-[11px] uppercase tracking-wider font-medium text-text-secondary border-b border-border-light',
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
  colSpan?: number;
  className?: string;
}> = ({ children, align = 'left', colSpan, className }) => (
  <td
    colSpan={colSpan}
    className={clsx(
      'py-5 px-6 border-b border-border-light text-text-primary',
      {
        'text-right': align === 'right',
        'text-center': align === 'center'
      },
      className
    )}
  >
    {children}
  </td>
);
