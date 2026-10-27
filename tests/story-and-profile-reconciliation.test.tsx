import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { seedAssignments } from '../src/data/seed/assignments';
import { seedEvidence } from '../src/data/seed/evidence';
import { seedEvents } from '../src/data/seed/events';
import { seedUsers } from '../src/data/seed/users';
import { SEEDED_ROLE_SUGGESTIONS } from '../src/services/roleAwareAiService';
import { ProfilePage } from '../src/features/profile/ProfilePage';
import { AboutPage } from '../src/features/about/AboutPage';
import { useAuthStore } from '../src/stores/authStore';

describe('Story and Profile Privacy Reconciliation', () => {
  describe('ProfilePage Privacy & Non-Contact Demo Labels', () => {
    it('renders "Demo profile — contact not shown" and never leaks emails for named demo personas', () => {
      const ankita = seedUsers.find((u) => u.id === 'VSC-S-001')!;
      useAuthStore.setState({ currentUser: ankita });

      render(
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      );

      expect(screen.getByTestId('profile-user-contact')).toHaveTextContent(
        'Demo profile — contact not shown'
      );
      expect(screen.queryByText(/@demo\.vsc\.internal/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/ankita\.kapri/i)).not.toBeInTheDocument();
    });

    it('suppresses invented contact details even when a non-demo-looking email is assigned to a named persona', () => {
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

      // Must strictly uphold privacy prohibition: no invented personal contact details attributed
      expect(screen.getByTestId('profile-user-contact')).toHaveTextContent(
        'Demo profile — contact not shown'
      );
      expect(screen.queryByText('real.contact@example.org')).not.toBeInTheDocument();
    });

    it('consistently hides personal contact details across all named seed personas on ProfilePage', () => {
      for (const persona of seedUsers) {
        useAuthStore.setState({ currentUser: persona });
        const { unmount } = render(
          <MemoryRouter>
            <ProfilePage />
          </MemoryRouter>
        );

        expect(screen.getByTestId('profile-user-contact')).toHaveTextContent(
          'Demo profile — contact not shown'
        );
        expect(screen.queryByText(/@/)).not.toBeInTheDocument();
        unmount();
      }
    });

    it('preserves approved public founder contact email on /about only', () => {
      render(
        <MemoryRouter>
          <AboutPage />
        </MemoryRouter>
      );

      const mailtoLink = screen.getByRole('link', { name: 'nazimsandhbehappy@gmail.com' });
      expect(mailtoLink).toHaveAttribute('href', 'mailto:nazimsandhbehappy@gmail.com');
    });
  });

  describe('Broad No-Legacy-Story Invariants', () => {
    it('verifies active visible seed items contain no legacy Jaipur/Mansarovar story locations or duplicate Rajkot strings', () => {
      const legacyPattern = /Mansarovar|Madhyam Marg|Navchetna Public School/i;

      // Active assignments prompts
      for (const asg of seedAssignments) {
        expect(asg.prompt).not.toMatch(legacyPattern);
      }

      // Evidence titles, descriptions, and locations
      for (const ev of seedEvidence) {
        expect(ev.title).not.toMatch(legacyPattern);
        expect(ev.description).not.toMatch(legacyPattern);
        if (ev.location) expect(ev.location).not.toMatch(legacyPattern);
      }

      // Events descriptions and locations
      for (const evt of seedEvents) {
        expect(evt.title).not.toMatch(legacyPattern);
        expect(evt.description).not.toMatch(legacyPattern);
        expect(evt.description).not.toMatch(/Rajkot,\s*Rajkot/i);
        if (evt.location) expect(evt.location).not.toMatch(legacyPattern);
      }

      // Role-aware practice prompts
      for (const sug of SEEDED_ROLE_SUGGESTIONS) {
        expect(sug.content).not.toMatch(legacyPattern);
        expect(sug.originalContent).not.toMatch(legacyPattern);
      }
    });
  });
});
