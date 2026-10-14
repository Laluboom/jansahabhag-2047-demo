import { DemoDatabase } from '../types/domain';
import { CURRENT_SCHEMA_VERSION, getFreshSeedDatabase } from '../data/seed';
import { seedSessions } from '../data/seed/events';

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

  // 5. Identify UHV reflections and normalize to private without overwriting participant's authored text
  const uhvReflectionIds = new Set<string>();
  uhvReflectionIds.add('refl_meera_01');
  if (Array.isArray(db.reflections)) {
    db.reflections.forEach((r) => {
      const isUhv =
        r.id === 'refl_meera_01' ||
        (r.contextType === 'course' && uhvCourseIds.has(r.contextId)) ||
        ((r.contextType as string) === 'lesson' && uhvLessonIds.has(r.contextId)) ||
        (r.contextType === 'assignment' && uhvAssignmentIds.has(r.contextId)) ||
        uhvCourseIds.has(r.contextId) ||
        uhvLessonIds.has(r.contextId) ||
        uhvAssignmentIds.has(r.contextId);
      if (isUhv) {
        uhvReflectionIds.add(r.id);
        r.isPublicInPassport = false;
      }
    });
  }

  // 6. Clean UHV credit transactions (tx_meera_03, tx_meera_06, or any UHV lesson/assignment/reflection rewards)
  // Preserves ALL civic credits and user-created rewards by strictly using typed source references or exact IDs!
  if (Array.isArray(db.credits)) {
    db.credits = db.credits.filter((c) => {
      if (c.id === 'tx_meera_03' || c.id === 'tx_meera_06') return false;
      if (c.sourceId === 'tx_meera_03' || c.sourceId === 'tx_meera_06' || c.sourceId === 'asg_uhv_08') return false;
      if (c.sourceType === 'assignment' && uhvAssignmentIds.has(c.sourceId)) return false;
      if (c.sourceType === 'lesson' && uhvLessonIds.has(c.sourceId)) return false;
      if ((c.sourceType as string) === 'course' && uhvCourseIds.has(c.sourceId)) return false;
      if (c.sourceType === 'reflection' && uhvReflectionIds.has(c.sourceId)) return false;
      if (
        uhvCourseIds.has(c.sourceId) ||
        uhvLessonIds.has(c.sourceId) ||
        uhvAssignmentIds.has(c.sourceId) ||
        uhvReflectionIds.has(c.sourceId)
      ) {
        return false;
      }
      return true;
    });
  }

  // 7. Clean UHV passport entries (pass_meera_03, or any UHV entries asserting civic graduate / reward)
  // Preserves ALL civic passport entries by strictly using typed source references or exact IDs!
  if (Array.isArray(db.passportEntries)) {
    db.passportEntries = db.passportEntries.filter((p) => {
      if (p.id === 'pass_meera_03') return false;
      if (p.sourceReferenceType === 'course' && uhvCourseIds.has(p.sourceReferenceId)) return false;
      if (p.sourceReferenceType === 'lesson' && uhvLessonIds.has(p.sourceReferenceId)) return false;
      if (p.sourceReferenceType === 'assignment' && uhvAssignmentIds.has(p.sourceReferenceId)) return false;
      if (p.sourceReferenceType === 'reflection' && uhvReflectionIds.has(p.sourceReferenceId)) return false;
      if (
        uhvCourseIds.has(p.sourceReferenceId) ||
        uhvLessonIds.has(p.sourceReferenceId) ||
        uhvAssignmentIds.has(p.sourceReferenceId) ||
        uhvReflectionIds.has(p.sourceReferenceId)
      ) {
        return false;
      }
      return true;
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

export function normalizeSessionRecords(db: DemoDatabase): DemoDatabase {
  if (!db || typeof db !== 'object') return db;

  if (!Array.isArray(db.sessions)) {
    db.sessions = JSON.parse(JSON.stringify(seedSessions));
    return db;
  }

  // Ensure sess_jaipur_01 exists
  const hasJaipurSession = db.sessions.some((s) => s.id === 'sess_jaipur_01');
  if (!hasJaipurSession) {
    const seedJaipur = seedSessions.find((s) => s.id === 'sess_jaipur_01');
    if (seedJaipur) {
      db.sessions.push(JSON.parse(JSON.stringify(seedJaipur)));
    }
  }

  db.sessions.forEach((session) => {
    session.currentMode = session.currentMode || (session.id === 'sess_jaipur_01' ? 'debate_room' : 'standard_meeting');
    session.facilitatorId = session.facilitatorId || 'user_rohan';

    if (!Array.isArray(session.roster) || session.roster.length === 0) {
      const linkedAssembly = db.assemblies?.find((a) => a.id === session.assemblyId);
      const participantIds = new Set<string>();
      if (linkedAssembly?.participantUserIds) {
        linkedAssembly.participantUserIds.forEach((pid) => participantIds.add(pid));
      }
      participantIds.add(session.facilitatorId);
      participantIds.add('user_aarav');

      session.roster = Array.from(participantIds).map((uid) => {
        const u = db.users?.find((user) => user.id === uid);
        const isFacilitator = uid === session.facilitatorId;
        return {
          userId: uid,
          name: u?.name || (isFacilitator ? 'Rohan Mehta' : uid),
          role: isFacilitator ? 'Facilitator' : 'Participant',
          joinedAt: session.createdAt || '2026-10-12T10:00:00Z',
        };
      });
    }

    if (!Array.isArray(session.modeTransitions) || session.modeTransitions.length === 0) {
      session.modeTransitions = [
        {
          id: `trans_${session.id}_01`,
          fromMode: 'standard_meeting',
          toMode: session.currentMode,
          timestamp: session.createdAt || '2026-10-12T10:05:00Z',
          initiatedBy: session.facilitatorId,
          summary: `Session initialized in ${session.currentMode} mode.`,
        },
      ];
    }

    if (session.id === 'sess_jaipur_01') {
      const seedJaipur = seedSessions.find((s) => s.id === 'sess_jaipur_01');
      if (!session.debateData && seedJaipur?.debateData) {
        session.debateData = JSON.parse(JSON.stringify(seedJaipur.debateData));
      } else if (session.debateData) {
        session.debateData.motion =
          session.debateData.motion ||
          'Immediate installation of tabletop pedestrian crosswalks, raised intersections, and 20 km/h traffic calming on Madhyam Marg outside Navchetna School.';
        session.debateData.linkedQuestion =
          session.debateData.linkedQuestion ||
          'How might Jaipur Municipal Corporation and school communities co-design pedestrian crossings that guarantee safe, dignified walking routes for students?';
        session.debateData.propositionId = session.debateData.propositionId || 'prop_jaipur_pedestrian_01';
        session.debateData.currentPhase = session.debateData.currentPhase || 'DISCUSSION';
        if (!Array.isArray(session.debateData.speakingQueue)) {
          session.debateData.speakingQueue = [];
        }
        if (!Array.isArray(session.debateData.contributions)) {
          session.debateData.contributions = [];
        }
        if (!Array.isArray(session.debateData.evidenceIds) || session.debateData.evidenceIds.length === 0) {
          session.debateData.evidenceIds = [
            'ev_aarav_traffic_count_01',
            'ev_aarav_crossing_photo_02',
            'ev_aarav_incident_log_03',
          ];
        }
        if (!Array.isArray(session.debateData.acknowledgedUserIds)) {
          session.debateData.acknowledgedUserIds = seedJaipur?.debateData?.acknowledgedUserIds || [];
        }
        if (!session.debateData.rulebook) {
          session.debateData.rulebook = seedJaipur?.debateData?.rulebook || {
            version: 'v1.0',
            title: 'JanSahabhag Debate Room Rules of Procedure',
            rules: [],
          };
        }
      }
    }
  });

  return db;
}

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
  normalizeSessionRecords(migrated);
  migrated.schemaVersion = CURRENT_SCHEMA_VERSION;
  return migrated;
}
