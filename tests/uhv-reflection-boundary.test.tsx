import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../src/stores/authStore';
import { STORAGE_KEY, PersistenceService } from '../src/services/persistence';
import { demoRepository } from '../src/services/demoRepository';
import { SubmitAssignmentPage } from '../src/features/assignments/SubmitAssignmentPage';
import { AssignmentDetailPage } from '../src/features/assignments/AssignmentDetailPage';
import { LessonPage } from '../src/features/learning/LessonPage';

describe('UHV / Jeevan Vidya Reflection Boundary & Privacy Isolation', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await useAuthStore.getState().initialize();
  });

  describe('1. Private UHV draft and submit without evidence', () => {
    it('allows drafting and submitting UHV reflection without evidence, no credits awarded, and isolated from teacher queues', async () => {
      await useAuthStore.getState().switchPersona('user_meera');
      const initialCredits = (await demoRepository.getCurrentUser()).totalCredits;

      // 1. Save Draft with 0 evidence
      const draft = await demoRepository.saveAssignmentDraft({
        assignmentId: 'asg_uhv_08',
        userId: 'user_meera',
        content: 'Personal notes exploring harmony in relationships.',
        evidenceIds: [],
      });

      expect(draft.status).toBe('draft');
      expect(draft.evidenceIds).toEqual([]);
      expect(draft.isUhvReflection).toBe(true);
      expect(draft.visibility).toBe('private');

      // 2. Submit reflection with 0 evidence
      const submitted = await demoRepository.submitAssignment({
        assignmentId: 'asg_uhv_08',
        userId: 'user_meera',
        content: 'Self-inquiry observations on family harmony and mutual respect.',
        evidenceIds: [],
      });

      expect(submitted.status).toBe('completed');
      expect(submitted.evidenceIds).toEqual([]);
      expect(submitted.isUhvReflection).toBe(true);
      expect(submitted.visibility).toBe('private');

      // Credits must NOT change
      const afterCredits = (await demoRepository.getCurrentUser()).totalCredits;
      expect(afterCredits).toBe(initialCredits);

      // Teacher notifications must NOT include UHV reflection
      const teacherNotifs = await demoRepository.getNotifications('user_kavita');
      const uhvNotifs = teacherNotifs.filter((n) => n.targetRoute?.includes('asg_uhv_08'));
      expect(uhvNotifs).toHaveLength(0);

      // Privacy Boundary: Teacher Kavita cannot see Meera's UHV reflection in queues or direct lookup
      await useAuthStore.getState().switchPersona('user_kavita');
      const teacherQueue = await demoRepository.getSubmissions();
      const meeraUhvInQueue = teacherQueue.filter((s) => s.assignmentId === 'asg_uhv_08');
      expect(meeraUhvInQueue).toHaveLength(0);

      const directLookup = await demoRepository.getSubmission(submitted.id);
      expect(directLookup).toBeNull();
    });
  });

  describe('2. Direct-review scoring and reward rejection', () => {
    it('rejects teacher review and numeric scoring on UHV reflection even when called directly', async () => {
      await useAuthStore.getState().switchPersona('user_meera');
      const submitted = await demoRepository.submitAssignment({
        assignmentId: 'asg_uhv_08',
        userId: 'user_meera',
        content: 'Reflective thoughts on societal harmony.',
        evidenceIds: [],
      });

      // Switch to actual seeded teacher Kavita Rao
      await useAuthStore.getState().switchPersona('user_kavita');

      // Direct call to reviewSubmission must throw
      await expect(
        demoRepository.reviewSubmission({
          submissionId: submitted.id,
          reviewerId: 'user_kavita',
          status: 'verified',
          score: 25,
          teacherFeedback: 'Evaluative feedback should not be accepted',
        })
      ).rejects.toThrow(/Teacher review and scoring are not permitted for private UHV reflections/);

      // Verify no score or review metadata was recorded
      await useAuthStore.getState().switchPersona('user_meera');
      const refreshed = await demoRepository.getSubmission(submitted.id);
      expect(refreshed?.score).toBeUndefined();
      expect(refreshed?.reviewerId).toBeUndefined();
      expect(refreshed?.teacherFeedback).toBeUndefined();
      expect(refreshed?.evidenceIds).toEqual([]);
    });
  });

  describe('3. No UHV lesson credits & separate completion progress', () => {
    it('completes UHV lessons without awarding Learning credits or verified passport entries while tracking enrolment', async () => {
      // Use Aarav who has not started the UHV course yet
      await useAuthStore.getState().switchPersona('user_aarav');
      const initialCredits = (await demoRepository.getCurrentUser()).totalCredits;
      const initialPassport = await demoRepository.getPassport('user_aarav');

      // Complete lesson 1 of UHV track
      const result1 = await demoRepository.completeLesson('user_aarav', 'les_uhv_501');
      expect(result1.creditTransaction).toBeUndefined();
      expect(result1.enrolment.completedLessonIds).toContain('les_uhv_501');

      const creditsAfterL1 = (await demoRepository.getCurrentUser()).totalCredits;
      expect(creditsAfterL1).toBe(initialCredits);

      // Complete lesson 2 (100% course completion)
      const result2 = await demoRepository.completeLesson('user_aarav', 'les_uhv_502');
      expect(result2.creditTransaction).toBeUndefined();
      expect(result2.enrolment.progressPercent).toBe(100);
      expect(result2.enrolment.status).toBe('completed');

      const creditsAfterL2 = (await demoRepository.getCurrentUser()).totalCredits;
      expect(creditsAfterL2).toBe(initialCredits);

      // Civic passport must NOT count UHV course completion or create UHV entries
      const passport = await demoRepository.getPassport('user_aarav');
      const uhvEntries = passport.entries.filter(
        (p) =>
          p.sourceReferenceId === 'course_uhv_leadership_05' ||
          p.sourceReferenceId?.startsWith('les_uhv_')
      );
      expect(uhvEntries).toHaveLength(0);
      // Completed civic courses count remains unchanged
      expect(passport.completedCoursesCount).toBe(initialPassport.completedCoursesCount);
    });
  });

  describe('4. Unchanged civic assignment credit and evidence path', () => {
    it('preserves full credit, evidence verification, and scoring workflow for civic assignments', async () => {
      await useAuthStore.getState().switchPersona('user_aarav');
      const initialCredits = (await demoRepository.getCurrentUser()).totalCredits;

      // Add fresh mock interview evidence for civic assignment asg_obs_03
      const evidence = await demoRepository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'interview',
        title: 'Peer Walking Commute Safety Interviews (5 Students)',
        description: 'Structured interviews documenting near misses and sidewalk blockages.',
        source: 'Direct Peer Interviews',
        location: 'Navchetna School Gate, Mansarovar',
        visibility: 'assembly',
        verificationStatus: 'under_review',
        tags: ['Peer Interview', 'Commuter Safety'],
      });
      expect(evidence.verificationStatus).toBe('under_review');

      // Submit civic assignment asg_obs_03 with attached evidence
      const sub = await demoRepository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Conducted interviews with 5 students commuting via walking along Mansarovar route.',
        evidenceIds: [evidence.id],
      });

      expect(sub.status).toBe('submitted');
      expect(sub.evidenceIds).toContain(evidence.id);

      // +10 Contribution credits awarded
      const creditsAfterSubmit = (await demoRepository.getCurrentUser()).totalCredits;
      expect(creditsAfterSubmit).toBe(initialCredits + 10);

      // Teacher Kavita reviews and verifies civic assignment
      await useAuthStore.getState().switchPersona('user_kavita');
      const reviewed = await demoRepository.reviewSubmission({
        submissionId: sub.id,
        reviewerId: 'user_kavita',
        status: 'verified',
        score: 25,
        teacherFeedback: 'Outstanding interview synthesis and verified fieldwork.',
      });

      expect(reviewed.status).toBe('verified');
      expect(reviewed.score).toBe(25);

      // Evidence verified and +5 Observation credits awarded
      const updatedEv = await demoRepository.getEvidence(evidence.id);
      expect(updatedEv?.verificationStatus).toBe('verified');

      const passport = await demoRepository.getPassport('user_aarav');
      expect(passport.totalCredits).toBe(initialCredits + 15);
    });
  });

  describe('5. v1 persisted data repaired without losing unrelated civic data', () => {
    it('normalizes legacy UHV records in v1 localStorage using STORAGE_KEY while preserving public charter and custom user civic data', () => {
      // Simulate raw v1 database with defective UHV records
      const rawLegacyDb = {
        schemaVersion: 1,
        activeUserId: 'user_meera',
        users: [
          {
            id: 'user_meera',
            name: 'Meera Singh',
            email: 'meera.singh@vidyashree.edu.in',
            role: 'student',
            institutionId: 'inst_vidyashree_ajmer',
            institutionName: 'Vidyashree Senior Secondary, Ajmer',
            totalCredits: 180, // Legacy total including 60 UHV credits
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            bio: 'Master of Universal Human Values graduate',
            schemaVersion: 1,
            createdAt: '2026-08-01T00:00:00Z',
            updatedAt: '2026-08-01T00:00:00Z',
          },
        ],
        institutions: [],
        programmes: [],
        courses: [
          {
            id: 'course_uhv_leadership_05',
            code: 'UHV-501',
            title: 'Universal Human Values in Governance',
            description: 'Exploratory studies',
            track: 'uhv',
            level: 'Advanced',
            estimatedMinutes: 60,
            modules: [],
            isArchived: false,
            schemaVersion: 1,
            createdAt: '2026-08-01T00:00:00Z',
            updatedAt: '2026-08-01T00:00:00Z',
          },
        ],
        lessons: [],
        enrolments: [],
        assignments: [
          {
            id: 'asg_uhv_08',
            courseId: 'course_uhv_leadership_05',
            title: 'Universal Values Reflection Paper',
            prompt: 'Old prompt',
            requiredEvidenceType: 'document',
            creditsReward: 10,
            rubric: [{ criterion: 'Depth of Self-Exploration', maxPoints: 10, description: 'Evaluation' }],
            schemaVersion: 1,
            createdAt: '2026-08-01T00:00:00Z',
            updatedAt: '2026-08-01T00:00:00Z',
          },
        ],
        submissions: [
          {
            id: 'sub_meera_02',
            assignmentId: 'asg_uhv_08',
            userId: 'user_meera',
            content: 'Legacy submission text',
            evidenceIds: ['ev_meera_doc_02'], // Defect: linked to public Ajmer charter
            status: 'verified',
            score: 25,
            teacherFeedback: 'Evaluative feedback from v1',
            reviewerId: 'user_kavita',
            reviewedAt: '2026-09-02T15:00:00Z',
            schemaVersion: 1,
            createdAt: '2026-09-02T14:00:00Z',
            updatedAt: '2026-09-02T15:00:00Z',
          },
        ],
        evidence: [
          {
            id: 'ev_meera_doc_02',
            ownerId: 'user_meera',
            ownerName: 'Meera Singh',
            type: 'document',
            title: 'Youth Pedestrian Rights Charter: Ajmer Draft',
            description: '10-point charter submitted to Ward Councillor advocating for 15-minute car-free zones around primary schools.',
            source: 'Youth Deliberation Group Charter',
            location: 'Ajmer Ward 12',
            visibility: 'public',
            verificationStatus: 'verified',
            tags: ['Policy Brief', 'Charter', 'Pedestrian Rights'],
            schemaVersion: 1,
            createdAt: '2026-09-07T14:00:00Z',
            updatedAt: '2026-09-08T15:00:00Z',
          },
        ],
        activities: [],
        events: [],
        sessions: [],
        assemblies: [],
        assemblyRoles: [],
        contributions: [],
        propositions: [],
        projects: [],
        reflections: [
          {
            id: 'refl_custom_user_01',
            userId: 'user_meera',
            prompt: 'Custom citizen feedback inquiry',
            text: 'Participant recorded civic reflection',
            valuesHighlighted: ['Transparency'],
            isPublicInPassport: true,
            schemaVersion: 1,
            createdAt: '2026-09-05T10:00:00Z',
            updatedAt: '2026-09-05T10:00:00Z',
          },
          {
            id: 'refl_uhv_legacy_01',
            userId: 'user_meera',
            contextType: 'course',
            contextId: 'course_uhv_leadership_05',
            prompt: 'Legacy UHV reflection prompt',
            text: 'Legacy private reflections on human values',
            valuesHighlighted: ['Trust'],
            isPublicInPassport: true, // Legacy defect
            schemaVersion: 1,
            createdAt: '2026-09-01T10:00:00Z',
            updatedAt: '2026-09-01T10:00:00Z',
          },
          {
            id: 'refl_meera_assembly_01',
            userId: 'user_meera',
            contextType: 'assembly',
            contextId: 'assembly_jaipur_pedestrian_2026',
            prompt: 'Civic reflection on assembly dialogue',
            text: 'Deliberation improved my understanding of pedestrian infrastructure.',
            valuesHighlighted: ['Deliberation', 'Empathy'],
            isPublicInPassport: true,
            schemaVersion: 1,
            createdAt: '2026-09-05T12:00:00Z',
            updatedAt: '2026-09-05T12:00:00Z',
          },
        ],
        credits: [
          {
            id: 'tx_meera_03',
            userId: 'user_meera',
            dimension: 'Learning',
            amount: 30,
            sourceType: 'course',
            sourceId: 'course_uhv_leadership_05',
            status: 'Verified',
            reason: 'Legacy UHV graduation credit',
            createdAt: '2026-09-02T15:00:00Z',
            schemaVersion: 1,
          },
          {
            id: 'tx_legacy_uhv_refl',
            userId: 'user_meera',
            dimension: 'Reflection',
            amount: 5,
            sourceType: 'reflection',
            sourceId: 'refl_uhv_legacy_01',
            status: 'Verified',
            reason: 'Legacy UHV reflection credit defect',
            createdAt: '2026-09-01T10:00:00Z',
            schemaVersion: 1,
          },
          {
            id: 'tx_meera_civic_01',
            userId: 'user_meera',
            dimension: 'Civic Action',
            amount: 20,
            sourceType: 'project',
            sourceId: 'proj_ajmer_walking_charter_03',
            status: 'Verified',
            reason: 'Civic action milestone',
            createdAt: '2026-09-03T10:00:00Z',
            schemaVersion: 1,
          },
          {
            id: 'tx_meera_assembly_refl',
            userId: 'user_meera',
            dimension: 'Reflection',
            amount: 5,
            sourceType: 'reflection',
            sourceId: 'refl_meera_assembly_01',
            status: 'Verified',
            reason: 'Civic reflection credit',
            createdAt: '2026-09-05T12:00:00Z',
            schemaVersion: 1,
          },
        ],
        passportEntries: [
          {
            id: 'pass_meera_03',
            userId: 'user_meera',
            category: 'achievement',
            title: 'Master of Universal Human Values',
            subtitle: 'Graduate certificate claiming 30 credits',
            date: '2026-09-02',
            creditsAwarded: 30,
            evidenceIds: [],
            sourceReferenceId: 'course_uhv_leadership_05',
            sourceReferenceType: 'course',
            isVerified: true,
            schemaVersion: 1,
          },
          {
            id: 'pass_legacy_uhv_refl',
            userId: 'user_meera',
            category: 'reflection',
            title: 'Legacy UHV Reflection',
            subtitle: 'Defective passport entry',
            date: '2026-09-01',
            creditsAwarded: 5,
            evidenceIds: [],
            sourceReferenceId: 'refl_uhv_legacy_01',
            sourceReferenceType: 'reflection',
            isVerified: true,
            schemaVersion: 1,
          },
          {
            id: 'pass_meera_assembly_refl',
            userId: 'user_meera',
            category: 'reflection',
            title: 'Assembly Deliberation Reflection',
            subtitle: 'Pedestrian dialogue',
            date: '2026-09-05',
            creditsAwarded: 5,
            evidenceIds: [],
            sourceReferenceId: 'refl_meera_assembly_01',
            sourceReferenceType: 'reflection',
            isVerified: true,
            schemaVersion: 1,
          },
        ],
        notifications: [],
        communityGroups: [],
        communityPosts: [],
        moderationCases: [],
        civicIssues: [
          {
            id: 'issue_custom_user_01',
            title: 'Damaged crosswalk on JLN Marg',
            location: 'JLN Marg, Jaipur',
            ward: 'Ward 24',
            category: 'Safety',
            severity: 'medium',
            status: 'reported',
            description: 'Participant-reported custom civic issue',
            reportsCount: 1,
            evidenceIds: [],
            schemaVersion: 1,
            createdAt: '2026-09-10T10:00:00Z',
            updatedAt: '2026-09-10T10:00:00Z',
          },
        ],
      };

      // Set raw v1 database in localStorage using exact STORAGE_KEY
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rawLegacyDb));

      // Load database which triggers migrations
      const migrated = PersistenceService.loadDatabase();

      // Verify UHV assignment was repaired
      const asg = migrated.assignments.find((a) => a.id === 'asg_uhv_08');
      expect(asg?.assignmentType).toBe('uhv_reflection');
      expect(asg?.rubric).toEqual([]);
      expect(asg?.creditsReward).toBe(0);
      expect(asg?.requiredEvidenceType).toBeUndefined();

      // Verify UHV submission was repaired
      const sub = migrated.submissions.find((s) => s.id === 'sub_meera_02');
      expect(sub?.status).toBe('completed');
      expect(sub?.isUhvReflection).toBe(true);
      expect(sub?.visibility).toBe('private');
      expect(sub?.score).toBeUndefined();
      expect(sub?.reviewerId).toBeUndefined();
      expect(sub?.teacherFeedback).toBeUndefined();
      expect(sub?.evidenceIds).toEqual([]); // Erroneous charter link removed

      // Public Ajmer civic charter MUST be preserved!
      const charter = migrated.evidence.find((e) => e.id === 'ev_meera_doc_02');
      expect(charter).toBeDefined();
      expect(charter?.title).toBe('Youth Pedestrian Rights Charter: Ajmer Draft');

      // Legacy UHV reward records removed (both course and reflection-linked)
      expect(migrated.credits.find((c) => c.id === 'tx_meera_03')).toBeUndefined();
      expect(migrated.passportEntries.find((p) => p.id === 'pass_meera_03')).toBeUndefined();
      expect(migrated.credits.find((c) => c.id === 'tx_legacy_uhv_refl')).toBeUndefined();
      expect(migrated.passportEntries.find((p) => p.id === 'pass_legacy_uhv_refl')).toBeUndefined();

      // Legacy UHV reflection normalized to private
      const uhvRefl = migrated.reflections.find((r) => r.id === 'refl_uhv_legacy_01');
      expect(uhvRefl).toBeDefined();
      expect(uhvRefl?.isPublicInPassport).toBe(false);

      // Unrelated user civic records preserved, including civic reflections and credits!
      expect(migrated.credits.find((c) => c.id === 'tx_meera_civic_01')).toBeDefined();
      expect(migrated.credits.find((c) => c.id === 'tx_meera_assembly_refl')).toBeDefined();
      expect(migrated.passportEntries.find((p) => p.id === 'pass_meera_assembly_refl')).toBeDefined();
      expect(migrated.reflections.find((r) => r.id === 'refl_custom_user_01')).toBeDefined();
      expect(migrated.reflections.find((r) => r.id === 'refl_meera_assembly_01')).toBeDefined();
      expect(migrated.civicIssues?.find((i) => i.id === 'issue_custom_user_01')).toBeDefined();
    });
  });

  describe('6. UI reflection language and absence of scoring/rubric/credit promises', () => {
    it('renders SubmitAssignmentPage for UHV with reflection disclosures and without credit promises or evidence requirements', async () => {
      await useAuthStore.getState().switchPersona('user_meera');

      render(
        <MemoryRouter initialEntries={['/assignments/asg_uhv_08/submit']}>
          <Routes>
            <Route path="/assignments/:id/submit" element={<SubmitAssignmentPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Personal Reflection & Inquiry \(Private\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Personal Study Stream • No Civic Credits/i)).toBeInTheDocument();
        expect(screen.getByText(/Private Reflection Boundary \(Single-Browser Simulation\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Save Private Reflection/i)).toBeInTheDocument();
      });

      // Must NOT contain civic credit promises
      expect(screen.queryByText(/\+10 Civic Credits on Submit/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Attach Field Evidence Records/i)).not.toBeInTheDocument();
    });

    it('renders AssignmentDetailPage for UHV without rubrics, scores, or credit awards', async () => {
      await useAuthStore.getState().switchPersona('user_meera');

      render(
        <MemoryRouter initialEntries={['/assignments/asg_uhv_08']}>
          <Routes>
            <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Personal Study Stream • Private/i)).toBeInTheDocument();
        expect(screen.getByText(/No Civic Credits \(Non-Evaluative\)/i)).toBeInTheDocument();
        expect(screen.getByText(/Private Reflection Boundary \(Single-Browser Simulation\)/i)).toBeInTheDocument();
      });

      // Must NOT contain rubric points or scoring
      expect(screen.queryByText(/Assessment Rubric & Criteria/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/pts/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Score:/i)).not.toBeInTheDocument();
    });

    it('renders AssignmentDetailPage for teacher with privacy informational notice and no review controls', async () => {
      await useAuthStore.getState().switchPersona('user_kavita');

      render(
        <MemoryRouter initialEntries={['/assignments/asg_uhv_08']}>
          <Routes>
            <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Private Participant Reflection Stream/i)).toBeInTheDocument();
        expect(screen.getByText(/are not accessible for teacher review or grading in this simulation/i)).toBeInTheDocument();
      });

      // Teacher verification panel must NOT be rendered
      expect(screen.queryByText(/Teacher Verification & Assessment Panel/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Verify Submission/i)).not.toBeInTheDocument();
    });

    it('renders LessonPage for incomplete UHV module with non-credit completion language', async () => {
      // Use Aarav who has not completed the module yet
      await useAuthStore.getState().switchPersona('user_aarav');

      render(
        <MemoryRouter initialEntries={['/learn/course_uhv_leadership_05/lesson/les_uhv_502']}>
          <Routes>
            <Route path="/learn/:courseId/lesson/:lessonId" element={<LessonPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Back to Universal Human Values/i)).toBeInTheDocument();
        expect(screen.getByText(/Mark Module Complete/i)).toBeInTheDocument();
        expect(screen.getByText(/Personal Reflection Prompt/i)).toBeInTheDocument();
        expect(screen.getByText(/Open Reflection Prompt/i)).toBeInTheDocument();
      });

      // Must NOT promise credits
      expect(screen.queryByText(/Mark Lesson Complete \(\+5 Credits\)/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Go to Assignment \(\+10 Credits\)/i)).not.toBeInTheDocument();
    });
  });

  describe('7. Direct UHV reflection method and cross-persona read isolation', () => {
    it('records direct UHV reflections privately without civic credits, passport entries, public activity, or teacher notifications', async () => {
      await useAuthStore.getState().switchPersona('user_meera');
      const initialCredits = (await demoRepository.getCurrentUser()).totalCredits;
      const initialPassport = await demoRepository.getPassport('user_meera');

      // Call addReflection directly with UHV context
      const refl = await demoRepository.addReflection({
        userId: 'user_meera',
        contextType: 'course',
        contextId: 'course_uhv_leadership_05',
        prompt: 'Direct reflection on interpersonal trust',
        text: 'Private observations exploring harmony and personal values.',
        valuesHighlighted: ['Trust', 'Respect'],
        isPublicInPassport: true, // Should be forced to false
      });

      // Reflection must be private
      expect(refl.isPublicInPassport).toBe(false);

      // User total credits MUST remain unchanged
      const creditsAfter = (await demoRepository.getCurrentUser()).totalCredits;
      expect(creditsAfter).toBe(initialCredits);

      // Passport must NOT contain any reflection entry for this reflection
      const passportAfter = await demoRepository.getPassport('user_meera');
      expect(passportAfter.entries.find((p) => p.sourceReferenceId === refl.id)).toBeUndefined();
      expect(passportAfter.totalCredits).toBe(initialPassport.totalCredits);

      // Credits must NOT contain any transaction for this reflection
      const creditsList = await demoRepository.getCredits('user_meera');
      expect(creditsList.find((c) => c.sourceId === refl.id)).toBeUndefined();

      // Teacher Kavita must NOT receive notifications about Meera's UHV reflection
      const teacherNotifs = await demoRepository.getNotifications('user_kavita');
      expect(teacherNotifs.find((n) => n.message.includes('Direct reflection on interpersonal trust'))).toBeUndefined();
    });

    it('isolates private UHV reflections so other personas cannot read them via getReflections or getReflection', async () => {
      // Meera is active persona: can read her own seeded UHV reflection refl_meera_01
      await useAuthStore.getState().switchPersona('user_meera');
      const meeraRefls = await demoRepository.getReflections('user_meera');
      expect(meeraRefls.find((r) => r.id === 'refl_meera_01')).toBeDefined();

      const directLookupMeera = await demoRepository.getReflection('refl_meera_01');
      expect(directLookupMeera).toBeDefined();
      expect(directLookupMeera?.id).toBe('refl_meera_01');

      // Switch to Teacher Kavita: cannot access Meera's private UHV reflection
      await useAuthStore.getState().switchPersona('user_kavita');

      // getReflections with Meera's ID excludes UHV reflection
      const kavitaLookingAtMeera = await demoRepository.getReflections('user_meera');
      expect(kavitaLookingAtMeera.find((r) => r.id === 'refl_meera_01')).toBeUndefined();

      // getReflections without user ID excludes UHV reflection
      const allRefls = await demoRepository.getReflections();
      expect(allRefls.find((r) => r.id === 'refl_meera_01')).toBeUndefined();

      // Direct lookup by ID returns null for another persona's private UHV reflection
      const directLookupKavita = await demoRepository.getReflection('refl_meera_01');
      expect(directLookupKavita).toBeNull();
    });
  });

  describe('8. addCredit guard & intact civic Assembly reflection workflow', () => {
    it('prevents direct addCredit for UHV lesson, assignment, course, or UHV reflection sources', async () => {
      await useAuthStore.getState().switchPersona('user_aarav');
      const initialCredits = (await demoRepository.getCurrentUser()).totalCredits;

      // Lesson source
      await expect(
        demoRepository.addCredit({
          userId: 'user_aarav',
          dimension: 'Learning',
          amount: 5,
          sourceType: 'lesson',
          sourceId: 'les_uhv_501',
          status: 'Verified',
          reason: 'Attempted UHV lesson credit',
        })
      ).rejects.toThrow(/Civic credits cannot be awarded for Universal Human Values/);

      // Assignment source
      await expect(
        demoRepository.addCredit({
          userId: 'user_aarav',
          dimension: 'Contribution',
          amount: 10,
          sourceType: 'assignment',
          sourceId: 'asg_uhv_08',
          status: 'Verified',
          reason: 'Attempted UHV assignment credit',
        })
      ).rejects.toThrow(/Civic credits cannot be awarded for Universal Human Values/);

      // Course source
      await expect(
        demoRepository.addCredit({
          userId: 'user_aarav',
          dimension: 'Learning',
          amount: 30,
          sourceType: 'course' as any,
          sourceId: 'course_uhv_leadership_05',
          status: 'Verified',
          reason: 'Attempted UHV course credit',
        })
      ).rejects.toThrow(/Civic credits cannot be awarded for Universal Human Values/);

      // Reflection source
      await expect(
        demoRepository.addCredit({
          userId: 'user_aarav',
          dimension: 'Reflection',
          amount: 5,
          sourceType: 'reflection',
          sourceId: 'refl_meera_01',
          status: 'Verified',
          reason: 'Attempted UHV reflection credit',
        })
      ).rejects.toThrow(/Civic credits cannot be awarded for Universal Human Values/);

      // Total credits unchanged
      expect((await demoRepository.getCurrentUser()).totalCredits).toBe(initialCredits);
    });

    it('preserves full +5 Reflection Credit, Passport entry, and notification for civic Assembly reflections', async () => {
      await useAuthStore.getState().switchPersona('user_aarav');
      const initialCredits = (await demoRepository.getCurrentUser()).totalCredits;

      const civicRefl = await demoRepository.addReflection({
        userId: 'user_aarav',
        contextType: 'assembly',
        contextId: 'assembly_jaipur_pedestrian_2026',
        prompt: 'What did you learn from deliberating on pedestrian speed tables?',
        text: 'Active listening helped resolve safety concerns regarding ambulance passage.',
        valuesHighlighted: ['Constructive Dialogue', 'Empathy'],
        isPublicInPassport: true,
      });

      expect(civicRefl.id).toBeDefined();
      expect(civicRefl.isPublicInPassport).toBe(true);

      // Awards +5 Reflection Credits
      const creditsAfter = (await demoRepository.getCurrentUser()).totalCredits;
      expect(creditsAfter).toBe(initialCredits + 5);

      // Passport entry created and verified
      const passport = await demoRepository.getPassport('user_aarav');
      const passEntry = passport.entries.find((p) => p.sourceReferenceId === civicRefl.id);
      expect(passEntry).toBeDefined();
      expect(passEntry?.creditsAwarded).toBe(5);
      expect(passEntry?.isVerified).toBe(true);

      // Activity logged
      const activities = await demoRepository.getActivities('user_aarav');
      expect(activities.find((a) => a.referenceId === civicRefl.id)).toBeDefined();

      // Notifications received
      const notifs = await demoRepository.getNotifications('user_aarav');
      expect(notifs.find((n) => n.title === 'Reflection Recorded')).toBeDefined();
    });
  });
});
