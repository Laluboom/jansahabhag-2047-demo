/**
 * FICTIONAL DEMO SEED ONLY — RAJKOT COHORT
 *
 * Explicit simulated declarations for testing 33% women's reservation policy.
 * Under Platform Owner choices for Shri Manibhai Virani and Smt. Navalben Virani Science College (Autonomous), Rajkot:
 * - Real gender collection and production authority remain undecided.
 * - Never infer eligibility from names, photographs, voices, or proxies.
 * - Declarations are strictly stored separately from public User models.
 * - Unseeded participants evaluate to 'undeclared'.
 * - Individual declarations must never appear in public UI or participant rosters.
 *
 * Exactly 5 women in the 15-student roster: ceil(0.33 * 15) = 5.
 * Staff, guest, founder, and moderators hold no student seats.
 */

export type FictionalReservationEligibility = 'eligible' | 'ineligible' | 'undeclared';

export const POLICY_VERSION = '2026.1-womens-reservation-33';

/** Reserve names kept aside outside the 15 student roster */
export const RESERVE_CANDIDATE_WOMEN = [
  'Jinal Bhagya',
  'Prensha Jaisalya',
  'Nisha Bhimani',
];

export const SUGGESTED_MEN_RESERVE_NAMES = ['R.O. Mehta'];

export const SEED_FICTIONAL_RESERVATION_DECLARATIONS: Record<string, FictionalReservationEligibility> = {
  // Exactly 5 eligible women among the 15 student demo personas:
  'VSC-S-001': 'eligible', // Ankita Kapri (Main demo persona)
  'VSC-S-002': 'eligible', // Niyati Chawda
  'VSC-S-003': 'eligible', // Harshita Kapri (Must stay in group)
  'VSC-S-004': 'eligible', // Jahanvi Sandh
  'VSC-S-015': 'eligible', // Asmi Soni

  // 10 ineligible student demo personas:
  'VSC-S-005': 'ineligible', // Yash Rathod
  'VSC-S-006': 'ineligible', // Kanha Kapri
  'VSC-S-007': 'ineligible', // Hriday Trivedi
  'VSC-S-008': 'ineligible', // Maharshi Bhardwaj
  'VSC-S-009': 'ineligible', // Aroh Mehta
  'VSC-S-010': 'ineligible', // Ajit Sanghar
  'VSC-S-011': 'ineligible', // Aslan Sandh
  'VSC-S-012': 'ineligible', // Piyush Kanjaria
  'VSC-S-013': 'ineligible', // Jigar Sanghar
  'VSC-S-014': 'ineligible', // Dhruv Patel

  // Staff, guests, founder, moderators (hold no student seats):
  'VSC-T-001': 'ineligible', // Shri Mayur Parmar
  'VSC-T-002': 'ineligible', // Shri Ankit Kalaria
  'VSC-P-001': 'ineligible', // Shri Dr. K. D. Ladwa
  'VSC-G-001': 'ineligible', // Shri Param Pujya Tyagvallabh Swamiji
  'JS-F-001': 'ineligible',  // Nazim M. Sandh
  'JS-M-001': 'ineligible',  // Yashvi Dalsaniya
  'JS-M-002': 'ineligible',  // Dilip Sandhar
};

export function getFictionalReservationEligibility(userId: string): FictionalReservationEligibility {
  if (!userId) return 'undeclared';
  return SEED_FICTIONAL_RESERVATION_DECLARATIONS[userId] || 'undeclared';
}
