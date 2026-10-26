import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Scale, BookOpen, ShieldAlert } from 'lucide-react';

interface DebateReservationRulebookBannerProps {
  onOpenRulebook: () => void;
}

export const DebateReservationRulebookBanner: React.FC<DebateReservationRulebookBannerProps> = ({
  onOpenRulebook,
}) => {
  return (
    <Card
      className="p-4 border-civic-indigo-200 bg-civic-indigo-50/70 text-slate-800 space-y-3"
      data-testid="debate-reservation-rulebook-banner"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-civic-indigo-100 border border-civic-indigo-200 flex items-center justify-center text-civic-indigo-700 shrink-0 mt-0.5">
            <Scale className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-civic-indigo-950 font-heading text-sm">
                Debate Room Point-of-Use Reservation Rulebook
              </span>
              <span className="font-mono text-[11px] font-semibold bg-civic-indigo-100 text-civic-indigo-900 px-2 py-0.5 rounded border border-civic-indigo-200">
                Policy 2026.1-womens-reservation-33
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Every formal named role (including Facilitator) has its own allocation with a mandatory 33% minimum:{' '}
              <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-900 font-bold">
                ceil(0.33 × planned places)
              </code>
              . A 1-place role requires 1 reserved place. The open speaking queue is not a fixed named role. Unmet reserved places stay vacant by default unless an audited Platform Owner exception is approved.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenRulebook}
            className="text-xs bg-white text-civic-indigo-900 border-civic-indigo-300 hover:bg-civic-indigo-50"
            data-testid="open-debate-reservation-rulebook-btn"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            <span>View Allocation Rulebook</span>
          </Button>
        </div>
      </div>

      <div className="text-[11px] text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-civic-indigo-100/80">
        <span className="flex items-center gap-1 text-amber-800">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Seeded legacy appointments are unvalidated records; plan is in open selection (not compliant).</span>
        </span>
        <span>&bull; Small cohorts (&le; 3 places): counts and status withheld to protect individual privacy.</span>
        <span>&bull; Fictional Rajkot prototype: one-browser simulation only.</span>
      </div>
    </Card>
  );
};
