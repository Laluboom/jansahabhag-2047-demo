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
  getAssembly(assemblyId: string): Promise<Assembly | null>;
  getAssemblyRoles(assemblyId: string): Promise<AssemblyRole[]>;
  getUserAssemblyRole(assemblyId: string, userId: string): Promise<AssemblyRole | null>;
  joinAssembly(assemblyId: string, userId: string): Promise<{ assembly: Assembly; role: AssemblyRole; creditTransaction?: CreditTransaction }>;
  getContributions(assemblyId: string): Promise<Contribution[]>;
  addAssemblyContribution(input: AssemblyContributionInput): Promise<Contribution>;
  getProposition(propositionId: string): Promise<Proposition | null>;
  updateProposition(input: {
    propositionId: string;
    updatedBy: string;
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
    dissent?: import('../types/domain').DissentRecord[];
    supportProfile?: import('../types/domain').SupportProfile;
  }): Promise<Proposition>;
  finaliseProposition(input: PropositionFinalisationInput): Promise<Proposition>;
  updateAssemblyStage(assemblyId: string, stage: import('../types/domain').AssemblyStage): Promise<Assembly>;

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
  rsvpEvent(eventId: string, userId: string, status?: 'attending' | 'maybe' | 'declined'): Promise<Event>;
  checkInEvent(eventId: string, userId: string): Promise<{ event: Event; activity?: Activity }>;

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

  // Demo operations
  resetDemo(): Promise<void>;
  getDatabaseSnapshot(): Promise<import('../types/domain').DemoDatabase>;
}
