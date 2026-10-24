import React from 'react';
import { HeartHandshake } from 'lucide-react';

interface UhvCreditBannerProps {
  compact?: boolean;
}

export const UhvCreditBanner: React.FC<UhvCreditBannerProps> = ({ compact = false }) => {
  return (
    <div
      data-testid="uhv-credit-banner"
      className="p-4 sm:p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-950 space-y-2.5 shadow-xs"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm uppercase tracking-wider text-emerald-900">
          <HeartHandshake className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>UHV / Jeevan Vidya Study Stream &bull; Workshop Attribution</span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
          Owner Clarified Demo Direction
        </span>
      </div>

      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
        Based on the Vadodara Savli youth workshop, material by Ganesh Bagadia.
      </p>

      <p className="text-xs text-slate-700 leading-relaxed">
        Nazim M. Sandh also presented at the workshop. The Vadodara Savli youth workshop only inspired ordinary UHV assignments and youth activities, which are written in the platform's own words. This is an ordinary self-inquiry study flow, not a workshop feature or seven-day workshop curriculum.
      </p>

      <div className="pt-2 border-t border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-emerald-900">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <span>&bull; Private self-inquiry journal</span>
          <span>&bull; No ideological grading</span>
          <span>&bull; No teacher queue</span>
          <span>&bull; No Civic Credit Points</span>
          <span>&bull; No public reflection</span>
        </div>
        <div className="text-[10px] text-slate-500">
          Fictional Demo Material &bull; Curriculum Rights Awaiting Owner Review &bull; No approved curriculum implied &bull; Ideological agreement is not graded
        </div>
      </div>
    </div>
  );
};
