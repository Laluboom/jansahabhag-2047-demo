import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  Proposition,
  PropositionOutcome,
  DissentRecord,
  Reflection,
  User,
} from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea, Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  ArrowLeft,
  ArrowRight,
  Vote,
  Users,
  HelpCircle,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  Layers,
  ShieldCheck,
  AlertTriangle,
  History,
  Award,
  ChevronLeft,
  ChevronRight,
  Send,
  ThumbsUp,
  Scale,
  Compass,
  FileText,
  Lock,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const STAGES: { stage: AssemblyStage; label: string; number: number; desc: string }[] = [
  { stage: 'orientation', label: 'Orientation', number: 1, desc: 'Chamber rules, democratic principles & role briefing' },
  { stage: 'question', label: 'Central Question', number: 2, desc: 'Problem framing, community scope & constraints' },
  { stage: 'evidence_review', label: 'Evidence Review', number: 3, desc: 'Audited counts, photos, sensor logs & field data' },
  { stage: 'deliberation', label: 'Deliberation', number: 4, desc: 'Evidence-based debate & constructive peer inquiry' },
  { stage: 'proposition_draft', label: 'Proposition Draft', number: 5, desc: 'Structured civic proposition & action specifications' },
  { stage: 'revision', label: 'Revisions & Amendments', number: 6, desc: 'Iterative amendments and version history' },
  { stage: 'support_dissent', label: 'Support & Dissent', number: 7, desc: 'Consensus mapping and preserved minority viewpoints' },
  { stage: 'outcome', label: 'Final Outcome', number: 8, desc: 'Binding outcome resolution & municipal deputation' },
  { stage: 'reflection', label: 'Civic Reflection', number: 9, desc: 'Reflective learning, ethical values & Passport update' },
];

export const AssemblySessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const stageFromUrl = searchParams.get('stage') as AssemblyStage | null;
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const navigate = useNavigate();

  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [userRole, setUserRole] = useState<AssemblyRole | null>(null);
  const [allRoles, setAllRoles] = useState<AssemblyRole[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [proposition, setProposition] = useState<Proposition | null>(null);
  const [reflections, setReflections] = useState<Reflection[]>([]);

  // Stage state (URL query param -> assembly.currentStage -> default deliberation)
  const [activeStage, setActiveStage] = useState<AssemblyStage>(stageFromUrl || 'deliberation');

  const handleSetStage = (stage: AssemblyStage) => {
    setActiveStage(stage);
    setSearchParams({ stage }, { replace: true });
  };

  // Sync if URL stage changes
  useEffect(() => {
    if (stageFromUrl && stageFromUrl !== activeStage) {
      setActiveStage(stageFromUrl);
    }
  }, [stageFromUrl]);

  // Contribution Form State
  const [newContribText, setNewContribText] = useState('');
  const [contribType, setContribType] = useState<ContributionType>('question');
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [isSubmittingContrib, setIsSubmittingContrib] = useState(false);
  const [contribSuccessMsg, setContribSuccessMsg] = useState<string | null>(null);

  // Revision Form State
  const [revisionSummary, setRevisionSummary] = useState('');
  const [amendedPropositionText, setAmendedPropositionText] = useState('');
  const [isSubmittingRevision, setIsSubmittingRevision] = useState(false);
  const [revisionSuccessMsg, setRevisionSuccessMsg] = useState<string | null>(null);

  // Dissent Form State
  const [dissentReason, setDissentReason] = useState('');
  const [dissentAmendment, setDissentAmendment] = useState('');
  const [isSubmittingDissent, setIsSubmittingDissent] = useState(false);

  // Outcome Finalisation State
  const [selectedOutcome, setSelectedOutcome] = useState<PropositionOutcome>('QUALIFIED_SUPPORT');
  const [isFinalisingOutcome, setIsFinalisingOutcome] = useState(false);
  const [finalisationError, setFinalisationError] = useState<string | null>(null);

  // Reflection Form State
  const [reflectionText, setReflectionText] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([
    'Trust (Vishwas)',
    'Empathy (Samvedana)',
    'Evidence-First',
  ]);
  const [isSubmittingReflection, setIsSubmittingReflection] = useState(false);
  const [reflectionSuccess, setReflectionSuccess] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id || !currentUser) return;
      if (!assembly) setIsLoading(true);
      try {
        const [asm, r, roles, contribs, allUsers, refls] = await Promise.all([
          demoRepository.getAssembly(id),
          demoRepository.getUserAssemblyRole(id, currentUser.id),
          demoRepository.getAssemblyRoles(id),
          demoRepository.getContributions(id),
          demoRepository.getUsers(),
          demoRepository.getCivicReflections(currentUser.id),
        ]);

        setAssembly(asm);
        setUserRole(r);
        setAllRoles(roles);
        setContributions(contribs);
        setReflections(refls.filter((refl) => refl.contextId === id));

        if (asm) {
          if (!stageFromUrl && !activeStage) {
            setActiveStage(asm.currentStage);
          }
          const pUsers = allUsers.filter((u) => asm.participantUserIds.includes(u.id));
          setParticipants(pUsers);

          if (asm.evidenceIds.length) {
            const evs = await Promise.all(
              asm.evidenceIds.map((eid) => demoRepository.getEvidence(eid))
            );
            setEvidenceList(evs.filter((e): e is Evidence => e !== null));
          }

          if (asm.propositionId) {
            const prop = await demoRepository.getProposition(asm.propositionId);
            setProposition(prop);
            if (prop) {
              setAmendedPropositionText((prev) => prev || prop.proposition);
              setSelectedOutcome(prop.outcome);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load assembly session', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, currentUser, refreshKey]);

  const effectiveStage = activeStage;

  // Stage Stepping
  const currentStageIndex = STAGES.findIndex((s) => s.stage === effectiveStage);

  const goToNextStage = async () => {
    if (currentStageIndex < STAGES.length - 1) {
      const next = STAGES[currentStageIndex + 1].stage;
      handleSetStage(next);
      if (id && assembly && currentUser?.role === 'facilitator') {
        await demoRepository.updateAssemblyStage(id, next);
      }
    }
  };

  const goToPrevStage = () => {
    if (currentStageIndex > 0) {
      handleSetStage(STAGES[currentStageIndex - 1].stage);
    }
  };

  // Add Contribution
  const handleAddContribution = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!id || !currentUser || !newContribText.trim()) return;

    setIsSubmittingContrib(true);
    setContribSuccessMsg(null);
    try {
      await demoRepository.addAssemblyContribution({
        assemblyId: id,
        userId: currentUser.id,
        stage: effectiveStage,
        type: contribType,
        text: newContribText.trim(),
        evidenceIds: selectedEvidenceIds,
        isSubstantive: true,
      });

      setNewContribText('');
      setSelectedEvidenceIds([]);
      setContribSuccessMsg('Substantive contribution submitted! +5 Deliberation Credits awarded.');
      triggerRefresh();
      setTimeout(() => setContribSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to submit contribution', err);
    } finally {
      setIsSubmittingContrib(false);
    }
  };

  // Submit Proposition Revision
  const handleSubmitRevision = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!proposition || !currentUser || !amendedPropositionText.trim()) return;

    setIsSubmittingRevision(true);
    setRevisionSuccessMsg(null);
    try {
      const updated = await demoRepository.updateProposition({
        propositionId: proposition.id,
        updatedBy: currentUser.name,
        changesSummary: revisionSummary.trim() || `Proposed revision v${proposition.version + 1} during Chamber Revision session`,
        proposition: amendedPropositionText.trim(),
      });
      setProposition(updated);
      setRevisionSummary('');
      setRevisionSuccessMsg(`Revision v${updated.version} recorded successfully in proposition history!`);
      triggerRefresh();
      setTimeout(() => setRevisionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to submit revision', err);
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  // Submit Dissent Record
  const handleAddDissent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!proposition || !currentUser || !dissentReason.trim()) return;

    setIsSubmittingDissent(true);
    try {
      const newDissent: DissentRecord = {
        id: `dis_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        reason: dissentReason.trim(),
        suggestedAmendment: dissentAmendment.trim() || 'No explicit amendment provided.',
      };

      const updated = await demoRepository.updateProposition({
        propositionId: proposition.id,
        updatedBy: currentUser.name,
        changesSummary: `Recorded formal dissent by ${currentUser.name}`,
        dissent: [...proposition.dissent, newDissent],
      });

      setProposition(updated);
      setDissentReason('');
      setDissentAmendment('');
      triggerRefresh();
    } catch (err) {
      console.error('Failed to add dissent', err);
    } finally {
      setIsSubmittingDissent(false);
    }
  };

  // Finalise Outcome
  const handleFinaliseOutcome = async () => {
    if (!proposition || !assembly || !currentUser) return;
    setIsFinalisingOutcome(true);
    setFinalisationError(null);
    try {
      const finalised = await demoRepository.finaliseProposition({
        propositionId: proposition.id,
        assemblyId: assembly.id,
        outcome: selectedOutcome,
        updatedBy: currentUser.name,
        changesSummary: `Final outcome resolved to ${selectedOutcome} by ${currentUser.name}`,
      });
      setProposition(finalised);
      triggerRefresh();
      goToNextStage(); // Move to reflection stage
    } catch (err: any) {
      setFinalisationError(err?.message || 'Failed to finalise proposition');
    } finally {
      setIsFinalisingOutcome(false);
    }
  };

  // Submit Reflection
  const handleSubmitReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser || !reflectionText.trim()) return;

    setIsSubmittingReflection(true);
    try {
      await demoRepository.addReflection({
        userId: currentUser.id,
        contextType: 'assembly',
        contextId: id,
        prompt: 'Reflect on how this deliberative process balanced differing stakeholder perspectives and which ethical values guided the resolution.',
        text: reflectionText.trim(),
        valuesHighlighted: selectedValues,
        isPublicInPassport: true,
      });

      setReflectionSuccess(true);
      setReflectionText('');
      triggerRefresh();
    } catch (err) {
      console.error('Failed to submit reflection', err);
    } finally {
      setIsSubmittingReflection(false);
    }
  };

  const toggleValue = (val: string) => {
    if (selectedValues.includes(val)) {
      setSelectedValues(selectedValues.filter((v) => v !== val));
    } else {
      setSelectedValues([...selectedValues, val]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading assembly deliberative chamber">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  if (!assembly) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-4">
        <Link
          to="/assemblies"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assemblies</span>
        </Link>
        <Card className="p-8 text-center space-y-4 border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Vote className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-heading text-slate-900">Assembly Session Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The requested youth assembly deliberative session "{id}" does not exist.
          </p>
          <div className="pt-2">
            <Link to="/assemblies">
              <Button size="sm" variant="primary">
                View All Youth Assemblies
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const isFinalised =
    assembly.status === 'concluded' ||
    assembly.currentStage === 'outcome' ||
    Boolean(proposition?.revisions.some((r) => r.changesSummary?.toLowerCase().includes('final outcome resolved')));

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Session Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to={`/assemblies/${assembly.id}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-civic-teal-400 bg-civic-teal-950 px-2 py-0.5 rounded border border-civic-teal-800">
                Youth Chamber in Session
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                Stage {currentStageIndex + 1}/9: {STAGES[currentStageIndex].label}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold font-heading text-white truncate mt-0.5">
              {assembly.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {proposition && (
            <Link to={`/propositions/${proposition.id}`}>
              <Button size="sm" variant="outline" className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 text-xs">
                <Layers className="w-3.5 h-3.5 mr-1" />
                <span>Proposition Record</span>
              </Button>
            </Link>
          )}

          <Link to="/passport">
            <Button size="sm" variant="outline" className="bg-slate-800 text-civic-saffron-400 border-slate-700 hover:bg-slate-700 text-xs">
              <Award className="w-3.5 h-3.5 mr-1" />
              <span>Civic Passport</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 3-Column Main Deliberation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 3 Columns: 9 Stages Nav + Role Briefing */}
        <div className="lg:col-span-3 space-y-4">
          {/* Stages Navigation Card */}
          <Card className="border-slate-200 p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 font-heading">
                Chamber Stages (9)
              </h2>
              <span className="text-[11px] font-mono text-civic-teal-700 font-bold">
                {currentStageIndex + 1}/9
              </span>
            </div>

            <div className="space-y-1">
              {STAGES.map((st) => {
                const isCurrent = effectiveStage === st.stage;
                const isPassed = currentStageIndex > STAGES.findIndex((s) => s.stage === st.stage);

                return (
                  <button
                    key={st.stage}
                    type="button"
                    onClick={() => handleSetStage(st.stage)}
                    className={`w-full text-left flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                      isCurrent
                        ? 'bg-civic-teal-600 text-white font-bold shadow-xs'
                        : isPassed
                        ? 'bg-civic-teal-50/70 text-civic-teal-900 font-medium hover:bg-civic-teal-100/50'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate">
                      {st.number}. {st.label}
                    </span>
                    {isCurrent ? (
                      <Compass className="w-3.5 h-3.5 text-white shrink-0" />
                    ) : isPassed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-civic-teal-600 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* User Allocated Role Card */}
          {userRole && (
            <Card className="border-civic-indigo-200 bg-civic-indigo-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-civic-indigo-900">
                  Your Role: {userRole.roleName}
                </span>
                <Sparkles className="w-4 h-4 text-civic-indigo-600" />
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                As <strong>{userRole.roleName}</strong>, probe infrastructure feasibility and test assumptions using field evidence.
              </p>

              <div className="space-y-1.5 pt-1 border-t border-civic-indigo-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Role Inquiries:
                </span>
                <div className="space-y-1">
                  {userRole.promptSuggestions.slice(0, 2).map((prompt, i) => (
                    <div
                      key={i}
                      onClick={() => setNewContribText(prompt)}
                      className="p-2 rounded bg-white border border-civic-indigo-200 text-[11px] text-slate-700 italic cursor-pointer hover:border-civic-indigo-500 hover:bg-civic-indigo-50 transition-colors"
                      title="Click to copy into contribution box"
                    >
                      "{prompt}"
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Center 6 Columns: Interactive Stage Workspace */}
        <div className="lg:col-span-6 space-y-4">
          <Card className="border-slate-200 p-5 sm:p-6 space-y-5 bg-white min-h-[540px] flex flex-col justify-between">
            {/* Stage Title Header */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-civic-teal-700">
                    Stage {currentStageIndex + 1} of 9
                  </span>
                  <h2 className="text-xl font-bold font-heading text-slate-900">
                    {STAGES[currentStageIndex].label}
                  </h2>
                </div>
                <span className="text-xs text-slate-500 max-w-xs text-right hidden sm:inline">
                  {STAGES[currentStageIndex].desc}
                </span>
              </div>

              {/* STAGE 1: ORIENTATION */}
              {effectiveStage === 'orientation' && (
                <div className="space-y-4 pt-4 text-xs text-slate-700">
                  <div className="p-4 rounded-xl bg-civic-indigo-50 border border-civic-indigo-200 space-y-2">
                    <h3 className="text-sm font-bold text-civic-indigo-950 flex items-center gap-1.5 font-heading">
                      <Scale className="w-4 h-4 text-civic-indigo-600" />
                      Principles of Deliberative Youth Assemblies
                    </h3>
                    <p className="leading-relaxed">
                      This is a non-adversarial democratic chamber. Unlike parliamentary debate where sides compete to defeat one another, our objective is mutual inquiry, ground evidence synthesis, and co-creating a sustainable municipal proposition.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                      <strong className="text-slate-900 block">1. Evidence-First Dialogue</strong>
                      <p className="text-[11px] text-slate-600">Claims should cite verified observation logs, speed counts, or photos.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                      <strong className="text-slate-900 block">2. Constructive Inquiry</strong>
                      <p className="text-[11px] text-slate-600">Question assumptions to strengthen the engineering and civic viability.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                      <strong className="text-slate-900 block">3. Preserving Dissent</strong>
                      <p className="text-[11px] text-slate-600">Minority concerns are formally recorded and preserved alongside the proposition.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                      <strong className="text-slate-900 block">4. Binding Municipal Delivery</strong>
                      <p className="text-[11px] text-slate-600">Final resolutions are formally deputed to Nagar Nigam Ward Committees.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 2: QUESTION */}
              {effectiveStage === 'question' && (
                <div className="space-y-4 pt-4 text-xs text-slate-700">
                  <div className="p-4 rounded-xl bg-civic-teal-50 border border-civic-teal-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-civic-teal-800">
                      Central Deliberation Focus
                    </span>
                    <h3 className="text-base font-bold font-heading text-slate-900">
                      "{assembly.question}"
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border border-slate-200 space-y-1">
                      <strong className="text-slate-900 text-xs">Target Zone & Scope</strong>
                      <p className="text-slate-600">Navchetna School perimeter (Madhyam Marg & Shipra Path intersection), Ward 24, Mansarovar.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 space-y-1">
                      <strong className="text-slate-900 text-xs">Affected Community Stakeholders</strong>
                      <p className="text-slate-600">800+ daily student walkers (ages 6–18), elderly morning walkers, city bus commuters, and local vendors.</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 space-y-1">
                      <strong className="text-slate-900 text-xs">Engineering Constraints</strong>
                      <p className="text-slate-600">Road width: 11 meters; Peak speed: 42 km/h; Monsoon drainage flow requirements.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 3: EVIDENCE REVIEW */}
              {effectiveStage === 'evidence_review' && (
                <div className="space-y-3 pt-4 text-xs">
                  <p className="text-slate-600">
                    Review and verify all field audits submitted by student researchers before drafting proposals:
                  </p>
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {evidenceList.map((ev) => (
                      <div key={ev.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-civic-teal-800 bg-civic-teal-50 px-2 py-0.5 rounded border border-civic-teal-200">
                            {ev.id}
                          </span>
                          <StatusChip status={ev.verificationStatus} />
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs">{ev.title}</h4>
                        <p className="text-slate-600 text-[11px]">{ev.description}</p>
                        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/60">
                          <span>Owner: {ev.ownerName}</span>
                          <span>Location: {ev.location || 'Navchetna Zone'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STAGE 4: DELIBERATION STREAM & FORM */}
              {effectiveStage === 'deliberation' && (
                <div className="space-y-4 pt-4">
                  {/* Contribution Stream */}
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {contributions.map((c) => {
                      const isMine = c.userId === currentUser?.id;

                      return (
                        <div
                          key={c.id}
                          className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                            isMine
                              ? 'border-civic-indigo-300 bg-civic-indigo-50/40 shadow-2xs'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 font-heading">
                                {c.userName}
                              </span>
                              {isMine ? (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-civic-indigo-600 text-white font-bold">
                                  Your Contribution
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 capitalize">
                                  Scripted Peer &bull; {c.type}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Stage: {c.stage.replace('_', ' ')}
                            </span>
                          </div>

                          <p className="text-slate-800 leading-relaxed">{c.text}</p>

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

                  {contribSuccessMsg && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{contribSuccessMsg}</span>
                    </div>
                  )}

                  {/* Add Contribution Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddContribution(e);
                    }}
                    className="pt-3 border-t border-slate-100 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-800 font-heading">
                        Add Substantive Deliberation Contribution
                      </label>
                      <select
                        value={contribType}
                        onChange={(e) => setContribType(e.target.value as ContributionType)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-700"
                      >
                        <option value="question">Constructive Question</option>
                        <option value="argument">Evidence-Based Argument</option>
                        <option value="counter_point">Counter Point</option>
                        <option value="synthesis">Synthesis & Amendment</option>
                      </select>
                    </div>

                    <Textarea
                      placeholder="Enter your inquiry, argument, or amendment citing evidence (e.g. #ev_aarav_traffic_count_01)..."
                      value={newContribText}
                      onChange={(e) => setNewContribText(e.target.value)}
                      rows={3}
                      required
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-civic-saffron-600" />
                        <span>Awards <strong>+5 Deliberation Credits</strong></span>
                      </span>

                      <Button
                        size="sm"
                        variant="teal"
                        type="button"
                        onClick={handleAddContribution}
                        isLoading={isSubmittingContrib}
                        disabled={newContribText.trim().length < 5}
                      >
                        <Send className="w-3.5 h-3.5 mr-1" />
                        <span>Submit Contribution</span>
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* STAGE 5: PROPOSITION DRAFT */}
              {effectiveStage === 'proposition_draft' && proposition && (
                <div className="space-y-4 pt-4 text-xs text-slate-800">
                  <div className="p-4 rounded-xl bg-civic-teal-50/40 border border-civic-teal-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-civic-teal-900 uppercase tracking-wider text-[11px]">
                        Draft Civic Proposition (v{proposition.version})
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white border font-bold">
                        Outcome: {proposition.outcome}
                      </span>
                    </div>
                    <div className="whitespace-pre-line leading-relaxed font-medium text-slate-900">
                      {proposition.proposition}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                      <strong className="text-slate-900 block">Problem Identified</strong>
                      <p className="text-[11px] text-slate-600">{proposition.problem}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                      <strong className="text-slate-900 block">Core Deliberative Insight</strong>
                      <p className="text-[11px] text-slate-600">{proposition.insight}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 space-y-1">
                    <strong className="text-slate-900 block">Next Implementation Step</strong>
                    <p className="text-slate-600">{proposition.nextStep}</p>
                  </div>
                </div>
              )}

              {/* STAGE 6: REVISION & AMENDMENTS */}
              {effectiveStage === 'revision' && proposition && (
                <div className="space-y-4 pt-4 text-xs">
                  {revisionSuccessMsg && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{revisionSuccessMsg}</span>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSubmitRevision(e);
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Edit / Amend Proposed Action Specifications (v{proposition.version + 1}):
                      </label>
                      <Textarea
                        value={amendedPropositionText}
                        onChange={(e) => setAmendedPropositionText(e.target.value)}
                        rows={5}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Revision Summary & Rationale:
                      </label>
                      <Input
                        placeholder="e.g. Added IRC 1:15 approach ramp gradient and monsoon cross-drainage pipe"
                        value={revisionSummary}
                        onChange={(e) => setRevisionSummary(e.target.value)}
                        required
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="primary"
                        type="button"
                        onClick={handleSubmitRevision}
                        isLoading={isSubmittingRevision}
                      >
                        <span>Submit Revision (v{proposition.version + 1})</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </form>

                  {/* Revisions History List */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Revision Trail ({proposition.revisions.length})
                    </span>
                    <div className="space-y-1.5">
                      {proposition.revisions.map((rev) => (
                        <div key={rev.version} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="font-bold text-civic-indigo-700 mr-2">v{rev.version}</span>
                            <span className="text-slate-800 font-medium">{rev.changesSummary}</span>
                          </div>
                          <span className="text-slate-400">{formatDate(rev.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 7: SUPPORT & DISSENT */}
              {effectiveStage === 'support_dissent' && proposition && (
                <div className="space-y-4 pt-4 text-xs">
                  {/* Support Profile */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-base font-extrabold text-emerald-600 block">{proposition.supportProfile.stronglySupport}</span>
                      <span className="text-[10px] text-slate-500">Strongly Support</span>
                    </div>
                    <div>
                      <span className="text-base font-extrabold text-civic-teal-600 block">{proposition.supportProfile.supportWithModifications}</span>
                      <span className="text-[10px] text-slate-500">With Amendments</span>
                    </div>
                    <div>
                      <span className="text-base font-extrabold text-rose-600 block">{proposition.dissent.length}</span>
                      <span className="text-[10px] text-slate-500">Preserved Dissent</span>
                    </div>
                  </div>

                  {/* Preserved Dissent Records */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-civic-indigo-600" />
                      <span>Preserved Dissent Records ({proposition.dissent.length})</span>
                    </span>

                    {proposition.dissent.map((d) => (
                      <div key={d.id} className="p-3 rounded-lg bg-rose-50/40 border border-rose-200 text-xs space-y-1">
                        <strong className="text-slate-900 block">Dissent by {d.userName}:</strong>
                        <p className="text-slate-700 italic">"{d.reason}"</p>
                        <p className="text-[11px] text-civic-indigo-700"><strong>Amendment:</strong> {d.suggestedAmendment}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Dissent Record Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddDissent(e);
                    }}
                    className="pt-3 border-t border-slate-100 space-y-2.5"
                  >
                    <span className="text-xs font-bold text-slate-800 block">Record Formal Dissent / Minority Viewpoint:</span>
                    <Input
                      placeholder="Reason for dissent or remaining concern..."
                      value={dissentReason}
                      onChange={(e) => setDissentReason(e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Suggested amendment to resolve this dissent..."
                      value={dissentAmendment}
                      onChange={(e) => setDissentAmendment(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={handleAddDissent}
                        isLoading={isSubmittingDissent}
                      >
                        <span>Record Dissent</span>
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* STAGE 8: OUTCOME FINALISATION */}
              {effectiveStage === 'outcome' && proposition && (
                <div className="space-y-4 pt-4 text-xs text-slate-700">
                  {isFinalised ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                        <Lock className="w-4 h-4 text-emerald-600" />
                        <span>Outcome Locked: {proposition.outcome}</span>
                      </div>
                      <p className="text-emerald-800">
                        This chamber resolution has been finalised and permanently recorded (v{proposition.version}). Duplicate finalisation is prevented.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-slate-600">
                        Declare and finalise the consensus outcome of this chamber based on support records and preserved dissent:
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        {(['CONSENSUS', 'QUALIFIED_SUPPORT', 'SPLIT_DECISION', 'INSUFFICIENT_BASIS'] as PropositionOutcome[]).map((oc) => (
                          <button
                            key={oc}
                            type="button"
                            onClick={() => setSelectedOutcome(oc)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              selectedOutcome === oc
                                ? 'bg-civic-teal-600 text-white border-civic-teal-700 font-bold shadow-xs'
                                : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            <span className="block text-xs font-heading">{oc.replace('_', ' ')}</span>
                          </button>
                        ))}
                      </div>

                      {finalisationError && (
                        <div className="p-3 rounded bg-rose-50 border border-rose-200 text-rose-700">
                          {finalisationError}
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <Button
                          size="md"
                          variant="primary"
                          type="button"
                          isLoading={isFinalisingOutcome}
                          onClick={handleFinaliseOutcome}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          <span>Finalise Chamber Resolution</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STAGE 9: REFLECTION */}
              {effectiveStage === 'reflection' && (
                <div className="space-y-4 pt-4 text-xs">
                  {reflectionSuccess ? (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2 text-emerald-900">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Civic Reflection Recorded!</span>
                      </div>
                      <p>
                        Your reflective essay has been added to your Passport history and <strong>+5 Reflection Credits</strong> have been awarded.
                      </p>
                      <Link to="/passport">
                        <Button size="sm" variant="teal" className="mt-2">
                          <span>View Civic Passport</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmitReflection(e);
                      }}
                      className="space-y-3"
                    >
                      <div className="p-3 rounded-lg bg-civic-indigo-50/70 border border-civic-indigo-200 text-slate-800 space-y-1">
                        <strong className="text-civic-indigo-950 block">Reflective Prompt:</strong>
                        <p className="italic">
                          "How did this deliberative process help balance varying stakeholder needs (students, commercial drivers, police)? What universal human values guided your perspective?"
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                          Universal Values Highlighted:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'Trust (Vishwas)',
                            'Empathy (Samvedana)',
                            'Evidence-First',
                            'Universal Safety',
                            'Civic Responsibility',
                            'Courage (Sahasa)',
                          ].map((val) => {
                            const isSel = selectedValues.includes(val);
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => toggleValue(val)}
                                className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                                  isSel
                                    ? 'bg-civic-indigo-600 text-white border-civic-indigo-700 font-semibold shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                #{val}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Your Reflection Essay:
                        </label>
                        <Textarea
                          placeholder="Write your honest reflections on navigating disagreement, respecting dissent, and achieving evidence-based community consensus..."
                          value={reflectionText}
                          onChange={(e) => setReflectionText(e.target.value)}
                          rows={4}
                          required
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-slate-500">
                          Earns +5 Reflection Credits in Passport
                        </span>
                        <Button
                          size="sm"
                          variant="teal"
                          type="button"
                          onClick={handleSubmitReflection}
                          isLoading={isSubmittingReflection}
                        >
                          <span>Submit Reflection (+5)</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Past Reflections */}
                  {reflections.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                        Saved Reflections in History
                      </span>
                      {reflections.map((refl) => (
                        <div key={refl.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                          <p className="text-slate-800 italic">"{refl.text}"</p>
                          <div className="flex gap-1 pt-1">
                            {refl.valuesHighlighted.map((v) => (
                              <span key={v} className="text-[10px] text-civic-indigo-700 font-semibold">#{v}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stepping Controls Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={goToPrevStage}
                disabled={currentStageIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                <span>Previous Stage</span>
              </Button>

              <div className="text-xs text-slate-500">
                Stage {currentStageIndex + 1} of {STAGES.length}
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={goToNextStage}
                disabled={currentStageIndex === STAGES.length - 1}
              >
                <span>Next Stage</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Right 3 Columns: People & Chamber Evidence Pool */}
        <div className="lg:col-span-3 space-y-4">
          {/* Deliberators Card */}
          <Card className="border-slate-200 p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-heading">
                <Users className="w-3.5 h-3.5 text-civic-indigo-600" />
                <span>Chamber Members ({participants.length})</span>
              </h3>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {participants.map((p) => {
                const r = allRoles.find((role) => role.userId === p.id);
                const isMe = p.id === currentUser?.id;

                return (
                  <div
                    key={p.id}
                    className={`p-2 rounded-lg border flex items-center justify-between text-[11px] ${
                      isMe ? 'bg-civic-indigo-50 border-civic-indigo-200' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Avatar src={p.avatar} alt={p.name} size="sm" />
                      <span className="font-semibold text-slate-900 truncate">
                        {p.name} {isMe && '(You)'}
                      </span>
                    </div>
                    <span className="text-[10px] text-civic-indigo-700 font-semibold shrink-0">
                      {r ? r.roleName : 'Delegate'}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Chamber Evidence Pool */}
          <Card className="border-slate-200 p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 font-heading">
                <FileCheck2 className="w-3.5 h-3.5 text-civic-teal-600" />
                <span>Evidence Pool ({evidenceList.length})</span>
              </h3>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {evidenceList.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    if (!selectedEvidenceIds.includes(ev.id)) {
                      setSelectedEvidenceIds([...selectedEvidenceIds, ev.id]);
                    }
                  }}
                  className={`p-2 rounded-lg border text-[11px] space-y-1 cursor-pointer transition-colors ${
                    selectedEvidenceIds.includes(ev.id)
                      ? 'bg-civic-teal-50 border-civic-teal-300'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Click to cite in contribution"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-civic-teal-800 font-bold">{ev.id}</span>
                    <StatusChip status={ev.verificationStatus} />
                  </div>
                  <p className="font-semibold text-slate-800 truncate">{ev.title}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

