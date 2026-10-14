import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { CreditTransaction, CreditDimension } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Award, CheckCircle2, Clock, ShieldCheck, Sparkles, Filter } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

const ALL_DIMENSIONS: CreditDimension[] = [
  'Learning',
  'Observation',
  'Deliberation',
  'Reflection',
  'Contribution',
  'Civic Action',
];

export const CreditsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [credits, setCredits] = useState<CreditTransaction[]>([]);
  const [selectedDimension, setSelectedDimension] = useState<CreditDimension | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);

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
  }, [currentUser]);

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
    .filter((c) => c.status !== 'Pending')
    .reduce((sum, c) => sum + c.amount, 0);
  const pendingTotal = credits
    .filter((c) => c.status === 'Pending')
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/passport" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Passport</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-civic-saffron-600" />
            <span>Civic Credit Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            An audited, append-only activity ledger recording verified civic contributions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {pendingTotal > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-left sm:text-right shrink-0">
              <span className="text-xs font-semibold text-amber-900 uppercase block">Pending Mentor Review</span>
              <span className="text-xl font-bold text-amber-700 font-heading">+{pendingTotal} Credits</span>
            </div>
          )}
          <div className="p-3.5 rounded-xl bg-civic-saffron-50 border border-civic-saffron-200 text-left sm:text-right shrink-0">
            <span className="text-xs font-semibold text-civic-saffron-900 uppercase block">Total Verified</span>
            <span className="text-2xl font-extrabold text-civic-saffron-700 font-heading">{verifiedTotal} Credits</span>
          </div>
        </div>
      </div>

      {/* Transparent Demo Rules Callout */}
      <Card className="p-4 bg-slate-50 border-slate-200 text-xs text-slate-600 space-y-1.5">
        <span className="font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-civic-indigo-600" />
          Transparent Activity Award Rules
        </span>
        <p className="leading-relaxed">
          &bull; Complete lesson: <strong>+5 Learning</strong> &bull; Assignment submission: <strong>+10 Contribution</strong> &bull; Verified field evidence: <strong>+5 Observation</strong> &bull; Assembly participation: <strong>+10 Deliberation</strong> &bull; Substantive inquiry: <strong>+5 Deliberation</strong> &bull; Reflection: <strong>+5 Reflection</strong> &bull; Project milestone: <strong>+10 Civic Action</strong>.
        </p>
        <p className="text-[11px] text-slate-500 italic">
          Note: Personal Universal Human Values (UHV) reflections are autonomous personal inquiries and carry no Civic Credits.
        </p>
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
            <div key={tx.id} className="p-4 flex items-center justify-between gap-4 text-xs hover:bg-slate-50 transition-colors">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900 font-heading">{tx.reason}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-civic-indigo-50 text-civic-indigo-700 uppercase font-semibold border border-civic-indigo-200">
                    {tx.dimension}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {formatDateTime(tx.createdAt)} &bull; Source Type: <span className="font-mono text-slate-600">{tx.sourceType}</span> (<span className="font-mono text-slate-600">{tx.sourceId}</span>)
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="font-extrabold text-sm text-civic-saffron-700 bg-civic-saffron-50 px-2 py-0.5 rounded border border-civic-saffron-200 inline-block">
                  +{tx.amount}
                </span>
                <span
                  className={`text-[10px] font-semibold mt-1 flex items-center justify-end gap-1 ${
                    tx.status === 'Pending'
                      ? 'text-amber-600'
                      : tx.status === 'Audited'
                      ? 'text-blue-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {tx.status === 'Pending' ? (
                    <Clock className="w-3 h-3 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  )}
                  {tx.status === 'Pending' ? 'Pending Review' : tx.status}
                </span>
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
};

