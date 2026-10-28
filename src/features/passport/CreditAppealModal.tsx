import React, { useState } from 'react';
import { demoRepository } from '../../services/demoRepository';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { AlertCircle, CheckCircle2, ShieldAlert, X } from 'lucide-react';

interface CreditAppealModalProps {
  userId: string;
  targetType: 'credit' | 'submission' | 'passport';
  targetId: string;
  targetTitle: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreditAppealModal: React.FC<CreditAppealModalProps> = ({
  userId,
  targetType,
  targetId,
  targetTitle,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 5) {
      setError('Please provide at least 5 characters explaining your dispute or correction request.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const appeal = await demoRepository.requestCreditAppeal({
        userId,
        targetType,
        targetId,
        reason: reason.trim(),
      });
      setSuccessMessage(
        `Appeal ${appeal.id} submitted successfully. Routed to ${appeal.assignedReviewerName}.`
      );
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit appeal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <Card className="w-full max-w-lg bg-white border-slate-200 shadow-2xl p-6 space-y-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Close appeal modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-civic-saffron-700 bg-civic-saffron-50 px-2 py-0.5 rounded border border-civic-saffron-200">
            Procedural Correction & Appeal
          </span>
          <h2 className="text-lg font-bold font-heading text-slate-900">
            Dispute Review / Credit Adjustment
          </h2>
          <p className="text-xs text-slate-500">
            Item: <span className="font-semibold text-slate-800">{targetTitle}</span> ({targetId})
          </p>
        </div>

        {/* PRD AI Prohibition Callout */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-900">
          <div className="flex items-center gap-1.5 font-bold text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Human Adjudication Guarantee</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-950">
            Automated AI algorithms are strictly barred from evaluating credit disputes, sanctioning records, or altering civic status. This appeal is routed exclusively to a fictional human reviewer (<strong>Shri Mayur Parmar</strong>, Lead Mentor & Civic Reviewer).
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {successMessage ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Appeal Lodged</span>
              </div>
              <p>{successMessage}</p>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="appeal-reason" className="block text-xs font-semibold text-slate-700">
                Reason for Appeal / Factual Correction
              </label>
              <textarea
                id="appeal-reason"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why this review or credit reversal was in error, or provide factual evidence details..."
                className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                required
              />
              <span className="text-[10px] text-slate-400 block">
                Minimum 5 characters. Retained in credit audit trail.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Human Appeal'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
