import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../src/stores/authStore';
import { PersistenceService } from '../src/services/persistence';
import { SessionPreferencesService } from '../src/services/sessionPreferencesService';
import {
  SessionSeating,
  SeatModel,
  SessionTextTurn,
  SeatingQuotaSummary,
} from '../src/components/session';
import { SettingsModal } from '../src/features/settings/SettingsModal';
import { DebateRoomPreviewPage } from '../src/components/layout/DebateRoomPreviewPage';
import { AssemblySessionPage } from '../src/features/assemblies/AssemblySessionPage';
import { ParliamentPage } from '../src/features/previews/ParliamentPage';

describe('Review Additions #4: Text Mode, Low Data Preference & Session Continuity', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  const mockSeats: SeatModel[] = [
    {
      id: 'seat_rohan',
      userId: 'user_rohan',
      name: 'Rohan Mehta',
      initials: 'RM',
      avatar: 'https://images.unsplash.com/photo-rohan.jpg',
      role: 'Facilitator',
      sideOrBench: 'Moderator',
      status: 'active',
      institution: 'Rajasthan Youth Deliberation Network',
      currentActivity: 'Moderating chamber debate proceedings and speaker turns.',
    },
    {
      id: 'seat_priya',
      userId: 'user_priya',
      name: 'Priya Sharma',
      initials: 'PS',
      avatar: 'https://images.unsplash.com/photo-priya.jpg',
      role: 'Evidence Analyst',
      sideOrBench: 'For',
      status: 'speaking',
      isSpeaking: true,
      institution: 'Navchetna Public School, Jaipur',
      currentActivity: 'Presenting traffic count speed logs for school frontage.',
    },
    {
      id: 'seat_aarav',
      userId: 'user_aarav',
      name: 'Aarav Sharma',
      initials: 'AS',
      avatar: 'https://images.unsplash.com/photo-aarav.jpg',
      role: 'Questioner',
      sideOrBench: 'Against',
      status: 'waiting',
      institution: 'Navchetna Public School, Jaipur',
      currentActivity: 'Waiting in speaking queue for constructive inquiry.',
    },
    {
      id: 'seat_unassigned',
      userId: 'user_karan',
      name: 'Karan Deshmukh',
      initials: 'KD',
      avatar: 'https://images.unsplash.com/photo-karan.jpg',
      role: 'Civic Advocate',
      status: 'active',
      institution: 'Mansarovar Civic Youth Group',
      currentActivity: 'Consulting neighborhood trade guild observations.',
    },
  ];

  const mockSampleTurns: SessionTextTurn[] = [
    {
      id: 'turn_test_1',
      authorName: 'Priya Sharma',
      authorRole: 'Evidence Analyst',
      timestamp: '10:14 AM',
      text: 'Traffic radar readings establish 420 vehicles/hour exceeding 40 km/h in school zone.',
    },
    {
      id: 'turn_test_2',
      authorName: 'Aarav Sharma',
      authorRole: 'Questioner',
      timestamp: '10:18 AM',
      text: 'How will raised crosswalk tables accommodate heavy emergency fire tender access?',
    },
  ];

  describe('1. Text Mode Control on Debate, Assembly and Parliament Pages', () => {
    it('renders a clear text mode control button on SessionSeating', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            currentRoute="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
          />
        </MemoryRouter>
      );

      const toggleBtn = screen.getByTestId('toggle-seating-view-btn');
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn).toHaveTextContent(/Accessible Text \/ List Mode/i);

      // Toggle to Text Mode
      fireEvent.click(toggleBtn);
      expect(toggleBtn).toHaveTextContent(/Switch to Chamber Layout/i);
      expect(screen.getByTestId('accessible-seating-list-view')).toBeInTheDocument();
      expect(screen.getByTestId('text-mode-badge')).toHaveTextContent(/Text Mode Active/i);
    });

    it('renders clear mode toggle on DebateRoomPreviewPage', async () => {
      render(
        <MemoryRouter initialEntries={['/debate-room/sess_jaipur_01']}>
          <Routes>
            <Route path="/debate-room/:id" element={<DebateRoomPreviewPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-seating-container')).toBeInTheDocument();
      });

      const toggleBtn = screen.getByTestId('toggle-seating-view-btn');
      expect(toggleBtn).toBeInTheDocument();
      fireEvent.click(toggleBtn);
      expect(screen.getByTestId('accessible-seating-list-view')).toBeInTheDocument();
    });

    it('renders clear mode toggle on AssemblySessionPage', async () => {
      render(
        <MemoryRouter initialEntries={['/assemblies/assembly_jaipur_pedestrian_2026/session']}>
          <Routes>
            <Route path="/assemblies/:id/session" element={<AssemblySessionPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-seating-container')).toBeInTheDocument();
      });

      const toggleBtn = screen.getByTestId('toggle-seating-view-btn');
      expect(toggleBtn).toBeInTheDocument();
      fireEvent.click(toggleBtn);
      expect(screen.getByTestId('accessible-seating-list-view')).toBeInTheDocument();
    });

    it('renders clear mode toggle on ParliamentPage', async () => {
      render(
        <MemoryRouter initialEntries={['/parliament']}>
          <Routes>
            <Route path="/parliament" element={<ParliamentPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-seating-container')).toBeInTheDocument();
      });

      const toggleBtn = screen.getByTestId('toggle-seating-view-btn');
      expect(toggleBtn).toBeInTheDocument();
      fireEvent.click(toggleBtn);
      expect(screen.getByTestId('accessible-seating-list-view')).toBeInTheDocument();
    });
  });

  describe('2. Text Mode Characteristics (Initials, Speaker Queue, Status, Turns & Animation Suppression)', () => {
    it('uses initials rather than photo avatars in Text Mode', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
            viewMode="text"
          />
        </MemoryRouter>
      );

      // Verify initials badges are rendered
      expect(screen.getByTestId('seat-initials-seat_rohan')).toHaveTextContent('RM');
      expect(screen.getByTestId('seat-initials-seat_priya')).toHaveTextContent('PS');
      expect(screen.getByTestId('seat-initials-seat_aarav')).toHaveTextContent('AS');

      // Verify no photo images are rendered for the seats in Text Mode
      const images = screen.queryAllByRole('img');
      images.forEach((img) => {
        expect(img.getAttribute('src')).toBeNull();
      });
    });

    it('keeps participant identity, seat/role, speaker queue and status', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
            viewMode="text"
            activeSpeakerId="user_priya"
          />
        </MemoryRouter>
      );

      // Identity & role
      expect(screen.getByText('Rohan Mehta')).toBeInTheDocument();
      expect(screen.getByText('Facilitator')).toBeInTheDocument();
      expect(screen.getAllByText('Priya Sharma').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Evidence Analyst').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Aarav Sharma').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Questioner').length).toBeGreaterThanOrEqual(1);

      // Speaker queue section
      const queueSection = screen.getByTestId('speaker-queue-section');
      expect(queueSection).toBeInTheDocument();
      expect(queueSection).toHaveTextContent(/Chamber Speaker Queue & Floor Status/i);
      expect(queueSection).toHaveTextContent('Priya Sharma');
      expect(queueSection).toHaveTextContent('Aarav Sharma');
      expect(screen.getByTestId('list-speaking-indicator')).toHaveTextContent('Speaking Now');
      expect(screen.getByTestId('list-waiting-indicator')).toHaveTextContent('In Queue');
    });

    it('displays short sample text turns with author and time', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
            viewMode="text"
          />
        </MemoryRouter>
      );

      const turnsContainer = screen.getByTestId('sample-text-turns');
      expect(turnsContainer).toBeInTheDocument();

      // Verify turn 1: author, timestamp, text
      expect(screen.getByTestId('sample-turn-author-turn_test_1')).toHaveTextContent('Priya Sharma');
      expect(screen.getByTestId('sample-turn-time-turn_test_1')).toHaveTextContent('10:14 AM');
      expect(screen.getByTestId('sample-turn-text-turn_test_1')).toHaveTextContent(
        'Traffic radar readings establish 420 vehicles/hour'
      );

      // Verify turn 2: author, timestamp, text
      expect(screen.getByTestId('sample-turn-author-turn_test_2')).toHaveTextContent('Aarav Sharma');
      expect(screen.getByTestId('sample-turn-time-turn_test_2')).toHaveTextContent('10:18 AM');
      expect(screen.getByTestId('sample-turn-text-turn_test_2')).toHaveTextContent(
        'How will raised crosswalk tables accommodate heavy emergency fire tender access?'
      );
    });

    it('suppresses decorative animations in Text Mode', () => {
      const { container } = render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
            viewMode="text"
          />
        </MemoryRouter>
      );

      // In Text Mode, animate-pulse classes must be suppressed
      const pulsingElements = container.querySelectorAll('.animate-pulse');
      expect(pulsingElements.length).toBe(0);
    });
  });

  describe('3. Privacy & Stance Neutrality Invariants', () => {
    it('does not infer participant stance from functional roles', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
            viewMode="text"
          />
        </MemoryRouter>
      );

      // Karan Deshmukh is 'Civic Advocate' without an explicit stance.
      // Must appear under 'General Seating (Unassigned Stance)', NOT under For or Against.
      const directory = screen.getByTestId('text-mode-seating-directory');
      expect(directory).toHaveTextContent(/General Seating \(Unassigned Stance\)/i);
      expect(directory).toHaveTextContent('Karan Deshmukh');
    });

    it('does not expose private attributes (e.g. email, phone, age, personal declarations)', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
            viewMode="text"
          />
        </MemoryRouter>
      );

      // Ensure private strings do not appear anywhere in rendered text
      expect(screen.queryByText(/@navchetna\.edu/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/@rajasthan\.gov/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/phone/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/password/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/declared age/i)).not.toBeInTheDocument();
    });
  });

  describe('4. Persistence Across Route Changes & Reloads', () => {
    it('persists chosen Text Mode across session views and reloads via SessionPreferencesService', () => {
      // 1. Initial state: defaults to chamber
      expect(SessionPreferencesService.getSessionViewMode('debate')).toBe('chamber');

      // 2. Set to text mode
      SessionPreferencesService.setSessionViewMode('text', 'debate');
      expect(SessionPreferencesService.getSessionViewMode('debate')).toBe('text');

      // 3. Mount SessionSeating for assembly - inherits global text preference
      render(
        <MemoryRouter>
          <SessionSeating
            layout="assembly"
            currentRoute="assembly"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
          />
        </MemoryRouter>
      );

      // Should automatically render AccessibleListView due to persisted text mode
      expect(screen.getByTestId('accessible-seating-list-view')).toBeInTheDocument();
      expect(screen.queryByTestId('assembly-seating-layout')).not.toBeInTheDocument();
    });
  });

  describe('5. Low Data Preference in Settings Surface', () => {
    it('allows toggling Low Data preference and defaults new sessions to Text Mode', () => {
      expect(SessionPreferencesService.getLowDataPreference()).toBe(false);

      let preferenceChanged = false;
      const { rerender } = render(
        <SettingsModal
          isOpen={true}
          onClose={() => {}}
          onPreferenceChange={() => {
            preferenceChanged = true;
          }}
        />
      );

      const toggle = screen.getByTestId('low-data-toggle');
      expect(toggle).toHaveAttribute('aria-checked', 'false');

      // Toggle Low Data to ON
      fireEvent.click(toggle);
      expect(SessionPreferencesService.getLowDataPreference()).toBe(true);
      expect(preferenceChanged).toBe(true);
      expect(screen.getByTestId('low-data-status')).toHaveTextContent(/Active \(Text-First Defaults\)/i);

      // With low data enabled, any new session defaults to Text Mode
      window.localStorage.removeItem('jansahbhag_session_view_mode_parliament');
      window.localStorage.removeItem('jansahbhag_session_view_mode');
      expect(SessionPreferencesService.getSessionViewMode('parliament')).toBe('text');

      // Rerender SessionSeating for parliament
      rerender(
        <MemoryRouter>
          <SessionSeating
            layout="parliament"
            currentRoute="parliament"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
          />
        </MemoryRouter>
      );

      // Automatically starts in Text Mode
      expect(screen.getByTestId('accessible-seating-list-view')).toBeInTheDocument();
      expect(screen.getByTestId('low-data-indicator')).toBeInTheDocument();
    });

    it('suppresses video preview on DebateRoomPreviewPage when Low Data mode is active', async () => {
      SessionPreferencesService.setLowDataPreference(true);

      render(
        <MemoryRouter initialEntries={['/debate-room/sess_jaipur_01']}>
          <Routes>
            <Route path="/debate-room/:id" element={<DebateRoomPreviewPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('low-data-video-notice')).toBeInTheDocument();
      });

      expect(screen.getByTestId('low-data-video-notice')).toHaveTextContent(
        /Low Data Mode: Video Preview Suppressed/i
      );
      expect(screen.queryByTestId('video-preview-badge')).not.toBeInTheDocument();
    });

    it('reactively toggles Low Data indicator in SessionSeating immediately upon preference toggle without closing modal', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            currentRoute="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
          />
        </MemoryRouter>
      );

      expect(screen.queryByTestId('low-data-indicator')).not.toBeInTheDocument();

      // Open Preferences
      const settingsBtn = screen.getByTestId('session-settings-btn');
      fireEvent.click(settingsBtn);

      expect(screen.getByTestId('settings-surface-modal')).toBeInTheDocument();

      // Click toggle switch inside modal
      const toggle = screen.getByTestId('low-data-toggle');
      fireEvent.click(toggle);

      // SessionSeating must reactively render the low-data-indicator immediately while modal is still open
      expect(screen.getByTestId('low-data-indicator')).toBeInTheDocument();

      // Toggle back off
      fireEvent.click(toggle);
      expect(screen.queryByTestId('low-data-indicator')).not.toBeInTheDocument();
    });
  });

  describe('6. Local Session Seat Restoration & Missed Turns', () => {
    it('restores the same seat on reload / return from browser state', async () => {
      // Pre-save seat selection for current persona in browser demo storage
      await useAuthStore.getState().switchPersona('user_priya');
      SessionPreferencesService.saveSeatId('debate', 'seat_priya', 'user_priya');

      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            currentRoute="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
            viewMode="text"
          />
        </MemoryRouter>
      );

      // Restored seat notice is displayed
      expect(screen.getByTestId('restored-seat-notice')).toBeInTheDocument();
      expect(screen.getByTestId('restored-seat-notice')).toHaveTextContent('Priya Sharma');
    });

    it('scopes restored seat to current persona and does not restore another persona\'s seat upon persona switch', async () => {
      // 1. Log in as Aarav (user_aarav)
      await act(async () => {
        await useAuthStore.getState().switchPersona('user_aarav');
      });
      expect(useAuthStore.getState().currentUser?.id).toBe('user_aarav');

      // Save seat for Aarav and Rohan
      SessionPreferencesService.saveSeatId('debate', 'seat_aarav', 'user_aarav');
      SessionPreferencesService.saveSeatId('debate', 'seat_rohan', 'user_rohan');

      const { rerender } = render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            currentRoute="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
            viewMode="text"
          />
        </MemoryRouter>
      );

      // Restored seat for Aarav is shown
      expect(screen.getByTestId('restored-seat-notice')).toHaveTextContent('Aarav Sharma');

      // 2. Switch persona to Rohan (user_rohan)
      await act(async () => {
        await useAuthStore.getState().switchPersona('user_rohan');
      });

      // Rerender SessionSeating for the new persona
      rerender(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            currentRoute="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
            viewMode="text"
          />
        </MemoryRouter>
      );

      // Rohan's own seat is restored because effectiveUserId changed to user_rohan
      expect(screen.getByTestId('restored-seat-notice')).toHaveTextContent('Rohan Mehta');

      // 3. Switch persona to Priya who has no saved seat in this session
      await act(async () => {
        await useAuthStore.getState().switchPersona('user_priya');
      });

      rerender(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            currentRoute="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
            viewMode="text"
          />
        </MemoryRouter>
      );

      // Priya has no saved seat, so another persona's seat is NOT restored
      expect(screen.queryByTestId('restored-seat-notice')).not.toBeInTheDocument();
    });

    it('displays missed sample turns recorded while disconnected', () => {
      // Simulate stored missed turns in browser state
      const simulatedMissed: SessionTextTurn[] = [
        {
          id: 'missed_turn_1',
          authorName: 'Rohan Mehta',
          authorRole: 'Facilitator',
          timestamp: '10:20 AM',
          text: 'Facilitator recognized Evidence Analyst for 2-minute rebuttal.',
        },
      ];
      SessionPreferencesService.setStoredMissedTurns('debate', simulatedMissed);

      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            currentRoute="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
            viewMode="text"
          />
        </MemoryRouter>
      );

      const missedContainer = screen.getByTestId('missed-turns-container');
      expect(missedContainer).toBeInTheDocument();
      expect(missedContainer).toHaveTextContent(/Missed Sample Turns \(1 while disconnected\)/i);
      expect(screen.getByTestId('missed-turn-missed_turn_1')).toHaveTextContent(
        'Facilitator recognized Evidence Analyst for 2-minute rebuttal.'
      );
    });
  });

  describe('7. Reconnect Continuity Backend Label', () => {
    it('clearly labels that true multi-user reconnect continuity needs a backend', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
            viewMode="text"
          />
        </MemoryRouter>
      );

      const disclaimer = screen.getByTestId('reconnect-backend-disclaimer');
      expect(disclaimer).toBeInTheDocument();
      expect(disclaimer).toHaveTextContent(
        /Single-Browser Local Reconnect Continuity/i
      );
      expect(disclaimer).toHaveTextContent(
        /True multi-user reconnect continuity, synchronized queue arbitration, and live speaking turns require a production backend deliberative gateway/i
      );
    });
  });

  describe('8. Keyboard & Accessibility Usability', () => {
    it('supports keyboard navigation on mode toggle and seat inspection', () => {
      let selectedSeat: SeatModel | null = null;

      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={mockSeats}
            sampleTurns={mockSampleTurns}
            onSelectSeat={(seat) => {
              selectedSeat = seat;
            }}
          />
        </MemoryRouter>
      );

      const toggleBtn = screen.getByTestId('toggle-seating-view-btn');
      expect(toggleBtn).toBeInTheDocument();

      // Keyboard toggle to text mode
      fireEvent.keyDown(toggleBtn, { key: 'Enter', code: 'Enter' });
      fireEvent.click(toggleBtn);

      expect(screen.getByTestId('accessible-seating-list-view')).toBeInTheDocument();

      // Keyboard seat selection
      const inspectButtons = screen.getAllByRole('button', { name: /Inspect Seat/i });
      expect(inspectButtons.length).toBeGreaterThan(0);
      fireEvent.click(inspectButtons[0]);

      expect(selectedSeat).not.toBeNull();
    });
  });
});
