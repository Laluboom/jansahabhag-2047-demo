import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, Users, Landmark } from 'lucide-react';

export interface ModeSwitcherBarProps {
  currentRoute?: 'debate' | 'assembly' | 'parliament';
  className?: string;
}

export const ModeSwitcherBar: React.FC<ModeSwitcherBarProps> = ({
  currentRoute,
  className = '',
}) => {
  const modes = [
    {
      id: 'debate' as const,
      label: 'Debate Room',
      to: '/debate-room',
      description: 'Facing benches, motion questioning & facilitator queue',
      icon: Radio,
    },
    {
      id: 'assembly' as const,
      label: 'Youth Assembly',
      to: '/assemblies/assembly_jaipur_pedestrian_2026/session',
      description: '4 functional zones, 6 deliberative stages & proposition consensus',
      icon: Users,
    },
    {
      id: 'parliament' as const,
      label: 'Youth Parliament',
      to: '/parliament',
      description: 'Apex plenary horseshoe & state delegation prototype',
      icon: Landmark,
    },
  ];

  return (
    <nav
      aria-label="Deliberative Chamber Mode Switcher"
      className={`p-2 rounded-2xl bg-slate-900 text-white shadow-sm border border-slate-800 ${className}`}
      data-testid="chamber-mode-switcher"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 px-2 py-1">
        <div className="text-xs">
          <span className="text-[10px] uppercase font-bold tracking-wider text-civic-saffron-400 block font-mono">
            V2 Chamber Navigation
          </span>
          <span className="font-semibold text-slate-200">
            Deliberative Formats & Seating
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="tablist">
          {modes.map((mode) => {
            const isActive = currentRoute === mode.id;
            const Icon = mode.icon;

            return (
              <Link
                key={mode.id}
                to={mode.to}
                role="tab"
                aria-selected={isActive}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all motion-reduce:transition-none ${
                  isActive
                    ? 'bg-civic-indigo-600 text-white shadow-xs border border-civic-indigo-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
                }`}
                data-testid={`mode-switch-${mode.id}`}
                title={mode.description}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{mode.label}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
