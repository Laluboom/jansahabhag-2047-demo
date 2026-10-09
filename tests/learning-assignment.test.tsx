import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useAuthStore } from '../src/stores/authStore';
import { PersistenceService } from '../src/services/persistence';
import { CoursesPage } from '../src/features/learning/CoursesPage';
import { AssignmentsPage } from '../src/features/assignments/AssignmentsPage';
import { ParticipantDashboardPage } from '../src/features/dashboard/ParticipantDashboardPage';

describe('Learning & Assignment Page Integration Tests', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  it('renders CoursesPage with tracks and course list for participant', async () => {
    render(
      <MemoryRouter>
        <CoursesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Civic Learning Hub/i })).toBeInTheDocument();
      expect(screen.getAllByText(/CIV-101/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByRole('button', { name: /Universal Human Values/i })).toBeInTheDocument();
    });
  });

  it('renders AssignmentsPage with participant submissions and action states', async () => {
    render(
      <MemoryRouter>
        <AssignmentsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Field Evidence & Assignments/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Action Required/i })).toBeInTheDocument();
      expect(screen.getAllByText(/School Gate Traffic Audit & Peak Hour Vehicle Count/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('renders teacher review tabs and queue when logged in as Kavita Rao', async () => {
    await useAuthStore.getState().switchPersona('user_kavita');

    render(
      <MemoryRouter>
        <AssignmentsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Assignment Review Queue/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Needs Review/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Revision Requested/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Verified/i })).toBeInTheDocument();
    });
  });

  it('renders ParticipantDashboardPage with connected next step and credit summary', async () => {
    render(
      <MemoryRouter>
        <ParticipantDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Aarav Sharma/i)).toBeInTheDocument();
      expect(screen.getByText(/Civic Journey Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Continue Action/i)).toBeInTheDocument();
      expect(screen.getByText(/Youth Deliberation Chamber/i)).toBeInTheDocument();
    });
  });
});


