import React from 'react';
import { SeatingQuotaSummary } from './types';
import { Scale, AlertCircle } from 'lucide-react';

interface SeatingQuotaDisplayProps {
  quota: SeatingQuotaSummary;
  className?: string;
}

export const SeatingQuotaDisplay: React.FC<SeatingQuotaDisplayProps> = ({
  quota,
  className = '',
}) => {
  const isCompliant = quota.reservedFilledCount >= quota.reservedMinimum;

  return (
    <div
      className={`p-3.5 rounded-2xl border bg-slate-50/80 space-y-2.5 text-xs ${
        quota.isIllustrative ? 'border-amber-200' : 'border-slate-200'
      } ${className}`}
      data-testid="seating-quota-display"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-civic-saffron-600 shrink-0" />
          <span className="font-bold text-slate-900 text-xs">
            33% Women&apos;s Reservation Allocation & Seating Quota
          </span>
        </div>

        {quota.isIllustrative ? (
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 self-start sm:self-auto"
            data-testid="illustrative-quota-badge"
          >
            Illustrative Prototype Allocation (No Enforcement Claim)
          </span>
        ) : (
          <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            Engine: reservationAllocationService
          </span>
        )}
      </div>

      {/* Numerical Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
        {/* Total Places / Capacity */}
        <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Chamber Capacity
          </span>
          <span
            className="text-base font-bold text-slate-900 font-heading block mt-0.5"
            data-testid="seating-quota-total"
          >
            {quota.totalCapacity}
          </span>
          <span className="text-[10px] text-slate-500">Planned Places</span>
        </div>

        {/* 33% Minimum Reserved */}
        <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Reserved Min (33%)
          </span>
          <span
            className="text-base font-bold text-civic-indigo-700 font-heading block mt-0.5"
            data-testid="seating-quota-minimum"
          >
            {quota.reservedMinimum}
          </span>
          <span className="text-[10px] text-slate-500">
            ceil(0.33 &times; {quota.totalCapacity})
          </span>
        </div>

        {/* Reserved Filled Count */}
        <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Reserved Filled
          </span>
          <span
            className={`text-base font-bold font-heading block mt-0.5 ${
              isCompliant ? 'text-emerald-600' : 'text-amber-600'
            }`}
            data-testid="seating-quota-reserved-filled"
          >
            {quota.reservedFilledCount} / {quota.reservedMinimum}
          </span>
          <span className="text-[10px] text-slate-500">
            {isCompliant ? 'Quota Met' : 'Unmet Target'}
          </span>
        </div>

        {/* Vacancies Count */}
        <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Reserved Vacancies
          </span>
          <span
            className={`text-base font-bold font-heading block mt-0.5 ${
              quota.vacanciesCount > 0 ? 'text-amber-600' : 'text-slate-700'
            }`}
            data-testid="seating-quota-vacancies"
          >
            {quota.vacanciesCount}
          </span>
          <span className="text-[10px] text-slate-500">Held by Default</span>
        </div>
      </div>

      {/* Illustrative Notice or Compliance Helper */}
      {quota.isIllustrative && quota.illustrativeNotice && (
        <div className="p-2 rounded-lg bg-amber-50/90 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{quota.illustrativeNotice}</p>
        </div>
      )}
    </div>
  );
};
