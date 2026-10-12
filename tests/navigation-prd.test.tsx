import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { DesktopSidebar } from '../src/components/layout/DesktopSidebar';
import { AppShell } from '../src/components/layout/AppShell';
import { DebateRoomPreviewPage } from '../src/components/layout/DebateRoomPreviewPage';
import { WorkspacePreviewPage } from '../src/components/layout/WorkspacePreviewPage';
import { HelpRulebooksPage } from '../src/components/layout/HelpRulebooksPage';
import { CoursesPage } from '../src/features/learning/CoursesPage';
import { AssignmentsPage } from '../src/features/assignments/AssignmentsPage';
import { ProjectsPage } from '../src/features/projects/ProjectsPage';
import { useAuthStore } from '../src/stores/authStore';
import { PersistenceService } from '../src/services/persistence';

describe('Master PRD Canonical Navigation & Learner Identity Integration Tests', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  const EXPECTED_ELEVEN_LABELS = [
    'Home',
    'Learn',
    'Activities & Assignments',
    'Debate Room',
    'Youth Assembly',
    'Youth Parliament',
    'Workspace',
    'Labs & Projects',
    'Community',
    'Civic Passport',
    'UHV / Jeevan Vidya',
  ];

  const EXPECTED_ELEVEN_DESTINATIONS = [
    '/dashboard',
    '/learn',
    '/assignments',
    '/debate-room',
    '/assemblies',
    '/parliament',
    '/workspace',
    '/projects',
    '/community',
    '/passport',
    '/uhv',
  ];

  it('Requirement 1 & 2: Desktop sidebar displays exactly eleven canonical learner labels in strict order', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <DesktopSidebar />
      </MemoryRouter>
    );

    const learnerNav = screen.getByRole('navigation', { name: /learner navigation/i });
    expect(learnerNav).toBeInTheDocument();

    const links = within(learnerNav).getAllByRole('link');
    expect(links).toHaveLength(11);

    // Verify exact labels and ordering
    EXPECTED_ELEVEN_LABELS.forEach((expectedLabel, idx) => {
      expect(links[idx]).toHaveTextContent(expectedLabel);
      expect(links[idx]).toHaveAttribute('href', EXPECTED_ELEVEN_DESTINATIONS[idx]);
    });

    // Verify status badges for preview/planned modules
    expect(links[3]).toHaveTextContent('Planned'); // Debate Room
    expect(links[5]).toHaveTextContent('Prototype'); // Youth Parliament
    expect(links[6]).toHaveTextContent('Planned'); // Workspace
    expect(links[10]).toHaveTextContent('Stream'); // UHV / Jeevan Vidya

    // Verify utilities are kept outside the learner navigation sequence
    const utilitiesNav = screen.getByRole('navigation', { name: /utilities navigation/i });
    expect(utilitiesNav).toBeInTheDocument();
    const utilityLinks = within(utilitiesNav).getAllByRole('link');
    const utilityTexts = utilityLinks.map((l) => l.textContent);

    expect(utilityTexts.some((t) => t?.includes('Profile'))).toBe(true);
    expect(utilityTexts.some((t) => t?.includes('Notifications'))).toBe(true);
    expect(utilityTexts.some((t) => t?.includes('Settings'))).toBe(true);
    expect(utilityTexts.some((t) => t?.includes('Help / Rulebooks'))).toBe(true);

    // Ensure utilities are not inside the learner nav
    utilityTexts.forEach((uText) => {
      if (uText) {
        expect(within(learnerNav).queryByText(uText)).not.toBeInTheDocument();
      }
    });
  });

  it('Requirement 4: Mobile drawer reveals the same eleven ordered entries and is usable at mobile widths', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppShell />
      </MemoryRouter>
    );

    // Initial state: drawer dialog not present
    expect(screen.queryByRole('dialog', { name: /navigation drawer/i })).not.toBeInTheDocument();

    // Toggle mobile menu
    const menuButton = screen.getByTestId('mobile-menu-toggle');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(menuButton);
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');

    // Drawer dialog is rendered
    const drawerDialog = screen.getByRole('dialog', { name: /navigation drawer/i });
    expect(drawerDialog).toBeInTheDocument();

    // Find learner navigation inside mobile drawer
    const drawerLearnerNav = within(drawerDialog).getByRole('navigation', { name: /learner navigation/i });
    const drawerLinks = within(drawerLearnerNav).getAllByRole('link');
    expect(drawerLinks).toHaveLength(11);

    // Verify exact labels and ordering inside mobile drawer
    EXPECTED_ELEVEN_LABELS.forEach((expectedLabel, idx) => {
      expect(drawerLinks[idx]).toHaveTextContent(expectedLabel);
      expect(drawerLinks[idx]).toHaveAttribute('href', EXPECTED_ELEVEN_DESTINATIONS[idx]);
    });
  });

  it('Requirement 4: Mobile drawer closes on selection, Escape key, backdrop click, and close button', () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AppShell />
      </MemoryRouter>
    );

    const toggle = screen.getByTestId('mobile-menu-toggle');

    // Test 1: Close on item selection
    fireEvent.click(toggle);
    let drawer = screen.getByRole('dialog', { name: /navigation drawer/i });
    expect(drawer).toBeInTheDocument();
    const learnLink = within(drawer).getByRole('link', { name: /^Learn/i });
    fireEvent.click(learnLink);
    expect(screen.queryByRole('dialog', { name: /navigation drawer/i })).not.toBeInTheDocument();

    // Test 2: Close on Escape key
    fireEvent.click(toggle);
    expect(screen.getByRole('dialog', { name: /navigation drawer/i })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /navigation drawer/i })).not.toBeInTheDocument();

    // Test 3: Close on backdrop click
    fireEvent.click(toggle);
    expect(screen.getByRole('dialog', { name: /navigation drawer/i })).toBeInTheDocument();
    const backdrop = screen.getByTestId('mobile-drawer-backdrop');
    fireEvent.click(backdrop);
    expect(screen.queryByRole('dialog', { name: /navigation drawer/i })).not.toBeInTheDocument();

    // Test 4: Close on X close button in drawer header
    fireEvent.click(toggle);
    drawer = screen.getByRole('dialog', { name: /navigation drawer/i });
    const closeBtn = within(drawer).getByRole('button', { name: /close navigation menu/i });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog', { name: /navigation drawer/i })).not.toBeInTheDocument();

    unmount();
  });

  it('Requirement 2: Debate Room and Workspace render clearly labelled nonfunctional preview destinations', () => {
    // Debate Room preview
    const { rerender } = render(
      <MemoryRouter>
        <DebateRoomPreviewPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /^Debate Room/i })).toBeInTheDocument();
    expect(screen.getByText(/Planned Demo Module/i)).toBeInTheDocument();
    expect(screen.getByText(/Nonfunctional Preview Destination/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enter Youth Assembly/i })).toBeInTheDocument();

    // Workspace preview
    rerender(
      <MemoryRouter>
        <WorkspacePreviewPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /^Workspace/i })).toBeInTheDocument();
    expect(screen.getByText(/Planned Demo Module/i)).toBeInTheDocument();
    expect(screen.getByText(/Nonfunctional Preview Destination/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Active Projects/i })).toBeInTheDocument();

    // Help & Rulebooks
    rerender(
      <MemoryRouter>
        <HelpRulebooksPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /Help & Point-of-Use Rulebooks/i })).toBeInTheDocument();
  });

  it('Requirement 3: General Civic Learn excludes UHV courses from the main listing', async () => {
    render(
      <MemoryRouter initialEntries={['/learn']}>
        <Routes>
          <Route path="/learn" element={<CoursesPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Civic Learning Hub/i })).toBeInTheDocument();
    });

    // On /learn default 'All Civic Courses' tab, UHV course should NOT be in the general listing
    expect(screen.getByText(/CIV-101/i)).toBeInTheDocument();
    expect(screen.queryByText(/UHV-101/i)).not.toBeInTheDocument();

    // Verify separation banner and button linking to /uhv
    expect(screen.getByText(/Universal Human Values \(UHV \/ Jeevan Vidya\) is maintained as a distinct study stream/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open UHV \/ Jeevan Vidya Stream/i })).toBeInTheDocument();
  });

  it('Requirement 3: UHV / Jeevan Vidya dedicated stream renders fictional disclosure and isolates UHV track', async () => {
    render(
      <MemoryRouter initialEntries={['/uhv']}>
        <Routes>
          <Route path="/uhv" element={<CoursesPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^UHV \/ Jeevan Vidya/i })).toBeInTheDocument();
    });

    // Shows fictional demo disclosure banner
    expect(screen.getByText(/Fictional Demo Material • Curriculum Rights Awaiting Owner Review/i)).toBeInTheDocument();
    expect(screen.getByText(/No approved curriculum implied/i)).toBeInTheDocument();
    expect(screen.getByText(/Ideological agreement is not graded/i)).toBeInTheDocument();

    // Shows UHV course
    expect(screen.getByText(/UHV-101/i)).toBeInTheDocument();
    expect(screen.getByText(/Universal Human Values: Self-Exploration & Civic Ethics/i)).toBeInTheDocument();

    // Does NOT show general civic courses in the UHV stream
    expect(screen.queryByText(/CIV-101/i)).not.toBeInTheDocument();
  });

  it('Requirement 2 & 3: Assignments page provides visible path to Activities and excludes UHV reflections', async () => {
    render(
      <MemoryRouter initialEntries={['/assignments']}>
        <AssignmentsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Field Evidence & Assignments/i })).toBeInTheDocument();
    });

    // Check visible path to /activities
    expect(screen.getByRole('button', { name: /Explore Activities Stream/i })).toBeInTheDocument();

    // Check UHV stream separation notice
    expect(screen.getByText(/UHV Stream Separation/i)).toBeInTheDocument();

    // Check general civic assignments are present and UHV reflection is excluded
    expect(screen.getByText(/School Gate Traffic Audit/i)).toBeInTheDocument();
    expect(screen.queryByText(/Civic Ethics & Community Harmony Reflection/i)).not.toBeInTheDocument();
  });

  it('Requirement 2: Projects page provides visible links to Idea Lab, Research Lab, and Policy Lab previews', async () => {
    render(
      <MemoryRouter initialEntries={['/projects']}>
        <ProjectsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Youth Civic Action Projects/i })).toBeInTheDocument();
    });

    // Check visible links to the three lab previews
    const ideaLabLink = screen.getByRole('link', { name: /Idea Lab/i });
    expect(ideaLabLink).toHaveAttribute('href', '/labs/ideas');

    const researchLabLink = screen.getByRole('link', { name: /Research Lab/i });
    expect(researchLabLink).toHaveAttribute('href', '/labs/research');

    const policyLabLink = screen.getByRole('link', { name: /Policy Lab/i });
    expect(policyLabLink).toHaveAttribute('href', '/labs/policy');
  });
});
