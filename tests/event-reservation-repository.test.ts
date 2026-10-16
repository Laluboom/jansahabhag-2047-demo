import { describe, it, expect, beforeEach } from 'vitest';
import { demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { POLICY_VERSION, canUserRsvpAllocation } from '../src/services/reservationAllocationService';

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
      const err = await demoRepository.rsvpEvent(evt!.id, 'user_aarav', 'attending').catch((e) => e);
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toMatch(/cannot be accepted under current allocation rules/i);
      expect(err.message).toMatch(/reserved places are not automatically reassigned/i);
      // Negative tests for state-specific clues
      expect(err.message.toLowerCase()).not.toContain('remain held');
      expect(err.message.toLowerCase()).not.toContain('unmet');
      expect(err.message.toLowerCase()).not.toContain('vacan');
      expect(err.message.toLowerCase()).not.toContain('ordinary');
      expect(err.message.toLowerCase()).not.toContain('capacity reached');
      expect(err.message.toLowerCase()).not.toContain('fully subscribed');
      expect(err.message).not.toContain('(2/2)');
      expect(err.message).not.toMatch(/\b\d+\/\d+\b/);
      expect(err.message).not.toMatch(/\b\d+ place/);

      // Verify participant projection withholds vacancies and redacts other attendees' identities
      const participantView = await demoRepository.getEvent(evt!.id);
      expect(participantView!.attendeeUserIds).not.toContain('user_vikram');
      expect(participantView!.attendeeUserIds).not.toContain('user_rohan');
      expect(participantView!.attendeeUserIds).toEqual([]);
      expect((participantView as any).registeredCount).toBe(2);
      expect(participantView!.allocation?.isPrivacySuppressed).toBe(true);
      expect(participantView!.allocation?.vacanciesCount).toBeUndefined();

      // Verify persistent owner view confirms no silent reserved-place transfer occurred
      await demoRepository.switchPersona('user_admin');
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
      // For participant Priya, breakdown counts are withheld for privacy
      expect(updated.allocation?.isPrivacySuppressed).toBe(true);
      expect(updated.allocation?.reservedOccupiedCount).toBeUndefined();
      expect(updated.allocation?.vacanciesCount).toBeUndefined();

      // Switch to admin to verify owner retains exact counts and finalize as compliant
      await demoRepository.switchPersona('user_admin');
      const adminEvt = await demoRepository.getEvent(evt!.id);
      expect(adminEvt!.allocation?.reservedOccupiedCount).toBe(1);
      expect(adminEvt!.allocation?.vacanciesCount).toBe(0);
      const finalized = await demoRepository.finalizeEventAllocation(evt!.id);
      expect(finalized.allocation?.status).toBe('finalized_compliant');
    });

    it('frees seats upon withdrawal and recomputes vacancies', async () => {
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');

      // user_vikram withdraws
      await demoRepository.switchPersona('user_vikram');
      const updated = await demoRepository.rsvpEvent(evt!.id, 'user_vikram', 'declined');
      expect(updated.attendeeUserIds).not.toContain('user_vikram');
      expect(updated.allocation?.isPrivacySuppressed).toBe(true);
      expect(updated.allocation?.ordinaryOccupiedCount).toBeUndefined();

      // Verify persistent owner count recomputed to 1
      await demoRepository.switchPersona('user_admin');
      const ownerEvt1 = await demoRepository.getEvent(evt!.id);
      expect(ownerEvt1!.allocation?.ordinaryOccupiedCount).toBe(1);

      // Now another ordinary participant (user_aarav) CAN take the open ordinary seat
      await demoRepository.switchPersona('user_aarav');
      const reJoined = await demoRepository.rsvpEvent(evt!.id, 'user_aarav', 'attending');
      expect(reJoined.attendeeUserIds).toContain('user_aarav');
      expect(reJoined.allocation?.isPrivacySuppressed).toBe(true);
      expect(reJoined.allocation?.ordinaryOccupiedCount).toBeUndefined();

      // Verify persistent owner count recomputed to 2
      await demoRepository.switchPersona('user_admin');
      const ownerEvt2 = await demoRepository.getEvent(evt!.id);
      expect(ownerEvt2!.allocation?.ordinaryOccupiedCount).toBe(2);
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
    it('strips private occupant lists for participant callers while preserving aggregate counts on non-suppressed cohorts and withholding on small cohorts', async () => {
      await demoRepository.switchPersona('user_aarav'); // Participant
      const evt = await demoRepository.getEvent('evt_jaipur_limited_05');

      expect(evt).not.toBeNull();
      // On small cohorts (capacity <= 3), breakdown counts are withheld to prevent individual eligibility inference
      expect(evt!.allocation?.isPrivacySuppressed).toBe(true);
      expect(evt!.allocation?.reservedOccupiedCount).toBeUndefined();
      expect(evt!.allocation?.ordinaryOccupiedCount).toBeUndefined();
      expect(evt!.allocation?.vacanciesCount).toBeUndefined();
      // Public formula and totals MUST remain visible
      expect(evt!.allocation?.reservedMinimum).toBe(1);
      expect(evt!.allocation?.ordinaryPlaces).toBe(2);

      // Private arrays of individual user IDs MUST NOT be exposed!
      expect(evt!.allocation?.reservedOccupants).toBeUndefined();
      expect(evt!.allocation?.ordinaryOccupants).toBeUndefined();
      expect(evt!.allocation?.confirmedOccupants).toBeUndefined();

      // Same privacy guarantee on getEvents() list
      const allEvents = await demoRepository.getEvents();
      const limited = allEvents.find((e) => e.id === 'evt_jaipur_limited_05');
      expect(limited?.allocation?.isPrivacySuppressed).toBe(true);
      expect(limited?.allocation?.reservedOccupiedCount).toBeUndefined();
      expect(limited?.allocation?.ordinaryOccupiedCount).toBeUndefined();
      expect(limited?.allocation?.vacanciesCount).toBeUndefined();
      expect(limited?.allocation?.reservedOccupants).toBeUndefined();
      expect(limited?.allocation?.ordinaryOccupants).toBeUndefined();
      expect(limited?.allocation?.confirmedOccupants).toBeUndefined();

      // Robust public projection: ALL non-owner projections withhold exact counts regardless of capacity
      const largeEvt = allEvents.find((e) => e.id === 'evt_jaipur_assembly_01');
      expect(largeEvt?.allocation?.isPrivacySuppressed).toBe(true);
      expect(largeEvt?.allocation?.reservedOccupiedCount).toBeUndefined();
      expect(largeEvt?.allocation?.ordinaryOccupiedCount).toBeUndefined();
      expect(largeEvt?.allocation?.vacanciesCount).toBeUndefined();
      // Large cohort also strips private occupant arrays
      expect(largeEvt?.allocation?.reservedOccupants).toBeUndefined();
      expect(largeEvt?.allocation?.ordinaryOccupants).toBeUndefined();
      expect(largeEvt?.allocation?.confirmedOccupants).toBeUndefined();
      // Total/ordinary/reserved formula preserved
      expect(largeEvt?.allocation?.totalPlaces).toBe(35);
      expect(largeEvt?.allocation?.reservedMinimum).toBe(12);
      expect(largeEvt?.allocation?.ordinaryPlaces).toBe(23);

      // Owner caller retains unredacted validation detail
      await demoRepository.switchPersona('user_admin');
      const ownerAllEvents = await demoRepository.getEvents();
      const ownerLargeEvt = ownerAllEvents.find((e) => e.id === 'evt_jaipur_assembly_01');
      expect(ownerLargeEvt?.allocation?.isPrivacySuppressed).toBeUndefined();
      expect(ownerLargeEvt?.allocation?.reservedOccupiedCount).toBeDefined();
      expect(ownerLargeEvt?.allocation?.ordinaryOccupiedCount).toBeDefined();
      expect(ownerLargeEvt?.allocation?.vacanciesCount).toBeDefined();
      expect(ownerLargeEvt?.allocation?.reservedOccupants).toBeDefined();
    });

    it('sanitizes public allocation projections (including exceptionAudit actorId, reason & snapshot counts) across getEvent, getEvents, rsvpEvent, and checkInEvent', async () => {
      // 1. Owner approves exception with sensitive operational rationale
      await demoRepository.switchPersona('user_admin');
      const sensitiveReason = 'Targeted community outreach in Ward 24 yielded zero eligible candidates.';
      await demoRepository.approveEventAllocationException('evt_jaipur_limited_05', sensitiveReason);

      // 2. Participant views event via getEvent()
      await demoRepository.switchPersona('user_aarav');
      const participantEvt = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(participantEvt).not.toBeNull();
      expect(participantEvt!.allocation?.isPrivacySuppressed).toBe(true);
      // Status is suppressed for small cohort to avoid disclosing attendee eligibility
      expect(participantEvt!.allocation?.status).toBeUndefined();
      expect(participantEvt!.allocation?.isException).toBe(false);

      // Private occupant arrays and counts MUST be undefined
      expect(participantEvt!.allocation?.reservedOccupants).toBeUndefined();
      expect(participantEvt!.allocation?.ordinaryOccupants).toBeUndefined();
      expect(participantEvt!.allocation?.confirmedOccupants).toBeUndefined();
      expect(participantEvt!.allocation?.reservedOccupiedCount).toBeUndefined();
      expect(participantEvt!.allocation?.ordinaryOccupiedCount).toBeUndefined();
      expect(participantEvt!.allocation?.vacanciesCount).toBeUndefined();

      // Exception audit record and exception state are suppressed for non-owner projections
      expect(participantEvt!.allocation?.exceptionAudit).toBeUndefined();

      // 3. Participant views events via getEvents()
      const allEvents = await demoRepository.getEvents();
      const listedEvt = allEvents.find((e) => e.id === 'evt_jaipur_limited_05');
      expect(listedEvt?.allocation?.isPrivacySuppressed).toBe(true);
      expect(listedEvt?.allocation?.isException).toBe(false);
      expect(listedEvt?.allocation?.exceptionAudit).toBeUndefined();
      expect(listedEvt?.allocation?.reservedOccupants).toBeUndefined();
      expect(listedEvt?.allocation?.ordinaryOccupants).toBeUndefined();
      expect(listedEvt?.allocation?.confirmedOccupants).toBeUndefined();
      expect(listedEvt?.allocation?.reservedOccupiedCount).toBeUndefined();
      expect(listedEvt?.allocation?.ordinaryOccupiedCount).toBeUndefined();
      expect(listedEvt?.allocation?.vacanciesCount).toBeUndefined();
      expect(listedEvt?.allocation?.status).toBeUndefined();

      // 4. Participant RSVPs or checks in: returned projection is sanitized
      await demoRepository.switchPersona('user_vikram');
      const rsvpResult = await demoRepository.rsvpEvent('evt_jaipur_limited_05', 'user_vikram', 'declined');
      expect(rsvpResult.allocation?.isPrivacySuppressed).toBe(true);
      expect(rsvpResult.allocation?.reservedOccupants).toBeUndefined();
      expect(rsvpResult.allocation?.ordinaryOccupants).toBeUndefined();
      expect(rsvpResult.allocation?.confirmedOccupants).toBeUndefined();
      expect(rsvpResult.allocation?.reservedOccupiedCount).toBeUndefined();
      expect(rsvpResult.allocation?.ordinaryOccupiedCount).toBeUndefined();
      expect(rsvpResult.allocation?.vacanciesCount).toBeUndefined();

      // 5. Authorized Owner view retains full validation arrays and exact counts
      await demoRepository.switchPersona('user_admin');
      const ownerEvt = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(ownerEvt?.allocation?.isPrivacySuppressed).toBeUndefined();
      expect(ownerEvt?.allocation?.reservedOccupants).toBeDefined();
      expect(ownerEvt?.allocation?.ordinaryOccupants).toBeDefined();
      expect(ownerEvt?.allocation?.confirmedOccupants).toBeDefined();
      expect(ownerEvt?.allocation?.reservedOccupiedCount).toBeDefined();
      expect(ownerEvt?.allocation?.ordinaryOccupiedCount).toBeDefined();
      expect(ownerEvt?.allocation?.vacanciesCount).toBeDefined();
      expect(ownerEvt?.allocation?.status).toBe('pending');
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
      expect(participantView!.allocation?.reservedOccupiedCount).toBeUndefined();
      expect(participantView!.allocation?.ordinaryOccupiedCount).toBeUndefined();
      expect(participantView!.allocation?.vacanciesCount).toBeUndefined();

      // Owner caller retains full validation detail without suppression
      await demoRepository.switchPersona('user_admin');
      const ownerView = await demoRepository.getEvent('evt_jaipur_blocked_07');
      expect(ownerView).not.toBeNull();
      expect(ownerView!.allocation?.isPrivacySuppressed).toBeUndefined();
      expect(ownerView!.allocation?.reservedOccupants).toBeDefined();
      expect(ownerView!.allocation?.ordinaryOccupants).toBeDefined();
      expect(ownerView!.allocation?.confirmedOccupants).toBeDefined();
      expect(ownerView!.allocation?.reservedOccupiedCount).toBe(0);
      expect(ownerView!.allocation?.ordinaryOccupiedCount).toBe(1);
      expect(ownerView!.allocation?.vacanciesCount).toBe(1);
      expect(ownerView!.allocation?.status).toBe('blocked_noncompliant');
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
      expect(ownerRecord?.snapshot.reservedOccupiedCount).toBe(0);
      expect(ownerRecord?.snapshot.vacanciesCount).toBe(1);

      // 3. Participant caller gets sanitized projection: exception_approved records are suppressed
      await demoRepository.switchPersona('user_aarav');
      const participantAudits = await demoRepository.getAllocationAudits('alloc_evt_jaipur_limited_05');
      const participantRecord = participantAudits.find((a) => a.action === 'exception_approved');
      expect(participantRecord).toBeUndefined();
      expect(participantAudits.some((a) => a.action === 'exception_approved')).toBe(false);
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

  describe('Public Inference Prevention & Single Attendee Protection', () => {
    it('withholds exact counts and arrays for capacity 4+ events with a single attendee', async () => {
      // 1. Setup capacity 4 event with 1 attendee (user_aarav)
      await demoRepository.switchPersona('user_admin');
      const updated = await demoRepository.updateEventCapacity('evt_jaipur_blocked_07', 4);
      expect(updated.capacity).toBe(4);
      expect(updated.attendeeUserIds).toEqual(['user_aarav']);

      // 2. Participant caller inspection
      await demoRepository.switchPersona('user_priya');
      const participantEvt = await demoRepository.getEvent('evt_jaipur_blocked_07');
      expect(participantEvt).not.toBeNull();
      expect(participantEvt!.allocation?.isPrivacySuppressed).toBe(true);
      expect(participantEvt!.allocation?.reservedOccupiedCount).toBeUndefined();
      expect(participantEvt!.allocation?.ordinaryOccupiedCount).toBeUndefined();
      expect(participantEvt!.allocation?.vacanciesCount).toBeUndefined();
      expect(participantEvt!.allocation?.reservedOccupants).toBeUndefined();
      expect(participantEvt!.allocation?.ordinaryOccupants).toBeUndefined();
      expect(participantEvt!.allocation?.confirmedOccupants).toBeUndefined();
      // Public formula preserved
      expect(participantEvt!.allocation?.totalPlaces).toBe(4);
      expect(participantEvt!.allocation?.reservedMinimum).toBe(2);
      expect(participantEvt!.allocation?.ordinaryPlaces).toBe(2);

      // 3. Platform Owner caller retains full validation detail
      await demoRepository.switchPersona('user_admin');
      const ownerEvt = await demoRepository.getEvent('evt_jaipur_blocked_07');
      expect(ownerEvt!.allocation?.isPrivacySuppressed).toBeUndefined();
      expect(ownerEvt!.allocation?.reservedOccupiedCount).toBe(0);
      expect(ownerEvt!.allocation?.ordinaryOccupiedCount).toBe(1);
      expect(ownerEvt!.allocation?.vacanciesCount).toBe(2);
      expect(ownerEvt!.allocation?.reservedOccupants).toEqual([]);
      expect(ownerEvt!.allocation?.ordinaryOccupants).toEqual(['user_aarav']);
      expect(ownerEvt!.allocation?.confirmedOccupants).toEqual(['user_aarav']);
    });

    it('withholds exception audit on sole attendee cohorts so ineligibility cannot be inferred', async () => {
      // evt_jaipur_blocked_07 has 1 attendee (user_aarav)
      await demoRepository.switchPersona('user_admin');
      await demoRepository.approveEventAllocationException('evt_jaipur_blocked_07', 'Special consultation permit');

      // Owner sees exception status and full audit
      const ownerView = await demoRepository.getEvent('evt_jaipur_blocked_07');
      expect(ownerView!.allocation?.isException).toBe(true);
      expect(ownerView!.allocation?.exceptionAudit?.reason).toBe('Special consultation permit');
      const ownerAudits = await demoRepository.getAllocationAudits('alloc_evt_jaipur_blocked_07');
      expect(ownerAudits.some((a) => a.action === 'exception_approved')).toBe(true);

      // Participant caller MUST NOT see exception details that imply Aarav is ineligible
      await demoRepository.switchPersona('user_priya');
      const participantView = await demoRepository.getEvent('evt_jaipur_blocked_07');
      expect(participantView!.allocation?.isException).toBe(false);
      expect(participantView!.allocation?.exceptionAudit).toBeUndefined();
      expect(participantView!.allocation?.status).toBeUndefined();

      // getAllocationAudits withholds exception_approved for sole attendee cohorts
      const participantAudits = await demoRepository.getAllocationAudits('alloc_evt_jaipur_blocked_07');
      expect(participantAudits.some((a) => a.action === 'exception_approved')).toBe(false);
    });

    it('generalizes public RSVP denial messages without leaking occupancy or vacancy counts', async () => {
      // evt_jaipur_limited_05: capacity 3, 2 ordinary attendees, 1 vacant reserved
      await demoRepository.switchPersona('user_aarav');
      const err = await demoRepository.rsvpEvent('evt_jaipur_limited_05', 'user_aarav', 'attending').catch((e) => e);
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toMatch(/cannot be accepted under current allocation rules/i);
      expect(err.message).toMatch(/reserved places are not automatically reassigned/i);

      // Must NOT contain category leaks, occupancy, or state-specific clues
      expect(err.message.toLowerCase()).not.toContain('remain held');
      expect(err.message.toLowerCase()).not.toContain('unmet');
      expect(err.message.toLowerCase()).not.toContain('vacan');
      expect(err.message.toLowerCase()).not.toContain('ordinary');
      expect(err.message.toLowerCase()).not.toContain('capacity reached');
      expect(err.message.toLowerCase()).not.toContain('fully subscribed');
      expect(err.message).not.toContain('(2/2)');
      expect(err.message).not.toMatch(/\b\d+\/\d+\b/);
      expect(err.message).not.toMatch(/\b\d+ place\(s\) are reserved\b/);
    });

    it('rigorously prevents deductive inference for concrete 2-attendee denial and exception scenarios across reload and persona switch', async () => {
      // Concrete case 1: Denial on 2-attendee event (evt_jaipur_limited_05: capacity 3, 2 named attendees Vikram & Rohan, 1 reserved vacant)
      await demoRepository.switchPersona('user_aarav');
      const denialErr = await demoRepository.rsvpEvent('evt_jaipur_limited_05', 'user_aarav', 'attending').catch((e) => e);
      expect(denialErr).toBeInstanceOf(Error);
      expect(denialErr.message).toMatch(/cannot be accepted under current allocation rules/i);
      expect(denialErr.message).toMatch(/reserved places are not automatically reassigned/i);
      // Negative assertions: message must not reveal ordinary category is full, vacant, or any count
      expect(denialErr.message.toLowerCase()).not.toContain('remain held');
      expect(denialErr.message.toLowerCase()).not.toContain('unmet');
      expect(denialErr.message.toLowerCase()).not.toContain('vacan');
      expect(denialErr.message.toLowerCase()).not.toContain('ordinary');
      expect(denialErr.message.toLowerCase()).not.toContain('capacity reached');
      expect(denialErr.message.toLowerCase()).not.toContain('fully subscribed');
      expect(denialErr.message).not.toContain('(2/2)');
      expect(denialErr.message).not.toMatch(/\b\d+\/\d+\b/);
      expect(denialErr.message).not.toMatch(/\b\d+ place/);

      // Participant projection for 2-attendee event withholds category metrics and redacts attendee identities
      const pViewBefore = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(pViewBefore!.allocation?.isPrivacySuppressed).toBe(true);
      expect(pViewBefore!.allocation?.reservedOccupiedCount).toBeUndefined();
      expect(pViewBefore!.allocation?.ordinaryOccupiedCount).toBeUndefined();
      expect(pViewBefore!.allocation?.vacanciesCount).toBeUndefined();
      expect(pViewBefore!.allocation?.status).toBe('pending');
      expect(pViewBefore!.allocation?.isException).toBe(false);
      // Identity link broken: participant cannot derive Vikram or Rohan attendance from getEvent
      expect(pViewBefore!.attendeeUserIds).not.toContain('user_vikram');
      expect(pViewBefore!.attendeeUserIds).not.toContain('user_rohan');
      expect(pViewBefore!.attendeeUserIds).toEqual([]);
      expect((pViewBefore as any).registeredCount).toBe(2);

      // Session projection also redacts named roster for non-owner
      const pSessionBefore = await demoRepository.getSessionByEvent('evt_jaipur_limited_05');
      expect(pSessionBefore?.roster.some((r) => r.userId === 'user_vikram' || r.name?.includes('Vikram'))).toBe(false);
      expect(pSessionBefore?.roster.some((r) => r.userId === 'user_rohan' || r.name?.includes('Rohan'))).toBe(false);

      // Same identity protection on getEvents() list
      const pAllEventsBefore = await demoRepository.getEvents();
      const pEvt5Before = pAllEventsBefore.find((e) => e.id === 'evt_jaipur_limited_05');
      expect(pEvt5Before?.attendeeUserIds).not.toContain('user_vikram');
      expect(pEvt5Before?.attendeeUserIds).not.toContain('user_rohan');

      // Reload simulation for participant before persona switch
      const pViewReloaded = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(pViewReloaded!.allocation?.isPrivacySuppressed).toBe(true);
      expect(pViewReloaded!.allocation?.vacanciesCount).toBeUndefined();
      expect(pViewReloaded!.attendeeUserIds).not.toContain('user_vikram');
      expect(pViewReloaded!.attendeeUserIds).not.toContain('user_rohan');

      const denialReloadErr = await demoRepository.rsvpEvent('evt_jaipur_limited_05', 'user_aarav', 'attending').catch((e) => e);
      expect(denialReloadErr.message).toMatch(/cannot be accepted under current allocation rules/i);
      expect(denialReloadErr.message).toMatch(/reserved places are not automatically reassigned/i);
      expect(denialReloadErr.message.toLowerCase()).not.toContain('remain held');
      expect(denialReloadErr.message.toLowerCase()).not.toContain('unmet');
      expect(denialReloadErr.message.toLowerCase()).not.toContain('vacan');
      expect(denialReloadErr.message.toLowerCase()).not.toContain('ordinary');

      // After denial: participant still cannot derive Vikram/Rohan from event or session
      const pViewAfterDenial = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(pViewAfterDenial!.attendeeUserIds).not.toContain('user_vikram');
      expect(pViewAfterDenial!.attendeeUserIds).not.toContain('user_rohan');
      const pSessionAfterDenial = await demoRepository.getSessionByEvent('evt_jaipur_limited_05');
      expect(pSessionAfterDenial?.roster.some((r) => r.userId === 'user_vikram')).toBe(false);
      expect(pSessionAfterDenial?.roster.some((r) => r.userId === 'user_rohan')).toBe(false);

      // Persona switch to Platform Owner on the 2-attendee event: Owner MUST see precise detail and full attendee list
      await demoRepository.switchPersona('user_admin');
      const ownerViewBefore = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(ownerViewBefore!.allocation?.isPrivacySuppressed).toBeFalsy();
      expect(ownerViewBefore!.allocation?.totalPlaces).toBe(3);
      expect(ownerViewBefore!.allocation?.reservedMinimum).toBe(1);
      expect(ownerViewBefore!.allocation?.ordinaryPlaces).toBe(2);
      expect(ownerViewBefore!.allocation?.reservedOccupiedCount).toBe(0);
      expect(ownerViewBefore!.allocation?.ordinaryOccupiedCount).toBe(2);
      expect(ownerViewBefore!.allocation?.vacanciesCount).toBe(1);
      expect(ownerViewBefore!.allocation?.status).toBe('pending');
      // Owner view retains full attendee IDs and named session roster
      expect(ownerViewBefore!.attendeeUserIds).toContain('user_vikram');
      expect(ownerViewBefore!.attendeeUserIds).toContain('user_rohan');
      const ownerSession = await demoRepository.getSessionByEvent('evt_jaipur_limited_05');
      expect(ownerSession?.roster.some((r) => r.userId === 'user_vikram')).toBe(true);
      expect(ownerSession?.roster.some((r) => r.userId === 'user_rohan')).toBe(true);

      // Owner validation check preserves actionable detailed reason and hold-vacant default
      const ownerValidation = canUserRsvpAllocation(ownerViewBefore!.allocation!, 'user_aarav', undefined, true);
      expect(ownerValidation.allowed).toBe(false);
      expect(ownerValidation.reason).toContain('Ordinary capacity reached (2/2)');
      expect(ownerValidation.reason).toContain('The remaining 1 place(s) are reserved under the 33% mandatory women\'s reservation policy');
      expect(ownerValidation.reason).toContain('Unmet reserved places stay vacant by default unless an audited Platform Owner exception is approved');

      // Owner reload check: retains precise detail after reload
      const ownerViewReloaded = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(ownerViewReloaded!.allocation?.reservedOccupiedCount).toBe(0);
      expect(ownerViewReloaded!.allocation?.ordinaryOccupiedCount).toBe(2);
      expect(ownerViewReloaded!.allocation?.vacanciesCount).toBe(1);
      expect(ownerViewReloaded!.attendeeUserIds).toContain('user_vikram');
      expect(ownerViewReloaded!.attendeeUserIds).toContain('user_rohan');

      // Concrete case 2: Owner approves exception on 2-attendee event
      const sensitiveReason = 'Two confirmed attendees are ordinary; no eligible candidates found after outreach.';
      await demoRepository.approveEventAllocationException('evt_jaipur_limited_05', sensitiveReason);

      // Owner sees unredacted exception state and audit records
      const ownerView = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(ownerView!.allocation?.isException).toBe(true);
      expect(ownerView!.allocation?.status).toBe('finalized_exception');
      expect(ownerView!.allocation?.exceptionAudit?.actorId).toBe('user_admin');
      expect(ownerView!.allocation?.exceptionAudit?.reason).toBe(sensitiveReason);
      const ownerAudits = await demoRepository.getAllocationAudits('alloc_evt_jaipur_limited_05');
      expect(ownerAudits.some((a) => a.action === 'exception_approved')).toBe(true);

      // Switch to participant Aarav: exception state and exception audits MUST be completely suppressed
      await demoRepository.switchPersona('user_aarav');
      const pViewAfter = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(pViewAfter!.allocation?.isPrivacySuppressed).toBe(true);
      expect(pViewAfter!.allocation?.isException).toBe(false);
      expect(pViewAfter!.allocation?.exceptionAudit).toBeUndefined();
      expect(pViewAfter!.allocation?.status).toBeUndefined();
      expect(pViewAfter!.attendeeUserIds).not.toContain('user_vikram');
      expect(pViewAfter!.attendeeUserIds).not.toContain('user_rohan');
      const pAuditsAfter = await demoRepository.getAllocationAudits('alloc_evt_jaipur_limited_05');
      expect(pAuditsAfter.some((a) => a.action === 'exception_approved')).toBe(false);
      expect(pAuditsAfter.some((a) => a.snapshot?.status === 'finalized_exception')).toBe(false);
      expect(pAuditsAfter.some((a) => a.outcome?.toLowerCase().includes('exception'))).toBe(false);

      // Reload simulation: re-read getEvent and getAllocationAudits
      const reloadedView = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(reloadedView!.allocation?.isException).toBe(false);
      expect(reloadedView!.allocation?.exceptionAudit).toBeUndefined();
      expect(reloadedView!.allocation?.status).toBeUndefined();
      expect(reloadedView!.attendeeUserIds).not.toContain('user_vikram');
      expect(reloadedView!.attendeeUserIds).not.toContain('user_rohan');
      const reloadedAudits = await demoRepository.getAllocationAudits('alloc_evt_jaipur_limited_05');
      expect(reloadedAudits.some((a) => a.action === 'exception_approved')).toBe(false);

      // Persona switch to another participant (user_priya): still suppressed, attendee IDs redacted
      await demoRepository.switchPersona('user_priya');
      const priyaView = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(priyaView!.allocation?.isException).toBe(false);
      expect(priyaView!.allocation?.exceptionAudit).toBeUndefined();
      expect(priyaView!.allocation?.status).toBeUndefined();
      expect(priyaView!.attendeeUserIds).not.toContain('user_vikram');
      expect(priyaView!.attendeeUserIds).not.toContain('user_rohan');
      const priyaAudits = await demoRepository.getAllocationAudits('alloc_evt_jaipur_limited_05');
      expect(priyaAudits.some((a) => a.action === 'exception_approved')).toBe(false);

      // Persona switch to organizer (user_dev): still suppressed, attendee IDs and roster redacted
      await demoRepository.switchPersona('user_dev');
      const devView = await demoRepository.getEvent('evt_jaipur_limited_05');
      expect(devView!.allocation?.isException).toBe(false);
      expect(devView!.allocation?.exceptionAudit).toBeUndefined();
      expect(devView!.allocation?.status).toBeUndefined();
      expect(devView!.attendeeUserIds).not.toContain('user_vikram');
      expect(devView!.attendeeUserIds).not.toContain('user_rohan');
      const devSession = await demoRepository.getSessionByEvent('evt_jaipur_limited_05');
      expect(devSession?.roster.some((r) => r.userId === 'user_vikram')).toBe(false);
      expect(devSession?.roster.some((r) => r.userId === 'user_rohan')).toBe(false);
      const devEvents = await demoRepository.getEvents();
      const devEvt5 = devEvents.find((e) => e.id === 'evt_jaipur_limited_05');
      expect(devEvt5?.attendeeUserIds).not.toContain('user_vikram');
      expect(devEvt5?.attendeeUserIds).not.toContain('user_rohan');
      const devAudits = await demoRepository.getAllocationAudits('alloc_evt_jaipur_limited_05');
      expect(devAudits.some((a) => a.action === 'exception_approved')).toBe(false);
    });

    it('probes 1-person and 2-person cohorts across persona switch and reload without disclosing inference', async () => {
      // 1-person cohort: evt_jaipur_blocked_07 (capacity 2, 1 attendee)
      await demoRepository.switchPersona('user_priya');
      const beforeRsvp = await demoRepository.getEvent('evt_jaipur_blocked_07');
      expect(beforeRsvp!.allocation?.isPrivacySuppressed).toBe(true);
      expect(beforeRsvp!.allocation?.reservedOccupiedCount).toBeUndefined();
      expect(beforeRsvp!.allocation?.vacanciesCount).toBeUndefined();

      // Priya (eligible) RSVPs
      const afterRsvp = await demoRepository.rsvpEvent('evt_jaipur_blocked_07', 'user_priya', 'attending');
      expect(afterRsvp.allocation?.isPrivacySuppressed).toBe(true);
      expect(afterRsvp.allocation?.reservedOccupiedCount).toBeUndefined();
      expect(afterRsvp.allocation?.vacanciesCount).toBeUndefined();

      // Persona switch to organizer (user_dev) and staff (user_ananya): exact counts remain withheld
      await demoRepository.switchPersona('user_dev');
      const organizerView = await demoRepository.getEvent('evt_jaipur_blocked_07');
      expect(organizerView!.allocation?.isPrivacySuppressed).toBe(true);
      expect(organizerView!.allocation?.reservedOccupiedCount).toBeUndefined();

      await demoRepository.switchPersona('user_ananya');
      const staffView = await demoRepository.getEvent('evt_jaipur_blocked_07');
      expect(staffView!.allocation?.isPrivacySuppressed).toBe(true);
      expect(staffView!.allocation?.reservedOccupiedCount).toBeUndefined();

      // Re-fetch after reload simulation
      const reloaded = await demoRepository.getEvent('evt_jaipur_blocked_07');
      expect(reloaded!.allocation?.isPrivacySuppressed).toBe(true);
      expect(reloaded!.allocation?.reservedOccupiedCount).toBeUndefined();

      // Simulated Platform Owner sees unredacted validation numbers
      await demoRepository.switchPersona('user_admin');
      const ownerView = await demoRepository.getEvent('evt_jaipur_blocked_07');
      expect(ownerView!.allocation?.isPrivacySuppressed).toBeUndefined();
      expect(ownerView!.allocation?.reservedOccupiedCount).toBe(1);
      expect(ownerView!.allocation?.ordinaryOccupiedCount).toBe(1);
      expect(ownerView!.allocation?.vacanciesCount).toBe(0);
    });

    it('redacts other attendee identities in getDashboard upcomingEvents across caller personas and views', async () => {
      // 1. Participant Aarav views his own dashboard:
      await demoRepository.switchPersona('user_aarav');
      const aaravDash = await demoRepository.getDashboard('user_aarav');
      for (const ev of aaravDash.upcomingEvents) {
        if (ev.allocation && ev.allocation.status !== 'unvalidated_legacy') {
          expect(ev.attendeeUserIds).not.toContain('user_vikram');
          expect(ev.attendeeUserIds).not.toContain('user_rohan');
        }
      }

      // 2. Cross-persona inspection: Aarav (non-owner) reads Vikram's dashboard
      // Must not allow another persona dashboard to reveal identified attendance in allocated limited events
      const vikramDashViewedByAarav = await demoRepository.getDashboard('user_vikram');
      const evt5InVikramDash = vikramDashViewedByAarav.upcomingEvents.find(
        (e) => e.id === 'evt_jaipur_limited_05'
      );
      // evt_jaipur_limited_05 is an allocated event where Vikram is only an attendee; must not be revealed to Aarav
      expect(evt5InVikramDash).toBeUndefined();

      // For any events that are returned on Vikram's dashboard,
      // projected for Aarav: attendee IDs must still never reveal Vikram or Rohan on allocated events
      for (const ev of vikramDashViewedByAarav.upcomingEvents) {
        if (ev.allocation && ev.allocation.status !== 'unvalidated_legacy') {
          expect(ev.attendeeUserIds).not.toContain('user_vikram');
          expect(ev.attendeeUserIds).not.toContain('user_rohan');
        }
      }

      // 3. Organizer Dev Patel views Vikram's dashboard:
      await demoRepository.switchPersona('user_dev');
      const vikramDashViewedByDev = await demoRepository.getDashboard('user_vikram');
      expect(
        vikramDashViewedByDev.upcomingEvents.find((e) => e.id === 'evt_jaipur_limited_05')
      ).toBeUndefined();

      // 4. Platform Owner (user_admin) views Vikram's dashboard:
      // Owner is authorized to view full audit detail and attendee memberships
      await demoRepository.switchPersona('user_admin');
      const vikramDashViewedByAdmin = await demoRepository.getDashboard('user_vikram');
      const evt5InAdminDash = vikramDashViewedByAdmin.upcomingEvents.find(
        (e) => e.id === 'evt_jaipur_limited_05'
      );
      expect(evt5InAdminDash).toBeDefined();
      expect(evt5InAdminDash!.attendeeUserIds).toContain('user_vikram');
      expect(evt5InAdminDash!.attendeeUserIds).toContain('user_rohan');
    });

    it('protects session roster in mutator return paths for allocated events while preserving internal DB state', async () => {
      // Setup a session linked to allocated event evt_jaipur_limited_05 in DB
      const db = PersistenceService.loadDatabase();
      const mockAllocSession: any = {
        id: 'sess_allocated_limited_05',
        eventId: 'evt_jaipur_limited_05',
        title: 'Limited Deliberation Workshop Session',
        currentMode: 'debate_room',
        facilitatorId: 'user_dev',
        roster: [
          { userId: 'user_vikram', name: 'Vikram Joshi', role: 'Participant', joinedAt: '2026-10-01T00:00:00Z' },
          { userId: 'user_rohan', name: 'Rohan Mehta', role: 'Participant', joinedAt: '2026-10-01T00:00:00Z' },
          { userId: 'user_aarav', name: 'Aarav Patel', role: 'Participant', joinedAt: '2026-10-01T00:00:00Z' },
        ],
        modeTransitions: [
          {
            id: 'trans_alloc_01',
            fromMode: 'debate_room',
            toMode: 'debate_room',
            timestamp: '2026-10-01T00:00:00Z',
            initiatedBy: 'user_dev',
            summary: 'Session in debate room mode',
          },
        ],
        agenda: [],
        resources: [],
        debateData: {
          motion: 'Test Motion for Limited Workshop',
          currentPhase: 'DISCUSSION',
          activeSpeakerId: null,
          speakingQueue: [],
          contributions: [],
          acknowledgedUserIds: [],
          rulebook: { version: 'v1.0', rules: [] },
        },
        schemaVersion: 1,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      };
      db.sessions = db.sessions.filter((s) => s.id !== mockAllocSession.id);
      db.sessions.push(mockAllocSession);
      PersistenceService.saveDatabase(db);

      // Act as non-owner participant Aarav:
      await demoRepository.switchPersona('user_aarav');

      // 1. Mutator: acknowledgeRulebook
      const ackResult = await demoRepository.acknowledgeRulebook('sess_allocated_limited_05', 'user_aarav');
      expect(ackResult.roster.some((r) => r.userId === 'user_vikram')).toBe(false);
      expect(ackResult.roster.some((r) => r.userId === 'user_rohan')).toBe(false);
      expect(ackResult.roster.some((r) => r.userId === 'user_aarav')).toBe(true);

      // 2. Mutator: requestSpeakingTurn
      const reqResult = await demoRepository.requestSpeakingTurn('sess_allocated_limited_05', 'user_aarav');
      expect(reqResult.roster.some((r) => r.userId === 'user_vikram')).toBe(false);
      expect(reqResult.roster.some((r) => r.userId === 'user_rohan')).toBe(false);
      expect(reqResult.roster.some((r) => r.userId === 'user_aarav')).toBe(true);

      // 3. Mutator: cancelSpeakingTurn
      const cancelResult = await demoRepository.cancelSpeakingTurn('sess_allocated_limited_05', 'user_aarav');
      expect(cancelResult.roster.some((r) => r.userId === 'user_vikram')).toBe(false);
      expect(cancelResult.roster.some((r) => r.userId === 'user_rohan')).toBe(false);

      // 4. Verify internal DB state preserved the full roster!
      const freshDb = PersistenceService.loadDatabase();
      const internalSession = freshDb.sessions.find((s) => s.id === 'sess_allocated_limited_05');
      expect(internalSession?.roster).toHaveLength(3);
      expect(internalSession?.roster.some((r) => r.userId === 'user_vikram')).toBe(true);
      expect(internalSession?.roster.some((r) => r.userId === 'user_rohan')).toBe(true);

      // 5. Platform Owner gets full roster on mutators/reads
      await demoRepository.switchPersona('user_admin');
      const ownerSession = await demoRepository.getSession('sess_allocated_limited_05');
      expect(ownerSession?.roster.some((r) => r.userId === 'user_vikram')).toBe(true);
      expect(ownerSession?.roster.some((r) => r.userId === 'user_rohan')).toBe(true);

      // 6. Normal debate room flow on unallocated session (sess_jaipur_01) preserves full roster for non-owner
      await demoRepository.switchPersona('user_aarav');
      const normalAck = await demoRepository.acknowledgeRulebook('sess_jaipur_01', 'user_aarav');
      expect(normalAck.roster.length).toBeGreaterThan(1);
    });
  });
});
