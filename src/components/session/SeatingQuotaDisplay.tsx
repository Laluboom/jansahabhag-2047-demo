import React from 'react';
import { SeatingQuotaSummary } from './types';
import { Scale, AlertCircle, Shield, ShieldCheck } from 'lucide-react';

interface SeatingQuotaDisplayProps {
  quota: SeatingQuotaSummary;
  className?: string;
}

export const SeatingQuotaDisplay: React.FC<SeatingQuotaDisplayProps> = ({
  quota,
  className = '',
}) => {
  const isSuppressed = Boolean(quota.isPrivacySuppressed);
  const isCompliant =
    !isSuppressed &&
    quota.reservedFilledCount !== undefined &&
    quota.reservedFilledCount >= quota.reservedMinimum;

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
        ) : isSuppressed ? (
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 self-start sm:self-auto"
            data-testid="status-privacy-suppressed"
            title="Small-cohort privacy protection applied"
          >
            <Shield className="w-3 h-3 text-civic-indigo-600" />
            <span>Protected (Small Cohort)</span>
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
            {quota.isIllustrative
              ? `ceil(0.33 \u00d7 ${quota.totalCapacity})`
              : 'Sum of per-role minimums'}
          </span>
        </div>

        {/* Reserved Filled Count */}
        <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Reserved Filled
          </span>
          {isSuppressed ? (
            <>
              <span
                className="text-base font-bold font-heading block mt-0.5 text-slate-600"
                data-testid="seating-quota-reserved-filled"
              >
                Withheld (Privacy)
              </span>
              <span className="text-[10px] text-slate-500" data-testid="seating-quota-status-suppressed">
                Small-cohort protected
              </span>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Vacancies Count */}
        <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Reserved Vacancies
          </span>
          {isSuppressed ? (
            <>
              <span
                className="text-base font-bold font-heading block mt-0.5 text-slate-600"
                data-testid="seating-quota-vacancies"
              >
                Withheld (Privacy)
              </span>
              <span className="text-[10px] text-slate-500">Small-cohort protected</span>
            </>
          ) : (
            <>
              <span
                className={`text-base font-bold font-heading block mt-0.5 ${
                  (quota.vacanciesCount ?? 0) > 0 ? 'text-amber-600' : 'text-slate-700'
                }`}
                data-testid="seating-quota-vacancies"
              >
                {quota.vacanciesCount ?? 0}
              </span>
              <span className="text-[10px] text-slate-500">Held by Default</span>
            </>
          )}
        </div>
      </div>

      {/* Small-Cohort Privacy Protection Banner */}
      {isSuppressed && (
        <div
          className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-200/70 text-indigo-950 text-xs flex items-start gap-2"
          data-testid="small-cohort-privacy-banner"
        >
          <Shield className="w-4 h-4 text-civic-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <span className="font-bold text-[11px] block text-civic-indigo-900">
              Small-Cohort Privacy Protection Applied
            </span>
            <p className="text-[11px] text-slate-600">
              Exact filled and vacancy counts are withheld for cohorts with small capacity or occupancy (1–3 places)
              to prevent deducing individual reservation declarations. Per-role 33% minimum allocations remain active.
            </p>
          </div>
        </div>
      )}

      {/* Generic Chamber Reservation Policy Indicator */}
      <div
        className="flex items-center gap-1.5 text-[11px] text-slate-600 pt-1 border-t border-slate-200/50"
        data-testid="generic-policy-indicator"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-civic-indigo-600 shrink-0" />
        <span>
          33% Women&apos;s Reservation Policy applies per named role. Personal declarations remain confidential.
        </span>
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
