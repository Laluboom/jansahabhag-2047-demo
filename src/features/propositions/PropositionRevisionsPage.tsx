import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { demoRepository } from '../../services/demoRepository';
import { Proposition } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, History, CheckCircle2 } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';

export const PropositionRevisionsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [proposition, setProposition] = useState<Proposition | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const prop = await demoRepository.getProposition(id);
        setProposition(prop);
      } catch (err) {
        console.error('Failed to load revisions', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id]);

  if (isLoading || !proposition) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Link to={`/propositions/${id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Proposition</span>
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <History className="w-6 h-6 text-civic-indigo-600" />
          <span>Proposition Revision History</span>
        </h1>
        <p className="text-xs text-slate-500">
          Chamber iterations from initial draft to final resolution.
        </p>
      </div>

      <div className="space-y-3">
        {proposition.revisions.map((rev) => (
          <Card key={rev.version} className="border-slate-200 p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-civic-indigo-700 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-200">
                Version {rev.version}
              </span>
              <span className="text-xs text-slate-400">
                {formatDateTime(rev.timestamp)}
              </span>
            </div>

            <p className="text-sm font-semibold text-slate-800">
              {rev.changesSummary}
            </p>

            <span className="text-xs text-slate-500 block">
              Updated by: <strong>{rev.updatedBy}</strong>
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
};
