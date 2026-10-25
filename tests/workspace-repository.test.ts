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
      const ws = await demoRepository.getWorkspace(WS_ID, 'VSC-S-001');
      expect(ws).not.toBeNull();
      expect(ws?.title).toBe('Rajkot Ward 8 School-Zone Safety Workspace');
      expect(ws?.linkedPropositionId).toBe('prop_jaipur_pedestrian_01');

      const members = await demoRepository.getWorkspaceMemberships(WS_ID, 'VSC-S-001');
      expect(members.length).toBeGreaterThanOrEqual(5);
      expect(members.some((m) => m.userId === 'VSC-S-001')).toBe(true);
    });

    it('denies non-members from reading member directory and workspace actions', async () => {
      // JS-F-001 or an unrelated user not in the workspace
      const nonMemberId = 'VSC-S-014';

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

      const nonMemberList = await demoRepository.getWorkspaces('VSC-S-014');
      expect(nonMemberList.some((w) => w.id === WS_ID)).toBe(false);

      const memberList = await demoRepository.getWorkspaces('VSC-S-001');
      expect(memberList.some((w) => w.id === WS_ID)).toBe(true);

      const invitedList = await demoRepository.getWorkspaces('VSC-S-003');
      expect(invitedList.some((w) => w.id === WS_ID)).toBe(true);

      // Active member list retains unredacted workspace details (e.g., room moderators)
      const memberWs = memberList.find((w) => w.id === WS_ID);
      expect(memberWs?.moderatorIds.length).toBeGreaterThan(0);

      // Invited user list receives reduced invitation summary with redacted moderatorIds
      const invitedWs = invitedList.find((w) => w.id === WS_ID);
      expect(invitedWs?.moderatorIds).toEqual([]);
      expect(invitedWs?.title).toBe('Rajkot Ward 8 School-Zone Safety Workspace');
      expect(invitedWs?.rulebook).toBeDefined();
    });

    it('denies direct-link access without caller or to non-invited personas', async () => {
      await expect(demoRepository.getWorkspace(WS_ID)).rejects.toThrow(
        /Caller identity is required to access private workspace/i
      );

      await expect(demoRepository.getWorkspace(WS_ID, 'VSC-S-014')).rejects.toThrow(
        /is invite-only private and cannot be accessed without an invitation/i
      );
    });

    it('restricts invited user to safe invitation summary and denies actions, directory, and audits', async () => {
      // Safe summary
      const safeWs = await demoRepository.getWorkspace(WS_ID, 'VSC-S-003');
      expect(safeWs).not.toBeNull();
      expect(safeWs?.title).toBe('Rajkot Ward 8 School-Zone Safety Workspace');
      expect(safeWs?.rulebook).toBeDefined();
      expect(safeWs?.moderatorIds).toEqual([]); // redacted for privacy

      // Denies actions
      await expect(demoRepository.getWorkspaceActions(WS_ID, 'VSC-S-003')).rejects.toThrow(
        /Non-members and invited or removed participants cannot read/i
      );

      // Denies directory
      await expect(demoRepository.getWorkspaceMemberships(WS_ID, 'VSC-S-003')).rejects.toThrow(
        /Member directory is only accessible to active workspace members/i
      );

      // Denies audit events
      await expect(demoRepository.getWorkspaceAuditEvents(WS_ID, 'VSC-S-003')).rejects.toThrow(
        /Audit trail is only accessible to active members/i
      );
    });

    it('enforces caller boundary on getWorkspaceMembership inspection', async () => {
      // Self inspection is allowed
      const selfMem = await demoRepository.getWorkspaceMembership(WS_ID, 'VSC-S-001', 'VSC-S-001');
      expect(selfMem?.userId).toBe('VSC-S-001');

      // Room moderator inspection is allowed
      const modMem = await demoRepository.getWorkspaceMembership(WS_ID, 'VSC-S-001', 'VSC-S-009');
      expect(modMem?.userId).toBe('VSC-S-001');

      // Unrelated caller inspecting another user's membership is rejected
      await expect(
        demoRepository.getWorkspaceMembership(WS_ID, 'VSC-S-001', 'JS-F-001')
      ).rejects.toThrow(/Caller does not have permission to inspect another user's workspace membership/i);

      // Omitted caller on private workspace is rejected
      await expect(
        demoRepository.getWorkspaceMembership(WS_ID, 'VSC-S-001')
      ).rejects.toThrow(/Caller identity required to query private workspace membership/i);
    });

    it('strictly denies removed member and unrelated moderator from accessing private workspace', async () => {
      // Unrelated moderator (Dev Patel is not room mod) cannot bypass private boundary
      await expect(demoRepository.getWorkspace(WS_ID, 'JS-F-001')).rejects.toThrow(
        /is invite-only private and cannot be accessed without an invitation/i
      );

      // Remove Kabir Khan
      await demoRepository.switchUser('VSC-S-009');
      await demoRepository.moderateWorkspaceMember({
        workspaceId: WS_ID,
        moderatorId: 'VSC-S-009',
        targetUserId: 'VSC-S-006',
        newStatus: 'removed',
        reason: 'Violated safety guidelines',
      });

      // Removed user cannot view workspace or member content
      await expect(demoRepository.getWorkspace(WS_ID, 'VSC-S-006')).rejects.toThrow(
        /You have been removed from this workspace/i
      );
      await expect(demoRepository.getWorkspaceActions(WS_ID, 'VSC-S-006')).rejects.toThrow(
        /Non-members and invited or removed participants cannot read/i
      );
      await expect(demoRepository.getWorkspaceMemberships(WS_ID, 'VSC-S-006')).rejects.toThrow(
        /Member directory is only accessible to active workspace members/i
      );
    });
  });

  describe('2. Username Search & Controlled Invitations', () => {
    it('allows active members with invite permission to search users by username', async () => {
      const results = await demoRepository.searchUsersForInvite('aslan', 'VSC-S-001', WS_ID);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].username).toBe('aslan.sandh');
    });

    it('successfully invites an eligible user by exact username and creates invited membership', async () => {
      const newMember = await demoRepository.inviteUserToWorkspace({
        workspaceId: WS_ID,
        inviterId: 'VSC-S-001',
        usernameOrId: 'aslan.sandh',
      });

      expect(newMember.userId).toBe('VSC-S-011');
      expect(newMember.state).toBe('invited');
      expect(newMember.invitedBy).toBe('VSC-S-001');

      // Verify audit event
      const audits = await demoRepository.getWorkspaceAuditEvents(WS_ID, 'VSC-S-001');
      const inviteAudit = audits.find((a) => a.eventType === 'invite' && a.targetUserId === 'VSC-S-011');
      expect(inviteAudit).toBeDefined();
      expect(inviteAudit?.actorId).toBe('VSC-S-001');
    });

    it('rejects self-invitation', async () => {
      await expect(
        demoRepository.inviteUserToWorkspace({
          workspaceId: WS_ID,
          inviterId: 'VSC-S-001',
          usernameOrId: 'ankita.kapri',
        })
      ).rejects.toThrow(/Self-invitation is not permitted/i);
    });

    it('rejects invitation of unknown username with clear error', async () => {
      await expect(
        demoRepository.inviteUserToWorkspace({
          workspaceId: WS_ID,
          inviterId: 'VSC-S-001',
          usernameOrId: 'unknown_resident_999',
        })
      ).rejects.toThrow(/User "@unknown_resident_999" not found/i);
    });

    it('rejects duplicate invitations for existing members or pending invitees', async () => {
      // VSC-S-002 is already an active member
      await expect(
        demoRepository.inviteUserToWorkspace({
          workspaceId: WS_ID,
          inviterId: 'VSC-S-001',
          usernameOrId: 'niyati.chawda',
        })
      ).rejects.toThrow(/already an active member/i);

      // VSC-S-003 already has a pending invitation in seed
      await expect(
        demoRepository.inviteUserToWorkspace({
          workspaceId: WS_ID,
          inviterId: 'VSC-S-001',
          usernameOrId: 'harshita.kapri',
        })
      ).rejects.toThrow(/already has a pending invitation/i);
    });
  });

  describe('3. Invitation Acceptance and Decline Lifecycle', () => {
    it('allows invitee to accept invitation, activating membership with persistent joinedAt', async () => {
      const accepted = await demoRepository.respondToWorkspaceInvite({
        workspaceId: WS_ID,
        userId: 'VSC-S-003',
        accept: true,
      });

      expect(accepted.state).toBe('active');
      expect(accepted.joinedAt).toBeDefined();

      // Verify audit
      const audits = await demoRepository.getWorkspaceAuditEvents(WS_ID, 'VSC-S-001');
      const acceptAudit = audits.find((a) => a.eventType === 'acceptance' && a.actorId === 'VSC-S-003');
      expect(acceptAudit).toBeDefined();
    });

    it('allows invitee to decline invitation, recording left state and decline audit', async () => {
      const declined = await demoRepository.respondToWorkspaceInvite({
        workspaceId: WS_ID,
        userId: 'VSC-S-003',
        accept: false,
        reason: 'Unable to commit to Ward 24 schedule this semester',
      });

      expect(declined.state).toBe('left');
      expect(declined.statusReason).toContain('Unable to commit');

      const audits = await demoRepository.getWorkspaceAuditEvents(WS_ID, 'VSC-S-001');
      const declineAudit = audits.find((a) => a.eventType === 'decline' && a.actorId === 'VSC-S-003');
      expect(declineAudit).toBeDefined();
    });
  });

  describe('4. Versioned Rulebook Acknowledgement & Substantive Action Boundary', () => {
    it('records rulebook acknowledgement for active member', async () => {
      const ack = await demoRepository.acknowledgeWorkspaceRules({
        workspaceId: WS_ID,
        userId: 'VSC-S-001',
        version: 'v1.0',
      });
      expect(ack.lastAcknowledgedRuleVersion).toBe('v1.0');

      const audits = await demoRepository.getWorkspaceAuditEvents(WS_ID, 'VSC-S-001');
      expect(audits.some((a) => a.eventType === 'rule_acknowledgement' && a.actorId === 'VSC-S-001')).toBe(true);
    });

    it('prevents posting if member has not acknowledged current rulebook version', async () => {
      // Simulate invitee accepting invite but not acknowledging rules
      await demoRepository.respondToWorkspaceInvite({
        workspaceId: WS_ID,
        userId: 'VSC-S-003',
        accept: true,
      });

      // Attempt posting before rule acknowledgement
      await expect(
        demoRepository.createWorkspaceAction({
          workspaceId: WS_ID,
          authorId: 'VSC-S-003',
          actionType: 'team_note',
          title: 'Cross-School Coordination Feedback',
          content: 'Here are observations from Ajmer crosswalk experiences.',
        })
      ).rejects.toThrow(/Rule acknowledgement required/i);

      // Now acknowledge rules
      await demoRepository.acknowledgeWorkspaceRules({
        workspaceId: WS_ID,
        userId: 'VSC-S-003',
        version: 'v1.0',
      });

      // Now posting succeeds
      const action = await demoRepository.createWorkspaceAction({
        workspaceId: WS_ID,
        authorId: 'VSC-S-003',
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
      expect(action.authorId).toBe('VSC-S-003');
      expect(action.sourceLink?.id).toBe('prop_jaipur_pedestrian_01');
    });

    it('prevents invited user from posting before accepting invitation', async () => {
      // VSC-S-003 is in invited state
      await expect(
        demoRepository.createWorkspaceAction({
          workspaceId: WS_ID,
          authorId: 'VSC-S-003',
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
        moderatorId: 'VSC-T-001',
        actionId: 'act_ws_02',
        action: 'freeze',
        reason: 'Temporary freeze while validating volunteer parent permissions',
      });
      expect(frozen.status).toBe('frozen');
      expect(frozen.moderationReason).toContain('Temporary freeze');

      // Rohan Mehta is co-moderator
      const unfreeze = await demoRepository.moderateWorkspaceAction({
        workspaceId: WS_ID,
        moderatorId: 'VSC-S-009',
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
          moderatorId: 'JS-F-001',
          actionId: 'act_ws_02',
          action: 'freeze',
          reason: 'Global admin attempt to freeze room post',
        })
      ).rejects.toThrow(/Scoped moderation violation/i);

      // Institution Admin not scoped to this room and without memberships grant
      await demoRepository.switchUser('VSC-P-001');
      await expect(
        demoRepository.moderateWorkspaceMember({
          workspaceId: WS_ID,
          moderatorId: 'VSC-P-001',
          targetUserId: 'VSC-S-001',
          newStatus: 'restricted',
          reason: 'Unauthorized restriction attempt',
        })
      ).rejects.toThrow(/Scoped moderation violation/i);
    });

    it('allows room moderator to restrict or remove a member with documented reason', async () => {
      await demoRepository.switchUser('VSC-T-001');
      const restricted = await demoRepository.moderateWorkspaceMember({
        workspaceId: WS_ID,
        moderatorId: 'VSC-T-001',
        targetUserId: 'VSC-S-002',
        newStatus: 'restricted',
        reason: 'Posting off-topic commercial content in civic room',
      });

      expect(restricted.state).toBe('restricted');
      expect(restricted.permissions.canPost).toBe(false);

      // Restricted user cannot post
      await expect(
        demoRepository.createWorkspaceAction({
          workspaceId: WS_ID,
          authorId: 'VSC-S-002',
          actionType: 'team_note',
          title: 'Attempted Post During Restriction',
          content: 'This should be blocked by repository permissions.',
        })
      ).rejects.toThrow(/Restricted members cannot create posts/i);
    });

    it('completely denies removed member from accessing workspace content', async () => {
      await demoRepository.switchUser('VSC-T-001');
      await demoRepository.moderateWorkspaceMember({
        workspaceId: WS_ID,
        moderatorId: 'VSC-T-001',
        targetUserId: 'VSC-S-006',
        newStatus: 'removed',
        reason: 'Repeated violation of vehicle privacy standards',
      });

      // Removed user cannot view actions
      await expect(
        demoRepository.getWorkspaceActions(WS_ID, 'VSC-S-006')
      ).rejects.toThrow(/Unauthorized: Non-members and invited or removed participants cannot read/i);

      // Removed user cannot view workspace
      await expect(
        demoRepository.getWorkspace(WS_ID, 'VSC-S-006')
      ).rejects.toThrow(/Unauthorized: You have been removed from this workspace/i);
    });

    it('prevents removing or restricting the workspace owner', async () => {
      await demoRepository.switchUser('VSC-S-009');
      await expect(
        demoRepository.moderateWorkspaceMember({
          workspaceId: WS_ID,
          moderatorId: 'VSC-S-009',
          targetUserId: 'VSC-T-001',
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
        reporterId: 'VSC-S-001',
        targetActionId: 'act_ws_03',
        reason: 'Clarification required on IRC approach ramp gradient calculation',
      });

      expect(reportAudit.eventType).toBe('report');
      expect(reportAudit.actorId).toBe('VSC-S-001');
      expect(reportAudit.reason).toContain('Clarification required');

      const audits = await demoRepository.getWorkspaceAuditEvents(WS_ID, 'VSC-S-001');
      expect(audits.some((a) => a.id === reportAudit.id)).toBe(true);
    });

    it('persists audit events and state across reload and resets cleanly', async () => {
      await demoRepository.inviteUserToWorkspace({
        workspaceId: WS_ID,
        inviterId: 'VSC-S-001',
        usernameOrId: 'aslan.sandh',
      });

      // Verify persistence reload
      const loadedDb = PersistenceService.loadDatabase();
      const persistedAudits = loadedDb.workspaceAuditEvents?.filter((a) => a.workspaceId === WS_ID);
      expect(persistedAudits?.some((a) => a.targetUserId === 'VSC-S-011')).toBe(true);

      // Reset
      PersistenceService.resetDatabase();
      const resetDb = PersistenceService.loadDatabase();
      const resetAudits = resetDb.workspaceAuditEvents?.filter((a) => a.workspaceId === WS_ID);
      expect(resetAudits?.some((a) => a.targetUserId === 'VSC-S-011')).toBe(false);
    });
  });
});
