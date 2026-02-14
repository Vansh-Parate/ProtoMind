import type React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className }) => (
  <section
    className={clsx(
      'bg-white border border-border-light rounded-card p-6',
      className
    )}
  >
    {children}
  </section>
);
