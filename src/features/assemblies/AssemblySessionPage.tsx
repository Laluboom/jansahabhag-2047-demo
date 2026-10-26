import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import {
  Assembly,
  AssemblyRole,
  Contribution,
  Evidence,
  AssemblyStage,
  CANONICAL_ASSEMBLY_STAGES,
  CANONICAL_ASSEMBLY_ROLES,
  AssemblyRoleType,
  AssemblyRolePower,
  ContributionType,
  Proposition,
  PropositionOutcome,
  ParticipantResponseState,
  DissentRecord,
  Reflection,
  User,
  Session,
} from '../../types/domain';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea, Input } from '../../components/ui/Input';
import { Avatar } from '../../components/ui/Avatar';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  SessionSeating,
  SeatModel,
  SeatStatus,
  SeatingQuotaSummary,
  computeSeatingQuotaFromAllocations,
  SessionTextTurn,
} from '../../components/session';
import {
  ArrowLeft,
  ArrowRight,
  Vote,
  Sparkles,
  CheckCircle2,
  FileCheck2,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  Send,
  Scale,
  Lock,
  ExternalLink,
  BookOpen,
  UserCheck,
  Mic,
  Volume2,
  AlertCircle,
  X,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const ROLE_POWER_MAP: Record<AssemblyRoleType, { power: AssemblyRolePower; obligation: string; prompt: string }> = {
  Thinker: {
    power: 'Question Setter',
    obligation: 'Enablers and Troubleshooters must review and address the inquiry.',
    prompt: 'Set a constructive, evidence-based inquiry challenging assumptions about this issue...',
  },
  Enabler: {
    power: 'Feasibility Check',
    obligation: 'Shapers must incorporate validated owners and feasibility conditions into draft.',
    prompt: 'Specify concrete engineering, budgetary, or statutory feasibility conditions...',
  },
  Troubleshooter: {
    power: 'Red Flag',
    obligation: 'Shapers and Enablers must record specific mitigations in proposition.',
    prompt: 'Raise an evidence-grounded risk, unintended consequence, or safety hazard...',
  },
  Shaper: {
    power: 'Proposition Call',
    obligation: 'Full assembly responds across four participant response states.',
    prompt: 'Draft or synthesize a balanced proposition amendment for assembly review...',
  },
};

export const AssemblySessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const stageFromUrlRaw = searchParams.get('stage');
  const stageFromUrl: AssemblyStage | null = (
    stageFromUrlRaw === 'reflection' || stageFromUrlRaw === 'outcome' || stageFromUrlRaw === 'resolution'
      ? 'final_assembly'
      : (stageFromUrlRaw && CANONICAL_ASSEMBLY_STAGES.some((s) => s.stage === stageFromUrlRaw)
          ? (stageFromUrlRaw as AssemblyStage)
          : null)
  );
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [userRole, setUserRole] = useState<AssemblyRole | null>(null);
  const [allRoles, setAllRoles] = useState<AssemblyRole[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [proposition, setProposition] = useState<Proposition | null>(null);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [linkedSession, setLinkedSession] = useState<Session | null>(null);

  // Active Stage
  const [activeStage, setActiveStage] = useState<AssemblyStage>(stageFromUrl || 'frame');
  const [stageChangeError, setStageChangeError] = useState<string | null>(null);

  // Mobile Role Filter
  const [mobileRoleFilter, setMobileRoleFilter] = useState<AssemblyRoleType | 'ALL'>('ALL');

  // Modals & Panels
  const [showRulebookModal, setShowRulebookModal] = useState(false);
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Rulebook Acknowledgment
  const [rulebookNoticeDismissed, setRulebookNoticeDismissed] = useState(false);

  // Contribution Form State
  const [newContribText, setNewContribText] = useState('');
  const [contribType, setContribType] = useState<ContributionType>('question');
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [isSubmittingContrib, setIsSubmittingContrib] = useState(false);
  const [contribSuccessMsg, setContribSuccessMsg] = useState<string | null>(null);

  // Role Power Action Form State
  const [powerActionTitle, setPowerActionTitle] = useState('');
  const [powerActionDesc, setPowerActionDesc] = useState('');
  const [isSubmittingPower, setIsSubmittingPower] = useState(false);
  const [powerSuccessMsg, setPowerSuccessMsg] = useState<string | null>(null);
  const [respondingToActionId, setRespondingToActionId] = useState<string | null>(null);
  const [actionResponseNote, setActionResponseNote] = useState('');
  const [isSubmittingActionResponse, setIsSubmittingActionResponse] = useState(false);

  // Final Assembly Response Voting
  const [myResponseState, setMyResponseState] = useState<ParticipantResponseState>('Support');
  const [myResponseReason, setMyResponseReason] = useState('');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [responseSuccessMsg, setResponseSuccessMsg] = useState<string | null>(null);

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

  // Role Override State (Chair/Facilitator)
  const [overrideTargetUserId, setOverrideTargetUserId] = useState('');
  const [overrideNewRole, setOverrideNewRole] = useState<AssemblyRoleType>('Thinker');
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);

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

  const handleSetStage = (stage: AssemblyStage) => {
    setActiveStage(stage);
    setSearchParams({ stage }, { replace: true });
    setStageChangeError(null);
  };

  useEffect(() => {
    if (stageFromUrl && stageFromUrl !== activeStage) {
      setActiveStage(stageFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageFromUrl]);

  useEffect(() => {
    async function load() {
      if (!id || !currentUser) return;
      if (!assembly) setIsLoading(true);
      try {
        const [asm, r, roles, contribs, allUsers, refls, sess] = await Promise.all([
          demoRepository.getAssembly(id),
          demoRepository.getUserAssemblyRole(id, currentUser.id),
          demoRepository.getAssemblyRoles(id),
          demoRepository.getContributions(id),
          demoRepository.getUsers(),
          demoRepository.getCivicReflections(currentUser.id),
          demoRepository.getSession('sess_jaipur_01'),
        ]);

        setAssembly(asm);
        setUserRole(r);
        setAllRoles(roles);
        setContributions(contribs);
        setReflections(refls.filter((refl) => refl.contextId === id));
        if (sess && sess.assemblyId === id) {
          setLinkedSession(sess);
        }

        if (asm) {
          if (stageFromUrl) {
            setActiveStage(stageFromUrl);
          } else if (!stageFromUrlRaw && !activeStage) {
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

              // Pre-fill user's existing response if any
              const existingResp = prop.participantResponses?.find((resp) => resp.userId === currentUser.id);
              if (existingResp) {
                setMyResponseState(existingResp.responseState);
                setMyResponseReason(existingResp.reasonOrReservations || '');
              }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, currentUser, refreshKey]);

  const effectiveStage = activeStage;
  const currentStageIndex = CANONICAL_ASSEMBLY_STAGES.findIndex((s) => s.stage === effectiveStage);

  // Procedural Authority: Check if active persona is Chair or Facilitator
  const isChair = Boolean(
    currentUser &&
      assembly &&
      (assembly.chairId === currentUser.id ||
        assembly.facilitatorId === currentUser.id ||
        currentUser.role === 'facilitator')
  );

  // Chair Stage Advance / Return
  const handleAdvanceStage = async () => {
    if (!id || !assembly || !currentUser) return;
    setStageChangeError(null);
    if (currentStageIndex < CANONICAL_ASSEMBLY_STAGES.length - 1) {
      const nextStage = CANONICAL_ASSEMBLY_STAGES[currentStageIndex + 1].stage;
      try {
        await demoRepository.updateAssemblyStage(id, nextStage, currentUser.id);
        handleSetStage(nextStage);
        triggerRefresh();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to advance stage';
        setStageChangeError(message);
      }
    }
  };

  const handleReturnStage = async () => {
    if (!id || !assembly || !currentUser) return;
    setStageChangeError(null);
    if (currentStageIndex > 0) {
      const prevStage = CANONICAL_ASSEMBLY_STAGES[currentStageIndex - 1].stage;
      try {
        await demoRepository.updateAssemblyStage(id, prevStage, currentUser.id);
        handleSetStage(prevStage);
        triggerRefresh();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to return stage';
        setStageChangeError(message);
      }
    }
  };

  // Participant Speaking Queue
  const handleRequestSpeakingTurn = async () => {
    if (!id || !currentUser) return;
    try {
      await demoRepository.requestAssemblySpeakingTurn(id, currentUser.id);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to request speaking turn', err);
    }
  };

  const handleRecognizeSpeaker = async (targetUserId: string) => {
    if (!id || !currentUser) return;
    try {
      await demoRepository.recognizeAssemblySpeaker(id, currentUser.id, targetUserId);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to recognize speaker', err);
    }
  };

  const handleReleaseSpeaker = async () => {
    if (!id || !currentUser) return;
    try {
      await demoRepository.releaseAssemblySpeaker(id, currentUser.id);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to release speaker', err);
    }
  };

  // Substantive Contribution
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
      setContribSuccessMsg('Substantive contribution submitted! +1 Deliberation Credit awarded.');
      triggerRefresh();
      setTimeout(() => setContribSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to submit contribution', err);
    } finally {
      setIsSubmittingContrib(false);
    }
  };

  // Role Power Execution
  const handleExecuteRolePower = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser || !userRole || !powerActionTitle.trim() || !powerActionDesc.trim()) return;

    setIsSubmittingPower(true);
    setPowerSuccessMsg(null);
    try {
      await demoRepository.executeRolePowerAction({
        assemblyId: id,
        userId: currentUser.id,
        power: userRole.power,
        title: powerActionTitle.trim(),
        description: powerActionDesc.trim(),
      });

      setPowerActionTitle('');
      setPowerActionDesc('');
      setPowerSuccessMsg(`Exercised ${userRole.power}! Response obligation sent to chamber.`);
      triggerRefresh();
      setTimeout(() => setPowerSuccessMsg(null), 4000);
    } catch (err: unknown) {
      console.error('Failed to execute role power', err);
    } finally {
      setIsSubmittingPower(false);
    }
  };

  // Respond to Peer Role Action
  const handleRespondToRoleAction = async (actionId: string) => {
    if (!id || !currentUser || !actionResponseNote.trim()) return;
    setIsSubmittingActionResponse(true);
    try {
      await demoRepository.respondToRolePowerAction({
        assemblyId: id,
        actionId,
        userId: currentUser.id,
        responseNote: actionResponseNote.trim(),
      });
      setActionResponseNote('');
      setRespondingToActionId(null);
      triggerRefresh();
    } catch (err) {
      console.error('Failed to respond to role action', err);
    } finally {
      setIsSubmittingActionResponse(false);
    }
  };

  // Participant Response State Casting (Final Assembly)
  const handleRecordResponseState = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposition || !currentUser) return;

    setIsSubmittingResponse(true);
    setResponseSuccessMsg(null);
    try {
      const updated = await demoRepository.recordPropositionResponse({
        propositionId: proposition.id,
        userId: currentUser.id,
        responseState: myResponseState,
        reasonOrReservations: myResponseReason.trim() || undefined,
      });
      setProposition(updated);
      setResponseSuccessMsg(`Recorded response: "${myResponseState}". Profile updated.`);
      triggerRefresh();
      setTimeout(() => setResponseSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to record proposition response', err);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Proposition Revision
  const handleSubmitRevision = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!proposition || !currentUser || !amendedPropositionText.trim()) return;

    setIsSubmittingRevision(true);
    setRevisionSuccessMsg(null);
    try {
      const updated = await demoRepository.updateProposition({
        propositionId: proposition.id,
        updatedBy: currentUser.name,
        changesSummary: revisionSummary.trim() || `Proposed revision v${proposition.version + 1} during Chamber session`,
        proposition: amendedPropositionText.trim(),
      });
      setProposition(updated);
      setRevisionSummary('');
      setRevisionSuccessMsg(`Revision v${updated.version} recorded successfully! Dissent records preserved.`);
      triggerRefresh();
      setTimeout(() => setRevisionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Failed to submit revision', err);
    } finally {
      setIsSubmittingRevision(false);
    }
  };

  // Formal Dissent Submission
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
        versionRecorded: proposition.version,
        timestamp: new Date().toISOString(),
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

  // Outcome Finalisation
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to finalise proposition';
      setFinalisationError(message);
    } finally {
      setIsFinalisingOutcome(false);
    }
  };

  // Facilitator Role Override
  const handleRoleOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser || !overrideTargetUserId || !overrideReason.trim()) return;

    setIsSubmittingOverride(true);
    setOverrideError(null);
    try {
      await demoRepository.overrideAssemblyRole(
        id,
        currentUser.id,
        overrideTargetUserId,
        overrideNewRole,
        overrideReason.trim()
      );
      setShowOverrideModal(false);
      setOverrideReason('');
      triggerRefresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to override role';
      setOverrideError(message);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  // Reflection Submission
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

  // Typed Seating View Models for SessionSeating (4 Functional Zones Layout)
  const assemblySeats: SeatModel[] = React.useMemo(() => {
    if (!assembly) return [];
    const queue = assembly.speakingQueue || [];
    const activeSpkId = assembly.activeSpeakerId;
    const actions = assembly.roleActions || [];
    const propDissent = proposition?.dissent || [];
    const propResponses = proposition?.participantResponses || [];

    return participants.map((p) => {
      const roleObj = allRoles.find((r) => r.userId === p.id);
      const roleName =
        roleObj?.roleName ||
        (p.id === assembly.chairId
          ? 'Chair'
          : p.id === assembly.facilitatorId
          ? 'Facilitator'
          : 'Delegate');

      const isSpeaking = Boolean(
        activeSpkId === p.id ||
        queue.some((s) => s.userId === p.id && s.status === 'speaking')
      );
      const isWaiting = queue.some(
        (s) => s.userId === p.id && s.status === 'waiting'
      );

      // Dissent detection from proposition.dissent, responses, or Red Flag role actions
      const dissentRec = propDissent.find((d) => d.userId === p.id);
      const userResp = propResponses.find((r) => r.userId === p.id);
      const respDissent =
        userResp &&
        (userResp.responseState === 'Dissent' ||
          userResp.responseState === 'Support with reservations');
      const redFlagAction = actions.find(
        (a) => a.userId === p.id && a.power === 'Red Flag'
      );

      const hasDissent = Boolean(dissentRec || respDissent || redFlagAction);
      const dissentSummary =
        dissentRec?.reason ||
        redFlagAction?.description ||
        (respDissent
          ? `Registered ${userResp?.responseState} on draft proposition.`
          : undefined);

      let status: SeatStatus = 'active';
      if (isSpeaking) {
        status = 'speaking';
      } else if (isWaiting) {
        status = 'waiting';
      }

      let currentActivity = `Deliberating as ${roleName} on safe student corridor proposition.`;
      if (isSpeaking) {
        currentActivity = `Addressing assembly on Stage ${currentStageIndex + 1}: ${
          CANONICAL_ASSEMBLY_STAGES[currentStageIndex]?.label
        }`;
      } else if (redFlagAction) {
        currentActivity = `Raised Red Flag: ${redFlagAction.title}`;
      } else if (dissentRec) {
        currentActivity = `Formally logged reservation: ${dissentRec.reason}`;
      }

      // Check if caller is authorized to see actual assigned reserved occupants (e.g. platform owner)
      // Never call getFictionalReservationEligibility; personal eligibility is confidential.
      const alloc = assembly?.roleAllocations?.[roleName];
      const isReserved = Boolean(
        alloc?.reservedOccupants && alloc.reservedOccupants.includes(p.id)
      );

      return {
        id: `seat_${assembly.id}_${p.id}`,
        userId: p.id,
        name: p.name,
        avatar: p.avatar,
        role: roleName,
        sideOrBench: `${roleName} Zone`,
        status,
        isSpeaking,
        hasDissent,
        dissentSummary,
        isReserved,
        institution: p.institutionName || 'Rajkot Youth Deliberative Assembly',
        currentActivity,
        bio: p.bio,
      };
    });
  }, [assembly, participants, allRoles, proposition, currentStageIndex]);

  // Quota calculation pulling strictly from projected roleAllocations
  // Sum of per-role minimums and capacities; no second calculation; no hard-coded capacity.
  const assemblyQuotaSummary: SeatingQuotaSummary = React.useMemo(() => {
    return computeSeatingQuotaFromAllocations(assembly?.roleAllocations);
  }, [assembly?.roleAllocations]);

  // Sample Deliberative Turns for Text Mode
  const assemblySampleTurns: SessionTextTurn[] = React.useMemo(() => {
    if (contributions && contributions.length > 0) {
      return contributions.map((c) => ({
        id: c.id,
        authorName: c.userName,
        authorRole: c.stage ? `Stage: ${c.stage}` : undefined,
        text: c.text,
        timestamp: formatDate(c.createdAt),
      }));
    }
    return [
      {
        id: 'turn_asm_1',
        authorName: 'Priya Sharma',
        authorRole: 'Thinker',
        timestamp: '10:05 AM',
        text: 'Defined problem frame: peak morning drop-off pedestrian bottleneck outside Gate 2.',
      },
      {
        id: 'turn_asm_2',
        authorName: 'Vikram Joshi',
        authorRole: 'Enabler',
        timestamp: '10:15 AM',
        text: 'Verified IRC-99 bulb-out engineering geometry feasibility along northern pedestrian path.',
      },
      {
        id: 'turn_asm_3',
        authorName: 'Karan Deshmukh',
        authorRole: 'Troubleshooter',
        timestamp: '10:25 AM',
        text: 'Logged formal reservation on monsoon drainage runoff and side road deflection.',
      },
    ];
  }, [contributions]);

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
    Boolean(proposition?.revisions.some((r) => r.changesSummary?.toLowerCase().includes('final outcome resolved')));

  // Filter delegates by functional zone
  const getZoneParticipants = (roleName: AssemblyRoleType) => {
    return participants.filter((p) => {
      const r = allRoles.find((role) => role.userId === p.id);
      return r?.roleName === roleName || r?.secondaryRoleName === roleName;
    });
  };

  const speakingQueue = assembly.speakingQueue || [];
  const activeSpeakerEntry = speakingQueue.find((s) => s.status === 'speaking');
  const roleActions = assembly.roleActions || [];

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
                Stage {currentStageIndex + 1}/6: {CANONICAL_ASSEMBLY_STAGES[currentStageIndex]?.label}
              </span>
              {isChair && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  Chair / Facilitator Active
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold font-heading text-white truncate mt-0.5">
              {assembly.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Rulebook Quick Access */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRulebookModal(true)}
            className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 text-xs"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1 text-civic-teal-400" />
            <span>Rulebook ({assembly.rulebook?.version ? (assembly.rulebook.version.startsWith('v') ? assembly.rulebook.version : `v${assembly.rulebook.version}`) : 'v1.0'})</span>
          </Button>

          {/* Roles & Powers Sheet */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowRolesModal(true)}
            className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-civic-saffron-400" />
            <span>Roles & Powers</span>
          </Button>

          {/* Facilitator Override Action */}
          {isChair && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowOverrideModal(true)}
              className="bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700 text-xs"
            >
              <UserCheck className="w-3.5 h-3.5 mr-1" />
              <span>Role Override Audit</span>
            </Button>
          )}

          {proposition && (
            <Link to={`/propositions/${proposition.id}`}>
              <Button size="sm" variant="outline" className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 text-xs">
                <Layers className="w-3.5 h-3.5 mr-1" />
                <span>Proposition</span>
              </Button>
            </Link>
          )}

          <Link to="/passport">
            <Button size="sm" variant="outline" className="bg-slate-800 text-civic-saffron-400 border-slate-700 hover:bg-slate-700 text-xs">
              <Award className="w-3.5 h-3.5 mr-1" />
              <span>Passport</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Material Rulebook Notice Banner if applicable */}
      {assembly.rulebook?.materialChangeNotice && !rulebookNoticeDismissed && (
        <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Rulebook Notice (v{assembly.rulebook.version}):</strong> {assembly.rulebook.materialChangeNotice}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRulebookNoticeDismissed(true)}
            className="h-7 text-[11px] border-amber-300 bg-white text-amber-900"
          >
            Acknowledge
          </Button>
        </div>
      )}

      {/* Mini-Deliberation Mode Banner (3-person / uneven coverage) */}
      {assembly.isThreePersonMiniMode && (
        <div className="p-3 rounded-xl border border-civic-indigo-200 bg-civic-indigo-50 text-civic-indigo-950 flex items-center justify-between text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-civic-indigo-700 shrink-0" />
            <span>
              <strong>3-Person Mini-Deliberation Mode Active:</strong> All 4 functional roles are preserved via transparent rotating secondary allocations.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold text-civic-indigo-800 bg-civic-indigo-100 px-2 py-0.5 rounded border border-civic-indigo-200">
            Multi-Role Rotation
          </span>
        </div>
      )}

      {/* Shared Session Reciprocal Link & Single-Browser Notice */}
      <div className="p-3.5 rounded-xl border border-civic-teal-200 bg-civic-teal-50/70 text-civic-teal-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-civic-teal-700 shrink-0" />
          <span>
            <strong>Linked Shared Session: {linkedSession ? linkedSession.id : 'sess_jaipur_01'}</strong> | <strong>Engine Mode: Youth Assembly</strong> — Fictional simulation. State is only shared among personas within this browser.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/debate-room">
            <Button size="sm" variant="outline" className="bg-white text-civic-teal-800 border-civic-teal-300 hover:bg-civic-teal-100 text-xs">
              <Scale className="w-3.5 h-3.5 mr-1" />
              <span>Switch to Debate Room</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* CANONICAL SIX-STAGE TIMELINE BAR */}
      <Card className="border-slate-200 p-3 bg-white">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
          <span className="font-bold uppercase tracking-wider text-slate-500">
            Canonical Deliberation Pathway (6 Stages)
          </span>
          {isChair ? (
            <span className="text-[11px] font-semibold text-civic-teal-800 bg-civic-teal-50 px-2 py-0.5 rounded border border-civic-teal-200">
              Chair Controls Stage Progression
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              Chamber Current: <strong>{CANONICAL_ASSEMBLY_STAGES.find((s) => s.stage === assembly.currentStage)?.label}</strong>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2">
          {CANONICAL_ASSEMBLY_STAGES.map((st, i) => {
            const isCurrent = effectiveStage === st.stage;
            const isChamberStage = assembly.currentStage === st.stage;
            const isPassed = CANONICAL_ASSEMBLY_STAGES.findIndex((s) => s.stage === assembly.currentStage) > i;

            return (
              <button
                key={st.stage}
                type="button"
                onClick={() => handleSetStage(st.stage)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? 'bg-civic-teal-600 text-white border-civic-teal-700 shadow-xs font-bold'
                    : isChamberStage
                    ? 'bg-civic-teal-50 text-civic-teal-900 border-civic-teal-300 font-semibold'
                    : isPassed
                    ? 'bg-slate-50 text-slate-700 border-slate-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold">Stage {st.number}</span>
                  {isChamberStage && <span className="w-2 h-2 rounded-full bg-civic-teal-400 animate-pulse" />}
                </div>
                <div className="font-heading text-xs truncate mt-0.5">{st.label}</div>
              </button>
            );
          })}
        </div>

        {stageChangeError && (
          <div className="mt-2 p-2 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{stageChangeError}</span>
          </div>
        )}

        {/* Chair Procedural Controls Bar */}
        {isChair && (
          <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-600 font-medium">
              Chamber Stage: <strong>{assembly.currentStage.replace('_', ' ')}</strong>
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleReturnStage}
                disabled={currentStageIndex === 0}
                className="h-7 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                <span>Return Stage</span>
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleAdvanceStage}
                disabled={currentStageIndex === CANONICAL_ASSEMBLY_STAGES.length - 1}
                className="h-7 text-xs"
              >
                <span>Advance Stage</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Reusable Accessible SessionSeating Component (Assembly Layout) */}
      <SessionSeating
        layout="assembly"
        currentRoute="assembly"
        sessionId={assembly.id || 'assembly_jaipur_pedestrian_2026'}
        seats={assemblySeats}
        quotaSummary={assemblyQuotaSummary}
        activeSpeakerId={assembly.activeSpeakerId}
        sampleTurns={assemblySampleTurns}
        title="Youth Assembly Deliberative Chamber Seating"
        subtitle="Four balanced functional zones: Thinker, Enabler, Troubleshooter, Shaper & Procedural Rostrum"
      />

      {/* MOBILE ROLE ZONE FILTER TABS (Visible on small screens) */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setMobileRoleFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border ${
            mobileRoleFilter === 'ALL'
              ? 'bg-slate-800 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200'
          }`}
        >
          All 4 Zones
        </button>
        {CANONICAL_ASSEMBLY_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setMobileRoleFilter(r)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border ${
              mobileRoleFilter === r
                ? 'bg-civic-indigo-600 text-white border-civic-indigo-700'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* FOUR VISUALLY BALANCED FUNCTIONAL ROLE ZONES (Desktop 4-quadrant layout / Mobile filtered) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        {CANONICAL_ASSEMBLY_ROLES.map((roleName) => {
          if (mobileRoleFilter !== 'ALL' && mobileRoleFilter !== roleName) {
            return null;
          }

          const zoneDelegates = getZoneParticipants(roleName);
          const isMyZone = userRole?.roleName === roleName || userRole?.secondaryRoleName === roleName;
          const powerInfo = ROLE_POWER_MAP[roleName];

          return (
            <Card
              key={roleName}
              className={`p-3.5 flex flex-col justify-between space-y-3 transition-all ${
                isMyZone
                  ? 'border-civic-indigo-400 bg-civic-indigo-50/30 ring-1 ring-civic-indigo-400/50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div>
                {/* Balanced Role Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading font-bold text-sm text-slate-900">{roleName}</span>
                    {isMyZone && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-civic-indigo-600 text-white font-bold">
                        Your Zone
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {zoneDelegates.length} {zoneDelegates.length === 1 ? 'Delegate' : 'Delegates'}
                  </span>
                </div>

                {/* Role Responsibility & Power */}
                <div className="pt-2 space-y-1.5 text-xs">
                  <div className="text-slate-600">
                    <span className="font-semibold text-slate-700 block">Advancing Power:</span>
                    <span className="text-civic-indigo-800 font-bold">{powerInfo.power}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {powerInfo.obligation}
                  </p>
                </div>

                {/* Delegates List in Zone */}
                <div className="pt-2 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Active Delegates:
                  </span>
                  {zoneDelegates.length === 0 ? (
                    <div className="p-2 rounded bg-slate-50 border border-slate-200/80 text-[11px] text-slate-400 italic text-center">
                      Awaiting delegate assignment
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-[140px] overflow-y-auto pr-0.5">
                      {zoneDelegates.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Avatar src={d.avatar} alt={d.name} size="sm" />
                            <span className="font-medium text-slate-900 truncate">
                              {d.name} {d.id === currentUser?.id && '(You)'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button for User in this Zone */}
              {isMyZone && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-[10px] text-civic-teal-700 font-medium">
                    Issue-advancing power ready: <strong>{userRole.power}</strong>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: LEFT = INTERACTIVE STAGE & ROLE POWERS, RIGHT = SPEAKING QUEUE & EVIDENCE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT 8 COLUMNS: INTERACTIVE STAGE WORKSPACE */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-slate-200 p-5 sm:p-6 space-y-5 bg-white shadow-sm min-h-[500px]">
            {/* Stage Title Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-civic-teal-700">
                  Stage {currentStageIndex + 1} of 6
                </span>
                <h2 className="text-xl font-bold font-heading text-slate-900">
                  {CANONICAL_ASSEMBLY_STAGES[currentStageIndex]?.label}
                </h2>
              </div>
              <div className="text-right text-xs text-slate-500 max-w-sm">
                <span className="italic block font-medium text-slate-700">
                  "{CANONICAL_ASSEMBLY_STAGES[currentStageIndex]?.coreQuestion}"
                </span>
                <span className="text-[11px] text-slate-400">
                  {CANONICAL_ASSEMBLY_STAGES[currentStageIndex]?.desc}
                </span>
              </div>
            </div>

            {/* STAGE 1: FRAME */}
            {effectiveStage === 'frame' && (
              <div className="space-y-4 text-xs text-slate-700">
                <div className="p-4 rounded-xl bg-civic-teal-50 border border-civic-teal-200 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-civic-teal-800">
                    Central Deliberation Question
                  </span>
                  <h3 className="text-base font-bold font-heading text-slate-900">
                    "{assembly.question}"
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {assembly.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                    <strong className="text-slate-900 block font-heading">Location & Scope</strong>
                    <p className="text-slate-600">{assembly.location} & Virani Science College perimeter.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                    <strong className="text-slate-900 block font-heading">Target Stakeholders</strong>
                    <p className="text-slate-600">800+ student pedestrians, morning walkers, bus passengers, local shopkeepers.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                    <strong className="text-slate-900 block font-heading">Engineering Boundary</strong>
                    <p className="text-slate-600">Road width: 11m, IRC ramp slope: 1:15, monsoon drain capacity maintenance.</p>
                  </div>
                </div>

                {/* Rulebook notice */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-civic-teal-700" />
                    <span>Attached Rulebook: <strong>{assembly.rulebook?.title || 'Assembly Rulebook v1.0'}</strong></span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowRulebookModal(true)}
                    className="text-xs h-7"
                  >
                    View Rulebook
                  </Button>
                </div>
              </div>
            )}

            {/* STAGE 2: THINK */}
            {effectiveStage === 'think' && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-civic-indigo-50 border border-civic-indigo-200 text-civic-indigo-950 space-y-1">
                  <strong className="font-heading text-sm block">Thinkers Lead: Question Setting & Deep Domain Inquiry</strong>
                  <p className="text-slate-700">
                    Thinkers frame constructive inquiries and probe underlying assumptions using verified ground evidence.
                  </p>
                </div>

                {/* Substantive Contributions Stream */}
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {contributions.filter((c) => c.stage === 'think' || c.stage === 'frame').map((c) => (
                    <div key={c.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{c.userName}</span>
                        <span className="text-[10px] text-slate-400 capitalize">{c.type}</span>
                      </div>
                      <p className="text-slate-700">{c.text}</p>
                      {c.evidenceIds?.length > 0 && (
                        <div className="text-[10px] text-civic-teal-700 font-semibold">
                          Cites evidence: {c.evidenceIds.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STAGE 3: ENABLE */}
            {effectiveStage === 'enable' && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
                  <strong className="font-heading text-sm block">Enablers Lead: Feasibility Check & Resource Verification</strong>
                  <p className="text-slate-700">
                    Enablers test municipal statutory authority, ward budget allocations, and IRC 1:15 slope gradient compliance.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                    <strong className="text-slate-900 block font-heading">Engineering Criteria</strong>
                    <p className="text-slate-600">Tabletop crossing elevated to 150mm curb level; 300mm embedded PVC drain cross-pipe.</p>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                    <strong className="text-slate-900 block font-heading">Funding & Ownership</strong>
                    <p className="text-slate-600">Nagar Nigam Ward Committee discretionary road-safety budget line item.</p>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4: TROUBLESHOOT */}
            {effectiveStage === 'troubleshoot' && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
                  <strong className="font-heading text-sm block">Troubleshooters Lead: Red Flags & Risk Cataloging</strong>
                  <p className="text-slate-700">
                    Troubleshooters challenge propositions with worst-case traffic scenarios, heavy monsoons, and vendor displacement risks.
                  </p>
                </div>

                {proposition && proposition.risks && (
                  <div className="space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                      Logged Chamber Risks ({proposition.risks.length}):
                    </span>
                    <ul className="space-y-1.5">
                      {proposition.risks.map((r, i) => (
                        <li key={i} className="p-2.5 rounded-lg bg-rose-50/40 border border-rose-200 text-slate-800 flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 5: SHAPE */}
            {effectiveStage === 'shape' && proposition && (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-civic-saffron-50 border border-civic-saffron-200 text-slate-950 space-y-1">
                  <strong className="font-heading text-sm block">Shapers Lead: Proposition Call & Synthesis</strong>
                  <p className="text-slate-700">
                    Synthesizing peer inputs into a structured proposition draft with actionable next steps.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 uppercase text-[11px]">
                      Structured Civic Proposition (v{proposition.version})
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {proposition.revisions.length} Revisions Recorded
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-900 font-medium whitespace-pre-line leading-relaxed">
                    {proposition.proposition}
                  </div>
                </div>

                {/* Proposition Revision Form */}
                <form onSubmit={handleSubmitRevision} className="space-y-3 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-800 block">Propose Structured Amendment:</span>
                  <Textarea
                    value={amendedPropositionText}
                    onChange={(e) => setAmendedPropositionText(e.target.value)}
                    rows={4}
                    placeholder="Amend the proposition text..."
                    required
                  />
                  <Input
                    placeholder="Revision rationale (e.g. Added approach ramp gradient criteria)..."
                    value={revisionSummary}
                    onChange={(e) => setRevisionSummary(e.target.value)}
                    required
                  />
                  {revisionSuccessMsg && (
                    <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                      {revisionSuccessMsg}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button size="sm" variant="primary" type="submit" isLoading={isSubmittingRevision}>
                      <span>Submit Amendment (v{proposition.version + 1})</span>
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* STAGE 6: FINAL ASSEMBLY */}
            {(effectiveStage === 'final_assembly' || stageFromUrlRaw === 'reflection') && (
              <div className="space-y-5 text-xs">
                {proposition && (
                  <>
                    <div className="p-3.5 rounded-xl bg-civic-teal-50 border border-civic-teal-200 text-civic-teal-950 space-y-1">
                      <strong className="font-heading text-sm block">Final Assembly: Deliberation Outcome & Response Voting</strong>
                      <p className="text-slate-700">
                        Each delegate registers one of four canonical responses. Dissent records are permanently retained alongside the outcome.
                      </p>
                    </div>

                {/* Four Participant Response States Voting Form */}
                <Card className="border-civic-indigo-200 bg-civic-indigo-50/30 p-4 space-y-3">
                  <span className="font-bold font-heading text-sm text-slate-900 block">
                    Cast Your Response to Proposition v{proposition.version}
                  </span>

                  <form onSubmit={handleRecordResponseState} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      {(['Support', 'Support with reservations', 'Dissent', 'Abstain / insufficient basis'] as ParticipantResponseState[]).map(
                        (state) => (
                          <button
                            key={state}
                            type="button"
                            onClick={() => setMyResponseState(state)}
                            className={`p-2.5 rounded-xl border text-left transition-all text-xs font-semibold ${
                              myResponseState === state
                                ? 'bg-civic-indigo-600 text-white border-civic-indigo-700 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {state}
                          </button>
                        )
                      )}
                    </div>

                    <Input
                      placeholder="Optional reasoning or reservations..."
                      value={myResponseReason}
                      onChange={(e) => setMyResponseReason(e.target.value)}
                    />

                    {responseSuccessMsg && (
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                        {responseSuccessMsg}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button size="sm" variant="primary" type="submit" isLoading={isSubmittingResponse}>
                        <span>Record Response</span>
                      </Button>
                    </div>
                  </form>
                </Card>

                {/* Chamber Responses Profile */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-lg font-bold text-emerald-700 block">{proposition.supportProfile?.stronglySupport || 0}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Support</span>
                  </div>
                  <div className="p-3 rounded-xl bg-civic-teal-50 border border-civic-teal-200">
                    <span className="text-lg font-bold text-civic-teal-700 block">{proposition.supportProfile?.supportWithModifications || 0}</span>
                    <span className="text-[10px] text-slate-500 font-medium">With Reservations</span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-lg font-bold text-rose-700 block">{proposition.dissent?.length || 0}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Preserved Dissent</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-lg font-bold text-slate-700 block">{proposition.supportProfile?.neutral || 0}</span>
                    <span className="text-[10px] text-slate-500 font-medium">Abstain / Insufficient</span>
                  </div>
                </div>

                {/* Preserved Dissent Records Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-civic-indigo-600" />
                      <span>Preserved Dissent Records ({proposition.dissent?.length || 0})</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Never erased across revisions</span>
                  </div>

                  <div className="space-y-2">
                    {proposition.dissent?.map((d) => (
                      <div key={d.id} className="p-3 rounded-lg bg-rose-50/40 border border-rose-200 text-xs space-y-1">
                        <strong className="text-slate-900 block">Dissent by {d.userName} (v{d.versionRecorded || proposition.version}):</strong>
                        <p className="text-slate-700 italic">"{d.reason}"</p>
                        <p className="text-[11px] text-civic-indigo-700"><strong>Suggested Amendment:</strong> {d.suggestedAmendment}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Dissent Form */}
                  <form onSubmit={handleAddDissent} className="space-y-2 pt-2">
                    <span className="font-semibold text-slate-700 block">Record Formal Dissent:</span>
                    <Input
                      placeholder="Reason for dissent..."
                      value={dissentReason}
                      onChange={(e) => setDissentReason(e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Suggested amendment..."
                      value={dissentAmendment}
                      onChange={(e) => setDissentAmendment(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline" type="submit" isLoading={isSubmittingDissent}>
                        <span>Preserve Dissent Record</span>
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Outcome Finalisation Section */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                      Outcome Resolution (4 Canonical Outcomes)
                    </span>
                    <span className="text-[11px] font-bold text-civic-teal-800 bg-civic-teal-50 px-2 py-0.5 rounded border border-civic-teal-200">
                      Current: {proposition.outcome}
                    </span>
                  </div>

                  {isFinalised ? (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Resolution finalised and permanently locked: <strong>{proposition.outcome}</strong> (v{proposition.version}). Duplicate finalisation prevented.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(['CONSENSUS', 'QUALIFIED_SUPPORT', 'SPLIT_DECISION', 'INSUFFICIENT_BASIS'] as PropositionOutcome[]).map((oc) => (
                          <button
                            key={oc}
                            type="button"
                            onClick={() => setSelectedOutcome(oc)}
                            className={`p-2.5 rounded-xl border text-center transition-all text-xs font-semibold ${
                              selectedOutcome === oc
                                ? 'bg-civic-teal-600 text-white border-civic-teal-700 shadow-xs'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {oc.replace('_', ' ')}
                          </button>
                        ))}
                      </div>

                      {finalisationError && (
                        <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                          {finalisationError}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          size="md"
                          variant="primary"
                          type="button"
                          isLoading={isFinalisingOutcome}
                          onClick={handleFinaliseOutcome}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          <span>Finalise Assembly Resolution</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Civic Reflection & Ethical Values */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Civic Reflection & Ethical Values
                </span>
                <span className="text-[11px] text-slate-500">
                  Post-deliberation reflective learning
                </span>
              </div>

              {reflectionSuccess ? (
                <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs space-y-1">
                  <div className="flex items-center gap-2 font-bold text-civic-teal-800">
                    <CheckCircle2 className="w-4 h-4 text-civic-teal-600" />
                    <span>Civic Reflection Recorded!</span>
                  </div>
                  <p className="text-slate-600">
                    Your reflective essay has been added to your Passport history and <strong>+1 Reflection Credit</strong> has been awarded.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReflection} className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Reflective Values Guided:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Trust (Vishwas)', 'Empathy (Samvedana)', 'Evidence-First', 'Respect for Dissent', 'Universal Human Values'].map((val) => {
                        const isSelected = selectedValues.includes(val);
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => toggleValue(val)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                              isSelected
                                ? 'bg-civic-indigo-100 text-civic-indigo-800 border-civic-indigo-300'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
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
                      rows={3}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      Earns +1 Reflection Credit in Passport
                    </span>
                    <Button size="sm" variant="teal" type="submit" isLoading={isSubmittingReflection}>
                      <span>Submit Reflection (+1)</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </form>
              )}

              {/* Past Reflections */}
              {reflections.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Saved Civic Reflection History
                  </span>
                  {reflections.map((refl) => (
                    <div key={refl.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                      <p className="text-slate-800 italic text-xs">"{refl.text}"</p>
                      <div className="flex gap-1 pt-1 flex-wrap">
                        {refl.valuesHighlighted?.map((v) => (
                          <span key={v} className="text-[10px] text-civic-indigo-700 font-semibold">#{v}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

            {/* CONTRIBUTION FORM (Accessible in all stages) */}
            <form onSubmit={handleAddContribution} className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800 font-heading">
                  Submit Deliberative Contribution to {CANONICAL_ASSEMBLY_STAGES[currentStageIndex]?.label}
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
                placeholder="Enter your substantive inquiry or argument citing evidence..."
                value={newContribText}
                onChange={(e) => setNewContribText(e.target.value)}
                rows={2}
                required
              />

              {contribSuccessMsg && (
                <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {contribSuccessMsg}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  Awards <strong>+1 Deliberation Credit</strong>
                </span>
                <Button
                  size="sm"
                  variant="teal"
                  type="submit"
                  isLoading={isSubmittingContrib}
                  disabled={newContribText.trim().length < 5}
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  <span>Submit Contribution</span>
                </Button>
              </div>
            </form>
          </Card>

          {/* ACTIVE ROLE POWERS & PERSISTED ACTIONS STREAM */}
          <Card className="border-slate-200 p-5 space-y-4 bg-white shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-civic-saffron-600" />
                <h3 className="text-sm font-bold font-heading text-slate-900">
                  Active Issue-Advancing Role Actions ({roleActions.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Response obligations recorded</span>
            </div>

            {/* Exercise Power Form for User */}
            {userRole && (
              <form onSubmit={handleExecuteRolePower} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    Exercise Your Role Power: <span className="text-civic-indigo-700">{userRole.power}</span>
                  </span>
                  <span className="text-[10px] text-slate-500">Role: {userRole.roleName}</span>
                </div>
                <Input
                  placeholder="Action title (e.g. Inquire on monsoon drainage capacity)..."
                  value={powerActionTitle}
                  onChange={(e) => setPowerActionTitle(e.target.value)}
                  required
                />
                <Textarea
                  placeholder={ROLE_POWER_MAP[userRole.roleName]?.prompt || 'Details on this action...'}
                  value={powerActionDesc}
                  onChange={(e) => setPowerActionDesc(e.target.value)}
                  rows={2}
                  required
                />
                {powerSuccessMsg && (
                  <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    {powerSuccessMsg}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button size="sm" variant="primary" type="submit" isLoading={isSubmittingPower}>
                    <span>Execute {userRole.power}</span>
                  </Button>
                </div>
              </form>
            )}

            {/* List of Role Actions */}
            <div className="space-y-3">
              {roleActions.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-2">
                  No role power actions executed yet in this session.
                </p>
              ) : (
                roleActions.map((act) => (
                  <div key={act.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{act.title}</span>
                        <span className="text-[10px] font-semibold text-civic-indigo-800 bg-civic-indigo-50 px-2 py-0.5 rounded border border-civic-indigo-200">
                          {act.power} &bull; {act.roleName}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        act.status === 'addressed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {act.status.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-slate-700">{act.description}</p>

                    <div className="p-2 rounded bg-slate-50 text-[11px] text-slate-600 border border-slate-200/70">
                      <strong>Obligation:</strong> {act.responseObligation}
                    </div>

                    {act.responseNote ? (
                      <div className="p-2 rounded bg-emerald-50 text-[11px] text-emerald-900 border border-emerald-200">
                        <strong>Response by {act.respondedBy}:</strong> "{act.responseNote}"
                      </div>
                    ) : respondingToActionId === act.id ? (
                      <div className="pt-2 space-y-2">
                        <Input
                          placeholder="Your response addressing this obligation..."
                          value={actionResponseNote}
                          onChange={(e) => setActionResponseNote(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setRespondingToActionId(null)}>
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            isLoading={isSubmittingActionResponse}
                            onClick={() => handleRespondToRoleAction(act.id)}
                          >
                            Submit Response
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end pt-1">
                        <Button size="sm" variant="outline" onClick={() => setRespondingToActionId(act.id)}>
                          <span>Respond to Obligation</span>
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT 4 COLUMNS: SPEAKING QUEUE & EVIDENCE POOL */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Speaking Queue Card */}
          <Card className="border-slate-200 p-4 space-y-3 bg-white shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-civic-teal-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-heading">
                  Speaking Queue ({speakingQueue.filter((s) => s.status !== 'completed' && s.status !== 'cancelled').length})
                </h3>
              </div>
              {activeSpeakerEntry && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  Live Speaker
                </span>
              )}
            </div>

            {/* Current Active Speaker Display */}
            {activeSpeakerEntry ? (
              <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Current Floor:</span>
                <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                  <span>{activeSpeakerEntry.userName}</span>
                  <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                    {activeSpeakerEntry.userRole || 'Delegate'}
                  </span>
                </div>
                {isChair && (
                  <div className="pt-2">
                    <Button size="sm" variant="outline" onClick={handleReleaseSpeaker} className="w-full text-xs">
                      Release Floor
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-400 italic text-center">
                Floor open. No active speaker recognized.
              </div>
            )}

            {/* Waiting Queue List */}
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5">
              {speakingQueue.filter((s) => s.status === 'waiting').length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-1">Queue is empty.</p>
              ) : (
                speakingQueue.filter((s) => s.status === 'waiting').map((entry, idx) => (
                  <div key={entry.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">
                        {idx + 1}. {entry.userName}
                      </span>
                      <span className="text-[10px] text-slate-500 block">{entry.userRole}</span>
                    </div>
                    {isChair && (
                      <Button
                        size="sm"
                        variant="teal"
                        onClick={() => handleRecognizeSpeaker(entry.userId)}
                        className="h-6 text-[10px] px-2"
                      >
                        Recognize
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Request Turn Button */}
            <div className="pt-2 border-t border-slate-100">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRequestSpeakingTurn}
                className="w-full text-xs"
              >
                <Mic className="w-3.5 h-3.5 mr-1" />
                <span>Request Speaking Turn</span>
              </Button>
            </div>
          </Card>

          {/* Chamber Evidence Pool */}
          <Card className="border-slate-200 p-4 space-y-3 bg-white shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-civic-teal-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-heading">
                  Evidence Pool ({evidenceList.length})
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Click to cite</span>
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
                  className={`p-2.5 rounded-xl border text-xs space-y-1 cursor-pointer transition-colors ${
                    selectedEvidenceIds.includes(ev.id)
                      ? 'bg-civic-teal-50 border-civic-teal-300'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Click to cite in contribution"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-civic-teal-800 font-bold bg-civic-teal-50 px-1.5 py-0.2 rounded border border-civic-teal-200">
                      {ev.id}
                    </span>
                    <StatusChip status={ev.verificationStatus} />
                  </div>
                  <h4 className="font-bold text-slate-900 truncate">{ev.title}</h4>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{ev.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* RULEBOOK MODAL / DRAWER */}
      {showRulebookModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full bg-white p-6 space-y-4 max-h-[90vh] overflow-y-auto" data-testid="assembly-rulebook-modal">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-civic-teal-600" />
                <h3 className="text-base font-bold font-heading text-slate-900">
                  {assembly.rulebook?.title || 'Assembly Deliberation Rulebook'} (v{assembly.rulebook?.version || '1.0'})
                </h3>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowRulebookModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              {assembly.rulebook?.rules?.map((rule, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <h4 className="font-bold text-slate-900">{rule.title}</h4>
                  <p>{rule.content}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <Link
                to="/help"
                onClick={() => setShowRulebookModal(false)}
                className="inline-flex items-center gap-1.5 font-semibold text-civic-indigo-700 hover:text-civic-indigo-900 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 rounded py-1"
                data-testid="session-assembly-full-rulebook-link"
              >
                <span>Open Full Rulebook Index</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Button size="sm" variant="primary" onClick={() => setShowRulebookModal(false)}>
                Close Rulebook
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ROLES & POWERS REFERENCE MODAL */}
      {showRolesModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full bg-white p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-civic-saffron-600" />
                <h3 className="text-base font-bold font-heading text-slate-900">
                  Four Non-Hierarchical Assembly Functional Roles & Powers
                </h3>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowRolesModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {CANONICAL_ASSEMBLY_ROLES.map((r) => {
                const info = ROLE_POWER_MAP[r];
                return (
                  <div key={r} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 font-heading">{r}</span>
                      <span className="text-[10px] font-bold text-civic-indigo-800 bg-civic-indigo-100 px-2 py-0.5 rounded">
                        Power: {info.power}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{info.prompt}</p>
                    <div className="p-2 rounded bg-white border border-slate-200/80 text-[11px] text-slate-700">
                      <strong>Response Obligation:</strong> {info.obligation}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t flex justify-end">
              <Button size="sm" variant="primary" onClick={() => setShowRolesModal(false)}>
                Done
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ROLE OVERRIDE AUDIT MODAL (Chair/Facilitator Only) */}
      {showOverrideModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full bg-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold font-heading text-slate-900">
                  Facilitator Role Reallocation
                </h3>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowOverrideModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleRoleOverride} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Target Delegate:</label>
                <select
                  value={overrideTargetUserId}
                  onChange={(e) => setOverrideTargetUserId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  required
                >
                  <option value="">Select participant delegate...</option>
                  {participants.map((p) => {
                    const r = allRoles.find((role) => role.userId === p.id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current: {r?.roleName || 'Delegate'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Reallocate To Role:</label>
                <select
                  value={overrideNewRole}
                  onChange={(e) => setOverrideNewRole(e.target.value as AssemblyRoleType)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                >
                  {CANONICAL_ASSEMBLY_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r} ({ROLE_POWER_MAP[r].power})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Audit Reason (Mandatory):</label>
                <Textarea
                  placeholder="Justify why this role re-assignment is necessary for equitable balance or deliberation..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              {overrideError && (
                <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs" data-testid="override-error-banner">
                  {overrideError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={() => setShowOverrideModal(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit" isLoading={isSubmittingOverride}>
                  Confirm Override & Record Audit
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
