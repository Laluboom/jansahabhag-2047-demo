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

    const ankitaPrivate = privateItems.find((e) => e.ownerId === 'VSC-S-001');
    expect(ankitaPrivate).toBeDefined();
    expect(ankitaPrivate?.title).toContain('Personal Field Diary');
  });

  it('retrieving evidence list with ownerId returns only that user items', async () => {
    const ankitaEvidence = await demoRepository.getEvidenceList({ ownerId: 'VSC-S-001' });
    expect(ankitaEvidence.every((e) => e.ownerId === 'VSC-S-001')).toBe(true);

    const niyatiEvidence = await demoRepository.getEvidenceList({ ownerId: 'VSC-S-002' });
    expect(niyatiEvidence.every((e) => e.ownerId === 'VSC-S-002')).toBe(true);
  });
});
