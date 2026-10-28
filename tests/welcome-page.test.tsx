import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { WelcomePage, getEarliestFutureRajkotEvent } from '../src/features/welcome/WelcomePage';
import { useAuthStore } from '../src/stores/authStore';
import { PersistenceService } from '../src/services/persistence';
import { seedEvents } from '../src/data/seed/events';

describe('WelcomePage & Root Landing Integration Tests', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  it('renders refined first screen with JanSahabhag 2047, Learn. Deliberate. Lead., primary Enter button, and no explanatory hero paragraph', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // Title and tagline
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/JanSahabhag 2047/i);
    expect(screen.getByText('Learn. Deliberate. Lead.')).toBeInTheDocument();

    // Primary Enter button
    const enterBtn = screen.getByRole('button', { name: /enter the platform/i });
    expect(enterBtn).toBeInTheDocument();

    // No explanatory hero paragraph
    expect(container.textContent).not.toContain('An interactive single-browser simulation of the National Youth Civic Engagement Platform. Walk alongside');
    expect(container.textContent).not.toContain('frontend-first');
  });

  it('navigates to dashboard as Aarav Sharma when clicking Enter the platform or persona selection', async () => {
    render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/dashboard" element={<div data-testid="dashboard-screen">Civic Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    const enterBtn = screen.getByRole('button', { name: /enter the platform/i });
    fireEvent.click(enterBtn);

    expect(await screen.findByTestId('dashboard-screen')).toBeInTheDocument();
    expect(useAuthStore.getState().currentUser?.id).toBe('VSC-S-001');
  });

  it('renders the accessible five-step civic loop once beneath the hero with links to matching existing routes', () => {
    render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      </MemoryRouter>
    );

    const navs = screen.getAllByRole('navigation', { name: /five-step civic loop/i });
    expect(navs).toHaveLength(1);

    const expectedSteps = [
      { name: 'Learn', route: '/learn', subtitle: 'Civic Academy' },
      { name: 'Observe', route: '/assignments', subtitle: 'Field Evidence' },
      { name: 'Deliberate', route: '/assemblies', subtitle: 'Youth Assembly' },
      { name: 'Propose', route: '/projects', subtitle: 'Labs & Projects' },
      { name: 'Reflect', route: '/passport', subtitle: 'Civic Passport' },
    ];

    expectedSteps.forEach((step, idx) => {
      const stepLink = screen.getByTestId(`civic-loop-step-${step.name.toLowerCase()}`);
      expect(stepLink).toBeInTheDocument();
      expect(stepLink).toHaveAttribute('href', step.route);
      expect(stepLink).toHaveTextContent(`Step ${idx + 1}`);
      expect(stepLink).toHaveTextContent(step.name);
      expect(stepLink).toHaveTextContent(step.subtitle);
    });

    // UHV must NOT be an item inside the civic loop navigation
    expect(navs[0]).not.toHaveTextContent(/Jeevan Vidya/i);
  });

  it('renders six concise linked icon tiles for Learn, Debate, Assembly, Parliament, Projects, UHV/Jeevan Vidya', () => {
    render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      </MemoryRouter>
    );

    const expectedTiles = [
      { id: 'learn', name: 'Learn', route: '/learn' },
      { id: 'debate', name: 'Debate', route: '/debate-room' },
      { id: 'assembly', name: 'Assembly', route: '/assemblies' },
      { id: 'parliament', name: 'Parliament', route: '/parliament' },
      { id: 'projects', name: 'Projects', route: '/projects' },
      { id: 'uhv', name: 'UHV/Jeevan Vidya', route: '/uhv' },
    ];

    expectedTiles.forEach((tile) => {
      const tileEl = screen.getByTestId(`welcome-tile-${tile.id}`);
      expect(tileEl).toBeInTheDocument();
      expect(tileEl).toHaveAttribute('href', tile.route);
      expect(tileEl).toHaveTextContent(tile.name);
    });
  });

  it('renders tiles for the four remaining platform areas: Assignments, Workspace, Community, Civic Passport', () => {
    render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      </MemoryRouter>
    );

    const expectedTiles = [
      { id: 'assignments', name: 'Assignments', route: '/assignments', description: 'Field Evidence' },
      { id: 'workspace', name: 'Workspace', route: '/workspace', description: 'Team Drafting' },
      { id: 'community', name: 'Community', route: '/community', description: 'Peer Circles' },
      { id: 'passport', name: 'Civic Passport', route: '/passport', description: 'Your Record' },
    ];

    expectedTiles.forEach((tile) => {
      const tileEl = screen.getByTestId(`welcome-tile-${tile.id}`);
      expect(tileEl).toBeInTheDocument();
      expect(tileEl).toHaveAttribute('href', tile.route);
      expect(tileEl).toHaveTextContent(tile.name);
      expect(tileEl).toHaveTextContent(tile.description);
    });
  });

  it('explains how participation becomes civic credit points and links to the Civic Passport', () => {
    render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      </MemoryRouter>
    );

    const strip = screen.getByTestId('welcome-credit-points');
    expect(strip).toBeInTheDocument();
    expect(strip).toHaveTextContent(/How participation is recorded/i);
    expect(strip).toHaveTextContent('Take part');
    expect(strip).toHaveTextContent('Complete a civic lesson, join an assembly, or submit field evidence.');
    expect(strip).toHaveTextContent('Earn civic credit points');
    expect(strip).toHaveTextContent('Eligible verified activities add 1 or 2 points, up to 5 in this demo.');
    expect(strip).toHaveTextContent('Build your Civic Passport');
    expect(strip).toHaveTextContent('A portfolio of what you did, not a score of your worth.');

    const passportLink = within(strip).getByRole('link', { name: /see the civic passport/i });
    expect(passportLink).toHaveAttribute('href', '/passport');
  });

  it('keeps the full 33% rule text and the UHV clause in the DOM while their disclosures are closed', () => {
    render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // Reservation banner: collapsed by default, full policy text still present
    const policyDetails = screen.getByTestId('welcome-reservation-policy-details');
    expect(policyDetails.tagName).toBe('DETAILS');
    expect(policyDetails).not.toHaveAttribute('open');
    expect(within(policyDetails).getByText(/What this rule covers/i)).toBeInTheDocument();
    expect(screen.getByTestId('welcome-reservation-policy-banner')).toHaveTextContent(
      /Platform Rule: At least one-third of limited seats and named roles, rounded up separately for each allocation, are reserved for women\. Open participation slots are unreserved\. This simulation rule is a platform policy rather than statutory law\. Documented exceptions require recorded administrative approval\./i
    );

    // Visible summary line above the fold
    expect(screen.getByText('At least one-third of limited seats and named roles are reserved for women.')).toBeInTheDocument();

    // UHV notice: collapsed by default, explanatory clause still present
    const uhvDetails = screen.getByTestId('uhv-distinct-stream-details');
    expect(uhvDetails.tagName).toBe('DETAILS');
    expect(uhvDetails).not.toHaveAttribute('open');
    expect(screen.getByTestId('uhv-distinct-stream-notice')).toHaveTextContent(
      /An independent exploratory study track kept distinct from the 5-step civic deliberation loop\./i
    );
  });

  it('renders upcoming event card with earliest future fictional Jaipur event relative to a fixed clock and correct linked event', () => {
    // Fixed clock: Oct 22, 2026 08:00:00Z
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T08:00:00Z'));

    try {
      render(
        <MemoryRouter initialEntries={['/welcome']}>
          <Routes>
            <Route path="/welcome" element={<WelcomePage />} />
          </Routes>
        </MemoryRouter>
      );

      const sessionCard = screen.getByTestId('welcome-upcoming-session-card');
      expect(sessionCard).toBeInTheDocument();

      // Check helper and derive expected earliest future fictional Rajkot event
      const earliestFutureEvent = getEarliestFutureRajkotEvent(new Date('2026-10-22T08:00:00Z'));
      expect(earliestFutureEvent).toBeDefined();
      if (!earliestFutureEvent) throw new Error('Expected earliestFutureEvent to be defined');
      expect(earliestFutureEvent.id).toBe('evt_jaipur_limited_05');
      expect(earliestFutureEvent.date).toBe('2026-10-25');

      // Assert event date is genuinely future relative to fixed clock 2026-10-22
      const eventTime = new Date(earliestFutureEvent.date).getTime();
      const clockTime = new Date('2026-10-22T08:00:00Z').getTime();
      expect(eventTime).toBeGreaterThan(clockTime);

      // Card title, description, time, and location are derived from event source
      expect(sessionCard).toHaveTextContent(earliestFutureEvent.title);
      expect(sessionCard).toHaveTextContent(earliestFutureEvent.location);
      expect(sessionCard).toHaveTextContent(earliestFutureEvent.startTime);
      expect(sessionCard).toHaveTextContent(earliestFutureEvent.endTime);
      expect(sessionCard).toHaveTextContent(/Oct 25, 2026/i);

      // Past Oct 12 date must NOT appear as upcoming
      expect(sessionCard).not.toHaveTextContent('Oct 12, 2026');

      // Since evt_jaipur_limited_05 has no Assembly session, only its event details link is shown
      const eventDetailsLink = within(sessionCard).getByRole('link', { name: /view event details/i });
      expect(eventDetailsLink).toHaveAttribute('href', `/events/${earliestFutureEvent.id}`);

      // Must not show open assembly session button when there is no assembly session
      expect(within(sessionCard).queryByRole('link', { name: /open assembly session/i })).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('omits upcoming event card and returns undefined when clock is after all seeded events (1 November 2026)', () => {
    // Fixed clock: Nov 1, 2026 12:00:00Z (after all seeded events in October 2026)
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));

    try {
      const earliestFutureEvent = getEarliestFutureRajkotEvent(new Date('2026-11-01T12:00:00Z'));
      expect(earliestFutureEvent).toBeUndefined();

      const { container } = render(
        <MemoryRouter initialEntries={['/welcome']}>
          <Routes>
            <Route path="/welcome" element={<WelcomePage />} />
          </Routes>
        </MemoryRouter>
      );

      // Card is omitted and no past event is falsely labelled upcoming
      expect(screen.queryByTestId('welcome-upcoming-session-card')).not.toBeInTheDocument();
      expect(screen.queryByText(/Upcoming Event/i)).not.toBeInTheDocument();
      expect(container.textContent).not.toContain('evt_jaipur_limited_05');
      expect(container.textContent).not.toContain('Oct 25, 2026');
      expect(container.textContent).not.toContain('Oct 12, 2026');
    } finally {
      vi.useRealTimers();
    }
  });

  it('handles same-day event timing correctly before and after start time', () => {
    // evt_jaipur_limited_05 is on 2026-10-25 at 10:00 AM
    // Case 1: Same day before start time (e.g. 09:00:00Z) -> is upcoming
    const beforeStart = new Date('2026-10-25T09:00:00Z');
    const eventBefore = getEarliestFutureRajkotEvent(beforeStart);
    expect(eventBefore).toBeDefined();
    expect(eventBefore?.id).toBe('evt_jaipur_limited_05');

    // Case 2: Same day after start time (e.g. 10:30:00Z) -> evt_jaipur_limited_05 is no longer upcoming, moves to next (evt_jaipur_compliant_06 on 2026-10-26)
    const afterStart = new Date('2026-10-25T10:30:00Z');
    const eventAfter = getEarliestFutureRajkotEvent(afterStart);
    expect(eventAfter).toBeDefined();
    expect(eventAfter?.id).toBe('evt_jaipur_compliant_06');
  });

  it('surfaces 33% platform rule as at least one-third of limited seats and named roles, rounded up, without implying statutory law or universal reservation', () => {
    render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      </MemoryRouter>
    );

    const policyBanner = screen.getByTestId('welcome-reservation-policy-banner');
    expect(policyBanner).toBeInTheDocument();
    expect(policyBanner).toHaveTextContent(
      /at least one-third of limited seats and named roles, rounded up separately for each allocation/i
    );
    expect(policyBanner).toHaveTextContent(/Open participation slots are unreserved/i);
    expect(policyBanner).toHaveTextContent(/platform policy rather than statutory law/i);
    expect(policyBanner).toHaveTextContent(/Documented exceptions require recorded administrative approval/i);

    // Link to rules
    const rulesLink = screen.getByRole('link', { name: /view rules/i });
    expect(rulesLink).toHaveAttribute('href', '/help');

    // Must not overclaim national statutory law or universal production enforcement
    expect(policyBanner).not.toHaveTextContent(/national statutory law/i);
    expect(policyBanner).not.toHaveTextContent(/production enforcement/i);
  });

  it('maintains UHV distinct from the civic loop with a dedicated notice and link', () => {
    render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      </MemoryRouter>
    );

    const uhvNotice = screen.getByTestId('uhv-distinct-stream-notice');
    expect(uhvNotice).toBeInTheDocument();
    expect(uhvNotice).toHaveTextContent(/Universal Human Values \(UHV \/ Jeevan Vidya\)/i);
    expect(uhvNotice).toHaveTextContent(/kept distinct from the 5-step civic deliberation loop/i);

    const uhvLink = screen.getByRole('link', { name: /open uhv stream/i });
    expect(uhvLink).toHaveAttribute('href', '/uhv');
  });

  it('renders footer links Rules, About Us, and Contact (mailto:nazimsandhbehappy@gmail.com)', () => {
    render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      </MemoryRouter>
    );

    const footer = screen.getByRole('contentinfo', { name: /welcome page footer/i });
    expect(footer).toBeInTheDocument();

    const rulesLink = within(footer).getByRole('link', { name: /^Rules$/i });
    expect(rulesLink).toHaveAttribute('href', '/help');

    const aboutLink = within(footer).getByRole('link', { name: /^About Us$/i });
    expect(aboutLink).toHaveAttribute('href', '/about');

    const contactLink = within(footer).getByRole('link', { name: /^Contact$/i });
    expect(contactLink).toHaveAttribute('href', 'mailto:nazimsandhbehappy@gmail.com');
  });

  it('preserves single-browser simulation labelling and reviewer guide', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // Simulation framing
    expect(container.textContent).toContain('single-browser simulation');
    expect(screen.getByRole('link', { name: /explore all personas/i })).toHaveAttribute('href', '/demo-login');
    expect(screen.getByRole('link', { name: /about the people behind jansahabhag/i })).toHaveAttribute('href', '/about');
    expect(screen.getByText(/Reviewer Quick Guide/i)).toBeInTheDocument();
  });
});
