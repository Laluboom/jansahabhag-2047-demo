import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { demoRepository } from '../src/services/demoRepository';
import { PersistenceService } from '../src/services/persistence';
import { useAuthStore } from '../src/stores/authStore';
import { HelpRulebooksPage } from '../src/components/layout/HelpRulebooksPage';
import { SubmitAssignmentPage } from '../src/features/assignments/SubmitAssignmentPage';
import { AdminModerationPage } from '../src/features/moderation/AdminModerationPage';
import {
  NO_RECORDING_RULE_TITLE,
  FACE_CONSENT_WARNING_TEXT,
  MAX_EVIDENCE_FILE_BYTES,
  ALLOWED_EVIDENCE_FORMAT_LABELS,
  canActorAccessPrivateEvidence,
} from '../src/domain/evidenceRules';

describe('Review Additions 3 and V2 Evidence Rules', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await demoRepository.switchUser('user_aarav');
    await useAuthStore.getState().initialize();
  });

  describe('1. Rules Page (HelpRulebooksPage)', () => {
    it('displays clear no-recording-without-facilitator-permission rule and face consent notice', () => {
      render(
        <MemoryRouter>
          <HelpRulebooksPage />
        </MemoryRouter>
      );

      // Dedicated Media & Recording Rule card
      expect(
        screen.getByRole('heading', {
          name: new RegExp(`Session Recording & Media Rules: ${NO_RECORDING_RULE_TITLE}`, 'i'),
        })
      ).toBeInTheDocument();

      // No recording without facilitator permission text
      expect(
        screen.getAllByText(new RegExp(NO_RECORDING_RULE_TITLE, 'i')).length
      ).toBeGreaterThanOrEqual(1);

      // Face consent warning
      expect(
        screen.getByText(new RegExp(FACE_CONSENT_WARNING_TEXT, 'i'))
      ).toBeInTheDocument();

      // 250 KB limit and allowed format labels
      expect(
        screen.getByText(new RegExp(ALLOWED_EVIDENCE_FORMAT_LABELS, 'i'))
      ).toBeInTheDocument();
      expect(screen.getByText(/250 KB/i)).toBeInTheDocument();
    });
  });

  describe('2. Evidence Privacy by Default & Visibility Boundaries', () => {
    it('defaults new evidence visibility to private in repository when not explicitly set', async () => {
      const ev = await demoRepository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'observation',
        title: 'Unspecified Visibility Observation',
        description: 'Testing default privacy behavior.',
        source: 'Field Log',
        verificationStatus: 'under_review',
        tags: ['PrivacyTest'],
      } as any);

      expect(ev.visibility).toBe('private');

      // Stored in db as private
      const retrieved = await demoRepository.getEvidence(ev.id);
      expect(retrieved?.visibility).toBe('private');
    });

    it('enforces visibility boundaries: owner, teacher, facilitator, admin can view private evidence, peer cannot', async () => {
      // Create private evidence owned by Aarav
      const ev = await demoRepository.addEvidence({
        ownerId: 'user_aarav',
        ownerName: 'Aarav Sharma',
        type: 'observation',
        title: 'Aarav Confidential Field Log',
        description: 'Pedestrian blindspot observations.',
        source: 'Field Observation',
        visibility: 'private',
        verificationStatus: 'under_review',
        tags: ['Private'],
        fileInfo: {
          name: 'field_notes.txt',
          size: 1024,
          type: 'text/plain',
          dataUrl: 'data:text/plain;base64,U2VjcmV0IE5vdGVz',
        },
      });

      // 1. Owner (Aarav) can access it and see dataUrl
      await demoRepository.switchUser('user_aarav');
      const aaravEv = await demoRepository.getEvidence(ev.id);
      expect(aaravEv).not.toBeNull();
      expect(aaravEv?.title).toBe('Aarav Confidential Field Log');
      expect(aaravEv?.fileInfo?.dataUrl).toBe('data:text/plain;base64,U2VjcmV0IE5vdGVz');

      // 2. Peer participant (Priya) CANNOT access private evidence
      await demoRepository.switchUser('user_priya');
      const priyaEv = await demoRepository.getEvidence(ev.id);
      expect(priyaEv).toBeNull();

      const priyaList = await demoRepository.getEvidenceList();
      expect(priyaList.some((e) => e.id === ev.id)).toBe(false);

      // 3. Teacher (Kavita) CAN access private evidence (reviewer boundary)
      await demoRepository.switchUser('user_kavita');
      const teacherEv = await demoRepository.getEvidence(ev.id);
      expect(teacherEv).not.toBeNull();
      expect(teacherEv?.id).toBe(ev.id);

      // 4. Facilitator (Rohan) CAN access private evidence (reviewer boundary)
      await demoRepository.switchUser('user_rohan');
      const facilitatorEv = await demoRepository.getEvidence(ev.id);
      expect(facilitatorEv).not.toBeNull();
      expect(facilitatorEv?.id).toBe(ev.id);

      // 5. Admin (user_admin) CAN access private evidence
      await demoRepository.switchUser('user_admin');
      const adminEv = await demoRepository.getEvidence(ev.id);
      expect(adminEv).not.toBeNull();
      expect(adminEv?.id).toBe(ev.id);
    });

    it('canActorAccessPrivateEvidence helper matches domain boundary specifications', () => {
      expect(canActorAccessPrivateEvidence({ id: 'u1', role: 'participant' }, 'u1')).toBe(true);
      expect(canActorAccessPrivateEvidence({ id: 'u2', role: 'participant' }, 'u1')).toBe(false);
      expect(canActorAccessPrivateEvidence({ id: 'u2', role: 'teacher' }, 'u1')).toBe(true);
      expect(canActorAccessPrivateEvidence({ id: 'u2', role: 'facilitator' }, 'u1')).toBe(true);
      expect(canActorAccessPrivateEvidence({ id: 'u2', role: 'platform_admin' }, 'u1')).toBe(true);
      expect(canActorAccessPrivateEvidence({ id: 'u2', role: 'institution_admin' }, 'u1')).toBe(true);
      expect(canActorAccessPrivateEvidence(null, 'u1')).toBe(false);
    });
  });

  describe('3. UHV Reflection Boundary Invariants', () => {
    it('disallows attaching private UHV reflections to evidence or shared records', async () => {
      await expect(
        demoRepository.addEvidence({
          ownerId: 'user_aarav',
          ownerName: 'Aarav Sharma',
          type: 'observation',
          title: 'Illegally Attached UHV Reflection',
          description: 'Attempting to link private reflection as civic evidence.',
          source: 'Personal Log',
          assignmentId: 'asg_uhv_08',
          visibility: 'private',
          verificationStatus: 'under_review',
          tags: ['Invalid'],
        })
      ).rejects.toThrow(/Private UHV reflections cannot be attached/i);
    });

    it('rejects reporting private UHV reflections into civic moderation queue', async () => {
      // Create UHV submission
      await demoRepository.switchUser('user_meera');
      const uhvSub = await demoRepository.submitAssignment({
        assignmentId: 'asg_uhv_08',
        userId: 'user_meera',
        content: 'Personal notes exploring family harmony.',
        evidenceIds: [],
      });

      await expect(
        demoRepository.reportEvidenceOrSubmission({
          reporterId: 'user_aarav',
          targetType: 'submission',
          targetId: uhvSub.id,
          reason: 'Trying to flag personal inquiry',
        })
      ).rejects.toThrow(/Private UHV reflections are protected/i);
    });
  });

  describe('4. File Limits & Size Enforcement', () => {
    it('enforces 250 KB file limit in repository', async () => {
      const overLimitBytes = MAX_EVIDENCE_FILE_BYTES + 1024;
      await expect(
        demoRepository.addEvidence({
          ownerId: 'user_aarav',
          ownerName: 'Aarav Sharma',
          type: 'observation',
          title: 'Over 250KB Evidence',
          description: 'Large file rejection test.',
          source: 'Camera',
          visibility: 'private',
          verificationStatus: 'under_review',
          tags: ['LimitTest'],
          fileInfo: {
            name: 'heavy_photo.png',
            size: overLimitBytes,
            type: 'image/png',
          },
        })
      ).rejects.toThrow(/exceeds durable browser storage limit of 250 KB/i);
    });
  });

  describe('5. Civic Reporting Path & Moderation Queue', () => {
    it('creates a moderation case when reporting a civic evidence item', async () => {
      const modCase = await demoRepository.reportEvidenceOrSubmission({
        reporterId: 'user_priya',
        targetType: 'evidence',
        targetId: 'ev_aarav_traffic_count_01',
        reason: 'Vehicle speed count lacks timestamped crossroad radar log.',
        severity: 'medium',
      });

      expect(modCase).toBeDefined();
      expect(modCase.id).toMatch(/^mod_civic/);
      expect(modCase.reporterId).toBe('user_priya');
      expect(modCase.targetType).toBe('evidence');
      expect(modCase.targetId).toBe('ev_aarav_traffic_count_01');
      expect(modCase.reason).toBe('Vehicle speed count lacks timestamped crossroad radar log.');
      expect(modCase.status).toBe('open');
      expect(modCase.severity).toBe('medium');

      // Appears in moderation queue
      const cases = await demoRepository.getModerationCases();
      const found = cases.find((c) => c.id === modCase.id);
      expect(found).toBeDefined();
      expect(found?.status).toBe('open');
    });

    it('creates a moderation case when reporting a civic submission', async () => {
      // Aarav submits civic assignment
      const sub = await demoRepository.submitAssignment({
        assignmentId: 'asg_obs_03',
        userId: 'user_aarav',
        content: 'Detailed 30-minute tally of crossroad delays at Madhyam Marg.',
        evidenceIds: ['ev_aarav_traffic_count_01'],
      });

      const modCase = await demoRepository.reportEvidenceOrSubmission({
        reporterId: 'user_priya',
        targetType: 'submission',
        targetId: sub.id,
        reason: 'Reported observation contains unsubstantiated claims about signal malfunction.',
        severity: 'high',
      });

      expect(modCase.status).toBe('open');
      expect(modCase.targetId).toBe(sub.id);
      expect(modCase.severity).toBe('high');
      expect(modCase.reporterId).toBe('user_priya');
      expect(modCase.notes).toContain('priya.s');
    });

    it('requires at least 3 characters for reporting reason', async () => {
      await expect(
        demoRepository.reportEvidenceOrSubmission({
          reporterId: 'user_priya',
          targetType: 'evidence',
          targetId: 'ev_aarav_traffic_count_01',
          reason: 'ab',
        })
      ).rejects.toThrow(/at least 3 characters/i);
    });

    it('renders reported case in AdminModerationPage and allows review & resolution', async () => {
      await demoRepository.switchUser('user_admin');
      await useAuthStore.getState().initialize();

      // Report an evidence item
      const modCase = await demoRepository.reportEvidenceOrSubmission({
        reporterId: 'user_priya',
        targetType: 'evidence',
        targetId: 'ev_aarav_traffic_count_01',
        reason: 'Potential privacy violation: pedestrian faces unblurred in background photo.',
        severity: 'high',
      });

      render(
        <MemoryRouter>
          <AdminModerationPage />
        </MemoryRouter>
      );

      // Verify the case renders in the queue with reporter, target, reason, status
      await waitFor(() => {
        expect(screen.getByText(modCase.id)).toBeInTheDocument();
      });
      expect(screen.getByText(/Potential privacy violation: pedestrian faces unblurred in background photo\./i)).toBeInTheDocument();
      expect(screen.getAllByText(/user_priya/i).length).toBeGreaterThanOrEqual(1);

      // Begin Review action for the open case
      const beginReviewBtns = screen.getAllByRole('button', { name: /Begin Review/i });
      fireEvent.click(beginReviewBtns[beginReviewBtns.length - 1]);

      await waitFor(async () => {
        const updated = (await demoRepository.getModerationCases()).find((c) => c.id === modCase.id);
        expect(updated?.status).toBe('under_review');
      });
    });
  });

  describe('6. Point of Use UI (SubmitAssignmentPage)', () => {
    it('renders point-of-use media consent warning and Report button for available evidence', async () => {
      await useAuthStore.getState().switchPersona('user_aarav');

      render(
        <MemoryRouter initialEntries={['/assignments/asg_obs_03/submit']}>
          <Routes>
            <Route path="/assignments/:id/submit" element={<SubmitAssignmentPage />} />
          </Routes>
        </MemoryRouter>
      );

      // Wait for assignment to load
      await waitFor(() => {
        expect(screen.getByText(/Attach Field Evidence Records/i)).toBeInTheDocument();
      });

      // Point-of-use rule notice
      expect(
        screen.getByText(new RegExp(`Field Evidence Rules: ${NO_RECORDING_RULE_TITLE}`, 'i'))
      ).toBeInTheDocument();
      expect(
        screen.getByText(new RegExp(FACE_CONSENT_WARNING_TEXT, 'i'))
      ).toBeInTheDocument();

      // Report button on available evidence
      const reportBtn = screen.getByTestId('btn-report-evidence-ev_aarav_traffic_count_01');
      expect(reportBtn).toBeInTheDocument();

      // Click report button opens report modal
      fireEvent.click(reportBtn);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Report Civic Evidence Item/i })).toBeInTheDocument();
      });
      expect(screen.getByText(/Reporter:/i)).toBeInTheDocument();
      expect(screen.getByTestId('input-report-reason')).toBeInTheDocument();

      // Type reason and submit
      fireEvent.change(screen.getByTestId('input-report-reason'), {
        target: { value: 'Observer did not obtain written consent for field recording.' },
      });
      fireEvent.click(screen.getByTestId('btn-submit-report'));

      await waitFor(() => {
        expect(screen.getByText(/Report submitted to moderation queue for evidence/i)).toBeInTheDocument();
      });

      // Verify case was stored in database
      const cases = await demoRepository.getModerationCases();
      const reported = cases.find(
        (c) => c.targetId === 'ev_aarav_traffic_count_01' && c.reason.includes('written consent')
      );
      expect(reported).toBeDefined();
      expect(reported?.status).toBe('open');
    });

    it('modal displays concise consent warning next to file picker with allowed types and 250KB limit', async () => {
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
        expect(screen.getByRole('heading', { name: /Log Field Evidence & Observation Record/i })).toBeInTheDocument();
      });

      // Consent warning next to file picker
      expect(
        screen.getAllByText(new RegExp(FACE_CONSENT_WARNING_TEXT, 'i')).length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getAllByText(new RegExp(NO_RECORDING_RULE_TITLE, 'i')).length
      ).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText(new RegExp(ALLOWED_EVIDENCE_FORMAT_LABELS, 'i'))
      ).toBeInTheDocument();
      expect(screen.getByText(/250 KB/i)).toBeInTheDocument();

      // Verify default sharing scope is Private Student Vault
      const scopeSelect = screen.getByRole('combobox', { name: /Sharing Scope & Privacy/i }) as HTMLSelectElement;
      expect(scopeSelect.value).toBe('private');
    });
  });
});
