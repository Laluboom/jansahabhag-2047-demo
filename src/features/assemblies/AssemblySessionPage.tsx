import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import {
  Assembly,
  AssemblyRole,
  Contribution,
  Evidence,
  AssemblyStage,
  ContributionType,
} from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Input';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  ArrowLeft,
  Vote,
  Users,
  HelpCircle,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const AssemblySessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [userRole, setUserRole] = useState<AssemblyRole | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [newText, setNewText] = useState('');
  const [contribType, setContribType] = useState<ContributionType>('question');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const stages: AssemblyStage[] = [
    'orientation',
    'question',
    'evidence_review',
    'deliberation',
    'proposition_draft',
    'revision',
    'support_dissent',
    'outcome',
    'reflection',
  ];

  useEffect(() => {
    async function load() {
      if (!id || !currentUser) return;
      setIsLoading(true);
      try {
        const [asm, r, contribs] = await Promise.all([
          demoRepository.getAssembly(id),
          demoRepository.getUserAssemblyRole(id, currentUser.id),
          demoRepository.getContributions(id),
        ]);
        setAssembly(asm);
        setUserRole(r);
        setContributions(contribs);

        if (asm?.evidenceIds.length) {
          const evs = await Promise.all(
            asm.evidenceIds.map((eid) => demoRepository.getEvidence(eid))
          );
          setEvidenceList(evs.filter((e): e is Evidence => e !== null));
        }
      } catch (err) {
        console.error('Failed to load assembly session', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, currentUser, refreshKey]);

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser || !newText.trim() || !assembly) return;

    setIsSubmitting(true);
    try {
      await demoRepository.addAssemblyContribution({
        assemblyId: id,
        userId: currentUser.id,
        stage: assembly.currentStage,
        type: contribType,
        text: newText.trim(),
        evidenceIds: assembly.evidenceIds.slice(0, 2),
      });
      setNewText('');
      triggerRefresh();
    } catch (err) {
      console.error('Failed to add contribution', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceStage = async (newStage: AssemblyStage) => {
    if (!id) return;
    await demoRepository.updateAssemblyStage(id, newStage);
    triggerRefresh();
  };

  if (isLoading || !assembly) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  const isFacilitator = currentUser?.role === 'facilitator';

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to={`/assemblies/${assembly.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-civic-teal-400">
                Chamber In Session
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                Stage: {assembly.currentStage.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-lg font-bold font-heading text-white truncate mt-0.5">
              {assembly.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {assembly.propositionId && (
            <Link to={`/propositions/${assembly.propositionId}`}>
              <Button size="sm" variant="outline" className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 text-xs">
                <Layers className="w-3.5 h-3.5 mr-1" />
                <span>View Proposition</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 3-Column Deliberation Chamber Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 3 Cols: Stages & Role Prompts */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-slate-200 p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Assembly Stages
            </h2>
            <div className="space-y-1">
              {stages.map((st, idx) => {
                const isCurrent = assembly.currentStage === st;
                return (
                  <div
                    key={st}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                      isCurrent
                        ? 'bg-civic-teal-50 text-civic-teal-900 font-bold border border-civic-teal-200 shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{idx + 1}. {st.replace('_', ' ')}</span>
                    {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-civic-teal-600" />}
                  </div>
                );
              })}
            </div>

            {/* Facilitator Stage Controller */}
            {isFacilitator && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-civic-indigo-700 block">
                  Facilitator Stage Control
                </span>
                <select
                  value={assembly.currentStage}
                  onChange={(e) => handleAdvanceStage(e.target.value as AssemblyStage)}
                  className="w-full text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  {stages.map((st) => (
                    <option key={st} value={st}>
                      Switch to: {st.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </Card>

          {/* User Role Card */}
          {userRole && (
            <Card className="border-civic-indigo-200 bg-civic-indigo-50/40 p-4 space-y-2">
              <span className="text-[11px] font-bold uppercase text-civic-indigo-900 block">
                Your Role: {userRole.roleName}
              </span>
              <p className="text-[11px] text-slate-600">
                Use constructive inquiry to test data & engineering assumptions.
              </p>
            </Card>
          )}
        </div>

        {/* Center 6 Cols: Discussion Feed & Contribution Form */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border-slate-200 p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-civic-teal-600" />
                <span>Chamber Deliberation Stream</span>
              </h2>
              <span className="text-xs text-slate-500">
                {contributions.length} Substantive Entries
              </span>
            </div>

            {/* Contributions List */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {contributions.map((c) => {
                const isMine = c.userId === currentUser?.id;
                return (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                      isMine
                        ? 'border-civic-indigo-300 bg-civic-indigo-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 font-heading">
                          {c.userName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 capitalize">
                          {c.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Stage: {c.stage.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed">{c.text}</p>

                    {c.evidenceIds.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-civic-teal-700 font-semibold pt-1">
                        <FileCheck2 className="w-3 h-3" />
                        <span>Cites Evidence: {c.evidenceIds.join(', ')}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add Contribution Form */}
            <form onSubmit={handleAddContribution} className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 font-heading">
                  Contribute to Active Deliberation
                </label>
                <div className="flex items-center gap-1 text-xs">
                  <select
                    value={contribType}
                    onChange={(e) => setContribType(e.target.value as ContributionType)}
                    className="text-xs px-2 py-1 rounded border border-slate-300 bg-white text-slate-700"
                  >
                    <option value="question">Constructive Question</option>
                    <option value="argument">Evidence-Based Argument</option>
                    <option value="counter_point">Counter Point</option>
                    <option value="synthesis">Synthesis & Amendment</option>
                  </select>
                </div>
              </div>

              <Textarea
                placeholder="Share your inquiry, citation of field data, or proposal amendment..."
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                rows={3}
                required
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Earns +5 Deliberation Credits in Passport
                </span>
                <Button size="sm" variant="teal" type="submit" isLoading={isSubmitting} disabled={!newText.trim()}>
                  <span>Submit Contribution</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right 3 Cols: Evidence Pool */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-slate-200 p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-civic-teal-600" />
              <span>Chamber Evidence Pool</span>
            </h2>
            <div className="space-y-2.5">
              {evidenceList.map((ev) => (
                <div key={ev.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 truncate">{ev.title}</span>
                    <StatusChip status={ev.verificationStatus} />
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-2">{ev.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
