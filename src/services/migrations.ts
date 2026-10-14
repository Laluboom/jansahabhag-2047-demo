import { DemoDatabase } from '../types/domain';
import { CURRENT_SCHEMA_VERSION, getFreshSeedDatabase } from '../data/seed';

export interface Migration {
  version: number;
  migrate: (prev: any) => DemoDatabase;
}

export function normalizeUhvRecords(storedData: any): DemoDatabase {
  if (!storedData || typeof storedData !== 'object') {
    return getFreshSeedDatabase();
  }

  const db: DemoDatabase = storedData as DemoDatabase;

  // 1. Identify UHV courses
  const uhvCourseIds = new Set<string>();
  if (Array.isArray(db.courses)) {
    db.courses.forEach((c) => {
      if (c.track === 'uhv' || c.id === 'course_uhv_leadership_05' || c.id.startsWith('course_uhv_')) {
        uhvCourseIds.add(c.id);
      }
    });
  }
  uhvCourseIds.add('course_uhv_leadership_05');

  // 2. Identify and normalize UHV lessons (remove unapproved dogmatic claims)
  const uhvLessonIds = new Set<string>();
  if (Array.isArray(db.lessons)) {
    db.lessons.forEach((l) => {
      if (uhvCourseIds.has(l.courseId) || l.id.startsWith('les_uhv_')) {
        uhvLessonIds.add(l.id);
        if (l.id === 'les_uhv_501') {
          l.contentSummary = 'Reflecting on trust, mutual respect, and ethical considerations in community life.';
          l.learningObjectives = [
            'Reflect on personal perspectives regarding trust in civic life',
            'Explore questions around mutual respect in community settings',
          ];
          if (Array.isArray(l.sections) && l.sections[0]) {
            l.sections[0].title = '1. Trust & Perspectives in Civic Relationships';
            l.sections[0].body =
              'In exploratory dialogue on community relationships, participants examine what mutual trust means in civic settings. Does assuming good faith or shared intentions help in resolving neighbourhood issues? What questions or challenges arise when intentions and competence conflict? Participants are invited to reflect on their own observations and experiences without adopting any prescribed ideology.';
          }
        } else if (l.id === 'les_uhv_502') {
          l.contentSummary = 'Exploring perspectives on cooperation and shared responsibility in community spaces.';
          l.learningObjectives = [
            'Reflect on personal observations of neighbourhood cooperation',
            'Formulate open questions on community responsibility',
          ];
          if (Array.isArray(l.sections) && l.sections[0]) {
            l.sections[0].title = '1. Exploring Dimensions of Societal Harmony';
            l.sections[0].body =
              'Exploring dimensions of neighbourhood cooperation: How do communities balance education, public health, safety, work, and shared civic infrastructure? This exploratory module invites personal observations on how civic responsibility is experienced in day-to-day community life, highlighting questions and diverse perspectives rather than prescribed doctrinal models.';
          }
        }
      }
    });
  }
  uhvLessonIds.add('les_uhv_501');
  uhvLessonIds.add('les_uhv_502');

  // 3. Identify and normalize UHV assignments (no rubric, no required evidence, 0 credits)
  const uhvAssignmentIds = new Set<string>();
  if (Array.isArray(db.assignments)) {
    db.assignments.forEach((a) => {
      if (
        uhvCourseIds.has(a.courseId) ||
        a.id === 'asg_uhv_08' ||
        a.id.startsWith('asg_uhv_') ||
        a.assignmentType === 'uhv_reflection'
      ) {
        uhvAssignmentIds.add(a.id);
        a.assignmentType = 'uhv_reflection';
        a.rubric = [];
        delete (a as any).requiredEvidenceType;
        a.creditsReward = 0;
        if (a.id === 'asg_uhv_08' && (!a.prompt || a.prompt.includes('400-word'))) {
          a.prompt =
            'Reflect on your personal perspectives, observations, and questions regarding mutual trust and responsibility in shared community spaces. What challenges or insights have you noticed over time? (Optional personal reflection — no required word count or agreement with specific viewpoints).';
        }
      }
    });
  }
  uhvAssignmentIds.add('asg_uhv_08');

  // 4. Normalize UHV submissions (remove score, feedback, reviewer, and charter link; private status)
  if (Array.isArray(db.submissions)) {
    db.submissions.forEach((s) => {
      if (uhvAssignmentIds.has(s.assignmentId) || s.isUhvReflection) {
        delete (s as any).score;
        delete (s as any).teacherFeedback;
        delete (s as any).reviewerId;
        delete (s as any).reviewedAt;
        s.evidenceIds = (s.evidenceIds || []).filter((eid) => eid !== 'ev_meera_doc_02');
        s.status = s.status === 'draft' ? 'draft' : 'completed';
        s.isUhvReflection = true;
        s.visibility = 'private';
      }
    });
  }

  // 5. Clean UHV credit transactions (tx_meera_03, tx_meera_06, or any UHV lesson/assignment rewards)
  // Preserves ALL civic credits and user-created rewards by strictly using typed source references or exact IDs!
  if (Array.isArray(db.credits)) {
    db.credits = db.credits.filter((c) => {
      if (c.id === 'tx_meera_03' || c.id === 'tx_meera_06') return false;
      if (c.sourceId === 'tx_meera_03' || c.sourceId === 'asg_uhv_08') return false;
      if (c.sourceType === 'assignment' && uhvAssignmentIds.has(c.sourceId)) return false;
      if (c.sourceType === 'lesson' && uhvLessonIds.has(c.sourceId)) return false;
      if ((c.sourceType as string) === 'course' && uhvCourseIds.has(c.sourceId)) return false;
      if (uhvCourseIds.has(c.sourceId) || uhvLessonIds.has(c.sourceId) || uhvAssignmentIds.has(c.sourceId)) return false;
      return true;
    });
  }

  // 6. Clean UHV passport entries (pass_meera_03, or any UHV entries asserting civic graduate / reward)
  // Preserves ALL civic passport entries by strictly using typed source references or exact IDs!
  if (Array.isArray(db.passportEntries)) {
    db.passportEntries = db.passportEntries.filter((p) => {
      if (p.id === 'pass_meera_03') return false;
      if (p.sourceReferenceType === 'course' && uhvCourseIds.has(p.sourceReferenceId)) return false;
      if (p.sourceReferenceType === 'lesson' && uhvLessonIds.has(p.sourceReferenceId)) return false;
      if (p.sourceReferenceType === 'assignment' && uhvAssignmentIds.has(p.sourceReferenceId)) return false;
      if (uhvCourseIds.has(p.sourceReferenceId) || uhvLessonIds.has(p.sourceReferenceId) || uhvAssignmentIds.has(p.sourceReferenceId)) return false;
      return true;
    });
  }

  // 7. Normalize UHV reflections to private without overwriting participant's authored text
  if (Array.isArray(db.reflections)) {
    db.reflections.forEach((r) => {
      if ((r as any).contextId && uhvCourseIds.has((r as any).contextId)) {
        r.isPublicInPassport = false;
      }
      if (r.id === 'refl_meera_01') {
        r.isPublicInPassport = false;
      }
    });
  }

  // 8. Recompute totalCredits for all users
  if (Array.isArray(db.users) && Array.isArray(db.credits)) {
    db.users.forEach((u) => {
      u.totalCredits = db.credits
        .filter((c) => c.userId === u.id)
        .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      if (u.id === 'user_meera' && u.bio && u.bio.includes('Universal Human Values')) {
        u.bio = 'Youth leader active in public transport and pedestrian safety advocacy.';
      }
    });
  }

  db.schemaVersion = CURRENT_SCHEMA_VERSION;
  return db;
}

export const migrations: Migration[] = [
  {
    version: 1,
    migrate: (_prev: any) => {
      return getFreshSeedDatabase();
    },
  },
  {
    version: 2,
    migrate: (prev: any) => {
      return normalizeUhvRecords(prev);
    },
  },
];

export function runMigrations(storedData: any): DemoDatabase {
  if (!storedData || typeof storedData !== 'object') {
    return getFreshSeedDatabase();
  }

  if (
    !Array.isArray(storedData.users) ||
    !Array.isArray(storedData.courses) ||
    !Array.isArray(storedData.assemblies)
  ) {
    return getFreshSeedDatabase();
  }

  const storedVersion = Number(storedData.schemaVersion) || 0;

  // Apply version 2 migration if upgrading from version 1 or earlier, or normalize
  const migrated = normalizeUhvRecords(storedData);
  migrated.schemaVersion = CURRENT_SCHEMA_VERSION;
  return migrated;
}
