import type React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => (
  <section
    className={clsx(
      'bg-white border border-slate-200 rounded-card p-6 shadow-card hover:shadow-card-hover hover:-translate-y-[2px] hover:border-slate-300 transition-all duration-200 card',
      className
    )}
  >
    {children}
  </section>
);

