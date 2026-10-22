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

export interface LinkedSubmissionInfo {
  evidenceIds: string[];
  reviewerId?: string;
  userId?: string;
  assignmentId?: string;
}

export interface EvidenceAccessItem {
  id?: string;
  ownerId: string;
  visibility?: string;
  assignmentId?: string;
}

/**
 * Evaluates whether an actor can access a private evidence record.
 * In accordance with Review Additions 3 and V2 evidence rules:
 * Permits ONLY:
 * 1. Evidence owner (actor.id === evidence.ownerId)
 * 2. Assigned reviewer (actor.id === linkedSubmission.reviewerId for a submission referencing this evidence)
 * 3. Programme administrator or platform admin ('programme_manager' | 'platform_admin')
 * Blanket teacher, facilitator, and institution_admin access is strictly disallowed.
 */
export function canActorAccessPrivateEvidence(
  actor: EvidenceAccessActor | null | undefined,
  evidenceOrOwnerId: string | EvidenceAccessItem,
  submissions: LinkedSubmissionInfo[] = []
): boolean {
  if (!actor) return false;

  const ownerId = typeof evidenceOrOwnerId === 'string' ? evidenceOrOwnerId : evidenceOrOwnerId.ownerId;
  const evidenceId = typeof evidenceOrOwnerId === 'string' ? undefined : evidenceOrOwnerId.id;
  const assignmentId = typeof evidenceOrOwnerId === 'string' ? undefined : evidenceOrOwnerId.assignmentId;

  // 1. Evidence owner has access
  if (actor.id === ownerId) {
    return true;
  }

  // 2. Explicit administrator access (programme_manager or platform_admin)
  if (actor.role === 'programme_manager' || actor.role === 'platform_admin') {
    return true;
  }

  // 3. Assigned reviewer access via linked submission
  if (submissions && submissions.length > 0) {
    const isAssigned = submissions.some((s) => {
      if (s.reviewerId !== actor.id) return false;
      if (evidenceId && s.evidenceIds && s.evidenceIds.includes(evidenceId)) return true;
      if (assignmentId && s.assignmentId === assignmentId && s.userId === ownerId) return true;
      return false;
    });
    if (isAssigned) return true;
  }

  // Blanket access denied for other roles (unrelated teachers, facilitators, institution admins, peers)
  return false;
}

export interface ModerationCaseAccessItem {
  id: string;
  reporterId: string;
  reviewerId?: string;
}

/**
 * Evaluates whether an actor can view a moderation case.
 * In accordance with content safety and privacy rules:
 * Permits ONLY:
 * 1. Platform administrator or programme manager ('platform_admin' | 'programme_manager')
 * 2. Assigned reviewer for this specific case (actor.id === case.reviewerId)
 * 3. Case reporter (actor.id === case.reporterId)
 * Unauthorized participants and unrelated staff cannot view cases or leak private target data.
 */
export function canActorViewModerationCase(
  actor: EvidenceAccessActor | null | undefined,
  modCase: ModerationCaseAccessItem
): boolean {
  if (!actor) return false;
  if (actor.role === 'platform_admin' || actor.role === 'programme_manager') {
    return true;
  }
  if (modCase.reviewerId && actor.id === modCase.reviewerId) {
    return true;
  }
  if (actor.id === modCase.reporterId) {
    return true;
  }
  return false;
}

/**
 * Evaluates whether an actor can update a moderation case (status, notes, resolutionDetails).
 * In accordance with content safety governance:
 * Permits ONLY:
 * 1. Platform administrator or programme manager ('platform_admin' | 'programme_manager')
 * 2. Already assigned reviewer per the stored case record (actor.id === case.reviewerId)
 * Participant self-assignment is strictly prohibited.
 */
export function canActorUpdateModerationCase(
  actor: EvidenceAccessActor | null | undefined,
  modCase: ModerationCaseAccessItem
): boolean {
  if (!actor) return false;
  if (actor.role === 'platform_admin' || actor.role === 'programme_manager') {
    return true;
  }
  if (modCase.reviewerId && actor.id === modCase.reviewerId) {
    return true;
  }
  return false;
}
