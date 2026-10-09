import { describe, it, expect, beforeEach } from 'vitest';
import { demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';

describe('Evidence Privacy Isolation Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
  });

  it('contains private evidence items in the database that are scoped to owner', async () => {
    const allEvidence = await demoRepository.getEvidenceList();
    const privateItems = allEvidence.filter((e) => e.visibility === 'private');
    expect(privateItems.length).toBeGreaterThan(0);

    const aaravPrivate = privateItems.find((e) => e.ownerId === 'user_aarav');
    expect(aaravPrivate).toBeDefined();
    expect(aaravPrivate?.title).toContain('Personal Field Diary');
  });

  it('retrieving evidence list with ownerId returns only that user items', async () => {
    const aaravEvidence = await demoRepository.getEvidenceList({ ownerId: 'user_aarav' });
    expect(aaravEvidence.every((e) => e.ownerId === 'user_aarav')).toBe(true);

    const meeraEvidence = await demoRepository.getEvidenceList({ ownerId: 'user_meera' });
    expect(meeraEvidence.every((e) => e.ownerId === 'user_meera')).toBe(true);
  });
});
