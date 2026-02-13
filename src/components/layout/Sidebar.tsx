import type React from 'react';
import { NavLink } from 'react-router-dom';

const navLinkBase =
  'flex items-center gap-2 px-6 py-3 text-sm font-medium text-slate-100 hover:bg-white/10 rounded-lg transition-colors';

const activeClass =
  'bg-blue-600 text-white shadow-[0_0_0_1px_rgba(37,99,235,0.6)]';

export const Sidebar: React.FC = () => {
  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-gradient-to-b from-[#1e3a5f] to-[#2d4a6f] text-slate-100 py-6">
      <div className="px-6 mb-8 h-20 flex flex-col justify-center">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
          ProtoMind
        </div>
        <div className="mt-1 text-base font-semibold text-white">
          SAR Narrative
        </div>
      </div>
      <nav className="space-y-1 text-sm px-4">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `${navLinkBase} ${isActive ? activeClass : ''}`
          }
        >
          <span>Cases</span>
        </NavLink>
        <NavLink
          to="/audit"
          className={({ isActive }) =>
            `${navLinkBase} ${isActive ? activeClass : ''}`
          }
        >
          <span>Audit Timeline</span>
        </NavLink>
      </nav>
    </aside>
  );
};

