import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { History, X, ShieldAlert, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { AllocationAuditRecord } from '../../types/domain';
import { formatDate } from '../../utils/formatters';

interface DebateAuditTrailModalProps {
  roleName: string | null;
  audits: AllocationAuditRecord[];
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export const DebateAuditTrailModal: React.FC<DebateAuditTrailModalProps> = ({
  roleName,
  audits,
  isOpen,
  onClose,
  isLoading,
}) => {
  if (!isOpen || !roleName) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      data-testid="debate-audit-trail-modal"
    >
      <Card className="max-w-xl w-full bg-white p-6 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-civic-indigo-600" />
            <h3 className="text-base font-bold font-heading text-slate-900">
              Allocation Audit Trail: {roleName}
            </h3>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            aria-label="Close"
            data-testid="close-debate-audit-trail-btn"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-xs text-slate-500">
          Permanent chronological log of validation events, finalizations, and authorized Platform Owner exceptions under Policy 2026.1-womens-reservation-33.
        </p>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-500">Loading audit records...</div>
        ) : audits.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-100">
            No audit records found for this role allocation.
          </div>
        ) : (
          <div className="space-y-3">
            {audits.map((a) => (
              <div
                key={a.id}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2 text-xs"
                data-testid="audit-trail-entry"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold">
                    {a.action === 'exception_approved' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-purple-100 text-purple-800 border border-purple-200">
                        <ShieldAlert className="w-3 h-3 text-purple-600" />
                        Exception Approved
                      </span>
                    ) : a.action === 'finalized' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Allocation Finalized
                      </span>
                    ) : a.action === 'finalization_rejected' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Finalization Rejected
                      </span>
                    ) : a.action === 'exception_invalidated' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Exception Invalidated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-200 text-slate-800">
                        {a.action}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatDate(a.timestamp)}
                  </span>
                </div>

                <p className="text-slate-800 italic bg-white p-2 rounded border border-slate-200 text-[11px]">
                  "{a.reason}"
                </p>

                <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>
                    Actor: <strong className="text-slate-700">{a.actorName || a.actorId}</strong> ({a.actorRole})
                  </span>
                  <span className="font-mono">
                    {a.policyVersion} &bull; {a.outcome}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
};
