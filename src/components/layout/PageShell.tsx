import type React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const PageShell: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 px-4 md:px-8 py-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

