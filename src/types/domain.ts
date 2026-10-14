export type UserRole =
  | 'participant'
  | 'teacher'
  | 'facilitator'
  | 'institution_admin'
  | 'programme_manager'
  | 'platform_admin';

export type Visibility = 'public' | 'institution' | 'assembly' | 'private';

export type VerificationStatus = 'unverified' | 'under_review' | 'verified' | 'flagged';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
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
  assignmentType?: AssignmentType;
  title: string;
  prompt: string;
  rubric: RubricItem[];
  requiredEvidenceType?: EvidenceType;
  creditsReward: number;
  status: 'draft' | 'active' | 'archived';
  dueDate?: string;
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
  dataUrl?: string;
  demoLabel?: string;
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
}

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
}

export type AssemblyStage =
  | 'orientation'
  | 'question'
  | 'evidence_review'
  | 'deliberation'
  | 'proposition_draft'
  | 'revision'
  | 'support_dissent'
  | 'outcome'
  | 'reflection';

export type AssemblyStatus = 'upcoming' | 'active' | 'deliberating' | 'concluded' | 'archived';

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
  evidenceIds: string[];
  propositionId?: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
}

export type AssemblyRoleType =
  | 'Questioner'
  | 'Evidence Analyst'
  | 'Civic Advocate'
  | 'Synthesiser'
  | 'Community Voice'
  | 'Rapporteur';

export interface AssemblyRole {
  id: string;
  assemblyId: string;
  userId: string;
  roleName: AssemblyRoleType;
  responsibilities: string[];
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

export interface DissentRecord {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  suggestedAmendment: string;
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
  changesSummary: string;
  timestamp: string;
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
  | 'Civic Action';

export type CreditSourceType =
  | 'lesson'
  | 'assignment'
  | 'evidence'
  | 'assembly'
  | 'contribution'
  | 'reflection'
  | 'project';

export interface CreditTransaction {
  id: string;
  userId: string;
  dimension: CreditDimension;
  amount: number;
  sourceType: CreditSourceType;
  sourceId: string;
  status: 'Pending' | 'Verified' | 'Audited';
  reason: string;
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
  isVerified: boolean;
  badgeUrl?: string;
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
}

declare module './index' {
  interface PassportView {
    pendingCredits?: number;
  }
}
