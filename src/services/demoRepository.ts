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
  DemoDatabase,
  AssemblyStage,
  CreditDimension,
} from '../types/domain';
import {
  DashboardData,
  AssignmentSubmissionInput,
  SubmissionReviewInput,
  AssemblyContributionInput,
  PropositionFinalisationInput,
  PassportView,
} from '../types';
import { DemoRepository } from './repository';
import { PersistenceService } from './persistence';
import { generateId } from '../utils/id';

export class LocalDemoRepository implements DemoRepository {
  private getDb(): DemoDatabase {
    return PersistenceService.loadDatabase();
  }

  private saveDb(db: DemoDatabase): void {
    PersistenceService.saveDatabase(db);
  }

  // Users & Personas
  async getCurrentUser(): Promise<User> {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === db.activeUserId) || db.users[0];
    return JSON.parse(JSON.stringify(user));
  }

  async getUsers(): Promise<User[]> {
    const db = this.getDb();
    return JSON.parse(JSON.stringify(db.users));
  }

  async getUser(userId: string): Promise<User | null> {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === userId);
    return user ? JSON.parse(JSON.stringify(user)) : null;
  }

  async switchUser(userId: string): Promise<User> {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    db.activeUserId = userId;
    this.saveDb(db);
    return JSON.parse(JSON.stringify(user));
  }

  // Dashboard
  async getDashboard(userId: string): Promise<DashboardData> {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === userId) || db.users[0];
    const enrolments = db.enrolments.filter((e) => e.userId === userId);
    const activities = db.activities
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const events = db.events.filter((e) => e.attendeeUserIds.includes(userId) || e.organizerId === userId);
    const assemblies = db.assemblies.filter((a) => a.participantUserIds.includes(userId) || a.facilitatorId === userId);
    const submissions = db.submissions.filter((s) => s.userId === userId);
    const submittedAsgIds = submissions.map((s) => s.assignmentId);
    const pendingAssignments = db.assignments.filter((a) => !submittedAsgIds.includes(a.id));
    const notifications = db.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const credits = db.credits.filter((c) => c.userId === userId);
    const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);

    const breakdown: Record<CreditDimension, number> = {
      Learning: 0,
      Observation: 0,
      Deliberation: 0,
      Reflection: 0,
      'Civic Action': 0,
    };

    credits.forEach((c) => {
      if (breakdown[c.dimension] !== undefined) {
        breakdown[c.dimension] += c.amount;
      }
    });

    const passportEntries = db.passportEntries.filter((p) => p.userId === userId);

    return {
      user: JSON.parse(JSON.stringify(user)),
      activeEnrolments: JSON.parse(JSON.stringify(enrolments)),
      recentActivities: JSON.parse(JSON.stringify(activities.slice(0, 8))),
      upcomingEvents: JSON.parse(JSON.stringify(events)),
      activeAssemblies: JSON.parse(JSON.stringify(assemblies)),
      pendingAssignments: JSON.parse(JSON.stringify(pendingAssignments)),
      recentNotifications: JSON.parse(JSON.stringify(notifications.slice(0, 5))),
      creditSummary: {
        total: totalCredits,
        breakdown,
      },
      passportEntriesCount: passportEntries.length,
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

      if (enrolment.progressPercent >= 100) {
        enrolment.status = 'completed';
        enrolment.completedAt = now;
      } else {
        enrolment.status = 'in_progress';
      }
      enrolment.updatedAt = now;

      // Create credit transaction for lesson
      creditTx = {
        id: generateId('tx'),
        userId,
        dimension: 'Learning',
        amount: 5,
        sourceType: 'lesson',
        sourceId: lessonId,
        status: 'Verified',
        reason: `Completed lesson: ${lesson.title}`,
        createdAt: now,
        schemaVersion: 1,
      };
      db.credits.push(creditTx);

      // Create activity record
      db.activities.push({
        id: generateId('act'),
        userId,
        type: 'lesson_completed',
        title: `Completed Lesson: ${lesson.title}`,
        description: `Progress in ${lesson.courseId} reached ${enrolment.progressPercent}%`,
        referenceId: lessonId,
        referenceType: 'lesson',
        timestamp: now,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      });

      // Update user total credits
      const user = db.users.find((u) => u.id === userId);
      if (user) {
        user.totalCredits += 5;
        user.updatedAt = now;
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
    let subs = db.submissions;
    if (userId) subs = subs.filter((s) => s.userId === userId);
    if (assignmentId) subs = subs.filter((s) => s.assignmentId === assignmentId);
    return JSON.parse(JSON.stringify(subs));
  }

  async getSubmission(submissionId: string): Promise<Submission | null> {
    const db = this.getDb();
    const sub = db.submissions.find((s) => s.id === submissionId);
    return sub ? JSON.parse(JSON.stringify(sub)) : null;
  }

  async submitAssignment(input: AssignmentSubmissionInput): Promise<Submission> {
    const db = this.getDb();
    const now = new Date().toISOString();
    const existing = db.submissions.find(
      (s) => s.assignmentId === input.assignmentId && s.userId === input.userId
    );

    let submission: Submission;

    if (existing) {
      existing.content = input.content;
      existing.evidenceIds = input.evidenceIds;
      existing.status = 'submitted';
      existing.submittedAt = now;
      existing.updatedAt = now;
      submission = existing;
    } else {
      submission = {
        id: generateId('sub'),
        assignmentId: input.assignmentId,
        userId: input.userId,
        content: input.content,
        evidenceIds: input.evidenceIds,
        status: 'submitted',
        submittedAt: now,
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      };
      db.submissions.push(submission);
    }

    // Activity
    const asg = db.assignments.find((a) => a.id === input.assignmentId);
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

    // Notify teacher
    const teachers = db.users.filter((u) => u.role === 'teacher');
    teachers.forEach((t) => {
      db.notifications.push({
        id: generateId('notif'),
        userId: t.id,
        title: 'New Assignment Submission',
        message: `Submission received for ${asg?.title || 'an assignment'}.`,
        type: 'assignment',
        isRead: false,
        targetRoute: `/assignments/${input.assignmentId}`,
        createdAt: now,
        schemaVersion: 1,
      });
    });

    this.saveDb(db);
    return JSON.parse(JSON.stringify(submission));
  }

  async reviewSubmission(input: SubmissionReviewInput): Promise<Submission> {
    const db = this.getDb();
    const submission = db.submissions.find((s) => s.id === input.submissionId);
    if (!submission) throw new Error(`Submission ${input.submissionId} not found`);

    const now = new Date().toISOString();
    submission.status = input.status;
    submission.teacherFeedback = input.teacherFeedback;
    submission.reviewerId = input.reviewerId;
    submission.reviewedAt = now;
    if (input.score !== undefined) submission.score = input.score;
    submission.updatedAt = now;

    const asg = db.assignments.find((a) => a.id === submission.assignmentId);

    if (input.status === 'verified') {
      const reward = asg?.creditsReward || 10;

      // Credit transaction
      db.credits.push({
        id: generateId('tx'),
        userId: submission.userId,
        dimension: 'Observation',
        amount: reward,
        sourceType: 'assignment',
        sourceId: submission.assignmentId,
        status: 'Verified',
        reason: `Verified assignment: ${asg?.title || submission.assignmentId}`,
        createdAt: now,
        schemaVersion: 1,
      });

      // Update user credits
      const user = db.users.find((u) => u.id === submission.userId);
      if (user) {
        user.totalCredits += reward;
        user.updatedAt = now;
      }

      // Passport entry
      db.passportEntries.push({
        id: generateId('pass'),
        userId: submission.userId,
        category: 'contribution',
        title: `Verified: ${asg?.title || 'Field Assignment'}`,
        subtitle: `Reviewed and verified by teacher`,
        date: now.split('T')[0],
        creditsAwarded: reward,
        evidenceIds: submission.evidenceIds,
        sourceReferenceId: submission.id,
        sourceReferenceType: 'submission',
        isVerified: true,
        schemaVersion: 1,
      });
    }

    // Notify participant
    db.notifications.push({
      id: generateId('notif'),
      userId: submission.userId,
      title: input.status === 'verified' ? 'Assignment Verified!' : 'Revision Requested on Assignment',
      message: input.teacherFeedback.slice(0, 100),
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
    let evs = db.evidence;
    if (options?.ownerId) evs = evs.filter((e) => e.ownerId === options.ownerId);
    if (options?.visibility) evs = evs.filter((e) => e.visibility === options.visibility);
    if (options?.verificationStatus) evs = evs.filter((e) => e.verificationStatus === options.verificationStatus);
    return JSON.parse(JSON.stringify(evs));
  }

  async getEvidence(evidenceId: string): Promise<Evidence | null> {
    const db = this.getDb();
    const ev = db.evidence.find((e) => e.id === evidenceId);
    return ev ? JSON.parse(JSON.stringify(ev)) : null;
  }

  async addEvidence(
    evidenceInput: Omit<Evidence, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>
  ): Promise<Evidence> {
    const db = this.getDb();
    const now = new Date().toISOString();
    const newEvidence: Evidence = {
      ...evidenceInput,
      id: generateId('ev'),
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    db.evidence.push(newEvidence);
    this.saveDb(db);
    return JSON.parse(JSON.stringify(newEvidence));
  }

  // Assemblies & Deliberation
  async getAssemblies(userId?: string): Promise<Assembly[]> {
    const db = this.getDb();
    const assemblies = userId
      ? db.assemblies.filter((a) => a.participantUserIds.includes(userId) || a.facilitatorId === userId)
      : db.assemblies;
    return JSON.parse(JSON.stringify(assemblies));
  }

  async getAssembly(assemblyId: string): Promise<Assembly | null> {
    const db = this.getDb();
    const asm = db.assemblies.find((a) => a.id === assemblyId);
    return asm ? JSON.parse(JSON.stringify(asm)) : null;
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
    const now = new Date().toISOString();

    const newContrib: Contribution = {
      id: generateId('contrib'),
      assemblyId: input.assemblyId,
      userId: input.userId,
      userName: user?.name || 'Assembly Member',
      stage: input.stage,
      type: input.type,
      text: input.text,
      evidenceIds: input.evidenceIds || [],
      supportCount: 1,
      dissentCount: 0,
      isSubstantive: input.isSubstantive ?? true,
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    db.contributions.push(newContrib);

    // Credit transaction for contribution
    db.credits.push({
      id: generateId('tx'),
      userId: input.userId,
      dimension: 'Deliberation',
      amount: 5,
      sourceType: 'contribution',
      sourceId: newContrib.id,
      status: 'Verified',
      reason: `Added substantive contribution to assembly: ${input.type}`,
      createdAt: now,
      schemaVersion: 1,
    });

    // Update user credits
    if (user) {
      user.totalCredits += 5;
      user.updatedAt = now;
    }

    // Activity
    db.activities.push({
      id: generateId('act'),
      userId: input.userId,
      type: 'contribution_added',
      title: 'Added Assembly Contribution',
      description: input.text.slice(0, 90),
      referenceId: newContrib.id,
      referenceType: 'contribution',
      timestamp: now,
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

  async finaliseProposition(input: PropositionFinalisationInput): Promise<Proposition> {
    const db = this.getDb();
    const proposition = db.propositions.find((p) => p.id === input.propositionId);
    if (!proposition) throw new Error(`Proposition ${input.propositionId} not found`);

    const now = new Date().toISOString();
    proposition.outcome = input.outcome;
    proposition.version += 1;
    if (input.nextStep) proposition.nextStep = input.nextStep;

    proposition.revisions.push({
      version: proposition.version,
      updatedBy: input.updatedBy,
      changesSummary: input.changesSummary || `Finalised outcome to ${input.outcome}`,
      timestamp: now,
    });
    proposition.updatedAt = now;

    // Advance assembly stage to outcome or concluded
    const assembly = db.assemblies.find((a) => a.id === input.assemblyId);
    if (assembly) {
      assembly.currentStage = 'outcome';
      assembly.status = 'concluded';
      assembly.updatedAt = now;
    }

    this.saveDb(db);
    return JSON.parse(JSON.stringify(proposition));
  }

  async updateAssemblyStage(assemblyId: string, stage: AssemblyStage): Promise<Assembly> {
    const db = this.getDb();
    const assembly = db.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error(`Assembly ${assemblyId} not found`);

    const now = new Date().toISOString();
    assembly.currentStage = stage;
    assembly.updatedAt = now;
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
    milestone.isCompleted = true;
    milestone.completedAt = now;
    project.updatedAt = now;

    // Award credit
    db.credits.push({
      id: generateId('tx'),
      userId,
      dimension: 'Civic Action',
      amount: 10,
      sourceType: 'project',
      sourceId: projectId,
      status: 'Verified',
      reason: `Completed milestone: ${milestone.title}`,
      createdAt: now,
      schemaVersion: 1,
    });

    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.totalCredits += 10;
      user.updatedAt = now;
    }

    this.saveDb(db);
    return JSON.parse(JSON.stringify(project));
  }

  // Events & Sessions
  async getEvents(): Promise<Event[]> {
    const db = this.getDb();
    return JSON.parse(JSON.stringify(db.events));
  }

  async getEvent(eventId: string): Promise<Event | null> {
    const db = this.getDb();
    const evt = db.events.find((e) => e.id === eventId);
    return evt ? JSON.parse(JSON.stringify(evt)) : null;
  }

  async getSession(sessionId: string): Promise<Session | null> {
    const db = this.getDb();
    const sess = db.sessions.find((s) => s.id === sessionId);
    return sess ? JSON.parse(JSON.stringify(sess)) : null;
  }

  async rsvpEvent(eventId: string, userId: string): Promise<Event> {
    const db = this.getDb();
    const evt = db.events.find((e) => e.id === eventId);
    if (!evt) throw new Error(`Event ${eventId} not found`);

    if (!evt.attendeeUserIds.includes(userId)) {
      evt.attendeeUserIds.push(userId);
      evt.updatedAt = new Date().toISOString();
      this.saveDb(db);
    }
    return JSON.parse(JSON.stringify(evt));
  }

  // Reflections
  async getReflections(userId?: string): Promise<Reflection[]> {
    const db = this.getDb();
    const refls = userId ? db.reflections.filter((r) => r.userId === userId) : db.reflections;
    return JSON.parse(JSON.stringify(refls));
  }

  async addReflection(
    reflection: Omit<Reflection, 'id' | 'schemaVersion' | 'createdAt' | 'updatedAt'>
  ): Promise<Reflection> {
    const db = this.getDb();
    const now = new Date().toISOString();
    const newRefl: Reflection = {
      ...reflection,
      id: generateId('refl'),
      schemaVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    db.reflections.push(newRefl);

    // Credit
    db.credits.push({
      id: generateId('tx'),
      userId: reflection.userId,
      dimension: 'Reflection',
      amount: 5,
      sourceType: 'reflection',
      sourceId: newRefl.id,
      status: 'Verified',
      reason: 'Shared reflective essay on civic learning',
      createdAt: now,
      schemaVersion: 1,
    });

    const user = db.users.find((u) => u.id === reflection.userId);
    if (user) {
      user.totalCredits += 5;
      user.updatedAt = now;
    }

    this.saveDb(db);
    return JSON.parse(JSON.stringify(newRefl));
  }

  // Passport & Credits
  async getPassport(userId: string): Promise<PassportView> {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === userId) || db.users[0];
    const entries = db.passportEntries.filter((p) => p.userId === userId);
    const credits = db.credits.filter((c) => c.userId === userId);
    const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);

    const creditsByDimension: Record<CreditDimension, number> = {
      Learning: 0,
      Observation: 0,
      Deliberation: 0,
      Reflection: 0,
      'Civic Action': 0,
    };
    credits.forEach((c) => {
      if (creditsByDimension[c.dimension] !== undefined) {
        creditsByDimension[c.dimension] += c.amount;
      }
    });

    const verifiedEvidence = db.evidence.filter(
      (e) => e.ownerId === userId && e.verificationStatus === 'verified'
    );
    const completedCourses = db.enrolments.filter(
      (e) => e.userId === userId && e.status === 'completed'
    );
    const assemblies = db.assemblies.filter((a) => a.participantUserIds.includes(userId));

    return {
      user: JSON.parse(JSON.stringify(user)),
      entries: JSON.parse(JSON.stringify(entries)),
      credits: JSON.parse(JSON.stringify(credits)),
      totalCredits,
      creditsByDimension,
      verifiedEvidence: JSON.parse(JSON.stringify(verifiedEvidence)),
      completedCoursesCount: completedCourses.length,
      assembliesParticipatedCount: assemblies.length,
    };
  }

  async getCredits(userId: string): Promise<CreditTransaction[]> {
    const db = this.getDb();
    const credits = db.credits.filter((c) => c.userId === userId);
    return JSON.parse(JSON.stringify(credits));
  }

  async addCredit(
    transaction: Omit<CreditTransaction, 'id' | 'schemaVersion' | 'createdAt'>
  ): Promise<CreditTransaction> {
    const db = this.getDb();
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
      user.totalCredits += transaction.amount;
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

  // Moderation
  async getModerationCases(): Promise<ModerationCase[]> {
    const db = this.getDb();
    return JSON.parse(JSON.stringify(db.moderationCases));
  }

  async updateModerationCase(caseId: string, update: Partial<ModerationCase>): Promise<ModerationCase> {
    const db = this.getDb();
    const c = db.moderationCases.find((m) => m.id === caseId);
    if (!c) throw new Error(`Moderation case ${caseId} not found`);

    Object.assign(c, update, { updatedAt: new Date().toISOString() });
    this.saveDb(db);
    return JSON.parse(JSON.stringify(c));
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
