import { describe, it, expect, beforeEach } from 'vitest';
import { demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { POLICY_VERSION } from '../src/services/reservationAllocationService';

describe('Event Reservation & Allocation Repository Controls (Package 08A)', () => {
  beforeEach(async () => {
    // Reset database to clean fresh seed
    PersistenceService.resetDatabase();
    // Default active user is admin for seed tests
    await demoRepository.switchPersona('user_admin');
  });

  describe('Capacity and Overbooking Prevention', () => {
    it('prevents overbooking beyond total event capacity', async () => {
      // evt_jaipur_blocked_07 has capacity 2, 1 attendee ('user_aarav')
      const evt = await demoRepository.getEvent('evt_jaipur_blocked_07');
      expect(evt).not.toBeNull();
      expect(evt!.capacity).toBe(2);

      // Priya is eligible, fills the 1 reserved place
      await demoRepository.rsvpEvent(evt!.id, 'user_priya', 'attending', 'user_admin');

      const filled = await demoRepository.getEvent(evt!.id);
      expect(filled!.attendeeUserIds).toHaveLength(2);

      // Attempting to RSVP another user (e.g. Meera) must be blocked due to capacity 2 reached
      await expect(
        demoRepository.rsvpEvent(evt!.id, 'user_meera', 'attending', 'user_admin')
      ).rejects.toThrowError(/capacity of 2 has been reached/i);

      // Verify persistent attendees list unchanged
      const afterAttempt = await demoRepository.getEvent(evt!.id);
      expect(afterAttempt!.attendeeUserIds).toHaveLength(2);
    });
  });

  describe('33% Reservation Minimum & Vacant Reserve Protection', () => {
    it('blocks ordinary participant when general capacity is full and remaining place is reserved', async () => {
      // evt_jaipur_limited_05: capacity 3, attendees: user_vikram, user_rohan (both ordinary)
      // Reserved min: ceil(0.33 * 3) = 1. Ordinary capacity: 3 - 1 = 2.
      // Ordinary capacity is 2/2 full!
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(evt).not.toBeNull();
      expect(evt!.capacity).toBe(3);
      expect(evt!.attendeeUserIds).toHaveLength(2);
      expect(evt!.allocation?.reservedMinimum).toBe(1);
      expect(evt!.allocation?.ordinaryPlaces).toBe(2);
      expect(evt!.allocation?.vacanciesCount).toBe(1);

      // user_aarav is an ineligible/ordinary participant
      await demoRepository.switchPersona('user_aarav');
      await expect(
        demoRepository.rsvpEvent(evt!.id, 'user_aarav', 'attending')
      ).rejects.toThrowError(/Ordinary capacity reached.*reserved under the 33% mandatory/i);

      // Verify no silent reserved-place transfer occurred
      const unchanged = await demoRepository.getEvent(evt!.id);
      expect(unchanged!.attendeeUserIds).toEqual(['user_vikram', 'user_rohan']);
      expect(unchanged!.allocation?.vacanciesCount).toBe(1);
    });

    it('allows eligible participant to take the reserved place and achieve compliant status', async () => {
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');

      // user_priya is fictional seed eligible
      await demoRepository.switchPersona('user_priya');
      const updated = await demoRepository.rsvpEvent(evt!.id, 'user_priya', 'attending');
      expect(updated.attendeeUserIds).toContain('user_priya');
      expect(updated.allocation?.reservedOccupiedCount).toBe(1);
      expect(updated.allocation?.vacanciesCount).toBe(0);

      // Switch to admin to finalize as compliant
      await demoRepository.switchPersona('user_admin');
      const finalized = await demoRepository.finalizeEventAllocation(evt!.id);
      expect(finalized.allocation?.status).toBe('finalized_compliant');
    });

    it('frees seats upon withdrawal and recomputes vacancies', async () => {
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');

      // user_vikram withdraws
      await demoRepository.switchPersona('user_vikram');
      const updated = await demoRepository.rsvpEvent(evt!.id, 'user_vikram', 'declined');
      expect(updated.attendeeUserIds).not.toContain('user_vikram');
      expect(updated.allocation?.ordinaryOccupiedCount).toBe(1);

      // Now another ordinary participant (user_aarav) CAN take the open ordinary seat
      await demoRepository.switchPersona('user_aarav');
      const reJoined = await demoRepository.rsvpEvent(evt!.id, 'user_aarav', 'attending');
      expect(reJoined.attendeeUserIds).toContain('user_aarav');
      expect(reJoined.allocation?.ordinaryOccupiedCount).toBe(2);
    });
  });

  describe('Check-In Allocation Guard', () => {
    it('blocks check-in if user does not have a confirmed attending RSVP', async () => {
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');

      // user_aarav is not RSVP'd
      await demoRepository.switchPersona('user_aarav');
      await expect(
        demoRepository.checkInEvent(evt!.id, 'user_aarav')
      ).rejects.toThrowError(/Check-in denied.*does not have a confirmed attending RSVP/i);

      // Verify check-in was not recorded
      const checkEvt = await demoRepository.getEvent(evt!.id);
      expect(checkEvt!.checkedInUserIds || []).not.toContain('user_aarav');
    });

    it('allows confirmed attendee to check in and records activity', async () => {
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(evt!.attendeeUserIds).toContain('user_vikram');

      await demoRepository.switchPersona('user_vikram');
      const result = await demoRepository.checkInEvent(evt!.id, 'user_vikram');
      expect(result.event.checkedInUserIds).toContain('user_vikram');
      expect(result.activity).toBeDefined();
      expect(result.activity?.type).toBe('assembly_joined');
    });
  });

  describe('Anti-Spoofing & Active Persona Authorization (Critical Review Gaps)', () => {
    it('rejects participant attempting to spoof owner approval by passing user_admin actorId', async () => {
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');
      await demoRepository.switchPersona('user_aarav'); // Active persona is participant

      // Aarav attempts to pass actorId = 'user_admin'
      await expect(
        demoRepository.approveEventAllocationException(evt!.id, 'Spoofed approval attempt', 'user_admin')
      ).rejects.toThrowError(/Spoof attempt rejected.*does not match active persona "user_aarav"/i);

      // Verify persistent state and audits are 100% UNCHANGED
      const checkEvt = await demoRepository.getEvent(evt!.id);
      expect(checkEvt!.allocation?.isException).toBe(false);
      expect(checkEvt!.allocation?.status).toBe('pending');

      const audits = await demoRepository.getAllocationAudits(evt!.allocation?.allocationId);
      expect(audits.some((a) => a.reason === 'Spoofed approval attempt')).toBe(false);
    });

    it('rejects teacher or organizer attempting to approve exception or spoof owner', async () => {
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');

      // Teacher Kavita Rao attempts exception approval
      await demoRepository.switchPersona('user_kavita');
      await expect(
        demoRepository.approveEventAllocationException(evt!.id, 'Teacher approval')
      ).rejects.toThrowError(/Unauthorized: Only Platform Owner.*role: platform_admin/i);

      // Organizer Dev Patel attempts to spoof user_admin
      await demoRepository.switchPersona('user_dev');
      await expect(
        demoRepository.approveEventAllocationException(evt!.id, 'Organizer spoof', 'user_admin')
      ).rejects.toThrowError(/Spoof attempt rejected.*does not match active persona "user_dev"/i);
    });

    it('rejects participant attempting to spoof RSVP on behalf of another user', async () => {
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');
      await demoRepository.switchPersona('user_aarav'); // Participant

      // Aarav attempts to RSVP on behalf of Meera
      await expect(
        demoRepository.rsvpEvent(evt!.id, 'user_meera', 'attending')
      ).rejects.toThrowError(/Unauthorized RSVP spoof: Active persona "user_aarav" cannot RSVP on behalf of user "user_meera"/i);

      // Verify Meera was not registered
      const checkEvt = await demoRepository.getEvent(evt!.id);
      expect(checkEvt!.attendeeUserIds).not.toContain('user_meera');
    });

    it('rejects participant attempting to check in another user without staff authority', async () => {
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');
      await demoRepository.switchPersona('user_aarav'); // Participant

      // Aarav attempts to check in Vikram
      await expect(
        demoRepository.checkInEvent(evt!.id, 'user_vikram')
      ).rejects.toThrowError(/Unauthorized check-in spoof: Active persona "user_aarav" cannot check in user "user_vikram"/i);

      // Verify Vikram was not checked in
      const checkEvt = await demoRepository.getEvent(evt!.id);
      expect(checkEvt!.checkedInUserIds || []).not.toContain('user_vikram');
    });

    it('rejects non-staff participant attempting to finalize an allocation', async () => {
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');
      await demoRepository.switchPersona('user_aarav'); // Participant

      await expect(
        demoRepository.finalizeEventAllocation(evt!.id)
      ).rejects.toThrowError(/Unauthorized: Finalization requires platform_admin or programme_manager authority/i);

      // Verify status remains pending
      const checkEvt = await demoRepository.getEvent(evt!.id);
      expect(checkEvt!.allocation?.status).toBe('pending');
    });

    it('rejects participant attempting to spoof audit access by passing user_admin actorId', async () => {
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');
      await demoRepository.switchPersona('user_aarav'); // Participant

      // Aarav attempts to pass actorId = 'user_admin' to read unredacted owner audits
      await expect(
        demoRepository.getAllocationAudits(evt!.allocation?.allocationId, 'user_admin')
      ).rejects.toThrowError(/Spoof attempt rejected: Supplied actorId "user_admin" does not match active persona "user_aarav"/i);
    });

    it('denies privileged owner and staff actions when active persona is missing', async () => {
      // Simulate missing active persona (logged out / unauthenticated)
      const db = PersistenceService.loadDatabase();
      (db as any).activeUserId = undefined;
      PersistenceService.saveDatabase(db);

      await expect(
        demoRepository.approveEventAllocationException('evt_jaipur_limited_05', 'Valid candidate pool exhausted.')
      ).rejects.toThrowError(/Unauthorized: Missing active persona/i);

      await expect(
        demoRepository.finalizeEventAllocation('evt_jaipur_limited_05')
      ).rejects.toThrowError(/Unauthorized: Missing active persona/i);

      await expect(
        demoRepository.updateEventCapacity('evt_jaipur_limited_05', 4)
      ).rejects.toThrowError(/Unauthorized: Missing active persona/i);

      // Verify persistent state unchanged
      await demoRepository.switchPersona('user_admin');
      const checkEvt = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(checkEvt!.capacity).toBe(3);
      expect(checkEvt!.allocation?.status).toBe('pending');
      expect(checkEvt!.allocation?.isException).toBe(false);
    });
  });

  describe('Privacy Protection: Hiding Individual Reservation Eligibility', () => {
    it('strips private occupant lists for participant callers while preserving aggregate counts', async () => {
      await demoRepository.switchPersona('user_aarav'); // Participant
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');

      expect(evt).not.toBeNull();
      // Public aggregate counts MUST be visible
      expect(evt!.allocation?.reservedOccupiedCount).toBe(0);
      expect(evt!.allocation?.ordinaryOccupiedCount).toBe(2);
      expect(evt!.allocation?.vacanciesCount).toBe(1);
      expect(evt!.allocation?.reservedMinimum).toBe(1);
      expect(evt!.allocation?.ordinaryPlaces).toBe(2);

      // Private arrays of individual user IDs MUST NOT be exposed!
      expect(evt!.allocation?.reservedOccupants).toBeUndefined();
      expect(evt!.allocation?.ordinaryOccupants).toBeUndefined();
      expect(evt!.allocation?.confirmedOccupants).toBeUndefined();

      // Same privacy guarantee on getEvents() list
      const allEvents = await demoRepository.getEvents();
      const limited = allEvents.find((e) => e.id === 'evt_jaipur_limited_05');
      expect(limited?.allocation?.reservedOccupants).toBeUndefined();
      expect(limited?.allocation?.ordinaryOccupants).toBeUndefined();
      expect(limited?.allocation?.confirmedOccupants).toBeUndefined();
    });

    it('sanitizes public allocation projections (including exceptionAudit actorId & reason) across getEvent, getEvents, rsvpEvent, and checkInEvent', async () => {
      // 1. Owner approves exception with sensitive operational rationale
      await demoRepository.switchPersona('user_admin');
      const sensitiveReason = 'Targeted community outreach in Ward 24 yielded zero eligible candidates.';
      await demoRepository.approveEventAllocationException('evt_jaipur_limited_05', sensitiveReason);

      // 2. Participant views event via getEvent()
      await demoRepository.switchPersona('user_aarav');
      const participantEvt = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(participantEvt).not.toBeNull();
      expect(participantEvt!.allocation?.status).toBe('finalized_exception');
      expect(participantEvt!.allocation?.isException).toBe(true);

      // Private occupant arrays MUST be undefined
      expect(participantEvt!.allocation?.reservedOccupants).toBeUndefined();
      expect(participantEvt!.allocation?.ordinaryOccupants).toBeUndefined();
      expect(participantEvt!.allocation?.confirmedOccupants).toBeUndefined();

      // Exception audit record is visible, but sensitive fields stripped
      expect(participantEvt!.allocation?.exceptionAudit).toBeDefined();
      expect(participantEvt!.allocation?.exceptionAudit?.id).toBeDefined();
      expect(participantEvt!.allocation?.exceptionAudit?.actorRole).toBe('platform_admin');
      expect(participantEvt!.allocation?.exceptionAudit?.policyVersion).toBe(POLICY_VERSION);
      expect(participantEvt!.allocation?.exceptionAudit?.outcome).toContain('Exception approved');
      expect(participantEvt!.allocation?.exceptionAudit?.actorId).toBeUndefined();
      expect(participantEvt!.allocation?.exceptionAudit?.reason).toBeUndefined();

      // 3. Participant views events via getEvents()
      const allEvents = await demoRepository.getEvents();
      const listedEvt = allEvents.find((e) => e.id === 'evt_jaipur_limited_05');
      expect(listedEvt?.allocation?.reservedOccupants).toBeUndefined();
      expect(listedEvt?.allocation?.ordinaryOccupants).toBeUndefined();
      expect(listedEvt?.allocation?.confirmedOccupants).toBeUndefined();
      expect(listedEvt?.allocation?.exceptionAudit?.actorId).toBeUndefined();
      expect(listedEvt?.allocation?.exceptionAudit?.reason).toBeUndefined();

      // 4. Participant RSVPs or checks in: returned projection is sanitized
      await demoRepository.switchPersona('user_vikram');
      const rsvpResult = await demoRepository.rsvpEvent('evt_jaipur_limited_05', 'user_vikram', 'declined');
      expect(rsvpResult.allocation?.reservedOccupants).toBeUndefined();
      expect(rsvpResult.allocation?.ordinaryOccupants).toBeUndefined();
      expect(rsvpResult.allocation?.confirmedOccupants).toBeUndefined();

      // 5. Authorized Owner view retains full validation arrays
      await demoRepository.switchPersona('user_admin');
      const ownerEvt = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(ownerEvt?.allocation?.reservedOccupants).toBeDefined();
      expect(ownerEvt?.allocation?.ordinaryOccupants).toBeDefined();
      expect(ownerEvt?.allocation?.confirmedOccupants).toBeDefined();
    });

    it('protects single-occupant small allocations with privacy-safe suppression while preserving owner validation detail', async () => {
      // evt_jaipur_blocked_07: capacity 2, 1 attendee (user_aarav)
      // Participant caller
      await demoRepository.switchPersona('user_priya');
      const participantView = await demoRepository.getEvent('evt_jaipur_blocked_07');
      expect(participantView).not.toBeNull();
      expect(participantView!.allocation?.isPrivacySuppressed).toBe(true);
      expect(participantView!.allocation?.reservedOccupants).toBeUndefined();
      expect(participantView!.allocation?.ordinaryOccupants).toBeUndefined();
      expect(participantView!.allocation?.confirmedOccupants).toBeUndefined();

      // Owner caller retains full validation detail without suppression
      await demoRepository.switchPersona('user_admin');
      const ownerView = await demoRepository.getEvent('evt_jaipur_blocked_07');
      expect(ownerView).not.toBeNull();
      expect(ownerView!.allocation?.isPrivacySuppressed).toBeUndefined();
      expect(ownerView!.allocation?.reservedOccupants).toBeDefined();
      expect(ownerView!.allocation?.ordinaryOccupants).toBeDefined();
      expect(ownerView!.allocation?.confirmedOccupants).toBeDefined();
    });

    it('sanitizes allocation audit records for participant callers to prevent deriving identities', async () => {
      // 1. Owner approves exception
      await demoRepository.switchPersona('user_admin');
      const sensitiveReason = 'Targeted community outreach in Ward 24 yielded zero eligible candidates.';
      await demoRepository.approveEventAllocationException('evt_jaipur_limited_05', sensitiveReason);

      // 2. Owner can see full audit with approver ID and reason
      const ownerAudits = await demoRepository.getAllocationAudits('alloc_evt_jaipur_limited_05');
      const ownerRecord = ownerAudits.find((a) => a.action === 'exception_approved');
      expect(ownerRecord?.actorId).toBe('user_admin');
      expect(ownerRecord?.reason).toBe(sensitiveReason);

      // 3. Participant caller gets sanitized projection
      await demoRepository.switchPersona('user_aarav');
      const participantAudits = await demoRepository.getAllocationAudits('alloc_evt_jaipur_limited_05');
      const participantRecord = participantAudits.find((a) => a.action === 'exception_approved');
      expect(participantRecord).toBeDefined();
      expect(participantRecord?.actorRole).toBe('platform_admin');
      expect(participantRecord?.policyVersion).toBe(POLICY_VERSION);
      expect(participantRecord?.outcome).toContain('Exception approved');

      // Sensitive details stripped for participant
      expect(participantRecord?.actorId).toBeUndefined();
      expect(participantRecord?.reason).toBeUndefined();
    });
  });

  describe('Exception Invalidation on Material Allocation Changes', () => {
    it('invalidates exception and reverts status to pending when an attendee withdraws', async () => {
      // 1. Owner approves exception for evt_jaipur_limited_05
      await demoRepository.switchPersona('user_admin');
      await demoRepository.approveEventAllocationException(
        'evt_jaipur_limited_05',
        'Valid candidate recruitment exhausted.'
      );

      const approvedEvt = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(approvedEvt!.allocation?.status).toBe('finalized_exception');
      expect(approvedEvt!.allocation?.isException).toBe(true);

      // 2. Participant Rohan Mehta withdraws
      await demoRepository.switchPersona('user_rohan');
      const postWithdrawal = await demoRepository.rsvpEvent('evt_jaipur_limited_05', 'user_rohan', 'declined');

      // 3. Exception MUST BE INVALIDATED! Status reverts to pending, exceptionAudit cleared
      expect(postWithdrawal.allocation?.status).toBe('pending');
      expect(postWithdrawal.allocation?.isException).toBe(false);
      expect(postWithdrawal.allocation?.exceptionAudit).toBeUndefined();

      // 4. Invalidation audit record was appended
      await demoRepository.switchPersona('user_admin');
      const audits = await demoRepository.getAllocationAudits('alloc_evt_jaipur_limited_05');
      const invalidationAudit = audits.find((a) => a.reason?.includes('invalidated due to participant roster change'));
      expect(invalidationAudit).toBeDefined();
      expect(invalidationAudit?.snapshot.status).toBe('pending');
    });

    it('invalidates exception and reverts status to pending when event capacity changes', async () => {
      // 1. Owner approves exception
      await demoRepository.switchPersona('user_admin');
      await demoRepository.approveEventAllocationException(
        'evt_jaipur_limited_05',
        'Initial exception approved.'
      );

      // 2. Capacity changed from 3 to 4
      const updatedCapacityEvt = await demoRepository.updateEventCapacity('evt_jaipur_limited_05', 4);

      // 3. Exception MUST BE INVALIDATED!
      expect(updatedCapacityEvt.capacity).toBe(4);
      expect(updatedCapacityEvt.allocation?.status).toBe('pending');
      expect(updatedCapacityEvt.allocation?.isException).toBe(false);
      expect(updatedCapacityEvt.allocation?.exceptionAudit).toBeUndefined();

      // Recalculated for capacity 4: reservedMinimum = ceil(0.33 * 4) = 2, ordinaryPlaces = 4 - 2 = 2
      expect(updatedCapacityEvt.allocation?.reservedMinimum).toBe(2);
      expect(updatedCapacityEvt.allocation?.ordinaryPlaces).toBe(2);

      // Invalidation audit logged
      const audits = await demoRepository.getAllocationAudits('alloc_evt_jaipur_limited_05');
      const invalidationAudit = audits.find((a) => a.reason?.includes('invalidated due to capacity change to 4'));
      expect(invalidationAudit).toBeDefined();
    });
  });

  describe('Legacy Event Migration & Deterministic Reload Recovery', () => {
    it('labels legacy pre-existing seeded events as unvalidated_legacy', async () => {
      const legacyEvt1 = await demoRepository.getEvent('evt_jaipur_assembly_01');
      expect(legacyEvt1).not.toBeNull();
      expect(legacyEvt1!.allocation?.status).toBe('unvalidated_legacy');

      const legacyEvt2 = await demoRepository.getEvent('evt_field_audit_02');
      expect(legacyEvt2).not.toBeNull();
      expect(legacyEvt2!.allocation?.status).toBe('unvalidated_legacy');
    });

    it('recovers all allocation states and exception audits deterministically after reload', async () => {
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');
      const reason = 'Statewide audit synchronization exception approved.';

      await demoRepository.switchPersona('user_admin');
      await demoRepository.approveEventAllocationException(evt!.id, reason);

      // Reload database from persistence
      const reloadedEvt = await demoRepository.getEvent(evt!.id);
      expect(reloadedEvt!.allocation?.status).toBe('finalized_exception');
      expect(reloadedEvt!.allocation?.isException).toBe(true);
      expect(reloadedEvt!.allocation?.exceptionAudit?.reason).toBe(reason);
      expect(reloadedEvt!.allocation?.policyVersion).toBe(POLICY_VERSION);
    });
  });
});
