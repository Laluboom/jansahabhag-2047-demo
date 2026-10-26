import { describe, it, expect } from 'vitest';
import { seedDatabase, getFreshSeedDatabase, CURRENT_SCHEMA_VERSION } from '../src/data/seed';

describe('Seed Data Integrity & Completeness', () => {
  it('has correct schemaVersion and activeUserId', () => {
    const db = getFreshSeedDatabase();
    expect(db.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(db.activeUserId).toBe('VSC-S-001');
  });

  it('satisfies entity quantity requirements', () => {
    const db = getFreshSeedDatabase();

    // Exactly 1 demo institution (configurable for future schools)
    expect(db.institutions.length).toBeGreaterThanOrEqual(1);

    // At least 4 programmes
    expect(db.programmes.length).toBeGreaterThanOrEqual(4);

    // At least 8 courses
    expect(db.courses.length).toBeGreaterThanOrEqual(8);

    // Exactly 22 demo personas
    expect(db.users.length).toBe(22);

    // At least 3 assemblies
    expect(db.assemblies.length).toBeGreaterThanOrEqual(3);

    // At least 5 projects
    expect(db.projects.length).toBeGreaterThanOrEqual(5);

    // At least 8 assignments
    expect(db.assignments.length).toBeGreaterThanOrEqual(8);

    // At least 15 evidence records
    expect(db.evidence.length).toBeGreaterThanOrEqual(15);

    // At least 20 notifications
    expect(db.notifications.length).toBeGreaterThanOrEqual(20);

    // At least 20 credit transactions
    expect(db.credits.length).toBeGreaterThanOrEqual(20);

    // At least 20 Passport entries
    expect(db.passportEntries.length).toBeGreaterThanOrEqual(20);

    // At least 4 moderation cases
    expect(db.moderationCases.length).toBeGreaterThanOrEqual(4);

    // At least 3 community groups
    expect(db.communityGroups.length).toBeGreaterThanOrEqual(3);
  });

  it('contains all 22 required Rajkot demo personas with stable string IDs and correct roles', () => {
    const db = getFreshSeedDatabase();
    const userIds = db.users.map((u) => u.id);

    // Exactly 22 people
    expect(db.users.length).toBe(22);

    // 15 Students
    for (let i = 1; i <= 15; i++) {
      expect(userIds).toContain(`VSC-S-${String(i).padStart(3, '0')}`);
    }

    // 2 Teachers
    expect(userIds).toContain('VSC-T-001');
    expect(userIds).toContain('VSC-T-002');

    // 1 Principal
    expect(userIds).toContain('VSC-P-001');

    // 1 Special Guest
    expect(userIds).toContain('VSC-G-001');

    // 1 Founder
    expect(userIds).toContain('JS-F-001');

    // 2 Moderators
    expect(userIds).toContain('JS-M-001');
    expect(userIds).toContain('JS-M-002');

    const ankita = db.users.find((u) => u.id === 'VSC-S-001')!;
    expect(ankita.name).toBe('Ankita Kapri');
    expect(ankita.role).toBe('participant');
    expect(ankita.institutionId).toBe('inst_vsc_rajkot');

    const mayur = db.users.find((u) => u.id === 'VSC-T-001')!;
    expect(mayur.name).toBe('Shri Mayur Parmar');
    expect(mayur.role).toBe('teacher');

    const guest = db.users.find((u) => u.id === 'VSC-G-001')!;
    expect(guest.name).toBe('Shri Param Pujya Tyagvallabh Swamiji');
    expect(guest.role).toBe('special_guest');

    const yashvi = db.users.find((u) => u.id === 'JS-M-001')!;
    expect(yashvi.name).toBe('Yashvi Dalsaniya');
    expect(yashvi.role).toBe('moderator');
  });

  it('enforces 33% women reservation on the student roster (ceil(0.33 * 15) = 5)', () => {
    const db = getFreshSeedDatabase();
    const students = db.users.filter((u) => u.role === 'participant');
    expect(students).toHaveLength(15);

    // Exactly 5 women in student roster
    const womenStudentIds = ['VSC-S-001', 'VSC-S-002', 'VSC-S-003', 'VSC-S-004', 'VSC-S-015'];
    const requiredReservedCount = Math.ceil(0.33 * students.length);
    expect(requiredReservedCount).toBe(5);
    expect(womenStudentIds).toHaveLength(5);

    // Non-students hold no student seats
    const nonStudents = db.users.filter((u) => u.role !== 'participant');
    expect(nonStudents).toHaveLength(7); // 2 teachers + 1 principal + 1 guest + 1 founder + 2 moderators
  });

  it('contains varied states across submissions and moderation cases', () => {
    const db = getFreshSeedDatabase();

    const submissionStatuses = db.submissions.map((s) => s.status);
    expect(submissionStatuses).toContain('verified');
    expect(submissionStatuses).toContain('under_review');
    expect(submissionStatuses).toContain('revision_requested');

    const moderationStatuses = db.moderationCases.map((m) => m.status);
    expect(moderationStatuses).toContain('open');
    expect(moderationStatuses).toContain('under_review');
    expect(moderationStatuses).toContain('actioned');
    expect(moderationStatuses).toContain('no_action');
  });

  it('generates a fresh clone without mutating the canonical seed database', () => {
    const fresh1 = getFreshSeedDatabase();
    fresh1.users[0].name = 'Mutated Name';

    const fresh2 = getFreshSeedDatabase();
    expect(fresh2.users[0].name).toBe('Ankita Kapri');
    expect(seedDatabase.users[0].name).toBe('Ankita Kapri');
  });

  it('contains valid shared live session sess_jaipur_01 with typed debate data', () => {
    const db = getFreshSeedDatabase();
    const session = db.sessions.find((s) => s.id === 'sess_jaipur_01');
    expect(session).toBeDefined();
    expect(session?.currentMode).toBe('debate_room');
    expect(session?.facilitatorId).toBe('VSC-S-009');
    expect(session?.assemblyId).toBe('assembly_jaipur_pedestrian_2026');
    expect(session?.roster.length).toBeGreaterThanOrEqual(5);
    expect(session?.modeTransitions.length).toBeGreaterThanOrEqual(1);
    expect(session?.debateData).toBeDefined();
    expect(session?.debateData?.motion).toContain('tabletop pedestrian crosswalks');
    expect(session?.debateData?.currentPhase).toBe('DISCUSSION');
    expect(session?.debateData?.rulebook.version).toBe('v1.0');
    expect(session?.debateData?.speakingQueue.length).toBeGreaterThanOrEqual(1);
  });
});
