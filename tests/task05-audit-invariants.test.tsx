import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { demoRepository } from '../src/services/demoRepository';
import { useAuthStore } from '../src/stores/authStore';
import { CourseDetailPage } from '../src/features/learning/CourseDetailPage';
import { LessonPage } from '../src/features/learning/LessonPage';
import { AssignmentDetailPage } from '../src/features/assignments/AssignmentDetailPage';
import { AssemblyDetailPage } from '../src/features/assemblies/AssemblyDetailPage';
import { AssemblySessionPage } from '../src/features/assemblies/AssemblySessionPage';
import { PropositionDetailPage } from '../src/features/propositions/PropositionDetailPage';
import { ProjectDetailPage } from '../src/features/projects/ProjectDetailPage';
import { IssueDetailPage } from '../src/features/issues/IssueDetailPage';
import { EventDetailPage } from '../src/features/events/EventDetailPage';
import { CommunityGroupDetailPage } from '../src/features/community/CommunityGroupDetailPage';

describe('Task 05 Demo Audit & Core Invariants Tests', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await demoRepository.resetDemo();
    await useAuthStore.getState().initialize();
  });

  describe('Missing-Record UI Graceful Handling', () => {
    it('renders Missing Record UI on invalid course ID without crashing', async () => {
      render(
        <MemoryRouter initialEntries={['/learn/invalid_course_999']}>
          <Routes>
            <Route path="/learn/:courseId" element={<CourseDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(await screen.findByText(/Course Not Found/i)).toBeInTheDocument();
      expect(screen.getByText(/View All Courses/i)).toBeInTheDocument();
    });

    it('renders Missing Record UI on invalid lesson ID without crashing', async () => {
      render(
        <MemoryRouter initialEntries={['/learn/course_civic_obs_01/lesson/invalid_lesson_999']}>
          <Routes>
            <Route path="/learn/:courseId/lesson/:lessonId" element={<LessonPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(await screen.findByText(/Lesson Not Found/i)).toBeInTheDocument();
    });

    it('renders Missing Record UI on invalid assignment ID without crashing', async () => {
      render(
        <MemoryRouter initialEntries={['/assignments/invalid_asg_999']}>
          <Routes>
            <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(await screen.findByText(/Assignment Not Found/i)).toBeInTheDocument();
    });

    it('renders Missing Record UI on invalid assembly ID without crashing', async () => {
      render(
        <MemoryRouter initialEntries={['/assemblies/invalid_asm_999']}>
          <Routes>
            <Route path="/assemblies/:id" element={<AssemblyDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(await screen.findByText(/Youth Assembly Not Found/i)).toBeInTheDocument();
    });

    it('renders Missing Record UI on invalid assembly session ID without crashing', async () => {
      render(
        <MemoryRouter initialEntries={['/assemblies/invalid_asm_999/session']}>
          <Routes>
            <Route path="/assemblies/:id/session" element={<AssemblySessionPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(await screen.findByText(/Assembly Session Not Found/i)).toBeInTheDocument();
    });

    it('renders Missing Record UI on invalid proposition ID without crashing', async () => {
      render(
        <MemoryRouter initialEntries={['/propositions/invalid_prop_999']}>
          <Routes>
            <Route path="/propositions/:id" element={<PropositionDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(await screen.findByText(/Proposition Not Found/i)).toBeInTheDocument();
    });

    it('renders Missing Record UI on invalid project ID without crashing', async () => {
      render(
        <MemoryRouter initialEntries={['/projects/invalid_prj_999']}>
          <Routes>
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(await screen.findByText(/Project Not Found/i)).toBeInTheDocument();
    });

    it('renders Missing Record UI on invalid issue ID without crashing', async () => {
      render(
        <MemoryRouter initialEntries={['/issues/invalid_issue_999']}>
          <Routes>
            <Route path="/issues/:id" element={<IssueDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(await screen.findByText(/Civic Issue Not Found/i)).toBeInTheDocument();
    });

    it('renders Missing Record UI on invalid event ID without crashing', async () => {
      render(
        <MemoryRouter initialEntries={['/events/invalid_evt_999']}>
          <Routes>
            <Route path="/events/:id" element={<EventDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(await screen.findByText(/Event Not Found/i)).toBeInTheDocument();
    });

    it('renders Missing Record UI on invalid community group ID without crashing', async () => {
      render(
        <MemoryRouter initialEntries={['/community/groups/invalid_grp_999']}>
          <Routes>
            <Route path="/community/groups/:id" element={<CommunityGroupDetailPage />} />
          </Routes>
        </MemoryRouter>
      );
      expect(await screen.findByText(/Community Circle Not Found/i)).toBeInTheDocument();
    });
  });

  describe('Core Invariants & Idempotent Operations', () => {
    it('maintains idempotency on duplicate lesson completions', async () => {
      const initialCredits = await demoRepository.getCredits('user_aarav');
      const count1 = initialCredits.filter((c) => c.sourceId === 'les_obs_104').length;

      // Complete lesson once
      await demoRepository.completeLesson('user_aarav', 'les_obs_104');
      const creditsAfterFirst = await demoRepository.getCredits('user_aarav');
      const count2 = creditsAfterFirst.filter((c) => c.sourceId === 'les_obs_104').length;
      expect(count2).toBe(count1 + 1);

      // Complete lesson second time
      await demoRepository.completeLesson('user_aarav', 'les_obs_104');
      const creditsAfterSecond = await demoRepository.getCredits('user_aarav');
      const count3 = creditsAfterSecond.filter((c) => c.sourceId === 'les_obs_104').length;
      expect(count3).toBe(count2); // Exactly 1 credit record awarded
    });

    it('prevents modifying verified assignment submissions', async () => {
      // Create and submit clean assignment
      const sub = await demoRepository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Initial field notes',
        evidenceIds: ['ev_aarav_interview_05'],
      });

      // Verify submission as teacher
      await demoRepository.switchUser('user_kavita');
      await demoRepository.reviewSubmission({
        submissionId: sub.id,
        reviewerId: 'user_kavita',
        status: 'verified',
        teacherFeedback: 'Verified by teacher.',
      });

      // Switch back to participant and attempt to overwrite verified submission should throw
      await demoRepository.switchUser('user_aarav');
      await expect(
        demoRepository.saveAssignmentDraft({
          assignmentId: 'asg_obs_03',
          userId: 'user_aarav',
          content: 'Illegal overwrite attempt',
        })
      ).rejects.toThrow(/Cannot modify submission with status 'verified'/i);
    });

    it('locks finalised propositions against duplicate finalisation', async () => {
      // Finalise proposition
      await demoRepository.finaliseProposition({
        propositionId: 'prop_jaipur_pedestrian_01',
        assemblyId: 'assembly_jaipur_pedestrian_2026',
        outcome: 'QUALIFIED_SUPPORT',
        updatedBy: 'Aarav Sharma',
      });

      // Attempt to finalise again should throw
      await expect(
        demoRepository.finaliseProposition({
          propositionId: 'prop_jaipur_pedestrian_01',
          assemblyId: 'assembly_jaipur_pedestrian_2026',
          outcome: 'CONSENSUS',
          updatedBy: 'Aarav Sharma',
        })
      ).rejects.toThrow(/already been finalised/i);
    });
  });
});
