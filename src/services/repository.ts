import {
  User,
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
  Assembly,
  AssemblyRole,
  Contribution,
  Proposition,
  Project,
  Reflection,
  CreditTransaction,
  Notification,
  CommunityGroup,
  CommunityPost,
  ModerationCase,
  CivicIssue,
  Workspace,
  WorkspaceMembership,
  WorkspaceAction,
  WorkspaceAuditEvent,
  WorkspaceActionType,
  CreditAppeal,
  AllocationState,
  AllocationAuditRecord,
} from '../types/domain';
import {
  DashboardData,
  AssignmentSubmissionInput,
  SubmissionReviewInput,
  AssemblyContributionInput,
  PropositionFinalisationInput,
  PassportView,
} from '../types';

export interface DemoRepository {
  // Current user & personas
  getCurrentUser(): Promise<User>;
  getUsers(): Promise<User[]>;
  getUser(userId: string): Promise<User | null>;
  switchUser(userId: string): Promise<User>;
  switchPersona(userId: string): Promise<User>;

  // Dashboard
  getDashboard(userId: string): Promise<DashboardData>;

  // Institutions & Programmes
  getInstitutions(): Promise<Institution[]>;
  getInstitution(id: string): Promise<Institution | null>;
  getProgrammes(): Promise<Programme[]>;
  getProgramme(id: string): Promise<Programme | null>;
  createProgramme(programme: Omit<Programme, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>): Promise<Programme>;
  updateProgramme(programmeId: string, updates: Partial<Programme>): Promise<Programme>;

  // Learning
  getCourses(userId?: string): Promise<Course[]>;
  getCourse(courseId: string): Promise<Course | null>;
  createCourse(course: Omit<Course, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>): Promise<Course>;
  updateCourse(courseId: string, updates: Partial<Course>): Promise<Course>;
  getLessons(courseId: string): Promise<Lesson[]>;
  getLesson(lessonId: string): Promise<Lesson | null>;
  getEnrolment(userId: string, courseId: string): Promise<Enrolment | null>;
  getEnrolments(userId: string): Promise<Enrolment[]>;
  enrolInCourse(userId: string, courseId: string): Promise<Enrolment>;
  completeLesson(userId: string, lessonId: string): Promise<{ enrolment: Enrolment; creditTransaction?: CreditTransaction }>;

  // Assignments & Submissions
  getAssignments(courseId?: string): Promise<Assignment[]>;
  getAssignment(assignmentId: string): Promise<Assignment | null>;
  getSubmissions(userId?: string, assignmentId?: string): Promise<Submission[]>;
  getSubmission(submissionId: string): Promise<Submission | null>;
  saveAssignmentDraft(input: AssignmentSubmissionInput): Promise<Submission>;
  submitAssignment(input: AssignmentSubmissionInput): Promise<Submission>;
  reviewSubmission(input: SubmissionReviewInput): Promise<Submission>;

  // Evidence
  getEvidenceList(options?: { ownerId?: string; visibility?: string; verificationStatus?: string }): Promise<Evidence[]>;
  getEvidence(evidenceId: string): Promise<Evidence | null>;
  addEvidence(evidence: Omit<Evidence, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>): Promise<Evidence>;

  // Assemblies & Deliberation
  getAssemblies(userId?: string): Promise<Assembly[]>;
  getAssembly(assemblyId: string, actorId?: string): Promise<Assembly | null>;
  getAssemblyRoles(assemblyId: string): Promise<AssemblyRole[]>;
  getUserAssemblyRole(assemblyId: string, userId: string): Promise<AssemblyRole | null>;
  joinAssembly(assemblyId: string, userId: string, preferredRole?: import('../types/domain').AssemblyRoleType): Promise<{ assembly: Assembly; role: AssemblyRole; creditTransaction?: CreditTransaction }>;
  overrideAssemblyRole(
    assemblyId: string,
    actorId: string,
    targetUserId: string,
    newRole: import('../types/domain').AssemblyRoleType | string,
    reason: string,
    newSecondaryRole?: import('../types/domain').AssemblyRoleType | null
  ): Promise<AssemblyRole>;
  leaveAssembly(assemblyId: string, userId: string, actorId?: string): Promise<{ assembly: Assembly }>;
  getAssemblyRoleAllocations(assemblyId: string, actorId?: string): Promise<Record<string, AllocationState>>;
  finalizeAssemblyRoleAllocation(assemblyId: string, roleName: string, actorId?: string): Promise<Assembly>;
  approveAssemblyRoleException(
    assemblyId: string,
    roleName: string,
    reason: string,
    actorId?: string
  ): Promise<{ assembly: Assembly; audit: AllocationAuditRecord }>;
  updateAssemblyRoleCapacity(
    assemblyId: string,
    roleName: string,
    newTotalPlaces: number,
    actorId?: string
  ): Promise<Assembly>;
  getContributions(assemblyId: string): Promise<Contribution[]>;
  addAssemblyContribution(input: AssemblyContributionInput): Promise<Contribution>;
  getProposition(propositionId: string): Promise<Proposition | null>;
  updateProposition(input: {
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
  }): Promise<Proposition>;
  recordPropositionResponse(input: {
    propositionId: string;
    userId: string;
    responseState: import('../types/domain').ParticipantResponseState;
    reasonOrReservations?: string;
  }): Promise<Proposition>;
  finaliseProposition(input: PropositionFinalisationInput & { actorId?: string }): Promise<Proposition>;
  updateAssemblyStage(assemblyId: string, stage: import('../types/domain').AssemblyStage, actorId?: string): Promise<Assembly>;
  executeRolePowerAction(input: {
    assemblyId: string;
    userId: string;
    power: import('../types/domain').AssemblyRolePower;
    title: string;
    description: string;
    responseObligation?: string;
  }): Promise<import('../types/domain').AssemblyRoleAction>;
  respondToRolePowerAction(input: {
    assemblyId: string;
    actionId: string;
    userId: string;
    responseNote: string;
  }): Promise<import('../types/domain').AssemblyRoleAction>;
  requestAssemblySpeakingTurn(assemblyId: string, userId: string): Promise<Assembly>;
  recognizeAssemblySpeaker(assemblyId: string, actorId: string, targetUserId: string): Promise<Assembly>;
  releaseAssemblySpeaker(assemblyId: string, actorId: string): Promise<Assembly>;

  // Projects
  getProjects(programmeId?: string): Promise<Project[]>;
  getProject(projectId: string): Promise<Project | null>;
  completeProjectMilestone(projectId: string, milestoneId: string, userId: string): Promise<Project>;
  addProjectNote(projectId: string, note: { authorId: string; text: string }): Promise<Project>;
  addProjectEvidence(projectId: string, evidenceId: string): Promise<Project>;
  createProject(project: Omit<Project, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>): Promise<Project>;
  updateProject(projectId: string, updates: Partial<Project>): Promise<Project>;

  // Events & Sessions
  getEvents(): Promise<Event[]>;
  getEvent(eventId: string): Promise<Event | null>;
  getSession(sessionId: string): Promise<Session | null>;
  getSessionByEvent(eventId: string): Promise<Session | null>;
  acknowledgeRulebook(sessionId: string, userId: string): Promise<Session>;
  requestSpeakingTurn(sessionId: string, userId: string): Promise<Session>;
  cancelSpeakingTurn(sessionId: string, userId: string): Promise<Session>;
  recognizeSpeakingTurn(sessionId: string, actorId: string, targetUserId: string): Promise<Session>;
  advanceSpeakingTurn(sessionId: string, actorId: string): Promise<Session>;
  advanceDebatePhase(sessionId: string, actorId: string, nextPhase: import('../types/domain').DebatePhase): Promise<Session>;
  postDebateContribution(input: { sessionId: string; userId: string; text: string; evidenceIds?: string[] }): Promise<Session>;
  switchSessionMode(sessionId: string, actorId: string, targetMode: import('../types/domain').SessionMode, summary?: string): Promise<Session>;
  rsvpEvent(eventId: string, userId: string, status?: 'attending' | 'maybe' | 'declined', actorId?: string): Promise<Event>;
  checkInEvent(eventId: string, userId: string, actorId?: string): Promise<{ event: Event; activity?: Activity }>;
  updateEventCapacity(eventId: string, newCapacity: number, actorId?: string): Promise<Event>;
  finalizeEventAllocation(eventId: string, actorId?: string): Promise<Event>;
  approveEventAllocationException(eventId: string, reason: string, actorId?: string): Promise<{ event: Event; audit: import('../types/domain').AllocationAuditRecord }>;
  getAllocationAudits(allocationId?: string, actorId?: string): Promise<import('../types/domain').AllocationAuditRecord[]>;

  // Activities
  getActivities(userId?: string): Promise<Activity[]>;
  addActivity(activity: Omit<Activity, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>): Promise<Activity>;

  // Reflections
  getReflections(userId?: string): Promise<Reflection[]>;
  getCivicReflections(userId?: string): Promise<Reflection[]>;
  getUhvReflections(userId?: string): Promise<Reflection[]>;
  getReflection(reflectionId: string): Promise<Reflection | null>;
  getSessionReflections(sessionId: string, userId?: string): Promise<Reflection[]>;
  addReflection(reflection: Omit<Reflection, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>): Promise<Reflection>;

  // Passport & Credits
  getPassport(userId: string): Promise<PassportView>;
  getCredits(userId: string): Promise<CreditTransaction[]>;
  addCredit(transaction: Omit<CreditTransaction, 'id' | 'schemaVersion' | 'createdAt'>): Promise<CreditTransaction>;
  requestCreditAppeal(params: {
    userId: string;
    targetType: 'credit' | 'submission' | 'passport';
    targetId: string;
    reason: string;
  }): Promise<CreditAppeal>;
  getCreditAppeals(userId?: string): Promise<CreditAppeal[]>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  markNotificationRead(notificationId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Community
  getCommunityGroups(): Promise<CommunityGroup[]>;
  getCommunityGroup(groupId: string): Promise<CommunityGroup | null>;
  joinCommunityGroup(groupId: string, userId: string): Promise<CommunityGroup>;
  leaveCommunityGroup(groupId: string, userId: string): Promise<CommunityGroup>;
  getCommunityPosts(groupId: string): Promise<CommunityPost[]>;
  addCommunityPost(post: { groupId: string; authorId: string; title: string; content: string; tags: string[] }): Promise<CommunityPost>;
  addCommunityReply(postId: string, authorId: string, text: string): Promise<CommunityPost>;
  likeCommunityPost(postId: string, userId: string): Promise<CommunityPost>;

  // Civic Issues Map
  getCivicIssues(): Promise<CivicIssue[]>;
  getCivicIssue(issueId: string): Promise<CivicIssue | null>;
  upvoteCivicIssue(issueId: string, userId: string): Promise<CivicIssue>;
  reportCivicIssue(issue: Omit<CivicIssue, 'id' | 'reportsCount' | 'schemaVersion' | 'createdAt' | 'updatedAt'>): Promise<CivicIssue>;

  // Moderation
  getModerationCases(): Promise<ModerationCase[]>;
  updateModerationCase(caseId: string, update: Partial<ModerationCase>): Promise<ModerationCase>;

  // Workspace Collaboration (Master PRD §A12, §A13, §A20.4, §A21)
  getWorkspaces(userId?: string): Promise<Workspace[]>;
  getWorkspace(workspaceId: string, callerUserId?: string): Promise<Workspace | null>;
  getWorkspaceMemberships(workspaceId: string, callerUserId: string): Promise<WorkspaceMembership[]>;
  getWorkspaceMembership(workspaceId: string, userId: string, callerUserId?: string): Promise<WorkspaceMembership | null>;
  searchUsersForInvite(query: string, callerUserId: string, workspaceId: string): Promise<User[]>;
  inviteUserToWorkspace(params: { workspaceId: string; inviterId: string; usernameOrId: string }): Promise<WorkspaceMembership>;
  respondToWorkspaceInvite(params: { workspaceId: string; userId: string; accept: boolean; reason?: string }): Promise<WorkspaceMembership>;
  acknowledgeWorkspaceRules(params: { workspaceId: string; userId: string; version: string }): Promise<WorkspaceMembership>;
  getWorkspaceActions(workspaceId: string, callerUserId: string): Promise<WorkspaceAction[]>;
  createWorkspaceAction(params: {
    workspaceId: string;
    authorId: string;
    actionType: WorkspaceActionType;
    title: string;
    content: string;
    sourceLink?: WorkspaceAction['sourceLink'];
    tags?: string[];
  }): Promise<WorkspaceAction>;
  moderateWorkspaceAction(params: {
    workspaceId: string;
    moderatorId: string;
    actionId: string;
    action: 'freeze' | 'remove' | 'unfreeze';
    reason: string;
  }): Promise<WorkspaceAction>;
  moderateWorkspaceMember(params: {
    workspaceId: string;
    moderatorId: string;
    targetUserId: string;
    newStatus: 'restricted' | 'removed' | 'active';
    reason: string;
  }): Promise<WorkspaceMembership>;
  reportWorkspaceContent(params: {
    workspaceId: string;
    reporterId: string;
    targetActionId?: string;
    targetUserId?: string;
    reason: string;
  }): Promise<WorkspaceAuditEvent>;
  getWorkspaceAuditEvents(workspaceId: string, callerUserId: string): Promise<WorkspaceAuditEvent[]>;

  // Demo operations
  resetDemo(): Promise<void>;
  getDatabaseSnapshot(): Promise<import('../types/domain').DemoDatabase>;
}
