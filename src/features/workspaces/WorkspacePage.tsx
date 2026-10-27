import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useAppRefreshStore } from '../../stores/useAppRefreshStore';
import { demoRepository } from '../../services/demoRepository';
import {
  Workspace,
  WorkspaceMembership,
  WorkspaceAction,
  WorkspaceAuditEvent,
  WorkspaceActionType,
  User,
  Project,
} from '../../types/domain';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusChip } from '../../components/ui/StatusChip';
import { Input, Textarea } from '../../components/ui/Input';
import { DemoPreviewBadge } from '../../components/ui/DemoPreviewBadge';
import { formatDateTime, formatDate } from '../../utils/formatters';
import {
  Layers,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Lock,
  Search,
  Plus,
  Flag,
  HelpCircle,
  X,
  Clock,
  Ban,
  ExternalLink,
  Target,
} from 'lucide-react';

export const WorkspacePage: React.FC = () => {
  const { id: paramWorkspaceId } = useParams<{ id: string }>();
  const { currentUser, switchPersona } = useAuthStore();
  const { refreshKey, triggerRefresh } = useAppRefreshStore();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [myMembership, setMyMembership] = useState<WorkspaceMembership | null>(null);
  const [memberships, setMemberships] = useState<WorkspaceMembership[]>([]);
  const [actions, setActions] = useState<WorkspaceAction[]>([]);
  const [auditEvents, setAuditEvents] = useState<WorkspaceAuditEvent[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [joinedProjects, setJoinedProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Tabs: 'actions' | 'members' | 'moderation' | 'rulebook'
  const [activeTab, setActiveTab] = useState<'actions' | 'members' | 'moderation' | 'rulebook'>('actions');

  // Action creation state
  const [isCreatingAction, setIsCreatingAction] = useState(false);
  const [newActionType, setNewActionType] = useState<WorkspaceActionType>('team_note');
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionContent, setNewActionContent] = useState('');
  const [newActionSourceType, setNewActionSourceType] = useState<'proposition' | 'evidence' | 'none'>('proposition');
  const [newActionTags, setNewActionTags] = useState('Ward 24, Safety');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Invite state
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [isSearchingInvite, setIsSearchingInvite] = useState(false);
  const [inviteSearchResults, setInviteSearchResults] = useState<User[]>([]);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  // Moderation modal state
  const [moderationModalAction, setModerationModalAction] = useState<{
    type: 'freeze' | 'remove' | 'unfreeze' | 'restrict_member' | 'remove_member' | 'restore_member' | 'report';
    targetId: string;
    targetTitle?: string;
  } | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [isSubmittingModeration, setIsSubmittingModeration] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  // Rulebook acknowledgement modal
  const [isRulebookModalOpen, setIsRulebookModalOpen] = useState(false);
  const [isAcknowledgingRules, setIsAcknowledgingRules] = useState(false);

  // Active workspace ID (defaults to Rajkot School-Zone Workspace)
  const currentWorkspaceId = paramWorkspaceId || 'ws_jaipur_school_safety';

  // Load all workspace data
  useEffect(() => {
    let mounted = true;

    async function loadWorkspaceData() {
      setIsLoading(true);
      setPageError(null);
      try {
        const currentUserId = currentUser?.id || 'VSC-S-001';
        const [users, allProjects] = await Promise.all([
          demoRepository.getUsers(),
          demoRepository.getProjects(),
        ]);
        if (mounted) {
          setAllUsers(users);
          const userProjects = allProjects.filter(
            (p) => p.memberUserIds.includes(currentUserId) || p.leadUserId === currentUserId
          );
          setJoinedProjects(userProjects);
        }

        const ws = await demoRepository.getWorkspace(currentWorkspaceId, currentUserId);
        if (!mounted) return;

        if (!ws) {
          setPageError(`Workspace with ID "${currentWorkspaceId}" not found.`);
          setIsLoading(false);
          return;
        }

        setWorkspace(ws);

        // Fetch own membership first with caller boundary
        let userMem: WorkspaceMembership | null = null;
        try {
          userMem = await demoRepository.getWorkspaceMembership(ws.id, currentUserId, currentUserId);
          if (mounted) setMyMembership(userMem);
        } catch {
          if (mounted) setMyMembership(null);
        }

        const isOwnerOrMod = ws.ownerId === currentUserId || (ws.moderatorIds || []).includes(currentUserId);
        const isActiveMember = isOwnerOrMod || userMem?.state === 'active' || userMem?.state === 'restricted';

        if (isActiveMember) {
          try {
            const mems = await demoRepository.getWorkspaceMemberships(ws.id, currentUserId);
            if (mounted) setMemberships(mems);
          } catch {
            if (mounted) setMemberships([]);
          }

          try {
            const acts = await demoRepository.getWorkspaceActions(ws.id, currentUserId);
            if (mounted) setActions(acts);
          } catch {
            if (mounted) setActions([]);
          }

          try {
            const audits = await demoRepository.getWorkspaceAuditEvents(ws.id, currentUserId);
            if (mounted) setAuditEvents(audits);
          } catch {
            if (mounted) setAuditEvents([]);
          }
        } else {
          if (mounted) {
            setMemberships([]);
            setActions([]);
            setAuditEvents([]);
          }
        }
      } catch (err: unknown) {
        if (mounted) {
          setPageError(err instanceof Error ? err.message : 'Failed to load workspace.');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadWorkspaceData();

    return () => {
      mounted = false;
    };
  }, [currentWorkspaceId, currentUser?.id, refreshKey]);

  // Derived user status in this workspace
  const currentMembership = useMemo(() => {
    return myMembership;
  }, [myMembership]);

  const isRoomModerator = useMemo(() => {
    if (!currentUser || !workspace) return false;
    return (
      workspace.ownerId === currentUser.id ||
      (workspace.moderatorIds || []).includes(currentUser.id) ||
      currentMembership?.role === 'owner' ||
      currentMembership?.role === 'moderator'
    );
  }, [workspace, currentUser, currentMembership]);

  const isCurrentMemberActive = useMemo(() => {
    if (isRoomModerator) return true;
    return currentMembership?.state === 'active';
  }, [isRoomModerator, currentMembership]);

  const hasAcknowledgedRules = useMemo(() => {
    if (!workspace || !currentMembership) return false;
    return currentMembership.lastAcknowledgedRuleVersion === workspace.rulebook?.version;
  }, [workspace, currentMembership]);

  const moderatorNames = useMemo(() => {
    if (!workspace) return 'Shri Mayur Parmar, Aroh Mehta';
    const names = (workspace.moderatorIds || [])
      .map((id) => allUsers.find((u) => u.id === id)?.name || memberships.find((m) => m.userId === id)?.userName || id)
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : 'Shri Mayur Parmar, Aroh Mehta';
  }, [workspace, allUsers, memberships]);

  // Quick Persona switcher handler
  const handleQuickSwitchUser = async (userId: string) => {
    try {
      await switchPersona(userId);
      triggerRefresh();
      setActionSuccessMessage(null);
      setActionError(null);
      setInviteError(null);
      setInviteSuccess(null);
    } catch (err: unknown) {
      setPageError(err instanceof Error ? err.message : 'Failed to switch user.');
    }
  };

  // Rulebook acknowledgement handler
  const handleAcknowledgeRules = async () => {
    if (!workspace || !currentUser) return;
    setIsAcknowledgingRules(true);
    setActionError(null);
    try {
      await demoRepository.acknowledgeWorkspaceRules({
        workspaceId: workspace.id,
        userId: currentUser.id,
        version: workspace.rulebook?.version || 'v1.0',
      });
      setIsRulebookModalOpen(false);
      setActionSuccessMessage(`Successfully acknowledged Rulebook ${workspace.rulebook?.version || 'v1.0'}. You may now post and participate.`);
      triggerRefresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to acknowledge rulebook.');
    } finally {
      setIsAcknowledgingRules(false);
    }
  };

  // Respond to invitation
  const handleRespondInvite = async (accept: boolean) => {
    if (!workspace || !currentUser) return;
    try {
      await demoRepository.respondToWorkspaceInvite({
        workspaceId: workspace.id,
        userId: currentUser.id,
        accept,
      });
      triggerRefresh();
      if (accept) {
        setActionSuccessMessage('Invitation accepted! Welcome to the Rajkot Ward 8 School-Zone Safety Workspace.');
        if (!hasAcknowledgedRules) {
          setIsRulebookModalOpen(true);
        }
      } else {
        setActionSuccessMessage('Invitation declined.');
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to update invitation status.');
    }
  };

  // Search users for invite
  const handleSearchInviteUsers = async () => {
    if (!workspace || !currentUser || !inviteSearchQuery.trim()) return;
    setIsSearchingInvite(true);
    setInviteError(null);
    try {
      const results = await demoRepository.searchUsersForInvite(
        inviteSearchQuery.trim(),
        currentUser.id,
        workspace.id
      );
      setInviteSearchResults(results);
      if (results.length === 0) {
        setInviteError(`No matching platform persona found for "${inviteSearchQuery}".`);
      }
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setIsSearchingInvite(false);
    }
  };

  // Submit invite
  const handleSendInvite = async (targetUser: User) => {
    if (!workspace || !currentUser) return;
    setIsSubmittingInvite(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      const username = targetUser.username || targetUser.email.split('@')[0];
      await demoRepository.inviteUserToWorkspace({
        workspaceId: workspace.id,
        inviterId: currentUser.id,
        usernameOrId: username,
      });
      setInviteSuccess(`Invitation successfully sent to @${username} (${targetUser.name}) for ${workspace.title}.`);
      setInviteSearchQuery('');
      setInviteSearchResults([]);
      triggerRefresh();
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite.');
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Create action
  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !currentUser) return;

    if (!hasAcknowledgedRules && !isRoomModerator) {
      setIsRulebookModalOpen(true);
      return;
    }

    setIsSubmittingAction(true);
    setActionError(null);

    let sourceLink: WorkspaceAction['sourceLink'] | undefined = undefined;
    if (newActionSourceType === 'proposition') {
      sourceLink = {
        type: 'proposition',
        id: 'prop_jaipur_pedestrian_01',
        label: 'Proposition PROP-RAJKOT-01: Zero Harm Pedestrian Corridors',
      };
    } else if (newActionSourceType === 'evidence') {
      sourceLink = {
        type: 'evidence',
        id: 'ev_aarav_traffic_count_01',
        label: 'Evidence EV-001: Peak Vehicle Volume (524 veh/30min)',
      };
    }

    const tags = newActionTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await demoRepository.createWorkspaceAction({
        workspaceId: workspace.id,
        authorId: currentUser.id,
        actionType: newActionType,
        title: newActionTitle.trim(),
        content: newActionContent.trim(),
        sourceLink,
        tags,
      });

      setIsCreatingAction(false);
      setNewActionTitle('');
      setNewActionContent('');
      setActionSuccessMessage('Substantive workspace action published with persistent provenance.');
      triggerRefresh();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to create workspace action.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Execute moderation or report action
  const handleExecuteModeration = async () => {
    if (!workspace || !currentUser || !moderationModalAction) return;
    setIsSubmittingModeration(true);
    setModerationError(null);

    const { type, targetId } = moderationModalAction;
    try {
      if (type === 'freeze' || type === 'remove' || type === 'unfreeze') {
        await demoRepository.moderateWorkspaceAction({
          workspaceId: workspace.id,
          moderatorId: currentUser.id,
          actionId: targetId,
          action: type,
          reason: moderationReason.trim(),
        });
        setActionSuccessMessage(`Content moderation applied: ${type.toUpperCase()}.`);
      } else if (type === 'restrict_member' || type === 'remove_member' || type === 'restore_member') {
        const newStatus = type === 'restrict_member' ? 'restricted' : type === 'remove_member' ? 'removed' : 'active';
        await demoRepository.moderateWorkspaceMember({
          workspaceId: workspace.id,
          moderatorId: currentUser.id,
          targetUserId: targetId,
          newStatus,
          reason: moderationReason.trim(),
        });
        setActionSuccessMessage(`Member status updated to ${newStatus.toUpperCase()}.`);
      } else if (type === 'report') {
        await demoRepository.reportWorkspaceContent({
          workspaceId: workspace.id,
          reporterId: currentUser.id,
          targetActionId: targetId,
          reason: moderationReason.trim(),
        });
        setActionSuccessMessage('Report submitted to room moderators and safeguarding lead.');
      }

      setModerationModalAction(null);
      setModerationReason('');
      triggerRefresh();
    } catch (err: unknown) {
      setModerationError(err instanceof Error ? err.message : 'Moderation action rejected.');
    } finally {
      setIsSubmittingModeration(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6" data-testid="workspace-loading">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="h-24 bg-slate-100 rounded-xl"></div>
          <div className="h-64 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (pageError || !workspace) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
        <DemoPreviewBadge
          size="banner"
          label="Single-Browser Local Simulation • Scoped Workspace Error"
          description="Fictional browser demo. Demonstrating permission-safe boundary enforcement."
        />
        <Card className="p-6 border-rose-200 bg-rose-50/60">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="font-bold text-rose-950 font-heading text-lg">
                Access Denied / Repository Error
              </h2>
              <p className="text-sm text-slate-700">
                {pageError || 'Workspace unavailable.'}
              </p>
              <div className="pt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" data-testid="btn-error-switch-aarav" onClick={() => handleQuickSwitchUser('VSC-S-001')}>
                  Switch to Ankita Kapri (Member)
                </Button>
                <Button size="sm" variant="outline" data-testid="btn-error-switch-rohan" onClick={() => handleQuickSwitchUser('VSC-S-009')}>
                  Switch to Aroh Mehta (Moderator)
                </Button>
                <Button size="sm" variant="outline" data-testid="btn-error-switch-kavita" onClick={() => handleQuickSwitchUser('VSC-T-001')}>
                  Switch to Shri Mayur Parmar (Owner)
                </Button>
                <Link to="/propositions/prop_jaipur_pedestrian_01">
                  <Button size="sm" variant="primary">
                    Return to Proposition
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6">
      {/* 1. Canonical Simulation Banner */}
      <DemoPreviewBadge
        size="banner"
        label="Single-Browser Local Simulation • Scoped Collaboration Workspace"
        description="Fictional browser demo with local persistence only; not an unrestricted or anonymous chat network. Demonstrates scoped membership, exact username invitations, versioned rulebook acknowledgement, and room-scoped moderation."
      />

      {/* 2. Top Navigation & Proposition Roundtrip Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Link
            to="/propositions/prop_jaipur_pedestrian_01"
            className="inline-flex items-center font-bold text-civic-teal-700 hover:text-civic-teal-900 transition-colors"
            data-testid="link-back-to-proposition"
          >
            <ArrowLeft className="w-4 h-4 mr-1 text-civic-teal-600" />
            <span>Back to Proposition PROP-RAJKOT-01</span>
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            to="/assemblies/assembly_jaipur_pedestrian_2026"
            className="text-slate-600 hover:text-slate-900"
          >
            Assembly Chamber
          </Link>
        </div>

        <div className="flex items-center gap-2" data-testid="connected-persona">
          <span className="text-[11px] font-medium text-slate-500">Connected Demo Persona:</span>
          <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
            {currentUser?.name} (@{currentUser?.username || currentUser?.email.split('@')[0]})
          </span>
        </div>
      </div>

      {/* 3. Header & Scope Overview */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 flex items-center gap-2.5">
              <Layers className="w-7 h-7 text-civic-teal-600 shrink-0" />
              <span>Workspace</span>
            </h1>
            <span className="inline-block text-xs font-bold uppercase bg-civic-teal-100 text-civic-teal-800 px-2.5 py-0.5 rounded-full border border-civic-teal-200">
              Simulation
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mt-1">
            {workspace.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            {workspace.purpose}
          </p>
        </div>

        {/* Quick Rulebook button */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsRulebookModalOpen(true)}
            className="flex items-center gap-1.5"
            data-testid="btn-view-rulebook"
          >
            <HelpCircle className="w-4 h-4 text-civic-teal-600" />
            <span>Rulebook ({workspace.rulebook?.version || 'v1.0'})</span>
            {hasAcknowledgedRules ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-1" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Acknowledgement Required" />
            )}
          </Button>
        </div>
      </div>

      {/* 4. Persona Switcher Quick Bar for Competition Demo Testing */}
      <Card className="p-3.5 bg-slate-100/70 border-slate-200 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="font-bold text-slate-700 flex items-center gap-1.5 shrink-0">
            <Users className="w-4 h-4 text-civic-indigo-600" />
            <span>Demo Persona Switcher (Single-Browser Test):</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'VSC-S-001', label: 'Ankita (Member)', role: 'Member' },
              { id: 'VSC-T-001', label: 'Mayur Parmar (Owner)', role: 'Owner' },
              { id: 'VSC-S-009', label: 'Aroh (Room Mod)', role: 'Moderator' },
              { id: 'VSC-S-003', label: 'Harshita (Invitee)', role: 'Invitee' },
              { id: 'JS-F-001', label: 'Nazim (Unrelated Mod)', role: 'Unrelated' },
              { id: 'VSC-S-002', label: 'Niyati (Member)', role: 'Member' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleQuickSwitchUser(p.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
                  currentUser?.id === p.id
                    ? 'bg-civic-teal-700 text-white border-civic-teal-800 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                data-testid={`switch-to-${p.id}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* 5. Notifications / Success Banner */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 6. Pending Invitation Notification Card (when user is in invited state) */}
      {currentMembership?.state === 'invited' && (
        <Card className="p-5 border-civic-teal-300 bg-civic-teal-50/60 shadow-sm" data-testid="invitation-banner">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-civic-teal-700" />
                <h3 className="font-bold text-civic-teal-950 font-heading text-base">
                  Workspace Invitation Pending
                </h3>
                <span className="text-[10px] font-bold uppercase bg-civic-teal-200 text-civic-teal-900 px-2 py-0.5 rounded">
                  Invited
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700">
                You have been invited to join <strong>{workspace.title}</strong> by{' '}
                <strong>{currentMembership.invitedBy ? `@${allUsers.find(u => u.id === currentMembership.invitedBy)?.username || 'team'}` : 'a workspace member'}</strong>.
              </p>
              <div className="text-xs text-slate-600 space-y-1 pt-1">
                <p>• <strong>Scope:</strong> {workspace.visibility.replace('_', ' ')} ({workspace.institutionName || 'Rajkot'})</p>
                <p>• <strong>Conduct Rule:</strong> Zero tolerance for vehicle plates, student face disclosure, or off-topic commercial activity.</p>
                <p className="text-amber-800 font-medium">Notice: Invited users must confirm admission before contributing substantive actions.</p>
              </div>
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0">
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleRespondInvite(true)}
                data-testid="btn-accept-invite"
              >
                Accept & Join Workspace
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleRespondInvite(false)}
                className="text-rose-700 border-rose-200 hover:bg-rose-50"
                data-testid="btn-decline-invite"
              >
                Decline
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 6b. Joined Projects as Clear Tiles */}
      <div className="space-y-3" data-testid="section-joined-projects">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
          <div>
            <h3 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-civic-saffron-600" />
              <span>Your Joined Projects & Teams</span>
            </h3>
            <p className="text-xs text-slate-500">
              Civic action teams and student micro-initiatives you belong to.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700 self-start sm:self-auto">
            {joinedProjects.length} Joined {joinedProjects.length === 1 ? 'Project' : 'Projects'}
          </span>
        </div>

        {joinedProjects.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-500">
            You are not enrolled in any project teams for this persona.
            <div className="mt-2">
              <Link to="/projects">
                <Button size="sm" variant="outline" className="text-xs">
                  Explore Civic Projects
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {joinedProjects.map((p) => {
              const isLead = p.leadUserId === currentUser?.id;
              const completedCount = p.milestones.filter((m) => m.isCompleted).length;
              const totalCount = p.milestones.length;
              const progress = Math.round((completedCount / (totalCount || 1)) * 100);

              return (
                <Card
                  key={p.id}
                  className="p-4 border-slate-200 bg-white hover:border-civic-teal-400 hover:shadow-xs transition-all flex flex-col justify-between"
                  data-testid={`joined-project-tile-${p.id}`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          isLead
                            ? 'bg-civic-saffron-100 text-civic-saffron-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isLead ? 'Project Lead' : 'Team Member'}
                      </span>
                      <StatusChip status={p.status === 'completed' ? 'completed' : 'active'} />
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 font-heading leading-snug line-clamp-1">
                      {p.title}
                    </h4>

                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {p.civicObjective}
                    </p>

                    {/* Milestone Progress */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Milestones: {completedCount}/{totalCount} Done</span>
                        <span className="font-bold text-slate-700">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-civic-teal-600 h-1.5 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{p.memberUserIds.length} Members</span>
                    </span>

                    <Link to={`/projects/${p.id}`}>
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2.5">
                        <span>Open Team Board</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Removed / Restricted Warnings */}
      {currentMembership?.state === 'removed' && (
        <Card className="p-5 border-rose-300 bg-rose-50/80">
          <div className="flex items-start gap-3">
            <Ban className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-rose-900 text-sm">
                Membership Removed by Room Moderator
              </h3>
              <p className="text-xs text-slate-700">
                You have been removed from this workspace. <strong>Reason:</strong> {currentMembership.statusReason || 'Violation of workspace guidelines'}. Content viewing and posting permissions have been revoked.
              </p>
            </div>
          </div>
        </Card>
      )}

      {currentMembership?.state === 'restricted' && (
        <Card className="p-4 border-amber-300 bg-amber-50/80">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-amber-900 text-sm">
                Posting Privileges Restricted
              </h3>
              <p className="text-xs text-slate-700">
                A room moderator has restricted your posting privileges in this workspace. <strong>Reason:</strong> {currentMembership.statusReason || 'Moderator caution'}. You may still read content and audit events.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* 8. Workspace Metadata Summary Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <span className="text-[11px] text-slate-500 font-medium block">Room Type & Scope</span>
          <span className="font-bold text-slate-900 capitalize mt-0.5 block">
            {workspace.type.replace('_', ' ')} • {workspace.visibility.replace('_', ' ')}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <span className="text-[11px] text-slate-500 font-medium block">Room Owner & Lead</span>
          <span className="font-bold text-slate-900 mt-0.5 block">
            {workspace.ownerName}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <span className="text-[11px] text-slate-500 font-medium block">Room Moderators</span>
          <span className="font-bold text-civic-teal-700 mt-0.5 block" data-testid="room-moderators">
            {moderatorNames}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-white border border-slate-200">
          <span className="text-[11px] text-slate-500 font-medium block">Storage Quota</span>
          <span className="font-bold text-slate-900 mt-0.5 block">
            1.5 MB / 10.0 MB (Demo)
          </span>
        </div>
      </div>

      {/* 9. Accessible Tab Bar */}
      <div className="border-b border-slate-200 flex gap-4 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('actions')}
          className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'actions'
              ? 'border-civic-teal-600 text-civic-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          data-testid="tab-actions"
        >
          <FileText className="w-4 h-4" />
          <span>Team Notes & Actions ({actions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'members'
              ? 'border-civic-teal-600 text-civic-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          data-testid="tab-members"
        >
          <Users className="w-4 h-4" />
          <span>Members & Invites ({memberships.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('moderation')}
          className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'moderation'
              ? 'border-civic-teal-600 text-civic-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          data-testid="tab-moderation"
        >
          <Shield className="w-4 h-4" />
          <span>Moderation & Audit ({auditEvents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rulebook')}
          className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'rulebook'
              ? 'border-civic-teal-600 text-civic-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
          data-testid="tab-rulebook"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Rulebook ({workspace.rulebook?.version || 'v1.0'})</span>
        </button>
      </div>

      {/* 10. Tab Content Areas */}
      {currentMembership?.state === 'invited' && activeTab !== 'rulebook' ? (
        <Card className="p-8 text-center bg-white border-slate-200 space-y-3" data-testid="invited-content-protected">
          <div className="w-12 h-12 rounded-full bg-civic-teal-100 text-civic-teal-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">
            Workspace Content Protected (Invite-Only Private)
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Team notes, the member directory, and audit records are private to active members. Please accept your pending invitation above to unlock full access.
          </p>
          <div className="pt-2">
            <Button size="sm" variant="primary" onClick={() => handleRespondInvite(true)} data-testid="btn-accept-invite-tab">
              Accept & Join Workspace
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* TAB 1: ACTIONS & TEAM NOTES */}
          {activeTab === 'actions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base font-heading">
                Proposition Collaboration Feed
              </h3>
              <p className="text-xs text-slate-500">
                Short team notes, tasks, and announcements linked to Proposition PROP-RAJKOT-01.
              </p>
            </div>

            {isCurrentMemberActive && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsCreatingAction(!isCreatingAction)}
                data-testid="btn-open-create-action"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                <span>{isCreatingAction ? 'Cancel Action' : 'Create Team Action / Note'}</span>
              </Button>
            )}
          </div>

          {/* Action Composer Form */}
          {isCreatingAction && (
            <Card className="p-5 border-civic-teal-300 bg-white shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-civic-teal-600" />
                <span>Publish Substantive Proposition Action</span>
              </h4>

              {actionError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                  {actionError}
                </div>
              )}

              <form onSubmit={handleCreateAction} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Action Type
                    </label>
                    <select
                      value={newActionType}
                      onChange={(e) => setNewActionType(e.target.value as WorkspaceActionType)}
                      className="w-full text-xs rounded-lg border-slate-300 border p-2 bg-white"
                      data-testid="select-action-type"
                    >
                      <option value="team_note">Team Note</option>
                      <option value="task">Action Task</option>
                      <option value="announcement">Announcement</option>
                      <option value="resource">Resource</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Proposition Provenance Link
                    </label>
                    <select
                      value={newActionSourceType}
                      onChange={(e) => setNewActionSourceType(e.target.value as 'proposition' | 'evidence' | 'none')}
                      className="w-full text-xs rounded-lg border-slate-300 border p-2 bg-white"
                      data-testid="select-source-link"
                    >
                      <option value="proposition">Proposition PROP-RAJKOT-01 (Tabletop Crosswalk)</option>
                      <option value="evidence">Evidence EV-001 (Peak Traffic Counts)</option>
                      <option value="none">No External Link</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Title
                  </label>
                  <Input
                    value={newActionTitle}
                    onChange={(e) => setNewActionTitle(e.target.value)}
                    placeholder="e.g. Schedule Student Marshal Orientation at Madhyam Marg"
                    required
                    data-testid="input-action-title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Details / Content
                  </label>
                  <Textarea
                    value={newActionContent}
                    onChange={(e) => setNewActionContent(e.target.value)}
                    placeholder="Provide substantive context, responsibility, or technical specifications..."
                    rows={3}
                    required
                    data-testid="input-action-content"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <Input
                    value={newActionTags}
                    onChange={(e) => setNewActionTags(e.target.value)}
                    placeholder="Ward 24, Traffic Calming, Volunteer Roster"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    Rulebook Ack: {hasAcknowledgedRules ? 'Verified (v1.0)' : 'Prompt Required'}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setIsCreatingAction(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      variant="primary"
                      disabled={isSubmittingAction}
                      data-testid="btn-submit-action"
                    >
                      {isSubmittingAction ? 'Publishing...' : 'Publish Action'}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          )}

          {/* Action Feed List */}
          <div className="space-y-3">
            {actions.length === 0 ? (
              <Card className="p-8 text-center border-slate-200">
                <p className="text-xs text-slate-500">No actions or notes created in this workspace yet.</p>
              </Card>
            ) : (
              actions.map((act) => {
                const isFrozen = act.status === 'frozen';
                const isRemoved = act.status === 'removed';

                if (isRemoved && !isRoomModerator) return null;

                return (
                  <Card
                    key={act.id}
                    className={`p-4 border transition-all ${
                      isRemoved
                        ? 'border-rose-300 bg-rose-50/50 opacity-70'
                        : isFrozen
                        ? 'border-amber-300 bg-amber-50/40'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                    data-testid={`action-card-${act.id}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            act.actionType === 'announcement'
                              ? 'bg-purple-100 text-purple-800'
                              : act.actionType === 'task'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {act.actionType.replace('_', ' ')}
                          </span>

                          <span className="text-xs text-slate-500">
                            by <strong>{act.authorName}</strong> (@{act.authorUsername})
                          </span>

                          <span className="text-[11px] text-slate-400">
                            • {formatDate(act.createdAt)}
                          </span>

                          {isFrozen && (
                            <span className="text-[10px] font-bold uppercase bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-700" />
                              <span>Frozen</span>
                            </span>
                          )}

                          {isRemoved && (
                            <span className="text-[10px] font-bold uppercase bg-rose-100 text-rose-900 px-2 py-0.5 rounded border border-rose-300 flex items-center gap-1">
                              <Ban className="w-3 h-3 text-rose-700" />
                              <span>Removed by Moderator</span>
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm font-heading">
                          {act.title}
                        </h4>

                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                          {act.content}
                        </p>

                        {/* Provenance Link */}
                        {act.sourceLink && (
                          <div className="pt-1 flex items-center gap-1.5 text-[11px] font-medium text-civic-teal-700">
                            <span className="text-slate-400">Provenance:</span>
                            {act.sourceLink.type === 'proposition' ? (
                              <Link
                                to={`/propositions/${act.sourceLink.id}`}
                                className="underline hover:text-civic-teal-900 flex items-center gap-1"
                              >
                                <span>{act.sourceLink.label}</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            ) : (
                              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                                {act.sourceLink.label}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Tags */}
                        {act.tags && act.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {act.tags.map((t, idx) => (
                              <span key={idx} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Moderation reason footnote if moderated */}
                        {act.moderationReason && (
                          <p className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                            <strong>Moderator Note:</strong> {act.moderationReason} (by {act.moderatedBy})
                          </p>
                        )}
                      </div>

                      {/* Card Action Controls */}
                      <div className="flex sm:flex-col gap-1.5 shrink-0 self-end sm:self-start">
                        {/* Report button for members */}
                        {isCurrentMemberActive && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setModerationModalAction({
                                type: 'report',
                                targetId: act.id,
                                targetTitle: act.title,
                              });
                              setModerationReason('');
                            }}
                            className="text-slate-500 hover:text-rose-700 text-xs flex items-center gap-1"
                            data-testid={`btn-report-action-${act.id}`}
                          >
                            <Flag className="w-3.5 h-3.5 text-slate-400" />
                            <span>Report</span>
                          </Button>
                        )}

                        {/* Room Moderator Controls (Scoped) */}
                        {isRoomModerator && (
                          <>
                            {isFrozen ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setModerationModalAction({
                                    type: 'unfreeze',
                                    targetId: act.id,
                                    targetTitle: act.title,
                                  });
                                  setModerationReason('');
                                }}
                                className="text-amber-800 border-amber-200 text-xs"
                                data-testid={`btn-unfreeze-${act.id}`}
                              >
                                Unfreeze
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setModerationModalAction({
                                    type: 'freeze',
                                    targetId: act.id,
                                    targetTitle: act.title,
                                  });
                                  setModerationReason('');
                                }}
                                className="text-amber-800 border-amber-200 text-xs"
                                data-testid={`btn-freeze-${act.id}`}
                              >
                                Freeze
                              </Button>
                            )}

                            {!isRemoved && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setModerationModalAction({
                                    type: 'remove',
                                    targetId: act.id,
                                    targetTitle: act.title,
                                  });
                                  setModerationReason('');
                                }}
                                className="text-rose-700 border-rose-200 text-xs"
                                data-testid={`btn-remove-${act.id}`}
                              >
                                Remove
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERS & INVITATIONS */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Invite Section */}
          <Card className="p-5 border-slate-200 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm font-heading flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-civic-teal-600" />
                  <span>Exact-Match Username Invitation</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Search registered participants by unique fictional username (e.g. <code>@aryan.sen</code>, <code>@meera.singh</code>).
                </p>
              </div>

              <span className="text-[11px] font-semibold text-slate-500">
                Scope: {workspace.visibility.replace('_', ' ')}
              </span>
            </div>

            {inviteError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                {inviteSuccess}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Input
                  value={inviteSearchQuery}
                  onChange={(e) => setInviteSearchQuery(e.target.value)}
                  placeholder="Enter unique username (e.g. @aryan.sen)"
                  className="text-xs"
                  data-testid="input-invite-username"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSearchInviteUsers}
                disabled={isSearchingInvite || !inviteSearchQuery.trim()}
                data-testid="btn-search-username"
              >
                <Search className="w-4 h-4 mr-1.5" />
                <span>{isSearchingInvite ? 'Searching...' : 'Search Username'}</span>
              </Button>
            </div>

            {/* Search Results Confirmation Card */}
            {inviteSearchResults.length > 0 && (
              <div className="p-4 rounded-xl border border-civic-teal-200 bg-civic-teal-50/50 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-civic-teal-900 block">
                  Match Confirmation Before Sending Invite
                </span>
                <div className="space-y-2">
                  {inviteSearchResults.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs"
                      data-testid={`user-search-result-${user.username}`}
                    >
                      <div>
                        <span className="font-bold text-slate-900">{user.name}</span>
                        <span className="text-slate-500 ml-1.5">(@{user.username})</span>
                        <span className="text-[11px] text-slate-400 block">{user.institutionName} • {user.role}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSendInvite(user)}
                        disabled={isSubmittingInvite}
                        data-testid={`btn-confirm-invite-${user.username}`}
                      >
                        {isSubmittingInvite ? 'Inviting...' : 'Send Invite'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Member Directory Table */}
          <Card className="p-5 border-slate-200 bg-white space-y-3">
            <h3 className="font-bold text-slate-900 text-sm font-heading flex items-center gap-2">
              <Users className="w-4 h-4 text-civic-indigo-600" />
              <span>Workspace Member Directory ({memberships.length})</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="pb-2.5">Participant</th>
                    <th className="pb-2.5">Unique Username</th>
                    <th className="pb-2.5">Room Role</th>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5">Rule Ack</th>
                    {isRoomModerator && <th className="pb-2.5 text-right">Moderator Controls</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {memberships.map((m) => {
                    const isSelf = currentUser?.id === m.userId;
                    const isOwner = m.role === 'owner';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/70" data-testid={`member-row-${m.username}`}>
                        <td className="py-2.5 font-medium text-slate-900">
                          {m.userName} {isSelf && <span className="text-slate-400 font-normal">(You)</span>}
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-slate-600">
                          @{m.username}
                        </td>
                        <td className="py-2.5">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            m.role === 'owner'
                              ? 'bg-amber-100 text-amber-900'
                              : m.role === 'moderator'
                              ? 'bg-civic-teal-100 text-civic-teal-900'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {m.role}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            m.state === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.state === 'invited'
                              ? 'bg-blue-100 text-blue-800'
                              : m.state === 'restricted'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {m.state}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-500 text-[11px]">
                          {m.lastAcknowledgedRuleVersion ? `v${m.lastAcknowledgedRuleVersion}` : 'Pending'}
                        </td>
                        {isRoomModerator && (
                          <td className="py-2.5 text-right">
                            {!isOwner && (
                              <div className="flex items-center justify-end gap-1.5">
                                {m.state === 'active' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setModerationModalAction({
                                          type: 'restrict_member',
                                          targetId: m.userId,
                                          targetTitle: m.userName,
                                        });
                                        setModerationReason('');
                                      }}
                                      className="text-amber-700 hover:bg-amber-50 text-[11px] px-2 py-1"
                                      data-testid={`btn-restrict-${m.username}`}
                                    >
                                      Restrict
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        setModerationModalAction({
                                          type: 'remove_member',
                                          targetId: m.userId,
                                          targetTitle: m.userName,
                                        });
                                        setModerationReason('');
                                      }}
                                      className="text-rose-700 hover:bg-rose-50 text-[11px] px-2 py-1"
                                      data-testid={`btn-remove-member-${m.username}`}
                                    >
                                      Remove
                                    </Button>
                                  </>
                                )}
                                {(m.state === 'restricted' || m.state === 'removed') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setModerationModalAction({
                                        type: 'restore_member',
                                        targetId: m.userId,
                                        targetTitle: m.userName,
                                      });
                                      setModerationReason('Restoring active standing');
                                    }}
                                    className="text-emerald-700 border-emerald-200 text-[11px] px-2 py-1"
                                    data-testid={`btn-restore-${m.username}`}
                                  >
                                    Restore
                                  </Button>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: SCOPED MODERATION & AUDIT */}
      {activeTab === 'moderation' && (
        <div className="space-y-6">
          {/* Moderation Authority Card */}
          <Card className="p-5 border-slate-200 bg-white space-y-3">
            <h3 className="font-bold text-slate-900 text-sm font-heading flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-civic-teal-600" />
              <span>Scoped Moderation Model & Contact Directory</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Moderation authority is strictly scoped to this workspace. Platform administrators or moderators from other debate rooms or assemblies have <strong>no jurisdiction</strong> to freeze content or remove members here without room credentials.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">Lead Room Moderator:</span>
                <p className="text-slate-600">{workspace.moderationContact.name} ({workspace.moderationContact.role})</p>
                <p className="text-civic-teal-700 font-mono text-[11px]">{workspace.moderationContact.emailOrChannel}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block">Safeguarding Oversight Lead:</span>
                <p className="text-slate-600">{workspace.moderationContact.safeguardingLead || 'Institutional Safeguarding Board'}</p>
                <p className="text-slate-500 text-[11px]">Rajkot Municipal Ward 8 Educational Liaison</p>
              </div>
            </div>
          </Card>

          {/* Audit Events Log */}
          <Card className="p-5 border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm font-heading flex items-center gap-2">
                <Clock className="w-4 h-4 text-civic-indigo-600" />
                <span>Auditable Action Log ({auditEvents.length} Events)</span>
              </h3>
              <span className="text-[11px] text-slate-500">Persistent across browser reload</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700" data-testid="audit-log-table">
                <thead className="border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="pb-2.5">Time</th>
                    <th className="pb-2.5">Event</th>
                    <th className="pb-2.5">Actor</th>
                    <th className="pb-2.5">Reason / Details</th>
                    <th className="pb-2.5 text-right">Scope</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditEvents.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50/70" data-testid={`audit-row-${evt.eventType}`}>
                      <td className="py-2.5 text-slate-500 text-[11px] whitespace-nowrap">
                        {formatDateTime(evt.timestamp)}
                      </td>
                      <td className="py-2.5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          evt.eventType === 'moderation' || evt.eventType === 'removal'
                            ? 'bg-rose-100 text-rose-800'
                            : evt.eventType === 'invite' || evt.eventType === 'acceptance'
                            ? 'bg-blue-100 text-blue-800'
                            : evt.eventType === 'rule_acknowledgement'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {evt.eventType.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 font-medium text-slate-900">
                        {evt.actorName} <span className="text-slate-400 font-normal">({evt.actorRole})</span>
                      </td>
                      <td className="py-2.5 text-slate-600">
                        {evt.reason}
                        {evt.targetUserName && <span className="text-slate-500 ml-1">Target: {evt.targetUserName}</span>}
                      </td>
                      <td className="py-2.5 text-right text-[11px] text-slate-400 whitespace-nowrap">
                        Rajkot Ward 8
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: CONTEXTUAL RULEBOOK */}
      {activeTab === 'rulebook' && (
        <Card className="p-6 border-slate-200 bg-white space-y-5" data-testid="rulebook-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-civic-teal-700 block">
                Point of Use Rules of Procedure
              </span>
              <h3 className="font-bold text-slate-900 text-lg font-heading mt-0.5">
                {workspace.rulebook?.title || 'Workspace Rulebook'}
              </h3>
              <p className="text-xs text-slate-500">
                Version {workspace.rulebook?.version || 'v1.0'} • Last Updated {formatDate(workspace.rulebook?.lastUpdated || '')}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/help"
                className="inline-flex items-center gap-1 text-xs font-semibold text-civic-indigo-700 hover:text-civic-indigo-900 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-civic-indigo-500 rounded py-1 px-2"
                data-testid="workspace-full-rulebook-link"
              >
                <span>Full Rulebook</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Button
                size="sm"
                variant={hasAcknowledgedRules ? 'outline' : 'primary'}
                onClick={handleAcknowledgeRules}
                disabled={isAcknowledgingRules}
                data-testid="btn-acknowledge-rulebook"
              >
                {hasAcknowledgedRules ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-600" />
                    <span>Rulebook Acknowledged</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 mr-1.5" />
                    <span>Acknowledge Rulebook (v1.0)</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(workspace.rulebook?.rules || []).map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5"
                data-testid={`rule-card-${rule.id}`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">
                    {rule.title}
                  </h4>
                  {rule.isSafeguarding && (
                    <span className="text-[10px] font-bold uppercase text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      Safeguarding
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {rule.content}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
      </>
      )}

      {/* MODAL: Moderation Reason Dialog (Freeze/Remove/Report/Restrict) */}
      {moderationModalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" role="dialog" aria-modal="true">
          <Card className="w-full max-w-md p-6 bg-white shadow-xl border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base font-heading flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-civic-teal-600" />
                <span>
                  {moderationModalAction.type === 'freeze' && 'Freeze Content Action'}
                  {moderationModalAction.type === 'unfreeze' && 'Unfreeze Content Action'}
                  {moderationModalAction.type === 'remove' && 'Remove Harmful Content'}
                  {moderationModalAction.type === 'restrict_member' && `Restrict Member: ${moderationModalAction.targetTitle}`}
                  {moderationModalAction.type === 'remove_member' && `Remove Member: ${moderationModalAction.targetTitle}`}
                  {moderationModalAction.type === 'restore_member' && `Restore Member: ${moderationModalAction.targetTitle}`}
                  {moderationModalAction.type === 'report' && 'Report Workspace Content'}
                </span>
              </h3>
              <button
                onClick={() => setModerationModalAction(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {moderationError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {moderationError}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Reason / Safeguarding Justification (Required)
              </label>
              <Textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Document specific rationale for this action; will be permanently logged in room audit trail..."
                rows={3}
                required
                data-testid="input-moderation-reason"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setModerationModalAction(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleExecuteModeration}
                disabled={isSubmittingModeration || !moderationReason.trim()}
                data-testid="btn-confirm-moderation"
              >
                {isSubmittingModeration ? 'Executing...' : 'Confirm Action'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL: Rulebook Acknowledgement Prompt */}
      {isRulebookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" role="dialog" aria-modal="true">
          <Card className="w-full max-w-lg p-6 bg-white shadow-xl border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-civic-teal-700 block">
                  Point-of-Use Procedure
                </span>
                <h3 className="font-bold text-slate-900 text-base font-heading">
                  Workspace Rulebook Acknowledgement ({workspace.rulebook?.version || 'v1.0'})
                </h3>
              </div>
              <button
                onClick={() => setIsRulebookModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Substantive actions in this workspace require explicit acknowledgement of the versioned rulebook.
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 text-xs text-slate-700">
              {(workspace.rulebook?.rules || []).map((rule) => (
                <div key={rule.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-900 block">{rule.title}</span>
                  <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">{rule.content}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <Link
                to="/help"
                onClick={() => setIsRulebookModalOpen(false)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-civic-indigo-700 hover:text-civic-indigo-900 underline"
                data-testid="workspace-modal-full-rulebook-link"
              >
                <span>Full Rulebook</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsRulebookModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleAcknowledgeRules}
                  disabled={isAcknowledgingRules}
                  data-testid="btn-modal-acknowledge-rules"
                >
                  {isAcknowledgingRules ? 'Recording...' : 'I Acknowledge & Accept Rules'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
