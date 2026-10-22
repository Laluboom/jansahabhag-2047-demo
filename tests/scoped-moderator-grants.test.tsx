import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { useAuthStore } from '../src/stores/authStore';
import { AdminModeratorGrantsPage } from '../src/features/administration/AdminModeratorGrantsPage';

describe('Change Plan v2 §12: Scoped Moderator Grants & Founder-Held Delegation', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  describe('1. Grant Creation & Founder Persona Authority', () => {
    it('allows Platform Owner (platform_admin) to issue scoped grants with time bounds and audit logging', async () => {
      // Issue assignments grant
      const grant = await demoRepository.createScopedModeratorGrant(
        {
          granteeId: 'user_kavita',
          scope: {
            type: 'assignments',
            description: 'Evaluate civic mapping submissions for Ajmer cohort',
          },
          durationDays: 7,
          reason: 'Founder authorization for mentor evaluation of school mapping project',
        },
        'user_admin'
      );

      expect(grant.id).toBeDefined();
      expect(grant.granteeId).toBe('user_kavita');
      expect(grant.grantorId).toBe('user_admin');
      expect(grant.grantorRole).toBe('platform_admin');
      expect(grant.scope.type).toBe('assignments');
      expect(grant.status).toBe('active');
      expect(new Date(grant.expiresAt).getTime()).toBeGreaterThan(Date.now());

      // Verify audit record was created
      const audits = await demoRepository.getScopedModeratorAudits('user_admin');
      const createAudit = audits.find((a) => a.grantId === grant.id && a.action === 'grant_created');
      expect(createAudit).toBeDefined();
      expect(createAudit?.actorId).toBe('user_admin');
      expect(createAudit?.outcome).toBe('success');
      expect(createAudit?.details).toContain('user_kavita');
    });

    it('allows Platform Owner to issue a named_session grant restricted to a specific session', async () => {
      const grant = await demoRepository.createScopedModeratorGrant(
        {
          granteeId: 'user_rohan',
          scope: {
            type: 'named_session',
            sessionId: 'sess_jaipur_01',
          },
          durationDays: 3,
          reason: 'Live co-moderation support for Jaipur pedestrian safety assembly',
        },
        'user_admin'
      );

      expect(grant.scope.type).toBe('named_session');
      expect(grant.scope.sessionId).toBe('sess_jaipur_01');
      expect(grant.scope.sessionTitle).toContain('Evidence Review');
    });

    it('denies non-platform-owner personas from issuing scoped moderator grants (denied-path)', async () => {
      const nonOwners = ['user_aarav', 'user_kavita', 'user_rohan', 'user_ananya', 'user_dev', 'user_moderator'];

      for (const actorId of nonOwners) {
        await expect(
          demoRepository.createScopedModeratorGrant(
            {
              granteeId: 'user_aarav',
              scope: { type: 'assignments' },
              durationDays: 7,
              reason: 'Unauthorized grant attempt',
            },
            actorId
          )
        ).rejects.toThrow(/Unauthorized: Only the Platform Owner persona can create scoped moderator grants/i);
      }
    });

    it('validates grant inputs: requires reason and valid target session', async () => {
      await expect(
        demoRepository.createScopedModeratorGrant(
          {
            granteeId: 'user_kavita',
            scope: { type: 'assignments' },
            durationDays: 7,
            reason: '', // Empty reason
          },
          'user_admin'
        )
      ).rejects.toThrow(/substantive justification reason is required/i);

      await expect(
        demoRepository.createScopedModeratorGrant(
          {
            granteeId: 'user_kavita',
            scope: { type: 'named_session', sessionId: '' },
            durationDays: 7,
            reason: 'Session grant missing ID',
          },
          'user_admin'
        )
      ).rejects.toThrow(/valid sessionId is required/i);
    });
  });

  describe('2. Grant Revocation & Auditability', () => {
    it('allows Platform Owner to revoke an active grant with substantive reason', async () => {
      const grant = await demoRepository.createScopedModeratorGrant(
        {
          granteeId: 'user_kavita',
          scope: { type: 'assignments' },
          durationDays: 14,
          reason: 'Temporary assignment review grant',
        },
        'user_admin'
      );

      const revoked = await demoRepository.revokeScopedModeratorGrant(
        grant.id,
        'Delegation scope completed early following student submissions review',
        'user_admin'
      );

      expect(revoked.status).toBe('revoked');
      expect(revoked.revokedBy).toBe('user_admin');
      expect(revoked.revocationReason).toContain('Delegation scope completed early');
      expect(revoked.revokedAt).toBeDefined();

      // Verify audit record was created
      const audits = await demoRepository.getScopedModeratorAudits('user_admin');
      const revokeAudit = audits.find((a) => a.grantId === grant.id && a.action === 'grant_revoked');
      expect(revokeAudit).toBeDefined();
      expect(revokeAudit?.outcome).toBe('success');
      expect(revokeAudit?.details).toContain('Delegation scope completed early');
    });

    it('denies non-platform-owner personas from revoking grants (denied-path)', async () => {
      await expect(
        demoRepository.revokeScopedModeratorGrant(
          'grant_mod_asg_01',
          'Attempted participant revocation',
          'user_aarav'
        )
      ).rejects.toThrow(/Unauthorized: Only the Platform Owner persona can revoke scoped moderator grants/i);

      await expect(
        demoRepository.revokeScopedModeratorGrant(
          'grant_mod_asg_01',
          'Attempted moderator self-revocation',
          'user_moderator'
        )
      ).rejects.toThrow(/Unauthorized: Only the Platform Owner persona can revoke scoped moderator grants/i);
    });
  });

  describe('3. Active Scope Enforcement & Action Logging', () => {
    it('allows moderator with active assignments grant to moderate an assignment submission', async () => {
      const sub = await demoRepository.moderateAssignmentSubmission(
        'sub_aarav_02',
        'verified',
        'Verified under scoped moderator delegation: field measurement photo confirms 1.8m width.',
        'user_moderator'
      );

      expect(sub.status).toBe('verified');
      expect(sub.reviewerId).toBe('user_moderator');

      // Check audit
      const audits = await demoRepository.getScopedModeratorAudits();
      const usedAudit = audits.find(
        (a) => a.action === 'grant_used' && a.actorId === 'user_moderator' && a.targetId === 'sub_aarav_02'
      );
      expect(usedAudit).toBeDefined();
      expect(usedAudit?.scopeType).toBe('assignments');
      expect(usedAudit?.outcome).toBe('success');
    });

    it('allows moderator with active assignments grant to review submissions in reviewSubmission', async () => {
      await demoRepository.switchUser('user_moderator');

      const sub = await demoRepository.reviewSubmission({
        submissionId: 'sub_aarav_02',
        status: 'verified',
        teacherFeedback: 'Scoped moderator review: methodology conforms to IRC guidelines.',
        reviewerId: 'user_moderator',
        score: 95,
      });

      expect(sub.status).toBe('verified');
      expect(sub.reviewerId).toBe('user_moderator');

      const audits = await demoRepository.getScopedModeratorAudits();
      expect(
        audits.some((a) => a.action === 'grant_used' && a.actorId === 'user_moderator' && a.scopeType === 'assignments')
      ).toBe(true);
    });

    it('allows moderator with active memberships grant to moderate workspace membership', async () => {
      const membership = await demoRepository.moderatePlatformMembership({
        workspaceId: 'ws_jaipur_school_safety',
        targetUserId: 'user_priya',
        newStatus: 'restricted',
        reason: 'Temporary platform restriction for deliberative guideline review',
        moderatorId: 'user_moderator',
      });

      expect(membership.state).toBe('restricted');
      expect(membership.permissions.canPost).toBe(false);

      const audits = await demoRepository.getScopedModeratorAudits();
      const memAudit = audits.find(
        (a) => a.action === 'grant_used' && a.actorId === 'user_moderator' && a.scopeType === 'memberships'
      );
      expect(memAudit).toBeDefined();
      expect(memAudit?.outcome).toBe('success');
    });

    it('allows moderator with active named_session grant to moderate session deliberation', async () => {
      const res = await demoRepository.moderateSessionDeliberation({
        sessionId: 'sess_jaipur_01',
        actionType: 'mute_participant',
        targetUserId: 'user_priya',
        reason: 'Excessive background noise during opening stage',
        moderatorId: 'user_moderator',
      });

      expect(res.success).toBe(true);
      expect(res.details).toContain('Muted participant user_priya');

      const audits = await demoRepository.getScopedModeratorAudits();
      const sesAudit = audits.find(
        (a) => a.action === 'grant_used' && a.actorId === 'user_moderator' && a.targetId === 'sess_jaipur_01'
      );
      expect(sesAudit).toBeDefined();
      expect(sesAudit?.scopeType).toBe('named_session');
    });
  });

  describe('4. Cross-Scope Boundaries & Denied Paths', () => {
    it('strictly denies cross-scope access: assignments moderator cannot moderate memberships', async () => {
      // Create user with ONLY assignments grant
      await demoRepository.createScopedModeratorGrant(
        {
          granteeId: 'user_dev',
          scope: { type: 'assignments' },
          durationDays: 7,
          reason: 'Assignments-only review grant',
        },
        'user_admin'
      );

      await expect(
        demoRepository.moderatePlatformMembership({
          workspaceId: 'ws_jaipur_school_safety',
          targetUserId: 'user_priya',
          newStatus: 'restricted',
          reason: 'Cross-scope attempt',
          moderatorId: 'user_dev',
        })
      ).rejects.toThrow(/Cross-scope access denied/i);

      // Verify audit recorded denial
      const audits = await demoRepository.getScopedModeratorAudits();
      const deniedAudit = audits.find(
        (a) => a.action === 'grant_denied' && a.actorId === 'user_dev' && a.scopeType === 'memberships'
      );
      expect(deniedAudit).toBeDefined();
      expect(deniedAudit?.outcome).toBe('denied');
      expect(deniedAudit?.denialReason).toContain('Cross-scope access denied');
    });

    it('strictly denies cross-session access: session A moderator cannot moderate session B', async () => {
      // user_moderator has grant for sess_jaipur_01 only
      await expect(
        demoRepository.moderateSessionDeliberation({
          sessionId: 'sess_past_01', // Different session!
          actionType: 'mute_participant',
          targetUserId: 'user_aarav',
          reason: 'Cross-session interference attempt',
          moderatorId: 'user_moderator',
        })
      ).rejects.toThrow(/Cross-session access denied/i);

      const audits = await demoRepository.getScopedModeratorAudits();
      const deniedAudit = audits.find(
        (a) => a.action === 'grant_denied' && a.actorId === 'user_moderator' && a.targetId === 'sess_past_01'
      );
      expect(deniedAudit).toBeDefined();
      expect(deniedAudit?.outcome).toBe('denied');
      expect(deniedAudit?.denialReason).toContain('Cross-session access denied');
    });

    it('denies action when user has no grant at all', async () => {
      await expect(
        demoRepository.moderateAssignmentSubmission(
          'sub_jaipur_crosswalk_01',
          'verified',
          'Unauthorized participant review',
          'user_aarav'
        )
      ).rejects.toThrow(/No moderator grant found/i);
    });
  });

  describe('5. Expiry & Revocation Enforcement', () => {
    it('denies moderation actions under an expired grant', async () => {
      // grant_mod_exp_01 is seeded as expired for user_kavita
      await expect(
        demoRepository.moderateSessionDeliberation({
          sessionId: 'sess_orientation_01',
          actionType: 'mute_participant',
          targetUserId: 'user_aarav',
          reason: 'Action on expired grant',
          moderatorId: 'user_kavita',
        })
      ).rejects.toThrow(/expired/i);

      const audits = await demoRepository.getScopedModeratorAudits();
      const expiredAudit = audits.find(
        (a) => a.action === 'grant_denied' && a.actorId === 'user_kavita' && a.targetId === 'sess_orientation_01'
      );
      expect(expiredAudit).toBeDefined();
      expect(expiredAudit?.denialReason).toContain('expired');
    });

    it('denies moderation actions under a revoked grant', async () => {
      // grant_mod_rev_01 is seeded as revoked for user_rohan
      await expect(
        demoRepository.moderateAssignmentSubmission(
          'sub_jaipur_crosswalk_01',
          'verified',
          'Action on revoked grant',
          'user_rohan'
        )
      ).rejects.toThrow(/revoked by platform owner/i);

      const audits = await demoRepository.getScopedModeratorAudits();
      const revokedAudit = audits.find(
        (a) => a.action === 'grant_denied' && a.actorId === 'user_rohan'
      );
      expect(revokedAudit).toBeDefined();
      expect(revokedAudit?.denialReason).toContain('revoked');
    });
  });

  describe('6. 33% Women\'s Reservation Exception Role-Boundary', () => {
    it('strictly forbids scoped moderators from approving 33% reservation exceptions', async () => {
      await demoRepository.switchUser('user_moderator');

      // Attempt Assembly role exception
      await expect(
        demoRepository.approveAssemblyRoleException(
          'asmb_jaipur_pedestrian_safety',
          'Chair',
          'Attempted moderator override of reservation rule',
          'user_moderator'
        )
      ).rejects.toThrow(/Unauthorized: Only Platform Owner \(role: platform_admin\) can approve reservation exceptions/i);

      // Attempt Session role exception
      await expect(
        demoRepository.approveSessionRoleException(
          'sess_jaipur_01',
          'Chair',
          'Attempted session moderator override',
          'user_moderator'
        )
      ).rejects.toThrow(/Unauthorized: Only Platform Owner \(role: platform_admin\) can approve reservation exceptions/i);

      // Attempt Event allocation exception
      await expect(
        demoRepository.approveEventAllocationException(
          'evt_jaipur_assembly_01',
          'Attempted event moderator override',
          'user_moderator'
        )
      ).rejects.toThrow(/Unauthorized: Only Platform Owner \(role: platform_admin\) can approve reservation exceptions/i);

      // Verify that audit log recorded the blocked reservation bypass attempt
      const audits = await demoRepository.getScopedModeratorAudits();
      const blockedReservationAudits = audits.filter(
        (a) => a.action === 'grant_denied' && a.denialReason?.includes('scoped moderators cannot approve 33% reservation exceptions')
      );
      expect(blockedReservationAudits.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('7. Persistence & Workspace-Local Role Independence', () => {
    it('persists grants and audit entries across database reloads', async () => {
      const grant = await demoRepository.createScopedModeratorGrant(
        {
          granteeId: 'user_ananya',
          scope: { type: 'memberships' },
          durationDays: 30,
          reason: 'Institutional coordination grant for Navchetna workspaces',
        },
        'user_admin'
      );

      // Reload fresh database from localStorage
      const reloadedDb = PersistenceService.loadDatabase();
      const persistedGrant = reloadedDb.scopedModeratorGrants?.find((g) => g.id === grant.id);
      expect(persistedGrant).toBeDefined();
      expect(persistedGrant?.granteeId).toBe('user_ananya');
      expect(persistedGrant?.status).toBe('active');

      const persistedAudit = reloadedDb.scopedModeratorAudits?.find((a) => a.grantId === grant.id);
      expect(persistedAudit).toBeDefined();
      expect(persistedAudit?.action).toBe('grant_created');
    });

    it('preserves existing workspace-local moderator functionality independently of platform grants', async () => {
      // user_kavita is workspace moderator in ws_jaipur_school_safety
      const ws = await demoRepository.getWorkspace('ws_jaipur_school_safety', 'user_kavita');
      expect(ws?.moderatorIds).toContain('user_kavita');

      // Can moderate locally without a platform grant
      const result = await demoRepository.moderateWorkspaceMember({
        workspaceId: 'ws_jaipur_school_safety',
        moderatorId: 'user_kavita',
        targetUserId: 'user_priya',
        newStatus: 'restricted',
        reason: 'Workspace-local conduct moderation',
      });

      expect(result.state).toBe('restricted');
    });
  });

  describe('8. Admin UI & Honest Simulation Disclosure', () => {
    it('renders AdminModeratorGrantsPage with disclosure banner, seeded grants, and audit log', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/moderator-grants']}>
          <Routes>
            <Route path="/admin/moderator-grants" element={<AdminModeratorGrantsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Scoped Moderator Grants/i)).toBeInTheDocument();
        expect(screen.getByText(/One-Browser Simulation Disclosure/i)).toBeInTheDocument();
        expect(screen.getByText(/Delegated Grants Inventory/i)).toBeInTheDocument();
        expect(screen.getByText(/Strict 33% Women's Reservation Boundary/i)).toBeInTheDocument();
      });

      // Seeded grants rendered
      expect(screen.getAllByText(/Karan Verma/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Assignments Scope/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Memberships Scope/i).length).toBeGreaterThanOrEqual(1);
    });

    it('allows switching to Audit History tab to view recorded grant events', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/moderator-grants']}>
          <Routes>
            <Route path="/admin/moderator-grants" element={<AdminModeratorGrantsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Audit History & Grant Actions/i)).toBeInTheDocument();
      });

      const auditTabButton = screen.getByRole('button', { name: /Audit History & Grant Actions/i });
      fireEvent.click(auditTabButton);

      await waitFor(() => {
        expect(screen.getByText(/Showing \d+ recorded events/i)).toBeInTheDocument();
        expect(screen.getAllByText(/Grant Created/i).length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
