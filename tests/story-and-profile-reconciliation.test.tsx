import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { seedAssignments } from '../src/data/seed/assignments';
import { seedEvidence } from '../src/data/seed/evidence';
import { seedEvents } from '../src/data/seed/events';
import { seedAssemblies } from '../src/data/seed/assemblies';
import { seedUsers } from '../src/data/seed/users';
import { SEEDED_ROLE_SUGGESTIONS } from '../src/services/roleAwareAiService';
import { ProfilePage } from '../src/features/profile/ProfilePage';
import { CivicIssuesPage } from '../src/features/issues/CivicIssuesPage';
import { AboutPage } from '../src/features/about/AboutPage';
import { useAuthStore } from '../src/stores/authStore';

describe('Story and Profile Mismatch Reconciliation (27 October 2026)', () => {
  describe('1. Demo Copy & Story Location Consistency (Rajkot Pedestrian-Safety Scenario)', () => {
    it('seed assignment asg_map_07 prompt references Kalawad Road outside Virani Science College, not Mansarovar or Madhyam Marg', () => {
      const asg = seedAssignments.find((a) => a.id === 'asg_map_07');
      expect(asg).toBeDefined();
      expect(asg?.prompt).toContain('Kalawad Road outside Virani Science College, Rajkot');
      expect(asg?.prompt).not.toMatch(/Mansarovar/i);
      expect(asg?.prompt).not.toMatch(/Madhyam Marg/i);
    });

    it('seed evidence items (ev_vikram_photo_01, ev_siddharth_audio_01, ev_offline_cleanup_01) reference Rajkot/Kalawad Road instead of Mansarovar', () => {
      const evPhoto = seedEvidence.find((e) => e.id === 'ev_vikram_photo_01');
      expect(evPhoto).toBeDefined();
      expect(evPhoto?.title).toContain('Kalawad Road Walkway');
      expect(evPhoto?.title).not.toMatch(/Mansarovar/i);

      const evAudio = seedEvidence.find((e) => e.id === 'ev_siddharth_audio_01');
      expect(evAudio).toBeDefined();
      expect(evAudio?.location).toBe('Kalawad Road Traffic Circle, Rajkot');
      expect(evAudio?.location).not.toMatch(/Mansarovar/i);

      const evCleanup = seedEvidence.find((e) => e.id === 'ev_offline_cleanup_01');
      expect(evCleanup).toBeDefined();
      expect(evCleanup?.description).toContain('Kalawad Road Sector 3');
      expect(evCleanup?.description).not.toMatch(/Mansarovar/i);
      expect(evCleanup?.location).toBe('Kalawad Road Sector 3 Public Corridor, Rajkot');
      expect(evCleanup?.location).not.toMatch(/Mansarovar/i);
    });

    it('seed event evt_green_canopy_04 does not repeat "Rajkot, Rajkot, and Rajkot"', () => {
      const event = seedEvents.find((e) => e.id === 'evt_green_canopy_04');
      expect(event).toBeDefined();
      expect(event?.description).not.toContain('Rajkot, Rajkot, and Rajkot');
      expect(event?.description).toContain('Rajkot, Vadodara, and Ahmedabad');
    });

    it('seed assembly assembly_green_canopy_2026 does not repeat "Rajkot and Rajkot"', () => {
      const assembly = seedAssemblies.find((a) => a.id === 'assembly_green_canopy_2026');
      expect(assembly).toBeDefined();
      expect(assembly?.description).not.toContain('Rajkot and Rajkot');
      expect(assembly?.description).toContain('Rajkot and Vadodara');
    });

    it('roleAwareAiService participant practice prompt sug_part_prompt_01 references Kalawad Road Ward 8, not Mansarovar Ward 24', () => {
      const sug = SEEDED_ROLE_SUGGESTIONS.find((s) => s.id === 'sug_part_prompt_01');
      expect(sug).toBeDefined();
      expect(sug?.content).toContain('Kalawad Road Ward 8');
      expect(sug?.content).not.toMatch(/Mansarovar/i);
      expect(sug?.content).not.toMatch(/Ward 24/i);
      expect(sug?.originalContent).toContain('Kalawad Road Ward 8');
      expect(sug?.originalContent).not.toMatch(/Mansarovar/i);
    });

    it('CivicIssuesPage location placeholder references Kalawad Road / Rajkot, not Madhyam Marg or Mansarovar', async () => {
      render(
        <MemoryRouter>
          <CivicIssuesPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Report Danger Spot')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Report Danger Spot'));

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/Kalawad Road outside Virani Science College, Rajkot/i)
        ).toBeInTheDocument();
      });
      expect(screen.queryByPlaceholderText(/Mansarovar/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Madhyam Marg/i)).not.toBeInTheDocument();
    });
  });

  describe('2. ProfilePage Persona Contact Privacy & Honest Non-Contact Label', () => {
    it('hides synthetic demo email from the visible profile and shows an honest non-contact demo label for Ankita Kapri', async () => {
      const ankita = seedUsers.find((u) => u.id === 'VSC-S-001');
      expect(ankita).toBeDefined();
      useAuthStore.setState({ currentUser: ankita });

      render(
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      );

      // Must not display synthetic email
      expect(screen.queryByText(/@demo\.vsc\.internal/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/ankita\.kapri@demo\.vsc\.internal/i)).not.toBeInTheDocument();

      // Must show honest non-contact demo label
      const contactEl = screen.getByTestId('profile-user-contact');
      expect(contactEl).toBeInTheDocument();
      expect(contactEl.textContent).toMatch(/Non-contact demo/i);
      expect(contactEl.textContent).toMatch(/no personal details attributed/i);
    });

    it('hides synthetic demo email across all named seed personas on ProfilePage', async () => {
      for (const persona of seedUsers) {
        useAuthStore.setState({ currentUser: persona });
        const { unmount } = render(
          <MemoryRouter>
            <ProfilePage />
          </MemoryRouter>
        );

        expect(screen.queryByText(/@demo\./i)).not.toBeInTheDocument();
        expect(screen.queryByText(/\.internal/i)).not.toBeInTheDocument();

        const contactEl = screen.getByTestId('profile-user-contact');
        expect(contactEl.textContent).toMatch(/Non-contact demo/i);

        unmount();
      }
    });

    it('displays genuine email if a non-synthetic email is present', async () => {
      const ankita = seedUsers.find((u) => u.id === 'VSC-S-001')!;
      useAuthStore.setState({
        currentUser: {
          ...ankita,
          email: 'real.contact@example.org',
        },
      });

      render(
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      );

      const contactEl = screen.getByTestId('profile-user-contact');
      expect(contactEl).toHaveTextContent('real.contact@example.org');
    });
  });

  describe('3. Public Contact Email on /about Preservation', () => {
    it('preserves the explicitly approved public founder contact email on /about', () => {
      render(
        <MemoryRouter>
          <AboutPage />
        </MemoryRouter>
      );

      const mailtoLink = screen.getByRole('link', { name: 'nazimsandhbehappy@gmail.com' });
      expect(mailtoLink).toBeInTheDocument();
      expect(mailtoLink).toHaveAttribute('href', 'mailto:nazimsandhbehappy@gmail.com');
    });
  });
});
