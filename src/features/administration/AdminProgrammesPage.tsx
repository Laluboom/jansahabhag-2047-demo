import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import { Programme } from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  ArrowLeft,
  Layers,
  BookOpen,
  Plus,
  Power,
  X,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AdminProgrammesPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'draft'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Programme Form State
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [theme, setTheme] = useState('Urban Pedestrian Safety');
  const [status, setStatus] = useState<'active' | 'draft'>('active');

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

  const handleToggleStatus = async (p: Programme) => {
    try {
      const nextStatus = p.status === 'active' ? 'draft' : 'active';
      await demoRepository.updateProgramme(p.id, { status: nextStatus });
      triggerRefresh();
    } catch (err) {
      console.error('Failed to update programme status', err);
    }
  };

  const handleCreateProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    try {
      const now = new Date().toISOString().split('T')[0];
      await demoRepository.createProgramme({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim(),
        theme,
        status,
        institutionIds: ['inst_navchetna_jaipur'],
        courseIds: ['course_civics_101'],
        leadManagerId: currentUser?.id || 'usr_priya_sharma',
        activeAssemblyIds: [],
        startDate: now,
        endDate: '2027-03-31',
      });
      setIsModalOpen(false);
      setCode('');
      setTitle('');
      setDescription('');
      triggerRefresh();
    } catch (err) {
      console.error('Failed to create programme', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  const filteredProgrammes = programmes.filter((p) => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Command</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-civic-indigo-600" />
            <span>State Programmes Administration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Oversight and deployment of statewide civic learning and youth assembly tracks.
          </p>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy New Programme</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
            filterStatus === 'all'
              ? 'bg-civic-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All ({programmes.length})
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
            filterStatus === 'active'
              ? 'bg-civic-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Active ({programmes.filter((p) => p.status === 'active').length})
        </button>
        <button
          onClick={() => setFilterStatus('draft')}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
            filterStatus === 'draft'
              ? 'bg-civic-indigo-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Draft ({programmes.filter((p) => p.status === 'draft').length})
        </button>
      </div>

      {/* Programme Cards List */}
      <div className="space-y-4">
        {filteredProgrammes.map((p) => (
          <Card
            key={p.id}
            className="p-6 border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-civic-indigo-600 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-100">
                  {p.code}
                </span>
                <StatusChip status={p.status} />
              </div>
              <CardTitle className="text-base font-bold text-slate-900">{p.title}</CardTitle>
              <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500">
                <span>Theme: <strong className="text-slate-700">{p.theme}</strong></span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {p.institutionIds.length} Institutions
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {p.courseIds.length} Courses
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <Button
                size="sm"
                variant={p.status === 'active' ? 'outline' : 'primary'}
                onClick={() => handleToggleStatus(p)}
                className="flex items-center gap-1 text-xs"
              >
                <Power className="w-3.5 h-3.5" />
                <span>{p.status === 'active' ? 'Set as Draft' : 'Activate'}</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Programme Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold font-heading text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-civic-indigo-600" />
                <span>Deploy New Programme</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgramme} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Programme Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. RAJ-DELIB-2026"
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Programme Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Statewide Youth Urban Transit Council"
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Thematic Focus
                </label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description & Scope
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the cohort objectives and civic action targets..."
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Initial Status
                </label>
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'active'}
                      onChange={() => setStatus('active')}
                    />
                    <span>Active Deployment</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === 'draft'}
                      onChange={() => setStatus('draft')}
                    />
                    <span>Draft Review</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  <span>Create Programme</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
