import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ShieldAlert, X } from 'lucide-react';

interface DebateExceptionModalProps {
  roleName: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isSubmitting: boolean;
  error?: string | null;
}

export const DebateExceptionModal: React.FC<DebateExceptionModalProps> = ({
  roleName,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error: externalError,
}) => {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setValidationError(null);
    }
  }, [isOpen]);

  if (!isOpen || !roleName) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setValidationError('A substantive reason of at least 5 characters is required.');
      return;
    }
    setValidationError(null);
    await onSubmit(reason.trim());
  };

  const displayError = validationError || externalError;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      data-testid="debate-exception-modal"
    >
      <Card className="max-w-lg w-full bg-white p-6 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold font-heading text-slate-900">
              Approve Platform Owner Exception: {roleName}
            </h3>
          </div>
          <Button size="sm" variant="outline" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Under Policy <span className="font-mono font-semibold">2026.1-womens-reservation-33</span>, unmet reserved places stay vacant by default. Approving this exception permits the allocation for <span className="font-semibold text-slate-800">"{roleName}"</span> to proceed. This privileged action is permanently recorded in the audit trail and visibly marked as an exception.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="debate-exception-reason"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Substantive Justification Reason (min 5 characters):
            </label>
            <textarea
              id="debate-exception-reason"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
              placeholder="e.g. Fictional pilot test: specific domain analyst appointed under documented platform owner review..."
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError && e.target.value.trim().length >= 5) {
                  setValidationError(null);
                }
              }}
              data-testid="debate-exception-reason-input"
              required
            />
          </div>

          {displayError && (
            <div
              className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs"
              data-testid="debate-exception-error"
            >
              {displayError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              size="sm"
              variant="outline"
              type="button"
              onClick={onClose}
              data-testid="cancel-debate-exception-btn"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-700 hover:bg-purple-800 text-white"
              data-testid="submit-debate-exception-btn"
            >
              {isSubmitting ? 'Confirming...' : 'Confirm & Audit Exception'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
