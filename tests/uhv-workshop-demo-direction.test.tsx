import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../src/stores/authStore';
import { PersistenceService } from '../src/services/persistence';
import { demoRepository } from '../src/services/demoRepository';
import { CoursesPage } from '../src/features/learning/CoursesPage';
import { CourseDetailPage } from '../src/features/learning/CourseDetailPage';
import { LessonPage } from '../src/features/learning/LessonPage';
import { AssignmentDetailPage } from '../src/features/assignments/AssignmentDetailPage';
import { SubmitAssignmentPage } from '../src/features/assignments/SubmitAssignmentPage';

describe('Clarified UHV / Jeevan Vidya Demo Direction, Credit Boundary & Media Placeholders', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  describe('1. Exact Public Credit Line & Attribution Constraints', () => {
    it('renders exact public credit line and mentions Nazim M. Sandh on dedicated UHV stream', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');

      render(
        <MemoryRouter initialEntries={['/uhv']}>
          <Routes>
            <Route path="/uhv" element={<CoursesPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        const banner = screen.getByTestId('uhv-credit-banner');
        expect(banner).toBeInTheDocument();

        // Exact public credit line
        expect(
          within(banner).getByText('Based on the Vadodara Savli youth workshop, material by Ganesh Bagadia.')
        ).toBeInTheDocument();

        // Mention Nazim M. Sandh
        expect(
          within(banner).getByText(/Nazim M\. Sandh also presented at the workshop/i)
        ).toBeInTheDocument();

        // Clarify platform's own words and no 7-day workshop curriculum
        expect(
          within(banner).getByText(/written in the platform's own words.*not a workshop feature or seven-day workshop curriculum/i)
        ).toBeInTheDocument();
      });

      // Assert no invented role or organisation for Ganesh Bagadia
      const bannerText = screen.getByTestId('uhv-credit-banner').textContent || '';
      expect(bannerText).not.toMatch(/Director Ganesh|Professor Ganesh|President Ganesh|Founder Ganesh/i);
      expect(bannerText).not.toMatch(/Ganesh Bagadia of|Ganesh Bagadia from/i);
    });

    it('renders exact public credit line on CourseDetailPage for UHV track', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');

      render(
        <MemoryRouter initialEntries={['/learn/course_uhv_leadership_05']}>
          <Routes>
            <Route path="/learn/:courseId" element={<CourseDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        const banner = screen.getByTestId('uhv-credit-banner');
        expect(banner).toBeInTheDocument();

        expect(
          within(banner).getByText('Based on the Vadodara Savli youth workshop, material by Ganesh Bagadia.')
        ).toBeInTheDocument();
        expect(
          within(banner).getByText(/Nazim M\. Sandh also presented at the workshop/i)
        ).toBeInTheDocument();
      });
    });

    it('renders exact public credit line on LessonPage for UHV module', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');

      render(
        <MemoryRouter initialEntries={['/learn/course_uhv_leadership_05/lesson/les_uhv_501']}>
          <Routes>
            <Route path="/learn/:courseId/lesson/:lessonId" element={<LessonPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        const banner = screen.getByTestId('uhv-credit-banner');
        expect(banner).toBeInTheDocument();

        expect(
          within(banner).getByText('Based on the Vadodara Savli youth workshop, material by Ganesh Bagadia.')
        ).toBeInTheDocument();
        expect(
          within(banner).getByText(/Nazim M\. Sandh also presented at the workshop/i)
        ).toBeInTheDocument();
      });
    });

    it('renders exact public credit line on AssignmentDetailPage for UHV', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-002');

      render(
        <MemoryRouter initialEntries={['/assignments/asg_uhv_09']}>
          <Routes>
            <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        const banner = screen.getByTestId('uhv-credit-banner');
        expect(banner).toBeInTheDocument();

        expect(
          within(banner).getByText('Based on the Vadodara Savli youth workshop, material by Ganesh Bagadia.')
        ).toBeInTheDocument();
        expect(screen.getByText(/Observation of Needs: Physical Facilities vs Self-Exploration/i)).toBeInTheDocument();
      });
    });

    it('renders exact public credit line on SubmitAssignmentPage for UHV', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-002');

      render(
        <MemoryRouter initialEntries={['/assignments/asg_uhv_09/submit']}>
          <Routes>
            <Route path="/assignments/:id/submit" element={<SubmitAssignmentPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        const banner = screen.getByTestId('uhv-credit-banner');
        expect(banner).toBeInTheDocument();

        expect(
          within(banner).getByText('Based on the Vadodara Savli youth workshop, material by Ganesh Bagadia.')
        ).toBeInTheDocument();
        expect(screen.getByText(/Personal Reflection & Inquiry \(Private\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('2. Visual Media & YouTube Placeholders', () => {
    it('renders visually clear placeholders for future pictures and 1-2 videos explaining workshop-owned YouTube links without dead links or fake media', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');

      render(
        <MemoryRouter initialEntries={['/uhv']}>
          <Routes>
            <Route path="/uhv" element={<CoursesPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        const mediaContainer = screen.getByTestId('uhv-media-placeholders');
        expect(mediaContainer).toBeInTheDocument();

        // Check clear placeholders for separate UHV file's future pictures
        expect(screen.getByText(/Future Pictures Placeholder/i)).toBeInTheDocument();
        expect(screen.getByText(/Clear placeholder for the separate UHV file's future pictures/i)).toBeInTheDocument();

        // Check 1-2 video / YouTube placeholders
        expect(screen.getByText(/Future Video Embed \(1 of 2\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Future Video Embed \(2 of 2\)/i)).toBeInTheDocument();

        // Check explanation that workshop-owned YouTube links/embeds will be used later
        const explainers = screen.getAllByText(/Workshop-owned YouTube links\/embeds will be used later/i);
        expect(explainers.length).toBeGreaterThanOrEqual(2);
      });

      // Confirm no fake media or dead links (no broken image paths or dummy hrefs)
      const mediaSection = screen.getByTestId('uhv-media-placeholders');
      const imgElements = mediaSection.querySelectorAll('img');
      expect(imgElements.length).toBe(0);

      const anchorElements = mediaSection.querySelectorAll('a');
      anchorElements.forEach((anchor) => {
        expect(anchor.getAttribute('href')).not.toBe('#');
        expect(anchor.getAttribute('href')).not.toBe('');
      });
    });
  });

  describe('3. Ordinary Self-Inquiry Set: Needs, Relationships, Cooperation', () => {
    it('provides usable ordinary self-inquiry assignments in seed data in platform own words', async () => {
      const assignments = await demoRepository.getAssignments('course_uhv_leadership_05');

      const asgNeeds = assignments.find((a) => a.id === 'asg_uhv_09');
      const asgRel = assignments.find((a) => a.id === 'asg_uhv_08');
      const asgCoop = assignments.find((a) => a.id === 'asg_uhv_10');

      expect(asgNeeds).toBeDefined();
      expect(asgNeeds?.title).toContain('Observation of Needs');
      expect(asgNeeds?.prompt).toContain('physical body');
      expect(asgNeeds?.creditsReward).toBe(0);
      expect(asgNeeds?.rubric).toEqual([]);
      expect(asgNeeds?.assignmentType).toBe('uhv_reflection');

      expect(asgRel).toBeDefined();
      expect(asgRel?.title).toContain('Trust and Respect in Relationships');
      expect(asgRel?.prompt).toContain('intention');
      expect(asgRel?.creditsReward).toBe(0);
      expect(asgRel?.rubric).toEqual([]);
      expect(asgRel?.assignmentType).toBe('uhv_reflection');

      expect(asgCoop).toBeDefined();
      expect(asgCoop?.title).toContain('Cooperation in a Small Youth Group Activity');
      expect(asgCoop?.prompt).toContain('cooperation and complementary contribution');
      expect(asgCoop?.creditsReward).toBe(0);
      expect(asgCoop?.rubric).toEqual([]);
      expect(asgCoop?.assignmentType).toBe('uhv_reflection');
    });

    it('displays the small usable set of ordinary self-inquiry assignments on the UHV stream page', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');

      render(
        <MemoryRouter initialEntries={['/uhv']}>
          <Routes>
            <Route path="/uhv" element={<CoursesPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Self-Inquiry Assignments & Youth Activities/i)).toBeInTheDocument();
        expect(screen.getByText(/Observation of Needs: Physical Facilities vs Self-Exploration/i)).toBeInTheDocument();
        expect(screen.getByText(/Civic Ethics & Community Harmony Reflection: Trust and Respect in Relationships/i)).toBeInTheDocument();
        expect(screen.getByText(/Cooperation in a Small Youth Group Activity/i)).toBeInTheDocument();
      });
    });
  });

  describe('4. Privacy & Credit Boundary Invariants for Needs & Cooperation Activities', () => {
    it('saves draft and submits Needs inquiry (asg_uhv_09) without evidence, earning 0 Civic Credits, isolated from teacher queue', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-002');
      const initialCredits = (await demoRepository.getCurrentUser()).totalCredits;

      // 1. Submit observation of needs reflection
      const submitted = await demoRepository.submitAssignment({
        assignmentId: 'asg_uhv_09',
        userId: 'VSC-S-002',
        content: 'Observations on physical facility: food and clothing are limited and countable, while trust and respect are qualitative and continuously needed.',
        evidenceIds: [],
      });

      expect(submitted.status).toBe('completed');
      expect(submitted.isUhvReflection).toBe(true);
      expect(submitted.visibility).toBe('private');
      expect(submitted.evidenceIds).toEqual([]);

      // Civic Credits must NOT change
      const afterCredits = (await demoRepository.getCurrentUser()).totalCredits;
      expect(afterCredits).toBe(initialCredits);

      // Teacher queue isolation
      await useAuthStore.getState().switchPersona('VSC-T-001');
      const teacherQueue = await demoRepository.getSubmissions();
      expect(teacherQueue.filter((s) => s.assignmentId === 'asg_uhv_09')).toHaveLength(0);

      // Teacher direct review must be rejected
      await expect(
        demoRepository.reviewSubmission({
          submissionId: submitted.id,
          reviewerId: 'VSC-T-001',
          status: 'verified',
          score: 10,
          teacherFeedback: 'Evaluative review',
        })
      ).rejects.toThrow(/Teacher review and scoring are not permitted for private UHV reflections/);
    });

    it('saves draft and submits Cooperation inquiry (asg_uhv_10) without evidence, earning 0 Civic Credits, isolated from teacher queue', async () => {
      await useAuthStore.getState().switchPersona('VSC-S-001');
      const initialCredits = (await demoRepository.getCurrentUser()).totalCredits;

      // Submit small youth group cooperation reflection
      const submitted = await demoRepository.submitAssignment({
        assignmentId: 'asg_uhv_10',
        userId: 'VSC-S-001',
        content: 'Reflections on youth project: when viewing teammates as complementary rather than competitors, mutual trust arose naturally.',
        evidenceIds: [],
      });

      expect(submitted.status).toBe('completed');
      expect(submitted.isUhvReflection).toBe(true);
      expect(submitted.visibility).toBe('private');

      // Civic Credits must remain unchanged
      const afterCredits = (await demoRepository.getCurrentUser()).totalCredits;
      expect(afterCredits).toBe(initialCredits);

      // Civic Passport must NOT receive any entries
      const passport = await demoRepository.getPassport('VSC-S-001');
      expect(passport.entries.filter((e) => e.sourceReferenceId === 'asg_uhv_10')).toHaveLength(0);

      // Direct addCredit must be blocked
      await expect(
        demoRepository.addCredit({
          userId: 'VSC-S-001',
          dimension: 'Learning',
          amount: 5,
          sourceType: 'assignment',
          sourceId: 'asg_uhv_10',
          status: 'Verified',
          reason: 'Illegal attempt to credit UHV assignment',
        })
      ).rejects.toThrow(/Civic credits cannot be awarded for Universal Human Values/);
    });
  });
});
