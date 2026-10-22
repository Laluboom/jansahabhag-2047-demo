import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { ModerationCase, ModerationStatus } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Info,
  X,
  FileCheck,
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

export const AdminModerationPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'under_review' | 'resolved'>('all');

  // Modal State for Action/Dismissal with notes
  const [activeModalCase, setActiveModalCase] = useState<{
    caseId: string;
    targetStatus: 'actioned' | 'no_action';
    title: string;
  } | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const list = await demoRepository.getModerationCases();
        setCases(list);
      } catch (err) {
        console.error('Failed to load moderation cases', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  const handleStartReview = async (caseId: string) => {
    if (!currentUser) return;
    try {
      await demoRepository.updateModerationCase(caseId, {
        status: 'under_review',
        reviewerId: currentUser.id,
        notes: `Review initiated by ${currentUser.name} (${currentUser.role}).`,
      });
      triggerRefresh();
    } catch (err) {
      console.error('Failed to start review', err);
    }
  };

  const handleOpenResolutionModal = (caseId: string, targetStatus: 'actioned' | 'no_action') => {
    setActiveModalCase({
      caseId,
      targetStatus,
      title: targetStatus === 'actioned' ? 'Resolve & Action Flag' : 'Dismiss Flag (No Action)',
    });
    setResolutionNote(
      targetStatus === 'actioned'
        ? 'Content verified against community guidelines and appropriate corrective action applied.'
        : 'Reviewed content; determined to be constructive and compliant with deliberative standards.'
    );
  };

  const handleConfirmResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalCase || !currentUser) return;

    try {
      await demoRepository.updateModerationCase(activeModalCase.caseId, {
        status: activeModalCase.targetStatus,
        reviewerId: currentUser.id,
        resolutionDetails: resolutionNote.trim(),
        notes: `Decision recorded by ${currentUser.name}: ${resolutionNote.trim()}`,
      });
      setActiveModalCase(null);
      setResolutionNote('');
      triggerRefresh();
    } catch (err) {
      console.error('Failed to resolve case', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  const filteredCases = cases.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'open') return c.status === 'open';
    if (filter === 'under_review') return c.status === 'under_review';
    if (filter === 'resolved') return c.status === 'actioned' || c.status === 'no_action';
    return true;
  });

  const openCount = cases.filter((c) => c.status === 'open').length;
  const underReviewCount = cases.filter((c) => c.status === 'under_review').length;
  const resolvedCount = cases.filter((c) => c.status === 'actioned' || c.status === 'no_action').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Command</span>
      </Link>

      {/* Notice Banner */}
      <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-start gap-3 text-xs text-indigo-950">
        <Info className="w-4 h-4 text-civic-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold">
            Human-in-the-Loop Moderation Protocol
          </p>
          <p className="text-indigo-900/80 leading-relaxed">
            Automated scanning flags anomalous wording or rapid repetition. In accordance with platform governance, all moderation decisions (Open &rarr; Under Review &rarr; Actioned / No Action) require human reviewer affirmation and recorded reasoning.
          </p>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-civic-indigo-600" />
          <span>Moderation & Content Safety Queue</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Maintain respectful deliberative norms across youth assembly submissions and community posts.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-civic-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Cases ({cases.length})
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'open'
              ? 'bg-civic-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Open ({openCount})
        </button>
        <button
          onClick={() => setFilter('under_review')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'under_review'
              ? 'bg-civic-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Under Review ({underReviewCount})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'resolved'
              ? 'bg-civic-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Resolved ({resolvedCount})
        </button>
      </div>

      {/* Cases List */}
      <div className="space-y-4">
        {filteredCases.map((c) => (
          <Card key={c.id} className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                  {c.id}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    c.severity === 'high'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : c.severity === 'medium'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Severity: {c.severity}
                </span>
                <span className="text-xs text-slate-500">
                  Target: <strong>{c.targetType} ({c.targetId})</strong>
                </span>
                <span className="text-xs text-slate-500">
                  Reporter: <strong>{c.reporterId}</strong>
                </span>
              </div>
              <StatusChip status={c.status} />
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Report Reason</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{c.reason}</p>
            </div>

            {c.notes && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-0.5">
                <span className="font-bold text-slate-700">Reviewer Audit Note:</span>
                <p>{c.notes}</p>
              </div>
            )}

            {c.resolutionDetails && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium space-y-0.5">
                <span className="font-bold text-emerald-800">Final Resolution:</span>
                <p>{c.resolutionDetails}</p>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
              {c.status === 'open' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleStartReview(c.id)}
                  className="flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Begin Review</span>
                </Button>
              )}

              {c.status === 'under_review' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenResolutionModal(c.id, 'no_action')}
                    className="flex items-center gap-1 text-slate-600"
                  >
                    <XCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Dismiss (No Action)</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleOpenResolutionModal(c.id, 'actioned')}
                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Action & Resolve</span>
                  </Button>
                </>
              )}

              {(c.status === 'actioned' || c.status === 'no_action') && (
                <span className="text-xs text-slate-400 italic">
                  Case archived &bull; Reviewed by {c.reviewerId || 'Admin'}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Resolution Notes Modal */}
      {activeModalCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-civic-indigo-600" />
                <span>{activeModalCase.title}</span>
              </h3>
              <button
                onClick={() => setActiveModalCase(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Reasoning & Action Rationale
                </label>
                <textarea
                  rows={4}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Record your moderation decision rationale..."
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveModalCase(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={activeModalCase.targetStatus === 'actioned' ? 'primary' : 'outline'}
                  size="sm"
                >
                  <span>Confirm Resolution</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
