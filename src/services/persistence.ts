import { DemoDatabase, TransitionNotice } from '../types/domain';
import { CURRENT_SCHEMA_VERSION, getFreshSeedDatabase } from '../data/seed';
import { runMigrations } from './migrations';

export const STORAGE_KEY = 'jansahbhag_demo_v1';
export const JAIPUR_BACKUP_STORAGE_KEY = 'jansahabhag_jaipur_backup_v1';
export const TRANSITION_NOTICE_STORAGE_KEY = 'jansahabhag_transition_notice';

// In-memory fallback for environments without localStorage or if quota exceeded
let inMemoryDatabase: DemoDatabase | null = null;

export class PersistenceService {
  private static isStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  public static loadDatabase(): DemoDatabase {
    if (!this.isStorageAvailable()) {
      if (!inMemoryDatabase) {
        inMemoryDatabase = getFreshSeedDatabase();
      }
      return inMemoryDatabase;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = getFreshSeedDatabase();
        this.saveDatabase(fresh);
        return fresh;
      }

      const parsed = JSON.parse(raw);

      // Detect legacy Jaipur demo data
      const isLegacyJaipur =
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray(parsed.users) &&
        (parsed.users.some(
          (u: { id: string }) => u.id === 'user_aarav' || u.id === 'user_admin' || u.id === 'user_rohan'
        ) ||
          (parsed.institution &&
            (parsed.institution.id === 'inst_jaipur_demo' ||
              String(parsed.institution.name).includes('Navchetna'))));

      if (isLegacyJaipur) {
        // Safe, idempotent Rajkot transition:
        // 1. Durably store and verify exact raw backup before modifying STORAGE_KEY.
        let backupVerified = false;
        try {
          window.localStorage.setItem(JAIPUR_BACKUP_STORAGE_KEY, raw);
          const readBack = window.localStorage.getItem(JAIPUR_BACKUP_STORAGE_KEY);
          if (readBack === raw) {
            backupVerified = true;
          }
        } catch (e) {
          console.warn('PersistenceService: Failed to store Jaipur backup in localStorage', e);
          backupVerified = false;
        }

        if (!backupVerified) {
          // FAIL CLOSED: Never overwrite legacy database if backup was not durably stored and verified.
          // Give user an honest visible notice and preserve all data and private UHV content.
          const errorNotice: TransitionNotice = {
            id: 'rajkot_demo_transition_blocked',
            message:
              'Storage quota prevented automatic backup of existing Jaipur demo data. Migration to Rajkot demo paused to protect your work and private UHV reflections. Free local storage to proceed.',
            backupKey: null,
            createdAt: new Date().toISOString(),
            isError: true,
          };

          try {
            window.localStorage.setItem(TRANSITION_NOTICE_STORAGE_KEY, JSON.stringify(errorNotice));
          } catch {
            // Ignore if notice cannot be written to localStorage
          }

          // Return legacy database with error notice attached so user can see it; DO NOT overwrite STORAGE_KEY!
          parsed.transitionNotice = errorNotice;
          return parsed;
        }

        // Backup is verified! Safe to proceed with Rajkot transition.
        const transitionNotice: TransitionNotice = {
          id: 'rajkot_demo_transition',
          message:
            'Demo updated to Shri Manibhai Virani and Smt. Navalben Virani Science College (Autonomous), Rajkot. Previous Jaipur demo work is safely preserved in local backup.',
          backupKey: JAIPUR_BACKUP_STORAGE_KEY,
          createdAt: new Date().toISOString(),
          isError: false,
        };

        try {
          window.localStorage.setItem(TRANSITION_NOTICE_STORAGE_KEY, JSON.stringify(transitionNotice));
        } catch (e) {
          console.warn('PersistenceService: Failed to store transition notice in localStorage', e);
        }

        // Initialize fresh Rajkot seed database with transition notice (do NOT reattribute old work)
        const fresh = getFreshSeedDatabase();
        fresh.transitionNotice = transitionNotice;
        this.saveDatabase(fresh);
        return fresh;
      }

      const migrated = runMigrations(parsed);

      // If migrated version is different or contents were normalized, persist back
      if (parsed.schemaVersion !== migrated.schemaVersion || raw !== JSON.stringify(migrated)) {
        this.saveDatabase(migrated);
      }

      return migrated;
    } catch (err) {
      console.warn('PersistenceService: Failed to parse localStorage data. Resetting to fresh seed.', err);
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          window.localStorage.setItem('jansahabhag_malformed_backup_v1', raw);
        }
      } catch (backupErr) {
        console.warn('PersistenceService: Failed to preserve malformed raw data', backupErr);
      }
      const fresh = getFreshSeedDatabase();
      this.saveDatabase(fresh);
      return fresh;
    }
  }

  public static getJaipurBackup(): DemoDatabase | null {
    if (!this.isStorageAvailable()) return null;
    try {
      const raw = window.localStorage.getItem(JAIPUR_BACKUP_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public static hasJaipurBackup(): boolean {
    if (!this.isStorageAvailable()) return false;
    return Boolean(window.localStorage.getItem(JAIPUR_BACKUP_STORAGE_KEY));
  }

  public static getTransitionNotice(): TransitionNotice | null {
    if (!this.isStorageAvailable()) return null;
    try {
      const raw = window.localStorage.getItem(TRANSITION_NOTICE_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public static dismissTransitionNotice(): void {
    if (!this.isStorageAvailable()) return;
    try {
      window.localStorage.removeItem(TRANSITION_NOTICE_STORAGE_KEY);
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const db = JSON.parse(raw);
        if (db.transitionNotice) {
          delete db.transitionNotice;
          this.saveDatabase(db);
        }
      }
    } catch (e) {
      console.warn('PersistenceService: Failed to dismiss transition notice', e);
    }
  }

  public static saveDatabase(database: DemoDatabase): boolean {
    database.schemaVersion = CURRENT_SCHEMA_VERSION;

    if (!this.isStorageAvailable()) {
      return false;
    }

    try {
      const serialized = JSON.stringify(database);
      window.localStorage.setItem(STORAGE_KEY, serialized);
      inMemoryDatabase = null;
      return true;
    } catch (err) {
      console.error('PersistenceService: Storage failure (quota exceeded or storage disabled).', err);
      return false;
    }
  }

  public static resetDatabase(): DemoDatabase {
    const fresh = getFreshSeedDatabase();
    this.saveDatabase(fresh);
    return fresh;
  }

  public static getSchemaVersion(): number {
    return CURRENT_SCHEMA_VERSION;
  }

  public static getActiveUserId(): string {
    const db = this.loadDatabase();
    return db.activeUserId || 'VSC-S-001';
  }

  public static setActiveUserId(userId: string): void {
    const db = this.loadDatabase();
    db.activeUserId = userId;
    this.saveDatabase(db);
  }
}
