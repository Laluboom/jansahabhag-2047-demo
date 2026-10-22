import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { WelcomePage } from '../src/features/welcome/WelcomePage';
import { useAuthStore } from '../src/stores/authStore';
import { PersistenceService } from '../src/services/persistence';

describe('WelcomePage Quick Improvements Integration Tests', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  it('renders the accessible five-step civic loop with links to matching existing routes', () => {
    render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      </MemoryRouter>
    );

    const nav = screen.getByRole('navigation', { name: /five-step civic loop/i });
    expect(nav).toBeInTheDocument();

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
    expect(nav).not.toHaveTextContent(/Jeevan Vidya/i);
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

  it('surfaces a concise 33% reservation message linked to the rulebook and framed only as demo policy', () => {
    render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      </MemoryRouter>
    );

    const policyBanner = screen.getByTestId('welcome-reservation-policy-banner');
    expect(policyBanner).toBeInTheDocument();
    expect(policyBanner).toHaveTextContent(/Policy in this fictional demo/i);
    expect(policyBanner).toHaveTextContent(
      /at least 33% of applicable allocated seats and named roles, rounded up separately for each allocation/i
    );
    expect(policyBanner).toHaveTextContent(/Documented exceptions require recorded administrative approval/i);

    // Verifies link to existing rulebook
    const rulebookLink = screen.getByRole('link', { name: /view rulebook/i });
    expect(rulebookLink).toHaveAttribute('href', '/help');

    // Must not overclaim national law or universal production enforcement
    expect(policyBanner).not.toHaveTextContent(/national law/i);
    expect(policyBanner).not.toHaveTextContent(/production enforcement/i);
  });

  it('removes internal jargon like "frontend-first" while preserving the Jaipur story and single-browser simulation', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
        </Routes>
      </MemoryRouter>
    );

    // Jargon check
    expect(container.textContent).not.toContain('frontend-first');

    // Fictional Jaipur story and Aarav persona check
    expect(container.textContent).toContain('Aarav Sharma (18, Jaipur)');

    // Single-browser simulation framing
    expect(container.textContent).toContain('single-browser simulation');

    // Journey entry actions
    expect(screen.getByRole('button', { name: /begin aarav's journey/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /explore all personas/i })).toHaveAttribute('href', '/demo-login');
    expect(screen.getByRole('link', { name: /about the people behind jansahabhag/i })).toHaveAttribute('href', '/about');
  });

  it('navigates to dashboard as Aarav Sharma when clicking Begin Journey', async () => {
    render(
      <MemoryRouter initialEntries={['/welcome']}>
        <Routes>
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/dashboard" element={<div data-testid="dashboard-screen">Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    const beginBtn = screen.getByRole('button', { name: /begin aarav's journey/i });
    fireEvent.click(beginBtn);

    expect(await screen.findByTestId('dashboard-screen')).toBeInTheDocument();
    expect(useAuthStore.getState().currentUser?.id).toBe('user_aarav');
  });
});
