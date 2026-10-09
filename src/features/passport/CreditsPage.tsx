import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { CreditTransaction } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Award, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

export const CreditsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [credits, setCredits] = useState<CreditTransaction[]>([]);
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

  const total = credits.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/passport" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Passport</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-civic-saffron-600" />
            <span>Civic Credit Ledger</span>
          </h1>
          <p className="text-xs text-slate-500">
            A transparent activity log recording verified civic contributions.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-civic-saffron-50 border border-civic-saffron-200 text-right">
          <span className="text-xs font-semibold text-civic-saffron-900 uppercase block">Total Verified</span>
          <span className="text-2xl font-extrabold text-civic-saffron-700 font-heading">{total} Credits</span>
        </div>
      </div>

      {/* Transparent Demo Rules Callout */}
      <Card className="p-4 bg-slate-50 border-slate-200 text-xs text-slate-600 space-y-1">
        <span className="font-bold text-slate-900 flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-civic-indigo-600" />
          Transparent Activity Award Rules
        </span>
        <p>
          Complete lesson (+5 Learning) &bull; Submit field audit (+10 Observation) &bull; Assembly participation (+15 Deliberation) &bull; Substantive inquiry (+5 Deliberation) &bull; Reflection (+5 Reflection) &bull; Project milestone (+10 Civic Action).
        </p>
      </Card>

      {/* Transaction Table / List */}
      <Card className="border-slate-200 overflow-hidden divide-y divide-slate-100">
        {credits.map((tx) => (
          <div key={tx.id} className="p-4 flex items-center justify-between gap-4 text-xs hover:bg-slate-50">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 font-heading">{tx.reason}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase font-semibold">
                  {tx.dimension}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block">
                {formatDateTime(tx.createdAt)} &bull; Source: {tx.sourceType} ({tx.sourceId})
              </span>
            </div>

            <div className="text-right shrink-0">
              <span className="font-extrabold text-sm text-civic-saffron-700">
                +{tx.amount}
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {tx.status}
              </span>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};
