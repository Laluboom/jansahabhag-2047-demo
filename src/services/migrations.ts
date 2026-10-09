import { DemoDatabase } from '../types/domain';
import { CURRENT_SCHEMA_VERSION, getFreshSeedDatabase } from '../data/seed';

export interface Migration {
  version: number;
  migrate: (prev: any) => DemoDatabase;
}

export const migrations: Migration[] = [
  {
    version: 1,
    migrate: (_prev: any) => {
      // Version 1 is baseline; return fresh seed if unknown or corrupted
      return getFreshSeedDatabase();
    },
  },
];

export function runMigrations(storedData: any): DemoDatabase {
  if (!storedData || typeof storedData !== 'object') {
    return getFreshSeedDatabase();
  }

  const storedVersion = Number(storedData.schemaVersion) || 0;

  if (storedVersion === CURRENT_SCHEMA_VERSION) {
    // Validate essential keys exist
    if (
      Array.isArray(storedData.users) &&
      Array.isArray(storedData.courses) &&
      Array.isArray(storedData.assemblies)
    ) {
      return storedData as DemoDatabase;
    }
  }

  // If incompatible version or missing critical arrays, apply migrations or reset
  const migration = migrations.find((m) => m.version === CURRENT_SCHEMA_VERSION);
  if (migration) {
    try {
      return migration.migrate(storedData);
    } catch {
      return getFreshSeedDatabase();
    }
  }

  return getFreshSeedDatabase();
}
