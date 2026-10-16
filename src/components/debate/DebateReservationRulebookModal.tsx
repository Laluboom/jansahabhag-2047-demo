import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Scale, X } from 'lucide-react';

interface DebateReservationRulebookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebateReservationRulebookModal: React.FC<DebateReservationRulebookModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="debate-rulebook-title"
    >
      <Card
        className="max-w-2xl w-full bg-white p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl"
        data-testid="debate-reservation-rulebook-modal"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-civic-indigo-50 border border-civic-indigo-200 flex items-center justify-center text-civic-indigo-700">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="debate-rulebook-title"
                className="text-base font-bold font-heading text-slate-900"
              >
                Debate Room Reservation & Allocation Rulebook
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Policy 2026.1-womens-reservation-33 (Master PRD §A8, §A13 & Supplementary PRD)
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            aria-label="Close Allocation Rulebook"
            data-testid="close-debate-reservation-rulebook-btn"
          >
            <X className="w-4 h-4 mr-1" />
            <span>Close</span>
          </Button>
        </div>

        <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-900 text-xs">
              Rule 1: Independent 33% Allocation Per Formal Named Role
            </h4>
            <p>
              Every formal debate role (Facilitator, Questioner, Evidence Analyst, Civic Advocate, Community Voice, Synthesiser, Rapporteur) calculates its minimum reserved places independently as{' '}
              <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-slate-900 font-semibold">
                ceil(0.33 × totalPlaces)
              </code>
              . Quotas are never pooled, transferred, or averaged across roles or sessions.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-900 text-xs">
              Rule 2: Singular 1-Place Roles Rounding (1 Place = 1 Reserved Place)
            </h4>
            <p>
              Applying <code className="font-mono bg-white px-1 py-0.5 rounded border text-slate-900">ceil(0.33 × 1) = 1</code> means any single-place named role requires one reserved place. The Facilitator role has its own allocation and is not exempt from the 33% policy. A 1-place role cannot be finalized with an ordinary candidate without an approved Platform Owner exception.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-900 text-xs">
              Rule 3: Open Speaking Queue is Open Participation (Excluded)
            </h4>
            <p>
              The open speaking queue is open floor deliberation, not a fixed named role or fixed seat cohort. Floor speaking requests are handled dynamically in queue order regulated by the Facilitator. The 33% reservation policy applies strictly to defined formal named roles.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-900 text-xs">
              Rule 4: Unmet Reserved Places Remain Vacant by Default
            </h4>
            <p>
              If qualified candidates are not confirmed for reserved places, those places remain vacant by default. The system strictly prohibits silent reassignments or automatic fallback to ordinary candidates.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-900 text-xs">
              Rule 5: Seeded Legacy Appointments & Open Selection Stage
            </h4>
            <p>
              Pre-existing role assignments in seeded debate sessions are unvalidated legacy records. The debate role plan begins in open selection stage (not compliant) and cannot be marked compliant until every role satisfies the reservation requirement or an audited exception is approved.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-900 text-xs">
              Rule 6: Small-Cohort Privacy Protection (&le; 3 Places)
            </h4>
            <p>
              To protect personal privacy in small cohorts of 3 or fewer places (such as 1-place debate roles), public and participant projections withhold category breakdown counts, exception details, and deductive status. Personal eligibility is never displayed next to roster names.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <h4 className="font-bold text-slate-900 text-xs">
              Rule 7: Platform Owner Authority Guard & Audited Exceptions
            </h4>
            <p>
              Only the authenticated Platform Owner (<code className="font-mono bg-white px-1 py-0.5 rounded border text-slate-900">platform_admin</code>) can approve reasoned exceptions, requiring a substantive justification of at least 5 characters. Facilitators and participants cannot approve exceptions. Any capacity change, occupant withdrawal, or occupant replacement immediately invalidates prior exceptions, resetting role status to pending.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button size="sm" variant="primary" onClick={onClose}>
            Close Rulebook
          </Button>
        </div>
      </Card>
    </div>
  );
};
