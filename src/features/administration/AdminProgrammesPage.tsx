import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { demoRepository } from '../../services/demoRepository';
import { Programme } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { StatusChip } from '../../components/ui/StatusChip';
import { ArrowLeft, Layers, Calendar, BookOpen, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AdminProgrammesPage: React.FC = () => {
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
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Command</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-civic-indigo-600" />
            <span>State Programmes Administration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Oversight of statewide civic learning and youth assembly deployments.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {programmes.map((p) => (
          <Card key={p.id} className="p-6 border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-civic-indigo-600 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-100">
                  {p.code}
                </span>
                <StatusChip status={p.status} />
              </div>
              <CardTitle className="text-base font-bold text-slate-900">{p.title}</CardTitle>
              <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                <span>Theme: <strong>{p.theme}</strong></span>
                <span>&bull;</span>
                <span>{p.institutionIds.length} Institutions</span>
                <span>&bull;</span>
                <span>{p.courseIds.length} Courses</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
