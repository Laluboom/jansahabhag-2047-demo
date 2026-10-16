/**
 * FICTIONAL DEMO SEED ONLY
 *
 * Explicit simulated declarations for testing 33% women's reservation policy.
 * Under Platform Owner choices for this Jaipur fictional competition demo:
 * - Real gender collection and production authority remain undecided.
 * - Never infer eligibility from names, photographs, voices, or proxies.
 * - Declarations are strictly stored separately from public User models.
 * - Unseeded participants evaluate to 'undeclared'.
 * - Individual declarations must never appear in public UI or participant rosters.
 */

export type FictionalReservationEligibility = 'eligible' | 'ineligible' | 'undeclared';

export const POLICY_VERSION = '2026.1-womens-reservation-33';

export const SEED_FICTIONAL_RESERVATION_DECLARATIONS: Record<string, FictionalReservationEligibility> = {
  // Fictional explicit eligible participants:
  user_priya: 'eligible',
  user_meera: 'eligible',
  user_kavita: 'eligible',
  user_ananya: 'eligible',
  user_neha: 'eligible',
  user_aditi: 'eligible',
  user_isha: 'eligible',
  user_diya: 'eligible',
  user_tanya: 'eligible',
  user_pooja: 'eligible',

  // Fictional explicit ineligible / general participants:
  user_aarav: 'ineligible',
  user_vikram: 'ineligible',
  user_kabir: 'ineligible',
  user_siddharth: 'ineligible',
  user_aryan: 'ineligible',
  user_karan: 'ineligible',
  user_manav: 'ineligible',
  user_rahul: 'ineligible',
  user_rohan: 'ineligible',
  user_dev: 'ineligible',
  user_admin: 'ineligible',
};

export function getFictionalReservationEligibility(userId: string): FictionalReservationEligibility {
  if (!userId) return 'undeclared';
  return SEED_FICTIONAL_RESERVATION_DECLARATIONS[userId] || 'undeclared';
}
