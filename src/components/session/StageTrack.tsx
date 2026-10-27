import React from 'react';
import { cn } from '../../utils/cn';

export interface StageTrackStep {
  id: string;
  label: string;        // e.g. 'Frame'
  description?: string; // e.g. 'Set the question'
}

export interface StageTrackProps {
  steps: StageTrackStep[];
  currentStepId: string;
  className?: string;
  ariaLabel?: string;   // default 'Stage progress'
}

export const StageTrack: React.FC<StageTrackProps> = ({
  steps,
  currentStepId,
  className,
  ariaLabel = 'Stage progress',
}) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <nav
      aria-label={ariaLabel}
      className={cn('w-full max-w-full overflow-x-auto [contain:content]', className)}
    >
      <ol className="flex items-center gap-2 py-1 px-1 min-w-max">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCurrent = step.id === currentStepId;
          const isCompleted = currentIndex !== -1 && index < currentIndex;

          return (
            <li
              key={step.id}
              aria-current={isCurrent ? 'step' : undefined}
              title={step.description}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-colors shrink-0 select-none',
                isCurrent
                  ? 'bg-civic-indigo-600 text-white border-civic-indigo-700 shadow-xs font-semibold'
                  : isCompleted
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-medium'
                  : 'bg-slate-100 text-slate-400 border-slate-200 font-normal'
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold shrink-0',
                  isCurrent
                    ? 'bg-white/20 text-white'
                    : isCompleted
                    ? 'bg-emerald-200 text-emerald-900'
                    : 'bg-slate-200 text-slate-500'
                )}
                aria-hidden="true"
              >
                {stepNumber}
              </span>
              <span>{step.label}</span>
              {isCompleted && <span className="sr-only"> (Completed)</span>}
              {isCurrent && <span className="sr-only"> (Current Step)</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
