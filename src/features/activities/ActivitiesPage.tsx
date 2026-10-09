import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import { Activity } from '../../types/domain';
import { Card } from '../../components/ui/Card';
import { Compass, CheckCircle2 } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export const ActivitiesPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const d = await demoRepository.getDashboard(currentUser.id);
        setActivities(d.recentActivities);
      } catch (err) {
        console.error('Failed to load activities', err);
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Compass className="w-6 h-6 text-civic-indigo-600" />
            <span>Participatory Civic Stream</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Active engagement milestones, field observations, and democratic deliberations.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {activities.map((act) => (
          <Card key={act.id} className="p-4 sm:p-5 border-slate-200 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-civic-indigo-50 text-civic-indigo-600 flex items-center justify-center shrink-0 mt-0.5 border border-civic-indigo-200">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 font-heading">
                  {act.title}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">{act.description}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {formatRelativeTime(act.timestamp)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
