import { describe, it, expect, beforeEach } from 'vitest';
import { PersistenceService, STORAGE_KEY } from '../src/services/persistence';
import { CURRENT_SCHEMA_VERSION, getFreshSeedDatabase } from '../src/data/seed';

describe('Persistence Adapter & Schema Migrations', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('loads fresh seed database on first launch and saves to jansahbhag_demo_v1', () => {
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();

    const db = PersistenceService.loadDatabase();
    expect(db.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(db.activeUserId).toBe('user_aarav');

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
    expect(resetDb.users[0].name).toBe('Aarav Sharma');
    expect(resetDb.credits.length).toBeGreaterThanOrEqual(20);

    const reloaded = PersistenceService.loadDatabase();
    expect(reloaded.users[0].name).toBe('Aarav Sharma');
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
});
