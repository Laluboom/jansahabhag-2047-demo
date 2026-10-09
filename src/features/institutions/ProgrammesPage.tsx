import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { demoRepository } from '../../services/demoRepository';
import { Programme } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { StatusChip } from '../../components/ui/StatusChip';
import { ArrowLeft, Layers, Calendar, BookOpen } from 'lucide-react';

export const InstitutionProgrammesPage: React.FC = () => {
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
      <Link to="/institution/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Institution Hub</span>
      </Link>

      <div>
        <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
          <Layers className="w-6 h-6 text-civic-teal-600" />
          <span>Active Civic Programmes</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Programmes deployed across participating schools and colleges in Rajasthan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {programmes.map((p) => (
          <Card key={p.id} className="p-6 border-slate-200 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">{p.code}</span>
                <StatusChip status={p.status} />
              </div>
              <CardTitle className="text-base font-bold text-slate-900">
                {p.title}
              </CardTitle>
              <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {p.courseIds.length} Courses
              </span>
              <span>Theme: <strong>{p.theme}</strong></span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
