import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import {
  Assembly,
  AssemblyRole,
  AssemblyRoleType,
  Evidence,
  Contribution,
  Proposition,
  User,
  AssemblyStage,
  AllocationState,
  AllocationAuditRecord,
} from '../../types/domain';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  ArrowLeft,
  ArrowRight,
  Vote,
  Users,
  Calendar,
  HelpCircle,
  FileCheck2,
  Sparkles,
  Layers,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  Clock,
  BookOpen,
  Scale,
  Shield,
  ShieldAlert,
  AlertCircle,
  Info,
  X,
} from 'lucide-react';

const ALL_STAGES: AssemblyStage[] = [
  'frame',
  'think',
  'enable',
  'troubleshoot',
  'shape',
  'final_assembly',
];

export const AssemblyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();
  const navigate = useNavigate();

  const [assembly, setAssembly] = useState<Assembly | null>(null);
  const [userRole, setUserRole] = useState<AssemblyRole | null>(null);
  const [allRoles, setAllRoles] = useState<AssemblyRole[]>([]);
  const [participants, setParticipants] = useState<User[]>([]);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [proposition, setProposition] = useState<Proposition | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reservation Allocation & Owner Exception State
  const [selectedRoleForException, setSelectedRoleForException] = useState<string | null>(null);
  const [exceptionReason, setExceptionReason] = useState('');
  const [isSubmittingException, setIsSubmittingException] = useState(false);
  const [exceptionError, setExceptionError] = useState<string | null>(null);
  const [isFinalizingRole, setIsFinalizingRole] = useState<string | null>(null);
  const [roleActionError, setRoleActionError] = useState<string | null>(null);
  const [roleActionSuccess, setRoleActionSuccess] = useState<string | null>(null);
  const [showRulebookModal, setShowRulebookModal] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id || !currentUser) return;
      setIsLoading(true);
      try {
        const [asm, r, roles, contribs, allUsers] = await Promise.all([
          demoRepository.getAssembly(id),
          demoRepository.getUserAssemblyRole(id, currentUser.id),
          demoRepository.getAssemblyRoles(id),
          demoRepository.getContributions(id),
          demoRepository.getUsers(),
        ]);
        setAssembly(asm);
        setUserRole(r);
        setAllRoles(roles);
        setContributions(contribs);

        if (asm) {
          const participantUsers = allUsers.filter((u) => asm.participantUserIds.includes(u.id));
          setParticipants(participantUsers);

          if (asm.evidenceIds.length) {
            const evs = await Promise.all(
              asm.evidenceIds.map((eid) => demoRepository.getEvidence(eid))
            );
            setEvidenceList(evs.filter((e): e is Evidence => e !== null));
          }

          if (asm.propositionId) {
            const prop = await demoRepository.getProposition(asm.propositionId);
            setProposition(prop);
          }
        }
      } catch (err) {
        console.error('Failed to load assembly details', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [id, currentUser, refreshKey]);

  const handleJoinAssembly = async (preferredRole?: AssemblyRoleType) => {
    if (!id || !currentUser) return;
    setIsJoining(true);
    setRoleActionError(null);
    try {
      await demoRepository.joinAssembly(id, currentUser.id, preferredRole);
      triggerRefresh();
      navigate(`/assemblies/${id}/session`);
    } catch (err: any) {
      console.error('Failed to join assembly', err);
      setRoleActionError(err?.message || 'Failed to join assembly');
    } finally {
      setIsJoining(false);
    }
  };

  const handleFinalizeRole = async (roleName: string) => {
    if (!id || !currentUser) return;
    setIsFinalizingRole(roleName);
    setRoleActionError(null);
    setRoleActionSuccess(null);
    try {
      const updated = await demoRepository.finalizeAssemblyRoleAllocation(id, roleName, currentUser.id);
      setAssembly(updated);
      setRoleActionSuccess(`Role allocation "${roleName}" successfully finalized.`);
      triggerRefresh();
    } catch (err: any) {
      setRoleActionError(err?.message || 'Failed to finalize role allocation');
    } finally {
      setIsFinalizingRole(null);
    }
  };

  const handleApproveException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !currentUser || !selectedRoleForException) return;
    if (exceptionReason.trim().length < 5) {
      setExceptionError('A substantive reason of at least 5 characters is required.');
      return;
    }
    setIsSubmittingException(true);
    setExceptionError(null);
    try {
      const result = await demoRepository.approveAssemblyRoleException(
        id,
        selectedRoleForException,
        exceptionReason.trim(),
        currentUser.id
      );
      setAssembly(result.assembly);
      setSelectedRoleForException(null);
      setExceptionReason('');
      setRoleActionSuccess(`Platform Owner exception approved for "${selectedRoleForException}".`);
      triggerRefresh();
    } catch (err: any) {
      setExceptionError(err?.message || 'Failed to approve exception');
    } finally {
      setIsSubmittingException(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" role="status" aria-label="Loading youth assembly chamber">
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
          <h2 className="text-xl font-bold font-heading text-slate-900">Youth Assembly Not Found</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The requested deliberative assembly chamber "{id}" does not exist in the database.
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

  const isJoined = currentUser ? assembly.participantUserIds.includes(currentUser.id) : false;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        to="/assemblies"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Assemblies</span>
      </Link>

      {/* Assembly Hero Card */}
      <Card className="border-civic-teal-200 p-6 sm:p-8 space-y-5 bg-gradient-to-br from-white via-civic-teal-50/20 to-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-teal-800 bg-civic-teal-50 px-3 py-1 rounded-full border border-civic-teal-200">
              Stage: {assembly.currentStage.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {assembly.location}
            </span>
          </div>
          <StatusChip status={assembly.status} />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
            {assembly.title}
          </h1>
          <p className="text-sm text-civic-teal-900 font-semibold mt-1">
            Deliberative Theme: {assembly.theme}
          </p>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            {assembly.description}
          </p>
        </div>

        {/* Central Question Callout */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 space-y-1 shadow-2xs">
          <span className="font-bold text-civic-indigo-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-civic-indigo-600" />
            Central Deliberative Question:
          </span>
          <p className="text-sm sm:text-base text-slate-800 italic font-medium">"{assembly.question}"</p>
        </div>

        {/* 6 Stages Roadmap Timeline */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
            Assembly Deliberation Pathway (6 Stages)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5 text-center">
            {ALL_STAGES.map((st, i) => {
              const isCurrent = assembly.currentStage === st;
              const isPassed = ALL_STAGES.indexOf(assembly.currentStage) > i;

              return (
                <div
                  key={st}
                  className={`p-2 rounded-lg text-[10px] font-medium border transition-all ${
                    isCurrent
                      ? 'bg-civic-teal-600 text-white border-civic-teal-700 font-bold shadow-xs'
                      : isPassed
                      ? 'bg-civic-teal-50 text-civic-teal-900 border-civic-teal-200'
                      : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}
                >
                  <span className="block font-bold">{i + 1}</span>
                  <span className="capitalize truncate block">{st.replace('_', ' ')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Join or Enter Action Area */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span><strong>{assembly.participantUserIds.length}</strong> Admitted Delegates</span>
            <span>&bull;</span>
            <span><strong>{evidenceList.length}</strong> Ground Evidence Records</span>
            <span>&bull;</span>
            <span><strong>{contributions.length}</strong> Chamber Contributions</span>
          </div>

          <div className="flex items-center gap-2">
            {isJoined ? (
              <Link to={`/assemblies/${assembly.id}/session`}>
                <Button size="md" variant="teal" className="shadow-xs">
                  <Vote className="w-4 h-4 mr-1.5" />
                  <span>Enter Live Deliberation Workspace</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            ) : (
              <Button
                size="md"
                variant="primary"
                isLoading={isJoining}
                onClick={() => handleJoinAssembly()}
                className="shadow-xs"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                <span>Join Youth Assembly (+2 Credits)</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Action Feedback Banners */}
      {roleActionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2" data-testid="assembly-role-action-error">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{roleActionError}</span>
          </div>
          <button onClick={() => setRoleActionError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {roleActionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2" data-testid="assembly-role-action-success">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{roleActionSuccess}</span>
          </div>
          <button onClick={() => setRoleActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Point-of-Use Reservation Rulebook Banner */}
      <Card className="border-civic-indigo-200 bg-gradient-to-r from-civic-indigo-50/70 via-white to-civic-indigo-50/40 p-5 space-y-3" data-testid="assembly-reservation-rulebook-banner">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-civic-indigo-700" />
            <div>
              <h2 className="text-sm sm:text-base font-bold font-heading text-slate-900">
                Point-of-Use Assembly Reservation Rulebook & Role Quotas
              </h2>
              <p className="text-xs text-slate-500">
                Policy Version: <span className="font-mono font-semibold text-civic-indigo-900">2026.1-womens-reservation-33</span> &bull; Mandatory 33% per named functional and procedural role allocation
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowRulebookModal(true)} data-testid="open-assembly-rulebook-btn">
            <BookOpen className="w-3.5 h-3.5 mr-1 text-civic-indigo-600" />
            <span>Read Point-of-Use Rules</span>
          </Button>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Every named Assembly role (Thinker, Enabler, Troubleshooter, Shaper, Chair, Co-Chair, and Facilitator) operates under a separate 33% mandatory women's reservation quota calculated as <code className="font-mono bg-slate-100 px-1 py-0.5 rounded font-semibold text-slate-800">ceil(0.33 &times; allocatedPlaces)</code>. Cross-role pooling is prohibited; unmet reserved role places stay vacant by default. The only exception path is an explicit, simulated Platform Owner approval (<code className="font-mono bg-purple-50 text-purple-800 px-1 py-0.5 rounded">platform_admin</code>) with substantive reason and permanent audit trail.
        </p>
        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 border-t border-civic-indigo-100">
          <span>&bull; Fictional Jaipur Prototype: one-browser simulation only.</span>
          <span>&bull; No real gender collection or server authority is claimed.</span>
          <span>&bull; Small cohorts (&le; 3 places): individual status is privacy-suppressed from public view.</span>
        </div>
      </Card>

      {/* Named Role Allocations Grid & Aggregate Status Card */}
      {assembly.roleAllocations && (
        <Card className="border-slate-200 p-6 space-y-6 bg-white shadow-sm" data-testid="assembly-reservation-allocations-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-civic-indigo-50 border border-civic-indigo-100 flex items-center justify-center text-civic-indigo-600">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold font-heading text-slate-900">
                  Named Assembly Role Allocations & Compliance Status
                </h3>
                <p className="text-xs text-slate-500">
                  Separate non-pooled quotas for 4 functional zones + procedural roles (Chair, Facilitator)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Active Persona:</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border text-slate-800" data-testid="active-persona-role-indicator">
                {currentUser?.name || 'Guest'} ({currentUser?.role || 'delegate'})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="assembly-role-allocations-grid">
            {Object.entries(assembly.roleAllocations).map(([roleKey, alloc]) => {
              const isOwner = currentUser?.role === 'platform_admin';
              const isSuppressed = alloc.isPrivacySuppressed;

              return (
                <div
                  key={roleKey}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between"
                  data-testid={`role-allocation-card-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold font-heading text-slate-900">
                        {roleKey}
                      </span>
                      <div>
                        {isSuppressed ? (
                          <span
                            className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1"
                            data-testid="status-privacy-suppressed"
                          >
                            <Shield className="w-3 h-3 text-civic-indigo-600" />
                            <span>Protected</span>
                          </span>
                        ) : (
                          <>
                            {alloc.status === 'finalized_compliant' && (
                              <span
                                className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1"
                                data-testid="status-finalized-compliant"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Compliant</span>
                              </span>
                            )}
                            {alloc.status === 'finalized_exception' && (
                              <span
                                className="px-2 py-0.5 text-[11px] font-bold rounded bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1"
                                data-testid="status-finalized-exception"
                              >
                                <ShieldAlert className="w-3 h-3 text-purple-600" />
                                <span>Exception Approved</span>
                              </span>
                            )}
                            {alloc.status === 'blocked_noncompliant' && (
                              <span
                                className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1"
                                data-testid="status-blocked-noncompliant"
                              >
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                <span>Blocked</span>
                              </span>
                            )}
                            {alloc.status === 'unvalidated_legacy' && (
                              <span
                                className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1"
                                data-testid="status-unvalidated-legacy"
                              >
                                <Info className="w-3 h-3 text-amber-600" />
                                <span>Legacy Record</span>
                              </span>
                            )}
                            {(!alloc.status || alloc.status === 'pending') && (
                              <span
                                className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1"
                                data-testid="status-pending"
                              >
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>Pending</span>
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Metrics grid for this role */}
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">Total</span>
                        <span className="font-bold font-mono text-slate-900" data-testid={`metric-total-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}>{alloc.totalPlaces}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-civic-indigo-50/60 border border-civic-indigo-100">
                        <span className="text-[10px] text-civic-indigo-700 block">33% Min</span>
                        <span className="font-bold font-mono text-civic-indigo-900" data-testid={`metric-reserved-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}>{alloc.reservedMinimum}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-white border border-slate-200">
                        <span className="text-[10px] text-slate-400 block">Ordinary</span>
                        <span className="font-bold font-mono text-slate-900">{alloc.ordinaryPlaces}</span>
                      </div>
                    </div>

                    {/* Occupancy and Vacancies */}
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Reserved Occupants:</span>
                        <span className="font-semibold text-slate-800">
                          {alloc.reservedOccupiedCount !== undefined ? alloc.reservedOccupiedCount : 'Withheld (Privacy)'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Ordinary Occupants:</span>
                        <span className="font-semibold text-slate-800">
                          {alloc.ordinaryOccupiedCount !== undefined ? alloc.ordinaryOccupiedCount : 'Withheld (Privacy)'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-slate-500">Held Vacancies:</span>
                        <span className="font-semibold text-slate-800">
                          {alloc.vacanciesCount !== undefined ? `${alloc.vacanciesCount} vacant` : 'Withheld (Privacy)'}
                        </span>
                      </div>
                    </div>

                    {/* Exception Audit Box if exception approved and visible to caller */}
                    {alloc.isException && alloc.exceptionAudit && (
                      <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1" data-testid="role-exception-audit-box">
                        <div className="flex items-center gap-1 font-bold text-[11px]">
                          <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
                          <span>Platform Owner Exception Audit</span>
                        </div>
                        <p className="text-[11px] italic bg-white/70 p-1.5 rounded border border-purple-100">
                          "{alloc.exceptionAudit.reason}"
                        </p>
                        <div className="text-[10px] text-purple-700">
                          Approver: <span className="font-semibold">{alloc.exceptionAudit.actorId || 'Platform Owner'}</span> ({alloc.exceptionAudit.actorRole})
                        </div>
                        <div className="text-[10px] text-purple-600 font-mono">
                          {alloc.exceptionAudit.policyVersion} &bull; {alloc.exceptionAudit.outcome}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Role Action Controls */}
                  <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5 justify-end">
                    {isOwner ? (
                      <>
                        {alloc.status !== 'finalized_compliant' && alloc.status !== 'finalized_exception' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedRoleForException(roleKey);
                              setExceptionReason('');
                              setExceptionError(null);
                            }}
                            data-testid={`approve-role-exception-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <span>Approve Exception</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          isLoading={isFinalizingRole === roleKey}
                          onClick={() => handleFinalizeRole(roleKey)}
                          data-testid={`finalize-role-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <span>Finalize</span>
                        </Button>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Validation governed by Platform Owner
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Role Card for Participant */}
      {userRole ? (
        <Card className="border-civic-indigo-200 bg-civic-indigo-50/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-civic-indigo-600" />
              <h2 className="text-base sm:text-lg font-bold font-heading text-civic-indigo-950">
                Your Allocated Role: {userRole.roleName}
              </h2>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-civic-indigo-100 text-civic-indigo-800 font-bold border border-civic-indigo-300">
              Active Chamber Role
            </span>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">
              Key Responsibilities:
            </span>
            <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
              {userRole.responsibilities.map((resp, i) => (
                <li key={i} className="leading-relaxed">{resp}</li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-civic-indigo-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-civic-indigo-900">
              Deliberative Inquiry Prompts (Use in Workspace):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {userRole.promptSuggestions.map((prompt, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-white border border-civic-indigo-200 text-xs text-slate-700 italic">
                  "{prompt}"
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50/40 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-amber-900 font-heading">
              You have not joined this Assembly yet
            </h3>
            <p className="text-xs text-amber-700 mt-0.5">
              Click below to join, receive your allocated role (e.g. Thinker), earn 2 Deliberation Credits, and enter the chamber.
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            isLoading={isJoining}
            onClick={() => handleJoinAssembly()}
          >
            <span>Join Now (+2 Credits)</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Card>
      )}

      {/* Proposition Status Card */}
      {proposition && (
        <Card className="border-slate-200 p-6 space-y-4 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-civic-saffron-600" />
              <span>Draft Civic Proposition (v{proposition.version})</span>
            </h3>
            <div className="flex items-center gap-2">
              <Link to={`/propositions/${proposition.id}/revisions`} className="text-xs text-civic-indigo-600 font-semibold hover:underline">
                {proposition.revisions.length} Revisions
              </Link>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-800 font-bold uppercase">
                {proposition.outcome}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
            {proposition.proposition}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span>Support: <strong>{proposition.supportProfile.stronglySupport} Strongly Support</strong></span>
              <span>&bull;</span>
              <span>Dissent: <strong>{proposition.dissent.length} Records Preserved</strong></span>
            </div>

            <Link to={`/propositions/${proposition.id}`}>
              <Button size="sm" variant="outline">
                <span>View Full Proposition & Dissent</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Two Column Grid: Deliberators & Evidence Pool */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chamber Deliberators & Roles */}
        <Card className="border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-civic-indigo-600" />
              <span>Chamber Deliberators ({participants.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Simulated Collaboration</span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {participants.map((p) => {
              const role = allRoles.find((r) => r.userId === p.id);
              const isMe = p.id === currentUser?.id;

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    isMe
                      ? 'bg-civic-indigo-50/50 border-civic-indigo-300'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Avatar src={p.avatar} alt={p.name} size="sm" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{p.name}</span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-civic-indigo-600 text-white font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">{p.institutionName}</span>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-civic-indigo-800 bg-civic-indigo-100 px-2 py-0.5 rounded border border-civic-indigo-200">
                    {role ? role.roleName : 'Delegate'}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Chamber Evidence Pool */}
        <Card className="border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-heading text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-civic-teal-600" />
              <span>Chamber Evidence Pool ({evidenceList.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Traceable IDs</span>
          </div>

          <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
            {evidenceList.map((ev) => (
              <div
                key={ev.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-civic-teal-800 bg-civic-teal-50 px-1.5 py-0.5 rounded border border-civic-teal-200 font-bold">
                    {ev.id}
                  </span>
                  <StatusChip status={ev.verificationStatus} />
                </div>
                <h4 className="font-bold text-slate-900">{ev.title}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-2">{ev.description}</p>
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/60">
                  <span>Source: {ev.source}</span>
                  <span className="capitalize">Visibility: {ev.visibility}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Platform Owner Exception Approval Modal */}
      {selectedRoleForException && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" data-testid="assembly-exception-modal">
          <Card className="max-w-lg w-full bg-white p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold font-heading text-slate-900">
                  Approve Platform Owner Exception: {selectedRoleForException}
                </h3>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelectedRoleForException(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Under Policy <span className="font-mono font-semibold">2026.1-womens-reservation-33</span>, unmet reserved places stay vacant by default. Approving this exception permits the allocation for <span className="font-semibold text-slate-800">"{selectedRoleForException}"</span> to proceed. This decision is permanently audited and visibly marked as an exception.
            </p>

            <form onSubmit={handleApproveException} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Substantive Justification Reason (min 5 characters):
                </label>
                <textarea
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-sans"
                  placeholder="e.g. Fictional pilot test: specific candidate with domain expertise assigned to ensure deliberative proceedings..."
                  rows={3}
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  data-testid="assembly-exception-reason-input"
                  required
                />
              </div>

              {exceptionError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs" data-testid="assembly-exception-error">
                  {exceptionError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={() => setSelectedRoleForException(null)} data-testid="cancel-assembly-exception-btn">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  type="submit"
                  isLoading={isSubmittingException}
                  data-testid="submit-assembly-exception-btn"
                >
                  Confirm & Audit Exception
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Point-of-Use Rulebook Modal */}
      {showRulebookModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full bg-white p-6 space-y-4 max-h-[90vh] overflow-y-auto" data-testid="assembly-rulebook-modal">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-civic-indigo-600" />
                <h3 className="text-base font-bold font-heading text-slate-900">
                  Youth Assembly Reservation & Allocation Rulebook
                </h3>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowRulebookModal(false)} aria-label="Close Rulebook" data-testid="close-assembly-rulebook-btn">
                <X className="w-4 h-4 mr-1" />
                <span>Close Rulebook</span>
              </Button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Rule 1: Independent 33% Quota Per Named Role</h4>
                <p>Every named Assembly role (Thinker, Enabler, Troubleshooter, Shaper, Chair, Co-Chair, Facilitator, secondary roles) calculates its minimum reserved places as <code className="font-mono bg-white px-1 py-0.5 rounded border">ceil(0.33 &times; totalPlaces)</code>. No cross-role or cross-event pooling is allowed.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Rule 2: Unmet Places Stay Vacant</h4>
                <p>If eligible participants do not fill reserved places, those places remain vacant by default. General participants cannot take reserved places unless an authorized Platform Owner exception is recorded.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Rule 3: Singular Named Roles (Chair / Facilitator)</h4>
                <p>For singular 1-place roles, the formula yields 1 reserved place. Ineligible or undeclared candidates cannot be confirmed without Platform Owner exception approval.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Rule 4: Automatic Invalidation on Roster or Capacity Change</h4>
                <p>Any participant join, role reassignment, withdrawal, or capacity change immediately invalidates any prior Platform Owner exception for affected roles, reverting status to pending for re-validation.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Rule 5: Small-Cohort Privacy Protection</h4>
                <p>For cohorts of 3 or fewer places, public/participant projections withhold breakdown metrics to prevent deductive inference of individual declarations.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900">Rule 6: Platform Owner Authority Guard</h4>
                <p>Only authenticated Platform Owners (<code className="font-mono bg-white px-1 py-0.5 rounded border">platform_admin</code>) can approve exceptions. Facilitator or participant override attempts are strictly rejected.</p>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <Button size="sm" variant="primary" onClick={() => setShowRulebookModal(false)}>
                Close Rulebook
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

