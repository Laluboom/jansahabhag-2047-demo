import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { useAuthStore } from '../src/stores/authStore';
import { SubmitAssignmentPage } from '../src/features/assignments/SubmitAssignmentPage';

describe('Package 03: Assignment, Observation & Evidence Lifecycle', () => {
  beforeEach(async () => {
    // Reset database to canonical initial seed state for each test
    PersistenceService.resetDatabase();
    await demoRepository.switchUser('user_aarav');
  });

  describe('1. Autosave, Draft Boundaries & Reload Recovery', () => {
    it('autosaves non-empty response and selected evidence without fabricated filler text', async () => {
      const draftContent = 'Fieldwork notes on school crossing congestion along Madhyam Marg.';
      const draft = await demoRepository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: draftContent,
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      expect(draft.status).toBe('draft');
      expect(draft.content).toBe(draftContent);
      expect(draft.evidenceIds).toEqual(['ev_aarav_traffic_count_01']);
      // No filler text
      expect(draft.content).not.toContain('Lorem ipsum');
    });

    it('resumes the same participant draft after simulated reload', async () => {
      const draftContent = 'Persisted draft notes across reload.';
      const draft = await demoRepository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: draftContent,
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      // Simulate browser reload by reading afresh from repository using submission ID
      const resumedSub = await demoRepository.getSubmission(draft.id);
      expect(resumedSub).toBeDefined();
      expect(resumedSub?.status).toBe('draft');
      expect(resumedSub?.content).toBe(draftContent);
      expect(resumedSub?.evidenceIds).toEqual(['ev_aarav_traffic_count_01']);
    });

    it('persona switching does not expose another participant draft', async () => {
      const draft = await demoRepository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Aarav private draft.',
      });

      // Switch to Priya
      await demoRepository.switchUser('user_priya');
      const priyaSubs = await demoRepository.getSubmissions('user_priya', 'asg_obs_03');
      expect(priyaSubs.length).toBe(0);

      // Priya cannot query Aarav draft by ID
      const crossSub = await demoRepository.getSubmission(draft.id);
      expect(crossSub).toBeNull();
    });

    it('does not overwrite submitted or verified submission through stale autosave', async () => {
      // Submit assignment
      await demoRepository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Original submitted fieldwork content.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      // Attempt to save draft over submitted item should throw
      await expect(
        demoRepository.saveAssignmentDraft({
          assignmentId: 'asg_obs_03',
          userId: 'user_aarav',
          content: 'Stale draft attempting to overwrite submitted work.',
        })
      ).rejects.toThrow(/Cannot modify submission with status 'submitted'/i);

      // Teacher verifies
      await demoRepository.switchUser('user_kavita');
      const sub = (await demoRepository.getSubmissions('user_aarav', 'asg_obs_03'))[0];
      await demoRepository.reviewSubmission({
        submissionId: sub.id,
        reviewerId: 'user_kavita',
        status: 'verified',
        teacherFeedback: 'Verified fieldwork.',
      });

      // Attempt to save draft over verified item should throw
      await demoRepository.switchUser('user_aarav');
      await expect(
        demoRepository.saveAssignmentDraft({
          assignmentId: 'asg_obs_03',
          userId: 'user_aarav',
          content: 'Stale draft attempting to overwrite verified work.',
        })
      ).rejects.toThrow(/Cannot modify submission with status 'verified'/i);
    });
  });

  describe('2. Local File Retrieval, Honest Metadata & Cross-Persona Privacy', () => {
    it('persists and retrieves user-selected file with dataUrl across reload', async () => {
      const fileData = 'data:text/csv;base64,VGltZSxDb3VudAowODowMCwxNQowODoxNSwyNQo=';
      const createdEvidence = await demoRepository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'observation',
        title: 'Uploaded School Crossing Tally',
        description: 'Field count of student crossing times.',
        source: 'Handheld Clicker Audit',
        location: 'Madhyam Marg Gate 2',
        visibility: 'assembly',
        verificationStatus: 'under_review',
        tags: ['Crossing', 'Tally'],
        fileInfo: {
          name: 'crossing_clicker_audit.csv',
          size: 1024,
          type: 'text/csv',
          dataUrl: fileData,
          demoLabel: 'Local browser file (DEMO)',
        },
      });

      expect(createdEvidence.fileInfo?.dataUrl).toBe(fileData);

      // Simulate page reload by querying repository
      const reloaded = await demoRepository.getEvidence(createdEvidence.id);
      expect(reloaded).toBeDefined();
      expect(reloaded?.fileInfo?.name).toBe('crossing_clicker_audit.csv');
      expect(reloaded?.fileInfo?.dataUrl).toBe(fileData);
    });

    it('seeded evidence has honest illustrative label without claiming stored bytes', async () => {
      const seeded = await demoRepository.getEvidence('ev_aarav_traffic_count_01');
      expect(seeded).toBeDefined();
      expect(seeded?.fileInfo?.name).toBe('madhyam_marg_peak_traffic_tally.csv');
      expect(seeded?.fileInfo?.dataUrl).toBeUndefined();
      expect(seeded?.fileInfo?.demoLabel).toContain('Illustrative metadata only');
    });

    it('protects private evidence and strips dataUrls across participant personas', async () => {
      const fileData = 'data:text/plain;base64,U2VjcmV0IHJhd24gZGF0YQ==';
      const privateEv = await demoRepository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'document',
        title: 'Private Field Observations',
        description: 'Sensitive field notes.',
        source: 'Personal Log',
        visibility: 'private',
        verificationStatus: 'unverified',
        tags: ['Private'],
        fileInfo: {
          name: 'private_aarav_notes.txt',
          size: 512,
          type: 'text/plain',
          dataUrl: fileData,
        },
      });

      const publicEv = await demoRepository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'observation',
        title: 'Public Field Summary',
        description: 'Public summary notes.',
        source: 'Field Survey',
        visibility: 'public',
        verificationStatus: 'under_review',
        tags: ['Public'],
        fileInfo: {
          name: 'public_summary.txt',
          size: 512,
          type: 'text/plain',
          dataUrl: fileData,
        },
      });

      // Switch to Priya
      await demoRepository.switchUser('user_priya');

      // 1. Private evidence owned by Aarav returns null for Priya
      const priyaReadPrivate = await demoRepository.getEvidence(privateEv.id);
      expect(priyaReadPrivate).toBeNull();

      // 2. Public evidence owned by Aarav is readable, but raw dataUrl is stripped
      const priyaReadPublic = await demoRepository.getEvidence(publicEv.id);
      expect(priyaReadPublic).toBeDefined();
      expect(priyaReadPublic?.fileInfo?.name).toBe('public_summary.txt');
      expect(priyaReadPublic?.fileInfo?.dataUrl).toBeUndefined();

      // 3. getEvidenceList for Priya excludes Aarav private evidence and strips dataUrls
      const priyaList = await demoRepository.getEvidenceList();
      expect(priyaList.some((e) => e.id === privateEv.id)).toBe(false);
      const publicInList = priyaList.find((e) => e.id === publicEv.id);
      expect(publicInList?.fileInfo?.dataUrl).toBeUndefined();
    });
  });

  describe('3. Receipt Persistence & Submission ID Invariants', () => {
    it('generates a stable receipt ID, timestamp, and status on submission', async () => {
      const submitted = await demoRepository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Detailed school-zone observation finding.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      expect(submitted.id).toBeDefined();
      expect(submitted.receiptId).toBe(submitted.id);
      expect(submitted.status).toBe('submitted');
      expect(submitted.submittedAt).toBeDefined();

      // Persists across reload
      const retrieved = await demoRepository.getSubmission(submitted.id);
      expect(retrieved?.receiptId).toBe(submitted.id);
      expect(retrieved?.submittedAt).toBe(submitted.submittedAt);
      expect(retrieved?.status).toBe('submitted');
      expect(retrieved?.evidenceIds).toEqual(['ev_aarav_traffic_count_01']);
    });

    it('idempotent retry with same payload preserves existing submission and receipt', async () => {
      const first = await demoRepository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Initial submission content.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      const second = await demoRepository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Initial submission content.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      expect(second.id).toBe(first.id);
      expect(second.receiptId).toBe(first.receiptId);
      expect(second.submittedAt).toBe(first.submittedAt);
    });
  });

  describe('4. Direct-Method Security & Unauthorized Call Rejection', () => {
    it('normalizes forged verificationStatus on participant addEvidence call', async () => {
      // Participant attempts to directly mint verified evidence
      const forged = await demoRepository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'interview',
        title: 'Forged Verification Evidence',
        description: 'Attempting to self-verify evidence.',
        source: 'Self Survey',
        visibility: 'assembly',
        verificationStatus: 'verified',
        tags: ['Test'],
      });

      // Must be normalized to under_review
      expect(forged.verificationStatus).toBe('under_review');
    });

    it('normalizes teacher addEvidence call with verified status to under_review', async () => {
      await demoRepository.switchUser('user_kavita');
      const teacherEv = await demoRepository.addEvidence({
        ownerId: 'user_kavita',
        ownerName: 'Kavita Rao',
        type: 'observation',
        title: 'Teacher Demonstration Walk',
        description: 'Demonstration observations.',
        source: 'Classroom Fieldwork',
        visibility: 'assembly',
        verificationStatus: 'verified',
        tags: ['Mentor'],
      });
      // Verification must go through reviewSubmission, not self-minted on addEvidence
      expect(teacherEv.verificationStatus).toBe('under_review');
    });

    it('rejects addEvidence when file size exceeds conservative 250 KB limit', async () => {
      await expect(
        demoRepository.addEvidence({
          ownerId: 'user_aarav',
          ownerName: 'Aarav Sharma',
          type: 'document',
          title: 'Oversized Observation Document',
          description: 'Document exceeding browser quota durability.',
          source: 'Field Audit',
          visibility: 'assembly',
          verificationStatus: 'under_review',
          tags: ['Oversized'],
          fileInfo: {
            name: 'large_recording.pdf',
            size: 300 * 1024,
            type: 'application/pdf',
          },
        })
      ).rejects.toThrow(/exceeds durable browser storage limit of 250 KB/i);
    });

    it('rejects addEvidence direct call for another persona', async () => {
      await expect(
        demoRepository.addEvidence({
          ownerId: 'user_priya', // active is user_aarav
          ownerName: 'Priya Sharma',
          type: 'survey',
          title: 'Cross Persona Evidence',
          description: 'Illegal creation.',
          source: 'Field Survey',
          visibility: 'assembly',
          verificationStatus: 'under_review',
          tags: ['Test'],
        })
      ).rejects.toThrow(/cannot create evidence for another participant/i);
    });

    it('rejects submitAssignment for another persona or with unowned evidence', async () => {
      // 1. Cross persona submit
      await expect(
        demoRepository.submitAssignment({
          assignmentId: 'asg_obs_03',
          userId: 'user_priya', // active is user_aarav
          content: 'Aarav impersonating Priya',
          evidenceIds: ['ev_priya_count_01'],
        })
      ).rejects.toThrow(/cannot submit assignment for another persona/i);

      // 2. Attaching evidence owned by Priya while active as Aarav
      await expect(
        demoRepository.submitAssignment({
          assignmentId: 'asg_obs_03',
          userId: 'user_aarav',
          content: 'Attaching another person evidence',
          evidenceIds: ['ev_priya_count_01'],
        })
      ).rejects.toThrow(/cannot attach evidence owned by another participant/i);
    });

    it('rejects non-teacher reviewSubmission direct call', async () => {
      // Submit assignment as Aarav
      const sub = await demoRepository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Aarav submission',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      // Aarav (participant) attempts to directly review own or other submission
      await expect(
        demoRepository.reviewSubmission({
          submissionId: sub.id,
          reviewerId: 'user_aarav',
          status: 'verified',
          teacherFeedback: 'Self-approval attempt',
        })
      ).rejects.toThrow(/only teachers may review submissions/i);
    });

    it('rejects teacher self-review direct call', async () => {
      // Switch to teacher Kavita
      await demoRepository.switchUser('user_kavita');

      // Create a submission authored by teacher Kavita
      // Note: add teacher evidence first
      const teacherEv = await demoRepository.addEvidence({
        ownerId: 'user_kavita',
        ownerName: 'Kavita Iyer',
        type: 'observation',
        title: 'Teacher Demonstration Walk',
        description: 'Field walk demonstration notes.',
        source: 'Mentor Demonstration',
        visibility: 'assembly',
        verificationStatus: 'under_review',
        tags: ['Teacher'],
      });

      const teacherSub = await demoRepository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_kavita',
        content: 'Teacher submission content.',
        evidenceIds: [teacherEv.id],
      });

      // Kavita attempts to review her own submission
      await expect(
        demoRepository.reviewSubmission({
          submissionId: teacherSub.id,
          reviewerId: 'user_kavita',
          status: 'verified',
          teacherFeedback: 'Self review attempt',
        })
      ).rejects.toThrow(/teachers cannot review their own submissions/i);
    });

    it('rejects teacher review of draft submission', async () => {
      const draft = await demoRepository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'In-progress draft.',
      });

      await demoRepository.switchUser('user_kavita');
      await expect(
        demoRepository.reviewSubmission({
          submissionId: draft.id,
          reviewerId: 'user_kavita',
          status: 'verified',
          teacherFeedback: 'Reviewing a draft',
        })
      ).rejects.toThrow(/cannot review a draft submission/i);
    });
  });

  describe('5. Truthful Credit Lifecycle (No Early Verified Credit) & Review Flow', () => {
    it('does not mint verified credit on submission; awards verified credits only upon mentor review', async () => {
      const initialUser = await demoRepository.getUser('user_aarav');
      const initialTotal = initialUser?.totalCredits || 0;

      // Create new evidence
      const newEv = await demoRepository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'observation',
        title: 'School Gate Crossing Fieldwork',
        description: 'Morning observation of student arrival safety.',
        source: 'Field Log',
        visibility: 'assembly',
        verificationStatus: 'under_review',
        tags: ['Safety'],
      });

      // Submit assignment
      const submitted = await demoRepository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Completed school zone observation.',
        evidenceIds: [newEv.id],
      });

      // 1. Transaction exists with status Pending
      const credits = await demoRepository.getCredits('user_aarav');
      const pendingCredit = credits.find((c) => c.sourceType === 'assignment' && c.sourceId === 'asg_obs_03');
      expect(pendingCredit).toBeDefined();
      expect(pendingCredit?.status).toBe('Pending');
      expect(pendingCredit?.reason).toContain('pending mentor review');

      // 2. User totalCredits and Passport totalCredits do NOT prematurely increase
      const userAfterSubmit = await demoRepository.getUser('user_aarav');
      expect(userAfterSubmit?.totalCredits).toBe(initialTotal);

      const passportAfterSubmit = await demoRepository.getPassport('user_aarav');
      expect(passportAfterSubmit.totalCredits).toBe(initialTotal);
      expect(passportAfterSubmit.pendingCredits).toBe(10);

      // 3. Teacher Kavita verifies submission
      await demoRepository.switchUser('user_kavita');
      const verified = await demoRepository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'user_kavita',
        status: 'verified',
        score: 25,
        teacherFeedback: 'Verified: excellent safety fieldwork methodology.',
      });

      expect(verified.status).toBe('verified');

      // 4. Submission credit transitions to Verified, +5 Observation credit awarded
      const creditsAfterReview = await demoRepository.getCredits('user_aarav');
      const reviewedSubCredit = creditsAfterReview.find(
        (c) => c.sourceType === 'assignment' && c.sourceId === 'asg_obs_03'
      );
      expect(reviewedSubCredit?.status).toBe('Verified');

      const obsCredit = creditsAfterReview.find(
        (c) => c.sourceType === 'evidence' && c.sourceId === newEv.id
      );
      expect(obsCredit).toBeDefined();
      expect(obsCredit?.status).toBe('Verified');
      expect(obsCredit?.amount).toBe(5);

      // 5. User totalCredits and Passport totalCredits now reflect +15 (10 submission + 5 observation)
      const userAfterReview = await demoRepository.getUser('user_aarav');
      expect(userAfterReview?.totalCredits).toBe(initialTotal + 15);

      const passportAfterReview = await demoRepository.getPassport('user_aarav');
      expect(passportAfterReview.totalCredits).toBe(initialTotal + 15);
      expect(passportAfterReview.pendingCredits).toBe(0);

      // 6. Idempotent retry: duplicate review does not award extra credits
      const duplicateReview = await demoRepository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'user_kavita',
        status: 'verified',
        score: 25,
        teacherFeedback: 'Duplicate review check.',
      });
      expect(duplicateReview.status).toBe('verified');

      const userAfterDuplicate = await demoRepository.getUser('user_aarav');
      expect(userAfterDuplicate?.totalCredits).toBe(initialTotal + 15);
    });

    it('revision requested returns actionable feedback and permits edit/resubmit path', async () => {
      // 1. Submit
      const submitted = await demoRepository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Brief notes with insufficient details.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      // 2. Teacher requests revision
      await demoRepository.switchUser('user_kavita');
      const revision = await demoRepository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'user_kavita',
        status: 'revision_requested',
        teacherFeedback: 'Please add pedestrian delay timings and vehicle classifications.',
      });

      expect(revision.status).toBe('revision_requested');
      expect(revision.teacherFeedback).toContain('pedestrian delay timings');

      // 3. Participant edits and resubmits
      await demoRepository.switchUser('user_aarav');
      const resubmitted = await demoRepository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Revised notes including 5-minute pedestrian delay timings and 15 heavy commercial trucks classified.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      expect(resubmitted.status).toBe('submitted');
      expect(resubmitted.content).toContain('15 heavy commercial trucks');

      // 4. Teacher accepts revised submission
      await demoRepository.switchUser('user_kavita');
      const finalVerified = await demoRepository.reviewSubmission({
        submissionId: submitted.id,
        reviewerId: 'user_kavita',
        status: 'verified',
        score: 25,
        teacherFeedback: 'Revisions accepted. Well documented.',
      });

      expect(finalVerified.status).toBe('verified');
    });
  });

  describe('7. Storage Quota & Storage Failure Resilience', () => {
    it('fails visibly on localStorage quota error and leaves prior durable data intact', async () => {
      // 1. Establish prior durable draft on asg_obs_03
      const priorDraft = await demoRepository.saveAssignmentDraft({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Original durable draft before quota error.',
      });

      // 2. Mock Storage.prototype.setItem to simulate QuotaExceededError
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string) => {
        if (key === '__storage_test__') return;
        const error = new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        throw error;
      });

      try {
        // Attempting to update draft fails with descriptive quota error
        await expect(
          demoRepository.saveAssignmentDraft({
            assignmentId: 'asg_obs_03',
            userId: 'user_aarav',
            content: 'Draft update that should fail on quota.',
          })
        ).rejects.toThrow(/quota exceeded or storage disabled/i);

        // Attempting to add evidence with file data fails with descriptive error
        await expect(
          demoRepository.addEvidence({
            ownerId: 'user_aarav',
            ownerName: 'Aarav Sharma',
            type: 'observation',
            title: 'Failing Evidence on Quota',
            description: 'Should not persist.',
            source: 'Field Log',
            visibility: 'assembly',
            verificationStatus: 'under_review',
            tags: ['QuotaTest'],
            fileInfo: {
              name: 'failing_file.csv',
              size: 2048,
              type: 'text/csv',
              dataUrl: 'data:text/csv;base64,VGltZSxWYWx1ZQo=',
            },
          })
        ).rejects.toThrow(/quota exceeded or storage disabled/i);
      } finally {
        setItemSpy.mockRestore();
      }

      // 3. Verify prior durable draft was NOT corrupted or overwritten
      const checkDraft = await demoRepository.getSubmission(priorDraft.id);
      expect(checkDraft).toBeDefined();
      expect(checkDraft?.content).toBe('Original durable draft before quota error.');
      expect(checkDraft?.status).toBe('draft');
    });

    it('renders actionable error in SubmitAssignmentPage when save/storage fails', async () => {
      await useAuthStore.getState().initialize();

      // Mock saveAssignmentDraft to throw storage failure
      const originalSaveDraft = demoRepository.saveAssignmentDraft;
      demoRepository.saveAssignmentDraft = async () => {
        throw new Error('Browser storage write failed: localStorage quota exceeded or storage disabled.');
      };

      try {
        render(
          <MemoryRouter initialEntries={['/assignments/asg_obs_03/submit']}>
            <Routes>
              <Route path="/assignments/:id/submit" element={<SubmitAssignmentPage />} />
            </Routes>
          </MemoryRouter>
        );

        await waitFor(() => {
          expect(screen.getByRole('heading', { name: /Pedestrian Flow Interview with 5 Peers/i })).toBeInTheDocument();
        });

        // Click Save Draft button
        const saveDraftBtn = screen.getByRole('button', { name: /Save as Draft/i });
        saveDraftBtn.click();

        // Actionable error banner must be rendered visibly on screen
        await waitFor(() => {
          expect(screen.getByRole('alert')).toBeInTheDocument();
          expect(screen.getByText(/Browser storage write failed: localStorage quota exceeded/i)).toBeInTheDocument();
        });
      } finally {
        demoRepository.saveAssignmentDraft = originalSaveDraft;
      }
    });
  });
});
