import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../src/stores/authStore';
import { PersistenceService } from '../src/services/persistence';
import { demoRepository } from '../src/services/demoRepository';
import {
  SessionSeating,
  SeatModel,
  SeatingQuotaSummary,
} from '../src/components/session';
import { calculateReservedMinimum } from '../src/services/reservationAllocationService';
import { DebateRoomPreviewPage } from '../src/components/layout/DebateRoomPreviewPage';
import { AssemblySessionPage } from '../src/features/assemblies/AssemblySessionPage';
import { ParliamentPage } from '../src/features/previews/ParliamentPage';

describe('Reusable Accessible SessionSeating Component (V2 Section 4 + Additions 2 & 4)', () => {
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
      role: 'Evidence Analyst',
      sideOrBench: 'For',
      status: 'speaking',
      isSpeaking: true,
      isReserved: true,
      institution: 'Navchetna Public School, Jaipur',
      currentActivity: 'Presenting traffic count speed logs for school frontage.',
    },
    {
      id: 'seat_aarav',
      userId: 'user_aarav',
      name: 'Aarav Sharma',
      initials: 'AS',
      role: 'Questioner',
      sideOrBench: 'Against',
      status: 'waiting',
      institution: 'Navchetna Public School, Jaipur',
      currentActivity: 'Waiting in speaking queue for constructive inquiry.',
    },
    {
      id: 'seat_karan',
      userId: 'user_karan',
      name: 'Karan Deshmukh',
      initials: 'KD',
      role: 'Troubleshooter',
      sideOrBench: 'Troubleshooter Zone',
      status: 'active',
      hasDissent: true,
      dissentSummary: 'Concerned about emergency ambulance deflection and heavy delivery horn noise.',
      institution: 'Mansarovar Civic Youth Group',
      currentActivity: 'Logged formal reservation on speed table slope gradient.',
    },
  ];

  const mockQuota: SeatingQuotaSummary = {
    totalCapacity: 6,
    filledCount: 4,
    reservedMinimum: calculateReservedMinimum(6), // ceil(0.33 * 6) = 2
    reservedFilledCount: 1,
    vacanciesCount: 1,
    isIllustrative: false,
  };

  describe('Debate Layout Rendering', () => {
    it('renders facing For and Against benches with moderator bench and active speaker podium', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            currentRoute="debate"
            seats={mockSeats}
            quotaSummary={mockQuota}
            activeSpeakerId="user_priya"
          />
        </MemoryRouter>
      );

      // Verify layout container & title
      expect(screen.getByTestId('debate-seating-layout')).toBeInTheDocument();
      expect(screen.getByText(/Debate Room Chamber Seating/i)).toBeInTheDocument();

      // Verify moderator, for, and against benches
      expect(screen.getByText(/Moderator & Procedural Bench/i)).toBeInTheDocument();
      expect(screen.getByTestId('debate-bench-for')).toBeInTheDocument();
      expect(screen.getByTestId('debate-bench-against')).toBeInTheDocument();

      // Verify seats are present
      expect(screen.getByText('Rohan Mehta')).toBeInTheDocument();
      expect(screen.getAllByText('Priya Sharma').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Aarav Sharma')).toBeInTheDocument();

      // Verify central speaker podium has active speaker
      expect(screen.getByText(/Central Speaker's Podium/i)).toBeInTheDocument();
      expect(screen.getAllByTestId('speaking-badge').length).toBeGreaterThan(0);
    });
  });

  describe('Assembly Layout & Dissent Marker', () => {
    const assemblySeats: SeatModel[] = [
      {
        id: 'seat_thinker_1',
        name: 'Priya Sharma',
        role: 'Thinker',
        sideOrBench: 'Thinker Zone',
        status: 'active',
        institution: 'Navchetna Public School',
        currentActivity: 'Framing peak student crossing problem.',
      },
      {
        id: 'seat_enabler_1',
        name: 'Vikram Joshi',
        role: 'Enabler',
        sideOrBench: 'Enabler Zone',
        status: 'active',
        institution: 'JDA Youth Consultative Cell',
        currentActivity: 'Evaluating IRC-99 bulb-out engineering.',
      },
      {
        id: 'seat_trouble_1',
        name: 'Karan Deshmukh',
        role: 'Troubleshooter',
        sideOrBench: 'Troubleshooter Zone',
        status: 'active',
        hasDissent: true,
        dissentSummary: 'Monsoon drainage inundation risk.',
        institution: 'Civil Lines Youth Alliance',
        currentActivity: 'Raised red flag on drainage slope.',
      },
      {
        id: 'seat_shaper_1',
        name: 'Siddharth Nair',
        role: 'Shaper',
        sideOrBench: 'Shaper Zone',
        status: 'active',
        institution: 'Jaipur Safe Corridors Club',
        currentActivity: 'Drafting 3-tier proposition draft.',
      },
    ];

    it('renders four functional zones and displays assembly dissent marker', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="assembly"
            currentRoute="assembly"
            seats={assemblySeats}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('assembly-seating-layout')).toBeInTheDocument();
      expect(screen.getByTestId('assembly-zone-thinker')).toBeInTheDocument();
      expect(screen.getByTestId('assembly-zone-enabler')).toBeInTheDocument();
      expect(screen.getByTestId('assembly-zone-troubleshooter')).toBeInTheDocument();
      expect(screen.getByTestId('assembly-zone-shaper')).toBeInTheDocument();

      // Dissent marker visible for Karan Deshmukh
      expect(screen.getByTestId('dissent-marker-seat_trouble_1')).toBeInTheDocument();
    });
  });

  describe('Parliament Horseshoe Layout & Illustrative Notice', () => {
    const parliamentSeats: SeatModel[] = [
      {
        id: 'seat_speaker',
        name: 'Youth Advisory Panel',
        role: 'Presiding Speaker',
        sideOrBench: 'Speaker',
        status: 'active',
        institution: 'Apex Secretariat',
        currentActivity: 'Presiding over plenary.',
      },
      {
        id: 'seat_govt',
        name: 'Priya Sharma',
        role: 'Motion Sponsor',
        sideOrBench: 'Government',
        status: 'speaking',
        isSpeaking: true,
        institution: 'Jaipur Delegation',
        currentActivity: 'Presenting Motion #07.',
      },
      {
        id: 'seat_opp',
        name: 'Ananya Sen',
        role: 'Scrutiny Lead',
        sideOrBench: 'Opposition',
        status: 'active',
        institution: 'Kolkata Forum',
        currentActivity: 'Budget inquiry.',
      },
      {
        id: 'seat_cross',
        name: 'Vikram Rathore',
        role: 'Jaipur Delegate',
        sideOrBench: 'Cross-bench',
        status: 'active',
        institution: 'Jaipur Assembly',
        currentActivity: 'Deliberating.',
      },
    ];

    it('renders horseshoe with Speaker/Government/Opposition/Cross-benches and illustrative disclaimer', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="parliament"
            currentRoute="parliament"
            seats={parliamentSeats}
            isIllustrative={true}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('parliament-seating-layout')).toBeInTheDocument();
      expect(screen.getByTestId('parliament-bench-government')).toBeInTheDocument();
      expect(screen.getByTestId('parliament-bench-opposition')).toBeInTheDocument();
      expect(screen.getByTestId('parliament-bench-crossbench')).toBeInTheDocument();

      // Explicit illustrative prototype label without enforcement claim
      expect(screen.getByTestId('parliament-illustrative-badge')).toHaveTextContent(
        'Illustrative Seating Prototype — No Statutory Claim'
      );
      expect(screen.getByTestId('parliament-illustrative-callout')).toBeInTheDocument();
    });
  });

  describe('Seat Selection & Concise Detail Card', () => {
    it('reveals detail card with institution and current activity upon selecting a seat', async () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={mockSeats}
          />
        </MemoryRouter>
      );

      // Detail card is initially not shown
      expect(screen.queryByTestId('seat-detail-card')).not.toBeInTheDocument();

      // Select Priya Sharma's seat
      const priyaSeat = screen.getByTestId('seat-item-seat_priya');
      fireEvent.click(priyaSeat);

      // Detail card is revealed
      expect(screen.getByTestId('seat-detail-card')).toBeInTheDocument();
      expect(screen.getByTestId('seat-detail-institution')).toHaveTextContent('Navchetna Public School, Jaipur');
      expect(screen.getByTestId('seat-detail-activity')).toHaveTextContent('Presenting traffic count speed logs');
      expect(screen.getByTestId('seat-detail-reserved')).toBeInTheDocument();

      // Dismiss detail card
      const closeBtn = screen.getByTestId('close-seat-detail-btn');
      fireEvent.click(closeBtn);
      expect(screen.queryByTestId('seat-detail-card')).not.toBeInTheDocument();
    });

    it('shows dissent details on detail card when selecting a delegate with registered dissent', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="assembly"
            seats={mockSeats}
          />
        </MemoryRouter>
      );

      const karanSeat = screen.getByTestId('seat-item-seat_karan');
      fireEvent.click(karanSeat);

      expect(screen.getByTestId('seat-detail-card')).toBeInTheDocument();
      expect(screen.getByTestId('seat-detail-dissent')).toHaveTextContent(
        'Concerned about emergency ambulance deflection'
      );
    });
  });

  describe('Accessible Text / List Mode View', () => {
    it('toggles between visual layout and accessible text/list mode', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={mockSeats}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('debate-seating-layout')).toBeInTheDocument();
      expect(screen.queryByTestId('accessible-seating-list-view')).not.toBeInTheDocument();

      // Toggle to text/list mode
      const toggleBtn = screen.getByTestId('toggle-seating-view-btn');
      fireEvent.click(toggleBtn);

      expect(screen.queryByTestId('debate-seating-layout')).not.toBeInTheDocument();
      expect(screen.getByTestId('accessible-seating-list-view')).toBeInTheDocument();
      expect(screen.getByText(/Accessible Chamber Seating Directory/i)).toBeInTheDocument();

      // Toggle back to visual chamber layout
      fireEvent.click(toggleBtn);
      expect(screen.getByTestId('debate-seating-layout')).toBeInTheDocument();
    });
  });

  describe('33% Reservation Allocation Quota Display', () => {
    it('displays capacity, 33% formula minimum, reserved filled count, and vacancies count', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={mockSeats}
            quotaSummary={mockQuota}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('seating-quota-display')).toBeInTheDocument();
      expect(screen.getByTestId('seating-quota-total')).toHaveTextContent('6');
      expect(screen.getByTestId('seating-quota-minimum')).toHaveTextContent('2'); // ceil(0.33 * 6) = 2
      expect(screen.getByTestId('seating-quota-reserved-filled')).toHaveTextContent('1 / 2');
      expect(screen.getByTestId('seating-quota-vacancies')).toHaveTextContent('1');
    });

    it('labels quota as illustrative prototype when isIllustrative is true', () => {
      const illustrativeQuota: SeatingQuotaSummary = {
        ...mockQuota,
        isIllustrative: true,
        illustrativeNotice: 'Illustrative 3-seat Jaipur delegation calculation.',
      };

      render(
        <MemoryRouter>
          <SessionSeating
            layout="parliament"
            seats={mockSeats}
            quotaSummary={illustrativeQuota}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('illustrative-quota-badge')).toHaveTextContent(
        'Illustrative Prototype Allocation (No Enforcement Claim)'
      );
      expect(screen.getByText('Illustrative 3-seat Jaipur delegation calculation.')).toBeInTheDocument();
    });
  });

  describe('Mode Switcher Bar Navigation', () => {
    it('renders mode links to Debate, Assembly, and Parliament with active highlight', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            currentRoute="debate"
            seats={mockSeats}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('chamber-mode-switcher')).toBeInTheDocument();

      const debateLink = screen.getByTestId('mode-switch-debate');
      const assemblyLink = screen.getByTestId('mode-switch-assembly');
      const parliamentLink = screen.getByTestId('mode-switch-parliament');

      expect(debateLink).toHaveAttribute('href', '/debate-room');
      expect(debateLink).toHaveAttribute('aria-selected', 'true');

      expect(assemblyLink).toHaveAttribute('href', '/assemblies/assembly_jaipur_pedestrian_2026/session');
      expect(assemblyLink).toHaveAttribute('aria-selected', 'false');

      expect(parliamentLink).toHaveAttribute('href', '/parliament');
      expect(parliamentLink).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Page Integration Verification', () => {
    it('renders SessionSeating inside DebateRoomPreviewPage with active debate roster', async () => {
      await useAuthStore.getState().switchPersona('user_aarav');

      render(
        <MemoryRouter initialEntries={['/debate-room']}>
          <Routes>
            <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-seating-container')).toBeInTheDocument();
        expect(screen.getByTestId('debate-seating-layout')).toBeInTheDocument();
        expect(screen.getByTestId('seating-quota-display')).toBeInTheDocument();
      });

      // Existing procedure controls remain present and functional
      expect(screen.getByTestId('debate-reservation-rulebook-banner')).toBeInTheDocument();
      expect(screen.getByTestId('debate-reservation-allocations-card')).toBeInTheDocument();
    });

    it('renders SessionSeating inside AssemblySessionPage with functional zones and dissent markers', async () => {
      await useAuthStore.getState().switchPersona('user_aarav');
      await demoRepository.joinAssembly('assembly_jaipur_pedestrian_2026', 'user_aarav');

      render(
        <MemoryRouter initialEntries={['/assemblies/assembly_jaipur_pedestrian_2026/session']}>
          <Routes>
            <Route path="/assemblies/:id/session" element={<AssemblySessionPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-seating-container')).toBeInTheDocument();
        expect(screen.getByTestId('assembly-seating-layout')).toBeInTheDocument();
        expect(screen.getByTestId('seating-quota-display')).toBeInTheDocument();
      });

      // Existing procedural buttons remain present
      expect(screen.getAllByRole('button', { name: /Rulebook/i }).length).toBeGreaterThanOrEqual(1);
    });

    it('renders SessionSeating inside ParliamentPage with horseshoe layout and illustrative badge', async () => {
      render(
        <MemoryRouter initialEntries={['/parliament']}>
          <Routes>
            <Route path="/parliament" element={<ParliamentPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-seating-container')).toBeInTheDocument();
        expect(screen.getByTestId('parliament-seating-layout')).toBeInTheDocument();
        expect(screen.getByTestId('parliament-illustrative-badge')).toBeInTheDocument();
      });

      // Existing scenario buttons remain intact
      expect(screen.getByTestId('scenario-btn-compliant')).toBeInTheDocument();
      expect(screen.getByTestId('scenario-btn-noncompliant')).toBeInTheDocument();
    });
  });
});
