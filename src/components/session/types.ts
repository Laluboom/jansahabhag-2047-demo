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
  filledCount: number;
  reservedMinimum: number;
  reservedFilledCount: number;
  vacanciesCount: number;
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
