import React from 'react';
import { cn } from '../../utils/cn';
import { ChevronDown } from 'lucide-react';

export interface DisclosureProps {
  summary: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  testId?: string;
}

export const Disclosure: React.FC<DisclosureProps> = ({
  summary,
  children,
  defaultOpen,
  className,
  testId,
}) => {
  return (
    <details
      open={defaultOpen ? true : undefined}
      className={cn(
        'group rounded-xl border border-slate-200 bg-white overflow-hidden transition-all',
        className
      )}
      data-testid={testId}
    >
      <summary className="flex items-center justify-between gap-2 p-3 sm:p-4 cursor-pointer select-none font-medium text-slate-800 hover:bg-slate-50 list-none [&::-webkit-details-marker]:hidden outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500">
        <span className="text-sm font-semibold text-slate-900">{summary}</span>
        <ChevronDown
          className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform duration-200 shrink-0 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </summary>
      <div className="px-3 pb-3 sm:px-4 sm:pb-4 pt-1 text-sm text-slate-600 border-t border-slate-100">
        {children}
      </div>
    </details>
  );
};
