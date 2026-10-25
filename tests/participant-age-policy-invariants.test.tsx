import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getFreshSeedDatabase } from '../src/data/seed';
import { DemoLoginPage } from '../src/features/auth-demo/DemoLoginPage';
import { OnboardingPage } from '../src/features/onboarding/OnboardingPage';
import { ProfilePage } from '../src/features/profile/ProfilePage';
import { useAuthStore } from '../src/stores/authStore';

describe('Participant Age Policy Invariant & Visible Requirement (Owner Decision 22 Oct 2026)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  describe('1. Seed Data Age Invariants', () => {
    it('guarantees EVERY seeded user is 18 years of age or older and student roster has 15 adults', () => {
      const db = getFreshSeedDatabase();
      expect(db.users.length).toBe(22);

      const under18Users = db.users.filter((u) => u.age === undefined || u.age < 18);
      expect(under18Users).toHaveLength(0);

      // Verify all 15 student personas are >= 18
      for (let i = 1; i <= 15; i++) {
        const id = `VSC-S-${String(i).padStart(3, '0')}`;
        const user = db.users.find((u) => u.id === id);
        expect(user).toBeDefined();
        expect(user!.age).toBeGreaterThanOrEqual(18);
        expect(user!.location).toContain('Rajkot');
        expect(user!.role).toBe('participant');
      }
    });

    it('preserves names, roles, institutions, and Rajkot narrative across all updated personas', () => {
      const db = getFreshSeedDatabase();
      const ankita = db.users.find((u) => u.id === 'VSC-S-001')!;
      expect(ankita.name).toBe('Ankita Kapri');
      expect(ankita.institutionId).toBe('inst_vsc_rajkot');
      expect(ankita.age).toBeGreaterThanOrEqual(18);

      const niyati = db.users.find((u) => u.id === 'VSC-S-002')!;
      expect(niyati.name).toBe('Niyati Chawda');
      expect(niyati.institutionId).toBe('inst_vsc_rajkot');

      const yash = db.users.find((u) => u.id === 'VSC-S-005')!;
      expect(yash.name).toBe('Yash Rathod');
      expect(yash.bio).toContain('Student participant');
      expect(yash.age).toBe(18);
    });

    it('ensures named user profiles avoid attributed personal claims, hobbies, exact neighbourhoods, and arbitrary ages', () => {
      const db = getFreshSeedDatabase();
      const studentIds = Array.from({ length: 15 }, (_, i) => `VSC-S-${String(i + 1).padStart(3, '0')}`);

      for (const id of studentIds) {
        const student = db.users.find((u) => u.id === id)!;
        // Age is strictly minimum policy sentinel 18
        expect(student.age).toBe(18);
        // Location is neutral Rajkot, Gujarat (no specific street addresses or neighbourhoods)
        expect(student.location).toBe('Rajkot, Gujarat');
        // Bio is strictly a neutral demo-role description
        expect(student.bio).toMatch(/^(Main student demo persona and participant|Student participant) at Shri Manibhai Virani and Smt\. Navalben Virani Science College/);
        // No invented passions, hobbies, personal achievements
        expect(student.bio).not.toMatch(/\b(passionate|passion|hobby|hobbies|resident of|living at|loves|advocate for|leading campus)\b/i);
      }

      // Non-students also use sentinel 18 and neutral institutional titles
      for (const user of db.users) {
        expect(user.age).toBe(18);
        expect(user.location).toBe('Rajkot, Gujarat');
      }
    });

    it('ensures no persona statements state participants are under 18 or minors', () => {
      const db = getFreshSeedDatabase();
      for (const u of db.users) {
        expect(u.bio).not.toMatch(/\b(14|15|16|17)\s*years?\s*old\b/i);
        expect(u.bio).not.toMatch(/\bunder-?18\b/i);
      }
    });
  });

  describe('2. Sign-in Screen (DemoLoginPage) Age Requirement Disclosure', () => {
    it('visibly states the 18+ participant requirement without claiming real identity verification', async () => {
      render(
        <MemoryRouter>
          <DemoLoginPage />
        </MemoryRouter>
      );

      const notice = await screen.findByTestId('participant-age-requirement-notice');
      expect(notice).toBeInTheDocument();
      expect(notice.textContent).toMatch(/18\+\s*participant age requirement/i);
      expect(notice.textContent).toMatch(/18 years of age or older/i);
      expect(notice.textContent).toMatch(/no real identity verification is claimed/i);
    });
  });

  describe('3. Onboarding Screen Age Input & Under-18 Prevention', () => {
    it('states the 18+ participant requirement on the onboarding screen', () => {
      render(
        <MemoryRouter>
          <OnboardingPage />
        </MemoryRouter>
      );

      const notice = screen.getByTestId('onboarding-age-requirement-notice');
      expect(notice).toBeInTheDocument();
      expect(notice.textContent).toMatch(/18\+\s*participant age requirement/i);
      expect(notice.textContent).toMatch(/no real identity verification is claimed/i);
    });

    it('renders an age confirmation input with default age >= 18 allowing continue', () => {
      render(
        <MemoryRouter>
          <OnboardingPage />
        </MemoryRouter>
      );

      const ageInput = screen.getByTestId('participant-age-input') as HTMLInputElement;
      expect(ageInput).toBeInTheDocument();
      expect(parseInt(ageInput.value, 10)).toBeGreaterThanOrEqual(18);

      const continueBtn = screen.getByTestId('onboarding-continue-btn');
      expect(continueBtn).not.toBeDisabled();
    });

    it('prevents demo sign-up / onboarding when an under-18 age is entered', async () => {
      render(
        <MemoryRouter>
          <OnboardingPage />
        </MemoryRouter>
      );

      const ageInput = screen.getByTestId('participant-age-input');
      const continueBtn = screen.getByTestId('onboarding-continue-btn');

      // Change age to 17 (under 18)
      fireEvent.change(ageInput, { target: { value: '17' } });

      // Continue button should be disabled
      expect(continueBtn).toBeDisabled();

      // Error message should be visible
      const errorMessage = screen.getByTestId('age-error-message');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage.textContent).toMatch(/participants must be 18 or older to sign up/i);
      expect(errorMessage.textContent).toMatch(/no real identity verification claimed/i);

      // Attempting to click should not advance to step 2
      fireEvent.click(continueBtn);
      expect(screen.queryByText(/Onboarding Complete!/i)).not.toBeInTheDocument();
    });

    it('clears error and allows proceeding when valid 18+ age is provided', () => {
      render(
        <MemoryRouter>
          <OnboardingPage />
        </MemoryRouter>
      );

      const ageInput = screen.getByTestId('participant-age-input');
      const continueBtn = screen.getByTestId('onboarding-continue-btn');

      // First enter under 18
      fireEvent.change(ageInput, { target: { value: '16' } });
      expect(continueBtn).toBeDisabled();

      // Correct to 18
      fireEvent.change(ageInput, { target: { value: '18' } });
      expect(continueBtn).not.toBeDisabled();
      expect(screen.queryByTestId('age-error-message')).not.toBeInTheDocument();

      // Proceed to Step 2
      fireEvent.click(continueBtn);
      expect(screen.getByText(/Onboarding Complete!/i)).toBeInTheDocument();
      expect(screen.getByTestId('confirmed-age-display').textContent).toMatch(/18 years/);
    });
  });

  describe('4. Active Persona Profile Declared Age Visibility', () => {
    it('displays declared age with 18+ compliance indicator on ProfilePage', async () => {
      useAuthStore.setState({
        currentUser: {
          id: 'VSC-S-001',
          name: 'Ankita Kapri',
          role: 'participant',
          email: 'vsc-s-001@demo.vsc.internal',
          username: 'ankita.kapri',
          avatar: '',
          institutionId: 'inst_vsc_rajkot',
          institutionName: 'Shri Manibhai Virani and Smt. Navalben Virani Science College (Autonomous), Rajkot',
          programmeIds: ['prog_rajkot_civic_data_01'],
          bio: 'Undergraduate student and civic action lead.',
          age: 18,
          location: 'Rajkot, Gujarat',
          badgeCount: 5,
          totalCredits: 2,
          schemaVersion: 1,
          createdAt: '2026-09-01T08:30:00Z',
          updatedAt: '2026-10-08T15:45:00Z',
        },
      });

      render(
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      );

      const ageEl = screen.getByTestId('profile-user-age');
      expect(ageEl).toBeInTheDocument();
      expect(ageEl.textContent).toContain('18 or older');
    });
  });
});
