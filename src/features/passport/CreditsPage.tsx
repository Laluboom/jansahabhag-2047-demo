import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { CreditTransaction, CreditDimension } from '../../types/domain';
import { Card } from '../../components/ui/Card';
import { CreditAppealModal } from './CreditAppealModal';
import {
  ArrowLeft,
  Award,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  History,
  Info,
} from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

const ALL_DIMENSIONS: CreditDimension[] = [
  'Learning',
  'Observation',
  'Deliberation',
  'Contribution',
  'Collaboration',
  'Civic Action',
  'Reflection',
];

export const CreditsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const [credits, setCredits] = useState<CreditTransaction[]>([]);
  const [selectedDimension, setSelectedDimension] = useState<CreditDimension | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [appealTarget, setAppealTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const list = await demoRepository.getCredits(currentUser.id);
        setCredits(list);
      } catch (err) {
        console.error('Failed to load credits', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser, refreshKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  const filteredCredits = credits.filter((c) => {
    if (selectedDimension === 'all') return true;
    return c.dimension === selectedDimension;
  });

  const verifiedTotal = credits
    .filter((c) => c.status === 'Verified' || c.status === 'Audited')
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingTotal = credits
    .filter((c) => c.status === 'Pending')
    .reduce((sum, c) => sum + c.amount, 0);

  const reversedTotal = credits
    .filter((c) => c.status === 'Reversed')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/passport" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Passport</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-civic-saffron-700 bg-civic-saffron-50 px-2.5 py-0.5 rounded-full border border-civic-saffron-200">
              Demo Simulation Ledger
            </span>
          </div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2 mt-1">
            <Award className="w-6 h-6 text-civic-saffron-600" />
            <span>Civic Credit Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audited, review-aware activity ledger across all 7 civic dimensions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {reversedTotal > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-left sm:text-right shrink-0">
              <span className="text-[11px] font-semibold text-rose-800 uppercase block">Reconciled / Reversed</span>
              <span className="text-lg font-bold text-rose-700 font-heading">-{reversedTotal} Credits</span>
            </div>
          )}
          {pendingTotal > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-left sm:text-right shrink-0">
              <span className="text-[11px] font-semibold text-amber-900 uppercase block">Pending Mentor Review</span>
              <span className="text-lg font-bold text-amber-700 font-heading">+{pendingTotal} Credits</span>
            </div>
          )}
          <div className="p-3.5 rounded-xl bg-civic-saffron-50 border border-civic-saffron-200 text-left sm:text-right shrink-0">
            <span className="text-[11px] font-semibold text-civic-saffron-900 uppercase block">Total Verified</span>
            <span className="text-2xl font-extrabold text-civic-saffron-700 font-heading">{verifiedTotal} Credits</span>
          </div>
        </div>
      </div>

      {/* Transparent Demo Rules Callout */}
      <Card className="p-4 bg-slate-50 border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <Info className="w-4 h-4 text-civic-indigo-600 shrink-0" />
          <span>Transparent Activity Award Rules & Explainable Formula (7 PRD Dimensions)</span>
        </div>
        <p className="leading-relaxed">
          &bull; <strong>Starting Balance</strong>: +10 (Onboarding allocation) &bull; <strong>Learning</strong>: +1 (Module completion) &bull; <strong>Observation</strong>: +1 (Verified field evidence) &bull; <strong>Deliberation</strong>: +2 (Assembly role), +1 (Substantive contribution) &bull; <strong>Contribution</strong>: +2 (Assignment submission; held in Pending status until mentor review) &bull; <strong>Collaboration</strong>: +1 (Workspace action contribution) &bull; <strong>Civic Action</strong>: +2 (Community initiative milestone) &bull; <strong>Reflection</strong>: +1 (Civic reflection); private UHV reflections, retained dissent, and private Debate journals award 0 civic credits.
        </p>
        <p className="text-[11px] text-slate-500 italic">
          Scoring notice: This demo uses fixed amounts per confirmed action. PRD conceptual multiplication equations are exploratory research formulas, not automated production algorithms.
        </p>
        <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 space-y-1 text-[11px] text-amber-950">
          <span className="font-semibold block">Simulation & Language Notice:</span>
          <p>
            Fictional single-browser simulation; English demo with Hindi pending review. Credits are local demonstration counters, not real-world currency or certified credentials.
          </p>
        </div>
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">Read the full credit award criteria and appeal procedures in the rulebook.</span>
          <Link
            to="/help"
            className="font-semibold text-civic-indigo-700 hover:text-civic-indigo-900 underline inline-flex items-center gap-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-civic-indigo-500 rounded py-0.5 px-1"
            data-testid="credits-full-rulebook-link"
          >
            <span>Full Rulebook</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </Card>

      {/* Dimension Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        <button
          onClick={() => setSelectedDimension('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            selectedDimension === 'all'
              ? 'bg-civic-indigo-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Dimensions ({credits.length})
        </button>
        {ALL_DIMENSIONS.map((dim) => {
          const count = credits.filter((c) => c.dimension === dim).length;
          return (
            <button
              key={dim}
              onClick={() => setSelectedDimension(dim)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDimension === dim
                  ? 'bg-civic-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {dim} ({count})
            </button>
          );
        })}
      </div>

      {/* Transaction Table / List */}
      <Card className="border-slate-200 bg-white overflow-hidden divide-y divide-slate-100 shadow-sm">
        {filteredCredits.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No credit transactions found in this dimension.
          </div>
        ) : (
          filteredCredits.map((tx) => (
            <div key={tx.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 font-heading">{tx.reason}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-civic-indigo-50 text-civic-indigo-700 uppercase font-semibold border border-civic-indigo-200">
                    {tx.dimension}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                  <span>{formatDateTime(tx.createdAt)}</span>
                  <span>&bull;</span>
                  <span>Source: <span className="font-mono text-slate-700">{tx.sourceType}</span> ({tx.sourceId})</span>
                  {tx.sourceRoute && (
                    <>
                      <span>&bull;</span>
                      <Link
                        to={tx.sourceRoute}
                        className="inline-flex items-center gap-1 text-civic-indigo-600 hover:text-civic-indigo-800 font-semibold"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </>
                  )}
                </div>
                {tx.calculationExplanation && (
                  <p className="text-[11px] text-slate-500 italic">
                    Rule: {tx.calculationExplanation}
                  </p>
                )}
                {tx.auditTrail && tx.auditTrail.length > 0 && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <History className="w-3 h-3" />
                    <span>Audit: {tx.auditTrail[tx.auditTrail.length - 1].action} &bull; {tx.auditTrail[tx.auditTrail.length - 1].note || 'Logged'}</span>
                  </div>
                )}
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <span
                  className={`font-extrabold text-sm px-2.5 py-0.5 rounded border inline-block ${
                    tx.status === 'Reversed'
                      ? 'text-rose-700 bg-rose-50 border-rose-200 line-through'
                      : tx.status === 'Pending'
                      ? 'text-amber-800 bg-amber-50 border-amber-200'
                      : 'text-civic-saffron-700 bg-civic-saffron-50 border-civic-saffron-200'
                  }`}
                >
                  {tx.status === 'Reversed' ? `+${tx.amount}` : `+${tx.amount}`}
                </span>

                <div className="flex items-center gap-2">
                  {tx.status === 'Pending' && (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Pending Review
                    </span>
                  )}
                  {tx.status === 'Verified' && (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Verified
                    </span>
                  )}
                  {tx.status === 'Audited' && (
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      Audited
                    </span>
                  )}
                  {tx.status === 'Reversed' && (
                    <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-600" />
                      Reversed
                    </span>
                  )}

                  <button
                    onClick={() => setAppealTarget({ id: tx.id, title: tx.reason })}
                    className="text-[10px] text-slate-400 hover:text-slate-700 underline"
                    title="Dispute or appeal transaction"
                  >
                    Appeal
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </Card>

      {/* Appeal Modal */}
      {appealTarget && currentUser && (
        <CreditAppealModal
          userId={currentUser.id}
          targetType="credit"
          targetId={appealTarget.id}
          targetTitle={appealTarget.title}
          onClose={() => setAppealTarget(null)}
          onSuccess={() => triggerRefresh()}
        />
      )}
    </div>
  );
};
