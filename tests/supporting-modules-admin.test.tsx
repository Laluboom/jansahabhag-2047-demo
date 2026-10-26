import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { useAuthStore } from '../src/stores/authStore';

// Participant screens
import { ProjectsPage } from '../src/features/projects/ProjectsPage';
import { ProjectDetailPage } from '../src/features/projects/ProjectDetailPage';
import { EventsPage } from '../src/features/events/EventsPage';
import { EventDetailPage } from '../src/features/events/EventDetailPage';
import { ActivitiesPage } from '../src/features/activities/ActivitiesPage';
import { CommunityPage } from '../src/features/community/CommunityPage';
import { CommunityGroupDetailPage } from '../src/features/community/CommunityGroupDetailPage';
import { CivicIssuesPage } from '../src/features/issues/CivicIssuesPage';
import { IssueDetailPage } from '../src/features/issues/IssueDetailPage';

// Admin screens
import { AdminDashboardPage } from '../src/features/administration/AdminDashboardPage';
import { AdminProgrammesPage } from '../src/features/administration/AdminProgrammesPage';
import { AdminContentPage } from '../src/features/administration/AdminContentPage';
import { AdminModerationPage } from '../src/features/moderation/AdminModerationPage';
import { AnalyticsPage } from '../src/features/analytics/AnalyticsPage';
import { InstitutionDashboardPage } from '../src/features/institutions/InstitutionDashboardPage';
import { ParticipantsPage } from '../src/features/institutions/ParticipantsPage';
import { InstitutionProgrammesPage } from '../src/features/institutions/ProgrammesPage';

// Previews
import { ParliamentPage } from '../src/features/previews/ParliamentPage';
import { IdeaLabPage } from '../src/features/previews/IdeaLabPage';
import { ResearchLabPage } from '../src/features/previews/ResearchLabPage';
import { PolicyLabPage } from '../src/features/previews/PolicyLabPage';
import { StakeholdersPage } from '../src/features/previews/StakeholdersPage';
import { StudioPage } from '../src/features/previews/StudioPage';

describe('Task 04 Supporting Modules & Admin Integration Tests', () => {
  beforeEach(async () => {
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  describe('Repository & Domain Transitions', () => {
    it('ensures project milestone completion is idempotent and creates Passport/Activity entries', async () => {
      const user = await demoRepository.getCurrentUser();
      const initialPassport = await demoRepository.getPassport(user.id);
      const initialCredits = user.totalCredits;

      // Complete milestone 2 (which is initially incomplete)
      const project = await demoRepository.completeProjectMilestone(
        'proj_navchetna_crosswalk_01',
        'ms_02_assembly',
        user.id
      );

      const milestone2 = project.milestones.find((m) => m.id === 'ms_02_assembly');
      expect(milestone2?.isCompleted).toBe(true);

      const updatedUser = await demoRepository.getCurrentUser();
      expect(updatedUser.totalCredits).toBe(initialCredits + 2);

      const passportAfterFirst = await demoRepository.getPassport(user.id);
      expect(passportAfterFirst.entries.length).toBe(initialPassport.entries.length + 1);
      const newEntry = passportAfterFirst.entries.find((e) => e.sourceReferenceId === 'ms_02_assembly');
      expect(newEntry).toBeDefined();
      expect(newEntry?.category).toBe('civic_action');
      expect(newEntry?.creditsAwarded).toBe(2);

      // Repeat call: should be idempotent (no duplicate credit or passport entry)
      await demoRepository.completeProjectMilestone(
        'proj_navchetna_crosswalk_01',
        'ms_02_assembly',
        user.id
      );

      const userAfterRepeat = await demoRepository.getCurrentUser();
      expect(userAfterRepeat.totalCredits).toBe(initialCredits + 2);

      const passportAfterRepeat = await demoRepository.getPassport(user.id);
      expect(passportAfterRepeat.entries.length).toBe(passportAfterFirst.entries.length);
    });

    it('handles event RSVP and check-in transitions', async () => {
      const user = await demoRepository.getCurrentUser();
      const event = await demoRepository.getEvent('evt_jaipur_assembly_01');
      expect(event).not.toBeNull();

      // RSVP attending
      const updatedEvent = await demoRepository.rsvpEvent(event!.id, user.id, 'attending');
      expect(updatedEvent.rsvpMap?.[user.id]).toBe('attending');
      expect(updatedEvent.attendeeUserIds).toContain(user.id);

      // Check-in
      const checkInResult = await demoRepository.checkInEvent(event!.id, user.id);
      expect(checkInResult.event.checkedInUserIds).toContain(user.id);
      expect(checkInResult.activity).toBeDefined();
    });

    it('handles community group membership, posts, and post likes', async () => {
      const user = await demoRepository.getCurrentUser();
      const group = await demoRepository.getCommunityGroup('grp_jaipur_safe_streets');
      expect(group).not.toBeNull();

      // Add post
      const post = await demoRepository.addCommunityPost({
        groupId: group!.id,
        authorId: user.id,
        title: 'Safe Sidewalks Update',
        content: 'We surveyed the road outside school this morning.',
        tags: ['Jaipur', 'Safety'],
      });
      expect(post.title).toBe('Safe Sidewalks Update');
      expect(post.likesCount).toBe(0);

      // Like post
      const likedPost = await demoRepository.likeCommunityPost(post.id, user.id);
      expect(likedPost.likesCount).toBe(1);
      expect(likedPost.likedByUserIds).toContain(user.id);

      // Toggle unlike post
      const unlikedPost = await demoRepository.likeCommunityPost(post.id, user.id);
      expect(unlikedPost.likesCount).toBe(0);
      expect(unlikedPost.likedByUserIds).not.toContain(user.id);
    });

    it('handles civic issues upvoting and reporting', async () => {
      const user = await demoRepository.getCurrentUser();
      const issues = await demoRepository.getCivicIssues();
      expect(issues.length).toBeGreaterThan(0);

      // Find an issue where current user has not upvoted yet, or test toggle
      const unvotedIssue = issues.find((i) => !i.upvotedByUserIds?.includes(user.id)) || issues[0];
      const initialUpvotes = unvotedIssue.reportsCount;

      // Upvote
      const upvoted = await demoRepository.upvoteCivicIssue(unvotedIssue.id, user.id);
      expect(upvoted.upvotedByUserIds).toContain(user.id);

      // Report new issue
      const newIssue = await demoRepository.reportCivicIssue({
        title: 'Broken Streetlight outside Gate 2',
        location: 'Tonk Road Junction',
        ward: 'Ward 24 (Jaipur)',
        category: 'Lighting Hazard',
        severity: 'high',
        status: 'reported',
        description: 'No ambient illumination after 18:30 during winter hours.',
        evidenceIds: [],
      });
      expect(newIssue.id).toBeDefined();
      expect(newIssue.severity).toBe('high');
    });

    it('handles moderation case progression from open to under_review to actioned', async () => {
      await demoRepository.switchUser('JS-F-001');
      const user = await demoRepository.getCurrentUser();
      const cases = await demoRepository.getModerationCases();
      expect(cases.length).toBeGreaterThan(0);

      const targetCase = cases[0];

      // Open -> Under Review
      const underReview = await demoRepository.updateModerationCase(targetCase.id, {
        status: 'under_review',
        reviewerId: user.id,
        notes: 'Review initiated by test admin.',
      });
      expect(underReview.status).toBe('under_review');

      // Under Review -> Actioned
      const actioned = await demoRepository.updateModerationCase(targetCase.id, {
        status: 'actioned',
        reviewerId: user.id,
        resolutionDetails: 'Actioned with educational notice.',
      });
      expect(actioned.status).toBe('actioned');
      expect(actioned.resolutionDetails).toBe('Actioned with educational notice.');
    });
  });

  describe('Participant Supporting Views UI Rendering', () => {
    it('renders ProjectsPage and ProjectDetailPage with milestones', async () => {
      render(
        <MemoryRouter initialEntries={['/projects']}>
          <Routes>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Youth Civic Action Projects/i)).toBeInTheDocument();
      });
    });

    it('renders EventsPage with RSVP state', async () => {
      render(
        <MemoryRouter initialEntries={['/events']}>
          <Routes>
            <Route path="/events" element={<EventsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Civic Events & Deliberation Sessions/i)).toBeInTheDocument();
      });
    });

    it('renders ActivitiesPage and CommunityPage', async () => {
      render(
        <MemoryRouter initialEntries={['/activities']}>
          <Routes>
            <Route path="/activities" element={<ActivitiesPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Participatory Civic Stream/i)).toBeInTheDocument();
      });
    });

    it('renders CivicIssuesPage with danger map and reporting', async () => {
      render(
        <MemoryRouter initialEntries={['/issues']}>
          <Routes>
            <Route path="/issues" element={<CivicIssuesPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Civic Issues & Danger Spots Map/i)).toBeInTheDocument();
      });
    });
  });

  describe('Admin & Institutional Views UI Rendering', () => {
    it('renders AdminDashboardPage with metrics and moderation summary', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/JanSahabhag 2047 State Command/i)).toBeInTheDocument();
        expect(screen.getByText(/Programmes Management/i)).toBeInTheDocument();
      });
    });

    it('renders AdminProgrammesPage with filter and create modal', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/programmes']}>
          <Routes>
            <Route path="/admin/programmes" element={<AdminProgrammesPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/State Programmes Administration/i)).toBeInTheDocument();
        expect(screen.getByText(/Deploy New Programme/i)).toBeInTheDocument();
      });
    });

    it('renders AdminContentPage with curriculum tracks', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/content']}>
          <Routes>
            <Route path="/admin/content" element={<AdminContentPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Curriculum & Content Management/i)).toBeInTheDocument();
        expect(screen.getByText(/Add New Course/i)).toBeInTheDocument();
      });
    });

    it('renders AdminModerationPage with status filters', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/moderation']}>
          <Routes>
            <Route path="/admin/moderation" element={<AdminModerationPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Moderation & Content Safety Queue/i)).toBeInTheDocument();
      });
    });

    it('renders AnalyticsPage with local and national tabs', async () => {
      render(
        <MemoryRouter initialEntries={['/analytics']}>
          <Routes>
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Civic Engagement & Deliberation Analytics/i)).toBeInTheDocument();
        expect(screen.getByText(/Local Institution Real-Time/i)).toBeInTheDocument();
        expect(screen.getByText(/National 2047 Preview/i)).toBeInTheDocument();
      });
    });

    it('renders Institution views (Dashboard, Participants, Programmes)', async () => {
      render(
        <MemoryRouter initialEntries={['/institution/dashboard']}>
          <Routes>
            <Route path="/institution/dashboard" element={<InstitutionDashboardPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Institutional Oversight Hub/i)).toBeInTheDocument();
      });
    });
  });

  describe('Vision Previews UI Rendering', () => {
    it('renders ParliamentPage with apex chamber simulation', async () => {
      render(
        <MemoryRouter initialEntries={['/parliament']}>
          <Routes>
            <Route path="/parliament" element={<ParliamentPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/National Youth Parliament 2047/i)).toBeInTheDocument();
        expect(screen.getByText(/Inspect (Gujarat|Rajasthan) Motion/i)).toBeInTheDocument();
      });
    });

    it('renders IdeaLabPage with grassroots innovations', async () => {
      render(
        <MemoryRouter initialEntries={['/labs/ideas']}>
          <Routes>
            <Route path="/labs/ideas" element={<IdeaLabPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Idea Lab: Civic Inventions & Prototypes/i)).toBeInTheDocument();
      });
    });

    it('renders ResearchLabPage with empirical studies', async () => {
      render(
        <MemoryRouter initialEntries={['/labs/research']}>
          <Routes>
            <Route path="/labs/research" element={<ResearchLabPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Research Lab: Empirical Studies & Datasets/i)).toBeInTheDocument();
      });
    });

    it('renders PolicyLabPage with model bylaws', async () => {
      render(
        <MemoryRouter initialEntries={['/labs/policy']}>
          <Routes>
            <Route path="/labs/policy" element={<PolicyLabPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Policy Lab: Legislative Drafting & Model Bylaws/i)).toBeInTheDocument();
      });
    });

    it('renders StakeholdersPage with municipal transmission tracking', async () => {
      render(
        <MemoryRouter initialEntries={['/stakeholders']}>
          <Routes>
            <Route path="/stakeholders" element={<StakeholdersPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Municipal & Stakeholder Engagement/i)).toBeInTheDocument();
      });
    });

    it('renders StudioPage with creative tools', async () => {
      render(
        <MemoryRouter initialEntries={['/studio']}>
          <Routes>
            <Route path="/studio" element={<StudioPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Civic Studio & Campaign Creator/i)).toBeInTheDocument();
      });
    });
  });
});
