import type React from 'react';
import { useLocation } from 'react-router-dom';

const getPageTitle = (pathname: string) => {
  if (pathname.startsWith('/cases/')) return 'Case Detail';
  if (pathname.startsWith('/editor')) return 'SAR Editor';
  if (pathname.startsWith('/audit')) return 'Audit Timeline';
  return 'Cases Overview';
};

export const Topbar: React.FC = () => {
  const location = useLocation();

  return (
    <header className="h-[72px] bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 shadow-sm">
      <div className="flex items-baseline gap-2">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#1e3a5f]">
          {getPageTitle(location.pathname)}
        </h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end text-xs">
          <span className="font-medium text-[#1e3a5f]">Alex Rivera</span>
          <span className="text-slate-500 text-[13px]">Senior Compliance Analyst</span>
        </div>
        <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-semibold shadow-md">
          AR
        </div>
      </div>
    </header>
  );
};

