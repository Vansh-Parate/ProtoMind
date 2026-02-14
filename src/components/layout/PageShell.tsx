import type React from 'react';
import { Sidebar } from './Sidebar';

export const PageShell: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  return (
    <div className="flex min-h-screen bg-bg-main overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="max-w-[1200px] mx-auto px-12 py-14">
          {children}
        </div>
      </main>
    </div>
  );
};
