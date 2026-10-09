import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Project, Evidence } from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { ArrowLeft, Target, Users, CheckCircle2, Award, FileCheck2, Sparkles } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [project, setProject] = useState<Project | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      setIsLoading(true);
      try {
        const proj = await demoRepository.getProject(id);
        setProject(proj);

        if (proj?.evidenceIds.length) {
          const evs = await Promise.all(
            proj.evidenceIds.map((eid) => demoRepository.getEvidence(eid))
          );
          setEvidenceList(evs.filter((e): e is Evidence => e !== null));
        }
      } catch (err) {
        console.error('Failed to load project details', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, refreshKey]);

  const handleCompleteMilestone = async (milestoneId: string) => {
    if (!id || !currentUser) return;
    setIsUpdating(true);
    try {
      await demoRepository.completeProjectMilestone(id, milestoneId, currentUser.id);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to complete milestone', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Projects</span>
      </Link>

      {/* Project Overview */}
      <Card className="border-slate-200 p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-civic-saffron-800 bg-civic-saffron-50 px-2.5 py-0.5 rounded-full border border-civic-saffron-200">
            Action Initiative
          </span>
          <StatusChip status={project.status} />
        </div>

        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900">
            {project.title}
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {project.civicObjective}
          </p>
        </div>

        {project.outcomesSummary && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
            <span className="font-bold text-slate-900 block">Current Status & Outcomes:</span>
            <p>{project.outcomesSummary}</p>
          </div>
        )}
      </Card>

      {/* Milestones Checklist */}
      <Card className="border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-civic-saffron-600" />
            <span>Project Milestones</span>
          </h2>
          <span className="text-xs text-slate-500">
            {project.milestones.filter((m) => m.isCompleted).length}/{project.milestones.length} Done
          </span>
        </div>

        <div className="space-y-3">
          {project.milestones.map((ms, idx) => (
            <div
              key={ms.id}
              className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                ms.isCompleted
                  ? 'border-emerald-200 bg-emerald-50/40'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                    ms.isCompleted
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {ms.isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{ms.title}</h3>
                  <p className="text-slate-600 mt-0.5">{ms.description}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Target: {formatDate(ms.dueDate)}
                  </span>
                </div>
              </div>

              {!ms.isCompleted && (
                <Button
                  size="sm"
                  variant="saffron"
                  isLoading={isUpdating}
                  onClick={() => handleCompleteMilestone(ms.id)}
                  className="shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  <span>Complete (+10 Credits)</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
