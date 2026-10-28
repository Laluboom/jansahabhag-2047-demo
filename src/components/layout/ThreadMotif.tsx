import React from 'react';
import { cn } from '../../utils/cn';
import { Sparkles } from 'lucide-react';

export type ProductMethodStage = 'learn' | 'observe' | 'deliberate' | 'propose' | 'reflect';

export interface ThreadMotifProps {
  currentStage?: ProductMethodStage;
  className?: string;
}

export const CANONICAL_PRODUCT_METHOD_STAGES: { key: ProductMethodStage; label: string }[] = [
  { key: 'learn', label: '1. Learn' },
  { key: 'observe', label: '2. Observe' },
  { key: 'deliberate', label: '3. Deliberate' },
  { key: 'propose', label: '4. Propose' },
  { key: 'reflect', label: '5. Reflect' },
];

export const ThreadMotif: React.FC<ThreadMotifProps> = ({ currentStage = 'observe', className }) => {
  const stages = CANONICAL_PRODUCT_METHOD_STAGES;

  return (
    <div
      role="region"
      className={cn(
        'relative flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200/80 bg-gradient-to-r from-civic-indigo-50 via-civic-teal-50 to-civic-saffron-50 p-4 shadow-2xs lg:flex-row lg:items-center lg:justify-between',
        className
      )}
      aria-label="Five-Stage Product Method"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-civic-indigo-600 text-white flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-900 font-heading block">
            Five-Stage Product Method
          </span>
          <span className="text-[11px] text-slate-600 hidden sm:inline">
            Evidence-to-Action Thread &bull; Ankita's Rajkot Pedestrian Safety Pathway
          </span>
        </div>
      </div>

      <div className="grid w-full min-w-0 grid-cols-5 gap-2 lg:max-w-2xl">
        {stages.map((st, idx) => {
          const isCurrent = st.key === currentStage;
          return (
            <div
              key={st.key}
              data-testid={`product-method-stage-${st.key}`}
              aria-current={isCurrent ? 'step' : undefined}
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
