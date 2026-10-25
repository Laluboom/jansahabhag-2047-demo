import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersistenceService, STORAGE_KEY, JAIPUR_BACKUP_STORAGE_KEY } from '../src/services/persistence';
import { CURRENT_SCHEMA_VERSION } from '../src/data/seed';

describe('Persistence Adapter & Schema Migrations', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('loads fresh seed database on first launch and saves to jansahbhag_demo_v1', () => {
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

    const db = PersistenceService.loadDatabase();
    expect(db.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(db.activeUserId).toBe('VSC-S-001');

    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  });

  it('persists mutations across reloads', () => {
    const db = PersistenceService.loadDatabase();
    db.users[0].name = 'Aarav Updated';
    PersistenceService.saveDatabase(db);

    const reloaded = PersistenceService.loadDatabase();
    expect(reloaded.users[0].name).toBe('Aarav Updated');
  });

  it('resets cleanly back to canonical seed database on resetDatabase()', () => {
    const db = PersistenceService.loadDatabase();
    db.users[0].name = 'Modified User';
    db.credits = [];
    PersistenceService.saveDatabase(db);

    const resetDb = PersistenceService.resetDatabase();
    expect(resetDb.users[0].name).toBe('Ankita Kapri');
    expect(resetDb.credits.length).toBeGreaterThanOrEqual(20);

    const reloaded = PersistenceService.loadDatabase();
    expect(reloaded.users[0].name).toBe('Ankita Kapri');
  });

  it('migrates or resets corrupted or incompatible schema data safely', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 999, corrupted: true }));

    const loaded = PersistenceService.loadDatabase();
    expect(loaded.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(loaded.users.length).toBeGreaterThanOrEqual(20);
  });

  it('handles invalid JSON in localStorage gracefully without crashing', () => {
    window.localStorage.setItem(STORAGE_KEY, '{invalid_json_corrupted');

    const loaded = PersistenceService.loadDatabase();
    expect(loaded.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(loaded.users.length).toBeGreaterThanOrEqual(20);
  });

  describe('Safe Idempotent Jaipur-to-Rajkot Transition & Local Backup', () => {
    it('detects legacy Jaipur demo record, backs it up to jansahabhag_jaipur_backup_v1, sets transition notice, and initializes fresh Rajkot roster', () => {
      // Simulate an existing browser storage holding legacy Jaipur demo data
      const legacyJaipurDatabase = {
        schemaVersion: 1,
        activeUserId: 'user_aarav',
        institution: {
          id: 'inst_jaipur_demo',
          name: 'Navchetna Public School, Jaipur',
        },
        users: [
          {
            id: 'user_aarav',
            name: 'Aarav Sharma',
            role: 'participant',
            age: 18,
            location: 'Jaipur, Rajasthan',
            institutionId: 'inst_jaipur_demo',
            institutionName: 'Navchetna Public School, Jaipur',
          },
          {
            id: 'user_rohan',
            name: 'Rohan Mehta',
            role: 'facilitator',
            age: 19,
            location: 'Jaipur, Rajasthan',
          },
        ],
        submissions: [
          {
            id: 'sub_jaipur_uhv_private_01',
            assignmentId: 'asg_uhv_08',
            userId: 'user_aarav',
            content: 'My private, highly sensitive personal UHV reflection on mutual trust in Jaipur.',
            status: 'private',
            submittedAt: '2026-10-10T12:00:00Z',
          },
          {
            id: 'sub_jaipur_civic_02',
            assignmentId: 'asg_obs_01',
            userId: 'user_aarav',
            content: 'Aarav pedestrian observation report for Jaipur school gate.',
            status: 'submitted',
            submittedAt: '2026-10-11T14:00:00Z',
          },
        ],
        reflections: [
          {
            id: 'refl_jaipur_01',
            userId: 'user_aarav',
            content: 'Private reflective notes that must remain confidential.',
            isPrivate: true,
          },
        ],
      };

      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyJaipurDatabase));

      // 1. Initial load from legacy record triggers the migration
      const loaded = PersistenceService.loadDatabase();

      // Verified: Fresh Rajkot roster is initialized
      expect(loaded.activeUserId).toBe('VSC-S-001');
      expect(loaded.users).toHaveLength(22);
      const ankita = loaded.users.find((u) => u.id === 'VSC-S-001')!;
      expect(ankita.name).toBe('Ankita Kapri');
      expect(ankita.institutionName).toContain('Shri Manibhai Virani and Smt. Navalben Virani Science College');

      // Verified: Old user-authored work is NOT reattributed to newly named real people
      const ankitaSubs = loaded.submissions.filter((s) => s.userId === 'VSC-S-001');
      const reattributed = ankitaSubs.some((s) => s.content.includes('sensitive personal UHV reflection'));
      expect(reattributed).toBe(false);

      // Verified: Legacy Jaipur record is safely preserved in local-only backup
      expect(PersistenceService.hasJaipurBackup()).toBe(true);
      const backup = PersistenceService.getJaipurBackup() as any;
      expect(backup).toBeDefined();
      expect(backup.users.some((u: any) => u.id === 'user_aarav')).toBe(true);
      expect(backup.institution.name).toContain('Navchetna Public School, Jaipur');

      // Verified: Private UHV reflections are preserved in the backup
      const backupUhv = backup.submissions.find((s: any) => s.id === 'sub_jaipur_uhv_private_01');
      expect(backupUhv).toBeDefined();
      expect(backupUhv.content).toContain('My private, highly sensitive personal UHV reflection');

      // Verified: Private UHV reflection is NOT exposed in the active shared records
      const activeUhv = loaded.submissions.find((s) => s.id === 'sub_jaipur_uhv_private_01');
      expect(activeUhv).toBeUndefined();

      // Verified: Clear transition notice is set
      const notice = PersistenceService.getTransitionNotice();
      expect(notice).toBeDefined();
      expect(notice?.message).toContain('Shri Manibhai Virani and Smt. Navalben Virani Science College');
      expect(notice?.backupKey).toBe('jansahabhag_jaipur_backup_v1');

      // 2. Subsequent reload is idempotent: does not overwrite backup and retains state
      const reloaded = PersistenceService.loadDatabase();
      expect(reloaded.activeUserId).toBe('VSC-S-001');
      expect(reloaded.users).toHaveLength(22);
      expect(PersistenceService.hasJaipurBackup()).toBe(true);

      // Dismiss transition notice
      PersistenceService.dismissTransitionNotice();
      expect(PersistenceService.getTransitionNotice()).toBeNull();
    });

    it('fails closed when storage quota prevents backup: does not overwrite legacy database, preserves original raw data, and does not claim false backup success', () => {
      const legacyRaw = JSON.stringify({
        schemaVersion: 1,
        activeUserId: 'user_aarav',
        institution: { id: 'inst_jaipur_demo', name: 'Navchetna Public School, Jaipur' },
        users: [{ id: 'user_aarav', name: 'Aarav Sharma', role: 'participant' }],
        submissions: [
          {
            id: 'sub_jaipur_uhv_private_99',
            userId: 'user_aarav',
            content: 'Sensitive UHV reflection that must never be erased without backup',
            status: 'private',
          },
        ],
      });

      window.localStorage.setItem(STORAGE_KEY, legacyRaw);

      // Spy on Storage.prototype.setItem to simulate quota error ONLY when saving the backup key
      const originalSetItem = Storage.prototype.setItem;
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, val: string) {
        if (key === JAIPUR_BACKUP_STORAGE_KEY) {
          throw new DOMException('QuotaExceededError: LocalStorage quota exceeded', 'QuotaExceededError');
        }
        return originalSetItem.call(this, key, val);
      });

      // Load database when backup fails
      const result = PersistenceService.loadDatabase();

      // Verified: raw data in STORAGE_KEY is completely untouched (never overwritten with fresh seed)
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe(legacyRaw);

      // Verified: No backup exists in localStorage
      expect(window.localStorage.getItem(JAIPUR_BACKUP_STORAGE_KEY)).toBeNull();
      expect(PersistenceService.hasJaipurBackup()).toBe(false);

      // Verified: No false success notice appears
      const notice = result.transitionNotice;
      expect(notice).toBeDefined();
      expect(notice?.isError).toBe(true);
      expect(notice?.backupKey).toBeNull();
      expect(notice?.message).toContain('Storage quota prevented');
      expect(notice?.message).not.toContain('safely preserved in local backup');

      // Verified: Private UHV reflections remain safe in the preserved record
      expect(result.submissions.some((s: any) => s.id === 'sub_jaipur_uhv_private_99')).toBe(true);

      setItemSpy.mockRestore();
    });

    it('preserves malformed legacy raw data to jansahabhag_malformed_backup_v1 before resetting corrupted storage', () => {
      const corruptRaw = '{corrupted_json_cannot_parse: true';
      window.localStorage.setItem(STORAGE_KEY, corruptRaw);

      const result = PersistenceService.loadDatabase();
      expect(result.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
      expect(window.localStorage.getItem('jansahabhag_malformed_backup_v1')).toBe(corruptRaw);
    });
  });
});
