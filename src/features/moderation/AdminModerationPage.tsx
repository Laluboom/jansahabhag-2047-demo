import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { ModerationCase, ModerationStatus } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

export const AdminModerationPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleUpdateStatus = async (caseId: string, status: ModerationStatus) => {
    if (!currentUser) return;
    try {
      await demoRepository.updateModerationCase(caseId, {
        status,
        reviewerId: currentUser.id,
        resolutionDetails: `Resolution set to ${status} by ${currentUser.name}`,
      });
      triggerRefresh();
    } catch (err) {
      console.error('Failed to update case', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Command</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-civic-indigo-600" />
          <span>Moderation & Content Safety Queue</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review community flags, unverified claims, and maintain respectful deliberative norms.
        </p>
      </div>

      <div className="space-y-4">
        {cases.map((c) => (
          <Card key={c.id} className="p-5 border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 font-bold">{c.id}</span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    c.severity === 'high'
                      ? 'bg-rose-100 text-rose-800'
                      : c.severity === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Severity: {c.severity}
                </span>
                <span className="text-xs text-slate-500">
                  Target: <strong>{c.targetType} ({c.targetId})</strong>
                </span>
              </div>
              <StatusChip status={c.status} />
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase block">Report Reason</span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{c.reason}</p>
            </div>

            {c.notes && (
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <span><strong>Reviewer Notes:</strong> {c.notes}</span>
              </div>
            )}

            {c.resolutionDetails && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                {c.resolutionDetails}
              </div>
            )}

            {c.status !== 'actioned' && c.status !== 'no_action' && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(c.id, 'no_action')}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Dismiss (No Action)</span>
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleUpdateStatus(c.id, 'actioned')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>Action & Resolve</span>
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
