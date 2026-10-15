import { describe, it, expect } from 'vitest';
import {
  calculateReservedMinimum,
  buildAllocationState,
  validateAllocation,
  canUserRsvpAllocation,
  finalizeAllocationState,
  approveAllocationExceptionState,
  POLICY_VERSION,
  ALLOCATION_SURFACES_INVENTORY,
} from '../src/services/reservationAllocationService';
import { ReservationEligibility } from '../src/types/domain';

describe('Reservation Allocation Policy Engine (Package 08A)', () => {
  describe('Allocation Surfaces Inventory Note Verification', () => {
    it('documents the boundary between Package 08A and dependent packages', () => {
      expect(ALLOCATION_SURFACES_INVENTORY.package08ACoverage).toContain('shared_reservation_policy_service');
      expect(ALLOCATION_SURFACES_INVENTORY.package08ACoverage).toContain('capacity_limited_event_places');
      expect(ALLOCATION_SURFACES_INVENTORY.package08ACoverage).toContain('event_rsvp_capacity_controls');
      expect(ALLOCATION_SURFACES_INVENTORY.package08ACoverage).toContain('event_check_in_allocation_guards');

      expect(ALLOCATION_SURFACES_INVENTORY.dependentAssemblyDebateCoverage).toContain('assembly_named_roles_quota');
      expect(ALLOCATION_SURFACES_INVENTORY.dependentAssemblyDebateCoverage).toContain('debate_room_speaking_queue_quota');

      expect(ALLOCATION_SURFACES_INVENTORY.programmeCohortStatus).toBeDefined();
    });
  });

  describe('Reserved Minimum Formula & Rounding Boundaries: ceil(0.33 * allocatedPlaces)', () => {
    it('calculates reserved minimum for total 0', () => {
      expect(calculateReservedMinimum(0)).toBe(0);
    });

    it('calculates reserved minimum for totals 1, 2, 3 (small allocations)', () => {
      // 1 place: ceil(0.33 * 1) = ceil(0.33) = 1
      expect(calculateReservedMinimum(1)).toBe(1);
      // 2 places: ceil(0.33 * 2) = ceil(0.66) = 1
      expect(calculateReservedMinimum(2)).toBe(1);
      // 3 places: ceil(0.33 * 3) = ceil(0.99) = 1
      expect(calculateReservedMinimum(3)).toBe(1);
    });

    it('calculates rounding boundaries across larger allocations', () => {
      // 4 places: ceil(1.32) = 2
      expect(calculateReservedMinimum(4)).toBe(2);
      // 5 places: ceil(1.65) = 2
      expect(calculateReservedMinimum(5)).toBe(2);
      // 6 places: ceil(1.98) = 2
      expect(calculateReservedMinimum(6)).toBe(2);
      // 7 places: ceil(2.31) = 3
      expect(calculateReservedMinimum(7)).toBe(3);
      // 10 places: ceil(3.30) = 4
      expect(calculateReservedMinimum(10)).toBe(4);
      // 20 places: ceil(6.60) = 7
      expect(calculateReservedMinimum(20)).toBe(7);
      // 35 places: ceil(11.55) = 12
      expect(calculateReservedMinimum(35)).toBe(12);
      // 100 places: ceil(33.00) = 33
      expect(calculateReservedMinimum(100)).toBe(33);
      // 250 places: ceil(82.50) = 83
      expect(calculateReservedMinimum(250)).toBe(83);
    });

    it('handles negative or invalid capacity safely', () => {
      expect(calculateReservedMinimum(-5)).toBe(0);
      expect(calculateReservedMinimum(NaN)).toBe(0);
    });
  });

  describe('Multiple Independent Allocations (No Cross-Pooling)', () => {
    it('maintains independent quotas for distinct allocations without pooling', () => {
      const customDeclarations: Record<string, ReservationEligibility> = {
        cand_a: 'eligible',
        cand_b: 'ineligible',
        cand_c: 'ineligible',
        cand_d: 'eligible',
      };

      const eventA = buildAllocationState({
        allocationId: 'alloc_event_a',
        allocationType: 'event_places',
        totalPlaces: 3, // Reserved min: 1, Ordinary: 2
        confirmedOccupants: ['cand_a', 'cand_b', 'cand_c'],
        customDeclarations,
      });

      const eventB = buildAllocationState({
        allocationId: 'alloc_event_b',
        allocationType: 'event_places',
        totalPlaces: 3, // Reserved min: 1, Ordinary: 2
        confirmedOccupants: ['cand_b', 'cand_c'], // 0 eligible
        customDeclarations,
      });

      expect(eventA.reservedMinimum).toBe(1);
      expect(eventA.reservedOccupants).toHaveLength(1);
      expect(eventA.vacanciesCount).toBe(0);
      expect(validateAllocation(eventA).isCompliant).toBe(true);

      // Event B has 0 eligible; its reserved seat stays vacant and is NOT covered by event A
      expect(eventB.reservedMinimum).toBe(1);
      expect(eventB.reservedOccupants).toHaveLength(0);
      expect(eventB.vacanciesCount).toBe(1);
      expect(validateAllocation(eventB).isCompliant).toBe(false);
    });
  });

  describe('Allocation Size Changes', () => {
    it('recalculates minimum and vacancies when capacity expands', () => {
      const customDeclarations: Record<string, ReservationEligibility> = {
        u1: 'eligible',
        u2: 'ineligible',
      };

      // Initially capacity 2 -> reserved min 1, ordinary 1. (1 eligible, 1 ordinary => compliant)
      const initial = buildAllocationState({
        allocationId: 'alloc_dynamic',
        allocationType: 'event_places',
        totalPlaces: 2,
        confirmedOccupants: ['u1', 'u2'],
        customDeclarations,
      });

      expect(initial.reservedMinimum).toBe(1);
      expect(initial.vacanciesCount).toBe(0);
      expect(validateAllocation(initial).isCompliant).toBe(true);

      // Expand capacity to 4 -> reserved min becomes ceil(0.33 * 4) = 2, ordinary = 2
      const expanded = buildAllocationState({
        allocationId: 'alloc_dynamic',
        allocationType: 'event_places',
        totalPlaces: 4,
        confirmedOccupants: ['u1', 'u2'],
        customDeclarations,
      });

      expect(expanded.reservedMinimum).toBe(2);
      expect(expanded.reservedOccupants).toHaveLength(1);
      expect(expanded.vacanciesCount).toBe(1); // 1 unfilled reserved vacancy
      expect(validateAllocation(expanded).isCompliant).toBe(false);
    });

    it('recalculates correctly when capacity shrinks', () => {
      const customDeclarations: Record<string, ReservationEligibility> = {
        u1: 'eligible',
        u2: 'ineligible',
      };

      const contracted = buildAllocationState({
        allocationId: 'alloc_shrink',
        allocationType: 'event_places',
        totalPlaces: 1,
        confirmedOccupants: ['u1'],
        customDeclarations,
      });

      expect(contracted.reservedMinimum).toBe(1);
      expect(contracted.ordinaryPlaces).toBe(0);
      expect(contracted.vacanciesCount).toBe(0);
      expect(validateAllocation(contracted).isCompliant).toBe(true);
    });
  });

  describe('Withdrawals and Replacements', () => {
    it('drops reserved count and introduces vacancy upon eligible withdrawal', () => {
      const customDeclarations: Record<string, ReservationEligibility> = {
        u_el: 'eligible',
        u_ord: 'ineligible',
        u_el_rep: 'eligible',
      };

      const compliant = buildAllocationState({
        allocationId: 'alloc_replace',
        allocationType: 'event_places',
        totalPlaces: 3,
        confirmedOccupants: ['u_el', 'u_ord'],
        customDeclarations,
      });
      expect(compliant.vacanciesCount).toBe(0);

      // u_el withdraws
      const afterWithdrawal = buildAllocationState({
        allocationId: 'alloc_replace',
        allocationType: 'event_places',
        totalPlaces: 3,
        confirmedOccupants: ['u_ord'],
        customDeclarations,
      });
      expect(afterWithdrawal.reservedOccupants).toHaveLength(0);
      expect(afterWithdrawal.vacanciesCount).toBe(1);
      expect(validateAllocation(afterWithdrawal).isCompliant).toBe(false);

      // Replacement eligible participant joins
      const afterReplacement = buildAllocationState({
        allocationId: 'alloc_replace',
        allocationType: 'event_places',
        totalPlaces: 3,
        confirmedOccupants: ['u_ord', 'u_el_rep'],
        customDeclarations,
      });
      expect(afterReplacement.reservedOccupants).toHaveLength(1);
      expect(afterReplacement.vacanciesCount).toBe(0);
      expect(validateAllocation(afterReplacement).isCompliant).toBe(true);
    });
  });

  describe('Unavailable Eligible Participants & Vacant Reserve Protection', () => {
    it('prevents ordinary applicants from silently capturing unmet reserved places', () => {
      const customDeclarations: Record<string, ReservationEligibility> = {
        ord_1: 'ineligible',
        ord_2: 'ineligible',
        ord_3: 'ineligible',
      };

      // Capacity 3: Reserved min 1, Ordinary places 2
      const allocation = buildAllocationState({
        allocationId: 'alloc_vacant',
        allocationType: 'event_places',
        totalPlaces: 3,
        confirmedOccupants: ['ord_1', 'ord_2'],
        customDeclarations,
      });

      expect(allocation.ordinaryPlaces).toBe(2);
      expect(allocation.ordinaryOccupants).toHaveLength(2);
      expect(allocation.reservedMinimum).toBe(1);
      expect(allocation.reservedOccupants).toHaveLength(0);
      expect(allocation.vacanciesCount).toBe(1);

      // 3rd ordinary applicant attempts to RSVP as non-owner (generalized denial, no leak)
      const rsvpAttemptNonOwner = canUserRsvpAllocation(allocation, 'ord_3', customDeclarations, false);
      expect(rsvpAttemptNonOwner.allowed).toBe(false);
      expect(rsvpAttemptNonOwner.reason).toBe(
        "This RSVP cannot be accepted under current allocation rules and reserved places remain held: " +
        "unmet places are reserved under the 33% mandatory women's reservation policy unless an audited Platform Owner exception is approved."
      );
      expect(rsvpAttemptNonOwner.reason?.toLowerCase()).not.toContain('ordinary');
      expect(rsvpAttemptNonOwner.reason).not.toContain('(2/2)');

      // Simulated Platform Owner sees exact breakdown
      const rsvpAttemptOwner = canUserRsvpAllocation(allocation, 'ord_3', customDeclarations, true);
      expect(rsvpAttemptOwner.allowed).toBe(false);
      expect(rsvpAttemptOwner.reason).toContain('Ordinary capacity reached (2/2)');
      expect(rsvpAttemptOwner.reason).toContain('Unmet reserved places stay vacant by default');
    });

    it('treats undeclared participants as ordinary without prompting for real gender data', () => {
      const customDeclarations: Record<string, ReservationEligibility> = {
        ord_1: 'undeclared',
        ord_2: 'undeclared',
      };

      const allocation = buildAllocationState({
        allocationId: 'alloc_undeclared',
        allocationType: 'event_places',
        totalPlaces: 3,
        confirmedOccupants: ['ord_1', 'ord_2'],
        customDeclarations,
      });

      expect(allocation.reservedOccupants).toHaveLength(0);
      expect(allocation.ordinaryOccupants).toHaveLength(2);
      expect(allocation.vacanciesCount).toBe(1);

      // Another unseeded/undeclared participant cannot claim the reserved vacancy
      const check = canUserRsvpAllocation(allocation, 'unseeded_user_999');
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('reserved under the 33% mandatory women\'s reservation policy');
    });
  });

  describe('Rejected Noncompliant Finalization & Persistent State Invariant', () => {
    it('rejects finalization when reservation minimum is unmet and leaves input state untouched', () => {
      const customDeclarations: Record<string, ReservationEligibility> = {
        ord_1: 'ineligible',
        ord_2: 'ineligible',
      };

      const allocation = buildAllocationState({
        allocationId: 'alloc_noncompliant',
        allocationType: 'event_places',
        totalPlaces: 3,
        confirmedOccupants: ['ord_1', 'ord_2'],
        existingStatus: 'pending',
        customDeclarations,
      });

      const deepCopyBefore = JSON.parse(JSON.stringify(allocation));

      expect(() => {
        finalizeAllocationState(allocation, { id: 'user_rohan', role: 'facilitator' });
      }).toThrowError(/33% reservation requirement unmet/);

      // Verify persistent input state was NOT mutated
      expect(allocation).toEqual(deepCopyBefore);
      expect(allocation.status).toBe('pending');
    });
  });

  describe('Simulated Platform Owner Audited Exception', () => {
    it('blocks participant, organizer, and teacher personas from approving exceptions', () => {
      const allocation = buildAllocationState({
        allocationId: 'alloc_exc_test',
        allocationType: 'event_places',
        totalPlaces: 3,
        confirmedOccupants: ['user_aarav', 'user_vikram'],
      });

      const unauthorizedCallers = [
        { id: 'user_aarav', role: 'participant' },
        { id: 'user_kavita', role: 'teacher' },
        { id: 'user_rohan', role: 'facilitator' },
        { id: 'user_ananya', role: 'institution_admin' },
        { id: 'user_dev', role: 'programme_manager' },
      ];

      for (const caller of unauthorizedCallers) {
        expect(() => {
          approveAllocationExceptionState(allocation, caller, 'Candidate outreach concluded.');
        }).toThrowError(/Only Platform Owner \(role: platform_admin\) can approve reservation exceptions/);
      }
    });

    it('allows Platform Owner to approve an exception with reason, approver, timestamp, and policy version', () => {
      const allocation = buildAllocationState({
        allocationId: 'alloc_exc_test',
        allocationType: 'event_places',
        totalPlaces: 3,
        confirmedOccupants: ['user_aarav', 'user_vikram'],
      });

      const adminCaller = { id: 'user_admin', role: 'platform_admin' };
      const reason = 'Outreach completed across 3 batches; urgent local council deliberation required.';

      const { updatedAllocation, audit } = approveAllocationExceptionState(allocation, adminCaller, reason);

      // Verifies audit record
      expect(audit).toBeDefined();
      expect(audit.actorId).toBe('user_admin');
      expect(audit.actorRole).toBe('platform_admin');
      expect(audit.reason).toBe(reason);
      expect(audit.policyVersion).toBe(POLICY_VERSION);
      expect(audit.action).toBe('exception_approved');
      expect(audit.timestamp).toBeDefined();

      // Exception must be visibly identified as an exception, never as ordinary compliance
      expect(updatedAllocation.isException).toBe(true);
      expect(updatedAllocation.status).toBe('finalized_exception');
      expect(updatedAllocation.status).not.toBe('finalized_compliant');
      expect(updatedAllocation.exceptionAudit).toBe(audit);

      // Validation now allows finalization under exception
      const validation = validateAllocation(updatedAllocation);
      expect(validation.isException).toBe(true);
      expect(validation.canFinalize).toBe(true);
      expect(validation.status).toBe('finalized_exception');
    });

    it('requires a substantive justification reason for exception approval', () => {
      const allocation = buildAllocationState({
        allocationId: 'alloc_exc_test',
        allocationType: 'event_places',
        totalPlaces: 3,
        confirmedOccupants: ['user_aarav'],
      });

      const adminCaller = { id: 'user_admin', role: 'platform_admin' };

      expect(() => {
        approveAllocationExceptionState(allocation, adminCaller, '');
      }).toThrowError(/substantive reason/);

      expect(() => {
        approveAllocationExceptionState(allocation, adminCaller, 'tiny');
      }).toThrowError(/substantive reason/);
    });
  });
});
