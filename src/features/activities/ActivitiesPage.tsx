import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Activity, ActivityType } from '../../types/domain';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import {
  Compass,
  CheckCircle2,
  Plus,
  Target,
  Users,
  BookOpen,
  MessageSquare,
  Award,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { formatRelativeTime, formatDate } from '../../utils/formatters';

export const ActivitiesPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logTitle, setLogTitle] = useState('');
  const [logDescription, setLogDescription] = useState('');
  const [logType, setLogType] = useState<ActivityType>('evidence_logged');
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!currentUser) return;
      setIsLoading(true);
      try {
        const list = await demoRepository.getActivities(currentUser.id);
        setActivities(list);
      } catch (err) {
        console.error('Failed to load activities', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [currentUser, refreshKey]);

  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !logTitle.trim() || !logDescription.trim()) return;

    setIsSubmittingLog(true);
    try {
      const now = new Date().toISOString();
      await demoRepository.addActivity({
        userId: currentUser.id,
        type: logType,
        title: logTitle.trim(),
        description: logDescription.trim(),
        timestamp: now,
      });
      setLogTitle('');
      setLogDescription('');
      setIsLogModalOpen(false);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to log activity', err);
    } finally {
      setIsSubmittingLog(false);
    }
  };

  const filteredActivities = activities.filter((act) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'learning') return act.type === 'lesson_completed';
    if (selectedFilter === 'contribution')
      return act.type === 'assignment_submitted' || act.type === 'evidence_logged';
    if (selectedFilter === 'deliberation')
      return (
        act.type === 'assembly_joined' ||
        act.type === 'contribution_added' ||
        act.type === 'proposition_voted'
      );
    if (selectedFilter === 'action') return act.type === 'project_milestone';
    if (selectedFilter === 'reflection') return act.type === 'reflection_shared';
    return true;
  });

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'lesson_completed':
        return <BookOpen className="w-4 h-4 text-civic-indigo-600" />;
      case 'assignment_submitted':
      case 'evidence_logged':
        return <CheckCircle2 className="w-4 h-4 text-civic-teal-600" />;
      case 'assembly_joined':
      case 'contribution_added':
      case 'proposition_voted':
        return <Users className="w-4 h-4 text-civic-saffron-600" />;
      case 'project_milestone':
        return <Target className="w-4 h-4 text-emerald-600" />;
      case 'reflection_shared':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      default:
        return <Award className="w-4 h-4 text-slate-600" />;
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
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Compass className="w-7 h-7 text-civic-indigo-600" />
            <span>Participatory Civic Stream</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Engage across democratic action pathways, document field observations, and track verified civic milestones.
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={() => setIsLogModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Log Field Activity</span>
        </Button>
      </div>

      {/* Participatory Action Pathways */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Civic Action Pathways
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/learn" className="block group">
            <Card className="p-4 border-slate-200 bg-white hover:border-civic-indigo-300 hover:shadow-sm transition-all h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-civic-indigo-50 text-civic-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-civic-indigo-600 transition-colors">
                  Civic Learning
                </h3>
                <p className="text-xs text-slate-500">
                  Master field audit methods, traffic observation, and Universal Human Values.
                </p>
              </div>
              <span className="text-[11px] text-civic-indigo-600 font-semibold flex items-center gap-1 mt-3">
                Continue Learning <ArrowRight className="w-3 h-3" />
              </span>
            </Card>
          </Link>

          <Link to="/assemblies" className="block group">
            <Card className="p-4 border-slate-200 bg-white hover:border-civic-saffron-300 hover:shadow-sm transition-all h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-civic-saffron-50 text-civic-saffron-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-civic-saffron-600 transition-colors">
                  Youth Assembly
                </h3>
                <p className="text-xs text-slate-500">
                  Join structured deliberation on pedestrian safety and co-author propositions.
                </p>
              </div>
              <span className="text-[11px] text-civic-saffron-700 font-semibold flex items-center gap-1 mt-3">
                Enter Chamber <ArrowRight className="w-3 h-3" />
              </span>
            </Card>
          </Link>

          <Link to="/projects" className="block group">
            <Card className="p-4 border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm transition-all h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Action Projects
                </h3>
                <p className="text-xs text-slate-500">
                  Implement physical speed calming, sidewalk audits, and school zone petitions.
                </p>
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-3">
                View Initiatives <ArrowRight className="w-3 h-3" />
              </span>
            </Card>
          </Link>

          <Link to="/community" className="block group">
            <Card className="p-4 border-slate-200 bg-white hover:border-civic-teal-300 hover:shadow-sm transition-all h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-civic-teal-50 text-civic-teal-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 group-hover:text-civic-teal-600 transition-colors">
                  Peer Circles
                </h3>
                <p className="text-xs text-slate-500">
                  Exchange observation tips, survey templates, and local safety updates.
                </p>
              </div>
              <span className="text-[11px] text-civic-teal-700 font-semibold flex items-center gap-1 mt-3">
                Open Forums <ArrowRight className="w-3 h-3" />
              </span>
            </Card>
          </Link>
        </div>
      </div>

      {/* Activity Timeline Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold font-heading text-slate-900">
            Personal Civic Activity Timeline ({filteredActivities.length})
          </h2>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Activities' },
              { id: 'learning', label: 'Learning' },
              { id: 'contribution', label: 'Observations & Audits' },
              { id: 'deliberation', label: 'Deliberation' },
              { id: 'action', label: 'Action Projects' },
              { id: 'reflection', label: 'Reflections' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedFilter === f.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredActivities.length === 0 ? (
          <Card className="p-8 border-slate-200 text-center space-y-2">
            <p className="text-xs text-slate-500">No activity matching the selected filter.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((act) => (
              <Card
                key={act.id}
                className="p-4 sm:p-5 border-slate-200 bg-white flex items-start justify-between gap-4 shadow-sm hover:border-slate-300 transition-all"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    {getActivityIcon(act.type)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 font-heading truncate">
                        {act.title}
                      </h3>
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                        {act.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{act.description}</p>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">
                      {formatRelativeTime(act.timestamp)} &bull; {formatDate(act.timestamp)}
                    </span>
                  </div>
                </div>

                {act.referenceType === 'assembly' && (
                  <Link to={`/assemblies/${act.referenceId}`} className="shrink-0">
                    <Button size="sm" variant="outline" className="text-xs">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
                {act.referenceType === 'milestone' && (
                  <Link to="/projects" className="shrink-0">
                    <Button size="sm" variant="outline" className="text-xs">
                      <span>Project</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Log Activity Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Field Action or Civic Observation"
      >
        <form onSubmit={handleLogActivity} className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Record grassroots actions such as school gate hazard counts, community discussions, or sidewalk audits.
          </p>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Activity Category</label>
            <select
              value={logType}
              onChange={(e) => setLogType(e.target.value as ActivityType)}
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 bg-white"
            >
              <option value="evidence_logged">Field Observation & Traffic Count</option>
              <option value="project_milestone">Project Action & Municipal Deputation</option>
              <option value="reflection_shared">Civic Reflection & Cohort Debrief</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Activity Title</label>
            <Input
              placeholder="e.g. Conducted 30-min pedestrian flow audit at Gate 2"
              value={logTitle}
              onChange={(e) => setLogTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Activity Details & Ground Notes</label>
            <Textarea
              placeholder="Summarize key findings, observations, or community responses..."
              value={logDescription}
              onChange={(e) => setLogDescription(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsLogModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" type="submit" isLoading={isSubmittingLog}>
              <span>Save to Activity Stream</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
