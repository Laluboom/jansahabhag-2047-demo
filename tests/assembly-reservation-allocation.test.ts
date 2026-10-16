import { describe, it, expect, beforeEach } from 'vitest';
import { demoRepository } from '../src/services/demoRepository';
import {
  calculateReservedMinimum,
  canUserClaimRoleAllocation,
  buildAssemblyRoleAllocations,
  projectAssemblyForCaller,
  POLICY_VERSION,
} from '../src/services/reservationAllocationService';
import { DemoRepository } from '../src/services/repository';
import { LocalDemoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';

describe('Assembly Named Role Reservation Allocation (Package 08B)', () => {
  let repository: DemoRepository;

  beforeEach(() => {
    localStorage.clear();
    PersistenceService.resetDatabase();
    repository = new LocalDemoRepository();
  });

  describe('1. Per-Named-Role Allocation Quotas & Formula', () => {
    it('applies ceil(0.33 * allocatedPlaces) independently to every singular and multi-place named role', () => {
      // 1 place (Chair, Co-Chair, Facilitator, 3-person mode): ceil(0.33 * 1) = 1
      expect(calculateReservedMinimum(1)).toBe(1);
      // 2 places: ceil(0.33 * 2) = 1
      expect(calculateReservedMinimum(2)).toBe(1);
      // 3 places: ceil(0.33 * 3) = 1
      expect(calculateReservedMinimum(3)).toBe(1);
      // 4 places: ceil(0.33 * 4) = 2
      expect(calculateReservedMinimum(4)).toBe(2);
      // 6 places (Default standard assembly functional zones): ceil(0.33 * 6) = 2
      expect(calculateReservedMinimum(6)).toBe(2);
    });

    it('builds separate allocations for Chair, Facilitator, and 4 functional zones without pooling', () => {
      const allocations = buildAssemblyRoleAllocations({
        assemblyId: 'assembly_jaipur_pedestrian_2026',
        chairId: 'user_rohan',
        facilitatorId: 'user_rohan',
        plannedPlacesOverrides: {
          Chair: 1,
          Facilitator: 1,
          Thinker: 6,
          Enabler: 6,
          Troubleshooter: 6,
          Shaper: 6,
        },
      });

      // Chair singular role allocation
      expect(allocations['Chair']).toBeDefined();
      expect(allocations['Chair'].totalPlaces).toBe(1);
      expect(allocations['Chair'].reservedMinimum).toBe(1);
      expect(allocations['Chair'].ordinaryPlaces).toBe(0);

      // Facilitator singular role allocation
      expect(allocations['Facilitator']).toBeDefined();
      expect(allocations['Facilitator'].totalPlaces).toBe(1);
      expect(allocations['Facilitator'].reservedMinimum).toBe(1);
      expect(allocations['Facilitator'].ordinaryPlaces).toBe(0);

      // Functional zone allocations
      for (const role of ['Thinker', 'Enabler', 'Troubleshooter', 'Shaper']) {
        expect(allocations[role]).toBeDefined();
        expect(allocations[role].totalPlaces).toBe(6);
        expect(allocations[role].reservedMinimum).toBe(2);
        expect(allocations[role].ordinaryPlaces).toBe(4);
      }
    });

    it('supports Co-Chair allocation when configured', () => {
      const allocations = buildAssemblyRoleAllocations({
        assemblyId: 'test_assembly',
        chairId: 'user_rohan',
        coChairId: 'user_ananya',
        plannedPlacesOverrides: {
          'Co-Chair': 1,
        },
      });

      expect(allocations['Co-Chair']).toBeDefined();
      expect(allocations['Co-Chair'].totalPlaces).toBe(1);
      expect(allocations['Co-Chair'].reservedMinimum).toBe(1);
      expect(allocations['Co-Chair'].confirmedOccupants).toContain('user_ananya');
    });

    it('allocates separate secondary roles in three-person mini-deliberation mode', () => {
      const allocations = buildAssemblyRoleAllocations({
        assemblyId: 'mini_assembly',
        isThreePersonMiniMode: true,
        roles: [
          {
            id: 'r1',
            assemblyId: 'mini_assembly',
            userId: 'user_ananya',
            roleName: 'Thinker',
            secondaryRoleName: 'Enabler',
            power: 'Question Setter',
            lens: 'Critical Inquiry',
            responsibilities: [],
            promptSuggestions: [],
            powerActionDescription: '',
            responseObligation: '',
            badgeIcon: 'Sparkles',
            schemaVersion: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      expect(allocations['Secondary Enabler']).toBeDefined();
      expect(allocations['Secondary Enabler'].totalPlaces).toBe(1);
      expect(allocations['Secondary Enabler'].reservedMinimum).toBe(1);
      expect(allocations['Secondary Enabler'].confirmedOccupants).toContain('user_ananya');
    });
  });

  describe('2. Quota Claim Rules, Vacancies & Denial of Unqualified Occupants', () => {
    it('prevents ineligible/undeclared participant from claiming 1-place Chair without exception', () => {
      const chairAlloc = buildAssemblyRoleAllocations({
        assemblyId: 'test_asm',
        plannedPlacesOverrides: { Chair: 1 },
      })['Chair'];

      // user_aarav is undeclared/ineligible for women's reservation
      const claimResult = canUserClaimRoleAllocation(chairAlloc, 'user_aarav', undefined, false);
      expect(claimResult.allowed).toBe(false);
      expect(claimResult.reason).toContain('reservation policy');
    });

    it('allows eligible participant to claim 1-place Chair reserved place', () => {
      const chairAlloc = buildAssemblyRoleAllocations({
        assemblyId: 'test_asm',
        plannedPlacesOverrides: { Chair: 1 },
      })['Chair'];

      // user_ananya is eligible under fictional reservation declarations
      const claimResult = canUserClaimRoleAllocation(chairAlloc, 'user_ananya', undefined, false);
      expect(claimResult.allowed).toBe(true);
      expect(claimResult.placeType).toBe('reserved');
    });

    it('holds unmet reserved places vacant when ordinary places are exhausted', () => {
      // 6-place Thinker allocation: 2 reserved, 4 ordinary
      // Seed with 4 ineligible participants filling ordinary places
      const thinkerAlloc = buildAssemblyRoleAllocations({
        assemblyId: 'test_asm',
        roles: [
          { id: '1', assemblyId: 'test_asm', userId: 'user_aarav', roleName: 'Thinker', power: 'Question Setter', lens: '', responsibilities: [], promptSuggestions: [], powerActionDescription: '', responseObligation: '', badgeIcon: '', schemaVersion: 1, createdAt: '', updatedAt: '' },
          { id: '2', assemblyId: 'test_asm', userId: 'user_vikram', roleName: 'Thinker', power: 'Question Setter', lens: '', responsibilities: [], promptSuggestions: [], powerActionDescription: '', responseObligation: '', badgeIcon: '', schemaVersion: 1, createdAt: '', updatedAt: '' },
          { id: '3', assemblyId: 'test_asm', userId: 'user_kabir', roleName: 'Thinker', power: 'Question Setter', lens: '', responsibilities: [], promptSuggestions: [], powerActionDescription: '', responseObligation: '', badgeIcon: '', schemaVersion: 1, createdAt: '', updatedAt: '' },
          { id: '4', assemblyId: 'test_asm', userId: 'user_rohan', roleName: 'Thinker', power: 'Question Setter', lens: '', responsibilities: [], promptSuggestions: [], powerActionDescription: '', responseObligation: '', badgeIcon: '', schemaVersion: 1, createdAt: '', updatedAt: '' },
        ],
        plannedPlacesOverrides: { Thinker: 6 },
      })['Thinker'];

      expect(thinkerAlloc.ordinaryOccupiedCount).toBe(4);
      expect(thinkerAlloc.reservedOccupiedCount).toBe(0);
      expect(thinkerAlloc.vacanciesCount).toBe(2);

      // Fifth ineligible participant cannot claim vacant reserved place
      const nextClaim = canUserClaimRoleAllocation(thinkerAlloc, 'user_tutor_meera_id', undefined, false);
      expect(nextClaim.allowed).toBe(false);
      expect(nextClaim.reason).toContain('reservation policy');
    });

    it('rejects joining preferred role if that role reservation quota is full', async () => {
      // Chair is 1 place reserved. Rohan (ineligible) is Chair in pedestrian assembly.
      // Another ineligible user trying to request Chair or overbooked role is rejected
      await expect(
        repository.joinAssembly(
          'assembly_jaipur_pedestrian_2026',
          'user_aarav',
          'Chair' as any
        )
      ).rejects.toThrow();
    });
  });

  describe('3. Finalization Guard & Platform Owner Audited Exception', () => {
    it('denies finalization of non-compliant role allocation without mutating persistent state', async () => {
      await repository.switchPersona('user_admin');
      // Rohan (ineligible) is Chair in pedestrian assembly with no approved exception
      await expect(
        repository.finalizeAssemblyRoleAllocation(
          'assembly_jaipur_pedestrian_2026',
          'Chair',
          'user_admin' // Platform Owner attempting finalization
        )
      ).rejects.toThrow(/33% reservation requirement unmet/i);

      // Verify status remains non-compliant and not finalized
      const asm = await repository.getAssembly('assembly_jaipur_pedestrian_2026', 'user_admin');
      expect(asm?.roleAllocations?.['Chair']?.status).not.toBe('finalized_compliant');
      expect(asm?.roleAllocations?.['Chair']?.status).not.toBe('finalized_exception');
    });

    it('rejects participant or facilitator spoof of Platform Owner exception approval', async () => {
      // Active user is user_aarav. Try to approve exception pretending to be user_admin
      await expect(
        repository.approveAssemblyRoleException(
          'assembly_jaipur_pedestrian_2026',
          'Chair',
          'Substantive justification reason for pilot',
          'user_admin' // actorId mismatches active persona user_aarav
        )
      ).rejects.toThrow(/Spoof attempt rejected/i);

      // Facilitator attempting exception approval is rejected
      await repository.switchPersona('user_rohan'); // Facilitator persona
      await expect(
        repository.approveAssemblyRoleException(
          'assembly_jaipur_pedestrian_2026',
          'Chair',
          'Facilitator override justification',
          'user_rohan'
        )
      ).rejects.toThrow(/Only Platform Owner.*can approve reservation exceptions/i);
    });

    it('rejects exception approval without substantive reason (minimum 5 characters)', async () => {
      await repository.switchPersona('user_admin'); // Platform Owner persona
      await expect(
        repository.approveAssemblyRoleException(
          'assembly_jaipur_pedestrian_2026',
          'Chair',
          'test', // 4 characters < 5
          'user_admin'
        )
      ).rejects.toThrow(/substantive reason.*minimum 5 characters/i);
    });

    it('allows Platform Owner to approve audited exception and visibly marks status', async () => {
      await repository.switchPersona('user_admin');
      const { assembly, audit } = await repository.approveAssemblyRoleException(
        'assembly_jaipur_pedestrian_2026',
        'Chair',
        'Fictional pilot demo: Rohan retains Chair role under documented owner exception.',
        'user_admin'
      );

      // Status is finalized_exception, visibly distinct from finalized_compliant
      const chairAlloc = assembly.roleAllocations?.['Chair'];
      expect(chairAlloc?.status).toBe('finalized_exception');
      expect(chairAlloc?.isException).toBe(true);
      expect(chairAlloc?.exceptionAudit).toBeDefined();
      expect(chairAlloc?.exceptionAudit?.reason).toContain('Rohan retains Chair role');
      expect(chairAlloc?.exceptionAudit?.policyVersion).toBe(POLICY_VERSION);
      expect(audit.action).toBe('exception_approved');

      // Audit is stored in allocationAudits
      const audits = await repository.getAllocationAudits(chairAlloc?.allocationId, 'user_admin');
      expect(audits.some((a) => a.action === 'exception_approved')).toBe(true);
    });
  });

  describe('4. Invalidation on Roster or Capacity Changes', () => {
    it('invalidates prior exception when capacity changes', async () => {
      await repository.switchPersona('user_admin');
      // First approve exception for Thinker
      await repository.approveAssemblyRoleException(
        'assembly_jaipur_pedestrian_2026',
        'Thinker',
        'Initial exception for testing capacity change invalidation',
        'user_admin'
      );

      let asm = await repository.getAssembly('assembly_jaipur_pedestrian_2026', 'user_admin');
      expect(asm?.roleAllocations?.['Thinker']?.status).toBe('finalized_exception');

      // Now update Thinker capacity from 6 to 8
      asm = await repository.updateAssemblyRoleCapacity(
        'assembly_jaipur_pedestrian_2026',
        'Thinker',
        8,
        'user_admin'
      );

      // Prior exception must be invalidated and reverted to pending
      const thinkerAlloc = asm.roleAllocations?.['Thinker'];
      expect(thinkerAlloc?.status).toBe('pending');
      expect(thinkerAlloc?.isException).toBe(false);
      expect(thinkerAlloc?.exceptionAudit).toBeUndefined();
      expect(thinkerAlloc?.totalPlaces).toBe(8);
      expect(thinkerAlloc?.reservedMinimum).toBe(3); // ceil(0.33 * 8) = 3

      // Audit recorded for invalidation
      const audits = await repository.getAllocationAudits(thinkerAlloc?.allocationId, 'user_admin');
      expect(audits.some((a) => a.action === 'exception_invalidated')).toBe(true);
    });

    it('invalidates prior exception when a participant withdraws/leaves', async () => {
      await repository.switchPersona('user_admin');
      // Approve exception for Thinker
      await repository.approveAssemblyRoleException(
        'assembly_jaipur_pedestrian_2026',
        'Thinker',
        'Temporary exception prior to withdrawal',
        'user_admin'
      );

      // Priya (Thinker occupant) leaves the assembly
      await repository.leaveAssembly(
        'assembly_jaipur_pedestrian_2026',
        'user_priya',
        'user_admin'
      );

      const asm = await repository.getAssembly('assembly_jaipur_pedestrian_2026', 'user_admin');
      const thinkerAlloc = asm?.roleAllocations?.['Thinker'];
      expect(thinkerAlloc?.status).toBe('pending');
      expect(thinkerAlloc?.isException).toBe(false);
    });
  });

  describe('5. Privacy Projections for Small Cohorts & Non-Owners', () => {
    it('withholds breakdown counts and exception details for non-owners in small cohorts', async () => {
      await repository.switchPersona('user_admin');
      // Approve exception on Chair (1 place cohort)
      await repository.approveAssemblyRoleException(
        'assembly_jaipur_pedestrian_2026',
        'Chair',
        'Confidential domain expertise reason',
        'user_admin'
      );

      // Now query as regular participant (user_aarav)
      await repository.switchPersona('user_aarav');
      const asm = await repository.getAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');
      const chairAlloc = asm?.roleAllocations?.['Chair'];

      expect(chairAlloc?.isPrivacySuppressed).toBe(true);
      expect(chairAlloc?.reservedOccupiedCount).toBeUndefined();
      expect(chairAlloc?.ordinaryOccupiedCount).toBeUndefined();
      expect(chairAlloc?.vacanciesCount).toBeUndefined();
      expect(chairAlloc?.exceptionAudit).toBeUndefined();
      // Total places and rule formula remain public
      expect(chairAlloc?.totalPlaces).toBe(1);
      expect(chairAlloc?.reservedMinimum).toBe(1);
    });

    it('provides full allocation and audit details to Platform Owner', async () => {
      await repository.switchPersona('user_admin');
      const asm = await repository.getAssembly('assembly_jaipur_pedestrian_2026', 'user_admin');
      const chairAlloc = asm?.roleAllocations?.['Chair'];

      expect(chairAlloc?.isPrivacySuppressed).toBeFalsy();
      expect(chairAlloc?.reservedOccupiedCount).toBeDefined();
      expect(chairAlloc?.ordinaryOccupiedCount).toBeDefined();
      expect(chairAlloc?.vacanciesCount).toBeDefined();
    });
  });

  describe('6. Role Power Execution Barrier for Denied/Unconfirmed Occupants', () => {
    it('rejects execution of role powers if occupant is not confirmed in role allocation', async () => {
      // In Jaipur pedestrian assembly, user_aarav is a Thinker.
      // Trying to execute power as user_kabir (who is not confirmed in Thinker) must be rejected
      await expect(
        repository.executeRolePowerAction({
          assemblyId: 'assembly_jaipur_pedestrian_2026',
          userId: 'user_kabir',
          power: 'Question Setter',
          title: 'Unauthorized Inquiry',
          description: 'Executing power without confirmed role allocation',
        })
      ).rejects.toThrow();
    });
  });

  describe('7. Legacy Seed Migration & Non-Compliant Initialization', () => {
    it('marks seeded role allocations as unvalidated_legacy or pending rather than compliant', async () => {
      await repository.switchPersona('user_admin');
      const asm = await repository.getAssembly('assembly_jaipur_pedestrian_2026', 'user_admin');
      expect(asm?.roleAllocations).toBeDefined();

      for (const [roleName, alloc] of Object.entries(asm!.roleAllocations!)) {
        // Never labeled compliant without validation
        expect(alloc.status).not.toBe('finalized_compliant');
      }
    });
  });

  describe('8. Low-Occupancy Privacy Protection for 1–3 Confirmed Occupants (Gap 1)', () => {
    it('suppresses category counts, vacancies, and status for 6-place role with 1 occupant across all repository outputs', async () => {
      // In Jaipur pedestrian assembly, Shaper is a 6-place role with exactly 1 confirmed occupant: user_siddharth.
      // 1 occupant in a 6-place role would leak Siddharth's reservation status if category breakdown or vacancies were visible.

      // 1. getAssembly (non-owner perspective: user_aarav)
      await repository.switchPersona('user_aarav');
      const asm = await repository.getAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');
      expect(asm).toBeDefined();
      const shaperAlloc = asm?.roleAllocations?.['Shaper'];
      expect(shaperAlloc).toBeDefined();

      // Suppression active
      expect(shaperAlloc?.isPrivacySuppressed).toBe(true);
      expect(shaperAlloc?.reservedOccupiedCount).toBeUndefined();
      expect(shaperAlloc?.ordinaryOccupiedCount).toBeUndefined();
      expect(shaperAlloc?.vacanciesCount).toBeUndefined();
      expect(shaperAlloc?.isException).toBe(false);
      expect(shaperAlloc?.exceptionAudit).toBeUndefined();
      expect(shaperAlloc?.reservedOccupants).toBeUndefined();
      expect(shaperAlloc?.ordinaryOccupants).toBeUndefined();
      expect(shaperAlloc?.confirmedOccupants).toBeUndefined();

      // Formula and total capacity remain transparent
      expect(shaperAlloc?.totalPlaces).toBe(6);
      expect(shaperAlloc?.reservedMinimum).toBe(2);
      expect(shaperAlloc?.ordinaryPlaces).toBe(4);
      expect(shaperAlloc?.status).toBe('unvalidated_legacy');
      expect(shaperAlloc?.status).not.toBe('finalized_compliant');
      expect(shaperAlloc?.status).not.toBe('finalized_exception');

      // 2. getAssemblies (non-owner perspective)
      const assemblies = await repository.getAssemblies();
      const jaipurFromList = assemblies.find((a) => a.id === 'assembly_jaipur_pedestrian_2026');
      const shaperFromList = jaipurFromList?.roleAllocations?.['Shaper'];
      expect(shaperFromList?.isPrivacySuppressed).toBe(true);
      expect(shaperFromList?.reservedOccupiedCount).toBeUndefined();
      expect(shaperFromList?.ordinaryOccupiedCount).toBeUndefined();
      expect(shaperFromList?.vacanciesCount).toBeUndefined();
      expect(shaperFromList?.totalPlaces).toBe(6);

      // 3. getDashboard (non-owner perspective)
      const dashboard = await repository.getDashboard('user_aarav');
      const jaipurFromDash = dashboard.activeAssemblies.find((a) => a.id === 'assembly_jaipur_pedestrian_2026');
      const shaperFromDash = jaipurFromDash?.roleAllocations?.['Shaper'];
      expect(shaperFromDash?.isPrivacySuppressed).toBe(true);
      expect(shaperFromDash?.reservedOccupiedCount).toBeUndefined();
      expect(shaperFromDash?.ordinaryOccupiedCount).toBeUndefined();
      expect(shaperFromDash?.vacanciesCount).toBeUndefined();
      expect(shaperFromDash?.totalPlaces).toBe(6);

      // 4. getAssemblyRoleAllocations (non-owner perspective)
      const allocations = await repository.getAssemblyRoleAllocations('assembly_jaipur_pedestrian_2026', 'user_aarav');
      const shaperFromAllocs = allocations['Shaper'];
      expect(shaperFromAllocs?.isPrivacySuppressed).toBe(true);
      expect(shaperFromAllocs?.reservedOccupiedCount).toBeUndefined();
      expect(shaperFromAllocs?.ordinaryOccupiedCount).toBeUndefined();
      expect(shaperFromAllocs?.vacanciesCount).toBeUndefined();
      expect(shaperFromAllocs?.totalPlaces).toBe(6);

      // 5. Platform Owner gets full unredacted view
      await repository.switchPersona('user_admin');
      const ownerAllocs = await repository.getAssemblyRoleAllocations('assembly_jaipur_pedestrian_2026', 'user_admin');
      const ownerShaper = ownerAllocs['Shaper'];
      expect(ownerShaper?.isPrivacySuppressed).toBeFalsy();
      expect(ownerShaper?.reservedOccupiedCount).toBe(0);
      expect(ownerShaper?.ordinaryOccupiedCount).toBe(1);
      expect(ownerShaper?.vacanciesCount).toBe(2);
      expect(ownerShaper?.confirmedOccupants).toContain('user_siddharth');
    });
  });

  describe('9. Contribution Admission Barrier & Zero Side Effects (Gap 2)', () => {
    it('denies contribution by unadmitted persona and guarantees zero state mutation', async () => {
      // user_neha is not joined to assembly_jaipur_pedestrian_2026
      const unadmittedUserId = 'user_neha';
      const assemblyId = 'assembly_jaipur_pedestrian_2026';

      await repository.switchPersona('user_admin');
      const initialAsm = await repository.getAssembly(assemblyId, 'user_admin');
      expect(initialAsm?.participantUserIds).not.toContain(unadmittedUserId);
      const initialParticipantCount = initialAsm!.participantUserIds.length;

      const initialCredits = await repository.getCredits(unadmittedUserId);
      const initialActivities = await repository.getActivities(unadmittedUserId);
      const initialPassport = await repository.getPassport(unadmittedUserId);
      const initialNotifs = await repository.getNotifications(unadmittedUserId);
      const initialContribs = await repository.getContributions(assemblyId);

      // Direct contribution attempt without admission must be rejected
      await expect(
        repository.addAssemblyContribution({
          assemblyId,
          userId: unadmittedUserId,
          stage: 'think',
          type: 'argument',
          text: 'This is an unauthorized contribution attempt without joining.',
        })
      ).rejects.toThrow(/not an admitted participant/i);

      // Verify zero side effects across all data dimensions
      const postAsm = await repository.getAssembly(assemblyId, 'user_admin');
      expect(postAsm?.participantUserIds).not.toContain(unadmittedUserId);
      expect(postAsm?.participantUserIds.length).toBe(initialParticipantCount);

      const postCredits = await repository.getCredits(unadmittedUserId);
      expect(postCredits.length).toBe(initialCredits.length);

      const postActivities = await repository.getActivities(unadmittedUserId);
      expect(postActivities.length).toBe(initialActivities.length);

      const postPassport = await repository.getPassport(unadmittedUserId);
      expect(postPassport.entries.length).toBe(initialPassport.entries.length);

      const postNotifs = await repository.getNotifications(unadmittedUserId);
      expect(postNotifs.length).toBe(initialNotifs.length);

      const postContribs = await repository.getContributions(assemblyId);
      expect(postContribs.length).toBe(initialContribs.length);
    });

    it('preserves ability of already admitted seeded participant with valid role to contribute', async () => {
      // Priya is an admitted participant in Jaipur assembly with confirmed Thinker role
      const contrib = await repository.addAssemblyContribution({
        assemblyId: 'assembly_jaipur_pedestrian_2026',
        userId: 'user_priya',
        stage: 'think',
        type: 'argument',
        text: 'Legitimate substantive contribution by admitted delegate Priya.',
      });

      expect(contrib.id).toBeDefined();
      expect(contrib.userId).toBe('user_priya');
      expect(contrib.isSubstantive).toBe(true);
    });
  });

  describe('10. Three-Person Secondary Role Reservation Quotas (Gap 3)', () => {
    it('leaves secondary role place vacant and retains truthful 3-person mode when 3rd participant is ineligible', async () => {
      // Construct an isolated mini-assembly with 2 participants (Vikram, Kabir)
      const db = PersistenceService.loadDatabase();
      const miniAssemblyId = 'assembly_mini_3p_test';
      db.assemblies.push({
        id: miniAssemblyId,
        programmeId: 'prog_my_community_future',
        title: 'Mini Deliberation Chamber',
        theme: 'Pedestrian Pathways',
        question: 'How to organize rapid school crossings?',
        description: 'Test 3-person assembly',
        location: 'Jaipur',
        scheduledDate: '2026-11-01T10:00:00Z',
        currentStage: 'think',
        status: 'deliberating',
        participantUserIds: ['user_vikram', 'user_kabir'],
        facilitatorId: 'user_rohan',
        chairId: 'user_rohan',
        evidenceIds: [],
        rulebook: db.assemblies[0].rulebook,
        speakingQueue: [],
        roleActions: [],
        roleOverrideAudits: [],
        rolePlanStage: 'planned',
        schemaVersion: 1,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      });
      // Vikram is Thinker, Kabir is Enabler
      db.assemblyRoles.push(
        {
          id: 'role_mini_vikram',
          assemblyId: miniAssemblyId,
          userId: 'user_vikram',
          roleName: 'Thinker',
          responsibilities: [],
          power: 'Question Setter',
          promptSuggestions: [],
          schemaVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'role_mini_kabir',
          assemblyId: miniAssemblyId,
          userId: 'user_kabir',
          roleName: 'Enabler',
          responsibilities: [],
          power: 'Feasibility Check',
          promptSuggestions: [],
          schemaVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      PersistenceService.saveDatabase(db);

      // Now Karan (ineligible for women's reservation) joins as 3rd participant
      const joinResult = await repository.joinAssembly(miniAssemblyId, 'user_karan');
      expect(joinResult.assembly.participantUserIds.length).toBe(3);
      expect(joinResult.assembly.isThreePersonMiniMode).toBe(true);

      // Karan received primary role
      expect(joinResult.role.roleName).toBeDefined();

      // Karan CANNOT be granted the 1-place secondary role because he is ineligible!
      // Vikram and Kabir are also ineligible.
      // Therefore, secondary role place is left VACANT rather than silently granted!
      expect(joinResult.role.secondaryRoleName).toBeUndefined();

      const roles = await repository.getAssemblyRoles(miniAssemblyId);
      for (const r of roles) {
        expect(r.secondaryRoleName).toBeUndefined();
      }

      // Check allocation state as platform owner: secondary role exists with 0 occupants and 1 vacancy
      await repository.switchPersona('user_admin');
      const allocs = await repository.getAssemblyRoleAllocations(miniAssemblyId, 'user_admin');
      const secKeys = Object.keys(allocs).filter((k) => k.startsWith('Secondary '));
      expect(secKeys.length).toBeGreaterThanOrEqual(1);
      const vacantSecAlloc = allocs[secKeys[0]];
      expect(vacantSecAlloc.totalPlaces).toBe(1);
      expect(vacantSecAlloc.reservedMinimum).toBe(1);
      expect(vacantSecAlloc.ordinaryPlaces).toBe(0);
      expect(vacantSecAlloc.confirmedOccupants?.length).toBe(0);
      expect(vacantSecAlloc.vacanciesCount).toBe(1);
    });

    it('grants secondary role when an eligible participant joins 3rd in 3-person mode', async () => {
      // Construct an isolated mini-assembly with 2 participants (Vikram, Kabir)
      const db = PersistenceService.loadDatabase();
      const miniAssemblyId = 'assembly_mini_eligible_test';
      db.assemblies.push({
        id: miniAssemblyId,
        programmeId: 'prog_my_community_future',
        title: 'Mini Deliberation Chamber Eligible',
        theme: 'Pedestrian Pathways',
        question: 'How to organize rapid school crossings?',
        description: 'Test 3-person assembly',
        location: 'Jaipur',
        scheduledDate: '2026-11-01T10:00:00Z',
        currentStage: 'think',
        status: 'deliberating',
        participantUserIds: ['user_vikram', 'user_kabir'],
        facilitatorId: 'user_rohan',
        chairId: 'user_rohan',
        evidenceIds: [],
        rulebook: db.assemblies[0].rulebook,
        speakingQueue: [],
        roleActions: [],
        roleOverrideAudits: [],
        rolePlanStage: 'planned',
        schemaVersion: 1,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      });
      db.assemblyRoles.push(
        {
          id: 'role_mini2_vikram',
          assemblyId: miniAssemblyId,
          userId: 'user_vikram',
          roleName: 'Thinker',
          responsibilities: [],
          power: 'Question Setter',
          promptSuggestions: [],
          schemaVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'role_mini2_kabir',
          assemblyId: miniAssemblyId,
          userId: 'user_kabir',
          roleName: 'Enabler',
          responsibilities: [],
          power: 'Feasibility Check',
          promptSuggestions: [],
          schemaVersion: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      );
      PersistenceService.saveDatabase(db);

      // Ananya (eligible for women's reservation) joins as 3rd participant
      const joinResult = await repository.joinAssembly(miniAssemblyId, 'user_ananya');
      expect(joinResult.assembly.participantUserIds.length).toBe(3);
      expect(joinResult.assembly.isThreePersonMiniMode).toBe(true);

      // Ananya is granted the secondary role because she satisfies the 1-place reservation quota!
      expect(joinResult.role.secondaryRoleName).toBeDefined();

      await repository.switchPersona('user_admin');
      const allocs = await repository.getAssemblyRoleAllocations(miniAssemblyId, 'user_admin');
      const secKey = `Secondary ${joinResult.role.secondaryRoleName}`;
      const secAlloc = allocs[secKey];
      expect(secAlloc).toBeDefined();
      expect(secAlloc.totalPlaces).toBe(1);
      expect(secAlloc.reservedMinimum).toBe(1);
      expect(secAlloc.confirmedOccupants).toContain('user_ananya');
    });

    it('overrideAssemblyRole enforces one-place reservation check on secondary role reassignment', async () => {
      // In assembly_public_transit_2026 (3-person assembly):
      // Attempt to reassign secondary role to user_karan (ineligible)
      await repository.switchPersona('user_rohan');
      await expect(
        repository.overrideAssemblyRole(
          'assembly_public_transit_2026',
          'user_rohan',
          'user_karan',
          'Troubleshooter',
          'Testing ineligible secondary override',
          'Shaper'
        )
      ).rejects.toThrow(/reservation policy|cannot assign secondary role/i);

      // Attempt to reassign secondary role to user_meera (eligible)
      const updatedRole = await repository.overrideAssemblyRole(
        'assembly_public_transit_2026',
        'user_rohan',
        'user_meera',
        'Thinker',
        'Valid secondary role reassignment to eligible participant',
        'Troubleshooter'
      );

      expect(updatedRole.roleName).toBe('Thinker');
      expect(updatedRole.secondaryRoleName).toBe('Troubleshooter');

      // Verify Secondary Troubleshooter quota is 1 place without quota pooling
      await repository.switchPersona('user_admin');
      const allocs = await repository.getAssemblyRoleAllocations('assembly_public_transit_2026', 'user_admin');
      const secAlloc = allocs['Secondary Troubleshooter'];
      expect(secAlloc).toBeDefined();
      expect(secAlloc.totalPlaces).toBe(1);
      expect(secAlloc.reservedMinimum).toBe(1);
      expect(secAlloc.ordinaryPlaces).toBe(0);
      expect(secAlloc.confirmedOccupants).toContain('user_meera');
    });
  });

  describe('11. Read Projection Privacy, Filter Semantics & Browser Persona Binding Repair', () => {
    it('active ordinary participant calling getAssemblies("user_admin") sees only a filtered list and never receives private role counts, occupant partitions, or exception audit', async () => {
      // 1. As Platform Owner, approve an exception on Chair role to ensure sensitive audit snapshots exist
      await repository.switchPersona('user_admin');
      await repository.approveAssemblyRoleException(
        'assembly_jaipur_pedestrian_2026',
        'Chair',
        'Confidential administrative pilot justification reason',
        'user_admin'
      );

      // Verify audit is present for owner
      const ownerAsm = await repository.getAssembly('assembly_jaipur_pedestrian_2026', 'user_admin');
      expect(ownerAsm?.roleAllocations?.['Chair']?.exceptionAudit).toBeDefined();

      // In initial seed, user_admin is not a participant of any assembly. Calling getAssemblies('user_admin') returns empty list
      await repository.switchPersona('user_aarav');
      const emptyList = await repository.getAssemblies('user_admin');
      expect(emptyList).toHaveLength(0);

      // Add user_admin as participant in assembly_jaipur_pedestrian_2026 to verify non-empty filtered list
      const db = PersistenceService.loadDatabase();
      const jaipur = db.assemblies.find((a) => a.id === 'assembly_jaipur_pedestrian_2026');
      if (jaipur && !jaipur.participantUserIds.includes('user_admin')) {
        jaipur.participantUserIds.push('user_admin');
      }
      PersistenceService.saveDatabase(db);

      // Active ordinary participant user_aarav calls getAssemblies('user_admin')
      const filteredList = await repository.getAssemblies('user_admin');
      // Must return ONLY the filtered assembly containing user_admin, not all assemblies
      expect(filteredList).toHaveLength(1);
      expect(filteredList[0].id).toBe('assembly_jaipur_pedestrian_2026');

      const chairAlloc = filteredList[0].roleAllocations?.['Chair'];
      expect(chairAlloc).toBeDefined();
      // Crucial privacy invariants: caller must NEVER receive owner-only counts, occupant partitions, or exception audit
      expect(chairAlloc?.isPrivacySuppressed).toBe(true);
      expect(chairAlloc?.reservedOccupiedCount).toBeUndefined();
      expect(chairAlloc?.ordinaryOccupiedCount).toBeUndefined();
      expect(chairAlloc?.vacanciesCount).toBeUndefined();
      expect(chairAlloc?.reservedOccupants).toBeUndefined();
      expect(chairAlloc?.ordinaryOccupants).toBeUndefined();
      expect(chairAlloc?.confirmedOccupants).toBeUndefined();
      expect(chairAlloc?.exceptionAudit).toBeUndefined();
      expect(chairAlloc?.isException).toBe(false);

      // Low-occupancy Shaper role also suppressed
      const shaperAlloc = filteredList[0].roleAllocations?.['Shaper'];
      expect(shaperAlloc?.isPrivacySuppressed).toBe(true);
      expect(shaperAlloc?.reservedOccupiedCount).toBeUndefined();
      expect(shaperAlloc?.confirmedOccupants).toBeUndefined();
    });

    it('active owner gets full details across getAssemblies, getAssembly, and getAssemblyRoleAllocations', async () => {
      await repository.switchPersona('user_admin');
      await repository.approveAssemblyRoleException(
        'assembly_jaipur_pedestrian_2026',
        'Chair',
        'Confidential administrative pilot justification reason',
        'user_admin'
      );

      // 1. getAssemblies
      const assemblies = await repository.getAssemblies();
      const jaipurFromList = assemblies.find((a) => a.id === 'assembly_jaipur_pedestrian_2026');
      const chairFromList = jaipurFromList?.roleAllocations?.['Chair'];
      expect(chairFromList?.isPrivacySuppressed).toBeFalsy();
      expect(chairFromList?.reservedOccupiedCount).toBeDefined();
      expect(chairFromList?.ordinaryOccupiedCount).toBeDefined();
      expect(chairFromList?.vacanciesCount).toBeDefined();
      expect(chairFromList?.confirmedOccupants).toBeDefined();
      expect(chairFromList?.exceptionAudit).toBeDefined();

      // 2. getAssembly
      const detail = await repository.getAssembly('assembly_jaipur_pedestrian_2026', 'user_admin');
      const chairFromDetail = detail?.roleAllocations?.['Chair'];
      expect(chairFromDetail?.isPrivacySuppressed).toBeFalsy();
      expect(chairFromDetail?.reservedOccupiedCount).toBeDefined();
      expect(chairFromDetail?.confirmedOccupants).toBeDefined();
      expect(chairFromDetail?.exceptionAudit).toBeDefined();

      // 3. getAssemblyRoleAllocations
      const allocations = await repository.getAssemblyRoleAllocations('assembly_jaipur_pedestrian_2026', 'user_admin');
      const chairFromAllocs = allocations['Chair'];
      expect(chairFromAllocs?.isPrivacySuppressed).toBeFalsy();
      expect(chairFromAllocs?.reservedOccupiedCount).toBeDefined();
      expect(chairFromAllocs?.confirmedOccupants).toBeDefined();
      expect(chairFromAllocs?.exceptionAudit).toBeDefined();
    });

    it('getAssemblies("user_aarav") keeps prior list filtering and does not return unjoined assemblies', async () => {
      await repository.switchPersona('user_aarav');

      // Before Aarav joins, getAssemblies('user_aarav') must return empty array
      const beforeJoin = await repository.getAssemblies('user_aarav');
      expect(beforeJoin).toHaveLength(0);

      // Querying all assemblies without filter returns full catalogue
      const allAssemblies = await repository.getAssemblies();
      expect(allAssemblies.length).toBeGreaterThanOrEqual(3);

      // Aarav joins Jaipur assembly
      await repository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');

      // After joining, getAssemblies('user_aarav') returns only Jaipur assembly
      const afterJoin = await repository.getAssemblies('user_aarav');
      expect(afterJoin).toHaveLength(1);
      expect(afterJoin[0].id).toBe('assembly_jaipur_pedestrian_2026');

      // All assemblies remains unaffected
      const allAfterJoin = await repository.getAssemblies();
      expect(allAfterJoin.length).toBe(allAssemblies.length);
    });

    it('dashboard and detail remain projected for the active viewer even if another user ID is supplied as a filter where supported', async () => {
      // Ensure Chair has approved exception
      await repository.switchPersona('user_admin');
      await repository.approveAssemblyRoleException(
        'assembly_jaipur_pedestrian_2026',
        'Chair',
        'Confidential domain expertise reason',
        'user_admin'
      );

      // Active viewer is user_aarav (ordinary participant)
      await repository.switchPersona('user_aarav');

      // 1. Dashboard: Calling getDashboard('user_admin') must project assemblies for active viewer user_aarav
      const dash = await repository.getDashboard('user_admin');
      const jaipurFromDash = dash.activeAssemblies.find((a) => a.id === 'assembly_jaipur_pedestrian_2026');
      expect(jaipurFromDash).toBeDefined();
      const chairFromDash = jaipurFromDash?.roleAllocations?.['Chair'];
      expect(chairFromDash?.isPrivacySuppressed).toBe(true);
      expect(chairFromDash?.reservedOccupiedCount).toBeUndefined();
      expect(chairFromDash?.ordinaryOccupiedCount).toBeUndefined();
      expect(chairFromDash?.confirmedOccupants).toBeUndefined();
      expect(chairFromDash?.exceptionAudit).toBeUndefined();

      // 2. Detail: Calling getAssembly('assembly_jaipur_pedestrian_2026', 'user_admin') must remain projected for user_aarav
      const detail = await repository.getAssembly('assembly_jaipur_pedestrian_2026', 'user_admin');
      const chairFromDetail = detail?.roleAllocations?.['Chair'];
      expect(chairFromDetail?.isPrivacySuppressed).toBe(true);
      expect(chairFromDetail?.reservedOccupiedCount).toBeUndefined();
      expect(chairFromDetail?.confirmedOccupants).toBeUndefined();
      expect(chairFromDetail?.exceptionAudit).toBeUndefined();

      // 3. Allocations: Calling getAssemblyRoleAllocations with 'user_admin' must remain projected for user_aarav
      const allocations = await repository.getAssemblyRoleAllocations('assembly_jaipur_pedestrian_2026', 'user_admin');
      const chairFromAllocs = allocations['Chair'];
      expect(chairFromAllocs?.isPrivacySuppressed).toBe(true);
      expect(chairFromAllocs?.reservedOccupiedCount).toBeUndefined();
      expect(chairFromAllocs?.confirmedOccupants).toBeUndefined();
      expect(chairFromAllocs?.exceptionAudit).toBeUndefined();

      // 4. Owner active viewer retains full details even when querying for participant
      await repository.switchPersona('user_admin');
      const ownerDash = await repository.getDashboard('user_aarav');
      const jaipurOwnerDash = ownerDash.activeAssemblies.find((a) => a.id === 'assembly_jaipur_pedestrian_2026');
      expect(jaipurOwnerDash?.roleAllocations?.['Chair']?.isPrivacySuppressed).toBeFalsy();
      expect(jaipurOwnerDash?.roleAllocations?.['Chair']?.reservedOccupiedCount).toBeDefined();

      const ownerDetail = await repository.getAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');
      expect(ownerDetail?.roleAllocations?.['Chair']?.isPrivacySuppressed).toBeFalsy();
      expect(ownerDetail?.roleAllocations?.['Chair']?.reservedOccupiedCount).toBeDefined();
    });

    it('read-only calls without an active persona do not use a supplied ID to manufacture owner access', async () => {
      // Ensure Chair has approved exception
      await repository.switchPersona('user_admin');
      await repository.approveAssemblyRoleException(
        'assembly_jaipur_pedestrian_2026',
        'Chair',
        'Confidential domain expertise reason',
        'user_admin'
      );

      // Simulate logged out / unauthenticated state (activeUserId undefined)
      const db = PersistenceService.loadDatabase();
      (db as any).activeUserId = undefined;
      PersistenceService.saveDatabase(db);

      // 1. getAssemblies('user_admin')
      const assemblies = await repository.getAssemblies('user_admin');
      for (const asm of assemblies) {
        if (asm.roleAllocations?.['Chair']) {
          expect(asm.roleAllocations['Chair'].isPrivacySuppressed).toBe(true);
          expect(asm.roleAllocations['Chair'].reservedOccupiedCount).toBeUndefined();
          expect(asm.roleAllocations['Chair'].confirmedOccupants).toBeUndefined();
        }
      }

      // 2. getAssembly('assembly_jaipur_pedestrian_2026', 'user_admin')
      const detail = await repository.getAssembly('assembly_jaipur_pedestrian_2026', 'user_admin');
      expect(detail).toBeDefined();
      const chairAlloc = detail?.roleAllocations?.['Chair'];
      expect(chairAlloc?.isPrivacySuppressed).toBe(true);
      expect(chairAlloc?.reservedOccupiedCount).toBeUndefined();
      expect(chairAlloc?.confirmedOccupants).toBeUndefined();
      expect(chairAlloc?.exceptionAudit).toBeUndefined();

      // 3. getAssemblyRoleAllocations('assembly_jaipur_pedestrian_2026', 'user_admin')
      const allocs = await repository.getAssemblyRoleAllocations('assembly_jaipur_pedestrian_2026', 'user_admin');
      expect(allocs['Chair']?.isPrivacySuppressed).toBe(true);
      expect(allocs['Chair']?.reservedOccupiedCount).toBeUndefined();
      expect(allocs['Chair']?.confirmedOccupants).toBeUndefined();
      expect(allocs['Chair']?.exceptionAudit).toBeUndefined();

      // 4. getDashboard('user_admin')
      const dash = await repository.getDashboard('user_admin');
      const jaipurFromDash = dash.activeAssemblies.find((a) => a.id === 'assembly_jaipur_pedestrian_2026');
      if (jaipurFromDash?.roleAllocations?.['Chair']) {
        expect(jaipurFromDash.roleAllocations['Chair'].isPrivacySuppressed).toBe(true);
        expect(jaipurFromDash.roleAllocations['Chair'].reservedOccupiedCount).toBeUndefined();
        expect(jaipurFromDash.roleAllocations['Chair'].confirmedOccupants).toBeUndefined();
        expect(jaipurFromDash.roleAllocations['Chair'].exceptionAudit).toBeUndefined();
      }
    });

    it('initializes role allocations on raw assemblies without leaking owner-only category counts or audit details to non-owners', async () => {
      // Strip roleAllocations from an assembly in persistence
      const db = PersistenceService.loadDatabase();
      const jaipur = db.assemblies.find((a) => a.id === 'assembly_jaipur_pedestrian_2026');
      if (jaipur) {
        delete (jaipur as any).roleAllocations;
      }
      PersistenceService.saveDatabase(db);

      // Query as non-owner
      await repository.switchPersona('user_aarav');
      const assemblies = await repository.getAssemblies();
      const jaipurFromList = assemblies.find((a) => a.id === 'assembly_jaipur_pedestrian_2026');
      expect(jaipurFromList?.roleAllocations).toBeDefined();

      const shaperAlloc = jaipurFromList?.roleAllocations?.['Shaper'];
      expect(shaperAlloc).toBeDefined();
      expect(shaperAlloc?.isPrivacySuppressed).toBe(true);
      expect(shaperAlloc?.reservedOccupiedCount).toBeUndefined();
      expect(shaperAlloc?.confirmedOccupants).toBeUndefined();
      expect(shaperAlloc?.exceptionAudit).toBeUndefined();
    });
  });
});
