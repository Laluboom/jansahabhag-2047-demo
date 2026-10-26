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
  Assembly,
  AssemblyRole,
  Session,
  SessionRosterEntry,
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
  package08BCoverage: [
    'assembly_named_roles_quota',
    'assembly_functional_zones_allocation', // Thinker, Enabler, Troubleshooter, Shaper
    'assembly_procedural_roles_allocation', // Chair, Co-Chair, Facilitator
    'assembly_three_person_secondary_roles_allocation',
    'assembly_role_assignment_guards',
    'assembly_facilitator_override_guards',
    'assembly_role_finalization_guards',
    'assembly_point_of_use_rulebook',
    'assembly_per_role_status_and_privacy_projections',
    'assembly_simulated_owner_exception_controls',
  ],
  dependentAssemblyDebateCoverage: [
    'assembly_named_roles_quota',
    'debate_room_speaking_queue_quota',
  ],
  package08C1Coverage: [
    'debate_room_named_roles_allocation', // Facilitator, Questioner, Evidence Analyst, Civic Advocate, Community Voice, Synthesiser, Rapporteur
    'debate_room_one_place_rounding_no_pooling',
    'debate_room_role_assignment_guards',
    'debate_room_role_withdrawal_guards',
    'debate_room_role_replacement_guards',
    'debate_room_role_finalization_guards',
    'debate_room_role_capacity_guards',
    'debate_room_simulated_owner_exception_controls',
    'debate_room_exception_invalidation_guards',
    'debate_room_privacy_projections',
  ],
  dependentDebate08C2Coverage: [
    'debate_room_point_of_use_rulebook',
    'debate_room_owner_controls_ui',
    'debate_room_browser_journey',
    'combined_cross_module_reservation_ui',
  ],
  package11Coverage: [
    'youth_parliament_preview_delegation_illustration',
    'youth_parliament_fictional_rajkot_3place_scenarios',
    'youth_parliament_point_of_use_rulebook',
    'youth_parliament_illustrative_notice_540_members',
    'comprehensive_module_rulebook_coverage_audit',
  ],
  parliamentPreviewStatus:
    'Clickable prototype preview only. Demonstrates fictional 3-seat Rajkot delegation calculation via shared allocation service without live member appointment or backend selection enforcement.',
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
 * Determines whether an allocation cohort is small enough that exposing numeric breakdowns
 * (reserved/ordinary/vacancies counts, status, audit snapshots) allows deductive inference
 * of individual reservation declarations or eligibility.
 *
 * Covers allocations where planned capacity is 1–3 OR current confirmed occupancy is 1–3.
 */
export function isSmallCohortAllocation(totalPlaces: number, confirmedCount?: number): boolean {
  const isSmallCapacity = totalPlaces >= 1 && totalPlaces <= 3;
  const isSmallOccupancy = confirmedCount !== undefined && confirmedCount >= 1 && confirmedCount <= 3;
  return isSmallCapacity || isSmallOccupancy;
}

/**
 * Strips private individual reservation eligibility arrays (reservedOccupants, ordinaryOccupants, confirmedOccupants)
 * and sensitive audit details from an AllocationState.
 *
 * Suppresses category breakdown, vacancies, compliance/exception status, and private audit
 * when either planned capacity OR current confirmed occupancy is 1–3, or for allocated limited events.
 *
 * Only the simulated Platform Owner (role: 'platform_admin') is authorized to receive unredacted
 * validation details and arrays.
 */
export function sanitizeAllocationForPublic(
  allocation: AllocationState,
  isOwner: boolean = false
): AllocationState {
  const sanitized: AllocationState = {
    ...allocation,
  };

  if (isOwner) {
    return sanitized;
  }

  delete sanitized.reservedOccupants;
  delete sanitized.ordinaryOccupants;
  const confirmedCount =
    sanitized.confirmedOccupants?.length ??
    ((sanitized.reservedOccupiedCount ?? 0) + (sanitized.ordinaryOccupiedCount ?? 0));
  delete sanitized.confirmedOccupants;

  const isSmall = isSmallCohortAllocation(sanitized.totalPlaces, confirmedCount);

  // For small cohorts (capacity 1–3 or occupancy 1–3) or allocated limited events: withhold exact counts
  if (isSmall || sanitized.allocationType === 'event_places') {
    sanitized.isPrivacySuppressed = true;
    delete sanitized.reservedOccupiedCount;
    delete sanitized.ordinaryOccupiedCount;
    delete sanitized.vacanciesCount;

    // Suppress status if it implies individual reservation eligibility (compliance, non-compliance, or exception)
    if (
      sanitized.status === 'finalized_compliant' ||
      sanitized.status === 'blocked_noncompliant' ||
      sanitized.status === 'finalized_exception'
    ) {
      delete sanitized.status;
    }

    sanitized.isException = false;
    delete sanitized.exceptionAudit;
  } else {
    // For larger allocations (> 3 places and > 3 occupants), aggregate numbers can be reported
    // without revealing individual declarations, but exception audits are sanitized of private reason/actorId:
    if (sanitized.exceptionAudit) {
      sanitized.exceptionAudit = {
        ...sanitized.exceptionAudit,
        actorId: undefined,
        reason: undefined,
      };
    }
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

  const vacancies = allocation.vacanciesCount ?? Math.max(0, allocation.reservedMinimum - reservedFilled);

  if (!isCompliant) {
    if (vacancies > 0) {
      warnings.push(
        `Unmet reserved minimum: ${reservedFilled} of ${allocation.reservedMinimum} reserved places filled. ` +
        `${vacancies} place(s) remain held vacant by default.`
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

  let currentStatus: AllocationStatus = allocation.status || 'pending';
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
    vacanciesCount: vacancies,
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
  customDeclarations?: Record<string, ReservationEligibility>,
  isOwner: boolean = false
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
      reason: isOwner
        ? `Event capacity reached. Both reserved places (${allocation.reservedMinimum}) and ordinary places (${allocation.ordinaryPlaces}) are filled.`
        : `Event capacity of ${allocation.totalPlaces} has been reached. Overbooking is prevented.`,
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
  const reason = isOwner
    ? `Ordinary capacity reached (${ordinaryFilled}/${allocation.ordinaryPlaces}). ` +
      `The remaining ${remainingReserved} place(s) are reserved under the 33% mandatory women's reservation policy. ` +
      `Unmet reserved places stay vacant by default unless an audited Platform Owner exception is approved.`
    : `This RSVP cannot be accepted under current allocation rules. Reserved places are not automatically reassigned under the reservation policy.`;

  return {
    allowed: false,
    reason,
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

declare module '../types/domain' {
  interface Event {
    registeredCount?: number;
  }
}

/**
 * Determines whether an event is an allocated limited event governed by the 33% reservation policy.
 * Legacy unvalidated events (e.g. unvalidated_legacy) are excluded.
 */
export function isAllocatedLimitedEvent(evt?: { allocation?: AllocationState | null } | null): boolean {
  if (!evt || !evt.allocation) return false;
  return evt.allocation.status !== 'unvalidated_legacy';
}

export interface RoleAssignmentCheckResult {
  allowed: boolean;
  reason?: string;
  placeType?: 'reserved' | 'ordinary';
}

/**
 * Evaluates whether a user can be assigned to a specific named role allocation in an Assembly.
 *
 * Rules:
 * 1. If user is already confirmed in this role, update is allowed.
 * 2. Total occupants cannot exceed totalPlaces (no overbooking).
 * 3. Eligible participants claim reserved places first (up to reservedMinimum), then ordinary places.
 * 4. Ineligible/undeclared participants can ONLY claim ordinary places (up to ordinaryPlaces).
 * 5. Unmet reserved places stay vacant by default and cannot be claimed by ordinary participants
 *    unless an explicit Platform Owner exception is approved.
 * 6. Non-owners receive state-neutral denial to prevent deductive inference of private declarations.
 */
export function canUserClaimRoleAllocation(
  allocation: AllocationState,
  userId: string,
  customDeclarations?: Record<string, ReservationEligibility>,
  isOwner: boolean = false
): RoleAssignmentCheckResult {
  if (allocation.confirmedOccupants?.includes(userId)) {
    return { allowed: true };
  }

  const currentCount =
    allocation.confirmedOccupants?.length ??
    ((allocation.reservedOccupiedCount ?? 0) + (allocation.ordinaryOccupiedCount ?? 0));

  const roleTitle = allocation.title || 'Role';

  if (currentCount >= allocation.totalPlaces) {
    return {
      allowed: false,
      reason: isOwner
        ? `${roleTitle} allocation capacity of ${allocation.totalPlaces} has been reached. Overbooking is prevented.`
        : `${roleTitle} capacity has been reached. Overbooking is prevented.`,
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
      reason: isOwner
        ? `${roleTitle} capacity reached. Both reserved places (${allocation.reservedMinimum}) and ordinary places (${allocation.ordinaryPlaces}) are filled.`
        : `${roleTitle} capacity of ${allocation.totalPlaces} has been reached. Overbooking is prevented.`,
    };
  }

  // Ineligible or undeclared participant
  if (ordinaryFilled < allocation.ordinaryPlaces) {
    return { allowed: true, placeType: 'ordinary' };
  }

  // If approved exception allows ordinary users into vacant reserved places:
  if (allocation.isException && currentCount < allocation.totalPlaces) {
    return { allowed: true, placeType: 'ordinary' };
  }

  // Unmet reserved places stay vacant by default
  const remainingReserved = allocation.reservedMinimum - reservedFilled;
  const reason = isOwner
    ? `Ordinary capacity reached (${ordinaryFilled}/${allocation.ordinaryPlaces}) for ${roleTitle}. ` +
      `The remaining ${remainingReserved} place(s) are reserved under the 33% mandatory women's reservation policy. ` +
      `Unmet reserved role places stay vacant by default unless an audited Platform Owner exception is approved.`
    : `This role assignment cannot be accepted under current allocation rules. Reserved places are not automatically reassigned under the reservation policy.`;

  return {
    allowed: false,
    reason,
  };
}

export interface BuildAssemblyRoleAllocationsInput {
  assemblyId: string;
  isThreePersonMiniMode?: boolean;
  participantUserIds?: string[];
  roles?: AssemblyRole[];
  facilitatorId?: string;
  chairId?: string;
  coChairId?: string;
  existingAllocations?: Record<string, AllocationState>;
  customDeclarations?: Record<string, ReservationEligibility>;
  plannedPlacesOverrides?: Record<string, number>;
}

/**
 * Constructs or updates the full set of named role allocations for a Youth Assembly:
 * - Functional Zone Roles: Thinker, Enabler, Troubleshooter, Shaper
 * - Procedural Roles: Chair, Co-Chair (if configured), Facilitator
 * - Secondary Roles: In 3-person mini-deliberation mode
 *
 * Each allocation calculates its own minimum ceil(0.33 * totalPlaces) separately without pooling.
 */
export function buildAssemblyRoleAllocations(
  input: BuildAssemblyRoleAllocationsInput
): Record<string, AllocationState> {
  const result: Record<string, AllocationState> = {};
  const roles = input.roles || [];
  const existing = input.existingAllocations || {};
  const overrides = input.plannedPlacesOverrides || {};

  // Procedural Leadership Roles
  // 1. Chair
  const chairOccupants = input.chairId ? [input.chairId] : [];
  const chairPlaces = overrides['Chair'] ?? existing['Chair']?.totalPlaces ?? 1;
  result['Chair'] = buildAllocationState({
    allocationId: `alloc_${input.assemblyId}_chair`,
    allocationType: 'named_roles',
    title: 'Assembly Chair',
    totalPlaces: chairPlaces,
    confirmedOccupants: chairOccupants,
    existingStatus: existing['Chair']?.status ?? 'unvalidated_legacy',
    existingExceptionAudit: existing['Chair']?.exceptionAudit,
    customDeclarations: input.customDeclarations,
  });

  // 2. Facilitator
  const facilitatorOccupants = input.facilitatorId ? [input.facilitatorId] : [];
  const facilitatorPlaces = overrides['Facilitator'] ?? existing['Facilitator']?.totalPlaces ?? 1;
  result['Facilitator'] = buildAllocationState({
    allocationId: `alloc_${input.assemblyId}_facilitator`,
    allocationType: 'named_roles',
    title: 'Assembly Facilitator',
    totalPlaces: facilitatorPlaces,
    confirmedOccupants: facilitatorOccupants,
    existingStatus: existing['Facilitator']?.status ?? 'unvalidated_legacy',
    existingExceptionAudit: existing['Facilitator']?.exceptionAudit,
    customDeclarations: input.customDeclarations,
  });

  // 3. Co-Chair (if configured or planned)
  if (input.coChairId || overrides['Co-Chair'] || existing['Co-Chair']) {
    const coChairOccupants = input.coChairId ? [input.coChairId] : [];
    const coChairPlaces = overrides['Co-Chair'] ?? existing['Co-Chair']?.totalPlaces ?? 1;
    result['Co-Chair'] = buildAllocationState({
      allocationId: `alloc_${input.assemblyId}_co_chair`,
      allocationType: 'named_roles',
      title: 'Assembly Co-Chair',
      totalPlaces: coChairPlaces,
      confirmedOccupants: coChairOccupants,
      existingStatus: existing['Co-Chair']?.status ?? 'unvalidated_legacy',
      existingExceptionAudit: existing['Co-Chair']?.exceptionAudit,
      customDeclarations: input.customDeclarations,
    });
  }

  // Functional Primary Roles: Thinker, Enabler, Troubleshooter, Shaper
  const functionalRoles: import('../types/domain').AssemblyRoleType[] = [
    'Thinker',
    'Enabler',
    'Troubleshooter',
    'Shaper',
  ];

  const defaultFunctionalPlaces = input.isThreePersonMiniMode ? 1 : 6;

  for (const rName of functionalRoles) {
    const occupants = roles
      .filter((r) => r.roleName === rName && r.assemblyId === input.assemblyId)
      .map((r) => r.userId);

    let totalPlaces = overrides[rName] ?? existing[rName]?.totalPlaces;
    if (totalPlaces === undefined) {
      if (input.isThreePersonMiniMode) {
        totalPlaces = occupants.length > 0 ? occupants.length : (rName === 'Shaper' ? 0 : 1);
      } else {
        totalPlaces = defaultFunctionalPlaces;
      }
    }

    result[rName] = buildAllocationState({
      allocationId: `alloc_${input.assemblyId}_${rName.toLowerCase()}`,
      allocationType: 'named_roles',
      title: `${rName} Role Allocation`,
      totalPlaces,
      confirmedOccupants: occupants,
      existingStatus: existing[rName]?.status ?? 'unvalidated_legacy',
      existingExceptionAudit: existing[rName]?.exceptionAudit,
      customDeclarations: input.customDeclarations,
    });
  }

  // Secondary Roles in 3-person mini-deliberation mode
  if (input.isThreePersonMiniMode) {
    for (const rName of functionalRoles) {
      const secondaryOccupants = roles
        .filter((r) => r.secondaryRoleName === rName && r.assemblyId === input.assemblyId)
        .map((r) => r.userId);

      const secondaryKey = `Secondary ${rName}`;
      const primaryOccupants = roles
        .filter((r) => r.roleName === rName && r.assemblyId === input.assemblyId)
        .map((r) => r.userId);

      if (
        secondaryOccupants.length > 0 ||
        existing[secondaryKey] ||
        overrides[secondaryKey] ||
        primaryOccupants.length === 0
      ) {
        const totalPlaces = overrides[secondaryKey] ?? existing[secondaryKey]?.totalPlaces ?? 1;
        result[secondaryKey] = buildAllocationState({
          allocationId: `alloc_${input.assemblyId}_sec_${rName.toLowerCase()}`,
          allocationType: 'named_roles',
          title: `${secondaryKey} Allocation`,
          totalPlaces,
          confirmedOccupants: secondaryOccupants,
          existingStatus:
            existing[secondaryKey]?.status ??
            (secondaryOccupants.length === 0 ? 'pending' : 'unvalidated_legacy'),
          existingExceptionAudit: existing[secondaryKey]?.exceptionAudit,
          customDeclarations: input.customDeclarations,
        });
      }
    }
  }

  return result;
}

/**
 * Projects an Assembly for a caller by applying privacy sanitization across all its roleAllocations.
 */
export function projectAssemblyForCaller(
  assembly: Assembly,
  caller?: { id: string; role: string } | null
): Assembly {
  const isOwner = caller?.role === 'platform_admin';
  const cloned: Assembly = JSON.parse(JSON.stringify(assembly));

  if (cloned.roleAllocations) {
    const sanitizedMap: Record<string, AllocationState> = {};
    for (const [key, alloc] of Object.entries(cloned.roleAllocations)) {
      sanitizedMap[key] = sanitizeAllocationForPublic(alloc, isOwner);
    }
    cloned.roleAllocations = sanitizedMap;
  }

  return cloned;
}

export interface BuildSessionRoleAllocationsInput {
  sessionId: string;
  facilitatorId?: string;
  roster?: SessionRosterEntry[];
  existingAllocations?: Record<string, AllocationState>;
  customDeclarations?: Record<string, ReservationEligibility>;
  plannedPlacesOverrides?: Record<string, number>;
}

/**
 * Constructs or updates the full set of formal named role allocations for a Debate Room / Session:
 * - Canonical Debate Roles: Facilitator, Questioner, Evidence Analyst, Civic Advocate,
 *   Community Voice, Synthesiser, Rapporteur.
 * - Any additional formal named roles introduced through the session model.
 * - Open roster participation (role 'Participant', 'Observer', etc.) and speaking queue
 *   are preserved as open participation, not fixed role allocations.
 * - Every one-place role applies ceil(0.33 * 1) = 1 without pooling.
 * - Facilitator is NOT exempt.
 * - Seeded appointments start as 'unvalidated_legacy' or provisional until reviewed.
 */
export function buildSessionRoleAllocations(
  input: BuildSessionRoleAllocationsInput
): Record<string, AllocationState> {
  const result: Record<string, AllocationState> = {};
  const roster = input.roster || [];
  const existing = input.existingAllocations || {};
  const overrides = input.plannedPlacesOverrides || {};

  // Canonical debate roles from seeded roster
  const canonicalRoles: string[] = [
    'Facilitator',
    'Questioner',
    'Evidence Analyst',
    'Civic Advocate',
    'Community Voice',
    'Synthesiser',
    'Rapporteur',
  ];

  // Open participation roles that do not form fixed role allocations
  const openParticipationRoles = new Set(['participant', 'observer', 'open participant', '']);

  // Collect all formal named roles: canonical roles plus any additional formal named roles in roster or overrides or existing
  const allRoles = new Set<string>(canonicalRoles);

  for (const entry of roster) {
    const roleTrimmed = (entry.role || '').trim();
    if (roleTrimmed && !openParticipationRoles.has(roleTrimmed.toLowerCase())) {
      allRoles.add(roleTrimmed);
    }
  }
  for (const key of Object.keys(existing)) {
    allRoles.add(key);
  }
  for (const key of Object.keys(overrides)) {
    allRoles.add(key);
  }

  for (const roleName of allRoles) {
    let occupants: string[] = [];
    if (roleName === 'Facilitator') {
      const fromRoster = roster.filter((r) => r.role === 'Facilitator').map((r) => r.userId);
      const fromId = input.facilitatorId ? [input.facilitatorId] : [];
      occupants = Array.from(new Set([...fromId, ...fromRoster]));
    } else {
      occupants = Array.from(new Set(roster.filter((r) => r.role === roleName).map((r) => r.userId)));
    }

    const defaultPlaces = 1;
    const totalPlaces = overrides[roleName] ?? existing[roleName]?.totalPlaces ?? defaultPlaces;

    const roleSlug = roleName.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const allocationId = existing[roleName]?.allocationId || `alloc_${input.sessionId}_${roleSlug}`;

    const existingStatus =
      existing[roleName]?.status ??
      (occupants.length > 0 ? 'unvalidated_legacy' : 'pending');

    result[roleName] = buildAllocationState({
      allocationId,
      allocationType: 'named_roles',
      title: `${roleName} Allocation`,
      totalPlaces,
      confirmedOccupants: occupants,
      existingStatus,
      existingExceptionAudit: existing[roleName]?.exceptionAudit,
      customDeclarations: input.customDeclarations,
    });
  }

  return result;
}

/**
 * Projects a Session for a caller by applying privacy sanitization across all its roleAllocations
 * and redacting roster identities on allocated limited events for non-owners.
 */
export function projectSessionForCaller(
  session: Session,
  caller?: { id: string; role: string } | null,
  linkedEventIsAllocatedLimited: boolean = false
): Session {
  const isOwner = caller?.role === 'platform_admin';
  const cloned: Session = JSON.parse(JSON.stringify(session));

  if (cloned.roleAllocations) {
    const sanitizedMap: Record<string, AllocationState> = {};
    for (const [key, alloc] of Object.entries(cloned.roleAllocations)) {
      sanitizedMap[key] = sanitizeAllocationForPublic(alloc, isOwner);
    }
    cloned.roleAllocations = sanitizedMap;
  }

  if (cloned.debateData?.roleAllocations) {
    const sanitizedMap: Record<string, AllocationState> = {};
    for (const [key, alloc] of Object.entries(cloned.debateData.roleAllocations)) {
      sanitizedMap[key] = sanitizeAllocationForPublic(alloc, isOwner);
    }
    cloned.debateData.roleAllocations = sanitizedMap;
  }

  if (!isOwner && linkedEventIsAllocatedLimited) {
    const callerId = caller?.id;
    if (callerId) {
      cloned.roster = (cloned.roster || []).filter((entry) => entry.userId === callerId);
    } else {
      cloned.roster = [];
    }
  }

  return cloned;
}

export interface ParliamentDelegationSeat {
  seatNumber: number;
  seatLabel: string;
  categoryLabel: string;
  seatType: 'reserved' | 'ordinary' | 'vacant';
}

export interface ParliamentDelegationIllustrationData {
  scenario: 'compliant' | 'noncompliant' | 'overbooked_ordinary';
  allocation: AllocationState;
  validation: AllocationValidationResult;
  seats: ParliamentDelegationSeat[];
  summaryNote: string;
}

/**
 * Builds a fictional 3-seat Rajkot delegation scenario for the Youth Parliament preview.
 * Dynamically calculated by the shared reservation allocation service.
 * Demonstrates:
 * 1. Approved formula: ceil(0.33 * 3) = 1 reserved seat minimum, 2 ordinary seats.
 * 2. Compliant scenario: 1 eligible + 2 general -> Compliant.
 * 3. Non-compliant scenario: 0 eligible + 2 general -> 1 reserved seat held vacant by default.
 * 4. Overbooked ordinary scenario: Attempting to fill Seat 3 with an ordinary candidate -> Blocked by validation without Platform Owner exception.
 *
 * Privacy Invariant:
 * Evaluated using explicit fictional declarations only (e.g. VSC-S-001/VSC-S-002: eligible, VSC-S-005/VSC-S-006/VSC-S-007: ineligible),
 * never inferred from names or demographic proxies.
 * Outputs anonymous fictional seat labels without exposing linked individual personas or IDs.
 */
export function buildParliamentDelegationIllustration(
  scenario: 'compliant' | 'noncompliant' | 'overbooked_ordinary'
): ParliamentDelegationIllustrationData {
  const totalPlaces = 3;

  if (scenario === 'compliant') {
    const confirmedOccupants = ['VSC-S-002', 'VSC-S-005', 'VSC-S-006'];
    const allocation = buildAllocationState({
      allocationId: 'alloc_parliament_rajkot_delegation_demo',
      allocationType: 'cohort_places',
      totalPlaces,
      title: 'Rajkot Youth Delegation to Youth Parliament (3 Seats — Compliant Scenario)',
      confirmedOccupants,
      existingStatus: 'pending',
    });
    const validation = validateAllocation(allocation);

    return {
      scenario,
      allocation,
      validation,
      seats: [
        {
          seatNumber: 1,
          seatLabel: 'Seat #1 — Fictional Reserved Allocation',
          categoryLabel: 'Occupied by Eligible Candidate',
          seatType: 'reserved',
        },
        {
          seatNumber: 2,
          seatLabel: 'Seat #2 — Fictional General Allocation',
          categoryLabel: 'Occupied by General Candidate',
          seatType: 'ordinary',
        },
        {
          seatNumber: 3,
          seatLabel: 'Seat #3 — Fictional General Allocation',
          categoryLabel: 'Occupied by General Candidate',
          seatType: 'ordinary',
        },
      ],
      summaryNote:
        'Compliant allocation: 1 of 1 mandatory reserved place is occupied by a candidate with an explicit eligible declaration. General capacity (2/2) is fully occupied.',
    };
  }

  if (scenario === 'noncompliant') {
    const confirmedOccupants = ['VSC-S-005', 'VSC-S-006'];
    const allocation = buildAllocationState({
      allocationId: 'alloc_parliament_rajkot_delegation_demo',
      allocationType: 'cohort_places',
      totalPlaces,
      title: 'Rajkot Youth Delegation to Youth Parliament (3 Seats — Non-Compliant Scenario)',
      confirmedOccupants,
      existingStatus: 'pending',
    });
    const validation = validateAllocation(allocation);

    return {
      scenario,
      allocation,
      validation,
      seats: [
        {
          seatNumber: 1,
          seatLabel: 'Seat #1 — Fictional General Allocation',
          categoryLabel: 'Occupied by General Candidate',
          seatType: 'ordinary',
        },
        {
          seatNumber: 2,
          seatLabel: 'Seat #2 — Fictional General Allocation',
          categoryLabel: 'Occupied by General Candidate',
          seatType: 'ordinary',
        },
        {
          seatNumber: 3,
          seatLabel: 'Seat #3 — Fictional Reserved Allocation',
          categoryLabel: 'Held Vacant by Default (Reserved)',
          seatType: 'vacant',
        },
      ],
      summaryNote:
        'Non-compliant allocation: 0 of 1 reserved place filled. Under the approved policy, the unmet reserved place remains vacant by default and cannot be automatically assigned to general candidates.',
    };
  }

  // overbooked_ordinary: 3 ordinary occupants without an approved owner exception
  const confirmedOccupants = ['VSC-S-005', 'VSC-S-006', 'VSC-S-007'];
  const allocation = buildAllocationState({
    allocationId: 'alloc_parliament_rajkot_delegation_demo',
    allocationType: 'cohort_places',
    totalPlaces,
    title: 'Rajkot Youth Delegation to Youth Parliament (3 Seats — Blocked Ordinary Overbooking Attempt)',
    confirmedOccupants,
    existingStatus: 'pending',
  });
  const validation = validateAllocation(allocation);

  return {
    scenario,
    allocation,
    validation,
    seats: [
      {
        seatNumber: 1,
        seatLabel: 'Seat #1 — Fictional General Allocation',
        categoryLabel: 'Occupied by General Candidate',
        seatType: 'ordinary',
      },
      {
        seatNumber: 2,
        seatLabel: 'Seat #2 — Fictional General Allocation',
        categoryLabel: 'Occupied by General Candidate',
        seatType: 'ordinary',
      },
      {
        seatNumber: 3,
        seatLabel: 'Seat #3 — Blocked General Allocation',
        categoryLabel: 'Blocked without Platform Owner Exception',
        seatType: 'ordinary',
      },
    ],
    summaryNote:
      'Blocked non-compliant attempt: Ordinary capacity exceeded (3/2). Reserved places cannot be transferred to ordinary participants without an approved Platform Owner exception.',
  };
}
