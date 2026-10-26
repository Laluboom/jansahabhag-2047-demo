import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Programme, ProgrammeStatus } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  ArrowLeft,
  Layers,
  BookOpen,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const InstitutionProgrammesPage: React.FC = () => {
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const list = await demoRepository.getProgrammes();
        setProgrammes(list);
      } catch (err) {
        console.error('Failed to load programmes', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  const handleToggleStatus = async (progId: string, currentStatus: ProgrammeStatus) => {
    const nextStatus: ProgrammeStatus =
      currentStatus === 'active' ? 'draft' : currentStatus === 'draft' ? 'active' : 'active';
    try {
      await demoRepository.updateProgramme(progId, { status: nextStatus });
      triggerRefresh();
    } catch (err) {
      console.error('Failed to toggle status', err);
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        to="/institution/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Institution Hub</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Layers className="w-7 h-7 text-civic-teal-600" />
            <span>Active Civic Programmes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Programmes deployed across participating schools and colleges in Gujarat.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {programmes.map((p) => (
          <Card
            key={p.id}
            className="p-6 border-slate-200 bg-white flex flex-col justify-between space-y-4 shadow-sm hover:border-slate-300 transition-all"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-civic-teal-700 bg-civic-teal-50 px-2 py-0.5 rounded border border-civic-teal-100">
                  {p.code}
                </span>
                <StatusChip status={p.status} />
              </div>

              <CardTitle className="text-base font-bold text-slate-900 font-heading">
                {p.title}
              </CardTitle>

              <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 space-y-1">
                <div>Theme: <strong className="text-slate-900">{p.theme}</strong></div>
                <div>Schedule: {formatDate(p.startDate)} &bull; {formatDate(p.endDate)}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                {p.courseIds.length} Courses
              </span>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleToggleStatus(p.id, p.status)}
                className="text-xs"
              >
                <span>Set to {p.status === 'active' ? 'Draft' : 'Active'}</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
