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
  SessionMode,
  DebatePhase,
  DEBATE_PHASES,
  SpeakingQueueEntry,
  DebateContribution,
  DebateRoomData,
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
  CivicIssue,
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

  private calculateUserCredits(db: DemoDatabase, userId: string): number {
    return db.credits
      .filter((c) => {
        if (c.userId !== userId) return false;
        if (this.isUhvCredit(c, db)) return false;
        return true;
      })
      .reduce((sum, c) => sum + c.amount, 0);
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

  // Dashboard
  async getDashboard(userId: string): Promise<DashboardData> {
    const db = this.getDb();
    const user = db.users.find((u) => u.id === userId) || db.users[0];
    const clonedUser = JSON.parse(JSON.stringify(user));
    const userCredits = this.calculateUserCredits(db, userId);
    clonedUser.totalCredits = userCredits;

    const activeUserId = db.activeUserId;
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
    const events = db.events.filter((e) => e.attendeeUserIds.includes(userId) || e.organizerId === userId);
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

    const credits = db.credits.filter((c) => c.userId === userId);
    const totalCredits = userCredits;

    const breakdown: Record<CreditDimension, number> = {
      Learning: 0,
      Observation: 0,
      Deliberation: 0,
      Reflection: 0,
      Contribution: 0,
      'Civic Action': 0,
    };

    credits.forEach((c) => {
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
            rewardText: '+10 Credits on Submit',
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
            badgeText: isUhvCourse ? `${course.code} &bull; Next Module` : `${course.code} &bull; Next Lesson`,
            rewardText: isUhvCourse ? 'Self-Exploration' : '+5 Learning Credits',
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
        rewardText: isJoined ? 'Deliberation Chamber' : '+10 Credits on Join',
      };
    }

    return {
      user: clonedUser,
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
            amount: 5,
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
            creditsAwarded: 5,
            evidenceIds: [],
            sourceReferenceId: lessonId,
            sourceReferenceType: 'lesson',
            isVerified: true,
            schemaVersion: 1,
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
              isVerified: true,
              schemaVersion: 1,
            });
          }
        }

        // Notification
        db.notifications.push({
          id: generateId('notif'),
          userId,
          title: 'Lesson Completed!',
          message: `You completed "${lesson.title}" and earned 5 Learning Credits.`,
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
    let subs = db.submissions;
    if (userId) subs = subs.filter((s) => s.userId === userId);
    if (assignmentId) subs = subs.filter((s) => s.assignmentId === assignmentId);

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
    const now = new Date().toISOString();
    const asg = db.assignments.find((a) => a.id === input.assignmentId);
    const isUhv = asg ? this.isUhvAssignment(asg, db) : input.assignmentId === 'asg_uhv_08';

    const existing = db.submissions.find(
      (s) => s.assignmentId === input.assignmentId && s.userId === input.userId
    );

    if (existing && (existing.status === 'verified' || existing.status === 'under_review')) {
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
    const now = new Date().toISOString();
    const asg = db.assignments.find((a) => a.id === input.assignmentId);
    const isUhv = asg ? this.isUhvAssignment(asg, db) : input.assignmentId === 'asg_uhv_08';

    const existing = db.submissions.find(
      (s) => s.assignmentId === input.assignmentId && s.userId === input.userId
    );

    if (existing && (existing.status === 'verified' || existing.status === 'under_review')) {
      throw new Error(`Cannot modify submission with status '${existing.status}'`);
    }

    let submission: Submission;
    const finalStatus: 'completed' | 'submitted' = isUhv ? 'completed' : 'submitted';

    if (existing) {
      existing.content = input.content;
      existing.evidenceIds = isUhv ? [] : input.evidenceIds || [];
      existing.status = finalStatus;
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
        id: generateId('sub'),
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

    // Submission credit: +10 Contribution once per submission, idempotent on retries
    const existingCredit = db.credits.find(
      (c) => c.userId === input.userId && c.sourceType === 'assignment' && c.sourceId === input.assignmentId
    );
    if (!existingCredit) {
      db.credits.push({
        id: generateId('tx'),
        userId: input.userId,
        dimension: 'Contribution',
        amount: 10,
        sourceType: 'assignment',
        sourceId: input.assignmentId,
        status: 'Verified',
        reason: `Submitted assignment: ${asg?.title || input.assignmentId}`,
        createdAt: now,
        schemaVersion: 1,
      });

      const user = db.users.find((u) => u.id === input.userId);
      if (user) {
        user.totalCredits = this.calculateUserCredits(db, input.userId);
        user.updatedAt = now;
      }
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
    const submission = db.submissions.find((s) => s.id === input.submissionId);
    if (!submission) throw new Error(`Submission ${input.submissionId} not found`);

    if (this.isUhvSubmission(submission, db)) {
      throw new Error('Teacher review and scoring are not permitted for private UHV reflections.');
    }

    if (submission.status === 'draft') {
      throw new Error('Cannot review a draft submission');
    }

    if (submission.status === 'verified') {
      if (input.status === 'verified') {
        // Idempotent retry for already verified submission
        return JSON.parse(JSON.stringify(submission));
      }
      throw new Error('Cannot change status of an already verified submission');
    }

    const now = new Date().toISOString();
    submission.status = input.status;
    submission.teacherFeedback = input.teacherFeedback;
    submission.reviewerId = input.reviewerId;
    submission.reviewedAt = now;
    if (input.score !== undefined) submission.score = input.score;
    submission.updatedAt = now;

    const asg = db.assignments.find((a) => a.id === submission.assignmentId);

    if (input.status === 'verified') {
      // 1. Mark attached evidence verified and award +5 Observation credit per evidence (idempotently)
      submission.evidenceIds.forEach((eid) => {
        const ev = db.evidence.find((e) => e.id === eid);
        if (ev) {
          ev.verificationStatus = 'verified';
          ev.updatedAt = now;

          const existingEvCredit = db.credits.find(
            (c) => c.userId === submission.userId && c.sourceType === 'evidence' && c.sourceId === eid
          );
          if (!existingEvCredit) {
            db.credits.push({
              id: generateId('tx'),
              userId: submission.userId,
              dimension: 'Observation',
              amount: 5,
              sourceType: 'evidence',
              sourceId: eid,
              status: 'Verified',
              reason: `Verified field evidence: ${ev.title}`,
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
        if (!existingObsCredit) {
          db.credits.push({
            id: generateId('tx'),
            userId: submission.userId,
            dimension: 'Observation',
            amount: 5,
            sourceType: 'assignment',
            sourceId: submission.assignmentId,
            status: 'Verified',
            reason: `Verified assignment fieldwork: ${asg?.title || submission.assignmentId}`,
            createdAt: now,
            schemaVersion: 1,
          });
        }
      }

      // 2. Traceable Passport Entry (idempotent)
      const existingPassport = db.passportEntries.find(
        (p) => p.userId === submission.userId && p.sourceReferenceId === submission.id
      );
      if (!existingPassport) {
        db.passportEntries.push({
          id: generateId('pass'),
          userId: submission.userId,
          category: 'contribution',
          title: `Verified: ${asg?.title || 'Field Assignment'}`,
          subtitle: `Reviewed and verified by teacher`,
          date: now.split('T')[0],
          creditsAwarded: submission.evidenceIds.length > 0 ? submission.evidenceIds.length * 5 : 5,
          evidenceIds: submission.evidenceIds,
          sourceReferenceId: submission.id,
          sourceReferenceType: 'submission',
          isVerified: true,
          schemaVersion: 1,
        });
      }

      // Update user credits
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

  async joinAssembly(
    assemblyId: string,
    userId: string
  ): Promise<{ assembly: Assembly; role: AssemblyRole; creditTransaction?: CreditTransaction }> {
    const db = this.getDb();
    const assembly = db.assemblies.find((a) => a.id === assemblyId);
    if (!assembly) throw new Error(`Assembly ${assemblyId} not found`);

    const user = db.users.find((u) => u.id === userId);
    const now = new Date().toISOString();

    // Check or assign role
    let role = db.assemblyRoles.find((r) => r.assemblyId === assemblyId && r.userId === userId);
    if (!role) {
      const defaultRoleTypes: import('../types/domain').AssemblyRoleType[] = [
        'Questioner',
        'Evidence Analyst',
        'Civic Advocate',
        'Synthesiser',
        'Community Voice',
        'Rapporteur',
      ];
      const assignedRoleName =
        defaultRoleTypes[
          db.assemblyRoles.filter((r) => r.assemblyId === assemblyId).length % defaultRoleTypes.length
        ];
      role = {
        id: generateId('role'),
        assemblyId,
        userId,
        roleName: assignedRoleName,
        responsibilities: [
          'Examine proposed solutions for unaddressed risks and implementation bottlenecks',
          'Formulate constructive inquiry prompts that test data assumptions',
          'Ensure vulnerable user groups are considered in the final proposition',
        ],
        badgeIcon: 'HelpCircle',
        promptSuggestions: [
          'What specific traffic calming measures will physically force vehicles to slow down?',
          'How will we ensure the raised crosswalk does not cause drainage waterlogging?',
          'What is the maintenance timeline if safety lights malfunction?',
        ],
        schemaVersion: 1,
        createdAt: now,
        updatedAt: now,
      };
      db.assemblyRoles.push(role);
    }

    let creditTx: CreditTransaction | undefined;
    const isAlreadyParticipant = assembly.participantUserIds.includes(userId);

    if (!isAlreadyParticipant) {
      assembly.participantUserIds.push(userId);
      assembly.updatedAt = now;

      // Award +10 Deliberation credit (idempotent)
      const existingCredit = db.credits.find(
        (c) => c.userId === userId && c.sourceType === 'assembly' && c.sourceId === assemblyId
      );
      if (!existingCredit) {
        creditTx = {
          id: generateId('tx'),
          userId,
          dimension: 'Deliberation',
          amount: 10,
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
          creditsAwarded: 10,
          evidenceIds: assembly.evidenceIds.slice(0, 2),
          sourceReferenceId: assemblyId,
          sourceReferenceType: 'assembly',
          isVerified: true,
          schemaVersion: 1,
        });
      }

      // Create Notification
      db.notifications.push({
        id: generateId('notif'),
        userId,
        title: 'Admitted to Youth Assembly',
        message: `You joined "${assembly.title}" as ${role.roleName} and earned 10 Deliberation Credits.`,
        type: 'assembly',
        isRead: false,
        targetRoute: `/assemblies/${assemblyId}`,
        createdAt: now,
        schemaVersion: 1,
      });

      this.saveDb(db);
    }

    return {
      assembly: JSON.parse(JSON.stringify(assembly)),
      role: JSON.parse(JSON.stringify(role)),
      creditTransaction: creditTx ? JSON.parse(JSON.stringify(creditTx)) : undefined,
    };
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

    // Ensure user is marked as participant if contributing
    if (!assembly.participantUserIds.includes(input.userId)) {
      assembly.participantUserIds.push(input.userId);
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

    // Credit transaction for substantive contribution (+5 Deliberation once per unique contribution)
    const creditTx: CreditTransaction = {
      id: generateId('tx'),
      userId: input.userId,
      dimension: 'Deliberation',
      amount: 5,
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
      creditsAwarded: 5,
      evidenceIds: input.evidenceIds || [],
      sourceReferenceId: newContrib.id,
      sourceReferenceType: 'contribution',
      isVerified: true,
      schemaVersion: 1,
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
  }): Promise<Proposition> {
    const db = this.getDb();
    const prop = db.propositions.find((p) => p.id === input.propositionId);
    if (!prop) throw new Error(`Proposition ${input.propositionId} not found`);

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
    if (input.dissent !== undefined) prop.dissent = input.dissent;
    if (input.supportProfile !== undefined) prop.supportProfile = input.supportProfile;

    prop.version += 1;
    prop.revisions.push({
      version: prop.version,
      updatedBy: input.updatedBy,
      changesSummary: input.changesSummary || `Updated proposition draft (v${prop.version})`,
      timestamp: now,
    });
    prop.updatedAt = now;

    this.saveDb(db);
    return JSON.parse(JSON.stringify(prop));
  }

  async finaliseProposition(input: PropositionFinalisationInput): Promise<Proposition> {
    const db = this.getDb();
    const proposition = db.propositions.find((p) => p.id === input.propositionId);
    if (!proposition) throw new Error(`Proposition ${input.propositionId} not found`);

    const assembly = db.assemblies.find((a) => a.id === input.assemblyId);

    // Prevent duplicate finalisation
    const isAlreadyFinalised =
      (assembly?.currentStage === 'outcome' && assembly?.status === 'concluded') ||
      Boolean(proposition.revisions.some((r) => r.changesSummary?.toLowerCase().includes('final outcome resolved')));

    if (isAlreadyFinalised) {
      throw new Error('Proposition has already been finalised and cannot be finalised again.');
    }

    const now = new Date().toISOString();
    proposition.outcome = input.outcome;
    proposition.version += 1;
    if (input.nextStep) proposition.nextStep = input.nextStep;

    proposition.revisions.push({
      version: proposition.version,
      updatedBy: input.updatedBy,
      changesSummary: input.changesSummary || `Final outcome resolved to ${input.outcome} by ${input.updatedBy}`,
      timestamp: now,
    });
    proposition.updatedAt = now;

    // Advance assembly stage to outcome and status to concluded
    if (assembly) {
      assembly.currentStage = 'outcome';
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
          (p) => p.userId === uid && p.sourceReferenceId === proposition.id && p.category === 'deliberation'
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
            isVerified: true,
            schemaVersion: 1,
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

      // 1. Award +10 Civic Action credit (strictly idempotent)
      const existingCredit = db.credits.find(
        (c) => c.userId === userId && c.sourceType === 'project' && c.sourceId === milestoneId
      );
      if (!existingCredit) {
        db.credits.push({
          id: generateId('tx'),
          userId,
          dimension: 'Civic Action',
          amount: 10,
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
          creditsAwarded: 10,
          evidenceIds: project.evidenceIds.slice(0, 2),
          sourceReferenceId: milestoneId,
          sourceReferenceType: 'project_milestone',
          isVerified: true,
          schemaVersion: 1,
        });
      }

      // 4. Create Notification
      db.notifications.push({
        id: generateId('notif'),
        userId,
        title: 'Project Milestone Completed!',
        message: `You completed "${milestone.title}" in ${project.title} and earned 10 Civic Action Credits.`,
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

  async getSessionByEvent(eventId: string): Promise<Session | null> {
    const db = this.getDb();
    const sess = db.sessions.find((s) => s.eventId === eventId);
    if (sess) {
      return JSON.parse(JSON.stringify(sess));
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
    return mockSession;
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
    return JSON.parse(JSON.stringify(session));
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
    return JSON.parse(JSON.stringify(session));
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
    return JSON.parse(JSON.stringify(session));
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
    return JSON.parse(JSON.stringify(session));
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
    if (actorId !== session.facilitatorId) {
      throw new Error(`Unauthorized actor action: only facilitator (${session.facilitatorId}) can advance speaking turns`);
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
    return JSON.parse(JSON.stringify(session));
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
    return JSON.parse(JSON.stringify(session));
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
    return JSON.parse(JSON.stringify(session));
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

    return JSON.parse(JSON.stringify(session));
  }

  async rsvpEvent(
    eventId: string,
    userId: string,
    status: 'attending' | 'maybe' | 'declined' = 'attending'
  ): Promise<Event> {
    const db = this.getDb();
    const evt = db.events.find((e) => e.id === eventId);
    if (!evt) throw new Error(`Event ${eventId} not found`);

    const now = new Date().toISOString();
    evt.attendeeUserIds = evt.attendeeUserIds || [];
    evt.rsvpMap = evt.rsvpMap || {};
    evt.rsvpMap[userId] = status;

    if (status === 'attending') {
      if (!evt.attendeeUserIds.includes(userId)) {
        evt.attendeeUserIds.push(userId);
      }
    } else if (status === 'declined') {
      evt.attendeeUserIds = evt.attendeeUserIds.filter((id) => id !== userId);
    }
    evt.updatedAt = now;

    this.saveDb(db);
    return JSON.parse(JSON.stringify(evt));
  }

  async checkInEvent(
    eventId: string,
    userId: string
  ): Promise<{ event: Event; activity?: Activity }> {
    const db = this.getDb();
    const evt = db.events.find((e) => e.id === eventId);
    if (!evt) throw new Error(`Event ${eventId} not found`);

    const now = new Date().toISOString();
    evt.checkedInUserIds = evt.checkedInUserIds || [];

    let act: Activity | undefined;
    if (!evt.checkedInUserIds.includes(userId)) {
      evt.checkedInUserIds.push(userId);
      if (!evt.attendeeUserIds.includes(userId)) {
        evt.attendeeUserIds.push(userId);
      }
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
      event: JSON.parse(JSON.stringify(evt)),
      activity: act ? JSON.parse(JSON.stringify(act)) : undefined,
    };
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
    const activeUserId = db.activeUserId;
    const refls = db.reflections.filter((r) => {
      if (userId && r.userId !== userId) return false;
      if (this.isUhvReflectionRecord(r, db)) return false;
      // In this single-browser simulation, private session reflections are visible only to their owner
      if (r.contextType === 'session') {
        return r.userId === activeUserId;
      }
      return true;
    });
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
    // Credit transaction (+5 Reflection)
    db.credits.push({
      id: generateId('tx'),
      userId: reflection.userId,
      dimension: 'Reflection',
      amount: 5,
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
      creditsAwarded: 5,
      evidenceIds: [],
      sourceReferenceId: newRefl.id,
      sourceReferenceType: 'reflection',
      isVerified: true,
      schemaVersion: 1,
    });

    // Notification
    db.notifications.push({
      id: generateId('notif'),
      userId: reflection.userId,
      title: 'Reflection Recorded',
      message: 'You shared a reflection and earned 5 Reflection Credits in your Passport.',
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
    const user = db.users.find((u) => u.id === userId) || db.users[0];
    const entries = db.passportEntries.filter((p) => {
      if (p.userId !== userId) return false;
      if (this.isUhvPassportEntry(p, db)) return false;
      return true;
    });
    const credits = db.credits.filter((c) => {
      if (c.userId !== userId) return false;
      if (this.isUhvCredit(c, db)) return false;
      return true;
    });
    const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0);

    const creditsByDimension: Record<CreditDimension, number> = {
      Learning: 0,
      Observation: 0,
      Deliberation: 0,
      Reflection: 0,
      Contribution: 0,
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
    const completedCourses = db.enrolments.filter((e) => {
      if (e.userId !== userId || e.status !== 'completed') return false;
      const course = db.courses.find((c) => c.id === e.courseId);
      return course?.track !== 'uhv';
    });
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
    const credits = db.credits.filter((c) => {
      if (c.userId !== userId) return false;
      if (this.isUhvCredit(c, db)) return false;
      return true;
    });
    return JSON.parse(JSON.stringify(credits));
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
