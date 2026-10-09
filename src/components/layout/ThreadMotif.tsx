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
        'relative flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-civic-indigo-50 via-civic-teal-50 to-civic-saffron-50 border border-slate-200/80 shadow-2xs overflow-hidden',
        className
      )}
      aria-label="Evidence to Action Pathway"
    >
      <div className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 rounded-lg bg-civic-indigo-600 text-white flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-900 font-heading block">
            Evidence-to-Action Thread
          </span>
          <span className="text-[11px] text-slate-600 hidden sm:inline">
            Aarav's Jaipur Pedestrian Safety Pathway
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-1 max-w-xl justify-end">
        {stages.map((st, idx) => {
          const isCurrent = st.key === currentStage;
          return (
            <React.Fragment key={st.key}>
              <div
                className={cn(
                  'px-2 py-1 rounded-md text-[11px] font-medium transition-all',
                  isCurrent
                    ? 'bg-civic-indigo-600 text-white font-semibold shadow-xs ring-2 ring-civic-indigo-300'
                    : 'bg-white/80 text-slate-700 border border-slate-200'
                )}
              >
                <span className="hidden md:inline">{st.label}</span>
                <span className="md:hidden">{idx + 1}</span>
              </div>
              {idx < stages.length - 1 && (
                <div className="w-2 sm:w-4 h-[2px] bg-slate-300" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
