import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProjectDetailPage } from '../src/features/projects/ProjectDetailPage';
import { ProjectsPage } from '../src/features/projects/ProjectsPage';
import { WorkspacePage } from '../src/features/workspaces/WorkspacePage';
import { ProjectTeamSeats } from '../src/features/projects/ProjectTeamSeats';
import { ProjectBoard } from '../src/features/projects/ProjectBoard';
import { useAuthStore } from '../src/stores/authStore';
import { PersistenceService } from '../src/services/persistence';
import { User, ProjectMilestone } from '../src/types/domain';

describe('Change Plan v2 Section 11: Projects and Workspace Team Boards', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  describe('ProjectDetailPage: Status Chip and Header', () => {
    it('displays an Active status chip for an ongoing project', async () => {
      render(
        <MemoryRouter initialEntries={['/projects/proj_navchetna_crosswalk_01']}>
          <Routes>
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /Navchetna Crosswalk & Speed Calming Action/i })).toBeInTheDocument();
      });

      // Status chip should display "Active"
      expect(screen.getAllByText(/active/i).length).toBeGreaterThanOrEqual(1);
    });

    it('displays a Completed status chip for a completed project', async () => {
      render(
        <MemoryRouter initialEntries={['/projects/proj_bus_stop_lighting_05']}>
          <Routes>
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1, name: /Mansarovar Evening Bus Stop Lighting Action/i })).toBeInTheDocument();
      });

      // Status chip should display "Completed"
      expect(screen.getAllByText(/completed/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('ProjectTeamSeats: Accessible Seats and Activation Details', () => {
    const mockMembers: User[] = [
      {
        id: 'user_aarav',
        name: 'Aarav Sharma',
        role: 'participant',
        email: 'aarav.sharma@navchetna.edu.in',
        username: 'aarav.sharma',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
        institutionId: 'inst_navchetna_jaipur',
        institutionName: 'Navchetna Public School, Jaipur',
        programmeIds: ['prog_my_community_future'],
        location: 'Mansarovar, Jaipur, Rajasthan',
        bio: 'Grade 12 student passionate about urban road safety and safe walking routes for school children.',
        age: 18,
        badgeCount: 5,
        totalCredits: 16,
        schemaVersion: 1,
        createdAt: '2026-09-01T08:30:00Z',
        updatedAt: '2026-10-08T15:45:00Z',
      },
      {
        id: 'user_priya',
        name: 'Priya Sharma',
        role: 'participant',
        email: 'priya.s@navchetna.edu.in',
        username: 'priya.s',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
        institutionId: 'inst_navchetna_jaipur',
        institutionName: 'Navchetna Public School, Jaipur',
        programmeIds: ['prog_my_community_future'],
        location: 'Jaipur, Rajasthan',
        bio: 'Urban mapping enthusiast and peer surveyor.',
        age: 18,
        badgeCount: 3,
        totalCredits: 15,
        schemaVersion: 1,
        createdAt: '2026-09-02T10:00:00Z',
        updatedAt: '2026-10-05T12:00:00Z',
      },
      {
        id: 'user_vikram',
        name: 'Vikram Joshi',
        role: 'participant',
        email: 'vikram.j@navchetna.edu.in',
        username: 'vikram.j',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
        institutionId: 'inst_navchetna_jaipur',
        institutionName: 'Navchetna Public School, Jaipur',
        programmeIds: ['prog_my_community_future'],
        location: 'Jaipur, Rajasthan',
        bio: 'Cycling safety advocate in Ward 24.',
        age: 18,
        badgeCount: 4,
        totalCredits: 13,
        schemaVersion: 1,
        createdAt: '2026-09-03T11:00:00Z',
        updatedAt: '2026-10-06T14:00:00Z',
      },
    ];

    it('renders named team members as accessible seat buttons with avatars/initials and role badges', () => {
      render(
        <ProjectTeamSeats
          teamMembers={mockMembers}
          leadUserId="user_aarav"
          projectId="proj_navchetna_crosswalk_01"
          projectTitle="Navchetna Crosswalk & Speed Calming Action"
        />
      );

      // Verifies all 3 seats exist as accessible buttons
      const aaravSeat = screen.getByTestId('team-seat-user_aarav');
      const priyaSeat = screen.getByTestId('team-seat-user_priya');
      const vikramSeat = screen.getByTestId('team-seat-user_vikram');

      expect(aaravSeat).toBeInTheDocument();
      expect(priyaSeat).toBeInTheDocument();
      expect(vikramSeat).toBeInTheDocument();

      // Lead badge and initials
      expect(within(aaravSeat).getByText('Aarav Sharma')).toBeInTheDocument();
      expect(within(aaravSeat).getByText('Lead')).toBeInTheDocument();
      expect(within(priyaSeat).getByText('Priya Sharma')).toBeInTheDocument();
      expect(within(priyaSeat).getByText('Member')).toBeInTheDocument();

      // Aria attributes
      expect(aaravSeat).toHaveAttribute('aria-label', expect.stringContaining('Aarav Sharma'));
      expect(aaravSeat).toHaveAttribute('aria-pressed', 'false');
    });

    it('reveals member operational scope and affiliation details upon seat activation', () => {
      render(
        <ProjectTeamSeats
          teamMembers={mockMembers}
          leadUserId="user_aarav"
          projectId="proj_navchetna_crosswalk_01"
          projectTitle="Navchetna Crosswalk & Speed Calming Action"
        />
      );

      // Detail card is initially not visible
      expect(screen.queryByTestId('seat-detail-user_aarav')).not.toBeInTheDocument();

      // Click on Aarav's seat
      fireEvent.click(screen.getByTestId('team-seat-user_aarav'));

      // Detail card is now visible with institutional and civic focus
      const detail = screen.getByTestId('seat-detail-user_aarav');
      expect(detail).toBeInTheDocument();
      expect(within(detail).getByText('Project Lead (Student Coordinator)')).toBeInTheDocument();
      expect(within(detail).getByText('Navchetna Public School, Jaipur')).toBeInTheDocument();
      expect(within(detail).getByText(/Grade 12 student passionate about urban road safety/i)).toBeInTheDocument();

      // Close button dismisses detail card
      fireEvent.click(screen.getByTestId('btn-close-seat-detail'));
      expect(screen.queryByTestId('seat-detail-user_aarav')).not.toBeInTheDocument();
    });

    it('supports keyboard activation via Enter and Space keys', () => {
      render(
        <ProjectTeamSeats
          teamMembers={mockMembers}
          leadUserId="user_aarav"
          projectId="proj_navchetna_crosswalk_01"
          projectTitle="Navchetna Crosswalk & Speed Calming Action"
        />
      );

      const priyaSeat = screen.getByTestId('team-seat-user_priya');

      // KeyDown Enter triggers activation
      fireEvent.keyDown(priyaSeat, { key: 'Enter', code: 'Enter' });
      expect(screen.getByTestId('seat-detail-user_priya')).toBeInTheDocument();
      expect(within(screen.getByTestId('seat-detail-user_priya')).getByText('Field Surveyor & Data Lead')).toBeInTheDocument();

      // KeyDown Space toggles it off
      fireEvent.keyDown(priyaSeat, { key: ' ', code: 'Space' });
      expect(screen.queryByTestId('seat-detail-user_priya')).not.toBeInTheDocument();
    });

    it('preserves privacy-safe 33% policy behavior without displaying individual declarations', () => {
      render(
        <ProjectTeamSeats
          teamMembers={mockMembers}
          leadUserId="user_aarav"
          projectId="proj_navchetna_crosswalk_01"
          projectTitle="Navchetna Crosswalk & Speed Calming Action"
        />
      );

      // Platform 33% inclusion standard is communicated in aggregate
      expect(screen.getByText(/Platform 33% Inclusion Standard/i)).toBeInTheDocument();

      // Ensure no individual gender or reservation declaration is rendered
      expect(screen.queryByText(/eligible/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/ineligible/i)).not.toBeInTheDocument();
    });
  });

  describe('ProjectBoard: Three-Column Kanban Board and List Fallback', () => {
    const mockMilestones: ProjectMilestone[] = [
      {
        id: 'ms_01',
        title: 'Conduct baseline traffic & hazard audit',
        description: 'Collect 30-min peak hour count and capture crossing photos.',
        dueDate: '2026-10-05T00:00:00Z',
        isCompleted: true,
        completedAt: '2026-10-04T12:00:00Z',
      },
      {
        id: 'ms_02',
        title: 'Deliberate & finalize Youth Assembly proposition',
        description: 'Formulate structured policy proposal with engineering parameters.',
        dueDate: '2026-10-15T00:00:00Z',
        isCompleted: false,
      },
      {
        id: 'ms_03',
        title: 'Nagar Nigam Ward Committee Deputation',
        description: 'Submit proposition with 500 student/parent petition signatures.',
        dueDate: '2026-10-30T00:00:00Z',
        isCompleted: false,
      },
    ];

    it('derives To do, Doing, and Done columns from actual milestone statuses', () => {
      render(
        <ProjectBoard
          milestones={mockMilestones}
          isUpdating={false}
          onCompleteMilestone={() => {}}
          projectStatus="active"
        />
      );

      // Verifies three columns exist
      expect(screen.getByTestId('column-todo')).toBeInTheDocument();
      expect(screen.getByTestId('column-doing')).toBeInTheDocument();
      expect(screen.getByTestId('column-done')).toBeInTheDocument();

      // Column counts
      expect(screen.getByTestId('count-done')).toHaveTextContent('1');
      expect(screen.getByTestId('count-doing')).toHaveTextContent('1');
      expect(screen.getByTestId('count-todo')).toHaveTextContent('1');

      // Milestone placement
      const doneCol = screen.getByTestId('column-done');
      expect(within(doneCol).getByText('Conduct baseline traffic & hazard audit')).toBeInTheDocument();
      expect(within(doneCol).getByText('+2 Civic Action Awarded')).toBeInTheDocument();

      const doingCol = screen.getByTestId('column-doing');
      expect(within(doingCol).getByText('Deliberate & finalize Youth Assembly proposition')).toBeInTheDocument();
      expect(within(doingCol).getByText('In Progress')).toBeInTheDocument();

      const todoCol = screen.getByTestId('column-todo');
      expect(within(todoCol).getByText('Nagar Nigam Ward Committee Deputation')).toBeInTheDocument();
    });

    it('labels the Doing stage as illustrative single-browser execution', () => {
      render(
        <ProjectBoard
          milestones={mockMilestones}
          isUpdating={false}
          onCompleteMilestone={() => {}}
          projectStatus="active"
        />
      );

      const notice = screen.getByTestId('illustrative-stage-notice');
      expect(notice).toBeInTheDocument();
      expect(notice).toHaveTextContent(/The "Doing" column reflects derived illustrative execution/i);
    });

    it('toggles to accessible list fallback view on mobile or upon selection', () => {
      render(
        <ProjectBoard
          milestones={mockMilestones}
          isUpdating={false}
          onCompleteMilestone={() => {}}
          projectStatus="active"
        />
      );

      // Click list fallback toggle
      fireEvent.click(screen.getByTestId('toggle-list-view'));

      // List fallback view is rendered
      const listFallback = screen.getByTestId('milestones-list-fallback');
      expect(listFallback).toBeInTheDocument();
      expect(within(listFallback).getByText('Doing (Illustrative)')).toBeInTheDocument();
      expect(within(listFallback).getByText('To do')).toBeInTheDocument();
      expect(within(listFallback).getByText('Done')).toBeInTheDocument();

      // Can switch back to Kanban board
      fireEvent.click(screen.getByTestId('toggle-board-view'));
      expect(screen.getByTestId('kanban-columns-container')).toBeInTheDocument();
    });

    it('triggers milestone completion and awards credits callback', () => {
      let completedId = '';
      render(
        <ProjectBoard
          milestones={mockMilestones}
          isUpdating={false}
          onCompleteMilestone={(id) => {
            completedId = id;
          }}
          projectStatus="active"
        />
      );

      // Click "Mark Complete (+2 Credits)" on the Doing milestone
      const completeBtn = screen.getByTestId('btn-complete-ms_02');
      fireEvent.click(completeBtn);

      expect(completedId).toBe('ms_02');
    });
  });

  describe('WorkspacePage: Glanceable Joined Projects and Pending Invitations', () => {
    it('renders joined projects as clear tiles for signed-in user Aarav', async () => {
      render(
        <MemoryRouter initialEntries={['/workspace']}>
          <Routes>
            <Route path="/workspace" element={<WorkspacePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('section-joined-projects')).toBeInTheDocument();
      });

      // Aarav is lead of proj_navchetna_crosswalk_01 in seed data
      const tile = screen.getByTestId('joined-project-tile-proj_navchetna_crosswalk_01');
      expect(tile).toBeInTheDocument();
      expect(within(tile).getByText('Navchetna Crosswalk & Speed Calming Action')).toBeInTheDocument();
      expect(within(tile).getByText('Project Lead')).toBeInTheDocument();
      expect(within(tile).getByText('Open Team Board')).toBeInTheDocument();
    });

    it('renders pending invitations in one obvious place with accept and decline flow', async () => {
      // Switch persona to Meera Singh, who has an invited state in seed data
      render(
        <MemoryRouter initialEntries={['/workspace']}>
          <Routes>
            <Route path="/workspace" element={<WorkspacePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('switch-to-user_meera')).toBeInTheDocument();
      });

      // Switch to Meera
      fireEvent.click(screen.getByTestId('switch-to-user_meera'));

      // Meera sees pending invitation banner in one obvious place
      await waitFor(() => {
        expect(screen.getByTestId('invitation-banner')).toBeInTheDocument();
      });

      const banner = screen.getByTestId('invitation-banner');
      expect(within(banner).getByText(/Workspace Invitation Pending/i)).toBeInTheDocument();
      expect(within(banner).getByText(/Jaipur Ward 24 School-Zone Safety Workspace/i)).toBeInTheDocument();
      expect(within(banner).getByTestId('btn-accept-invite')).toBeInTheDocument();
      expect(within(banner).getByTestId('btn-decline-invite')).toBeInTheDocument();

      // Meera accepts the invitation
      fireEvent.click(within(banner).getByTestId('btn-accept-invite'));

      await waitFor(() => {
        expect(screen.getByText(/Invitation accepted! Welcome to the Jaipur School-Zone Safety Workspace/i)).toBeInTheDocument();
      });
    });

    it('preserves invite-by-exact-username search in the private Jaipur workspace', async () => {
      render(
        <MemoryRouter initialEntries={['/workspace/ws_jaipur_school_safety']}>
          <Routes>
            <Route path="/workspace/:id" element={<WorkspacePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-members')).toBeInTheDocument();
      });

      // Navigate to Members & Invites tab
      fireEvent.click(screen.getByTestId('tab-members'));

      // Search input for username is available
      const usernameInput = screen.getByTestId('input-invite-username');
      expect(usernameInput).toBeInTheDocument();

      fireEvent.change(usernameInput, { target: { value: 'sid.nair' } });
      fireEvent.click(screen.getByTestId('btn-search-username'));

      await waitFor(() => {
        expect(screen.getByTestId('user-search-result-sid.nair')).toBeInTheDocument();
      });
    });
  });

  describe('ProjectsPage: Overview with Team Boards and Status Chips', () => {
    it('renders all initiatives with Active/Completed status chips and team seats preview', async () => {
      render(
        <MemoryRouter initialEntries={['/projects']}>
          <Routes>
            <Route path="/projects" element={<ProjectsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Youth Civic Action Projects/i)).toBeInTheDocument();
      });

      // Status chip exists for active project
      expect(screen.getByText('Navchetna Crosswalk & Speed Calming Action')).toBeInTheDocument();
      expect(screen.getAllByText(/active/i).length).toBeGreaterThanOrEqual(1);

      // Links to Team Boards exist
      const openBoardButtons = screen.getAllByText('Open Team Board');
      expect(openBoardButtons.length).toBeGreaterThanOrEqual(4);
    });
  });
});
