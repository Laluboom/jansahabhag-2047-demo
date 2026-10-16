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

describe('Assembly Named Role Reservation Allocation (Package 08B)', () => {
  let repository: DemoRepository;

  beforeEach(() => {
    localStorage.clear();
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
});
