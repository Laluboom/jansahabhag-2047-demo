import { describe, it, expect } from 'vitest';
import { seedDatabase, getFreshSeedDatabase, CURRENT_SCHEMA_VERSION } from '../src/data/seed';

describe('Seed Data Integrity & Completeness', () => {
  it('has correct schemaVersion and activeUserId', () => {
    const db = getFreshSeedDatabase();
    expect(db.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(db.activeUserId).toBe('user_aarav');
  });

  it('satisfies entity quantity requirements', () => {
    const db = getFreshSeedDatabase();

    // At least 3 institutions
    expect(db.institutions.length).toBeGreaterThanOrEqual(3);

    // At least 4 programmes
    expect(db.programmes.length).toBeGreaterThanOrEqual(4);

    // At least 8 courses
    expect(db.courses.length).toBeGreaterThanOrEqual(8);

    // At least 20 participants (users)
    expect(db.users.length).toBeGreaterThanOrEqual(20);

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

  it('contains all 7 required core stakeholder personas with stable string IDs', () => {
    const db = getFreshSeedDatabase();
    const userIds = db.users.map((u) => u.id);

    expect(userIds).toContain('user_aarav');
    expect(userIds).toContain('user_meera');
    expect(userIds).toContain('user_kavita');
    expect(userIds).toContain('user_rohan');
    expect(userIds).toContain('user_ananya');
    expect(userIds).toContain('user_dev');
    expect(userIds).toContain('user_admin');

    const aarav = db.users.find((u) => u.id === 'user_aarav')!;
    expect(aarav.name).toBe('Aarav Sharma');
    expect(aarav.role).toBe('participant');
    expect(aarav.institutionId).toBe('inst_navchetna_jaipur');

    const kavita = db.users.find((u) => u.id === 'user_kavita')!;
    expect(kavita.name).toBe('Kavita Rao');
    expect(kavita.role).toBe('teacher');
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
    expect(fresh2.users[0].name).toBe('Aarav Sharma');
    expect(seedDatabase.users[0].name).toBe('Aarav Sharma');
  });
});
