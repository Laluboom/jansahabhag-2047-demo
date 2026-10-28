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
  computeSeatingQuotaFromAllocations,
} from '../src/components/session';
import {
  calculateReservedMinimum,
  buildAllocationState,
  buildSessionRoleAllocations,
} from '../src/services/reservationAllocationService';
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
      userId: 'VSC-S-009',
      name: 'Aroh Mehta',
      initials: 'RM',
      role: 'Facilitator',
      sideOrBench: 'Moderator',
      status: 'active',
      institution: 'Rajasthan Youth Deliberation Network',
      currentActivity: 'Moderating chamber debate proceedings and speaker turns.',
    },
    {
      id: 'seat_priya',
      userId: 'VSC-S-002',
      name: 'Niyati Chawda',
      initials: 'PS',
      role: 'Evidence Analyst',
      sideOrBench: 'For',
      status: 'speaking',
      isSpeaking: true,
      institution: 'Navchetna Public School, Jaipur',
      currentActivity: 'Presenting traffic count speed logs for school frontage.',
    },
    {
      id: 'seat_aarav',
      userId: 'VSC-S-001',
      name: 'Ankita Kapri',
      initials: 'AS',
      role: 'Questioner',
      sideOrBench: 'Against',
      status: 'waiting',
      institution: 'Navchetna Public School, Jaipur',
      currentActivity: 'Waiting in speaking queue for constructive inquiry.',
    },
    {
      id: 'seat_karan',
      userId: 'VSC-S-010',
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
            activeSpeakerId="VSC-S-002"
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
      expect(screen.getByText('Aroh Mehta')).toBeInTheDocument();
      expect(screen.getAllByText('Niyati Chawda').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Ankita Kapri')).toBeInTheDocument();

      // Verify central speaker podium has active speaker
      expect(screen.getByText(/Central Speaker's Podium/i)).toBeInTheDocument();
      expect(screen.getAllByTestId('speaking-badge').length).toBeGreaterThan(0);
    });

    it('does not infer For/Against stance from functional roles when stance is unknown', () => {
      // Evidence Analyst (Priya) and Questioner (Aarav) with no explicit sideOrBench
      const unassignedSeats: SeatModel[] = [
        {
          id: 'seat_analyst',
          userId: 'VSC-S-002',
          name: 'Niyati Chawda',
          role: 'Evidence Analyst',
          status: 'active',
          institution: 'Navchetna Public School',
        },
        {
          id: 'seat_questioner',
          userId: 'VSC-S-001',
          name: 'Ankita Kapri',
          role: 'Questioner',
          status: 'active',
          institution: 'Navchetna Public School',
        },
        {
          id: 'seat_facilitator',
          userId: 'VSC-S-009',
          name: 'Aroh Mehta',
          role: 'Facilitator',
          status: 'active',
          institution: 'Rajasthan Youth Deliberation Network',
        },
      ];

      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={unassignedSeats}
          />
        </MemoryRouter>
      );

      // Facilitator remains correctly assigned to Moderator bench supported by actual role
      const moderatorBench = screen.getByTestId('debate-bench-moderator');
      expect(moderatorBench).toHaveTextContent('Aroh Mehta');

      // Proposition bench (For) and Opposition bench (Against) are visual placeholders awaiting stance
      const forBench = screen.getByTestId('debate-bench-for');
      expect(forBench).toHaveTextContent(/Visual placeholder bench awaiting explicit participant stance/i);
      expect(forBench).not.toHaveTextContent('Niyati Chawda');
      expect(forBench).not.toHaveTextContent('Ankita Kapri');

      const againstBench = screen.getByTestId('debate-bench-against');
      expect(againstBench).toHaveTextContent(/Visual placeholder bench awaiting explicit participant stance/i);
      expect(againstBench).not.toHaveTextContent('Niyati Chawda');
      expect(againstBench).not.toHaveTextContent('Ankita Kapri');

      // Evidence Analyst and Questioner appear in the Neutral / Unassigned delegates area
      const neutralBench = screen.getByTestId('debate-bench-neutral');
      expect(neutralBench).toBeInTheDocument();
      expect(neutralBench).toHaveTextContent('Niyati Chawda');
      expect(neutralBench).toHaveTextContent('Evidence Analyst');
      expect(neutralBench).toHaveTextContent('Ankita Kapri');
      expect(neutralBench).toHaveTextContent('Questioner');
    });
  });

  describe('Assembly Layout & Dissent Marker', () => {
    const assemblySeats: SeatModel[] = [
      {
        id: 'seat_thinker_1',
        name: 'Niyati Chawda',
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
        name: 'Niyati Chawda',
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

    it('omits the Evaluation Panel section when no panellists are seated', () => {
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

      expect(screen.queryByTestId('parliament-bench-evaluation')).not.toBeInTheDocument();
    });

    it('groups Evaluation Panel assessors apart from the cross-benches and states they do not score positions', () => {
      const withPanel: SeatModel[] = [
        ...parliamentSeats,
        {
          id: 'seat_eval_procedure',
          name: 'Sunita Rege',
          role: 'Procedure Assessor',
          sideOrBench: 'Evaluation Panel',
          status: 'active',
          institution: 'Apex Secretariat',
          currentActivity: 'Noting the order motions were put in.',
        },
        {
          id: 'seat_eval_evidence',
          name: 'Farhan Ali',
          role: 'Evidence Assessor',
          sideOrBench: 'Evaluation Panel',
          status: 'active',
          institution: 'Apex Secretariat',
          currentActivity: 'Checking cited figures against the evidence dock.',
        },
      ];

      render(
        <MemoryRouter>
          <SessionSeating
            layout="parliament"
            currentRoute="parliament"
            seats={withPanel}
            isIllustrative={true}
          />
        </MemoryRouter>
      );

      const panel = screen.getByTestId('parliament-bench-evaluation');
      expect(panel).toBeInTheDocument();
      expect(panel).toHaveTextContent('Evaluation Panel (2)');

      // Both assessors belong to the panel, not the cross-bench catch-all.
      expect(panel).toHaveTextContent('Sunita Rege');
      expect(panel).toHaveTextContent('Farhan Ali');

      const crossBench = screen.getByTestId('parliament-bench-crossbench');
      expect(crossBench).not.toHaveTextContent('Sunita Rege');
      expect(crossBench).not.toHaveTextContent('Farhan Ali');
      // The ordinary cross-bench delegate is unaffected by the new grouping.
      expect(crossBench).toHaveTextContent('Vikram Rathore');

      // The no-ideological-scoring boundary is stated on screen, not implied.
      expect(panel).toHaveTextContent(
        /do not score positions, award civic credits or decide outcomes/i
      );
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

      // Select Niyati Chawda's seat
      const priyaSeat = screen.getByTestId('seat-item-seat_priya');
      fireEvent.click(priyaSeat);

      // Detail card is revealed
      expect(screen.getByTestId('seat-detail-card')).toBeInTheDocument();
      expect(screen.getByTestId('seat-detail-institution')).toHaveTextContent('Navchetna Public School, Jaipur');
      expect(screen.getByTestId('seat-detail-activity')).toHaveTextContent('Presenting traffic count speed logs');
      expect(screen.getByTestId('seat-detail-generic-policy')).toBeInTheDocument();

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

    it('displays generic policy indicator in quota banner', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={mockSeats}
            quotaSummary={mockQuota}
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('generic-policy-indicator')).toBeInTheDocument();
      expect(screen.getByTestId('generic-policy-indicator')).toHaveTextContent(
        /33% Women's Reservation Policy applies per named role/i
      );
    });
  });

  describe('Sum-of-per-role Rounding vs Global Rounding', () => {
    it('sums per-role minimums across 7 one-place debate roles resulting in 7, not global ceil(0.33 * 7) = 3', () => {
      const canonicalRoles = [
        'Facilitator',
        'Questioner',
        'Evidence Analyst',
        'Civic Advocate',
        'Community Voice',
        'Synthesiser',
        'Rapporteur',
      ];

      // Build per-role allocations: each has 1 place -> ceil(0.33 * 1) = 1
      const roleAllocations: Record<string, any> = {};
      for (const role of canonicalRoles) {
        roleAllocations[role] = buildAllocationState({
          allocationId: `alloc_test_${role.toLowerCase().replace(/\s+/g, '_')}`,
          allocationType: 'named_roles',
          title: `${role} Allocation`,
          totalPlaces: 1,
          confirmedOccupants: [],
        });
        expect(roleAllocations[role].reservedMinimum).toBe(1);
      }

      const quota = computeSeatingQuotaFromAllocations(roleAllocations);
      expect(quota.totalCapacity).toBe(7);
      // Sum of per-role minimums is 7
      expect(quota.reservedMinimum).toBe(7);
      // In contrast, global rounding on the total capacity of 7 would have been ceil(0.33 * 7) = 3
      expect(calculateReservedMinimum(7)).toBe(3);
      expect(quota.reservedMinimum).not.toBe(calculateReservedMinimum(7));
    });

    it('sums per-role minimums across 4 two-place assembly roles resulting in 4, not global ceil(0.33 * 8) = 3', () => {
      const zones = ['Thinker', 'Enabler', 'Troubleshooter', 'Shaper'];
      const roleAllocations: Record<string, any> = {};

      for (const zone of zones) {
        // 2 places per role -> ceil(0.33 * 2) = 1
        roleAllocations[zone] = buildAllocationState({
          allocationId: `alloc_test_${zone.toLowerCase()}`,
          allocationType: 'named_roles',
          title: `${zone} Zone`,
          totalPlaces: 2,
          confirmedOccupants: [],
        });
        expect(roleAllocations[zone].reservedMinimum).toBe(1);
      }

      const quota = computeSeatingQuotaFromAllocations(roleAllocations);
      expect(quota.totalCapacity).toBe(8);
      // Sum of per-role minimums: 1 + 1 + 1 + 1 = 4
      expect(quota.reservedMinimum).toBe(4);
      // Global ceil on total capacity of 8 is ceil(0.33 * 8) = ceil(2.64) = 3
      expect(calculateReservedMinimum(8)).toBe(3);
      expect(quota.reservedMinimum).not.toBe(calculateReservedMinimum(8));
    });
  });

  describe('Small-Cohort Privacy Suppression', () => {
    it('withholds exact filled and vacancy counts and shows privacy banner when suppressed', () => {
      const suppressedQuota: SeatingQuotaSummary = {
        totalCapacity: 7,
        reservedMinimum: 7,
        isPrivacySuppressed: true,
      };

      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={mockSeats}
            quotaSummary={suppressedQuota}
          />
        </MemoryRouter>
      );

      // Verify privacy banner and status
      expect(screen.getByTestId('small-cohort-privacy-banner')).toBeInTheDocument();
      expect(screen.getByTestId('status-privacy-suppressed')).toBeInTheDocument();

      // Verify counts are withheld, not displaying numbers
      expect(screen.getByTestId('seating-quota-reserved-filled')).toHaveTextContent('Withheld (Privacy)');
      expect(screen.getByTestId('seating-quota-vacancies')).toHaveTextContent('Withheld (Privacy)');
      expect(screen.queryByText('Quota Met')).not.toBeInTheDocument();
      expect(screen.queryByText('Unmet Target')).not.toBeInTheDocument();
    });

    it('shows generic policy card on seat selection instead of revealing confidential declaration', () => {
      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={mockSeats}
            selectedSeatId="seat_priya"
          />
        </MemoryRouter>
      );

      // Detail card is open
      expect(screen.getByTestId('seat-detail-card')).toBeInTheDocument();
      // Generic policy note is displayed
      expect(screen.getByTestId('seat-detail-generic-policy')).toBeInTheDocument();
      // Confidential individual reserved status is not revealed
      expect(screen.queryByTestId('seat-detail-reserved')).not.toBeInTheDocument();
    });

    it('shows authorized reserved badge when seat has verified isReserved place', () => {
      const authorizedSeats: SeatModel[] = [
        {
          ...mockSeats[1],
          isReserved: true,
        },
      ];

      render(
        <MemoryRouter>
          <SessionSeating
            layout="debate"
            seats={authorizedSeats}
            selectedSeatId="seat_priya"
          />
        </MemoryRouter>
      );

      expect(screen.getByTestId('seat-detail-card')).toBeInTheDocument();
      expect(screen.getByTestId('seat-detail-reserved')).toBeInTheDocument();
      expect(screen.getByTestId('seat-detail-reserved')).toHaveTextContent(/Occupies 33% Women's Reserved Allocation seat/i);
    });
  });

  describe('No Individual Eligibility Reveal', () => {
    it('does not display reserved rings/markers on seats for participant callers', async () => {
      // Regular participant Aarav
      await useAuthStore.getState().switchPersona('VSC-S-001');

      render(
        <MemoryRouter initialEntries={['/debate-room']}>
          <Routes>
            <Route path="/debate-room" element={<DebateRoomPreviewPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('session-seating-container')).toBeInTheDocument();
      });

      // No seat in the chamber has individual reserved markers rendered from fictional declarations
      expect(screen.queryByTestId('reserved-seat-marker-seat_sess_jaipur_01_VSC-S-002')).not.toBeInTheDocument();
      expect(screen.queryByTestId('reserved-seat-marker-seat_sess_jaipur_01_VSC-S-001')).not.toBeInTheDocument();
      expect(screen.queryByTestId('reserved-seat-marker-seat_sess_jaipur_01_VSC-S-009')).not.toBeInTheDocument();

      // Selecting Priya's seat reveals generic policy indicator, never personal declaration
      const priyaSeat = screen.getByTestId('seat-item-seat_sess_jaipur_01_VSC-S-002');
      fireEvent.click(priyaSeat);

      await waitFor(() => {
        expect(screen.getByTestId('seat-detail-card')).toBeInTheDocument();
        expect(screen.getByTestId('seat-detail-generic-policy')).toBeInTheDocument();
        expect(screen.queryByTestId('seat-detail-reserved')).not.toBeInTheDocument();
      });
    });

    it('does not expose individual eligibility in AssemblySessionPage participant view', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');
      await demoRepository.joinAssembly('assembly_jaipur_pedestrian_2026', 'VSC-S-001');

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

      // No individual reservation rings/markers on any assembly participant seat
      expect(screen.queryByTestId('reserved-seat-marker-seat_assembly_jaipur_pedestrian_2026_VSC-S-002')).not.toBeInTheDocument();
      expect(screen.queryByTestId('reserved-seat-marker-seat_assembly_jaipur_pedestrian_2026_VSC-S-001')).not.toBeInTheDocument();

      // Generic policy indicator is present
      expect(screen.getByTestId('generic-policy-indicator')).toBeInTheDocument();
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
    it('renders SessionSeating inside DebateRoomPreviewPage with active debate roster and unassigned stance handling', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');

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

      // Roster participants with functional roles (Evidence Analyst Priya, Questioner Aarav)
      // are not assigned to For or Against benches in the absence of explicit stance data
      const forBench = screen.getByTestId('debate-bench-for');
      const againstBench = screen.getByTestId('debate-bench-against');
      expect(forBench).toHaveTextContent(/Visual placeholder bench awaiting explicit participant stance/i);
      expect(againstBench).toHaveTextContent(/Visual placeholder bench awaiting explicit participant stance/i);
      expect(forBench).not.toHaveTextContent('Niyati Chawda');
      expect(againstBench).not.toHaveTextContent('Ankita Kapri');

      // Unassigned delegates area presents participants without invented stance claims
      const neutralBench = screen.getByTestId('debate-bench-neutral');
      expect(neutralBench).toBeInTheDocument();
      expect(neutralBench).toHaveTextContent('Niyati Chawda');
      expect(neutralBench).toHaveTextContent('Ankita Kapri');

      // Existing procedure controls remain present and functional
      expect(screen.getByTestId('debate-reservation-rulebook-banner')).toBeInTheDocument();
      expect(screen.getByTestId('debate-reservation-allocations-card')).toBeInTheDocument();
    });

    it('renders SessionSeating inside AssemblySessionPage with functional zones and dissent markers', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');
      await demoRepository.joinAssembly('assembly_jaipur_pedestrian_2026', 'VSC-S-001');

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
      expect(screen.getAllByRole('button', { name: /Stage Guide/i }).length).toBeGreaterThanOrEqual(1);
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
