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
      await demoRepository.switchUser('JS-F-001');

      // Issue assignments grant
      const grant = await demoRepository.createScopedModeratorGrant(
        {
          granteeId: 'VSC-T-001',
          scope: {
            type: 'assignments',
            description: 'Evaluate civic mapping submissions for Ajmer cohort',
          },
          durationDays: 7,
          reason: 'Founder authorization for mentor evaluation of school mapping project',
        },
        'JS-F-001'
      );

      expect(grant.id).toBeDefined();
      expect(grant.granteeId).toBe('VSC-T-001');
      expect(grant.grantorId).toBe('JS-F-001');
      expect(grant.grantorRole).toBe('platform_admin');
      expect(grant.scope.type).toBe('assignments');
      expect(grant.status).toBe('active');
      expect(new Date(grant.expiresAt).getTime()).toBeGreaterThan(Date.now());

      // Verify audit record was created
      const audits = await demoRepository.getScopedModeratorAudits('JS-F-001');
      const createAudit = audits.find((a) => a.grantId === grant.id && a.action === 'grant_created');
      expect(createAudit).toBeDefined();
      expect(createAudit?.actorId).toBe('JS-F-001');
      expect(createAudit?.outcome).toBe('success');
      expect(createAudit?.details).toContain('VSC-T-001');
    });

    it('allows Platform Owner to issue a named_session grant restricted to a specific session', async () => {
      await demoRepository.switchUser('JS-F-001');

      const grant = await demoRepository.createScopedModeratorGrant(
        {
          granteeId: 'VSC-S-009',
          scope: {
            type: 'named_session',
            sessionId: 'sess_jaipur_01',
          },
          durationDays: 3,
          reason: 'Live co-moderation support for Jaipur pedestrian safety assembly',
        },
        'JS-F-001'
      );

      expect(grant.scope.type).toBe('named_session');
      expect(grant.scope.sessionId).toBe('sess_jaipur_01');
      expect(grant.scope.sessionTitle).toContain('Evidence Review');
    });

    it('denies non-platform-owner personas from issuing scoped moderator grants (denied-path)', async () => {
      const nonOwners = ['VSC-S-001', 'VSC-T-001', 'VSC-S-009', 'JS-M-002', 'VSC-P-001', 'JS-M-001'];

      for (const actorId of nonOwners) {
        await demoRepository.switchUser(actorId);
        await expect(
          demoRepository.createScopedModeratorGrant(
            {
              granteeId: 'VSC-S-001',
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
      await demoRepository.switchUser('JS-F-001');

      await expect(
        demoRepository.createScopedModeratorGrant(
          {
            granteeId: 'VSC-T-001',
            scope: { type: 'assignments' },
            durationDays: 7,
            reason: '', // Empty reason
          },
          'JS-F-001'
        )
      ).rejects.toThrow(/substantive justification reason is required/i);

      await expect(
        demoRepository.createScopedModeratorGrant(
          {
            granteeId: 'VSC-T-001',
            scope: { type: 'named_session', sessionId: '' },
            durationDays: 7,
            reason: 'Session grant missing ID',
          },
          'JS-F-001'
        )
      ).rejects.toThrow(/valid sessionId is required/i);
    });
  });

  describe('2. Grant Revocation & Auditability', () => {
    it('allows Platform Owner to revoke an active grant with substantive reason', async () => {
      await demoRepository.switchUser('JS-F-001');

      const grant = await demoRepository.createScopedModeratorGrant(
        {
          granteeId: 'VSC-T-001',
          scope: { type: 'assignments' },
          durationDays: 14,
          reason: 'Temporary assignment review grant',
        },
        'JS-F-001'
      );

      const revoked = await demoRepository.revokeScopedModeratorGrant(
        grant.id,
        'Delegation scope completed early following student submissions review',
        'JS-F-001'
      );

      expect(revoked.status).toBe('revoked');
      expect(revoked.revokedBy).toBe('JS-F-001');
      expect(revoked.revocationReason).toContain('Delegation scope completed early');
      expect(revoked.revokedAt).toBeDefined();

      // Verify audit record was created
      const audits = await demoRepository.getScopedModeratorAudits('JS-F-001');
      const revokeAudit = audits.find((a) => a.grantId === grant.id && a.action === 'grant_revoked');
      expect(revokeAudit).toBeDefined();
      expect(revokeAudit?.outcome).toBe('success');
      expect(revokeAudit?.details).toContain('Delegation scope completed early');
    });

    it('denies non-platform-owner personas from revoking grants (denied-path)', async () => {
      await demoRepository.switchUser('VSC-S-001');
      await expect(
        demoRepository.revokeScopedModeratorGrant(
          'grant_mod_asg_01',
          'Attempted participant revocation',
          'VSC-S-001'
        )
      ).rejects.toThrow(/Unauthorized: Only the Platform Owner persona can revoke scoped moderator grants/i);

      await demoRepository.switchUser('JS-M-001');
      await expect(
        demoRepository.revokeScopedModeratorGrant(
          'grant_mod_asg_01',
          'Attempted moderator self-revocation',
          'JS-M-001'
        )
      ).rejects.toThrow(/Unauthorized: Only the Platform Owner persona can revoke scoped moderator grants/i);
    });
  });

  describe('3. Active Scope Enforcement & Action Logging', () => {
    it('allows moderator with active assignments grant to moderate an assignment submission', async () => {
      await demoRepository.switchUser('JS-M-001');

      const sub = await demoRepository.moderateAssignmentSubmission(
        'sub_aarav_02',
        'verified',
        'Verified under scoped moderator delegation: field measurement photo confirms 1.8m width.',
        'JS-M-001'
      );

      expect(sub.status).toBe('verified');
      expect(sub.reviewerId).toBe('JS-M-001');

      // Check audit (scoped to caller or admin)
      const audits = await demoRepository.getScopedModeratorAudits('JS-M-001');
      const usedAudit = audits.find(
        (a) => a.action === 'grant_used' && a.actorId === 'JS-M-001' && a.targetId === 'sub_aarav_02'
      );
      expect(usedAudit).toBeDefined();
      expect(usedAudit?.scopeType).toBe('assignments');
      expect(usedAudit?.outcome).toBe('success');
    });

    it('allows moderator with active assignments grant to review submissions in reviewSubmission', async () => {
      await demoRepository.switchUser('JS-M-001');

      const sub = await demoRepository.reviewSubmission({
        submissionId: 'sub_aarav_02',
        status: 'verified',
        teacherFeedback: 'Scoped moderator review: methodology conforms to IRC guidelines.',
        reviewerId: 'JS-M-001',
        score: 95,
      });

      expect(sub.status).toBe('verified');
      expect(sub.reviewerId).toBe('JS-M-001');

      const audits = await demoRepository.getScopedModeratorAudits('JS-M-001');
      expect(
        audits.some((a) => a.action === 'grant_used' && a.actorId === 'JS-M-001' && a.scopeType === 'assignments')
      ).toBe(true);
    });

    it('allows moderator with active memberships grant to moderate workspace membership', async () => {
      await demoRepository.switchUser('JS-M-001');

      const membership = await demoRepository.moderatePlatformMembership({
        workspaceId: 'ws_jaipur_school_safety',
        targetUserId: 'VSC-S-002',
        newStatus: 'restricted',
        reason: 'Temporary platform restriction for deliberative guideline review',
        moderatorId: 'JS-M-001',
      });

      expect(membership.state).toBe('restricted');
      expect(membership.permissions.canPost).toBe(false);

      const audits = await demoRepository.getScopedModeratorAudits('JS-M-001');
      const memAudit = audits.find(
        (a) => a.action === 'grant_used' && a.actorId === 'JS-M-001' && a.scopeType === 'memberships'
      );
      expect(memAudit).toBeDefined();
      expect(memAudit?.outcome).toBe('success');
    });

    it('allows moderator with active named_session grant to moderate session deliberation', async () => {
      await demoRepository.switchUser('JS-M-001');

      const res = await demoRepository.moderateSessionDeliberation({
        sessionId: 'sess_jaipur_01',
        actionType: 'mute_participant',
        targetUserId: 'VSC-S-002',
        reason: 'Excessive background noise during opening stage',
        moderatorId: 'JS-M-001',
      });

      expect(res.success).toBe(true);
      expect(res.details).toContain('Muted participant VSC-S-002');

      const audits = await demoRepository.getScopedModeratorAudits('JS-M-001');
      const sesAudit = audits.find(
        (a) => a.action === 'grant_used' && a.actorId === 'JS-M-001' && a.targetId === 'sess_jaipur_01'
      );
      expect(sesAudit).toBeDefined();
      expect(sesAudit?.scopeType).toBe('named_session');
    });
  });

  describe('4. Cross-Scope Boundaries & Denied Paths', () => {
    it('strictly denies cross-scope access: assignments moderator cannot moderate memberships', async () => {
      await demoRepository.switchUser('JS-F-001');

      // Create user with ONLY assignments grant
      await demoRepository.createScopedModeratorGrant(
        {
          granteeId: 'VSC-P-001',
          scope: { type: 'assignments' },
          durationDays: 7,
          reason: 'Assignments-only review grant',
        },
        'JS-F-001'
      );

      await demoRepository.switchUser('VSC-P-001');

      await expect(
        demoRepository.moderatePlatformMembership({
          workspaceId: 'ws_jaipur_school_safety',
          targetUserId: 'VSC-S-002',
          newStatus: 'restricted',
          reason: 'Cross-scope attempt',
          moderatorId: 'VSC-P-001',
        })
      ).rejects.toThrow(/Cross-scope access denied/i);

      // Verify audit recorded denial
      const audits = await demoRepository.getScopedModeratorAudits('VSC-P-001');
      const deniedAudit = audits.find(
        (a) => a.action === 'grant_denied' && a.actorId === 'VSC-P-001' && a.scopeType === 'memberships'
      );
      expect(deniedAudit).toBeDefined();
      expect(deniedAudit?.outcome).toBe('denied');
      expect(deniedAudit?.denialReason).toContain('Cross-scope access denied');
    });

    it('strictly denies cross-session access: session A moderator cannot moderate session B', async () => {
      await demoRepository.switchUser('JS-M-001');

      // JS-M-001 has grant for sess_jaipur_01 only
      await expect(
        demoRepository.moderateSessionDeliberation({
          sessionId: 'sess_past_01', // Different session!
          actionType: 'mute_participant',
          targetUserId: 'VSC-S-001',
          reason: 'Cross-session interference attempt',
          moderatorId: 'JS-M-001',
        })
      ).rejects.toThrow(/Cross-session access denied/i);

      const audits = await demoRepository.getScopedModeratorAudits('JS-M-001');
      const deniedAudit = audits.find(
        (a) => a.action === 'grant_denied' && a.actorId === 'JS-M-001' && a.targetId === 'sess_past_01'
      );
      expect(deniedAudit).toBeDefined();
      expect(deniedAudit?.outcome).toBe('denied');
      expect(deniedAudit?.denialReason).toContain('Cross-session access denied');
    });

    it('denies action when user has no grant at all', async () => {
      await demoRepository.switchUser('VSC-S-001');

      await expect(
        demoRepository.moderateAssignmentSubmission(
          'sub_jaipur_crosswalk_01',
          'verified',
          'Unauthorized participant review',
          'VSC-S-001'
        )
      ).rejects.toThrow(/No moderator grant found/i);
    });
  });

  describe('5. Expiry & Revocation Enforcement', () => {
    it('denies moderation actions under an expired grant', async () => {
      await demoRepository.switchUser('VSC-T-002');

      // grant_mod_exp_01 is seeded as expired for VSC-T-002
      await expect(
        demoRepository.moderateSessionDeliberation({
          sessionId: 'sess_orientation_01',
          actionType: 'mute_participant',
          targetUserId: 'VSC-S-001',
          reason: 'Action on expired grant',
          moderatorId: 'VSC-T-002',
        })
      ).rejects.toThrow(/expired/i);

      const audits = await demoRepository.getScopedModeratorAudits('VSC-T-002');
      const expiredAudit = audits.find(
        (a) => a.action === 'grant_denied' && a.actorId === 'VSC-T-002' && a.targetId === 'sess_orientation_01'
      );
      expect(expiredAudit).toBeDefined();
      expect(expiredAudit?.denialReason).toContain('expired');
    });

    it('denies moderation actions under a revoked grant', async () => {
      await demoRepository.switchUser('JS-M-002');

      // grant_mod_rev_01 is seeded as revoked for JS-M-002
      await expect(
        demoRepository.moderateAssignmentSubmission(
          'sub_jaipur_crosswalk_01',
          'verified',
          'Action on revoked grant',
          'JS-M-002'
        )
      ).rejects.toThrow(/revoked by platform owner/i);

      const audits = await demoRepository.getScopedModeratorAudits('JS-M-002');
      const revokedAudit = audits.find(
        (a) => a.action === 'grant_denied' && a.actorId === 'JS-M-002'
      );
      expect(revokedAudit).toBeDefined();
      expect(revokedAudit?.denialReason).toContain('revoked');
    });
  });

  describe('6. 33% Women\'s Reservation Exception Role-Boundary', () => {
    it('strictly forbids scoped moderators from approving 33% reservation exceptions', async () => {
      await demoRepository.switchUser('JS-M-001');

      // Attempt Assembly role exception
      await expect(
        demoRepository.approveAssemblyRoleException(
          'asmb_jaipur_pedestrian_safety',
          'Chair',
          'Attempted moderator override of reservation rule',
          'JS-M-001'
        )
      ).rejects.toThrow(/Unauthorized: Only Platform Owner \(role: platform_admin\) can approve reservation exceptions/i);

      // Attempt Session role exception
      await expect(
        demoRepository.approveSessionRoleException(
          'sess_jaipur_01',
          'Chair',
          'Attempted session moderator override',
          'JS-M-001'
        )
      ).rejects.toThrow(/Unauthorized: Only Platform Owner \(role: platform_admin\) can approve reservation exceptions/i);

      // Attempt Event allocation exception
      await expect(
        demoRepository.approveEventAllocationException(
          'evt_jaipur_assembly_01',
          'Attempted event moderator override',
          'JS-M-001'
        )
      ).rejects.toThrow(/Unauthorized: Only Platform Owner \(role: platform_admin\) can approve reservation exceptions/i);

      // Verify that audit log recorded the blocked reservation bypass attempt
      const audits = await demoRepository.getScopedModeratorAudits('JS-M-001');
      const blockedReservationAudits = audits.filter(
        (a) => a.action === 'grant_denied' && a.denialReason?.includes('scoped moderators cannot approve 33% reservation exceptions')
      );
      expect(blockedReservationAudits.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('7. Persistence & Workspace-Local Role Independence', () => {
    it('persists grants and audit entries across database reloads', async () => {
      await demoRepository.switchUser('JS-F-001');

      const grant = await demoRepository.createScopedModeratorGrant(
        {
          granteeId: 'JS-M-002',
          scope: { type: 'memberships' },
          durationDays: 30,
          reason: 'Institutional coordination grant for Navchetna workspaces',
        },
        'JS-F-001'
      );

      // Reload fresh database from localStorage
      const reloadedDb = PersistenceService.loadDatabase();
      const persistedGrant = reloadedDb.scopedModeratorGrants?.find((g) => g.id === grant.id);
      expect(persistedGrant).toBeDefined();
      expect(persistedGrant?.granteeId).toBe('JS-M-002');
      expect(persistedGrant?.status).toBe('active');

      const persistedAudit = reloadedDb.scopedModeratorAudits?.find((a) => a.grantId === grant.id);
      expect(persistedAudit).toBeDefined();
      expect(persistedAudit?.action).toBe('grant_created');
    });

    it('preserves existing workspace-local moderator functionality independently of platform grants', async () => {
      await demoRepository.switchUser('VSC-T-001');

      // VSC-T-001 is workspace moderator in ws_jaipur_school_safety
      const ws = await demoRepository.getWorkspace('ws_jaipur_school_safety', 'VSC-T-001');
      expect(ws?.moderatorIds).toContain('VSC-T-001');

      // Can moderate locally without a platform grant
      const result = await demoRepository.moderateWorkspaceMember({
        workspaceId: 'ws_jaipur_school_safety',
        moderatorId: 'VSC-T-001',
        targetUserId: 'VSC-S-002',
        newStatus: 'restricted',
        reason: 'Workspace-local conduct moderation',
      });

      expect(result.state).toBe('restricted');
    });
  });

  describe('8. Admin UI & Honest Simulation Disclosure', () => {
    it('renders AdminModeratorGrantsPage with disclosure banner, seeded grants, and audit log', async () => {
      await demoRepository.switchUser('JS-F-001');
      await useAuthStore.getState().switchPersona('JS-F-001');

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
      expect(screen.getAllByText(/Yashvi Dalsaniya/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Assignments Scope/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText(/Memberships Scope/i).length).toBeGreaterThanOrEqual(1);
    });

    it('allows switching to Audit History tab to view recorded grant events', async () => {
      await demoRepository.switchUser('JS-F-001');
      await useAuthStore.getState().switchPersona('JS-F-001');

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

    it('manages accessible dialog semantics, programmatic labels, and Escape dismiss for create and revoke overlays', async () => {
      await demoRepository.switchUser('JS-F-001');
      await useAuthStore.getState().switchPersona('JS-F-001');

      render(
        <MemoryRouter initialEntries={['/admin/moderator-grants']}>
          <Routes>
            <Route path="/admin/moderator-grants" element={<AdminModeratorGrantsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Issue New Grant/i })).toBeInTheDocument();
      });

      // 1. Open Issue New Grant dialog
      const openCreateBtn = screen.getByRole('button', { name: /Issue New Grant/i });
      fireEvent.click(openCreateBtn);

      const createDialog = await screen.findByRole('dialog', { name: /Issue Scoped Moderator Grant/i });
      expect(createDialog).toBeInTheDocument();
      expect(createDialog).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByLabelText(/Designated Grantee/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Founder Justification & Reason/i)).toBeInTheDocument();

      // Press Escape to dismiss create dialog
      fireEvent.keyDown(window, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /Issue Scoped Moderator Grant/i })).not.toBeInTheDocument();
      });

      // 2. Open Revoke Grant dialog
      const revokeButtons = screen.getAllByRole('button', { name: /Revoke Grant/i });
      expect(revokeButtons.length).toBeGreaterThanOrEqual(1);
      fireEvent.click(revokeButtons[0]);

      const revokeDialog = await screen.findByRole('dialog', { name: /Revoke Scoped Grant/i });
      expect(revokeDialog).toBeInTheDocument();
      expect(revokeDialog).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByLabelText(/Revocation Reason/i)).toBeInTheDocument();

      // Press Escape to dismiss revoke dialog
      fireEvent.keyDown(window, { key: 'Escape' });
      await waitFor(() => {
        expect(screen.queryByRole('dialog', { name: /Revoke Scoped Grant/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('9. Persona Spoofing Rejection & Zero State Mutation', () => {
    it('rejects active participant passing platform-admin ID to createScopedModeratorGrant with zero state mutation', async () => {
      await demoRepository.switchUser('VSC-S-001');

      const dbBefore = await demoRepository.getDatabaseSnapshot();
      const grantCountBefore = (dbBefore.scopedModeratorGrants || []).length;
      const auditCountBefore = (dbBefore.scopedModeratorAudits || []).length;

      await expect(
        demoRepository.createScopedModeratorGrant(
          {
            granteeId: 'VSC-S-001',
            scope: { type: 'assignments' },
            durationDays: 7,
            reason: 'Malicious participant spoofing platform-admin to issue grant',
          },
          'JS-F-001'
        )
      ).rejects.toThrow(/Spoof attempt rejected: Supplied actorId "JS-F-001" does not match active persona "VSC-S-001"/i);

      // Verify zero state mutation
      const dbAfter = await demoRepository.getDatabaseSnapshot();
      expect(dbAfter.scopedModeratorGrants?.length).toBe(grantCountBefore);
      expect(dbAfter.scopedModeratorAudits?.length).toBe(auditCountBefore);
    });

    it('rejects active participant passing platform-admin ID to revokeScopedModeratorGrant with zero state mutation', async () => {
      await demoRepository.switchUser('VSC-S-001');

      const dbBefore = await demoRepository.getDatabaseSnapshot();
      const targetGrantBefore = dbBefore.scopedModeratorGrants?.find((g) => g.id === 'grant_mod_asg_01');
      expect(targetGrantBefore?.status).toBe('active');
      const auditCountBefore = (dbBefore.scopedModeratorAudits || []).length;

      await expect(
        demoRepository.revokeScopedModeratorGrant(
          'grant_mod_asg_01',
          'Malicious revocation passing owner persona',
          'JS-F-001'
        )
      ).rejects.toThrow(/Spoof attempt rejected: Supplied actorId "JS-F-001" does not match active persona "VSC-S-001"/i);

      // Verify zero state mutation
      const dbAfter = await demoRepository.getDatabaseSnapshot();
      const targetGrantAfter = dbAfter.scopedModeratorGrants?.find((g) => g.id === 'grant_mod_asg_01');
      expect(targetGrantAfter?.status).toBe('active');
      expect(targetGrantAfter?.revokedAt).toBeUndefined();
      expect(dbAfter.scopedModeratorAudits?.length).toBe(auditCountBefore);
    });

    it('rejects active participant passing granted moderator ID to moderateAssignmentSubmission with zero state mutation', async () => {
      await demoRepository.switchUser('VSC-S-001');

      const dbBefore = await demoRepository.getDatabaseSnapshot();
      const submissionBefore = dbBefore.submissions.find((s) => s.id === 'sub_aarav_02');
      const priorStatus = submissionBefore?.status;
      const priorFeedback = submissionBefore?.teacherFeedback;
      const auditCountBefore = (dbBefore.scopedModeratorAudits || []).length;

      await expect(
        demoRepository.moderateAssignmentSubmission(
          'sub_aarav_02',
          'verified',
          'Malicious spoofed verification of own submission',
          'JS-M-001'
        )
      ).rejects.toThrow(/Spoof attempt rejected: Supplied actorId "JS-M-001" does not match active persona "VSC-S-001"/i);

      // Verify zero state mutation
      const dbAfter = await demoRepository.getDatabaseSnapshot();
      const submissionAfter = dbAfter.submissions.find((s) => s.id === 'sub_aarav_02');
      expect(submissionAfter?.status).toBe(priorStatus);
      expect(submissionAfter?.teacherFeedback).toBe(priorFeedback);
      expect(dbAfter.scopedModeratorAudits?.length).toBe(auditCountBefore);
    });

    it('rejects active participant passing granted moderator ID to moderatePlatformMembership with zero state mutation', async () => {
      await demoRepository.switchUser('VSC-S-001');

      const dbBefore = await demoRepository.getDatabaseSnapshot();
      const memBefore = dbBefore.workspaceMemberships?.find(
        (m) => m.workspaceId === 'ws_jaipur_school_safety' && m.userId === 'VSC-S-002'
      );
      const priorState = memBefore?.state;
      const auditCountBefore = (dbBefore.scopedModeratorAudits || []).length;

      await expect(
        demoRepository.moderatePlatformMembership({
          workspaceId: 'ws_jaipur_school_safety',
          targetUserId: 'VSC-S-002',
          newStatus: 'restricted',
          reason: 'Malicious spoofed membership restriction',
          moderatorId: 'JS-M-001',
        })
      ).rejects.toThrow(/Spoof attempt rejected: Supplied actorId "JS-M-001" does not match active persona "VSC-S-001"/i);

      // Verify zero state mutation
      const dbAfter = await demoRepository.getDatabaseSnapshot();
      const memAfter = dbAfter.workspaceMemberships?.find(
        (m) => m.workspaceId === 'ws_jaipur_school_safety' && m.userId === 'VSC-S-002'
      );
      expect(memAfter?.state).toBe(priorState);
      expect(dbAfter.scopedModeratorAudits?.length).toBe(auditCountBefore);
    });

    it('rejects active participant passing granted moderator ID directly to moderateWorkspaceMember with zero state mutation', async () => {
      await demoRepository.switchUser('VSC-S-001');

      const dbBefore = await demoRepository.getDatabaseSnapshot();
      const memBefore = dbBefore.workspaceMemberships?.find(
        (m) => m.workspaceId === 'ws_jaipur_school_safety' && m.userId === 'VSC-S-002'
      );
      const priorState = memBefore?.state;
      const wsAuditsBefore = (dbBefore.workspaceAuditEvents || []).length;
      const modAuditsBefore = (dbBefore.scopedModeratorAudits || []).length;

      await expect(
        demoRepository.moderateWorkspaceMember({
          workspaceId: 'ws_jaipur_school_safety',
          targetUserId: 'VSC-S-002',
          newStatus: 'restricted',
          reason: 'Direct spoofed call to moderateWorkspaceMember',
          moderatorId: 'JS-M-001',
        })
      ).rejects.toThrow(/Spoof attempt rejected: Supplied actorId "JS-M-001" does not match active persona "VSC-S-001"/i);

      // Verify zero state mutation in both membership and audit logs
      const dbAfter = await demoRepository.getDatabaseSnapshot();
      const memAfter = dbAfter.workspaceMemberships?.find(
        (m) => m.workspaceId === 'ws_jaipur_school_safety' && m.userId === 'VSC-S-002'
      );
      expect(memAfter?.state).toBe(priorState);
      expect((dbAfter.workspaceAuditEvents || []).length).toBe(wsAuditsBefore);
      expect((dbAfter.scopedModeratorAudits || []).length).toBe(modAuditsBefore);
    });

    it('rejects active participant passing granted moderator ID to moderateSessionDeliberation with zero state mutation', async () => {
      await demoRepository.switchUser('VSC-S-001');

      const dbBefore = await demoRepository.getDatabaseSnapshot();
      const sessionBefore = dbBefore.sessions.find((s) => s.id === 'sess_jaipur_01');
      const priorQueue = JSON.stringify(sessionBefore?.debateData?.speakingQueue || []);
      const auditCountBefore = (dbBefore.scopedModeratorAudits || []).length;

      await expect(
        demoRepository.moderateSessionDeliberation({
          sessionId: 'sess_jaipur_01',
          actionType: 'mute_participant',
          targetUserId: 'VSC-S-002',
          reason: 'Malicious spoofed participant mute',
          moderatorId: 'JS-M-001',
        })
      ).rejects.toThrow(/Spoof attempt rejected: Supplied actorId "JS-M-001" does not match active persona "VSC-S-001"/i);

      // Verify zero state mutation
      const dbAfter = await demoRepository.getDatabaseSnapshot();
      const sessionAfter = dbAfter.sessions.find((s) => s.id === 'sess_jaipur_01');
      expect(JSON.stringify(sessionAfter?.debateData?.speakingQueue || [])).toBe(priorQueue);
      expect(dbAfter.scopedModeratorAudits?.length).toBe(auditCountBefore);
    });

    it('rejects active participant querying verifyModeratorScope for another user', async () => {
      await demoRepository.switchUser('VSC-S-001');

      await expect(
        demoRepository.verifyModeratorScope('JS-M-001', { type: 'assignments' })
      ).rejects.toThrow(/Spoof attempt rejected: Supplied actorId "JS-M-001" does not match active persona "VSC-S-001"/i);
    });

    it('rejects privileged actions when db.activeUserId is missing', async () => {
      // Clear active persona from database
      const db = (demoRepository as any).getDb();
      delete db.activeUserId;
      (demoRepository as any).saveDb(db);

      await expect(
        demoRepository.createScopedModeratorGrant(
          {
            granteeId: 'VSC-T-001',
            scope: { type: 'assignments' },
            durationDays: 7,
            reason: 'Attempt without active persona',
          },
          'JS-F-001'
        )
      ).rejects.toThrow(/Unauthorized: Missing active persona/i);

      await expect(
        demoRepository.revokeScopedModeratorGrant(
          'grant_mod_asg_01',
          'Attempt without active persona',
          'JS-F-001'
        )
      ).rejects.toThrow(/Unauthorized: Missing active persona/i);

      await expect(
        demoRepository.moderateAssignmentSubmission(
          'sub_aarav_02',
          'verified',
          'Attempt without active persona',
          'JS-M-001'
        )
      ).rejects.toThrow(/Unauthorized: Missing active persona/i);

      await expect(
        demoRepository.moderatePlatformMembership({
          workspaceId: 'ws_jaipur_school_safety',
          targetUserId: 'VSC-S-002',
          newStatus: 'restricted',
          reason: 'Attempt without active persona',
          moderatorId: 'JS-M-001',
        })
      ).rejects.toThrow(/Unauthorized: Missing active persona/i);

      await expect(
        demoRepository.moderateWorkspaceMember({
          workspaceId: 'ws_jaipur_school_safety',
          targetUserId: 'VSC-S-002',
          newStatus: 'restricted',
          reason: 'Attempt without active persona',
          moderatorId: 'JS-M-001',
        })
      ).rejects.toThrow(/Unauthorized: Missing active persona/i);

      await expect(
        demoRepository.moderateSessionDeliberation({
          sessionId: 'sess_jaipur_01',
          actionType: 'mute_participant',
          targetUserId: 'VSC-S-002',
          reason: 'Attempt without active persona',
          moderatorId: 'JS-M-001',
        })
      ).rejects.toThrow(/Unauthorized: Missing active persona/i);
    });
  });

  describe('10. Non-Owner Safe Projections & Query Guarding', () => {
    it('prevents non-owner personas from reading all grants, emails, or global audit history', async () => {
      await demoRepository.switchUser('VSC-S-001');

      // Participant has no grants, so reading grants yields empty array
      const grants = await demoRepository.getScopedModeratorGrants();
      expect(grants).toEqual([]);

      // Participant has no grant-moderation audits involving them
      const audits = await demoRepository.getScopedModeratorAudits();
      expect(audits).toEqual([]);

      // Participant cannot spoof callerId in read queries
      await expect(demoRepository.getScopedModeratorGrants('JS-F-001')).rejects.toThrow(/Spoof attempt rejected/i);
      await expect(demoRepository.getScopedModeratorAudits('JS-F-001')).rejects.toThrow(/Spoof attempt rejected/i);
    });

    it('returns only the grantee\'s own safe projection with emails redacted for moderator personas', async () => {
      await demoRepository.switchUser('JS-M-001');

      const grants = await demoRepository.getScopedModeratorGrants();
      expect(grants.length).toBeGreaterThan(0);

      // Verify every grant belongs strictly to JS-M-001 and has granteeEmail redacted
      for (const grant of grants) {
        expect(grant.granteeId).toBe('JS-M-001');
        expect(grant.granteeEmail).toBeUndefined();
      }

      // Verify JS-M-001 only sees audits where they are the actor or target
      const audits = await demoRepository.getScopedModeratorAudits();
      expect(audits.length).toBeGreaterThan(0);
      for (const audit of audits) {
        expect(audit.actorId === 'JS-M-001' || audit.targetId === 'JS-M-001').toBe(true);
      }
    });

    it('allows Platform Owner (platform_admin) to inspect all grants with grantee emails and full audit history', async () => {
      await demoRepository.switchUser('JS-F-001');

      const grants = await demoRepository.getScopedModeratorGrants();
      expect(grants.length).toBeGreaterThanOrEqual(4);

      // Platform Owner sees granteeEmail
      const grantWithEmail = grants.find((g) => g.granteeEmail !== undefined);
      expect(grantWithEmail).toBeDefined();
      expect(grantWithEmail?.granteeEmail).toContain('@');

      // Platform Owner sees full audit history (created, used, revoked, expired across all users)
      const audits = await demoRepository.getScopedModeratorAudits();
      expect(audits.length).toBeGreaterThanOrEqual(4);
      expect(audits.some((a) => a.action === 'grant_created')).toBe(true);
      expect(audits.some((a) => a.action === 'grant_revoked')).toBe(true);
    });
  });
});
