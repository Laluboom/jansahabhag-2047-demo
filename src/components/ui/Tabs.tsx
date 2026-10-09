import React from 'react';
import { cn } from '../../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn('flex border-b border-slate-200 overflow-x-auto no-scrollbar', className)}>
      <nav className="flex space-x-2" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 py-3 px-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 rounded-t-lg',
                isActive
                  ? 'border-civic-indigo-600 text-civic-indigo-600 font-semibold bg-civic-indigo-50/40'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                    isActive ? 'bg-civic-indigo-100 text-civic-indigo-800' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
