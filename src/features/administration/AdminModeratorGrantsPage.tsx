import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import {
  ScopedModeratorGrant,
  ScopedModeratorAuditRecord,
  User,
  Session,
  ModeratorScopeType,
} from '../../types/domain';
import { Card, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  Ban,
  UserCheck,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Users2,
  Layers,
  Info,
  Calendar,
  Lock,
  PlusCircle,
  History,
  X,
  ExternalLink,
} from 'lucide-react';
import { formatDateTime, formatRoleName } from '../../utils/formatters';

export const AdminModeratorGrantsPage: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [grants, setGrants] = useState<ScopedModeratorGrant[]>([]);
  const [audits, setAudits] = useState<ScopedModeratorAuditRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter tabs: 'grants' | 'audits'
  const [activeTab, setActiveTab] = useState<'grants' | 'audits'>('grants');
  const [grantFilter, setGrantFilter] = useState<'all' | 'active' | 'revoked' | 'expired'>('all');
  const [auditFilter, setAuditFilter] = useState<'all' | 'created' | 'revoked' | 'used' | 'denied'>('all');

  // Modal State for Revocation
  const [revokingGrant, setRevokingGrant] = useState<ScopedModeratorGrant | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [revokeError, setRevokeError] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Modal State for Grant Creation
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [granteeId, setGranteeId] = useState('');
  const [scopeType, setScopeType] = useState<ModeratorScopeType>('assignments');
  const [namedSessionId, setNamedSessionId] = useState('');
  const [durationDays, setDurationDays] = useState(14);
  const [grantReason, setGrantReason] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const isPlatformOwner = currentUser?.role === 'platform_admin';

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [grantsList, auditsList, usersList, snapshot] = await Promise.all([
          demoRepository.getScopedModeratorGrants(),
          demoRepository.getScopedModeratorAudits(),
          demoRepository.getUsers(),
          demoRepository.getDatabaseSnapshot(),
        ]);
        setGrants(grantsList);
        setAudits(auditsList);
        setUsers(usersList);
        setSessions(snapshot.sessions || []);
        if (usersList.length > 0 && !granteeId) {
          const defaultMod = usersList.find((u) => u.role === 'moderator') || usersList[0];
          setGranteeId(defaultMod.id);
        }
        if (snapshot.sessions && snapshot.sessions.length > 0 && !namedSessionId) {
          setNamedSessionId(snapshot.sessions[0].id);
        }
      } catch (err) {
        console.error('Failed to load moderator grant data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [refreshKey]);

  const handleOpenRevokeModal = (grant: ScopedModeratorGrant) => {
    setRevokingGrant(grant);
    setRevokeReason('');
    setRevokeError(null);
  };

  const handleConfirmRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingGrant || !currentUser) return;
    if (revokeReason.trim().length < 3) {
      setRevokeError('A substantive reason is required (at least 3 characters).');
      return;
    }

    setIsRevoking(true);
    setRevokeError(null);
    try {
      await demoRepository.revokeScopedModeratorGrant(
        revokingGrant.id,
        revokeReason.trim(),
        currentUser.id
      );
      setRevokingGrant(null);
      setRevokeReason('');
      triggerRefresh();
    } catch (err: any) {
      setRevokeError(err.message || 'Failed to revoke grant');
    } finally {
      setIsRevoking(false);
    }
  };

  const handleCreateGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (grantReason.trim().length < 3) {
      setCreateError('Please provide a substantive justification reason (at least 3 characters).');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    try {
      const targetSession = sessions.find((s) => s.id === namedSessionId);
      await demoRepository.createScopedModeratorGrant(
        {
          granteeId,
          scope: {
            type: scopeType,
            sessionId: scopeType === 'named_session' ? namedSessionId : undefined,
            sessionTitle: scopeType === 'named_session' ? targetSession?.title : undefined,
            description:
              scopeType === 'assignments'
                ? 'Curriculum & civic assignment submission review'
                : scopeType === 'memberships'
                ? 'Workspace & community membership conduct moderation'
                : `Deliberation queue & speaking order in ${targetSession?.title || namedSessionId}`,
          },
          durationDays,
          reason: grantReason.trim(),
        },
        currentUser.id
      );
      setIsCreateModalOpen(false);
      setGrantReason('');
      triggerRefresh();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create grant');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredGrants = grants.filter((g) => {
    if (grantFilter === 'all') return true;
    return g.status === grantFilter;
  });

  const filteredAudits = audits.filter((a) => {
    if (auditFilter === 'all') return true;
    if (auditFilter === 'created') return a.action === 'grant_created';
    if (auditFilter === 'revoked') return a.action === 'grant_revoked';
    if (auditFilter === 'used') return a.action === 'grant_used';
    if (auditFilter === 'denied') return a.action === 'grant_denied';
    return true;
  });

  const activeGrantsCount = grants.filter((g) => g.status === 'active').length;
  const revokedGrantsCount = grants.filter((g) => g.status === 'revoked').length;
  const expiredGrantsCount = grants.filter((g) => g.status === 'expired').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-civic-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Honest Prototype Disclosure Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-950">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-amber-900">
              One-Browser Simulation Disclosure &bull; Change Plan v2 §12
            </span>
            <span className="bg-amber-200 text-amber-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
              Competition Demo
            </span>
          </div>
          <p className="leading-relaxed text-amber-900/90">
            This module models founder-delegated, time-bounded authority grants held strictly under Platform Owner control. In this competition demo, policies and audit trails are persisted in local browser storage. Production enforcement requires a cryptographic token gateway and server-side RBAC/ABAC verification.
          </p>
        </div>
      </div>

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-civic-teal-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Owner Governance Console &bull; Section 12</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
            Scoped Moderator Grants
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Founder-held platform delegations giving designated moderators limited powers for a limited time. Distinct from workspace-local moderator roles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isPlatformOwner ? (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="saffron"
              size="sm"
              className="shadow-sm"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              <span>Issue New Grant</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-xs border border-slate-700">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Owner Access Only</span>
              <Link to="/demo-login" className="text-civic-indigo-400 font-semibold hover:underline ml-1">
                Switch to Admin
              </Link>
            </div>
          )}

          <Link to="/admin/moderation">
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-200 hover:bg-slate-800">
              <ShieldAlert className="w-4 h-4 mr-1.5" />
              <span>Moderation Cases</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Architectural Distinction & Reservation Rule Notice Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-indigo-50/50 border-indigo-200 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-bold text-indigo-900 mb-1">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>Platform Delegation vs. Workspace-Local Moderator</span>
          </div>
          <p className="leading-relaxed">
            <strong>Workspace-local moderators</strong> are assigned inside individual workspaces (<code className="font-mono bg-white px-1 py-0.5 rounded border border-indigo-200">WorkspaceRole = 'moderator'</code>) and cannot act outside their team space.
            <strong> Scoped grants</strong> are platform-wide delegations issued by the founder for <span className="underline decoration-indigo-300">assignments</span>, <span className="underline decoration-indigo-300">memberships</span>, or a <span className="underline decoration-indigo-300">named session</span>.
          </p>
        </Card>

        <Card className="p-4 bg-rose-50/50 border-rose-200 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-bold text-rose-900 mb-1">
            <Ban className="w-4 h-4 text-rose-600" />
            <span>Strict 33% Women's Reservation Boundary</span>
          </div>
          <p className="leading-relaxed">
            Under Master PRD Supplementary §6, OD.17, and Change Plan v2 §12: <strong>Moderators can NEVER approve or bypass a 33% reservation exception.</strong> The exception approval path is strictly restricted to the Platform Owner persona (<code className="font-mono bg-white px-1 py-0.5 rounded border border-rose-200">platform_admin</code>).
          </p>
        </Card>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Total Grants</span>
          <span className="text-2xl font-bold font-heading text-slate-900 mt-1 block">{grants.length}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Seeded & user-issued</span>
        </Card>
        <Card className="p-4 border-emerald-200 bg-emerald-50/30">
          <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">Active Unexpired</span>
          <span className="text-2xl font-bold font-heading text-emerald-700 mt-1 block">{activeGrantsCount}</span>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">Permitted in scope</span>
        </Card>
        <Card className="p-4 border-rose-200 bg-rose-50/30">
          <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider block">Revoked</span>
          <span className="text-2xl font-bold font-heading text-rose-700 mt-1 block">{revokedGrantsCount}</span>
          <span className="text-[11px] text-rose-600 mt-0.5 block">Terminated early by owner</span>
        </Card>
        <Card className="p-4 border-amber-200 bg-amber-50/30">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">Expired</span>
          <span className="text-2xl font-bold font-heading text-amber-700 mt-1 block">{expiredGrantsCount}</span>
          <span className="text-[11px] text-amber-600 mt-0.5 block">Lapsed duration</span>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('grants')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'grants'
              ? 'border-civic-indigo-600 text-civic-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Delegated Grants Inventory ({grants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audits')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'audits'
              ? 'border-civic-indigo-600 text-civic-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit History & Grant Actions ({audits.length})</span>
        </button>
      </div>

      {/* Tab 1: Grants Inventory */}
      {activeTab === 'grants' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 uppercase mr-1">Status:</span>
              {(['all', 'active', 'revoked', 'expired'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setGrantFilter(filter)}
                  className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                    grantFilter === filter
                      ? 'bg-civic-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <span className="text-slate-400">
              Showing {filteredGrants.length} of {grants.length} grants
            </span>
          </div>

          {/* Grants Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGrants.map((grant) => {
              const isExpired = grant.status === 'expired' || new Date(grant.expiresAt) <= new Date();
              const isRevoked = grant.status === 'revoked';
              const isActive = grant.status === 'active' && !isExpired;

              return (
                <Card
                  key={grant.id}
                  className={`p-5 flex flex-col justify-between border transition-all ${
                    isActive
                      ? 'border-emerald-200 bg-white hover:border-emerald-300'
                      : isRevoked
                      ? 'border-rose-200 bg-rose-50/20 opacity-90'
                      : 'border-amber-200 bg-amber-50/20 opacity-80'
                  }`}
                >
                  <div>
                    {/* Top Row: Scope & Status Badges */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-semibold uppercase tracking-wider border border-slate-200">
                        {grant.scope.type === 'assignments' && <FileCheck2 className="w-3.5 h-3.5 text-civic-teal-600" />}
                        {grant.scope.type === 'memberships' && <Users2 className="w-3.5 h-3.5 text-civic-indigo-600" />}
                        {grant.scope.type === 'named_session' && <Layers className="w-3.5 h-3.5 text-purple-600" />}
                        <span>
                          {grant.scope.type === 'assignments' && 'Assignments Scope'}
                          {grant.scope.type === 'memberships' && 'Memberships Scope'}
                          {grant.scope.type === 'named_session' && 'Named Session Scope'}
                        </span>
                      </span>

                      {isActive && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Active</span>
                        </span>
                      )}
                      {isRevoked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold">
                          <Ban className="w-3 h-3 text-rose-600" />
                          <span>Revoked</span>
                        </span>
                      )}
                      {isExpired && !isRevoked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>Expired</span>
                        </span>
                      )}
                    </div>

                    {/* Grantee Info */}
                    <div className="space-y-1 mb-3">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Grantee
                      </span>
                      <h2 className="text-base font-bold text-slate-900 font-heading">
                        {grant.granteeName}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-medium text-slate-700">
                          {formatRoleName(grant.granteeRole)}
                        </span>
                        {grant.granteeEmail && <span className="truncate">{grant.granteeEmail}</span>}
                      </div>
                    </div>

                    {/* Scope details */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-xs text-slate-700 mb-3 space-y-1">
                      <div className="font-semibold text-slate-800">
                        {grant.scope.type === 'named_session' ? (
                          <span className="text-purple-900 flex items-center gap-1">
                            <span>Session:</span>
                            <span className="font-mono bg-purple-100/70 text-purple-900 px-1 rounded">
                              {grant.scope.sessionId}
                            </span>
                          </span>
                        ) : (
                          <span>Delegated Permission:</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {grant.scope.description || grant.reason}
                      </p>
                    </div>

                    {/* Metadata & Grantor */}
                    <div className="space-y-1.5 text-[11px] text-slate-500 border-t border-slate-100 pt-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span>Grantor:</span>
                        <span className="font-medium text-slate-800">{grant.grantorName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Issued:</span>
                        <span>{formatDateTime(grant.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Expires:</span>
                        <span className={isExpired ? 'font-semibold text-amber-700' : 'text-slate-700'}>
                          {formatDateTime(grant.expiresAt)}
                        </span>
                      </div>
                      {grant.revokedAt && (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-900 text-[11px] space-y-0.5 mt-2">
                          <span className="font-bold block">Revocation Recorded:</span>
                          <span className="block text-rose-800 leading-snug">
                            &ldquo;{grant.revocationReason}&rdquo;
                          </span>
                          <span className="text-[10px] text-rose-600 block mt-1">
                            At {formatDateTime(grant.revokedAt)} by {grant.revokedBy}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      ID: {grant.id}
                    </span>

                    {isActive && (
                      isPlatformOwner ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenRevokeModal(grant)}
                          className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:text-rose-800 text-xs py-1 h-auto"
                        >
                          <Ban className="w-3.5 h-3.5 mr-1" />
                          <span>Revoke Grant</span>
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Owner action only
                        </span>
                      )
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Audits History */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          {/* Audit Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-500 uppercase mr-1">Action Type:</span>
              {(['all', 'created', 'revoked', 'used', 'denied'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setAuditFilter(filter)}
                  className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                    auditFilter === filter
                      ? 'bg-civic-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <span className="text-slate-400">
              Showing {filteredAudits.length} recorded events
            </span>
          </div>

          {/* Audit Table */}
          <Card className="overflow-hidden border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Scope</th>
                    <th className="py-3 px-4">Outcome</th>
                    <th className="py-3 px-4">Details & Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAudits.map((audit) => {
                    return (
                      <tr key={audit.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          {formatDateTime(audit.timestamp)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-medium">
                          {audit.action === 'grant_created' && (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Grant Created</span>
                            </span>
                          )}
                          {audit.action === 'grant_revoked' && (
                            <span className="inline-flex items-center gap-1 text-rose-700">
                              <Ban className="w-3.5 h-3.5" />
                              <span>Grant Revoked</span>
                            </span>
                          )}
                          {audit.action === 'grant_used' && (
                            <span className="inline-flex items-center gap-1 text-civic-indigo-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Grant Used</span>
                            </span>
                          )}
                          {audit.action === 'grant_denied' && (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Access Denied</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{audit.actorName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{audit.actorRole}</div>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-mono">
                            {audit.scopeType}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              audit.outcome === 'success'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {audit.outcome}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-md">
                          <div className="text-slate-800 leading-snug">{audit.details}</div>
                          {audit.denialReason && (
                            <div className="text-[11px] text-rose-700 font-medium mt-0.5">
                              Denial Reason: {audit.denialReason}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Revocation Modal */}
      {revokingGrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-md p-6 bg-white shadow-2xl border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold font-heading text-lg">
                <Ban className="w-5 h-5 text-rose-600" />
                <span>Revoke Scoped Grant</span>
              </div>
              <button
                onClick={() => setRevokingGrant(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRevoke} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div>
                  <span className="text-slate-500">Grantee:</span>{' '}
                  <span className="font-semibold text-slate-800">{revokingGrant.granteeName}</span>
                </div>
                <div>
                  <span className="text-slate-500">Scope:</span>{' '}
                  <span className="font-mono bg-white px-1 py-0.5 rounded border text-slate-800 uppercase">
                    {revokingGrant.scope.type}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Expires:</span>{' '}
                  <span>{formatDateTime(revokingGrant.expiresAt)}</span>
                </div>
              </div>

              {revokeError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{revokeError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Revocation Reason (Required &bull; Written to Permanent Audit)
                </label>
                <textarea
                  required
                  rows={3}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  placeholder="State the governance justification for immediate revocation..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRevokingGrant(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                  disabled={isRevoking}
                >
                  {isRevoking ? 'Revoking...' : 'Confirm Revocation'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Grant Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 bg-white shadow-2xl border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold font-heading text-lg">
                <ShieldCheck className="w-5 h-5 text-civic-indigo-600" />
                <span>Issue Scoped Moderator Grant</span>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGrant} className="mt-4 space-y-4">
              {createError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              {/* Grantee Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Designated Grantee (User)
                </label>
                <select
                  value={granteeId}
                  onChange={(e) => setGranteeId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({formatRoleName(u.role)}) &bull; {u.location || u.institutionName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scope Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScopeType('assignments')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                    scopeType === 'assignments'
                      ? 'border-civic-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Assignments
                </button>
                <button
                  type="button"
                  onClick={() => setScopeType('memberships')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                    scopeType === 'memberships'
                      ? 'border-civic-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Memberships
                </button>
                <button
                  type="button"
                  onClick={() => setScopeType('named_session')}
                  className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                    scopeType === 'named_session'
                      ? 'border-civic-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Named Session
                </button>
              </div>

              {/* Named Session Picker */}
              {scopeType === 'named_session' && (
                <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-purple-900 mb-1">
                    Select Target Deliberation Session
                  </label>
                  <select
                    value={namedSessionId}
                    onChange={(e) => setNamedSessionId(e.target.value)}
                    className="w-full text-xs p-2 rounded border border-purple-300 bg-white text-purple-950 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title} ({s.id})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-purple-700 mt-1">
                    Cross-session enforcement: The moderator will be permitted in this session only. Other sessions will strictly reject moderation actions.
                  </p>
                </div>
              )}

              {/* Duration Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Grant Duration
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                >
                  <option value={1}>1 Day (Emergency / Short Workshop)</option>
                  <option value={7}>7 Days (Standard Sprint Session)</option>
                  <option value={14}>14 Days (Two Weeks Delegation)</option>
                  <option value={30}>30 Days (One Month Term)</option>
                  <option value={60}>60 Days (Extended Delegation)</option>
                </select>
              </div>

              {/* Justification Reason */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Founder Justification & Reason (Audited)
                </label>
                <textarea
                  required
                  rows={2}
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="Explain why this delegation is issued and what task it covers..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-civic-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  variant="saffron"
                  disabled={isCreating}
                >
                  {isCreating ? 'Issuing...' : 'Issue Scoped Grant'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
