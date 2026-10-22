import { AllocationState } from '../../types/domain';

/**
 * Typed Seat & Seating View Models for Deliberative Chambers
 *
 * Layout Topologies:
 * - Debate: Facing For/Against benches with moderator bench and central speaker podium.
 * - Assembly: Four balanced functional zones (Thinker, Enabler, Troubleshooter, Shaper)
 *   plus Chair/Facilitator rostrum.
 * - Parliament: Apex deliberative horseshoe with Speaker, Government/Treasury benches,
 *   Opposition benches, and Cross-benches.
 */

export type SeatingLayoutMode = 'debate' | 'assembly' | 'parliament';

export type SeatStatus =
  | 'speaking'
  | 'active'
  | 'waiting'
  | 'present'
  | 'vacant'
  | 'reserved';

export interface SeatModel {
  id: string;
  userId?: string;
  name: string;
  initials?: string;
  avatar?: string;
  role: string;
  sideOrBench?: string; // e.g. 'For' | 'Against' | 'Moderator' | 'Thinker' | 'Enabler' | 'Troubleshooter' | 'Shaper' | 'Speaker' | 'Government' | 'Opposition' | 'Cross-bench'
  status: SeatStatus;
  isSpeaking?: boolean;
  hasDissent?: boolean;
  dissentSummary?: string;
  isReserved?: boolean;
  institution?: string;
  currentActivity?: string;
  bio?: string;
}

export interface SeatingQuotaSummary {
  totalCapacity: number;
  filledCount?: number;
  reservedMinimum: number;
  reservedFilledCount?: number;
  vacanciesCount?: number;
  isPrivacySuppressed?: boolean;
  isIllustrative?: boolean;
  illustrativeNotice?: string;
}

export interface SessionSeatingProps {
  layout: SeatingLayoutMode;
  title?: string;
  subtitle?: string;
  seats: SeatModel[];
  quotaSummary?: SeatingQuotaSummary;
  activeSpeakerId?: string | null;
  selectedSeatId?: string | null;
  onSelectSeat?: (seat: SeatModel | null) => void;
  isIllustrative?: boolean;
  illustrativeDisclaimer?: string;
  currentRoute?: 'debate' | 'assembly' | 'parliament';
  className?: string;
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Computes chamber-level seating quota summary by summing projected AllocationState fields:
 * - totalCapacity: sum of alloc.totalPlaces
 * - reservedMinimum: sum of alloc.reservedMinimum (per-named-role rounding, not global rounding!)
 * - isPrivacySuppressed: true if any allocation is small cohort (1-3 places/occupants) or marked isPrivacySuppressed.
 *   In that case, exact reservedFilledCount and vacanciesCount are withheld (undefined).
 * - When not suppressed (e.g. authorized Platform Owner), sums reservedOccupiedCount and vacanciesCount.
 */
export function computeSeatingQuotaFromAllocations(
  roleAllocations?: Record<string, AllocationState> | null,
  options?: {
    isIllustrative?: boolean;
    illustrativeNotice?: string;
  }
): SeatingQuotaSummary {
  if (!roleAllocations || Object.keys(roleAllocations).length === 0) {
    return {
      totalCapacity: 0,
      filledCount: 0,
      reservedMinimum: 0,
      isPrivacySuppressed: false,
      isIllustrative: Boolean(options?.isIllustrative),
      illustrativeNotice: options?.illustrativeNotice,
    };
  }

  const allocs = Object.values(roleAllocations);
  let totalCapacity = 0;
  let reservedMinimum = 0;
  let isPrivacySuppressed = false;

  for (const alloc of allocs) {
    totalCapacity += alloc.totalPlaces || 0;
    reservedMinimum += alloc.reservedMinimum || 0;
    if (
      alloc.isPrivacySuppressed ||
      alloc.reservedOccupiedCount === undefined ||
      alloc.vacanciesCount === undefined
    ) {
      isPrivacySuppressed = true;
    }
  }

  if (isPrivacySuppressed) {
    return {
      totalCapacity,
      reservedMinimum,
      isPrivacySuppressed: true,
      isIllustrative: Boolean(options?.isIllustrative),
      illustrativeNotice: options?.illustrativeNotice,
    };
  }

  const reservedFilledCount = allocs.reduce((sum, a) => sum + (a.reservedOccupiedCount ?? 0), 0);
  const vacanciesCount = allocs.reduce((sum, a) => sum + (a.vacanciesCount ?? 0), 0);
  const filledCount = allocs.reduce(
    (sum, a) => sum + (a.reservedOccupiedCount ?? 0) + (a.ordinaryOccupiedCount ?? 0),
    0
  );

  return {
    totalCapacity,
    filledCount,
    reservedMinimum,
    reservedFilledCount,
    vacanciesCount,
    isPrivacySuppressed: false,
    isIllustrative: Boolean(options?.isIllustrative),
    illustrativeNotice: options?.illustrativeNotice,
  };
}
