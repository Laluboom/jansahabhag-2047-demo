import { describe, it, expect, beforeEach } from 'vitest';
import { DemoRepository } from '../src/services/repository';
import { LocalDemoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { normalizeSessionRecords } from '../src/services/migrations';
import {
  calculateReservedMinimum,
  canUserClaimRoleAllocation,
  buildSessionRoleAllocations,
  projectSessionForCaller,
  POLICY_VERSION,
  ALLOCATION_SURFACES_INVENTORY,
} from '../src/services/reservationAllocationService';
import { CANONICAL_DEBATE_ROLES, Session } from '../src/types/domain';

describe('Debate Room Named Role Reservation Allocation (Package 08C1)', () => {
  let repository: DemoRepository;

  beforeEach(() => {
    localStorage.clear();
    PersistenceService.resetDatabase();
    repository = new LocalDemoRepository();
  });

  describe('1. Inventory Surfaces Note & Canonical Roles Quotas', () => {
    it('documents Package 08C1 coverage in ALLOCATION_SURFACES_INVENTORY', () => {
      expect(ALLOCATION_SURFACES_INVENTORY.package08C1Coverage).toContain('debate_room_named_roles_allocation');
      expect(ALLOCATION_SURFACES_INVENTORY.package08C1Coverage).toContain('debate_room_one_place_rounding_no_pooling');
      expect(ALLOCATION_SURFACES_INVENTORY.package08C1Coverage).toContain('debate_room_role_assignment_guards');
      expect(ALLOCATION_SURFACES_INVENTORY.package08C1Coverage).toContain('debate_room_role_withdrawal_guards');
      expect(ALLOCATION_SURFACES_INVENTORY.package08C1Coverage).toContain('debate_room_role_replacement_guards');
      expect(ALLOCATION_SURFACES_INVENTORY.package08C1Coverage).toContain('debate_room_role_finalization_guards');
      expect(ALLOCATION_SURFACES_INVENTORY.package08C1Coverage).toContain('debate_room_role_capacity_guards');
      expect(ALLOCATION_SURFACES_INVENTORY.package08C1Coverage).toContain('debate_room_simulated_owner_exception_controls');
      expect(ALLOCATION_SURFACES_INVENTORY.package08C1Coverage).toContain('debate_room_exception_invalidation_guards');
      expect(ALLOCATION_SURFACES_INVENTORY.package08C1Coverage).toContain('debate_room_privacy_projections');
    });

    it('defines all 7 canonical debate roles and applies ceil(0.33 * 1) = 1 independently without pooling', () => {
      expect(CANONICAL_DEBATE_ROLES).toEqual([
        'Facilitator',
        'Questioner',
        'Evidence Analyst',
        'Civic Advocate',
        'Community Voice',
        'Synthesiser',
        'Rapporteur',
      ]);

      for (const role of CANONICAL_DEBATE_ROLES) {
        // One-place singular role rounding: ceil(0.33 * 1) = 1
        expect(calculateReservedMinimum(1)).toBe(1);
      }
    });

    it('builds allocations for all canonical roles and does not silently exempt Facilitator', () => {
      const allocations = buildSessionRoleAllocations({
        sessionId: 'test_sess',
        facilitatorId: 'user_rohan',
        roster: [
          { userId: 'user_rohan', name: 'Rohan Mehta', role: 'Facilitator', joinedAt: '2026-10-01' },
          { userId: 'user_priya', name: 'Priya Sharma', role: 'Evidence Analyst', joinedAt: '2026-10-01' },
        ],
      });

      // Facilitator must NOT be exempt
      expect(allocations['Facilitator']).toBeDefined();
      expect(allocations['Facilitator'].totalPlaces).toBe(1);
      expect(allocations['Facilitator'].reservedMinimum).toBe(1);
      expect(allocations['Facilitator'].ordinaryPlaces).toBe(0);

      // Other canonical roles
      for (const role of CANONICAL_DEBATE_ROLES) {
        expect(allocations[role]).toBeDefined();
        expect(allocations[role].totalPlaces).toBe(1);
        expect(allocations[role].reservedMinimum).toBe(1);
        expect(allocations[role].ordinaryPlaces).toBe(0);
      }
    });

    it('preserves open roster participation without creating fixed role allocations for them', () => {
      const allocations = buildSessionRoleAllocations({
        sessionId: 'test_sess',
        roster: [
          { userId: 'user_aarav', name: 'Aarav Patel', role: 'Participant', joinedAt: '2026-10-01' },
          { userId: 'user_kabir', name: 'Kabir Verma', role: 'Observer', joinedAt: '2026-10-01' },
          { userId: 'user_vikram', name: 'Vikram Singh', role: 'Open Participant', joinedAt: '2026-10-01' },
        ],
      });

      expect(allocations['Participant']).toBeUndefined();
      expect(allocations['Observer']).toBeUndefined();
      expect(allocations['Open Participant']).toBeUndefined();
    });
  });

  describe('2. Seeded Session Roster Inventory & Initial Status Verification', () => {
    it('initializes sess_jaipur_01 with 7 canonical roles in unvalidated_legacy or pending status', async () => {
      await repository.switchPersona('user_admin');
      const session = await repository.getSession('sess_jaipur_01');
      expect(session).not.toBeNull();
      expect(session?.roleAllocations).toBeDefined();

      const allocs = session!.roleAllocations!;
      for (const role of CANONICAL_DEBATE_ROLES) {
        expect(allocs[role]).toBeDefined();
        // Never compliant by default
        expect(allocs[role].status).not.toBe('finalized_compliant');
        expect(allocs[role].status).not.toBe('finalized_exception');
      }

      // Explicit plan stage
      expect(session?.rolePlanStage).toBe('open_selection');
      expect(session?.debateData?.rolePlanStage).toBe('open_selection');
    });

    it('verifies seeded occupants and their unvalidated legacy statuses', async () => {
      await repository.switchPersona('user_admin');
      const allocs = await repository.getSessionRoleAllocations('sess_jaipur_01', 'user_admin');

      // Facilitator: Rohan (ineligible)
      expect(allocs['Facilitator'].confirmedOccupants).toEqual(['user_rohan']);
      expect(allocs['Facilitator'].status).toBe('unvalidated_legacy');

      // Questioner: Aarav (ineligible)
      expect(allocs['Questioner'].confirmedOccupants).toEqual(['user_aarav']);
      expect(allocs['Questioner'].status).toBe('unvalidated_legacy');

      // Evidence Analyst: Priya (eligible)
      expect(allocs['Evidence Analyst'].confirmedOccupants).toEqual(['user_priya']);
      expect(allocs['Evidence Analyst'].status).toBe('unvalidated_legacy');

      // Civic Advocate: Vikram (ineligible)
      expect(allocs['Civic Advocate'].confirmedOccupants).toEqual(['user_vikram']);
      expect(allocs['Civic Advocate'].status).toBe('unvalidated_legacy');

      // Community Voice: Kabir (ineligible)
      expect(allocs['Community Voice'].confirmedOccupants).toEqual(['user_kabir']);
      expect(allocs['Community Voice'].status).toBe('unvalidated_legacy');

      // Synthesiser: Siddharth (ineligible)
      expect(allocs['Synthesiser'].confirmedOccupants).toEqual(['user_siddharth']);
      expect(allocs['Synthesiser'].status).toBe('unvalidated_legacy');

      // Rapporteur: Isha (eligible)
      expect(allocs['Rapporteur'].confirmedOccupants).toEqual(['user_isha']);
      expect(allocs['Rapporteur'].status).toBe('unvalidated_legacy');
    });
  });

  describe('3. Quota Claim Rules, Vacancies & Denial of Unqualified Occupants', () => {
    it('denies ordinary candidate from claiming reserved vacancy in a 1-place role', () => {
      const alloc = buildSessionRoleAllocations({
        sessionId: 'test_sess',
        roster: [],
      })['Questioner'];

      expect(alloc.vacanciesCount).toBe(1);
      expect(alloc.reservedMinimum).toBe(1);
      expect(alloc.ordinaryPlaces).toBe(0);

      // Ineligible candidate (user_aarav) claiming vacant 1-place reserved role
      const claim = canUserClaimRoleAllocation(alloc, 'user_aarav', undefined, false);
      expect(claim.allowed).toBe(false);
      expect(claim.reason).toContain('reservation policy');
    });

    it('allows eligible candidate to claim reserved vacancy in a 1-place role', () => {
      const alloc = buildSessionRoleAllocations({
        sessionId: 'test_sess',
        roster: [],
      })['Questioner'];

      // Eligible candidate (user_priya) claiming vacant reserved role
      const claim = canUserClaimRoleAllocation(alloc, 'user_priya', undefined, false);
      expect(claim.allowed).toBe(true);
      expect(claim.placeType).toBe('reserved');
    });

    it('rejects ordinary candidate assignment to vacant role through repository API', async () => {
      await repository.switchPersona('user_admin');
      // First withdraw Kabir from Community Voice to make it vacant
      await repository.withdrawSessionRole('sess_jaipur_01', 'user_kabir', 'user_admin');

      // Attempt to assign another ineligible user (user_vikram) to Community Voice
      await expect(
        repository.assignSessionRole('sess_jaipur_01', 'user_vikram', 'Community Voice', 'user_admin')
      ).rejects.toThrow(/reservation policy/i);
    });

    it('allows assigning eligible candidate to vacant role', async () => {
      await repository.switchPersona('user_admin');
      // Withdraw Kabir from Community Voice
      await repository.withdrawSessionRole('sess_jaipur_01', 'user_kabir', 'user_admin');

      // Assign eligible candidate Ananya (user_ananya)
      const session = await repository.assignSessionRole('sess_jaipur_01', 'user_ananya', 'Community Voice', 'user_admin');
      const cvAlloc = session.roleAllocations?.['Community Voice'];
      expect(cvAlloc?.confirmedOccupants).toContain('user_ananya');
      expect(cvAlloc?.reservedOccupiedCount).toBe(1);
    });
  });

  describe('4. Finalization Guard & Platform Owner Audited Exception', () => {
    it('denies finalization of non-compliant role allocation without approved exception', async () => {
      await repository.switchPersona('user_admin');
      // Questioner is occupied by Aarav (ineligible, 1 place requires 1 reserved)
      await expect(
        repository.finalizeSessionRoleAllocation('sess_jaipur_01', 'Questioner', 'user_admin')
      ).rejects.toThrow(/reservation requirement unmet/i);

      // Verify persistent status is unchanged
      const session = await repository.getSession('sess_jaipur_01');
      expect(session?.roleAllocations?.['Questioner'].status).not.toBe('finalized_compliant');
      expect(session?.roleAllocations?.['Questioner'].status).not.toBe('finalized_exception');
    });

    it('allows finalization of compliant role allocation', async () => {
      await repository.switchPersona('user_admin');
      // Evidence Analyst is occupied by Priya (eligible, fulfills 1 reserved place)
      const session = await repository.finalizeSessionRoleAllocation('sess_jaipur_01', 'Evidence Analyst', 'user_admin');
      const alloc = session.roleAllocations?.['Evidence Analyst'];
      expect(alloc?.status).toBe('finalized_compliant');
    });

    it('rejects participant and facilitator spoofing of Platform Owner exception approval', async () => {
      // Participant attempting exception approval
      await repository.switchPersona('user_aarav');
      await expect(
        repository.approveSessionRoleException(
          'sess_jaipur_01',
          'Facilitator',
          'Participant attempting exception override',
          'user_aarav'
        )
      ).rejects.toThrow(/Only Platform Owner.*can approve reservation exceptions/i);

      // Participant attempting to spoof Platform Owner persona
      await expect(
        repository.approveSessionRoleException(
          'sess_jaipur_01',
          'Facilitator',
          'Spoofing Platform Owner',
          'user_admin' // actorId does not match active persona user_aarav
        )
      ).rejects.toThrow(/Spoof attempt rejected/i);

      // Facilitator attempting exception approval
      await repository.switchPersona('user_rohan');
      await expect(
        repository.approveSessionRoleException(
          'sess_jaipur_01',
          'Facilitator',
          'Facilitator self-approving exception',
          'user_rohan'
        )
      ).rejects.toThrow(/Only Platform Owner.*can approve reservation exceptions/i);
    });

    it('rejects exception approval without substantive justification (minimum 5 chars)', async () => {
      await repository.switchPersona('user_admin');
      await expect(
        repository.approveSessionRoleException('sess_jaipur_01', 'Facilitator', 'skip', 'user_admin')
      ).rejects.toThrow(/substantive reason.*minimum 5 characters/i);
    });

    it('allows Platform Owner to approve audited exception with visibly distinct status', async () => {
      await repository.switchPersona('user_admin');
      const { session, audit } = await repository.approveSessionRoleException(
        'sess_jaipur_01',
        'Facilitator',
        'Fictional pilot demo: Rohan confirmed as Facilitator under documented Platform Owner exception.',
        'user_admin'
      );

      const alloc = session.roleAllocations?.['Facilitator'];
      expect(alloc?.status).toBe('finalized_exception');
      expect(alloc?.isException).toBe(true);
      expect(alloc?.exceptionAudit).toBeDefined();
      expect(alloc?.exceptionAudit?.reason).toContain('Rohan confirmed as Facilitator');
      expect(alloc?.exceptionAudit?.actorRole).toBe('platform_admin');
      expect(alloc?.exceptionAudit?.policyVersion).toBe(POLICY_VERSION);
      expect(audit.action).toBe('exception_approved');

      // Verify audit trail in repository
      const audits = await repository.getAllocationAudits(alloc?.allocationId, 'user_admin');
      expect(audits.some((a) => a.action === 'exception_approved')).toBe(true);
    });
  });

  describe('5. Invalidation of Stale Exceptions on Roster or Capacity Changes', () => {
    it('invalidates prior exception when capacity changes', async () => {
      await repository.switchPersona('user_admin');
      // Approve exception for Questioner
      await repository.approveSessionRoleException(
        'sess_jaipur_01',
        'Questioner',
        'Pilot demo exception for Aarav',
        'user_admin'
      );

      let session = await repository.getSession('sess_jaipur_01');
      expect(session?.roleAllocations?.['Questioner']?.status).toBe('finalized_exception');

      // Update capacity from 1 to 2
      session = await repository.updateSessionRoleCapacity('sess_jaipur_01', 'Questioner', 2, 'user_admin');
      const alloc = session.roleAllocations?.['Questioner'];
      expect(alloc?.status).toBe('pending');
      expect(alloc?.isException).toBe(false);
      expect(alloc?.exceptionAudit).toBeUndefined();
      expect(alloc?.totalPlaces).toBe(2);

      // Verify exception_invalidated audit
      const audits = await repository.getAllocationAudits(alloc?.allocationId, 'user_admin');
      expect(audits.some((a) => a.action === 'exception_invalidated')).toBe(true);
    });

    it('invalidates prior exception when role occupant is withdrawn', async () => {
      await repository.switchPersona('user_admin');
      // Approve exception for Questioner
      await repository.approveSessionRoleException(
        'sess_jaipur_01',
        'Questioner',
        'Pilot demo exception for Aarav',
        'user_admin'
      );

      // Withdraw Aarav
      const session = await repository.withdrawSessionRole('sess_jaipur_01', 'user_aarav', 'user_admin');
      const alloc = session.roleAllocations?.['Questioner'];
      expect(alloc?.status).toBe('pending');
      expect(alloc?.isException).toBe(false);
      expect(alloc?.exceptionAudit).toBeUndefined();
    });

    it('invalidates prior exception when role occupant is replaced', async () => {
      await repository.switchPersona('user_admin');
      // Approve exception for Synthesiser (occupied by Siddharth, 1 place)
      await repository.approveSessionRoleException(
        'sess_jaipur_01',
        'Synthesiser',
        'Pilot demo exception for Siddharth',
        'user_admin'
      );

      let session = await repository.getSession('sess_jaipur_01');
      expect(session?.roleAllocations?.['Synthesiser']?.status).toBe('finalized_exception');

      // Replace Siddharth with eligible candidate Ananya
      session = await repository.replaceSessionRole('sess_jaipur_01', 'user_siddharth', 'user_ananya', 'Synthesiser', 'user_admin');
      const alloc = session.roleAllocations?.['Synthesiser'];
      // The prior exception must be invalidated
      expect(alloc?.isException).toBe(false);
      expect(alloc?.exceptionAudit).toBeUndefined();
    });

    it('invalidates prior exception when role occupant changes role', async () => {
      await repository.switchPersona('user_admin');
      // Approve exception for Facilitator (Rohan)
      await repository.approveSessionRoleException(
        'sess_jaipur_01',
        'Facilitator',
        'Pilot demo exception for Rohan',
        'user_admin'
      );

      // First make Civic Advocate available by withdrawing Vikram
      await repository.withdrawSessionRole('sess_jaipur_01', 'user_vikram', 'user_admin');
      // Approve exception on Civic Advocate for testing
      await repository.approveSessionRoleException(
        'sess_jaipur_01',
        'Civic Advocate',
        'Pilot exception for empty Civic Advocate',
        'user_admin'
      );

      // Change Rohan from Facilitator to Civic Advocate (with platform_admin override)
      const session = await repository.changeSessionRole('sess_jaipur_01', 'user_rohan', 'Civic Advocate', 'user_admin');
      const facAlloc = session.roleAllocations?.['Facilitator'];
      // Prior Facilitator exception invalidated
      expect(facAlloc?.isException).toBe(false);
      expect(facAlloc?.exceptionAudit).toBeUndefined();
    });
  });

  describe('6. Privacy Projections for Small Cohorts & Non-Owners', () => {
    it('suppresses category counts and occupant details for 1-place role for non-owner', async () => {
      await repository.switchPersona('user_admin');
      // Approve exception on Facilitator
      await repository.approveSessionRoleException(
        'sess_jaipur_01',
        'Facilitator',
        'Pilot demo exception for Rohan',
        'user_admin'
      );

      // Non-owner query (user_aarav)
      await repository.switchPersona('user_aarav');
      const session = await repository.getSession('sess_jaipur_01');
      const facAlloc = session?.roleAllocations?.['Facilitator'];

      expect(facAlloc?.isPrivacySuppressed).toBe(true);
      expect(facAlloc?.reservedOccupiedCount).toBeUndefined();
      expect(facAlloc?.ordinaryOccupiedCount).toBeUndefined();
      expect(facAlloc?.vacanciesCount).toBeUndefined();
      expect(facAlloc?.exceptionAudit).toBeUndefined();
      expect(facAlloc?.reservedOccupants).toBeUndefined();
      expect(facAlloc?.ordinaryOccupants).toBeUndefined();
      expect(facAlloc?.confirmedOccupants).toBeUndefined();

      // Public transparent parameters remain intact
      expect(facAlloc?.totalPlaces).toBe(1);
      expect(facAlloc?.reservedMinimum).toBe(1);
      expect(facAlloc?.ordinaryPlaces).toBe(0);
    });

    it('provides full unredacted allocation details to Platform Owner', async () => {
      await repository.switchPersona('user_admin');
      const session = await repository.getSession('sess_jaipur_01');
      const facAlloc = session?.roleAllocations?.['Facilitator'];

      expect(facAlloc?.isPrivacySuppressed).toBeFalsy();
      expect(facAlloc?.reservedOccupiedCount).toBeDefined();
      expect(facAlloc?.ordinaryOccupiedCount).toBeDefined();
      expect(facAlloc?.vacanciesCount).toBeDefined();
      expect(facAlloc?.confirmedOccupants).toBeDefined();
    });

    it('sanitizes debateData.roleAllocations in projectSessionForCaller', () => {
      const db = PersistenceService.loadDatabase();
      const rawSession = db.sessions.find((s) => s.id === 'sess_jaipur_01')!;

      const nonOwner = { id: 'user_aarav', role: 'student' };
      const projected = projectSessionForCaller(rawSession, nonOwner);

      const roleAlloc = projected.roleAllocations?.['Facilitator'];
      const debateAlloc = projected.debateData?.roleAllocations?.['Facilitator'];

      expect(roleAlloc?.isPrivacySuppressed).toBe(true);
      expect(debateAlloc?.isPrivacySuppressed).toBe(true);
      expect(roleAlloc?.reservedOccupants).toBeUndefined();
      expect(debateAlloc?.reservedOccupants).toBeUndefined();
    });
  });

  describe('7. Mode Transitions, Integration Invariants & Migration Reload', () => {
    it('preserves role allocations across session mode transitions', async () => {
      await repository.switchPersona('user_admin');
      const before = await repository.getSession('sess_jaipur_01');
      expect(before?.roleAllocations).toBeDefined();

      // Transition from debate_room to youth_assembly mode
      const transitioned = await repository.switchSessionMode('sess_jaipur_01', 'user_rohan', 'youth_assembly');
      expect(transitioned.currentMode).toBe('youth_assembly');
      expect(transitioned.roleAllocations).toBeDefined();
      expect(Object.keys(transitioned.roleAllocations!).length).toBe(7);

      // Transition back to debate_room mode
      const back = await repository.switchSessionMode('sess_jaipur_01', 'user_rohan', 'debate_room');
      expect(back.currentMode).toBe('debate_room');
      expect(back.roleAllocations).toBeDefined();
      expect(Object.keys(back.roleAllocations!).length).toBe(7);
      expect(back.debateData?.roleAllocations).toBeDefined();
    });

    it('preserves speaking queue, debate phase, and motions during role operations', async () => {
      await repository.switchPersona('user_admin');
      // Withdraw and replace an occupant
      await repository.replaceSessionRole(
        'sess_jaipur_01',
        'user_priya',
        'user_ananya',
        'Evidence Analyst',
        'user_admin'
      );

      const session = await repository.getSession('sess_jaipur_01');
      expect(session?.debateData?.motion).toContain('tabletop pedestrian crosswalks');
      expect(session?.debateData?.currentPhase).toBe('DISCUSSION');
      expect(session?.debateData?.speakingQueue.length).toBeGreaterThan(0);
      expect(session?.debateData?.rulebook.version).toBe('v1.0');
    });

    it('normalizes legacy sessions lacking roleAllocations or rolePlanStage', () => {
      const db = PersistenceService.loadDatabase();
      const legacySession: Session = {
        id: 'sess_legacy_01',
        eventId: 'evt_jaipur_assembly_01',
        assemblyId: 'assembly_jaipur_pedestrian_2026',
        title: 'Legacy Debate Room',
        agenda: [],
        resources: [],
        schemaVersion: 1,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      } as unknown as Session;

      db.sessions.push(legacySession);
      const normalized = normalizeSessionRecords(db);
      const loaded = normalized.sessions.find((s) => s.id === 'sess_legacy_01');

      expect(loaded?.rolePlanStage).toBe('open_selection');
      expect(loaded?.roleAllocations).toBeDefined();
      for (const role of CANONICAL_DEBATE_ROLES) {
        expect(loaded?.roleAllocations?.[role]).toBeDefined();
        expect(loaded?.roleAllocations?.[role].totalPlaces).toBe(1);
        expect(loaded?.roleAllocations?.[role].reservedMinimum).toBe(1);
      }
    });

    it('provides debate-specific alias methods matching session methods', async () => {
      await repository.switchPersona('user_admin');
      const allocs = await repository.getDebateRoleAllocations('sess_jaipur_01', 'user_admin');
      expect(allocs['Facilitator']).toBeDefined();

      // Finalize alias (Rapporteur is occupied by Isha, eligible!)
      const sess = await repository.finalizeDebateRoleAllocation('sess_jaipur_01', 'Rapporteur', 'user_admin');
      expect(sess.roleAllocations?.['Rapporteur'].status).toBe('finalized_compliant');

      // Exception alias
      const { session: excSess } = await repository.approveDebateRoleException(
        'sess_jaipur_01',
        'Synthesiser',
        'Audited exception for synthesiser role via alias',
        'user_admin'
      );
      expect(excSess.roleAllocations?.['Synthesiser'].status).toBe('finalized_exception');

      // Capacity alias
      const capSess = await repository.updateDebateRoleCapacity('sess_jaipur_01', 'Synthesiser', 3, 'user_admin');
      expect(capSess.roleAllocations?.['Synthesiser'].totalPlaces).toBe(3);
    });
  });
});
