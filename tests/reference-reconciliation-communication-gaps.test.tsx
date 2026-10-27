import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { useAuthStore } from '../src/stores/authStore';
import { PersistenceService } from '../src/services/persistence';
import { demoRepository } from '../src/services/demoRepository';
import { EvidenceAttachmentStore } from '../src/services/evidenceAttachmentStore';
import { DebateRoomPreviewPage } from '../src/components/layout/DebateRoomPreviewPage';
import { RoleAwareAssistantSurface } from '../src/components/ai/RoleAwareAssistantSurface';
import { CreditsPage } from '../src/features/passport/CreditsPage';
import { CreditAppealModal } from '../src/features/passport/CreditAppealModal';
import { PassportPage } from '../src/features/passport/PassportPage';
import { EvidencePage } from '../src/features/passport/EvidencePage';
import { WorkspacePage } from '../src/features/workspaces/WorkspacePage';
import { AdminModeratorGrantsPage } from '../src/features/administration/AdminModeratorGrantsPage';
import { SubmitAssignmentPage } from '../src/features/assignments/SubmitAssignmentPage';
import { AssignmentsPage } from '../src/features/assignments/AssignmentsPage';

describe('Reference Reconciliation: Repair Communication Gaps (2026-10-27)', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    PersistenceService.resetDatabase();
    await EvidenceAttachmentStore.clearAll();
    await demoRepository.switchUser('VSC-S-001');
    await useAuthStore.getState().initialize();
  });

  describe('Gap 1: Removal of Implementation-Source Jargon from User-Visible UI', () => {
    it('DebateRoomPreviewPage: removes Master PRD, Change Plan v2, and section citations from visible UI', async () => {
      // Rohan (Facilitator)
      await demoRepository.switchUser('VSC-S-009');
      await useAuthStore.getState().switchPersona('VSC-S-009');

      render(
        <MemoryRouter initialEntries={['/debate-room']}>
          <DebateRoomPreviewPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('push-popup-assignment-btn')).toBeInTheDocument();
      });

      // Check clean session stages label
      expect(screen.getByText('Debate Session Stages')).toBeInTheDocument();

      // Check clean text contribution path description
      expect(
        screen.getByText(/Accessible text-first intervention path for low-bandwidth connections\./i)
      ).toBeInTheDocument();

      // Open rulebook modal via header button
      const rulebookBtn = screen.getByRole('button', { name: /Rulebook \(v1\.0\)/i });
      fireEvent.click(rulebookBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Rules of procedure are visible at the point of use and explain participant rights/i)
        ).toBeInTheDocument();
      });
      expect(screen.queryByText(/In accordance with Master PRD §A8 and §A13/i)).not.toBeInTheDocument();

      // Close rulebook modal
      fireEvent.click(screen.getByRole('button', { name: /Acknowledge Ground Rules \(v1\.0\)/i }));

      // Facilitator push popup assignment button / title has no Change Plan v2 jargon
      const pushBtn = screen.getByTestId('push-popup-assignment-btn');
      fireEvent.click(pushBtn);

      await waitFor(() => {
        expect(screen.getByText('Push Short Popup Assignment')).toBeInTheDocument();
      });
      expect(screen.queryByText(/Change Plan v2 §13/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Master PRD/i)).not.toBeInTheDocument();
    });

    it('CreditsPage and PassportPage: replaces PRD dimension jargon with plain dimension explanations', async () => {
      const { unmount } = render(
        <MemoryRouter initialEntries={['/credits']}>
          <CreditsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Transparent Activity Award Rules & Explainable Formula \(7 Dimensions\)/i)
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          /Multiplicative weighting equations are exploratory research formulas, not automated production algorithms\./i
        )
      ).toBeInTheDocument();
      expect(screen.queryByText(/7 PRD Dimensions/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/PRD conceptual multiplication/i)).not.toBeInTheDocument();

      unmount();

      // PassportPage
      render(
        <MemoryRouter initialEntries={['/passport']}>
          <PassportPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /Civic Credit Point Dimensions \(7 Dimensions\)/i })
        ).toBeInTheDocument();
      });
      expect(screen.queryByText(/7 PRD Dimensions/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/from the conceptual PRD/i)).not.toBeInTheDocument();
    });

    it('CreditAppealModal: shows plain Human Adjudication Guarantee without PRD section numbers', () => {
      render(
        <CreditAppealModal
          userId="VSC-S-001"
          targetType="credit"
          targetId="item_01"
          targetTitle="Test Item"
          onClose={() => {}}
        />
      );

      expect(screen.getByText('Human Adjudication Guarantee')).toBeInTheDocument();
      expect(screen.queryByText(/PRD §14 \/ §27/i)).not.toBeInTheDocument();
    });

    it('RoleAwareAssistantSurface: displays plain human-governed AI boundaries and clean delegation notice', async () => {
      const { unmount } = render(
        <MemoryRouter>
          <RoleAwareAssistantSurface />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Role-aware suggestions adhering to human-governed AI boundaries\./i)
        ).toBeInTheDocument();
      });
      expect(screen.queryByText(/Change Plan v2/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Review Additions #5/i)).not.toBeInTheDocument();

      unmount();

      // Revoke all grants for Yashvi as Platform Owner so moderator has 0 active grants
      await demoRepository.switchUser('JS-F-001');
      await demoRepository.revokeScopedModeratorGrant('grant_mod_asg_01', 'Testing revocation', 'JS-F-001');
      await demoRepository.revokeScopedModeratorGrant('grant_mod_mem_01', 'Testing revocation', 'JS-F-001');
      await demoRepository.revokeScopedModeratorGrant('grant_mod_ses_01', 'Testing revocation', 'JS-F-001');

      await demoRepository.switchUser('JS-M-001');
      await useAuthStore.getState().switchPersona('JS-M-001');

      render(
        <MemoryRouter>
          <RoleAwareAssistantSurface />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Platform moderation authority requires an active, founder-delegated grant/i)
        ).toBeInTheDocument();
      });
      expect(screen.queryByText(/In accordance with Change Plan v2 §12/i)).not.toBeInTheDocument();
    });

    it('WorkspacePage: removes Master PRD section references from banners, tabs, and admission notices', async () => {
      render(
        <MemoryRouter initialEntries={['/workspace']}>
          <WorkspacePage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Fictional browser demo with local persistence only/i)
        ).toBeInTheDocument();
      });
      expect(screen.queryByText(/under Master PRD §A12 & §A20\.4/i)).not.toBeInTheDocument();

      // Switch to moderation tab using data-testid
      const moderationTab = screen.getByTestId('tab-moderation');
      fireEvent.click(moderationTab);

      await waitFor(() => {
        expect(
          screen.getByText(/Moderation authority is strictly scoped to this workspace\./i)
        ).toBeInTheDocument();
      });
      expect(screen.queryByText(/In accordance with Master PRD/i)).not.toBeInTheDocument();

      // Switch to rulebook tab using data-testid
      const rulebookTab = screen.getByTestId('tab-rulebook');
      fireEvent.click(rulebookTab);

      await waitFor(() => {
        expect(screen.getByText('Point of Use Rules of Procedure')).toBeInTheDocument();
      });
      expect(screen.queryByText(/Master PRD §A13 \/ §A20\.5/i)).not.toBeInTheDocument();
    });

    it('AdminModeratorGrantsPage: removes Change Plan and PRD citations while keeping 33% boundary clear', async () => {
      await demoRepository.switchUser('JS-F-001');
      await useAuthStore.getState().switchPersona('JS-F-001');

      render(
        <MemoryRouter initialEntries={['/admin/moderator-grants']}>
          <AdminModeratorGrantsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('One-Browser Simulation Disclosure')).toBeInTheDocument();
      });
      expect(screen.queryByText(/Change Plan v2 §12/i)).not.toBeInTheDocument();

      // Strong boundary remains plain and intact
      expect(
        screen.getByText(/Moderators can NEVER approve or bypass a 33% reservation exception\./i)
      ).toBeInTheDocument();
      expect(screen.queryByText(/Under Master PRD Supplementary §6/i)).not.toBeInTheDocument();
    });
  });

  describe('Gap 2: Evidence Attachment Limit Instructions & Dual-Path Verification', () => {
    it('SubmitAssignmentPage: modal explains 10 MB binary attachment path and 250 KB pasted/inline limit', async () => {
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

      fireEvent.click(screen.getByRole('button', { name: /Log New Mock Evidence/i }));

      await waitFor(() => {
        expect(screen.getByText(/Browser-Local IndexedDB Binary Attachment Store/i)).toBeInTheDocument();
      });

      // Explicit binary limits
      const binaryStoreCard = screen.getByText(/Browser-Local IndexedDB Binary Attachment Store/i).parentElement;
      expect(binaryStoreCard?.textContent).toContain('Accepts JPEG, PNG, MP4, MP3, PDF up to 10 MB');

      // Explicit separate limit for pasted / inline content
      const inlineNotice = screen.getByText(/Pasted content and inline documents \(WebP, CSV, TXT\)/i);
      expect(inlineNotice).toBeInTheDocument();
      expect(inlineNotice.textContent).toContain('250 KB');
      expect(inlineNotice.textContent).toContain('durable browser storage limit');

      // Does NOT claim the actual file limit is 250 KB for all formats
      expect(
        screen.queryByText(/Actual file limit: 250 KB \(durable browser storage limit\)\./i)
      ).not.toBeInTheDocument();
    });

    it('AssignmentsPage: student rules modal gives accurate dual-path limits for binary (10 MB) and pasted (250 KB)', async () => {
      render(
        <MemoryRouter initialEntries={['/assignments']}>
          <AssignmentsPage />
        </MemoryRouter>
      );

      const rulesBtn = await screen.findByTestId('assignments-rules-btn');
      fireEvent.click(rulesBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Mismatch caught: old text claimed "Supported files are PDF, PNG, and JPG up to 250 KB"
      expect(
        screen.queryByText(/Supported files are PDF, PNG, and JPG up to 250 KB/i)
      ).not.toBeInTheDocument();

      // New accurate dual-path text
      expect(
        screen.getByText(
          /Binary media attachments support JPEG, PNG, MP4, MP3, PDF up to 10 MB stored in browser-local IndexedDB\. Pasted text or inline documents are limited to 250 KB to ensure durable storage\./i
        )
      ).toBeInTheDocument();
    });

    it('AssignmentsPage: teacher review modal and cohort sheet upload give consistent 10 MB binary guidance', async () => {
      await demoRepository.switchUser('VSC-T-001');
      await useAuthStore.getState().switchPersona('VSC-T-001');

      render(
        <MemoryRouter initialEntries={['/assignments']}>
          <AssignmentsPage />
        </MemoryRouter>
      );

      // Teacher review rules modal
      const teacherRulesBtn = await screen.findByTestId('teacher-assignments-rules-btn');
      fireEvent.click(teacherRulesBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(
        screen.queryByText(/Supported files are PDF, PNG, and JPG up to 250 KB/i)
      ).not.toBeInTheDocument();
      expect(
        screen.getByText(
          /Binary media attachments support JPEG, PNG, MP4, MP3, PDF up to 10 MB stored in browser-local IndexedDB\. Pasted text or inline documents are limited to 250 KB to ensure durable storage\./i
        )
      ).toBeInTheDocument();

      // Close rules modal
      fireEvent.click(screen.getByTestId('close-rules-modal-btn'));
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Teacher cohort upload modal
      const cohortBtn = await screen.findByTestId('btn-cohort-attach');
      fireEvent.click(cohortBtn);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: /Attach Cohort Attendance Sheet or Certificate/i })
        ).toBeInTheDocument();
      });

      // Verification of file limits on cohort upload
      expect(
        screen.getByText(/Limit: 10 MB \(JPEG, PNG, MP4, MP3, PDF\)\. Files are stored in browser-local IndexedDB\./i)
      ).toBeInTheDocument();
    });

    it('EvidencePage: durable storage constraints explain 10 MB binary IndexedDB and 250 KB inline limits', async () => {
      render(
        <MemoryRouter initialEntries={['/passport/evidence']}>
          <EvidencePage />
        </MemoryRouter>
      );

      const rulesBtn = await screen.findByTestId('evidence-rules-btn');
      fireEvent.click(rulesBtn);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          /Binary media attachments support JPEG, PNG, MP4, MP3, and PDF up to 10 MB in browser-local IndexedDB\. Pasted text or inline documents are limited to 250 KB for durable browser storage\./i
        )
      ).toBeInTheDocument();
    });
  });
});
