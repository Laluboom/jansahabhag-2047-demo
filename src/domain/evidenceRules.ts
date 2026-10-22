/**
 * Domain constants and rules for civic evidence, media consent, and recording boundaries.
 * Review Additions 3 and V2 Evidence Rules.
 */

export const MAX_EVIDENCE_FILE_BYTES = 250 * 1024; // 250 KB conservative storage limit

export const ALLOWED_EVIDENCE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
] as const;

export const ALLOWED_EVIDENCE_FORMAT_LABELS = 'JPEG, PNG, WebP, PDF, CSV, TXT';

export const NO_RECORDING_RULE_TITLE = 'No recording without facilitator permission';

export const NO_RECORDING_RULE_TEXT =
  'No recording without facilitator permission. Live audio, video, or photography recording is strictly disabled by default across all deliberative chambers, youth assemblies, debate rooms, and fieldwork exercises. Participants and observers must never record sessions or capture identifiable media of participants without explicit, advance permission from the designated session facilitator and informed consent from all participants.';

export const FACE_CONSENT_WARNING_TEXT =
  "Do not upload other people's faces without their permission.";

export const EVIDENCE_FILE_LIMIT_TEXT =
  `Allowed types: ${ALLOWED_EVIDENCE_FORMAT_LABELS}. Actual file limit: 250 KB (durable browser storage limit).`;

export interface EvidenceAccessActor {
  id: string;
  role: string;
}

/**
 * Evaluates whether an actor can access private evidence.
 * Preserves owner, reviewer (teacher, facilitator), and admin boundaries.
 */
export function canActorAccessPrivateEvidence(
  actor: EvidenceAccessActor | null | undefined,
  evidenceOwnerId: string
): boolean {
  if (!actor) return false;
  if (actor.id === evidenceOwnerId) return true;
  return (
    actor.role === 'teacher' ||
    actor.role === 'facilitator' ||
    actor.role === 'platform_admin' ||
    actor.role === 'institution_admin'
  );
}
