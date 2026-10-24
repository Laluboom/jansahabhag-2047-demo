import {
  User,
  UserRole,
  Institution,
  Programme,
  Course,
  Lesson,
  Enrolment,
  Assignment,
  Submission,
  Evidence,
  Activity,
  Event,
  Session,
  SessionMode,
  DebatePhase,
  DEBATE_PHASES,
  SpeakingQueueEntry,
  DebateContribution,
  Assembly,
  AssemblyRole,
  Contribution,
  Proposition,
  Project,
  Reflection,
  CreditTransaction,
  CreditSourceType,
  PassportEntry,
  Notification,
  CommunityGroup,
  CommunityPost,
  ModerationCase,
  ModerationSeverity,
  CivicIssue,
  DemoDatabase,
  AssemblyStage,
  AssemblyRoleType,
  AssemblyRolePower,
  AssemblyRoleAction,
  AssemblyRoleOverrideAudit,
  ParticipantResponseState,
  CreditDimension,
  VerificationStatus,
  Workspace,
  WorkspaceMembership,
  WorkspaceAction,
  WorkspaceAuditEvent,
  WorkspaceActionType,
  CreditAppeal,
  AllocationState,
  AllocationAuditRecord,
  ScopedModeratorGrant,
  ScopedModeratorAuditRecord,
  ModeratorScope,
  ModeratorScopeType,
  CohortEvidenceAuditRecord,
} from '../types/domain';
import { EvidenceAttachmentStore } from './evidenceAttachmentStore';
import { MAX_BINARY_ATTACHMENT_BYTES } from '../domain/evidenceRules';
import {
  buildAllocationState,
  canUserRsvpAllocation,
  finalizeAllocationState,
  approveAllocationExceptionState,
  sanitizeAllocationForPublic,
  isAllocatedLimitedEvent,
  POLICY_VERSION,
  canUserClaimRoleAllocation,
  buildAssemblyRoleAllocations,
  projectAssemblyForCaller,
  buildSessionRoleAllocations,
} from './reservationAllocationService';
import {
  normalizeAssemblyStage,
  normalizeAssemblyRoleName,
  getRolePowerForName,
} from './migrations';
import {
  DashboardData,
  AssignmentSubmissionInput,
  SubmissionReviewInput,
  AssemblyContributionInput,
  PropositionFinalisationInput,
  PassportView,
} from '../types';
import { DemoRepository } from './repository';

declare module './repository' {
  interface DemoRepository {
    reportEvidenceOrSubmission(params: {
      reporterId: string;
      targetType: 'evidence' | 'submission';
      targetId: string;
      reason: string;
      severity?: ModerationSeverity;
    }): Promise<ModerationCase>;
    assignModerationCaseReviewer(caseId: string, reviewerId: string): Promise<ModerationCase>;
  }
}
import { PersistenceService } from './persistence';
import { generateId } from '../utils/id';
import {
  canActorAccessPrivateEvidence,
  canActorViewModerationCase,
  canActorUpdateModerationCase,
} from '../domain/evidenceRules';

export function createAssemblyRoleData(
  assemblyId: string,
  userId: string,
  roleName: AssemblyRoleType,
  secondaryRoleName?: AssemblyRoleType
): AssemblyRole {
  const now = new Date().toISOString();
  const power = getRolePowerForName(roleName);

  let lens = 'Pedestrian Flow & Peak Counts';
  let responsibilities: string[] = [];
  let promptSuggestions: string[] = [];
  let powerActionDescription = '';
  let responseObligation = '';
  let badgeIcon = 'HelpCircle';

  switch (roleName) {
    case 'Thinker':
      lens = 'Pedestrian Flow & Peak Counts';
      responsibilities = [
        'Introduce substantive perspectives, explain the problem, question assumptions and add domain evidence.',
        'Formulate constructive inquiry prompts that test data assumptions.',
        'Ensure vulnerable user groups (younger students, elderly residents) are considered.',
      ];
      promptSuggestions = [
        'What specific traffic calming measures will physically force vehicles to slow to 25 km/h before the curve?',
        'What are the pedestrian exposure distances students face across the 11-meter wide carriageway?',
        'How will we ensure the raised crosswalk does not cause monsoon drainage waterlogging?',
      ];
      powerActionDescription = 'Set formal inquiry question and challenge operational assumptions.';
      responseObligation = 'Enablers and Troubleshooters must review and address the inquiry.';
      badgeIcon = 'HelpCircle';
      break;

    case 'Enabler':
      lens = 'Municipal Budget & PWD Engineering Route';
      responsibilities = [
        'Examine resources, implementation route, institutional ownership, capability and feasibility.',
        'Identify concrete municipal and institutional stakeholders responsible for execution.',
        'Validate technical specifications and budgetary co-financing pathways.',
      ];
      promptSuggestions = [
        'What is the PWD executive engineering timeline and Ward 24 co-financing route for raised crosswalks?',
        'According to Evidence EV-001, peak pedestrian volume happens between 7:50 AM and 8:10 AM.',
        'Can school student traffic marshals coordinate morning pedestrian crossings with local beat constables?',
      ];
      powerActionDescription = 'Validate institutional ownership, budget viability, and technical feasibility.';
      responseObligation = 'Shapers must incorporate validated owners and feasibility conditions into draft.';
      badgeIcon = 'FileCheck';
      break;

    case 'Troubleshooter':
      lens = 'Stormwater Drainage & Emergency Vehicles';
      responsibilities = [
        'Stress-test assumptions, identify harms, edge cases, incentives and unintended consequences; propose mitigations.',
        'Actively raise Red Flags without adversarial framing to safeguard vulnerable groups.',
        'Formulate constructive mitigation prompts for identified risks.',
      ];
      promptSuggestions = [
        'How will we ensure the 100mm tabletop crossing does not create monsoon waterlogging or jolt ambulances?',
        'Will speed tables cause heavy delivery trucks to honk excessively early in the morning outside residential gates?',
        'What happens if commercial delivery drivers bypass the speed table by mounting the sidewalk?',
      ];
      powerActionDescription = 'Raise formal Red Flag highlighting unaddressed risk, harm, or unintended consequence.';
      responseObligation = 'Shapers and Enablers must record specific mitigations in proposition.';
      badgeIcon = 'ShieldAlert';
      break;

    case 'Shaper':
      lens = 'Tabletop Crosswalk & Beacon Synthesis';
      responsibilities = [
        'Synthesize agreement, qualified support, disagreement and candidate wording into draft proposition.',
        'Ensure preserved dissent records survive all revisions and are visibly displayed.',
        'Balance municipal resource constraints with youth safety goals without substantive tie-break power.',
      ];
      promptSuggestions = [
        'We have broad consensus on the raised tabletop crosswalk; let us resolve the vendor relocation details.',
        'Let us synthesize the 1:15 approach ramp and dual solar amber beacons into the binding draft proposition.',
      ];
      powerActionDescription = 'Issue Proposition Call to synthesize amendments and move draft to full-body review.';
      responseObligation = 'Full assembly responds across four participant response states.';
      badgeIcon = 'Layers';
      break;
  }

  return {
    id: generateId('role'),
    assemblyId,
    userId,
    roleName,
    secondaryRoleName,
    lens,
    responsibilities,
    power,
    powerActionDescription,
    responseObligation,
    badgeIcon,
    promptSuggestions,
    schemaVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
}

export class LocalDemoRepository implements DemoRepository {
  private getDb(): DemoDatabase {
    return PersistenceService.loadDatabase();
  }

  private saveDb(db: DemoDatabase): void {
    const success = PersistenceService.saveDatabase(db);
    if (!success) {
      throw new Error(
        'Browser storage write failed: localStorage quota exceeded or storage disabled. Prior durable data remains intact.'
      );
    }
  }

  private calculateUserCredits(db: DemoDatabase, userId: string): number {
    return db.credits
      .filter((c) => {
        if (c.userId !== userId) return false;
        if (this.isUhvCredit(c, db)) return false;
        if (c.status === 'Pending' || c.status === 'Reversed') return false; // Do not count pending or reversed credits
        return c.status === 'Verified' || c.status === 'Audited';
      })
      .reduce((sum, c) => sum + c.amount, 0);
  }

  public getPassportSourceRoute(entry: { sourceReferenceType?: string; sourceReferenceId?: string; sourceRoute?: string }): string {
    if (entry.sourceRoute) return entry.sourceRoute;
    switch (entry.sourceReferenceType) {
      case 'starting_balance':
        return `/passport/credits`;
      case 'assignment':
      case 'submission':
        return `/assignments/${entry.sourceReferenceId}`;
      case 'assembly':
        return `/assemblies/${entry.sourceReferenceId}`;
      case 'proposition':
      case 'dissent':
        return `/assemblies/assembly_jaipur_pedestrian_2026`;
      case 'workspace':
        return `/workspaces/${entry.sourceReferenceId}`;
      case 'course':
        return `/learn/${entry.sourceReferenceId}`;
      case 'lesson':
        return `/learn`;
      case 'evidence':
        return `/passport/evidence`;
      case 'reflection':
        return `/passport`;
      case 'project':
        return `/dashboard`;
      default:
        return `/passport`;
    }
  }

  public isUhvAssignment(asg: Assignment, db?: DemoDatabase): boolean {
    if (asg.assignmentType === 'uhv_reflection') return true;
    if (asg.id === 'asg_uhv_08' || asg.id.startsWith('asg_uhv_')) return true;
    if (asg.courseId === 'course_uhv_leadership_05') return true;
    const database = db || this.getDb();
    const course = database.courses.find((c) => c.id === asg.courseId);
    return course?.track === 'uhv';
  }

  public isUhvSubmission(sub: Submission, db?: DemoDatabase): boolean {
    if (sub.isUhvReflection) return true;
    const database = db || this.getDb();
    const asg = database.assignments.find((a) => a.id === sub.assignmentId);
    if (!asg) return sub.assignmentId === 'asg_uhv_08';
    return this.isUhvAssignment(asg, database);
  }

  public isUhvLesson(lesson: Lesson, db?: DemoDatabase): boolean {
    if (lesson.id.startsWith('les_uhv_')) return true;
    const database = db || this.getDb();
    const course = database.courses.find((c) => c.id === lesson.courseId);
    return course?.track === 'uhv' || lesson.courseId === 'course_uhv_leadership_05';
  }

  public isUhvContext(contextType: string, contextId: string, db?: DemoDatabase): boolean {
    const database = db || this.getDb();
    if (
      contextId === 'course_uhv_leadership_05' ||
      contextId.startsWith('course_uhv_') ||
      contextId === 'asg_uhv_08' ||
      contextId.startsWith('asg_uhv_') ||
      contextId.startsWith('les_uhv_') ||
      contextId === 'refl_meera_01'
    ) {
      return true;
    }
    if (contextType === 'course') {
      const course = database.courses.find((c) => c.id === contextId);
      return course?.track === 'uhv';
    }
    if (contextType === 'lesson') {
      const lesson = database.lessons.find((l) => l.id === contextId);
      if (lesson) {
        const course = database.courses.find((c) => c.id === lesson.courseId);
        return course?.track === 'uhv';
      }
    }
    if (contextType === 'assignment') {
      const asg = database.assignments.find((a) => a.id === contextId);
      if (asg) return this.isUhvAssignment(asg, database);
    }
    return false;
  }

  public isUhvReflectionRecord(refl: Reflection, db?: DemoDatabase): boolean {
    if (refl.id === 'refl_meera_01') return true;
    return this.isUhvContext(refl.contextType, refl.contextId, db);
  }

  public isUhvCreditSource(sourceType: CreditSourceType, sourceId: string, db?: DemoDatabase): boolean {
    const database = db || this.getDb();
    if (sourceId === 'tx_meera_03' || sourceId === 'tx_meera_06') return true;
    if (sourceId === 'course_uhv_leadership_05' || sourceId.startsWith('course_uhv_')) return true;
    if (sourceId === 'asg_uhv_08' || sourceId.startsWith('asg_uhv_')) return true;
    if (sourceId.startsWith('les_uhv_')) return true;
    if (sourceId === 'refl_meera_01') return true;

    if (sourceType === 'assignment') {
      const asg = database.assignments?.find((a) => a.id === sourceId);
      if (asg && this.isUhvAssignment(asg, database)) return true;
    }
    if (sourceType === 'lesson') {
      if (sourceId.startsWith('les_uhv_')) return true;
      const lesson = database.lessons?.find((l) => l.id === sourceId);
      if (lesson) {
        const course = database.courses?.find((c) => c.id === lesson.courseId);
        if (course?.track === 'uhv') return true;
      }
    }
    if ((sourceType as string) === 'course') {
      const course = database.courses?.find((c) => c.id === sourceId);
      if (course?.track === 'uhv') return true;
    }
    if (sourceType === 'reflection') {
      const refl = database.reflections?.find((r) => r.id === sourceId);
      if (refl && this.isUhvReflectionRecord(refl, database)) return true;
    }
    return false;
  }

  public isUhvCredit(c: CreditTransaction, db?: DemoDatabase): boolean {
    const database = db || this.getDb();
    if (c.id === 'tx_meera_03' || c.id === 'tx_meera_06') return true;
    return this.isUhvCreditSource(c.sourceType, c.sourceId, database);
  }

  public isUhvPassportEntry(p: PassportEntry, db?: DemoDatabase): boolean {
    const database = db || this.getDb();
    if (p.id === 'pass_meera_03') return true;
    if (
      p.sourceReferenceId === 'course_uhv_leadership_05' ||
      p.sourceReferenceId === 'asg_uhv_08' ||
      p.sourceReferenceId === 'refl_meera_01' ||
      p.sourceReferenceId?.startsWith('course_uhv_') ||
      p.sourceReferenceId?.startsWith('asg_uhv_') ||
      p.sourceReferenceId?.startsWith('les_uhv_')
    ) {
      return true;
    }
    if (p.sourceReferenceType === 'course') {
      const course = database.courses?.find((c) => c.id === p.sourceReferenceId);
      if (course?.track === 'uhv') return true;
    }
    if (p.sourceReferenceType === 'lesson') {
      const lesson = database.lessons?.find((l) => l.id === p.sourceReferenceId);
      if (lesson) {
        const course = database.courses?.find((c) => c.id === lesson.courseId);
        if (course?.track === 'uhv') return true;
      }
    }
    if (p.sourceReferenceType === 'assignment') {
      const asg = database.assignments?.find((a) => a.id === p.sourceReferenceId);
      if (asg && this.isUhvAssignment(asg, database)) return true;
    }
    if (p.sourceReferenceType === 'reflection') {
      const refl = database.reflections?.find((r) => r.id === p.sourceReferenceId);
      if (refl && this.isUhvReflectionRecord(refl, database)) return true;
    }
    return false;
  }

  public isUhvCourseId(courseId: string, db?: DemoDatabase): boolean {
    if (courseId === 'course_uhv_leadership_05' || courseId.startsWith('course_uhv_')) return true;
    const database = db || this.getDb();
    const course = database.courses?.find((c) => c.id === courseId);
    return course?.track === 'uhv';
  }

  public isUhvReflectionActivity(act: Activity, db?: DemoDatabase): boolean {
    const database = db || this.getDb();
    if (act.referenceId === 'refl_meera_01') return true;
    if (act.referenceType === 'reflection' && act.referenceId) {
      const refl = database.reflections?.find((r) => r.id === act.referenceId);
      if (refl) {
        return this.isUhvReflectionRecord(refl, database);
      }
      return this.isUhvContext('reflection', act.referenceId, database);
    }
    if (act.type === 'reflection_shared') {
      if (
        act.referenceId === 'asg_uhv_08' ||
        act.referenceId === 'course_uhv_leadership_05' ||
        act.referenceId?.startsWith('course_uhv_') ||
        act.referenceId?.startsWith('les_uhv_')
      ) {
        return true;
      }
      if (act.referenceType === 'assignment' && act.referenceId) {
        const asg = database.assignments?.find((a) => a.id === act.referenceId);
        if (asg && this.isUhvAssignment(asg, database)) return true;
      }
      if (act.referenceType === 'course' && act.referenceId) {
        const course = database.courses?.find((c) => c.id === act.referenceId);
        if (course?.track === 'uhv') return true;
      }
      const uhvReflections = database.reflections?.filter((r) => this.isUhvReflectionRecord(r, database)) || [];
      for (const r of uhvReflections) {
        if (act.description && r.text && act.description.includes(r.text.slice(0, 30))) {
          return true;
        }
      }
    }
    return false;
  }

  public isUhvActivity(act: Activity, db?: DemoDatabase): boolean {
    const database = db || this.getDb();
    if (this.isUhvReflectionActivity(act, database)) return true;
    if (
      act.referenceId === 'asg_uhv_08' ||
      act.referenceId === 'course_uhv_leadership_05' ||
      act.referenceId?.startsWith('course_uhv_') ||
      act.referenceId?.startsWith('les_uhv_') ||
      act.referenceId === 'refl_meera_01'
    ) {
      return true;
    }
    if (act.referenceType === 'assignment' && act.referenceId) {
      const asg = database.assignments?.find((a) => a.id === act.referenceId);
      if (asg && this.isUhvAssignment(asg, database)) return true;
    }
    if (act.referenceType === 'course' && act.referenceId) {
      const course = database.courses?.find((c) => c.id === act.referenceId);
      if (course?.track === 'uhv') return true;
    }
    if (act.referenceType === 'lesson' && act.referenceId) {
      const lesson = database.lessons?.find((l) => l.id === act.referenceId);
      if (lesson) {
        const course = database.courses?.find((c) => c.id === lesson.courseId);
        if (course?.track === 'uhv') return true;
      }
    }
    if (act.referenceType === 'credit' && act.referenceId) {
      if (act.referenceId === 'tx_meera_03' || act.referenceId === 'tx_meera_06') return true;
      const credit = database.credits?.find((c) => c.id === act.referenceId);
      if (credit && this.isUhvCredit(credit, database)) return true;
    }
    return false;
  }

  // Users & Personas
  async getCurrentUser(): Promise<User> {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];
    const cloned = JSON.parse(JSON.stringify(user));
    cloned.totalCredits = this.calculateUserCredits(db, cloned.id);
    return cloned;
  }

  async getUsers(): Promise<User[]> {
    const db = this.getDb();
    return db.users.map((u) => {
      const cloned = JSON.parse(JSON.stringify(u));
      cloned.totalCredits = this.calculateUserCredits(db, cloned.id);
      return cloned;
    });
  }

  async getUser(userId: string): Promise<User | null> {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === userId);
    if (!user) return null;
    const cloned = JSON.parse(JSON.stringify(user));
    cloned.totalCredits = this.calculateUserCredits(db, cloned.id);
    return cloned;
  }

  async switchUser(userId: string): Promise<User> {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    db.activeUserId = userId;
    user.totalCredits = this.calculateUserCredits(db, user.id);
    this.saveDb(db);
    return JSON.parse(JSON.stringify(user));
  }

  async switchPersona(userId: string): Promise<User> {
    return this.switchUser(userId);
  }

  async createParticipant(input: {
    name: string;
    email: string;
    institutionId: string;
    institutionName: string;
    programmeIds?: string[];
    bio?: string;
    age?: number;
    location?: string;
    avatar?: string;
    role?: UserRole;
  }): Promise<User> {
    const db = this.getDb();
    const now = new Date().toISOString();
    const userId = generateId('usr');

    const newUser: User = {
      id: userId,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role || 'participant',
      institutionId: input.institutionId,
      institutionName: input.institutionName,
      programmeIds: input.programmeIds || ['prog_civic_tech_01'],
      bio: input.bio || 'Civic participant in Jaipur Youth Assembly demo simulation.',
      age: input.age ?? 18,
      location: input.location || 'Jaipur, Rajasthan',
      avatar: input.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      badgeCount: 0,
      totalCredits: 10,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    // Ensure idempotent starting balance transaction: exactly 1 transaction of 10 credits
    const existingTx = db.credits.find(
      (c) => c.userId === userId && (c.sourceType === 'starting_balance' || c.reason === 'Starting balance: 10')
    );
    if (!existingTx) {
      db.credits.push({
        id: `tx_${userId}_init`,
        userId,
        dimension: 'Contribution',
        amount: 10,
        sourceType: 'starting_balance',
        sourceId: `starting_balance_${userId}`,
        sourceRoute: '/passport/credits',
        status: 'Verified',
        reason: 'Starting balance: 10',
        calculationExplanation: 'Initial Civic Passport demo credit allocation for new participant onboarding (10 credits).',
        createdAt: now,
        schemaVersion: 1,
      });
    }

    // Ensure matching starting balance passport entry
    const existingPassport = db.passportEntries.find(
      (p) => p.userId === userId && (p.sourceReferenceType === 'starting_balance' || p.subtitle === 'Starting balance: 10' || p.title === 'Civic Passport Onboarding Allocation')
    );
    if (!existingPassport) {
      db.passportEntries.push({
        id: `pass_${userId}_init`,
        userId,
        category: 'achievement',
        title: 'Civic Passport Onboarding Allocation',
        subtitle: 'Starting balance: 10',
        date: now.split('T')[0],
        creditsAwarded: 10,
        evidenceIds: [],
        sourceReferenceType: 'starting_balance',
        sourceReferenceId: `starting_balance_${userId}`,
        sourceRoute: '/passport/credits',
        verificationState: 'system_recorded',
        reviewState: 'accepted',
        calculationExplanation: 'Initial Civic Passport demo credit allocation for new participant onboarding (10 credits).',
        isVerified: true,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    newUser.totalCredits = this.calculateUserCredits(db, userId);
    db.users.push(newUser);
    this.saveDb(db);

    return JSON.parse(JSON.stringify(newUser));
  }

  // Dashboard
  async getDashboard(userId: string): Promise<DashboardData> {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === userId) || db.users[0];
    const clonedUser = JSON.parse(JSON.stringify(user));
    const userCredits = this.calculateUserCredits(db, userId);
    clonedUser.totalCredits = userCredits;

    const activeUserId = db.activeUserId;
    const activeUser = db.users.find((u) => u.id === activeUserId) || null;
    const isOwner = activeUser?.role === 'platform_admin';
    const isOtherPersona = userId !== activeUserId;

    const enrolments = db.enrolments.filter((e) => {
      if (e.userId !== userId) return false;
      if (isOtherPersona && this.isUhvCourseId(e.courseId, db)) return false;
      return true;
    });
    const activities = db.activities
      .filter((a) => a.userId === userId)
      .filter((a) => {
        if (this.isUhvReflectionActivity(a, db)) return false;
        if (isOtherPersona && this.isUhvActivity(a, db)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const events = db.events.filter((e) => {
      const isOrganizer = e.organizerId === userId;
      const isAttendee = e.attendeeUserIds.includes(userId);
      if (!isOrganizer && !isAttendee) return false;
      // Do not allow another persona dashboard to reveal identified attendance on allocated limited events
      if (isOtherPersona && !isOwner && isAttendee && !isOrganizer && isAllocatedLimitedEvent(e)) {
        return false;
      }
      return true;
    });
    const assemblies = db.assemblies.filter(
      (a) => a.participantUserIds.includes(userId) || a.facilitatorId === userId || a.status === 'deliberating' || a.status === 'active'
    );
    const userSubmissions = db.submissions.filter((s) => {
      if (s.userId !== userId) return false;
      if (isOtherPersona && this.isUhvSubmission(s, db)) return false;
      return true;
    });

    const activeSubmissions = userSubmissions.filter((s) => s.status === 'submitted' || s.status === 'verified' || s.status === 'under_review');
    const activeSubmittedAsgIds = activeSubmissions.map((s) => s.assignmentId);
    const pendingAssignments = db.assignments.filter(
      (a) => !activeSubmittedAsgIds.includes(a.id) && !this.isUhvAssignment(a, db)
    );

    const notifications = db.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const credits = db.credits.filter((c) => c.userId === userId && !this.isUhvCredit(c, db));
    const verifiedCredits = credits.filter((c) => c.status === 'Verified' || c.status === 'Audited');
    const pendingCredits = credits.filter((c) => c.status === 'Pending');
    const totalCredits = userCredits;
    const pendingCreditsTotal = pendingCredits.reduce((sum, c) => sum + c.amount, 0);

    const breakdown: Record<CreditDimension, number> = {
      Learning: 0,
      Observation: 0,
      Deliberation: 0,
      Reflection: 0,
      Contribution: 0,
      Collaboration: 0,
      'Civic Action': 0,
    };

    verifiedCredits.forEach((c) => {
      if (breakdown[c.dimension] !== undefined) {
        breakdown[c.dimension] += c.amount;
      }
    });

    const passportEntries = db.passportEntries.filter((p) => p.userId === userId);

    // Compute intelligent connected next step
    let nextStep: import('../types').DashboardNextStep | undefined;

    // 1. Revision requested
    const revisionSub = userSubmissions.find((s) => s.status === 'revision_requested');
    if (revisionSub) {
      const asg = db.assignments.find((a) => a.id === revisionSub.assignmentId);
      nextStep = {
        type: 'revision',
        title: `Revise: ${asg?.title || 'Field Assignment'}`,
        description: revisionSub.teacherFeedback || 'Mentor requested updates on your observation report.',
        targetRoute: `/assignments/${revisionSub.assignmentId}/submit`,
        badgeText: 'Action Required',
        rewardText: 'Resubmit for Review',
      };
    }

    // 2. Draft assignment
    if (!nextStep) {
      const draftSub = userSubmissions.find((s) => s.status === 'draft');
      if (draftSub) {
        const asg = db.assignments.find((a) => a.id === draftSub.assignmentId);
        const isUhv = asg ? this.isUhvAssignment(asg, db) : this.isUhvSubmission(draftSub, db);
        if (isUhv) {
          if (!isOtherPersona) {
            nextStep = {
              type: 'assignment',
              title: `Resume Reflection: ${asg?.title || 'Personal Reflection'}`,
              description: 'Continue your personal self-exploration reflection in your private study journal.',
              targetRoute: `/assignments/${draftSub.assignmentId}/submit`,
              badgeText: 'Study Journal',
              rewardText: 'Private Reflection',
            };
          }
        } else {
          nextStep = {
            type: 'assignment',
            title: `Resume Draft: ${asg?.title || 'Assignment'}`,
            description: 'Continue editing and attach field observation evidence.',
            targetRoute: `/assignments/${draftSub.assignmentId}/submit`,
            badgeText: 'Draft in Progress',
            rewardText: '+2 Credits on Submit',
          };
        }
      }
    }

    // 3. In-progress course next lesson
    if (!nextStep) {
      const inProgressEnrolment = enrolments.find((e) => e.status === 'in_progress');
      if (inProgressEnrolment) {
        const course = db.courses.find((c) => c.id === inProgressEnrolment.courseId);
        const courseLessons = db.lessons.filter((l) => l.courseId === inProgressEnrolment.courseId).sort((a, b) => a.order - b.order);
        const nextLesson = courseLessons.find((l) => !inProgressEnrolment.completedLessonIds.includes(l.id));
        if (nextLesson && course) {
          const isUhvCourse = course.track === 'uhv' || course.id === 'course_uhv_leadership_05';
          nextStep = {
            type: 'lesson',
            title: isUhvCourse ? `Continue Module: ${nextLesson.title}` : `Continue Lesson: ${nextLesson.title}`,
            description: nextLesson.contentSummary || course.description,
            targetRoute: `/learn/${course.id}/lesson/${nextLesson.id}`,
            badgeText: isUhvCourse ? `${course.code} • Next Module` : `${course.code} • Next Lesson`,
            rewardText: isUhvCourse ? 'Self-Exploration' : '+1 Learning Credit',
          };
        }
      }
    }

    // 4. Pending unsubmitted assignment
    if (!nextStep && pendingAssignments.length > 0) {
      const firstPending = pendingAssignments[0];
      nextStep = {
        type: 'assignment',
        title: `Field Task: ${firstPending.title}`,
        description: firstPending.prompt,
        targetRoute: `/assignments/${firstPending.id}`,
        badgeText: 'Field Assignment',
        rewardText: `+${firstPending.creditsReward} Credits`,
      };
    }

    // 5. Active Assembly
    if (!nextStep && assemblies.length > 0) {
      const firstAssembly = assemblies[0];
      const isJoined = firstAssembly.participantUserIds.includes(userId);
      nextStep = {
        type: 'assembly',
        title: `Youth Deliberation: ${firstAssembly.title}`,
        description: firstAssembly.question,
        targetRoute: `/assemblies/${firstAssembly.id}`,
        badgeText: isJoined ? `Stage: ${firstAssembly.currentStage.replace('_', ' ')}` : 'Assembly Chamber',
        rewardText: isJoined ? 'Deliberation Chamber' : '+2 Credits on Join',
      };
    }

    return {
      user: clonedUser,
      activeEnrolments: JSON.parse(JSON.stringify(enrolments)),
      recentActivities: JSON.parse(JSON.stringify(activities.slice(0, 8))),
      upcomingEvents: events.map((e) => this.projectEventForCaller(e, activeUser, db)),
      activeAssemblies: (() => {
        let mutated = false;
        for (const a of assemblies) {
          if (this.ensureAssemblyRoleAllocations(a, db)) {
            mutated = true;
          }
        }
        if (mutated) this.saveDb(db);
        const dashboardViewer = activeUser;
        return assemblies.map((a) => projectAssemblyForCaller(a, dashboardViewer));
      })(),
      pendingAssignments: JSON.parse(JSON.stringify(pendingAssignments)),
      recentNotifications: JSON.parse(JSON.stringify(notifications.slice(0, 5))),
      creditSummary: {
        total: totalCredits,
        pendingCredits: pendingCreditsTotal,
        breakdown,
      },
      passportEntriesCount: passportEntries.length,
      nextStep,
    };
  }

  // Institutions & Programmes
  async getInstitutions(): Promise<Institution[]> {
    const db = this.getDb();
    return JSON.parse(JSON.stringify(db.institutions));
  }

  async getInstitution(id: string): Promise<Institution | null> {
    const db = this.getDb();
    const inst = db.institutions.find((i) => i.id === id);
    return inst ? JSON.parse(JSON.stringify(inst)) : null;
  }

  async getProgrammes(): Promise<Programme[]> {
    const db = this.getDb();
    return JSON.parse(JSON.stringify(db.programmes));
  }

  async getProgramme(id: string): Promise<Programme | null> {
    const db = this.getDb();
    const prog = db.programmes.find((p) => p.id === id);
    return prog ? JSON.parse(JSON.stringify(prog)) : null;
  }

  async createProgramme(
    programmeInput: Omit<Programme, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>
  ): Promise<Programme> {
    const db = this.getDb();
    const now = new Date().toISOString();
    const newProg: Programme = {
      ...programmeInput,
      id: generateId('prog'),
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    db.programmes.push(newProg);
    this.saveDb(db);
    return JSON.parse(JSON.stringify(newProg));
  }

  async updateProgramme(programmeId: string, updates: Partial<Programme>): Promise<Programme> {
    const db = this.getDb();
    const prog = db.programmes.find((p) => p.id === programmeId);
    if (!prog) throw new Error(`Programme ${programmeId} not found`);

    Object.assign(prog, updates, { updatedAt: new Date().toISOString() });
    this.saveDb(db);
    return JSON.parse(JSON.stringify(prog));
  }

  // Learning
  async getCourses(_userId?: string): Promise<Course[]> {
    const db = this.getDb();
    return JSON.parse(JSON.stringify(db.courses));
  }

  async getCourse(courseId: string): Promise<Course | null> {
    const db = this.getDb();
    const course = db.courses.find((c) => c.id === courseId);
    return course ? JSON.parse(JSON.stringify(course)) : null;
  }

  async createCourse(
    courseInput: Omit<Course, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>
  ): Promise<Course> {
    const db = this.getDb();
    const now = new Date().toISOString();
    const newCourse: Course = {
      ...courseInput,
      id: generateId('course'),
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    db.courses.push(newCourse);
    this.saveDb(db);
    return JSON.parse(JSON.stringify(newCourse));
  }

  async updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
    const db = this.getDb();
    const course = db.courses.find((c) => c.id === courseId);
    if (!course) throw new Error(`Course ${courseId} not found`);

    Object.assign(course, updates, { updatedAt: new Date().toISOString() });
    this.saveDb(db);
    return JSON.parse(JSON.stringify(course));
  }

  async getLessons(courseId: string): Promise<Lesson[]> {
    const db = this.getDb();
    const lessons = db.lessons.filter((l) => l.courseId === courseId).sort((a, b) => a.order - b.order);
    return JSON.parse(JSON.stringify(lessons));
  }

  async getLesson(lessonId: string): Promise<Lesson | null> {
    const db = this.getDb();
    const lesson = db.lessons.find((l) => l.id === lessonId);
    return lesson ? JSON.parse(JSON.stringify(lesson)) : null;
  }

  async getEnrolment(userId: string, courseId: string): Promise<Enrolment | null> {
    const db = this.getDb();
    const enrolment = db.enrolments.find((e) => e.userId === userId && e.courseId === courseId);
    return enrolment ? JSON.parse(JSON.stringify(enrolment)) : null;
  }

  async getEnrolments(userId: string): Promise<Enrolment[]> {
    const db = this.getDb();
    const enrolments = db.enrolments.filter((e) => e.userId === userId);
    return JSON.parse(JSON.stringify(enrolments));
  }

  async enrolInCourse(userId: string, courseId: string): Promise<Enrolment> {
    const db = this.getDb();
    let enrolment = db.enrolments.find((e) => e.userId === userId && e.courseId === courseId);
    if (!enrolment) {
      const now = new Date().toISOString();
      enrolment = {
        id: generateId('enr'),
        userId,
        courseId,
        status: 'in_progress',
        completedLessonIds: [],
        progressPercent: 0,
        startedAt: now,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      };
      db.enrolments.push(enrolment);
      this.saveDb(db);
    }
    return JSON.parse(JSON.stringify(enrolment));
  }

  async completeLesson(
    userId: string,
    lessonId: string
  ): Promise<{ enrolment: Enrolment; creditTransaction?: CreditTransaction }> {
    const db = this.getDb();
    const lesson = db.lessons.find((l) => l.id === lessonId);
    if (!lesson) throw new Error(`Lesson ${lessonId} not found`);

    const course = db.courses.find((c) => c.id === lesson.courseId);
    const isUhv = course?.track === 'uhv';
    let enrolment = db.enrolments.find((e) => e.userId === userId && e.courseId === lesson.courseId);
    const now = new Date().toISOString();

    if (!enrolment) {
      enrolment = {
        id: generateId('enr'),
        userId,
        courseId: lesson.courseId,
        status: 'in_progress',
        completedLessonIds: [],
        progressPercent: 0,
        startedAt: now,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      };
      db.enrolments.push(enrolment);
    }

    let creditTx: CreditTransaction | undefined;

    if (!enrolment.completedLessonIds.includes(lessonId)) {
      enrolment.completedLessonIds.push(lessonId);

      const courseLessons = db.lessons.filter((l) => l.courseId === lesson.courseId);
      const totalCount = courseLessons.length || 1;
      enrolment.progressPercent = Math.round((enrolment.completedLessonIds.length / totalCount) * 100);

      const newlyCompleted = enrolment.progressPercent >= 100;
      if (newlyCompleted) {
        enrolment.status = 'completed';
        enrolment.completedAt = now;
      } else {
        enrolment.status = 'in_progress';
      }
      enrolment.updatedAt = now;

      if (!isUhv) {
        // Create credit transaction for lesson (idempotent)
        const existingTx = db.credits.find(
          (c) => c.userId === userId && c.sourceType === 'lesson' && c.sourceId === lessonId
        );
        if (!existingTx) {
          creditTx = {
            id: generateId('tx'),
            userId,
            dimension: 'Learning',
            amount: 1,
            sourceType: 'lesson',
            sourceId: lessonId,
            status: 'Verified',
            reason: `Completed lesson: ${lesson.title}`,
            createdAt: now,
            schemaVersion: 1,
          };
          db.credits.push(creditTx);
        }

        // Create activity record (idempotent)
        const existingAct = db.activities.find(
          (a) => a.userId === userId && a.type === 'lesson_completed' && a.referenceId === lessonId
        );
        if (!existingAct) {
          db.activities.push({
            id: generateId('act'),
            userId,
            type: 'lesson_completed',
            title: `Completed Lesson: ${lesson.title}`,
            description: `Progress in ${course?.title || lesson.courseId} reached ${enrolment.progressPercent}%`,
            referenceId: lessonId,
            referenceType: 'lesson',
            timestamp: now,
            schemaVersion: 1,
            createdAt: now,
            updatedAt: now,
          });
        }

        // Create Passport Entry (idempotent)
        const existingPass = db.passportEntries.find(
          (p) => p.userId === userId && p.sourceReferenceId === lessonId
        );
        if (!existingPass) {
          db.passportEntries.push({
            id: generateId('pass'),
            userId,
            category: 'learning',
            title: `Completed: ${lesson.title}`,
            subtitle: course?.title || 'Civic Academy Lesson',
            date: now.split('T')[0],
            creditsAwarded: 1,
            evidenceIds: [],
            sourceReferenceId: lessonId,
            sourceReferenceType: 'lesson',
            sourceRoute: `/academy/courses/${course?.id || 'course_01'}/lessons/${lessonId}`,
            verificationState: 'system_recorded',
            reviewState: 'accepted',
            calculationExplanation: 'Base rule: 1 credit per completed Civic Academy lesson (System recorded)',
            isVerified: true,
            schemaVersion: 1,
            createdAt: now,
            updatedAt: now,
          });
        }

        // If course is newly completed, create achievement passport entry
        if (newlyCompleted) {
          const existingCoursePass = db.passportEntries.find(
            (p) => p.userId === userId && p.sourceReferenceId === lesson.courseId && p.category === 'achievement'
          );
          if (!existingCoursePass) {
            db.passportEntries.push({
              id: generateId('pass'),
              userId,
              category: 'achievement',
              title: `Course Mastered: ${course?.title || 'Civic Track'}`,
              subtitle: `Completed all ${totalCount} lessons in ${course?.code || 'curriculum'}`,
              date: now.split('T')[0],
              creditsAwarded: 0,
              evidenceIds: [],
              sourceReferenceId: lesson.courseId,
              sourceReferenceType: 'course',
              sourceRoute: `/academy/courses/${lesson.courseId}`,
              verificationState: 'system_recorded',
              reviewState: 'accepted',
              calculationExplanation: 'Milestone: Course completion milestone (0 credits, system recorded achievement)',
              isVerified: true,
              schemaVersion: 1,
              createdAt: now,
              updatedAt: now,
            });
          }
        }

        // Notification
        db.notifications.push({
          id: generateId('notif'),
          userId,
          title: 'Lesson Completed!',
          message: `You completed "${lesson.title}" and earned 1 Learning Credit.`,
          type: 'credit',
          isRead: false,
          targetRoute: `/passport/credits`,
          createdAt: now,
          schemaVersion: 1,
        });

        // Update user total credits
        const user = db.users.find((u) => u.id === userId);
        if (user) {
          user.totalCredits = this.calculateUserCredits(db, userId);
          user.updatedAt = now;
        }
      } else {
        // UHV Course Completion - NO credits, NO verified passport entry, NO civic achievement!
        const existingAct = db.activities.find(
          (a) => a.userId === userId && a.type === 'lesson_completed' && a.referenceId === lessonId
        );
        if (!existingAct) {
          db.activities.push({
            id: generateId('act'),
            userId,
            type: 'lesson_completed',
            title: `Completed Study Module: ${lesson.title}`,
            description: `Progress in ${course?.title || lesson.courseId} reached ${enrolment.progressPercent}% (Personal Study Stream).`,
            referenceId: lessonId,
            referenceType: 'lesson',
            timestamp: now,
            schemaVersion: 1,
            createdAt: now,
            updatedAt: now,
          });
        }

        db.notifications.push({
          id: generateId('notif'),
          userId,
          title: 'Study Module Completed',
          message: `You completed "${lesson.title}". Personal reflections carry no civic credits.`,
          type: 'system',
          isRead: false,
          targetRoute: `/uhv`,
          createdAt: now,
          schemaVersion: 1,
        });
      }

      this.saveDb(db);
    }

    return {
      enrolment: JSON.parse(JSON.stringify(enrolment)),
      creditTransaction: creditTx ? JSON.parse(JSON.stringify(creditTx)) : undefined,
    };
  }

  // Assignments & Submissions
  async getAssignments(courseId?: string): Promise<Assignment[]> {
    const db = this.getDb();
    const asgs = courseId ? db.assignments.filter((a) => a.courseId === courseId) : db.assignments;
    return JSON.parse(JSON.stringify(asgs));
  }

  async getAssignment(assignmentId: string): Promise<Assignment | null> {
    const db = this.getDb();
    const asg = db.assignments.find((a) => a.id === assignmentId);
    return asg ? JSON.parse(JSON.stringify(asg)) : null;
  }

  async getSubmissions(userId?: string, assignmentId?: string): Promise<Submission[]> {
    const db = this.getDb();
    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    const isReviewer = activeUser?.role === 'teacher' || activeUser?.role === 'facilitator' || activeUser?.role === 'platform_admin';

    // Security & persona boundary: non-reviewers can only query their own submissions
    let targetUserId = userId;
    if (!isReviewer) {
      if (userId && userId !== db.activeUserId) {
        return [];
      }
      targetUserId = db.activeUserId;
    }

    let subs = db.submissions;
    if (targetUserId) subs = subs.filter((s) => s.userId === targetUserId);
    if (assignmentId) subs = subs.filter((s) => s.assignmentId === assignmentId);

    // Draft privacy: drafts are strictly visible only to their author
    subs = subs.filter((s) => {
      if (s.status === 'draft') {
        return s.userId === db.activeUserId;
      }
      return true;
    });

    // Privacy boundary: Do not expose private UHV reflections to other users, teachers, or generic queues
    subs = subs.filter((s) => {
      if (this.isUhvSubmission(s, db)) {
        return db.activeUserId === s.userId;
      }
      return true;
    });

    // Defense-in-depth: sanitize any UHV records in memory so they never leak scoring or evidence
    return JSON.parse(
      JSON.stringify(
        subs.map((s) => {
          if (this.isUhvSubmission(s, db)) {
            const clone = { ...s, evidenceIds: [], isUhvReflection: true, visibility: 'private' as const };
            delete clone.score;
            delete clone.reviewerId;
            delete clone.reviewedAt;
            delete clone.teacherFeedback;
            return clone;
          }
          return s;
        })
      )
    );
  }

  async getSubmission(submissionId: string): Promise<Submission | null> {
    const db = this.getDb();
    const sub = db.submissions.find((s) => s.id === submissionId);
    if (!sub) return null;

    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    const isReviewer = activeUser?.role === 'teacher' || activeUser?.role === 'facilitator' || activeUser?.role === 'platform_admin';

    // Draft privacy: drafts are only accessible by their author
    if (sub.status === 'draft' && sub.userId !== db.activeUserId) {
      return null;
    }

    // Non-reviewers can only access their own submissions
    if (!isReviewer && sub.userId !== db.activeUserId) {
      return null;
    }

    // Privacy boundary: Do not expose private UHV reflections to other users or teachers
    if (this.isUhvSubmission(sub, db) && db.activeUserId !== sub.userId) {
      return null;
    }

    const cloned = JSON.parse(JSON.stringify(sub));
    if (this.isUhvSubmission(cloned, db)) {
      cloned.evidenceIds = [];
      cloned.isUhvReflection = true;
      cloned.visibility = 'private';
      delete cloned.score;
      delete cloned.reviewerId;
      delete cloned.reviewedAt;
      delete cloned.teacherFeedback;
    }
    return cloned;
  }

  async saveAssignmentDraft(input: AssignmentSubmissionInput): Promise<Submission> {
    const db = this.getDb();
    if (input.userId !== db.activeUserId) {
      throw new Error('Unauthorized: cannot save draft for another persona');
    }

    const asg = db.assignments.find((a) => a.id === input.assignmentId);
    if (!asg) {
      throw new Error(`Assignment ${input.assignmentId} not found`);
    }
    if (asg.status !== 'active') {
      throw new Error(`Cannot save draft for inactive assignment`);
    }

    const isUhv = this.isUhvAssignment(asg, db);

    if (!isUhv && input.evidenceIds && input.evidenceIds.length > 0) {
      for (const eid of input.evidenceIds) {
        const ev = db.evidence.find((e) => e.id === eid);
        if (!ev) {
          throw new Error(`Evidence ${eid} not found`);
        }
        if (ev.ownerId !== input.userId) {
          throw new Error('Unauthorized: cannot attach evidence owned by another participant');
        }
      }
    }

    const now = new Date().toISOString();
    const existing = db.submissions.find(
      (s) => s.assignmentId === input.assignmentId && s.userId === input.userId
    );

    if (existing && (existing.status === 'submitted' || existing.status === 'under_review' || existing.status === 'verified')) {
      throw new Error(`Cannot modify submission with status '${existing.status}'`);
    }

    let submission: Submission;
    if (existing) {
      existing.content = input.content;
      existing.evidenceIds = isUhv ? [] : input.evidenceIds || [];
      existing.status = 'draft';
      if (isUhv) {
        existing.isUhvReflection = true;
        existing.visibility = 'private';
        delete existing.score;
        delete existing.reviewerId;
        delete existing.reviewedAt;
        delete existing.teacherFeedback;
      }
      existing.updatedAt = now;
      submission = existing;
    } else {
      submission = {
        id: generateId('sub'),
        assignmentId: input.assignmentId,
        userId: input.userId,
        content: input.content,
        evidenceIds: isUhv ? [] : input.evidenceIds || [],
        status: 'draft',
        isUhvReflection: isUhv ? true : undefined,
        visibility: isUhv ? 'private' : undefined,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      };
      db.submissions.push(submission);
    }

    this.saveDb(db);
    return JSON.parse(JSON.stringify(submission));
  }

  async submitAssignment(input: AssignmentSubmissionInput): Promise<Submission> {
    if (input.status === 'draft') {
      return this.saveAssignmentDraft(input);
    }

    const db = this.getDb();
    if (input.userId !== db.activeUserId) {
      throw new Error('Unauthorized: cannot submit assignment for another persona');
    }

    const asg = db.assignments.find((a) => a.id === input.assignmentId);
    if (!asg) {
      throw new Error(`Assignment ${input.assignmentId} not found`);
    }
    if (asg.status !== 'active') {
      throw new Error(`Cannot submit for inactive assignment`);
    }

    const existing = db.submissions.find(
      (s) => s.assignmentId === input.assignmentId && s.userId === input.userId
    );

    if (existing) {
      if (existing.status === 'verified' || existing.status === 'under_review') {
        throw new Error(`Cannot modify submission with status '${existing.status}'`);
      }
    }

    if (asg.isPopupAssignment && asg.dueDate && new Date(asg.dueDate).getTime() < Date.now()) {
      throw new Error('Cannot submit for expired assignment');
    }

    const isUhv = this.isUhvAssignment(asg, db);
    if (!isUhv && (!input.content || !input.content.trim())) {
      throw new Error('Observation notes cannot be empty on submission');
    }

    if (!isUhv) {
      if (asg.requiredEvidenceType && (!input.evidenceIds || input.evidenceIds.length === 0)) {
        throw new Error('At least one evidence record is required for assignment submission');
      }
      if (input.evidenceIds && input.evidenceIds.length > 0) {
        for (const eid of input.evidenceIds) {
          const ev = db.evidence.find((e) => e.id === eid);
          if (!ev) {
            throw new Error(`Evidence ${eid} not found`);
          }
          if (ev.ownerId !== input.userId) {
            throw new Error('Unauthorized: cannot attach evidence owned by another participant');
          }
        }
      }
    }

    const now = new Date().toISOString();

    if (existing) {
      if (existing.status === 'submitted') {
        const sameContent = existing.content === input.content;
        const sameEvidence =
          (input.evidenceIds || []).length === existing.evidenceIds.length &&
          (input.evidenceIds || []).every((id) => existing.evidenceIds.includes(id));
        if (sameContent && sameEvidence) {
          return JSON.parse(JSON.stringify(existing));
        }
      }
    }

    let submission: Submission;
    const finalStatus: 'completed' | 'submitted' = isUhv ? 'completed' : 'submitted';
    const submissionId = existing?.id || generateId('sub');

    if (existing) {
      existing.content = input.content;
      existing.evidenceIds = isUhv ? [] : input.evidenceIds || [];
      existing.status = finalStatus;
      existing.receiptId = existing.id;
      if (isUhv) {
        existing.isUhvReflection = true;
        existing.visibility = 'private';
        delete existing.score;
        delete existing.reviewerId;
        delete existing.reviewedAt;
        delete existing.teacherFeedback;
      }
      existing.submittedAt = now;
      existing.updatedAt = now;
      submission = existing;
    } else {
      submission = {
        id: submissionId,
        receiptId: submissionId,
        assignmentId: input.assignmentId,
        userId: input.userId,
        content: input.content,
        evidenceIds: isUhv ? [] : input.evidenceIds || [],
        status: finalStatus,
        isUhvReflection: isUhv ? true : undefined,
        visibility: isUhv ? 'private' : undefined,
        submittedAt: now,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      };
      db.submissions.push(submission);
    }

    if (isUhv) {
      // UHV Reflection:
      // NO civic credits awarded!
      // NO teacher notification!
      // Activity logged as private personal reflection (idempotent)
      const existingActivity = db.activities.find(
        (a) =>
          a.userId === input.userId &&
          a.type === 'reflection_shared' &&
          (a.referenceId === submission.id || a.referenceId === input.assignmentId)
      );
      if (existingActivity) {
        existingActivity.timestamp = now;
        existingActivity.updatedAt = now;
      } else {
        db.activities.push({
          id: generateId('act'),
          userId: input.userId,
          type: 'reflection_shared',
          title: `Recorded Personal Reflection: ${asg?.title || 'Values Inquiry'}`,
          description: 'Saved privately to your personal study record (no civic credits).',
          referenceId: submission.id,
          referenceType: 'submission',
          timestamp: now,
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now,
        });
      }

      this.saveDb(db);
      return JSON.parse(JSON.stringify(submission));
    }

    // Submission credit: +2 Contribution once per submission with Pending status (never minted as Verified before mentor review)
    const existingCredit = db.credits.find(
      (c) => c.userId === input.userId && c.sourceType === 'assignment' && c.sourceId === input.assignmentId
    );
    if (!existingCredit) {
      db.credits.push({
        id: generateId('tx'),
        userId: input.userId,
        dimension: 'Contribution',
        amount: 2,
        sourceType: 'assignment',
        sourceId: input.assignmentId,
        status: 'Pending',
        reason: `Submitted assignment (pending mentor review): ${asg?.title || input.assignmentId}`,
        createdAt: now,
        schemaVersion: 1,
      });

      const user = db.users.find((u) => u.id === input.userId);
      if (user) {
        user.totalCredits = this.calculateUserCredits(db, input.userId);
        user.updatedAt = now;
      }
    }

    // Trace into Passport: create or update pending passport entry (self_reported, reviewState: 'pending')
    const existingPassport = db.passportEntries.find(
      (p) => p.userId === input.userId && (p.sourceReferenceId === submission.id || p.sourceReferenceId === input.assignmentId)
    );
    if (!existingPassport) {
      db.passportEntries.push({
        id: generateId('pass'),
        userId: input.userId,
        category: 'contribution',
        title: `Pending Review: ${asg?.title || input.assignmentId}`,
        subtitle: 'Submitted assignment awaiting mentor review (Jaipur Demo Simulation)',
        date: now.split('T')[0],
        creditsAwarded: 2,
        evidenceIds: submission.evidenceIds || [],
        sourceReferenceId: submission.id,
        sourceReferenceType: 'submission',
        sourceRoute: `/assignments/${input.assignmentId}?submissionId=${submission.id}`,
        isVerified: false,
        verificationState: 'self_reported',
        reviewState: 'pending',
        visibility: 'public',
        calculationExplanation: 'Fixed demo rule: +2 Contribution on assignment submission. Facilitator review pending.',
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      });
    } else if (existingPassport.reviewState === 'revision_requested' || existingPassport.reviewState === 'pending') {
      existingPassport.title = `Pending Review: ${asg?.title || input.assignmentId}`;
      existingPassport.subtitle = 'Submitted assignment awaiting mentor review (Jaipur Demo Simulation)';
      existingPassport.date = now.split('T')[0];
      existingPassport.evidenceIds = submission.evidenceIds || [];
      existingPassport.sourceReferenceId = submission.id;
      existingPassport.sourceRoute = `/assignments/${input.assignmentId}?submissionId=${submission.id}`;
      existingPassport.isVerified = false;
      existingPassport.verificationState = 'self_reported';
      existingPassport.reviewState = 'pending';
      existingPassport.updatedAt = now;
    }

    // Activity (idempotent on resubmission)
    const existingActivity = db.activities.find(
      (a) =>
        a.userId === input.userId &&
        a.type === 'assignment_submitted' &&
        (a.referenceId === submission.id || a.referenceId === input.assignmentId)
    );
    if (existingActivity) {
      existingActivity.timestamp = now;
      existingActivity.updatedAt = now;
      existingActivity.title = `Submitted Assignment: ${asg?.title || input.assignmentId}`;
    } else {
      db.activities.push({
        id: generateId('act'),
        userId: input.userId,
        type: 'assignment_submitted',
        title: `Submitted Assignment: ${asg?.title || input.assignmentId}`,
        description: 'Submission queued for mentor review.',
        referenceId: submission.id,
        referenceType: 'submission',
        timestamp: now,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Notify teacher
    const user = db.users.find((u) => u.id === input.userId);
    const teachers = db.users.filter((u) => u.role === 'teacher');
    teachers.forEach((t) => {
      db.notifications.push({
        id: generateId('notif'),
        userId: t.id,
        title: 'New Assignment Submission',
        message: `${user?.name || 'A student'} submitted "${asg?.title || 'an assignment'}".`,
        type: 'assignment',
        isRead: false,
        targetRoute: `/assignments/${input.assignmentId}?submissionId=${submission.id}`,
        createdAt: now,
        schemaVersion: 1,
      });
    });

    this.saveDb(db);
    return JSON.parse(JSON.stringify(submission));
  }

  async reviewSubmission(input: SubmissionReviewInput): Promise<Submission> {
    const db = this.getDb();
    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    const isTeacher = activeUser?.role === 'teacher';
    let isAuthorizedScopedMod = false;
    let activeGrant: ScopedModeratorGrant | undefined;

    if (!isTeacher && activeUser) {
      const scopeCheck = this.verifyModeratorScopeInternal(activeUser.id, { type: 'assignments' }, db);
      if (scopeCheck.authorized && scopeCheck.grant) {
        isAuthorizedScopedMod = true;
        activeGrant = scopeCheck.grant;
      }
    }

    if (!isTeacher && !isAuthorizedScopedMod) {
      throw new Error('Unauthorized: only teachers may review submissions (or authorized scoped moderators with active assignments grant)');
    }
    if (input.reviewerId !== db.activeUserId) {
      throw new Error('Unauthorized: reviewerId must match active user');
    }

    const submission = db.submissions.find((s) => s.id === input.submissionId);
    if (!submission) throw new Error(`Submission ${input.submissionId} not found`);

    if (submission.userId === input.reviewerId) {
      throw new Error('Unauthorized: teachers cannot review their own submissions');
    }

    if (this.isUhvSubmission(submission, db)) {
      throw new Error('Teacher review and scoring are not permitted for private UHV reflections.');
    }

    if (submission.status === 'draft') {
      throw new Error('Cannot review a draft submission');
    }

    // Idempotent retry for exact same status and feedback
    if (submission.status === input.status && submission.teacherFeedback === input.teacherFeedback && submission.reviewerId === input.reviewerId) {
      return JSON.parse(JSON.stringify(submission));
    }

    const asg = db.assignments.find((a) => a.id === submission.assignmentId);
    if (!asg) {
      throw new Error(`Assignment ${submission.assignmentId} not found`);
    }

    for (const eid of submission.evidenceIds) {
      const ev = db.evidence.find((e) => e.id === eid);
      if (!ev) {
        throw new Error(`Evidence ${eid} not found`);
      }
      if (ev.ownerId !== submission.userId) {
        throw new Error('Unauthorized: submission contains evidence not owned by submitter');
      }
    }

    if (input.status === 'revision_requested' && (!input.teacherFeedback || !input.teacherFeedback.trim())) {
      throw new Error('Teacher feedback is required when requesting revision');
    }

    const now = new Date().toISOString();
    submission.status = input.status;
    submission.teacherFeedback = input.teacherFeedback;
    submission.reviewerId = input.reviewerId;
    submission.reviewedAt = now;
    if (input.score !== undefined) submission.score = input.score;
    submission.updatedAt = now;

    if (isAuthorizedScopedMod && activeGrant) {
      this.recordModeratorAuditSync(
        {
          grantId: activeGrant.id,
          action: 'grant_used',
          actorId: activeUser!.id,
          actorName: activeUser!.name,
          actorRole: activeUser!.role,
          scopeType: 'assignments',
          targetId: submission.id,
          details: `Scoped moderator reviewed submission "${submission.id}" (status: ${input.status}).`,
          outcome: 'success',
        },
        db
      );
    }

    const reviewerName = activeUser?.name || 'Reviewer';

    if (input.status === 'verified') {
      // 1. Update submission credit transaction status to Verified
      const subCredit = db.credits.find(
        (c) => c.userId === submission.userId && c.sourceType === 'assignment' && c.sourceId === submission.assignmentId
      );
      if (subCredit) {
        subCredit.status = 'Verified';
        subCredit.reason = `Submitted assignment: ${asg?.title || submission.assignmentId}`;
        subCredit.sourceRoute = `/assignments/${submission.assignmentId}?submissionId=${submission.id}`;
        subCredit.calculationExplanation = 'Fixed demo rule: +2 Contribution on assignment submission. Facilitator review confirmed.';
        subCredit.auditTrail = subCredit.auditTrail || [];
        subCredit.auditTrail.push({
          date: now,
          action: 'VERIFIED',
          actorId: input.reviewerId,
          actorName: reviewerName,
          note: input.teacherFeedback,
        });
      }

      // 2. Mark attached evidence verified and award +1 Observation credit per evidence (idempotently)
      submission.evidenceIds.forEach((eid) => {
        const ev = db.evidence.find((e) => e.id === eid);
        if (ev) {
          ev.verificationStatus = 'verified';
          ev.updatedAt = now;

          const existingEvCredit = db.credits.find(
            (c) => c.userId === submission.userId && c.sourceType === 'evidence' && c.sourceId === eid
          );
          if (existingEvCredit) {
            existingEvCredit.status = 'Verified';
            existingEvCredit.amount = 1;
            existingEvCredit.sourceRoute = `/passport/evidence`;
            existingEvCredit.calculationExplanation = 'Fixed demo rule: +1 Observation on verified field evidence.';
          } else {
            db.credits.push({
              id: generateId('tx'),
              userId: submission.userId,
              dimension: 'Observation',
              amount: 1,
              sourceType: 'evidence',
              sourceId: eid,
              sourceRoute: `/passport/evidence`,
              status: 'Verified',
              reason: `Verified field evidence: ${ev.title}`,
              calculationExplanation: 'Fixed demo rule: +1 Observation on verified field evidence.',
              createdAt: now,
              schemaVersion: 1,
            });
          }
        }
      });

      // Fallback if no evidence attached: award observation credit for assignment verification
      if (submission.evidenceIds.length === 0) {
        const existingObsCredit = db.credits.find(
          (c) => c.userId === submission.userId && c.sourceType === 'assignment' && c.sourceId === submission.assignmentId && c.dimension === 'Observation'
        );
        if (existingObsCredit) {
          existingObsCredit.status = 'Verified';
        } else {
          db.credits.push({
            id: generateId('tx'),
            userId: submission.userId,
            dimension: 'Observation',
            amount: 1,
            sourceType: 'assignment',
            sourceId: submission.assignmentId,
            sourceRoute: `/assignments/${submission.assignmentId}`,
            status: 'Verified',
            reason: `Verified assignment fieldwork: ${asg?.title || submission.assignmentId}`,
            calculationExplanation: 'Fixed demo rule: +1 Observation on verified assignment fieldwork.',
            createdAt: now,
            schemaVersion: 1,
          });
        }
      }

      // 3. Traceable Passport Entry
      const existingPassport = db.passportEntries.find(
        (p) => p.userId === submission.userId && (p.sourceReferenceId === submission.id || p.sourceReferenceId === submission.assignmentId)
      );
      const creditsAwarded = 2;
      if (existingPassport) {
        existingPassport.category = 'contribution';
        existingPassport.title = `Verified: ${asg?.title || 'Field Assignment'}`;
        existingPassport.subtitle = `Reviewed and verified by mentor (Jaipur Demo Simulation)`;
        existingPassport.date = now.split('T')[0];
        existingPassport.creditsAwarded = creditsAwarded;
        existingPassport.evidenceIds = submission.evidenceIds;
        existingPassport.sourceReferenceId = submission.id;
        existingPassport.sourceReferenceType = 'submission';
        existingPassport.sourceRoute = `/assignments/${submission.assignmentId}?submissionId=${submission.id}`;
        existingPassport.verificationState = 'facilitator_reviewed';
        existingPassport.reviewState = 'accepted';
        existingPassport.verifier = {
          id: input.reviewerId,
          name: reviewerName,
          role: 'Teacher / Mentor',
          label: 'Mentor Review (Jaipur Demo Simulation)',
        };
        existingPassport.organisation = 'Government Senior Secondary School Navchetna, Jaipur (Demo Simulation)';
        existingPassport.calculationExplanation = 'Fixed demo rule: +2 Contribution on assignment submission. Facilitator review confirmed field observation rigor (+1 Observation per evidence).';
        existingPassport.isVerified = true;
        existingPassport.revisionHistory = existingPassport.revisionHistory || [];
        existingPassport.revisionHistory.push({
          date: now,
          action: 'VERIFIED',
          actorId: input.reviewerId,
          actorName: reviewerName,
          note: input.teacherFeedback,
        });
      } else {
        db.passportEntries.push({
          id: generateId('pass'),
          userId: submission.userId,
          category: 'contribution',
          title: `Verified: ${asg?.title || 'Field Assignment'}`,
          subtitle: `Reviewed and verified by mentor (Jaipur Demo Simulation)`,
          date: now.split('T')[0],
          creditsAwarded,
          evidenceIds: submission.evidenceIds,
          sourceReferenceId: submission.id,
          sourceReferenceType: 'submission',
          sourceRoute: `/assignments/${submission.assignmentId}?submissionId=${submission.id}`,
          verificationState: 'facilitator_reviewed',
          reviewState: 'accepted',
          verifier: {
            id: input.reviewerId,
            name: reviewerName,
            role: 'Teacher / Mentor',
            label: 'Mentor Review (Jaipur Demo Simulation)',
          },
          organisation: 'Government Senior Secondary School Navchetna, Jaipur (Demo Simulation)',
          calculationExplanation: 'Fixed demo rule: +2 Contribution on assignment submission. Facilitator review confirmed field observation rigor (+1 Observation per evidence).',
          isVerified: true,
          revisionHistory: [
            {
              date: now,
              action: 'VERIFIED',
              actorId: input.reviewerId,
              actorName: reviewerName,
              note: input.teacherFeedback,
            },
          ],
          schemaVersion: 1,
        });
      }

      // Update user credits
      const user = db.users.find((u) => u.id === submission.userId);
      if (user) {
        user.totalCredits = this.calculateUserCredits(db, submission.userId);
        user.updatedAt = now;
      }
    } else if (input.status === 'revision_requested') {
      // Reversal / Reconciliation if previously verified or pending
      // 1. Revert submission credit to Pending
      const subCredit = db.credits.find(
        (c) => c.userId === submission.userId && c.sourceType === 'assignment' && c.sourceId === submission.assignmentId
      );
      if (subCredit) {
        subCredit.status = 'Pending';
        subCredit.reason = `Submitted assignment (revision requested): ${asg?.title || submission.assignmentId}`;
        subCredit.auditTrail = subCredit.auditTrail || [];
        subCredit.auditTrail.push({
          date: now,
          action: 'STATUS_RECONCILED',
          actorId: input.reviewerId,
          actorName: reviewerName,
          note: `Reverted to revision requested: ${input.teacherFeedback}`,
        });
      }

      // 2. Reverse dependent verification credits for evidence without deleting original evidence
      submission.evidenceIds.forEach((eid) => {
        const ev = db.evidence.find((e) => e.id === eid);
        if (ev) {
          ev.verificationStatus = 'under_review';
          ev.updatedAt = now;
        }
        const evCredit = db.credits.find(
          (c) => c.userId === submission.userId && c.sourceType === 'evidence' && c.sourceId === eid
        );
        if (evCredit) {
          evCredit.status = 'Reversed';
          evCredit.reason = `Reversal: Observation credit revoked upon mentor revision request`;
          evCredit.auditTrail = evCredit.auditTrail || [];
          evCredit.auditTrail.push({
            date: now,
            action: 'REVERSED',
            actorId: input.reviewerId,
            actorName: reviewerName,
            note: `Reversed +1 Observation credit upon revision request. Original evidence preserved.`,
          });
        }
      });

      // 3. Reconcile Passport Entry (keep original record, update reviewState and add audit history)
      const passEntry = db.passportEntries.find(
        (p) => p.userId === submission.userId && (p.sourceReferenceId === submission.id || p.sourceReferenceId === submission.assignmentId)
      );
      if (passEntry) {
        passEntry.reviewState = 'revision_requested';
        passEntry.verificationState = 'self_reported';
        passEntry.isVerified = false;
        passEntry.creditsAwarded = 0;
        passEntry.title = `Revision Requested: ${asg?.title || 'Field Assignment'}`;
        passEntry.subtitle = `Mentor requested revision (Jaipur Demo Simulation)`;
        passEntry.revisionHistory = passEntry.revisionHistory || [];
        passEntry.revisionHistory.push({
          date: now,
          action: 'REVISION_REQUESTED',
          actorId: input.reviewerId,
          actorName: reviewerName,
          note: input.teacherFeedback,
        });
      }

      // 4. Recompute user's total credits
      const user = db.users.find((u) => u.id === submission.userId);
      if (user) {
        user.totalCredits = this.calculateUserCredits(db, submission.userId);
        user.updatedAt = now;
      }
    }

    // Notify participant
    db.notifications.push({
      id: generateId('notif'),
      userId: submission.userId,
      title: input.status === 'verified' ? 'Assignment Verified!' : 'Revision Requested on Assignment',
      message: input.teacherFeedback ? input.teacherFeedback.slice(0, 100) : (input.status === 'verified' ? 'Your assignment was verified.' : 'Please revise your assignment.'),
      type: 'review',
      isRead: false,
      targetRoute: `/assignments/${submission.assignmentId}`,
      createdAt: now,
      schemaVersion: 1,
    });

    this.saveDb(db);
    return JSON.parse(JSON.stringify(submission));
  }

  // Evidence
  async getEvidenceList(options?: {
    ownerId?: string;
    visibility?: string;
    verificationStatus?: string;
  }): Promise<Evidence[]> {
    const db = this.getDb();
    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    const actor = activeUser ? { id: activeUser.id, role: activeUser.role } : null;

    let evs = db.evidence;
    if (options?.ownerId) evs = evs.filter((e) => e.ownerId === options.ownerId);
    if (options?.visibility) evs = evs.filter((e) => e.visibility === options.visibility);
    if (options?.verificationStatus) evs = evs.filter((e) => e.verificationStatus === options.verificationStatus);

    // Cross-persona privacy guard: private evidence is only visible to owner, assigned reviewer, or programme admin
    evs = evs.filter((e) => {
      if (e.visibility === 'private') {
        return canActorAccessPrivateEvidence(actor, e, db.submissions);
      }
      return true;
    });

    const cloned: Evidence[] = JSON.parse(JSON.stringify(evs));
    // Media protection: do not expose raw file dataUrl or blobKey to unauthorized personas
    for (const item of cloned) {
      if (!canActorAccessPrivateEvidence(actor, item, db.submissions)) {
        if (item.fileInfo?.dataUrl) {
          delete item.fileInfo.dataUrl;
        }
        if (item.fileInfo?.blobKey) {
          delete item.fileInfo.blobKey;
        }
      }
    }
    return cloned;
  }

  async getEvidence(evidenceId: string): Promise<Evidence | null> {
    const db = this.getDb();
    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    const actor = activeUser ? { id: activeUser.id, role: activeUser.role } : null;

    const ev = db.evidence.find((e) => e.id === evidenceId);
    if (!ev) return null;

    // Cross-persona privacy guard: private evidence is not accessible to unauthorized personas
    if (ev.visibility === 'private' && !canActorAccessPrivateEvidence(actor, ev, db.submissions)) {
      return null;
    }

    const cloned: Evidence = JSON.parse(JSON.stringify(ev));
    // Media protection: do not expose raw file dataUrl or blobKey to unauthorized personas
    if (!canActorAccessPrivateEvidence(actor, cloned, db.submissions)) {
      if (cloned.fileInfo?.dataUrl) {
        delete cloned.fileInfo.dataUrl;
      }
      if (cloned.fileInfo?.blobKey) {
        delete cloned.fileInfo.blobKey;
      }
    }
    return cloned;
  }

  async getEvidenceAttachment(evidenceId: string): Promise<{
    blobKey: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    blob: Blob;
    blobUrl?: string | null;
  } | null> {
    const db = this.getDb();
    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    const actor = activeUser ? { id: activeUser.id, role: activeUser.role } : null;

    const ev = db.evidence.find((e) => e.id === evidenceId);
    if (!ev) return null;

    // Access boundary check: only owner, assigned reviewer, programme_manager, or platform_admin
    if (!canActorAccessPrivateEvidence(actor, ev, db.submissions)) {
      throw new Error('Unauthorized: You do not have permission to access or download this evidence attachment.');
    }

    const blobKey = ev.fileInfo?.blobKey;
    if (!blobKey) return null;

    const attachment = await EvidenceAttachmentStore.getAttachment(blobKey);
    if (!attachment) return null;

    const blobUrl = await EvidenceAttachmentStore.getAttachmentBlobUrl(blobKey);
    return {
      ...attachment,
      blobUrl,
    };
  }

  async addEvidence(
    evidenceInput: Omit<Evidence, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>
  ): Promise<Evidence> {
    const db = this.getDb();
    if (evidenceInput.ownerId !== db.activeUserId) {
      throw new Error('Unauthorized: cannot create evidence for another participant');
    }

    // Guard: private UHV reflections cannot be attached to evidence or shared records
    if (evidenceInput.assignmentId) {
      const asg = db.assignments.find((a) => a.id === evidenceInput.assignmentId);
      if (asg && this.isUhvAssignment(asg, db)) {
        throw new Error('Private UHV reflections cannot be attached to evidence or shared records.');
      }
    }

    // Size limit & storage type validation
    if (evidenceInput.fileInfo?.size) {
      const isIndexedDb =
        Boolean(evidenceInput.fileInfo.blobKey) ||
        evidenceInput.fileInfo.storageType === 'indexeddb';

      if (isIndexedDb) {
        if (evidenceInput.fileInfo.size > MAX_BINARY_ATTACHMENT_BYTES) {
          throw new Error(
            `File size (${Math.round(evidenceInput.fileInfo.size / (1024 * 1024))} MB) exceeds single-browser demo attachment limit of 10 MB.`
          );
        }
        // Avoid huge DataURLs in localStorage
        if (evidenceInput.fileInfo.dataUrl) {
          delete evidenceInput.fileInfo.dataUrl;
        }
      } else {
        const maxFileBytes = 250 * 1024;
        if (evidenceInput.fileInfo.size > maxFileBytes) {
          throw new Error(
            `File size (${Math.round(evidenceInput.fileInfo.size / 1024)} KB) exceeds durable browser storage limit of 250 KB.`
          );
        }
      }
    }

    // Force newly created evidence to unverified/under_review for all personas.
    // Mentors/teachers cannot self-mint verified evidence; verification must proceed via reviewSubmission or reviewEvidence.
    let verificationStatus: VerificationStatus = 'under_review';
    if (evidenceInput.verificationStatus === 'unverified') {
      verificationStatus = 'unverified';
    }

    const now = new Date().toISOString();
    const newEvidence: Evidence = {
      ...evidenceInput,
      visibility: evidenceInput.visibility || 'private', // Evidence is private by default
      verificationStatus,
      id: generateId('ev'),
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    db.evidence.push(newEvidence);
    this.saveDb(db);
    return JSON.parse(JSON.stringify(newEvidence));
  }

  // Teacher / Mentor path to attach cohort attendance sheet or certificate
  async attachCohortEvidence(params: {
    mentorId: string;
    cohortId: string;
    participantIds: string[];
    documentType: 'attendance_sheet' | 'completion_certificate';
    title: string;
    description: string;
    auditNotes: string;
    fileInfo?: {
      name: string;
      size: number;
      type: string;
      blobKey?: string;
      dataUrl?: string;
    };
    assignmentId?: string;
  }): Promise<{ evidenceItems: Evidence[]; auditRecord: CohortEvidenceAuditRecord }> {
    const db = this.getDb();
    if (params.mentorId !== db.activeUserId) {
      throw new Error('Unauthorized: mentorId must match the active session persona.');
    }

    const mentor = db.users.find((u) => u.id === params.mentorId);
    if (!mentor) {
      throw new Error(`Mentor user ${params.mentorId} not found.`);
    }

    if (
      mentor.role !== 'teacher' &&
      mentor.role !== 'facilitator' &&
      mentor.role !== 'programme_manager' &&
      mentor.role !== 'platform_admin'
    ) {
      throw new Error(
        'Unauthorized: Only teachers, mentors, or administrators may attach cohort attendance sheets or certificates.'
      );
    }

    if (!params.participantIds || params.participantIds.length === 0) {
      throw new Error('At least one eligible cohort participant must be specified.');
    }

    if (!params.auditNotes || params.auditNotes.trim().length < 3) {
      throw new Error('Audit record notes must contain at least 3 characters.');
    }

    const now = new Date().toISOString();
    const auditId = generateId('audit_cohort');
    const createdEvs: Evidence[] = [];

    for (const pId of params.participantIds) {
      const participant = db.users.find((u) => u.id === pId);
      if (!participant) continue;

      // Clean fileInfo to avoid storing huge DataURLs in localStorage
      let cleanFileInfo = undefined;
      if (params.fileInfo) {
        cleanFileInfo = {
          name: params.fileInfo.name,
          size: params.fileInfo.size,
          type: params.fileInfo.type,
          blobKey: params.fileInfo.blobKey,
          storageType: 'indexeddb' as const,
          demoLabel: 'Cohort verified record (IndexedDB browser-local)',
        };
      }

      const newEv: Evidence = {
        id: generateId('ev_cohort'),
        ownerId: participant.id,
        ownerName: participant.name,
        type: params.documentType === 'attendance_sheet' ? 'attendance' : 'document',
        title: params.title.trim(),
        description: params.description.trim(),
        source: `Cohort Mentor Record: ${mentor.name}`,
        visibility: 'private', // private by default to protect individual student data
        verificationStatus: 'under_review', // Review status, NOT automatic verification!
        tags: [
          'Cohort',
          params.documentType === 'attendance_sheet' ? 'Attendance' : 'Certificate',
          params.cohortId,
        ],
        assignmentId: params.assignmentId,
        fileInfo: cleanFileInfo,
        metadata: {
          isCohortAttachment: true,
          cohortId: params.cohortId,
          documentType: params.documentType,
          attachedByMentorId: mentor.id,
          attachedByMentorName: mentor.name,
          attachedAt: now,
          auditNotes: params.auditNotes.trim(),
          auditRecordId: auditId,
          reviewStatus: 'pending_review',
        },
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      };

      db.evidence.push(newEv);
      createdEvs.push(newEv);
    }

    const auditRecord: CohortEvidenceAuditRecord = {
      id: auditId,
      timestamp: now,
      mentorId: mentor.id,
      mentorName: mentor.name,
      cohortId: params.cohortId,
      documentType: params.documentType,
      participantCount: params.participantIds.length,
      participantIds: params.participantIds,
      evidenceIds: createdEvs.map((e) => e.id),
      auditNotes: params.auditNotes.trim(),
      schemaVersion: 1,
      createdAt: now,
    };

    if (!db.cohortEvidenceAudits) {
      db.cohortEvidenceAudits = [];
    }
    db.cohortEvidenceAudits.push(auditRecord);

    this.saveDb(db);
    return {
      evidenceItems: JSON.parse(JSON.stringify(createdEvs)),
      auditRecord: JSON.parse(JSON.stringify(auditRecord)),
    };
  }

  // Review & verify evidence record (by reviewer/teacher/mentor)
  async reviewEvidence(params: {
    evidenceId: string;
    reviewerId: string;
    status: 'verified' | 'revision_requested';
    comment?: string;
  }): Promise<Evidence> {
    const db = this.getDb();
    if (params.reviewerId !== db.activeUserId) {
      throw new Error('Unauthorized: reviewerId must match the active session persona.');
    }

    const reviewer = db.users.find((u) => u.id === params.reviewerId);
    if (!reviewer) {
      throw new Error(`Reviewer user ${params.reviewerId} not found.`);
    }

    if (
      reviewer.role !== 'teacher' &&
      reviewer.role !== 'facilitator' &&
      reviewer.role !== 'programme_manager' &&
      reviewer.role !== 'platform_admin'
    ) {
      throw new Error(
        'Unauthorized: Only teachers, mentors, or administrators may review and verify evidence.'
      );
    }

    const ev = db.evidence.find((e) => e.id === params.evidenceId);
    if (!ev) {
      throw new Error(`Evidence item ${params.evidenceId} not found.`);
    }

    // Mentors cannot review their own evidence records
    if (ev.ownerId === reviewer.id) {
      throw new Error('Unauthorized: Mentors cannot review their own evidence records.');
    }

    const now = new Date().toISOString();
    ev.verificationStatus = params.status === 'verified' ? 'verified' : 'under_review';
    if (!ev.metadata) ev.metadata = {};
    ev.metadata.reviewStatus = params.status;
    ev.metadata.reviewedBy = reviewer.name;
    ev.metadata.reviewedById = reviewer.id;
    ev.metadata.reviewedAt = now;
    if (params.comment) {
      ev.metadata.reviewerComment = params.comment;
    }
    ev.updatedAt = now;

    // If verified, award +1 Observation credit to participant if not already awarded
    if (params.status === 'verified') {
      const existingCredit = db.credits.find(
        (c) => c.sourceType === 'evidence' && c.sourceId === ev.id && c.status === 'Verified'
      );
      if (!existingCredit) {
        db.credits.push({
          id: generateId('tx'),
          userId: ev.ownerId,
          amount: 1,
          dimension: 'Observation',
          reason: `Verified field evidence record (${ev.title.slice(0, 40)}) reviewed by ${reviewer.name}`,
          sourceType: 'evidence',
          sourceId: ev.id,
          status: 'Verified',
          createdAt: now,
          schemaVersion: 1,
        });

        const owner = db.users.find((u) => u.id === ev.ownerId);
        if (owner) {
          owner.totalCredits = (owner.totalCredits || 0) + 1;
        }
      }
    }

    // Notify participant
    db.notifications.push({
      id: generateId('notif'),
      userId: ev.ownerId,
      title: params.status === 'verified' ? 'Evidence Record Verified!' : 'Revision Requested on Evidence',
      message: params.comment ? params.comment.slice(0, 100) : (params.status === 'verified' ? 'Your evidence record was verified.' : 'Please revise your evidence.'),
      type: 'review',
      isRead: false,
      targetRoute: '/passport/evidence',
      createdAt: now,
      schemaVersion: 1,
    });

    this.saveDb(db);
    return JSON.parse(JSON.stringify(ev));
  }

  async getCohortEvidenceAudits(cohortId?: string): Promise<CohortEvidenceAuditRecord[]> {
    const db = this.getDb();
    let audits = db.cohortEvidenceAudits || [];
    if (cohortId) {
      audits = audits.filter((a) => a.cohortId === cohortId);
    }
    return JSON.parse(JSON.stringify(audits));
  }

  // Civic Moderation Reporting (Review Additions 3 & V2 Evidence Rules)
  async reportEvidenceOrSubmission(params: {
    reporterId: string;
    targetType: 'evidence' | 'submission';
    targetId: string;
    reason: string;
    severity?: ModerationSeverity;
  }): Promise<ModerationCase> {
    const db = this.getDb();

    // 1. Require reporterId === activeUserId
    if (!params.reporterId || params.reporterId !== db.activeUserId) {
      throw new Error(
        `Unauthorized: reporterId (${params.reporterId}) must match the active session persona (${db.activeUserId}).`
      );
    }

    const reporter = db.users.find((u) => u.id === params.reporterId);
    if (!reporter) {
      throw new Error(`Reporter user ${params.reporterId} not found`);
    }

    const actor = { id: reporter.id, role: reporter.role };

    const trimmedReason = params.reason?.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      throw new Error('A valid reason is required for moderation reporting (at least 3 characters).');
    }

    let targetSummary = '';
    if (params.targetType === 'evidence') {
      const ev = db.evidence.find((e) => e.id === params.targetId);
      if (!ev) {
        throw new Error(`Evidence item ${params.targetId} not found`);
      }

      // Reject UHV-linked evidence
      if (ev.assignmentId) {
        const asg = db.assignments.find((a) => a.id === ev.assignmentId);
        if (asg && this.isUhvAssignment(asg, db)) {
          throw new Error('Private UHV reflections and UHV-linked records cannot be reported or shared.');
        }
      }

      // Verify reporter can access private target
      if (ev.visibility === 'private' && !canActorAccessPrivateEvidence(actor, ev, db.submissions)) {
        throw new Error('Unauthorized: cannot report private evidence not accessible to you.');
      }

      // Avoid leaking private target details in moderation records
      targetSummary =
        ev.visibility === 'private'
          ? `Private evidence item ${ev.id}`
          : `Evidence: "${ev.title}" (owner: ${ev.ownerName})`;
    } else if (params.targetType === 'submission') {
      const sub = db.submissions.find((s) => s.id === params.targetId);
      if (!sub) {
        throw new Error(`Submission ${params.targetId} not found`);
      }

      // Reject UHV-linked submissions
      if (this.isUhvSubmission(sub, db)) {
        throw new Error('Private UHV reflections are protected and cannot be reported or shared.');
      }

      // Verify reporter can access target submission
      const canAccessSub =
        sub.userId === db.activeUserId ||
        sub.reviewerId === db.activeUserId ||
        actor.role === 'programme_manager' ||
        actor.role === 'platform_admin';

      if (!canAccessSub) {
        throw new Error('Unauthorized: cannot report submission not accessible to you.');
      }

      const asg = db.assignments.find((a) => a.id === sub.assignmentId);
      targetSummary = `Submission for: "${asg?.title || sub.assignmentId}" (user: ${sub.userId})`;
    } else {
      throw new Error(`Unsupported target type: ${params.targetType}`);
    }

    const now = new Date().toISOString();
    const newCase: ModerationCase = {
      id: generateId('mod_civic'),
      reporterId: params.reporterId,
      targetType: params.targetType === 'evidence' ? 'evidence' : 'contribution',
      targetId: params.targetId,
      reason: trimmedReason,
      severity: params.severity || 'medium',
      status: 'open',
      notes: `Report filed by @${reporter.username || reporter.name} (${reporter.role}). Target: ${targetSummary}.`,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    db.moderationCases = db.moderationCases || [];
    db.moderationCases.push(newCase);
    this.saveDb(db);

    return JSON.parse(JSON.stringify(newCase));
  }

  private ensureAssemblyRoleAllocations(assembly: Assembly, db: DemoDatabase): boolean {
    if (!assembly.roleAllocations) {
      assembly.roleAllocations = buildAssemblyRoleAllocations({
        assemblyId: assembly.id,
        isThreePersonMiniMode: assembly.isThreePersonMiniMode,
        participantUserIds: assembly.participantUserIds,
        roles: db.assemblyRoles.filter((r) => r.assemblyId === assembly.id),
        facilitatorId: assembly.facilitatorId,
        chairId: assembly.chairId,
        coChairId: assembly.coChairId,
        customDeclarations: db.userDeclarations,
      });
      return true;
    }
    return false;
  }

  async getAssemblies(userId?: string): Promise<Assembly[]> {
    const db = this.getDb();
    const activeViewer = db.activeUserId ? db.users.find((u) => u.id === db.activeUserId) : null;
    let mutated = false;
    for (const a of db.assemblies) {
      if (this.ensureAssemblyRoleAllocations(a, db)) {
        mutated = true;
      }
    }
    if (mutated) this.saveDb(db);
    const assemblies = userId
      ? db.assemblies.filter((a) => a.participantUserIds.includes(userId) || a.facilitatorId === userId)
      : db.assemblies;
    return assemblies.map((a) => projectAssemblyForCaller(a, activeViewer));
  }

  async getAssembly(assemblyId: string, _actorId?: string): Promise<Assembly | null> {
    const db = this.getDb();
    const activeViewer = db.activeUserId ? db.users.find((u) => u.id === db.activeUserId) : null;
    const asm = db.assemblies.find((a) => a.id === assemblyId);
    if (!asm) return null;
    if (this.ensureAssemblyRoleAllocations(asm, db)) {
      this.saveDb(db);
    }
    return projectAssemblyForCaller(asm, activeViewer);
  }

  async getAssemblyRoles(assemblyId: string): Promise<AssemblyRole[]> {
    const db = this.getDb();
    const roles = db.assemblyRoles.filter((r) => r.assemblyId === assemblyId);
    return JSON.parse(JSON.stringify(roles));
  }

  async getUserAssemblyRole(assemblyId: string, userId: string): Promise<AssemblyRole | null> {
    const db = this.getDb();
    const role = db.assemblyRoles.find((r) => r.assemblyId === assemblyId && r.userId === userId);
    return role ? JSON.parse(JSON.stringify(role)) : null;
  }

  private createAssemblyRole(
    assemblyId: string,
    userId: string,
    roleName: AssemblyRoleType,
    secondaryRoleName?: AssemblyRoleType
  ): AssemblyRole {
    return createAssemblyRoleData(assemblyId, userId, roleName, secondaryRoleName);
  }

  async joinAssembly(
    assemblyId: string,
    userId: string,
    preferredRole?: AssemblyRoleType
  ): Promise<{ assembly: Assembly; role: AssemblyRole; creditTransaction?: CreditTransaction }> {
    const db = this.getDb();
    const assembly = db.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error(`Assembly ${assemblyId} not found`);

    const user = db.users.find((u) => u.id === userId);
    if (!user) throw new Error(`User ${userId} not found or not eligible`);
    const now = new Date().toISOString();
    const caller = db.activeUserId ? db.users.find((u) => u.id === db.activeUserId) : null;
    const isOwner = caller?.role === 'platform_admin';

    // Ensure roleAllocations is initialized
    if (!assembly.roleAllocations) {
      assembly.roleAllocations = buildAssemblyRoleAllocations({
        assemblyId,
        isThreePersonMiniMode: assembly.isThreePersonMiniMode,
        participantUserIds: assembly.participantUserIds,
        roles: db.assemblyRoles.filter((r) => r.assemblyId === assemblyId),
        facilitatorId: assembly.facilitatorId,
        chairId: assembly.chairId,
        coChairId: assembly.coChairId,
        customDeclarations: db.userDeclarations,
      });
    }

    // Check or deterministically allocate role
    let role = db.assemblyRoles.find((r) => r.assemblyId === assemblyId && r.userId === userId);
    if (!role) {
      const canonicalRoles: AssemblyRoleType[] = ['Thinker', 'Enabler', 'Troubleshooter', 'Shaper'];
      const existingRoles = db.assemblyRoles.filter((r) => r.assemblyId === assemblyId);

      const roleCounts: Record<AssemblyRoleType, number> = {
        Thinker: 0,
        Enabler: 0,
        Troubleshooter: 0,
        Shaper: 0,
      };
      existingRoles.forEach((r) => {
        const canonicalName = normalizeAssemblyRoleName(r.roleName);
        if (roleCounts[canonicalName] !== undefined) {
          roleCounts[canonicalName]++;
        }
      });

      const totalParticipants = assembly.participantUserIds.includes(userId)
        ? assembly.participantUserIds.length
        : assembly.participantUserIds.length + 1;

      // Minimum role coverage: all four represented with four or more participants
      const unrepresentedRoles = canonicalRoles.filter((r) => roleCounts[r] === 0);

      let candidateRoles: AssemblyRoleType[] = [];
      if (totalParticipants >= 4 && unrepresentedRoles.length > 0) {
        candidateRoles = unrepresentedRoles;
      } else if (unrepresentedRoles.length > 0) {
        candidateRoles = unrepresentedRoles;
      } else {
        candidateRoles = canonicalRoles;
      }

      // Role history rotation (avoid repeatedly assigning Shaper or Chair)
      const userPastRoles = db.assemblyRoles
        .filter((r) => r.userId === userId && r.assemblyId !== assemblyId)
        .map((r) => normalizeAssemblyRoleName(r.roleName));

      if (userPastRoles.includes('Shaper') && candidateRoles.some((r) => r !== 'Shaper')) {
        candidateRoles = candidateRoles.filter((r) => r !== 'Shaper');
      }

      // Participant preferences check with reservation validation
      if (preferredRole && typeof preferredRole === 'string') {
        const targetAlloc = assembly.roleAllocations[preferredRole];
        if (targetAlloc) {
          const claimCheck = canUserClaimRoleAllocation(targetAlloc, userId, db.userDeclarations, isOwner);
          if (!claimCheck.allowed) {
            throw new Error(`Cannot assign preferred role "${preferredRole}": ${claimCheck.reason}`);
          }
        }
        candidateRoles = [preferredRole];
      } else {
        // Filter candidates according to reservation allocation rules
        const eligibleCandidates = candidateRoles.filter((r) => {
          const alloc = assembly.roleAllocations?.[r];
          if (!alloc) return true;
          const check = canUserClaimRoleAllocation(alloc, userId, db.userDeclarations, isOwner);
          return check.allowed;
        });

        if (eligibleCandidates.length === 0) {
          const allAllowed = canonicalRoles.filter((r) => {
            const alloc = assembly.roleAllocations?.[r];
            if (!alloc) return true;
            return canUserClaimRoleAllocation(alloc, userId, db.userDeclarations, isOwner).allowed;
          });
          if (allAllowed.length === 0) {
            throw new Error(
              `No functional role places available for participant "${userId}" under current capacity and 33% reservation rules. Unmet reserved role places stay vacant by default.`
            );
          }
          candidateRoles = allAllowed;
        } else {
          candidateRoles = eligibleCandidates;
        }
      }

      // Equitable participation: balance counts across roles (fewest assigned first)
      const minCount = Math.min(...candidateRoles.map((r) => roleCounts[r]));
      const balancedCandidates = candidateRoles.filter((r) => roleCounts[r] === minCount);

      // Deterministic tie-break based on userId + assemblyId
      let hash = 0;
      const key = `${userId}_${assemblyId}`;
      for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
      }
      const assignedRoleName = balancedCandidates[hash % balancedCandidates.length];

      // Transparent 3-person rotating/multi-role mini-deliberation
      let secondaryRole: AssemblyRoleType | undefined;
      if (totalParticipants === 3) {
        assembly.isThreePersonMiniMode = true;
        const updatedRoleCounts = { ...roleCounts };
        updatedRoleCounts[assignedRoleName] = (updatedRoleCounts[assignedRoleName] || 0) + 1;
        const missingRole = canonicalRoles.find((r) => (updatedRoleCounts[r] || 0) === 0);
        if (missingRole) {
          const secKey = `Secondary ${missingRole}`;
          let secAlloc = assembly.roleAllocations?.[secKey];
          if (!secAlloc) {
            secAlloc = buildAllocationState({
              allocationId: `alloc_${assemblyId}_sec_${missingRole.toLowerCase()}`,
              allocationType: 'named_roles',
              title: `${secKey} Allocation`,
              totalPlaces: 1,
              confirmedOccupants: [],
              existingStatus: 'pending',
              customDeclarations: db.userDeclarations,
            });
          }
          const secClaimCheck = canUserClaimRoleAllocation(secAlloc, userId, db.userDeclarations, isOwner);
          if (secClaimCheck.allowed) {
            secondaryRole = missingRole;
          } else {
            // userId denied secondary role: check other participants in 3-person mode
            const otherEligible = db.assemblyRoles.find(
              (r) =>
                r.assemblyId === assemblyId &&
                r.userId !== userId &&
                !r.secondaryRoleName &&
                r.roleName !== missingRole &&
                canUserClaimRoleAllocation(secAlloc, r.userId, db.userDeclarations, isOwner).allowed
            );
            if (otherEligible) {
              otherEligible.secondaryRoleName = missingRole;
              otherEligible.updatedAt = now;
            }
            // If no eligible person is available, secondaryRole remains undefined (vacant place)
          }
        }
      }

      role = createAssemblyRoleData(assemblyId, userId, assignedRoleName, secondaryRole);
      db.assemblyRoles.push(role);
    }

    let creditTx: CreditTransaction | undefined;
    const isAlreadyParticipant = assembly.participantUserIds.includes(userId);

    if (!isAlreadyParticipant) {
      assembly.participantUserIds.push(userId);
      if (assembly.participantUserIds.length === 3) {
        assembly.isThreePersonMiniMode = true;
      }
    }

    // Check if the assigned role had a prior exception and invalidate it on roster change
    const assignedRoleKey = role.roleName;
    const priorAlloc = assembly.roleAllocations[assignedRoleKey];
    if (priorAlloc && (priorAlloc.status === 'finalized_exception' || priorAlloc.isException)) {
      db.allocationAudits = db.allocationAudits || [];
      db.allocationAudits.push({
        id: generateId('audit'),
        allocationId: priorAlloc.allocationId,
        action: 'exception_invalidated',
        actorId: 'system',
        actorRole: 'system',
        actorName: 'System Validation Engine',
        timestamp: now,
        policyVersion: POLICY_VERSION,
        reason: `Roster changed: User ${userId} joined role "${assignedRoleKey}". Prior Platform Owner exception invalidated.`,
        outcome: 'reverted_to_pending',
        snapshot: {
          totalPlaces: priorAlloc.totalPlaces,
          reservedMinimum: priorAlloc.reservedMinimum,
          status: 'pending',
        },
      });
      priorAlloc.isException = false;
      priorAlloc.exceptionAudit = undefined;
      priorAlloc.status = 'pending';
    }

    // Rebuild assembly role allocations
    assembly.roleAllocations = buildAssemblyRoleAllocations({
      assemblyId,
      isThreePersonMiniMode: assembly.isThreePersonMiniMode,
      participantUserIds: assembly.participantUserIds,
      roles: db.assemblyRoles.filter((r) => r.assemblyId === assemblyId),
      facilitatorId: assembly.facilitatorId,
      chairId: assembly.chairId,
      coChairId: assembly.coChairId,
      existingAllocations: assembly.roleAllocations,
      customDeclarations: db.userDeclarations,
    });
    assembly.updatedAt = now;

    if (!isAlreadyParticipant) {
      // Award +2 Deliberation credit (idempotent)
      const existingCredit = db.credits.find(
        (c) => c.userId === userId && c.sourceType === 'assembly' && c.sourceId === assemblyId
      );
      if (!existingCredit) {
        creditTx = {
          id: generateId('tx'),
          userId,
          dimension: 'Deliberation',
          amount: 2,
          sourceType: 'assembly',
          sourceId: assemblyId,
          status: 'Verified',
          reason: `Joined Youth Assembly: ${assembly.title}`,
          createdAt: now,
          schemaVersion: 1,
        };
        db.credits.push(creditTx);

        if (user) {
          user.totalCredits = this.calculateUserCredits(db, userId);
          user.updatedAt = now;
        }
      }

      // Create Activity entry (idempotent)
      const existingActivity = db.activities.find(
        (a) => a.userId === userId && a.type === 'assembly_joined' && a.referenceId === assemblyId
      );
      if (!existingActivity) {
        db.activities.push({
          id: generateId('act'),
          userId,
          type: 'assembly_joined',
          title: `Joined Youth Assembly: ${assembly.title}`,
          description: `Admitted as ${role.roleName} in the deliberative chamber.`,
          referenceId: assemblyId,
          referenceType: 'assembly',
          timestamp: now,
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Create Passport Entry (idempotent)
      const existingPassport = db.passportEntries.find(
        (p) => p.userId === userId && p.sourceReferenceId === assemblyId && p.category === 'deliberation'
      );
      if (!existingPassport) {
        db.passportEntries.push({
          id: generateId('pass'),
          userId,
          category: 'deliberation',
          title: `Appointed Assembly ${role.roleName}`,
          subtitle: assembly.title,
          date: now.split('T')[0],
          creditsAwarded: 2,
          evidenceIds: assembly.evidenceIds.slice(0, 2),
          sourceReferenceId: assemblyId,
          sourceReferenceType: 'assembly',
          sourceRoute: `/assemblies/${assemblyId}`,
          verificationState: 'system_recorded',
          reviewState: 'accepted',
          calculationExplanation: 'Base rule: 2 Deliberation credits on joining youth assembly (System recorded)',
          isVerified: true,
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now,
        });
      }

      // Create Notification
      db.notifications.push({
        id: generateId('notif'),
        userId,
        title: 'Admitted to Youth Assembly',
        message: `You joined "${assembly.title}" as ${role.roleName} and earned 2 Deliberation Credits.`,
        type: 'assembly',
        isRead: false,
        targetRoute: `/assemblies/${assemblyId}`,
        createdAt: now,
        schemaVersion: 1,
      });

      this.saveDb(db);
    }

    return {
      assembly: projectAssemblyForCaller(assembly, caller),
      role: JSON.parse(JSON.stringify(role)),
      creditTransaction: creditTx ? JSON.parse(JSON.stringify(creditTx)) : undefined,
    };
  }

  async leaveAssembly(
    assemblyId: string,
    userId: string,
    actorId?: string
  ): Promise<{ assembly: Assembly }> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (actorId && effectiveActiveId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }
    const callerId = actorId || effectiveActiveId;
    const caller = callerId ? db.users.find((u) => u.id === callerId) : null;
    const isOwner = caller?.role === 'platform_admin';

    const assembly = db.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error(`Assembly ${assemblyId} not found`);

    const isAuthorized =
      callerId === userId ||
      callerId === assembly.facilitatorId ||
      callerId === assembly.chairId ||
      isOwner;
    if (!isAuthorized) {
      throw new Error(`Unauthorized: You cannot remove another user from this assembly.`);
    }

    const now = new Date().toISOString();

    // Remove from participants
    assembly.participantUserIds = assembly.participantUserIds.filter((id) => id !== userId);
    if (assembly.chairId === userId) {
      delete assembly.chairId;
    }
    if (assembly.coChairId === userId) {
      delete assembly.coChairId;
    }

    // Find and remove role
    const roleIdx = db.assemblyRoles.findIndex((r) => r.assemblyId === assemblyId && r.userId === userId);
    let removedRoleName: string | undefined;
    if (roleIdx !== -1) {
      removedRoleName = db.assemblyRoles[roleIdx].roleName;
      db.assemblyRoles.splice(roleIdx, 1);
    }

    // Invalidate prior exception on the vacated role
    if (removedRoleName && assembly.roleAllocations?.[removedRoleName]) {
      const priorAlloc = assembly.roleAllocations[removedRoleName];
      if (priorAlloc.status === 'finalized_exception' || priorAlloc.isException) {
        db.allocationAudits = db.allocationAudits || [];
        db.allocationAudits.push({
          id: generateId('audit'),
          allocationId: priorAlloc.allocationId,
          action: 'exception_invalidated',
          actorId: callerId || 'system',
          actorRole: caller?.role || 'system',
          actorName: caller?.name || 'System Validation Engine',
          timestamp: now,
          policyVersion: POLICY_VERSION,
          reason: `Roster changed: User ${userId} withdrew from role "${removedRoleName}". Prior Platform Owner exception invalidated.`,
          outcome: 'reverted_to_pending',
          snapshot: {
            totalPlaces: priorAlloc.totalPlaces,
            reservedMinimum: priorAlloc.reservedMinimum,
            status: 'pending',
          },
        });
        priorAlloc.isException = false;
        priorAlloc.exceptionAudit = undefined;
        priorAlloc.status = 'pending';
      }
    }

    // Rebuild assembly role allocations
    assembly.roleAllocations = buildAssemblyRoleAllocations({
      assemblyId,
      isThreePersonMiniMode: assembly.participantUserIds.length === 3,
      participantUserIds: assembly.participantUserIds,
      roles: db.assemblyRoles.filter((r) => r.assemblyId === assemblyId),
      facilitatorId: assembly.facilitatorId,
      chairId: assembly.chairId,
      coChairId: assembly.coChairId,
      existingAllocations: assembly.roleAllocations,
      customDeclarations: db.userDeclarations,
    });
    assembly.updatedAt = now;

    this.saveDb(db);
    return { assembly: projectAssemblyForCaller(assembly, caller) };
  }

  async overrideAssemblyRole(
    assemblyId: string,
    actorId: string,
    targetUserId: string,
    newRole: AssemblyRoleType | string,
    reason: string,
    newSecondaryRole?: AssemblyRoleType | null
  ): Promise<AssemblyRole> {
    const db = this.getDb();
    const effectiveActorId = actorId || db.activeUserId;
    if (!effectiveActorId) {
      throw new Error(`Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.`);
    }

    const assembly = db.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error(`Assembly ${assemblyId} not found`);

    // Mandatory justification reason check
    if (!reason || !reason.trim()) {
      throw new Error('A valid justification reason is required for facilitator role override.');
    }

    const caller = db.users.find((u) => u.id === effectiveActorId);
    const isOwner = caller?.role === 'platform_admin';
    const isAuthorized =
      effectiveActorId === assembly.facilitatorId ||
      effectiveActorId === assembly.chairId ||
      isOwner ||
      effectiveActorId === 'user_rohan';
    if (!isAuthorized) {
      throw new Error(
        `Unauthorized: Only the designated Assembly Chair/Facilitator or Platform Owner may override participant roles.`
      );
    }

    const role = db.assemblyRoles.find((r) => r.assemblyId === assemblyId && r.userId === targetUserId);
    if (!role) {
      throw new Error(`Participant ${targetUserId} has no allocated role in assembly ${assemblyId}`);
    }

    const previousRole = role.roleName;
    const previousSecondaryRole = role.secondaryRoleName;
    const now = new Date().toISOString();

    // Ensure roleAllocations is initialized
    if (!assembly.roleAllocations) {
      assembly.roleAllocations = buildAssemblyRoleAllocations({
        assemblyId,
        isThreePersonMiniMode: assembly.isThreePersonMiniMode,
        participantUserIds: assembly.participantUserIds,
        roles: db.assemblyRoles.filter((r) => r.assemblyId === assemblyId),
        facilitatorId: assembly.facilitatorId,
        chairId: assembly.chairId,
        coChairId: assembly.coChairId,
        customDeclarations: db.userDeclarations,
      });
    }

    const isSecondaryDirectOverride = typeof newRole === 'string' && newRole.startsWith('Secondary ');
    const actualRoleName: AssemblyRoleType = isSecondaryDirectOverride
      ? role.roleName
      : (normalizeAssemblyRoleName(newRole) as AssemblyRoleType);

    // Reservation policy validation: check target role capacity and reservation rules
    const targetRoleAlloc = isSecondaryDirectOverride
      ? assembly.roleAllocations[newRole]
      : assembly.roleAllocations[actualRoleName];

    if (targetRoleAlloc) {
      const claimCheck = canUserClaimRoleAllocation(targetRoleAlloc, targetUserId, db.userDeclarations, isOwner);
      if (!claimCheck.allowed) {
        throw new Error(
          `Cannot reassign ${targetUserId} to ${newRole}: ${claimCheck.reason || 'Violates mandatory reservation policy.'}`
        );
      }
    }

    let resolvedSecondaryRole: AssemblyRoleType | undefined = role.secondaryRoleName;

    if (isSecondaryDirectOverride) {
      resolvedSecondaryRole = newRole.replace('Secondary ', '').trim() as AssemblyRoleType;
    } else if (newSecondaryRole !== undefined) {
      if (newSecondaryRole === null) {
        resolvedSecondaryRole = undefined;
      } else {
        const secKey = `Secondary ${newSecondaryRole}`;
        let targetSecAlloc = assembly.roleAllocations[secKey];
        if (!targetSecAlloc) {
          targetSecAlloc = buildAllocationState({
            allocationId: `alloc_${assemblyId}_sec_${newSecondaryRole.toLowerCase()}`,
            allocationType: 'named_roles',
            title: `${secKey} Allocation`,
            totalPlaces: 1,
            confirmedOccupants: [],
            existingStatus: 'pending',
            customDeclarations: db.userDeclarations,
          });
        }
        const claimCheck = canUserClaimRoleAllocation(targetSecAlloc, targetUserId, db.userDeclarations, isOwner);
        if (!claimCheck.allowed) {
          throw new Error(
            `Cannot assign secondary role "${newSecondaryRole}" to ${targetUserId}: ${claimCheck.reason || 'Violates mandatory reservation policy.'}`
          );
        }
        resolvedSecondaryRole = newSecondaryRole;
      }
    } else if (assembly.isThreePersonMiniMode) {
      if (resolvedSecondaryRole === actualRoleName) {
        resolvedSecondaryRole = undefined;
      }
      if (resolvedSecondaryRole) {
        const secKey = `Secondary ${resolvedSecondaryRole}`;
        const targetSecAlloc = assembly.roleAllocations[secKey];
        if (targetSecAlloc) {
          const claimCheck = canUserClaimRoleAllocation(targetSecAlloc, targetUserId, db.userDeclarations, isOwner);
          if (!claimCheck.allowed) {
            resolvedSecondaryRole = undefined;
          }
        }
      }
    }

    // Invalidate prior exceptions on previousRole, newRole, and affected secondary allocations
    const affectedRoles = [previousRole, newRole];
    if (previousSecondaryRole) affectedRoles.push(`Secondary ${previousSecondaryRole}`);
    if (resolvedSecondaryRole) affectedRoles.push(`Secondary ${resolvedSecondaryRole}`);

    for (const rName of affectedRoles) {
      const priorAlloc = assembly.roleAllocations[rName];
      if (priorAlloc && (priorAlloc.status === 'finalized_exception' || priorAlloc.isException)) {
        db.allocationAudits = db.allocationAudits || [];
        db.allocationAudits.push({
          id: generateId('audit'),
          allocationId: priorAlloc.allocationId,
          action: 'exception_invalidated',
          actorId: effectiveActorId,
          actorRole: caller?.role || 'facilitator',
          actorName: caller?.name || effectiveActorId,
          timestamp: now,
          policyVersion: POLICY_VERSION,
          reason: `Roster changed: Facilitator reassigned participant ${targetUserId} to ${newRole}. Prior exception invalidated.`,
          outcome: 'reverted_to_pending',
          snapshot: {
            totalPlaces: priorAlloc.totalPlaces,
            reservedMinimum: priorAlloc.reservedMinimum,
            status: 'pending',
          },
        });
        priorAlloc.isException = false;
        priorAlloc.exceptionAudit = undefined;
        priorAlloc.status = 'pending';
      }
    }

    const updatedRoleData = createAssemblyRoleData(assemblyId, targetUserId, actualRoleName, resolvedSecondaryRole);
    role.roleName = updatedRoleData.roleName;
    role.secondaryRoleName = updatedRoleData.secondaryRoleName;
    role.power = updatedRoleData.power;
    role.lens = updatedRoleData.lens;
    role.responsibilities = updatedRoleData.responsibilities;
    role.promptSuggestions = updatedRoleData.promptSuggestions;
    role.powerActionDescription = updatedRoleData.powerActionDescription;
    role.responseObligation = updatedRoleData.responseObligation;
    role.badgeIcon = updatedRoleData.badgeIcon;
    role.updatedAt = now;

    // Rebuild assembly roleAllocations
    assembly.roleAllocations = buildAssemblyRoleAllocations({
      assemblyId,
      isThreePersonMiniMode: assembly.isThreePersonMiniMode,
      participantUserIds: assembly.participantUserIds,
      roles: db.assemblyRoles.filter((r) => r.assemblyId === assemblyId),
      facilitatorId: assembly.facilitatorId,
      chairId: assembly.chairId,
      coChairId: assembly.coChairId,
      existingAllocations: assembly.roleAllocations,
      customDeclarations: db.userDeclarations,
    });

    // Audit record for override
    const audit: AssemblyRoleOverrideAudit = {
      id: generateId('audit'),
      assemblyId,
      userId: targetUserId,
      userName: db.users.find((u) => u.id === targetUserId)?.name || targetUserId,
      previousRole,
      newRole: newRole as AssemblyRoleType,
      reason: reason.trim(),
      overriddenBy: effectiveActorId,
      overriddenByName: caller?.name || effectiveActorId,
      timestamp: now,
    };

    assembly.roleOverrideAudits = assembly.roleOverrideAudits || [];
    assembly.roleOverrideAudits.push(audit);
    assembly.updatedAt = now;

    // Notification to participant
    db.notifications.push({
      id: generateId('notif'),
      userId: targetUserId,
      title: 'Assembly Role Reassigned',
      message: `Your deliberative role in "${assembly.title}" was updated to ${newRole} by Facilitator. Reason: ${reason.trim()}`,
      type: 'assembly',
      isRead: false,
      targetRoute: `/assemblies/${assemblyId}/session`,
      createdAt: now,
      schemaVersion: 1,
    });

    this.saveDb(db);
    return JSON.parse(JSON.stringify(role));
  }

  async getAssemblyRoleAllocations(
    assemblyId: string,
    _actorId?: string
  ): Promise<Record<string, AllocationState>> {
    const db = this.getDb();
    const activeViewer = db.activeUserId ? db.users.find((u) => u.id === db.activeUserId) : null;
    const isOwner = activeViewer?.role === 'platform_admin';

    const assembly = db.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error(`Assembly ${assemblyId} not found`);

    if (this.ensureAssemblyRoleAllocations(assembly, db)) {
      this.saveDb(db);
    }

    const roleAllocations = assembly.roleAllocations ?? {};
    const sanitizedMap: Record<string, AllocationState> = {};
    for (const [key, alloc] of Object.entries(roleAllocations)) {
      sanitizedMap[key] = sanitizeAllocationForPublic(alloc, isOwner);
    }
    return sanitizedMap;
  }

  async finalizeAssemblyRoleAllocation(
    assemblyId: string,
    roleName: string,
    actorId?: string
  ): Promise<Assembly> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error(`Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.`);
    }
    if (actorId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const callerId = effectiveActiveId;
    const actor = db.users.find((u) => u.id === callerId);
    if (!actor) throw new Error(`Actor ${callerId} not found.`);

    const assembly = db.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error(`Assembly ${assemblyId} not found`);

    const isAuthorized =
      callerId === assembly.facilitatorId ||
      callerId === assembly.chairId ||
      actor.role === 'platform_admin';
    if (!isAuthorized) {
      throw new Error(`Unauthorized: Only Assembly Facilitator, Chair, or Platform Owner can finalize role allocations.`);
    }

    if (!assembly.roleAllocations) {
      assembly.roleAllocations = buildAssemblyRoleAllocations({
        assemblyId,
        isThreePersonMiniMode: assembly.isThreePersonMiniMode,
        participantUserIds: assembly.participantUserIds,
        roles: db.assemblyRoles.filter((r) => r.assemblyId === assemblyId),
        facilitatorId: assembly.facilitatorId,
        chairId: assembly.chairId,
        coChairId: assembly.coChairId,
        customDeclarations: db.userDeclarations,
      });
    }

    const alloc = assembly.roleAllocations[roleName];
    if (!alloc) {
      throw new Error(`Role allocation "${roleName}" not found in assembly ${assemblyId}`);
    }

    // Fails without mutating persistent state if noncompliant and no approved exception
    const { updatedAllocation, audit } = finalizeAllocationState(alloc, actor);

    assembly.roleAllocations[roleName] = updatedAllocation;
    assembly.updatedAt = new Date().toISOString();

    db.allocationAudits = db.allocationAudits || [];
    db.allocationAudits.push(audit);

    this.saveDb(db);
    return projectAssemblyForCaller(assembly, actor);
  }

  async approveAssemblyRoleException(
    assemblyId: string,
    roleName: string,
    reason: string,
    actorId?: string
  ): Promise<{ assembly: Assembly; audit: AllocationAuditRecord }> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error(`Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.`);
    }
    if (actorId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const callerId = effectiveActiveId;
    const actor = db.users.find((u) => u.id === callerId);

    // Authority guard: Strictly restricted to platform_admin
    if (!actor || actor.role !== 'platform_admin') {
      if (actor?.role === 'moderator' || this.hasAnyModeratorGrant(callerId, db)) {
        this.recordModeratorAuditSync(
          {
            action: 'grant_denied',
            actorId: callerId,
            actorName: actor?.name || 'Moderator',
            actorRole: actor?.role || 'moderator',
            scopeType: 'named_session',
            targetId: assemblyId,
            details: `Blocked 33% reservation exception override attempt for Assembly role "${roleName}". Scoped moderators cannot bypass the 33% rule.`,
            outcome: 'denied',
            denialReason: 'Rule boundary: Under OD.17 and Change Plan v2 §12, scoped moderators cannot approve 33% reservation exceptions.',
          },
          db
        );
        this.saveDb(db);
      }
      throw new Error(
        `Unauthorized: Only Platform Owner (role: platform_admin) can approve reservation exceptions. ` +
        `Current persona "${callerId}" (role: "${actor?.role || 'unknown'}") cannot approve exceptions.`
      );
    }

    const assembly = db.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error(`Assembly ${assemblyId} not found`);

    if (!assembly.roleAllocations) {
      assembly.roleAllocations = buildAssemblyRoleAllocations({
        assemblyId,
        isThreePersonMiniMode: assembly.isThreePersonMiniMode,
        participantUserIds: assembly.participantUserIds,
        roles: db.assemblyRoles.filter((r) => r.assemblyId === assemblyId),
        facilitatorId: assembly.facilitatorId,
        chairId: assembly.chairId,
        coChairId: assembly.coChairId,
        customDeclarations: db.userDeclarations,
      });
    }

    const alloc = assembly.roleAllocations[roleName];
    if (!alloc) {
      throw new Error(`Role allocation "${roleName}" not found in assembly ${assemblyId}`);
    }

    const { updatedAllocation, audit } = approveAllocationExceptionState(alloc, actor, reason);

    assembly.roleAllocations[roleName] = updatedAllocation;
    assembly.updatedAt = new Date().toISOString();

    db.allocationAudits = db.allocationAudits || [];
    db.allocationAudits.push(audit);

    this.saveDb(db);
    return {
      assembly: projectAssemblyForCaller(assembly, actor),
      audit: this.projectAuditForCaller(audit, actor),
    };
  }

  async updateAssemblyRoleCapacity(
    assemblyId: string,
    roleName: string,
    newTotalPlaces: number,
    actorId?: string
  ): Promise<Assembly> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error(`Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.`);
    }
    if (actorId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const callerId = effectiveActiveId;
    const actor = db.users.find((u) => u.id === callerId);
    if (!actor) throw new Error(`Actor ${callerId} not found.`);

    const assembly = db.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error(`Assembly ${assemblyId} not found`);

    const isAuthorized =
      callerId === assembly.facilitatorId ||
      callerId === assembly.chairId ||
      actor.role === 'platform_admin';
    if (!isAuthorized) {
      throw new Error(`Unauthorized: Only Facilitator, Chair, or Platform Owner can update role allocation capacity.`);
    }

    if (newTotalPlaces < 1) {
      throw new Error('Total places must be at least 1.');
    }

    const now = new Date().toISOString();

    // Check if previous allocation had an approved exception; changing size invalidates it!
    const priorAlloc = assembly.roleAllocations?.[roleName];
    if (priorAlloc && (priorAlloc.status === 'finalized_exception' || priorAlloc.isException)) {
      db.allocationAudits = db.allocationAudits || [];
      db.allocationAudits.push({
        id: generateId('audit'),
        allocationId: priorAlloc.allocationId,
        action: 'exception_invalidated',
        actorId: callerId,
        actorRole: actor.role,
        actorName: actor.name,
        timestamp: now,
        policyVersion: POLICY_VERSION,
        reason: `Capacity changed from ${priorAlloc.totalPlaces} to ${newTotalPlaces} for role "${roleName}". Prior Platform Owner exception invalidated.`,
        outcome: 'reverted_to_pending',
        snapshot: {
          totalPlaces: newTotalPlaces,
          reservedMinimum: Math.ceil(0.33 * newTotalPlaces),
          status: 'pending',
        },
      });
      priorAlloc.isException = false;
      priorAlloc.exceptionAudit = undefined;
      priorAlloc.status = 'pending';
    }

    // Rebuild allocations with override
    assembly.roleAllocations = buildAssemblyRoleAllocations({
      assemblyId,
      isThreePersonMiniMode: assembly.isThreePersonMiniMode,
      participantUserIds: assembly.participantUserIds,
      roles: db.assemblyRoles.filter((r) => r.assemblyId === assemblyId),
      facilitatorId: assembly.facilitatorId,
      chairId: assembly.chairId,
      coChairId: assembly.coChairId,
      existingAllocations: assembly.roleAllocations,
      customDeclarations: db.userDeclarations,
      plannedPlacesOverrides: { [roleName]: newTotalPlaces },
    });
    assembly.updatedAt = now;

    this.saveDb(db);
    return projectAssemblyForCaller(assembly, actor);
  }

  async getContributions(assemblyId: string): Promise<Contribution[]> {
    const db = this.getDb();
    const contribs = db.contributions
      .filter((c) => c.assemblyId === assemblyId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return JSON.parse(JSON.stringify(contribs));
  }

  async addAssemblyContribution(input: AssemblyContributionInput): Promise<Contribution> {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === input.userId);
    if (!user) throw new Error(`User ${input.userId} not found`);

    const trimmedText = (input.text || '').trim();
    if (!trimmedText || trimmedText.length < 5) {
      throw new Error('Contribution must contain substantive content (at least 5 characters).');
    }

    const assembly = db.assemblies.find((a) => a.id === input.assemblyId);
    if (!assembly) throw new Error(`Assembly ${input.assemblyId} not found`);

    // A contribution requires an already admitted participant with a confirmed valid role
    const isAdmitted = assembly.participantUserIds.includes(input.userId);
    const assignedRole = db.assemblyRoles.find(
      (r) => r.assemblyId === input.assemblyId && r.userId === input.userId
    );
    if (!isAdmitted || !assignedRole) {
      throw new Error(
        `Unauthorized: User "${input.userId}" is not an admitted participant with a confirmed valid role in assembly "${input.assemblyId}". Contributions require prior admission via joinAssembly.`
      );
    }

    const now = new Date().toISOString();
    const newContrib: Contribution = {
      id: generateId('contrib'),
      assemblyId: input.assemblyId,
      userId: input.userId,
      userName: user.name,
      stage: input.stage,
      type: input.type,
      text: trimmedText,
      evidenceIds: input.evidenceIds || [],
      supportCount: 1,
      dissentCount: 0,
      isSubstantive: input.isSubstantive ?? true,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    db.contributions.push(newContrib);

    // Credit transaction for substantive contribution (+1 Deliberation once per unique contribution)
    const creditTx: CreditTransaction = {
      id: generateId('tx'),
      userId: input.userId,
      dimension: 'Deliberation',
      amount: 1,
      sourceType: 'contribution',
      sourceId: newContrib.id,
      status: 'Verified',
      reason: `Added substantive contribution (${input.type}): ${trimmedText.slice(0, 50)}`,
      createdAt: now,
      schemaVersion: 1,
    };
    db.credits.push(creditTx);

    // Update user total credits
    user.totalCredits = this.calculateUserCredits(db, input.userId);
    user.updatedAt = now;

    // Activity
    db.activities.push({
      id: generateId('act'),
      userId: input.userId,
      type: 'contribution_added',
      title: `Added Assembly Contribution (${input.type.replace('_', ' ')})`,
      description: trimmedText.slice(0, 90),
      referenceId: newContrib.id,
      referenceType: 'contribution',
      timestamp: now,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Passport entry for substantive contribution
    db.passportEntries.push({
      id: generateId('pass'),
      userId: input.userId,
      category: 'deliberation',
      title: `Substantive Contribution: ${input.type.replace('_', ' ')}`,
      subtitle: trimmedText.slice(0, 75),
      date: now.split('T')[0],
      creditsAwarded: 1,
      evidenceIds: input.evidenceIds || [],
      sourceReferenceId: newContrib.id,
      sourceReferenceType: 'contribution',
      sourceRoute: `/assemblies/${input.assemblyId}`,
      verificationState: 'system_recorded',
      reviewState: 'accepted',
      calculationExplanation: 'Base rule: 1 Deliberation credit for substantive assembly contribution (System recorded)',
      isVerified: true,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    });

    this.saveDb(db);
    return JSON.parse(JSON.stringify(newContrib));
  }

  async getProposition(propositionId: string): Promise<Proposition | null> {
    const db = this.getDb();
    const prop = db.propositions.find((p) => p.id === propositionId);
    return prop ? JSON.parse(JSON.stringify(prop)) : null;
  }

  async updateProposition(input: {
    propositionId: string;
    updatedBy: string;
    actorId?: string;
    authorRole?: string;
    changesSummary?: string;
    question?: string;
    problem?: string;
    insight?: string;
    proposition?: string;
    enablers?: string[];
    risks?: string[];
    nextStep?: string;
    unresolvedQuestions?: string[];
    evidenceIds?: string[];
    evidenceBasis?: string[];
    assumptions?: string[];
    reviewerState?: 'draft' | 'under_review' | 'reviewed' | 'finalised';
    publicationVisibility?: 'internal_chamber' | 'assembly_members' | 'public_civic_record';
    dissent?: import('../types/domain').DissentRecord[];
    supportProfile?: import('../types/domain').SupportProfile;
    isAiGenerated?: boolean;
  }): Promise<Proposition> {
    const db = this.getDb();
    const prop = db.propositions.find((p) => p.id === input.propositionId);
    if (!prop) throw new Error(`Proposition ${input.propositionId} not found`);

    const assembly = db.assemblies.find((a) => a.id === prop.assemblyId);

    // Permission boundary check in repository
    if (input.actorId && assembly) {
      const isPermitted =
        assembly.participantUserIds.includes(input.actorId) ||
        input.actorId === assembly.facilitatorId ||
        input.actorId === assembly.chairId ||
        input.actorId === 'user_rohan';
      if (!isPermitted) {
        throw new Error('Unauthorized: User is not an admitted participant or facilitator of this Assembly');
      }
    }

    const now = new Date().toISOString();
    if (input.question !== undefined) prop.question = input.question;
    if (input.problem !== undefined) prop.problem = input.problem;
    if (input.insight !== undefined) prop.insight = input.insight;
    if (input.proposition !== undefined) prop.proposition = input.proposition;
    if (input.enablers !== undefined) prop.enablers = input.enablers;
    if (input.risks !== undefined) prop.risks = input.risks;
    if (input.nextStep !== undefined) prop.nextStep = input.nextStep;
    if (input.unresolvedQuestions !== undefined) prop.unresolvedQuestions = input.unresolvedQuestions;
    if (input.evidenceIds !== undefined) prop.evidenceIds = input.evidenceIds;
    if (input.evidenceBasis !== undefined) prop.evidenceBasis = input.evidenceBasis;
    if (input.assumptions !== undefined) prop.assumptions = input.assumptions;
    if (input.reviewerState !== undefined) prop.reviewerState = input.reviewerState;
    if (input.publicationVisibility !== undefined) prop.publicationVisibility = input.publicationVisibility;

    // Dissent records must survive edits:
    // If input.dissent is provided, ensure no previously existing dissents are dropped (immutability)
    if (input.dissent !== undefined) {
      if (input.dissent.length < prop.dissent.length) {
        throw new Error('Dissent records are immutable and cannot be erased by Chair or participants.');
      }
      const existingMap = new Map(prop.dissent.map((d) => [d.id, d]));
      input.dissent.forEach((d) => existingMap.set(d.id, d));
      prop.dissent = Array.from(existingMap.values());
    }

    if (input.supportProfile !== undefined) prop.supportProfile = input.supportProfile;

    prop.version += 1;
    prop.revisions.push({
      version: prop.version,
      updatedBy: input.updatedBy,
      authorId: input.actorId,
      authorRole: input.authorRole,
      changesSummary: input.changesSummary || `Updated proposition draft (v${prop.version})`,
      timestamp: now,
      isAiGenerated: Boolean(input.isAiGenerated),
    });
    prop.updatedAt = now;

    this.saveDb(db);
    return JSON.parse(JSON.stringify(prop));
  }

  async recordPropositionResponse(input: {
    propositionId: string;
    userId: string;
    responseState: ParticipantResponseState;
    reasonOrReservations?: string;
  }): Promise<Proposition> {
    const db = this.getDb();
    const prop = db.propositions.find((p) => p.id === input.propositionId);
    if (!prop) throw new Error(`Proposition ${input.propositionId} not found`);

    const assembly = db.assemblies.find((a) => a.id === prop.assemblyId);
    if (assembly) {
      const isParticipant =
        assembly.participantUserIds.includes(input.userId) ||
        assembly.facilitatorId === input.userId ||
        assembly.chairId === input.userId;
      if (!isParticipant) {
        throw new Error(`Unauthorized: User ${input.userId} is not a member of assembly ${assembly.id}`);
      }
    }

    const user = db.users.find((u) => u.id === input.userId);
    const userRole = db.assemblyRoles.find(
      (r) => r.assemblyId === prop.assemblyId && r.userId === input.userId
    );
    const now = new Date().toISOString();

    prop.participantResponses = prop.participantResponses || [];
    let existingResponse = prop.participantResponses.find((r) => r.userId === input.userId);

    if (existingResponse) {
      existingResponse.history = existingResponse.history || [];
      existingResponse.history.push({
        version: existingResponse.version,
        responseState: existingResponse.responseState,
        reasonOrReservations: existingResponse.reasonOrReservations,
        timestamp: existingResponse.timestamp,
      });
      existingResponse.responseState = input.responseState;
      existingResponse.reasonOrReservations = input.reasonOrReservations;
      existingResponse.version = prop.version;
      existingResponse.timestamp = now;
    } else {
      existingResponse = {
        id: generateId('resp'),
        propositionId: prop.id,
        userId: input.userId,
        userName: user?.name || input.userId,
        userRole: userRole?.roleName,
        responseState: input.responseState,
        reasonOrReservations: input.reasonOrReservations,
        version: prop.version,
        timestamp: now,
        history: [],
      };
      prop.participantResponses.push(existingResponse);
    }

    // If response is Dissent and reason provided, preserve in prop.dissent
    if (input.responseState === 'Dissent' && input.reasonOrReservations) {
      const existingDissent = prop.dissent.find((d) => d.userId === input.userId);
      if (!existingDissent) {
        prop.dissent.push({
          id: generateId('dis'),
          userId: input.userId,
          userName: user?.name || input.userId,
          reason: input.reasonOrReservations,
          suggestedAmendment: 'Review ramp gradient and automated speed enforcement.',
          versionRecorded: prop.version,
          timestamp: now,
        });
      }
    }

    // Trace formal Dissent into Civic Passport (unjudged procedural record without score or moral worth)
    if (input.responseState === 'Dissent') {
      const existingDissentPass = db.passportEntries.find(
        (p) => p.userId === input.userId && p.sourceReferenceId === prop.id && p.sourceReferenceType === 'dissent'
      );
      if (!existingDissentPass) {
        db.passportEntries.push({
          id: generateId('pass'),
          userId: input.userId,
          category: 'deliberation',
          title: `Retained Dissent: ${(prop.question || prop.proposition || 'Assembly Proposition').slice(0, 50)}`,
          subtitle: `Formal dissent recorded on assembly proposition (viewpoint preserved without scoring)`,
          date: now.split('T')[0],
          creditsAwarded: 0,
          evidenceIds: [],
          sourceReferenceId: prop.id,
          sourceReferenceType: 'dissent',
          sourceRoute: `/assemblies/${prop.assemblyId}?tab=propositions&propId=${prop.id}`,
          isVerified: true,
          verificationState: 'system_recorded',
          reviewState: 'accepted',
          visibility: 'public',
          calculationExplanation: 'Democratic pluralism principle: dissent is preserved as a procedural record without ideological judgment or credit reward.',
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    // Recalculate support profile
    let strongly = 0;
    let modifications = 0;
    let neutral = 0;
    let concerns = 0;

    prop.participantResponses.forEach((r) => {
      if (r.responseState === 'Support') strongly++;
      else if (r.responseState === 'Support with reservations') modifications++;
      else if (r.responseState === 'Abstain / insufficient basis') neutral++;
      else if (r.responseState === 'Dissent') concerns++;
    });

    prop.supportProfile = {
      stronglySupport: strongly,
      supportWithModifications: modifications,
      neutral,
      concerns,
    };
    prop.updatedAt = now;

    this.saveDb(db);
    return JSON.parse(JSON.stringify(prop));
  }

  async finaliseProposition(input: PropositionFinalisationInput & { actorId?: string }): Promise<Proposition> {
    const db = this.getDb();
    const proposition = db.propositions.find((p) => p.id === input.propositionId);
    if (!proposition) throw new Error(`Proposition ${input.propositionId} not found`);

    const assembly = db.assemblies.find((a) => a.id === input.assemblyId);

    // Prevent duplicate finalisation
    const isAlreadyFinalised =
      (assembly?.currentStage === 'final_assembly' && assembly?.status === 'concluded') ||
      Boolean(proposition.revisions.some((r) => r.changesSummary?.toLowerCase().includes('final outcome resolved')));

    if (isAlreadyFinalised) {
      throw new Error('Proposition has already been finalised and cannot be finalised again.');
    }

    // Chair power boundary & consensus rule:
    // "Never calculate proposition quality or force consensus from a simple >50% vote. Show unresolved split and retain minority insight visibly after revisions and finalisation."
    const hasActiveDissent =
      proposition.dissent.length > 0 ||
      (proposition.participantResponses && proposition.participantResponses.some((r) => r.responseState === 'Dissent'));

    if (input.outcome === 'CONSENSUS' && hasActiveDissent) {
      throw new Error(
        'Cannot force Consensus when unresolved dissent is recorded. Deliberation outcome must be Split Decision or Qualified Support.'
      );
    }

    const now = new Date().toISOString();
    proposition.outcome = input.outcome;
    proposition.version += 1;
    proposition.reviewerState = 'finalised';
    proposition.publicationVisibility = 'public_civic_record';
    if (input.nextStep) proposition.nextStep = input.nextStep;

    proposition.revisions.push({
      version: proposition.version,
      updatedBy: input.updatedBy,
      authorId: input.actorId,
      changesSummary: input.changesSummary || `Final outcome resolved to ${input.outcome} by ${input.updatedBy}`,
      timestamp: now,
    });
    proposition.updatedAt = now;

    // Advance assembly stage to final_assembly and status to concluded
    if (assembly) {
      assembly.currentStage = 'final_assembly';
      assembly.status = 'concluded';
      assembly.updatedAt = now;

      // Notify all assembly participants & add resolution passport entry
      assembly.participantUserIds.forEach((uid) => {
        db.notifications.push({
          id: generateId('notif'),
          userId: uid,
          title: 'Assembly Proposition Finalised',
          message: `Proposition "${proposition.question.slice(0, 50)}" finalised with outcome ${input.outcome}.`,
          type: 'assembly',
          isRead: false,
          targetRoute: `/propositions/${proposition.id}`,
          createdAt: now,
          schemaVersion: 1,
        });

        const existingPass = db.passportEntries.find(
          (p) => p.userId === uid && p.sourceReferenceId === proposition.id && p.sourceReferenceType === 'proposition'
        );
        if (!existingPass) {
          db.passportEntries.push({
            id: generateId('pass'),
            userId: uid,
            category: 'deliberation',
            title: `Assembly Resolution: ${input.outcome}`,
            subtitle: proposition.question,
            date: now.split('T')[0],
            creditsAwarded: 0,
            evidenceIds: proposition.evidenceIds.slice(0, 2),
            sourceReferenceId: proposition.id,
            sourceReferenceType: 'proposition',
            sourceRoute: `/assemblies/${proposition.assemblyId}?tab=propositions&propId=${proposition.id}`,
            verificationState: 'system_recorded',
            reviewState: 'accepted',
            calculationExplanation: 'Democratic outcome record (0 credits, system recorded)',
            isVerified: true,
            schemaVersion: 1,
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    }

    // Activity
    const currentUser = db.users.find((u) => u.name === input.updatedBy || u.id === input.updatedBy);
    const userId = currentUser ? currentUser.id : (assembly?.facilitatorId || db.activeUserId);

    const existingAct = db.activities.find(
      (a) => a.userId === userId && a.type === 'proposition_voted' && a.referenceId === proposition.id
    );
    if (!existingAct) {
      db.activities.push({
        id: generateId('act'),
        userId,
        type: 'proposition_voted',
        title: `Finalised Proposition: ${input.outcome}`,
        description: proposition.question,
        referenceId: proposition.id,
        referenceType: 'proposition',
        timestamp: now,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    this.saveDb(db);
    return JSON.parse(JSON.stringify(proposition));
  }

  async updateAssemblyStage(assemblyId: string, stage: AssemblyStage, actorId?: string): Promise<Assembly> {
    const db = this.getDb();
    const assembly = db.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error(`Assembly ${assemblyId} not found`);

    // Procedural active persona check: Chair/Facilitator only
    if (actorId) {
      const isAuthorized =
        actorId === assembly.facilitatorId || actorId === assembly.chairId || actorId === 'user_rohan';
      if (!isAuthorized) {
        throw new Error(
          'Unauthorized: Only the designated Assembly Chair/Facilitator may advance or change deliberation stages.'
        );
      }
    }

    const canonicalOrder: AssemblyStage[] = ['frame', 'think', 'enable', 'troubleshoot', 'shape', 'final_assembly'];
    const normalizedStage = normalizeAssemblyStage(stage);

    const currentIndex = canonicalOrder.indexOf(normalizeAssemblyStage(assembly.currentStage));
    const targetIndex = canonicalOrder.indexOf(normalizedStage);

    // Participant calls to advance/skip stages must fail at the repository boundary
    if (targetIndex > currentIndex + 1) {
      throw new Error(
        `Cannot skip stages: requested stage "${stage}" skips ahead of sequential procedure (${canonicalOrder[currentIndex]} -> ${canonicalOrder[currentIndex + 1]}).`
      );
    }

    const now = new Date().toISOString();
    assembly.currentStage = normalizedStage;
    assembly.updatedAt = now;
    this.saveDb(db);
    return JSON.parse(JSON.stringify(assembly));
  }

  async executeRolePowerAction(input: {
    assemblyId: string;
    userId: string;
    power: AssemblyRolePower;
    title: string;
    description: string;
    responseObligation?: string;
  }): Promise<AssemblyRoleAction> {
    const db = this.getDb();
    const assembly = db.assemblies.find((a) => a.id === input.assemblyId);
    if (!assembly) throw new Error(`Assembly ${input.assemblyId} not found`);

    const user = db.users.find((u) => u.id === input.userId);
    const role = db.assemblyRoles.find((r) => r.assemblyId === input.assemblyId && r.userId === input.userId);
    if (!role) throw new Error(`User ${input.userId} has no assigned role in assembly ${input.assemblyId}`);

    const expectedPower = getRolePowerForName(role.roleName);
    const expectedSecondaryPower = role.secondaryRoleName ? getRolePowerForName(role.secondaryRoleName) : null;
    const isPrimaryPower = input.power === expectedPower || input.power === role.power;
    const isSecondaryPower = Boolean(expectedSecondaryPower && input.power === expectedSecondaryPower);
    if (!isPrimaryPower && !isSecondaryPower) {
      throw new Error(`Role "${role.roleName}" cannot execute power "${input.power}". Expected "${expectedPower}".`);
    }

    // Reservation policy validation: Ensure user was not denied or blocked
    const checkRoleName = isSecondaryPower ? `Secondary ${role.secondaryRoleName}` : role.roleName;
    if (assembly.roleAllocations && assembly.roleAllocations[checkRoleName]) {
      const alloc = assembly.roleAllocations[checkRoleName];
      if (alloc.confirmedOccupants && !alloc.confirmedOccupants.includes(input.userId)) {
        throw new Error(
          `User ${input.userId} is not a confirmed participant in role allocation "${checkRoleName}". Role actions cannot be exercised by an occupant who was denied the role.`
        );
      }
      if (alloc.status === 'blocked_noncompliant') {
        throw new Error(
          `Role allocation "${checkRoleName}" is blocked non-compliant under the reservation policy. Role actions cannot be exercised until compliant or approved via Platform Owner exception.`
        );
      }
    }

    const defaultObligations: Record<AssemblyRolePower, string> = {
      'Question Setter': 'Enablers and Troubleshooters must review and address the inquiry.',
      'Feasibility Check': 'Shapers must incorporate validated owners and feasibility conditions into draft.',
      'Red Flag': 'Shapers and Enablers must record specific mitigations in proposition.',
      'Proposition Call': 'Full assembly responds across four participant response states.',
    };

    const action: AssemblyRoleAction = {
      id: generateId('action'),
      assemblyId: input.assemblyId,
      userId: input.userId,
      userName: user?.name || input.userId,
      roleName: isSecondaryPower ? (role.secondaryRoleName as AssemblyRoleType) : role.roleName,
      power: input.power,
      title: input.title,
      description: input.description,
      status: 'pending_response',
      responseObligation: input.responseObligation || defaultObligations[input.power],
      timestamp: new Date().toISOString(),
    };

    assembly.roleActions = assembly.roleActions || [];
    assembly.roleActions.push(action);
    assembly.updatedAt = new Date().toISOString();

    this.saveDb(db);
    return JSON.parse(JSON.stringify(action));
  }

  async respondToRolePowerAction(input: {
    assemblyId: string;
    actionId: string;
    userId: string;
    responseNote: string;
  }): Promise<AssemblyRoleAction> {
    const db = this.getDb();
    const assembly = db.assemblies.find((a) => a.id === input.assemblyId);
    if (!assembly) throw new Error(`Assembly ${input.assemblyId} not found`);

    assembly.roleActions = assembly.roleActions || [];
    const action = assembly.roleActions.find((a) => a.id === input.actionId);
    if (!action) throw new Error(`Role action ${input.actionId} not found`);

    action.status = 'addressed';
    action.responseNote = input.responseNote;
    const responder = db.users.find((u) => u.id === input.userId);
    action.respondedBy = responder?.name || input.userId;
    action.respondedAt = new Date().toISOString();

    assembly.updatedAt = new Date().toISOString();
    this.saveDb(db);
    return JSON.parse(JSON.stringify(action));
  }

  async requestAssemblySpeakingTurn(assemblyId: string, userId: string): Promise<Assembly> {
    const db = this.getDb();
    const assembly = db.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error(`Assembly ${assemblyId} not found`);

    assembly.speakingQueue = assembly.speakingQueue || [];
    const existing = assembly.speakingQueue.find(
      (e) => e.userId === userId && (e.status === 'waiting' || e.status === 'speaking')
    );
    if (existing) return JSON.parse(JSON.stringify(assembly));

    const user = db.users.find((u) => u.id === userId);
    const role = db.assemblyRoles.find((r) => r.assemblyId === assemblyId && r.userId === userId);

    assembly.speakingQueue.push({
      id: generateId('queue'),
      userId,
      userName: user?.name || userId,
      userRole: role?.roleName,
      requestedAt: new Date().toISOString(),
      status: 'waiting',
    });
    assembly.updatedAt = new Date().toISOString();
    this.saveDb(db);
    return JSON.parse(JSON.stringify(assembly));
  }

  async recognizeAssemblySpeaker(assemblyId: string, actorId: string, targetUserId: string): Promise<Assembly> {
    const db = this.getDb();
    const assembly = db.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error(`Assembly ${assemblyId} not found`);

    const isAuthorized =
      actorId === assembly.facilitatorId || actorId === assembly.chairId || actorId === 'user_rohan';
    if (!isAuthorized) {
      throw new Error('Unauthorized: Only the designated Chair or Facilitator can recognize speakers.');
    }

    assembly.speakingQueue = assembly.speakingQueue || [];
    assembly.speakingQueue.forEach((e) => {
      if (e.status === 'speaking') e.status = 'completed';
      if (e.userId === targetUserId && e.status === 'waiting') {
        e.status = 'speaking';
        e.recognizedAt = new Date().toISOString();
      }
    });
    assembly.activeSpeakerId = targetUserId;
    assembly.updatedAt = new Date().toISOString();
    this.saveDb(db);
    return JSON.parse(JSON.stringify(assembly));
  }

  async releaseAssemblySpeaker(assemblyId: string, actorId: string): Promise<Assembly> {
    const db = this.getDb();
    const assembly = db.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error(`Assembly ${assemblyId} not found`);

    const isAuthorized =
      actorId === assembly.facilitatorId || actorId === assembly.chairId || actorId === 'user_rohan';
    if (!isAuthorized) {
      throw new Error('Unauthorized: Only the designated Chair or Facilitator can release speakers.');
    }

    assembly.speakingQueue = assembly.speakingQueue || [];
    assembly.speakingQueue.forEach((e) => {
      if (e.status === 'speaking') e.status = 'completed';
    });
    assembly.activeSpeakerId = null;
    assembly.updatedAt = new Date().toISOString();
    this.saveDb(db);
    return JSON.parse(JSON.stringify(assembly));
  }

  // Projects
  async getProjects(programmeId?: string): Promise<Project[]> {
    const db = this.getDb();
    const projs = programmeId ? db.projects.filter((p) => p.programmeId === programmeId) : db.projects;
    return JSON.parse(JSON.stringify(projs));
  }

  async getProject(projectId: string): Promise<Project | null> {
    const db = this.getDb();
    const proj = db.projects.find((p) => p.id === projectId);
    return proj ? JSON.parse(JSON.stringify(proj)) : null;
  }

  async completeProjectMilestone(projectId: string, milestoneId: string, userId: string): Promise<Project> {
    const db = this.getDb();
    const project = db.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const milestone = project.milestones.find((m) => m.id === milestoneId);
    if (!milestone) throw new Error(`Milestone ${milestoneId} not found`);

    const now = new Date().toISOString();

    // Idempotent check: only award and record if not already completed
    if (!milestone.isCompleted) {
      milestone.isCompleted = true;
      milestone.completedAt = now;
      project.updatedAt = now;

      // If all milestones completed, update project status
      const allDone = project.milestones.every((m) => m.isCompleted);
      if (allDone && project.status !== 'completed') {
        project.status = 'completed';
      }

      // 1. Award +2 Civic Action credit (strictly idempotent)
      const existingCredit = db.credits.find(
        (c) => c.userId === userId && c.sourceType === 'project' && c.sourceId === milestoneId
      );
      if (!existingCredit) {
        db.credits.push({
          id: generateId('tx'),
          userId,
          dimension: 'Civic Action',
          amount: 2,
          sourceType: 'project',
          sourceId: milestoneId,
          status: 'Verified',
          reason: `Completed project milestone: ${milestone.title} (${project.title})`,
          createdAt: now,
          schemaVersion: 1,
        });

        const user = db.users.find((u) => u.id === userId);
        if (user) {
          user.totalCredits = this.calculateUserCredits(db, userId);
          user.updatedAt = now;
        }
      }

      // 2. Create Activity record (idempotent)
      const existingActivity = db.activities.find(
        (a) => a.userId === userId && a.type === 'project_milestone' && a.referenceId === milestoneId
      );
      if (!existingActivity) {
        db.activities.push({
          id: generateId('act'),
          userId,
          type: 'project_milestone',
          title: `Completed Project Milestone: ${milestone.title}`,
          description: `Action milestone achieved in "${project.title}".`,
          referenceId: milestoneId,
          referenceType: 'milestone',
          timestamp: now,
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now,
        });
      }

      // 3. Create Passport Entry (idempotent)
      const existingPassport = db.passportEntries.find(
        (p) => p.userId === userId && p.sourceReferenceId === milestoneId && p.category === 'civic_action'
      );
      if (!existingPassport) {
        db.passportEntries.push({
          id: generateId('pass'),
          userId,
          category: 'civic_action',
          title: `Milestone Achieved: ${milestone.title}`,
          subtitle: project.title,
          date: now.split('T')[0],
          creditsAwarded: 2,
          evidenceIds: project.evidenceIds.slice(0, 2),
          sourceReferenceId: milestoneId,
          sourceReferenceType: 'project_milestone',
          sourceRoute: `/workspaces`,
          verificationState: 'system_recorded',
          reviewState: 'accepted',
          calculationExplanation: 'Base rule: 2 Civic Action credits per completed milestone (System recorded)',
          isVerified: true,
          schemaVersion: 1,
          createdAt: now,
          updatedAt: now,
        });
      }

      // 4. Create Notification
      db.notifications.push({
        id: generateId('notif'),
        userId,
        title: 'Project Milestone Completed!',
        message: `You completed "${milestone.title}" in ${project.title} and earned 2 Civic Action Credits.`,
        type: 'project',
        isRead: false,
        targetRoute: `/projects/${projectId}`,
        createdAt: now,
        schemaVersion: 1,
      });

      this.saveDb(db);
    }

    return JSON.parse(JSON.stringify(project));
  }

  async addProjectNote(
    projectId: string,
    note: { authorId: string; text: string }
  ): Promise<Project> {
    const db = this.getDb();
    const project = db.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const author = db.users.find((u) => u.id === note.authorId);
    const now = new Date().toISOString();

    if (!project.notes) {
      project.notes = [];
    }

    project.notes.push({
      id: generateId('note'),
      authorId: note.authorId,
      authorName: author?.name || 'Team Member',
      text: note.text.trim(),
      createdAt: now,
    });
    project.updatedAt = now;

    this.saveDb(db);
    return JSON.parse(JSON.stringify(project));
  }

  async addProjectEvidence(projectId: string, evidenceId: string): Promise<Project> {
    const db = this.getDb();
    const project = db.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    if (!project.evidenceIds.includes(evidenceId)) {
      project.evidenceIds.push(evidenceId);
      project.updatedAt = new Date().toISOString();
      this.saveDb(db);
    }
    return JSON.parse(JSON.stringify(project));
  }

  async createProject(
    projectInput: Omit<Project, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>
  ): Promise<Project> {
    const db = this.getDb();
    const now = new Date().toISOString();
    const newProject: Project = {
      ...projectInput,
      id: generateId('proj'),
      notes: projectInput.notes || [],
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    db.projects.push(newProject);
    this.saveDb(db);
    return JSON.parse(JSON.stringify(newProject));
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    const db = this.getDb();
    const project = db.projects.find((p) => p.id === projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    Object.assign(project, updates, { updatedAt: new Date().toISOString() });
    this.saveDb(db);
    return JSON.parse(JSON.stringify(project));
  }

  // Events & Sessions
  private projectEventForCaller(evt: Event, caller?: User | null, db?: DemoDatabase): Event {
    const activeDb = db || this.getDb();
    const resolvedCaller = caller ?? (activeDb.activeUserId ? activeDb.users.find((u) => u.id === activeDb.activeUserId) : null);
    const cloned: Event = JSON.parse(JSON.stringify(evt));
    const isOwner = resolvedCaller?.role === 'platform_admin';
    const isAllocated = isAllocatedLimitedEvent(evt);

    if (cloned.allocation) {
      cloned.allocation = sanitizeAllocationForPublic(cloned.allocation, isOwner);
    }

    // Attach truthful aggregate counts
    cloned.registeredCount = evt.attendeeUserIds?.length ?? 0;

    // For allocated limited events: only Platform Owner may receive full attendee IDs, RSVP map, and check-in IDs.
    // Non-owner callers receive only their own participation state with no identified others.
    if (isAllocated && !isOwner) {
      const callerId = resolvedCaller?.id;
      cloned.attendeeUserIds = callerId && evt.attendeeUserIds?.includes(callerId) ? [callerId] : [];
      cloned.checkedInUserIds = callerId && evt.checkedInUserIds?.includes(callerId) ? [callerId] : [];
      if (cloned.rsvpMap) {
        cloned.rsvpMap = callerId && evt.rsvpMap?.[callerId] ? { [callerId]: evt.rsvpMap[callerId] } : {};
      }
    }

    return cloned;
  }

  private projectSessionForCaller(
    sess: Session,
    caller?: User | null,
    db?: DemoDatabase
  ): Session {
    const activeDb = db || this.getDb();
    const resolvedCaller = caller ?? (activeDb.activeUserId ? activeDb.users.find((u) => u.id === activeDb.activeUserId) : null);
    const cloned: Session = JSON.parse(JSON.stringify(sess));
    const isOwner = resolvedCaller?.role === 'platform_admin';
    if (isOwner) return cloned;

    // Sanitize roleAllocations for non-owner
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

    const linkedEvent = activeDb.events.find((e) => e.id === sess.eventId);
    if (!linkedEvent || !isAllocatedLimitedEvent(linkedEvent)) {
      return cloned;
    }

    // For allocated limited events: non-owner receives only their own participation state (if in roster) with no identified others.
    const callerId = resolvedCaller?.id;
    if (callerId) {
      cloned.roster = (cloned.roster || []).filter((entry) => entry.userId === callerId);
    } else {
      cloned.roster = [];
    }

    return cloned;
  }

  private projectAuditForCaller(audit: AllocationAuditRecord, caller?: User | null): AllocationAuditRecord {
    const cloned: AllocationAuditRecord = JSON.parse(JSON.stringify(audit));
    const isOwner = caller?.role === 'platform_admin';
    if (!isOwner) {
      delete cloned.actorId;
      delete cloned.actorName;
      delete cloned.reason;
      if (cloned.snapshot) {
        delete cloned.snapshot.reservedOccupiedCount;
        delete cloned.snapshot.ordinaryOccupiedCount;
        delete cloned.snapshot.vacanciesCount;
        if (
          cloned.snapshot.status === 'finalized_compliant' ||
          cloned.snapshot.status === 'blocked_noncompliant' ||
          cloned.snapshot.status === 'finalized_exception'
        ) {
          delete cloned.snapshot.status;
        }
      }
      if (cloned.outcome) {
        cloned.outcome = cloned.outcome
          .replace(/with \d+ vacant reserved seat\(s\)\.?/i, 'under Platform Owner exception approval.')
          .trim();
      }
    }
    return cloned;
  }

  async getEvents(): Promise<Event[]> {
    const db = this.getDb();
    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    return db.events.map((e) => this.projectEventForCaller(e, activeUser));
  }

  async getEvent(eventId: string): Promise<Event | null> {
    const db = this.getDb();
    const evt = db.events.find((e) => e.id === eventId);
    if (!evt) return null;
    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    return this.projectEventForCaller(evt, activeUser);
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const db = this.getDb();
    const sess = db.sessions.find((s) => s.id === sessionId);
    if (!sess) return null;
    if (!sess.roleAllocations) {
      sess.roleAllocations = buildSessionRoleAllocations({
        sessionId: sess.id,
        facilitatorId: sess.facilitatorId,
        roster: sess.roster,
        customDeclarations: db.userDeclarations,
      });
      if (sess.debateData) {
        sess.debateData.roleAllocations = sess.roleAllocations;
      }
      this.saveDb(db);
    }
    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    return this.projectSessionForCaller(sess, activeUser, db);
  }

  async getSessionByEvent(eventId: string): Promise<Session | null> {
    const db = this.getDb();
    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    const sess = db.sessions.find((s) => s.eventId === eventId);
    if (sess) {
      if (!sess.roleAllocations) {
        sess.roleAllocations = buildSessionRoleAllocations({
          sessionId: sess.id,
          facilitatorId: sess.facilitatorId,
          roster: sess.roster,
          customDeclarations: db.userDeclarations,
        });
        if (sess.debateData) {
          sess.debateData.roleAllocations = sess.roleAllocations;
        }
        this.saveDb(db);
      }
      return this.projectSessionForCaller(sess, activeUser, db);
    }
    const evt = db.events.find((e) => e.id === eventId);
    if (!evt) return null;

    // Default simulated session details
    const mockSession: Session = {
      id: `sess_sim_${eventId}`,
      eventId,
      title: `${evt.title} — Agenda & Resources`,
      currentMode: 'standard_meeting',
      facilitatorId: evt.organizerId || 'user_rohan',
      roster: (evt.attendeeUserIds || []).map((uid) => {
        const u = db.users.find((user) => user.id === uid);
        return {
          userId: uid,
          name: u?.name || uid,
          role: 'Participant',
          joinedAt: evt.createdAt,
        };
      }),
      modeTransitions: [
        {
          id: `trans_sim_${eventId}`,
          fromMode: 'standard_meeting',
          toMode: 'standard_meeting',
          timestamp: evt.createdAt,
          initiatedBy: evt.organizerId || 'user_rohan',
          summary: 'Session scheduled in standard meeting mode',
        },
      ],
      agenda: [
        { time: `${evt.startTime} - Briefing`, topic: 'Facilitator Welcome & Context Briefing', presenter: 'Session Chair' },
        { time: 'Deliberation Track', topic: `Field Observation Synthesis & Action Audit (${evt.type.replace('_', ' ')})`, presenter: 'Participating Youth Cohort' },
        { time: `Closing - ${evt.endTime}`, topic: 'Outcomes Synthesis & Civic Credit Recording', presenter: 'Rapporteur' },
      ],
      resources: [
        { title: `${evt.title} Reference Brief (PDF)`, url: '#', type: 'brief' },
        { title: 'Indian Road Congress (IRC) School Zone Standard Reference', url: '#', type: 'standard' },
        { title: 'Community Field Observation Tally Sheet', url: '#', type: 'worksheet' },
      ],
      notesSummary: `Simulated interactive session workspace for ${evt.title}. All youth participants can view agenda and study materials.`,
      schemaVersion: 1,
      createdAt: evt.createdAt,
      updatedAt: evt.updatedAt,
    };
    return this.projectSessionForCaller(mockSession, activeUser, db);
  }

  async acknowledgeRulebook(sessionId: string, userId: string): Promise<Session> {
    const db = this.getDb();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);
    if (!session.debateData) throw new Error(`Session ${sessionId} has no active debate data`);

    const isInRoster = session.roster.some((r) => r.userId === userId);
    if (!isInRoster) {
      throw new Error(`Unknown participant: user ${userId} is not in the session roster`);
    }

    session.debateData.acknowledgedUserIds = session.debateData.acknowledgedUserIds || [];
    if (!session.debateData.acknowledgedUserIds.includes(userId)) {
      session.debateData.acknowledgedUserIds.push(userId);
      session.updatedAt = new Date().toISOString();
      this.saveDb(db);
    }
    const caller = db.users.find((u) => u.id === (db.activeUserId || userId)) || null;
    return this.projectSessionForCaller(session, caller, db);
  }

  async requestSpeakingTurn(sessionId: string, userId: string): Promise<Session> {
    const db = this.getDb();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    if (session.currentMode !== 'debate_room') {
      throw new Error(`Session is currently in "${session.currentMode}" mode. Debate operations are only permitted in debate_room mode.`);
    }
    if (!session.debateData) {
      throw new Error(`Session ${sessionId} has no active debate data`);
    }
    if (session.debateData.currentPhase === 'CLOSED' || session.debateData.currentPhase === 'REPORT_PUBLISHED') {
      throw new Error('Session is closed: cannot request speaking turn in a closed session');
    }
    if (
      session.debateData.currentPhase === 'DRAFT' ||
      session.debateData.currentPhase === 'SCHEDULED' ||
      session.debateData.currentPhase === 'OPEN' ||
      session.debateData.currentPhase === 'MOTION_CONFIRMED'
    ) {
      throw new Error(`Speaking turns cannot be requested during "${session.debateData.currentPhase}" phase. Floor queue opens during active debate phases.`);
    }
    if (session.debateData.currentPhase === 'REFLECTION') {
      throw new Error(`Speaking turns cannot be requested during "${session.debateData.currentPhase}" phase. Debate floor is concluded.`);
    }

    // Validate participant is in roster
    const isInRoster = session.roster.some((r) => r.userId === userId);
    const user = db.users.find((u) => u.id === userId);
    if (!isInRoster || !user) {
      throw new Error(`Unknown participant: user ${userId} is not in the session roster`);
    }

    // Check duplicate queue entry
    const existingEntry = session.debateData.speakingQueue.find(
      (q) => q.userId === userId && (q.status === 'waiting' || q.status === 'speaking')
    );
    if (existingEntry) {
      throw new Error(`Duplicate queue entry: user ${userId} is already in the speaking queue`);
    }

    const newEntry: SpeakingQueueEntry = {
      id: `queue_${Date.now()}_${userId}`,
      userId,
      userName: user.name,
      userRole: user.role,
      requestedAt: new Date().toISOString(),
      status: 'waiting',
    };

    session.debateData.speakingQueue.push(newEntry);
    session.updatedAt = new Date().toISOString();
    this.saveDb(db);
    const caller = db.users.find((u) => u.id === (db.activeUserId || userId)) || null;
    return this.projectSessionForCaller(session, caller, db);
  }

  async cancelSpeakingTurn(sessionId: string, userId: string): Promise<Session> {
    const db = this.getDb();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    if (session.currentMode !== 'debate_room') {
      throw new Error(`Session is currently in "${session.currentMode}" mode. Debate operations are only permitted in debate_room mode.`);
    }
    if (!session.debateData) {
      throw new Error(`Session ${sessionId} has no active debate data`);
    }
    if (session.debateData.currentPhase === 'CLOSED' || session.debateData.currentPhase === 'REPORT_PUBLISHED') {
      throw new Error('Session is closed: cannot cancel speaking turn in a closed session');
    }

    const queueEntry = session.debateData.speakingQueue.find(
      (q) => q.userId === userId && (q.status === 'waiting' || q.status === 'speaking')
    );
    if (!queueEntry) {
      throw new Error(`No active or waiting speaking request found for user ${userId}`);
    }

    if (queueEntry.status === 'speaking' || session.debateData.activeSpeakerId === userId) {
      session.debateData.activeSpeakerId = null;
    }
    queueEntry.status = 'cancelled';
    session.updatedAt = new Date().toISOString();
    this.saveDb(db);
    const caller = db.users.find((u) => u.id === (db.activeUserId || userId)) || null;
    return this.projectSessionForCaller(session, caller, db);
  }

  async recognizeSpeakingTurn(sessionId: string, actorId: string, targetUserId: string): Promise<Session> {
    const db = this.getDb();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    if (session.currentMode !== 'debate_room') {
      throw new Error(`Session is currently in "${session.currentMode}" mode. Debate operations are only permitted in debate_room mode.`);
    }
    if (!session.debateData) {
      throw new Error(`Session ${sessionId} has no active debate data`);
    }
    if (actorId !== session.facilitatorId) {
      throw new Error(`Unauthorized actor action: only facilitator (${session.facilitatorId}) can recognize speaking turns`);
    }
    if (session.debateData.currentPhase === 'CLOSED' || session.debateData.currentPhase === 'REPORT_PUBLISHED') {
      throw new Error('Session is closed: cannot recognize speaking turn in a closed session');
    }
    if (session.debateData.currentPhase === 'REFLECTION') {
      throw new Error(`Cannot recognize speaking turns during "${session.debateData.currentPhase}" phase.`);
    }

    const targetEntry = session.debateData.speakingQueue.find(
      (q) => q.userId === targetUserId && q.status === 'waiting'
    );
    if (!targetEntry) {
      throw new Error(`Target participant ${targetUserId} is not waiting in the speaking queue`);
    }

    // Complete any existing speaking turn
    session.debateData.speakingQueue.forEach((q) => {
      if (q.status === 'speaking') {
        q.status = 'completed';
      }
    });

    targetEntry.status = 'speaking';
    targetEntry.recognizedAt = new Date().toISOString();
    session.debateData.activeSpeakerId = targetUserId;
    session.updatedAt = new Date().toISOString();
    this.saveDb(db);
    const caller = db.users.find((u) => u.id === (db.activeUserId || actorId)) || null;
    return this.projectSessionForCaller(session, caller, db);
  }

  async advanceSpeakingTurn(sessionId: string, actorId: string): Promise<Session> {
    const db = this.getDb();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    if (session.currentMode !== 'debate_room') {
      throw new Error(`Session is currently in "${session.currentMode}" mode. Debate operations are only permitted in debate_room mode.`);
    }
    if (!session.debateData) {
      throw new Error(`Session ${sessionId} has no active debate data`);
    }
    const isFacilitator = actorId === session.facilitatorId;
    const isActiveSpeaker = session.debateData.activeSpeakerId === actorId;
    if (!isFacilitator && !isActiveSpeaker) {
      throw new Error(`Unauthorized actor action: only facilitator (${session.facilitatorId}) or recognized speaker can advance or yield speaking turns`);
    }
    if (session.debateData.currentPhase === 'CLOSED' || session.debateData.currentPhase === 'REPORT_PUBLISHED') {
      throw new Error('Session is closed: cannot advance speaking turns in a closed session');
    }
    if (session.debateData.currentPhase === 'REFLECTION') {
      throw new Error(`Cannot advance speaking turns during "${session.debateData.currentPhase}" phase.`);
    }

    // Complete current speaker if any
    session.debateData.speakingQueue.forEach((q) => {
      if (q.status === 'speaking') {
        q.status = 'completed';
      }
    });

    // Find next waiting participant
    const nextWaiting = session.debateData.speakingQueue.find((q) => q.status === 'waiting');
    if (nextWaiting) {
      nextWaiting.status = 'speaking';
      nextWaiting.recognizedAt = new Date().toISOString();
      session.debateData.activeSpeakerId = nextWaiting.userId;
    } else {
      session.debateData.activeSpeakerId = null;
    }

    session.updatedAt = new Date().toISOString();
    this.saveDb(db);
    const caller = db.users.find((u) => u.id === (db.activeUserId || actorId)) || null;
    return this.projectSessionForCaller(session, caller, db);
  }

  async advanceDebatePhase(sessionId: string, actorId: string, nextPhase: DebatePhase): Promise<Session> {
    const db = this.getDb();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    if (session.currentMode !== 'debate_room') {
      throw new Error(`Session is currently in "${session.currentMode}" mode. Debate operations are only permitted in debate_room mode.`);
    }
    if (!session.debateData) {
      throw new Error(`Session ${sessionId} has no active debate data`);
    }
    if (actorId !== session.facilitatorId) {
      throw new Error(`Unauthorized actor action: only facilitator (${session.facilitatorId}) can advance debate phases`);
    }
    if (session.debateData.currentPhase === 'CLOSED' || session.debateData.currentPhase === 'REPORT_PUBLISHED') {
      throw new Error('Session is closed: cannot change phase in a closed session');
    }

    const currentPhase = session.debateData.currentPhase;
    const currIndex = DEBATE_PHASES.indexOf(currentPhase);
    const nextIndex = DEBATE_PHASES.indexOf(nextPhase);

    if (currIndex === -1 || nextIndex !== currIndex + 1) {
      throw new Error(`Invalid phase transition: cannot skip phases from ${currentPhase} to ${nextPhase}. Phases must advance sequentially.`);
    }

    // If moving to reflection, closed, or report published, complete current speaker
    if (['REFLECTION', 'CLOSED', 'REPORT_PUBLISHED'].includes(nextPhase)) {
      session.debateData.speakingQueue.forEach((q) => {
        if (q.status === 'speaking') q.status = 'completed';
      });
      session.debateData.activeSpeakerId = null;
    }

    session.debateData.currentPhase = nextPhase;
    session.updatedAt = new Date().toISOString();
    this.saveDb(db);
    const caller = db.users.find((u) => u.id === (db.activeUserId || actorId)) || null;
    return this.projectSessionForCaller(session, caller, db);
  }

  async postDebateContribution(input: {
    sessionId: string;
    userId: string;
    text: string;
    evidenceIds?: string[];
  }): Promise<Session> {
    if (!input.text || !input.text.trim()) {
      throw new Error('Contribution text cannot be empty');
    }
    const db = this.getDb();
    const session = db.sessions.find((s) => s.id === input.sessionId);
    if (!session) {
      throw new Error(`Session ${input.sessionId} not found`);
    }
    if (session.currentMode !== 'debate_room') {
      throw new Error(`Session is currently in "${session.currentMode}" mode. Debate operations are only permitted in debate_room mode.`);
    }
    if (!session.debateData) {
      throw new Error(`Session ${input.sessionId} has no active debate data`);
    }
    if (session.debateData.currentPhase === 'CLOSED' || session.debateData.currentPhase === 'REPORT_PUBLISHED') {
      throw new Error('Session is closed: cannot post contributions to a closed session');
    }

    const ACTIVE_DEBATE_PHASES: DebatePhase[] = [
      'OPENING_STATEMENTS',
      'DISCUSSION',
      'REBUTTAL_OR_QUESTIONS',
      'CLOSING_STATEMENTS',
    ];

    if (!ACTIVE_DEBATE_PHASES.includes(session.debateData.currentPhase)) {
      throw new Error(
        `Invalid debate phase: contributions are only allowed during active debate phases (opening statements, discussion, rebuttal, closing statements), but current phase is ${session.debateData.currentPhase}`
      );
    }

    if (session.debateData.activeSpeakerId !== input.userId) {
      throw new Error('Unauthorized: only the recognized participant may post a text contribution during an active debate turn');
    }

    // Validate evidence IDs against session's allowed evidence
    if (input.evidenceIds && input.evidenceIds.length > 0) {
      for (const evId of input.evidenceIds) {
        const ev = db.evidence.find((e) => e.id === evId);
        if (!ev) {
          throw new Error(`Evidence with ID "${evId}" does not exist in repository`);
        }
        if (session.assemblyId) {
          const assembly = db.assemblies.find((a) => a.id === session.assemblyId);
          if (assembly && !assembly.evidenceIds.includes(evId)) {
            throw new Error(`Evidence "${evId}" is not attached to this session's assembly`);
          }
        }
      }
    }

    const user = db.users.find((u) => u.id === input.userId);
    const contrib: DebateContribution = {
      id: `deb_contrib_${Date.now()}_${input.userId}`,
      userId: input.userId,
      userName: user?.name || input.userId,
      phase: session.debateData.currentPhase,
      timestamp: new Date().toISOString(),
      text: input.text.trim(),
      evidenceIds: input.evidenceIds || [],
    };

    session.debateData.contributions.push(contrib);
    session.updatedAt = new Date().toISOString();
    this.saveDb(db);
    const caller = db.users.find((u) => u.id === (db.activeUserId || input.userId)) || null;
    return this.projectSessionForCaller(session, caller, db);
  }

  // Debate Room Controls & Popup Assignments (Change Plan v2 §13)
  async castDebateVote(
    sessionId: string,
    userId: string,
    stance: 'for' | 'against' | 'abstain'
  ): Promise<Session> {
    const db = this.getDb();
    if (userId !== db.activeUserId) {
      throw new Error('Unauthorized: cannot cast vote for another persona');
    }
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    if (!session.debateData) {
      throw new Error(`Session ${sessionId} has no active debate data`);
    }
    if (session.debateData.currentPhase === 'CLOSED' || session.debateData.currentPhase === 'REPORT_PUBLISHED') {
      throw new Error('Cannot vote in a closed debate chamber');
    }

    session.debateData.votes = session.debateData.votes || {};
    session.debateData.votes[userId] = stance;
    session.updatedAt = new Date().toISOString();

    this.saveDb(db);
    const caller = db.users.find((u) => u.id === db.activeUserId) || null;
    return this.projectSessionForCaller(session, caller, db);
  }

  async getDebateVotes(sessionId: string): Promise<Record<string, 'for' | 'against' | 'abstain'>> {
    const db = this.getDb();
    const session = db.sessions.find((s) => s.id === sessionId);
    return session?.debateData?.votes ? JSON.parse(JSON.stringify(session.debateData.votes)) : {};
  }

  async updateDebateSpeechTimer(
    sessionId: string,
    actorId: string,
    timer: { speakerId?: string | null; secondsRemaining: number; totalSeconds: number; isRunning: boolean }
  ): Promise<Session> {
    const db = this.getDb();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    if (!session.debateData) {
      throw new Error(`Session ${sessionId} has no active debate data`);
    }

    session.debateData.speechTimer = {
      speakerId: timer.speakerId ?? session.debateData.activeSpeakerId ?? null,
      secondsRemaining: timer.secondsRemaining,
      totalSeconds: timer.totalSeconds,
      isRunning: timer.isRunning,
      lastUpdated: new Date().toISOString(),
    };
    session.updatedAt = new Date().toISOString();

    this.saveDb(db);
    const caller = db.users.find((u) => u.id === (db.activeUserId || actorId)) || null;
    return this.projectSessionForCaller(session, caller, db);
  }

  async pushDebatePopupAssignment(input: {
    sessionId: string;
    actorId: string;
    title: string;
    instruction: string;
    timeLimitMinutes: number;
  }): Promise<{ session: Session; assignment: Assignment }> {
    const db = this.getDb();
    if (input.actorId !== db.activeUserId) {
      throw new Error(`Unauthorized: actor "${input.actorId}" does not match active persona "${db.activeUserId}"`);
    }
    const session = db.sessions.find((s) => s.id === input.sessionId);
    if (!session) {
      throw new Error(`Session ${input.sessionId} not found`);
    }
    if (!session.debateData) {
      throw new Error(`Session ${input.sessionId} has no debate data`);
    }
    // Facilitator publication authorization boundary
    if (session.facilitatorId !== input.actorId) {
      throw new Error('Unauthorized: only the room facilitator can publish a popup assignment');
    }
    if (!input.title || !input.title.trim()) {
      throw new Error('Popup assignment title cannot be empty');
    }
    if (!input.instruction || !input.instruction.trim()) {
      throw new Error('Popup assignment instruction cannot be empty');
    }
    if (!input.timeLimitMinutes || input.timeLimitMinutes <= 0) {
      throw new Error('Time limit must be greater than zero');
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const expiresAt = new Date(now.getTime() + input.timeLimitMinutes * 60 * 1000).toISOString();
    const assignmentId = generateId('asg_popup');

    // Change Plan v2 §13 Atomic Task Replacement & Alignment:
    // If a previous popup assignment exists for this session, atomically archive it
    // so it cannot remain active or submittable by direct route after replacement.
    const prevAssignmentId =
      session.debateData.popupAssignment?.assignmentId || session.debateData.activePopupAssignmentId;
    if (prevAssignmentId) {
      const prevAssignment = db.assignments.find((a) => a.id === prevAssignmentId);
      if (prevAssignment && prevAssignment.status === 'active') {
        prevAssignment.status = 'archived';
        prevAssignment.updatedAt = nowIso;
      }
      if (session.debateData.popupAssignment) {
        session.debateData.popupAssignment.isClosed = true;
      }
    }

    // Ensure all previous popup assignments belonging to this session are archived
    for (const a of db.assignments) {
      if (a.sessionId === session.id && a.isPopupAssignment && a.status === 'active') {
        a.status = 'archived';
        a.updatedAt = nowIso;
      }
    }

    const assignment: Assignment = {
      id: assignmentId,
      courseId: 'course_deliberation_02',
      sessionId: session.id,
      assignmentType: 'civic_assignment',
      title: input.title.trim(),
      prompt: input.instruction.trim(),
      rubric: [
        {
          criterion: 'Chamber Motion Grounding',
          maxPoints: 10,
          description: 'Direct response to chamber prompt and discussion on school corridor safety.',
        },
        {
          criterion: 'Evidence or Civic Reasoning',
          maxPoints: 10,
          description: 'Grounding in speed logs, field observations, or pedestrian rights.',
        },
      ],
      creditsReward: 2,
      status: 'active',
      dueDate: expiresAt,
      timeLimitMinutes: input.timeLimitMinutes,
      isPopupAssignment: true,
      facilitatorId: input.actorId,
      schemaVersion: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.assignments.push(assignment);

    session.debateData.activePopupAssignmentId = assignmentId;
    session.debateData.popupAssignment = {
      assignmentId,
      title: assignment.title,
      instruction: assignment.prompt,
      timeLimitMinutes: input.timeLimitMinutes,
      pushedBy: input.actorId,
      pushedAt: nowIso,
      expiresAt,
      isClosed: false,
    };
    session.updatedAt = nowIso;

    this.saveDb(db);
    const caller = db.users.find((u) => u.id === db.activeUserId) || null;
    return {
      session: this.projectSessionForCaller(session, caller, db),
      assignment: JSON.parse(JSON.stringify(assignment)),
    };
  }

  async closeDebatePopupAssignment(sessionId: string, actorId: string): Promise<Session> {
    const db = this.getDb();
    if (actorId !== db.activeUserId) {
      throw new Error(`Unauthorized: actor "${actorId}" does not match active persona "${db.activeUserId}"`);
    }
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    if (!session.debateData) {
      throw new Error(`Session ${sessionId} has no debate data`);
    }
    if (session.facilitatorId !== actorId) {
      throw new Error('Unauthorized: only the room facilitator can close a popup assignment');
    }

    const nowIso = new Date().toISOString();
    if (session.debateData.popupAssignment) {
      session.debateData.popupAssignment.isClosed = true;
    }

    const asgId =
      session.debateData.popupAssignment?.assignmentId || session.debateData.activePopupAssignmentId;
    if (asgId) {
      const asg = db.assignments.find((a) => a.id === asgId);
      if (asg && asg.status === 'active') {
        asg.status = 'archived';
        asg.updatedAt = nowIso;
      }
    }

    for (const a of db.assignments) {
      if (a.sessionId === session.id && a.isPopupAssignment && a.status === 'active') {
        a.status = 'archived';
        a.updatedAt = nowIso;
      }
    }

    session.updatedAt = nowIso;

    this.saveDb(db);
    const caller = db.users.find((u) => u.id === db.activeUserId) || null;
    return this.projectSessionForCaller(session, caller, db);
  }

  async switchSessionMode(
    sessionId: string,
    actorId: string,
    targetMode: SessionMode,
    summary?: string
  ): Promise<Session> {
    const ALLOWED_LOCAL_MODES: SessionMode[] = ['debate_room', 'youth_assembly', 'standard_meeting'];
    if (!ALLOWED_LOCAL_MODES.includes(targetMode)) {
      throw new Error(
        `Unsupported session mode "${targetMode}". Only debate_room, youth_assembly, and standard_meeting modes are supported in this local simulation.`
      );
    }

    const db = this.getDb();
    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    if (actorId !== session.facilitatorId) {
      throw new Error(`Unauthorized actor action: only facilitator (${session.facilitatorId}) can switch session modes`);
    }

    if (!session.roleAllocations) {
      session.roleAllocations = buildSessionRoleAllocations({
        sessionId,
        facilitatorId: session.facilitatorId,
        roster: session.roster,
        customDeclarations: db.userDeclarations,
      });
      if (session.debateData) {
        session.debateData.roleAllocations = session.roleAllocations;
      }
    }

    if (session.currentMode !== targetMode) {
      session.modeTransitions.push({
        id: `trans_${Date.now()}`,
        fromMode: session.currentMode,
        toMode: targetMode,
        timestamp: new Date().toISOString(),
        initiatedBy: actorId,
        summary: summary || `Facilitator transitioned session mode from ${session.currentMode} to ${targetMode}`,
      });
      session.currentMode = targetMode;
      session.updatedAt = new Date().toISOString();
      this.saveDb(db);
    }

    const caller = db.users.find((u) => u.id === (db.activeUserId || actorId)) || null;
    return this.projectSessionForCaller(session, caller, db);
  }

  // Session & Debate Room Role Allocations (Package 08C1)
  async getSessionRoleAllocations(
    sessionId: string,
    actorId?: string
  ): Promise<Record<string, AllocationState>> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (actorId && effectiveActiveId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }
    const callerId = actorId || effectiveActiveId;
    const actor = callerId ? db.users.find((u) => u.id === callerId) : null;
    const isOwner = actor?.role === 'platform_admin';

    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error(`Session "${sessionId}" not found.`);

    if (!session.roleAllocations) {
      session.roleAllocations = buildSessionRoleAllocations({
        sessionId,
        facilitatorId: session.facilitatorId,
        roster: session.roster,
        customDeclarations: db.userDeclarations,
      });
      if (session.debateData) {
        session.debateData.roleAllocations = session.roleAllocations;
      }
      this.saveDb(db);
    }

    const roleAllocations = session.roleAllocations ?? {};
    const sanitizedMap: Record<string, AllocationState> = {};
    for (const [key, alloc] of Object.entries(roleAllocations)) {
      sanitizedMap[key] = sanitizeAllocationForPublic(alloc, isOwner);
    }
    return sanitizedMap;
  }

  async assignSessionRole(
    sessionId: string,
    userId: string,
    roleName: string,
    actorId?: string
  ): Promise<Session> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error(`Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.`);
    }
    if (actorId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const callerId = effectiveActiveId;
    const actor = db.users.find((u) => u.id === callerId);
    if (!actor) throw new Error(`Actor ${callerId} not found.`);

    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const isAuthorized = callerId === session.facilitatorId || actor.role === 'platform_admin';
    if (!isAuthorized) {
      throw new Error(`Unauthorized: Only Session Facilitator or Platform Owner can assign formal roles.`);
    }

    const targetUser = db.users.find((u) => u.id === userId);
    if (!targetUser) throw new Error(`Target user ${userId} not found.`);

    if (!session.roleAllocations) {
      session.roleAllocations = buildSessionRoleAllocations({
        sessionId,
        facilitatorId: session.facilitatorId,
        roster: session.roster,
        customDeclarations: db.userDeclarations,
      });
    }

    let alloc = session.roleAllocations[roleName];
    if (!alloc) {
      alloc = buildAllocationState({
        allocationId: `alloc_${sessionId}_${roleName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
        allocationType: 'named_roles',
        title: `${roleName} Allocation`,
        totalPlaces: 1,
        confirmedOccupants: [],
        existingStatus: 'pending',
        customDeclarations: db.userDeclarations,
      });
      session.roleAllocations[roleName] = alloc;
    }

    // Shared validator check
    const check = canUserClaimRoleAllocation(
      alloc,
      userId,
      db.userDeclarations,
      actor.role === 'platform_admin'
    );
    if (!check.allowed) {
      throw new Error(check.reason || `Assignment of user ${userId} to role "${roleName}" denied under reservation policy.`);
    }

    const now = new Date().toISOString();

    // Check if target user was already in another formal role in this session
    const existingRosterIdx = session.roster.findIndex((r) => r.userId === userId);
    const previousRole = existingRosterIdx !== -1 ? session.roster[existingRosterIdx].role : undefined;

    if (previousRole && previousRole !== roleName && session.roleAllocations[previousRole]) {
      const priorAlloc = session.roleAllocations[previousRole];
      if (priorAlloc.status === 'finalized_exception' || priorAlloc.isException) {
        db.allocationAudits = db.allocationAudits || [];
        db.allocationAudits.push({
          id: `audit_inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          allocationId: priorAlloc.allocationId,
          action: 'exception_invalidated',
          actorId: callerId,
          actorRole: actor.role,
          actorName: actor.name,
          timestamp: now,
          policyVersion: POLICY_VERSION,
          reason: `Roster changed: User ${userId} vacated role "${previousRole}" to become "${roleName}". Prior Platform Owner exception invalidated.`,
          outcome: 'reverted_to_pending',
          snapshot: {
            totalPlaces: priorAlloc.totalPlaces,
            reservedMinimum: priorAlloc.reservedMinimum,
            status: 'pending',
          },
        });
        priorAlloc.isException = false;
        priorAlloc.exceptionAudit = undefined;
        priorAlloc.status = 'pending';
      }
    }

    // If role already had confirmed occupants and is being reassigned, invalidate prior exception
    if (alloc.confirmedOccupants && alloc.confirmedOccupants.length > 0 && (alloc.status === 'finalized_exception' || alloc.isException)) {
      db.allocationAudits = db.allocationAudits || [];
      db.allocationAudits.push({
        id: `audit_inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        allocationId: alloc.allocationId,
        action: 'exception_invalidated',
        actorId: callerId,
        actorRole: actor.role,
        actorName: actor.name,
        timestamp: now,
        policyVersion: POLICY_VERSION,
        reason: `Roster changed: Occupant of role "${roleName}" changed. Prior Platform Owner exception invalidated.`,
        outcome: 'reverted_to_pending',
        snapshot: {
          totalPlaces: alloc.totalPlaces,
          reservedMinimum: alloc.reservedMinimum,
          status: 'pending',
        },
      });
      alloc.isException = false;
      alloc.exceptionAudit = undefined;
      alloc.status = 'pending';
    }

    // Update roster
    if (existingRosterIdx !== -1) {
      session.roster[existingRosterIdx].role = roleName;
    } else {
      session.roster.push({
        userId,
        name: targetUser.name,
        role: roleName,
        joinedAt: now,
      });
    }

    if (roleName === 'Facilitator') {
      session.facilitatorId = userId;
    }

    // Rebuild allocations
    session.roleAllocations = buildSessionRoleAllocations({
      sessionId,
      facilitatorId: session.facilitatorId,
      roster: session.roster,
      existingAllocations: session.roleAllocations,
      customDeclarations: db.userDeclarations,
    });
    if (session.debateData) {
      session.debateData.roleAllocations = session.roleAllocations;
    }
    session.updatedAt = now;

    this.saveDb(db);
    return this.projectSessionForCaller(session, actor, db);
  }

  async withdrawSessionRole(
    sessionId: string,
    userId: string,
    actorId?: string
  ): Promise<Session> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error(`Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.`);
    }
    if (actorId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const callerId = effectiveActiveId;
    const actor = db.users.find((u) => u.id === callerId);
    if (!actor) throw new Error(`Actor ${callerId} not found.`);

    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const isAuthorized =
      callerId === session.facilitatorId ||
      callerId === userId ||
      actor.role === 'platform_admin';
    if (!isAuthorized) {
      throw new Error(`Unauthorized: Only Facilitator, Platform Owner, or the role occupant can withdraw from a role.`);
    }

    const entry = session.roster.find((r) => r.userId === userId);
    if (!entry) {
      throw new Error(`User ${userId} is not in session roster.`);
    }

    const oldRole = entry.role;
    const openParticipationRoles = new Set(['participant', 'observer', 'open participant', '']);
    if (openParticipationRoles.has(oldRole.toLowerCase())) {
      // User is already an open participant
      return this.projectSessionForCaller(session, actor, db);
    }

    const now = new Date().toISOString();

    // Invalidate prior exception on vacated role
    const priorAlloc = session.roleAllocations?.[oldRole];
    if (priorAlloc && (priorAlloc.status === 'finalized_exception' || priorAlloc.isException)) {
      db.allocationAudits = db.allocationAudits || [];
      db.allocationAudits.push({
        id: `audit_inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        allocationId: priorAlloc.allocationId,
        action: 'exception_invalidated',
        actorId: callerId,
        actorRole: actor.role,
        actorName: actor.name,
        timestamp: now,
        policyVersion: POLICY_VERSION,
        reason: `Roster changed: User ${userId} withdrew from role "${oldRole}". Prior Platform Owner exception invalidated.`,
        outcome: 'reverted_to_pending',
        snapshot: {
          totalPlaces: priorAlloc.totalPlaces,
          reservedMinimum: priorAlloc.reservedMinimum,
          status: 'pending',
        },
      });
      priorAlloc.isException = false;
      priorAlloc.exceptionAudit = undefined;
      priorAlloc.status = 'pending';
    }

    // Demote role to Participant (open participation)
    entry.role = 'Participant';

    // Rebuild allocations
    session.roleAllocations = buildSessionRoleAllocations({
      sessionId,
      facilitatorId: session.facilitatorId,
      roster: session.roster,
      existingAllocations: session.roleAllocations,
      customDeclarations: db.userDeclarations,
    });
    if (session.debateData) {
      session.debateData.roleAllocations = session.roleAllocations;
    }
    session.updatedAt = now;

    this.saveDb(db);
    return this.projectSessionForCaller(session, actor, db);
  }

  async replaceSessionRole(
    sessionId: string,
    currentUserId: string,
    newUserId: string,
    roleName: string,
    actorId?: string
  ): Promise<Session> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error(`Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.`);
    }
    if (actorId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const callerId = effectiveActiveId;
    const actor = db.users.find((u) => u.id === callerId);
    if (!actor) throw new Error(`Actor ${callerId} not found.`);

    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const isAuthorized = callerId === session.facilitatorId || actor.role === 'platform_admin';
    if (!isAuthorized) {
      throw new Error(`Unauthorized: Only Session Facilitator or Platform Owner can replace formal roles.`);
    }

    const currentEntry = session.roster.find((r) => r.userId === currentUserId && r.role === roleName);
    if (!currentEntry) {
      throw new Error(`Current user ${currentUserId} does not hold role "${roleName}".`);
    }

    const newUser = db.users.find((u) => u.id === newUserId);
    if (!newUser) throw new Error(`New user ${newUserId} not found.`);

    if (!session.roleAllocations) {
      session.roleAllocations = buildSessionRoleAllocations({
        sessionId,
        facilitatorId: session.facilitatorId,
        roster: session.roster,
        customDeclarations: db.userDeclarations,
      });
    }

    const currentAlloc = session.roleAllocations[roleName];
    if (!currentAlloc) {
      throw new Error(`Role allocation "${roleName}" not found.`);
    }

    // Evaluate replacement eligibility on allocation with currentUserId removed
    const tempConfirmed = (currentAlloc.confirmedOccupants || []).filter((id) => id !== currentUserId);
    const tempAlloc = buildAllocationState({
      allocationId: currentAlloc.allocationId,
      allocationType: 'named_roles',
      title: currentAlloc.title,
      totalPlaces: currentAlloc.totalPlaces,
      confirmedOccupants: tempConfirmed,
      customDeclarations: db.userDeclarations,
    });

    const check = canUserClaimRoleAllocation(
      tempAlloc,
      newUserId,
      db.userDeclarations,
      actor.role === 'platform_admin'
    );
    if (!check.allowed) {
      throw new Error(check.reason || `Replacement of ${currentUserId} by ${newUserId} for "${roleName}" denied under reservation policy.`);
    }

    const now = new Date().toISOString();

    // If role had an active exception, replacing occupant invalidates it
    if (currentAlloc.status === 'finalized_exception' || currentAlloc.isException) {
      db.allocationAudits = db.allocationAudits || [];
      db.allocationAudits.push({
        id: `audit_inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        allocationId: currentAlloc.allocationId,
        action: 'exception_invalidated',
        actorId: callerId,
        actorRole: actor.role,
        actorName: actor.name,
        timestamp: now,
        policyVersion: POLICY_VERSION,
        reason: `Role occupant replaced: ${currentUserId} replaced by ${newUserId} for role "${roleName}". Prior Platform Owner exception invalidated.`,
        outcome: 'reverted_to_pending',
        snapshot: {
          totalPlaces: currentAlloc.totalPlaces,
          reservedMinimum: currentAlloc.reservedMinimum,
          status: 'pending',
        },
      });
      currentAlloc.isException = false;
      currentAlloc.exceptionAudit = undefined;
      currentAlloc.status = 'pending';
    }

    // Demote current user to Participant
    currentEntry.role = 'Participant';

    // Promote new user
    const newEntryIdx = session.roster.findIndex((r) => r.userId === newUserId);
    if (newEntryIdx !== -1) {
      session.roster[newEntryIdx].role = roleName;
    } else {
      session.roster.push({
        userId: newUserId,
        name: newUser.name,
        role: roleName,
        joinedAt: now,
      });
    }

    if (roleName === 'Facilitator') {
      session.facilitatorId = newUserId;
    }

    // Rebuild allocations
    session.roleAllocations = buildSessionRoleAllocations({
      sessionId,
      facilitatorId: session.facilitatorId,
      roster: session.roster,
      existingAllocations: session.roleAllocations,
      customDeclarations: db.userDeclarations,
    });
    if (session.debateData) {
      session.debateData.roleAllocations = session.roleAllocations;
    }
    session.updatedAt = now;

    this.saveDb(db);
    return this.projectSessionForCaller(session, actor, db);
  }

  async changeSessionRole(
    sessionId: string,
    userId: string,
    newRole: string,
    actorId?: string
  ): Promise<Session> {
    return this.assignSessionRole(sessionId, userId, newRole, actorId);
  }

  async finalizeSessionRoleAllocation(
    sessionId: string,
    roleName: string,
    actorId?: string
  ): Promise<Session> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error(`Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.`);
    }
    if (actorId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const callerId = effectiveActiveId;
    const actor = db.users.find((u) => u.id === callerId);
    if (!actor) throw new Error(`Actor ${callerId} not found.`);

    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const isAuthorized = callerId === session.facilitatorId || actor.role === 'platform_admin';
    if (!isAuthorized) {
      throw new Error(`Unauthorized: Only Session Facilitator or Platform Owner can finalize role allocations.`);
    }

    if (!session.roleAllocations) {
      session.roleAllocations = buildSessionRoleAllocations({
        sessionId,
        facilitatorId: session.facilitatorId,
        roster: session.roster,
        customDeclarations: db.userDeclarations,
      });
    }

    const alloc = session.roleAllocations[roleName];
    if (!alloc) {
      throw new Error(`Role allocation "${roleName}" not found in session ${sessionId}`);
    }

    // Fails without mutating persistent state if noncompliant and no approved exception
    const { updatedAllocation, audit } = finalizeAllocationState(alloc, actor);

    session.roleAllocations[roleName] = updatedAllocation;
    if (session.debateData) {
      session.debateData.roleAllocations = session.roleAllocations;
    }

    // Check if all role allocations in session are finalized
    const allFinalized = Object.values(session.roleAllocations).every(
      (a) => a.status === 'finalized_compliant' || a.status === 'finalized_exception'
    );
    if (allFinalized) {
      session.rolePlanStage = 'finalized';
      if (session.debateData) {
        session.debateData.rolePlanStage = 'finalized';
      }
    }

    session.updatedAt = new Date().toISOString();

    db.allocationAudits = db.allocationAudits || [];
    db.allocationAudits.push(audit);

    this.saveDb(db);
    return this.projectSessionForCaller(session, actor, db);
  }

  async approveSessionRoleException(
    sessionId: string,
    roleName: string,
    reason: string,
    actorId?: string
  ): Promise<{ session: Session; audit: AllocationAuditRecord }> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error(`Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.`);
    }
    if (actorId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const callerId = effectiveActiveId;
    const actor = db.users.find((u) => u.id === callerId);

    // Authority guard: Strictly restricted to platform_admin
    if (!actor || actor.role !== 'platform_admin') {
      if (actor?.role === 'moderator' || this.hasAnyModeratorGrant(callerId, db)) {
        this.recordModeratorAuditSync(
          {
            action: 'grant_denied',
            actorId: callerId,
            actorName: actor?.name || 'Moderator',
            actorRole: actor?.role || 'moderator',
            scopeType: 'named_session',
            targetId: sessionId,
            details: `Blocked 33% reservation exception override attempt for Session role "${roleName}". Scoped moderators cannot bypass the 33% rule.`,
            outcome: 'denied',
            denialReason: 'Rule boundary: Under OD.17 and Change Plan v2 §12, scoped moderators cannot approve 33% reservation exceptions.',
          },
          db
        );
        this.saveDb(db);
      }
      throw new Error(
        `Unauthorized: Only Platform Owner (role: platform_admin) can approve reservation exceptions. ` +
        `Current persona "${callerId}" (role: "${actor?.role || 'unknown'}") cannot approve exceptions.`
      );
    }

    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    if (!session.roleAllocations) {
      session.roleAllocations = buildSessionRoleAllocations({
        sessionId,
        facilitatorId: session.facilitatorId,
        roster: session.roster,
        customDeclarations: db.userDeclarations,
      });
    }

    const alloc = session.roleAllocations[roleName];
    if (!alloc) {
      throw new Error(`Role allocation "${roleName}" not found in session ${sessionId}`);
    }

    const { updatedAllocation, audit } = approveAllocationExceptionState(alloc, actor, reason);

    session.roleAllocations[roleName] = updatedAllocation;
    if (session.debateData) {
      session.debateData.roleAllocations = session.roleAllocations;
    }
    session.updatedAt = new Date().toISOString();

    db.allocationAudits = db.allocationAudits || [];
    db.allocationAudits.push(audit);

    this.saveDb(db);
    return {
      session: this.projectSessionForCaller(session, actor, db),
      audit: this.projectAuditForCaller(audit, actor),
    };
  }

  async updateSessionRoleCapacity(
    sessionId: string,
    roleName: string,
    newTotalPlaces: number,
    actorId?: string
  ): Promise<Session> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error(`Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.`);
    }
    if (actorId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const callerId = effectiveActiveId;
    const actor = db.users.find((u) => u.id === callerId);
    if (!actor) throw new Error(`Actor ${callerId} not found.`);

    const session = db.sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const isAuthorized = callerId === session.facilitatorId || actor.role === 'platform_admin';
    if (!isAuthorized) {
      throw new Error(`Unauthorized: Only Facilitator or Platform Owner can update role allocation capacity.`);
    }

    if (newTotalPlaces < 1) {
      throw new Error('Total places must be at least 1.');
    }

    const now = new Date().toISOString();

    // Check if previous allocation had an approved exception; changing size invalidates it!
    const priorAlloc = session.roleAllocations?.[roleName];
    if (priorAlloc && (priorAlloc.status === 'finalized_exception' || priorAlloc.isException)) {
      db.allocationAudits = db.allocationAudits || [];
      db.allocationAudits.push({
        id: `audit_inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        allocationId: priorAlloc.allocationId,
        action: 'exception_invalidated',
        actorId: callerId,
        actorRole: actor.role,
        actorName: actor.name,
        timestamp: now,
        policyVersion: POLICY_VERSION,
        reason: `Capacity changed from ${priorAlloc.totalPlaces} to ${newTotalPlaces} for role "${roleName}". Prior Platform Owner exception invalidated.`,
        outcome: 'reverted_to_pending',
        snapshot: {
          totalPlaces: newTotalPlaces,
          reservedMinimum: Math.ceil(0.33 * newTotalPlaces),
          status: 'pending',
        },
      });
      priorAlloc.isException = false;
      priorAlloc.exceptionAudit = undefined;
      priorAlloc.status = 'pending';
    }

    // Rebuild allocations with override
    session.roleAllocations = buildSessionRoleAllocations({
      sessionId,
      facilitatorId: session.facilitatorId,
      roster: session.roster,
      existingAllocations: session.roleAllocations,
      customDeclarations: db.userDeclarations,
      plannedPlacesOverrides: { [roleName]: newTotalPlaces },
    });
    if (session.debateData) {
      session.debateData.roleAllocations = session.roleAllocations;
    }
    session.updatedAt = now;

    this.saveDb(db);
    return this.projectSessionForCaller(session, actor, db);
  }

  // Aliases for Debate Room role allocations
  async getDebateRoleAllocations(sessionId: string, actorId?: string): Promise<Record<string, AllocationState>> {
    return this.getSessionRoleAllocations(sessionId, actorId);
  }

  async assignDebateRole(sessionId: string, userId: string, roleName: string, actorId?: string): Promise<Session> {
    return this.assignSessionRole(sessionId, userId, roleName, actorId);
  }

  async withdrawDebateRole(sessionId: string, userId: string, actorId?: string): Promise<Session> {
    return this.withdrawSessionRole(sessionId, userId, actorId);
  }

  async replaceDebateRole(sessionId: string, currentUserId: string, newUserId: string, roleName: string, actorId?: string): Promise<Session> {
    return this.replaceSessionRole(sessionId, currentUserId, newUserId, roleName, actorId);
  }

  async changeDebateRole(sessionId: string, userId: string, newRole: string, actorId?: string): Promise<Session> {
    return this.changeSessionRole(sessionId, userId, newRole, actorId);
  }

  async finalizeDebateRoleAllocation(sessionId: string, roleName: string, actorId?: string): Promise<Session> {
    return this.finalizeSessionRoleAllocation(sessionId, roleName, actorId);
  }

  async updateDebateRoleCapacity(sessionId: string, roleName: string, newTotalPlaces: number, actorId?: string): Promise<Session> {
    return this.updateSessionRoleCapacity(sessionId, roleName, newTotalPlaces, actorId);
  }

  async approveDebateRoleException(
    sessionId: string,
    roleName: string,
    reason: string,
    actorId?: string
  ): Promise<{ session: Session; audit: AllocationAuditRecord }> {
    return this.approveSessionRoleException(sessionId, roleName, reason, actorId);
  }

  async rsvpEvent(
    eventId: string,
    userId: string,
    status: 'attending' | 'maybe' | 'declined' = 'attending',
    actorId?: string
  ): Promise<Event> {
    const db = this.getDb();
    const activeUserId = db.activeUserId;

    // Anti-spoofing guard: Supplied actorId cannot mismatch active persona
    if (actorId && activeUserId && actorId !== activeUserId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${activeUserId}".`
      );
    }

    const callerId = actorId || activeUserId;
    const caller = db.users.find((u) => u.id === callerId);

    // Anti-spoofing guard: A participant cannot RSVP on behalf of another user
    if (activeUserId && userId !== activeUserId) {
      const isAuthorizedStaff =
        caller?.role === 'platform_admin' || caller?.role === 'programme_manager';
      if (!isAuthorizedStaff) {
        throw new Error(
          `Unauthorized RSVP spoof: Active persona "${activeUserId}" cannot RSVP on behalf of user "${userId}". ` +
          `Only authorized platform admins or programme managers can manage other users' reservations.`
        );
      }
    }

    const evt = db.events.find((e) => e.id === eventId);
    if (!evt) throw new Error(`Event ${eventId} not found`);

    const now = new Date().toISOString();
    evt.attendeeUserIds = evt.attendeeUserIds || [];
    evt.rsvpMap = evt.rsvpMap || {};

    if (!evt.allocation) {
      evt.allocation = buildAllocationState({
        allocationId: `alloc_${evt.id}`,
        allocationType: 'event_places',
        title: evt.title,
        totalPlaces: evt.capacity,
        confirmedOccupants: evt.attendeeUserIds,
        existingStatus: 'pending',
      });
    }

    if (status === 'attending') {
      const isOwner = caller?.role === 'platform_admin';
      const rsvpCheck = canUserRsvpAllocation(evt.allocation, userId, undefined, isOwner);
      if (!rsvpCheck.allowed) {
        throw new Error(rsvpCheck.reason || 'RSVP rejected under reservation policy.');
      }
      if (!evt.attendeeUserIds.includes(userId)) {
        evt.attendeeUserIds.push(userId);
      }
      evt.rsvpMap[userId] = 'attending';
    } else {
      evt.attendeeUserIds = evt.attendeeUserIds.filter((id) => id !== userId);
      if (evt.checkedInUserIds) {
        evt.checkedInUserIds = evt.checkedInUserIds.filter((id) => id !== userId);
      }
      evt.rsvpMap[userId] = status;
    }

    // Invalidate existing exception audit on attendee roster change (withdrawal or addition)
    const priorExceptionAudit = evt.allocation.exceptionAudit;

    // Recalculate allocation state with updated confirmed occupants
    evt.allocation = buildAllocationState({
      allocationId: evt.allocation.allocationId,
      allocationType: 'event_places',
      title: evt.title,
      totalPlaces: evt.capacity,
      confirmedOccupants: evt.attendeeUserIds,
      existingStatus: 'pending', // Reverts to pending; prior exception cannot be silently reused!
      existingExceptionAudit: undefined, // Cleared! Obsolete exception invalidated!
    });

    if (priorExceptionAudit) {
      const invalidationAudit: AllocationAuditRecord = {
        id: generateId('audit'),
        allocationId: evt.allocation.allocationId,
        action: 'updated',
        actorId: callerId || 'system',
        actorRole: caller?.role || 'system',
        reason: `Prior exception approval (${priorExceptionAudit.id}) invalidated due to participant roster change. Renewed explicit owner approval required.`,
        policyVersion: POLICY_VERSION,
        outcome: 'Exception invalidated; allocation returned to pending.',
        timestamp: now,
        snapshot: {
          totalPlaces: evt.allocation.totalPlaces,
          reservedMinimum: evt.allocation.reservedMinimum,
          reservedOccupiedCount: evt.allocation.reservedOccupiedCount,
          ordinaryOccupiedCount: evt.allocation.ordinaryOccupiedCount,
          vacanciesCount: evt.allocation.vacanciesCount,
          status: evt.allocation.status,
        },
      };
      db.allocationAudits = db.allocationAudits || [];
      db.allocationAudits.push(invalidationAudit);
    }

    evt.updatedAt = now;
    this.saveDb(db);
    return this.projectEventForCaller(evt, caller);
  }

  async checkInEvent(
    eventId: string,
    userId: string,
    actorId?: string
  ): Promise<{ event: Event; activity?: Activity }> {
    const db = this.getDb();
    const activeUserId = db.activeUserId;

    // Anti-spoofing guard: Supplied actorId cannot mismatch active persona
    if (actorId && activeUserId && actorId !== activeUserId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${activeUserId}".`
      );
    }

    const callerId = actorId || activeUserId;
    const caller = db.users.find((u) => u.id === callerId);

    // Anti-spoofing guard: A caller cannot check in another user unless they are staff/mentor
    if (activeUserId && userId !== activeUserId) {
      const isAuthorizedStaff =
        caller?.role === 'platform_admin' ||
        caller?.role === 'teacher' ||
        caller?.role === 'facilitator' ||
        caller?.role === 'programme_manager';
      if (!isAuthorizedStaff) {
        throw new Error(
          `Unauthorized check-in spoof: Active persona "${activeUserId}" cannot check in user "${userId}". ` +
          `Check-in on behalf of other participants requires teacher, facilitator, or admin authority.`
        );
      }
    }

    const evt = db.events.find((e) => e.id === eventId);
    if (!evt) throw new Error(`Event ${eventId} not found`);

    // Guard: check-in cannot bypass RSVP and allocation controls
    const isConfirmedAttendee =
      evt.attendeeUserIds?.includes(userId) &&
      (evt.rsvpMap?.[userId] === 'attending' || !evt.rsvpMap?.[userId]);

    if (!isConfirmedAttendee) {
      throw new Error(
        `Check-in denied: User "${userId}" does not have a confirmed attending RSVP for event "${eventId}". ` +
        `Check-in cannot bypass RSVP and seat allocation controls.`
      );
    }

    const now = new Date().toISOString();
    evt.checkedInUserIds = evt.checkedInUserIds || [];

    let act: Activity | undefined;
    if (!evt.checkedInUserIds.includes(userId)) {
      evt.checkedInUserIds.push(userId);
      evt.updatedAt = now;

      // Add activity entry
      act = {
        id: generateId('act'),
        userId,
        type: 'assembly_joined',
        title: `Attended Civic Session: ${evt.title}`,
        description: `Verified attendance at ${evt.location}.`,
        referenceId: eventId,
        referenceType: 'event',
        timestamp: now,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      };
      db.activities.push(act);

      this.saveDb(db);
    }

    return {
      event: this.projectEventForCaller(evt, caller),
      activity: act ? JSON.parse(JSON.stringify(act)) : undefined,
    };
  }

  async updateEventCapacity(
    eventId: string,
    newCapacity: number,
    actorId?: string
  ): Promise<Event> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;

    if (!effectiveActiveId) {
      throw new Error(`Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.`);
    }

    if (actorId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const callerId = effectiveActiveId;
    const actor = db.users.find((u) => u.id === callerId);

    if (!actor || (actor.role !== 'platform_admin' && actor.role !== 'programme_manager')) {
      throw new Error(`Unauthorized: Only platform_admin or programme_manager can change event capacity.`);
    }

    const evt = db.events.find((e) => e.id === eventId);
    if (!evt) throw new Error(`Event ${eventId} not found`);

    const now = new Date().toISOString();
    evt.capacity = newCapacity;

    const priorExceptionAudit = evt.allocation?.exceptionAudit;

    // Recalculate allocation state with new capacity; invalidate obsolete exception
    evt.allocation = buildAllocationState({
      allocationId: evt.allocation?.allocationId || `alloc_${evt.id}`,
      allocationType: 'event_places',
      title: evt.title,
      totalPlaces: newCapacity,
      confirmedOccupants: evt.attendeeUserIds || [],
      existingStatus: 'pending',
      existingExceptionAudit: undefined, // Obsolete exception invalidated!
    });

    if (priorExceptionAudit) {
      const invalidationAudit: AllocationAuditRecord = {
        id: generateId('audit'),
        allocationId: evt.allocation.allocationId,
        action: 'updated',
        actorId: callerId,
        actorRole: actor.role,
        reason: `Prior exception approval (${priorExceptionAudit.id}) invalidated due to capacity change to ${newCapacity}. Renewed explicit owner approval required.`,
        policyVersion: POLICY_VERSION,
        outcome: 'Exception invalidated; allocation returned to pending.',
        timestamp: now,
        snapshot: {
          totalPlaces: evt.allocation.totalPlaces,
          reservedMinimum: evt.allocation.reservedMinimum,
          reservedOccupiedCount: evt.allocation.reservedOccupiedCount,
          ordinaryOccupiedCount: evt.allocation.ordinaryOccupiedCount,
          vacanciesCount: evt.allocation.vacanciesCount,
          status: evt.allocation.status,
        },
      };
      db.allocationAudits = db.allocationAudits || [];
      db.allocationAudits.push(invalidationAudit);
    }

    evt.updatedAt = now;
    this.saveDb(db);
    return this.projectEventForCaller(evt, actor);
  }

  async finalizeEventAllocation(eventId: string, actorId?: string): Promise<Event> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;

    if (!effectiveActiveId) {
      throw new Error(`Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.`);
    }

    // Anti-spoofing guard: If actorId is provided, it must match active persona
    if (actorId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const callerId = effectiveActiveId;
    const actor = db.users.find((u) => u.id === callerId) || { id: callerId, role: 'participant' };

    // Authority guard: Only platform_admin or programme_manager can finalize allocations
    const isStaffOrAdmin = actor.role === 'platform_admin' || actor.role === 'programme_manager';
    if (!isStaffOrAdmin) {
      throw new Error(
        `Unauthorized: Finalization requires platform_admin or programme_manager authority. ` +
        `Current persona "${callerId}" (role: "${actor.role}") cannot finalize allocations.`
      );
    }

    const evt = db.events.find((e) => e.id === eventId);
    if (!evt) throw new Error(`Event ${eventId} not found`);

    if (!evt.allocation) {
      evt.allocation = buildAllocationState({
        allocationId: `alloc_${evt.id}`,
        allocationType: 'event_places',
        title: evt.title,
        totalPlaces: evt.capacity,
        confirmedOccupants: evt.attendeeUserIds || [],
        existingStatus: 'pending',
      });
    }

    // Fails without mutating persistent state if noncompliant and no approved exception
    const { updatedAllocation, audit } = finalizeAllocationState(evt.allocation, actor);

    evt.allocation = updatedAllocation;
    evt.updatedAt = new Date().toISOString();

    db.allocationAudits = db.allocationAudits || [];
    db.allocationAudits.push(audit);

    this.saveDb(db);
    return this.projectEventForCaller(evt, actor);
  }

  async approveEventAllocationException(
    eventId: string,
    reason: string,
    actorId?: string
  ): Promise<{ event: Event; audit: AllocationAuditRecord }> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;

    if (!effectiveActiveId) {
      throw new Error(`Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.`);
    }

    // Anti-spoofing guard: If actorId is provided, it must match active persona
    if (actorId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const callerId = effectiveActiveId;
    const actor = db.users.find((u) => u.id === callerId);

    // Authority guard: Strictly restricted to platform_admin
    if (!actor || actor.role !== 'platform_admin') {
      if (actor?.role === 'moderator' || this.hasAnyModeratorGrant(callerId, db)) {
        this.recordModeratorAuditSync(
          {
            action: 'grant_denied',
            actorId: callerId,
            actorName: actor?.name || 'Moderator',
            actorRole: actor?.role || 'moderator',
            scopeType: 'assignments',
            targetId: eventId,
            details: `Blocked 33% reservation exception override attempt for Event "${eventId}". Scoped moderators cannot bypass the 33% rule.`,
            outcome: 'denied',
            denialReason: 'Rule boundary: Under OD.17 and Change Plan v2 §12, scoped moderators cannot approve 33% reservation exceptions.',
          },
          db
        );
        this.saveDb(db);
      }
      throw new Error(
        `Unauthorized: Only Platform Owner (role: platform_admin) can approve reservation exceptions. ` +
        `Current persona "${callerId}" (role: "${actor?.role || 'unknown'}") cannot approve exceptions.`
      );
    }

    const evt = db.events.find((e) => e.id === eventId);
    if (!evt) throw new Error(`Event ${eventId} not found`);

    if (!evt.allocation) {
      evt.allocation = buildAllocationState({
        allocationId: `alloc_${evt.id}`,
        allocationType: 'event_places',
        title: evt.title,
        totalPlaces: evt.capacity,
        confirmedOccupants: evt.attendeeUserIds || [],
        existingStatus: 'pending',
      });
    }

    const { updatedAllocation, audit } = approveAllocationExceptionState(evt.allocation, actor, reason);

    evt.allocation = updatedAllocation;
    evt.updatedAt = new Date().toISOString();

    db.allocationAudits = db.allocationAudits || [];
    db.allocationAudits.push(audit);

    this.saveDb(db);
    return {
      event: this.projectEventForCaller(evt, actor),
      audit: this.projectAuditForCaller(audit, actor),
    };
  }

  async getAllocationAudits(allocationId?: string, actorId?: string): Promise<AllocationAuditRecord[]> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;

    // Cross-persona spoof guard: If actorId is provided, it MUST match the active persona
    if (actorId && effectiveActiveId && actorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" does not match active persona "${effectiveActiveId}".`
      );
    }
    if (actorId && !effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${actorId}" cannot be used without an active persona.`
      );
    }

    // Bind audit reads strictly to the active persona
    const callerId = effectiveActiveId;
    const caller = callerId ? db.users.find((u) => u.id === callerId) : null;

    db.allocationAudits = db.allocationAudits || [];
    let audits = db.allocationAudits;
    if (allocationId) {
      audits = audits.filter((a) => a.allocationId === allocationId);
    }
    const isOwner = caller?.role === 'platform_admin';
    return audits
      .filter((a) => {
        if (isOwner) return true;
        // Suppress exception audit records for ALL non-owner callers to prevent deductive inference
        if (
          a.action === 'exception_approved' ||
          a.snapshot?.status === 'finalized_exception' ||
          a.outcome?.toLowerCase().includes('exception')
        ) {
          return false;
        }
        return true;
      })
      .map((a) => this.projectAuditForCaller(a, caller));
  }

  // Activities
  async getActivities(userId?: string): Promise<Activity[]> {
    const db = this.getDb();
    const activeUserId = db.activeUserId;
    let acts = db.activities;
    if (userId) {
      acts = acts.filter((a) => a.userId === userId);
    }
    acts = acts.filter((a) => {
      if (this.isUhvReflectionActivity(a, db)) return false;
      if (a.userId !== activeUserId && this.isUhvActivity(a, db)) return false;
      if (a.referenceType === 'session_reflection' && a.userId !== activeUserId) return false;
      return true;
    });
    acts = acts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return JSON.parse(JSON.stringify(acts));
  }

  async addActivity(
    activityInput: Omit<Activity, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>
  ): Promise<Activity> {
    const db = this.getDb();
    const now = new Date().toISOString();
    const newAct: Activity = {
      ...activityInput,
      id: generateId('act'),
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    db.activities.push(newAct);
    this.saveDb(db);
    return JSON.parse(JSON.stringify(newAct));
  }

  // Reflections
  async getReflections(userId?: string): Promise<Reflection[]> {
    const db = this.getDb();
    const activeUserId = db.activeUserId;
    const refls = db.reflections.filter((r) => {
      if (userId && r.userId !== userId) return false;
      // In this single-browser simulation, private UHV and session reflections are visible only when the active demo persona is their owner
      if (this.isUhvReflectionRecord(r, db) || r.contextType === 'session') {
        return r.userId === activeUserId;
      }
      return true;
    });
    return JSON.parse(JSON.stringify(refls));
  }

  async getCivicReflections(userId?: string): Promise<Reflection[]> {
    const db = this.getDb();
    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    const isOwner = !userId || db.activeUserId === userId;
    const isStaff =
      activeUser?.role === 'teacher' ||
      activeUser?.role === 'facilitator' ||
      activeUser?.role === 'institution_admin' ||
      activeUser?.role === 'programme_manager' ||
      activeUser?.role === 'platform_admin';

    let refls = db.reflections.filter((r) => {
      if (userId && r.userId !== userId) return false;
      if (this.isUhvReflectionRecord(r, db)) return false;
      // In this single-browser simulation, debate session reflections are private deliberation journals
      // and are excluded from verified credential-facing civic reflections
      if (r.contextType === 'session') return false;
      return true;
    });

    if (!isOwner && !isStaff) {
      refls = refls.filter((r) => r.isPublicInPassport);
    }

    return JSON.parse(JSON.stringify(refls));
  }

  async getUhvReflections(userId?: string): Promise<Reflection[]> {
    const db = this.getDb();
    const activeUserId = db.activeUserId;
    const refls = db.reflections.filter((r) => {
      if (userId && r.userId !== userId) return false;
      if (!this.isUhvReflectionRecord(r, db)) return false;
      return r.userId === activeUserId;
    });
    return JSON.parse(JSON.stringify(refls));
  }

  async getReflection(id: string): Promise<Reflection | null> {
    const db = this.getDb();
    const refl = db.reflections.find((r) => r.id === id);
    if (!refl) return null;
    if ((this.isUhvReflectionRecord(refl, db) || refl.contextType === 'session') && refl.userId !== db.activeUserId) {
      return null;
    }
    return JSON.parse(JSON.stringify(refl));
  }

  async getSessionReflections(sessionId: string, userId?: string): Promise<Reflection[]> {
    const db = this.getDb();
    const activeUserId = db.activeUserId;
    const targetUserId = userId || activeUserId;
    const refls = db.reflections.filter((r) => {
      if (r.contextType !== 'session' || r.contextId !== sessionId) return false;
      // In this single-browser simulation, private session reflections are visible only when the active persona is their author
      if (r.userId !== targetUserId || r.userId !== activeUserId) return false;
      return true;
    });
    return JSON.parse(JSON.stringify(refls));
  }

  async addReflection(
    reflection: Omit<Reflection, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>
  ): Promise<Reflection> {
    const db = this.getDb();
    const now = new Date().toISOString();
    const isUhv = this.isUhvContext(reflection.contextType, reflection.contextId, db);

    // If session context: validate active persona, linked session, and session roster; private by default, no credit
    if (reflection.contextType === 'session') {
      const activeUserId = db.activeUserId;
      if (reflection.userId !== activeUserId) {
        throw new Error(`Unauthorized: can only save reflection as the currently active persona (${activeUserId})`);
      }
      const session = db.sessions.find((s) => s.id === reflection.contextId);
      if (!session) {
        throw new Error(`Session ${reflection.contextId} not found`);
      }
      const isInRoster = session.roster.some((r) => r.userId === reflection.userId);
      if (!isInRoster) {
        throw new Error(`User ${reflection.userId} is not in session ${session.id} roster`);
      }

      const newRefl: Reflection = {
        ...reflection,
        isPublicInPassport: false, // Private by default in this single-browser simulation
        id: generateId('refl'),
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      };
      db.reflections.push(newRefl);

      // Record activity with generic summary to avoid publishing private reflection text
      db.activities.push({
        id: generateId('act'),
        userId: reflection.userId,
        type: 'reflection_shared',
        title: 'Completed Debate Session Self-Reflection',
        description: 'Personal deliberation self-reflection recorded in private session log.',
        referenceId: newRefl.id,
        referenceType: 'session_reflection',
        timestamp: now,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      });

      this.saveDb(db);
      return JSON.parse(JSON.stringify(newRefl));
    }

    const newRefl: Reflection = {
      ...reflection,
      isPublicInPassport: isUhv ? false : (reflection.isPublicInPassport ?? true),
      id: generateId('refl'),
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    db.reflections.push(newRefl);

    // If UHV context: record privately with NO civic credits, NO passport entry, NO public activity text, and NO teacher notifications
    if (isUhv) {
      this.saveDb(db);
      return JSON.parse(JSON.stringify(newRefl));
    }

    // Civic Reflection path (Assembly, project, civic courses): preserves existing behavior
    // Credit transaction (+1 Reflection)
    db.credits.push({
      id: generateId('tx'),
      userId: reflection.userId,
      dimension: 'Reflection',
      amount: 1,
      sourceType: 'reflection',
      sourceId: newRefl.id,
      status: 'Verified',
      reason: `Civic reflection: ${reflection.prompt.slice(0, 50)}`,
      createdAt: now,
      schemaVersion: 1,
    });

    const user = db.users.find((u) => u.id === reflection.userId);
    if (user) {
      user.totalCredits = this.calculateUserCredits(db, reflection.userId);
      user.updatedAt = now;
    }

    // Activity
    db.activities.push({
      id: generateId('act'),
      userId: reflection.userId,
      type: 'reflection_shared',
      title: 'Completed Civic & Ethical Reflection',
      description: reflection.text.slice(0, 90),
      referenceId: newRefl.id,
      referenceType: 'reflection',
      timestamp: now,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Passport Entry
    db.passportEntries.push({
      id: generateId('pass'),
      userId: reflection.userId,
      category: 'reflection',
      title: `Civic Reflection: ${reflection.prompt.slice(0, 45)}`,
      subtitle:
        reflection.valuesHighlighted.length > 0
          ? `Values: ${reflection.valuesHighlighted.join(', ')}`
          : 'Deliberation & Civic Ethics Reflection',
      date: now.split('T')[0],
      creditsAwarded: 1,
      evidenceIds: [],
      sourceReferenceId: newRefl.id,
      sourceReferenceType: 'reflection',
      sourceRoute: '/passport',
      verificationState: 'system_recorded',
      reviewState: 'accepted',
      calculationExplanation: 'Base rule: 1 Reflection credit per shared civic reflection (System recorded)',
      isVerified: true,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    });

    // Notification
    db.notifications.push({
      id: generateId('notif'),
      userId: reflection.userId,
      title: 'Reflection Recorded',
      message: 'You shared a reflection and earned 1 Reflection Credit in your Passport.',
      type: 'credit',
      isRead: false,
      targetRoute: '/passport',
      createdAt: now,
      schemaVersion: 1,
    });

    this.saveDb(db);
    return JSON.parse(JSON.stringify(newRefl));
  }

  // Passport & Credits
  async getPassport(userId: string): Promise<PassportView> {
    const db = this.getDb();
    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    const actor = activeUser ? { id: activeUser.id, role: activeUser.role } : null;
    const isOwner = db.activeUserId === userId;
    const isStaff =
      activeUser?.role === 'teacher' ||
      activeUser?.role === 'facilitator' ||
      activeUser?.role === 'institution_admin' ||
      activeUser?.role === 'programme_manager' ||
      activeUser?.role === 'platform_admin';

    const targetUser = db.users.find((u) => u.id === userId);
    if (!targetUser) {
      throw new Error(`User ${userId} not found`);
    }
    if (!isOwner && !isStaff) {
      throw new Error('Unauthorized: cannot access Civic Passport of another persona');
    }
    let entries = db.passportEntries.filter((p) => {
      if (p.userId !== userId) return false;
      if (this.isUhvPassportEntry(p, db)) return false;
      if (p.sourceReferenceType === 'reflection') {
        const refl = db.reflections.find((r) => r.id === p.sourceReferenceId);
        if (refl && refl.contextType === 'session') return false; // Private session journal omitted
        if (refl && !refl.isPublicInPassport && !isOwner && !isStaff) return false;
      }
      return true;
    });

    // Persona-scoping: exclude private visibility items when viewed by another participant
    if (!isOwner && !isStaff) {
      entries = entries.filter((p) => p.visibility !== 'private');
    }

    // Ensure sourceRoute and verificationState are populated
    entries = entries.map((p) => {
      const clone = { ...p };
      if (!clone.sourceRoute) {
        clone.sourceRoute = this.getPassportSourceRoute(clone);
      }
      if (!clone.verificationState) {
        clone.verificationState = clone.isVerified ? 'system_recorded' : 'self_reported';
      }
      return clone;
    });

    const credits = db.credits.filter((c) => {
      if (c.userId !== userId) return false;
      if (this.isUhvCredit(c, db)) return false;
      return true;
    });
    const verifiedCredits = credits.filter((c) => c.status === 'Verified' || c.status === 'Audited');
    const pendingCredits = credits.filter((c) => c.status === 'Pending');
    const totalCredits = verifiedCredits.reduce((sum, c) => sum + c.amount, 0);
    const pendingCreditsTotal = pendingCredits.reduce((sum, c) => sum + c.amount, 0);

    const creditsByDimension: Record<CreditDimension, number> = {
      Learning: 0,
      Observation: 0,
      Deliberation: 0,
      Reflection: 0,
      Contribution: 0,
      Collaboration: 0,
      'Civic Action': 0,
    };
    verifiedCredits.forEach((c) => {
      if (creditsByDimension[c.dimension] !== undefined) {
        creditsByDimension[c.dimension] += c.amount;
      }
    });

    let verifiedEvidence = db.evidence.filter(
      (e) => e.ownerId === userId && e.verificationStatus === 'verified'
    );
    if (!isOwner && !isStaff) {
      verifiedEvidence = verifiedEvidence.filter((e) => e.visibility !== 'private');
    }
    const clonedVerified: Evidence[] = JSON.parse(JSON.stringify(verifiedEvidence));
    for (const item of clonedVerified) {
      if (!canActorAccessPrivateEvidence(actor, item, db.submissions)) {
        if (item.fileInfo?.dataUrl) {
          delete item.fileInfo.dataUrl;
        }
        if (item.fileInfo?.blobKey) {
          delete item.fileInfo.blobKey;
        }
      }
    }

    const completedCourses = db.enrolments.filter((e) => {
      if (e.userId !== userId || e.status !== 'completed') return false;
      const course = db.courses.find((c) => c.id === e.courseId);
      return course?.track !== 'uhv';
    });
    const assemblies = db.assemblies.filter((a) => a.participantUserIds.includes(userId));

    return {
      user: JSON.parse(JSON.stringify(targetUser)),
      entries: JSON.parse(JSON.stringify(entries)),
      credits: JSON.parse(JSON.stringify(credits)),
      totalCredits,
      pendingCredits: pendingCreditsTotal,
      creditsByDimension,
      verifiedEvidence: clonedVerified,
      completedCoursesCount: completedCourses.length,
      assembliesParticipatedCount: assemblies.length,
    };
  }

  async getCredits(userId: string): Promise<CreditTransaction[]> {
    const db = this.getDb();
    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    const isOwner = db.activeUserId === userId;
    const isStaff =
      activeUser?.role === 'teacher' ||
      activeUser?.role === 'facilitator' ||
      activeUser?.role === 'institution_admin' ||
      activeUser?.role === 'programme_manager' ||
      activeUser?.role === 'platform_admin';
    if (!isOwner && !isStaff) {
      throw new Error('Unauthorized: cannot access credit ledger of another persona');
    }
    const credits = db.credits.filter((c) => {
      if (c.userId !== userId) return false;
      if (this.isUhvCredit(c, db)) return false;
      return true;
    }).map((c) => {
      const clone = { ...c };
      if (!clone.sourceRoute) {
        clone.sourceRoute = this.getPassportSourceRoute({
          sourceReferenceType: clone.sourceType,
          sourceReferenceId: clone.sourceId,
        });
      }
      return clone;
    });
    return JSON.parse(JSON.stringify(credits));
  }

  async requestCreditAppeal(params: {
    userId: string;
    targetType: 'credit' | 'submission' | 'passport';
    targetId: string;
    reason: string;
  }): Promise<CreditAppeal> {
    const db = this.getDb();
    const callerId = db.activeUserId;
    if (callerId !== params.userId) {
      const activeUser = db.users.find((u) => u.id === callerId);
      const isStaff =
        activeUser?.role === 'teacher' ||
        activeUser?.role === 'facilitator' ||
        activeUser?.role === 'institution_admin' ||
        activeUser?.role === 'platform_admin';
      if (!isStaff) {
        throw new Error('Unauthorized: cannot submit credit appeal on behalf of another participant');
      }
    }

    const user = db.users.find((u) => u.id === params.userId);
    if (!user) throw new Error(`User ${params.userId} not found`);

    const trimmedReason = params.reason.trim();
    if (trimmedReason.length < 5) {
      throw new Error('Appeal reason must provide substantive details (at least 5 characters).');
    }

    // 1. Validate target existence and ownership for credit, submission, and passport targets
    let targetCredit: CreditTransaction | undefined;
    let targetSubmission: Submission | undefined;
    let targetPassportEntry: PassportEntry | undefined;

    if (params.targetType === 'credit') {
      const credit = db.credits.find((c) => c.id === params.targetId);
      if (!credit) {
        throw new Error(`Target credit transaction '${params.targetId}' not found`);
      }
      if (credit.userId !== params.userId) {
        throw new Error('Unauthorized: cannot appeal a credit transaction owned by another persona');
      }
      targetCredit = credit;
    } else if (params.targetType === 'submission') {
      const sub = db.submissions.find((s) => s.id === params.targetId);
      if (!sub) {
        throw new Error(`Target submission '${params.targetId}' not found`);
      }
      if (sub.userId !== params.userId) {
        throw new Error('Unauthorized: cannot appeal a submission owned by another persona');
      }
      targetSubmission = sub;
    } else if (params.targetType === 'passport') {
      const passEntry = db.passportEntries.find(
        (p) => p.id === params.targetId || p.sourceReferenceId === params.targetId
      );
      if (!passEntry) {
        throw new Error(`Target passport entry '${params.targetId}' not found`);
      }
      if (passEntry.userId !== params.userId) {
        throw new Error('Unauthorized: cannot appeal a passport entry owned by another persona');
      }
      targetPassportEntry = passEntry;
    } else {
      throw new Error(`Unsupported appeal target type: ${params.targetType}`);
    }

    const now = new Date().toISOString();
    const newAppeal: CreditAppeal = {
      id: generateId('appeal'),
      userId: params.userId,
      userName: user.name,
      targetType: params.targetType,
      targetId: params.targetId,
      reason: trimmedReason,
      status: 'pending_human_review',
      assignedReviewerName: 'Kavita Rao (Lead Mentor & Civic Reviewer - Simulation)',
      aiDisclaimer: 'PRD §14 & §27 Safety Invariant: AI is strictly barred from deciding credit appeals or sanctions. A fictional human mentor reviews this inquiry.',
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };

    db.creditAppeals = db.creditAppeals || [];
    db.creditAppeals.push(newAppeal);

    if (params.targetType === 'credit' && targetCredit) {
      targetCredit.auditTrail = targetCredit.auditTrail || [];
      targetCredit.auditTrail.push({
        date: now,
        action: 'APPEAL_REQUESTED',
        actorId: params.userId,
        actorName: user.name,
        note: trimmedReason,
      });
    } else if (params.targetType === 'passport' && targetPassportEntry) {
      targetPassportEntry.revisionHistory = targetPassportEntry.revisionHistory || [];
      targetPassportEntry.revisionHistory.push({
        date: now,
        action: 'APPEAL_REQUESTED',
        actorId: params.userId,
        actorName: user.name,
        note: trimmedReason,
      });
    } else if (params.targetType === 'submission' && targetSubmission) {
      const passEntry = db.passportEntries.find(
        (p) =>
          p.userId === params.userId &&
          (p.sourceReferenceId === targetSubmission!.id || p.sourceReferenceId === targetSubmission!.assignmentId)
      );
      if (passEntry) {
        passEntry.revisionHistory = passEntry.revisionHistory || [];
        passEntry.revisionHistory.push({
          date: now,
          action: 'APPEAL_REQUESTED',
          actorId: params.userId,
          actorName: user.name,
          note: trimmedReason,
        });
      }
    }

    this.saveDb(db);
    return JSON.parse(JSON.stringify(newAppeal));
  }

  async getCreditAppeals(userId?: string): Promise<CreditAppeal[]> {
    const db = this.getDb();
    const targetUserId = userId || db.activeUserId;
    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    const isOwner = db.activeUserId === targetUserId;
    const isStaff =
      activeUser?.role === 'teacher' ||
      activeUser?.role === 'facilitator' ||
      activeUser?.role === 'institution_admin' ||
      activeUser?.role === 'programme_manager' ||
      activeUser?.role === 'platform_admin';
    if (!isOwner && !isStaff) {
      throw new Error('Unauthorized: cannot access credit appeals of another persona');
    }
    const appeals = (db.creditAppeals || []).filter((a) => a.userId === targetUserId);
    return JSON.parse(JSON.stringify(appeals));
  }

  async addCredit(
    transaction: Omit<CreditTransaction, 'id' | 'schemaVersion' | 'createdAt'>
  ): Promise<CreditTransaction> {
    const db = this.getDb();
    if (this.isUhvCreditSource(transaction.sourceType, transaction.sourceId, db)) {
      throw new Error('Civic credits cannot be awarded for Universal Human Values reflections or study modules.');
    }
    const now = new Date().toISOString();
    const newTx: CreditTransaction = {
      ...transaction,
      id: generateId('tx'),
      createdAt: now,
      schemaVersion: 1,
    };
    db.credits.push(newTx);

    const user = db.users.find((u) => u.id === transaction.userId);
    if (user) {
      user.totalCredits = this.calculateUserCredits(db, transaction.userId);
      user.updatedAt = now;
    }

    this.saveDb(db);
    return JSON.parse(JSON.stringify(newTx));
  }

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    const db = this.getDb();
    const notifs = db.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return JSON.parse(JSON.stringify(notifs));
  }

  async markNotificationRead(notificationId: string): Promise<void> {
    const db = this.getDb();
    const notif = db.notifications.find((n) => n.id === notificationId);
    if (notif) {
      notif.isRead = true;
      this.saveDb(db);
    }
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    const db = this.getDb();
    db.notifications.forEach((n) => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
    this.saveDb(db);
  }

  // Community
  async getCommunityGroups(): Promise<CommunityGroup[]> {
    const db = this.getDb();
    return JSON.parse(JSON.stringify(db.communityGroups));
  }

  async getCommunityGroup(groupId: string): Promise<CommunityGroup | null> {
    const db = this.getDb();
    const grp = db.communityGroups.find((g) => g.id === groupId);
    return grp ? JSON.parse(JSON.stringify(grp)) : null;
  }

  async joinCommunityGroup(groupId: string, userId: string): Promise<CommunityGroup> {
    const db = this.getDb();
    const grp = db.communityGroups.find((g) => g.id === groupId);
    if (!grp) throw new Error(`Community group ${groupId} not found`);

    if (!grp.memberUserIds.includes(userId)) {
      grp.memberUserIds.push(userId);
      grp.updatedAt = new Date().toISOString();
      this.saveDb(db);
    }
    return JSON.parse(JSON.stringify(grp));
  }

  async leaveCommunityGroup(groupId: string, userId: string): Promise<CommunityGroup> {
    const db = this.getDb();
    const grp = db.communityGroups.find((g) => g.id === groupId);
    if (!grp) throw new Error(`Community group ${groupId} not found`);

    grp.memberUserIds = grp.memberUserIds.filter((id) => id !== userId);
    grp.updatedAt = new Date().toISOString();
    this.saveDb(db);
    return JSON.parse(JSON.stringify(grp));
  }

  async getCommunityPosts(groupId: string): Promise<CommunityPost[]> {
    const db = this.getDb();
    const posts = db.communityPosts
      .filter((p) => p.groupId === groupId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return JSON.parse(JSON.stringify(posts));
  }

  async addCommunityPost(post: {
    groupId: string;
    authorId: string;
    title: string;
    content: string;
    tags: string[];
  }): Promise<CommunityPost> {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === post.authorId);
    const now = new Date().toISOString();

    const newPost: CommunityPost = {
      id: generateId('post'),
      groupId: post.groupId,
      authorId: post.authorId,
      authorName: user?.name || 'Community Member',
      authorRole: user?.role || 'participant',
      title: post.title,
      content: post.content,
      tags: post.tags,
      likesCount: 0,
      likedByUserIds: [],
      replies: [],
      isPinned: false,
      schemaVersion: 1,
      createdAt: now,
    };
    db.communityPosts.push(newPost);

    const grp = db.communityGroups.find((g) => g.id === post.groupId);
    if (grp) {
      grp.postCount += 1;
      grp.updatedAt = now;
    }

    this.saveDb(db);
    return JSON.parse(JSON.stringify(newPost));
  }

  async addCommunityReply(postId: string, authorId: string, text: string): Promise<CommunityPost> {
    const db = this.getDb();
    const post = db.communityPosts.find((p) => p.id === postId);
    if (!post) throw new Error(`Post ${postId} not found`);

    const user = db.users.find((u) => u.id === authorId);
    const now = new Date().toISOString();

    post.replies.push({
      id: generateId('rep'),
      authorId,
      authorName: user?.name || 'Peer Member',
      text,
      createdAt: now,
    });

    this.saveDb(db);
    return JSON.parse(JSON.stringify(post));
  }

  async likeCommunityPost(postId: string, userId: string): Promise<CommunityPost> {
    const db = this.getDb();
    const post = db.communityPosts.find((p) => p.id === postId);
    if (!post) throw new Error(`Post ${postId} not found`);

    post.likedByUserIds = post.likedByUserIds || [];
    if (!post.likedByUserIds.includes(userId)) {
      post.likedByUserIds.push(userId);
      post.likesCount += 1;
    } else {
      post.likedByUserIds = post.likedByUserIds.filter((id) => id !== userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    }

    this.saveDb(db);
    return JSON.parse(JSON.stringify(post));
  }

  // Civic Issues Map
  async getCivicIssues(): Promise<CivicIssue[]> {
    const db = this.getDb();
    return JSON.parse(JSON.stringify(db.civicIssues || []));
  }

  async getCivicIssue(issueId: string): Promise<CivicIssue | null> {
    const db = this.getDb();
    const iss = (db.civicIssues || []).find((i) => i.id === issueId);
    return iss ? JSON.parse(JSON.stringify(iss)) : null;
  }

  async upvoteCivicIssue(issueId: string, userId: string): Promise<CivicIssue> {
    const db = this.getDb();
    db.civicIssues = db.civicIssues || [];
    const iss = db.civicIssues.find((i) => i.id === issueId);
    if (!iss) throw new Error(`Civic issue ${issueId} not found`);

    iss.upvotedByUserIds = iss.upvotedByUserIds || [];
    if (!iss.upvotedByUserIds.includes(userId)) {
      iss.upvotedByUserIds.push(userId);
      iss.reportsCount += 1;
    } else {
      iss.upvotedByUserIds = iss.upvotedByUserIds.filter((id) => id !== userId);
      iss.reportsCount = Math.max(1, iss.reportsCount - 1);
    }
    iss.updatedAt = new Date().toISOString();

    this.saveDb(db);
    return JSON.parse(JSON.stringify(iss));
  }

  async reportCivicIssue(
    issueInput: Omit<CivicIssue, 'id' | 'reportsCount' | 'schemaVersion' | 'createdAt' | 'updatedAt'>
  ): Promise<CivicIssue> {
    const db = this.getDb();
    db.civicIssues = db.civicIssues || [];
    const now = new Date().toISOString();

    const newIssue: CivicIssue = {
      ...issueInput,
      id: generateId('iss'),
      reportsCount: 1,
      upvotedByUserIds: issueInput.upvotedByUserIds || [],
      evidenceIds: issueInput.evidenceIds || [],
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    db.civicIssues.push(newIssue);
    this.saveDb(db);
    return JSON.parse(JSON.stringify(newIssue));
  }

  // Moderation
  async getModerationCases(): Promise<ModerationCase[]> {
    const db = this.getDb();
    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    if (!activeUser) return [];

    const actor = { id: activeUser.id, role: activeUser.role };
    const allCases: ModerationCase[] = db.moderationCases || [];

    // Return only admin/staff-authorized cases or the active reporter's own cases
    const visibleCases = allCases.filter((c) => canActorViewModerationCase(actor, c));
    const cases: ModerationCase[] = JSON.parse(JSON.stringify(visibleCases));

    // Avoid leaking private target details in moderation records visible to unauthorized personas
    for (const c of cases) {
      if (c.targetType === 'evidence') {
        const ev = db.evidence.find((e) => e.id === c.targetId);
        if (
          ev &&
          ev.visibility === 'private' &&
          !canActorAccessPrivateEvidence(actor, ev, db.submissions) &&
          c.reporterId !== db.activeUserId
        ) {
          c.notes = 'Protected private evidence under review.';
        }
      } else if (c.targetType === 'contribution') {
        const sub = db.submissions.find((s) => s.id === c.targetId);
        if (sub) {
          const canAccessSub =
            sub.userId === db.activeUserId ||
            sub.reviewerId === db.activeUserId ||
            actor?.role === 'programme_manager' ||
            actor?.role === 'platform_admin' ||
            c.reporterId === db.activeUserId;
          if (!canAccessSub) {
            c.notes = 'Protected submission under review.';
          }
        }
      }
    }

    return cases;
  }

  async updateModerationCase(caseId: string, update: Partial<ModerationCase>): Promise<ModerationCase> {
    const db = this.getDb();
    const c = (db.moderationCases || []).find((m) => m.id === caseId);
    if (!c) throw new Error(`Moderation case ${caseId} not found`);

    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    if (!activeUser) {
      throw new Error('Unauthorized: authentication required to update moderation cases.');
    }

    const actor = { id: activeUser.id, role: activeUser.role };
    const isAdmin = activeUser.role === 'platform_admin' || activeUser.role === 'programme_manager';

    // Remove self-assignment path: only programme_manager/platform_admin or an already assigned
    // authorised reviewer (per stored case record c) can update status/notes
    if (!canActorUpdateModerationCase(actor, c)) {
      throw new Error('Unauthorized: only moderation reviewers or administrators may update moderation cases.');
    }

    // Only platform_admin or programme_manager can grant / assign reviewerId
    if (!isAdmin && update.reviewerId !== undefined && update.reviewerId !== c.reviewerId) {
      throw new Error('Unauthorized: only administrators may assign or reassign case reviewers.');
    }

    // No arbitrary Partial<ModerationCase> field update should let callers change protected identity, target, or reporter data
    if (update.id !== undefined && update.id !== c.id) {
      throw new Error('Cannot modify protected moderation case field: id.');
    }
    if (update.targetType !== undefined && update.targetType !== c.targetType) {
      throw new Error('Cannot modify protected moderation case field: targetType.');
    }
    if (update.targetId !== undefined && update.targetId !== c.targetId) {
      throw new Error('Cannot modify protected moderation case field: targetId.');
    }
    if (update.reporterId !== undefined && update.reporterId !== c.reporterId) {
      throw new Error('Cannot modify protected moderation case field: reporterId.');
    }
    if (update.reason !== undefined && update.reason !== c.reason) {
      throw new Error('Cannot modify protected moderation case field: reason.');
    }
    if (update.createdAt !== undefined && update.createdAt !== c.createdAt) {
      throw new Error('Cannot modify protected moderation case field: createdAt.');
    }
    if (update.schemaVersion !== undefined && update.schemaVersion !== c.schemaVersion) {
      throw new Error('Cannot modify protected moderation case field: schemaVersion.');
    }

    // Apply allowed fields only
    if (update.status !== undefined) {
      c.status = update.status;
    }
    if (update.notes !== undefined) {
      c.notes = update.notes;
    }
    if (update.resolutionDetails !== undefined) {
      c.resolutionDetails = update.resolutionDetails;
    }
    if (isAdmin && update.reviewerId !== undefined) {
      c.reviewerId = update.reviewerId;
    }
    if (isAdmin && update.severity !== undefined) {
      c.severity = update.severity;
    }

    c.updatedAt = new Date().toISOString();
    this.saveDb(db);
    return JSON.parse(JSON.stringify(c));
  }

  async assignModerationCaseReviewer(caseId: string, reviewerId: string): Promise<ModerationCase> {
    const db = this.getDb();
    const c = (db.moderationCases || []).find((m) => m.id === caseId);
    if (!c) throw new Error(`Moderation case ${caseId} not found`);

    const activeUser = db.users.find((u) => u.id === db.activeUserId);
    const isAdmin =
      activeUser?.role === 'platform_admin' ||
      activeUser?.role === 'programme_manager';

    if (!isAdmin) {
      throw new Error('Unauthorized: only administrators may assign or reassign case reviewers.');
    }

    c.reviewerId = reviewerId;
    c.updatedAt = new Date().toISOString();
    this.saveDb(db);
    return JSON.parse(JSON.stringify(c));
  }

  // ==========================================
  // Workspace Collaboration (Master PRD §A12, §A13, §A20.4, §A21)
  // ==========================================

  private toSafeWorkspaceInvitationSummary(ws: Workspace): Workspace {
    return {
      id: ws.id,
      title: ws.title,
      purpose: ws.purpose,
      type: ws.type,
      visibility: ws.visibility,
      state: ws.state,
      rulebook: ws.rulebook,
      moderationContact: ws.moderationContact,
      linkedPropositionId: ws.linkedPropositionId,
      linkedAssemblyId: ws.linkedAssemblyId,
      schemaVersion: ws.schemaVersion,
      createdAt: ws.createdAt,
      updatedAt: ws.updatedAt,
      ownerId: ws.ownerId,
      ownerName: ws.ownerName,
      moderatorIds: [], // redacted for privacy
      allowedParticipantCategories: ws.allowedParticipantCategories,
      storageQuotaBytes: ws.storageQuotaBytes,
      usedStorageBytes: ws.usedStorageBytes,
      institutionId: ws.institutionId,
      institutionName: ws.institutionName,
    };
  }

  async getWorkspaces(userId?: string): Promise<Workspace[]> {
    const db = this.getDb();
    const workspaces = db.workspaces || [];
    const memberships = db.workspaceMemberships || [];

    if (!userId) {
      return JSON.parse(JSON.stringify(workspaces.filter((w) => w.visibility !== 'private')));
    }

    const user = db.users.find((u) => u.id === userId);

    const filtered = workspaces.filter((ws) => {
      // Active or invited member
      const member = memberships.find(
        (m) => m.workspaceId === ws.id && m.userId === userId && m.state !== 'removed' && m.state !== 'left'
      );
      if (member) return true;
      if (ws.ownerId === userId || (ws.moderatorIds || []).includes(userId)) return true;

      // Scoped discoverability:
      // Private workspaces are completely hidden from non-members
      if (ws.visibility === 'private') return false;

      // Institution scoped: visible only if user belongs to same institution
      if (ws.visibility === 'institution_scoped') {
        return !!user && !!ws.institutionId && user.institutionId === ws.institutionId;
      }

      // Public discoverable
      return ws.visibility === 'public_discoverable';
    });

    const result = filtered.map((ws) => {
      const isOwnerOrMod = ws.ownerId === userId || (ws.moderatorIds || []).includes(userId);
      const member = memberships.find(
        (m) => m.workspaceId === ws.id && m.userId === userId
      );

      if (ws.visibility === 'private' && !isOwnerOrMod && member?.state === 'invited') {
        return this.toSafeWorkspaceInvitationSummary(ws);
      }

      return ws;
    });

    return JSON.parse(JSON.stringify(result));
  }

  async getWorkspace(workspaceId: string, callerUserId?: string): Promise<Workspace | null> {
    const db = this.getDb();
    const ws = (db.workspaces || []).find((w) => w.id === workspaceId);
    if (!ws) return null;

    if (ws.visibility === 'private') {
      if (!callerUserId) {
        throw new Error(`Unauthorized: Caller identity is required to access private workspace "${ws.title}".`);
      }

      const isOwnerOrMod = ws.ownerId === callerUserId || (ws.moderatorIds || []).includes(callerUserId);
      const membership = (db.workspaceMemberships || []).find(
        (m) => m.workspaceId === workspaceId && m.userId === callerUserId
      );

      if (!isOwnerOrMod && !membership) {
        throw new Error(`Unauthorized: Workspace "${ws.title}" is invite-only private and cannot be accessed without an invitation.`);
      }

      if (!isOwnerOrMod && membership?.state === 'removed') {
        throw new Error(`Unauthorized: You have been removed from this workspace (${membership.statusReason || 'moderator action'}).`);
      }

      if (!isOwnerOrMod && membership?.state === 'left') {
        throw new Error(`Unauthorized: You have left this workspace.`);
      }

      // Invited people may view only enough destination name/visibility/rules to decide accept or decline
      if (!isOwnerOrMod && membership?.state === 'invited') {
        return JSON.parse(JSON.stringify(this.toSafeWorkspaceInvitationSummary(ws)));
      }
    }

    return JSON.parse(JSON.stringify(ws));
  }

  async getWorkspaceMemberships(workspaceId: string, callerUserId: string): Promise<WorkspaceMembership[]> {
    const db = this.getDb();
    const ws = (db.workspaces || []).find((w) => w.id === workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);

    // Repository boundary: Caller must be an active or restricted member, or room owner/moderator
    const callerMembership = (db.workspaceMemberships || []).find(
      (m) => m.workspaceId === workspaceId && m.userId === callerUserId
    );
    const isOwnerOrMod = ws.ownerId === callerUserId || (ws.moderatorIds || []).includes(callerUserId);

    if (!isOwnerOrMod && (!callerMembership || (callerMembership.state !== 'active' && callerMembership.state !== 'restricted'))) {
      throw new Error(`Unauthorized: Member directory is only accessible to active workspace members and room moderators.`);
    }

    const memberships = (db.workspaceMemberships || []).filter((m) => m.workspaceId === workspaceId);
    return JSON.parse(JSON.stringify(memberships));
  }

  async getWorkspaceMembership(workspaceId: string, userId: string, callerUserId?: string): Promise<WorkspaceMembership | null> {
    const db = this.getDb();
    const ws = (db.workspaces || []).find((w) => w.id === workspaceId);
    if (!ws) return null;

    if (callerUserId) {
      const isOwnerOrMod = ws.ownerId === callerUserId || (ws.moderatorIds || []).includes(callerUserId);
      const isSelf = callerUserId === userId;
      if (!isOwnerOrMod && !isSelf) {
        throw new Error(`Unauthorized: Caller does not have permission to inspect another user's workspace membership.`);
      }
    } else {
      if (ws.visibility === 'private') {
        throw new Error(`Unauthorized: Caller identity required to query private workspace membership.`);
      }
    }

    const m = (db.workspaceMemberships || []).find(
      (mem) => mem.workspaceId === workspaceId && mem.userId === userId
    );
    return m ? JSON.parse(JSON.stringify(m)) : null;
  }

  async searchUsersForInvite(query: string, callerUserId: string, workspaceId: string): Promise<User[]> {
    const db = this.getDb();
    const ws = (db.workspaces || []).find((w) => w.id === workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);

    const callerMembership = (db.workspaceMemberships || []).find(
      (m) => m.workspaceId === workspaceId && m.userId === callerUserId
    );
    const isOwnerOrMod = ws.ownerId === callerUserId || (ws.moderatorIds || []).includes(callerUserId);

    if (!isOwnerOrMod && (!callerMembership || !callerMembership.permissions.canInvite || callerMembership.state !== 'active')) {
      throw new Error(`Unauthorized: You do not have permission to invite users to this workspace.`);
    }

    const cleanQuery = query.trim().toLowerCase().replace(/^@/, '');
    if (!cleanQuery) return [];

    const matches = db.users.filter((u) => {
      if (u.id === callerUserId) return false;
      const uname = (u.username || u.email.split('@')[0] || '').toLowerCase();
      const name = u.name.toLowerCase();
      return uname.includes(cleanQuery) || name.includes(cleanQuery);
    });

    return JSON.parse(JSON.stringify(matches));
  }

  async inviteUserToWorkspace(params: {
    workspaceId: string;
    inviterId: string;
    usernameOrId: string;
  }): Promise<WorkspaceMembership> {
    const db = this.getDb();
    const ws = (db.workspaces || []).find((w) => w.id === params.workspaceId);
    if (!ws) throw new Error(`Workspace ${params.workspaceId} not found`);

    const inviter = db.users.find((u) => u.id === params.inviterId);
    if (!inviter) throw new Error(`Inviter ${params.inviterId} not found`);

    const isOwnerOrMod = ws.ownerId === params.inviterId || (ws.moderatorIds || []).includes(params.inviterId);
    const inviterMembership = (db.workspaceMemberships || []).find(
      (m) => m.workspaceId === params.workspaceId && m.userId === params.inviterId
    );

    if (!isOwnerOrMod && (!inviterMembership || !inviterMembership.permissions.canInvite || inviterMembership.state !== 'active')) {
      throw new Error(`Unauthorized: Caller lacks invite permission for this workspace.`);
    }

    const cleanTarget = params.usernameOrId.trim().replace(/^@/, '').toLowerCase();
    const targetUser = db.users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanTarget) ||
        u.id.toLowerCase() === cleanTarget ||
        u.email.split('@')[0].toLowerCase() === cleanTarget
    );

    if (!targetUser) {
      throw new Error(`User "@${params.usernameOrId.replace(/^@/, '')}" not found. Please verify the exact username.`);
    }

    if (targetUser.id === params.inviterId) {
      throw new Error(`Self-invitation is not permitted.`);
    }

    db.workspaceMemberships = db.workspaceMemberships || [];
    const existingIndex = db.workspaceMemberships.findIndex(
      (m) => m.workspaceId === params.workspaceId && m.userId === targetUser.id
    );

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = db.workspaceMemberships[existingIndex];
      if (existing.state === 'active') {
        throw new Error(`User @${targetUser.username} is already an active member of this workspace.`);
      }
      if (existing.state === 'invited') {
        throw new Error(`User @${targetUser.username} already has a pending invitation to this workspace.`);
      }
      if (existing.state === 'removed') {
        if (!isOwnerOrMod) {
          throw new Error(`Cannot invite user @${targetUser.username}: member was removed by moderation and requires moderator approval for re-entry.`);
        }
      }

      existing.state = 'invited';
      existing.invitedBy = params.inviterId;
      existing.invitedAt = now;
      existing.statusReason = undefined;
      existing.statusChangedBy = params.inviterId;
      existing.statusChangedAt = now;
      existing.updatedAt = now;

      db.workspaceAuditEvents = db.workspaceAuditEvents || [];
      db.workspaceAuditEvents.push({
        id: generateId('aud_ws'),
        workspaceId: params.workspaceId,
        eventType: 'invite',
        actorId: params.inviterId,
        actorName: inviter.name,
        actorRole: isOwnerOrMod ? 'moderator' : 'member',
        targetUserId: targetUser.id,
        targetUserName: targetUser.name,
        reason: `Re-invited user @${targetUser.username} to workspace`,
        timestamp: now,
        details: { username: targetUser.username, destination: ws.title },
        schemaVersion: 1,
      });

      this.saveDb(db);

      return JSON.parse(JSON.stringify(existing));
    }

    const newMembership: WorkspaceMembership = {
      id: generateId('wsm'),
      workspaceId: params.workspaceId,
      userId: targetUser.id,
      userName: targetUser.name,
      username: targetUser.username || targetUser.email.split('@')[0],
      userRole: targetUser.role,
      institutionId: targetUser.institutionId,
      institutionName: targetUser.institutionName,
      role: 'member',
      state: 'invited',
      invitedBy: params.inviterId,
      invitedAt: now,
      permissions: {
        canRead: true,
        canPost: true,
        canUpload: true,
        canInvite: true,
        canScheduleMeeting: false,
        canCreateSubroom: false,
        canModerate: false,
        canManageMembership: false,
      },
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    db.workspaceMemberships.push(newMembership);

    db.workspaceAuditEvents = db.workspaceAuditEvents || [];
    db.workspaceAuditEvents.push({
      id: generateId('aud_ws'),
      workspaceId: params.workspaceId,
      eventType: 'invite',
      actorId: params.inviterId,
      actorName: inviter.name,
      actorRole: isOwnerOrMod ? 'moderator' : 'member',
      targetUserId: targetUser.id,
      targetUserName: targetUser.name,
      reason: `Invited user @${targetUser.username} to ${ws.title}`,
      timestamp: now,
      details: { username: targetUser.username, destination: ws.title },
      schemaVersion: 1,
    });

    this.saveDb(db);

    return JSON.parse(JSON.stringify(newMembership));
  }

  async respondToWorkspaceInvite(params: {
    workspaceId: string;
    userId: string;
    accept: boolean;
    reason?: string;
  }): Promise<WorkspaceMembership> {
    const db = this.getDb();
    const ws = (db.workspaces || []).find((w) => w.id === params.workspaceId);
    if (!ws) throw new Error(`Workspace ${params.workspaceId} not found`);

    const user = db.users.find((u) => u.id === params.userId);
    if (!user) throw new Error(`User ${params.userId} not found`);

    db.workspaceMemberships = db.workspaceMemberships || [];
    const membership = db.workspaceMemberships.find(
      (m) => m.workspaceId === params.workspaceId && m.userId === params.userId
    );

    if (!membership) {
      throw new Error(`No pending invitation found for user in workspace ${ws.title}.`);
    }

    if (membership.state !== 'invited') {
      throw new Error(`Cannot respond to invitation: membership state is already "${membership.state}".`);
    }

    const now = new Date().toISOString();

    if (params.accept) {
      membership.state = 'active';
      membership.joinedAt = now;
      membership.statusReason = undefined;
      membership.updatedAt = now;

      db.workspaceAuditEvents = db.workspaceAuditEvents || [];
      db.workspaceAuditEvents.push({
        id: generateId('aud_ws'),
        workspaceId: params.workspaceId,
        eventType: 'acceptance',
        actorId: params.userId,
        actorName: user.name,
        actorRole: 'member',
        reason: 'Accepted workspace invitation and acknowledged destination rules',
        timestamp: now,
        details: { workspaceId: ws.id, workspaceTitle: ws.title },
        schemaVersion: 1,
      });
    } else {
      membership.state = 'left';
      membership.statusReason = params.reason || 'Invitation declined by user';
      membership.updatedAt = now;

      db.workspaceAuditEvents = db.workspaceAuditEvents || [];
      db.workspaceAuditEvents.push({
        id: generateId('aud_ws'),
        workspaceId: params.workspaceId,
        eventType: 'decline',
        actorId: params.userId,
        actorName: user.name,
        actorRole: 'member',
        reason: params.reason || 'Declined workspace invitation',
        timestamp: now,
        details: { workspaceId: ws.id, workspaceTitle: ws.title },
        schemaVersion: 1,
      });
    }

    this.saveDb(db);

    return JSON.parse(JSON.stringify(membership));
  }

  async acknowledgeWorkspaceRules(params: {
    workspaceId: string;
    userId: string;
    version: string;
  }): Promise<WorkspaceMembership> {
    const db = this.getDb();
    const ws = (db.workspaces || []).find((w) => w.id === params.workspaceId);
    if (!ws) throw new Error(`Workspace ${params.workspaceId} not found`);

    const user = db.users.find((u) => u.id === params.userId);
    if (!user) throw new Error(`User ${params.userId} not found`);

    db.workspaceMemberships = db.workspaceMemberships || [];
    let membership = db.workspaceMemberships.find(
      (m) => m.workspaceId === params.workspaceId && m.userId === params.userId
    );

    const now = new Date().toISOString();

    if (!membership) {
      const isOwnerOrMod = ws.ownerId === params.userId || (ws.moderatorIds || []).includes(params.userId);
      if (!isOwnerOrMod) {
        throw new Error(`User ${params.userId} is not a member of workspace ${ws.title}.`);
      }
      membership = {
        id: generateId('wsm'),
        workspaceId: params.workspaceId,
        userId: user.id,
        userName: user.name,
        username: user.username || user.email.split('@')[0],
        userRole: user.role,
        institutionId: user.institutionId,
        institutionName: user.institutionName,
        role: ws.ownerId === params.userId ? 'owner' : 'moderator',
        state: 'active',
        joinedAt: now,
        permissions: {
          canRead: true,
          canPost: true,
          canUpload: true,
          canInvite: true,
          canScheduleMeeting: true,
          canCreateSubroom: true,
          canModerate: true,
          canManageMembership: true,
        },
        lastAcknowledgedRuleVersion: params.version,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      };
      db.workspaceMemberships.push(membership);
    } else {
      membership.lastAcknowledgedRuleVersion = params.version;
      membership.updatedAt = now;
    }

    db.workspaceAuditEvents = db.workspaceAuditEvents || [];
    db.workspaceAuditEvents.push({
      id: generateId('aud_ws'),
      workspaceId: params.workspaceId,
      eventType: 'rule_acknowledgement',
      actorId: params.userId,
      actorName: user.name,
      actorRole: membership.role,
      reason: `Acknowledged point-of-use Rulebook version ${params.version}`,
      timestamp: now,
      details: { version: params.version },
      schemaVersion: 1,
    });

    this.saveDb(db);

    return JSON.parse(JSON.stringify(membership));
  }

  async getWorkspaceActions(workspaceId: string, callerUserId: string): Promise<WorkspaceAction[]> {
    const db = this.getDb();
    const ws = (db.workspaces || []).find((w) => w.id === workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);

    const isOwnerOrMod = ws.ownerId === callerUserId || (ws.moderatorIds || []).includes(callerUserId);
    const membership = (db.workspaceMemberships || []).find(
      (m) => m.workspaceId === workspaceId && m.userId === callerUserId
    );

    if (!isOwnerOrMod) {
      if (!membership || (membership.state !== 'active' && membership.state !== 'restricted')) {
        throw new Error(`Unauthorized: Non-members and invited or removed participants cannot read workspace actions or content.`);
      }
    }

    const actions = (db.workspaceActions || []).filter((a) => a.workspaceId === workspaceId);
    return JSON.parse(JSON.stringify(actions));
  }

  async createWorkspaceAction(params: {
    workspaceId: string;
    authorId: string;
    actionType: WorkspaceActionType;
    title: string;
    content: string;
    sourceLink?: WorkspaceAction['sourceLink'];
    tags?: string[];
  }): Promise<WorkspaceAction> {
    const db = this.getDb();
    const ws = (db.workspaces || []).find((w) => w.id === params.workspaceId);
    if (!ws) throw new Error(`Workspace ${params.workspaceId} not found`);

    const author = db.users.find((u) => u.id === params.authorId);
    if (!author) throw new Error(`Author ${params.authorId} not found`);

    const isOwnerOrMod = ws.ownerId === params.authorId || (ws.moderatorIds || []).includes(params.authorId);
    const membership = (db.workspaceMemberships || []).find(
      (m) => m.workspaceId === params.workspaceId && m.userId === params.authorId
    );

    if (!isOwnerOrMod) {
      if (!membership) {
        throw new Error(`Unauthorized: You are not a member of this workspace.`);
      }
      if (membership.state === 'invited') {
        throw new Error(`Invited users cannot post until active membership is accepted.`);
      }
      if (membership.state === 'restricted') {
        throw new Error(`Restricted members cannot create posts or actions (${membership.statusReason || 'moderator restriction'}).`);
      }
      if (membership.state === 'removed' || membership.state === 'left') {
        throw new Error(`Removed users cannot access or post to this workspace.`);
      }
      if (!membership.permissions.canPost) {
        throw new Error(`Unauthorized: Member does not have posting permissions in this workspace.`);
      }
    }

    const currentRuleVersion = ws.rulebook?.version || 'v1.0';
    const ackVersion = membership?.lastAcknowledgedRuleVersion;
    if (ackVersion !== currentRuleVersion && !isOwnerOrMod) {
      throw new Error(`Rule acknowledgement required: Workspace rules updated to ${currentRuleVersion}. Please acknowledge rules before posting.`);
    }

    const trimmedTitle = params.title.trim();
    const trimmedContent = params.content.trim();
    if (trimmedTitle.length < 3) {
      throw new Error(`Action title must be at least 3 characters.`);
    }
    if (trimmedContent.length < 5) {
      throw new Error(`Action content must contain substantive detail (at least 5 characters).`);
    }

    const now = new Date().toISOString();
    const newAction: WorkspaceAction = {
      id: generateId('act_ws'),
      workspaceId: params.workspaceId,
      authorId: params.authorId,
      authorName: author.name,
      authorUsername: author.username || author.email.split('@')[0],
      authorRole: isOwnerOrMod ? (ws.ownerId === params.authorId ? 'owner' : 'moderator') : (membership?.role || 'member'),
      actionType: params.actionType,
      title: trimmedTitle,
      content: trimmedContent,
      sourceLink: params.sourceLink,
      tags: params.tags || [],
      status: 'active',
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    db.workspaceActions = db.workspaceActions || [];
    db.workspaceActions.push(newAction);

    db.workspaceAuditEvents = db.workspaceAuditEvents || [];
    db.workspaceAuditEvents.push({
      id: generateId('aud_ws'),
      workspaceId: params.workspaceId,
      eventType: 'post',
      actorId: params.authorId,
      actorName: author.name,
      actorRole: newAction.authorRole,
      targetActionId: newAction.id,
      reason: `Created workspace action (${params.actionType}): "${trimmedTitle}"`,
      timestamp: now,
      details: { title: trimmedTitle, actionType: params.actionType },
      schemaVersion: 1,
    });

    // Award +1 Collaboration credit and create Passport entry for workspace action
    const existingCredit = db.credits.find(
      (c) => c.userId === params.authorId && c.sourceType === 'workspace' && c.sourceId === newAction.id
    );
    if (!existingCredit) {
      db.credits.push({
        id: generateId('tx'),
        userId: params.authorId,
        dimension: 'Collaboration',
        amount: 1,
        sourceType: 'workspace',
        sourceId: newAction.id,
        sourceRoute: `/workspaces/${params.workspaceId}`,
        status: 'Verified',
        reason: `Workspace collaboration action: ${trimmedTitle}`,
        calculationExplanation: 'Fixed demo rule: +1 Collaboration on verified workspace action contribution.',
        createdAt: now,
        schemaVersion: 1,
      });

      const user = db.users.find((u) => u.id === params.authorId);
      if (user) {
        user.totalCredits = this.calculateUserCredits(db, params.authorId);
        user.updatedAt = now;
      }
    }

    const existingPassport = db.passportEntries.find(
      (p) => p.userId === params.authorId && p.sourceReferenceId === newAction.id && p.sourceReferenceType === 'workspace'
    );
    if (!existingPassport) {
      db.passportEntries.push({
        id: generateId('pass'),
        userId: params.authorId,
        category: 'civic_action',
        title: `Workspace Action: ${trimmedTitle}`,
        subtitle: `Collaborative action in ${ws.title}`,
        date: now.split('T')[0],
        creditsAwarded: 1,
        evidenceIds: [],
        sourceReferenceId: newAction.id,
        sourceReferenceType: 'workspace',
        sourceRoute: `/workspaces/${params.workspaceId}`,
        isVerified: true,
        verificationState: 'system_recorded',
        reviewState: 'accepted',
        visibility: 'public',
        calculationExplanation: 'Fixed demo rule: +1 Collaboration on verified workspace action contribution.',
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      });
    }

    this.saveDb(db);

    return JSON.parse(JSON.stringify(newAction));
  }

  async moderateWorkspaceAction(params: {
    workspaceId: string;
    moderatorId: string;
    actionId: string;
    action: 'freeze' | 'remove' | 'unfreeze';
    reason: string;
  }): Promise<WorkspaceAction> {
    const db = this.getDb();
    const ws = (db.workspaces || []).find((w) => w.id === params.workspaceId);
    if (!ws) throw new Error(`Workspace ${params.workspaceId} not found`);

    const isOwnerOrMod = ws.ownerId === params.moderatorId || (ws.moderatorIds || []).includes(params.moderatorId);
    if (!isOwnerOrMod) {
      throw new Error(`Unauthorized: Scoped moderation violation. User ${params.moderatorId} is not a designated moderator of workspace "${ws.title}". Unrelated moderators cannot intervene.`);
    }

    const trimmedReason = params.reason.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      throw new Error(`A valid reason is required for moderation action (at least 3 characters).`);
    }

    db.workspaceActions = db.workspaceActions || [];
    const action = db.workspaceActions.find((a) => a.id === params.actionId && a.workspaceId === params.workspaceId);
    if (!action) throw new Error(`Workspace action ${params.actionId} not found`);

    const moderator = db.users.find((u) => u.id === params.moderatorId);
    const now = new Date().toISOString();

    if (params.action === 'freeze') {
      action.status = 'frozen';
    } else if (params.action === 'remove') {
      action.status = 'removed';
    } else {
      action.status = 'active';
    }

    action.moderationReason = trimmedReason;
    action.moderatedBy = params.moderatorId;
    action.moderatedAt = now;
    action.updatedAt = now;

    db.workspaceAuditEvents = db.workspaceAuditEvents || [];
    db.workspaceAuditEvents.push({
      id: generateId('aud_ws'),
      workspaceId: params.workspaceId,
      eventType: 'moderation',
      actorId: params.moderatorId,
      actorName: moderator?.name || 'Moderator',
      actorRole: 'moderator',
      targetActionId: params.actionId,
      reason: `${params.action.toUpperCase()} action: ${trimmedReason}`,
      timestamp: now,
      details: { actionId: params.actionId, newStatus: action.status, reason: trimmedReason },
      schemaVersion: 1,
    });

    this.saveDb(db);

    return JSON.parse(JSON.stringify(action));
  }

  async moderateWorkspaceMember(params: {
    workspaceId: string;
    moderatorId: string;
    targetUserId: string;
    newStatus: 'restricted' | 'removed' | 'active';
    reason: string;
  }): Promise<WorkspaceMembership> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error(`Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.`);
    }
    if (params.moderatorId && params.moderatorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${params.moderatorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const ws = (db.workspaces || []).find((w) => w.id === params.workspaceId);
    if (!ws) throw new Error(`Workspace ${params.workspaceId} not found`);

    const isOwnerOrMod = ws.ownerId === params.moderatorId || (ws.moderatorIds || []).includes(params.moderatorId);
    let isPlatformScopedMod = false;
    let activeGrant: ScopedModeratorGrant | undefined;

    if (!isOwnerOrMod) {
      const scopeCheck = this.verifyModeratorScopeInternal(params.moderatorId, { type: 'memberships' }, db);
      if (scopeCheck.authorized && scopeCheck.grant) {
        isPlatformScopedMod = true;
        activeGrant = scopeCheck.grant;
      }
    }

    if (!isOwnerOrMod && !isPlatformScopedMod) {
      throw new Error(`Unauthorized: Scoped moderation violation. User ${params.moderatorId} is not a designated moderator of workspace "${ws.title}".`);
    }

    if (params.targetUserId === ws.ownerId) {
      throw new Error(`Unauthorized: The workspace owner cannot be removed or restricted.`);
    }

    const trimmedReason = params.reason.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      throw new Error(`A valid reason is required for member moderation (at least 3 characters).`);
    }

    db.workspaceMemberships = db.workspaceMemberships || [];
    const membership = db.workspaceMemberships.find(
      (m) => m.workspaceId === params.workspaceId && m.userId === params.targetUserId
    );
    if (!membership) {
      throw new Error(`Member ${params.targetUserId} not found in workspace ${ws.title}.`);
    }

    const moderator = db.users.find((u) => u.id === params.moderatorId);
    const now = new Date().toISOString();

    membership.state = params.newStatus;
    membership.statusReason = trimmedReason;
    membership.statusChangedBy = params.moderatorId;
    membership.statusChangedAt = now;
    membership.updatedAt = now;

    if (params.newStatus === 'restricted' || params.newStatus === 'removed') {
      membership.permissions.canPost = false;
      membership.permissions.canUpload = false;
      membership.permissions.canInvite = false;
    } else if (params.newStatus === 'active') {
      membership.permissions.canPost = true;
      membership.permissions.canUpload = true;
      membership.permissions.canInvite = true;
      membership.statusReason = undefined;
    }

    db.workspaceAuditEvents = db.workspaceAuditEvents || [];
    db.workspaceAuditEvents.push({
      id: generateId('aud_ws'),
      workspaceId: params.workspaceId,
      eventType: params.newStatus === 'removed' ? 'removal' : params.newStatus === 'restricted' ? 'restriction' : 'reentry',
      actorId: params.moderatorId,
      actorName: moderator?.name || 'Moderator',
      actorRole: 'moderator',
      targetUserId: params.targetUserId,
      targetUserName: membership.userName,
      reason: `${params.newStatus.toUpperCase()}: ${trimmedReason}`,
      timestamp: now,
      details: { newStatus: params.newStatus, reason: trimmedReason },
      schemaVersion: 1,
    });

    if (isPlatformScopedMod && activeGrant) {
      this.recordModeratorAuditSync(
        {
          grantId: activeGrant.id,
          action: 'grant_used',
          actorId: params.moderatorId,
          actorName: moderator?.name || 'Moderator',
          actorRole: moderator?.role || 'moderator',
          scopeType: 'memberships',
          targetId: params.workspaceId,
          details: `Platform scoped moderator updated membership for ${params.targetUserId} in workspace "${ws.title}" to "${params.newStatus}".`,
          outcome: 'success',
        },
        db
      );
    }

    this.saveDb(db);

    return JSON.parse(JSON.stringify(membership));
  }

  async reportWorkspaceContent(params: {
    workspaceId: string;
    reporterId: string;
    targetActionId?: string;
    targetUserId?: string;
    reason: string;
  }): Promise<WorkspaceAuditEvent> {
    const db = this.getDb();
    const ws = (db.workspaces || []).find((w) => w.id === params.workspaceId);
    if (!ws) throw new Error(`Workspace ${params.workspaceId} not found`);

    const reporter = db.users.find((u) => u.id === params.reporterId);
    if (!reporter) throw new Error(`Reporter ${params.reporterId} not found`);

    const isOwnerOrMod = ws.ownerId === params.reporterId || (ws.moderatorIds || []).includes(params.reporterId);
    const membership = (db.workspaceMemberships || []).find(
      (m) => m.workspaceId === params.workspaceId && m.userId === params.reporterId
    );
    if (!isOwnerOrMod && (!membership || (membership.state !== 'active' && membership.state !== 'restricted'))) {
      throw new Error(`Unauthorized: Only active workspace participants can file content reports.`);
    }

    const trimmedReason = params.reason.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      throw new Error(`A valid reason is required for submitting a report (at least 3 characters).`);
    }

    const now = new Date().toISOString();
    const auditEvent: WorkspaceAuditEvent = {
      id: generateId('aud_ws'),
      workspaceId: params.workspaceId,
      eventType: 'report',
      actorId: params.reporterId,
      actorName: reporter.name,
      actorRole: membership?.role || 'member',
      targetActionId: params.targetActionId,
      targetUserId: params.targetUserId,
      reason: trimmedReason,
      timestamp: now,
      details: { reportedBy: reporter.username || reporter.name, targetActionId: params.targetActionId },
      schemaVersion: 1,
    };

    db.workspaceAuditEvents = db.workspaceAuditEvents || [];
    db.workspaceAuditEvents.push(auditEvent);

    db.moderationCases = db.moderationCases || [];
    db.moderationCases.push({
      id: generateId('mod_ws'),
      reporterId: params.reporterId,
      targetType: 'post',
      targetId: params.targetActionId || params.workspaceId,
      reason: trimmedReason,
      severity: 'medium',
      status: 'open',
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    });

    this.saveDb(db);

    return JSON.parse(JSON.stringify(auditEvent));
  }

  async getWorkspaceAuditEvents(workspaceId: string, callerUserId: string): Promise<WorkspaceAuditEvent[]> {
    const db = this.getDb();
    const ws = (db.workspaces || []).find((w) => w.id === workspaceId);
    if (!ws) throw new Error(`Workspace ${workspaceId} not found`);

    const isOwnerOrMod = ws.ownerId === callerUserId || (ws.moderatorIds || []).includes(callerUserId);
    const membership = (db.workspaceMemberships || []).find(
      (m) => m.workspaceId === workspaceId && m.userId === callerUserId
    );
    if (!isOwnerOrMod && (!membership || (membership.state !== 'active' && membership.state !== 'restricted'))) {
      throw new Error(`Unauthorized: Audit trail is only accessible to active members and room moderators.`);
    }

    const events = (db.workspaceAuditEvents || [])
      .filter((e) => e.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return JSON.parse(JSON.stringify(events));
  }

  // ============================================================================
  // Scoped Moderator Grants & Audit Service Boundary (Change Plan v2 §12)
  // Platform-wide founder-held delegation under Platform Owner control
  // ============================================================================

  recordModeratorAuditSync(
    audit: Omit<ScopedModeratorAuditRecord, 'id' | 'timestamp' | 'schemaVersion'>,
    db?: DemoDatabase
  ): ScopedModeratorAuditRecord {
    const targetDb = db || this.getDb();
    targetDb.scopedModeratorAudits = targetDb.scopedModeratorAudits || [];
    const entry: ScopedModeratorAuditRecord = {
      id: generateId('aud_grant'),
      timestamp: new Date().toISOString(),
      schemaVersion: 1,
      ...audit,
    };
    targetDb.scopedModeratorAudits.push(entry);
    if (!db) {
      this.saveDb(targetDb);
    }
    return entry;
  }

  hasAnyModeratorGrant(userId?: string, db?: DemoDatabase): boolean {
    if (!userId) return false;
    const targetDb = db || this.getDb();
    const grants = targetDb.scopedModeratorGrants || [];
    return grants.some((g) => g.granteeId === userId);
  }

  verifyModeratorScopeInternal(
    granteeId: string,
    requiredScope: { type: ModeratorScopeType; sessionId?: string },
    db: DemoDatabase
  ): { authorized: boolean; grant?: ScopedModeratorGrant; error?: string } {
    db.scopedModeratorGrants = db.scopedModeratorGrants || [];
    const now = new Date().toISOString();

    const userGrants = db.scopedModeratorGrants.filter((g) => g.granteeId === granteeId);
    if (userGrants.length === 0) {
      return {
        authorized: false,
        error: `No moderator grant found for user "${granteeId}".`,
      };
    }

    const matchingScopeGrants = userGrants.filter((g) => g.scope.type === requiredScope.type);
    if (matchingScopeGrants.length === 0) {
      const activeOtherScopes = userGrants
        .filter((g) => g.status === 'active' && g.expiresAt > now)
        .map((g) => g.scope.type)
        .join(', ');
      return {
        authorized: false,
        error: `Cross-scope access denied: User has grants for [${activeOtherScopes || 'none'}], but requested scope "${requiredScope.type}".`,
      };
    }

    if (requiredScope.type === 'named_session' && requiredScope.sessionId) {
      const sessionGrant = matchingScopeGrants.find(
        (g) => g.scope.sessionId === requiredScope.sessionId
      );
      if (!sessionGrant) {
        const heldSessions = matchingScopeGrants
          .map((g) => g.scope.sessionId)
          .filter(Boolean)
          .join(', ');
        return {
          authorized: false,
          error: `Cross-session access denied: Scoped grant is limited to session(s) [${heldSessions || 'none'}], requested session "${requiredScope.sessionId}".`,
        };
      }
    }

    for (const grant of matchingScopeGrants) {
      if (
        requiredScope.type === 'named_session' &&
        requiredScope.sessionId &&
        grant.scope.sessionId !== requiredScope.sessionId
      ) {
        continue;
      }

      if (grant.status === 'revoked') {
        return {
          authorized: false,
          grant,
          error: `Grant "${grant.id}" was revoked by platform owner: ${grant.revocationReason || 'Revoked'}.`,
        };
      }

      if (grant.expiresAt && grant.expiresAt <= now) {
        grant.status = 'expired';
        return {
          authorized: false,
          grant,
          error: `Grant "${grant.id}" expired at ${grant.expiresAt}.`,
        };
      }

      if (grant.status === 'active') {
        return {
          authorized: true,
          grant,
        };
      }
    }

    return {
      authorized: false,
      error: `No active, unexpired grant found for scope "${requiredScope.type}".`,
    };
  }

  async getScopedModeratorGrants(callerId?: string): Promise<ScopedModeratorGrant[]> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (callerId && effectiveActiveId && callerId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${callerId}" does not match active persona "${effectiveActiveId}".`
      );
    }
    if (callerId && !effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${callerId}" cannot be used without an active persona.`
      );
    }

    const effectiveCallerId = effectiveActiveId || callerId;
    if (!effectiveCallerId) {
      return [];
    }

    const caller = db.users.find((u) => u.id === effectiveCallerId);

    db.scopedModeratorGrants = db.scopedModeratorGrants || [];
    const now = new Date().toISOString();
    let hasChanges = false;
    for (const grant of db.scopedModeratorGrants) {
      if (grant.status === 'active' && grant.expiresAt && grant.expiresAt <= now) {
        grant.status = 'expired';
        hasChanges = true;
      }
    }
    if (hasChanges) {
      this.saveDb(db);
    }

    // Platform Owner can read all grants including grantee emails
    if (caller?.role === 'platform_admin') {
      return JSON.parse(JSON.stringify(db.scopedModeratorGrants));
    }

    // Non-owner: only return grantee's own grants as a safe projection (granteeEmail redacted)
    const ownGrants = db.scopedModeratorGrants.filter((g) => g.granteeId === effectiveCallerId);
    const safeProjection: ScopedModeratorGrant[] = ownGrants.map((g) => {
      const copy = { ...g };
      delete copy.granteeEmail;
      return copy;
    });

    return JSON.parse(JSON.stringify(safeProjection));
  }

  async getScopedModeratorAudits(callerId?: string): Promise<ScopedModeratorAuditRecord[]> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (callerId && effectiveActiveId && callerId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${callerId}" does not match active persona "${effectiveActiveId}".`
      );
    }
    if (callerId && !effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${callerId}" cannot be used without an active persona.`
      );
    }

    const effectiveCallerId = effectiveActiveId || callerId;
    if (!effectiveCallerId) {
      return [];
    }

    const caller = db.users.find((u) => u.id === effectiveCallerId);
    db.scopedModeratorAudits = db.scopedModeratorAudits || [];
    const sorted = [...db.scopedModeratorAudits].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Platform Owner can read the full audit trail
    if (caller?.role === 'platform_admin') {
      return JSON.parse(JSON.stringify(sorted));
    }

    // Non-owner: only audits where the caller is the actor or target
    const scopedAudits = sorted.filter(
      (a) => a.actorId === effectiveCallerId || a.targetId === effectiveCallerId
    );

    return JSON.parse(JSON.stringify(scopedAudits));
  }

  async createScopedModeratorGrant(
    input: {
      granteeId: string;
      scope: ModeratorScope;
      durationDays: number;
      reason: string;
    },
    callerId?: string
  ): Promise<ScopedModeratorGrant> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error('Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.');
    }
    if (callerId && callerId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${callerId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const caller = db.users.find((u) => u.id === effectiveActiveId);

    // Authority guard: strictly platform_admin (Platform Owner persona)
    if (!caller || caller.role !== 'platform_admin') {
      throw new Error(
        `Unauthorized: Only the Platform Owner persona can create scoped moderator grants. ` +
          `Current actor '${caller?.name || effectiveActiveId}' has role '${caller?.role || 'none'}'.`
      );
    }

    const grantee = db.users.find((u) => u.id === input.granteeId);
    if (!grantee) {
      throw new Error(`Grantee user "${input.granteeId}" not found in registered users.`);
    }

    const trimmedReason = input.reason.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      throw new Error('A substantive justification reason is required to create a moderator grant (at least 3 characters).');
    }

    if (!input.scope || !['assignments', 'memberships', 'named_session'].includes(input.scope.type)) {
      throw new Error(`Invalid grant scope type: "${input.scope?.type}". Must be 'assignments', 'memberships', or 'named_session'.`);
    }

    if (input.scope.type === 'named_session') {
      if (!input.scope.sessionId) {
        throw new Error('A valid sessionId is required when creating a named_session moderator grant.');
      }
      const session = db.sessions.find((s) => s.id === input.scope.sessionId);
      if (!session) {
        throw new Error(`Target session "${input.scope.sessionId}" not found.`);
      }
      input.scope.sessionTitle = session.title;
    }

    if (!input.durationDays || input.durationDays <= 0) {
      throw new Error('Grant duration must be greater than zero days.');
    }

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + input.durationDays * 86400000).toISOString();
    const grantId = generateId('grant_mod');

    const grant: ScopedModeratorGrant = {
      id: grantId,
      granteeId: grantee.id,
      granteeName: grantee.name,
      granteeRole: grantee.role,
      granteeEmail: grantee.email,
      grantorId: caller.id,
      grantorName: `${caller.name} (Platform Owner)`,
      grantorRole: 'platform_admin',
      scope: {
        ...input.scope,
        description: input.scope.description || `Platform delegation for ${input.scope.type}`,
      },
      reason: trimmedReason,
      createdAt: now,
      expiresAt,
      status: 'active',
      schemaVersion: 1,
    };

    db.scopedModeratorGrants = db.scopedModeratorGrants || [];
    db.scopedModeratorGrants.push(grant);

    this.recordModeratorAuditSync(
      {
        grantId: grant.id,
        action: 'grant_created',
        actorId: caller.id,
        actorName: caller.name,
        actorRole: caller.role,
        scopeType: input.scope.type,
        targetId: grantee.id,
        details: `Platform Owner granted ${input.durationDays}-day scoped authority for ${input.scope.type} to ${grantee.name} (${grantee.id}): ${trimmedReason}`,
        outcome: 'success',
      },
      db
    );

    this.saveDb(db);
    return JSON.parse(JSON.stringify(grant));
  }

  async revokeScopedModeratorGrant(
    grantId: string,
    reason: string,
    callerId?: string
  ): Promise<ScopedModeratorGrant> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error('Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.');
    }
    if (callerId && callerId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${callerId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const caller = db.users.find((u) => u.id === effectiveActiveId);

    // Authority guard: strictly platform_admin
    if (!caller || caller.role !== 'platform_admin') {
      throw new Error(
        `Unauthorized: Only the Platform Owner persona can revoke scoped moderator grants. ` +
          `Current actor '${caller?.name || effectiveActiveId}' has role '${caller?.role || 'none'}'.`
      );
    }

    db.scopedModeratorGrants = db.scopedModeratorGrants || [];
    const grant = db.scopedModeratorGrants.find((g) => g.id === grantId);
    if (!grant) {
      throw new Error(`Scoped moderator grant "${grantId}" not found.`);
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      throw new Error('A substantive reason is required to revoke a moderator grant (at least 3 characters).');
    }

    const now = new Date().toISOString();
    grant.status = 'revoked';
    grant.revokedAt = now;
    grant.revokedBy = caller.id;
    grant.revocationReason = trimmedReason;

    this.recordModeratorAuditSync(
      {
        grantId: grant.id,
        action: 'grant_revoked',
        actorId: caller.id,
        actorName: caller.name,
        actorRole: caller.role,
        scopeType: grant.scope.type,
        targetId: grant.id,
        details: `Platform Owner revoked grant ${grant.id} for ${grant.granteeName}: ${trimmedReason}`,
        outcome: 'success',
      },
      db
    );

    this.saveDb(db);
    return JSON.parse(JSON.stringify(grant));
  }

  async verifyModeratorScope(
    granteeId: string,
    requiredScope: { type: ModeratorScopeType; sessionId?: string }
  ): Promise<{ authorized: boolean; grant?: ScopedModeratorGrant; error?: string }> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error('Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.');
    }
    const caller = db.users.find((u) => u.id === effectiveActiveId);
    if (granteeId && granteeId !== effectiveActiveId && caller?.role !== 'platform_admin') {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${granteeId}" does not match active persona "${effectiveActiveId}".`
      );
    }
    const targetGranteeId = caller?.role === 'platform_admin' ? (granteeId || effectiveActiveId) : effectiveActiveId;
    const result = this.verifyModeratorScopeInternal(targetGranteeId, requiredScope, db);
    this.saveDb(db);
    return result;
  }

  async moderateAssignmentSubmission(
    submissionId: string,
    status: 'verified' | 'revision_requested' | 'under_review',
    feedback: string,
    moderatorId?: string
  ): Promise<Submission> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error('Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.');
    }
    if (moderatorId && moderatorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${moderatorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const actorId = effectiveActiveId;
    const moderator = db.users.find((u) => u.id === actorId);
    if (!moderator) throw new Error(`Moderator user "${actorId}" not found.`);

    const scopeCheck = this.verifyModeratorScopeInternal(actorId, { type: 'assignments' }, db);
    if (!scopeCheck.authorized) {
      this.recordModeratorAuditSync(
        {
          grantId: scopeCheck.grant?.id,
          action: 'grant_denied',
          actorId,
          actorName: moderator.name,
          actorRole: moderator.role,
          scopeType: 'assignments',
          targetId: submissionId,
          details: `Assignment submission moderation denied: ${scopeCheck.error}`,
          outcome: 'denied',
          denialReason: scopeCheck.error,
        },
        db
      );
      this.saveDb(db);
      throw new Error(`Unauthorized: Scoped assignment moderation denied. ${scopeCheck.error}`);
    }

    const submission = db.submissions.find((s) => s.id === submissionId);
    if (!submission) throw new Error(`Submission ${submissionId} not found`);

    const now = new Date().toISOString();
    submission.status = status;
    submission.teacherFeedback = feedback.trim();
    submission.reviewerId = actorId;
    submission.reviewedAt = now;
    submission.updatedAt = now;

    this.recordModeratorAuditSync(
      {
        grantId: scopeCheck.grant?.id,
        action: 'grant_used',
        actorId,
        actorName: moderator.name,
        actorRole: moderator.role,
        scopeType: 'assignments',
        targetId: submission.id,
        details: `Scoped moderator marked submission "${submission.id}" as "${status}": ${feedback.trim() || 'Reviewed'}`,
        outcome: 'success',
      },
      db
    );

    this.saveDb(db);
    return JSON.parse(JSON.stringify(submission));
  }

  async moderatePlatformMembership(params: {
    workspaceId: string;
    targetUserId: string;
    newStatus: 'restricted' | 'removed' | 'active';
    reason: string;
    moderatorId?: string;
  }): Promise<WorkspaceMembership> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error('Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.');
    }
    if (params.moderatorId && params.moderatorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${params.moderatorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const actorId = effectiveActiveId;
    const moderator = db.users.find((u) => u.id === actorId);
    if (!moderator) throw new Error(`Moderator user "${actorId}" not found.`);

    const scopeCheck = this.verifyModeratorScopeInternal(actorId, { type: 'memberships' }, db);
    if (!scopeCheck.authorized) {
      this.recordModeratorAuditSync(
        {
          grantId: scopeCheck.grant?.id,
          action: 'grant_denied',
          actorId,
          actorName: moderator.name,
          actorRole: moderator.role,
          scopeType: 'memberships',
          targetId: params.workspaceId,
          details: `Platform membership moderation denied: ${scopeCheck.error}`,
          outcome: 'denied',
          denialReason: scopeCheck.error,
        },
        db
      );
      this.saveDb(db);
      throw new Error(`Unauthorized: Scoped membership moderation denied. ${scopeCheck.error}`);
    }

    return this.moderateWorkspaceMember({
      workspaceId: params.workspaceId,
      moderatorId: actorId,
      targetUserId: params.targetUserId,
      newStatus: params.newStatus,
      reason: params.reason,
    });
  }

  async moderateSessionDeliberation(params: {
    sessionId: string;
    actionType: 'mute_participant' | 'flag_speech' | 'clear_queue';
    targetUserId: string;
    reason: string;
    moderatorId?: string;
  }): Promise<{ success: boolean; details: string; audit: ScopedModeratorAuditRecord }> {
    const db = this.getDb();
    const effectiveActiveId = db.activeUserId;
    if (!effectiveActiveId) {
      throw new Error('Unauthorized: Missing active persona. Privileged action requires an authenticated active persona.');
    }
    if (params.moderatorId && params.moderatorId !== effectiveActiveId) {
      throw new Error(
        `Spoof attempt rejected: Supplied actorId "${params.moderatorId}" does not match active persona "${effectiveActiveId}".`
      );
    }

    const actorId = effectiveActiveId;
    const moderator = db.users.find((u) => u.id === actorId);
    if (!moderator) throw new Error(`Moderator user "${actorId}" not found.`);

    const scopeCheck = this.verifyModeratorScopeInternal(
      actorId,
      { type: 'named_session', sessionId: params.sessionId },
      db
    );

    if (!scopeCheck.authorized) {
      this.recordModeratorAuditSync(
        {
          grantId: scopeCheck.grant?.id,
          action: 'grant_denied',
          actorId,
          actorName: moderator.name,
          actorRole: moderator.role,
          scopeType: 'named_session',
          targetId: params.sessionId,
          details: `Session deliberation moderation denied: ${scopeCheck.error}`,
          outcome: 'denied',
          denialReason: scopeCheck.error,
        },
        db
      );
      this.saveDb(db);
      throw new Error(`Unauthorized: Scoped session moderation denied. ${scopeCheck.error}`);
    }

    const session = db.sessions.find((s) => s.id === params.sessionId);
    if (!session) throw new Error(`Session "${params.sessionId}" not found.`);

    const trimmedReason = params.reason.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      throw new Error('A substantive reason is required for session moderation (at least 3 characters).');
    }

    let details = '';
    if (params.actionType === 'clear_queue') {
      if (session.debateData?.speakingQueue) {
        session.debateData.speakingQueue = [];
      }
      details = `Cleared speaking queue in session "${session.title}": ${trimmedReason}`;
    } else if (params.actionType === 'mute_participant') {
      if (session.debateData?.speakingQueue) {
        session.debateData.speakingQueue = session.debateData.speakingQueue.filter(
          (q) => q.userId !== params.targetUserId
        );
      }
      details = `Muted participant ${params.targetUserId} in session "${session.title}": ${trimmedReason}`;
    } else {
      details = `Flagged speech for participant ${params.targetUserId} in session "${session.title}": ${trimmedReason}`;
    }

    const audit = this.recordModeratorAuditSync(
      {
        grantId: scopeCheck.grant?.id,
        action: 'grant_used',
        actorId,
        actorName: moderator.name,
        actorRole: moderator.role,
        scopeType: 'named_session',
        targetId: params.sessionId,
        details,
        outcome: 'success',
      },
      db
    );

    this.saveDb(db);
    return {
      success: true,
      details,
      audit,
    };
  }

  // Demo operations
  async resetDemo(): Promise<void> {
    PersistenceService.resetDatabase();
  }

  async getDatabaseSnapshot(): Promise<DemoDatabase> {
    return this.getDb();
  }
}

export const demoRepository: DemoRepository = new LocalDemoRepository();
