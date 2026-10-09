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

  // Learning
  getCourses(userId?: string): Promise<Course[]>;
  getCourse(courseId: string): Promise<Course | null>;
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
  getContributions(assemblyId: string): Promise<Contribution[]>;
  addAssemblyContribution(input: AssemblyContributionInput): Promise<Contribution>;
  getProposition(propositionId: string): Promise<Proposition | null>;
  finaliseProposition(input: PropositionFinalisationInput): Promise<Proposition>;
  updateAssemblyStage(assemblyId: string, stage: import('../types/domain').AssemblyStage): Promise<Assembly>;

  // Projects
  getProjects(programmeId?: string): Promise<Project[]>;
  getProject(projectId: string): Promise<Project | null>;
  completeProjectMilestone(projectId: string, milestoneId: string, userId: string): Promise<Project>;

  // Events & Sessions
  getEvents(): Promise<Event[]>;
  getEvent(eventId: string): Promise<Event | null>;
  getSession(sessionId: string): Promise<Session | null>;
  rsvpEvent(eventId: string, userId: string): Promise<Event>;

  // Reflections
  getReflections(userId?: string): Promise<Reflection[]>;
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
  getCommunityPosts(groupId: string): Promise<CommunityPost[]>;
  addCommunityPost(post: { groupId: string; authorId: string; title: string; content: string; tags: string[] }): Promise<CommunityPost>;
  addCommunityReply(postId: string, authorId: string, text: string): Promise<CommunityPost>;

  // Moderation
  getModerationCases(): Promise<ModerationCase[]>;
  updateModerationCase(caseId: string, update: Partial<ModerationCase>): Promise<ModerationCase>;

  // Demo operations
  resetDemo(): Promise<void>;
  getDatabaseSnapshot(): Promise<import('../types/domain').DemoDatabase>;
}
