import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PersistenceService } from '../src/services/persistence';
import { useAuthStore } from '../src/stores/authStore';
import { ParticipantDashboardPage } from '../src/features/dashboard/ParticipantDashboardPage';
import { LessonPage } from '../src/features/learning/LessonPage';
import { AssignmentTaskCard } from '../src/components/assignments/AssignmentTaskCard';

describe('Accessible pop-up task card for general civic assignments (§A11.1, §A20.3)', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  it('does not render the pop-up on first paint and only opens upon user action', async () => {
    render(
      <MemoryRouter>
        <ParticipantDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    });

    // Assert the dialog is absent on initial render (§A11.1: no unsolicited pop-ups)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens from the dashboard, provides accessible name with assignment title, shows rubric, status, and deep link', async () => {
    render(
      <MemoryRouter>
        <ParticipantDashboardPage />
      </MemoryRouter>
    );

    const triggerBtn = await screen.findByRole('button', { name: /View Task Card/i });
    triggerBtn.focus();
    expect(document.activeElement).toBe(triggerBtn);

    fireEvent.click(triggerBtn);

    // Accessible name contains the assignment title (asg_obs_03: Pedestrian Flow Interview with 5 Peers)
    const dialog = await screen.findByRole('dialog', { name: /Pedestrian Flow Interview with 5 Peers/i });
    expect(dialog).toBeInTheDocument();

    // Rubric items are present
    expect(screen.getByText(/Diverse Representation/i)).toBeInTheDocument();
    expect(screen.getByText(/Synthesized Findings/i)).toBeInTheDocument();

    // Submission status is shown (learner has not submitted this one yet)
    expect(screen.getByText(/Not started/i)).toBeInTheDocument();

    // Deep link to full assignment page
    const deepLink = screen.getByRole('link', { name: /Open full assignment/i });
    expect(deepLink).toBeInTheDocument();
    expect(deepLink).toHaveAttribute('href', '/assignments/asg_obs_03');
  });

  it('closes on Escape and dismiss control, and returns focus to the trigger control', async () => {
    render(
      <MemoryRouter>
        <ParticipantDashboardPage />
      </MemoryRouter>
    );

    const triggerBtn = await screen.findByRole('button', { name: /View Task Card/i });
    triggerBtn.focus();
    fireEvent.click(triggerBtn);

    await screen.findByRole('dialog', { name: /Pedestrian Flow Interview/i });

    // Press Escape to close
    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Pedestrian Flow Interview/i })).not.toBeInTheDocument();
    });
    // Focus returned to trigger button
    expect(document.activeElement).toBe(triggerBtn);

    // Re-open and test Dismiss button
    triggerBtn.focus();
    fireEvent.click(triggerBtn);

    await screen.findByRole('dialog', { name: /Pedestrian Flow Interview/i });

    const dismissBtn = screen.getByRole('button', { name: /Dismiss/i });
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Pedestrian Flow Interview/i })).not.toBeInTheDocument();
    });
    // Focus returned to trigger button
    expect(document.activeElement).toBe(triggerBtn);
  });

  it('traps Tab and Shift+Tab inside the dialog while open', async () => {
    render(
      <MemoryRouter>
        <ParticipantDashboardPage />
      </MemoryRouter>
    );

    const triggerBtn = await screen.findByRole('button', { name: /View Task Card/i });
    triggerBtn.focus();
    fireEvent.click(triggerBtn);

    const dialog = await screen.findByRole('dialog', { name: /Pedestrian Flow Interview/i });

    const closeBtn = within(dialog).getByRole('button', { name: /Close modal/i });
    const fullLink = within(dialog).getByRole('link', { name: /Open full assignment/i });

    // Focus last focusable element in dialog
    fullLink.focus();
    expect(document.activeElement).toBe(fullLink);

    // Tab from last focusable cycles to first focusable element
    fireEvent.keyDown(fullLink, { key: 'Tab' });
    expect(document.activeElement).toBe(closeBtn);

    // Shift+Tab from first focusable cycles to last focusable element
    fireEvent.keyDown(closeBtn, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(fullLink);
  });

  it('opens task card from lesson page with deep link and dismiss functionality', async () => {
    render(
      <MemoryRouter initialEntries={['/learn/course_civic_obs_01/lesson/les_obs_101']}>
        <Routes>
          <Route path="/learn/:courseId/lesson/:lessonId" element={<LessonPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Absent on first paint
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    const triggerBtn = await screen.findByRole('button', { name: /View Task Card/i });
    triggerBtn.focus();
    fireEvent.click(triggerBtn);

    const dialog = await screen.findByRole('dialog', { name: /School Gate Traffic Audit & Peak Hour Vehicle Count/i });
    expect(dialog).toBeInTheDocument();

    // Shows verified submission status from seed data inside the dialog
    expect(within(dialog).getByText(/Verified/i)).toBeInTheDocument();

    const fullLink = within(dialog).getByRole('link', { name: /Open full assignment/i });
    expect(fullLink).toHaveAttribute('href', '/assignments/asg_obs_01');

    // Dismiss closes and returns focus
    const dismissBtn = within(dialog).getByRole('button', { name: /Dismiss/i });
    fireEvent.click(dismissBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /School Gate Traffic Audit/i })).not.toBeInTheDocument();
    });
    expect(document.activeElement).toBe(triggerBtn);
  });

  it('renders an assignment with no dueDate and no timeLimitMinutes without those rows and without throwing', async () => {
    const db = PersistenceService.loadDatabase();
    db.assignments.push({
      id: 'asg_minimal_test',
      courseId: 'course_civic_obs_01',
      title: 'Minimal Civic Observation Exercise',
      prompt: 'Draft an initial qualitative assessment of school entrance safety features.',
      rubric: [
        { criterion: 'Initial Assessment', maxPoints: 5, description: 'Direct observational qualitative remarks.' },
      ],
      creditsReward: 1,
      status: 'active',
      schemaVersion: 1,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    });
    PersistenceService.saveDatabase(db);

    render(
      <MemoryRouter>
        <AssignmentTaskCard
          assignmentId="asg_minimal_test"
          isOpen={true}
          onClose={vi.fn()}
        />
      </MemoryRouter>
    );

    const dialog = await screen.findByRole('dialog', { name: /Minimal Civic Observation Exercise/i });
    expect(dialog).toBeInTheDocument();

    // Objective / instructions
    expect(screen.getByText(/Draft an initial qualitative assessment of school entrance safety features/i)).toBeInTheDocument();

    // Submission status is Not started (no submission exists)
    expect(screen.getByText(/Not started/i)).toBeInTheDocument();

    // Rubric criterion
    expect(screen.getByText(/Initial Assessment/i)).toBeInTheDocument();

    // No estimated time row and no due date row
    expect(screen.queryByText(/Estimated time:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Due date:/i)).not.toBeInTheDocument();
  });

  it('regression: pre-existing modal opens, closes on Escape, and restores focus', async () => {
    render(
      <MemoryRouter>
        <ParticipantDashboardPage />
      </MemoryRouter>
    );

    const rulesBtn = await screen.findByTestId('dashboard-rules-btn');
    rulesBtn.focus();
    expect(document.activeElement).toBe(rulesBtn);

    fireEvent.click(rulesBtn);

    const rulesDialog = await screen.findByRole('dialog', { name: /Platform Operating Rules & Standards/i });
    expect(rulesDialog).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Platform Operating Rules & Standards/i })).not.toBeInTheDocument();
    });

    expect(document.activeElement).toBe(rulesBtn);
  });
});
