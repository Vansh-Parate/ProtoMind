import type React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'solar:chart-square-linear', end: true },
  { to: '/cases', label: 'Cases', icon: 'solar:folder-with-files-linear', end: false },
  { to: '/audit', label: 'Audit Timeline', icon: 'solar:history-linear', end: false },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-60 flex-shrink-0 bg-bg-sidebar border-r border-border-light h-screen sticky top-0 flex flex-col pt-10 px-6">
      {/* Top: Barclays Logo */}
      <div className="px-2">
        <div className="flex items-center gap-2.5">
          <img src="/barclays-eagle.svg" alt="Barclays" className="h-6 w-auto" style={{ filter: 'brightness(0) saturate(100%) invert(16%) sepia(12%) saturate(913%) hue-rotate(169deg) brightness(95%) contrast(92%)' }} />
          <img src="/barclays-wordmark.svg" alt="Barclays" className="h-5 w-auto" style={{ filter: 'brightness(0) saturate(100%) invert(16%) sepia(12%) saturate(913%) hue-rotate(169deg) brightness(95%) contrast(92%)' }} />
        </div>
      </div>

      {/* SAR Narrative – between logo and navbar */}
      <p className="mt-1 ml-8 mb-4 px-2 text-[0.85rem] font-medium tracking-wide" style={{ color: '#0F766E' }}>
        SAR Narrative
      </p>

      {/* Navigation */}
      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-primary bg-white rounded-md border border-border-light shadow-card'
                : 'flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors group'
            }
          >
            {({ isActive }) => (
              <>
                <iconify-icon
                  icon={item.icon}
                  width="18"
                  class={isActive ? 'text-text-primary' : 'text-text-tertiary group-hover:text-text-primary transition-colors'}
                />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="pb-8">
        <div className="flex items-center gap-3 px-2 py-4 border-t border-border-light">
          <div className="w-7 h-7 rounded-full bg-text-secondary/10 flex items-center justify-center text-[10px] font-medium text-text-secondary">
            AR
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-text-primary">Alex Rivera</span>
            <span className="text-[10px] text-text-tertiary">Compliance Analyst</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
