import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Project, ProjectStatus } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { Modal } from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Input';
import {
  Target,
  Users,
  CheckCircle2,
  ArrowRight,
  Plus,
  Sparkles,
  Filter,
  CheckCircle,
  Clock,
  Layers,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newObjective, setNewObjective] = useState('');
  const [isCreating, setIsCreating] = useState(false);
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTitle.trim() || !newObjective.trim()) return;

    setIsCreating(true);
    try {
      await demoRepository.createProject({
        programmeId: 'prog_my_community_future',
        title: newTitle.trim(),
        civicObjective: newObjective.trim(),
        status: 'planning',
        leadUserId: currentUser.id,
        memberUserIds: [currentUser.id],
        milestones: [
          {
            id: `ms_01_${Date.now()}`,
            title: 'Initial site observation & stakeholder survey',
            description: 'Survey minimum 20 pedestrians and document recurring conflict points.',
            dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
            isCompleted: false,
          },
          {
            id: `ms_02_${Date.now()}`,
            title: 'Action proposal drafting & petition mobilization',
            description: 'Assemble evidence photos and gather 100 community signatures.',
            dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
            isCompleted: false,
          },
        ],
        evidenceIds: [],
        outcomesSummary: 'Project initiative created. In baseline planning phase.',
      });
      setNewTitle('');
      setNewObjective('');
      setIsCreateModalOpen(false);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to create project', err);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'active') return p.status === 'active' || p.status === 'milestone_review';
    if (selectedFilter === 'planning') return p.status === 'planning';
    if (selectedFilter === 'completed') return p.status === 'completed';
    return true;
  });

  const totalMilestones = projects.reduce((sum, p) => sum + p.milestones.length, 0);
  const completedMilestones = projects.reduce(
    (sum, p) => sum + p.milestones.filter((m) => m.isCompleted).length,
    0
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-civic-indigo-700 uppercase tracking-wider block mb-1">
            Labs & Projects
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Target className="w-7 h-7 text-civic-saffron-600" />
            <span>Youth Civic Action Projects</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Student-led micro-initiatives translating deliberation into municipal pedestrian safety action.
          </p>
        </div>

        <Button size="sm" variant="saffron" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          <span>Start Initiative</span>
        </Button>
      </div>

      {/* Connected Civic Innovation Labs Previews (Master PRD §1, Item 8) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Connected Civic Innovation Labs
          </p>
          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
            Demo Previews
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/labs/ideas"
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-civic-indigo-300 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-civic-indigo-600">
              <span>Idea Lab</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-civic-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Grassroots pedestrian safety inventions & street prototypes.
            </p>
          </Link>

          <Link
            to="/labs/research"
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-civic-teal-300 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-civic-teal-600">
              <span>Research Lab</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-civic-teal-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Empirical traffic census datasets & conflict telemetry.
            </p>
          </Link>

          <Link
            to="/labs/policy"
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-civic-saffron-300 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-civic-saffron-600">
              <span>Policy Lab</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-civic-saffron-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 leading-snug">
              Model municipal crosswalk bylaws & school zone design codes.
            </p>
          </Link>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Initiatives
          </span>
          <span className="text-2xl font-extrabold text-slate-900 font-heading mt-1 block">
            {projects.length}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Across 3 school zones</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Milestones Achieved
          </span>
          <span className="text-2xl font-extrabold text-emerald-600 font-heading mt-1 block">
            {completedMilestones}/{totalMilestones}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
            +10 Credits per milestone
          </span>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Active in Field
          </span>
          <span className="text-2xl font-extrabold text-civic-saffron-700 font-heading mt-1 block">
            {projects.filter((p) => p.status === 'active' || p.status === 'milestone_review').length}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Underway with ULB</span>
        </Card>

        <Card className="p-4 border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Completed Actions
          </span>
          <span className="text-2xl font-extrabold text-civic-teal-700 font-heading mt-1 block">
            {projects.filter((p) => p.status === 'completed').length}
          </span>
          <span className="text-[10px] text-civic-teal-600 font-medium mt-0.5 block">
            Verified implementation
          </span>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        {[
          { id: 'all', label: `All Initiatives (${projects.length})` },
          {
            id: 'active',
            label: `Active (${projects.filter((p) => p.status === 'active' || p.status === 'milestone_review').length})`,
          },
          {
            id: 'planning',
            label: `Planning (${projects.filter((p) => p.status === 'planning').length})`,
          },
          {
            id: 'completed',
            label: `Completed (${projects.filter((p) => p.status === 'completed').length})`,
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedFilter === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredProjects.map((proj) => {
          const completedCount = proj.milestones.filter((m) => m.isCompleted).length;
          const totalCount = proj.milestones.length;
          const progress = Math.round((completedCount / (totalCount || 1)) * 100);

          return (
            <Card
              key={proj.id}
              hoverable
              className="border-slate-200 p-6 flex flex-col justify-between bg-white shadow-sm hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {completedCount}/{totalCount} Milestones Done
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
                    <span>Progress</span>
                    <span className="font-bold text-slate-700">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-civic-saffron-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{proj.memberUserIds.length} Team Members</span>
                </span>

                <Link to={`/projects/${proj.id}`}>
                  <Button size="sm" variant="outline" className="text-xs">
                    <span>View Roadmap</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Start Initiative Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Start a Youth Civic Initiative"
      >
        <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Create a student-led micro-initiative focused on pedestrian safety, safe school walking routes, or civic accessibility.
          </p>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Initiative Title</label>
            <Input
              placeholder="e.g. Navchetna School Speed Table & Solar Blinker Action"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Civic Objective & Target Impact</label>
            <Textarea
              placeholder="Describe the pedestrian hazard, target location, and proposed engineering/civic intervention..."
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="p-3 rounded-xl bg-civic-saffron-50 border border-civic-saffron-200 text-civic-saffron-900 text-[11px] space-y-1">
            <span className="font-bold block">Automatic Starter Roadmap:</span>
            <p>Will initialize with 2 predefined field milestones. Completing each milestone awards +10 Civic Action Credits to all participants.</p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button size="sm" variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" variant="saffron" type="submit" isLoading={isCreating}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>Launch Initiative</span>
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
