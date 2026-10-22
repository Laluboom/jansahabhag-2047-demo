import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { demoRepository } from '../../services/demoRepository';
import {
  Session,
  DebatePhase,
  DEBATE_PHASES,
  Evidence,
  User,
  Reflection,
  AllocationAuditRecord,
} from '../../types/domain';
import { DebateReservationRulebookBanner } from '../debate/DebateReservationRulebookBanner';
import { DebateReservationRulebookModal } from '../debate/DebateReservationRulebookModal';
import { DebateRoleAllocationsCard } from '../debate/DebateRoleAllocationsCard';
import { DebateExceptionModal } from '../debate/DebateExceptionModal';
import { DebateAssignModal } from '../debate/DebateAssignModal';
import { DebateCapacityModal } from '../debate/DebateCapacityModal';
import { DebateAuditTrailModal } from '../debate/DebateAuditTrailModal';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Input';
import { Modal } from '../ui/Modal';
import {
  Scale,
  Users,
  Clock,
  BookOpen,
  Send,
  ArrowRight,
  ArrowLeft,
  Radio,
  ShieldAlert,
  Vote,
  FileText,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Award,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';
import {
  SessionSeating,
  SeatModel,
  SeatStatus,
  SeatingQuotaSummary,
  computeSeatingQuotaFromAllocations,
  SessionTextTurn,
} from '../session';
import { SessionPreferencesService } from '../../services/sessionPreferencesService';

const ACTIVE_DEBATE_PHASES: DebatePhase[] = [
  'OPENING_STATEMENTS',
  'DISCUSSION',
  'REBUTTAL_OR_QUESTIONS',
  'CLOSING_STATEMENTS',
];

export const DebateRoomPreviewPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const navigate = useNavigate();
  const { id: routeSessionId } = useParams<{ id?: string }>();
  const targetSessionId = routeSessionId || 'sess_jaipur_01';

  const [session, setSession] = useState<Session | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & Panels
  const [isRulebookOpen, setIsRulebookOpen] = useState(false);
  const [isInterstitialOpen, setIsInterstitialOpen] = useState(false);

  // Form State
  const [contribText, setContribText] = useState('');
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Post-Session Reflection State
  const [sessionReflections, setSessionReflections] = useState<Reflection[]>([]);
  const [reflectionText, setReflectionText] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [reflectionSuccess, setReflectionSuccess] = useState<string | null>(null);

  // Reservation Policy & Owner Controls State (Package 08C2)
  const [showReservationRulebook, setShowReservationRulebook] = useState(false);
  const [selectedRoleForException, setSelectedRoleForException] = useState<string | null>(null);
  const [exceptionError, setExceptionError] = useState<string | null>(null);
  const [isSubmittingException, setIsSubmittingException] = useState(false);
  const [isFinalizingRole, setIsFinalizingRole] = useState<string | null>(null);
  const [selectedRoleForAssign, setSelectedRoleForAssign] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);
  const [selectedRoleForCapacity, setSelectedRoleForCapacity] = useState<string | null>(null);
  const [capacityError, setCapacityError] = useState<string | null>(null);
  const [isSubmittingCapacity, setIsSubmittingCapacity] = useState(false);
  const [selectedRoleForAudits, setSelectedRoleForAudits] = useState<string | null>(null);
  const [currentRoleAudits, setCurrentRoleAudits] = useState<AllocationAuditRecord[]>([]);
  const [isLoadingAudits, setIsLoadingAudits] = useState(false);
  const [isWithdrawingRole, setIsWithdrawingRole] = useState<string | null>(null);

  // Load session
  const loadSessionData = async () => {
    try {
      setIsLoading(true);
      const sess = await demoRepository.getSession(targetSessionId);
      setSession(sess);

      const [evidence, users, reflections] = await Promise.all([
        demoRepository.getEvidenceList(),
        demoRepository.getUsers(),
        currentUser && sess
          ? demoRepository.getSessionReflections(sess.id, currentUser.id)
          : Promise.resolve([]),
      ]);
      setEvidenceList(evidence);
      setAllUsers(users);
      setSessionReflections(reflections);
    } catch (err: any) {
      setActionError(err.message || 'Failed to load debate session');
    } finally {
      setIsLoading(false);
    }
  };

  // Full session projection reload whenever active persona changes
  // Ensures owner-only fields are never visible to another persona
  useEffect(() => {
    setSelectedRoleForException(null);
    setSelectedRoleForAssign(null);
    setSelectedRoleForCapacity(null);
    setSelectedRoleForAudits(null);
    loadSessionData();
  }, [currentUser?.id, targetSessionId]);

  // Typed Seating View Models for SessionSeating (Facing Benches Layout)
  const debateSeats: SeatModel[] = React.useMemo(() => {
    if (!session) return [];
    const roster = session.roster || [];
    const activeSpkId = session.debateData?.activeSpeakerId;
    const queue = session.debateData?.speakingQueue || [];
    const motionText = session.debateData?.motion;

    return roster.map((member) => {
      const userDetail = allUsers.find((u) => u.id === member.userId);
      const isSpeaking = Boolean(
        member.isSpeaking ||
        (activeSpkId && member.userId === activeSpkId)
      );
      const queueEntry = queue.find(
        (q) => q.userId === member.userId && (q.status === 'waiting' || q.status === 'speaking')
      );

      // Map role to chamber seating:
      // Moderator / Procedural bench is assigned only if supported by actual role (Facilitator, Rapporteur).
      // Stance (For vs Against) is never inferred from functional roles (e.g. Evidence Analyst, Questioner, Civic Advocate).
      // Participants without an explicit stance belong to the Unassigned/Neutral area.
      const roleLower = (member.role || '').toLowerCase();
      let sideOrBench = 'Unassigned';
      if (roleLower.includes('facilitator') || roleLower.includes('rapporteur')) {
        sideOrBench = 'Moderator';
      }

      let status: SeatStatus = 'active';
      if (isSpeaking) {
        status = 'speaking';
      } else if (queueEntry) {
        status = 'waiting';
      }

      let currentActivity = `Deliberating in ${member.role} capacity on safe school corridor motion.`;
      if (isSpeaking) {
        currentActivity = `Addressing chamber on motion: "${motionText || 'Pedestrian Safety'}"`;
      } else if (queueEntry) {
        currentActivity = `Waiting in speaking queue (${queueEntry.userRole || 'Awaiting facilitator recognition'})`;
      }

      // Check if caller is authorized to see actual assigned reserved occupants (e.g. platform owner)
      // Never call getFictionalReservationEligibility; personal eligibility is strictly confidential.
      const alloc = session.roleAllocations?.[member.role];
      const isReserved = Boolean(
        alloc?.reservedOccupants && alloc.reservedOccupants.includes(member.userId)
      );

      return {
        id: `seat_${session.id}_${member.userId}`,
        userId: member.userId,
        name: member.name || userDetail?.name || member.userId,
        avatar: userDetail?.avatar,
        role: member.role,
        sideOrBench,
        status,
        isSpeaking,
        isReserved,
        institution: userDetail?.institutionName || 'Jaipur Youth Deliberation Network',
        currentActivity,
        bio: userDetail?.bio,
      };
    });
  }, [session, allUsers]);

  // Quota calculation pulling strictly from projected roleAllocations
  // Sum of per-role minimums and totalPlaces; never hard-coded; never recomputed from roster.
  const debateQuotaSummary: SeatingQuotaSummary = React.useMemo(() => {
    return computeSeatingQuotaFromAllocations(session?.roleAllocations);
  }, [session?.roleAllocations]);

  // Sample Turns for Text Mode
  const debateSampleTurns: SessionTextTurn[] = React.useMemo(() => {
    if (session?.debateData?.contributions && session.debateData.contributions.length > 0) {
      return session.debateData.contributions.map((c) => ({
        id: c.id,
        authorName: c.userName,
        authorRole: c.phase ? c.phase.replace(/_/g, ' ') : undefined,
        text: c.text,
        timestamp: formatDate(c.timestamp),
      }));
    }
    return [
      {
        id: 'turn_deb_1',
        authorName: 'Priya Sharma',
        authorRole: 'Evidence Analyst',
        timestamp: '10:14 AM',
        text: 'Field speed radar log indicates 420 vehicles/hour exceeding 40 km/h in school zone.',
      },
      {
        id: 'turn_deb_2',
        authorName: 'Aarav Sharma',
        authorRole: 'Questioner',
        timestamp: '10:18 AM',
        text: 'How will raised crosswalk tables accommodate heavy emergency fire tender access?',
      },
      {
        id: 'turn_deb_3',
        authorName: 'Rohan Mehta',
        authorRole: 'Facilitator',
        timestamp: '10:22 AM',
        text: 'Recognized floor questioner. Response window opened for evidence presentation.',
      },
    ];
  }, [session?.debateData?.contributions]);

  // Reservation Allocation Handlers (08C1 APIs)
  const handleFinalizeRole = async (roleName: string) => {
    if (!currentUser) return;
    setActionError(null);
    setActionSuccess(null);
    setIsFinalizingRole(roleName);
    try {
      const updated = await demoRepository.finalizeSessionRoleAllocation(
        session?.id || 'sess_jaipur_01',
        roleName,
        currentUser.id
      );
      setSession(updated);
      setActionSuccess(`Role allocation for "${roleName}" has been successfully finalized!`);
    } catch (err: any) {
      setActionError(err.message || `Failed to finalize role "${roleName}"`);
    } finally {
      setIsFinalizingRole(null);
    }
  };

  const handleApproveException = async (reason: string) => {
    if (!currentUser || !selectedRoleForException) return;
    setIsSubmittingException(true);
    setExceptionError(null);
    setActionError(null);
    setActionSuccess(null);
    try {
      const { session: updated } = await demoRepository.approveSessionRoleException(
        session?.id || 'sess_jaipur_01',
        selectedRoleForException,
        reason,
        currentUser.id
      );
      setSession(updated);
      setActionSuccess(`Platform Owner exception approved for "${selectedRoleForException}".`);
      setSelectedRoleForException(null);
    } catch (err: any) {
      setExceptionError(err.message || 'Failed to approve exception');
    } finally {
      setIsSubmittingException(false);
    }
  };

  const handleAssignOrReplace = async (targetUserId: string) => {
    if (!currentUser || !selectedRoleForAssign || !session) return;
    setIsSubmittingAssign(true);
    setAssignError(null);
    setActionError(null);
    setActionSuccess(null);
    try {
      const roleName = selectedRoleForAssign;
      const alloc = session.roleAllocations?.[roleName];
      const currentOccupantId =
        alloc?.confirmedOccupants?.[0] ||
        session.roster.find((r) => r.role === roleName)?.userId;

      let updated: Session;
      if (currentOccupantId && currentOccupantId !== targetUserId) {
        updated = await demoRepository.replaceSessionRole(
          session.id,
          currentOccupantId,
          targetUserId,
          roleName,
          currentUser.id
        );
        setActionSuccess(`Role "${roleName}" occupant successfully replaced.`);
      } else {
        updated = await demoRepository.assignSessionRole(
          session.id,
          targetUserId,
          roleName,
          currentUser.id
        );
        setActionSuccess(`User assigned successfully to role "${roleName}".`);
      }
      setSession(updated);
      setSelectedRoleForAssign(null);
    } catch (err: any) {
      const msg = err.message || `Failed to assign user to "${selectedRoleForAssign}"`;
      setAssignError(msg);
      setActionError(msg);
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  const handleWithdrawRole = async (roleName: string) => {
    if (!currentUser || !session) return;
    setActionError(null);
    setActionSuccess(null);
    setIsWithdrawingRole(roleName);
    try {
      const alloc = session.roleAllocations?.[roleName];
      const occupantId =
        alloc?.confirmedOccupants?.[0] ||
        session.roster.find((r) => r.role === roleName)?.userId;
      if (!occupantId) {
        throw new Error(`No occupant found to withdraw from role "${roleName}".`);
      }
      const updated = await demoRepository.withdrawSessionRole(
        session.id,
        occupantId,
        currentUser.id
      );
      setSession(updated);
      setActionSuccess(
        `Occupant withdrawn from role "${roleName}". The reserved place remains vacant by default.`
      );
    } catch (err: any) {
      setActionError(err.message || `Failed to withdraw occupant from "${roleName}"`);
    } finally {
      setIsWithdrawingRole(null);
    }
  };

  const handleUpdateCapacity = async (newCapacity: number) => {
    if (!currentUser || !selectedRoleForCapacity || !session) return;
    setIsSubmittingCapacity(true);
    setCapacityError(null);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await demoRepository.updateSessionRoleCapacity(
        session.id,
        selectedRoleForCapacity,
        newCapacity,
        currentUser.id
      );
      setSession(updated);
      setActionSuccess(
        `Capacity for "${selectedRoleForCapacity}" updated to ${newCapacity} place(s). Prior exception invalidated if existed.`
      );
      setSelectedRoleForCapacity(null);
    } catch (err: any) {
      setCapacityError(err.message || `Failed to update capacity for "${selectedRoleForCapacity}"`);
    } finally {
      setIsSubmittingCapacity(false);
    }
  };

  const handleOpenAuditsModal = async (roleName: string) => {
    if (!currentUser || !session) return;
    setSelectedRoleForAudits(roleName);
    setIsLoadingAudits(true);
    setActionError(null);
    try {
      const alloc = session.roleAllocations?.[roleName];
      const audits = await demoRepository.getAllocationAudits(alloc?.allocationId, currentUser.id);
      setCurrentRoleAudits(audits);
    } catch (err: any) {
      setActionError(err.message || `Failed to load audits for "${roleName}"`);
    } finally {
      setIsLoadingAudits(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading debate chamber">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-civic-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading Jaipur Pedestrian Safety Debate Room...</p>
        </div>
      </div>
    );
  }

  if (!session || !currentUser) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-4">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </Link>
        <Card className="p-8 text-center space-y-4 border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Radio className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-heading text-slate-900">Debate Room Session Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {currentUser
              ? 'The requested debate room session does not exist or has not been scheduled yet.'
              : 'Please sign in or select a demo persona to enter the text-first debate room.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link to="/events">
              <Button size="sm" variant="primary">
                View All Events & Chambers
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const debateData = session.debateData;
  const isFacilitator = currentUser.id === session.facilitatorId;
  const currentPhase = debateData?.currentPhase || 'DISCUSSION';
  const activeSpeakerId = debateData?.activeSpeakerId;
  const isCurrentUserActiveSpeaker = activeSpeakerId === currentUser.id;
  const isPhaseActiveForDebate = ACTIVE_DEBATE_PHASES.includes(currentPhase);
  const isSessionClosed = currentPhase === 'CLOSED' || currentPhase === 'REPORT_PUBLISHED';

  const userQueueEntry = debateData?.speakingQueue.find(
    (q) => q.userId === currentUser.id && (q.status === 'waiting' || q.status === 'speaking')
  );

  const activeSpeakerUser = activeSpeakerId
    ? allUsers.find((u) => u.id === activeSpeakerId) || { name: activeSpeakerId }
    : null;

  // Strict persona acknowledgement check: only acknowledged if currentUser.id is in session debateData
  const isRulebookAcknowledged = Boolean(
    session.debateData?.acknowledgedUserIds?.includes(currentUser.id)
  );

  // Actions
  const handleRequestTurn = async () => {
    setActionError(null);
    setActionSuccess(null);
    if (!isRulebookAcknowledged) {
      setActionError('Please review and acknowledge the Debate Ground Rules before requesting a speaking turn.');
      setIsRulebookOpen(true);
      return;
    }
    try {
      const updated = await demoRepository.requestSpeakingTurn(session.id, currentUser.id);
      setSession(updated);
      setActionSuccess('Speaking turn requested! You are now in the queue.');
    } catch (err: any) {
      setActionError(err.message || 'Failed to request speaking turn');
    }
  };

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionText.trim()) return;
    setIsSavingReflection(true);
    setReflectionSuccess(null);
    setActionError(null);
    try {
      const saved = await demoRepository.addReflection({
        userId: currentUser.id,
        contextType: 'session',
        contextId: session.id,
        prompt:
          debateData?.reflectionPrompt ||
          'How did the debate discussion and evidence presented shape your perspective on safe school corridors?',
        text: reflectionText.trim(),
        valuesHighlighted: ['Evidence-based Reasoning', 'Civic Responsibility'],
        isPublicInPassport: false,
      });
      setSessionReflections((prev) => [saved, ...prev]);
      setReflectionText('');
      setReflectionSuccess(
        'Private reflection saved locally to this Debate Room journal. It stays in this browser session and does not become verified Civic Passport evidence or claim automated credits.'
      );
    } catch (err: any) {
      setActionError(err.message || 'Failed to save reflection');
    } finally {
      setIsSavingReflection(false);
    }
  };

  const handleCancelTurn = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await demoRepository.cancelSpeakingTurn(session.id, currentUser.id);
      setSession(updated);
      setActionSuccess('Your speaking turn request has been cancelled.');
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel speaking turn');
    }
  };

  const handleRecognizeSpeaker = async (targetUserId: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await demoRepository.recognizeSpeakingTurn(
        session.id,
        currentUser.id,
        targetUserId
      );
      setSession(updated);
      setActionSuccess(`Recognized participant turn.`);
    } catch (err: any) {
      setActionError(err.message || 'Failed to recognize speaking turn');
    }
  };

  const handleAdvanceSpeakingTurn = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await demoRepository.advanceSpeakingTurn(session.id, currentUser.id);
      setSession(updated);
      setActionSuccess('Speaking turn advanced.');
    } catch (err: any) {
      setActionError(err.message || 'Failed to advance speaking turn');
    }
  };

  const handleAdvancePhase = async (nextPhase: DebatePhase) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await demoRepository.advanceDebatePhase(
        session.id,
        currentUser.id,
        nextPhase
      );
      setSession(updated);
      setActionSuccess(`Debate phase advanced to ${nextPhase}.`);
    } catch (err: any) {
      setActionError(err.message || 'Failed to advance debate phase');
    }
  };

  const handlePostContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribText.trim()) return;
    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    if (!isRulebookAcknowledged) {
      setActionError('Please review and acknowledge the Debate Ground Rules before posting an intervention.');
      setIsRulebookOpen(true);
      setIsSubmitting(false);
      return;
    }

    try {
      const updated = await demoRepository.postDebateContribution({
        sessionId: session.id,
        userId: currentUser.id,
        text: contribText.trim(),
        evidenceIds: selectedEvidenceId ? [selectedEvidenceId] : [],
      });
      setSession(updated);
      setContribText('');
      setSelectedEvidenceId('');
      setActionSuccess('Intervention posted successfully to debate log!');
    } catch (err: any) {
      setActionError(err.message || 'Failed to post contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmModeSwitch = async () => {
    setActionError(null);
    try {
      await demoRepository.switchSessionMode(
        session.id,
        currentUser.id,
        'youth_assembly',
        'Facilitator transitioned session mode to linked Youth Assembly Chamber'
      );
      setIsInterstitialOpen(false);
      navigate(`/assemblies/${session.assemblyId || 'assembly_jaipur_pedestrian_2026'}/session`);
    } catch (err: any) {
      setActionError(err.message || 'Failed to switch session mode');
    }
  };

  // Relevant evidence items for dock
  const debateEvidence = evidenceList.filter((ev) =>
    debateData?.evidenceIds.includes(ev.id)
  );

  const currPhaseIndex = DEBATE_PHASES.indexOf(currentPhase);
  const nextPhaseCandidate =
    currPhaseIndex < DEBATE_PHASES.length - 1 ? DEBATE_PHASES[currPhaseIndex + 1] : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Simulation Disclaimer & Persona Notice */}
      <div className="p-4 rounded-xl border border-civic-indigo-200 bg-civic-indigo-50/70 text-civic-indigo-950 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-civic-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              Single-Browser Local Simulation — Session {session.id}
            </p>
            <p className="text-slate-600">
              State is only shared among personas within this browser. No live multi-user network or server-side authorization is active (OD.5 pending). The persona selector is a local simulation, not security.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="bg-white/90 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-medium">
            Persona: <strong className="text-civic-indigo-900">{currentUser.name}</strong> ({currentUser.role})
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsRulebookOpen(true)}
            className="text-xs bg-white text-slate-700 hover:bg-slate-50"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1" />
            Rulebook (v1.0)
          </Button>
        </div>
      </div>

      {/* Action Alerts */}
      {actionError && (
        <div
          className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-red-900 text-xs flex items-center justify-between"
          data-testid="debate-role-action-error"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-700 hover:text-red-900 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}
      {actionSuccess && (
        <div
          className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs flex items-center justify-between"
          data-testid="debate-role-action-success"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Read-Only State Banner when Session is in Youth Assembly or other mode */}
      {session.currentMode !== 'debate_room' && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
              <h3 className="font-bold text-sm">
                Session Mode: {session.currentMode === 'youth_assembly' ? 'Youth Assembly Active' : session.currentMode} (Read-Only Debate Chamber)
              </h3>
            </div>
            <p className="text-xs text-amber-800 mt-1">
              This session is currently running in {session.currentMode === 'youth_assembly' ? 'Youth Assembly' : session.currentMode} mode. Live floor debate controls, turn requests, and interventions are locked. You can review the past debate record below or open the live Assembly chamber.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isFacilitator && (
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  setActionError(null);
                  try {
                    const updated = await demoRepository.switchSessionMode(session.id, currentUser.id, 'debate_room', 'Switched back to Debate Room mode');
                    setSession(updated);
                    setActionSuccess('Session returned to Debate Room mode.');
                  } catch (e: any) {
                    setActionError(e.message || 'Failed to switch mode');
                  }
                }}
                className="text-xs bg-white text-slate-800 border-amber-300 hover:bg-amber-100"
              >
                Switch Back to Debate Room
              </Button>
            )}
            <Link to={`/assemblies/${session.assemblyId || 'assembly_jaipur_pedestrian_2026'}/session`}>
              <Button size="sm" variant="primary" className="text-xs bg-civic-teal-700 hover:bg-civic-teal-800 text-white">
                Go to Youth Assembly Session
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Header with Title and Mode Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap text-xs font-semibold uppercase tracking-wider text-civic-indigo-700 mb-1">
            <div className="flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              <span>Shared Live Session Engine — Mode: Debate Room</span>
            </div>
            {SessionPreferencesService.getLowDataPreference() ? (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 normal-case tracking-normal"
                data-testid="low-data-video-notice"
              >
                Low Data Mode: Video Preview Suppressed
              </span>
            ) : (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 normal-case tracking-normal"
                data-testid="video-preview-badge"
              >
                Video Preview: Text-First Active (OD.4)
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
            Jaipur Youth Pedestrian Safety Debate Room
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Structured motion-centered deliberation with speaker queues, time limits, and evidence dock.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isFacilitator && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsInterstitialOpen(true)}
              className="bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
            >
              <Vote className="w-4 h-4 mr-1.5" />
              Switch to Youth Assembly
            </Button>
          )}
          <Link to="/assemblies">
            <Button size="sm" variant="outline">
              <Layers className="w-4 h-4 mr-1.5" />
              All Assemblies
            </Button>
          </Link>
        </div>
      </div>

      {/* Pre-Action Rulebook Banner (if not acknowledged yet) */}
      {!isRulebookAcknowledged && (
        <Card className="p-4 border-amber-200 bg-amber-50/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <BookOpen className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700">
                <p className="font-bold text-amber-950">
                  Debate Room Procedural Rules (Master PRD §A13, v1.0)
                </p>
                <p className="text-slate-600 mt-0.5">
                  Interventions must address the tabled motion using documented field evidence. Participation follows the recognized queue; video is optional via low-bandwidth text.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsRulebookOpen(true)}
                className="text-xs bg-white text-slate-700"
              >
                Review Full Rules
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={async () => {
                  try {
                    const updated = await demoRepository.acknowledgeRulebook(session.id, currentUser.id);
                    setSession(updated);
                    setActionSuccess('Debate Rulebook acknowledged.');
                  } catch (err) {
                    setActionError(err instanceof Error ? err.message : 'Failed to acknowledge rulebook');
                  }
                }}
                className="text-xs bg-amber-700 hover:bg-amber-800 text-white"
              >
                Acknowledge & Continue
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Motion Card */}
      <Card className="border-civic-indigo-200 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-civic-indigo-600 bg-civic-indigo-50 px-2.5 py-0.5 rounded-full border border-civic-indigo-200">
              Formal Motion Before The Chamber
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Session ID: {session.id}
            </span>
          </div>
          <CardTitle className="text-lg sm:text-xl font-bold font-heading text-slate-900 mt-2">
            "{debateData?.motion}"
          </CardTitle>
          {debateData?.linkedQuestion && (
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              <strong>Linked Question:</strong> {debateData.linkedQuestion}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Phase Timeline / Flow */}
      <Card className="p-4 border-slate-200 bg-slate-900 text-white shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-civic-teal-400 uppercase tracking-wider">
              Debate Phase Flow (Master PRD §A8.1)
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
              Current: {currentPhase}
            </span>
          </div>

          {/* Facilitator Phase Advancement Control */}
          {isFacilitator && nextPhaseCandidate && !isSessionClosed && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Facilitator Action:</span>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleAdvancePhase(nextPhaseCandidate)}
                className="text-xs bg-civic-teal-600 hover:bg-civic-teal-500 text-white"
              >
                Advance to {nextPhaseCandidate}
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Phase step pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
          {DEBATE_PHASES.map((phase, idx) => {
            const isCurrent = phase === currentPhase;
            const isPast = DEBATE_PHASES.indexOf(phase) < currPhaseIndex;
            return (
              <div
                key={phase}
                className={`px-2.5 py-1 rounded-md shrink-0 flex items-center gap-1 border transition-colors ${
                  isCurrent
                    ? 'bg-civic-teal-500 text-slate-950 font-bold border-civic-teal-400'
                    : isPast
                    ? 'bg-slate-800 text-slate-400 border-slate-700'
                    : 'bg-slate-950/50 text-slate-500 border-slate-800'
                }`}
              >
                <span>{idx + 1}.</span>
                <span>{phase.replace(/_/g, ' ')}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Reusable Accessible SessionSeating Component (Debate Layout) */}
      <SessionSeating
        layout="debate"
        currentRoute="debate"
        sessionId={session?.id || 'sess_jaipur_01'}
        seats={debateSeats}
        quotaSummary={debateQuotaSummary}
        activeSpeakerId={activeSpeakerId}
        sampleTurns={debateSampleTurns}
        title="Debate Room Chamber Seating"
        subtitle="Facing Proposition (For) & Opposition (Against) benches with Facilitator rostrum"
      />

      {/* Debate Reservation Rulebook Point-of-Use Banner */}
      <DebateReservationRulebookBanner
        onOpenRulebook={() => setShowReservationRulebook(true)}
      />

      {/* Debate Room Named Role Allocations & Compliance Plan Card */}
      <DebateRoleAllocationsCard
        session={session}
        currentUser={currentUser}
        allUsers={allUsers}
        onOpenRulebook={() => setShowReservationRulebook(true)}
        onOpenExceptionModal={(roleName) => {
          setSelectedRoleForException(roleName);
          setExceptionError(null);
        }}
        onFinalizeRole={handleFinalizeRole}
        onOpenAssignModal={(roleName) => {
          setSelectedRoleForAssign(roleName);
          setAssignError(null);
        }}
        onWithdrawRole={handleWithdrawRole}
        onOpenCapacityModal={(roleName) => {
          setSelectedRoleForCapacity(roleName);
          setCapacityError(null);
        }}
        onOpenAuditsModal={handleOpenAuditsModal}
        isFinalizingRole={isFinalizingRole}
        isWithdrawingRole={isWithdrawingRole}
      />

      {/* Main Grid: Left Column (Queue & Text Contributions) + Right Column (Dock & Info) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Speaker Spotlight */}
          <Card className="p-5 border-slate-200 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                    activeSpeakerId
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Recognized Floor Speaker
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                    {activeSpeakerUser ? activeSpeakerUser.name : 'Floor is Open'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {activeSpeakerId
                      ? isCurrentUserActiveSpeaker
                        ? 'You currently have the floor to contribute.'
                        : `${activeSpeakerUser?.name} is recognized by Facilitator Rohan Mehta.`
                      : 'Facilitator recognizes the next speaker from the queue.'}
                  </p>
                </div>
              </div>

              {/* Facilitator Turn Control */}
              {isFacilitator && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAdvanceSpeakingTurn}
                    className="text-xs"
                  >
                    Advance Speaker Turn
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Speaking Queue Dock */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-civic-indigo-600" />
                  <span>Speaking Queue</span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ordered speaker interventions regulated by the Facilitator.
                </p>
              </div>

              {/* Participant Queue Controls */}
              {!isSessionClosed && (
                <div>
                  {session.currentMode !== 'debate_room' ? (
                    <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-1 rounded font-medium">
                      Locked: Youth Assembly Active
                    </span>
                  ) : userQueueEntry ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelTurn}
                      className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                    >
                      Withdraw Request
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={handleRequestTurn}
                      className="text-xs bg-civic-indigo-600 hover:bg-civic-indigo-700 text-white"
                    >
                      Request Speaking Turn
                    </Button>
                  )}
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4">
              {debateData?.speakingQueue && debateData.speakingQueue.length > 0 ? (
                <div className="space-y-2">
                  {debateData.speakingQueue.map((entry, index) => {
                    const isUser = entry.userId === currentUser.id;
                    return (
                      <div
                        key={entry.id || index}
                        className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                          entry.status === 'speaking'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                            : entry.status === 'waiting'
                            ? 'bg-slate-50 border-slate-200 text-slate-800'
                            : 'bg-slate-50/50 border-slate-100 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-slate-400 text-[11px] w-5">
                            #{index + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 font-medium">
                              <span>{entry.userName}</span>
                              {isUser && (
                                <span className="text-[10px] bg-civic-indigo-100 text-civic-indigo-800 px-1.5 py-0.2 rounded font-normal">
                                  You
                                </span>
                              )}
                              {entry.userRole && (
                                <span className="text-[10px] text-slate-500">
                                  ({entry.userRole})
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              Requested {formatDate(entry.requestedAt)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                              entry.status === 'speaking'
                                ? 'bg-emerald-200 text-emerald-900'
                                : entry.status === 'waiting'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {entry.status}
                          </span>

                          {/* Facilitator recognize action for waiting participants */}
                          {isFacilitator && entry.status === 'waiting' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRecognizeSpeaker(entry.userId)}
                              className="text-[11px] h-7 px-2"
                            >
                              Recognize
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-3 text-center">
                  Speaking queue is currently empty. Participants can click "Request Speaking Turn" above.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Low-Bandwidth Text Contribution Path (Master PRD §A7.2, §A8) */}
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Send className="w-4 h-4 text-civic-teal-600" />
                    <span>Low-Bandwidth Text Contribution Path</span>
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Master PRD §A7.2, §A8 — Accessible text-first intervention path.
                  </p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Phase: {currentPhase}
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {session.currentMode === 'debate_room' && isCurrentUserActiveSpeaker && isPhaseActiveForDebate ? (
                <form onSubmit={handlePostContribution} className="space-y-3">
                  <div>
                    <label
                      htmlFor="contrib-input"
                      className="block text-xs font-semibold text-slate-700 mb-1"
                    >
                      Your Substantive Debate Intervention
                    </label>
                    <Textarea
                      id="contrib-input"
                      value={contribText}
                      onChange={(e) => setContribText(e.target.value)}
                      placeholder="Ground your intervention in field data, IRC guidelines, or school community observations..."
                      rows={3}
                      className="text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="w-full sm:w-auto">
                      <label
                        htmlFor="evidence-select"
                        className="block text-[11px] font-medium text-slate-600 mb-1"
                      >
                        Attach Assembly Field Evidence (Optional)
                      </label>
                      <select
                        id="evidence-select"
                        value={selectedEvidenceId}
                        onChange={(e) => setSelectedEvidenceId(e.target.value)}
                        className="text-xs rounded-md border border-slate-300 bg-white px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500 w-full sm:w-72"
                      >
                        <option value="">No evidence attached</option>
                        {debateEvidence.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.title} [{ev.verificationStatus === 'verified' ? 'Verified' : 'Under Review'}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting || !contribText.trim()}
                      size="sm"
                      variant="primary"
                      className="bg-civic-indigo-600 hover:bg-civic-indigo-700 text-white shrink-0 self-end"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      {isSubmitting ? 'Posting...' : 'Post Intervention'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 text-xs text-slate-600 space-y-1.5">
                  <p className="font-semibold text-slate-800">
                    Contribution Input Floor Gated
                  </p>
                  <p>
                    {session.currentMode !== 'debate_room'
                      ? `This session is currently running in ${session.currentMode === 'youth_assembly' ? 'Youth Assembly' : session.currentMode} mode. Debate interventions are locked in this chamber.`
                      : !isPhaseActiveForDebate
                      ? `Text contributions are not permitted during phase "${currentPhase}". Interventions open during opening statements, discussion, and closing statements.`
                      : !isCurrentUserActiveSpeaker
                      ? `Only the recognized speaker may post during their active turn. Currently recognized: ${
                          activeSpeakerUser ? activeSpeakerUser.name : 'None'
                        }. Request a turn in the speaking queue above to participate.`
                      : 'Interventions are currently closed.'}
                  </p>
                </div>
              )}

              {/* Contributions Log */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                  Debate Contributions Log ({debateData?.contributions.length || 0})
                </h4>
                {debateData?.contributions && debateData.contributions.length > 0 ? (
                  <div className="space-y-3">
                    {debateData.contributions.map((contrib) => {
                      const attachedEvidence = contrib.evidenceIds
                        ? evidenceList.filter((ev) => contrib.evidenceIds?.includes(ev.id))
                        : [];
                      return (
                        <div
                          key={contrib.id}
                          className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{contrib.userName}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded">
                                {contrib.phase}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {formatDate(contrib.timestamp)}
                            </span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{contrib.text}</p>
                          {attachedEvidence.length > 0 && (
                            <div className="pt-1 flex flex-wrap gap-1.5">
                              {attachedEvidence.map((ev) => (
                                <span
                                  key={ev.id}
                                  className="inline-flex items-center gap-1 text-[10px] font-medium text-civic-indigo-700 bg-civic-indigo-50 border border-civic-indigo-200 px-2 py-0.5 rounded"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>{ev.title}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">
                    No contributions recorded in this session yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 col): Evidence Dock, Agenda, Roster & Reflection */}
        <div className="space-y-6">
          {/* Post-Session Reflection Path */}
          <Card className="p-4 border-civic-teal-200 bg-civic-teal-50/50 shadow-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <Award className="w-5 h-5 text-civic-teal-700 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <h3 className="font-bold text-civic-teal-950 font-heading">
                  Post-Debate Private Reflection Journal
                </h3>
                <p className="text-slate-600">
                  {debateData?.reflectionPrompt ||
                    'How did the debate discussion and evidence presented shape your perspective on safe school corridors?'}
                </p>
                <p className="text-[11px] text-slate-500 italic">
                  Local Simulation: This private journal stays in this browser&apos;s Debate Room and does not become verified Civic Passport evidence. In this demo, session self-reflections do not earn automated Civic Credits, verified status, or badges.
                </p>
              </div>
            </div>

            {reflectionSuccess && (
              <div className="p-2 rounded bg-emerald-100 text-emerald-900 text-xs">
                {reflectionSuccess}
              </div>
            )}

            <form onSubmit={handleSaveReflection} className="space-y-2">
              <label htmlFor="reflection-input" className="block text-[11px] font-semibold text-slate-700">
                Your Personal Reflection
              </label>
              <Textarea
                id="reflection-input"
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Ground your reflection in the arguments and field evidence discussed..."
                rows={3}
                className="text-xs bg-white"
                required
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={isSavingReflection || !reflectionText.trim()}
                  className="text-xs bg-civic-teal-700 hover:bg-civic-teal-800 text-white"
                >
                  {isSavingReflection ? 'Saving...' : 'Save Reflection'}
                </Button>
                <div className="text-right">
                  <Link to="/passport" title="View Civic Passport credentials (debate journal remains in this room)">
                    <Button size="sm" variant="outline" className="text-xs bg-white text-civic-teal-800 border-civic-teal-300">
                      Open Civic Passport
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Separate navigation: private debate reflections do not appear in Passport credentials.
                  </p>
                </div>
              </div>
            </form>

            {sessionReflections.length > 0 && (
              <div className="pt-2 border-t border-civic-teal-200/60 space-y-2">
                <span className="text-[11px] font-semibold text-civic-teal-950 uppercase tracking-wider">
                  Your Saved Session Reflections ({sessionReflections.length})
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {sessionReflections.map((refl) => {
                    const author = allUsers.find((u) => u.id === refl.userId);
                    return (
                      <div key={refl.id} className="p-2 rounded bg-white/90 border border-civic-teal-100 text-xs space-y-0.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-800">{author?.name || refl.userId}</span>
                          <span>{formatDate(refl.createdAt)}</span>
                        </div>
                        <p className="text-slate-700 text-[11px]">{refl.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Seeded Evidence Dock */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-civic-indigo-600" />
                <span>Evidence & Sources Dock ({debateEvidence.length})</span>
              </CardTitle>
              <p className="text-[11px] text-slate-500">
                Seeded community evidence without false verification claims.
              </p>
            </CardHeader>
            <CardContent className="p-3 space-y-2.5">
              {debateEvidence.map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 truncate">{ev.title}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                        ev.verificationStatus === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ev.verificationStatus === 'under_review'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {ev.verificationStatus.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{ev.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>{ev.source}</span>
                    <span>By {ev.ownerName}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Session Agenda Dock */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-civic-indigo-600" />
                <span>Session Agenda</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-2">
              {session.agenda.map((item, idx) => (
                <div key={idx} className="p-2 rounded border border-slate-100 text-xs space-y-0.5">
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span>{item.time}</span>
                    <span>{item.presenter}</span>
                  </div>
                  <p className="font-medium text-slate-800">{item.topic}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Participant Roster Dock */}
          <Card className="border-slate-200 bg-white shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-civic-indigo-600" />
                <span>Session Roster ({session.roster.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-1.5 max-h-56 overflow-y-auto">
              {session.roster.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between py-1 text-xs border-b border-slate-50 last:border-0"
                >
                  <span className="font-medium text-slate-800">{member.name}</span>
                  <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {member.role}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rulebook Modal (Reopenable at any time) */}
      <Modal
        isOpen={isRulebookOpen}
        onClose={() => setIsRulebookOpen(false)}
        title={debateData?.rulebook.title || 'Debate Room Rules'}
        description={`Contextual Rulebook Version ${debateData?.rulebook.version || 'v1.0'}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p className="text-slate-600 leading-relaxed">
            In accordance with Master PRD §A8 and §A13, rules of procedure are visible at the point of use and explain participant rights, speaking turns, facilitator recognition, and accessible text participation.
          </p>

          <div className="space-y-3">
            {debateData?.rulebook.rules.map((rule, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
                <h4 className="font-bold text-slate-900 text-xs">
                  {idx + 1}. {rule.title}
                </h4>
                <p className="text-slate-600 leading-relaxed">{rule.content}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              size="sm"
              variant="primary"
              onClick={async () => {
                try {
                  const updated = await demoRepository.acknowledgeRulebook(session.id, currentUser.id);
                  setSession(updated);
                  setIsRulebookOpen(false);
                  setActionSuccess('Debate Rulebook acknowledged.');
                } catch (err) {
                  setActionError(err instanceof Error ? err.message : 'Failed to acknowledge rulebook');
                }
              }}
              className="text-xs bg-civic-indigo-600 hover:bg-civic-indigo-700 text-white"
            >
              Acknowledge Ground Rules (v1.0)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Interstitial Mode Switch Summary Modal */}
      <Modal
        isOpen={isInterstitialOpen}
        onClose={() => setIsInterstitialOpen(false)}
        title="Mode Transition: Switch to Youth Assembly"
        description="Preserving common session context across deliberation modes (Master PRD §A7, §A9)"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-700">
          <p className="leading-relaxed">
            As Facilitator Rohan Mehta, you are initiating a local session mode transition in this simulation from <strong>Debate Room</strong> to the linked <strong>Youth Assembly</strong> chamber.
          </p>

          <div className="p-3.5 rounded-lg border border-civic-teal-200 bg-civic-teal-50/60 space-y-2">
            <h4 className="font-bold text-civic-teal-950">
              Preserved Session Context:
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li><strong>Session ID:</strong> {session.id} (no new meeting created)</li>
              <li><strong>Roster:</strong> All {session.roster.length} participants preserved</li>
              <li><strong>Agenda & Evidence:</strong> Traffic counts, photos & IRC standards retained</li>
              <li><strong>Debate Log:</strong> All contributions and queue entries remain in session history</li>
              <li><strong>Linked Assembly:</strong> Stage and proposition remain intact without overwrite</li>
            </ul>
          </div>

          <p className="text-[11px] text-slate-500">
            Note: Single-browser simulation. Both Debate Room and Youth Assembly share this session context within this browser.
          </p>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsInterstitialOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleConfirmModeSwitch}
              className="text-xs bg-civic-teal-600 hover:bg-civic-teal-700 text-white"
            >
              Confirm & Enter Youth Assembly Chamber
            </Button>
          </div>
        </div>
      </Modal>

      {/* Debate Reservation Rulebook Modal */}
      <DebateReservationRulebookModal
        isOpen={showReservationRulebook}
        onClose={() => setShowReservationRulebook(false)}
      />

      {/* Platform Owner Exception Approval Modal */}
      <DebateExceptionModal
        roleName={selectedRoleForException}
        isOpen={Boolean(selectedRoleForException)}
        onClose={() => {
          setSelectedRoleForException(null);
          setExceptionError(null);
        }}
        onSubmit={handleApproveException}
        isSubmitting={isSubmittingException}
        error={exceptionError}
      />

      {/* Assign / Replace Role Modal */}
      <DebateAssignModal
        roleName={selectedRoleForAssign}
        currentOccupantName={
          session.roster.find((r) => r.role === selectedRoleForAssign)?.name ||
          (selectedRoleForAssign && session.roleAllocations?.[selectedRoleForAssign]?.confirmedOccupants?.[0]
            ? allUsers.find((u) => u.id === session.roleAllocations![selectedRoleForAssign]!.confirmedOccupants![0])?.name
            : undefined)
        }
        users={allUsers}
        isOpen={Boolean(selectedRoleForAssign)}
        onClose={() => {
          setSelectedRoleForAssign(null);
          setAssignError(null);
        }}
        onSubmit={handleAssignOrReplace}
        isSubmitting={isSubmittingAssign}
        error={assignError}
      />

      {/* Change Capacity Modal */}
      <DebateCapacityModal
        roleName={selectedRoleForCapacity}
        currentCapacity={
          selectedRoleForCapacity && session.roleAllocations?.[selectedRoleForCapacity]
            ? session.roleAllocations[selectedRoleForCapacity].totalPlaces
            : 1
        }
        isOpen={Boolean(selectedRoleForCapacity)}
        onClose={() => {
          setSelectedRoleForCapacity(null);
          setCapacityError(null);
        }}
        onSubmit={handleUpdateCapacity}
        isSubmitting={isSubmittingCapacity}
        error={capacityError}
      />

      {/* Allocation Audit Trail Modal */}
      <DebateAuditTrailModal
        roleName={selectedRoleForAudits}
        audits={currentRoleAudits}
        isOpen={Boolean(selectedRoleForAudits)}
        onClose={() => {
          setSelectedRoleForAudits(null);
          setCurrentRoleAudits([]);
        }}
        isLoading={isLoadingAudits}
      />
    </div>
  );
};
