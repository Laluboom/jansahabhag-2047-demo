import React from 'react';
import { cn } from '../../utils/cn';

export interface ChamberHeaderProps {
  /** Small chamber-type label above the title, e.g. 'Youth Assembly'. */
  eyebrow?: string;
  title: string;
  tagline: string;
  statusSlot?: React.ReactNode;   // e.g. a Live chip, a topic line, a stage chip
  timer?: string;                 // pre-formatted, e.g. '00:45:00' or '02:30'
  timerLabel?: string;            // e.g. 'Session Time'
  rulesSlot?: React.ReactNode;    // the module's existing PointOfUseRulesButton
  onLeave?: () => void;
  leaveLabel?: string;            // default 'Leave'
  className?: string;
}

export const ChamberHeader: React.FC<ChamberHeaderProps> = ({
  eyebrow,
  title,
  tagline,
  statusSlot,
  timer,
  timerLabel,
  rulesSlot,
  onLeave,
  leaveLabel = 'Leave',
  className,
}) => {
  return (
    <header
      className={cn(
        'flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 p-4 bg-white border-b border-slate-200 w-full max-w-full overflow-hidden',
        className
      )}
    >
      <div className="min-w-0 flex-1 sm:basis-64">
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-wider text-civic-indigo-700">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 tracking-tight">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 truncate mt-0.5">
          {tagline}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 sm:gap-3 min-w-0">
        {statusSlot}
        {timer && (
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono text-slate-700"
            title={timerLabel || 'Session Time'}
            data-testid="chamber-header-timer"
          >
            {timerLabel && (
              <span className="font-sans text-[11px] text-slate-500 font-medium">
                {timerLabel}:
              </span>
            )}
            <span className="font-semibold">{timer}</span>
          </div>
        )}
        {rulesSlot}
        <button
          type="button"
          onClick={onLeave}
          className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition-colors"
          data-testid="chamber-leave-btn"
        >
          {leaveLabel}
        </button>
      </div>
    </header>
  );
};
