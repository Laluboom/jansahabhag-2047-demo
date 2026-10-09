import { DemoDatabase } from '../types/domain';
import { CURRENT_SCHEMA_VERSION, getFreshSeedDatabase } from '../data/seed';
import { runMigrations } from './migrations';

export const STORAGE_KEY = 'jansahbhag_demo_v1';

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
      const migrated = runMigrations(parsed);

      // If migrated version is different, persist back
      if (parsed.schemaVersion !== migrated.schemaVersion) {
        this.saveDatabase(migrated);
      }

      return migrated;
    } catch (err) {
      console.warn('PersistenceService: Failed to parse localStorage data. Resetting to fresh seed.', err);
      const fresh = getFreshSeedDatabase();
      this.saveDatabase(fresh);
      return fresh;
    }
  }

  public static saveDatabase(database: DemoDatabase): boolean {
    database.schemaVersion = CURRENT_SCHEMA_VERSION;

    if (!this.isStorageAvailable()) {
      inMemoryDatabase = JSON.parse(JSON.stringify(database));
      return true;
    }

    try {
      const serialized = JSON.stringify(database);
      window.localStorage.setItem(STORAGE_KEY, serialized);
      return true;
    } catch (err) {
      console.error('PersistenceService: Storage failure (quota or disabled). Falling back to in-memory.', err);
      inMemoryDatabase = JSON.parse(JSON.stringify(database));
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
    return db.activeUserId || 'user_aarav';
  }

  public static setActiveUserId(userId: string): void {
    const db = this.loadDatabase();
    db.activeUserId = userId;
    this.saveDatabase(db);
  }
}
