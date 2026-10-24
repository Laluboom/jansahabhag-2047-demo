import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { EvidenceAttachmentStore } from '../src/services/evidenceAttachmentStore';
import { useAuthStore } from '../src/stores/authStore';
import {
  MAX_BINARY_ATTACHMENT_BYTES,
  BINARY_ATTACHMENT_SIZE_LABEL,
  ALLOWED_BINARY_FORMAT_LABELS,
  validateEvidenceAttachmentFile,
} from '../src/domain/evidenceRules';
import { SubmitAssignmentPage } from '../src/features/assignments/SubmitAssignmentPage';
import { AssignmentsPage } from '../src/features/assignments/AssignmentsPage';

describe('Change Plan v2 #10 / Review Additions #3: IndexedDB Evidence Attachment & Cohort Verification', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await EvidenceAttachmentStore.clearAll();
    EvidenceAttachmentStore.setSimulateQuotaFailure(false);
    EvidenceAttachmentStore.setSimulateTransactionFailure(false);
    EvidenceAttachmentStore.setSimulateOpenFailure(false);
    await demoRepository.switchUser('user_aarav');
    await useAuthStore.getState().initialize();
  });

  describe('1. File Type and Size Validation', () => {
    it('validates accepted MIME types: JPEG, PNG, MP4, MP3, and PDF', () => {
      const allowedSamples = [
        { name: 'photo.jpg', size: 1024, type: 'image/jpeg' },
        { name: 'photo.jpeg', size: 1024, type: 'image/jpeg' },
        { name: 'diagram.png', size: 2048, type: 'image/png' },
        { name: 'clip.mp4', size: 5 * 1024 * 1024, type: 'video/mp4' },
        { name: 'interview.mp3', size: 3 * 1024 * 1024, type: 'audio/mpeg' },
        { name: 'report.pdf', size: 4 * 1024 * 1024, type: 'application/pdf' },
      ];

      for (const sample of allowedSamples) {
        const result = validateEvidenceAttachmentFile(sample);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });

    it('rejects unsupported file formats with clear error message', () => {
      const rejectedSamples = [
        { name: 'malicious.exe', size: 1024, type: 'application/x-msdownload' },
        { name: 'archive.zip', size: 1024, type: 'application/zip' },
        { name: 'script.js', size: 1024, type: 'application/javascript' },
        { name: 'page.html', size: 1024, type: 'text/html' },
      ];

      for (const sample of rejectedSamples) {
        const result = validateEvidenceAttachmentFile(sample);
        expect(result.valid).toBe(false);
        expect(result.error).toMatch(/Unsupported file type/i);
        expect(result.error).toContain(ALLOWED_BINARY_FORMAT_LABELS);
      }
    });

    it(`enforces reliable demo binary limit of ${BINARY_ATTACHMENT_SIZE_LABEL} (10 MB)`, async () => {
      const overLimitFile = {
        name: 'huge_video.mp4',
        size: MAX_BINARY_ATTACHMENT_BYTES + 1024,
        type: 'video/mp4',
      };

      const result = validateEvidenceAttachmentFile(overLimitFile);
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/exceeds browser-local demo attachment limit of 10 MB/i);

      // In store directly
      const mockBlob = new Blob(['x'], { type: 'video/mp4' });
      await expect(
        EvidenceAttachmentStore.saveAttachment('test_overlimit', mockBlob, {
          fileName: 'huge_video.mp4',
          mimeType: 'video/mp4',
          fileSize: MAX_BINARY_ATTACHMENT_BYTES + 1024,
        })
      ).rejects.toThrow(/exceeds browser-local demo limit of 10 MB/i);

      // In repository
      await expect(
        demoRepository.addEvidence({
          ownerId: 'user_aarav',
          ownerName: 'Aarav Sharma',
          type: 'image',
          title: 'Oversized Binary Evidence',
          description: 'Testing 10MB limit enforcement.',
          source: 'Camera',
          visibility: 'private',
          verificationStatus: 'under_review',
          tags: ['LimitTest'],
          fileInfo: {
            name: 'huge_video.mp4',
            size: MAX_BINARY_ATTACHMENT_BYTES + 1024,
            type: 'video/mp4',
            blobKey: 'blob_test_overlimit',
            storageType: 'indexeddb',
          },
        })
      ).rejects.toThrow(/exceeds single-browser demo attachment limit of 10 MB/i);
    });

    it('distinguishes between legacy localStorage DataURL (250 KB) and IndexedDB binary store (10 MB)', async () => {
      // 1. Without blobKey (inline legacy): 300 KB is rejected at 250 KB
      await expect(
        demoRepository.addEvidence({
          ownerId: 'user_aarav',
          ownerName: 'Aarav Sharma',
          type: 'document',
          title: '300KB Inline Evidence',
          description: 'Legacy inline dataUrl limit test.',
          source: 'Scanner',
          visibility: 'private',
          verificationStatus: 'under_review',
          tags: ['Legacy'],
          fileInfo: {
            name: 'doc.pdf',
            size: 300 * 1024,
            type: 'application/pdf',
          },
        })
      ).rejects.toThrow(/exceeds durable browser storage limit of 250 KB/i);

      // 2. With blobKey / storageType: 'indexeddb': 2.4 MB is successfully accepted
      const accepted = await demoRepository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'image',
        title: '2.4MB IndexedDB Binary Evidence',
        description: 'Binary store test.',
        source: 'Camera',
        visibility: 'private',
        verificationStatus: 'under_review',
        tags: ['IndexedDB'],
        fileInfo: {
          name: 'field_photo.png',
          size: 2400 * 1024,
          type: 'image/png',
          blobKey: 'blob_field_photo_01',
          storageType: 'indexeddb',
        },
      });

      expect(accepted.id).toBeDefined();
      expect(accepted.fileInfo?.blobKey).toBe('blob_field_photo_01');
      expect(accepted.fileInfo?.storageType).toBe('indexeddb');
      // Huge dataUrl is avoided in localStorage
      expect(accepted.fileInfo?.dataUrl).toBeUndefined();
    });
  });

  describe('2. Reload Persistence, Stable Blob Key & No Huge DataURLs in LocalStorage', () => {
    it('persists binary attachment in IndexedDB with stable blob key and retrieves identical blob across simulated reload', async () => {
      const blobKey = 'blob_cleanup_test_01';
      const fileBytes = new TextEncoder().encode('BINARY_CLEANUP_PHOTO_CONTENT_SIMULATION');
      const blob = new Blob([fileBytes], { type: 'image/png' });

      // Save binary blob to attachment store
      await EvidenceAttachmentStore.saveAttachment(blobKey, blob, {
        fileName: 'local_cleanup.png',
        mimeType: 'image/png',
        fileSize: blob.size,
      });

      // Save evidence metadata to repository
      const ev = await demoRepository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'image',
        title: 'Community Cleanup Field Photo',
        description: 'Photo of youth cleanup along Mansarovar drain.',
        source: 'Field Camera',
        visibility: 'private',
        verificationStatus: 'under_review',
        tags: ['Cleanup'],
        fileInfo: {
          name: 'local_cleanup.png',
          size: blob.size,
          type: 'image/png',
          blobKey,
          storageType: 'indexeddb',
          dataUrl: 'data:image/png;base64,SHOULD_BE_STRIPPED_FROM_LOCALSTORAGE',
        },
      });

      // 1. In repository record, large dataUrl is stripped to avoid blowing up localStorage
      expect(ev.fileInfo?.dataUrl).toBeUndefined();
      expect(ev.fileInfo?.blobKey).toBe(blobKey);

      // 2. Crucial: Clear in-memory mirror cache to simulate a fresh tab/reload.
      // Verifies data is genuinely read from IndexedDB, NOT in-memory Map!
      expect(EvidenceAttachmentStore.getMemoryCacheSize()).toBeGreaterThan(0);
      EvidenceAttachmentStore.clearMemoryCacheOnly();
      expect(EvidenceAttachmentStore.getMemoryCacheSize()).toBe(0);

      // 3. Simulate browser reload by reading afresh from repository and attachment store
      const reloadedEv = await demoRepository.getEvidence(ev.id);
      expect(reloadedEv).not.toBeNull();
      expect(reloadedEv?.fileInfo?.blobKey).toBe(blobKey);
      expect(reloadedEv?.fileInfo?.dataUrl).toBeUndefined();

      const attachment = await demoRepository.getEvidenceAttachment(ev.id);
      expect(attachment).not.toBeNull();
      expect(attachment?.fileName).toBe('local_cleanup.png');
      expect(attachment?.mimeType).toBe('image/png');
      expect(attachment?.blob).toBeDefined();
      expect(attachment?.blob.size).toBe(blob.size);
    });

    it('retrieves binary attachment directly from IndexedDB when store instance / connection is recreated', async () => {
      const blobKey = 'blob_recreate_test_01';
      const fileBytes = new TextEncoder().encode('RECREATE_STORE_TEST_BINARY_DATA');
      const blob = new Blob([fileBytes], { type: 'application/pdf' });

      await EvidenceAttachmentStore.saveAttachment(blobKey, blob, {
        fileName: 'study_protocol.pdf',
        mimeType: 'application/pdf',
        fileSize: blob.size,
      });

      // Recreate store connection and wipe in-memory cache
      EvidenceAttachmentStore.clearMemoryCacheOnly();
      EvidenceAttachmentStore.resetDbConnection();
      expect(EvidenceAttachmentStore.getMemoryCacheSize()).toBe(0);

      // Retrieve directly from newly opened IndexedDB connection
      const retrieved = await EvidenceAttachmentStore.getAttachment(blobKey);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.blobKey).toBe(blobKey);
      expect(retrieved?.fileName).toBe('study_protocol.pdf');
      expect(retrieved?.blob.size).toBe(blob.size);
    });
  });

  describe('3. Denied Access Boundaries & Media Protection', () => {
    it('denies peer participant and unassigned staff from accessing or downloading private binary attachments', async () => {
      const blobKey = 'blob_aarav_private_01';
      const blob = new Blob(['Aarav Secret Data'], { type: 'application/pdf' });
      await EvidenceAttachmentStore.saveAttachment(blobKey, blob, {
        fileName: 'aarav_private_survey.pdf',
        mimeType: 'application/pdf',
        fileSize: blob.size,
      });

      const privateEv = await demoRepository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'document',
        title: 'Confidential Pedestrian Survey',
        description: 'Survey with resident notes.',
        source: 'Handwritten Log',
        visibility: 'private',
        verificationStatus: 'under_review',
        tags: ['Private'],
        fileInfo: {
          name: 'aarav_private_survey.pdf',
          size: blob.size,
          type: 'application/pdf',
          blobKey,
          storageType: 'indexeddb',
        },
      });

      // 1. Owner (Aarav) CAN access attachment
      await demoRepository.switchUser('user_aarav');
      const aaravAttachment = await demoRepository.getEvidenceAttachment(privateEv.id);
      expect(aaravAttachment).not.toBeNull();
      expect(aaravAttachment?.blobKey).toBe(blobKey);

      // 2. Peer participant (Priya) is DENIED access: getEvidence returns null
      await demoRepository.switchUser('user_priya');
      const priyaRead = await demoRepository.getEvidence(privateEv.id);
      expect(priyaRead).toBeNull();

      // getEvidenceAttachment throws unauthorized
      await expect(
        demoRepository.getEvidenceAttachment(privateEv.id)
      ).rejects.toThrow(/Unauthorized: You do not have permission to access or download this evidence attachment/i);

      // 3. Unassigned teacher (Kavita) before assignment is DENIED access
      await demoRepository.switchUser('user_kavita');
      expect(await demoRepository.getEvidence(privateEv.id)).toBeNull();
      await expect(
        demoRepository.getEvidenceAttachment(privateEv.id)
      ).rejects.toThrow(/Unauthorized: You do not have permission to access or download this evidence attachment/i);

      // 4. Platform Admin (user_admin) CAN access
      await demoRepository.switchUser('user_admin');
      const adminAttachment = await demoRepository.getEvidenceAttachment(privateEv.id);
      expect(adminAttachment).not.toBeNull();

      // 5. Programme Manager (user_dev) CAN access
      await demoRepository.switchUser('user_dev');
      const devAttachment = await demoRepository.getEvidenceAttachment(privateEv.id);
      expect(devAttachment).not.toBeNull();
    });

    it('does not expose raw private media or blob keys to other personas when verified evidence links to Passport', async () => {
      const blobKey = 'blob_verified_media_01';
      const blob = new Blob(['Private photo bytes'], { type: 'image/png' });
      await EvidenceAttachmentStore.saveAttachment(blobKey, blob, {
        fileName: 'verified_photo.png',
        mimeType: 'image/png',
        fileSize: blob.size,
      });

      // Add evidence and verify it
      const ev = await demoRepository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'image',
        title: 'Verified Crossroad Observation',
        description: 'Photo of zebra crossing.',
        source: 'Camera',
        visibility: 'private',
        verificationStatus: 'under_review',
        tags: ['Verified'],
        fileInfo: {
          name: 'verified_photo.png',
          size: blob.size,
          type: 'image/png',
          blobKey,
          storageType: 'indexeddb',
        },
      });

      // Teacher verifies evidence
      await demoRepository.switchUser('user_kavita');
      await demoRepository.reviewEvidence({
        evidenceId: ev.id,
        reviewerId: 'user_kavita',
        status: 'verified',
        comment: 'Verified fieldwork.',
      });

      // Aarav (owner) viewing his own passport sees verified evidence with blobKey
      await demoRepository.switchUser('user_aarav');
      const aaravPassport = await demoRepository.getPassport('user_aarav');
      const aaravVerifiedEv = aaravPassport.verifiedEvidence.find((e) => e.id === ev.id);
      expect(aaravVerifiedEv).toBeDefined();
      expect(aaravVerifiedEv?.fileInfo?.blobKey).toBe(blobKey);

      // Dev (programme_manager) viewing Aarav's passport has staff admin access and sees blobKey
      await demoRepository.switchUser('user_dev');
      const devPassport = await demoRepository.getPassport('user_aarav');
      const devVerifiedEv = devPassport.verifiedEvidence.find((e) => e.id === ev.id);
      expect(devVerifiedEv).toBeDefined();
      expect(devVerifiedEv?.fileInfo?.blobKey).toBe(blobKey);

      // Unassigned teacher Kavita viewing Aarav's passport does NOT receive raw private blobKey
      await demoRepository.switchUser('user_kavita');
      const kavitaPassport = await demoRepository.getPassport('user_aarav');
      const kavitaVerifiedEv = kavitaPassport.verifiedEvidence.find((e) => e.id === ev.id);
      expect(kavitaVerifiedEv).toBeDefined();
      expect(kavitaVerifiedEv?.fileInfo?.blobKey).toBeUndefined();

      // Peer participant Priya is blocked from accessing another persona's private passport
      await demoRepository.switchUser('user_priya');
      await expect(demoRepository.getPassport('user_aarav')).rejects.toThrow(
        /Unauthorized: cannot access Civic Passport of another persona/i
      );
    });
  });

  describe('4. Storage & Transaction Failure Resilience (Quota, Abort, Open Failure)', () => {
    it('handles IndexedDB quota error visibly and preserves prior storage state', async () => {
      // 1. Establish prior evidence
      const priorEv = await demoRepository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'observation',
        title: 'Prior Durable Evidence',
        description: 'Durable record before quota test.',
        source: 'Log',
        visibility: 'private',
        verificationStatus: 'under_review',
        tags: ['Prior'],
      });

      // 2. Simulate quota failure in attachment store
      EvidenceAttachmentStore.setSimulateQuotaFailure(true);

      const failingBlob = new Blob(['Sample bytes'], { type: 'application/pdf' });
      await expect(
        EvidenceAttachmentStore.saveAttachment('failing_blob_01', failingBlob, {
          fileName: 'failing_file.pdf',
          mimeType: 'application/pdf',
        })
      ).rejects.toThrow(/IndexedDB quota exceeded/i);

      // 3. Prior evidence record in repository is intact
      const checkPrior = await demoRepository.getEvidence(priorEv.id);
      expect(checkPrior).not.toBeNull();
      expect(checkPrior?.title).toBe('Prior Durable Evidence');
    });

    it('rejects on non-quota transaction abort/failure, ensures NO metadata is saved in repository, and shows visible error in UI', async () => {
      await useAuthStore.getState().switchPersona('user_aarav');

      const initialEvs = await demoRepository.getEvidenceList({ ownerId: 'user_aarav' });
      const initialCount = initialEvs.length;

      // Enable non-quota transaction abort/failure simulation
      EvidenceAttachmentStore.setSimulateTransactionFailure(true);

      render(
        <MemoryRouter initialEntries={['/assignments/asg_obs_03/submit']}>
          <Routes>
            <Route path="/assignments/:id/submit" element={<SubmitAssignmentPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Log New Mock Evidence/i })).toBeInTheDocument();
      });

      // Open Add Evidence modal
      fireEvent.click(screen.getByRole('button', { name: /Log New Mock Evidence/i }));

      await waitFor(() => {
        expect(screen.getByTestId('btn-use-offline-cleanup-example')).toBeInTheDocument();
      });

      // Populate with offline cleanup example and set unique title
      fireEvent.click(screen.getByTestId('btn-use-offline-cleanup-example'));
      fireEvent.change(screen.getByLabelText(/Evidence Title/i), {
        target: { value: 'Unique Unsaved Transaction Abort Photo' },
      });

      // Click Save & Attach Evidence
      const saveBtn = screen.getByRole('button', { name: /Save & Attach Evidence/i });
      fireEvent.click(saveBtn);

      // 1. User sees the visible storage error banner in the modal
      await waitFor(() => {
        expect(
          screen.getByText(/Browser storage failure: IndexedDB transaction aborted/i)
        ).toBeInTheDocument();
      });

      // 2. Modal remains open and user's inputs are preserved
      expect(screen.getByRole('heading', { name: /Log Field Evidence/i })).toBeInTheDocument();
      expect(
        screen.getByDisplayValue('Unique Unsaved Transaction Abort Photo')
      ).toBeInTheDocument();

      // 3. NO evidence metadata is written to repository
      const currentEvs = await demoRepository.getEvidenceList({ ownerId: 'user_aarav' });
      expect(currentEvs.length).toBe(initialCount);
      expect(
        currentEvs.some((e) => e.title === 'Unique Unsaved Transaction Abort Photo')
      ).toBe(false);

      // 4. In-memory cache contains no entry for the aborted item
      expect(EvidenceAttachmentStore.getMemoryCacheSize()).toBe(0);

      // 5. Clear failure simulation and submit again: succeeds cleanly
      EvidenceAttachmentStore.setSimulateTransactionFailure(false);
      fireEvent.click(screen.getByRole('button', { name: /Save & Attach Evidence/i }));

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /Log Field Evidence/i })).not.toBeInTheDocument();
      });

      const updatedEvs = await demoRepository.getEvidenceList({ ownerId: 'user_aarav' });
      expect(updatedEvs.length).toBe(initialCount + 1);
    });

    it('rejects on IndexedDB open / storage disabled failure and never silently succeeds into in-memory store', async () => {
      EvidenceAttachmentStore.setSimulateOpenFailure(true);

      const blob = new Blob(['Open Failure Content'], { type: 'application/pdf' });
      await expect(
        EvidenceAttachmentStore.saveAttachment('open_fail_blob', blob, {
          fileName: 'open_fail.pdf',
          mimeType: 'application/pdf',
        })
      ).rejects.toThrow(/Browser storage failure/i);

      // Confirm in-memory cache was NOT secretly written
      expect(EvidenceAttachmentStore.getMemoryCacheSize()).toBe(0);
      expect(await EvidenceAttachmentStore.getAttachment('open_fail_blob')).toBeNull();
    });
  });

  describe('5. UHV Reflection Boundary Isolation', () => {
    it('strictly forbids attaching private UHV reflections to civic evidence or shared records', async () => {
      await expect(
        demoRepository.addEvidence({
          ownerId: 'user_aarav',
          ownerName: 'Aarav Sharma',
          type: 'document',
          title: 'Illegally Attached UHV Reflection',
          description: 'Attempting to leak reflection into civic evidence.',
          source: 'Personal Log',
          assignmentId: 'asg_uhv_08',
          visibility: 'private',
          verificationStatus: 'under_review',
          tags: ['Invalid'],
        })
      ).rejects.toThrow(/Private UHV reflections cannot be attached/i);
    });
  });

  describe('6. Teacher/Mentor Cohort Attendance Sheet & Certificate Path', () => {
    it('allows teacher to attach attendance sheet on behalf of an eligible cohort with audit record and review status', async () => {
      await demoRepository.switchUser('user_kavita');

      const blobKey = 'blob_cohort_attendance_01';
      const mockBlob = new Blob(['Signed Attendance Roster Content'], { type: 'application/pdf' });
      await EvidenceAttachmentStore.saveAttachment(blobKey, mockBlob, {
        fileName: 'ward24_signed_attendance.pdf',
        mimeType: 'application/pdf',
        fileSize: mockBlob.size,
      });

      const res = await demoRepository.attachCohortEvidence({
        mentorId: 'user_kavita',
        cohortId: 'cohort_navchetna_grade12',
        participantIds: ['user_aarav', 'user_priya'],
        documentType: 'attendance_sheet',
        title: 'Ward 24 Deliberation Workshop Attendance Sheet',
        description: 'Official countersigned in-person attendance sheet for Grade 12 cohort.',
        auditNotes: 'Collected in person and verified by Teacher Kavita Rao at Ward Community Center.',
        fileInfo: {
          name: 'ward24_signed_attendance.pdf',
          size: mockBlob.size,
          type: 'application/pdf',
          blobKey,
        },
      });

      // 1. Audit record created with mentorId, cohortId, notes, timestamp
      expect(res.auditRecord).toBeDefined();
      expect(res.auditRecord.id).toMatch(/^audit_cohort/);
      expect(res.auditRecord.mentorId).toBe('user_kavita');
      expect(res.auditRecord.cohortId).toBe('cohort_navchetna_grade12');
      expect(res.auditRecord.documentType).toBe('attendance_sheet');
      expect(res.auditRecord.participantCount).toBe(2);
      expect(res.auditRecord.auditNotes).toContain('Teacher Kavita Rao');

      // 2. Creates evidence items for each participant
      expect(res.evidenceItems.length).toBe(2);
      const aaravEv = res.evidenceItems.find((e) => e.ownerId === 'user_aarav');
      const priyaEv = res.evidenceItems.find((e) => e.ownerId === 'user_priya');
      expect(aaravEv).toBeDefined();
      expect(priyaEv).toBeDefined();

      // 3. Review status invariant: NOT automatic verification! Starts as 'under_review'
      expect(aaravEv?.verificationStatus).toBe('under_review');
      expect(aaravEv?.metadata?.reviewStatus).toBe('pending_review');
      expect(aaravEv?.visibility).toBe('private'); // Private by default to protect students

      // 4. Audit trail query
      const audits = await demoRepository.getCohortEvidenceAudits('cohort_navchetna_grade12');
      expect(audits.some((a) => a.id === res.auditRecord.id)).toBe(true);

      // 5. Participant cannot self-invoke cohort attachment
      await demoRepository.switchUser('user_aarav');
      await expect(
        demoRepository.attachCohortEvidence({
          mentorId: 'user_aarav',
          cohortId: 'cohort_navchetna_grade12',
          participantIds: ['user_aarav'],
          documentType: 'attendance_sheet',
          title: 'Illegal Participant Cohort Sheet',
          description: 'Self-attachment attempt',
          auditNotes: 'Invalid',
        })
      ).rejects.toThrow(/Unauthorized: Only teachers, mentors, or administrators may attach cohort attendance sheets/i);
    });

    it('allows reviewer to comment and verify cohort evidence; verified evidence awards credit and links to Passport', async () => {
      // 1. Teacher attaches cohort certificate
      await demoRepository.switchUser('user_kavita');
      const attachRes = await demoRepository.attachCohortEvidence({
        mentorId: 'user_kavita',
        cohortId: 'cohort_navchetna_grade12',
        participantIds: ['user_aarav'],
        documentType: 'completion_certificate',
        title: 'Civic Fieldwork Completion Certificate',
        description: 'Certificate for completing 15-hour street audit curriculum.',
        auditNotes: 'Issued following final presentation on 2026-10-14.',
      });

      const evId = attachRes.evidenceItems[0].id;

      // 2. Initial credits for Aarav
      const initialAarav = await demoRepository.getUser('user_aarav');
      const initialCredits = initialAarav?.totalCredits || 0;

      // 3. Facilitator Rohan (or admin/mentor) reviews and verifies with comment
      await demoRepository.switchUser('user_rohan');
      const verifiedEv = await demoRepository.reviewEvidence({
        evidenceId: evId,
        reviewerId: 'user_rohan',
        status: 'verified',
        comment: 'Certificate verified against institutional registry.',
      });

      expect(verifiedEv.verificationStatus).toBe('verified');
      expect(verifiedEv.metadata?.reviewedBy).toBe('Rohan Mehta');
      expect(verifiedEv.metadata?.reviewerComment).toBe('Certificate verified against institutional registry.');

      // 4. Aarav receives +1 Observation/attendance credit
      const updatedAarav = await demoRepository.getUser('user_aarav');
      expect(updatedAarav?.totalCredits).toBe(initialCredits + 1);

      // 5. Appears in Aarav's Civic Passport verified evidence pool
      await demoRepository.switchUser('user_aarav');
      const passport = await demoRepository.getPassport('user_aarav');
      const foundInPassport = passport.verifiedEvidence.find((e) => e.id === evId);
      expect(foundInPassport).toBeDefined();
      expect(foundInPassport?.title).toBe('Civic Fieldwork Completion Certificate');
    });

    it('blocks self-review: mentors cannot review their own attached evidence', async () => {
      await demoRepository.switchUser('user_kavita');
      const ev = await demoRepository.addEvidence({
        ownerId: 'user_kavita',
        ownerName: 'Kavita Rao',
        type: 'observation',
        title: 'Teacher Self Observation',
        description: 'Demonstration log.',
        source: 'Teacher Log',
        visibility: 'private',
        verificationStatus: 'under_review',
        tags: ['Teacher'],
      });

      await expect(
        demoRepository.reviewEvidence({
          evidenceId: ev.id,
          reviewerId: 'user_kavita',
          status: 'verified',
          comment: 'Self review attempt',
        })
      ).rejects.toThrow(/Mentors cannot review their own evidence records/i);
    });
  });

  describe('7. Offline Activity Example (Local Cleanup Photo)', () => {
    it('seeded evidence includes fictional local cleanup photo with IndexedDB storage metadata', async () => {
      await demoRepository.switchUser('user_aarav');
      const seeded = await demoRepository.getEvidence('ev_offline_cleanup_01');
      expect(seeded).not.toBeNull();
      expect(seeded?.title).toContain('Cleanup Photo');
      expect(seeded?.fileInfo?.name).toBe('fictional_local_cleanup_photo.png');
      expect(seeded?.fileInfo?.blobKey).toBe('blob_ev_offline_cleanup_01');
      expect(seeded?.fileInfo?.storageType).toBe('indexeddb');
      expect(seeded?.metadata?.isOfflineActivity).toBe(true);
      expect(seeded?.metadata?.wasteCollectedKg).toBe(42);
    });

    it('renders "Use Offline Cleanup Photo Example" in SubmitAssignmentPage modal and populates form', async () => {
      await useAuthStore.getState().switchPersona('user_aarav');

      render(
        <MemoryRouter initialEntries={['/assignments/asg_obs_03/submit']}>
          <Routes>
            <Route path="/assignments/:id/submit" element={<SubmitAssignmentPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Log New Mock Evidence/i })).toBeInTheDocument();
      });

      // Open Add Evidence modal
      fireEvent.click(screen.getByRole('button', { name: /Log New Mock Evidence/i }));

      await waitFor(() => {
        expect(screen.getByTestId('btn-use-offline-cleanup-example')).toBeInTheDocument();
      });

      // Click offline cleanup example button
      fireEvent.click(screen.getByTestId('btn-use-offline-cleanup-example'));

      // Check form fields populated
      expect(
        screen.getByDisplayValue(/Community Park & Storm Drain Local Cleanup Photo/i)
      ).toBeInTheDocument();
      expect(screen.getByText('fictional_local_cleanup_photo.png')).toBeInTheDocument();
    });
  });

  describe('8. Teacher Cohort UI in AssignmentsPage', () => {
    it('renders Attach Cohort Sheet/Certificate button and cohort evidence review queue for teachers', async () => {
      await useAuthStore.getState().switchPersona('user_kavita');

      render(
        <MemoryRouter initialEntries={['/assignments']}>
          <Routes>
            <Route path="/assignments" element={<AssignmentsPage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('btn-cohort-attach')).toBeInTheDocument();
      });

      // Open modal
      fireEvent.click(screen.getByTestId('btn-cohort-attach'));

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /Attach Cohort Attendance Sheet or Certificate/i })
        ).toBeInTheDocument();
      });

      expect(screen.getByText(/Mentor Review Invariant/i)).toBeInTheDocument();
      expect(screen.getByText(/never automatically verified/i)).toBeInTheDocument();
    });
  });
});
