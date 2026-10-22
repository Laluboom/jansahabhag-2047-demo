import { DemoDatabase, AssemblyStage, AssemblyRoleType, AssemblyRolePower } from '../types/domain';
import { CURRENT_SCHEMA_VERSION, getFreshSeedDatabase } from '../data/seed';
import { seedSessions } from '../data/seed/events';
import { canonicalAssemblyRulebook, seedAssemblies } from '../data/seed/assemblies';
import {
  seedWorkspaces,
  seedWorkspaceMemberships,
  seedWorkspaceActions,
  seedWorkspaceAuditEvents,
  canonicalWorkspaceRulebook,
} from '../data/seed/workspaces';
import { seedEvents } from '../data/seed/events';
import { buildAllocationState, buildAssemblyRoleAllocations, buildSessionRoleAllocations } from './reservationAllocationService';

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
  {
    version: 3,
    migrate: (prev: any) => {
      const db = normalizeUhvRecords(prev);
      normalizeSessionRecords(db);
      normalizeAssemblyRecords(db);
      return db;
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

    if (!session.rolePlanStage) {
      session.rolePlanStage = 'open_selection';
    }

    if (!session.roleAllocations) {
      if (session.id === 'sess_jaipur_01') {
        const seedJaipur = seedSessions.find((s) => s.id === 'sess_jaipur_01');
        if (seedJaipur?.roleAllocations) {
          session.roleAllocations = JSON.parse(JSON.stringify(seedJaipur.roleAllocations));
        } else {
          session.roleAllocations = buildSessionRoleAllocations({
            sessionId: session.id,
            facilitatorId: session.facilitatorId,
            roster: session.roster,
            customDeclarations: db.userDeclarations,
          });
        }
      } else {
        session.roleAllocations = buildSessionRoleAllocations({
          sessionId: session.id,
          facilitatorId: session.facilitatorId,
          roster: session.roster,
          customDeclarations: db.userDeclarations,
        });
      }
    }

    if (session.debateData) {
      if (!session.debateData.rolePlanStage) {
        session.debateData.rolePlanStage = session.rolePlanStage;
      }
      if (!session.debateData.roleAllocations) {
        session.debateData.roleAllocations = session.roleAllocations;
      }
    }
  });

  return db;
}

export function normalizeAssemblyStage(stage: string): AssemblyStage {
  if (!stage) return 'frame';
  const s = String(stage).toLowerCase();
  if (s === 'frame') return 'frame';
  if (s === 'think') return 'think';
  if (s === 'enable') return 'enable';
  if (s === 'troubleshoot') return 'troubleshoot';
  if (s === 'shape') return 'shape';
  if (s === 'final_assembly') return 'final_assembly';

  // Legacy mappings
  if (s === 'orientation' || s === 'question') return 'frame';
  if (s === 'evidence_review' || s === 'deliberation') return 'think';
  if (s === 'proposition_draft' || s === 'revision') return 'shape';
  if (s === 'support_dissent' || s === 'outcome' || s === 'reflection') return 'final_assembly';

  return 'frame';
}

export function normalizeAssemblyRoleName(roleName: string): AssemblyRoleType {
  if (!roleName) return 'Thinker';
  const r = String(roleName).trim();
  if (r === 'Thinker' || r === 'Enabler' || r === 'Troubleshooter' || r === 'Shaper') {
    return r;
  }
  // Legacy role names
  if (r.toLowerCase().includes('questioner')) return 'Thinker';
  if (r.toLowerCase().includes('evidence')) return 'Enabler';
  if (r.toLowerCase().includes('advocate')) return 'Troubleshooter';
  if (r.toLowerCase().includes('synthesiser') || r.toLowerCase().includes('synthesizer')) return 'Shaper';
  if (r.toLowerCase().includes('community')) return 'Troubleshooter';
  if (r.toLowerCase().includes('rapporteur')) return 'Shaper';

  return 'Thinker';
}

export function getRolePowerForName(roleName: AssemblyRoleType): AssemblyRolePower {
  switch (roleName) {
    case 'Thinker':
      return 'Question Setter';
    case 'Enabler':
      return 'Feasibility Check';
    case 'Troubleshooter':
      return 'Red Flag';
    case 'Shaper':
      return 'Proposition Call';
    default:
      return 'Question Setter';
  }
}

export function normalizeAssemblyRecords(db: DemoDatabase): DemoDatabase {
  if (!db || typeof db !== 'object') return db;

  // 1. Normalize Assemblies
  if (Array.isArray(db.assemblies)) {
    db.assemblies.forEach((assembly) => {
      assembly.currentStage = normalizeAssemblyStage(assembly.currentStage);
      assembly.chairId = assembly.chairId || assembly.facilitatorId || 'user_rohan';
      if (!assembly.rulebook) {
        assembly.rulebook = JSON.parse(JSON.stringify(canonicalAssemblyRulebook));
      }
      if (!Array.isArray(assembly.roleActions)) {
        assembly.roleActions = [];
      }
      if (!Array.isArray(assembly.roleOverrideAudits)) {
        assembly.roleOverrideAudits = [];
      }
      if (!Array.isArray(assembly.speakingQueue)) {
        assembly.speakingQueue = [];
      }
      if (Array.isArray(assembly.participantUserIds) && assembly.participantUserIds.length === 3) {
        assembly.isThreePersonMiniMode = true;
      }
    });
  }

  // 2. Normalize Assembly Roles
  if (Array.isArray(db.assemblyRoles)) {
    db.assemblyRoles.forEach((role) => {
      role.roleName = normalizeAssemblyRoleName(role.roleName);
      role.power = role.power || getRolePowerForName(role.roleName);
      if (!Array.isArray(role.responsibilities) || role.responsibilities.length === 0) {
        if (role.roleName === 'Thinker') {
          role.responsibilities = [
            'Introduce substantive perspectives, explain the problem, question assumptions and add domain evidence.',
          ];
        } else if (role.roleName === 'Enabler') {
          role.responsibilities = [
            'Examine resources, implementation route, institutional ownership, capability and feasibility.',
          ];
        } else if (role.roleName === 'Troubleshooter') {
          role.responsibilities = [
            'Stress-test assumptions, identify harms, edge cases, incentives and unintended consequences; propose mitigations.',
          ];
        } else {
          role.responsibilities = [
            'Synthesize agreement, qualified support, disagreement and candidate wording into draft proposition.',
          ];
        }
      }
      if (!Array.isArray(role.promptSuggestions) || role.promptSuggestions.length === 0) {
        role.promptSuggestions = [
          `Focus inquiry and perspective as ${role.roleName} in the youth deliberative chamber.`,
        ];
      }
    });
  }

  // 3. Normalize Contributions
  if (Array.isArray(db.contributions)) {
    db.contributions.forEach((contrib) => {
      contrib.stage = normalizeAssemblyStage(contrib.stage);
    });
  }

  // 4. Normalize Propositions
  if (Array.isArray(db.propositions)) {
    db.propositions.forEach((prop) => {
      if (!Array.isArray(prop.assumptions) || prop.assumptions.length === 0) {
        prop.assumptions = [
          'IRC-99:1988 guidelines apply to raised pedestrian tabletop crossings on urban arterial corridors.',
          'Jaipur Municipal Corporation Greater has jurisdiction over Ward 24 road safety interventions.',
        ];
      }
      if (!Array.isArray(prop.evidenceBasis) || prop.evidenceBasis.length === 0) {
        prop.evidenceBasis = (prop.evidenceIds || []).map((id) => `Evidence reference: ${id}`);
      }
      if (!Array.isArray(prop.participantResponses)) {
        prop.participantResponses = [];
      }
      prop.reviewerState = prop.reviewerState || 'draft';
      prop.publicationVisibility = prop.publicationVisibility || 'internal_chamber';
      if (!Array.isArray(prop.routingHistory) || prop.routingHistory.length === 0) {
        prop.routingHistory = [
          {
            id: `route_sim_${prop.id}`,
            stage: 'shape',
            routedTo: 'Simulated Civic Review Desk - Ward 24 (Demo Prototype)',
            status: 'simulated_routing',
            timestamp: prop.updatedAt || new Date().toISOString(),
            note: 'Local simulation prototype only - no real external stakeholder submission claimed.',
          },
        ];
      }
      if (!Array.isArray(prop.dissent)) {
        prop.dissent = [];
      }
    });
  }

  return db;
}

export function normalizeWorkspaceRecords(db: DemoDatabase): DemoDatabase {
  if (!db || typeof db !== 'object') return db;

  // 1. Ensure all users have unique username
  if (Array.isArray(db.users)) {
    db.users.forEach((u) => {
      if (!u.username) {
        if (u.email && u.email.includes('@')) {
          u.username = u.email.split('@')[0];
        } else {
          u.username = u.id.replace('user_', '');
        }
      }
    });
  }

  // 2. Ensure workspaces array exists and is populated
  if (!Array.isArray(db.workspaces) || db.workspaces.length === 0) {
    db.workspaces = JSON.parse(JSON.stringify(seedWorkspaces));
  } else {
    db.workspaces.forEach((ws) => {
      if (ws.id === 'ws_jaipur_school_safety') {
        ws.visibility = 'private';
      }
      if (!ws.rulebook) {
        ws.rulebook = JSON.parse(JSON.stringify(canonicalWorkspaceRulebook));
      }
      if (!Array.isArray(ws.moderatorIds) || ws.moderatorIds.length === 0) {
        ws.moderatorIds = [ws.ownerId];
      }
    });
  }

  // 3. Ensure memberships array exists and is populated
  if (!Array.isArray(db.workspaceMemberships) || db.workspaceMemberships.length === 0) {
    db.workspaceMemberships = JSON.parse(JSON.stringify(seedWorkspaceMemberships));
  } else {
    db.workspaceMemberships.forEach((m) => {
      if (!m.username) {
        const u = db.users?.find((user) => user.id === m.userId);
        m.username = u?.username || m.userId.replace('user_', '');
      }
    });
  }

  // 4. Ensure workspaceActions array exists and is populated
  if (!Array.isArray(db.workspaceActions) || db.workspaceActions.length === 0) {
    db.workspaceActions = JSON.parse(JSON.stringify(seedWorkspaceActions));
  }

  // 5. Ensure workspaceAuditEvents array exists and is populated
  if (!Array.isArray(db.workspaceAuditEvents) || db.workspaceAuditEvents.length === 0) {
    db.workspaceAuditEvents = JSON.parse(JSON.stringify(seedWorkspaceAuditEvents));
  }

  return db;
}

export function normalizePassportAndCreditRecords(db: DemoDatabase): DemoDatabase {
  if (!db || typeof db !== 'object') return db;

  // 1. Ensure creditAppeals, credits, and passportEntries exist
  if (!Array.isArray(db.creditAppeals)) {
    db.creditAppeals = [];
  }
  if (!Array.isArray(db.credits)) {
    db.credits = [];
  }
  if (!Array.isArray(db.passportEntries)) {
    db.passportEntries = [];
  }

  // 2. Idempotently ensure every participant persona has exactly one Starting balance: 10 transaction
  if (Array.isArray(db.users)) {
    db.users.forEach((u) => {
      if (u.role === 'participant' || (u.role as string) === 'student') {
        const hasStartingBalance = db.credits.some(
          (c) => c.userId === u.id && (c.sourceType === 'starting_balance' || c.reason === 'Starting balance: 10')
        );
        if (!hasStartingBalance) {
          const startingTx = {
            id: `tx_${u.id}_init`,
            userId: u.id,
            dimension: 'Contribution' as const,
            amount: 10,
            sourceType: 'starting_balance' as const,
            sourceId: `init_${u.id}`,
            sourceRoute: '/passport/credits',
            status: 'Verified' as const,
            reason: 'Starting balance: 10',
            calculationExplanation: 'Approved owner model: 10 initial starting credits for newly created demo participant.',
            createdAt: u.createdAt || '2026-09-01T08:30:00Z',
            schemaVersion: 1,
          };
          db.credits.unshift(startingTx);
        }

        const hasStartingPassport = db.passportEntries.some(
          (p) => p.userId === u.id && (p.sourceReferenceType === 'starting_balance' || p.subtitle === 'Starting balance: 10')
        );
        if (!hasStartingPassport) {
          db.passportEntries.unshift({
            id: `pass_${u.id}_init`,
            userId: u.id,
            category: 'achievement',
            title: 'Civic Passport Initial Allocation',
            subtitle: 'Starting balance: 10',
            date: (u.createdAt || '2026-09-01T08:30:00Z').split('T')[0],
            creditsAwarded: 10,
            evidenceIds: [],
            sourceReferenceId: `init_${u.id}`,
            sourceReferenceType: 'starting_balance',
            sourceRoute: '/passport/credits',
            verificationState: 'system_recorded',
            reviewState: 'accepted',
            isVerified: true,
            calculationExplanation: 'Approved owner model: 10 initial starting credits for newly created demo participant.',
            revisionHistory: [
              {
                date: u.createdAt || '2026-09-01T08:30:00Z',
                action: 'STARTING_BALANCE_ISSUED',
                actorId: 'system',
                actorName: 'JanSahabhag Registry',
                note: 'Starting balance: 10 issued upon participant creation.',
              },
            ],
            schemaVersion: 1,
          });
        }
      }
    });
  }

  // 3. Ensure passportEntries are normalized with truthful review & verification states
  if (Array.isArray(db.passportEntries)) {
    db.passportEntries.forEach((p) => {
      if (!p.sourceRoute) {
        switch (p.sourceReferenceType) {
          case 'starting_balance':
            p.sourceRoute = `/passport/credits`;
            break;
          case 'assignment':
          case 'submission':
            p.sourceRoute = `/assignments/${p.sourceReferenceId}`;
            break;
          case 'assembly':
            p.sourceRoute = `/assemblies/${p.sourceReferenceId}`;
            break;
          case 'proposition':
          case 'dissent':
            p.sourceRoute = `/assemblies/assembly_jaipur_pedestrian_2026`;
            break;
          case 'workspace':
            p.sourceRoute = `/workspaces/${p.sourceReferenceId}`;
            break;
          case 'course':
            p.sourceRoute = `/learn/${p.sourceReferenceId}`;
            break;
          case 'lesson':
            p.sourceRoute = `/learn`;
            break;
          case 'evidence':
            p.sourceRoute = `/passport/evidence`;
            break;
          case 'reflection':
            p.sourceRoute = `/passport`;
            break;
          case 'project':
            p.sourceRoute = `/dashboard`;
            break;
          default:
            p.sourceRoute = `/passport`;
            break;
        }
      }

      if (!p.verificationState) {
        if (p.sourceReferenceId === 'sub_aarav_01' || (p.sourceReferenceType === 'submission' && p.isVerified)) {
          p.verificationState = 'facilitator_reviewed';
          p.reviewState = 'accepted';
          p.verifier = p.verifier || {
            id: 'user_kavita',
            name: 'Kavita Rao',
            role: 'Teacher / Mentor',
            label: 'Mentor Review (Jaipur Demo Simulation)',
          };
          p.organisation = p.organisation || 'Government Senior Secondary School Navchetna, Jaipur (Demo Simulation)';
        } else if (
          p.sourceReferenceType === 'starting_balance' ||
          p.sourceReferenceType === 'assembly' ||
          p.sourceReferenceType === 'proposition' ||
          p.sourceReferenceType === 'contribution' ||
          p.sourceReferenceType === 'dissent' ||
          p.sourceReferenceType === 'reflection' ||
          p.sourceReferenceType === 'course' ||
          p.sourceReferenceType === 'lesson' ||
          p.sourceReferenceType === 'workspace' ||
          p.sourceReferenceType === 'project' ||
          p.isVerified
        ) {
          p.verificationState = 'system_recorded';
          p.reviewState = p.reviewState || 'accepted';
        } else {
          // Historical entries with missing provenance
          p.verificationState = 'sample_unverified';
          p.reviewState = 'sample';
          p.isVerified = false;
        }
      }

      if (!Array.isArray(p.revisionHistory)) {
        p.revisionHistory = [];
      }
    });
  }

  // 4. Ensure credits have valid status, sourceRoute, and auditTrail
  if (Array.isArray(db.credits)) {
    db.credits.forEach((c) => {
      if (!c.status) {
        c.status = 'Verified';
      }
      if (!c.sourceRoute) {
        switch (c.sourceType) {
          case 'starting_balance':
            c.sourceRoute = `/passport/credits`;
            break;
          case 'assignment':
            c.sourceRoute = `/assignments/${c.sourceId}`;
            break;
          case 'lesson':
            c.sourceRoute = `/learn`;
            break;
          case 'evidence':
            c.sourceRoute = `/passport/evidence`;
            break;
          case 'assembly':
            c.sourceRoute = `/assemblies/${c.sourceId}`;
            break;
          case 'workspace':
            c.sourceRoute = `/workspaces/${c.sourceId}`;
            break;
          case 'reflection':
            c.sourceRoute = `/passport`;
            break;
          default:
            c.sourceRoute = `/passport/credits`;
            break;
        }
      }
      if (!Array.isArray(c.auditTrail)) {
        c.auditTrail = [];
      }
    });
  }

  // 5. Recompute totalCredits for all users strictly from verified and audited credits
  if (Array.isArray(db.users) && Array.isArray(db.credits)) {
    db.users.forEach((u) => {
      u.totalCredits = db.credits
        .filter((c) => c.userId === u.id && (c.status === 'Verified' || c.status === 'Audited'))
        .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    });
  }

  return db;
}

export function normalizeEventAllocationRecords(db: DemoDatabase): DemoDatabase {
  if (!db || typeof db !== 'object') return db;

  db.allocationAudits = db.allocationAudits || [];

  if (!Array.isArray(db.events)) {
    db.events = [];
  }

  // Ensure small fictional demo events exist in db
  for (const seedEvt of seedEvents) {
    if (!db.events.some((e) => e.id === seedEvt.id)) {
      db.events.push(JSON.parse(JSON.stringify(seedEvt)));
    }
  }

  const legacyEventIds = new Set([
    'evt_jaipur_assembly_01',
    'evt_field_audit_02',
    'evt_expert_session_03',
    'evt_green_canopy_04',
  ]);

  db.events.forEach((evt) => {
    evt.attendeeUserIds = Array.isArray(evt.attendeeUserIds) ? evt.attendeeUserIds : [];
    evt.checkedInUserIds = Array.isArray(evt.checkedInUserIds) ? evt.checkedInUserIds : [];
    evt.rsvpMap = evt.rsvpMap || {};

    // Ensure checkIn cannot contain users who are not in attendeeUserIds
    evt.checkedInUserIds = evt.checkedInUserIds.filter((uid) => evt.attendeeUserIds.includes(uid));

    // Determine initial status
    let initialStatus: import('../types/domain').AllocationStatus = 'pending';
    if (legacyEventIds.has(evt.id)) {
      initialStatus = 'unvalidated_legacy';
    } else if (evt.id === 'evt_jaipur_compliant_06') {
      initialStatus = 'finalized_compliant';
    } else if (evt.id === 'evt_jaipur_blocked_07') {
      initialStatus = 'blocked_noncompliant';
    }

    evt.allocation = buildAllocationState({
      allocationId: evt.allocation?.allocationId || `alloc_${evt.id}`,
      allocationType: 'event_places',
      title: evt.title,
      totalPlaces: evt.capacity,
      confirmedOccupants: evt.attendeeUserIds,
      existingStatus: evt.allocation?.status || initialStatus,
      existingExceptionAudit: evt.allocation?.exceptionAudit,
    });

    if (evt.allocation.exceptionAudit) {
      if (!db.allocationAudits!.some((a) => a.id === evt.allocation!.exceptionAudit!.id)) {
        db.allocationAudits!.push(evt.allocation.exceptionAudit);
      }
    }
  });

  return db;
}

export function normalizeAssemblyRoleAllocationRecords(db: DemoDatabase): DemoDatabase {
  if (!db || typeof db !== 'object') return db;

  db.allocationAudits = db.allocationAudits || [];

  if (!Array.isArray(db.assemblies)) {
    db.assemblies = [];
  }

  // Ensure small fictional demo assemblies exist in db
  for (const seedAsm of seedAssemblies) {
    if (!db.assemblies.some((a) => a.id === seedAsm.id)) {
      db.assemblies.push(JSON.parse(JSON.stringify(seedAsm)));
    }
  }

  db.assemblies.forEach((assembly) => {
    assembly.participantUserIds = Array.isArray(assembly.participantUserIds) ? assembly.participantUserIds : [];
    if (assembly.participantUserIds.length === 3) {
      assembly.isThreePersonMiniMode = true;
    }

    const roles = Array.isArray(db.assemblyRoles)
      ? db.assemblyRoles.filter((r) => r.assemblyId === assembly.id)
      : [];

    assembly.roleAllocations = buildAssemblyRoleAllocations({
      assemblyId: assembly.id,
      isThreePersonMiniMode: assembly.isThreePersonMiniMode,
      participantUserIds: assembly.participantUserIds,
      roles,
      facilitatorId: assembly.facilitatorId,
      chairId: assembly.chairId,
      coChairId: assembly.coChairId,
      existingAllocations: assembly.roleAllocations,
    });

    // Sync any existing exception audits into db.allocationAudits
    if (assembly.roleAllocations) {
      for (const alloc of Object.values(assembly.roleAllocations)) {
        if (alloc.exceptionAudit) {
          if (!db.allocationAudits!.some((a) => a.id === alloc.exceptionAudit!.id)) {
            db.allocationAudits!.push(alloc.exceptionAudit);
          }
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

  // Apply migrations sequentially or normalize
  const migrated = normalizeUhvRecords(storedData);
  normalizeSessionRecords(migrated);
  normalizeAssemblyRecords(migrated);
  normalizeWorkspaceRecords(migrated);
  normalizePassportAndCreditRecords(migrated);
  normalizeEventAllocationRecords(migrated);
  normalizeAssemblyRoleAllocationRecords(migrated);
  migrated.schemaVersion = CURRENT_SCHEMA_VERSION;
  return migrated;
}

export const migrateDatabase = runMigrations;
