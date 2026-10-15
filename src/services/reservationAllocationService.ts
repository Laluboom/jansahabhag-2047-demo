/**
 * Shared 33% Women's Reservation Allocation Policy and Validation Service
 *
 * Governing Reference:
 * - Archived Master PRD & Supplementary 33% Women's Reservation PRD (§§1–10).
 * - Fictional competition demo operating in a single labelled browser.
 *
 * ALLOCATION SURFACES INVENTORY NOTE:
 * ====================================
 * Active named-role and limited-place allocation surfaces in this branch:
 * 1. Covered by Package 08A:
 *    - Reusable reservation allocation mathematical model, partition logic, validation,
 *      audit records, and simulated Platform Owner exception authorization.
 *    - Capacity-limited Event Places (`Event.capacity`, `Event.attendeeUserIds`, `Event.rsvpMap`,
 *      `Event.checkedInUserIds`, point-of-use event rulebook, aggregate reservation metrics UI).
 *    - Evaluated Programme Cohort flow: Evaluated current codebase Programme entities; identified
 *      that Programme does not define participant seat quotas or cohort selection logic.
 *
 * 2. Scoped for Dependent Package (Assembly & Debate):
 *    - Assembly named roles ('Thinker', 'Enabler', 'Troubleshooter', 'Shaper', secondary roles)
 *      in `joinAssembly` and `overrideAssemblyRole`.
 *    - Debate room speaking queue and formal participant roster roles in `DebateRoomData`.
 *    - Combined multi-module reservation policy administration dashboard.
 *
 * Package 08A explicitly claims coverage only for the shared policy engine and event places.
 */

import {
  AllocationState,
  AllocationStatus,
  AllocationAuditRecord,
  AllocationValidationResult,
  ReservationEligibility,
} from '../types/domain';
import {
  POLICY_VERSION,
  getFictionalReservationEligibility,
} from '../data/seed/fictionalReservationDeclarations';

export { POLICY_VERSION };

export const ALLOCATION_SURFACES_INVENTORY = {
  package08ACoverage: [
    'shared_reservation_policy_service',
    'capacity_limited_event_places',
    'event_rsvp_capacity_controls',
    'event_check_in_allocation_guards',
    'event_point_of_use_rulebook',
    'event_aggregate_reservation_metrics_ui',
  ],
  dependentAssemblyDebateCoverage: [
    'assembly_named_roles_quota',
    'debate_room_speaking_queue_quota',
    'combined_cross_module_reservation_ui',
  ],
  programmeCohortStatus: 'No place allocation or cohort quota logic currently exists on Programme entities.',
} as const;

/**
 * Calculates the required minimum reserved places for any defined allocation.
 * Per approved owner formula: ceil(0.33 * allocatedPlaces), calculated separately
 * for each allocation without pooling, including 1–3 places.
 */
export function calculateReservedMinimum(totalPlaces: number): number {
  if (!totalPlaces || totalPlaces <= 0) return 0;
  return Math.ceil(0.33 * totalPlaces);
}

export interface BuildAllocationInput {
  allocationId: string;
  allocationType: 'event_places' | 'named_roles' | 'cohort_places';
  totalPlaces: number;
  confirmedOccupants: string[];
  title?: string;
  existingStatus?: AllocationStatus;
  existingExceptionAudit?: AllocationAuditRecord;
  customDeclarations?: Record<string, ReservationEligibility>;
}

/**
 * Pure function to construct or update an AllocationState.
 *
 * Partitions confirmed occupants into reserved and ordinary places:
 * - Eligible participants occupy reserved places up to reservedMinimum.
 * - Any excess eligible participants, plus ineligible/undeclared participants, occupy ordinary places.
 * - Unmet reserved places stay vacant by default; they are never silently converted to ordinary places.
 * - Individual declarations are NOT attached to public occupant outputs.
 */
export function buildAllocationState(input: BuildAllocationInput): AllocationState {
  const totalPlaces = Math.max(0, input.totalPlaces || 0);
  const reservedMinimum = calculateReservedMinimum(totalPlaces);
  const ordinaryPlaces = Math.max(0, totalPlaces - reservedMinimum);

  const getEligibility = (uid: string): ReservationEligibility => {
    if (input.customDeclarations && uid in input.customDeclarations) {
      return input.customDeclarations[uid];
    }
    return getFictionalReservationEligibility(uid);
  };

  const reservedOccupants: string[] = [];
  const ordinaryOccupants: string[] = [];

  for (const uid of input.confirmedOccupants) {
    const eligibility = getEligibility(uid);
    if (eligibility === 'eligible') {
      if (reservedOccupants.length < reservedMinimum) {
        reservedOccupants.push(uid);
      } else {
        ordinaryOccupants.push(uid);
      }
    } else {
      ordinaryOccupants.push(uid);
    }
  }

  const vacanciesCount = Math.max(0, reservedMinimum - reservedOccupants.length);
  const isException = Boolean(input.existingExceptionAudit);

  let status: AllocationStatus = input.existingStatus || 'pending';
  if (status === 'unvalidated_legacy') {
    // Preserve legacy status until explicitly finalized or overridden
  } else if (isException) {
    status = 'finalized_exception';
  } else if (status === 'finalized_compliant') {
    // Re-verify if it still qualifies
    if (reservedOccupants.length < reservedMinimum) {
      status = 'blocked_noncompliant';
    }
  }

  return {
    allocationId: input.allocationId,
    allocationType: input.allocationType,
    title: input.title,
    totalPlaces,
    reservedMinimum,
    ordinaryPlaces,
    confirmedOccupants: [...input.confirmedOccupants],
    reservedOccupants,
    ordinaryOccupants,
    reservedOccupiedCount: reservedOccupants.length,
    ordinaryOccupiedCount: ordinaryOccupants.length,
    vacanciesCount,
    status,
    isException,
    exceptionAudit: input.existingExceptionAudit,
    policyVersion: POLICY_VERSION,
    lastValidatedAt: new Date().toISOString(),
  };
}

/**
 * Strips private individual reservation eligibility arrays (reservedOccupants, ordinaryOccupants, confirmedOccupants)
 * and sensitive audit details from an AllocationState, retaining only aggregate public figures (counts, minimum, vacancies, status).
 */
export function sanitizeAllocationForPublic(
  allocation: AllocationState,
  isStaffOrOwner: boolean = false
): AllocationState {
  const sanitized: AllocationState = {
    ...allocation,
  };
  delete sanitized.reservedOccupants;
  delete sanitized.ordinaryOccupants;
  delete sanitized.confirmedOccupants;

  if (sanitized.exceptionAudit && !isStaffOrOwner) {
    const sanitizedAudit: AllocationAuditRecord = {
      ...sanitized.exceptionAudit,
    };
    delete sanitizedAudit.actorId;
    delete sanitizedAudit.reason;
    sanitized.exceptionAudit = sanitizedAudit;
  }

  // Small allocation privacy protection:
  // In cohorts with <= 2 places where a single occupant exists, deductive correlation
  // can directly expose individual status. Flag privacy suppression.
  if (sanitized.totalPlaces <= 2 && (allocation.confirmedOccupants?.length || 0) === 1) {
    sanitized.isPrivacySuppressed = true;
  }

  return sanitized;
}

/**
 * Validates an allocation state against the 33% reservation policy.
 */
export function validateAllocation(allocation: AllocationState): AllocationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const totalOccupants =
    allocation.confirmedOccupants?.length ??
    ((allocation.reservedOccupiedCount ?? 0) + (allocation.ordinaryOccupiedCount ?? 0));
  if (totalOccupants > allocation.totalPlaces) {
    errors.push(`Overbooking detected: ${totalOccupants} occupants exceed capacity of ${allocation.totalPlaces}.`);
  }

  const reservedFilled = allocation.reservedOccupiedCount ?? (allocation.reservedOccupants?.length ?? 0);
  const ordinaryFilled = allocation.ordinaryOccupiedCount ?? (allocation.ordinaryOccupants?.length ?? 0);
  const isCompliant = reservedFilled >= allocation.reservedMinimum;

  if (!isCompliant) {
    if (allocation.vacanciesCount > 0) {
      warnings.push(
        `Unmet reserved minimum: ${reservedFilled} of ${allocation.reservedMinimum} reserved places filled. ` +
        `${allocation.vacanciesCount} place(s) remain held vacant by default.`
      );
    }
  }

  // Ordinary cap check: ordinaryOccupants cannot exceed ordinaryPlaces unless an approved exception is active
  if (ordinaryFilled > allocation.ordinaryPlaces) {
    if (!allocation.isException) {
      errors.push(
        `Ordinary capacity exceeded (${ordinaryFilled}/${allocation.ordinaryPlaces}). ` +
        `Reserved places cannot be transferred to ordinary participants without an approved Platform Owner exception.`
      );
    }
  }

  const canFinalize = (isCompliant || allocation.isException) && errors.length === 0;

  let currentStatus = allocation.status;
  if (currentStatus !== 'unvalidated_legacy') {
    if (allocation.isException) {
      currentStatus = 'finalized_exception';
    } else if (currentStatus === 'finalized_compliant' && !isCompliant) {
      currentStatus = 'blocked_noncompliant';
    }
  }

  return {
    isValid: errors.length === 0,
    status: currentStatus,
    canFinalize,
    reservedMinimum: allocation.reservedMinimum,
    reservedOccupiedCount: reservedFilled,
    ordinaryOccupiedCount: ordinaryFilled,
    vacanciesCount: allocation.vacanciesCount,
    isCompliant,
    isException: allocation.isException,
    errors,
    warnings,
  };
}

export interface RsvpCheckResult {
  allowed: boolean;
  reason?: string;
  placeType?: 'reserved' | 'ordinary';
}

/**
 * Evaluates whether a user can RSVP for a place in an allocation.
 *
 * Rules:
 * 1. If user is already confirmed, RSVP update is allowed.
 * 2. Total occupants cannot exceed totalPlaces (no overbooking).
 * 3. Eligible participants claim reserved places first (up to reservedMinimum), then ordinary places.
 * 4. Ineligible/undeclared participants can ONLY claim ordinary places (up to ordinaryPlaces).
 * 5. Unmet reserved places stay vacant by default and cannot be claimed by ordinary participants
 *    unless an explicit owner exception is approved.
 */
export function canUserRsvpAllocation(
  allocation: AllocationState,
  userId: string,
  customDeclarations?: Record<string, ReservationEligibility>
): RsvpCheckResult {
  if (allocation.confirmedOccupants?.includes(userId)) {
    return { allowed: true };
  }

  const currentCount =
    allocation.confirmedOccupants?.length ??
    ((allocation.reservedOccupiedCount ?? 0) + (allocation.ordinaryOccupiedCount ?? 0));

  if (currentCount >= allocation.totalPlaces) {
    return {
      allowed: false,
      reason: `Event capacity of ${allocation.totalPlaces} has been reached. Overbooking is prevented.`,
    };
  }

  const eligibility = customDeclarations && userId in customDeclarations
    ? customDeclarations[userId]
    : getFictionalReservationEligibility(userId);

  const reservedFilled = allocation.reservedOccupiedCount ?? (allocation.reservedOccupants?.length ?? 0);
  const ordinaryFilled = allocation.ordinaryOccupiedCount ?? (allocation.ordinaryOccupants?.length ?? 0);

  if (eligibility === 'eligible') {
    if (reservedFilled < allocation.reservedMinimum) {
      return { allowed: true, placeType: 'reserved' };
    }
    if (ordinaryFilled < allocation.ordinaryPlaces) {
      return { allowed: true, placeType: 'ordinary' };
    }
    if (allocation.isException && currentCount < allocation.totalPlaces) {
      return { allowed: true, placeType: 'ordinary' };
    }
    return {
      allowed: false,
      reason: `Event capacity reached. Both reserved places (${allocation.reservedMinimum}) and ordinary places (${allocation.ordinaryPlaces}) are filled.`,
    };
  }

  // Ineligible or undeclared participant
  if (ordinaryFilled < allocation.ordinaryPlaces) {
    return { allowed: true, placeType: 'ordinary' };
  }

  // If an approved exception allows ordinary users into vacant reserved places:
  if (allocation.isException && currentCount < allocation.totalPlaces) {
    return { allowed: true, placeType: 'ordinary' };
  }

  // Unmet reserved places stay vacant by default
  const remainingReserved = allocation.reservedMinimum - reservedFilled;
  return {
    allowed: false,
    reason:
      `Ordinary capacity reached (${ordinaryFilled}/${allocation.ordinaryPlaces}). ` +
      `The remaining ${remainingReserved} place(s) are reserved under the 33% mandatory women's reservation policy. ` +
      `Unmet reserved places stay vacant by default unless an audited Platform Owner exception is approved.`,
  };
}

/**
 * Attempts finalization of an allocation.
 *
 * Rules:
 * - If compliant, marks status as 'finalized_compliant'.
 * - If an approved exception is in place, marks status as 'finalized_exception'.
 * - If noncompliant and no approved exception, REJECTS finalization with an error and
 *   leaves state unchanged (does NOT mutate input).
 */
export function finalizeAllocationState(
  allocation: AllocationState,
  actor: { id: string; role: string }
): { updatedAllocation: AllocationState; audit: AllocationAuditRecord } {
  const validation = validateAllocation(allocation);
  const reservedFilled = allocation.reservedOccupiedCount ?? (allocation.reservedOccupants?.length ?? 0);
  const ordinaryFilled = allocation.ordinaryOccupiedCount ?? (allocation.ordinaryOccupants?.length ?? 0);

  if (!validation.canFinalize) {
    throw new Error(
      `Cannot finalize allocation "${allocation.allocationId}": 33% reservation requirement unmet ` +
      `(${reservedFilled}/${allocation.reservedMinimum} reserved places filled). ` +
      `Unmet reserved places stay vacant by default unless Platform Owner approves an audited exception.`
    );
  }

  const finalStatus: AllocationStatus = allocation.isException ? 'finalized_exception' : 'finalized_compliant';

  const audit: AllocationAuditRecord = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    allocationId: allocation.allocationId,
    action: 'finalized',
    actorId: actor.id,
    actorRole: actor.role,
    policyVersion: POLICY_VERSION,
    outcome: `Allocation successfully finalized with status "${finalStatus}".`,
    timestamp: new Date().toISOString(),
    snapshot: {
      totalPlaces: allocation.totalPlaces,
      reservedMinimum: allocation.reservedMinimum,
      reservedOccupiedCount: reservedFilled,
      ordinaryOccupiedCount: ordinaryFilled,
      vacanciesCount: allocation.vacanciesCount,
      status: finalStatus,
    },
  };

  const updatedAllocation: AllocationState = {
    ...allocation,
    reservedOccupiedCount: reservedFilled,
    ordinaryOccupiedCount: ordinaryFilled,
    status: finalStatus,
    lastValidatedAt: new Date().toISOString(),
  };

  return { updatedAllocation, audit };
}

/**
 * Approves an owner exception for a non-compliant or vacant allocation.
 *
 * Security & Authority Guard:
 * - Restrict simulated owner approval to the 'platform_admin' persona.
 * - Callers with participant, organizer, facilitator, or teacher roles cannot approve exceptions.
 * - Records reason, approver ID, timestamp, policy version, and outcome.
 * - Visibly marks as an exception, NEVER as ordinary compliance.
 */
export function approveAllocationExceptionState(
  allocation: AllocationState,
  actor: { id: string; role: string },
  reason: string
): { updatedAllocation: AllocationState; audit: AllocationAuditRecord } {
  if (actor.role !== 'platform_admin') {
    throw new Error(
      `Unauthorized: Only Platform Owner (role: platform_admin) can approve reservation exceptions. ` +
      `Caller "${actor.id}" has role "${actor.role}".`
    );
  }

  if (!reason || reason.trim().length < 5) {
    throw new Error('A substantive reason (minimum 5 characters) is required to approve an exception.');
  }

  const reservedFilled = allocation.reservedOccupiedCount ?? (allocation.reservedOccupants?.length ?? 0);
  const ordinaryFilled = allocation.ordinaryOccupiedCount ?? (allocation.ordinaryOccupants?.length ?? 0);

  const now = new Date().toISOString();
  const audit: AllocationAuditRecord = {
    id: `audit_exc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    allocationId: allocation.allocationId,
    action: 'exception_approved',
    actorId: actor.id,
    actorRole: actor.role,
    reason: reason.trim(),
    policyVersion: POLICY_VERSION,
    outcome: `Exception approved: Allocation finalized under exception with ${allocation.vacanciesCount} vacant reserved seat(s).`,
    timestamp: now,
    snapshot: {
      totalPlaces: allocation.totalPlaces,
      reservedMinimum: allocation.reservedMinimum,
      reservedOccupiedCount: reservedFilled,
      ordinaryOccupiedCount: ordinaryFilled,
      vacanciesCount: allocation.vacanciesCount,
      status: 'finalized_exception',
    },
  };

  const updatedAllocation: AllocationState = {
    ...allocation,
    reservedOccupiedCount: reservedFilled,
    ordinaryOccupiedCount: ordinaryFilled,
    status: 'finalized_exception',
    isException: true,
    exceptionAudit: audit,
    lastValidatedAt: now,
  };

  return { updatedAllocation, audit };
}
