import { describe, it, expect, beforeEach } from 'vitest';
import { demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';

describe('Package 06: Jaipur Workspace Repository & Scoped Moderation Tests', () => {
  const WS_ID = 'ws_jaipur_school_safety';

  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
  });

  describe('1. Scoped Visibility & Repository Boundaries', () => {
    it('allows admitted members to view workspace details and directory', async () => {
      const ws = await demoRepository.getWorkspace(WS_ID, 'user_aarav');
      expect(ws).not.toBeNull();
      expect(ws?.title).toBe('Jaipur Ward 24 School-Zone Safety Workspace');
      expect(ws?.linkedPropositionId).toBe('prop_jaipur_pedestrian_01');

      const members = await demoRepository.getWorkspaceMemberships(WS_ID, 'user_aarav');
      expect(members.length).toBeGreaterThanOrEqual(5);
      expect(members.some((m) => m.userId === 'user_aarav')).toBe(true);
    });

    it('denies non-members from reading member directory and workspace actions', async () => {
      // user_admin or an unrelated user not in the workspace
      const nonMemberId = 'user_aditi';

      await expect(
        demoRepository.getWorkspaceMemberships(WS_ID, nonMemberId)
      ).rejects.toThrow(/Unauthorized: Member directory is only accessible to active workspace members/i);

      await expect(
        demoRepository.getWorkspaceActions(WS_ID, nonMemberId)
      ).rejects.toThrow(/Unauthorized: Non-members and invited or removed participants cannot read/i);

      await expect(
        demoRepository.getWorkspaceAuditEvents(WS_ID, nonMemberId)
      ).rejects.toThrow(/Unauthorized: Audit trail is only accessible to active members/i);
    });
  });

  describe('1b. OD.5 Private Invite-Only Discovery & Boundaries', () => {
    it('enforces invite-only discovery in getWorkspaces (unlisted for non-members and unauthenticated callers)', async () => {
      const publicList = await demoRepository.getWorkspaces();
      expect(publicList.some((w) => w.id === WS_ID)).toBe(false);

      const nonMemberList = await demoRepository.getWorkspaces('user_aditi');
      expect(nonMemberList.some((w) => w.id === WS_ID)).toBe(false);

      const memberList = await demoRepository.getWorkspaces('user_aarav');
      expect(memberList.some((w) => w.id === WS_ID)).toBe(true);

      const invitedList = await demoRepository.getWorkspaces('user_meera');
      expect(invitedList.some((w) => w.id === WS_ID)).toBe(true);

      // Active member list retains unredacted workspace details (e.g., room moderators)
      const memberWs = memberList.find((w) => w.id === WS_ID);
      expect(memberWs?.moderatorIds.length).toBeGreaterThan(0);

      // Invited user list receives reduced invitation summary with redacted moderatorIds
      const invitedWs = invitedList.find((w) => w.id === WS_ID);
      expect(invitedWs?.moderatorIds).toEqual([]);
      expect(invitedWs?.title).toBe('Jaipur Ward 24 School-Zone Safety Workspace');
      expect(invitedWs?.rulebook).toBeDefined();
    });

    it('denies direct-link access without caller or to non-invited personas', async () => {
      await expect(demoRepository.getWorkspace(WS_ID)).rejects.toThrow(
        /Caller identity is required to access private workspace/i
      );

      await expect(demoRepository.getWorkspace(WS_ID, 'user_aditi')).rejects.toThrow(
        /is invite-only private and cannot be accessed without an invitation/i
      );
    });

    it('restricts invited user to safe invitation summary and denies actions, directory, and audits', async () => {
      // Safe summary
      const safeWs = await demoRepository.getWorkspace(WS_ID, 'user_meera');
      expect(safeWs).not.toBeNull();
      expect(safeWs?.title).toBe('Jaipur Ward 24 School-Zone Safety Workspace');
      expect(safeWs?.rulebook).toBeDefined();
      expect(safeWs?.moderatorIds).toEqual([]); // redacted for privacy

      // Denies actions
      await expect(demoRepository.getWorkspaceActions(WS_ID, 'user_meera')).rejects.toThrow(
        /Non-members and invited or removed participants cannot read/i
      );

      // Denies directory
      await expect(demoRepository.getWorkspaceMemberships(WS_ID, 'user_meera')).rejects.toThrow(
        /Member directory is only accessible to active workspace members/i
      );

      // Denies audit events
      await expect(demoRepository.getWorkspaceAuditEvents(WS_ID, 'user_meera')).rejects.toThrow(
        /Audit trail is only accessible to active members/i
      );
    });

    it('enforces caller boundary on getWorkspaceMembership inspection', async () => {
      // Self inspection is allowed
      const selfMem = await demoRepository.getWorkspaceMembership(WS_ID, 'user_aarav', 'user_aarav');
      expect(selfMem?.userId).toBe('user_aarav');

      // Room moderator inspection is allowed
      const modMem = await demoRepository.getWorkspaceMembership(WS_ID, 'user_aarav', 'user_rohan');
      expect(modMem?.userId).toBe('user_aarav');

      // Unrelated caller inspecting another user's membership is rejected
      await expect(
        demoRepository.getWorkspaceMembership(WS_ID, 'user_aarav', 'user_dev')
      ).rejects.toThrow(/Caller does not have permission to inspect another user's workspace membership/i);

      // Omitted caller on private workspace is rejected
      await expect(
        demoRepository.getWorkspaceMembership(WS_ID, 'user_aarav')
      ).rejects.toThrow(/Caller identity required to query private workspace membership/i);
    });

    it('strictly denies removed member and unrelated moderator from accessing private workspace', async () => {
      // Unrelated moderator (Dev Patel is not room mod) cannot bypass private boundary
      await expect(demoRepository.getWorkspace(WS_ID, 'user_dev')).rejects.toThrow(
        /is invite-only private and cannot be accessed without an invitation/i
      );

      // Remove Kabir Khan
      await demoRepository.switchUser('user_rohan');
      await demoRepository.moderateWorkspaceMember({
        workspaceId: WS_ID,
        moderatorId: 'user_rohan',
        targetUserId: 'user_kabir',
        newStatus: 'removed',
        reason: 'Violated safety guidelines',
      });

      // Removed user cannot view workspace or member content
      await expect(demoRepository.getWorkspace(WS_ID, 'user_kabir')).rejects.toThrow(
        /You have been removed from this workspace/i
      );
      await expect(demoRepository.getWorkspaceActions(WS_ID, 'user_kabir')).rejects.toThrow(
        /Non-members and invited or removed participants cannot read/i
      );
      await expect(demoRepository.getWorkspaceMemberships(WS_ID, 'user_kabir')).rejects.toThrow(
        /Member directory is only accessible to active workspace members/i
      );
    });
  });

  describe('2. Username Search & Controlled Invitations', () => {
    it('allows active members with invite permission to search users by username', async () => {
      const results = await demoRepository.searchUsersForInvite('aryan', 'user_aarav', WS_ID);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].username).toBe('aryan.sen');
    });

    it('successfully invites an eligible user by exact username and creates invited membership', async () => {
      const newMember = await demoRepository.inviteUserToWorkspace({
        workspaceId: WS_ID,
        inviterId: 'user_aarav',
        usernameOrId: 'aryan.sen',
      });

      expect(newMember.userId).toBe('user_aryan');
      expect(newMember.state).toBe('invited');
      expect(newMember.invitedBy).toBe('user_aarav');

      // Verify audit event
      const audits = await demoRepository.getWorkspaceAuditEvents(WS_ID, 'user_aarav');
      const inviteAudit = audits.find((a) => a.eventType === 'invite' && a.targetUserId === 'user_aryan');
      expect(inviteAudit).toBeDefined();
      expect(inviteAudit?.actorId).toBe('user_aarav');
    });

    it('rejects self-invitation', async () => {
      await expect(
        demoRepository.inviteUserToWorkspace({
          workspaceId: WS_ID,
          inviterId: 'user_aarav',
          usernameOrId: 'aarav.sharma',
        })
      ).rejects.toThrow(/Self-invitation is not permitted/i);
    });

    it('rejects invitation of unknown username with clear error', async () => {
      await expect(
        demoRepository.inviteUserToWorkspace({
          workspaceId: WS_ID,
          inviterId: 'user_aarav',
          usernameOrId: 'unknown_resident_999',
        })
      ).rejects.toThrow(/User "@unknown_resident_999" not found/i);
    });

    it('rejects duplicate invitations for existing members or pending invitees', async () => {
      // user_priya is already an active member
      await expect(
        demoRepository.inviteUserToWorkspace({
          workspaceId: WS_ID,
          inviterId: 'user_aarav',
          usernameOrId: 'priya.s',
        })
      ).rejects.toThrow(/already an active member/i);

      // user_meera already has a pending invitation in seed
      await expect(
        demoRepository.inviteUserToWorkspace({
          workspaceId: WS_ID,
          inviterId: 'user_aarav',
          usernameOrId: 'meera.singh',
        })
      ).rejects.toThrow(/already has a pending invitation/i);
    });
  });

  describe('3. Invitation Acceptance and Decline Lifecycle', () => {
    it('allows invitee to accept invitation, activating membership with persistent joinedAt', async () => {
      const accepted = await demoRepository.respondToWorkspaceInvite({
        workspaceId: WS_ID,
        userId: 'user_meera',
        accept: true,
      });

      expect(accepted.state).toBe('active');
      expect(accepted.joinedAt).toBeDefined();

      // Verify audit
      const audits = await demoRepository.getWorkspaceAuditEvents(WS_ID, 'user_aarav');
      const acceptAudit = audits.find((a) => a.eventType === 'acceptance' && a.actorId === 'user_meera');
      expect(acceptAudit).toBeDefined();
    });

    it('allows invitee to decline invitation, recording left state and decline audit', async () => {
      const declined = await demoRepository.respondToWorkspaceInvite({
        workspaceId: WS_ID,
        userId: 'user_meera',
        accept: false,
        reason: 'Unable to commit to Ward 24 schedule this semester',
      });

      expect(declined.state).toBe('left');
      expect(declined.statusReason).toContain('Unable to commit');

      const audits = await demoRepository.getWorkspaceAuditEvents(WS_ID, 'user_aarav');
      const declineAudit = audits.find((a) => a.eventType === 'decline' && a.actorId === 'user_meera');
      expect(declineAudit).toBeDefined();
    });
  });

  describe('4. Versioned Rulebook Acknowledgement & Substantive Action Boundary', () => {
    it('records rulebook acknowledgement for active member', async () => {
      const ack = await demoRepository.acknowledgeWorkspaceRules({
        workspaceId: WS_ID,
        userId: 'user_aarav',
        version: 'v1.0',
      });
      expect(ack.lastAcknowledgedRuleVersion).toBe('v1.0');

      const audits = await demoRepository.getWorkspaceAuditEvents(WS_ID, 'user_aarav');
      expect(audits.some((a) => a.eventType === 'rule_acknowledgement' && a.actorId === 'user_aarav')).toBe(true);
    });

    it('prevents posting if member has not acknowledged current rulebook version', async () => {
      // Simulate invitee accepting invite but not acknowledging rules
      await demoRepository.respondToWorkspaceInvite({
        workspaceId: WS_ID,
        userId: 'user_meera',
        accept: true,
      });

      // Attempt posting before rule acknowledgement
      await expect(
        demoRepository.createWorkspaceAction({
          workspaceId: WS_ID,
          authorId: 'user_meera',
          actionType: 'team_note',
          title: 'Cross-School Coordination Feedback',
          content: 'Here are observations from Ajmer crosswalk experiences.',
        })
      ).rejects.toThrow(/Rule acknowledgement required/i);

      // Now acknowledge rules
      await demoRepository.acknowledgeWorkspaceRules({
        workspaceId: WS_ID,
        userId: 'user_meera',
        version: 'v1.0',
      });

      // Now posting succeeds
      const action = await demoRepository.createWorkspaceAction({
        workspaceId: WS_ID,
        authorId: 'user_meera',
        actionType: 'team_note',
        title: 'Cross-School Coordination Feedback',
        content: 'Here are observations from Ajmer crosswalk experiences.',
        sourceLink: {
          type: 'proposition',
          id: 'prop_jaipur_pedestrian_01',
          label: 'Proposition PROP-JAIPUR-01',
        },
      });

      expect(action.id).toBeDefined();
      expect(action.authorId).toBe('user_meera');
      expect(action.sourceLink?.id).toBe('prop_jaipur_pedestrian_01');
    });

    it('prevents invited user from posting before accepting invitation', async () => {
      // user_meera is in invited state
      await expect(
        demoRepository.createWorkspaceAction({
          workspaceId: WS_ID,
          authorId: 'user_meera',
          actionType: 'team_note',
          title: 'Premature Action Post',
          content: 'This should be blocked because user is only invited.',
        })
      ).rejects.toThrow(/Invited users cannot post until active membership is accepted/i);
    });
  });

  describe('5. Scoped Moderation Boundary & Unrelated Moderator Denial', () => {
    it('allows designated room moderator to freeze and remove member content with reason', async () => {
      // Kavita Rao is room owner & moderator
      const frozen = await demoRepository.moderateWorkspaceAction({
        workspaceId: WS_ID,
        moderatorId: 'user_kavita',
        actionId: 'act_ws_02',
        action: 'freeze',
        reason: 'Temporary freeze while validating volunteer parent permissions',
      });
      expect(frozen.status).toBe('frozen');
      expect(frozen.moderationReason).toContain('Temporary freeze');

      // Rohan Mehta is co-moderator
      const unfreeze = await demoRepository.moderateWorkspaceAction({
        workspaceId: WS_ID,
        moderatorId: 'user_rohan',
        actionId: 'act_ws_02',
        action: 'unfreeze',
        reason: 'Parent permissions validated by school office',
      });
      expect(unfreeze.status).toBe('active');
    });

    it('denies unrelated platform moderator or facilitator who is not scoped to this room', async () => {
      // Dev Patel is Programme Manager and platform moderator, but NOT a moderator of this specific room!
      await expect(
        demoRepository.moderateWorkspaceAction({
          workspaceId: WS_ID,
          moderatorId: 'user_dev',
          actionId: 'act_ws_02',
          action: 'freeze',
          reason: 'Global admin attempt to freeze room post',
        })
      ).rejects.toThrow(/Scoped moderation violation/i);

      // Ananya Verma is Institution Admin elsewhere
      await demoRepository.switchUser('user_ananya');
      await expect(
        demoRepository.moderateWorkspaceMember({
          workspaceId: WS_ID,
          moderatorId: 'user_ananya',
          targetUserId: 'user_aarav',
          newStatus: 'restricted',
          reason: 'Unauthorized restriction attempt',
        })
      ).rejects.toThrow(/Scoped moderation violation/i);
    });

    it('allows room moderator to restrict or remove a member with documented reason', async () => {
      await demoRepository.switchUser('user_kavita');
      const restricted = await demoRepository.moderateWorkspaceMember({
        workspaceId: WS_ID,
        moderatorId: 'user_kavita',
        targetUserId: 'user_priya',
        newStatus: 'restricted',
        reason: 'Posting off-topic commercial content in civic room',
      });

      expect(restricted.state).toBe('restricted');
      expect(restricted.permissions.canPost).toBe(false);

      // Restricted user cannot post
      await expect(
        demoRepository.createWorkspaceAction({
          workspaceId: WS_ID,
          authorId: 'user_priya',
          actionType: 'team_note',
          title: 'Attempted Post During Restriction',
          content: 'This should be blocked by repository permissions.',
        })
      ).rejects.toThrow(/Restricted members cannot create posts/i);
    });

    it('completely denies removed member from accessing workspace content', async () => {
      await demoRepository.switchUser('user_kavita');
      await demoRepository.moderateWorkspaceMember({
        workspaceId: WS_ID,
        moderatorId: 'user_kavita',
        targetUserId: 'user_kabir',
        newStatus: 'removed',
        reason: 'Repeated violation of vehicle privacy standards',
      });

      // Removed user cannot view actions
      await expect(
        demoRepository.getWorkspaceActions(WS_ID, 'user_kabir')
      ).rejects.toThrow(/Unauthorized: Non-members and invited or removed participants cannot read/i);

      // Removed user cannot view workspace
      await expect(
        demoRepository.getWorkspace(WS_ID, 'user_kabir')
      ).rejects.toThrow(/Unauthorized: You have been removed from this workspace/i);
    });

    it('prevents removing or restricting the workspace owner', async () => {
      await demoRepository.switchUser('user_rohan');
      await expect(
        demoRepository.moderateWorkspaceMember({
          workspaceId: WS_ID,
          moderatorId: 'user_rohan',
          targetUserId: 'user_kavita',
          newStatus: 'removed',
          reason: 'Unauthorized coup attempt',
        })
      ).rejects.toThrow(/workspace owner cannot be removed or restricted/i);
    });
  });

  describe('6. Content Reporting & Audit Trail', () => {
    it('records member content report with reason and creates moderation audit entry', async () => {
      const reportAudit = await demoRepository.reportWorkspaceContent({
        workspaceId: WS_ID,
        reporterId: 'user_aarav',
        targetActionId: 'act_ws_03',
        reason: 'Clarification required on IRC approach ramp gradient calculation',
      });

      expect(reportAudit.eventType).toBe('report');
      expect(reportAudit.actorId).toBe('user_aarav');
      expect(reportAudit.reason).toContain('Clarification required');

      const audits = await demoRepository.getWorkspaceAuditEvents(WS_ID, 'user_aarav');
      expect(audits.some((a) => a.id === reportAudit.id)).toBe(true);
    });

    it('persists audit events and state across reload and resets cleanly', async () => {
      await demoRepository.inviteUserToWorkspace({
        workspaceId: WS_ID,
        inviterId: 'user_aarav',
        usernameOrId: 'aryan.sen',
      });

      // Verify persistence reload
      const loadedDb = PersistenceService.loadDatabase();
      const persistedAudits = loadedDb.workspaceAuditEvents?.filter((a) => a.workspaceId === WS_ID);
      expect(persistedAudits?.some((a) => a.targetUserId === 'user_aryan')).toBe(true);

      // Reset
      PersistenceService.resetDatabase();
      const resetDb = PersistenceService.loadDatabase();
      const resetAudits = resetDb.workspaceAuditEvents?.filter((a) => a.workspaceId === WS_ID);
      expect(resetAudits?.some((a) => a.targetUserId === 'user_aryan')).toBe(false);
    });
  });
});
