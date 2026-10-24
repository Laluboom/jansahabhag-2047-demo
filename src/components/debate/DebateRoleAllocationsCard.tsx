import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  Users,
  Shield,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  BookOpen,
  UserCheck,
  UserMinus,
  Layers,
  History,
} from 'lucide-react';
import { Session, User, CANONICAL_DEBATE_ROLES, AllocationState } from '../../types/domain';

interface DebateRoleAllocationsCardProps {
  session: Session;
  currentUser: User;
  allUsers: User[];
  onOpenRulebook: () => void;
  onOpenExceptionModal: (roleName: string) => void;
  onFinalizeRole: (roleName: string) => Promise<void>;
  onOpenAssignModal: (roleName: string) => void;
  onWithdrawRole: (roleName: string) => Promise<void>;
  onOpenCapacityModal: (roleName: string) => void;
  onOpenAuditsModal: (roleName: string) => void;
  isFinalizingRole: string | null;
  isWithdrawingRole: string | null;
}

export const DebateRoleAllocationsCard: React.FC<DebateRoleAllocationsCardProps> = ({
  session,
  currentUser,
  allUsers: _allUsers,
  onOpenRulebook,
  onOpenExceptionModal,
  onFinalizeRole,
  onOpenAssignModal,
  onWithdrawRole,
  onOpenCapacityModal,
  onOpenAuditsModal,
  isFinalizingRole,
  isWithdrawingRole,
}) => {
  const roleAllocations = session.roleAllocations || {};
  const isOwner = currentUser.role === 'platform_admin';
  const isFacilitator = currentUser.id === session.facilitatorId;
  const isPlanFinalized = session.rolePlanStage === 'finalized';

  return (
    <Card
      className="border-slate-200 p-6 space-y-6 bg-white shadow-xs"
      data-testid="debate-reservation-allocations-card"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-civic-indigo-50 border border-civic-indigo-100 flex items-center justify-center text-civic-indigo-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold font-heading text-slate-900">
                Debate Room Named Role Allocations & Compliance Plan
              </h3>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                  isPlanFinalized
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border-amber-200'
                }`}
                data-testid="debate-role-plan-stage"
              >
                {isPlanFinalized
                  ? 'Plan Finalized'
                  : 'Open Selection (Not Compliant — Unvalidated Legacy Appointments)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              7 formal named debate roles under Policy 2026.1-womens-reservation-33 (open speaking queue excluded)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <span>Viewing as:</span>
            <span
              className="font-mono font-bold text-slate-900"
              data-testid="active-persona-role-indicator"
            >
              {currentUser.name} ({currentUser.role})
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenRulebook}
            className="text-xs bg-white text-slate-700"
            data-testid="open-debate-reservation-rulebook-btn"
          >
            <BookOpen className="w-3.5 h-3.5 mr-1" />
            <span>Allocation Rulebook</span>
          </Button>
        </div>
      </div>

      {/* Grid of Canonical Debate Roles */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        data-testid="debate-role-allocations-grid"
      >
        {CANONICAL_DEBATE_ROLES.map((roleKey) => {
          const alloc: AllocationState = roleAllocations[roleKey] || {
            allocationId: `alloc_${session.id}_${roleKey.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
            allocationType: 'named_roles',
            title: `${roleKey} Allocation`,
            totalPlaces: 1,
            reservedMinimum: 1,
            ordinaryPlaces: 0,
            status: 'pending',
          };

          const isSuppressed = Boolean(alloc.isPrivacySuppressed);

          // Find current occupants from roster
          const rosterOccupants = session.roster.filter((r) => r.role === roleKey);
          const hasOccupants =
            (alloc.confirmedOccupants && alloc.confirmedOccupants.length > 0) ||
            rosterOccupants.length > 0;

          return (
            <div
              key={roleKey}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 flex flex-col justify-between"
              data-testid={`role-allocation-card-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="space-y-2">
                {/* Role Title and Status Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold font-heading text-slate-900">
                    {roleKey}
                  </span>
                  <div>
                    {isSuppressed ? (
                      <span
                        className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1"
                        data-testid="status-privacy-suppressed"
                        title="Small-cohort privacy protection applied"
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

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Total</span>
                    <span
                      className="font-bold font-mono text-slate-900"
                      data-testid={`metric-total-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {alloc.totalPlaces}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-civic-indigo-50/60 border border-civic-indigo-100">
                    <span className="text-[10px] text-civic-indigo-700 block">33% Min</span>
                    <span
                      className="font-bold font-mono text-civic-indigo-900"
                      data-testid={`metric-reserved-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {alloc.reservedMinimum}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Ordinary</span>
                    <span className="font-bold font-mono text-slate-900">
                      {alloc.ordinaryPlaces}
                    </span>
                  </div>
                </div>

                {/* Occupancy and Vacancies Breakdown */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Reserved Occupants:</span>
                    <span className="font-semibold text-slate-800">
                      {alloc.reservedOccupiedCount !== undefined
                        ? alloc.reservedOccupiedCount
                        : 'Withheld (Privacy)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Ordinary Occupants:</span>
                    <span className="font-semibold text-slate-800">
                      {alloc.ordinaryOccupiedCount !== undefined
                        ? alloc.ordinaryOccupiedCount
                        : 'Withheld (Privacy)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Held Vacancies:</span>
                    <span className="font-semibold text-slate-800">
                      {alloc.vacanciesCount !== undefined
                        ? `${alloc.vacanciesCount} vacant`
                        : 'Withheld (Privacy)'}
                    </span>
                  </div>
                </div>

                {/* Current Occupants List - No eligibility tags */}
                <div className="p-2 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Current Occupant(s):
                  </span>
                  {rosterOccupants.length > 0 ? (
                    <div className="space-y-0.5">
                      {rosterOccupants.map((occ) => (
                        <div
                          key={occ.userId}
                          className="flex items-center justify-between text-xs font-medium text-slate-800"
                        >
                          <span>{occ.name}</span>
                          {occ.userId === currentUser.id && (
                            <span className="text-[10px] bg-civic-indigo-50 text-civic-indigo-700 px-1.5 py-0.2 rounded border border-civic-indigo-200">
                              You
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-amber-700 italic">Vacant (Unassigned)</span>
                  )}
                </div>

                {/* Exception Audit Box (When visible) */}
                {alloc.isException && alloc.exceptionAudit && (
                  <div
                    className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1"
                    data-testid="role-exception-audit-box"
                  >
                    <div className="flex items-center gap-1 font-bold text-[11px]">
                      <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
                      <span>Platform Owner Exception Audit</span>
                    </div>
                    <p className="text-[11px] italic bg-white/80 p-1.5 rounded border border-purple-100">
                      "{alloc.exceptionAudit.reason}"
                    </p>
                    <div className="text-[10px] text-purple-700">
                      Approver:{' '}
                      <span className="font-semibold">
                        {alloc.exceptionAudit.actorName || alloc.exceptionAudit.actorId || 'Platform Owner'}
                      </span>{' '}
                      ({alloc.exceptionAudit.actorRole})
                    </div>
                    <div className="text-[10px] text-purple-600 font-mono">
                      {alloc.exceptionAudit.policyVersion} &bull; {alloc.exceptionAudit.outcome}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="pt-2 border-t border-slate-200/60 flex flex-wrap gap-1.5 justify-end">
                {isOwner ? (
                  <>
                    {alloc.status !== 'finalized_compliant' && alloc.status !== 'finalized_exception' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onOpenExceptionModal(roleKey)}
                        className="text-xs bg-purple-100 text-purple-900 border border-purple-300 hover:bg-purple-200"
                        data-testid={`approve-role-exception-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <ShieldAlert className="w-3 h-3 mr-1 text-purple-700" />
                        <span>Approve Exception</span>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isFinalizingRole === roleKey}
                      onClick={() => onFinalizeRole(roleKey)}
                      className="text-xs"
                      data-testid={`finalize-role-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                      <span>{isFinalizingRole === roleKey ? 'Finalizing...' : 'Finalize'}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenAssignModal(roleKey)}
                      className="text-xs"
                      data-testid={`assign-role-btn-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <UserCheck className="w-3 h-3 mr-1 text-civic-indigo-600" />
                      <span>Assign / Replace</span>
                    </Button>

                    {hasOccupants && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isWithdrawingRole === roleKey}
                        onClick={() => onWithdrawRole(roleKey)}
                        className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                        data-testid={`withdraw-role-btn-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <UserMinus className="w-3 h-3 mr-1 text-rose-600" />
                        <span>{isWithdrawingRole === roleKey ? 'Withdrawing...' : 'Withdraw'}</span>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenCapacityModal(roleKey)}
                      className="text-xs"
                      data-testid={`capacity-role-btn-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Layers className="w-3 h-3 mr-1 text-slate-600" />
                      <span>Capacity</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenAuditsModal(roleKey)}
                      className="text-xs"
                      data-testid={`view-role-audits-btn-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <History className="w-3 h-3 mr-1 text-slate-600" />
                      <span>Audits</span>
                    </Button>
                  </>
                ) : isFacilitator ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isFinalizingRole === roleKey}
                      onClick={() => onFinalizeRole(roleKey)}
                      className="text-xs"
                      data-testid={`finalize-role-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                      <span>{isFinalizingRole === roleKey ? 'Finalizing...' : 'Finalize'}</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenAssignModal(roleKey)}
                      className="text-xs"
                      data-testid={`assign-role-btn-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <UserCheck className="w-3 h-3 mr-1 text-civic-indigo-600" />
                      <span>Assign / Replace</span>
                    </Button>

                    {hasOccupants && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isWithdrawingRole === roleKey}
                        onClick={() => onWithdrawRole(roleKey)}
                        className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                        data-testid={`withdraw-role-btn-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <UserMinus className="w-3 h-3 mr-1 text-rose-600" />
                        <span>{isWithdrawingRole === roleKey ? 'Withdrawing...' : 'Withdraw'}</span>
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onOpenCapacityModal(roleKey)}
                      className="text-xs"
                      data-testid={`capacity-role-btn-${roleKey.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Layers className="w-3 h-3 mr-1 text-slate-600" />
                      <span>Capacity</span>
                    </Button>

                    <span className="text-[10px] text-slate-400 italic block w-full text-right pt-1">
                      Facilitator ordinary role management. Exception approvals strictly reserved for Platform Owner.
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] text-slate-400 italic">
                    Validation governed by Platform Owner. Ordinary participants cannot override reservation quotas.
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
