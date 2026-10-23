export type UserRole =
  | 'participant'
  | 'teacher'
  | 'facilitator'
  | 'institution_admin'
  | 'programme_manager'
  | 'platform_admin'
  | 'moderator';

export type Visibility = 'public' | 'institution' | 'assembly' | 'private';

export type VerificationStatus = 'unverified' | 'under_review' | 'verified' | 'flagged';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  username?: string;
  avatar: string;
  institutionId: string;
  institutionName: string;
  programmeIds: string[];
  bio: string;
  age: number;
  location: string;
  badgeCount: number;
  totalCredits: number;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type InstitutionType = 'school' | 'college' | 'university' | 'youth_club' | 'ngo';

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  code: string;
  district: string;
  state: string;
  activeParticipantsCount: number;
  programmesCount: number;
  contactEmail: string;
  bannerUrl?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type ProgrammeStatus = 'active' | 'draft' | 'archived';

export interface Programme {
  id: string;
  title: string;
  code: string;
  description: string;
  institutionIds: string[];
  courseIds: string[];
  leadManagerId: string;
  theme: string;
  activeAssemblyIds: string[];
  status: ProgrammeStatus;
  startDate: string;
  endDate: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type CourseTrack = 'civic_academy' | 'self_growth' | 'uhv' | 'action_skills';
export type CourseLevel = 'foundational' | 'intermediate' | 'advanced';

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessonIds: string[];
}

export interface Course {
  id: string;
  programmeId: string;
  title: string;
  code: string;
  description: string;
  track: CourseTrack;
  level: CourseLevel;
  estimatedMinutes: number;
  modules: Module[];
  moduleCount: number;
  lessonCount: number;
  bannerUrl?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface LessonSection {
  id: string;
  title: string;
  type: 'reading' | 'video_sim' | 'interactive_quiz' | 'reflection';
  body: string;
}

export interface Lesson {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  order: number;
  estimatedMinutes: number;
  contentSummary: string;
  learningObjectives: string[];
  sections: LessonSection[];
  assignmentId?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type EnrolmentStatus = 'not_started' | 'in_progress' | 'completed';

export interface Enrolment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrolmentStatus;
  completedLessonIds: string[];
  progressPercent: number;
  startedAt?: string;
  completedAt?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type EvidenceType = 'document' | 'image' | 'observation' | 'survey' | 'interview' | 'attendance' | 'link';

export interface RubricItem {
  criterion: string;
  maxPoints: number;
  description: string;
}

export type AssignmentType = 'civic_assignment' | 'uhv_reflection';

export interface Assignment {
  id: string;
  courseId: string;
  lessonId?: string;
  sessionId?: string;
  assignmentType?: AssignmentType;
  title: string;
  prompt: string;
  rubric: RubricItem[];
  requiredEvidenceType?: EvidenceType;
  creditsReward: number;
  status: 'draft' | 'active' | 'archived';
  dueDate?: string;
  timeLimitMinutes?: number;
  isPopupAssignment?: boolean;
  facilitatorId?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type SubmissionStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'verified'
  | 'revision_requested'
  | 'completed';

export interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  content: string;
  evidenceIds: string[];
  status: SubmissionStatus;
  isUhvReflection?: boolean;
  visibility?: 'private' | 'shared_with_mentor';
  teacherFeedback?: string;
  reviewerId?: string;
  reviewedAt?: string;
  score?: number;
  submittedAt?: string;
  receiptId?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceFileInfo {
  name: string;
  size: number;
  type: string;
  blobKey?: string;
  dataUrl?: string;
  demoLabel?: string;
  storageType?: 'indexeddb' | 'inline' | 'metadata_only';
}

export interface Evidence {
  id: string;
  ownerId: string;
  ownerName: string;
  type: EvidenceType;
  title: string;
  description: string;
  source: string;
  location?: string;
  visibility: Visibility;
  verificationStatus: VerificationStatus;
  tags: string[];
  mediaUrl?: string;
  metadata?: Record<string, string | number | boolean>;
  assignmentId?: string;
  observationTime?: string;
  fileInfo?: EvidenceFileInfo;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType =
  | 'lesson_completed'
  | 'assignment_submitted'
  | 'evidence_logged'
  | 'assembly_joined'
  | 'contribution_added'
  | 'proposition_voted'
  | 'reflection_shared'
  | 'project_milestone'
  | 'credit_awarded';

export interface Activity {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  description: string;
  referenceId?: string;
  referenceType?: string;
  timestamp: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type EventType = 'assembly' | 'workshop' | 'field_audit' | 'dialogue' | 'expert_session';
export type EventStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';

export type ReservationEligibility = 'eligible' | 'ineligible' | 'undeclared';

export type AllocationStatus =
  | 'pending'
  | 'finalized_compliant'
  | 'finalized_exception'
  | 'blocked_noncompliant'
  | 'unvalidated_legacy';

export interface AllocationAuditRecord {
  id: string;
  allocationId: string;
  action:
    | 'created'
    | 'updated'
    | 'finalized'
    | 'exception_approved'
    | 'finalization_rejected'
    | 'exception_invalidated';
  actorId?: string; // approver persona (private to owner)
  actorName?: string; // approver display name (private to owner)
  actorRole: string; // approver role (e.g. 'platform_admin')
  reason?: string; // substantive reason (private to owner)
  policyVersion: string;
  outcome: string;
  timestamp: string;
  snapshot: {
    totalPlaces: number;
    reservedMinimum: number;
    reservedOccupiedCount?: number;
    ordinaryOccupiedCount?: number;
    vacanciesCount?: number;
    status?: AllocationStatus;
  };
}

export interface AllocationState {
  allocationId: string;
  allocationType: 'event_places' | 'named_roles' | 'cohort_places';
  title?: string;
  totalPlaces: number;
  reservedMinimum: number; // ceil(0.33 * totalPlaces)
  ordinaryPlaces: number; // totalPlaces - reservedMinimum
  confirmedOccupants?: string[]; // user IDs (internal validation only)
  reservedOccupants?: string[]; // eligible user IDs occupying reserved places (internal validation only)
  ordinaryOccupants?: string[]; // occupants taking ordinary places (internal validation only)
  reservedOccupiedCount?: number; // aggregate public count (withheld in small cohorts)
  ordinaryOccupiedCount?: number; // aggregate public count (withheld in small cohorts)
  vacanciesCount?: number; // unfilled reserved places: reservedMinimum - reservedOccupiedCount (withheld in small cohorts)
  status?: AllocationStatus; // public status (suppressed in small cohorts if revealing)
  isException: boolean;
  exceptionAudit?: AllocationAuditRecord;
  policyVersion: string;
  lastValidatedAt: string;
  isPrivacySuppressed?: boolean; // privacy protection active for small cohorts
}

export interface AllocationValidationResult {
  isValid: boolean;
  status: AllocationStatus;
  canFinalize: boolean;
  reservedMinimum: number;
  reservedOccupiedCount: number;
  ordinaryOccupiedCount: number;
  vacanciesCount: number;
  isCompliant: boolean;
  isException: boolean;
  errors: string[];
  warnings: string[];
}

export interface Event {
  id: string;
  programmeId: string;
  title: string;
  description: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  isVirtual: boolean;
  meetingUrl?: string;
  organizerId: string;
  attendeeUserIds: string[];
  checkedInUserIds?: string[];
  rsvpMap?: Record<string, 'attending' | 'maybe' | 'declined'>;
  capacity: number;
  status: EventStatus;
  allocation?: AllocationState;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionAgendaItem {
  time: string;
  topic: string;
  presenter: string;
}

export interface SessionResource {
  title: string;
  url: string;
  type: string;
}

export type SessionMode =
  | 'standard_meeting'
  | 'debate_room'
  | 'youth_assembly'
  | 'youth_parliament'
  | 'workshop';

export interface SessionRosterEntry {
  userId: string;
  name: string;
  role: string;
  joinedAt: string;
  isSpeaking?: boolean;
}

export interface SessionModeTransition {
  id: string;
  fromMode: SessionMode;
  toMode: SessionMode;
  timestamp: string;
  initiatedBy: string;
  summary?: string;
}

export type DebatePhase =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'OPEN'
  | 'MOTION_CONFIRMED'
  | 'OPENING_STATEMENTS'
  | 'DISCUSSION'
  | 'REBUTTAL_OR_QUESTIONS'
  | 'CLOSING_STATEMENTS'
  | 'REFLECTION'
  | 'CLOSED'
  | 'REPORT_PUBLISHED';

export const DEBATE_PHASES: DebatePhase[] = [
  'DRAFT',
  'SCHEDULED',
  'OPEN',
  'MOTION_CONFIRMED',
  'OPENING_STATEMENTS',
  'DISCUSSION',
  'REBUTTAL_OR_QUESTIONS',
  'CLOSING_STATEMENTS',
  'REFLECTION',
  'CLOSED',
  'REPORT_PUBLISHED',
];

export interface SpeakingQueueEntry {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  requestedAt: string;
  recognizedAt?: string;
  status: 'waiting' | 'speaking' | 'completed' | 'cancelled';
}

export interface DebateContribution {
  id: string;
  userId: string;
  userName: string;
  phase: DebatePhase;
  timestamp: string;
  text: string;
  evidenceIds?: string[];
}

export interface DebateRulebookRule {
  title: string;
  content: string;
}

export interface DebateRulebook {
  version: string;
  title: string;
  rules: DebateRulebookRule[];
}

export interface DebateSpeechTimerState {
  speakerId?: string | null;
  secondsRemaining: number;
  totalSeconds: number;
  isRunning: boolean;
  lastUpdated?: string;
}

export interface DebatePopupAssignmentState {
  assignmentId: string;
  title: string;
  instruction: string;
  timeLimitMinutes: number;
  pushedBy: string;
  pushedAt: string;
  expiresAt: string;
  isClosed?: boolean;
}

export interface DebateRoomData {
  motion: string;
  linkedQuestion?: string;
  propositionId?: string;
  currentPhase: DebatePhase;
  speakingQueue: SpeakingQueueEntry[];
  activeSpeakerId?: string | null;
  contributions: DebateContribution[];
  evidenceIds: string[];
  rulebook: DebateRulebook;
  acknowledgedUserIds?: string[];
  reflectionPrompt?: string;
  roleAllocations?: Record<string, AllocationState>;
  rolePlanStage?: 'planned' | 'open_selection' | 'finalized';
  votes?: Record<string, 'for' | 'against' | 'abstain'>;
  speechTimer?: DebateSpeechTimerState;
  activePopupAssignmentId?: string | null;
  popupAssignment?: DebatePopupAssignmentState;
}

export type CanonicalDebateRole =
  | 'Facilitator'
  | 'Questioner'
  | 'Evidence Analyst'
  | 'Civic Advocate'
  | 'Community Voice'
  | 'Synthesiser'
  | 'Rapporteur';

export const CANONICAL_DEBATE_ROLES: CanonicalDebateRole[] = [
  'Facilitator',
  'Questioner',
  'Evidence Analyst',
  'Civic Advocate',
  'Community Voice',
  'Synthesiser',
  'Rapporteur',
];

export interface Session {
  id: string;
  eventId: string;
  assemblyId?: string;
  title: string;
  agenda: SessionAgendaItem[];
  resources: SessionResource[];
  notesSummary?: string;
  currentMode: SessionMode;
  facilitatorId: string;
  roster: SessionRosterEntry[];
  modeTransitions: SessionModeTransition[];
  debateData?: DebateRoomData;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  roleAllocations?: Record<string, AllocationState>;
  rolePlanStage?: 'planned' | 'open_selection' | 'finalized';
}

export type AssemblyStage =
  | 'frame'
  | 'think'
  | 'enable'
  | 'troubleshoot'
  | 'shape'
  | 'final_assembly';

export const CANONICAL_ASSEMBLY_STAGES: {
  stage: AssemblyStage;
  label: string;
  number: number;
  coreQuestion: string;
  desc: string;
}[] = [
  {
    stage: 'frame',
    label: 'Frame',
    number: 1,
    coreQuestion: 'What is the specific issue, scope, and boundary?',
    desc: 'Define the specific issue, question, scope, constraints and terms.',
  },
  {
    stage: 'think',
    label: 'Think',
    number: 2,
    coreQuestion: 'What should we understand?',
    desc: 'Thinkers share substantive perspectives, domain evidence and question assumptions.',
  },
  {
    stage: 'enable',
    label: 'Enable',
    number: 3,
    coreQuestion: 'What would make it possible?',
    desc: 'Enablers examine resources, implementation route, ownership and feasibility.',
  },
  {
    stage: 'troubleshoot',
    label: 'Troubleshoot',
    number: 4,
    coreQuestion: 'What could go wrong?',
    desc: 'Troubleshooters surface risks, edge cases, harms and mitigations (Red Flags).',
  },
  {
    stage: 'shape',
    label: 'Shape',
    number: 5,
    coreQuestion: 'What should we take forward?',
    desc: 'Shapers synthesize draft wording, support areas and unresolved disagreements.',
  },
  {
    stage: 'final_assembly',
    label: 'Final Assembly',
    number: 6,
    coreQuestion: 'Where does the full assembly stand?',
    desc: 'Full assembly reviews, amends, responds and records support profile, dissent and outcome.',
  },
];

export type AssemblyStatus = 'upcoming' | 'active' | 'deliberating' | 'concluded' | 'archived';

export type AssemblyRoleType =
  | 'Thinker'
  | 'Enabler'
  | 'Troubleshooter'
  | 'Shaper';

export const CANONICAL_ASSEMBLY_ROLES: AssemblyRoleType[] = [
  'Thinker',
  'Enabler',
  'Troubleshooter',
  'Shaper',
];

export type AssemblyRolePower =
  | 'Question Setter'
  | 'Feasibility Check'
  | 'Red Flag'
  | 'Proposition Call';

export interface AssemblyRoleAction {
  id: string;
  assemblyId: string;
  userId: string;
  userName: string;
  roleName: AssemblyRoleType;
  power: AssemblyRolePower;
  title: string;
  description: string;
  status: 'pending_response' | 'addressed' | 'acknowledged';
  responseObligation: string;
  responseNote?: string;
  respondedBy?: string;
  respondedAt?: string;
  timestamp: string;
}

export interface AssemblyRoleOverrideAudit {
  id: string;
  assemblyId: string;
  userId: string;
  userName: string;
  previousRole: AssemblyRoleType;
  newRole: AssemblyRoleType;
  reason: string;
  overriddenBy: string;
  overriddenByName: string;
  timestamp: string;
}

export interface AssemblyRulebookRule {
  title: string;
  content: string;
}

export interface AssemblyRulebook {
  version: string;
  title: string;
  rules: AssemblyRulebookRule[];
  acknowledgedUserIds?: string[];
  materialChangeNotice?: string;
}

export interface Assembly {
  id: string;
  programmeId: string;
  title: string;
  theme: string;
  question: string;
  description: string;
  location: string;
  scheduledDate: string;
  currentStage: AssemblyStage;
  status: AssemblyStatus;
  participantUserIds: string[];
  facilitatorId: string;
  chairId?: string;
  evidenceIds: string[];
  propositionId?: string;
  rulebook?: AssemblyRulebook;
  speakingQueue?: SpeakingQueueEntry[];
  activeSpeakerId?: string | null;
  roleActions?: AssemblyRoleAction[];
  roleOverrideAudits?: AssemblyRoleOverrideAudit[];
  isThreePersonMiniMode?: boolean;
  coChairId?: string;
  roleAllocations?: Record<string, AllocationState>;
  rolePlanStage?: 'planned' | 'open_selection' | 'finalized';
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface AssemblyRole {
  id: string;
  assemblyId: string;
  userId: string;
  roleName: AssemblyRoleType;
  secondaryRoleName?: AssemblyRoleType;
  lens?: string;
  responsibilities: string[];
  power: AssemblyRolePower;
  powerActionDescription?: string;
  responseObligation?: string;
  badgeIcon?: string;
  promptSuggestions: string[];
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type ContributionType =
  | 'argument'
  | 'question'
  | 'evidence_link'
  | 'counter_point'
  | 'synthesis';

export interface Contribution {
  id: string;
  assemblyId: string;
  userId: string;
  userName: string;
  stage: AssemblyStage;
  type: ContributionType;
  text: string;
  evidenceIds: string[];
  supportCount: number;
  dissentCount: number;
  isSubstantive: boolean;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type PropositionOutcome =
  | 'CONSENSUS'
  | 'QUALIFIED_SUPPORT'
  | 'SPLIT_DECISION'
  | 'INSUFFICIENT_BASIS';

export type ParticipantResponseState =
  | 'Support'
  | 'Support with reservations'
  | 'Dissent'
  | 'Abstain / insufficient basis';

export interface ParticipantPropositionResponse {
  id: string;
  propositionId: string;
  userId: string;
  userName: string;
  userRole?: AssemblyRoleType;
  responseState: ParticipantResponseState;
  reasonOrReservations?: string;
  version: number;
  timestamp: string;
  history?: {
    version: number;
    responseState: ParticipantResponseState;
    reasonOrReservations?: string;
    timestamp: string;
  }[];
}

export interface PropositionRoutingEntry {
  id: string;
  stage: string;
  routedTo: string;
  status: 'simulated_routing' | 'received_by_chamber';
  timestamp: string;
  note: string;
}

export interface DissentRecord {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  suggestedAmendment: string;
  versionRecorded?: number;
  timestamp?: string;
}

export interface SupportProfile {
  stronglySupport: number;
  supportWithModifications: number;
  neutral: number;
  concerns: number;
}

export interface PropositionRevision {
  version: number;
  updatedBy: string;
  authorId?: string;
  authorRole?: string;
  changesSummary: string;
  timestamp: string;
  isAiGenerated?: boolean;
}

export interface Proposition {
  id: string;
  assemblyId: string;
  question: string;
  problem: string;
  insight: string;
  proposition: string;
  enablers: string[];
  risks: string[];
  nextStep: string;
  unresolvedQuestions: string[];
  dissent: DissentRecord[];
  supportProfile: SupportProfile;
  evidenceIds: string[];
  evidenceBasis?: string[];
  assumptions: string[];
  participantResponses: ParticipantPropositionResponse[];
  reviewerState: 'draft' | 'under_review' | 'reviewed' | 'finalised';
  publicationVisibility: 'internal_chamber' | 'assembly_members' | 'public_civic_record';
  routingHistory: PropositionRoutingEntry[];
  outcome: PropositionOutcome;
  version: number;
  revisions: PropositionRevision[];
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'planning' | 'active' | 'milestone_review' | 'completed' | 'archived';

export interface ProjectMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface ProjectNote {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Project {
  id: string;
  programmeId: string;
  title: string;
  civicObjective: string;
  status: ProjectStatus;
  leadUserId: string;
  memberUserIds: string[];
  milestones: ProjectMilestone[];
  evidenceIds: string[];
  outcomesSummary?: string;
  notes?: ProjectNote[];
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type ReflectionContextType = 'course' | 'assignment' | 'assembly' | 'project' | 'session' | 'general';

export interface Reflection {
  id: string;
  userId: string;
  contextType: ReflectionContextType;
  contextId: string;
  prompt: string;
  text: string;
  valuesHighlighted: string[];
  isPublicInPassport: boolean;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type CreditDimension =
  | 'Learning'
  | 'Observation'
  | 'Deliberation'
  | 'Reflection'
  | 'Contribution'
  | 'Collaboration'
  | 'Civic Action';

export type CreditSourceType =
  | 'lesson'
  | 'assignment'
  | 'evidence'
  | 'assembly'
  | 'contribution'
  | 'reflection'
  | 'project'
  | 'workspace'
  | 'dissent'
  | 'starting_balance';

export interface CreditFormulaFactors {
  appliedRule: string;
  activity?: string;
  quality?: string;
  evidence?: string;
  verification?: string;
  significance?: string;
}

export interface CreditAuditEntry {
  date: string;
  action: string;
  actorId: string;
  actorName: string;
  note: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  dimension: CreditDimension;
  amount: number;
  sourceType: CreditSourceType;
  sourceId: string;
  sourceRoute?: string;
  status: 'Pending' | 'Verified' | 'Audited' | 'Reversed';
  reason: string;
  calculationExplanation?: string;
  formulaFactors?: CreditFormulaFactors;
  auditTrail?: CreditAuditEntry[];
  createdAt: string;
  schemaVersion: number;
}

export type PassportCategory =
  | 'learning'
  | 'contribution'
  | 'deliberation'
  | 'civic_action'
  | 'reflection'
  | 'achievement';

export type VerificationState =
  | 'self_reported'
  | 'system_recorded'
  | 'facilitator_reviewed'
  | 'institution_verified'
  | 'sample_unverified';

export type ReviewState =
  | 'pending'
  | 'accepted'
  | 'revision_requested'
  | 'sample'
  | 'unreviewed';

export interface PassportAuditEntry {
  date: string;
  action: string;
  actorId: string;
  actorName: string;
  note?: string;
}

export interface PassportVerifier {
  id: string;
  name: string;
  role: string;
  label: string;
}

export interface PassportEntry {
  id: string;
  userId: string;
  category: PassportCategory;
  title: string;
  subtitle: string;
  date: string;
  creditsAwarded: number;
  evidenceIds: string[];
  sourceReferenceId: string;
  sourceReferenceType: string;
  sourceRoute?: string;
  authorId?: string;
  authorName?: string;
  verificationState: VerificationState;
  reviewState?: ReviewState;
  verifier?: PassportVerifier;
  organisation?: string;
  revisionHistory?: PassportAuditEntry[];
  visibility?: 'public' | 'community' | 'private';
  calculationExplanation?: string;
  isVerified: boolean;
  badgeUrl?: string;
  schemaVersion: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreditAppeal {
  id: string;
  userId: string;
  userName: string;
  targetType: 'credit' | 'submission' | 'passport';
  targetId: string;
  reason: string;
  status: 'pending_human_review' | 'under_review' | 'resolved' | 'rejected';
  assignedReviewerName: string;
  aiDisclaimer: string;
  reviewerFeedback?: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export type NotificationType =
  | 'assignment'
  | 'assembly'
  | 'review'
  | 'credit'
  | 'system'
  | 'project';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  targetRoute: string;
  createdAt: string;
  schemaVersion: number;
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  memberUserIds: string[];
  postCount: number;
  coverImageUrl?: string;
  isPrivate: boolean;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface PostReply {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  title: string;
  content: string;
  tags: string[];
  likesCount: number;
  likedByUserIds?: string[];
  replies: PostReply[];
  isPinned: boolean;
  schemaVersion: number;
  createdAt: string;
}

export type ModerationSeverity = 'low' | 'medium' | 'high';
export type ModerationStatus = 'open' | 'under_review' | 'actioned' | 'no_action';

export interface ModerationCase {
  id: string;
  reporterId: string;
  targetType: 'post' | 'evidence' | 'contribution' | 'user';
  targetId: string;
  reason: string;
  severity: ModerationSeverity;
  status: ModerationStatus;
  reviewerId?: string;
  notes?: string;
  resolutionDetails?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type CivicIssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type CivicIssueStatus = 'reported' | 'audited' | 'in_deliberation' | 'charter_drafted' | 'resolved';

export interface CivicIssue {
  id: string;
  title: string;
  location: string;
  ward: string;
  coordinates?: { lat: number; lng: number };
  category: string;
  severity: CivicIssueSeverity;
  status: CivicIssueStatus;
  description: string;
  reportsCount: number;
  upvotedByUserIds?: string[];
  evidenceIds: string[];
  assemblyId?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// Workspace Collaboration Domain Types (Master PRD §A12, §A13, §A20.4, §A21)
// ==========================================

export type WorkspaceType =
  | 'institution'
  | 'cross_institution'
  | 'project_topic'
  | 'username_invited'
  | 'open_interest';

export type WorkspaceVisibility = 'private' | 'institution_scoped' | 'public_discoverable';

export type WorkspaceLifecycleState =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'PAUSED'
  | 'RESTRICTED'
  | 'ARCHIVED';

export type WorkspaceMembershipState =
  | 'invited'
  | 'requested'
  | 'approved'
  | 'active'
  | 'restricted'
  | 'removed'
  | 'left';

export type WorkspaceRole = 'owner' | 'moderator' | 'member';

export interface WorkspacePermissionSet {
  canRead: boolean;
  canPost: boolean;
  canUpload: boolean;
  canInvite: boolean;
  canScheduleMeeting: boolean;
  canCreateSubroom: boolean;
  canModerate: boolean;
  canManageMembership: boolean;
}

export interface WorkspaceRule {
  id: string;
  title: string;
  content: string;
  isSafeguarding?: boolean;
}

export interface WorkspaceRulebook {
  version: string;
  title: string;
  lastUpdated: string;
  materialChangeNotice?: string;
  rules: WorkspaceRule[];
}

export interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  username: string;
  userRole: UserRole;
  institutionId?: string;
  institutionName?: string;
  role: WorkspaceRole;
  state: WorkspaceMembershipState;
  invitedBy?: string;
  invitedAt?: string;
  joinedAt?: string;
  statusReason?: string;
  statusChangedBy?: string;
  statusChangedAt?: string;
  permissions: WorkspacePermissionSet;
  lastAcknowledgedRuleVersion?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceActionType =
  | 'announcement'
  | 'team_note'
  | 'task'
  | 'thread'
  | 'resource';

export type WorkspaceActionStatus = 'active' | 'frozen' | 'removed';

export interface WorkspaceAction {
  id: string;
  workspaceId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorRole: WorkspaceRole;
  actionType: WorkspaceActionType;
  title: string;
  content: string;
  sourceLink?: {
    type: 'proposition' | 'assembly' | 'evidence' | 'external';
    id: string;
    label: string;
    url?: string;
  };
  tags?: string[];
  status: WorkspaceActionStatus;
  moderationReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceAuditEventType =
  | 'invite'
  | 'acceptance'
  | 'decline'
  | 'post'
  | 'report'
  | 'moderation'
  | 'removal'
  | 'restriction'
  | 'reentry'
  | 'rule_acknowledgement';

export interface WorkspaceAuditEvent {
  id: string;
  workspaceId: string;
  eventType: WorkspaceAuditEventType;
  actorId: string;
  actorName: string;
  actorRole: string;
  targetUserId?: string;
  targetUserName?: string;
  targetActionId?: string;
  reason?: string;
  details?: Record<string, any>;
  timestamp: string;
  schemaVersion: number;
}

export interface Workspace {
  id: string;
  title: string;
  purpose: string;
  type: WorkspaceType;
  visibility: WorkspaceVisibility;
  state: WorkspaceLifecycleState;
  institutionId?: string;
  institutionName?: string;
  ownerId: string;
  ownerName: string;
  moderatorIds: string[];
  allowedParticipantCategories: string[];
  linkedPropositionId?: string;
  linkedAssemblyId?: string;
  rulebook: WorkspaceRulebook;
  moderationContact: {
    name: string;
    role: string;
    emailOrChannel: string;
    safeguardingLead?: string;
  };
  storageQuotaBytes?: number;
  usedStorageBytes?: number;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Scoped Moderator Grants & Audit Model (Change Plan v2 §12)
// Platform-wide founder-held delegation distinct from workspace-local roles
// ============================================================================

export type ModeratorScopeType = 'assignments' | 'memberships' | 'named_session';

export interface ModeratorScope {
  type: ModeratorScopeType;
  /** For 'named_session', the specific sessionId this grant permits moderation in */
  sessionId?: string;
  sessionTitle?: string;
  /** Plain-text bounds of the delegated authority */
  description?: string;
}

export type ModeratorGrantStatus = 'active' | 'revoked' | 'expired';

export interface ScopedModeratorGrant {
  id: string;
  granteeId: string;
  granteeName: string;
  granteeRole: UserRole;
  granteeEmail?: string;
  grantorId: string; // Platform Owner / Founder persona ID ('user_admin')
  grantorName: string;
  grantorRole: 'platform_admin';
  scope: ModeratorScope;
  reason: string;
  createdAt: string;
  expiresAt: string; // ISO 8601
  status: ModeratorGrantStatus;
  revokedAt?: string;
  revokedBy?: string; // userId of platform owner
  revocationReason?: string;
  schemaVersion: number;
}

export type ScopedModeratorAuditAction =
  | 'grant_created'
  | 'grant_revoked'
  | 'grant_used'
  | 'grant_denied';

export interface ScopedModeratorAuditRecord {
  id: string;
  grantId?: string;
  action: ScopedModeratorAuditAction;
  actorId: string;
  actorName: string;
  actorRole: string;
  scopeType: ModeratorScopeType;
  targetId?: string;
  details: string;
  outcome: 'success' | 'denied';
  denialReason?: string;
  timestamp: string;
  schemaVersion: number;
}

export interface CohortEvidenceAuditRecord {
  id: string;
  timestamp: string;
  mentorId: string;
  mentorName: string;
  cohortId: string;
  documentType: 'attendance_sheet' | 'completion_certificate';
  participantCount: number;
  participantIds: string[];
  evidenceIds: string[];
  auditNotes: string;
  schemaVersion: number;
  createdAt: string;
}

export interface DemoDatabase {
  schemaVersion: number;
  activeUserId: string;
  users: User[];
  institutions: Institution[];
  programmes: Programme[];
  courses: Course[];
  lessons: Lesson[];
  enrolments: Enrolment[];
  assignments: Assignment[];
  submissions: Submission[];
  evidence: Evidence[];
  activities: Activity[];
  events: Event[];
  sessions: Session[];
  assemblies: Assembly[];
  assemblyRoles: AssemblyRole[];
  contributions: Contribution[];
  propositions: Proposition[];
  projects: Project[];
  reflections: Reflection[];
  credits: CreditTransaction[];
  passportEntries: PassportEntry[];
  notifications: Notification[];
  communityGroups: CommunityGroup[];
  communityPosts: CommunityPost[];
  moderationCases: ModerationCase[];
  civicIssues?: CivicIssue[];
  assemblyRoleActions?: AssemblyRoleAction[];
  assemblyRoleOverrideAudits?: AssemblyRoleOverrideAudit[];
  allocationAudits?: AllocationAuditRecord[];
  userDeclarations?: Record<string, ReservationEligibility>;
  workspaces?: Workspace[];
  workspaceMemberships?: WorkspaceMembership[];
  workspaceActions?: WorkspaceAction[];
  workspaceAuditEvents?: WorkspaceAuditEvent[];
  creditAppeals?: CreditAppeal[];
  scopedModeratorGrants?: ScopedModeratorGrant[];
  scopedModeratorAudits?: ScopedModeratorAuditRecord[];
  cohortEvidenceAudits?: CohortEvidenceAuditRecord[];
}

declare module './index' {
  interface PassportView {
    pendingCredits?: number;
  }
}
