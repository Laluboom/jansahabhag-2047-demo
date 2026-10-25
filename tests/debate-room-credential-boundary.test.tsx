import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { LocalDemoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { useAuthStore } from '../src/stores/authStore';
import { PassportPage } from '../src/features/passport/PassportPage';
import { AchievementsPage } from '../src/features/passport/AchievementsPage';

describe('Debate Room Verified Credential Boundary', () => {
  let repository: LocalDemoRepository;

  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    repository = new LocalDemoRepository();
    await useAuthStore.getState().switchPersona('VSC-S-005');
  });

  it('keeps session reflection strictly private: author sees it in debate room, excluded from civic passport, no badge, and assembly reflections still work', async () => {
    // Vikram initially has 0 reflection credits and 0 reflections
    const userBefore = await repository.getUser('VSC-S-005');
    const passportBefore = await repository.getPassport('VSC-S-005');
    const civicReflsBefore = await repository.getCivicReflections('VSC-S-005');

    expect(userBefore?.totalCredits).toBe(3);
    expect(passportBefore.totalCredits).toBe(3);
    expect(passportBefore.creditsByDimension.Reflection).toBe(0);
    expect(civicReflsBefore).toHaveLength(0);

    // Initial check on AchievementsPage: Civic Deliberative Reflector is In Progress
    const { unmount: unmountInitAch } = render(
      <MemoryRouter initialEntries={['/passport/achievements']}>
        <Routes>
          <Route path="/passport/achievements" element={<AchievementsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Civic Deliberative Reflector')).toBeInTheDocument();
    });
    const initBadgeCard = screen.getByText('Civic Deliberative Reflector').closest('.border-slate-200');
    expect(initBadgeCard?.textContent).toContain('In Progress');
    expect(initBadgeCard?.textContent).not.toContain('Unlocked');
    unmountInitAch();

    // 1. Vikram saves a private Debate Room session reflection
    const sessionRefl = await repository.addReflection({
      userId: 'VSC-S-005',
      contextType: 'session',
      contextId: 'sess_jaipur_01',
      prompt: 'How did the debate discussion shape your perspective?',
      text: 'Private debate journal: community observations confirmed tabletop ramps are essential.',
      valuesHighlighted: ['Civic Responsibility', 'Evidence-based Reasoning'],
      isPublicInPassport: false,
    });

    expect(sessionRefl.id).toBeDefined();
    expect(sessionRefl.contextType).toBe('session');
    expect(sessionRefl.isPublicInPassport).toBe(false);

    // 2. Author sees it in the Debate Room journal via getSessionReflections
    const authorSessionRefls = await repository.getSessionReflections('sess_jaipur_01', 'VSC-S-005');
    expect(authorSessionRefls.some((r) => r.id === sessionRefl.id)).toBe(true);

    // Author direct read works
    const directRead = await repository.getReflection(sessionRefl.id);
    expect(directRead).not.toBeNull();
    expect(directRead?.text).toBe(sessionRefl.text);

    // 3. No other persona sees it
    repository.switchUser('VSC-S-002');
    await useAuthStore.getState().switchPersona('VSC-S-002');

    const priyaSessionRefls = await repository.getSessionReflections('sess_jaipur_01', 'VSC-S-005');
    expect(priyaSessionRefls.some((r) => r.id === sessionRefl.id)).toBe(false);

    const priyaDirectRead = await repository.getReflection(sessionRefl.id);
    expect(priyaDirectRead).toBeNull();

    const priyaRefls = await repository.getReflections();
    expect(priyaRefls.some((r) => r.id === sessionRefl.id)).toBe(false);

    // Switch back to Vikram
    repository.switchUser('VSC-S-005');
    await useAuthStore.getState().switchPersona('VSC-S-005');

    // 4. Excluded from credential-facing civic reflections
    const civicReflsAfter = await repository.getCivicReflections('VSC-S-005');
    // On cbdbd35, getCivicReflections included session reflections for active persona!
    expect(civicReflsAfter.some((r) => r.id === sessionRefl.id)).toBe(false);
    expect(civicReflsAfter).toHaveLength(0);

    // 5. Total credits and passport entries do not grow
    const userAfter = await repository.getUser('VSC-S-005');
    const passportAfter = await repository.getPassport('VSC-S-005');
    expect(userAfter?.totalCredits).toBe(userBefore?.totalCredits);
    expect(passportAfter.totalCredits).toBe(passportBefore.totalCredits);
    expect(passportAfter.entries.length).toBe(passportBefore.entries.length);
    expect(passportAfter.creditsByDimension.Reflection).toBe(0);

    // 6. Absent from Civic Passport credential list UI
    const { unmount: unmountPassport } = render(
      <MemoryRouter initialEntries={['/passport']}>
        <Routes>
          <Route path="/passport" element={<PassportPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Civic Passport Portfolio/i)).toBeInTheDocument();
    });
    expect(
      screen.queryByText(/Private debate journal: community observations confirmed tabletop ramps are essential/i)
    ).not.toBeInTheDocument();
    unmountPassport();

    // 7. Absent from civic badge qualification (AchievementsPage must remain In Progress)
    const { unmount: unmountAch } = render(
      <MemoryRouter initialEntries={['/passport/achievements']}>
        <Routes>
          <Route path="/passport/achievements" element={<AchievementsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Civic Deliberative Reflector')).toBeInTheDocument();
    });
    const badgeCard = screen.getByText('Civic Deliberative Reflector').closest('.border-slate-200');
    expect(badgeCard?.textContent).toContain('In Progress');
    expect(badgeCard?.textContent).not.toContain('Unlocked');
    unmountAch();

    // 8. Standard Assembly civic reflection still appears in existing civic path
    const assemblyRefl = await repository.addReflection({
      userId: 'VSC-S-005',
      contextType: 'assembly',
      contextId: 'assembly_jaipur_pedestrian_2026',
      prompt: 'What did you observe regarding cross-group consensus in the youth assembly?',
      text: 'Assembly reflection: structured debate enabled cross-ward consensus on speed tables.',
      valuesHighlighted: ['Consensus', 'Constructive Dialogue'],
      isPublicInPassport: true,
    });

    // Appears in getCivicReflections
    const civicReflsWithAssembly = await repository.getCivicReflections('VSC-S-005');
    expect(civicReflsWithAssembly.some((r) => r.id === assemblyRefl.id)).toBe(true);

    // Earns credits (+1 Reflection)
    const userWithAssembly = await repository.getUser('VSC-S-005');
    expect(userWithAssembly?.totalCredits).toBe((userBefore?.totalCredits || 0) + 1);

    // Appears in PassportPage credentials
    const { unmount: unmountPassportAssembly } = render(
      <MemoryRouter initialEntries={['/passport']}>
        <Routes>
          <Route path="/passport" element={<PassportPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Civic & Ethical Reflections')).toBeInTheDocument();
    });
    expect(
      screen.getByText(/Assembly reflection: structured debate enabled cross-ward consensus on speed tables/i)
    ).toBeInTheDocument();
    unmountPassportAssembly();

    // Unlocks Civic Deliberative Reflector badge
    const { unmount: unmountAchAssembly } = render(
      <MemoryRouter initialEntries={['/passport/achievements']}>
        <Routes>
          <Route path="/passport/achievements" element={<AchievementsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Civic Deliberative Reflector')).toBeInTheDocument();
    });
    const unlockedCard = screen.getByText('Civic Deliberative Reflector').closest('.border-slate-200');
    expect(unlockedCard?.textContent).toContain('Unlocked');
    unmountAchAssembly();
  });
});
