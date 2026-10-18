import React from 'react';
import { cn } from '../../utils/cn';
import { Sparkles } from 'lucide-react';

interface ThreadMotifProps {
  currentStage?: 'learn' | 'evidence' | 'deliberate' | 'action' | 'passport';
  className?: string;
}

export const ThreadMotif: React.FC<ThreadMotifProps> = ({ currentStage = 'evidence', className }) => {
  const stages = [
    { key: 'learn', label: '1. Learn' },
    { key: 'evidence', label: '2. Field Evidence' },
    { key: 'deliberate', label: '3. Youth Assembly' },
    { key: 'action', label: '4. Civic Action' },
    { key: 'passport', label: '5. Passport' },
  ];

  return (
    <div
      className={cn(
        'relative flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200/80 bg-gradient-to-r from-civic-indigo-50 via-civic-teal-50 to-civic-saffron-50 p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between',
        className
      )}
      aria-label="Evidence to Action Pathway"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-civic-indigo-600 text-white flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-900 font-heading block">
            Evidence-to-Action Thread
          </span>
          <span className="text-[11px] text-slate-600 hidden sm:inline">
            Aarav's Jaipur Pedestrian Safety Pathway
          </span>
        </div>
      </div>

      <div className="grid w-full min-w-0 grid-cols-5 gap-2 lg:max-w-2xl">
        {stages.map((st, idx) => {
          const isCurrent = st.key === currentStage;
          return (
              <div key={st.key}
                className={cn(
                  'flex min-h-9 min-w-0 items-center justify-center rounded-md px-2 py-2 text-center text-[11px] font-medium leading-tight break-words transition-colors',
                  isCurrent
                    ? 'bg-civic-indigo-600 text-white font-semibold shadow-xs ring-2 ring-civic-indigo-300'
                    : 'bg-white/80 text-slate-700 border border-slate-200'
                )}
              >
                <span className="hidden md:inline">{st.label}</span>
                <span className="md:hidden">{idx + 1}</span>
              </div>
          );
        })}
      </div>
    </div>
  );
};
