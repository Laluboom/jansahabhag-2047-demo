import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Project } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { Target, Users, CheckCircle2, ArrowRight } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey } = useAppRefreshStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const list = await demoRepository.getProjects();
        setProjects(list);
      } catch (err) {
        console.error('Failed to load projects', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [refreshKey]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-civic-saffron-600" />
            <span>Youth Civic Action Projects</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Student-led micro-initiatives translating deliberation into municipal implementation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.map((proj) => {
          const completedMilestones = proj.milestones.filter((m) => m.isCompleted).length;
          const totalMilestones = proj.milestones.length;
          const progress = Math.round((completedMilestones / (totalMilestones || 1)) * 100);

          return (
            <Card key={proj.id} hoverable className="border-slate-200 p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {completedMilestones}/{totalMilestones} Milestones Done
                  </span>
                  <StatusChip status={proj.status} />
                </div>

                <CardTitle className="text-base font-bold text-slate-900 font-heading">
                  {proj.title}
                </CardTitle>

                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {proj.civicObjective}
                </p>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Project Completion</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-civic-saffron-600 h-1.5 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {proj.memberUserIds.length} Team Members
                </span>

                <Link to={`/projects/${proj.id}`}>
                  <Button size="sm" variant="outline">
                    <span>View Project</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
